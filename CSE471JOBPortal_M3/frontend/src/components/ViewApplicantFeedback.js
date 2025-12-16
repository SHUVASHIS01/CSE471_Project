import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobAPI } from '../api';
import '../styles/FeedbackView.css';

const ViewApplicantFeedback = () => {
  const { jobId, applicationId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [feedbackData, setFeedbackData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFeedback();
  }, [jobId, applicationId]);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const response = await jobAPI.getApplicantFeedback(jobId, applicationId);
      setFeedbackData(response.data);
    } catch (err) {
      console.error('Error loading feedback:', err);
      setError(err?.response?.data?.message || 'Error loading feedback');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="feedback-view-container">
        <div className="loading">Loading feedback...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="feedback-view-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate(`/job/${jobId}/applications`)} className="btn-primary">
          Back to Applications
        </button>
      </div>
    );
  }

  if (!feedbackData) {
    return (
      <div className="feedback-view-container">
        <div className="error-message">Feedback not found</div>
        <button onClick={() => navigate(`/job/${jobId}/applications`)} className="btn-primary">
          Back to Applications
        </button>
      </div>
    );
  }

  const { job, feedback } = feedbackData;
  const ratings = feedback.ratings || {};

  return (
    <div className="feedback-view-container">
      <div className="feedback-view-header">
        <h1>📝 Applicant Feedback</h1>
        <div className="feedback-view-actions">
          <button 
            onClick={() => navigate(`/job/${jobId}/feedbacks`)} 
            className="btn-secondary"
          >
            View All Feedbacks
          </button>
          <button 
            onClick={() => navigate(`/job/${jobId}/applications`)} 
            className="btn-primary"
          >
            Back to Applications
          </button>
        </div>
      </div>

      <div className="feedback-view-content">
        <div className="job-info-card">
          <h2>{job.title}</h2>
          <p className="company-name">{job.company}</p>
          <div className="anonymous-badge">
            <span>🔒 Anonymous Feedback</span>
            <p>Applicant identity is hidden for privacy</p>
          </div>
        </div>

        <div className="feedback-card">
          <h3>Feedback Ratings</h3>
          <div className="ratings-grid">
            <div className="rating-item">
              <label>Job Information Clarity</label>
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map(star => (
                  <span key={star} className={star <= (ratings.jobInfoClarity || 0) ? 'star-filled' : 'star-empty'}>
                    ★
                  </span>
                ))}
                <span className="rating-value">({ratings.jobInfoClarity || 0}/5)</span>
              </div>
            </div>
            <div className="rating-item">
              <label>Recruiter Communication</label>
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map(star => (
                  <span key={star} className={star <= (ratings.recruiterCommunication || 0) ? 'star-filled' : 'star-empty'}>
                    ★
                  </span>
                ))}
                <span className="rating-value">({ratings.recruiterCommunication || 0}/5)</span>
              </div>
            </div>
            <div className="rating-item">
              <label>Interview Organization</label>
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map(star => (
                  <span key={star} className={star <= (ratings.interviewOrganization || 0) ? 'star-filled' : 'star-empty'}>
                    ★
                  </span>
                ))}
                <span className="rating-value">({ratings.interviewOrganization || 0}/5)</span>
              </div>
            </div>
            <div className="rating-item">
              <label>Process Professionalism</label>
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map(star => (
                  <span key={star} className={star <= (ratings.processProfessionalism || 0) ? 'star-filled' : 'star-empty'}>
                    ★
                  </span>
                ))}
                <span className="rating-value">({ratings.processProfessionalism || 0}/5)</span>
              </div>
            </div>
            <div className="rating-item">
              <label>Overall Experience</label>
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map(star => (
                  <span key={star} className={star <= (ratings.overallExperience || 0) ? 'star-filled' : 'star-empty'}>
                    ★
                  </span>
                ))}
                <span className="rating-value">({ratings.overallExperience || 0}/5)</span>
              </div>
            </div>
          </div>
        </div>

        {feedback.whatWorkedWell && (
          <div className="feedback-text-card">
            <h3>What Worked Well</h3>
            <p>{feedback.whatWorkedWell}</p>
          </div>
        )}

        {feedback.whatCouldImprove && (
          <div className="feedback-text-card">
            <h3>What Could Be Improved</h3>
            <p>{feedback.whatCouldImprove}</p>
          </div>
        )}

        <div className="feedback-meta">
          <p>Submitted: {new Date(feedback.submittedAt).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default ViewApplicantFeedback;

