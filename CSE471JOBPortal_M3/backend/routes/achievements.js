const express = require('express');
const mongoose = require('mongoose');
const { verifyToken, authorizeRole } = require('../middleware/auth');
const Achievement = require('../models/Achievement');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// POST /api/achievements - Add new achievement
router.post('/', authorizeRole('applicant'), async (req, res, next) => {
  try {
    const {
      title,
      category,
      dateAchieved,
      issuer,
      description,
      skills,
      proofUrl,
      visibility,
      impactLevel,
      isFeatured,
      industry,
      duration,
      teamSize,
      recognitionLevel,
      difficultyLevel
    } = req.body;

    if (!title || !category || !dateAchieved) {
      return res.status(400).json({ message: 'Title, category, and date achieved are required' });
    }

    const achievement = new Achievement({
      userId: req.user.id,
      title: title.trim(),
      category,
      dateAchieved: new Date(dateAchieved),
      issuer: issuer?.trim() || '',
      description: description?.trim() || '',
      skills: Array.isArray(skills) ? skills.map(s => s.trim()).filter(Boolean) : [],
      proofUrl: proofUrl?.trim() || '',
      visibility: visibility || 'public',
      impactLevel: impactLevel || 'medium',
      isFeatured: isFeatured || false,
      industry: industry?.trim() || '',
      duration: duration ? parseInt(duration) : null,
      teamSize: teamSize || 'individual',
      recognitionLevel: recognitionLevel || 'local',
      difficultyLevel: difficultyLevel || 'intermediate'
    });

    await achievement.save();
    res.status(201).json({ achievement });
  } catch (err) {
    next(err);
  }
});

