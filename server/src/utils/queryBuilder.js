/**
 * Query Builder Utility
 *
 * This module provides functions to build dynamic Prisma queries
 * based on search filters and parameters for job listings.
 */

/**
 * Build Prisma where clause based on search filters
 *
 * @param {Object} filters - Filter parameters
 * @param {string} filters.title - Job title to search (partial match)
 * @param {string} filters.location - Location to search (partial match)
 * @param {string} filters.keywords - Comma-separated keywords/skills
 * @param {string} filters.q - General search query (searches across multiple fields)
 * @returns {Object} Prisma where clause object
 */
export const buildJobQuery = ({ title, location, keywords, q }) => {
  const where = {};

  // Title filter - case insensitive partial match
  if (title && title.trim()) {
    where.title = {
      contains: title.trim(),
      mode: 'insensitive'
    };
  }

  // Location filter - case insensitive partial match
  if (location && location.trim()) {
    where.location = {
      contains: location.trim(),
      mode: 'insensitive'
    };
  }

  // Keywords filter - matches jobs that have at least one of the specified keywords
  if (keywords && keywords.trim()) {
    const keywordList = keywords
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);

    if (keywordList.length > 0) {
      where.keywords = {
        hasSome: keywordList
      };
    }
  }

  // General search query - searches across title, company, location, and description
  if (q && q.trim()) {
    where.OR = [
      { title: { contains: q.trim(), mode: 'insensitive' } },
      { company: { contains: q.trim(), mode: 'insensitive' } },
      { location: { contains: q.trim(), mode: 'insensitive' } },
      { description: { contains: q.trim(), mode: 'insensitive' } }
    ];
  }

  return where;
};

/**
 * Build Prisma orderBy clause based on sort parameter
 *
 * @param {string} sortBy - Sort parameter (recent, salary_high, salary_low, relevant)
 * @returns {Object|Array} Prisma orderBy clause
 */
export const buildJobSortOrder = (sortBy) => {
  switch (sortBy) {
    case 'salary_high':
      // Sort by salary descending (highest first), nulls last
      return [
        { salaryMax: 'desc' },
        { salaryMin: 'desc' },
        { createdAt: 'desc' }
      ];

    case 'salary_low':
      // Sort by salary ascending (lowest first), nulls last
      return [
        { salaryMin: 'asc' },
        { salaryMax: 'asc' },
        { createdAt: 'desc' }
      ];

    case 'relevant':
      // Sort by relevance (most recent for now, can be enhanced with scoring)
      return { createdAt: 'desc' };

    case 'recent':
    default:
      // Default: most recent jobs first
      return { createdAt: 'desc' };
  }
};

/**
 * Validate and sanitize pagination parameters
 *
 * @param {number|string} page - Page number (1-based)
 * @param {number|string} limit - Items per page
 * @param {number} maxLimit - Maximum allowed limit (default: 50)
 * @returns {Object} Object with validated skip, take, and page values
 */
export const buildPaginationParams = (page, limit, maxLimit = 50) => {
  // Validate and constrain page number
  const validatedPage = Math.max(Number(page) || 1, 1);

  // Validate and constrain limit
  const validatedLimit = Math.min(Math.max(Number(limit) || 10, 1), maxLimit);

  // Calculate skip value for pagination
  const skip = (validatedPage - 1) * validatedLimit;

  return {
    skip,
    take: validatedLimit,
    page: validatedPage,
    limit: validatedLimit
  };
};

/**
 * Filter jobs from JSON data based on search criteria
 * Used as fallback when database is not available
 *
 * @param {Array} jobs - Array of job objects
 * @param {Object} filters - Filter parameters
 * @returns {Array} Filtered jobs
 */
export const filterJobsFromJSON = (jobs, { title, location, keywords, q }) => {
  let filtered = [...jobs];

  // General search filter
  if (q && q.trim()) {
    const qLower = q.trim().toLowerCase();
    filtered = filtered.filter(job =>
      job.title?.toLowerCase().includes(qLower) ||
      job.company?.toLowerCase().includes(qLower) ||
      job.location?.toLowerCase().includes(qLower) ||
      job.description?.toLowerCase().includes(qLower)
    );
  }

  // Title filter
  if (title && title.trim()) {
    const titleLower = title.trim().toLowerCase();
    filtered = filtered.filter(job =>
      job.title?.toLowerCase().includes(titleLower)
    );
  }

  // Location filter
  if (location && location.trim()) {
    const locationLower = location.trim().toLowerCase();
    filtered = filtered.filter(job =>
      job.location?.toLowerCase().includes(locationLower)
    );
  }

  // Keywords filter
  if (keywords && keywords.trim()) {
    const keywordList = keywords
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(Boolean);

    if (keywordList.length > 0) {
      filtered = filtered.filter(job =>
        job.keywords && job.keywords.some(k =>
          keywordList.includes(k.toLowerCase())
        )
      );
    }
  }

  return filtered;
};

/**
 * Sort jobs from JSON data based on sort parameter
 *
 * @param {Array} jobs - Array of job objects
 * @param {string} sortBy - Sort parameter
 * @returns {Array} Sorted jobs
 */
export const sortJobsFromJSON = (jobs, sortBy) => {
  const sorted = [...jobs];

  switch (sortBy) {
    case 'salary_high':
      return sorted.sort((a, b) => {
        const salaryA = a.salaryMax || a.salaryMin || 0;
        const salaryB = b.salaryMax || b.salaryMin || 0;
        if (salaryB !== salaryA) return salaryB - salaryA;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

    case 'salary_low':
      return sorted.sort((a, b) => {
        const salaryA = a.salaryMin || a.salaryMax || Number.MAX_SAFE_INTEGER;
        const salaryB = b.salaryMin || b.salaryMax || Number.MAX_SAFE_INTEGER;
        if (salaryA !== salaryB) return salaryA - salaryB;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

    case 'recent':
    case 'relevant':
    default:
      return sorted.sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      );
  }
};

/**
 * Apply pagination to an array of jobs
 *
 * @param {Array} jobs - Array of job objects
 * @param {number} skip - Number of items to skip
 * @param {number} take - Number of items to take
 * @returns {Array} Paginated jobs
 */
export const paginateJobs = (jobs, skip, take) => {
  return jobs.slice(skip, skip + take);
};
