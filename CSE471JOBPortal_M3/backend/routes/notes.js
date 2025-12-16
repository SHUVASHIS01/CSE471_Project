const express = require('express');
const { verifyToken } = require('../middleware/auth');
const Note = require('../models/Note');
const Job = require('../models/Job');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// GET /api/notes - Get all notes for the authenticated user
router.get('/', async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user.id })
      .sort({ updatedAt: -1 })
      .populate('jobId', 'title company')
      .lean();

    // Format response
    const formattedNotes = notes.map(note => ({
      noteId: note._id,
      userId: note.userId,
      content: note.content,
      jobId: note.jobId ? note.jobId._id : null,
      jobTitle: note.jobId ? note.jobId.title : null,
      jobCompany: note.jobId ? note.jobId.company : null,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt
    }));

    return res.status(200).json({ notes: formattedNotes });
  } catch (err) {
    console.error('Error fetching notes:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/notes - Create a new note
router.post('/', async (req, res) => {
  try {
    const { content, jobId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Note content is required' });
    }

    // Validate jobId if provided
    if (jobId) {
      const job = await Job.findById(jobId);
      if (!job) {
        return res.status(400).json({ message: 'Invalid job ID' });
      }
    }

    const note = new Note({
      userId: req.user.id,
      content: content.trim(),
      jobId: jobId || null
    });

    await note.save();

    // Populate job details if jobId exists
    if (note.jobId) {
      await note.populate('jobId', 'title company');
    }

    return res.status(201).json({
      note: {
        noteId: note._id,
        userId: note.userId,
        content: note.content,
        jobId: note.jobId ? note.jobId._id : null,
        jobTitle: note.jobId ? note.jobId.title : null,
        jobCompany: note.jobId ? note.jobId.company : null,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt
      }
    });
  } catch (err) {
    console.error('Error creating note:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/notes/:noteId - Update a note
router.put('/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    const { content, jobId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Note content is required' });
    }

    // Find note and verify ownership
    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (note.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You can only update your own notes' });
    }

    // Validate jobId if provided
    if (jobId) {
      const job = await Job.findById(jobId);
      if (!job) {
        return res.status(400).json({ message: 'Invalid job ID' });
      }
      note.jobId = jobId;
    } else {
      note.jobId = null;
    }

    note.content = content.trim();
    await note.save();

    // Populate job details if jobId exists
    if (note.jobId) {
      await note.populate('jobId', 'title company');
    }

    return res.status(200).json({
      note: {
        noteId: note._id,
        userId: note.userId,
        content: note.content,
        jobId: note.jobId ? note.jobId._id : null,
        jobTitle: note.jobId ? note.jobId.title : null,
        jobCompany: note.jobId ? note.jobId.company : null,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt
      }
    });
  } catch (err) {
    console.error('Error updating note:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/notes/:noteId - Delete a note
router.delete('/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;

    // Find note and verify ownership
    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (note.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You can only delete your own notes' });
    }

    await Note.findByIdAndDelete(noteId);

    return res.status(200).json({ message: 'Note deleted successfully' });
  } catch (err) {
    console.error('Error deleting note:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;

