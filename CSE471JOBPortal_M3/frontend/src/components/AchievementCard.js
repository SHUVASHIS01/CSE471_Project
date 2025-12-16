import React from 'react';

const AchievementCard = ({ achievement, onEdit, onDelete, onToggleFeatured, onShare }) => {
  const getCategoryColor = (category) => {
    const colors = {
      certification: { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)', text: '#3b82f6' }, // blue
      award: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', text: '#f59e0b' }, // gold
      project: { bg: 'rgba(20, 184, 166, 0.1)', border: 'rgba(20, 184, 166, 0.3)', text: '#14b8a6' }, // teal
      education: { bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.3)', text: '#8b5cf6' }, // lavender
      competition: { bg: 'rgba(236, 72, 153, 0.1)', border: 'rgba(236, 72, 153, 0.3)', text: '#ec4899' },
      publication: { bg: 'rgba(99, 102, 241, 0.1)', border: 'rgba(99, 102, 241, 0.3)', text: '#6366f1' },
      other: { bg: 'rgba(107, 114, 128, 0.1)', border: 'rgba(107, 114, 128, 0.3)', text: '#6b7280' }
    };
    return colors[category] || colors.other;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      certification: '🎓',
      award: '🏅',
      project: '💼',
      education: '📚',
      competition: '🥇',
      publication: '📄',
      other: '⭐'
    };
    return icons[category] || icons.other;
  };

  const getImpactColor = (level) => {
    const colors = {
      high: { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' },
      medium: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' },
      low: { bg: 'rgba(156, 163, 175, 0.1)', text: '#9ca3af' }
    };
    return colors[level] || colors.medium;
  };

  const categoryColor = getCategoryColor(achievement.category);
  const impactColor = getImpactColor(achievement.impactLevel);

  return (
    <div className={`achievement-card ${achievement.isFeatured ? 'featured' : ''}`}>
      {achievement.isFeatured && (
        <div className="featured-badge">⭐ Featured</div>
      )}
      
      <div className="achievement-card-header" style={{ borderLeftColor: categoryColor.border }}>
        <div className="achievement-category-badge" style={{ backgroundColor: categoryColor.bg, color: categoryColor.text }}>
          <span className="category-icon">{getCategoryIcon(achievement.category)}</span>
          <span className="category-name">{achievement.category}</span>
        </div>
        <div className="achievement-actions">
          <button className="action-btn" onClick={() => onToggleFeatured(achievement)} title={achievement.isFeatured ? 'Unfeature' : 'Feature'}>
            {achievement.isFeatured ? '⭐' : '☆'}
          </button>
          <button className="action-btn" onClick={() => onShare(achievement)} title="Share">🔗</button>
          <button className="action-btn" onClick={() => onEdit(achievement)} title="Edit">✏️</button>
          <button className="action-btn" onClick={() => onDelete(achievement._id)} title="Delete">🗑️</button>
        </div>
      </div>

      <div className="achievement-card-body">
        <h3 className="achievement-title">{achievement.title}</h3>
        
        {achievement.issuer && (
          <p className="achievement-issuer">
            <span className="label">Issued by:</span> {achievement.issuer}
          </p>
        )}

        <p className="achievement-date">
          <span className="label">Date:</span> {new Date(achievement.dateAchieved).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>

        {achievement.description && (
          <p className="achievement-description">{achievement.description}</p>
        )}

        {achievement.skills && achievement.skills.length > 0 && (
          <div className="achievement-skills">
            {achievement.skills.map((skill, idx) => (
              <span key={idx} className="skill-tag">{skill}</span>
            ))}
          </div>
        )}

        <div className="achievement-footer">
          <div className="impact-badge" style={{ backgroundColor: impactColor.bg, color: impactColor.text }}>
            {achievement.impactLevel.toUpperCase()} Impact
          </div>
          {achievement.proofUrl && (
            <a 
              href={achievement.proofUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="proof-link"
            >
              View Proof →
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default AchievementCard;

