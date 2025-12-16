import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, jobAPI, resumeAPI } from '../api';
import { useAuth } from '../AuthContext';
import ResumeManagement from './ResumeManagement';
import NotificationBell from './NotificationBell';
import '../styles/Profile.css';

const FILE_BASE_URL = 'http://localhost:5000';

const ApplicantProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const resumeInputRef = useRef(null);
  const [showResumeManagement, setShowResumeManagement] = useState(false);

  useEffect(() => {
    loadProfile();
    loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      setProfile(response.data.user);
    } catch (err) {
      console.error('Error loading profile', err);
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async () => {
    try {
      const response = await jobAPI.getApplications();
      setApplications(response.data.applications || []);
    } catch (err) {
      console.error('Error loading applications', err);
    }
  };

  const getFileUrl = (relativePath) => {
    if (!relativePath) return '';
    if (relativePath.startsWith('http')) return relativePath;
    return `${FILE_BASE_URL}${relativePath}`;
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleBack = () => {
    navigate('/applicant/dashboard');
  };

  const handleAddSkills = async () => {
    const initial = (profile?.skills || []).join(', ');
    const value = window.prompt('Add skills separated by commas', initial);
    if (value === null) return;
    const skills = value
      .split(',')
      .map(skill => skill.trim())
      .filter(Boolean);

    try {
      setSaving(true);
      const formData = new FormData();
      skills.forEach(skill => formData.append('skills', skill));
      const response = await authAPI.updateProfile(formData);
      setProfile(response.data.user);
      alert('Skills updated');
    } catch (err) {
      alert('Could not update skills');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveKeywords = async () => {
    const initial = (profile?.profileKeywords || []).join(', ');
    const value = window.prompt('Add keywords separated by commas (e.g., software engineer, developer, remote, javascript)\n\nThese keywords will be used for job matching:', initial);
    if (value === null) return;
    
    const keywords = value
      .split(',')
      .map(keyword => keyword.trim().toLowerCase())
      .filter(Boolean);

    if (keywords.length === 0) {
      alert('Please enter at least one keyword');
      return;
    }

    try {
      setSaving(true);
      const response = await authAPI.updateProfileKeywords(keywords);
      setProfile(response.data.user);
      alert(`✅ ${keywords.length} keyword(s) saved successfully!\n\nKeywords: ${keywords.join(', ')}\n\nThese will be used for job matching in your alerts.`);
    } catch (err) {
      alert('Could not save keywords: ' + (err?.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleResumeClick = () => {
    resumeInputRef.current?.click();
  };

  const handleResumeChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type by extension (more reliable than MIME type)
    const fileName = file.name.toLowerCase();
    const validExtensions = ['.pdf', '.doc', '.docx'];
    const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      alert('Please upload a PDF, DOC, or DOCX file only.');
      e.target.value = '';
      return;
    }

    // Also validate MIME type if available
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (file.type && !validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      alert('Please upload a PDF or DOC/DOCX file');
      e.target.value = '';
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      e.target.value = '';
      return;
    }

    const title = window.prompt('Enter a title for this resume:', file.name.replace(/\.[^/.]+$/, ''));
    if (!title || !title.trim()) {
      e.target.value = '';
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('title', title.trim());
      
      const description = window.prompt('Enter an optional description:', '');
      if (description && description.trim()) {
        formData.append('description', description.trim());
      }

      await resumeAPI.uploadResume(formData);
      alert('Resume uploaded successfully!');
    } catch (err) {
      console.error('Resume upload error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Could not upload resume. Please try again.';
      alert(errorMessage);
    } finally {
      setSaving(false);
      e.target.value = '';
    }
  };

  const handleEditProfile = () => {
    navigate('/profile/edit');
  };

  const handleNotifications = () => {
    alert('No new notifications');
  };

  const handleResetPassword = async () => {
    const currentPassword = window.prompt('Enter current password');
    if (!currentPassword) return;
    const newPassword = window.prompt('Enter new password');
    if (!newPassword) return;
    try {
      await authAPI.updatePassword(currentPassword, newPassword);
      alert('Password updated. Please log in again.');
      await logout();
      navigate('/login');
    } catch (err) {
      alert(err?.response?.data?.message || 'Could not update password');
    }
  };

  const formatStatus = (status) => {
    if (status === 'Applied' || status === 'Reviewed') return 'Pending';
    return status;
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="profile-page">
      <nav className="profile-nav">
        <div className="profile-brand">
          <h1>Job Portal</h1>
        </div>
        <div className="profile-actions">
          <span className="welcome-text">Welcome, {profile?.name}</span>
          <button className="btn-secondary" onClick={handleBack}>My Dashboard</button>
          <button className="btn-primary" onClick={handleEditProfile}>My Profile</button>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="profile-hero">
        <button className="btn-link" onClick={handleBack}>← Go Back</button>
        <div className="profile-card">
          <div className="profile-top">
            <div className="avatar-wrapper">
              {profile?.avatarUrl ? (
                <img src={getFileUrl(profile.avatarUrl)} alt="avatar" className="avatar-img" />
              ) : (
                <div className="avatar-placeholder">👤</div>
              )}
            </div>
            <div className="profile-info">
              <h2><span className="muted">Username:</span> {profile?.name}</h2>
              <p className="muted">Bio: <span className="value">{profile?.bio || 'No bio added'}</span></p>
              <p className="muted">📞 Phone: <span className="value">{profile?.phoneNumber || 'Not added'}</span></p>
              <p className="muted">✉️ Email: <span className="value">{profile?.email}</span></p>
              <p className="muted">
                Skills:&nbsp;
                <span className="value">
                  {(profile?.skills?.length ? profile.skills.join(', ') : 'No skills added')}
                </span>
              </p>
              <p className="muted">
                Saved Keywords:&nbsp;
                <span className="value">
                  {(profile?.profileKeywords?.length ? profile.profileKeywords.join(', ') : 'No keywords saved')}
                </span>
              </p>
            </div>
            <div className="profile-quick-actions">
              <button className="btn-secondary" onClick={handleAddSkills} disabled={saving}>+ Add Skills</button>
              <button className="btn-secondary" onClick={handleSaveKeywords} disabled={saving}>💾 Saved Keywords</button>
              <div className="upload-row">
                <button className="btn-secondary" onClick={handleResumeClick} disabled={saving}>Upload Resume</button>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  ref={resumeInputRef}
                  className="hidden-input"
                  onChange={handleResumeChange}
                />
                <button
                  className="btn-secondary"
                  onClick={() => setShowResumeManagement(true)}
                >
                  Show Resume
                </button>
              </div>
              <button className="btn-secondary" onClick={() => navigate('/achievements')} disabled={saving}>
                🏆 Achievements
              </button>
              <div className="icon-row">
                <button className="icon-btn" onClick={handleEditProfile} title="Edit profile">✏️</button>
                <NotificationBell />
                <button className="icon-btn" onClick={handleResetPassword} title="Reset password">🔑</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="applications-section">
        <h3>Applied Jobs</h3>
        <div className="applications-table">
          <div className="table-row table-head">
            <div>Date</div>
            <div>Job Role</div>
            <div>Company</div>
            <div>Status</div>
          </div>
          {applications.length === 0 ? (
            <div className="table-row empty-row">
              <div colSpan="4">No applications yet</div>
            </div>
          ) : (
            applications.map(app => (
              <div key={app._id} className="table-row">
                <div>{new Date(app.createdAt).toLocaleDateString()}</div>
                <div>{app.jobId?.title || '-'}</div>
                <div>{app.jobId?.company || '-'}</div>
                <div>
                  <span className={`status-pill ${formatStatus(app.status).toLowerCase()}`}>
                    {formatStatus(app.status)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showResumeManagement && (
        <ResumeManagement onClose={() => setShowResumeManagement(false)} />
      )}
    </div>
  );
};

export default ApplicantProfile;

