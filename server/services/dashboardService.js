import mongoose from "mongoose";
import Source from "../models/Source.js";
import ContentItem from "../models/ContentItem.js";
import Summary from "../models/Summary.js";
import Recommendation from "../models/Recommendation.js";
import Job from "../models/Job.js";
import User from "../models/User.js";
import StudioOutput from "../models/StudioOutput.js";
import CompetitorPost from "../models/CompetitorPost.js";
import { getAIClient, getLanguageInstruction } from "./aiService.js";

/**
 * Service to aggregate dashboard metrics and analytics reports.
 */
class DashboardService {
  /**
   * Helper to retrieve all source IDs belonging to a user.
   */
  async getUserSourceIds(userId) {
    const sources = await Source.find({ userId }).distinct("_id");
    return sources;
  }

  /**
   * Helper to retrieve all content item IDs belonging to a user's sources.
   */
  async getUserContentIds(sourceIds) {
    return await ContentItem.find({ sourceId: { $in: sourceIds } }).distinct("_id");
  }

  /**
   * Get total counts, queues, and job metrics.
   * @param {string} userId - Authenticated user ID
   */
  async getStats(userId) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalSources,
      activeSources,
      pausedSources,
      totalContent,
      processedToday,
      totalRecommendations,
      failedJobs,
      aiQueue
    ] = await Promise.all([
      Source.countDocuments({ userId }),
      Source.countDocuments({ userId, status: "active" }),
      Source.countDocuments({ userId, status: "paused" }),
      ContentItem.countDocuments({ userId }),
      ContentItem.countDocuments({
        userId,
        processedStatus: { $in: ["completed", "failed"] },
        updatedAt: { $gte: startOfToday }
      }),
      Recommendation.countDocuments({ userId }),
      Job.countDocuments({ userId, status: "failed" }),
      ContentItem.countDocuments({
        userId,
        processedStatus: { $in: ["pending", "processing"] }
      })
    ]);

    return {
      totalSources,
      activeSources,
      pausedSources,
      totalContent,
      processedToday,
      totalRecommendations,
      failedJobs,
      aiQueue
    };
  }

  /**
   * Get top topics, keywords, categories, and score distributions via aggregation.
   * @param {string} userId - Authenticated user ID
   */
  async getTrends(userId) {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // 1. Top Topics
    const topTopics = await Summary.aggregate([
      { $match: { userId: userObjectId } },
      { $unwind: "$topics" },
      { $group: { _id: "$topics", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { topic: "$_id", count: 1, _id: 0 } }
    ]);

    // 2. Top Keywords
    const topKeywords = await Summary.aggregate([
      { $match: { userId: userObjectId } },
      { $unwind: "$keywords" },
      { $group: { _id: "$keywords", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { keyword: "$_id", count: 1, _id: 0 } }
    ]);

    // 3. Top Categories (from Source metadata mapping)
    const topCategories = await ContentItem.aggregate([
      { $match: { userId: userObjectId } },
      {
        $lookup: {
          from: "sources",
          localField: "sourceId",
          foreignField: "_id",
          as: "source"
        }
      },
      { $unwind: "$source" },
      { $group: { _id: "$source.category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { category: "$_id", count: 1, _id: 0 } }
    ]);

    // 4. Opportunity Score Distribution (groups recommendations by range brackets)
    const scoreBuckets = await Recommendation.aggregate([
      { $match: { userId: userObjectId } },
      {
        $bucket: {
          groupBy: "$opportunityScore",
          boundaries: [0, 20, 40, 60, 80, 101],
          default: "unknown",
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    const formattedDistribution = scoreBuckets.map((bucket) => {
      let range = "";
      if (bucket._id === 0) range = "0-20";
      else if (bucket._id === 20) range = "21-40";
      else if (bucket._id === 40) range = "41-60";
      else if (bucket._id === 60) range = "61-80";
      else if (bucket._id === 80) range = "81-100";
      else range = "Unknown";

      return {
        range,
        count: bucket.count
      };
    });

    return {
      topTopics,
      topKeywords,
      topCategories,
      opportunityScoreDistribution: formattedDistribution
    };
  }

  /**
   * Get latest ingested content items.
   * @param {string} userId - Authenticated user ID
   */
  async getRecentContent(userId) {
    return await ContentItem.find({ userId })
      .sort({ publishedAt: -1 })
      .limit(10)
      .populate("sourceId", "name type category");
  }

  /**
   * Get latest social recommendations.
   * @param {string} userId - Authenticated user ID
   */
  async getRecentRecommendations(userId) {
    return await Recommendation.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("contentId", "title url");
  }

  /**
   * Get activities (crawls, summaries, recommendation triggers).
   * @param {string} userId - Authenticated user ID
   */
  async getActivityLogs(userId) {
    const [recentCrawls, aiEvents, recEvents] = await Promise.all([
      // Jobs (crawls)
      Job.find({ userId })
        .sort({ startedAt: -1 })
        .limit(10)
        .populate("sourceId", "name type"),

      // AI summary creation/updates
      Summary.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("contentId", "title"),

      // Recommendation creations
      Recommendation.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("contentId", "title")
    ]);

    return {
      recentCrawls: recentCrawls.map((c) => ({
        id: c._id,
        sourceName: c.sourceId?.name || "Deleted Source",
        sourceType: c.sourceId?.type || "website",
        timestamp: c.startedAt,
        status: c.status,
        error: c.error
      })),
      aiProcessingEvents: aiEvents.map((a) => ({
        id: a._id,
        title: a.contentId?.title || "Deleted Article",
        timestamp: a.createdAt,
        status: "completed"
      })),
      recommendationEvents: recEvents.map((r) => ({
        id: r._id,
        title: r.contentId?.title || "Deleted Article",
        platforms: r.platform,
        format: r.contentFormat,
        timestamp: r.createdAt,
        status: "generated"
      }))
    };
  }

  /**
   * Get dynamic list of computed trending topics from MongoDB.
   * @param {string} userId - Authenticated user ID
   */
  async getTrendingTopicsList(userId) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const topTopics = await Summary.aggregate([
      { $match: { userId: userObjectId } },
      { $unwind: "$topics" },
      { $group: { _id: "$topics", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { topic: "$_id", count: 1, _id: 0 } }
    ]);

    let topics = topTopics.map((t) => t.topic);
    if (topics.length === 0) {
      const topKeywords = await Summary.aggregate([
        { $match: { userId: userObjectId } },
        { $unwind: "$keywords" },
        { $group: { _id: "$keywords", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { keyword: "$_id", count: 1, _id: 0 } }
      ]);
      topics = topKeywords.map((k) => k.keyword);
    }

    if (topics.length === 0) return [];

    const trendingList = [];
    for (const topic of topics) {
      const articles = await ContentItem.find({
        userId,
        $or: [
          { title: { $regex: topic, $options: "i" } },
          { description: { $regex: topic, $options: "i" } }
        ]
      }).populate("sourceId");

      const compPosts = await CompetitorPost.find({
        userId,
        $or: [
          { title: { $regex: topic, $options: "i" } },
          { description: { $regex: topic, $options: "i" } }
        ]
      }).populate("competitorId");

      const articlesCount = articles.filter((a) => a.sourceId?.type !== "youtube").length;
      const videosCount = articles.filter((a) => a.sourceId?.type === "youtube").length;
      const fbCount = compPosts.length;

      const competitorIds = new Set(compPosts.map((p) => p.competitorId?._id?.toString()).filter(Boolean));
      const competitorsCount = competitorIds.size;

      const dates = [
        ...articles.map((a) => a.updatedAt),
        ...compPosts.map((c) => c.updatedAt)
      ].filter(Boolean);
      const lastUpdated = dates.length > 0 ? new Date(Math.max(...dates)) : new Date();

      const trendScore = Math.min(65 + articlesCount * 2 + fbCount * 4 + videosCount * 3, 99);
      const growthPercent = Math.min(12 + articlesCount * 5 + fbCount * 8, 85);

      trendingList.push({
        topic,
        trendScore,
        weeklyGrowth: `+${growthPercent}%`,
        articlesCount,
        videosCount,
        fbCount,
        competitorsCount,
        lastUpdated
      });
    }

    return trendingList.sort((a, b) => b.trendScore - a.trendScore);
  }

  /**
   * Get dynamic trend intelligence for a selected topic based on database entries.
   */
  async getTrendDetail(userId, topic) {
    const articles = await ContentItem.find({
      userId,
      $or: [
        { title: { $regex: topic, $options: "i" } },
        { description: { $regex: topic, $options: "i" } }
      ]
    }).populate("sourceId").limit(5);

    const compPosts = await CompetitorPost.find({
      userId,
      $or: [
        { title: { $regex: topic, $options: "i" } },
        { description: { $regex: topic, $options: "i" } }
      ]
    }).populate("competitorId").limit(5);

    if (articles.length === 0 && compPosts.length === 0) {
      return null;
    }

    const user = await User.findById(userId);
    const language = user?.language || "bn";

    const contextArticles = articles.map((a) => ({
      title: a.title,
      description: a.description,
      source: a.sourceId?.name || a.author,
      type: a.sourceId?.type,
      publishedAt: a.publishedAt
    }));

    const contextCompPosts = compPosts.map((p) => ({
      title: p.title,
      description: p.description,
      competitor: p.competitorId?.brandName,
      engagement: p.engagement,
      publishedAt: p.publishedAt
    }));

    const prompt = `You are a world-class Trend Intelligence AI and Creator Growth strategist.
We are analyzing the trending topic: "${topic}".
Here is the real matching crawled source data from our database:
- Matching Articles/Videos: ${JSON.stringify(contextArticles)}
- Competitor Social Posts: ${JSON.stringify(contextCompPosts)}

Task: Analyze this real data and return a strict JSON response containing detailed trend insights.
Return ONLY a valid JSON object matching the following structure (do not include markdown block ticks \`\`\`json, return only raw stringified JSON):
{
  "description": "Topic summary/definition",
  "whyGrowing": "Why this topic is growing (industry context, major developments)",
  "growthReason": "Growth trigger reasons based on data",
  "keywords": ["keyword1", "keyword2"],
  "hashtags": ["hashtag1", "hashtag2"],
  "competitionLevel": "Low / Medium / High",
  "opportunityScore": 85,
  "recommendedAudience": "Target audience details",
  "bestFormats": ["Facebook Post", "Carousel", "YouTube Video", "Blog", "LinkedIn"],
  "opportunityAnalysis": {
    "score": 85,
    "competition": "Low / Medium / High",
    "interest": "Low / Medium / High",
    "recommendation": "Strategic recommendation text"
  },
  "contentGap": {
    "covered": "What competitors covered",
    "missed": "What competitors missed",
    "userQuestions": "What users are asking / wanting to know",
    "unexplained": "Topics nobody has explained yet",
    "suggestedAngles": "Suggested creative angles for our brand"
  },
  "competitorIntelligence": [
    {
      "brandName": "Competitor Brand Name",
      "platform": "Facebook",
      "postCount": 3,
      "avgLikes": 120,
      "bestPost": "Title/description of best performing post",
      "latestDate": "2026-07-15"
    }
  ],
  "timeline": [
    { "day": "Mon", "posts": 2 },
    { "day": "Tue", "posts": 4 },
    { "day": "Wed", "posts": 3 },
    { "day": "Thu", "posts": 6 },
    { "day": "Fri", "posts": 5 },
    { "day": "Sat", "posts": 8 },
    { "day": "Sun", "posts": 7 }
  ],
  "aiRecommendations": {
    "facebook": ["Idea 1", "Idea 2", "Idea 3"],
    "reels": ["Idea 1", "Idea 2", "Idea 3"],
    "carousel": ["Idea 1", "Idea 2", "Idea 3"],
    "blog": ["Idea 1", "Idea 2", "Idea 3"],
    "youtube": ["Idea 1", "Idea 2", "Idea 3"],
    "linkedin": ["Idea 1", "Idea 2", "Idea 3"]
  }
}

${getLanguageInstruction(language)}`;

    const ai = await getAIClient(userId);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3
      }
    });

    let text = response.text;
    if (!text) {
      throw new Error("Gemini returned empty trend detail response");
    }

    text = text.replace(/^```json/, "").replace(/```$/, "").trim();
    const parsed = JSON.parse(text);

    // Map contentLibrary to database ContentItems for proper client detail link navigation
    parsed.contentLibrary = articles.map((art) => ({
      id: art._id,
      source: art.sourceId?.name || art.author,
      platform: art.sourceId?.type || "website",
      title: art.title,
      summary: art.description ? art.description.substring(0, 150) + "..." : "No summary available.",
      publishedDate: art.publishedAt,
      engagement: art.rawText?.match(/\[Engagement Metrics: [^\]]+\]/)?.[0] || "N/A"
    }));

    return parsed;
  }

  /**
   * Generates a complete package of all assets for a trend.
   */
  async generateEverything(userId, topic) {
    const user = await User.findById(userId);
    const language = user?.language || "bn";

    const prompt = `You are a world-class content generation AI. Generate a complete creator package of all visual and copy assets for the trend: "${topic}".
Please compile all of the following assets into a single comprehensive master document separated by clear, beautiful markdown headers:
- Facebook Post
- LinkedIn Post
- Twitter/X Thread (tweets separated by '---')
- Instagram Caption
- Hashtags
- Viral YouTube Titles (5 options)
- Thumbnail Text (5 options)
- Video Description & Tags
- YouTube Chapters/Timestamps
- YouTube Community Post
- YouTube Script (high retention)
- Full SEO Article
- Meta Title & Description
- FAQ Section
- Email Newsletter & Campaign sequence
- Call to Actions (CTAs)
- Carousel Slide Copy (10 slides)
- AI Image Prompt (Midjourney / DALL-E)
- Rewrite and Translate versions

Respond with ONLY the generated markdown content. Do not include markdown code block ticks (\`\`\`markdown) or any other conversational preambles/introductory comments. Return only the raw formatted text.

${getLanguageInstruction(language)}`;

    const ai = await getAIClient(userId);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7
      }
    });

    const generatedText = response.text;
    if (!generatedText) {
      throw new Error("Gemini returned empty package generation text");
    }

    const cleanedText = generatedText
      .replace(/^```markdown/, "")
      .replace(/^```/, "")
      .replace(/```$/, "")
      .trim();

    const output = new StudioOutput({
      userId,
      format: "Generate_Everything",
      instructions: `Trend Package: ${topic}`,
      content: cleanedText
    });
    await output.save();

    return output;
  }

  /**
   * Compares brand details against a competitor for a trend and generates a beat guide strategy.
   */
  async beatCompetitor(userId, competitorName, topic) {
    const user = await User.findById(userId);
    const language = user?.language || "bn";

    const prompt = `You are an elite competitive intelligence strategist and growth copywriter.
Our brand is competing on the trend: "${topic}" against the competitor brand: "${competitorName}".

Develop a winning content strategy that beats them.
Please structure your strategy with these clear sections (return ONLY the markdown content, no ticks \`\`\`markdown):
# Competitive Analysis: ${competitorName} vs Us (${topic})

## Competitor Strengths
- Detail their key advantages...

## Competitor Weaknesses & Content Gaps
- Detail their gaps, missed topics, and explanation holes...

## Our Creative Edge (How to Beat Them)
- Better Viral Hooks: (3 options)
- Better Call-To-Action (CTA): (3 options)
- Better Thumbnail Ideas: (3 options)
- Better Posting & Platform Strategy:

## Stronger Content Blueprint
- Full copy/script recommendations...

${getLanguageInstruction(language)}`;

    const ai = await getAIClient(userId);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7
      }
    });

    const generatedText = response.text;
    if (!generatedText) {
      throw new Error("Gemini returned empty beat competitor response");
    }

    const cleanedText = generatedText
      .replace(/^```markdown/, "")
      .replace(/^```/, "")
      .replace(/```$/, "")
      .trim();

    return cleanedText;
  }
}

export default new DashboardService();
