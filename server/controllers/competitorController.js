import competitorService from "../services/competitorService.js";
import Competitor from "../models/Competitor.js";
import CompetitorPost from "../models/CompetitorPost.js";
import CompetitorReport from "../models/CompetitorReport.js";

class CompetitorController {
  /**
   * List all tracked competitors for user
   */
  async getCompetitors(req, res, next) {
    try {
      const userId = req.user.userId;
      const competitors = await Competitor.find({ userId }).sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        data: competitors
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add a new competitor
   */
  async addCompetitor(req, res, next) {
    try {
      const userId = req.user.userId;
      const { brandName, pageUrl, category } = req.body;

      if (!brandName || !pageUrl || !category) {
        const error = new Error("Brand Name, Facebook Page URL, and Category are required");
        error.status = 400;
        throw error;
      }

      const competitor = await competitorService.addCompetitor(userId, brandName, pageUrl, category);

      return res.status(201).json({
        success: true,
        message: "Competitor added and scan initiated successfully",
        data: competitor
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete competitor and associated posts
   */
  async deleteCompetitor(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const competitor = await Competitor.findById(id);
      if (!competitor) {
        const error = new Error("Competitor profile not found");
        error.status = 404;
        throw error;
      }

      if (competitor.userId.toString() !== userId.toString()) {
        const error = new Error("Forbidden: Access denied");
        error.status = 403;
        throw error;
      }

      await CompetitorPost.deleteMany({ competitorId: id });
      await Competitor.deleteOne({ _id: id });

      return res.status(200).json({
        success: true,
        message: "Competitor profile deleted successfully"
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Manual feed ingestion trigger for a single competitor page
   */
  async scanCompetitor(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const competitor = await Competitor.findById(id);
      if (!competitor) {
        const error = new Error("Competitor profile not found");
        error.status = 404;
        throw error;
      }

      if (competitor.userId.toString() !== userId.toString()) {
        const error = new Error("Forbidden: Access denied");
        error.status = 403;
        throw error;
      }

      const newPosts = await competitorService.crawlCompetitorPosts(id);

      return res.status(200).json({
        success: true,
        message: `Scan complete. Ingested ${newPosts.length} new competitor posts.`,
        data: newPosts
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get competitor post listings
   */
  async getCompetitorPosts(req, res, next) {
    try {
      const userId = req.user.userId;

      const posts = await CompetitorPost.find({ userId, isDeleted: { $ne: true } })
        .populate("competitorId", "brandName logo pageUrl")
        .sort({ publishedAt: -1 });

      return res.status(200).json({
        success: true,
        data: posts
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch Brand Profile
   */
  async getBrandProfile(req, res, next) {
    try {
      const userId = req.user.userId;
      const profile = await competitorService.getBrandProfile(userId);

      return res.status(200).json({
        success: true,
        data: profile
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update Brand Profile
   */
  async updateBrandProfile(req, res, next) {
    try {
      const userId = req.user.userId;
      const profile = await competitorService.updateBrandProfile(userId, req.body);

      return res.status(200).json({
        success: true,
        message: "Brand Profile saved successfully",
        data: profile
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate comparator report
   */
  async compareCompetitors(req, res, next) {
    try {
      const userId = req.user.userId;
      const { competitorIds } = req.body;

      if (!competitorIds || !Array.isArray(competitorIds) || competitorIds.length === 0) {
        const error = new Error("Please select at least one competitor to run comparisons");
        error.status = 400;
        throw error;
      }

      const report = await competitorService.generateComparisonReport(userId, competitorIds);

      return res.status(200).json({
        success: true,
        message: "Comparison report generated successfully",
        data: report
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate weekly strategy suggestions tailored to profile
   */
  async weeklyStrategy(req, res, next) {
    try {
      const userId = req.user.userId;
      const report = await competitorService.generateWeeklyStrategy(userId);

      return res.status(200).json({
        success: true,
        message: "Weekly strategy generated successfully",
        data: report
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Beat competitor post action
   */
  async beatPost(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      const upgradedContent = await competitorService.generateBeatCompetitorPost(userId, id);

      return res.status(200).json({
        success: true,
        message: "Upgraded content generated successfully",
        data: upgradedContent
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieve compiled reports history
   */
  async getReports(req, res, next) {
    try {
      const userId = req.user.userId;
      const reports = await CompetitorReport.find({ userId }).sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        data: reports
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CompetitorController();
