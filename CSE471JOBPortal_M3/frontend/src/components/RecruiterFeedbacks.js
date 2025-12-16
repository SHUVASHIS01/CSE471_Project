import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobAPI } from '../api';
import '../styles/FeedbackView.css';

const RecruiterFeedbacks = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [feedbacksData, setFeedbacksData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await jobAPI.getRecruiterFeedbacks();
      setFeedbacksData(response.data);
    } catch (err) {
      console.error('Error loading feedbacks:', err);
      setError(err?.response?.data?.message || 'Error loading feedbacks');
    } finally {
      setLoading(false);
    }
  };

  const getRatingLabel = (rating) => {
    const labels = {
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return labels[rating] || 'N/A';
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return '#4caf50';
    if (rating >= 3) return '#ff9800';
    return '#f44336';
  };

  if (loading) {
    return (
      <div className="feedback-view-container">
        <div className="loading">Loading feedbacks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="feedback-view-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/recruiter/dashboard')} className="btn-primary">
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!feedbacksData || !feedbacksData.feedbacks || feedbacksData.feedbacks.length === 0) {
    return (
      <div className="feedback-view-container">
        <button onClick={() => navigate('/recruiter/dashboard')} className="btn-back">
          ← Back to Dashboard
        </button>
        <div className="feedback-view-header">
          <h2>Feedback from Applicants</h2>
        </div>
        <div className="no-feedbacks">
          <p>No applicant feedbacks available yet.</p>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
            Feedbacks will appear here once applicants submit their reviews.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-view-container">
      <button onClick={() => navigate('/recruiter/dashboard')} className="btn-back">
        ← Back to Dashboard
      </button>
      
      <div className="feedback-view-header">
        <h2>Feedback from Applicants</h2>
        <div className="feedback-stats">
          <span className="stat-badge">
            Total: {feedbacksData.totalCount}
          </span>
        </div>
      </div>

      <div className="feedbacks-list">
        {feedbacksData.feedbacks.map((item, index) => (
          <div 
            key={index} 
            className="feedback-card"
          >
            <div className="feedback-job-info">
              <h3>{item.job.title}</h3>
              <p className="job-company">{item.job.company}</p>
            </div>

            <div className="feedback-ratings">
              <h4>Ratings</h4>
              <div className="ratings-grid">
                <div className="rating-item">
                  <span className="rating-label">Job Information Clarity:</span>
                  <span 
                    className="rating-value"
                    style={{ color: getRatingColor(item.feedback.ratings.jobInfoClarity) }}
                  >
                    {item.feedback.ratings.jobInfoClarity}/5 - {getRatingLabel(item.feedback.ratings.jobInfoClarity)}
                  </span>
                </div>
                <div className="rating-item">
                  <span className="rating-label">Recruiter Communication:</span>
                  <span 
                    className="rating-value"
                    style={{ color: getRatingColor(item.feedback.ratings.recruiterCommunication) }}
                  >
                    {item.feedback.ratings.recruiterCommunication}/5 - {getRatingLabel(item.feedback.ratings.recruiterCommunication)}
                  </span>
                </div>
                <div className="rating-item">
                  <span className="rating-label">Interview Organization:</span>
                  <span 
                    className="rating-value"
                    style={{ color: getRatingColor(item.feedback.ratings.interviewOrganization) }}
                  >
                    {item.feedback.ratings.interviewOrganization}/5 - {getRatingLabel(item.feedback.ratings.interviewOrganization)}
                  </span>
                </div>
                <div className="rating-item">
                  <span className="rating-label">Process Professionalism:</span>
                  <span 
                    className="rating-value"
                    style={{ color: getRatingColor(item.feedback.ratings.processProfessionalism) }}
                  >
                    {item.feedback.ratings.processProfessionalism}/5 - {getRatingLabel(item.feedback.ratings.processProfessionalism)}
                  </span>
                </div>
                <div className="rating-item">
                  <span className="rating-label">Overall Experience:</span>
                  <span 
                    className="rating-value"
                    style={{ color: getRatingColor(item.feedback.ratings.overallExperience) }}
                  >
                    {item.feedback.ratings.overallExperience}/5 - {getRatingLabel(item.feedback.ratings.overallExperience)}
                  </span>
                </div>
              </div>
            </div>

            {item.feedback.whatWorkedWell && (
              <div className="feedback-text">
                <h4>What Worked Well:</h4>
                <p>{item.feedback.whatWorkedWell}</p>
              </div>
            )}

            {item.feedback.whatCouldImprove && (
              <div className="feedback-text">
                <h4>What Could Be Improved:</h4>
                <p>{item.feedback.whatCouldImprove}</p>
              </div>
            )}

            <div className="feedback-footer">
              <span className="feedback-date">
                Submitted: {new Date(item.feedback.submittedAt).toLocaleString()}
              </span>
              <span className="anonymous-badge">Anonymous Feedback</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecruiterFeedbacks;

