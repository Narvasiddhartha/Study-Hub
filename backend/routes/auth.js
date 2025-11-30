import express from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import auth from '../middleware/authMiddleware.js';
import crypto from 'crypto';
const router = express.Router();

const DEFAULT_FOCUS_SCHEDULE = [
  {
    title: 'OS scheduling drills',
    accent: '#38bdf8',
    order: 0,
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 45 * 60 * 1000)
  },
  {
    title: 'Mock interview (DSA)',
    accent: '#fbbf24',
    order: 1,
    startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000)
  },
  {
    title: 'Revise SQL joins',
    accent: '#34d399',
    order: 2,
    startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000)
  }
];

const storage = multer.diskStorage({});
const upload = multer({ storage });

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ message: 'All fields are required' });

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'Registration successful!' });
  } catch (error) {
    console.error('Registration failed:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required' });

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'studyhubsecret', {
      expiresIn: '7d',
    });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        name: user.name,
        email: user.email,
        joined: user.createdAt,
      },
    });
  } catch (err) {
    console.error('Login failed:', err.message);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Upload profile image endpoint
router.post('/upload-profile-image', auth, upload.single('image'), async (req, res) => {
  try {
    console.log('Received upload request:', req.file, req.user);
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Find the user to get the old image URL
    const userDoc = await User.findById(req.user.id);
    if (userDoc && userDoc.profileImage) {
      // Extract public_id from the old Cloudinary URL
      const matches = userDoc.profileImage.match(/\/profile_images\/([^\.\/]+)\./);
      if (matches && matches[1]) {
        const oldPublicId = `profile_images/${matches[1]}`;
        try {
          await cloudinary.uploader.destroy(oldPublicId);
          console.log('Deleted old Cloudinary image:', oldPublicId);
        } catch (delErr) {
          console.warn('Failed to delete old Cloudinary image:', oldPublicId, delErr.message);
        }
      }
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'profile_images',
      public_id: `user_${req.user.id}_${Date.now()}`
    });
    console.log('Cloudinary result:', result);
    // Update user profileImage
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profileImage: result.secure_url },
      { new: true }
    );
    console.log('Updated user:', user);
    res.json({ imageUrl: result.secure_url, user });
  } catch (err) {
    console.error('Image upload error:', err);
    res.status(500).json({ error: 'Image upload failed', details: err.stack });
  }
});

// Get user profile with quiz history
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Check if streak should be reset due to missed days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (user.lastQuizDate) {
      const lastQuizDay = new Date(user.lastQuizDate);
      lastQuizDay.setHours(0, 0, 0, 0);
      
      // If last quiz was before yesterday, reset streak to 0
      if (lastQuizDay.getTime() < yesterday.getTime()) {
        user.currentStreak = 0;
        await user.save();
      }
    }
    
    console.log('Returning user profile:', user); // Debug log
    res.json({ user }); // user.profileImage should be present
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile', details: err.message });
  }
});

// Get user streak information
router.get('/streak', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if streak should be reset due to missed days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (user.lastQuizDate) {
      const lastQuizDay = new Date(user.lastQuizDate);
      lastQuizDay.setHours(0, 0, 0, 0);
      
      console.log('Streak reset check:', {
        today: today.toISOString(),
        yesterday: yesterday.toISOString(),
        lastQuizDay: lastQuizDay.toISOString(),
        currentStreak: user.currentStreak
      });
      
      // If last quiz was before yesterday, reset streak to 0
      if (lastQuizDay.getTime() < yesterday.getTime()) {
        console.log('Resetting streak to 0 - missed a day');
        user.currentStreak = 0;
        await user.save();
      } else {
        console.log('Streak maintained - no missed days');
      }
    }

    // Sort streak history by date (newest first)
    const sortedHistory = user.streakHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lastQuizDate: user.lastQuizDate,
      streakHistory: sortedHistory,
      quizCount: user.quizHistory.length,
      examCount: user.examHistory.length
    });
  } catch (err) {
    console.error('Error fetching streak info:', err);
    res.status(500).json({ error: 'Failed to fetch streak information', details: err.message });
  }
});

router.get('/focus-schedule', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.focusSchedule || user.focusSchedule.length === 0) {
      user.focusSchedule = DEFAULT_FOCUS_SCHEDULE;
      await user.save();
    }

    res.json({ focusSchedule: user.focusSchedule });
  } catch (error) {
    console.error('Error fetching focus schedule:', error);
    res.status(500).json({ error: 'Failed to fetch focus schedule' });
  }
});

router.put('/focus-schedule', auth, async (req, res) => {
  try {
    const { focusSchedule } = req.body;
    if (!Array.isArray(focusSchedule)) {
      return res.status(400).json({ message: 'focusSchedule must be an array' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const sanitized = focusSchedule.map((session, index) => {
      const start = session.startTime ? new Date(session.startTime) : null;
      const end = session.endTime ? new Date(session.endTime) : null;
      return {
        title: (session.title || `Session ${index + 1}`).toString().slice(0, 80),
        accent:
          typeof session.accent === 'string' && session.accent.trim()
            ? session.accent.trim()
            : DEFAULT_FOCUS_SCHEDULE[index % DEFAULT_FOCUS_SCHEDULE.length].accent,
        order: Number.isFinite(Number(session.order)) ? Number(session.order) : index,
        startTime: start && !isNaN(start) ? start : null,
        endTime: end && !isNaN(end) ? end : null
      };
    });

    user.focusSchedule = sanitized;
    await user.save();

    res.json({ focusSchedule: user.focusSchedule });
  } catch (error) {
    console.error('Error updating focus schedule:', error);
    res.status(500).json({ error: 'Failed to update focus schedule' });
  }
});

// Utility to get quiz history for a user
export async function getUserQuizHistory(userId) {
  const user = await User.findById(userId).select('quizHistory');
  return user ? user.quizHistory : [];
}

// Forgot Password - Generate reset token
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email });
    
    // Always return success message for security (don't reveal if email exists)
    if (!user) {
      return res.status(200).json({ 
        message: 'If that email exists, a password reset link has been sent.' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Set token and expiration (1 hour from now)
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    
    // In development, log the reset URL
    if (process.env.NODE_ENV !== 'production') {
      console.log('Password reset URL:', resetUrl);
    }

    res.status(200).json({ 
      message: 'If that email exists, a password reset link has been sent.',
      // Only include token in development
      ...(process.env.NODE_ENV !== 'production' && { resetToken, resetUrl })
    });
  } catch (err) {
    console.error('Forgot password error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset Password - Verify token and update password
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  try {
    // Hash the token to compare with stored hash
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    // Find user with valid token that hasn't expired
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
