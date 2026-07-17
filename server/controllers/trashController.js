import mongoose from "mongoose";
import ContentItem from "../models/ContentItem.js";
import CompetitorPost from "../models/CompetitorPost.js";
import Source from "../models/Source.js";
import Competitor from "../models/Competitor.js";

class TrashController {
  /**
   * Move items to trash (soft delete).
   */
  async move(req, res, next) {
    try {
      const userId = req.user.userId;
      const { ids, type } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: "Invalid or empty IDs list" });
      }

      const objectIds = ids.map(id => new mongoose.Types.ObjectId(id));

      if (type === "competitor") {
        await CompetitorPost.updateMany(
          { _id: { $in: objectIds }, userId },
          { $set: { isDeleted: true, deletedAt: new Date(), deletedBy: userId } }
        );
      } else {
        await ContentItem.updateMany(
          { _id: { $in: objectIds }, userId },
          { $set: { isDeleted: true, deletedAt: new Date(), deletedBy: userId } }
        );
      }

      return res.status(200).json({
        success: true,
        message: `${ids.length} items moved to trash successfully.`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Restore items from trash.
   */
  async restore(req, res, next) {
    try {
      const userId = req.user.userId;
      const { ids, type } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: "Invalid or empty IDs list" });
      }

      const objectIds = ids.map(id => new mongoose.Types.ObjectId(id));

      if (type === "competitor") {
        await CompetitorPost.updateMany(
          { _id: { $in: objectIds }, userId },
          { $set: { isDeleted: false, deletedAt: null, deletedBy: null } }
        );
      } else {
        await ContentItem.updateMany(
          { _id: { $in: objectIds }, userId },
          { $set: { isDeleted: false, deletedAt: null, deletedBy: null } }
        );
      }

      return res.status(200).json({
        success: true,
        message: `${ids.length} items restored from trash successfully.`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete items permanently from database.
   */
  async deletePermanently(req, res, next) {
    try {
      const userId = req.user.userId;
      const { ids, type } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: "Invalid or empty IDs list" });
      }

      const objectIds = ids.map(id => new mongoose.Types.ObjectId(id));

      if (type === "competitor") {
        await CompetitorPost.deleteMany({ _id: { $in: objectIds }, userId });
      } else {
        await ContentItem.deleteMany({ _id: { $in: objectIds }, userId });
      }

      return res.status(200).json({
        success: true,
        message: `${ids.length} items deleted permanently.`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Empty entire trash for the authenticated user.
   */
  async empty(req, res, next) {
    try {
      const userId = req.user.userId;

      const deletedItems = await ContentItem.deleteMany({ userId, isDeleted: true });
      const deletedCompetitor = await CompetitorPost.deleteMany({ userId, isDeleted: true });

      return res.status(200).json({
        success: true,
        message: `Trash emptied. Permanently deleted ${deletedItems.deletedCount} items and ${deletedCompetitor.deletedCount} competitor posts.`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List all soft-deleted items (ContentItems and CompetitorPosts combined).
   */
  async list(req, res, next) {
    try {
      const userId = req.user.userId;
      const { platform, source, competitor, search } = req.query;

      // Build content items query
      const contentQuery = { userId, isDeleted: true };
      if (platform) {
        const matchingSources = await Source.find({ userId, type: platform }).distinct("_id");
        contentQuery.sourceId = { $in: matchingSources };
      }
      if (source) {
        contentQuery.sourceId = new mongoose.Types.ObjectId(source);
      }
      if (search) {
        contentQuery.$or = [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } }
        ];
      }

      // Build competitor query
      const competitorQuery = { userId, isDeleted: true };
      if (platform && platform !== "facebook") {
        competitorQuery._id = null; // force empty
      }
      if (competitor) {
        competitorQuery.competitorId = new mongoose.Types.ObjectId(competitor);
      }
      if (search) {
        competitorQuery.$or = [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } }
        ];
      }

      // Query database
      const contentItems = await ContentItem.find(contentQuery).populate("sourceId", "name type");
      const competitorPosts = await CompetitorPost.find(competitorQuery).populate("competitorId", "brandName platform");

      // Format ContentItems
      const formattedContent = contentItems.map(item => ({
        id: item._id,
        title: item.title,
        source: item.sourceId?.name || "Deleted Source",
        platform: item.sourceId?.type || "website",
        deletedAt: item.deletedAt || item.updatedAt,
        type: "content"
      }));

      // Format CompetitorPosts
      const formattedCompetitors = competitorPosts.map(post => ({
        id: post._id,
        title: post.title,
        source: post.competitorId?.brandName || "Deleted Competitor",
        platform: "facebook",
        deletedAt: post.deletedAt || post.updatedAt,
        type: "competitor"
      }));

      // Combine and sort by deletedAt descending
      const combined = [...formattedContent, ...formattedCompetitors].sort(
        (a, b) => new Date(b.deletedAt) - new Date(a.deletedAt)
      );

      return res.status(200).json({
        success: true,
        data: combined
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * AI-assisted suggestion finder for low-value content.
   */
  async getCleanupSuggestions(req, res, next) {
    try {
      const userId = req.user.userId;

      // Query active items (not deleted)
      const contentItems = await ContentItem.find({ userId, isDeleted: { $ne: true } }).populate("sourceId");
      const competitorPosts = await CompetitorPost.find({ userId, isDeleted: { $ne: true } }).populate("competitorId");

      const suggestions = [];

      // 1. Failed crawls
      contentItems.forEach(item => {
        if (item.processedStatus === "failed") {
          suggestions.push({
            id: item._id,
            title: item.title,
            source: item.sourceId?.name || "Unknown",
            platform: item.sourceId?.type || "website",
            reason: "Failed crawled content item.",
            type: "content"
          });
        }
      });

      // 2. Short posts (< 10 words)
      const isShort = (text) => {
        if (!text) return true;
        return text.trim().split(/\s+/).length < 10;
      };

      contentItems.forEach(item => {
        if (isShort(item.rawText) && isShort(item.description)) {
          suggestions.push({
            id: item._id,
            title: item.title,
            source: item.sourceId?.name || "Unknown",
            platform: item.sourceId?.type || "website",
            reason: "Very short post with little informational value.",
            type: "content"
          });
        }
      });

      competitorPosts.forEach(post => {
        if (isShort(post.description)) {
          suggestions.push({
            id: post._id,
            title: post.title,
            source: post.competitorId?.brandName || "Competitor",
            platform: "facebook",
            reason: "Short social copy post with low engagement value.",
            type: "competitor"
          });
        }
      });

      // 3. Duplicate titles
      const seenTitles = new Map();
      const checkDuplicate = (item, type, sourceName, platformName) => {
        const key = item.title.toLowerCase().trim();
        if (seenTitles.has(key)) {
          suggestions.push({
            id: item._id,
            title: item.title,
            source: sourceName,
            platform: platformName,
            reason: `Duplicate title of another crawled item: "${seenTitles.get(key)}"`,
            type
          });
        } else {
          seenTitles.set(key, item.title);
        }
      };

      contentItems.forEach(item => checkDuplicate(item, "content", item.sourceId?.name || "Unknown", item.sourceId?.type || "website"));
      competitorPosts.forEach(post => checkDuplicate(post, "competitor", post.competitorId?.brandName || "Competitor", "facebook"));

      // Filter out duplicate suggestions for the same id
      const uniqueSuggestions = [];
      const seenIds = new Set();
      suggestions.forEach(s => {
        if (!seenIds.has(s.id.toString())) {
          seenIds.add(s.id.toString());
          uniqueSuggestions.push(s);
        }
      });

      return res.status(200).json({
        success: true,
        data: uniqueSuggestions.slice(0, 15) // limit to top 15 suggestions
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new TrashController();
