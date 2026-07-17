import express from "express";
import trashController from "../controllers/trashController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// List trashed items
router.get("/", protect, trashController.list);

// Move items to trash (soft delete)
router.put("/move", protect, trashController.move);

// Restore items from trash
router.put("/restore", protect, trashController.restore);

// Delete items permanently
router.delete("/delete", protect, trashController.deletePermanently);

// Empty entire trash
router.delete("/empty", protect, trashController.empty);

// Get AI assisted cleanup suggestions
router.post("/cleanup-suggestions", protect, trashController.getCleanupSuggestions);

export default router;
