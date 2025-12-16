import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { achievementAPI } from '../api';
import { useAuth } from '../AuthContext';
import AchievementCard from './AchievementCard';
import AchievementForm from './AchievementForm';
import AchievementTimeline from './AchievementTimeline';
import AchievementDashboard from './AchievementDashboard';
import '../styles/Achievements.css';

const Achievements = () => {
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'timeline', 'dashboard'
  const [showForm, setShowForm] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    impactLevel: '',
    sortBy: 'dateAchieved',
    sortOrder: 'desc'
  });

  useEffect(() => {
    loadAchievements();
    loadStats();
  }, [filters]);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const response = await achievementAPI.getAchievements(filters);
      setAchievements(response.data.achievements || []);
    } catch (err) {
      console.error('Error loading achievements:', err);
      alert('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await achievementAPI.getStats();
      setStats(response.data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleAdd = () => {
    setEditingAchievement(null);
    setShowForm(true);
  };

  const handleEdit = (achievement) => {
    setEditingAchievement(achievement);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this achievement?')) {
      return;
    }

    try {
      await achievementAPI.deleteAchievement(id);
      await loadAchievements();
      await loadStats();
      alert('Achievement deleted successfully');
    } catch (err) {
      console.error('Error deleting achievement:', err);
      alert('Failed to delete achievement');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingAchievement(null);
  };

  const handleFormSubmit = async () => {
    await loadAchievements();
    await loadStats();
    handleFormClose();
  };

  const handleToggleFeatured = async (achievement) => {
    try {
      await achievementAPI.updateAchievement(achievement._id, {
        ...achievement,
        isFeatured: !achievement.isFeatured
      });
      await loadAchievements();
    } catch (err) {
      console.error('Error updating achievement:', err);
      alert('Failed to update achievement');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleShare = (achievement) => {
    const shareUrl = `${window.location.origin}/achievements/${achievement._id}`;
    if (navigator.share) {
      navigator.share({
        title: achievement.title,
        text: achievement.description,
        url: shareUrl
      }).catch(() => {
        navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  if (loading && achievements.length === 0) {
    return (
      <div className="achievements-container">
        <div className="loading">Loading achievements...</div>
      </div>
    );
  }

  return (
    <div className="achievements-container">
      <div className="achievements-header">
        <div className="achievements-header-top">
          <button className="btn-back" onClick={() => navigate('/profile')}>
            ← Back to Profile
          </button>
          <h1 className="achievements-title">🏆 Achievements & Milestones</h1>
        </div>

        <div className="achievements-controls">
          <div className="view-mode-toggle">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              📋 Grid
            </button>
            <button
              className={`view-btn ${viewMode === 'timeline' ? 'active' : ''}`}
              onClick={() => setViewMode('timeline')}
            >
              📅 Timeline
            </button>
            <button
              className={`view-btn ${viewMode === 'dashboard' ? 'active' : ''}`}
              onClick={() => setViewMode('dashboard')}
            >
              📊 Analytics
            </button>
          </div>

          <div className="filters-section">
            <select
              className="filter-select"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="certification">Certification</option>
              <option value="award">Award</option>
              <option value="project">Project</option>
              <option value="education">Education</option>
              <option value="competition">Competition</option>
              <option value="publication">Publication</option>
              <option value="other">Other</option>
            </select>

            <select
              className="filter-select"
              value={filters.impactLevel}
              onChange={(e) => handleFilterChange('impactLevel', e.target.value)}
            >
              <option value="">All Impact Levels</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              className="filter-select"
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                setFilters(prev => ({ ...prev, sortBy, sortOrder }));
              }}
            >
              <option value="dateAchieved-desc">Newest First</option>
              <option value="dateAchieved-asc">Oldest First</option>
              <option value="impactLevel-desc">High Impact First</option>
              <option value="impactLevel-asc">Low Impact First</option>
            </select>
          </div>

          <button className="btn-add-achievement" onClick={handleAdd}>
            + Add Achievement
          </button>
        </div>
      </div>

      {viewMode === 'dashboard' && stats && (
        <AchievementDashboard stats={stats} achievements={achievements} />
      )}

      {viewMode === 'timeline' && (
        <AchievementTimeline
          achievements={achievements}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleFeatured={handleToggleFeatured}
          onShare={handleShare}
        />
      )}

      {viewMode === 'grid' && (
        <div className="achievements-grid">
          {achievements.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏆</div>
              <h3>No achievements yet</h3>
              <p>Start building your portfolio by adding your first achievement!</p>
              <button className="btn-add-achievement" onClick={handleAdd}>
                + Add Your First Achievement
              </button>
            </div>
          ) : (
            achievements.map((achievement) => (
              <AchievementCard
                key={achievement._id}
                achievement={achievement}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleFeatured={handleToggleFeatured}
                onShare={handleShare}
              />
            ))
          )}
        </div>
      )}

      {showForm && (
        <AchievementForm
          achievement={editingAchievement}
          onClose={handleFormClose}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
};

export default Achievements;

