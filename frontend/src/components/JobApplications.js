import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobAPI } from '../api';
import '../styles/Applications.css';

const JobApplications = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await jobAPI.getJobById(jobId);
        setJob(response.data.job);
        setApplications(response.data.job.applicants || []);
      } catch (err) {
        console.error('Error fetching job details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [jobId]);

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await jobAPI.updateApplicationStatus(appId, newStatus);
      // Refresh applications
      const response = await jobAPI.getJobById(jobId);
      setJob(response.data.job);
    } catch (err) {
      alert('Error updating status');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="applications-container">
      <button onClick={() => navigate('/recruiter/dashboard')} className="btn-back">
        ← Back to Dashboard
      </button>

      <div className="applications-content">
        <h2>Applications for: {job?.title}</h2>
        <p className="job-company">{job?.company} • {job?.location}</p>

        <div className="applications-count">
          Total Applications: <strong>{applications.length}</strong>
        </div>

        {applications.length === 0 ? (
          <p>No applications yet</p>
        ) : (
          <div className="applications-table">
            {applications.map((applicant) => (
              <div key={applicant._id} className="applicant-row">
                <div className="applicant-info">
                  <h4>{applicant.name}</h4>
                  <p>{applicant.email}</p>
                </div>
                <div className="applicant-actions">
                  <select 
                    className="status-select"
                    onChange={(e) => handleStatusChange(applicant._id, e.target.value)}
                  >
                    <option>Change Status</option>
                    <option value="Reviewed">Reviewed</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobApplications;
