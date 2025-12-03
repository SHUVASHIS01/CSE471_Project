/**
 * Job Portal API Server
 *
 * Main server entry point for the job portal backend.
 * Handles Express setup, middleware configuration, and route mounting.
 *
 * Features:
 * - RESTful API endpoints for job listings
 * - Search and filter functionality
 * - Pagination and sorting
 * - Error handling
 * - CORS support
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jobsRouter from "./routes/jobs.js";
import { closePrisma, isPrismaAvailable } from "./utils/prisma.js";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 4000;

// ===========================
// Middleware Configuration
// ===========================

// Enable CORS for cross-origin requests
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (simple logger)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ===========================
// API Routes
// ===========================

/**
 * Health check endpoint
 * Returns server status and database connection status
 */
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    database: isPrismaAvailable() ? "connected" : "using fallback",
    version: "1.0.0",
  });
});

/**
 * Jobs API routes
 * All job-related endpoints are handled by the jobs router
 */
app.use("/api/jobs", jobsRouter);

/**
 * Root endpoint
 * Returns API information and available endpoints
 */
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Job Portal API",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      jobs: {
        list: "GET /api/jobs",
        single: "GET /api/jobs/:id",
        stats: "GET /api/jobs/stats/summary",
      },
    },
    documentation: {
      search: {
        endpoint: "GET /api/jobs",
        parameters: {
          title: "Filter by job title (partial match)",
          location: "Filter by location (partial match)",
          keywords: "Filter by keywords/skills (comma-separated)",
          q: "General search query",
          sortBy: "Sort order: recent, salary_high, salary_low, relevant",
          page: "Page number (default: 1)",
          limit: "Items per page (default: 10, max: 50)",
        },
      },
    },
  });
});

// ===========================
// Error Handling
// ===========================

/**
 * 404 Not Found handler
 * Catches requests to undefined routes
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Not Found",
    message: `Cannot ${req.method} ${req.path}`,
    availableEndpoints: [
      "/api/health",
      "/api/jobs",
      "/api/jobs/:id",
      "/api/jobs/stats/summary",
    ],
  });
});

/**
 * Global error handler
 * Catches all unhandled errors in the application
 */
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err);

  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "development"
      ? err.message
      : "An unexpected error occurred";

  res.status(statusCode).json({
    success: false,
    error: err.name || "Internal Server Error",
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ===========================
// Server Startup
// ===========================

/**
 * Start the Express server
 */
const server = app.listen(port, () => {
  console.log("\n🚀 ====================================");
  console.log("   Job Portal API Server");
  console.log("   ====================================");
  console.log(`   Server running on: http://localhost:${port}`);
  console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `   Database: ${isPrismaAvailable() ? "✅ Connected" : "⚠️  Using fallback data"}`,
  );
  console.log("   ====================================\n");
});

// ===========================
// Graceful Shutdown
// ===========================

/**
 * Handle graceful shutdown on process termination
 */
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  // Close server to stop accepting new requests
  server.close(async () => {
    console.log("✅ HTTP server closed");

    // Close database connection
    try {
      await closePrisma();
      console.log("✅ Database connections closed");
    } catch (error) {
      console.error("❌ Error closing database:", error);
    }

    console.log("👋 Graceful shutdown complete");
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error("⚠️  Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

// Listen for termination signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  gracefulShutdown("uncaughtException");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown("unhandledRejection");
});

export default app;
