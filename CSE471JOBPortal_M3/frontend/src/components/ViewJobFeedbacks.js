import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobAPI } from '../api';
import '../styles/FeedbackView.css';

const ViewJobFeedbacks = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [feedbacksData, setFeedbacksData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFeedbacks();
  }, [jobId]);

  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await jobAPI.getJobFeedbacks(jobId);
      setFeedbacksData(response.data);
    } catch (err) {
      console.error('Error loading feedbacks:', err);
      setError(err?.response?.data?.message || 'Error loading feedbacks');
    } finally {
      setLoading(false);
    }
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
        <button onClick={() => navigate(`/job/${jobId}/applications`)} className="btn-primary">
          Back to Applications
        </button>
      </div>
    );
  }

  if (!feedbacksData || !feedbacksData.feedbacks || feedbacksData.feedbacks.length === 0) {
    return (
      <div className="feedback-view-container">
        <div className="feedback-view-header">
          <h1>📝 All Applicant Feedbacks</h1>
          <button 
            onClick={() => navigate(`/job/${jobId}/applications`)} 
            className="btn-primary"
          >
            Back to Applications
          </button>
        </div>
        <div className="no-feedbacks">
          <p>No feedbacks have been submitted yet for this job.</p>
        </div>
      </div>
    );
  }

  const { job, feedbacks, totalCount } = feedbacksData;

  return (
    <div className="feedback-view-container">
      <div className="feedback-view-header">
        <h1>📝 All Applicant Feedbacks</h1>
        <div className="feedback-view-actions">
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
            <span>🔒 All Feedbacks Are Anonymous</span>
            <p>Applicant identities are hidden for privacy</p>
          </div>
          <div className="feedback-count">
            <strong>{totalCount}</strong> {totalCount === 1 ? 'feedback' : 'feedbacks'} received
          </div>
        </div>

        <div className="feedbacks-list">
          {feedbacks.map((item, index) => {
            const { feedback } = item;
            const ratings = feedback.ratings || {};
            
            return (
              <div key={index} className="feedback-card">
                <div className="feedback-header">
                  <h3>Feedback #{index + 1}</h3>
                  <span className="feedback-date">
                    {new Date(feedback.submittedAt).toLocaleString()}
                  </span>
                </div>

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

                {feedback.whatWorkedWell && (
                  <div className="feedback-text-section">
                    <h4>What Worked Well</h4>
                    <p>{feedback.whatWorkedWell}</p>
                  </div>
                )}

                {feedback.whatCouldImprove && (
                  <div className="feedback-text-section">
                    <h4>What Could Be Improved</h4>
                    <p>{feedback.whatCouldImprove}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ViewJobFeedbacks;

