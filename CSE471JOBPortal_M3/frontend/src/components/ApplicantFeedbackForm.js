import React, { useState } from 'react';
import { jobAPI } from '../api';
import '../styles/FeedbackForm.css';

const ApplicantFeedbackForm = ({ applicationId, jobTitle, companyName, onSuccess, onCancel }) => {
  const [ratings, setRatings] = useState({
    jobInfoClarity: 0,
    recruiterCommunication: 0,
    interviewOrganization: 0,
    processProfessionalism: 0,
    overallExperience: 0
  });
  const [whatWorkedWell, setWhatWorkedWell] = useState('');
  const [whatCouldImprove, setWhatCouldImprove] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleRatingChange = (field, value) => {
    setRatings(prev => ({
      ...prev,
      [field]: parseInt(value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate all ratings are provided
    const requiredFields = ['jobInfoClarity', 'recruiterCommunication', 'interviewOrganization', 'processProfessionalism', 'overallExperience'];
    const missingFields = requiredFields.filter(field => !ratings[field] || ratings[field] < 1 || ratings[field] > 5);
    
    if (missingFields.length > 0) {
      setError('Please provide all ratings (1-5 scale)');
      return;
    }

    setSubmitting(true);
    try {
      await jobAPI.submitApplicantFeedback(applicationId, {
        ratings,
        whatWorkedWell: whatWorkedWell.trim(),
        whatCouldImprove: whatCouldImprove.trim()
      });
      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.message || 'Error submitting feedback. Please try again.');
      console.error('Error submitting feedback:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange, label }) => (
    <div className="rating-field">
      <label className="rating-label">
        {label} <span className="required">*</span>
      </label>
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            className={`star ${value >= star ? 'filled' : ''}`}
            onClick={() => onChange(star)}
            disabled={submitting}
          >
            ★
          </button>
        ))}
        <span className="rating-value">{value > 0 ? `${value}/5` : ''}</span>
      </div>
    </div>
  );

  return (
    <div className="feedback-form-overlay">
      <div className="feedback-form-modal">
        <div className="feedback-form-header">
          <h2>📝 Provide Feedback</h2>
          <p className="feedback-subtitle">Your feedback is required to view the application decision</p>
        </div>

        <form onSubmit={handleSubmit} className="feedback-form">
          <div className="feedback-info">
            <p><strong>Job:</strong> {jobTitle}</p>
            <p><strong>Company:</strong> {companyName}</p>
            <p className="anonymous-note">🔒 Your feedback will be anonymous</p>
            <p className="unlock-note">💡 After submitting, you'll be able to view the application decision and recruiter's review</p>
          </div>

          <div className="ratings-section">
            <h3>Rate the Recruitment Process (1-5 scale)</h3>
            
            <StarRating
              value={ratings.jobInfoClarity}
              onChange={(value) => handleRatingChange('jobInfoClarity', value)}
              label="Clarity of Job Information"
            />
            
            <StarRating
              value={ratings.recruiterCommunication}
              onChange={(value) => handleRatingChange('recruiterCommunication', value)}
              label="Communication from Recruiter/Company"
            />
            
            <StarRating
              value={ratings.interviewOrganization}
              onChange={(value) => handleRatingChange('interviewOrganization', value)}
              label="Interview Organization and Scheduling"
            />
            
            <StarRating
              value={ratings.processProfessionalism}
              onChange={(value) => handleRatingChange('processProfessionalism', value)}
              label="Professionalism of Recruitment Process"
            />
            
            <StarRating
              value={ratings.overallExperience}
              onChange={(value) => handleRatingChange('overallExperience', value)}
              label="Overall Recruitment Experience"
            />
          </div>

          <div className="text-feedback-section">
            <h3>Additional Feedback (Optional)</h3>
            
            <div className="form-group">
              <label htmlFor="whatWorkedWell">What aspects of the recruitment process worked well?</label>
              <textarea
                id="whatWorkedWell"
                value={whatWorkedWell}
                onChange={(e) => setWhatWorkedWell(e.target.value)}
                placeholder="Describe what worked well..."
                rows={4}
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="whatCouldImprove">What could be improved in the recruitment process?</label>
              <textarea
                id="whatCouldImprove"
                value={whatCouldImprove}
                onChange={(e) => setWhatCouldImprove(e.target.value)}
                placeholder="Suggest improvements..."
                rows={4}
                disabled={submitting}
              />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="feedback-form-actions">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="btn-cancel"
                disabled={submitting}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="btn-submit"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Feedback & Unlock Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicantFeedbackForm;

