import mongoose from "mongoose";

const contentItemSchema = new mongoose.Schema(
  {
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Source",
      required: [true, "Source association is required"]
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
    thumbnail: {
      type: String,
      default: ""
    },
    author: {
      type: String,
      default: ""
    },
    publishedAt: {
      type: Date,
      default: Date.now
    },
    rawText: {
      type: String,
      default: ""
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
    }
  },
  {
    timestamps: true
  }
);

// Indexes (per docs/03-database-design.md & multi-user requirements)
contentItemSchema.index({ sourceId: 1 });
contentItemSchema.index({ publishedAt: -1 });
contentItemSchema.index({ userId: 1 });
contentItemSchema.index({ userId: 1, createdAt: -1 });
contentItemSchema.index({ userId: 1, sourceId: 1 });
contentItemSchema.index({ userId: 1, processedStatus: 1 });

const ContentItem = mongoose.model("ContentItem", contentItemSchema);

export default ContentItem;
