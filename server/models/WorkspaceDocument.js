import mongoose from "mongoose";

const versionSchema = new mongoose.Schema(
  {
    versionNumber: {
      type: Number,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    instruction: {
      type: String,
      default: "Initial generation"
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const chatMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const workspaceDocumentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User association is required"]
    },
    title: {
      type: String,
      default: "Untitled Document"
    },
    topic: {
      type: String,
      default: ""
    },
    platform: {
      type: String,
      required: [true, "Platform/format is required"]
    },
    sourceType: {
      type: String,
      enum: [
        "crawled_content",
        "custom_topic",
        "paste_content",
        "website_url",
        "facebook_url",
        "youtube_url",
        "blog_url"
      ],
      default: "custom_topic"
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ContentItem",
      default: null
    },
    generationPrompt: {
      type: String,
      default: ""
    },

    // Current content (latest version)
    currentContent: {
      type: String,
      required: [true, "Document content is required"]
    },
    currentVersion: {
      type: Number,
      default: 1
    },

    // Version history (append-only)
    versions: [versionSchema],

    // Chat history (append-only)
    chatHistory: [chatMessageSchema],

    // Metadata
    favorite: {
      type: Boolean,
      default: false
    },
    tags: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft"
    },

    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
workspaceDocumentSchema.index({ userId: 1, isDeleted: 1, updatedAt: -1 });
workspaceDocumentSchema.index({ userId: 1, favorite: 1 });
workspaceDocumentSchema.index({ userId: 1, platform: 1 });
workspaceDocumentSchema.index({ userId: 1, sourceType: 1 });

// Text index for full-text search
workspaceDocumentSchema.index(
  { title: "text", topic: "text", currentContent: "text", tags: "text" },
  { weights: { title: 10, topic: 5, tags: 3, currentContent: 1 } }
);

const WorkspaceDocument = mongoose.model("WorkspaceDocument", workspaceDocumentSchema);

export default WorkspaceDocument;
