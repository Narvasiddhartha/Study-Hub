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

router.get('/:subject', async (req, res) => {
  try {
    const subject = req.params.subject;
    const regex = new RegExp(`^${subject}$`, 'i');
    const questions = await Quiz.find({ subject: regex });

    if (questions.length === 0) {
      return res.status(404).json({ message: `No quiz questions found for ${subject}` });
    }

    // Double shuffle for better randomization on repeat attempts
    const firstShuffle = shuffleArray(questions);
    const finalShuffled = shuffleArray(firstShuffle).slice(0, Math.min(20, questions.length));
    
    console.log(`Serving ${finalShuffled.length} shuffled questions for ${subject}`);
    res.json(finalShuffled);
  } catch (error) {
    console.error('Error fetching quiz questions:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Save quiz result to user profile
router.post('/save-result', auth, async (req, res) => {
  try {
    const { subject, score, totalQuestions, questions, userAnswers, correctAnswers } = req.body;
    const userId = req.user.id;
    const quizDate = new Date();

    console.log('Saving quiz result:', { userId, subject, score, totalQuestions });

    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate new streak
    const streak = applyStreakProgress(user, quizDate);

    // Add quiz result to user's history
    user.quizHistory.push({
      subject,
      score,
      totalQuestions,
      completedAt: quizDate,
      questions: questions || [],
      userAnswers: userAnswers || [],
      correctAnswers: correctAnswers || []
    });

    await user.save();
    console.log('Quiz result and streak saved successfully for user:', userId);
    res.json({ 
      message: 'Quiz result saved successfully',
      streak
    });
  } catch (error) {
    console.error('Error saving quiz result:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
