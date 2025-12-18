import React, { useState, useEffect } from 'react';
import { interviewQuestionAPI } from '../api';
import '../styles/Dashboard.css';

const InterviewQuestionBank = ({ jobId, jobTitle }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isJobPoster, setIsJobPoster] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [editingAnswerIndex, setEditingAnswerIndex] = useState(null);
  const [editAnswerText, setEditAnswerText] = useState('');

  useEffect(() => {
    loadQuestions();
  }, [jobId]);

  const loadQuestions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await interviewQuestionAPI.getQuestions(jobId);
      // Handle both old format (strings) and new format (objects)
      const questionsData = response.data.repository?.questions || [];
      const formattedQuestions = questionsData.map(q => 
        typeof q === 'string' ? { question: q, answer: '' } : q
      );
      setQuestions(formattedQuestions);
      setIsJobPoster(response.data.isJobPoster || false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading questions');
      console.error('Error loading questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) {
      setError('Please enter a question');
      return;
    }

    setError('');
    try {
      const response = await interviewQuestionAPI.addQuestion(jobId, newQuestion, newAnswer || '');
      setQuestions(response.data.repository.questions);
      setNewQuestion('');
      setNewAnswer('');
    } catch (err) {
      console.error('Error adding question:', err);
      console.error('Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });
      
      let errorMessage = 'Error adding question';
      
      if (err.response) {
        // Server responded with error
        if (err.response.status === 403) {
          errorMessage = err.response.data?.message || 'Only the job poster can edit interview questions';
        } else if (err.response.status === 404) {
          errorMessage = err.response.data?.message || 'Job not found';
        } else if (err.response.status === 400) {
          errorMessage = err.response.data?.message || 'Invalid request. Please check your input.';
        } else {
          errorMessage = err.response.data?.message || err.response.data?.error || `Error: ${err.response.status} ${err.response.statusText}`;
        }
      } else if (err.request) {
        // Request made but no response
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        // Error in request setup
        errorMessage = err.message || 'Error adding question';
      }
      
      setError(errorMessage);
    }
  };

  const handleStartEdit = (index) => {
    setEditingIndex(index);
    setEditQuestion(questions[index].question);
    setEditAnswer(questions[index].answer || '');
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditQuestion('');
    setEditAnswer('');
  };

  const handleUpdateQuestion = async (index) => {
    if (!editQuestion.trim()) {
      setError('Question cannot be empty');
      return;
    }

    setError('');
    try {
      const response = await interviewQuestionAPI.updateQuestion(jobId, index, editQuestion, editAnswer);
      setQuestions(response.data.repository.questions);
      setEditingIndex(null);
      setEditQuestion('');
      setEditAnswer('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating question');
      console.error('Error updating question:', err);
    }
  };

  const handleStartEditAnswer = (index) => {
    setEditingAnswerIndex(index);
    setEditAnswerText(questions[index].answer || '');
    setError('');
  };

  const handleCancelEditAnswer = () => {
    setEditingAnswerIndex(null);
    setEditAnswerText('');
  };

  const handleUpdateAnswer = async (index) => {
    setError('');
    try {
      const response = await interviewQuestionAPI.updateAnswer(jobId, index, editAnswerText);
      setQuestions(response.data.repository.questions);
      setEditingAnswerIndex(null);
      setEditAnswerText('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating answer');
      console.error('Error updating answer:', err);
    }
  };

  const handleDeleteQuestion = async (index) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    setError('');
    try {
      const response = await interviewQuestionAPI.deleteQuestion(jobId, index);
      setQuestions(response.data.repository.questions);
      if (editingIndex === index) {
        setEditingIndex(null);
        setEditQuestion('');
        setEditAnswer('');
      }
      if (editingAnswerIndex === index) {
        setEditingAnswerIndex(null);
        setEditAnswerText('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting question');
      console.error('Error deleting question:', err);
    }
  };

  if (loading) {
    return <div className="loading">Loading interview questions...</div>;
  }

  return (
    <div className="interview-question-bank">
      <div className="section-header">
        <h3>Interview Question Bank</h3>
        <p className="job-title-subtitle">for {jobTitle}</p>
        {!isJobPoster && (
          <p className="view-only-notice">📖 View Only - Only the job poster can edit questions</p>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {isJobPoster && (
        <form onSubmit={handleAddQuestion} className="add-question-form">
          <div className="form-group">
            <label htmlFor="newQuestion">Add New Question</label>
            <textarea
              id="newQuestion"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Enter an interview question..."
              rows="3"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="newAnswer">Answer (Optional)</label>
            <textarea
              id="newAnswer"
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              placeholder="Enter the answer to this question..."
              rows="3"
            />
          </div>
          <button type="submit" className="btn-primary">Add Question</button>
        </form>
      )}

      <div className="questions-list">
        <h4>Saved Questions ({questions.length})</h4>
        {questions.length === 0 ? (
          <p className="no-questions">No questions added yet. Start building your question bank!</p>
        ) : (
          <ul className="questions-list-items">
            {questions.map((item, index) => (
              <li key={index} className="question-item">
                {editingIndex === index ? (
                  <div className="question-edit">
                    <div className="form-group">
                      <label>Question</label>
                      <textarea
                        value={editQuestion}
                        onChange={(e) => setEditQuestion(e.target.value)}
                        rows="3"
                        className="edit-textarea"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Answer</label>
                      <textarea
                        value={editAnswer}
                        onChange={(e) => setEditAnswer(e.target.value)}
                        rows="3"
                        className="edit-textarea"
                        placeholder="Enter the answer..."
                      />
                    </div>
                    <div className="question-actions">
                      <button
                        onClick={() => handleUpdateQuestion(index)}
                        className="btn-primary btn-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="btn-secondary btn-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="question-display">
                    <div className="question-content">
                      <div className="question-number">{index + 1}.</div>
                      <div className="question-text-section">
                        <div className="question-text">{item.question}</div>
                        {editingAnswerIndex === index ? (
                          <div className="answer-edit">
                            <textarea
                              value={editAnswerText}
                              onChange={(e) => setEditAnswerText(e.target.value)}
                              rows="3"
                              className="edit-textarea"
                              placeholder="Enter the answer..."
                            />
                            <div className="answer-actions">
                              <button
                                onClick={() => handleUpdateAnswer(index)}
                                className="btn-primary btn-sm"
                              >
                                Save Answer
                              </button>
                              <button
                                onClick={handleCancelEditAnswer}
                                className="btn-secondary btn-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="answer-section">
                            {item.answer ? (
                              <div className="answer-display">
                                <strong>Answer:</strong>
                                <p>{item.answer}</p>
                                {isJobPoster && (
                                  <button
                                    onClick={() => handleStartEditAnswer(index)}
                                    className="btn-secondary btn-sm"
                                  >
                                    Edit Answer
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="answer-placeholder">
                                <em>No answer provided yet.</em>
                                {isJobPoster && (
                                  <button
                                    onClick={() => handleStartEditAnswer(index)}
                                    className="btn-secondary btn-sm"
                                  >
                                    Add Answer
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {isJobPoster && (
                      <div className="question-actions">
                        <button
                          onClick={() => handleStartEdit(index)}
                          className="btn-secondary btn-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(index)}
                          className="btn-danger btn-sm"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default InterviewQuestionBank;
