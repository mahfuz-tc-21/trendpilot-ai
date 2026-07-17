import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import sourceRoutes from "./routes/sourceRoutes.js";
import competitorRoutes from "./routes/competitorRoutes.js";
import scanRoutes from "./routes/scanRoutes.js";
import contentRoutes from "./routes/contentRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import aiStudioRoutes from "./routes/aiStudioRoutes.js";
import trashRoutes from "./routes/trashRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";

const app = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
  })
);

// Request Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register Routes
app.use("/api/auth", authRoutes);
app.use("/api/sources", sourceRoutes);
app.use("/api/competitors", competitorRoutes);
app.use("/api/scan", scanRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/studio", aiStudioRoutes);
app.use("/api/trash", trashRoutes);
app.use("/api/workspace", workspaceRoutes);

// Health Check Endpoint (per docs/04-api-specification.md)
app.get("/api/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";
  res.status(200).json({
    status: "OK",
    database: dbStatus,
    server: "Running",
    version: "1.0.0"
  });
});

// Root route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to TrendPilot AI Backend API. Project successfully initialized."
  });
});

// Centralized Error Handling Middleware
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
});

export default app;
