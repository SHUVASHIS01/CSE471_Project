import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { jobAPI, achievementAPI } from '../api';
import RecruiterFeedbackForm from './RecruiterFeedbackForm';
import '../styles/Applications.css';

const FILE_BASE_URL = 'http://localhost:5000';

const JobApplications = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [achievementsMap, setAchievementsMap] = useState({});
  const [expandedAchievements, setExpandedAchievements] = useState({});
  const [selectedCandidates, setSelectedCandidates] = useState(new Set());
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const [pendingApplication, setPendingApplication] = useState(null);

  useEffect(() => {
    fetchApplications();
    // Handle replace candidate from comparison page
    const locationState = location.state;
    if (locationState?.replaceCandidateId && locationState?.currentComparisonIds) {
      // Pre-select all except the one to replace
      const idsToSelect = locationState.currentComparisonIds.filter(
        id => id !== locationState.replaceCandidateId
      );
      setSelectedCandidates(new Set(idsToSelect));
    }
  }, [jobId, location]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await jobAPI.getJobApplications(jobId);
      setJob(response.data.job);
      const apps = response.data.applications || [];
      setApplications(apps);
      
      // Fetch achievements for each applicant
      const achievementsPromises = apps.map(async (app) => {
        if (app.applicantId?._id) {
          try {
            const achResponse = await achievementAPI.getPublicAchievements(app.applicantId._id);
            return { applicantId: app.applicantId._id, achievements: achResponse.data.achievements || [] };
          } catch (err) {
            console.error(`Error fetching achievements for applicant ${app.applicantId._id}:`, err);
            return { applicantId: app.applicantId._id, achievements: [] };
          }
        }
        return null;
      });
      
      const achievementsResults = await Promise.all(achievementsPromises);
      const achievementsMapObj = {};
      achievementsResults.forEach(result => {
        if (result) {
          achievementsMapObj[result.applicantId] = result.achievements;
        }
      });
      setAchievementsMap(achievementsMapObj);
    } catch (err) {
      console.error('Error fetching applications:', err);
      alert('Error loading applications');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    if (!newStatus || newStatus === 'default') return;
    
    // For Accepted/Rejected, require feedback first
    if (['Accepted', 'Rejected'].includes(newStatus)) {
      const application = applications.find(app => app._id === appId);
      if (application) {
        setPendingStatusChange(newStatus);
        setPendingApplication(application);
        setShowFeedbackForm(true);
        return;
      }
    }
    
    // For other statuses, update directly
    try {
      await jobAPI.updateApplicationStatus(appId, newStatus);
      await fetchApplications();
      alert('Application status updated successfully');
    } catch (err) {
      console.error('Error updating status:', err);
      if (err?.response?.data?.requiresFeedback) {
        alert('Feedback is required before changing status to Accepted or Rejected');
      } else {
        alert('Error updating status');
      }
    }
  };

  const handleFeedbackSubmitted = async () => {
    setShowFeedbackForm(false);
    
    // Now update the status after feedback is submitted
    if (pendingStatusChange && pendingApplication) {
      try {
        await jobAPI.updateApplicationStatus(pendingApplication._id, pendingStatusChange);
        await fetchApplications();
        alert('Application status updated successfully');
      } catch (err) {
        console.error('Error updating status after feedback:', err);
        alert('Error updating status');
      }
    }
    
    setPendingStatusChange(null);
    setPendingApplication(null);
  };

  const handleFeedbackCancel = () => {
    setShowFeedbackForm(false);
    setPendingStatusChange(null);
    setPendingApplication(null);
  };

  const getFileUrl = (relativePath) => {
    if (!relativePath) return '';
    if (relativePath.startsWith('http')) return relativePath;
    return `${FILE_BASE_URL}${relativePath}`;
  };

  const filteredApplications = applications.filter(app => {
    if (filter === 'All') return true;
    return app.status === filter;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Accepted': return 'status-badge status-accepted';
      case 'Rejected': return 'status-badge status-rejected';
      case 'Reviewed': return 'status-badge status-reviewed';
      default: return 'status-badge status-applied';
    }
  };

  const statusCounts = {
    All: applications.length,
    Applied: applications.filter(app => app.status === 'Applied').length,
    Reviewed: applications.filter(app => app.status === 'Reviewed').length,
    Accepted: applications.filter(app => app.status === 'Accepted').length,
    Rejected: applications.filter(app => app.status === 'Rejected').length
  };

  const handleToggleSelection = (applicationId) => {
    setSelectedCandidates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(applicationId)) {
        newSet.delete(applicationId);
      } else {
        if (newSet.size >= 4) {
          alert('You can compare up to 4 candidates at a time');
          return prev;
        }
        newSet.add(applicationId);
      }
      return newSet;
    });
  };

  const handleCompareSelected = () => {
    if (selectedCandidates.size === 0) {
      alert('Please select at least one candidate to compare');
      return;
    }
    if (selectedCandidates.size > 4) {
      alert('You can compare up to 4 candidates at a time');
      return;
    }
    
    // If replacing a candidate, remove the old one and add new selections
    const locationState = location.state;
    let finalCandidateIds = Array.from(selectedCandidates);
    
    if (locationState?.replaceCandidateId && locationState?.currentComparisonIds) {
      // Remove the candidate being replaced and add new selections
      const idsWithoutReplaced = locationState.currentComparisonIds.filter(
        id => id !== locationState.replaceCandidateId
      );
      // Combine with newly selected candidates (avoid duplicates)
      const allIds = [...idsWithoutReplaced, ...finalCandidateIds];
      finalCandidateIds = [...new Set(allIds)].slice(0, 4); // Max 4 candidates
    }
    
    navigate(`/job/${jobId}/compare`, {
      state: { candidateIds: finalCandidateIds }
    });
  };

  const handleSelectAll = () => {
    if (filteredApplications.length === 0) return;
    const maxSelect = Math.min(4, filteredApplications.length);
    const newSelection = new Set(
      filteredApplications.slice(0, maxSelect).map(app => app._id)
    );
    setSelectedCandidates(newSelection);
  };

  const handleClearSelection = () => {
    setSelectedCandidates(new Set());
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="applications-container">
      <button onClick={() => navigate('/recruiter/dashboard')} className="btn-back">
        ← Back to Dashboard
      </button>

      <div className="applications-content">
        <div className="applications-header">
          <div>
            <h2>Applications for: {job?.title}</h2>
            <p className="job-company">{job?.company} • {job?.location}</p>
          </div>
        </div>

        <div className="applications-stats">
          <div className="stat-card">
            <div className="stat-number">{statusCounts.All}</div>
            <div className="stat-label">Total Applications</div>
          </div>
          <div className="stat-card stat-accepted">
            <div className="stat-number">{statusCounts.Accepted}</div>
            <div className="stat-label">Accepted</div>
          </div>
          <div className="stat-card stat-rejected">
            <div className="stat-number">{statusCounts.Rejected}</div>
            <div className="stat-label">Rejected</div>
          </div>
          <div className="stat-card stat-reviewed">
            <div className="stat-number">{statusCounts.Reviewed}</div>
            <div className="stat-label">Reviewed</div>
          </div>
          <div className="stat-card stat-applied">
            <div className="stat-number">{statusCounts.Applied}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>

        <div className="applications-filters">
          <div className="filters-left">
            {['All', 'Applied', 'Reviewed', 'Accepted', 'Rejected'].map(status => (
              <button
                key={status}
                className={`filter-btn ${filter === status ? 'active' : ''}`}
                onClick={() => setFilter(status)}
              >
                {status} ({statusCounts[status]})
              </button>
            ))}
          </div>
          <div className="comparison-controls-bar">
            <div className="selection-info">
              <span className="selection-count">
                {selectedCandidates.size} selected (max 4)
              </span>
              <button
                className="btn-select-all"
                onClick={handleSelectAll}
                disabled={filteredApplications.length === 0}
              >
                Select All
              </button>
              <button
                className="btn-clear-selection"
                onClick={handleClearSelection}
                disabled={selectedCandidates.size === 0}
              >
                Clear
              </button>
            </div>
            <button
              className="btn-compare-candidates"
              onClick={handleCompareSelected}
              disabled={selectedCandidates.size === 0}
            >
              🔍 Compare Selected ({selectedCandidates.size})
            </button>
          </div>
        </div>

        {filteredApplications.length === 0 ? (
          <p className="no-applications">No applications found for this filter</p>
        ) : (
          <div className="applications-list">
            {filteredApplications.map((application) => (
              <div 
                key={application._id} 
                className={`application-card ${selectedCandidates.has(application._id) ? 'selected' : ''}`}
              >
                <div className="application-main">
                  <div className="applicant-details">
                    <div className="applicant-header">
                      <div className="selection-checkbox-wrapper">
                        <input
                          type="checkbox"
                          checked={selectedCandidates.has(application._id)}
                          onChange={() => handleToggleSelection(application._id)}
                          className="candidate-checkbox"
                          disabled={!selectedCandidates.has(application._id) && selectedCandidates.size >= 4}
                        />
                      </div>
                      <div className="applicant-header-content">
                        <h3>{application.applicantId?.name || 'Unknown'}</h3>
                        <span className={getStatusBadgeClass(application.status)}>
                          {application.status}
                        </span>
                      </div>
                    </div>
                    <p className="applicant-email">📧 {application.applicantId?.email}</p>
                    {application.applicantId?.phone && (
                      <p className="applicant-phone">📱 {application.applicantId.phone}</p>
                    )}
                    <p className="application-date">
                      Applied on: {new Date(application.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="application-info">
                    {application.experience && (
                      <div className="info-item">
                        <strong>Experience:</strong> {application.experience}
                      </div>
                    )}
                    {application.skills && application.skills.length > 0 && (
                      <div className="info-item">
                        <strong>Skills:</strong>
                        <div className="skills-tags">
                          {application.skills.map((skill, idx) => (
                            <span key={idx} className="skill-tag">{skill}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {application.coverLetter && (
                      <div className="info-item">
                        <strong>Cover Letter:</strong>
                        <p className="cover-letter">{application.coverLetter}</p>
                      </div>
                    )}
                    {application.resume && (
                      <div className="info-item">
                        <strong>Resume:</strong>
                        <a 
                          href={`${FILE_BASE_URL}/api/jobs/application/${application._id}/resume`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="resume-link"
                        >
                          📄 View Resume
                        </a>
                      </div>
                    )}
                    
                    {/* Public Achievements Section */}
                    {application.applicantId?._id && achievementsMap[application.applicantId._id]?.length > 0 && (
                      <div className="info-item achievements-section">
                        <div className="achievements-header-section">
                          <strong>🏆 Public Achievements ({achievementsMap[application.applicantId._id].length})</strong>
                          <button
                            className="toggle-achievements-btn"
                            onClick={() => setExpandedAchievements(prev => ({
                              ...prev,
                              [application._id]: !prev[application._id]
                            }))}
                          >
                            {expandedAchievements[application._id] ? '▼ Hide' : '▶ Show'}
                          </button>
                        </div>
                        {expandedAchievements[application._id] && (
                          <div className="applicant-achievements-list">
                            {achievementsMap[application.applicantId._id].map((achievement) => (
                              <div key={achievement._id} className="applicant-achievement-item">
                                <div className="achievement-item-header">
                                  <span className="achievement-category-badge-small">
                                    {achievement.category === 'certification' && '🎓'}
                                    {achievement.category === 'award' && '🏅'}
                                    {achievement.category === 'project' && '💼'}
                                    {achievement.category === 'education' && '📚'}
                                    {achievement.category === 'competition' && '🥇'}
                                    {achievement.category === 'publication' && '📄'}
                                    {!['certification', 'award', 'project', 'education', 'competition', 'publication'].includes(achievement.category) && '⭐'}
                                    {' '}
                                    {achievement.category}
                                  </span>
                                  {achievement.isFeatured && <span className="featured-badge-small">⭐ Featured</span>}
                                </div>
                                <h4 className="achievement-item-title">{achievement.title}</h4>
                                {achievement.issuer && (
                                  <p className="achievement-item-issuer">Issued by: {achievement.issuer}</p>
                                )}
                                <p className="achievement-item-date">
                                  {new Date(achievement.dateAchieved).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                                {achievement.description && (
                                  <p className="achievement-item-description">{achievement.description}</p>
                                )}
                                {achievement.skills && achievement.skills.length > 0 && (
                                  <div className="achievement-item-skills">
                                    {achievement.skills.map((skill, idx) => (
                                      <span key={idx} className="skill-tag-small">{skill}</span>
                                    ))}
                                  </div>
                                )}
                                {achievement.proofUrl && (
                                  <a 
                                    href={achievement.proofUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="proof-link-small"
                                  >
                                    View Proof →
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="application-actions">
                  <select 
                    className="status-select"
                    value={application.status}
                    onChange={(e) => handleStatusChange(application._id, e.target.value)}
                  >
                    <option value="default">Change Status</option>
                    <option value="Applied">Applied</option>
                    <option value="Reviewed">Reviewed</option>
                    <option value="Accepted">Accept</option>
                    <option value="Rejected">Reject</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showFeedbackForm && pendingApplication && (
        <RecruiterFeedbackForm
          applicationId={pendingApplication._id}
          jobTitle={job?.title || 'Job'}
          applicantName={pendingApplication.applicantId?.name || 'Applicant'}
          onSuccess={handleFeedbackSubmitted}
          onCancel={handleFeedbackCancel}
        />
      )}
    </div>
  );
};

export default JobApplications;
