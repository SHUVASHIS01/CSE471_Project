/**
 * HomePage Component
 *
 * Main page for browsing and searching job listings
 * Features:
 * - Advanced search and filtering
 * - Multiple sort options (recent, salary high/low, relevant)
 * - Pagination with page controls
 * - Loading states and error handling
 * - Responsive design with deep theme
 * - Real-time search results
 * - Empty state and no results handling
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FiTrendingUp,
  FiAlertCircle,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import SearchBar from "../components/SearchBar";
import JobCard from "../components/JobCard";
import { jobsAPI } from "../utils/api";
import { getErrorMessage, scrollToTop } from "../utils/helpers";

export default function HomePage() {
  // URL search params for maintaining state in URL
  const [searchParams, setSearchParams] = useSearchParams();

  // State management
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("recent");
  const [filters, setFilters] = useState({});
  const [hasSearched, setHasSearched] = useState(false);

  // Create a stable reference for the onChange callback
  const handleFilterChangeRef = useRef();
  handleFilterChangeRef.current = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
    scrollToTop();
  };

  // Stable callback that never changes
  const handleFilterChange = useCallback((newFilters) => {
    handleFilterChangeRef.current(newFilters);
  }, []);

  const limit = 9; // Jobs per page

  /**
   * Initialize filters from URL params on mount
   */
  useEffect(() => {
    const initialFilters = {};
    const urlPage = searchParams.get("page");
    const urlSortBy = searchParams.get("sortBy");
    const urlTitle = searchParams.get("title");
    const urlLocation = searchParams.get("location");
    const urlKeywords = searchParams.get("keywords");
    const urlQ = searchParams.get("q");

    if (urlTitle) initialFilters.title = urlTitle;
    if (urlLocation) initialFilters.location = urlLocation;
    if (urlKeywords) initialFilters.keywords = urlKeywords;
    if (urlQ) initialFilters.q = urlQ;

    if (Object.keys(initialFilters).length > 0) {
      setFilters(initialFilters);
    }

    if (urlPage) setPage(parseInt(urlPage, 10));
    if (urlSortBy) setSortBy(urlSortBy);
  }, []);

  /**
   * Fetch jobs from API
   */
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        ...filters,
        sortBy,
        page,
        limit,
      };

      const response = await jobsAPI.getJobs(params);

      if (response.success) {
        setJobs(response.items || []);
        setTotal(response.total || 0);
        setTotalPages(response.totalPages || 1);
        setHasSearched(true);
      } else {
        throw new Error(response.message || "Failed to fetch jobs");
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError(getErrorMessage(err));
      setJobs([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, page, limit]);

  /**
   * Fetch jobs when dependencies change
   */
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  /**
   * Update URL params when filters, page, or sort change
   */
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.title) params.set("title", filters.title);
    if (filters.location) params.set("location", filters.location);
    if (filters.keywords) params.set("keywords", filters.keywords);
    if (filters.q) params.set("q", filters.q);
    if (sortBy !== "recent") params.set("sortBy", sortBy);
    if (page > 1) params.set("page", page.toString());

    setSearchParams(params, { replace: true });
  }, [filters, sortBy, page, setSearchParams]);

  /**
   * Handle sort change
   */
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setPage(1); // Reset to first page on sort change
    scrollToTop();
  };

  /**
   * Handle page change
   */
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      scrollToTop();
    }
  };

  /**
   * Clear all filters
   */
  const handleClearFilters = () => {
    setFilters({});
    setPage(1);
    setSortBy("recent");
    scrollToTop();
  };

  /**
   * Retry fetching jobs on error
   */
  const handleRetry = () => {
    fetchJobs();
  };

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some((v) => v);

  // Calculate displayed range
  const startIndex = (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, total);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              Find Your Dream Job
            </h1>
            <p className="mt-4 text-lg md:text-xl text-indigo-100 max-w-2xl mx-auto">
              Explore thousands of opportunities and take the next step in your
              career journey
            </p>
            <div className="mt-6 flex items-center justify-center space-x-2 text-white/90">
              <FiTrendingUp className="h-5 w-5" />
              <span className="text-sm font-medium">
                {total.toLocaleString()}+ active job listings
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Search Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-8 border border-gray-100">
          <SearchBar onChange={handleFilterChange} />
        </div>

        {/* Results Header with Sort */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          {/* Results Summary */}
          <div className="flex-1">
            {hasSearched && !loading ? (
              <div className="space-y-1">
                <p className="text-lg font-semibold text-gray-900">
                  {total === 0 ? (
                    "No jobs found"
                  ) : (
                    <>
                      Showing{" "}
                      <span className="text-indigo-600">{startIndex}</span> -{" "}
                      <span className="text-indigo-600">{endIndex}</span> of{" "}
                      <span className="text-indigo-600">
                        {total.toLocaleString()}
                      </span>{" "}
                      jobs
                    </>
                  )}
                </p>
                {hasActiveFilters && (
                  <p className="text-sm text-gray-600">
                    Filtered results •{" "}
                    <button
                      onClick={handleClearFilters}
                      className="text-indigo-600 hover:text-indigo-800 font-medium underline"
                    >
                      Clear all filters
                    </button>
                  </p>
                )}
              </div>
            ) : loading ? (
              <div className="flex items-center space-x-2 text-gray-600">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-500 border-t-transparent"></div>
                <span className="text-sm font-medium">Loading jobs...</span>
              </div>
            ) : (
              <p className="text-gray-600">Start searching to see results</p>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-3">
            <label
              htmlFor="sortBy"
              className="text-sm font-medium text-gray-700 whitespace-nowrap"
            >
              Sort by:
            </label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={handleSortChange}
              disabled={loading || total === 0}
              className="block w-full sm:w-auto pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 rounded-lg bg-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="recent">Most Recent</option>
              <option value="relevant">Most Relevant</option>
              <option value="salary_high">Salary: High to Low</option>
              <option value="salary_low">Salary: Low to High</option>
            </select>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 mb-8 shadow-md">
            <div className="flex items-start">
              <FiAlertCircle className="h-6 w-6 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="ml-4 flex-1">
                <h3 className="text-sm font-semibold text-red-800">
                  Error Loading Jobs
                </h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                <button
                  onClick={handleRetry}
                  className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                >
                  <FiRefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && !error && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-indigo-200"></div>
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-indigo-600 border-t-transparent absolute top-0 left-0"></div>
            </div>
            <p className="mt-6 text-lg font-medium text-gray-700">
              Loading amazing opportunities...
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Please wait while we fetch the best jobs for you
            </p>
          </div>
        )}

        {/* No Results State */}
        {!loading && hasSearched && jobs.length === 0 && !error && (
          <div className="text-center py-20 bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="max-w-md mx-auto px-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
                <FiAlertCircle className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No Jobs Found
              </h3>
              <p className="text-gray-600 mb-8">
                We couldn't find any jobs matching your criteria. Try adjusting
                your filters or search terms.
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg transition-all duration-200"
                >
                  <FiRefreshCw className="mr-2 h-5 w-5" />
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Job Listings Grid */}
        {!loading && jobs.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-6 mb-8">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 px-6 py-5">
                <nav className="flex items-center justify-between">
                  {/* Mobile Pagination */}
                  <div className="flex flex-1 justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <FiChevronLeft className="h-5 w-5 mr-1" />
                      Previous
                    </button>
                    <span className="text-sm text-gray-700 flex items-center">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                      className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      Next
                      <FiChevronRight className="h-5 w-5 ml-1" />
                    </button>
                  </div>

                  {/* Desktop Pagination */}
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{" "}
                        <span className="font-semibold text-gray-900">
                          {startIndex}
                        </span>{" "}
                        to{" "}
                        <span className="font-semibold text-gray-900">
                          {endIndex}
                        </span>{" "}
                        of{" "}
                        <span className="font-semibold text-gray-900">
                          {total}
                        </span>{" "}
                        results
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Previous Button */}
                      <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        <FiChevronLeft className="h-5 w-5" />
                      </button>

                      {/* Page Numbers */}
                      {Array.from(
                        { length: Math.min(totalPages, 7) },
                        (_, i) => {
                          let pageNum;

                          if (totalPages <= 7) {
                            pageNum = i + 1;
                          } else if (page <= 4) {
                            pageNum =
                              i < 5 ? i + 1 : i === 5 ? "..." : totalPages;
                          } else if (page >= totalPages - 3) {
                            pageNum =
                              i === 0
                                ? 1
                                : i === 1
                                  ? "..."
                                  : totalPages - (6 - i);
                          } else {
                            if (i === 0) pageNum = 1;
                            else if (i === 1) pageNum = "...";
                            else if (i === 5) pageNum = "...";
                            else if (i === 6) pageNum = totalPages;
                            else pageNum = page + i - 3;
                          }

                          if (pageNum === "...") {
                            return (
                              <span
                                key={`ellipsis-${i}`}
                                className="px-3 py-2 text-sm text-gray-700"
                              >
                                ...
                              </span>
                            );
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                page === pageNum
                                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                                  : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        },
                      )}

                      {/* Next Button */}
                      <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page === totalPages}
                        className="relative inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        <FiChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </nav>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              &copy; {new Date().getFullYear()} Job Portal. All rights reserved.
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Powered by MERN Stack with ❤️
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
