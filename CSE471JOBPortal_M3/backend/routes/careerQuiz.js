const express = require('express');
const { verifyToken, authorizeRole } = require('../middleware/auth');
const { generateCareerRecommendations, fetchJobListings } = require('../services/careerGuidanceService');

const router = express.Router();

// Test route to verify router is working (remove after testing)
router.get('/test', (req, res) => {
  console.log('[Career Quiz] Test route hit!');
  res.json({ message: 'Career Quiz router is working!' });
});

// All routes require authentication and applicant role
router.use(verifyToken);
router.use(authorizeRole('applicant'));

/**
 * POST /api/career-quiz/submit
 * Submit quiz answers and get career recommendations
 */
router.post('/submit', async (req, res) => {
  try {
    const { answers } = req.body;

    // Validate input
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ 
        message: 'Quiz answers are required and must be a non-empty array' 
      });
    }

    // Validate each answer has required fields
    for (const answer of answers) {
      if (!answer.questionId || !answer.answer) {
        return res.status(400).json({ 
          message: 'Each answer must have questionId and answer fields' 
        });
      }
    }

    console.log(`[Career Quiz] Processing quiz submission for user ${req.user.id}`);

    // Generate career recommendations using OpenAI
    const recommendations = await generateCareerRecommendations(answers);

    // Optionally fetch job listings for recommended careers
    const careerTitles = recommendations.map(rec => rec.title);
    const jobListings = await fetchJobListings(careerTitles);

    return res.status(200).json({
      success: true,
      recommendations: recommendations,
      jobListings: jobListings,
      message: 'Career recommendations generated successfully'
    });

  } catch (err) {
    console.error('Error processing career quiz:', err);
    return res.status(500).json({ 
      message: 'Server error', 
      error: err.message 
    });
  }
});

/**
 * GET /api/career-quiz/questions
 * Get the quiz questions (optional endpoint for dynamic questions)
 */
router.get('/questions', async (req, res) => {
  try {
    console.log('[Career Quiz] Questions endpoint called by user:', req.user.id);
    // Return predefined quiz questions
    const questions = [
      {
        questionId: 'q1',
        question: 'What are your primary interests?',
        options: [
          'Technology and Programming',
          'Business and Management',
          'Creative Arts and Design',
          'Data Analysis and Research',
          'Communication and Marketing'
        ]
      },
      {
        questionId: 'q2',
        question: 'What are your strongest skills?',
        options: [
          'Problem-solving and Logical Thinking',
          'Communication and Leadership',
          'Creativity and Design',
          'Analytical and Research',
          'Technical and Programming'
        ]
      },
      {
        questionId: 'q3',
        question: 'What type of work environment do you prefer?',
        options: [
          'Remote/Flexible',
          'Office-based with Team Collaboration',
          'Independent and Self-directed',
          'Fast-paced and Dynamic',
          'Structured and Organized'
        ]
      },
      {
        questionId: 'q4',
        question: 'Are you more inclined towards technical or non-technical work?',
        options: [
          'Highly Technical (Coding, Engineering)',
          'Moderately Technical (Data, Analysis)',
          'Non-Technical (Business, Communication)',
          'Mixed (Technical + Creative)',
          'Not Sure / Open to Both'
        ]
      },
      {
        questionId: 'q5',
        question: 'What are your long-term career goals?',
        options: [
          'Become a Technical Expert/Specialist',
          'Move into Management/Leadership',
          'Start My Own Business',
          'Work in a Creative Field',
          'Make a Social Impact'
        ]
      },
      {
        questionId: 'q6',
        question: 'How do you prefer to solve problems?',
        options: [
          'Through Code and Technical Solutions',
          'Through Research and Data Analysis',
          'Through Creative Thinking and Innovation',
          'Through Collaboration and Teamwork',
          'Through Strategic Planning'
        ]
      },
      {
        questionId: 'q7',
        question: 'What motivates you most in your work?',
        options: [
          'Solving Complex Technical Challenges',
          'Helping Others and Making Impact',
          'Creative Expression and Innovation',
          'Financial Success and Growth',
          'Learning and Personal Development'
        ]
      },
      {
        questionId: 'q8',
        question: 'What type of projects do you enjoy most?',
        options: [
          'Building Software Applications',
          'Analyzing Data and Trends',
          'Designing User Experiences',
          'Managing Teams and Projects',
          'Marketing and Communication Campaigns'
        ]
      }
    ];

    return res.status(200).json({
      success: true,
      questions: questions
    });

  } catch (err) {
    console.error('Error fetching quiz questions:', err);
    return res.status(500).json({ 
      message: 'Server error', 
      error: err.message 
    });
  }
});

module.exports = router;
