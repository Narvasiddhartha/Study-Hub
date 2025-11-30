import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/auth.js'; // <-- this line
import resourceRoutes from './routes/resources.js';
import contactRoutes from './routes/contact.js';
import quizRoutes from './routes/quiz.js';
import examRoutes from './routes/exam.js';
import chatbotRoutes from './routes/chatbot.js';
import aiRecommendationsRoutes from './routes/aiRecommendations.js';
import executeRoutes from './routes/execute.js';

dotenv.config();

const app = express();
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// ✅ Register your auth routes
app.use('/auth', authRoutes);
app.use('/resources', resourceRoutes);
app.use('/contact', contactRoutes);
app.use('/quiz', quizRoutes);
app.use('/exam', examRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/ai-recommendations', aiRecommendationsRoutes);
app.use('/api/execute', executeRoutes);
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
