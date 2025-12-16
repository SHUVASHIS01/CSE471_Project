import React from 'react';

const AchievementTimeline = ({ achievements, onEdit, onDelete, onToggleFeatured, onShare }) => {
  // Sort achievements by date (newest first)
  const sortedAchievements = [...achievements].sort((a, b) => 
    new Date(b.dateAchieved) - new Date(a.dateAchieved)
  );

  const getCategoryColor = (category) => {
    const colors = {
      certification: '#3b82f6', // blue
      award: '#f59e0b', // gold
      project: '#14b8a6', // teal
      education: '#8b5cf6', // lavender
      competition: '#ec4899',
      publication: '#6366f1',
      other: '#6b7280'
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getYear = (date) => {
    return new Date(date).getFullYear();
  };

  // Group achievements by year
  const achievementsByYear = sortedAchievements.reduce((acc, achievement) => {
    const year = getYear(achievement.dateAchieved);
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(achievement);
    return acc;
  }, {});

  const years = Object.keys(achievementsByYear).sort((a, b) => b - a);

  if (sortedAchievements.length === 0) {
    return (
      <div className="timeline-empty">
        <div className="empty-icon">📅</div>
        <h3>No achievements to display</h3>
        <p>Add achievements to see them in timeline view</p>
      </div>
    );
  }

  return (
    <div className="achievement-timeline">
      {years.map((year, yearIndex) => (
        <div key={year} className="timeline-year-group">
          <div className="timeline-year-header">
            <div className="year-marker" style={{ backgroundColor: getCategoryColor('certification') }}>
              {year}
            </div>
          </div>

          <div className="timeline-items">
            {achievementsByYear[year].map((achievement, index) => {
              const categoryColor = getCategoryColor(achievement.category);
              const isLast = index === achievementsByYear[year].length - 1 && yearIndex === years.length - 1;

              return (
                <div key={achievement._id} className="timeline-item">
                  <div className="timeline-line" style={{ backgroundColor: categoryColor }} />
                  <div className="timeline-dot" style={{ backgroundColor: categoryColor }}>
                    {getCategoryIcon(achievement.category)}
                  </div>
                  
                  <div className="timeline-content">
                    <div className="timeline-card">
                      <div className="timeline-card-header">
                        <div className="timeline-category" style={{ color: categoryColor }}>
                          {getCategoryIcon(achievement.category)} {achievement.category}
                        </div>
                        <div className="timeline-actions">
                          <button className="action-btn" onClick={() => onToggleFeatured(achievement)}>
                            {achievement.isFeatured ? '⭐' : '☆'}
                          </button>
                          <button className="action-btn" onClick={() => onShare(achievement)}>🔗</button>
                          <button className="action-btn" onClick={() => onEdit(achievement)}>✏️</button>
                          <button className="action-btn" onClick={() => onDelete(achievement._id)}>🗑️</button>
                        </div>
                      </div>

                      <h3 className="timeline-title">{achievement.title}</h3>
                      
                      {achievement.issuer && (
                        <p className="timeline-issuer">Issued by: {achievement.issuer}</p>
                      )}

                      <p className="timeline-date">{formatDate(achievement.dateAchieved)}</p>

                      {achievement.description && (
                        <p className="timeline-description">{achievement.description}</p>
                      )}

                      {achievement.skills && achievement.skills.length > 0 && (
                        <div className="timeline-skills">
                          {achievement.skills.map((skill, idx) => (
                            <span key={idx} className="skill-tag">{skill}</span>
                          ))}
                        </div>
                      )}

                      {achievement.isFeatured && (
                        <div className="featured-badge-small">⭐ Featured</div>
                      )}

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
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AchievementTimeline;

