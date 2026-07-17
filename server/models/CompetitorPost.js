import mongoose from "mongoose";

const competitorPostSchema = new mongoose.Schema(
  {
    competitorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Competitor",
      required: [true, "Competitor association is required"]
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User association is required"]
    },
    externalId: {
      type: String,
      required: [true, "External unique identifier is required"],
      unique: true
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true
    },
    description: {
      type: String,
      default: ""
    },
    url: {
      type: String,
      required: [true, "URL is required"],
      trim: true
    },
    publishedAt: {
      type: Date,
      default: Date.now
    },
    format: {
      type: String,
      enum: ["Carousel", "Image", "Infographic", "Long Post", "Short Post", "Reels", "Video", "Tutorial", "Announcement", "Meme", "Poll"],
      default: "Short Post"
    },
    engagement: {
      likes: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      comments: { type: Number, default: 0 }
    },
    processedStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending"
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    topicAnalysis: {
      primaryTopic: { type: String, default: "" },
      secondaryTopics: [{ type: String }],
      industry: { type: String, default: "" },
      category: { type: String, default: "" },
      confidence: { type: Number, default: 0 }
    }
  },
  {
    timestamps: true
  }
);

competitorPostSchema.index({ competitorId: 1 });
competitorPostSchema.index({ publishedAt: -1 });
competitorPostSchema.index({ userId: 1 });
competitorPostSchema.index({ userId: 1, createdAt: -1 });
competitorPostSchema.index({ userId: 1, competitorId: 1 });

const CompetitorPost = mongoose.model("CompetitorPost", competitorPostSchema);

export default CompetitorPost;
