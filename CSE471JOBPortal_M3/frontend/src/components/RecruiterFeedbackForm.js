import React, { useState } from 'react';
import { jobAPI } from '../api';
import '../styles/FeedbackForm.css';

const RecruiterFeedbackForm = ({ applicationId, jobTitle, applicantName, onSuccess, onCancel }) => {
  const [ratings, setRatings] = useState({
    communicationSkills: 0,
    technicalCompetency: 0,
    interviewPreparedness: 0,
    professionalBehavior: 0,
    overallSuitability: 0
  });
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
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
    const requiredFields = ['communicationSkills', 'technicalCompetency', 'interviewPreparedness', 'professionalBehavior', 'overallSuitability'];
    const missingFields = requiredFields.filter(field => !ratings[field] || ratings[field] < 1 || ratings[field] > 5);
    
    if (missingFields.length > 0) {
      setError('Please provide all ratings (1-5 scale)');
      return;
    }

    setSubmitting(true);
    try {
      await jobAPI.submitRecruiterFeedback(applicationId, {
        ratings,
        strengths: strengths.trim(),
        improvements: improvements.trim()
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
          <p className="feedback-subtitle">Feedback is required before changing application status</p>
        </div>

        <form onSubmit={handleSubmit} className="feedback-form">
          <div className="feedback-info">
            <p><strong>Job:</strong> {jobTitle}</p>
            <p><strong>Applicant:</strong> {applicantName}</p>
            <p className="anonymous-note">🔒 Your feedback will be anonymous</p>
          </div>

          <div className="ratings-section">
            <h3>Rate the Applicant (1-5 scale)</h3>
            
            <StarRating
              value={ratings.communicationSkills}
              onChange={(value) => handleRatingChange('communicationSkills', value)}
              label="Communication Skills"
            />
            
            <StarRating
              value={ratings.technicalCompetency}
              onChange={(value) => handleRatingChange('technicalCompetency', value)}
              label="Technical/Role-Related Competency"
            />
            
            <StarRating
              value={ratings.interviewPreparedness}
              onChange={(value) => handleRatingChange('interviewPreparedness', value)}
              label="Interview Preparedness"
            />
            
            <StarRating
              value={ratings.professionalBehavior}
              onChange={(value) => handleRatingChange('professionalBehavior', value)}
              label="Professional Behavior"
            />
            
            <StarRating
              value={ratings.overallSuitability}
              onChange={(value) => handleRatingChange('overallSuitability', value)}
              label="Overall Suitability for the Role"
            />
          </div>

          <div className="text-feedback-section">
            <h3>Additional Feedback (Optional)</h3>
            
            <div className="form-group">
              <label htmlFor="strengths">What were the applicant's strengths?</label>
              <textarea
                id="strengths"
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                placeholder="Describe the applicant's strengths..."
                rows={4}
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="improvements">What areas could the applicant improve?</label>
              <textarea
                id="improvements"
                value={improvements}
                onChange={(e) => setImprovements(e.target.value)}
                placeholder="Suggest areas for improvement..."
                rows={4}
                disabled={submitting}
              />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="feedback-form-actions">
            <button
              type="button"
              onClick={onCancel}
              className="btn-cancel"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecruiterFeedbackForm;

