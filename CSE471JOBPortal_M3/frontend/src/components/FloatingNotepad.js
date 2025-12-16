import React, { useState, useEffect } from 'react';
import { notesAPI, jobAPI } from '../api';
import './FloatingNotepad.css';

const FloatingNotepad = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [content, setContent] = useState('');
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  // Fetch notes when panel opens
  useEffect(() => {
    if (isOpen) {
      fetchNotes();
      fetchJobs();
    }
  }, [isOpen]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await notesAPI.getNotes();
      setNotes(response.data.notes || []);
    } catch (err) {
      console.error('Error fetching notes:', err);
      alert('Failed to load notes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      setLoadingJobs(true);
      const response = await jobAPI.getAllJobs();
      setAvailableJobs(response.data.jobs || []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      // Don't show error - jobs are optional
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleCreateNote = () => {
    setEditingNote(null);
    setContent('');
    setSelectedJobId(null);
  };

  const handleEditNote = (note) => {
    setEditingNote(note);
    setContent(note.content);
    setSelectedJobId(note.jobId || null);
  };

  const handleSaveNote = async () => {
    if (!content.trim()) {
      alert('Please enter note content');
      return;
    }

    try {
      setLoading(true);
      if (editingNote) {
        // Update existing note
        await notesAPI.updateNote(editingNote.noteId, content.trim(), selectedJobId || null);
      } else {
        // Create new note
        await notesAPI.createNote(content.trim(), selectedJobId || null);
      }
      
      // Reset form and refresh notes
      setEditingNote(null);
      setContent('');
      setSelectedJobId(null);
      await fetchNotes();
    } catch (err) {
      console.error('Error saving note:', err);
      alert('Failed to save note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      setLoading(true);
      await notesAPI.deleteNote(noteId);
      await fetchNotes();
      
      // Reset form if deleting the note being edited
      if (editingNote && editingNote.noteId === noteId) {
        setEditingNote(null);
        setContent('');
        setSelectedJobId(null);
      }
    } catch (err) {
      console.error('Error deleting note:', err);
      alert('Failed to delete note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
    setContent('');
    setSelectedJobId(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      {/* Floating Notepad Icon */}
      <button
        className="floating-notepad-icon"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open notepad"
        title="Notes"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      </button>

      {/* Notepad Panel */}
      {isOpen && (
        <div className="notepad-overlay" onClick={() => setIsOpen(false)}>
          <div className="notepad-panel" onClick={(e) => e.stopPropagation()}>
            <div className="notepad-header">
              <h2>My Notes</h2>
              <button
                className="notepad-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close notepad"
              >
                ×
              </button>
            </div>

            <div className="notepad-content">
              {/* Note Editor */}
              <div className="note-editor">
                <h3>{editingNote ? 'Edit Note' : 'New Note'}</h3>
                <textarea
                  className="note-textarea"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your note here..."
                  rows="4"
                />
                
                <div className="note-job-selector">
                  <label htmlFor="job-select">Associate with Job (Optional):</label>
                  <select
                    id="job-select"
                    value={selectedJobId || ''}
                    onChange={(e) => setSelectedJobId(e.target.value || null)}
                    disabled={loadingJobs}
                  >
                    <option value="">-- General Note --</option>
                    {availableJobs.map((job) => (
                      <option key={job._id} value={job._id}>
                        {job.title} - {job.company}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="note-editor-actions">
                  <button
                    className="btn-save"
                    onClick={handleSaveNote}
                    disabled={loading || !content.trim()}
                  >
                    {loading ? 'Saving...' : editingNote ? 'Update' : 'Save'}
                  </button>
                  {editingNote && (
                    <button
                      className="btn-cancel"
                      onClick={handleCancelEdit}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* Notes List */}
              <div className="notes-list">
                <h3>Your Notes ({notes.length})</h3>
                {loading && notes.length === 0 ? (
                  <div className="notes-loading">Loading notes...</div>
                ) : notes.length === 0 ? (
                  <div className="notes-empty">No notes yet. Create your first note above!</div>
                ) : (
                  <div className="notes-items">
                    {notes.map((note) => (
                      <div key={note.noteId} className="note-item">
                        <div className="note-item-header">
                          <div className="note-item-meta">
                            {note.jobTitle && (
                              <span className="note-job-badge">
                                📋 {note.jobTitle} - {note.jobCompany}
                              </span>
                            )}
                            <span className="note-date">
                              {formatDate(note.updatedAt)}
                            </span>
                          </div>
                          <div className="note-item-actions">
                            <button
                              className="btn-edit"
                              onClick={() => handleEditNote(note)}
                              disabled={loading}
                              title="Edit note"
                            >
                              ✏️
                            </button>
                            <button
                              className="btn-delete"
                              onClick={() => handleDeleteNote(note.noteId)}
                              disabled={loading}
                              title="Delete note"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                        <div className="note-item-content">{note.content}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingNotepad;

