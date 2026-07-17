import WorkspaceDocument from "../models/WorkspaceDocument.js";

class WorkspaceController {
  /**
   * List workspace documents with search, filter, sort, and pagination.
   * GET /api/workspace
   */
  async list(req, res, next) {
    try {
      const userId = req.user.userId;
      const {
        search,
        platform,
        sourceType,
        favorite,
        status,
        sort = "newest",
        page = 1,
        limit = 12
      } = req.query;

      const query = { userId, isDeleted: false };

      // Search (text search or regex fallback)
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: "i" } },
          { topic: { $regex: search, $options: "i" } },
          { currentContent: { $regex: search, $options: "i" } },
          { tags: { $regex: search, $options: "i" } }
        ];
      }

      // Filters
      if (platform) query.platform = platform;
      if (sourceType) query.sourceType = sourceType;
      if (favorite === "true") query.favorite = true;
      if (status) query.status = status;

      // Sort
      let sortOption = { updatedAt: -1 };
      if (sort === "oldest") sortOption = { updatedAt: 1 };
      if (sort === "title_asc") sortOption = { title: 1 };
      if (sort === "title_desc") sortOption = { title: -1 };
      if (sort === "created_newest") sortOption = { createdAt: -1 };
      if (sort === "created_oldest") sortOption = { createdAt: 1 };

      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
      const skip = (pageNum - 1) * limitNum;

      const [documents, total] = await Promise.all([
        WorkspaceDocument.find(query)
          .select("title topic platform sourceType currentVersion favorite status tags createdAt updatedAt chatHistory")
          .sort(sortOption)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        WorkspaceDocument.countDocuments(query)
      ]);

      // Add chatCount and wordCount to each document without sending full content
      const enrichedDocs = documents.map(doc => ({
        ...doc,
        chatCount: doc.chatHistory?.length || 0,
        chatHistory: undefined // Don't send full chat in list view
      }));

      return res.status(200).json({
        success: true,
        data: enrichedDocs,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single workspace document with full versions and chat history.
   * GET /api/workspace/:id
   */
  async getById(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      const document = await WorkspaceDocument.findOne({
        _id: id,
        userId,
        isDeleted: false
      });

      if (!document) {
        const error = new Error("Workspace document not found");
        error.status = 404;
        throw error;
      }

      return res.status(200).json({
        success: true,
        data: document
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Auto-save: Update document content, optionally push a new version.
   * PUT /api/workspace/:id
   */
  async autoSave(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const { currentContent, title, tags, status } = req.body;

      const document = await WorkspaceDocument.findOne({
        _id: id,
        userId,
        isDeleted: false
      });

      if (!document) {
        const error = new Error("Workspace document not found");
        error.status = 404;
        throw error;
      }

      // Update fields if provided
      if (currentContent !== undefined) document.currentContent = currentContent;
      if (title !== undefined) document.title = title;
      if (tags !== undefined) document.tags = tags;
      if (status !== undefined) document.status = status;

      await document.save();

      return res.status(200).json({
        success: true,
        message: "Document saved",
        data: {
          _id: document._id,
          updatedAt: document.updatedAt
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle favorite status.
   * PUT /api/workspace/:id/favorite
   */
  async toggleFavorite(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      const document = await WorkspaceDocument.findOne({
        _id: id,
        userId,
        isDeleted: false
      });

      if (!document) {
        const error = new Error("Workspace document not found");
        error.status = 404;
        throw error;
      }

      document.favorite = !document.favorite;
      await document.save();

      return res.status(200).json({
        success: true,
        message: document.favorite ? "Added to favorites" : "Removed from favorites",
        data: { favorite: document.favorite }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Duplicate a workspace document.
   * POST /api/workspace/:id/duplicate
   */
  async duplicate(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      const original = await WorkspaceDocument.findOne({
        _id: id,
        userId,
        isDeleted: false
      });

      if (!original) {
        const error = new Error("Workspace document not found");
        error.status = 404;
        throw error;
      }

      const duplicated = new WorkspaceDocument({
        userId,
        title: `${original.title} (Copy)`,
        topic: original.topic,
        platform: original.platform,
        sourceType: original.sourceType,
        sourceId: original.sourceId,
        generationPrompt: original.generationPrompt,
        currentContent: original.currentContent,
        currentVersion: 1,
        versions: [
          {
            versionNumber: 1,
            content: original.currentContent,
            instruction: `Duplicated from "${original.title}"`,
            createdAt: new Date()
          }
        ],
        chatHistory: [],
        favorite: false,
        tags: [...original.tags],
        status: "draft"
      });

      await duplicated.save();

      return res.status(201).json({
        success: true,
        message: "Document duplicated successfully",
        data: duplicated
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Restore a specific version.
   * PUT /api/workspace/:id/restore-version
   */
  async restoreVersion(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const { versionNumber } = req.body;

      if (!versionNumber) {
        const error = new Error("Version number is required");
        error.status = 400;
        throw error;
      }

      const document = await WorkspaceDocument.findOne({
        _id: id,
        userId,
        isDeleted: false
      });

      if (!document) {
        const error = new Error("Workspace document not found");
        error.status = 404;
        throw error;
      }

      const targetVersion = document.versions.find(
        (v) => v.versionNumber === versionNumber
      );

      if (!targetVersion) {
        const error = new Error(`Version ${versionNumber} not found`);
        error.status = 404;
        throw error;
      }

      // Create a new version entry for the restoration
      const newVersionNumber = document.currentVersion + 1;
      document.versions.push({
        versionNumber: newVersionNumber,
        content: targetVersion.content,
        instruction: `Restored from version ${versionNumber}`,
        createdAt: new Date()
      });

      document.currentContent = targetVersion.content;
      document.currentVersion = newVersionNumber;

      // Add chat message about the restore
      document.chatHistory.push({
        role: "assistant",
        message: `Document restored to version ${versionNumber}. This is now version ${newVersionNumber}.`,
        timestamp: new Date()
      });

      await document.save();

      return res.status(200).json({
        success: true,
        message: `Restored to version ${versionNumber}`,
        data: document
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Soft delete a workspace document (move to trash).
   * DELETE /api/workspace/:id
   */
  async softDelete(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      const document = await WorkspaceDocument.findOne({
        _id: id,
        userId,
        isDeleted: false
      });

      if (!document) {
        const error = new Error("Workspace document not found");
        error.status = 404;
        throw error;
      }

      document.isDeleted = true;
      document.deletedAt = new Date();
      await document.save();

      return res.status(200).json({
        success: true,
        message: "Document moved to trash"
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Restore a document from trash.
   * PUT /api/workspace/:id/undelete
   */
  async undelete(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      const document = await WorkspaceDocument.findOne({
        _id: id,
        userId,
        isDeleted: true
      });

      if (!document) {
        const error = new Error("Trashed document not found");
        error.status = 404;
        throw error;
      }

      document.isDeleted = false;
      document.deletedAt = null;
      await document.save();

      return res.status(200).json({
        success: true,
        message: "Document restored from trash"
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new WorkspaceController();
