import React, { useState, useEffect } from 'react';
import { achievementAPI } from '../api';

const AchievementForm = ({ achievement, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    category: 'certification',
    dateAchieved: new Date().toISOString().split('T')[0],
    issuer: '',
    description: '',
    skills: '',
    proofUrl: '',
    visibility: 'public',
    impactLevel: 'medium',
    isFeatured: false,
    industry: '',
    duration: '',
    teamSize: 'individual',
    recognitionLevel: 'local',
    difficultyLevel: 'intermediate'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (achievement) {
      setFormData({
        title: achievement.title || '',
        category: achievement.category || 'certification',
        dateAchieved: achievement.dateAchieved 
          ? new Date(achievement.dateAchieved).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        issuer: achievement.issuer || '',
        description: achievement.description || '',
        skills: Array.isArray(achievement.skills) ? achievement.skills.join(', ') : '',
        proofUrl: achievement.proofUrl || '',
        visibility: achievement.visibility || 'public',
        impactLevel: achievement.impactLevel || 'medium',
        isFeatured: achievement.isFeatured || false,
        industry: achievement.industry || '',
        duration: achievement.duration || '',
        teamSize: achievement.teamSize || 'individual',
        recognitionLevel: achievement.recognitionLevel || 'local',
        difficultyLevel: achievement.difficultyLevel || 'intermediate'
      });
    }
  }, [achievement]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Title is required');
      return;
    }

    try {
      setSaving(true);
      const submitData = {
        ...formData,
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        duration: formData.duration ? parseInt(formData.duration) : null
      };

      if (achievement) {
        await achievementAPI.updateAchievement(achievement._id, submitData);
      } else {
        await achievementAPI.createAchievement(submitData);
      }

      onSubmit();
    } catch (err) {
      console.error('Error saving achievement:', err);
      alert('Failed to save achievement: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content achievement-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{achievement ? 'Edit Achievement' : 'Add New Achievement'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="achievement-form">
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g., AWS Certified Solutions Architect"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="certification">Certification</option>
                <option value="award">Award</option>
                <option value="project">Project</option>
                <option value="education">Education</option>
                <option value="competition">Competition</option>
                <option value="publication">Publication</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="dateAchieved">Date Achieved *</label>
              <input
                type="date"
                id="dateAchieved"
                name="dateAchieved"
                value={formData.dateAchieved}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="issuer">Issuer/Organization</label>
            <input
              type="text"
              id="issuer"
              name="issuer"
              value={formData.issuer}
              onChange={handleChange}
              placeholder="e.g., Amazon Web Services"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Describe your achievement..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="skills">Skills (comma-separated)</label>
            <input
              type="text"
              id="skills"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              placeholder="e.g., AWS, Cloud Computing, Architecture"
            />
          </div>

          <div className="form-group">
            <label htmlFor="proofUrl">Proof URL (optional)</label>
            <input
              type="url"
              id="proofUrl"
              name="proofUrl"
              value={formData.proofUrl}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="impactLevel">Impact Level</label>
              <select
                id="impactLevel"
                name="impactLevel"
                value={formData.impactLevel}
                onChange={handleChange}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="visibility">Visibility</label>
              <select
                id="visibility"
                name="visibility"
                value={formData.visibility}
                onChange={handleChange}
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="industry">Industry</label>
              <input
                type="text"
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                placeholder="e.g., Technology, Healthcare, Finance"
              />
            </div>

            <div className="form-group">
              <label htmlFor="duration">Duration (months)</label>
              <input
                type="number"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                min="0"
                placeholder="e.g., 6"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="teamSize">Team Size</label>
              <select
                id="teamSize"
                name="teamSize"
                value={formData.teamSize}
                onChange={handleChange}
              >
                <option value="individual">Individual</option>
                <option value="small">Small Team (2-5)</option>
                <option value="medium">Medium Team (6-20)</option>
                <option value="large">Large Team (20+)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="recognitionLevel">Recognition Level</label>
              <select
                id="recognitionLevel"
                name="recognitionLevel"
                value={formData.recognitionLevel}
                onChange={handleChange}
              >
                <option value="local">Local</option>
                <option value="regional">Regional</option>
                <option value="national">National</option>
                <option value="international">International</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="difficultyLevel">Difficulty Level</label>
              <select
                id="difficultyLevel"
                name="difficultyLevel"
                value={formData.difficultyLevel}
                onChange={handleChange}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleChange}
              />
              Mark as Featured
            </label>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={saving}>
              {saving ? 'Saving...' : achievement ? 'Update' : 'Add Achievement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AchievementForm;

