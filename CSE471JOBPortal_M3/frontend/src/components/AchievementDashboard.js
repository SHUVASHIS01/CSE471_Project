import React from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const AchievementDashboard = ({ stats, achievements }) => {
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

  // Category breakdown pie chart
  const categoryData = {
    labels: stats.categoryBreakdown.map(item => item.category),
    datasets: [{
      data: stats.categoryBreakdown.map(item => item.count),
      backgroundColor: stats.categoryBreakdown.map(item => getCategoryColor(item.category)),
      borderColor: '#ffffff',
      borderWidth: 2
    }]
  };

  // Monthly progress bar chart
  const monthlyLabels = stats.monthlyBreakdown.map(item => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[item.month - 1]} ${item.year}`;
  });
  const monthlyData = {
    labels: monthlyLabels,
    datasets: [{
      label: 'Achievements',
      data: stats.monthlyBreakdown.map(item => item.count),
      backgroundColor: 'rgba(59, 130, 246, 0.6)',
      borderColor: '#3b82f6',
      borderWidth: 2,
      borderRadius: 8
    }]
  };

  // Yearly progress bar chart
  const yearlyData = {
    labels: stats.yearlyBreakdown.map(item => item.year.toString()),
    datasets: [{
      label: 'Achievements',
      data: stats.yearlyBreakdown.map(item => item.count),
      backgroundColor: 'rgba(20, 184, 166, 0.6)',
      borderColor: '#14b8a6',
      borderWidth: 2,
      borderRadius: 8
    }]
  };

  // Impact level breakdown
  const impactData = {
    labels: stats.impactBreakdown.map(item => item.level.toUpperCase()),
    datasets: [{
      data: stats.impactBreakdown.map(item => item.count),
      backgroundColor: [
        'rgba(239, 68, 68, 0.6)', // high - red
        'rgba(245, 158, 11, 0.6)', // medium - gold
        'rgba(156, 163, 175, 0.6)' // low - gray
      ],
      borderColor: '#ffffff',
      borderWidth: 2
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        padding: 12,
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 13
        }
      }
    }
  };

  const barChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  return (
    <div className="achievement-dashboard">
      <div className="dashboard-stats-grid">
        <div className="stat-card glass-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-value">{stats.totalCount}</div>
          <div className="stat-label">Total Achievements</div>
        </div>

        <div className="stat-card glass-card">
          <div className="stat-icon">📊</div>
          <div className="stat-value">{stats.categoryBreakdown.length}</div>
          <div className="stat-label">Categories</div>
        </div>

        <div className="stat-card glass-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-value">{achievements.filter(a => a.isFeatured).length}</div>
          <div className="stat-label">Featured</div>
        </div>

        <div className="stat-card glass-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-value">{stats.skillCoverage.length}</div>
          <div className="stat-label">Skills Covered</div>
        </div>
      </div>

      <div className="dashboard-charts-grid">
        <div className="chart-card glass-card">
          <h3>Category Breakdown</h3>
          <div className="chart-container">
            {stats.categoryBreakdown.length > 0 ? (
              <Pie data={categoryData} options={chartOptions} />
            ) : (
              <div className="no-data">No data available</div>
            )}
          </div>
        </div>

        <div className="chart-card glass-card">
          <h3>Impact Level Distribution</h3>
          <div className="chart-container">
            {stats.impactBreakdown.length > 0 ? (
              <Pie data={impactData} options={chartOptions} />
            ) : (
              <div className="no-data">No data available</div>
            )}
          </div>
        </div>

        <div className="chart-card glass-card">
          <h3>Monthly Progress (Last 12 Months)</h3>
          <div className="chart-container">
            {stats.monthlyBreakdown.length > 0 ? (
              <Bar data={monthlyData} options={barChartOptions} />
            ) : (
              <div className="no-data">No data available</div>
            )}
          </div>
        </div>

        <div className="chart-card glass-card">
          <h3>Yearly Progress</h3>
          <div className="chart-container">
            {stats.yearlyBreakdown.length > 0 ? (
              <Bar data={yearlyData} options={barChartOptions} />
            ) : (
              <div className="no-data">No data available</div>
            )}
          </div>
        </div>
      </div>

      {stats.skillCoverage.length > 0 && (
        <div className="skill-coverage-card glass-card">
          <h3>Top Skills Coverage</h3>
          <div className="skill-coverage-list">
            {stats.skillCoverage.slice(0, 10).map((item, index) => (
              <div key={index} className="skill-coverage-item">
                <span className="skill-name">{item.skill}</span>
                <div className="skill-bar-container">
                  <div 
                    className="skill-bar" 
                    style={{ 
                      width: `${(item.count / stats.totalCount) * 100}%`,
                      backgroundColor: getCategoryColor('project')
                    }}
                  />
                </div>
                <span className="skill-count">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Professional Fields Bar Charts */}
      <div className="dashboard-charts-grid">
        {stats.industryBreakdown && stats.industryBreakdown.length > 0 && (
          <div className="chart-card glass-card">
            <h3>Industry Distribution</h3>
            <div className="chart-container">
              <Bar 
                data={{
                  labels: stats.industryBreakdown
                    .filter(item => item.industry)
                    .map(item => item.industry),
                  datasets: [{
                    label: 'Achievements',
                    data: stats.industryBreakdown
                      .filter(item => item.industry)
                      .map(item => item.count),
                    backgroundColor: [
                      'rgba(59, 130, 246, 0.6)',
                      'rgba(20, 184, 166, 0.6)',
                      'rgba(139, 92, 246, 0.6)',
                      'rgba(245, 158, 11, 0.6)',
                      'rgba(236, 72, 153, 0.6)',
                      'rgba(99, 102, 241, 0.6)'
                    ],
                    borderColor: '#ffffff',
                    borderWidth: 2,
                    borderRadius: 8
                  }]
                }} 
                options={barChartOptions} 
              />
            </div>
          </div>
        )}

        {stats.teamSizeBreakdown && stats.teamSizeBreakdown.length > 0 && (
          <div className="chart-card glass-card">
            <h3>Team Size Distribution</h3>
            <div className="chart-container">
              <Bar 
                data={{
                  labels: stats.teamSizeBreakdown
                    .filter(item => item.teamSize)
                    .map(item => {
                      const labels = {
                        individual: 'Individual',
                        small: 'Small (2-5)',
                        medium: 'Medium (6-20)',
                        large: 'Large (20+)'
                      };
                      return labels[item.teamSize] || item.teamSize || 'Unknown';
                    }),
                  datasets: [{
                    label: 'Achievements',
                    data: stats.teamSizeBreakdown
                      .filter(item => item.teamSize)
                      .map(item => item.count),
                    backgroundColor: [
                      'rgba(59, 130, 246, 0.6)',
                      'rgba(20, 184, 166, 0.6)',
                      'rgba(139, 92, 246, 0.6)',
                      'rgba(245, 158, 11, 0.6)'
                    ],
                    borderColor: '#ffffff',
                    borderWidth: 2,
                    borderRadius: 8
                  }]
                }} 
                options={barChartOptions} 
              />
            </div>
          </div>
        )}

        {stats.recognitionBreakdown && stats.recognitionBreakdown.length > 0 && (
          <div className="chart-card glass-card">
            <h3>Recognition Level Distribution</h3>
            <div className="chart-container">
              <Bar 
                data={{
                  labels: stats.recognitionBreakdown
                    .filter(item => item.level)
                    .map(item => item.level.charAt(0).toUpperCase() + item.level.slice(1)),
                  datasets: [{
                    label: 'Achievements',
                    data: stats.recognitionBreakdown
                      .filter(item => item.level)
                      .map(item => item.count),
                    backgroundColor: [
                      'rgba(156, 163, 175, 0.6)', // local - gray
                      'rgba(59, 130, 246, 0.6)', // regional - blue
                      'rgba(20, 184, 166, 0.6)', // national - teal
                      'rgba(245, 158, 11, 0.6)' // international - gold
                    ],
                    borderColor: '#ffffff',
                    borderWidth: 2,
                    borderRadius: 8
                  }]
                }} 
                options={barChartOptions} 
              />
            </div>
          </div>
        )}

        {stats.difficultyBreakdown && stats.difficultyBreakdown.length > 0 && (
          <div className="chart-card glass-card">
            <h3>Difficulty Level Distribution</h3>
            <div className="chart-container">
              <Bar 
                data={{
                  labels: stats.difficultyBreakdown
                    .filter(item => item.level)
                    .map(item => item.level.charAt(0).toUpperCase() + item.level.slice(1)),
                  datasets: [{
                    label: 'Achievements',
                    data: stats.difficultyBreakdown
                      .filter(item => item.level)
                      .map(item => item.count),
                    backgroundColor: [
                      'rgba(34, 197, 94, 0.6)', // beginner - green
                      'rgba(59, 130, 246, 0.6)', // intermediate - blue
                      'rgba(245, 158, 11, 0.6)', // advanced - gold
                      'rgba(239, 68, 68, 0.6)' // expert - red
                    ],
                    borderColor: '#ffffff',
                    borderWidth: 2,
                    borderRadius: 8
                  }]
                }} 
                options={barChartOptions} 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AchievementDashboard;

