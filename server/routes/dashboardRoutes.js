import express from "express";
import dashboardController from "../controllers/dashboardController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get dashboard counts & statistics
router.get("/stats", protect, dashboardController.getStats);

// Get trend analytics (top topics, keywords, categories)
router.get("/trends", protect, dashboardController.getTrends);

// Get historical SaaS intelligence analytics
router.get("/analytics", protect, dashboardController.getAnalytics);

// Get calculated trending topics from MongoDB
router.get("/trends/topics", protect, dashboardController.getTrendingTopics);

// Get detailed trend analysis parameters
router.get("/trends/detail", protect, dashboardController.getTrendDetail);

// Generate creator master package for a topic
router.post("/trends/generate-all", protect, dashboardController.generateEverything);

// Beat competitor strategy
router.post("/trends/beat-competitor", protect, dashboardController.beatCompetitor);

// Get latest ingested content items
router.get("/recent-content", protect, dashboardController.getRecentContent);

// Get latest created recommendations
router.get("/recommendations", protect, dashboardController.getRecentRecommendations);

// Get consolidated crawl & AI logs activity feed
router.get("/activity", protect, dashboardController.getActivityLogs);

export default router;
