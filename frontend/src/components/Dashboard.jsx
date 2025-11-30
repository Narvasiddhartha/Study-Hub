import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { SUBJECTS } from '../data/subjects';
import axios from '../api/axios';

const DEFAULT_STUDY_MINUTES = 135;

const DEFAULT_FOCUS_SCHEDULE = [
  {
    title: 'OS scheduling drills',
    accent: '#38bdf8',
    order: 0,
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString()
  },
  {
    title: 'Mock interview (DSA)',
    accent: '#fbbf24',
    order: 1,
    startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString()
  },
  {
    title: 'Revise SQL joins',
    accent: '#34d399',
    order: 2,
    startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString()
  }
];

const createClientId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const withClientIds = (schedule = []) =>
  schedule.map((session) => ({
    ...session,
    clientId: session.clientId || session._id || createClientId()
  }));
const cloneSchedule = (schedule = []) => withClientIds(schedule.map((session) => ({ ...session })));
const formatDateInput = (value) => (value ? new Date(value).toISOString().split('T')[0] : '');
const formatTimeInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return `${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
};
const combineDateTime = (dateStr, timeStr) => {
  if (!dateStr) return null;
  if (!timeStr) return new Date(dateStr).toISOString();
  const [hours, minutes] = timeStr.split(':').map(Number);
  const base = new Date(dateStr);
  base.setHours(hours || 0, minutes || 0, 0, 0);
  return base.toISOString();
};

const recommendMinutesFromAccuracy = (accuracy) => {
  if (typeof accuracy !== 'number') return DEFAULT_STUDY_MINUTES;
  const clamped = Math.min(95, Math.max(40, accuracy));
  const inverse = 1 - clamped / 100;
  return Math.round(45 + inverse * 120);
};

const aggregateAccuracy = (history = []) =>
  history.reduce(
    (acc, attempt) => {
      const total =
        attempt.totalQuestions ||
        attempt.questions?.length ||
        attempt.correctAnswers?.length ||
        0;
      if (!total) return acc;
      const score = typeof attempt.score === 'number' ? attempt.score : 0;
      return {
        sum: acc.sum + score / total,
        count: acc.count + 1
      };
    },
    { sum: 0, count: 0 }
  );

const deriveFocusAreasFromHistory = (quizHistory = [], examHistory = []) => {
  const combined = [
    ...quizHistory.map((item) => ({
      subject: item.subject,
      completedAt: item.completedAt
    })),
    ...examHistory.map((item) => ({
      subject: item.subject,
      completedAt: item.completedAt
    }))
  ].filter((entry) => entry.subject);

  combined.sort(
    (a, b) =>
      new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime()
  );

  const unique = [];
  for (const entry of combined) {
    if (!unique.includes(entry.subject)) unique.push(entry.subject);
    if (unique.length === 3) break;
  }
  return unique;
};

const derivePerformanceFromUser = (user) => {
  if (!user) return null;
  const quizHistory = user.quizHistory || [];
  const examHistory = user.examHistory || [];
  const quiz = aggregateAccuracy(quizHistory);
  const exam = aggregateAccuracy(examHistory);
  const totalCount = quiz.count + exam.count;
  if (!totalCount) return null;
  const avgAccuracy = Math.round(((quiz.sum + exam.sum) / totalCount) * 100);
  const focusAreas = deriveFocusAreasFromHistory(quizHistory, examHistory);

  return {
    accuracy: avgAccuracy,
    minutes: recommendMinutesFromAccuracy(avgAccuracy),
    context: 'Quiz + exam history',
    deltaLabel: `${totalCount} attempt${totalCount > 1 ? 's' : ''} analysed`,
    focusAreas,
    quizCount: quizHistory.length,
    longestStreak: user.longestStreak || 0
  };
};

const formatHours = (mins) => {
  if (!mins || mins <= 0) return '1.0h';
  return (mins / 60).toFixed(1) + 'h';
};

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubject, setActiveSubject] = useState(SUBJECTS[0]);
  const [studyRecommendation, setStudyRecommendation] = useState({
    minutes: DEFAULT_STUDY_MINUTES,
    accuracy: null,
    context: 'Recent activity',
    deltaLabel: '+35% vs last week',
    quizCount: 0,
    longestStreak: 0,
    todoCount: 0
  });
  const [focusAreas, setFocusAreas] = useState(
    DEFAULT_FOCUS_SCHEDULE.map((session) => session.title).slice(0, 3)
  );
  const [focusSchedule, setFocusSchedule] = useState(cloneSchedule(DEFAULT_FOCUS_SCHEDULE));
  const [scheduleSnapshot, setScheduleSnapshot] = useState(cloneSchedule(DEFAULT_FOCUS_SCHEDULE));
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleStatus, setScheduleStatus] = useState(null);

  const filteredSubjects = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return SUBJECTS;

    return SUBJECTS.filter((subject) => {
      const matchesName = subject.name.toLowerCase().includes(query);
      const matchesTopic = (subject.topics || []).some((topic) => topic.toLowerCase().includes(query));
      return matchesName || matchesTopic;
    });
  }, [searchTerm]);

  useEffect(() => {
    if (!filteredSubjects.length) {
      setActiveSubject(null);
      return;
    }

    if (!activeSubject || !filteredSubjects.some((subject) => subject.slug === activeSubject.slug)) {
      setActiveSubject(filteredSubjects[0]);
    }
  }, [filteredSubjects, activeSubject]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('studyhub:lastQuizSummary');
      if (!stored) return;
      const summary = JSON.parse(stored);
      if (!summary) return;
      const rawAccuracy =
        typeof summary.percentage === 'number'
          ? summary.percentage
          : summary.score && summary.totalQuestions
            ? Math.round((summary.score / summary.totalQuestions) * 100)
            : null;
      setStudyRecommendation((prev) => ({
        ...prev,
        minutes: recommendMinutesFromAccuracy(rawAccuracy),
        accuracy: rawAccuracy ?? prev.accuracy,
        context: summary.subject ? `${summary.subject} quiz` : prev.context,
        deltaLabel: summary.totalQuestions
          ? `${summary.totalQuestions} question${summary.totalQuestions > 1 ? 's' : ''} analysed`
          : prev.deltaLabel
      }));
      if (summary.subject) {
        setFocusAreas((prev) => {
          const updated = [summary.subject, ...prev.filter((item) => item !== summary.subject)];
          return updated.slice(0, 3);
        });
      }
    } catch (error) {
      console.error('Unable to derive study recommendation', error);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const fetchPerformance = async () => {
      try {
        const response = await axios.get('/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const stats = derivePerformanceFromUser(response.data?.user);
        if (stats) {
          setStudyRecommendation((prev) => ({
            ...prev,
            minutes: stats.minutes,
            accuracy: stats.accuracy,
            context: stats.context,
            deltaLabel: stats.deltaLabel,
            quizCount: stats.quizCount,
            longestStreak: stats.longestStreak,
            todoCount: stats.quizCount // placeholder for tasks queued
          }));
          if (stats.focusAreas?.length) {
            setFocusAreas(stats.focusAreas);
          }
        }
      } catch (error) {
        console.error('Failed to compute overall performance', error);
      }
    };

    const fetchSchedule = async () => {
      try {
        const response = await axios.get('/auth/focus-schedule', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (Array.isArray(response.data?.focusSchedule) && response.data.focusSchedule.length) {
          setFocusSchedule(cloneSchedule(response.data.focusSchedule));
          setScheduleSnapshot(cloneSchedule(response.data.focusSchedule));
          setFocusAreas((prev) =>
            prev && prev.length ? prev : response.data.focusSchedule.slice(0, 3).map((item) => item.title)
          );
        }
      } catch (error) {
        console.error('Failed to fetch focus schedule', error);
      }
    };

    fetchPerformance();
    fetchSchedule();
  }, []);

  const subjectLabel = (subject) => subject?.shortName || subject?.name || '';

  const formatMinutes = (mins) => {
    if (!mins || mins <= 0) return '45m';
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    if (!hours) return `${minutes}m`;
    return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
  };

  const activeStats = activeSubject
    ? [
        { label: 'Topics to aim', value: `${activeSubject.topics?.length || 0}` },
        activeSubject.focus && { label: 'Focus', value: activeSubject.focus },
        activeSubject.duration && { label: 'Suggested pace', value: activeSubject.duration }
      ].filter(Boolean)
    : [];

  const summaryCards = [
    {
      label: 'Quizzes completed',
      value: studyRecommendation.quizCount ?? '—',
      delta: studyRecommendation.quizCount ? `${studyRecommendation.quizCount} attempts logged` : 'Take a quiz',
      icon: '📝'
    },
    {
      label: 'Learning streak',
      value: studyRecommendation.longestStreak ? `${studyRecommendation.longestStreak} days` : '—',
      delta: 'Longest streak',
      icon: '🔥'
    },
    {
      label: 'Focus plan',
      value: focusSchedule.length,
      delta: `${focusSchedule.length ? 'Sessions scheduled' : 'Add a session'}`,
      icon: '📅'
    },
    {
      label: 'Notes updated',
      value: studyRecommendation.todoCount ?? 0,
      delta: 'Coming soon',
      icon: '🗂️'
    }
  ];

  const quickActions = [
    { to: '/Quiz', label: 'Start quiz', description: '20+ adaptive questions', icon: '🎯' },
    { to: '/notes', label: 'Update notes', description: 'Sync across subjects', icon: '🗂️' },
    { to: '/code-editor', label: 'Code sandbox', description: 'Practice snippets', icon: '💡' },
    { to: '/resources', label: 'Explore resources', description: 'Curated collections', icon: '📚' },
    { to: '/Exam', label: 'Start exam', description: 'Proctored mock mode', icon: '🧭' }
  ];

const handleScheduleFieldChange = (index, field, value) => {
  setFocusSchedule((prev) => {
    const updated = [...prev];
    if (!updated[index]) return prev;
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    return updated;
  });
};

const handleScheduleDateChange = (index, type, value) => {
  setFocusSchedule((prev) => {
    const updated = [...prev];
    if (!updated[index]) return prev;
    const start = updated[index]?.startTime || new Date().toISOString();
    const end = updated[index]?.endTime || new Date().toISOString();
    const datePart = type === 'date' ? value : formatDateInput(start);
    const timePart = type === 'time' ? value : formatTimeInput(start);
    updated[index] = {
      ...updated[index],
      startTime: combineDateTime(datePart, timePart)
    };
    if (!updated[index].endTime) {
      const defaultEnd = new Date(updated[index].startTime || start);
      defaultEnd.setMinutes(defaultEnd.getMinutes() + 30);
      updated[index].endTime = defaultEnd.toISOString();
    }
    return updated;
  });
};

const handleScheduleEndChange = (index, type, value) => {
  setFocusSchedule((prev) => {
    const updated = [...prev];
    if (!updated[index]) return prev;
    const end = updated[index]?.endTime || updated[index]?.startTime || new Date().toISOString();
    const datePart = type === 'date' ? value : formatDateInput(end);
    const timePart = type === 'time' ? value : formatTimeInput(end);
    updated[index] = {
      ...updated[index],
      endTime: combineDateTime(datePart, timePart)
    };
    return updated;
  });
};

  const addScheduleEntry = () => {
    setFocusSchedule((prev) => [
      ...prev,
      {
        title: 'New session',
        dayLabel: 'Mon',
        durationMinutes: 30,
        accent: '#38bdf8',
        order: prev.length,
        scheduledAt: new Date().toISOString(),
        clientId: createClientId()
      }
    ]);
  };

  const removeScheduleEntry = (index) => {
    setFocusSchedule((prev) => prev.filter((_, idx) => idx !== index));
  };

  const saveSchedule = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setScheduleStatus({ type: 'error', message: 'Login required to save schedule.' });
      return;
    }
    setScheduleSaving(true);
    setScheduleStatus(null);
    try {
      const payload = {
        focusSchedule: focusSchedule.map((session, index) => ({
          title: session.title || `Session ${index + 1}`,
          accent: session.accent || '#38bdf8',
          order: index,
        startTime: session.startTime || null,
        endTime: session.endTime || null
        }))
      };
      await axios.put('/auth/focus-schedule', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScheduleStatus({ type: 'success', message: 'Schedule saved.' });
      setScheduleSnapshot(cloneSchedule(payload.focusSchedule));
      setFocusAreas(payload.focusSchedule.slice(0, 3).map((session) => session.title));
      setIsEditingSchedule(false);
    } catch (error) {
      console.error('Unable to save schedule', error);
      setScheduleStatus({ type: 'error', message: 'Failed to save. Try again.' });
    } finally {
      setScheduleSaving(false);
    }
  };

  const trendingSubjects = SUBJECTS.slice(0, 4);

  return (
    <div className="dashboard-shell">
      <div className="container py-5">
        {/* Hero */}
        <section className="dashboard-hero gradient-surface p-4 p-md-5 mb-5 rounded-4 position-relative overflow-hidden">
          <div className="row align-items-center">
            <div className="col-lg-7">
              <p className="text-uppercase small fw-bold text-white-50 mb-2">StudyHub Command Center</p>
              <h1 className="display-6 fw-bold text-white mb-3">Plan, practice, and track like an engineering org</h1>
              <p className="text-white-50 fs-6 mb-4">
                Everything you need for consistent prep—adaptive quizzes, AI reviews, curated resources, and progress insights—now
                in one consolidated view.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Link className="btn btn-light text-primary fw-semibold px-4 py-2 rounded-pill shadow-sm" to="/Quiz">
                  Resume quiz flow
                </Link>
                <Link className="btn btn-outline-light fw-semibold px-4 py-2 rounded-pill" to="/resources">
                  View roadmap
                </Link>
              </div>
            </div>
            <div className="col-lg-5 mt-4 mt-lg-0">
              <div className="glass-panel p-4 rounded-4 shadow-lg">
                <div className="d-flex justify-content-end">
                  <small className="text-white-50">Auto-updated</small>
                </div>
                <div className="d-flex flex-column gap-3">
                  <div className="row g-3">
                    <div className="col-sm-6">
                      <p className="text-white-50 mb-1">Overall percentage</p>
                      <h3 className="text-white mb-0">
                        {studyRecommendation.accuracy != null ? `${studyRecommendation.accuracy}%` : '—'}
                      </h3>
                      <span className="badge bg-white text-primary mt-2">
                        {studyRecommendation.context || 'Latest quiz'}
                      </span>
                    </div>
                    <div className="col-sm-6">
                      <p className="text-white-50 mb-1">Recommended daily time</p>
                      <h3 className="text-white mb-0">{formatHours(studyRecommendation.minutes)}</h3>
                      <small className="text-white-50">
                        {studyRecommendation.deltaLabel}
                      </small>
                    </div>
                  </div>
                  <div>
                    <p className="text-white-50 mb-1">Focus areas</p>
                    <div className="d-flex flex-wrap gap-2">
                      {focusAreas.length > 0 ? (
                        focusAreas.map((area) => (
                          <span key={area} className="pill-highlight">{area}</span>
                        ))
                      ) : (
                        <span className="pill-highlight">Take a quiz</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </div>
          <div className="hero-orbit" />
        </section>

        {/* KPI Row */}
        <section className="row g-3 mb-5">
          {summaryCards.map((card) => (
            <div className="col-6 col-lg-3" key={card.label}>
              <div className="kpi-card p-4 rounded-4 h-100 shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="kpi-icon">{card.icon}</span>
                  <small className="text-muted">{card.delta}</small>
                </div>
                <p className="text-uppercase small text-muted mb-1 fw-semibold">{card.label}</p>
                <h3 className="fw-bold mb-0" style={{ color: '#0f172a' }}>{card.value}</h3>
              </div>
            </div>
          ))}
        </section>

        {/* Quick actions + Schedule */}
        <section className="row g-4 mb-5">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                  <div>
                    <p className="text-uppercase small fw-semibold text-muted mb-1">Actions</p>
                    <h4 className="mb-0">What would you like to tackle?</h4>
                  </div>
                </div>
                <div className="row g-3">
                  {quickActions.map((action) => (
                    <div className="col-sm-6" key={action.label}>
                      <Link to={action.to} className="text-decoration-none">
                        <div className="action-card rounded-4 p-3 h-100">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div className="action-icon">{action.icon}</div>
                            <span className="badge bg-light text-muted">Go</span>
                          </div>
                          <h6 className="fw-bold mb-1" style={{ color: '#0f172a' }}>{action.label}</h6>
                          <p className="text-muted small mb-0">{action.description}</p>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-center mb-3 gap-2">
                  <div>
                    <p className="text-uppercase small fw-semibold text-muted mb-1">Focus schedule</p>
                    <h5 className="mb-0">Upcoming</h5>
                  </div>
                  <div className="d-flex gap-2">
                    {isEditingSchedule && (
                      <button
                        className="btn btn-sm btn-primary rounded-pill px-3"
                        onClick={saveSchedule}
                        disabled={scheduleSaving}
                      >
                        {scheduleSaving ? 'Saving...' : 'Save'}
                      </button>
                    )}
                    <button
                      className="btn btn-sm btn-outline-primary rounded-pill px-3"
                      onClick={() => {
                        setIsEditingSchedule((prev) => {
                          if (prev) {
                            setFocusSchedule(cloneSchedule(scheduleSnapshot));
                            return false;
                          }
                          setScheduleSnapshot(cloneSchedule(focusSchedule));
                          return true;
                        });
                        setScheduleStatus(null);
                      }}
                    >
                      {isEditingSchedule ? 'Cancel' : 'Edit'}
                    </button>
                  </div>
                </div>
                {scheduleStatus && (
                  <div
                    className={`alert py-1 px-2 mb-3 small ${
                      scheduleStatus.type === 'success' ? 'alert-success' : 'alert-warning'
                    }`}
                  >
                    {scheduleStatus.message}
                  </div>
                )}
                <div className="d-flex flex-column gap-3 flex-grow-1">
                  {isEditingSchedule ? (
                    <>
                      {focusSchedule.map((session, idx) => (
                        <div
                          key={session.clientId || idx}
                          className="border rounded-4 p-3 d-flex flex-column gap-2 schedule-edit-row"
                        >
                          <div className="row g-2">
                            <div className="col-12">
                              <input
                                className="form-control form-control-sm"
                                value={session.title}
                                onChange={(e) => handleScheduleFieldChange(idx, 'title', e.target.value)}
                                placeholder="Session title"
                              />
                            </div>
                            <div className="col-12 col-md-6">
                              <input
                                className="form-control form-control-sm"
                                value={session.dayLabel}
                                onChange={(e) => handleScheduleFieldChange(idx, 'dayLabel', e.target.value)}
                                placeholder="Day label"
                              />
                            </div>
                          </div>
                          <div className="row g-2">
                            <div className="col-6 col-md-4">
                              <div className="input-group input-group-sm">
                                <span className="input-group-text">⏱</span>
                                <input
                                  type="number"
                                  className="form-control"
                                  value={session.durationMinutes}
                                  onChange={(e) =>
                                    handleScheduleFieldChange(idx, 'durationMinutes', e.target.value)
                                  }
                                  min={5}
                                />
                                <span className="input-group-text">min</span>
                              </div>
                            </div>
                            <div className="col-6 col-md-4">
                              <input
                                type="date"
                                className="form-control form-control-sm"
                                value={formatDateInput(session.startTime)}
                                onChange={(e) => handleScheduleDateChange(idx, 'date', e.target.value)}
                              />
                            </div>
                            <div className="col-6 col-md-4">
                              <input
                                type="time"
                                className="form-control form-control-sm"
                                value={formatTimeInput(session.startTime)}
                                onChange={(e) => handleScheduleDateChange(idx, 'time', e.target.value)}
                              />
                            </div>
                            <div className="col-6 col-md-4">
                              <input
                                type="date"
                                className="form-control form-control-sm"
                                value={formatDateInput(session.endTime)}
                                onChange={(e) => handleScheduleEndChange(idx, 'date', e.target.value)}
                              />
                            </div>
                            <div className="col-6 col-md-4">
                              <input
                                type="time"
                                className="form-control form-control-sm"
                                value={formatTimeInput(session.endTime)}
                                onChange={(e) => handleScheduleEndChange(idx, 'time', e.target.value)}
                              />
                            </div>
                            <div className="col-6 col-md-4">
                              <select
                                className="form-select form-select-sm"
                                value={session.accent}
                                onChange={(e) => handleScheduleFieldChange(idx, 'accent', e.target.value)}
                              >
                                <option value="#38bdf8">Blue</option>
                                <option value="#fbbf24">Amber</option>
                                <option value="#34d399">Green</option>
                                <option value="#f472b6">Pink</option>
                                <option value="#a855f7">Purple</option>
                              </select>
                            </div>
                            <div className="col-6 col-md-4 d-flex justify-content-end align-items-center">
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => removeScheduleEntry(idx)}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm rounded-pill"
                        onClick={addScheduleEntry}
                      >
                        + Add session
                      </button>
                    </>
                  ) : (
                    focusSchedule.map((item, index) => (
                      <div className="d-flex gap-3 align-items-center" key={item.clientId || index}>
                        <span className="schedule-dot" style={{ background: item.accent || '#38bdf8' }} />
                        <div>
                          <p className="mb-0 fw-semibold" style={{ color: '#0f172a' }}>{item.title}</p>
                          <small className="text-muted">
                            {item.startTime
                              ? new Date(item.startTime).toLocaleDateString(undefined, {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short'
                                })
                              : 'Scheduled'}
                            {' · '}
                            {item.startTime
                              ? new Date(item.startTime).toLocaleTimeString(undefined, {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : '--:--'}
                            {' – '}
                            {item.endTime
                              ? new Date(item.endTime).toLocaleTimeString(undefined, {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : '--:--'}
                          </small>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-4 p-3 rounded-4" style={{ background: '#f1f5f9' }}>
                  <p className="small text-muted mb-1">StudyBuddy recommends</p>
                  <p className="mb-0 fw-semibold" style={{ color: '#0f172a' }}>
                    {focusSchedule.length
                      ? `“Revisit ${focusSchedule[0].title} for ${focusSchedule[0].durationMinutes} minutes.”`
                      : '“Add a new focus session to stay on track.”'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Subject grid */}
        <section className="mb-5">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-3 gap-3">
            <div>
              <p className="text-uppercase small fw-semibold text-muted mb-1">Explore</p>
              <h4 className="mb-0">Subjects & roadmaps</h4>
            </div>
            <div className="explore-search input-pill flex-grow-1 flex-md-grow-0">
              <span className="text-muted">🔎</span>
              <input
                type="text"
                placeholder="Search subjects or topics…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Link to="/resources" className="text-decoration-none fw-semibold" style={{ color: '#6366f1' }}>
              View all resources →
            </Link>
          </div>
        <div className="row">
          {filteredSubjects.length > 0 ? (
            filteredSubjects.map((subject) => (
                <div className="col-sm-6 col-xl-3 mb-4" key={subject.slug}>
                <div
                    className={`subject-card-modern h-100 rounded-4 p-3 ${activeSubject?.slug === subject.slug ? 'active' : ''}`}
                    onClick={() => setActiveSubject(subject)}
                  role="button"
                  >
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="subject-icon">{subject.icon}</div>
                      <span className="badge bg-light text-muted">{subject.duration}</span>
                    </div>
                    <h6 className="fw-bold mb-1">{subjectLabel(subject)}</h6>
                    <p className="text-muted small flex-grow-1">{subject.description}</p>
                    <div className="d-flex flex-wrap gap-1 mt-2">
                      {(subject.topics || []).slice(0, 3).map((topic) => (
                        <span key={topic} className="mini-chip">{topic}</span>
                      ))}
                      {subject.topics?.length > 3 && <span className="mini-chip">+{subject.topics.length - 3}</span>}
                  </div>
                    <Link
                      to={subject.link}
                      className="btn btn-outline-primary btn-sm rounded-pill mt-3 fw-semibold align-self-start"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Open module →
                    </Link>
                </div>
              </div>
            ))
          ) : (
              <p className="text-muted text-center py-5">No subjects found for this search.</p>
          )}
        </div>
        </section>

        {/* Deep dive */}
        {activeSubject && (
          <section className="rounded-4 shadow-sm p-4 p-lg-5 mb-5 deep-dive">
            <div className="row g-4">
              <div className="col-lg-4">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <span className="display-5">{activeSubject.icon}</span>
                  <div>
                    <p className="text-uppercase small text-muted mb-1">Active focus</p>
                    <h3 className="mb-0">{subjectLabel(activeSubject)}</h3>
                  </div>
                </div>
                <p className="text-muted">{activeSubject.description}</p>
                <div className="row g-2 mb-4">
                  {activeStats.map((stat) => (
                    <div className="col-12" key={stat.label}>
                      <div className="stat-row d-flex justify-content-between align-items-center rounded-3 p-2">
                        <span className="text-muted small">{stat.label}</span>
                        <strong>{stat.value}</strong>
                      </div>
                    </div>
                  ))}
                </div>
                    <div className="d-flex flex-wrap gap-2">
                  <Link to={activeSubject.link} className="btn btn-primary rounded-pill px-4">Open module</Link>
                  <Link to="/notes" className="btn btn-outline-primary rounded-pill px-4">Notes</Link>
                </div>
              </div>
              <div className="col-lg-8">
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="panel border rounded-4 p-3 h-100">
                      <p className="text-uppercase small text-muted mb-2">Roadmap</p>
                      <ol className="roadmap-modern">
                        {activeSubject.roadmap?.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="panel border rounded-4 p-3 h-100">
                      <p className="text-uppercase small text-muted mb-2">Key topics</p>
                      <div className="d-flex flex-wrap gap-2">
                        {(activeSubject.topics || []).map((topic) => (
                          <span key={topic} className="pill-highlight dark">{topic}</span>
                        ))}
                      </div>
                      </div>
                  </div>
                  <div className="col-md-12">
                    <div className="panel border rounded-4 p-3">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <p className="text-uppercase small text-muted mb-2">Resources</p>
                          <div className="d-flex flex-column gap-2">
                            {activeSubject.resources?.map((resource) => (
                              <a key={resource.label} className="resource-link" href={resource.url} target="_blank" rel="noreferrer">
                                {resource.label} →
                              </a>
                            ))}
                          </div>
              </div>
                        <div className="col-md-6">
                          <p className="text-uppercase small text-muted mb-2">Practice</p>
                          <div className="d-flex flex-column gap-2">
                            {activeSubject.practice?.map((item) => (
                              <a key={item.label} className="resource-link" href={item.url} target="_blank" rel="noreferrer">
                                {item.label} →
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Trending */}
        <section className="mb-5">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-3 gap-3">
            <div>
              <p className="text-uppercase small fw-semibold text-muted mb-1">Trending now</p>
              <h4 className="mb-0">Teams are reviewing</h4>
            </div>
            <Link to="/Quiz" className="btn btn-outline-dark rounded-pill px-4">Take a mixed quiz</Link>
          </div>
          <div className="row g-3">
            {trendingSubjects.map((subject) => (
              <div className="col-md-3" key={`${subject.slug}-trending`}>
                <div className="trending-card rounded-4 p-3 h-100">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="subject-icon small">{subject.icon}</div>
                    <span className="badge bg-primary-subtle text-primary">Hot</span>
                  </div>
                  <h6 className="fw-bold mb-1">{subjectLabel(subject)}</h6>
                  <p className="text-muted small mb-3">{subject.focus}</p>
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">{subject.duration}</small>
                    <Link to={subject.link} className="text-decoration-none fw-semibold" style={{ color: '#4f46e5' }}>
                      Dive in →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <style>{`
        .dashboard-shell {
          min-height: 100vh;
          background: radial-gradient(circle at top, #eef2ff 0%, #f8fafc 55%, #ffffff 100%);
        }
        .gradient-surface {
          background: linear-gradient(135deg,#312e81 0%,#6366f1 50%,#22d3ee 100%);
          color: #fff;
        }
        .glass-panel {
          background: rgba(255,255,255,0.18);
          border: 1px solid rgba(255,255,255,0.3);
          backdrop-filter: blur(12px);
        }
        .pill-highlight {
          display: inline-flex;
          align-items: center;
          padding: 0.35rem 0.9rem;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.5);
          color: #fff;
          font-size: 0.85rem;
        }
        .pill-highlight.dark {
          border-color: #c7d2fe;
          color: #312e81;
          background: #eef2ff;
        }
        .hero-orbit {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 80% -20%, rgba(255,255,255,0.25), transparent 45%);
          pointer-events: none;
        }
        .kpi-card {
          background: #fff;
          border: 1px solid #e2e8f0;
        }
        .kpi-icon {
          font-size: 1.75rem;
        }
        .input-pill {
          background: #f8fafc;
          border-radius: 999px;
          padding: 0.35rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          border: 1px solid #e2e8f0;
        }
        .explore-search {
          min-width: 260px;
          max-width: 480px;
        }
        .input-pill input {
          border: none;
          background: transparent;
          outline: none;
          font-size: 0.95rem;
          width: 200px;
        }
        .action-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          color: inherit;
        }
        .action-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 30px rgba(15,23,42,0.1);
        }
        .action-icon {
          font-size: 1.8rem;
        }
        .schedule-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
        }
        .subject-card-modern {
          border: 1px solid #e2e8f0;
          background: #fff;
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          transition: transform 0.2s, border-color 0.2s;
        }
        .subject-card-modern:hover {
          transform: translateY(-4px);
          border-color: #c7d2fe;
        }
        .subject-card-modern.active {
          border: 2px solid #818cf8;
          box-shadow: 0 18px 40px rgba(99,102,241,0.18);
        }
        .subject-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: #eef2ff;
          font-size: 1.8rem;
        }
        .subject-icon.small {
          width: 40px;
          height: 40px;
          font-size: 1.5rem;
        }
        .mini-chip {
          font-size: 0.7rem;
          padding: 0.2rem 0.6rem;
          border-radius: 999px;
          background: #f1f5f9;
          color: #475569;
        }
        .deep-dive {
          background: linear-gradient(135deg,#ffffff 0%,#f8fafc 100%);
          border: 1px solid #e2e8f0;
        }
        .stat-row {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }
        .panel {
          background: #fff;
        }
        .roadmap-modern {
          counter-reset: roadmap;
          list-style: none;
          padding-left: 0;
        }
        .roadmap-modern li {
          position: relative;
          padding-left: 2rem;
          margin-bottom: 0.85rem;
        }
        .roadmap-modern li::before {
          counter-increment: roadmap;
          content: counter(roadmap);
          position: absolute;
          left: 0;
          top: 0;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #eef2ff;
          color: #4c1d95;
          display: grid;
          place-items: center;
          font-weight: 600;
        }
        .resource-link {
          text-decoration: none;
          color: #4f46e5;
          font-weight: 600;
        }
        .resource-link:hover {
          text-decoration: underline;
        }
        .trending-card {
          border: 1px solid #e2e8f0;
          background: #fff;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .trending-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 30px rgba(15,23,42,0.12);
        }
        @media (max-width: 576px) {
          .input-pill { width: 100%; }
          .input-pill input { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
