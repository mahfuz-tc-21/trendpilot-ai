import Competitor from "../models/Competitor.js";
import CompetitorPost from "../models/CompetitorPost.js";
import BrandProfile from "../models/BrandProfile.js";
import CompetitorReport from "../models/CompetitorReport.js";
import User from "../models/User.js";
import { getAIClient, getLanguageInstruction } from "./aiService.js";
import facebookCrawler from "./facebookCrawler.js";

class CompetitorService {
  /**
   * Parse competitor Facebook Page URL to retrieve page name/handle
   */
  parsePageUrl(url) {
    try {
      const parsed = new URL(url.trim());
      const pathParts = parsed.pathname.split("/").filter(Boolean);
      if (pathParts.length > 0) {
        const first = pathParts[0];
        if (first === "pages" && pathParts.length >= 2) {
          return pathParts[1];
        }
        return first;
      }
    } catch {
      // Fallback
    }
    const match = url.trim().match(/facebook\.com\/([a-zA-Z0-9._-]+)/);
    if (match) return match[1];
    return url.trim();
  }

  /**
   * Add a new competitor profile
   */
  async addCompetitor(userId, brandName, pageUrl, category) {
    const existing = await Competitor.findOne({ userId, pageUrl: pageUrl.trim() });
    if (existing) {
      const error = new Error("Competitor URL already exists in your analysis list");
      error.status = 409;
      throw error;
    }

    const competitor = new Competitor({
      userId,
      brandName,
      pageUrl: pageUrl.trim(),
      category,
      logo: `https://logo.clearbit.com/${this.parsePageUrl(pageUrl)}.com`,
      description: `${brandName} competitor profile tracking ${category} content trends.`
    });

    await competitor.save();

    // Trigger initial mock post crawl asynchronously
    this.crawlCompetitorPosts(competitor._id).catch((err) =>
      console.error(`Failed initial crawl for ${brandName}:`, err.message)
    );

    return competitor;
  }

  /**
   * Crawl competitor page feed using Playwright crawler and save posts
   */
  async crawlCompetitorPosts(competitorId) {
    const competitor = await Competitor.findById(competitorId);
    if (!competitor) return [];

    console.log(`📡 Ingesting posts for competitor brand: ${competitor.brandName}`);
    const pageUrl = competitor.pageUrl;

    const realPosts = await facebookCrawler.scrapeFacebookPageWithRetry(pageUrl);
    const savedPosts = [];

    for (const postData of realPosts) {
      const externalId = `fb_comp_${competitor.brandName}_${postData.postId}`;
      const existing = await CompetitorPost.findOne({ externalId });

      if (!existing) {
        const post = new CompetitorPost({
          competitorId: competitor._id,
          userId: competitor.userId,
          externalId,
          title: postData.caption.substring(0, 60) + (postData.caption.length > 60 ? "..." : ""),
          description: postData.caption,
          url: postData.postUrl,
          publishedAt: postData.postedDate,
          format: postData.videoUrls.length > 0 ? "Video" : (postData.caption.length > 300 ? "Long Post" : "Short Post"),
          engagement: {
            likes: postData.reactionCount || 0,
            shares: postData.shareCount || 0,
            comments: postData.commentCount || 0
          },
          processedStatus: "completed"
        });
        await post.save();
        savedPosts.push(post);
      }
    }

    competitor.lastCheckedAt = new Date();
    await competitor.save();

    return savedPosts;
  }

  /**
    ];

    return datasets[pageName] || fallback;
  }

  /**
   * Get Brand Profile details
   */
  async getBrandProfile(userId) {
    let profile = await BrandProfile.findOne({ userId });
    if (!profile) {
      // Return a temporary default profile skeleton
      profile = new BrandProfile({
        userId,
        brandName: "My Brand",
        industry: "Technology",
        targetAudience: "General Tech Audience",
        tone: "Professional & Informational",
        primaryPlatforms: ["Facebook", "LinkedIn"]
      });
    }
    return profile;
  }

  /**
   * Create or update Brand Profile details
   */
  async updateBrandProfile(userId, profileData) {
    let profile = await BrandProfile.findOne({ userId });
    if (!profile) {
      profile = new BrandProfile({ userId, ...profileData });
    } else {
      Object.assign(profile, profileData);
    }
    await profile.save();
    return profile;
  }

