/**
 * ApplyPage Component
 *
 * Page for applying to a specific job
 * Features:
 * - Job details display
 * - Application form with validation
 * - File upload for resume
 * - Form submission handling
 * - Success/error states
 * - Responsive design with deep theme
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  FiBriefcase,
  FiMapPin,
  FiDollarSign,
  FiClock,
  FiArrowLeft,
  FiCheck,
  FiAlertCircle,
  FiUser,
  FiMail,
  FiPhone,
  FiFileText,
  FiUpload,
  FiExternalLink,
} from "react-icons/fi";
import { jobsAPI } from "../utils/api";
import {
  formatDate,
  formatSalary,
  getCompanyInitials,
  stringToColor,
  isValidEmail,
  getJobTypeLabel,
} from "../utils/helpers";

export default function ApplyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // State from navigation (if available)
  const jobFromState = location.state?.job;

  // Component state
  const [job, setJob] = useState(jobFromState || null);
  const [loading, setLoading] = useState(!jobFromState);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    coverLetter: "",
    resume: null,
    linkedin: "",
    portfolio: "",
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState({});

  /**
   * Fetch job details if not provided via state
   */
  useEffect(() => {
    if (!jobFromState && id) {
      fetchJobDetails();
    }
  }, [id, jobFromState]);

  /**
   * Fetch job details from API
   */
  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await jobsAPI.getJobById(id);

      if (response.success) {
        setJob(response.job);
      } else {
        throw new Error(response.message || "Job not found");
      }
    } catch (err) {
      console.error("Error fetching job:", err);
      setError("Failed to load job details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle form input changes
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  /**
   * Handle file upload
   */
  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (!allowedTypes.includes(file.type)) {
        setFormErrors((prev) => ({
          ...prev,
          resume: "Please upload a PDF or Word document",
        }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFormErrors((prev) => ({
          ...prev,
          resume: "File size must be less than 5MB",
        }));
        return;
      }

      setFormData((prev) => ({
        ...prev,
        resume: file,
      }));

      setFormErrors((prev) => ({
        ...prev,
        resume: "",
      }));
    }
  };

  /**
   * Validate form
   */
  const validateForm = () => {
    const errors = {};

    // Full name validation
    if (!formData.fullName.trim()) {
      errors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 2) {
      errors.fullName = "Full name must be at least 2 characters";
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!isValidEmail(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Phone validation
    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^[0-9\s\-\+\(\)]+$/.test(formData.phone)) {
      errors.phone = "Please enter a valid phone number";
    }

    // Cover letter validation
    if (!formData.coverLetter.trim()) {
      errors.coverLetter = "Cover letter is required";
    } else if (formData.coverLetter.trim().length < 50) {
      errors.coverLetter = "Cover letter must be at least 50 characters";
    }

    // Resume validation
    if (!formData.resume) {
      errors.resume = "Resume is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      // In a real application, you would send this to your backend
      // For now, we'll simulate a successful submission
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append("fullName", formData.fullName);
      submitData.append("email", formData.email);
      submitData.append("phone", formData.phone);
      submitData.append("coverLetter", formData.coverLetter);
      submitData.append("resume", formData.resume);
      submitData.append("linkedin", formData.linkedin);
      submitData.append("portfolio", formData.portfolio);
      submitData.append("jobId", id);

      // TODO: Send to backend API
      // await api.post('/api/applications', submitData);

      // Show success state
      setSubmitted(true);
    } catch (err) {
      console.error("Error submitting application:", err);
      setError("Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Handle external apply link
   */
  const handleExternalApply = () => {
    if (job?.applyUrl) {
      window.open(job.applyUrl, "_blank", "noopener,noreferrer");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent absolute top-0 left-0"></div>
          </div>
          <p className="mt-4 text-lg font-medium text-gray-700">
            Loading job details...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
            <FiAlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Error Loading Job
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
            >
              <FiArrowLeft className="mr-2 h-5 w-5" />
              Back to Jobs
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
              <FiCheck className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Application Submitted!
            </h2>
            <p className="text-gray-600 mb-2">
              Your application for{" "}
              <span className="font-semibold text-gray-900">{job?.title}</span>{" "}
              at{" "}
              <span className="font-semibold text-gray-900">{job?.company}</span>{" "}
              has been successfully submitted.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              The hiring team will review your application and get back to you
              soon.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/")}
                className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
              >
                Browse More Jobs
              </button>
              <button
                onClick={() => navigate(0)}
                className="w-full inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
              >
                Apply to Another Position
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const companyInitials = getCompanyInitials(job?.company);
  const companyColor = stringToColor(job?.company);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors duration-200"
          >
            <FiArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Job Details Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 sticky top-8">
              {/* Company Logo */}
              <div
                className="w-20 h-20 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg mb-4 mx-auto"
                style={{ backgroundColor: companyColor }}
              >
                {companyInitials}
              </div>

              {/* Job Title */}
              <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
                {job?.title}
              </h2>

              {/* Company Name */}
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 mb-4">
                <FiBriefcase className="h-4 w-4" />
                <span className="font-medium">{job?.company}</span>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-3">
                {/* Location */}
                <div className="flex items-center space-x-3 text-sm">
                  <FiMapPin className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                  <span className="text-gray-700">{job?.location}</span>
                </div>

                {/* Job Type */}
                <div className="flex items-center space-x-3 text-sm">
                  <FiClock className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                  <span className="text-gray-700">
                    {getJobTypeLabel(job?.type)}
                  </span>
                </div>

                {/* Salary */}
                <div className="flex items-center space-x-3 text-sm">
                  <FiDollarSign className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                  <span className="text-gray-700">
                    {job?.salaryMin || job?.salaryMax
                      ? formatSalary(
                          job.salaryMin,
                          job.salaryMax,
                          job.salaryCurrency
                        )
                      : "Not specified"}
                  </span>
                </div>

                {/* Posted Date */}
                <div className="flex items-center space-x-3 text-sm">
                  <FiClock className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                  <span className="text-gray-700">
                    Posted {formatDate(job?.createdAt)}
                  </span>
                </div>
              </div>

              {/* Skills */}
              {job?.keywords && job.keywords.length > 0 && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Required Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {job.keywords.map((keyword, index) => (
                      <span
                        key={`${keyword}-${index}`}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* External Apply Link */}
              {job?.applyUrl && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <button
                    onClick={handleExternalApply}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                  >
                    Apply on Company Site
                    <FiExternalLink className="ml-2 h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Application Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Apply for this Position
              </h1>
              <p className="text-gray-600 mb-8">
                Fill out the form below to submit your application. All fields
                marked with * are required.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name */}
                <div>
                  <label
                    htmlFor="fullName"
                    className="flex items-center text-sm font-medium text-gray-700 mb-2"
                  >
                    <FiUser className="mr-2 h-4 w-4 text-indigo-500" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`block w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                      formErrors.fullName
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                    placeholder="John Doe"
                  />
                  {formErrors.fullName && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.fullName}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="flex items-center text-sm font-medium text-gray-700 mb-2"
                  >
                    <FiMail className="mr-2 h-4 w-4 text-indigo-500" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`block w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                      formErrors.email
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                    placeholder="john.doe@example.com"
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.email}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="flex items-center text-sm font-medium text-gray-700 mb-2"
                  >
                    <FiPhone className="mr-2 h-4 w-4 text-indigo-500" />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`block w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                      formErrors.phone
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                    placeholder="+1 (555) 123-4567"
                  />
                  {formErrors.phone && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.phone}
                    </p>
                  )}
                </div>

                {/* LinkedIn (Optional) */}
                <div>
                  <label
                    htmlFor="linkedin"
                    className="flex items-center text-sm font-medium text-gray-700 mb-2"
                  >
                    <FiExternalLink className="mr-2 h-4 w-4 text-indigo-500" />
                    LinkedIn Profile (Optional)
                  </label>
                  <input
                    type="url"
                    id="linkedin"
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleInputChange}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    placeholder="https://linkedin.com/in/johndoe"
                  />
                </div>

                {/* Portfolio (Optional) */}
                <div>
                  <label
                    htmlFor="portfolio"
                    className="flex items-center text-sm font-medium text-gray-700 mb-2"
                  >
                    <FiExternalLink className="mr-2 h-4 w-4 text-indigo-500" />
                    Portfolio/Website (Optional)
                  </label>
                  <input
                    type="url"
                    id="portfolio"
                    name="portfolio"
                    value={formData.portfolio}
                    onChange={handleInputChange}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    placeholder="https://johndoe.com"
                  />
                </div>

                {/* Cover Letter */}
                <div>
                  <label
                    htmlFor="coverLetter"
                    className="flex items-center text-sm font-medium text-gray-700 mb-2"
                  >
                    <FiFileText className="mr-2 h-4 w-4 text-indigo-500" />
                    Cover Letter *
                  </label>
                  <textarea
                    id="coverLetter"
                    name="coverLetter"
                    value={formData.coverLetter}
                    onChange={handleInputChange}
                    rows="6"
                    className={`block w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 resize-none ${
                      formErrors.coverLetter
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                    placeholder="Tell us why you're a great fit for this position..."
                  ></textarea>
                  <div className="flex justify-between items-center mt-1">
                    {formErrors.coverLetter && (
                      <p className="text-sm text-red-600">
                        {formErrors.coverLetter}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 ml-auto">
                      {formData.coverLetter.length} / 500 characters
                    </p>
                  </div>
                </div>

                {/* Resume Upload */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    <FiUpload className="mr-2 h-4 w-4 text-indigo-500" />
                    Resume *
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
                      formErrors.resume
                        ? "border-red-300 bg-red-50"
                        : formData.resume
                        ? "border-green-300 bg-green-50"
                        : "border-gray-300 hover:border-indigo-400 hover:bg-indigo-50"
                    }`}
                  >
                    <input
                      type="file"
                      id="resume"
                      name="resume"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                    />
                    <label
                      htmlFor="resume"
                      className="cursor-pointer block"
                    >
                      <FiUpload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      {formData.resume ? (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-green-700">
                            ✓ {formData.resume.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(formData.resume.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <p className="text-xs text-indigo-600 underline">
                            Click to change file
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">
                            <span className="text-indigo-600 underline">
                              Click to upload
                            </span>{" "}
                            or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">
                            PDF, DOC, or DOCX (max 5MB)
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                  {formErrors.resume && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.resume}
                    </p>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                    <div className="flex items-start">
                      <FiAlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="ml-3 text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex space-x-4 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-semibold rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <FiCheck className="mr-2 h-5 w-5" />
                        Submit Application
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
