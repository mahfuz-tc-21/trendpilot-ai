import api from "./api.js";

const dashboardService = {
  /**
   * Fetch core statistical dashboard metrics.
   */
  getStats: async () => {
    const response = await api.get("/api/dashboard/stats");
    return response.data.data;
  },

  /**
   * Fetch comprehensive historical SaaS intelligence analytics metrics.
   */
  getAnalytics: async () => {
    const response = await api.get("/api/dashboard/analytics");
    return response.data.data;
  },

  /**
   * Fetch aggregate trend analytics (topics, keywords, categories).
   */
  getTrends: async () => {
    const response = await api.get("/api/dashboard/trends");
    return response.data.data;
  },

  /**
   * Fetch recently scraped content items.
   */
  getRecentContent: async () => {
    const response = await api.get("/api/dashboard/recent-content");
    return response.data.data;
  },

  /**
   * Fetch recently generated social growth recommendations.
   */
  getRecentRecommendations: async () => {
    const response = await api.get("/api/dashboard/recommendations");
    return response.data.data;
  },

  /**
   * Fetch consolidated audit trails and crawl, AI, and recommendation audit logs.
   */
  getActivityLogs: async () => {
    const response = await api.get("/api/dashboard/activity");
    return response.data.data;
  },

  /**
   * Fetch calculated trending topics list.
   */
  getTrendingTopics: async () => {
    const response = await api.get("/api/dashboard/trends/topics");
    return response.data.data;
  },

  /**
   * Fetch detailed trend analytics and competitor insights.
   */
  getTrendDetail: async (topic) => {
    const response = await api.get("/api/dashboard/trends/detail", { params: { topic } });
    return response.data;
  },

  /**
   * Generate content package from a trend.
   */
  generateTrendPackage: async (topic) => {
    const response = await api.post("/api/dashboard/trends/generate-all", { topic });
    return response.data.data;
  },

  /**
   * Build winning competitive strategy.
   */
  beatCompetitorStrategy: async (competitorName, topic) => {
    const response = await api.post("/api/dashboard/trends/beat-competitor", { competitorName, topic });
    return response.data.data;
  }
};

export default dashboardService;
