import React from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const subjects = [
  { name: 'Java', icon: '☕', description: 'Master JVM fundamentals & high-scale patterns.', duration: '20 min', difficulty: 'Intermediate', accent: '#f97316' },
  { name: 'Python', icon: '🐍', description: 'Automation, data science, and scripting best practices.', duration: '20 min', difficulty: 'Beginner', accent: '#22c55e' },
  { name: 'Operating Systems', icon: '🖥', description: 'Scheduling, memory, and concurrency deep-dive.', duration: '20 min', difficulty: 'Advanced', accent: '#6366f1' },
  { name: 'DBMS', icon: '💾', description: 'Normalization, indexing, and query tuning essentials.', duration: '20 min', difficulty: 'Intermediate', accent: '#0ea5e9' },
  { name: 'DSA', icon: '📗', description: 'Ace interviews with optimized data structures & algorithms.', duration: '20 min', difficulty: 'Advanced', accent: '#f43f5e' },
  { name: 'Computer Networks', icon: '🌐', description: 'OSI, TCP/IP, routing, and reliability concepts.', duration: '20 min', difficulty: 'Intermediate', accent: '#14b8a6' },
  { name: 'Web Development', icon: '🌍', description: 'Modern stacks, performance, and accessibility.', duration: '20 min', difficulty: 'Beginner', accent: '#8b5cf6' },
  { name: 'Software Engineering', icon: '📋', description: 'SDLC, design patterns, and delivery excellence.', duration: '20 min', difficulty: 'Intermediate', accent: '#facc15' },
  { name: 'Machine Learning', icon: '🧠', description: 'Model intuition, metrics, and deployment hints.', duration: '20 min', difficulty: 'Advanced', accent: '#ec4899' },
  { name: 'Placement Prep', icon: '🏆', description: 'Curated mix of aptitude, tech, and HR scenarios.', duration: '20 min', difficulty: 'All levels', accent: '#0ea5e9' }
];

const highlightStats = [
  { label: 'Question bank', value: '2,400+', detail: 'curated MCQs' },
  { label: 'Timed window', value: '20 min', detail: 'auto-submitted quizzes' },
  { label: 'Success rate', value: '94%', detail: 'improved accuracy' }
];

const sellingPoints = [
  '20-minute proctored timer with camera & tab safety.',
  'Adaptive question pool refreshed weekly.',
  'Instant scorecards synced with streaks & AI coach.'
];

const Quiz = () => {
  const navigate = useNavigate();

  return (
    <div className="quiz-shell min-vh-100 py-5">
      <div className="container">
        <section className="quiz-hero rounded-4 shadow-lg p-5 mb-5 position-relative overflow-hidden">
          <div className="row g-4 align-items-center">
            <div className="col-lg-7">
              <p className="badge bg-white text-primary-emphasis mb-3 px-3 py-2 rounded-pill fw-semibold">
                Live question bank • Updated weekly
              </p>
              <h1 className="display-5 fw-bold text-white mb-3">
                Choose a subject to start your next quiz sprint.
              </h1>
              <p className="lead text-white-50 mb-4">
                Curated by mentors from top product companies. Each quiz blends fundamentals, scenario-based questions, and rapid feedback so you stay interview-ready.
              </p>
              <ul className="hero-points text-white-75 mb-4">
                {sellingPoints.map((point) => (
                  <li key={point} className="d-flex align-items-center gap-2">
                    <span className="point-dot" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <div className="d-flex flex-wrap gap-2">
                <button className="btn btn-light text-primary fw-semibold px-4" onClick={() => navigate('/dashboard')}>
                  View performance
                </button>
                <button className="btn btn-outline-light fw-semibold px-4" onClick={() => navigate('/Exam')}>
                  Switch to mock exam
                </button>
              </div>
            </div>
            <div className="col-lg-5">
              <div className="highlight-grid">
                {highlightStats.map((stat) => (
                  <div key={stat.label} className="highlight-card rounded-4 p-4 text-start shadow-sm bg-white">
                    <small className="text-muted text-uppercase fw-semibold">{stat.label}</small>
                    <h3 className="fw-bold mb-0" style={{ color: '#111827' }}>{stat.value}</h3>
                    <p className="text-muted mb-0">{stat.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="hero-glow" />
        </section>

        <section>
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div>
              <p className="text-uppercase text-muted fw-semibold mb-1">Catalog</p>
              <h4 className="fw-bold mb-0" style={{ color: '#0f172a' }}>Pick your focus area</h4>
            </div>
            <span className="text-muted small">
              {subjects.length} tracks • adaptive feedback • instant reporting
            </span>
          </div>

          <div className="quiz-grid">
            {subjects.map((subject) => (
              <article
                key={subject.name}
                className="subject-card rounded-4"
                role="button"
                onClick={() => navigate(`/quiz/${subject.name}`)}
              >
                <div className="subject-icon" style={{ background: subject.accent }}>
                  <span>{subject.icon}</span>
                </div>
                <div className="subject-content">
                  <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                    <h5 className="fw-bold mb-0">{subject.name}</h5>
                    <span className="badge bg-light text-muted text-capitalize">{subject.difficulty}</span>
                  </div>
                  <p className="text-muted mb-3">{subject.description}</p>
                  <div className="d-flex justify-content-between align-items-center text-muted small mb-3">
                    <span>⏱ {subject.duration}</span>
                    <span>📚 20+ curated questions</span>
                  </div>
                  <button className="btn btn-primary w-100 fw-semibold">Start quiz</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <style>{`
        .quiz-shell {
          background: radial-gradient(circle at top, #eef2ff, #f8fafc 35%, #ffffff 90%);
        }
        .quiz-hero {
          background: linear-gradient(120deg, #1d4ed8, #4f46e5 45%, #7c3aed);
          border: none;
        }
        .hero-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 30% -10%, rgba(255,255,255,0.35), transparent 60%);
          pointer-events: none;
        }
        .hero-points {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .hero-points li {
          font-size: 0.95rem;
        }
        .point-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #a5b4fc;
          display: inline-block;
        }
        .highlight-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 1rem;
        }
        .quiz-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
        }
        .subject-card {
          background: #fff;
          padding: 1.75rem;
          box-shadow: 0 18px 45px -25px rgba(15, 23, 42, 0.5);
          border: 1px solid #e2e8f0;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s;
        }
        .subject-card:hover {
          transform: translateY(-6px);
          border-color: #c7d2fe;
          box-shadow: 0 25px 60px -25px rgba(79, 70, 229, 0.35);
        }
        .subject-icon {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          font-size: 1.5rem;
          color: #fff;
          margin-bottom: 1rem;
        }
        .subject-content h5 {
          color: #111827;
        }
        .subject-content button {
          border-radius: 12px;
          background: linear-gradient(90deg, #4f46e5, #6366f1);
          border: none;
          box-shadow: 0 10px 25px rgba(79, 70, 229, 0.35);
        }
        .subject-content button:hover {
          background: linear-gradient(90deg, #4338ca, #4f46e5);
        }
      `}</style>
    </div>
  );
};

export default Quiz;
