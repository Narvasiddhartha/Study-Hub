import mongoose from "mongoose";

const quizAttemptSchema = new mongoose.Schema({
  subject: String,
  score: Number,
  totalQuestions: Number,
  completedAt: { type: Date, default: Date.now },
  questions: [String],
  userAnswers: [String],
  correctAnswers: [String]
});

const examAttemptSchema = new mongoose.Schema({
  subject: String,
  score: Number,
  totalQuestions: Number,
  questions: [String],
  userAnswers: [String],
  correctAnswers: [String],
  duration: { type: Number, default: 0 },
  tabSwitches: { type: Number, default: 0 },
  violations: { type: Number, default: 0 },
  faceCaptured: { type: Boolean, default: false },
  completedAt: { type: Date, default: Date.now }
}, { _id: false });

const streakHistorySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  streakCount: { type: Number, required: true },
  quizzesCompleted: { type: Number, default: 1 }
});

const focusSessionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  accent: { type: String, default: '#38bdf8' },
  order: { type: Number, default: 0 },
  startTime: { type: Date, default: null },
  endTime: { type: Date, default: null }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ["student", "admin"], default: "student" },
  quizHistory: [quizAttemptSchema],
  examHistory: [examAttemptSchema],
  profileImage: { type: String, default: '' }, // Cloudinary image URL
  // Streak related fields
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastQuizDate: { type: Date, default: null },
  streakHistory: [streakHistorySchema],
  focusSchedule: { type: [focusSessionSchema], default: [] },
  // Password reset fields
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, { timestamps: true }); // <-- ✅ this enables createdAt & updatedAt fields

export default mongoose.model("User", userSchema);
