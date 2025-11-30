import React, { useState, useRef, useEffect, useMemo } from 'react';
import axios from '../api/axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { SUBJECTS } from '../data/subjects';

const MAX_HISTORY = 8;
const QUIZ_SUMMARY_STORAGE_KEY = 'studyhub:lastQuizSummary';
const QUIZ_SUMMARY_EVENT = 'studyhub:lastQuizSummary';
const CHATBOT_INTENT_EVENT = 'studyhub:chatbot-intent';

const featureLinks = [
  { label: 'Resources', path: '/resources' },
  { label: 'Quizzes', path: '/Quiz' },
  { label: 'Notes', path: '/notes' },
  { label: 'Contact', path: '/contact' },
  { label: 'FAQ', path: '/faq' },
  { label: 'Profile', path: '/profile' },
];

const TOPBAR_OFFSET = 'calc(var(--topbar-height, 80px) + 16px)';
const CHATBOT_Z_INDEX = 1200;

const Chatbot = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hi! I can explain topics, break down quizzes, or plan your study steps.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [manualSubjectSlug, setManualSubjectSlug] = useState('');
  const [lastQuizSummary, setLastQuizSummary] = useState(null);
  const [attachQuizContext, setAttachQuizContext] = useState(false);
  const [externalIntent, setExternalIntent] = useState(null);
  const chatEndRef = useRef(null);
  const shortcutHandlerRef = useRef(null);

  const detectedSubject = useMemo(() => {
    const path = location.pathname.toLowerCase();
    return (
      SUBJECTS.find((subject) => path.includes(subject.slug.toLowerCase())) || null
    );
  }, [location.pathname]);

  const activeSubject = useMemo(() => {
    if (manualSubjectSlug) {
      return SUBJECTS.find((subject) => subject.slug === manualSubjectSlug) || null;
    }
    return detectedSubject;
  }, [manualSubjectSlug, detectedSubject]);

  useEffect(() => {
    if (open && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadSummary = () => {
      try {
        const stored = localStorage.getItem(QUIZ_SUMMARY_STORAGE_KEY);
        setLastQuizSummary(stored ? JSON.parse(stored) : null);
      } catch (error) {
        console.error('Unable to parse quiz summary from storage', error);
        setLastQuizSummary(null);
      }
    };

    loadSummary();

    const handleSummaryEvent = (event) => {
      if (event?.detail) {
        setLastQuizSummary(event.detail);
      } else {
        loadSummary();
      }
    };

    window.addEventListener(QUIZ_SUMMARY_EVENT, handleSummaryEvent);
    window.addEventListener('storage', handleSummaryEvent);

    return () => {
      window.removeEventListener(QUIZ_SUMMARY_EVENT, handleSummaryEvent);
      window.removeEventListener('storage', handleSummaryEvent);
    };
  }, []);

  useEffect(() => {
    if (!lastQuizSummary) {
      setAttachQuizContext(false);
    }
  }, [lastQuizSummary]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleIntent = (event) => {
      if (!event?.detail?.action) return;
      setOpen(true);
      setExternalIntent(event.detail.action);
    };
    window.addEventListener(CHATBOT_INTENT_EVENT, handleIntent);
    return () => {
      window.removeEventListener(CHATBOT_INTENT_EVENT, handleIntent);
    };
  }, []);

  const getRecentHistory = () =>
    messages
      .filter((msg) => msg.sender === 'user' || msg.sender === 'bot')
      .slice(-MAX_HISTORY)
      .map((msg) => ({ sender: msg.sender, text: msg.text }));

  const determineMode = (options) => {
    if (options.mode) return options.mode;
    if (options.includeQuiz) return 'quiz-review';
    if (activeSubject) return 'subject-explain';
    return 'general';
  };

  const buildSubjectPayload = () => {
    if (!activeSubject) return null;
    return {
      name: activeSubject.name,
      description: activeSubject.description,
      focus: activeSubject.focus,
      duration: activeSubject.duration,
      topics: activeSubject.topics,
      roadmap: activeSubject.roadmap,
      resources: (activeSubject.resources || []).slice(0, 3),
    };
  };

  const describeSubjectContext = (subjectPayload) => {
    if (!subjectPayload) return '';
    const {
      name,
      description,
      focus,
      duration,
      topics = [],
      roadmap = [],
      resources = []
    } = subjectPayload;

    const resourceList = resources.map((item) => `${item.label}: ${item.url}`).join(' | ');

    return [
      `Subject focus: ${name}`,
      description ? `Summary: ${description}` : null,
      focus ? `Primary skill: ${focus}` : null,
      duration ? `Suggested pacing: ${duration}` : null,
      topics.length ? `Key topics: ${topics.slice(0, 6).join(', ')}` : null,
      roadmap.length ? `Roadmap snapshot: ${roadmap.slice(0, 3).join(' ')}` : null,
      resourceList ? `Helpful resources: ${resourceList}` : null
    ]
      .filter(Boolean)
      .join('\n');
  };

  const buildQuizPayload = () => {
    if (!lastQuizSummary) return null;
    return {
      ...lastQuizSummary,
      incorrect: (lastQuizSummary.incorrect || []).slice(0, 5),
    };
  };

  const describeQuizSummary = (summary) => {
    if (!summary) return '';
    const {
      subject,
      score,
      totalQuestions,
      percentage,
      incorrect = [],
      completedAt
    } = summary;

    const mistakesBlock = incorrect
      .map(
        (item, idx) =>
          `${idx + 1}. Question: ${item.question}\n   You answered: ${item.userAnswer}\n   Correct answer: ${item.correctAnswer}`
      )
      .join('\n');

    return [
      'Here is the latest quiz attempt:',
      subject ? `• Subject: ${subject}` : null,
      typeof score === 'number' && typeof totalQuestions === 'number'
        ? `• Score: ${score}/${totalQuestions} (${percentage ?? Math.round((score / totalQuestions) * 100)}%)`
        : null,
      completedAt ? `• Completed at: ${completedAt}` : null,
      incorrect.length
        ? `• Mistakes (${incorrect.length}):\n${mistakesBlock}`
        : '• No mistakes recorded'
    ]
      .filter(Boolean)
      .join('\n');
  };

  const sendChatMessage = async (prompt, options = {}) => {
    const trimmedPrompt = typeof prompt === 'string' ? prompt.trim() : '';
    if (!trimmedPrompt) return;

    const { clearInput = true } = options;
    const includeQuizContext = Boolean(
      (options.includeQuiz ?? attachQuizContext) && lastQuizSummary
    );

    const historyPayload = getRecentHistory();
    const userMsg = { sender: 'user', text: trimmedPrompt };
    setMessages((prev) => [...prev, userMsg]);
    if (clearInput) {
      setInput('');
    }
    setLoading(true);

    const subjectPayload = buildSubjectPayload();
    const payload = {
      message: trimmedPrompt,
      history: historyPayload,
      mode: determineMode({ ...options, includeQuiz: includeQuizContext })
    };

    if (subjectPayload) {
      payload.subjectContext = subjectPayload;
    }
    if (includeQuizContext) {
      payload.quizSummary = buildQuizPayload();
    }

    const textualSubjectContext =
      subjectPayload && options.mode === 'subject-explain'
        ? describeSubjectContext(subjectPayload)
        : '';
    const textualQuizSummary = includeQuizContext
      ? describeQuizSummary(payload.quizSummary)
      : '';

    const finalPrompt = [trimmedPrompt, textualSubjectContext, textualQuizSummary]
      .filter(Boolean)
      .join('\n\n');
    payload.message = finalPrompt;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.post('/api/chatbot', payload, config);
      const reply = response.data?.reply || 'I could not get a response.';
      setMessages((prev) => [...prev, { sender: 'bot', text: reply }]);
    } catch (error) {
      console.error('Chatbot error', error);
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Sorry, I could not get a response.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (event) => {
    event.preventDefault();
    sendChatMessage(input, { clearInput: true });
  };

  const handleShortcut = (type) => {
    if (type === 'quiz-review') {
      if (!lastQuizSummary) return;
      sendChatMessage('Review my last quiz attempt and explain each mistake.', {
        includeQuiz: true,
        mode: 'quiz-review',
        clearInput: false
      });
      return;
    }

    if (type === 'subject-explain') {
      if (!activeSubject) return;
      sendChatMessage(`Explain ${activeSubject.name} and guide me step-by-step.`, {
        mode: 'subject-explain',
        clearInput: false
      });
      return;
    }

    if (type === 'study-plan') {
      sendChatMessage('Create a one-week study plan with checkpoints.', {
        mode: 'general',
        clearInput: false
      });
    }
  };
  shortcutHandlerRef.current = handleShortcut;

  useEffect(() => {
    if (!externalIntent) return;
    if (shortcutHandlerRef.current) {
      shortcutHandlerRef.current(externalIntent);
    }
    setExternalIntent(null);
  }, [externalIntent]);

  const handleClear = () => {
    setMessages([
      { sender: 'bot', text: 'Hi! I can explain topics, break down quizzes, or plan your study steps.' }
    ]);
  };

  const handleButtonClick = () => setOpen((prev) => !prev);

  const subjectTopicsPreview = activeSubject?.topics?.slice(0, 3).join(', ');
  const incorrectCount = lastQuizSummary?.incorrect?.length || 0;
  const latestMistake = lastQuizSummary?.incorrect?.[0];

  return (
    <>
      <button
        onClick={handleButtonClick}
        style={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          zIndex: CHATBOT_Z_INDEX,
          borderRadius: 18,
          width: 64,
          height: 64,
          background: 'linear-gradient(135deg,#6366f1,#60a5fa)',
          color: '#fff',
          border: 'none',
          boxShadow: '0 8px 24px rgba(99,102,241,0.25)',
          fontSize: 26,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform .15s ease',
        }}
        aria-label={open ? 'Close chatbot' : 'Open chatbot'}
        title={open ? 'Close chatbot' : 'Open chatbot'}
      >
        {open ? '×' : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 12C21 16.4183 16.9706 20 12 20C10.3431 20 8.794 19.6582 7.46447 19.0503L3 20L4.05025 15.5355C3.3418 14.206 3 12.6569 3 11C3 6.58172 7.02944 3 12 3C16.9706 3 21 6.58172 21 12Z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            top: TOPBAR_OFFSET,
            right: 32,
            width: 400,
            maxWidth: '95vw',
            height: 'min(560px, calc(100vh - (var(--topbar-height, 80px) + 64px)))',
            background: 'linear-gradient(180deg,#ffffff 0%,#f8fafc 100%)',
            borderRadius: 16,
            boxShadow: '0 20px 48px rgba(15,23,42,0.22)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: CHATBOT_Z_INDEX,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: 700, color: '#0f172a' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, background: '#22c55e', borderRadius: 9999, display: 'inline-block' }} />
              StudyBuddy
            </span>
            <button
              onClick={handleClear}
              style={{
                background: 'transparent',
                border: '1px solid #e5e7eb',
                color: '#475569',
                fontSize: 14,
                cursor: 'pointer',
                padding: '2px 8px',
                borderRadius: 8,
                transition: 'background 0.2s',
              }}
              title="Clear chat"
            >
              Reset
            </button>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              background: '#f8fafc',
              fontSize: 15,
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  padding: '12px 14px',
                  boxShadow: '0 12px 35px rgba(15,23,42,0.08)',
                  marginBottom: lastQuizSummary ? 12 : 16,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>Subject context</span>
                  {detectedSubject && !manualSubjectSlug && (
                    <span style={{ fontSize: 12, color: '#6366f1' }}>Auto: {detectedSubject.shortName || detectedSubject.name}</span>
                  )}
                </div>
                <select
                  value={manualSubjectSlug}
                  onChange={(e) => setManualSubjectSlug(e.target.value)}
                  style={{
                    width: '100%',
                    borderRadius: 10,
                    border: '1px solid #dbeafe',
                    padding: '8px 10px',
                    marginBottom: 10,
                    fontSize: 14,
                    background: '#f8fafc'
                  }}
                >
                  <option value="">
                    {detectedSubject ? `Auto • ${detectedSubject.name}` : 'Auto-detect based on page'}
                  </option>
                  {SUBJECTS.map((subject) => (
                    <option key={subject.slug} value={subject.slug}>
                      {subject.name}
                    </option>
                  ))}
                </select>
                {activeSubject ? (
                  <>
                    <p style={{ fontSize: 13.5, color: '#475569', marginBottom: 8 }}>
                      {activeSubject.description}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                      {activeSubject.focus && (
                        <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 9999, background: '#eef2ff', color: '#4338ca' }}>
                          Focus: {activeSubject.focus}
                        </span>
                      )}
                      {activeSubject.duration && (
                        <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 9999, background: '#ecfccb', color: '#3f6212' }}>
                          Duration: {activeSubject.duration}
                        </span>
                      )}
                    </div>
                    {subjectTopicsPreview && (
                      <div style={{ fontSize: 12.5, color: '#475569', marginBottom: 10 }}>
                        Key topics: {subjectTopicsPreview}{activeSubject.topics.length > 3 ? '…' : ''}
                      </div>
                    )}
                    <button
                      onClick={() => handleShortcut('subject-explain')}
                      style={{
                        background: 'linear-gradient(90deg,#4f46e5,#6366f1)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 10,
                        padding: '8px 14px',
                        fontSize: 14,
                        cursor: 'pointer'
                      }}
                    >
                      Explain this topic
                    </button>
                  </>
                ) : (
                  <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 0 }}>
                    Select a subject (or navigate to a subject page) to help the assistant tailor responses.
                  </p>
                )}
              </div>

              {lastQuizSummary && (
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 12,
                    padding: '12px 14px',
                    boxShadow: '0 12px 35px rgba(15,23,42,0.08)',
                    marginBottom: 12,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>Latest quiz recap</span>
                    <span style={{ fontSize: 12, color: '#6366f1' }}>{lastQuizSummary.subject}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 13 }}>
                    <div style={{ background: '#eef2ff', borderRadius: 10, padding: '6px 10px', color: '#4338ca' }}>
                      Score: {lastQuizSummary.score}/{lastQuizSummary.totalQuestions}
                    </div>
                    <div style={{ background: '#ecfeff', borderRadius: 10, padding: '6px 10px', color: '#0f766e' }}>
                      Accuracy: {lastQuizSummary.percentage}%
                    </div>
                    <div style={{ background: '#fee2e2', borderRadius: 10, padding: '6px 10px', color: '#b91c1c' }}>
                      Mistakes: {incorrectCount}
                    </div>
                  </div>
                  {latestMistake && (
                    <div style={{ fontSize: 12.5, color: '#475569', marginTop: 10 }}>
                      Recent issue: {latestMistake.question}
                      <br />
                      You: {latestMistake.userAnswer} • Correct: {latestMistake.correctAnswer}
                    </div>
                  )}
                  <button
                    onClick={() => handleShortcut('quiz-review')}
                    style={{
                      background: 'linear-gradient(90deg,#ec4899,#f97316)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      padding: '8px 14px',
                      fontSize: 14,
                      cursor: 'pointer',
                      marginTop: 10
                    }}
                  >
                    Review last quiz
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {activeSubject && (
                  <button
                    onClick={() => handleShortcut('subject-explain')}
                    style={{
                      borderRadius: 9999,
                      border: '1px solid #c7d2fe',
                      padding: '6px 12px',
                      fontSize: 13,
                      background: '#eef2ff',
                      color: '#4c1d95',
                      cursor: 'pointer'
                    }}
                  >
                    Explain this topic
                  </button>
                )}
                {lastQuizSummary && (
                  <button
                    onClick={() => handleShortcut('quiz-review')}
                    style={{
                      borderRadius: 9999,
                      border: '1px solid #fed7aa',
                      padding: '6px 12px',
                      fontSize: 13,
                      background: '#fff7ed',
                      color: '#9a3412',
                      cursor: 'pointer'
                    }}
                  >
                    Review last quiz
                  </button>
                )}
                <button
                  onClick={() => handleShortcut('study-plan')}
                  style={{
                    borderRadius: 9999,
                    border: '1px solid #bae6fd',
                    padding: '6px 12px',
                    fontSize: 13,
                    background: '#e0f2fe',
                    color: '#075985',
                    cursor: 'pointer'
                  }}
                >
                  Plan my study week
                </button>
              </div>
            </div>

            {messages.map((msg, index) => (
              <div
                key={`${msg.sender}-${index}`}
                style={{
                  marginBottom: 10,
                  textAlign: msg.sender === 'user' ? 'right' : 'left',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    background: msg.sender === 'user' ? 'linear-gradient(90deg,#6366f1,#60a5fa)' : '#fff',
                    color: msg.sender === 'user' ? '#fff' : '#0f172a',
                    borderRadius: 14,
                    padding: '8px 12px',
                    maxWidth: '85%',
                    wordBreak: 'break-word',
                    boxShadow: msg.sender === 'bot' ? '0 6px 20px rgba(15,23,42,0.08)' : 'none'
                  }}
                >
                  {msg.text}
                </span>
              </div>
            ))}
            {loading && (
              <div style={{ color: '#64748b', fontSize: 14, marginBottom: 8 }}>Assistant is typing...</div>
            )}

            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, color: '#94a3b8', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
                Quick links
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {featureLinks.map((feature) => (
                  <button
                    key={feature.path}
                    onClick={() => navigate(feature.path)}
                    style={{
                      background: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      padding: '6px 12px',
                      fontSize: 13,
                      cursor: 'pointer'
                    }}
                  >
                    {feature.label}
                  </button>
                ))}
              </div>
            </div>
            <div ref={chatEndRef} />
          </div>

          {lastQuizSummary && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 16px 0', fontSize: 12.5, color: '#475569' }}>
              <input
                type="checkbox"
                checked={attachQuizContext}
                onChange={(e) => setAttachQuizContext(e.target.checked)}
              />
              Attach last quiz summary to next question
            </label>
          )}

          <form
            onSubmit={handleSend}
            style={{ display: 'flex', borderTop: '1px solid #e5e7eb', padding: 10, background: '#ffffff', borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              style={{
                flex: 1,
                border: '1px solid #e5e7eb',
                outline: 'none',
                fontSize: 15,
                background: '#fff',
                padding: '8px 10px',
                borderRadius: 10,
              }}
              disabled={loading}
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                background: 'linear-gradient(90deg,#6366f1,#60a5fa)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '0 16px',
                marginLeft: 8,
                fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default Chatbot;
