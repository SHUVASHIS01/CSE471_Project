import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { careerQuizAPI } from '../api';
import './CareerQuiz.css';

const CareerQuiz = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('[CareerQuiz] Component mounted, user:', user);
    // Clear any previous errors when component mounts
    setError(null);
    setResults(null);
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      const response = await careerQuizAPI.getQuestions();
      console.log('Quiz questions response:', response.data);
      
      // Handle both response.data.questions and response.data structure
      const questions = response.data.questions || response.data || [];
      
      if (!questions || questions.length === 0) {
        throw new Error('No questions received from server');
      }
      
      setQuestions(questions);
      // Initialize answers object
      const initialAnswers = {};
      questions.forEach(q => {
        initialAnswers[q.questionId] = '';
      });
      setAnswers(initialAnswers);
    } catch (err) {
      console.error('Error fetching questions:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText
      });
      
      let errorMessage = 'Failed to load quiz questions. Please try again.';
      if (err.response?.status === 401) {
        errorMessage = 'Please log in to access the career quiz.';
      } else if (err.response?.status === 403) {
        errorMessage = 'Career quiz is only available for job seekers.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all questions are answered
    const unanswered = questions.filter(q => !answers[q.questionId] || answers[q.questionId].trim() === '');
    if (unanswered.length > 0) {
      alert(`Please answer all questions. ${unanswered.length} question(s) remaining.`);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Format answers for API
      const formattedAnswers = questions.map(q => ({
        questionId: q.questionId,
        question: q.question,
        answer: answers[q.questionId]
      }));

      const response = await careerQuizAPI.submitQuiz(formattedAnswers);
      setResults(response.data);
    } catch (err) {
      console.error('Error submitting quiz:', err);
      setError(err.response?.data?.message || 'Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setResults(null);
    setAnswers({});
    setError(null);
    setSubmitting(false);
    // Reset answers
    const initialAnswers = {};
    questions.forEach(q => {
      initialAnswers[q.questionId] = '';
    });
    setAnswers(initialAnswers);
  };

  // Debug logging
  useEffect(() => {
    console.log('[CareerQuiz] State update:', { 
      loading, 
      questionsCount: questions.length, 
      error, 
      hasResults: !!results,
      answersKeys: Object.keys(answers).length
    });
  }, [loading, questions.length, error, results, answers]);

  // Always show loading state while fetching
  if (loading) {
    return (
      <div className="career-quiz-container">
        <div className="quiz-header">
          <h1>Career Guidance Quiz</h1>
          <p className="quiz-intro">
            Answer the following questions to receive personalized career recommendations based on your interests, 
            skills, and career goals.
          </p>
        </div>
        <div className="quiz-loading">Loading quiz questions...</div>
      </div>
    );
  }

  // Show results if available
  if (results) {
    return (
      <div className="career-quiz-container">
        <div className="quiz-results">
          <h1>Your Career Recommendations</h1>
          <p className="results-intro">
            Based on your quiz responses, here are career paths that align with your interests and skills:
          </p>

          <div className="recommendations-list">
            {results.recommendations && results.recommendations.length > 0 ? (
              results.recommendations.map((rec, index) => (
                <div key={index} className="recommendation-card">
                  <div className="recommendation-header">
                    <h2>{rec.title}</h2>
                    <span className="recommendation-number">#{index + 1}</span>
                  </div>
                  <p className="recommendation-description">{rec.description}</p>
                  {rec.reason && (
                    <p className="recommendation-reason">
                      <strong>Why this fits:</strong> {rec.reason}
                    </p>
                  )}
                  
                  {/* Additional Explanation */}
                  {rec.explanation && (
                    <div className="recommendation-explanation">
                      <p>{rec.explanation}</p>
                    </div>
                  )}
                  
                  {/* Skills Section */}
                  {rec.skills && rec.skills.length > 0 && (
                    <div className="recommendation-skills">
                      <h4 className="skills-title">Key Skills:</h4>
                      <div className="skills-list">
                        {rec.skills.map((skill, skillIndex) => {
                          const skillName = typeof skill === 'string' ? skill : (skill.name || skill);
                          return (
                            <span
                              key={skillIndex}
                              className="skill-tag"
                            >
                              {skillName}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Job Suggestions */}
                  {rec.jobSuggestions && rec.jobSuggestions.length > 0 && (
                    <div className="job-suggestions">
                      <h4 className="job-suggestions-title">Sample Job Opportunities:</h4>
                      <div className="job-suggestions-list">
                        {rec.jobSuggestions.map((job, jobIndex) => (
                          <div key={jobIndex} className="job-suggestion-item">
                            <div className="job-suggestion-content">
                              <span className="job-suggestion-title">{job.title}</span>
                              <span className="job-suggestion-company">{job.company}</span>
                              <span className="job-suggestion-location">{job.location}</span>
                            </div>
                            {job.matchPercentage !== undefined && (
                              <span 
                                className="job-match-percentage"
                                title="This score reflects how closely your interests and skills align with this role."
                              >
                                Match: {job.matchPercentage}%
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      {rec.jobSuggestions.some(job => job.matchPercentage !== undefined) && (
                        <p className="job-match-disclaimer">
                          Match percentages are indicative and based on profile alignment, not guaranteed outcomes.
                        </p>
                      )}
                      <p className="job-suggestions-note">These are example opportunities based on this career path.</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p>No recommendations available at this time.</p>
            )}
          </div>

          {results.jobListings && results.jobListings.length > 0 && (
            <div className="job-listings-section">
              <h2>Related Job Opportunities</h2>
              <div className="job-listings">
                {results.jobListings.map((job, index) => (
                  <div key={index} className="job-listing-card">
                    <h3>{job.title}</h3>
                    <p className="job-company">{job.company}</p>
                    <p className="job-location">{job.location}</p>
                    {job.url && (
                      <a href={job.url} target="_blank" rel="noopener noreferrer" className="job-link">
                        View Job Details
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="quiz-actions">
            <button onClick={handleRetake} className="btn-retake">
              Retake Quiz
            </button>
            <button onClick={() => navigate('/applicant/dashboard')} className="btn-dashboard">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="career-quiz-container">
      <div className="quiz-header">
        <h1>Career Guidance Quiz</h1>
        <p className="quiz-intro">
          Answer the following questions to receive personalized career recommendations based on your interests, 
          skills, and career goals. This will help us suggest career paths that align with your profile.
        </p>
      </div>

      {error && (
        <div className="quiz-error">
          {error}
          <br />
          <small style={{ marginTop: '8px', display: 'block' }}>
            Please check your connection and ensure you're logged in as a job seeker. 
            Check the browser console (F12) for more details.
          </small>
        </div>
      )}

      {!error && questions.length === 0 && (
        <div className="quiz-error">
          No questions available. Please refresh the page or contact support.
        </div>
      )}

      {!error && questions.length > 0 && (
        <form onSubmit={handleSubmit} className="quiz-form">
          {questions.map((question, index) => (
            <div key={question.questionId} className="question-card">
              <div className="question-header">
                <span className="question-number">Question {index + 1} of {questions.length}</span>
              </div>
              <h3 className="question-text">{question.question}</h3>
              <div className="options-list">
                {question.options && question.options.map((option, optIndex) => (
                  <label key={optIndex} className="option-label">
                    <input
                      type="radio"
                      name={question.questionId}
                      value={option}
                      checked={answers[question.questionId] === option}
                      onChange={() => handleAnswerChange(question.questionId, option)}
                      className="option-input"
                    />
                    <span className="option-text">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="quiz-submit-section">
            <button 
              type="submit" 
              className="btn-submit"
              disabled={submitting}
            >
              {submitting ? 'Analyzing Your Responses...' : 'Get Career Recommendations'}
            </button>
            <p className="submit-note">
              Your responses will be analyzed using AI to provide personalized career recommendations.
            </p>
          </div>
        </form>
      )}
    </div>
  );
};

export default CareerQuiz;
