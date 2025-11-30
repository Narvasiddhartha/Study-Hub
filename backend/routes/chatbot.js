import express from 'express';
import axios from 'axios';

const router = express.Router();

const MODE_GUIDANCE = {
  general: 'Offer concise, encouraging explanations tailored to computer science students. Provide actionable next steps and highlight relevant StudyHub areas when helpful.',
  'subject-explain': 'Act like a subject matter coach. Start with a crisp summary, list the most important sub-topics, then outline a short practice plan.',
  'quiz-review': 'Act like a post-quiz tutor. Start with overall performance, then explain each mistake step-by-step, highlight misconceptions, and suggest targeted practice.'
};

const formatSubjectContext = (subjectContext = {}) => {
  const {
    name,
    description,
    focus,
    duration,
    topics = [],
    roadmap = [],
    resources = []
  } = subjectContext;

  const resourceList = resources
    .slice(0, 3)
    .map((item) => `${item.label}: ${item.url}`)
    .join(' | ');

  return [
    `Subject focus: ${name || 'Unknown subject'}`,
    description ? `Summary: ${description}` : null,
    focus ? `Primary skill: ${focus}` : null,
    duration ? `Suggested pacing: ${duration}` : null,
    topics.length ? `Core topics: ${topics.join(', ')}` : null,
    roadmap.length ? `Roadmap milestones: ${roadmap.join(' ')}` : null,
    resourceList ? `Helpful resources: ${resourceList}` : null
  ]
    .filter(Boolean)
    .join('\n');
};

const formatQuizSummary = (quizSummary = {}) => {
  const {
    subject,
    score,
    totalQuestions,
    percentage,
    incorrect = [],
    completedAt
  } = quizSummary;

  const mistakeLines = incorrect
    .slice(0, 5)
    .map(
      (item, idx) =>
        `${idx + 1}. Q: ${item.question}\n   Chosen: ${item.userAnswer || 'No answer'}\n   Correct: ${item.correctAnswer}`
    )
    .join('\n');

  return [
    'Recent quiz context:',
    subject ? `• Subject: ${subject}` : null,
    typeof score === 'number' && typeof totalQuestions === 'number'
      ? `• Score: ${score}/${totalQuestions} (${percentage ?? Math.round((score / totalQuestions) * 100)}%)`
      : null,
    completedAt ? `• Completed at: ${completedAt}` : null,
    incorrect.length ? `• Mistakes (${Math.min(incorrect.length, 5)} shown):\n${mistakeLines}` : '• No mistakes recorded 🎉'
  ]
    .filter(Boolean)
    .join('\n');
};

const transformHistory = (history = []) =>
  history
    .filter((entry) => entry && entry.text)
    .slice(-8)
    .map((entry) => ({
      role: entry.sender === 'bot' ? 'assistant' : 'user',
      content: entry.text
    }));

router.post('/', async (req, res) => {
  const {
    message,
    subjectContext,
    quizSummary,
    history = [],
    mode = 'general'
  } = req.body;

  const userPrompt = typeof message === 'string' ? message.trim() : '';
  if (!userPrompt) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const compiledContextSegments = [];
  if (subjectContext) {
    compiledContextSegments.push(formatSubjectContext(subjectContext));
  }
  if (quizSummary) {
    compiledContextSegments.push(formatQuizSummary(quizSummary));
  }
  const compiledContext =
    compiledContextSegments.join('\n\n') ||
    'No additional StudyHub context was provided.';

  const systemPrompt = [
    "You are StudyHub's AI tutor assisting computer science students.",
    MODE_GUIDANCE[mode] || MODE_GUIDANCE.general,
    'Always reference the provided context first, explain reasoning step-by-step, and close with one actionable suggestion.',
    `Context:\n${compiledContext}`
  ].join('\n\n');

  const conversationHistory = transformHistory(history);

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-3.5-turbo',
        temperature: 0.4,
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: userPrompt }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const botReply = response.data?.choices?.[0]?.message?.content || 'I could not generate a response.';
    res.json({ reply: botReply });
  } catch (error) {
    console.error('Chatbot error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get response from chatbot' });
  }
});

export default router;