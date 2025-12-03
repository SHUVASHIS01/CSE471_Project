/**
 * Jobs Routes
 *
 * This module handles all job-related API endpoints including:
 * - Job search and filtering
 * - Pagination
 * - Sorting
 * - Error handling
 */

import express from "express";
import prisma from "../utils/prisma.js";
import {
  buildJobQuery,
  buildJobSortOrder,
  buildPaginationParams,
  filterJobsFromJSON,
  sortJobsFromJSON,
  paginateJobs,
} from "../utils/queryBuilder.js";

const router = express.Router();

// Fallback data for when database is not available
let fallbackJobs = [];
try {
  const fs = await import("fs");
  const path = await import("path");
  const url = await import("url");
  const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
  const jobsPath = path.join(__dirname, "../data/jobs.json");
  const jobsData = fs.readFileSync(jobsPath, "utf8");
  fallbackJobs = JSON.parse(jobsData);
  console.log(`✅ Loaded ${fallbackJobs.length} fallback jobs from JSON`);
} catch (e) {
  console.warn("⚠️  Could not load fallback jobs data:", e.message);
  fallbackJobs = [];
}

/**
 * GET /api/jobs
 *
 * Retrieve jobs with filtering, sorting, and pagination
 *
 * Query Parameters:
 * @param {string} title - Filter by job title (partial match, case insensitive)
 * @param {string} location - Filter by location (partial match, case insensitive)
 * @param {string} keywords - Filter by keywords/skills (comma-separated, matches any)
 * @param {string} q - General search query (searches across title, company, location, description)
 * @param {string} sortBy - Sort order: recent, salary_high, salary_low, relevant (default: recent)
 * @param {number} page - Page number (1-based, default: 1)
 * @param {number} limit - Items per page (default: 10, max: 50)
 *
 * Response:
 * @returns {Object} JSON object with:
 *   - items: Array of job objects
 *   - total: Total number of matching jobs
 *   - page: Current page number
 *   - limit: Items per page
 *   - totalPages: Total number of pages
 *   - hasNextPage: Boolean indicating if there are more pages
 *   - hasPrevPage: Boolean indicating if there are previous pages
 */
router.get("/", async (req, res) => {
  try {
    // Extract query parameters
    const {
      title,
      location,
      keywords,
      q,
      sortBy = "recent",
      page = 1,
      limit = 10,
    } = req.query;

    // Validate and build pagination parameters
    const {
      skip,
      take,
      page: validatedPage,
      limit: validatedLimit,
    } = buildPaginationParams(
      page,
      limit,
      50, // max limit
    );

    // Try to use Prisma (database) first
    if (prisma) {
      try {
        // Build Prisma where clause based on filters
        const where = buildJobQuery({ title, location, keywords, q });

        // Build orderBy clause based on sortBy parameter
        const orderBy = buildJobSortOrder(sortBy);

        // Execute database queries in parallel for better performance
        const [items, total] = await Promise.all([
          prisma.job.findMany({
            where,
            orderBy,
            skip,
            take,
          }),
          prisma.job.count({ where }),
        ]);

        // Calculate pagination metadata
        const totalPages = Math.ceil(total / validatedLimit);
        const hasNextPage = validatedPage < totalPages;
        const hasPrevPage = validatedPage > 1;

        // Return successful response
        return res.status(200).json({
          success: true,
          items,
          total,
          page: validatedPage,
          limit: validatedLimit,
          totalPages,
          hasNextPage,
          hasPrevPage,
          filters: {
            title: title || null,
            location: location || null,
            keywords: keywords || null,
            q: q || null,
            sortBy,
          },
        });
      } catch (dbError) {
        // Log database error and fall through to JSON fallback
        console.error("❌ Database query error:", dbError.message);
        // Continue to fallback logic below
      }
    }

    // Fallback to JSON data if database is not available or query failed
    console.log("📋 Using fallback JSON data");

    // Filter jobs based on search criteria
    let filtered = filterJobsFromJSON(fallbackJobs, {
      title,
      location,
      keywords,
      q,
    });

    // Sort jobs based on sortBy parameter
    filtered = sortJobsFromJSON(filtered, sortBy);

    // Calculate total before pagination
    const total = filtered.length;

    // Apply pagination
    const items = paginateJobs(filtered, skip, take);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / validatedLimit);
    const hasNextPage = validatedPage < totalPages;
    const hasPrevPage = validatedPage > 1;

    // Return successful response with fallback data
    return res.status(200).json({
      success: true,
      items,
      total,
      page: validatedPage,
      limit: validatedLimit,
      totalPages,
      hasNextPage,
      hasPrevPage,
      filters: {
        title: title || null,
        location: location || null,
        keywords: keywords || null,
        q: q || null,
        sortBy,
      },
      usingFallback: true,
    });
  } catch (error) {
    // Handle unexpected errors
    console.error("❌ Error in /api/jobs:", error);

    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Failed to fetch jobs. Please try again later.",
      items: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    });
  }
});

/**
 * GET /api/jobs/:id
 *
 * Retrieve a single job by ID
 *
 * @param {string} id - Job ID
 * @returns {Object} Job object or error
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format (MongoDB ObjectId is 24 hex characters)
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid job ID format",
      });
    }

    // Try to fetch from database
    if (prisma) {
      try {
        const job = await prisma.job.findUnique({
          where: { id },
        });

        if (job) {
          return res.status(200).json({
            success: true,
            job,
          });
        }
      } catch (dbError) {
        console.error("❌ Database query error:", dbError.message);
        // Continue to fallback
      }
    }

    // Fallback to JSON data
    const job = fallbackJobs.find((j) => j.id === id);

    if (job) {
      return res.status(200).json({
        success: true,
        job,
        usingFallback: true,
      });
    }

    // Job not found
    return res.status(404).json({
      success: false,
      error: "Job not found",
    });
  } catch (error) {
    console.error("❌ Error in /api/jobs/:id:", error);

    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Failed to fetch job. Please try again later.",
    });
  }
});

/**
 * GET /api/jobs/stats
 *
 * Get statistics about job listings
 * @returns {Object} Statistics object
 */
router.get("/stats/summary", async (req, res) => {
  try {
    if (prisma) {
      try {
        const [total, locations, companies] = await Promise.all([
          prisma.job.count(),
          prisma.job.groupBy({
            by: ["location"],
            _count: true,
            orderBy: { _count: { location: "desc" } },
            take: 10,
          }),
          prisma.job.groupBy({
            by: ["company"],
            _count: true,
            orderBy: { _count: { company: "desc" } },
            take: 10,
          }),
        ]);

        return res.status(200).json({
          success: true,
          stats: {
            totalJobs: total,
            topLocations: locations,
            topCompanies: companies,
          },
        });
      } catch (dbError) {
        console.error("❌ Database query error:", dbError.message);
        // Continue to fallback
      }
    }

    // Fallback statistics from JSON
    const locationCounts = {};
    const companyCounts = {};

    fallbackJobs.forEach((job) => {
      locationCounts[job.location] = (locationCounts[job.location] || 0) + 1;
      companyCounts[job.company] = (companyCounts[job.company] || 0) + 1;
    });

    const topLocations = Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([location, count]) => ({ location, _count: count }));

    const topCompanies = Object.entries(companyCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([company, count]) => ({ company, _count: count }));

    return res.status(200).json({
      success: true,
      stats: {
        totalJobs: fallbackJobs.length,
        topLocations,
        topCompanies,
      },
      usingFallback: true,
    });
  } catch (error) {
    console.error("❌ Error in /api/jobs/stats/summary:", error);

    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

export default router;
