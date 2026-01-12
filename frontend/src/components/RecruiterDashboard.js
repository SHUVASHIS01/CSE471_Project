import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { jobAPI } from '../api';
import '../styles/Dashboard.css';

const RecruiterDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('jobs');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await jobAPI.getRecruiterJobs();
      setJobs(response.data.jobs);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleCreateJob = () => {
    navigate('/post-job');
  };

  const handleCloseJob = async (jobId) => {
    if (window.confirm('Are you sure you want to close this job?')) {
      try {
        await jobAPI.closeJob(jobId);
        fetchJobs();
      } catch (err) {
        alert('Error closing job');
      }
    }
  };

  const handleViewApplications = (jobId) => {
    navigate(`/job/${jobId}/applications`);
  };

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>Job Portal - Recruiter</h1>
        </div>
        <div className="navbar-info">
          <span>Welcome, {user?.name}</span>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="sidebar">
          <button
            className={`nav-btn ${activeTab === 'jobs' ? 'active' : ''}`}
            onClick={() => setActiveTab('jobs')}
          >
            My Job Postings
          </button>
          <button onClick={handleCreateJob} className="nav-btn btn-new">
            ➕ Post New Job
          </button>
        </div>

        <div className="main-content">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <div className="jobs-section">
              <h2>My Job Postings</h2>
              {jobs.length === 0 ? (
                <p>You haven't posted any jobs yet</p>
              ) : (
                <div className="jobs-list">
                  {jobs.map(job => (
                    <div key={job._id} className="job-card-recruiter">
                      <div className="job-header">
                        <h3>{job.title}</h3>
                        <span className={`job-status ${job.isActive ? 'active' : 'inactive'}`}>
                          {job.isActive ? 'Active' : 'Closed'}
                        </span>
                      </div>
                      <p className="location">📍 {job.location}</p>
                      <p className="description">{job.description.substring(0, 150)}...</p>
                      
                      <div className="job-stats">
                        <span>👥 {job.applicants.length} applicants</span>
                        <span>📅 {job.jobType}</span>
                        {job.salary && <span>💰 {job.salary}</span>}
                      </div>

                      <div className="job-actions">
                        <button 
                          className="btn-view"
                          onClick={() => handleViewApplications(job._id)}
                        >
                          View Applications
                        </button>
                        <button 
                          className="btn-close"
                          onClick={() => handleCloseJob(job._id)}
                          disabled={!job.isActive}
                        >
                          Close Job
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
