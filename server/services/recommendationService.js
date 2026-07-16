import fs from "fs/promises";
import path from "path";
import ContentItem from "../models/ContentItem.js";
import Summary from "../models/Summary.js";
import Recommendation from "../models/Recommendation.js";
import User from "../models/User.js";
import aiService, { getLanguageInstruction } from "./aiService.js";

/**
 * Service to generate content recommendations based on AI summaries and metadata.
 */
class RecommendationService {
  /**
   * Generates a recommendation for a specific ContentItem.
   * @param {string} contentItemId - ContentItem MongoDB ID
   * @returns {Promise<object>} Saved Recommendation document
   */
  async generateRecommendation(contentItemId) {
    console.log(`💡 Generating recommendation for content item: ${contentItemId}`);

    const contentItem = await ContentItem.findById(contentItemId).populate("sourceId");
    if (!contentItem) {
      throw new Error(`ContentItem not found: ${contentItemId}`);
    }
    const userId = contentItem.userId || contentItem.sourceId?.userId;

    const user = await User.findById(userId);
    const language = user?.language || "bn";

    // Check if recommendation already exists to prevent duplicate Gemini calls
    const existingRec = await Recommendation.findOne({ contentId: contentItemId, userId });
    if (existingRec) {
      console.log(`💡 Recommendation already exists for: ${contentItemId}. Skipping Gemini API call.`);
      return existingRec;
    }

    const summary = await Summary.findOne({ contentId: contentItemId, userId });
    if (!summary) {
      throw new Error(
        `AI Summary context not found for content: ${contentItemId}. Summarize first.`
      );
    }

    try {
      // 1. Read the recommendation prompt template
      const promptPath = path.join(process.cwd(), "prompts", "recommendation.txt");
      const promptTpl = await fs.readFile(promptPath, "utf8");

      // 2. Bind variables
      const prompt = promptTpl
        .replace("{{TITLE}}", contentItem.title)
        .replace("{{AUTHOR}}", contentItem.author || "Unknown")
        .replace("{{TYPE}}", contentItem.sourceId?.type || "website")
        .replace("{{CATEGORY}}", contentItem.sourceId?.category || "general")
        .replace("{{SUMMARY}}", summary.summary)
        .replace("{{TOPICS}}", summary.topics.join(", "))
        .replace("{{KEYWORDS}}", summary.keywords.join(", "))
        .replace("{{AUDIENCE}}", summary.audience || "general") + getLanguageInstruction(language);

      // 3. Request Gemini API (reusing the callGemini wrapper with retries and exponential backoff)
      const rawJson = await aiService.callGemini(prompt);

      // 4. Validate and parse output values
      const validated = this.validateRecommendationJson(rawJson);

      // 5. Save/Update in MongoDB
      let recDoc = await Recommendation.findOne({ contentId: contentItemId, userId });
      if (recDoc) {
        recDoc.suggestedTitle = validated.suggestedTitle;
        recDoc.platform = validated.platform;
        recDoc.contentFormat = validated.contentFormat;
        recDoc.hook = validated.hook;
        recDoc.outline = validated.outline;
        recDoc.caption = validated.caption;
        recDoc.cta = validated.cta;
        recDoc.hashtags = validated.hashtags;
        recDoc.opportunityScore = validated.opportunityScore;
        recDoc.trendScore = validated.trendScore;
        recDoc.confidenceScore = validated.confidenceScore;
        recDoc.userId = userId;
      } else {
        recDoc = new Recommendation({
          contentId: contentItemId,
          userId,
          suggestedTitle: validated.suggestedTitle,
          platform: validated.platform,
          contentFormat: validated.contentFormat,
          hook: validated.hook,
          outline: validated.outline,
          caption: validated.caption,
          cta: validated.cta,
          hashtags: validated.hashtags,
          opportunityScore: validated.opportunityScore,
          trendScore: validated.trendScore,
          confidenceScore: validated.confidenceScore
        });
      }

      await recDoc.save();
      console.log(`✅ Recommendation created successfully for: ${contentItem.title}`);
      return recDoc;
    } catch (error) {
      console.error(
        `❌ Recommendation generation failed for item ${contentItemId}: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Helper to validate and clean up raw recommendation JSON.
   */
  validateRecommendationJson(rawJson) {
    const normalized = {};

    normalized.suggestedTitle =
      typeof rawJson?.suggestedTitle === "string"
        ? rawJson.suggestedTitle.trim()
        : "TrendPilot Content Suggestion";

    normalized.platform = Array.isArray(rawJson?.platform)
      ? rawJson.platform.filter((p) => typeof p === "string")
      : ["LinkedIn"];

    const format = typeof rawJson?.contentFormat === "string" ? rawJson.contentFormat : "Post";
    normalized.contentFormat = [
      "Post",
      "Carousel",
      "Reel",
      "Short",
      "Article",
      "Thread",
      "Newsletter"
    ].includes(format)
      ? format
      : "Post";

    normalized.hook = typeof rawJson?.hook === "string" ? rawJson.hook.trim() : "Check this out!";

    normalized.outline = Array.isArray(rawJson?.outline)
      ? rawJson.outline.filter((o) => typeof o === "string")
      : [];

    normalized.caption = typeof rawJson?.caption === "string" ? rawJson.caption.trim() : "";
    normalized.cta = typeof rawJson?.cta === "string" ? rawJson.cta.trim() : "";

    normalized.hashtags = Array.isArray(rawJson?.hashtags)
      ? rawJson.hashtags.filter((h) => typeof h === "string")
      : [];

    const oppScore = parseInt(rawJson?.opportunityScore);
    normalized.opportunityScore =
      !isNaN(oppScore) && oppScore >= 0 && oppScore <= 100 ? oppScore : 70;

    const trScore = parseInt(rawJson?.trendScore);
    normalized.trendScore = !isNaN(trScore) && trScore >= 0 && trScore <= 100 ? trScore : 70;

    const confScore = Number(rawJson?.confidenceScore);
    normalized.confidenceScore =
      !isNaN(confScore) && confScore >= 0 && confScore <= 1 ? confScore : 0.8;

    return normalized;
  }
}

export default new RecommendationService();
