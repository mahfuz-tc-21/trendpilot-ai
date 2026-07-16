import express from "express";
import contentController from "../controllers/contentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get list of scraped contents
router.get("/", protect, contentController.getAll);

// Get specific article details + AI summary analysis
router.get("/:id", protect, contentController.getDetails);

// Delete specific article and analysis
router.delete("/:id", protect, contentController.deleteItem);

export default router;
