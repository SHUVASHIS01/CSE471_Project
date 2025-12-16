import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { jobAPI } from '../api';
import '../styles/CandidateComparison.css';

const FILE_BASE_URL = 'http://localhost:5000';

const CandidateComparison = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [job, setJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('compatibility'); // 'compatibility', 'name', 'experience'
  const [highlightBest, setHighlightBest] = useState(true);

  // Get candidate IDs from location state
  const [candidateIds, setCandidateIds] = useState([]);

  useEffect(() => {
    const state = location.state;
    if (state?.candidateIds && Array.isArray(state.candidateIds)) {
      setCandidateIds(state.candidateIds);
    } else {
      alert('No candidates selected for comparison');
      navigate(`/job/${jobId}/applications`);
      return;
    }
  }, [location.state, jobId, navigate]);

  useEffect(() => {
    if (candidateIds.length === 0) return;
    fetchComparisonData();
  }, [jobId, candidateIds]);

  const fetchComparisonData = async () => {
    setLoading(true);
    try {
      const response = await jobAPI.compareCandidates(jobId, candidateIds);
      setJob(response.data.job);
      setCandidates(response.data.candidates);
    } catch (err) {
      console.error('Error fetching comparison data:', err);
      alert(err?.response?.data?.message || 'Error loading comparison data');
      navigate(`/job/${jobId}/applications`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCandidate = (applicationId) => {
    const newCandidateIds = candidateIds.filter(id => id !== applicationId);
    if (newCandidateIds.length === 0) {
      alert('At least one candidate must remain in the comparison');
      return;
    }
    setCandidateIds(newCandidateIds);
  };

  const handleReplaceCandidate = (applicationId) => {
    navigate(`/job/${jobId}/applications`, {
      state: { 
        replaceCandidateId: applicationId,
        currentComparisonIds: candidateIds
      }
    });
  };

  const sortedCandidates = [...candidates].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'experience':
        return b.yearsOfExperience - a.yearsOfExperience;
      case 'compatibility':
      default:
        return b.compatibilityScore - a.compatibilityScore;
    }
  });

  const bestCandidate = candidates.length > 0 
    ? candidates.reduce((best, current) => 
        current.compatibilityScore > best.compatibilityScore ? current : best
      )
    : null;

  const getFileUrl = (relativePath) => {
    if (!relativePath) return '';
    if (relativePath.startsWith('http')) return relativePath;
    // Ensure path starts with / for proper URL construction
    const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    return `${FILE_BASE_URL}${path}`;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  if (loading) {
    return (
      <div className="comparison-container">
        <div className="loading">Loading comparison data...</div>
      </div>
    );
  }

  return (
    <div className="comparison-container">
      <div className="comparison-header">
        <button 
          onClick={() => navigate(`/job/${jobId}/applications`)} 
          className="btn-back"
        >
          ← Back to Applications
        </button>
        <div className="header-content">
          <h1>Candidate Comparison</h1>
          <div className="job-info-header">
            <h2>{job?.title}</h2>
            <p>{job?.company} • {job?.location}</p>
          </div>
        </div>
      </div>

      <div className="comparison-controls">
        <div className="control-group">
          <label>Sort by:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="compatibility">Compatibility Score</option>
            <option value="name">Name</option>
            <option value="experience">Experience</option>
          </select>
        </div>
        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={highlightBest}
              onChange={(e) => setHighlightBest(e.target.checked)}
            />
            Highlight Best Match
          </label>
        </div>
      </div>

      {sortedCandidates.length === 0 ? (
        <div className="no-candidates">No candidates to compare</div>
      ) : (
        <div className="comparison-table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th className="metric-column">Metric</th>
                {sortedCandidates.map((candidate, idx) => (
                  <th 
                    key={candidate.applicationId} 
                    className={`candidate-column ${highlightBest && candidate === bestCandidate ? 'best-match' : ''}`}
                  >
                    <div className="candidate-header">
                      <div className="candidate-avatar">
                        {candidate.avatarUrl ? (
                          <img src={candidate.avatarUrl} alt={candidate.name} />
                        ) : (
                          <div className="avatar-placeholder">
                            {candidate.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="candidate-name-info">
                        <h3>{candidate.name}</h3>
                        <p className="candidate-email">{candidate.email}</p>
                        {highlightBest && candidate === bestCandidate && (
                          <span className="best-match-badge">⭐ Best Match</span>
                        )}
                      </div>
                      <div className="candidate-actions">
                        <button
                          className="btn-remove"
                          onClick={() => handleRemoveCandidate(candidate.applicationId)}
                          title="Remove from comparison"
                        >
                          ✕
                        </button>
                        <button
                          className="btn-replace"
                          onClick={() => handleReplaceCandidate(candidate.applicationId)}
                          title="Replace candidate"
                        >
                          🔄
                        </button>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Compatibility Score */}
              <tr className="metric-row">
                <td className="metric-label">
                  <strong>Compatibility Score</strong>
                </td>
                {sortedCandidates.map(candidate => (
                  <td key={candidate.applicationId} className="metric-value">
                    <div 
                      className="score-circle"
                      style={{ 
                        borderColor: getScoreColor(candidate.compatibilityScore),
                        color: getScoreColor(candidate.compatibilityScore)
                      }}
                    >
                      {candidate.compatibilityScore}%
                    </div>
                    <div className="score-breakdown">
                      <small>
                        Skills: {candidate.skillMatchPercentage}% • 
                        Experience: {candidate.experienceRelevance}% • 
                        Role Match: {candidate.pastRoleSimilarity}%
                      </small>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Core Skills */}
              <tr className="metric-row">
                <td className="metric-label">
                  <strong>Core Skills</strong>
                  <br />
                  <small className="metric-hint">
                    Required: {job?.requiredSkills?.join(', ') || 'None specified'}
                  </small>
                </td>
                {sortedCandidates.map(candidate => (
                  <td key={candidate.applicationId} className="metric-value">
                    <div className="skills-section">
                      <div className="matched-skills">
                        <strong>Matched ({candidate.matchedSkills.length}/{job?.requiredSkills?.length || 0}):</strong>
                        <div className="skills-tags">
                          {candidate.matchedSkills.length > 0 ? (
                            candidate.matchedSkills.map((skill, idx) => (
                              <span key={idx} className="skill-tag matched">✓ {skill}</span>
                            ))
                          ) : (
                            <span className="no-skills">None</span>
                          )}
                        </div>
                      </div>
                      {candidate.unmatchedSkills.length > 0 && (
                        <div className="unmatched-skills">
                          <strong>Missing:</strong>
                          <div className="skills-tags">
                            {candidate.unmatchedSkills.map((skill, idx) => (
                              <span key={idx} className="skill-tag unmatched">✗ {skill}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="all-skills">
                        <strong>All Skills:</strong>
                        <div className="skills-tags">
                          {candidate.skills.length > 0 ? (
                            candidate.skills.map((skill, idx) => (
                              <span key={idx} className="skill-tag">{skill}</span>
                            ))
                          ) : (
                            <span className="no-skills">None listed</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Years of Experience */}
              <tr className="metric-row">
                <td className="metric-label">
                  <strong>Years of Experience</strong>
                  <br />
                  <small className="metric-hint">
                    Required: {job?.experienceRequirement || 'Not specified'}
                  </small>
                </td>
                {sortedCandidates.map(candidate => (
                  <td key={candidate.applicationId} className="metric-value">
                    <div className="experience-display">
                      <span className="experience-years">{candidate.yearsOfExperience} years</span>
                      <span className="experience-detail">({candidate.experienceString})</span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Education Level */}
              <tr className="metric-row">
                <td className="metric-label">
                  <strong>Education Level</strong>
                </td>
                {sortedCandidates.map(candidate => (
                  <td key={candidate.applicationId} className="metric-value">
                    <div className="education-display">
                      <span className="education-level">{candidate.educationLevel}</span>
                      {candidate.education.length > 0 && (
                        <div className="education-details">
                          {candidate.education.slice(0, 2).map((edu, idx) => (
                            <div key={idx} className="education-item">
                              <strong>{edu.title}</strong>
                              {edu.issuer && <span> from {edu.issuer}</span>}
                            </div>
                          ))}
                          {candidate.education.length > 2 && (
                            <small>+{candidate.education.length - 2} more</small>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Certifications */}
              <tr className="metric-row">
                <td className="metric-label">
                  <strong>Relevant Certifications</strong>
                </td>
                {sortedCandidates.map(candidate => (
                  <td key={candidate.applicationId} className="metric-value">
                    <div className="certifications-display">
                      {candidate.certifications.length > 0 ? (
                        candidate.certifications.slice(0, 3).map((cert, idx) => (
                          <div key={idx} className="certification-item">
                            <strong>🎓 {cert.title}</strong>
                            {cert.issuer && <div className="cert-issuer">by {cert.issuer}</div>}
                            {cert.dateAchieved && (
                              <div className="cert-date">
                                {new Date(cert.dateAchieved).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <span className="no-data">No certifications listed</span>
                      )}
                      {candidate.certifications.length > 3 && (
                        <small>+{candidate.certifications.length - 3} more certifications</small>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Application Status */}
              <tr className="metric-row">
                <td className="metric-label">
                  <strong>Application Status</strong>
                </td>
                {sortedCandidates.map(candidate => (
                  <td key={candidate.applicationId} className="metric-value">
                    <span className={`status-badge status-${candidate.applicationStatus.toLowerCase()}`}>
                      {candidate.applicationStatus}
                    </span>
                    <div className="applied-date">
                      Applied: {new Date(candidate.appliedDate).toLocaleDateString()}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Additional Info */}
              <tr className="metric-row">
                <td className="metric-label">
                  <strong>Additional Information</strong>
                </td>
                {sortedCandidates.map(candidate => (
                  <td key={candidate.applicationId} className="metric-value">
                    <div className="additional-info">
                      <div className="info-item">
                        <strong>Phone:</strong> {candidate.phoneNumber}
                      </div>
                      {candidate.bio && (
                        <div className="info-item">
                          <strong>Bio:</strong>
                          <p className="bio-text">{candidate.bio}</p>
                        </div>
                      )}
                      {candidate.resumeUrl && candidate.applicationId && (
                        <div className="info-item">
                          <a 
                            href={`${FILE_BASE_URL}/api/jobs/application/${candidate.applicationId}/resume`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="resume-link"
                          >
                            📄 View Resume
                          </a>
                        </div>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="comparison-footer">
        <p className="footer-note">
          💡 Tip: The compatibility score is calculated based on skill match (50%), experience relevance (30%), and past role similarity (20%).
        </p>
      </div>
    </div>
  );
};

export default CandidateComparison;

