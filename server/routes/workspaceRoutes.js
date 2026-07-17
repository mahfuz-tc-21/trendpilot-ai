import express from "express";
import workspaceController from "../controllers/workspaceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// List workspace documents (search, filter, sort, pagination)
router.get("/", protect, workspaceController.list);

// Get single document with full versions and chat
router.get("/:id", protect, workspaceController.getById);

// Auto-save document content
router.put("/:id", protect, workspaceController.autoSave);

// Toggle favorite
router.put("/:id/favorite", protect, workspaceController.toggleFavorite);

// Duplicate document
router.post("/:id/duplicate", protect, workspaceController.duplicate);

// Restore a specific version
router.put("/:id/restore-version", protect, workspaceController.restoreVersion);

// Soft delete (move to trash)
router.delete("/:id", protect, workspaceController.softDelete);

// Restore from trash
router.put("/:id/undelete", protect, workspaceController.undelete);

export default router;
