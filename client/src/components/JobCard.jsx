/**
 * JobCard Component
 *
 * Displays a single job listing with all relevant information
 * Features:
 * - Company logo/initials
 * - Job title and company name
 * - Location with remote indicator
 * - Job description with truncation
 * - Skills/keywords tags
 * - Salary information
 * - Job type badge
 * - Posted date
 * - Apply button
 * - Hover effects and animations
 */

import { memo } from "react";
import {
  FiBriefcase,
  FiMapPin,
  FiCalendar,
  FiDollarSign,
  FiExternalLink,
  FiClock,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import {
  formatDate,
  formatSalary,
  truncateText,
  getCompanyInitials,
  stringToColor,
  isRemoteLocation,
  getJobTypeLabel,
} from "../utils/helpers";

const JobCard = memo(({ job }) => {
  const navigate = useNavigate();

  // Early return if no job data
  if (!job) return null;

  const {
    id,
    title,
    company,
    location,
    description,
    type,
    salaryMin,
    salaryMax,
    salaryCurrency,
    keywords,
    applyUrl,
    createdAt,
  } = job;

  // Get company initials and color
  const companyInitials = getCompanyInitials(company);
  const companyColor = stringToColor(company);
  const isRemote = isRemoteLocation(location);

  /**
   * Handle apply button click
   */
  const handleApply = (e) => {
    e.stopPropagation();
    if (applyUrl) {
      navigate(`/apply/${id}`, { state: { job } });
    } else {
      // If no apply URL, just navigate to apply page
      navigate(`/apply/${id}`, { state: { job } });
    }
  };

  /**
   * Handle card click (view job details)
   */
  const handleCardClick = () => {
    // Could navigate to job detail page in future
    console.log("View job details:", id);
  };

  return (
    <div
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-indigo-200 cursor-pointer group"
      onClick={handleCardClick}
    >
      <div className="p-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* Left Section - Job Info */}
          <div className="flex-1 min-w-0">
            {/* Company Logo/Initials and Title */}
            <div className="flex items-start space-x-4">
              {/* Company Logo */}
              <div
                className="flex-shrink-0 h-14 w-14 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-110 transition-transform duration-300"
                style={{ backgroundColor: companyColor }}
              >
                {companyInitials}
              </div>

              {/* Job Title and Company */}
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors duration-200 line-clamp-2">
                  {title}
                </h3>
                <div className="mt-1 flex items-center space-x-2 text-sm text-gray-600">
                  <FiBriefcase className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium">{company}</span>
                </div>
              </div>
            </div>

            {/* Location and Remote Badge */}
            <div className="mt-3 flex items-center space-x-3">
              <div className="flex items-center space-x-1.5 text-sm text-gray-600">
                <FiMapPin className="h-4 w-4 text-indigo-500" />
                <span>{location}</span>
              </div>
              {isRemote && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                  🏠 Remote
                </span>
              )}
            </div>

            {/* Description */}
            <p className="mt-4 text-sm text-gray-600 leading-relaxed line-clamp-2">
              {truncateText(description, 160)}
            </p>

            {/* Keywords/Skills */}
            {keywords && keywords.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {keywords.slice(0, 6).map((keyword, index) => (
                  <span
                    key={`${keyword}-${index}`}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition-colors duration-200"
                  >
                    {keyword}
                  </span>
                ))}
                {keywords.length > 6 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                    +{keywords.length - 6} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right Section - Job Meta Info */}
          <div className="flex flex-col items-start sm:items-end space-y-3 sm:ml-6 flex-shrink-0">
            {/* Job Type Badge */}
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md">
              {getJobTypeLabel(type)}
            </span>

            {/* Salary Info */}
            <div className="bg-gray-50 rounded-lg px-4 py-2.5 border border-gray-200">
              <div className="flex items-center space-x-2 text-sm">
                <FiDollarSign className="h-4 w-4 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Salary</p>
                  <p className="font-semibold text-gray-900 mt-0.5">
                    {salaryMin || salaryMax
                      ? formatSalary(salaryMin, salaryMax, salaryCurrency)
                      : "Not specified"}
                  </p>
                </div>
              </div>
            </div>

            {/* Posted Date */}
            <div className="flex items-center space-x-1.5 text-xs text-gray-500">
              <FiClock className="h-3.5 w-3.5" />
              <span>Posted {formatDate(createdAt)}</span>
            </div>

            {/* Apply Button */}
            <button
              onClick={handleApply}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Apply Now
              <FiExternalLink className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Border Accent */}
      <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
    </div>
  );
});

JobCard.displayName = "JobCard";

export default JobCard;
