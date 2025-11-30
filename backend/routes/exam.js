import express from 'express';
import Quiz from '../models/Quiz.js';
import User from '../models/User.js';
import auth from '../middleware/authMiddleware.js';
import { applyStreakProgress } from '../utils/streakUtils.js';

const router = express.Router();

// Shuffle array function
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Get exam questions for a subject (EXACTLY 40 questions, 45 minutes)
router.get('/:subject', async (req, res) => {
  try {
    const { subject } = req.params;
    const questions = await Quiz.find({
      subject: { $regex: new RegExp(`^${subject}$`, 'i') }
    });

    if (!questions || questions.length === 0) {
      return res.status(404).json({ message: `No exam questions found for ${subject}` });
    }

    // Check if we have at least 40 questions
    if (questions.length < 40) {
      return res.status(400).json({ 
        message: `Insufficient questions for ${subject}. Found ${questions.length}, required 40. Please add more questions to the database.` 
      });
    }

    // Shuffle questions (different order for each user/request)
    const shuffled = shuffleArray(questions);
    
    // Select EXACTLY 40 questions
    const examQuestions = shuffled.slice(0, 40);

    // Verify we have exactly 40
    if (examQuestions.length !== 40) {
      return res.status(500).json({ 
        message: `Failed to generate exam. Expected 40 questions, got ${examQuestions.length}` 
      });
    }

    console.log(`Serving ${examQuestions.length} shuffled exam questions for ${subject}`);
    res.json(examQuestions);
  } catch (error) {
    console.error('Error fetching exam questions:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Save exam result
router.post('/save-result', auth, async (req, res) => {
  try {
    const { subject, score, totalQuestions, questions, userAnswers, correctAnswers, duration, tabSwitches, violations, faceCaptured } = req.body;
    const userId = req.user.id;
    const completedAt = new Date();

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add exam result to examHistory
    user.examHistory.push({
      subject,
      score,
      totalQuestions,
      questions,
      userAnswers,
      correctAnswers,
      duration,
      tabSwitches: tabSwitches || 0,
      violations: violations || 0,
      faceCaptured: faceCaptured || false,
      completedAt
    });

    const streak = applyStreakProgress(user, completedAt);

    await user.save();

    res.status(200).json({ 
      message: 'Exam result saved successfully',
      examHistory: user.examHistory,
      streak
    });
  } catch (error) {
    console.error('Error saving exam result:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user exam history
router.get('/history/all', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('examHistory');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ examHistory: user.examHistory || [] });
  } catch (error) {
    console.error('Error fetching exam history:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

