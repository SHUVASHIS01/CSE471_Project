/**
 * SearchBar Component
 *
 * Advanced search bar component with multiple filter inputs
 * Features:
 * - General search input
 * - Job title filter
 * - Location filter
 * - Keywords/skills filter
 * - Real-time debounced search
 * - Active filter indicators
 * - Clear individual/all filters
 */

import { useEffect, useState, useCallback, memo } from "react";
import {
  FiSearch,
  FiBriefcase,
  FiMapPin,
  FiTag,
  FiX,
  FiFilter,
} from "react-icons/fi";

/**
 * Reusable Input Field Component
 */
const InputField = ({
  icon: Icon,
  placeholder,
  value,
  onChange,
  onFocus,
  onClear,
  field,
  className = "",
}) => (
  <div className={`relative flex-1 ${className}`}>
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <Icon
        className={`h-5 w-5 ${value ? "text-indigo-500" : "text-gray-400"}`}
      />
    </div>
    <input
      type="text"
      className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white ${
        value ? "border-indigo-300 shadow-sm" : "border-gray-300"
      }`}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onFocus={onFocus}
    />
    {value && (
      <button
        type="button"
        className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r-lg transition-colors duration-200"
        onClick={onClear}
        aria-label={`Clear ${field}`}
      >
        <FiX className="h-5 w-5 text-gray-400 hover:text-gray-600" />
      </button>
    )}
  </div>
);

const SearchBar = ({ onChange }) => {
  // State for each filter input
  const [q, setQ] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [keywords, setKeywords] = useState("");
  const [activeFilter, setActiveFilter] = useState("q");

  /**
   * Debounced effect to update parent component
   * Waits 500ms after user stops typing before triggering search
   */
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const filterState = {
        q: q.trim(),
        title: title.trim(),
        location: location.trim(),
        keywords: keywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean)
          .join(","),
      };

      // Only trigger onChange if at least one filter has a value
      if (Object.values(filterState).some((v) => v)) {
        onChange(filterState);
      } else {
        // Pass empty object if no filters
        onChange({});
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [q, title, location, keywords]);

  /**
   * Clear individual filter
   * @param {string} field - Field name to clear
   */
  const clearFilter = useCallback((field) => {
    if (field === "q") setQ("");
    if (field === "title") setTitle("");
    if (field === "location") setLocation("");
    if (field === "keywords") setKeywords("");
  }, []);

  /**
   * Clear all filters at once
   */
  const clearAllFilters = useCallback(() => {
    setQ("");
    setTitle("");
    setLocation("");
    setKeywords("");
  }, []);

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = q || title || location || keywords;

  return (
    <div className="space-y-4">
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FiFilter className="h-5 w-5 text-gray-600" />
          <h3 className="text-sm font-medium text-gray-700">Search Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-200"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Search Inputs - Row 1 */}
      <div className="flex flex-col md:flex-row gap-3">
        <InputField
          icon={FiSearch}
          placeholder="Search jobs, companies, or keywords..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setActiveFilter("q")}
          onClear={() => clearFilter("q")}
          field="q"
          className={activeFilter === "q" ? "md:flex-[2]" : "md:flex-[2]"}
        />
        <InputField
          icon={FiBriefcase}
          placeholder="Job title (e.g., Frontend Developer)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setActiveFilter("title")}
          onClear={() => clearFilter("title")}
          field="title"
        />
      </div>

      {/* Search Inputs - Row 2 */}
      <div className="flex flex-col md:flex-row gap-3">
        <InputField
          icon={FiMapPin}
          placeholder="Location (e.g., New York, Remote)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onFocus={() => setActiveFilter("location")}
          onClear={() => clearFilter("location")}
          field="location"
        />
        <InputField
          icon={FiTag}
          placeholder="Skills (e.g., React, Node.js, MongoDB)"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          onFocus={() => setActiveFilter("keywords")}
          onClear={() => clearFilter("keywords")}
          field="keywords"
        />
      </div>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {q && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
              <FiSearch className="h-3.5 w-3.5 mr-1.5" />
              Search: {q.length > 30 ? q.substring(0, 30) + "..." : q}
              <button
                type="button"
                className="ml-2 hover:bg-indigo-200 rounded-full p-0.5 transition-colors duration-200"
                onClick={() => clearFilter("q")}
                aria-label="Remove search filter"
              >
                <FiX className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
          {title && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
              <FiBriefcase className="h-3.5 w-3.5 mr-1.5" />
              Title: {title}
              <button
                type="button"
                className="ml-2 hover:bg-green-200 rounded-full p-0.5 transition-colors duration-200"
                onClick={() => clearFilter("title")}
                aria-label="Remove title filter"
              >
                <FiX className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
          {location && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200">
              <FiMapPin className="h-3.5 w-3.5 mr-1.5" />
              Location: {location}
              <button
                type="button"
                className="ml-2 hover:bg-purple-200 rounded-full p-0.5 transition-colors duration-200"
                onClick={() => clearFilter("location")}
                aria-label="Remove location filter"
              >
                <FiX className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
          {keywords && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
              <FiTag className="h-3.5 w-3.5 mr-1.5" />
              Skills: {keywords}
              <button
                type="button"
                className="ml-2 hover:bg-yellow-200 rounded-full p-0.5 transition-colors duration-200"
                onClick={() => clearFilter("keywords")}
                aria-label="Remove keywords filter"
              >
                <FiX className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Search Tips */}
      {!hasActiveFilters && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <span className="font-medium">💡 Search Tips:</span> Use the general
            search to find jobs across all fields, or use specific filters for
            targeted results. Separate multiple skills with commas.
          </p>
        </div>
      )}
    </div>
  );
};

// Custom comparison function to prevent unnecessary re-renders
const arePropsEqual = (prevProps, nextProps) => {
  // Only re-render if onChange function reference changes
  // Don't re-render just because loading state changes
  return prevProps.onChange === nextProps.onChange;
};

export default memo(SearchBar, arePropsEqual);