// GET /api/achievements - List achievements with filters
router.get('/', authorizeRole('applicant'), async (req, res, next) => {
  try {
    const { category, sortBy = 'dateAchieved', sortOrder = 'desc', impactLevel } = req.query;

    const query = { userId: req.user.id };
    if (category) query.category = category;
    if (impactLevel) query.impactLevel = impactLevel;

    let achievements = await Achievement.find(query).lean();

    // Sort achievements in memory for consistent results
    if (sortBy === 'dateAchieved') {
      achievements.sort((a, b) => {
        // Handle null/undefined dates - put them at the end
        if (!a.dateAchieved && !b.dateAchieved) return 0;
        if (!a.dateAchieved) return 1;
        if (!b.dateAchieved) return -1;
        
        // Convert to Date objects and then to timestamps
        // Handle both Date objects and date strings
        let dateA, dateB;
        try {
          dateA = a.dateAchieved instanceof Date ? a.dateAchieved.getTime() : new Date(a.dateAchieved).getTime();
        } catch (e) {
          dateA = 0;
        }
        
        try {
          dateB = b.dateAchieved instanceof Date ? b.dateAchieved.getTime() : new Date(b.dateAchieved).getTime();
        } catch (e) {
          dateB = 0;
        }
        
        // Handle invalid dates
        if (isNaN(dateA) && isNaN(dateB)) return 0;
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;
        
        // Sort: asc means oldest first (smaller dates first), desc means newest first (larger dates first)
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
    } else if (sortBy === 'impactLevel') {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      achievements.sort((a, b) => {
        const orderA = impactOrder[a.impactLevel] || 0;
        const orderB = impactOrder[b.impactLevel] || 0;
        return sortOrder === 'asc' ? orderA - orderB : orderB - orderA;
      });
    } else {
      // Default sort by createdAt
      achievements.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }

    res.json({ achievements });
  } catch (err) {
    next(err);
  }
});

// GET /api/achievements/stats - Get analytics
router.get('/stats', authorizeRole('applicant'), async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userIdObjectId = new mongoose.Types.ObjectId(userId);

    // Total count
    const totalCount = await Achievement.countDocuments({ userId });

    // Count by category
    const categoryBreakdown = await Achievement.aggregate([
      { $match: { userId: userIdObjectId } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Monthly breakdown (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyBreakdown = await Achievement.aggregate([
      {
        $match: {
          userId: userIdObjectId,
          dateAchieved: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$dateAchieved' },
            month: { $month: '$dateAchieved' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Yearly breakdown
    const yearlyBreakdown = await Achievement.aggregate([
      { $match: { userId: userIdObjectId } },
      {
        $group: {
          _id: { $year: '$dateAchieved' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    // Skill coverage
    const skillCoverage = await Achievement.aggregate([
      { $match: { userId: userIdObjectId } },
      { $unwind: '$skills' },
      { $group: { _id: '$skills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    // Impact level breakdown
    const impactBreakdown = await Achievement.aggregate([
      { $match: { userId: userIdObjectId } },
      { $group: { _id: '$impactLevel', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Industry breakdown
    const industryBreakdown = await Achievement.aggregate([
      { $match: { userId: userIdObjectId, industry: { $ne: '' } } },
      { $group: { _id: '$industry', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Team size breakdown
    const teamSizeBreakdown = await Achievement.aggregate([
      { $match: { userId: userIdObjectId } },
      { $group: { _id: '$teamSize', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Recognition level breakdown
    const recognitionBreakdown = await Achievement.aggregate([
      { $match: { userId: userIdObjectId } },
      { $group: { _id: '$recognitionLevel', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Difficulty level breakdown
    const difficultyBreakdown = await Achievement.aggregate([
      { $match: { userId: userIdObjectId } },
      { $group: { _id: '$difficultyLevel', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      totalCount,
      categoryBreakdown: categoryBreakdown.map(item => ({
        category: item._id,
        count: item.count
      })),
      monthlyBreakdown: monthlyBreakdown.map(item => ({
        year: item._id.year,
        month: item._id.month,
        count: item.count
      })),
      yearlyBreakdown: yearlyBreakdown.map(item => ({
        year: item._id,
        count: item.count
      })),
      skillCoverage: skillCoverage.map(item => ({
        skill: item._id,
        count: item.count
      })),
      impactBreakdown: impactBreakdown.map(item => ({
        level: item._id,
        count: item.count
      })),
      industryBreakdown: industryBreakdown.map(item => ({
        industry: item._id,
        count: item.count
      })),
      teamSizeBreakdown: teamSizeBreakdown.map(item => ({
        teamSize: item._id,
        count: item.count
      })),
      recognitionBreakdown: recognitionBreakdown.map(item => ({
        level: item._id,
        count: item.count
      })),
      difficultyBreakdown: difficultyBreakdown.map(item => ({
        level: item._id,
        count: item.count
      }))
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/achievements/:id - Update achievement
router.put('/:id', authorizeRole('applicant'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const achievement = await Achievement.findOne({ _id: id, userId: req.user.id });

    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }

    const {
      title,
      category,
      dateAchieved,
      issuer,
      description,
      skills,
      proofUrl,
      visibility,
      impactLevel,
      isFeatured,
      industry,
      duration,
      teamSize,
      recognitionLevel,
      difficultyLevel
    } = req.body;

    if (title) achievement.title = title.trim();
    if (category) achievement.category = category;
    if (dateAchieved) achievement.dateAchieved = new Date(dateAchieved);
    if (issuer !== undefined) achievement.issuer = issuer.trim();
    if (description !== undefined) achievement.description = description.trim();
    if (skills !== undefined) {
      achievement.skills = Array.isArray(skills) ? skills.map(s => s.trim()).filter(Boolean) : [];
    }
    if (proofUrl !== undefined) achievement.proofUrl = proofUrl.trim();
    if (visibility) achievement.visibility = visibility;
    if (impactLevel) achievement.impactLevel = impactLevel;
    if (isFeatured !== undefined) achievement.isFeatured = isFeatured;
    if (industry !== undefined) achievement.industry = industry.trim();
    if (duration !== undefined) achievement.duration = duration ? parseInt(duration) : null;
    if (teamSize) achievement.teamSize = teamSize;
    if (recognitionLevel) achievement.recognitionLevel = recognitionLevel;
    if (difficultyLevel) achievement.difficultyLevel = difficultyLevel;

    await achievement.save();
    res.json({ achievement });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/achievements/:id - Delete achievement
router.delete('/:id', authorizeRole('applicant'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const achievement = await Achievement.findOneAndDelete({ _id: id, userId: req.user.id });

    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }

    res.json({ message: 'Achievement deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/achievements/bulk-import - Bulk import achievements
router.post('/bulk-import', authorizeRole('applicant'), async (req, res, next) => {
  try {
    const { achievements } = req.body;

    if (!Array.isArray(achievements) || achievements.length === 0) {
      return res.status(400).json({ message: 'Achievements array is required' });
    }

    const achievementsToInsert = achievements.map(ach => ({
      userId: req.user.id,
      title: ach.title?.trim() || '',
      category: ach.category || 'other',
      dateAchieved: new Date(ach.dateAchieved || Date.now()),
      issuer: ach.issuer?.trim() || '',
      description: ach.description?.trim() || '',
      skills: Array.isArray(ach.skills) ? ach.skills.map(s => s.trim()).filter(Boolean) : [],
      proofUrl: ach.proofUrl?.trim() || '',
      visibility: ach.visibility || 'public',
      impactLevel: ach.impactLevel || 'medium',
      isFeatured: ach.isFeatured || false,
      industry: ach.industry?.trim() || '',
      duration: ach.duration ? parseInt(ach.duration) : null,
      teamSize: ach.teamSize || 'individual',
      recognitionLevel: ach.recognitionLevel || 'local',
      difficultyLevel: ach.difficultyLevel || 'intermediate'
    }));

    const inserted = await Achievement.insertMany(achievementsToInsert);
    res.json({ message: `${inserted.length} achievements imported successfully`, achievements: inserted });
  } catch (err) {
    next(err);
  }
});

// GET /api/achievements/export - Export achievements as JSON
router.get('/export', authorizeRole('applicant'), async (req, res, next) => {
  try {
    const achievements = await Achievement.find({ userId: req.user.id })
      .select('-userId -__v -createdAt -updatedAt')
      .lean();

    res.json({ achievements });
  } catch (err) {
    next(err);
  }
});

// GET /api/achievements/public/:applicantId - Get public achievements for an applicant (for recruiters)
router.get('/public/:applicantId', verifyToken, authorizeRole('recruiter'), async (req, res, next) => {
  try {
    const { applicantId } = req.params;

    const achievements = await Achievement.find({
      userId: applicantId,
      visibility: 'public'
    })
      .select('-userId -__v')
      .sort({ dateAchieved: -1 })
      .lean();

    res.json({ achievements });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

