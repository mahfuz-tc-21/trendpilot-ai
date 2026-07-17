import ContentItem from "../models/ContentItem.js";
import Source from "../models/Source.js";
import Summary from "../models/Summary.js";
import Recommendation from "../models/Recommendation.js";

/**
 * Controller to handle content lists and detailed summaries retrieval.
 */
class ContentController {
  /**
   * Get all scraped content items with filters and pagination.
   */
  async getAll(req, res, next) {
    try {
      const userId = req.user.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const search = req.query.search || "";
      const type = req.query.type || "";
      const status = req.query.status || "";

      // Build search query filters
      const query = { userId, isDeleted: { $ne: true } };
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } }
        ];
      }
      if (type) {
        const sourceIds = await Source.find({ type, userId }).distinct("_id");
        query.sourceId = { $in: sourceIds };
      }
      if (status) {
        query.processedStatus = status;
      }

      const totalItems = await ContentItem.countDocuments(query);
      const items = await ContentItem.find(query)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("sourceId", "name type");

      return res.status(200).json({
        success: true,
        message: "Content items retrieved successfully",
        pagination: {
          totalItems,
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit),
          limit
        },
        data: items
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get content details, including original text and the generated summary.
   */
  async getDetails(req, res, next) {
    try {
      const userId = req.user.userId;
      const contentId = req.params.id;

      const contentItem = await ContentItem.findById(contentId).populate(
        "sourceId",
        "name type url"
      );
      if (!contentItem) {
        const error = new Error("Content item not found");
        error.status = 404;
        throw error;
      }

      if (contentItem.userId && contentItem.userId.toString() !== userId.toString()) {
        const error = new Error("Forbidden: Access denied");
        error.status = 403;
        throw error;
      }

      // Fetch summary & recommendation
      const summary = await Summary.findOne({ contentId, userId });
      const recommendation = await Recommendation.findOne({ contentId, userId });

      return res.status(200).json({
        success: true,
        message: "Content details retrieved successfully",
        data: {
          content: contentItem,
          analysis: summary || null,
          recommendation: recommendation || null
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a content item and its associated analysis (Summary and Recommendation).
   */
  async deleteItem(req, res, next) {
    try {
      const userId = req.user.userId;
      const contentId = req.params.id;

      const contentItem = await ContentItem.findById(contentId);
      if (!contentItem) {
        const error = new Error("Content item not found");
        error.status = 404;
        throw error;
      }

      if (contentItem.userId && contentItem.userId.toString() !== userId.toString()) {
        const error = new Error("Forbidden: Access denied");
        error.status = 403;
        throw error;
      }

      // Delete associated summary and recommendation
      await Summary.deleteMany({ contentId, userId });
      await Recommendation.deleteMany({ contentId, userId });

      // Delete the content item itself
      await ContentItem.findByIdAndDelete(contentId);

      return res.status(200).json({
        success: true,
        message: "Content item and associated analysis deleted successfully"
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ContentController();
