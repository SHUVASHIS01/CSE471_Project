import React, { useState, useEffect } from 'react';
import { resumeAPI } from '../api';
import '../styles/ResumeManagement.css';

const FILE_BASE_URL = 'http://localhost:5000';

const ResumeManagement = ({ onClose }) => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedResumes, setSelectedResumes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [editingResume, setEditingResume] = useState(null);
  const [previewResume, setPreviewResume] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    try {
      setLoading(true);
      const response = await resumeAPI.getResumes();
      setResumes(response.data.resumes || []);
    } catch (err) {
      setError('Failed to load resumes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type by extension (more reliable than MIME type)
    const fileName = file.name.toLowerCase();
    const validExtensions = ['.pdf', '.doc', '.docx'];
    const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      setError('Please upload a PDF, DOC, or DOCX file only.');
      e.target.value = '';
      return;
    }

    // Also validate MIME type if available
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (file.type && !validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      setError('Please upload a PDF or DOC/DOCX file');
      e.target.value = '';
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      e.target.value = '';
      return;
    }

    const title = window.prompt('Enter a title for this resume:', file.name.replace(/\.[^/.]+$/, ''));
    if (!title || !title.trim()) {
      e.target.value = '';
      return;
    }

    try {
      setUploading(true);
      setError('');
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('title', title.trim());
      
      const description = window.prompt('Enter an optional description:', '');
      if (description && description.trim()) {
        formData.append('description', description.trim());
      }

      await resumeAPI.uploadResume(formData);
      setSuccess('Resume uploaded successfully!');
      await loadResumes();
      e.target.value = '';
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Resume upload error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to upload resume. Please try again.';
      setError(errorMessage);
      e.target.value = '';
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) return;

    try {
      await resumeAPI.deleteResume(id);
      setSuccess('Resume deleted successfully!');
      await loadResumes();
      setSelectedResumes(selectedResumes.filter(rid => rid !== id));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete resume');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedResumes.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedResumes.length} resume(s)?`)) return;

    try {
      await resumeAPI.bulkDeleteResumes(selectedResumes);
      setSuccess(`${selectedResumes.length} resume(s) deleted successfully!`);
      await loadResumes();
      setSelectedResumes([]);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete resumes');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await resumeAPI.setDefaultResume(id);
      setSuccess('Default resume updated!');
      await loadResumes();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set default resume');
    }
  };

  const handleEdit = (resume) => {
    setEditingResume({ ...resume });
  };

  const handleSaveEdit = async () => {
    if (!editingResume.title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      await resumeAPI.updateResume(editingResume._id, {
        title: editingResume.title,
        description: editingResume.description || '',
        tags: editingResume.tags || []
      });
      setSuccess('Resume updated successfully!');
      setEditingResume(null);
      await loadResumes();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update resume');
    }
  };

  const handleView = (resume) => {
    setPreviewResume(resume);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredResumes = resumes.filter(resume => {
    const matchesSearch = resume.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (resume.description && resume.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'default' && resume.isDefault) ||
                         (filterType === 'pdf' && resume.fileType === 'PDF') ||
                         (filterType === 'doc' && (resume.fileType === 'DOC' || resume.fileType === 'DOCX'));
    return matchesSearch && matchesFilter;
  });

  const getFileUrl = (relativePath) => {
    if (!relativePath) return '';
    if (relativePath.startsWith('http')) return relativePath;
    return `${FILE_BASE_URL}${relativePath}`;
  };

  if (loading) {
    return (
      <div className="resume-management-overlay">
        <div className="resume-management-modal">
          <div className="loading">Loading resumes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="resume-management-overlay" onClick={onClose}>
      <div className="resume-management-modal" onClick={(e) => e.stopPropagation()}>
        <div className="resume-management-header">
          <h2>Resume Management</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="resume-management-toolbar">
          <div className="upload-section">
            <label className="btn-upload">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />
              {uploading ? 'Uploading...' : '+ Upload Resume'}
            </label>
          </div>

          <div className="search-filter-section">
            <input
              type="text"
              placeholder="Search resumes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Types</option>
              <option value="default">Default Only</option>
              <option value="pdf">PDF Only</option>
              <option value="doc">DOC/DOCX Only</option>
            </select>
          </div>

          {selectedResumes.length > 0 && (
            <button className="btn-danger" onClick={handleBulkDelete}>
              Delete Selected ({selectedResumes.length})
            </button>
          )}
        </div>

        <div className="resumes-list">
          {filteredResumes.length === 0 ? (
            <div className="empty-state">
              <p>No resumes found. Upload your first resume to get started!</p>
            </div>
          ) : (
            filteredResumes.map(resume => (
              <div key={resume._id} className={`resume-card ${resume.isDefault ? 'default' : ''}`}>
                <div className="resume-card-header">
                  <div className="resume-card-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedResumes.includes(resume._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedResumes([...selectedResumes, resume._id]);
                        } else {
                          setSelectedResumes(selectedResumes.filter(id => id !== resume._id));
                        }
                      }}
                    />
                  </div>
                  <div className="resume-card-title-section">
                    {editingResume?._id === resume._id ? (
                      <div className="edit-form">
                        <input
                          type="text"
                          value={editingResume.title}
                          onChange={(e) => setEditingResume({ ...editingResume, title: e.target.value })}
                          className="edit-title-input"
                        />
                        <textarea
                          value={editingResume.description || ''}
                          onChange={(e) => setEditingResume({ ...editingResume, description: e.target.value })}
                          placeholder="Description (optional)"
                          className="edit-description-input"
                          rows="2"
                        />
                        <div className="edit-actions">
                          <button className="btn-save" onClick={handleSaveEdit}>Save</button>
                          <button className="btn-cancel" onClick={() => setEditingResume(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3>{resume.title}</h3>
                        {resume.isDefault && <span className="default-badge">⭐ Default</span>}
                        {resume.description && <p className="resume-description">{resume.description}</p>}
                      </>
                    )}
                  </div>
                </div>

                <div className="resume-card-info">
                  <div className="info-item">
                    <span className="info-label">File:</span>
                    <span className="info-value">{resume.fileName}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Size:</span>
                    <span className="info-value">{formatFileSize(resume.fileSize)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Type:</span>
                    <span className="info-value">{resume.fileType}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Uploaded:</span>
                    <span className="info-value">{formatDate(resume.createdAt)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Last Used:</span>
                    <span className="info-value">{formatDate(resume.lastUsedAt)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Usage Count:</span>
                    <span className="info-value">{resume.usageCount || 0}</span>
                  </div>
                </div>

                <div className="resume-card-actions">
                  <button className="btn-action" onClick={() => handleView(resume)}>👁️ View</button>
                  <button className="btn-action" onClick={() => window.open(getFileUrl(resume.fileUrl), '_blank')}>⬇️ Download</button>
                  <button className="btn-action" onClick={() => handleEdit(resume)}>✏️ Edit</button>
                  {!resume.isDefault && (
                    <button className="btn-action" onClick={() => handleSetDefault(resume._id)}>⭐ Set Default</button>
                  )}
                  <button className="btn-action btn-delete" onClick={() => handleDelete(resume._id)}>🗑️ Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {previewResume && (
        <div className="preview-overlay" onClick={() => setPreviewResume(null)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="preview-header">
              <h3>{previewResume.title}</h3>
              <button className="close-btn" onClick={() => setPreviewResume(null)}>×</button>
            </div>
            <div className="preview-content">
              <iframe
                src={getFileUrl(previewResume.fileUrl)}
                title={previewResume.title}
                className="preview-iframe"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeManagement;