  /**
   * Compile and generate comparative reports on multiple competitors
   */
  async generateComparisonReport(userId, competitorIds) {
    const competitors = await Competitor.find({ _id: { $in: competitorIds } });
    const hasInvalid = competitors.some((c) => c.userId.toString() !== userId.toString());
    if (hasInvalid || competitors.length !== competitorIds.length) {
      const error = new Error("Forbidden: Access denied");
      error.status = 403;
      throw error;
    }

    const posts = await CompetitorPost.find({ competitorId: { $in: competitorIds }, isDeleted: { $ne: true } })
      .populate("competitorId", "brandName pageUrl");

    // Retrieve Brand Profile to context comparative suggestions
    const brandProfile = await this.getBrandProfile(userId);

    const postsSummary = posts.map((p) => ({
      brand: p.competitorId?.brandName,
      title: p.title,
      format: p.format,
      engagement: p.engagement,
      publishedAt: p.publishedAt
    }));

    const user = await User.findById(userId);
    const language = user?.language || "bn";

    const prompt = `You are an elite competitive intelligence strategist and growth marketer.
Analyze the following competitor data and compile a highly strategic Competitor Comparison Report.

OUR BRAND PROFILE context (for reference):
- Brand Name: ${brandProfile.brandName}
- Industry: ${brandProfile.industry}
- Target Audience: ${brandProfile.targetAudience}
- Tone: ${brandProfile.tone}
- Primary Platforms: ${brandProfile.primaryPlatforms.join(", ")}

COMPETITORS TO ANALYZE:
${competitors.map((c) => `- ${c.brandName} (Page: ${c.pageUrl}, Category: ${c.category})`).join("\n")}

COMPETITOR POSTS INGESTED:
${JSON.stringify(postsSummary.slice(0, 15), null, 2)}

Please return a strict JSON response containing EXACTLY the following structure (do not include markdown ticks \`\`\`json or preambles, return only the raw stringified JSON):
{
  "topicsCovered": [
    { "topic": "Name", "programmingHero": "Coverage assessment", "fcc": "Coverage assessment" }
  ],
  "postingFrequency": {
    "summary": "Comparison paragraph detailing who posts most often...",
    "data": [
      { "brand": "BrandName", "postsPerWeek": 5, "bestPostingTime": "9:00 AM" }
    ]
  },
  "contentFormats": {
    "summary": "Analysis of format choices (Video vs Carousel etc)...",
    "chartData": [
      { "format": "Video", "BrandName1": 4, "BrandName2": 2 }
    ]
  },
  "writingStyle": [
    { "brand": "BrandName", "tone": "Friendly", "hookStyle": "Curiosity hook", "ctaStyle": "Direct Link" }
  ],
  "estimatedEngagement": [
    { "brand": "BrandName", "avgLikes": 1500, "avgShares": 200, "topFormat": "Video" }
  ],
  "strategicMatrix": {
    "strengths": [
      { "brand": "BrandName", "points": ["Point 1", "Point 2"] }
    ],
    "weaknesses": [
      { "brand": "BrandName", "points": ["Point 1", "Point 2"] }
    ]
  },
  "contentGaps": [
    { "topic": "Missed niche topic", "opportunityScore": "High", "relevance": "How it matches our target profile" }
  ]
}

${getLanguageInstruction(language)}`;

    const ai = await getAIClient(userId);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2
      }
    });

    let text = response.text;
    if (!text) {
      throw new Error("Gemini returned an empty text report");
    }

    text = text.replace(/^```json/, "").replace(/```$/, "").trim();
    const parsedData = JSON.parse(text);

    // Save report to database
    const report = new CompetitorReport({
      userId,
      competitorIds,
      type: "comparison",
      reportData: parsedData
    });
    await report.save();

    return report;
  }

  /**
   * Generate weekly strategy suggestions tailored to our Brand Profile
   */
  async generateWeeklyStrategy(userId) {
    const brandProfile = await BrandProfile.findOne({ userId });
    if (!brandProfile || !brandProfile.brandName || brandProfile.brandName === "My Brand") {
      throw new Error("Please configure your Brand Profile under the Brand Profile tab first to get personalized strategy recommendations.");
    }

    const competitors = await Competitor.find({ userId });
    const posts = await CompetitorPost.find({ competitorId: { $in: competitors.map((c) => c._id) }, isDeleted: { $ne: true } })
      .populate("competitorId", "brandName");

    const postsSummary = posts.map((p) => ({
      competitor: p.competitorId?.brandName,
      title: p.title,
      format: p.format,
      likes: p.engagement?.likes
    }));

    const user = await User.findById(userId);
    const language = user?.language || "bn";

    const prompt = `You are a world-class growth strategist. Compile a highly personalized AI Weekly Content Strategy specifically for our brand:
Brand: ${brandProfile.brandName}
Industry: ${brandProfile.industry}
Target Audience: ${brandProfile.targetAudience}
Writing Voice/Tone: ${brandProfile.tone}
Platforms: ${brandProfile.primaryPlatforms.join(", ")}

Analyze this competitor posts data:
${JSON.stringify(postsSummary.slice(0, 15), null, 2)}

Provide a weekly calendar schedule and strategic content ideas that beat our competitors.
Return a strict JSON response containing EXACTLY the following structure (do not include markdown ticks \`\`\`json, return only the raw JSON):
{
  "recommendedFormats": [
    { "format": "Carousel", "reason": "Why it works for our audience" }
  ],
  "trendingTopics": ["Topic A", "Topic B"],
  "contentIdeas": [
    {
      "id": 1,
      "title": "Actionable post title idea",
      "concept": "Core concept of this content...",
      "recommendedFormat": "Carousel",
      "targetPlatform": "Facebook",
      "hookIdea": "Suggested hook sentence",
      "ctaIdea": "Suggested CTA sentence",
      "hashtags": ["saas", "tech"]
    }
  ],
  "postingCalendar": [
    { "day": "Monday", "topic": "Topic Name", "format": "Carousel", "platform": "Facebook", "time": "10:00 AM" },
    { "day": "Wednesday", "topic": "Topic Name", "format": "Video", "platform": "YouTube", "time": "3:00 PM" }
  ],
  "tacticalGuidelines": {
    "hooksToUse": ["Hook structure 1", "Hook structure 2"],
    "ctasToUse": ["CTA structure 1", "CTA structure 2"],
    "formatsToAvoid": ["Video memes", "Plain text updates"]
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
      throw new Error("Gemini returned empty weekly strategy text");
    }

    text = text.replace(/^```json/, "").replace(/```$/, "").trim();
    const parsedData = JSON.parse(text);

    const report = new CompetitorReport({
      userId,
      competitorIds: competitors.map((c) => c._id),
      type: "weekly_strategy",
      reportData: parsedData
    });
    await report.save();

    return report;
  }

  /**
   * In-depth comparison comparing a single competitor post against our Brand Profile,
   * generating a stronger creative version and explaining why it beats them.
   */
  async generateBeatCompetitorPost(userId, postId) {
    const post = await CompetitorPost.findById(postId).populate("competitorId");
    if (!post) {
      const error = new Error("Competitor post not found");
      error.status = 404;
      throw error;
    }

    if (!post.competitorId || post.competitorId.userId.toString() !== userId.toString()) {
      const error = new Error("Forbidden: Access denied");
      error.status = 403;
      throw error;
    }

    const brandProfile = await this.getBrandProfile(userId);
    if (!brandProfile || !brandProfile.brandName || brandProfile.brandName === "My Brand") {
      throw new Error("Please configure your Brand Profile under the Brand Profile tab first to get personalized strategy recommendations.");
    }

    const user = await User.findById(userId);
    const language = user?.language || "bn";

    const prompt = `You are a world-class growth copywriter and marketing strategist.
We want to outperform our competitor: ${post.competitorId?.brandName}.

Here is the competitor's post:
- Title: ${post.title}
- Description: ${post.description}
- Original Format: ${post.format}
- Ingested Engagement: Likes: ${post.engagement?.likes}, Comments: ${post.engagement?.comments}

Our Brand Profile to write for:
- Brand Name: ${brandProfile.brandName}
- Industry: ${brandProfile.industry}
- Target Audience: ${brandProfile.targetAudience}
- Tone: ${brandProfile.tone}
- Primary Platforms: ${brandProfile.primaryPlatforms.join(", ")}

Generate a significantly BETTER, highly viral version of this content.
Return a strict JSON response containing EXACTLY the following structure (do not include markdown ticks \`\`\`json, return only the raw JSON):
{
  "analysis": {
    "competitorWeakness": "Why the competitor post has room for improvement...",
    "ourAdvantage": "How our brand details can make this post stand out more..."
  },
  "contentAssets": {
    "betterHook": "A highly engaging viral hook...",
    "betterHeadline": "A curiosity-inducing headline...",
    "betterCaption": "The full, rich, spaced, emoji-friendly Facebook caption...",
    "betterCta": "High conversion call to action...",
    "betterHashtags": ["tag1", "tag2"],
    "visualIdea": "Detailed mockup description for designer...",
    "carouselStructure": [
      { "slide": 1, "title": "Slide Title", "body": "Slide content text", "graphic": "Image prompt" }
    ],
    "facebookPost": "Complete formatted Facebook post...",
    "linkedinPost": "Professional formatted LinkedIn version...",
    "twitterThread": [
      "Tweet 1 with hook...",
      "Tweet 2 with details...",
      "Tweet 3 with CTA..."
    ],
    "blogVersion": "SEO optimized blog introduction and key sections..."
  },
  "whyItBeatsThem": "Explain details of why this version will get higher CTR and shares..."
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
      throw new Error("Gemini returned empty beat competitor response");
    }

    text = text.replace(/^```json/, "").replace(/```$/, "").trim();
    return JSON.parse(text);
  }
}

export default new CompetitorService();
