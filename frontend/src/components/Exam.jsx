import React from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const subjects = [
  { name: 'Java', icon: '☕', description: 'Back-end heavy scenarios, Spring bootstrapping, and memory leaks.', difficulty: 'Intermediate', focus: 'API design', accent: '#dc2626' },
  { name: 'Python', icon: '🐍', description: 'Data pipelines, automation tooling, and async IO gotchas.', difficulty: 'Intermediate', focus: 'Automation', accent: '#ef4444' },
  { name: 'Operating Systems', icon: '🖥', description: 'Scheduling tables, page faults, and synchronization proofs.', difficulty: 'Advanced', focus: 'Systems', accent: '#b91c1c' },
  { name: 'DBMS', icon: '💾', description: 'Transaction traces, locking diagrams, and query planners.', difficulty: 'Advanced', focus: 'Storage', accent: '#f97316' },
  { name: 'DSA', icon: '📗', description: 'Hybrid DS rounds with whiteboard constraints.', difficulty: 'Advanced', focus: 'Algorithmic', accent: '#c026d3' },
  { name: 'Computer Networks', icon: '🌐', description: 'Packet captures, routing loops, and CDN design.', difficulty: 'Intermediate', focus: 'Infra', accent: '#14b8a6' },
  { name: 'Web Development', icon: '🌍', description: 'Full-stack trace debugging and performance budgets.', difficulty: 'Intermediate', focus: 'Product', accent: '#f43f5e' },
  { name: 'Software Engineering', icon: '📋', description: 'Architecture, SDLC governance, and release safety.', difficulty: 'Intermediate', focus: 'Process', accent: '#ea580c' },
  { name: 'Machine Learning', icon: '🧠', description: 'Model validation, drift handling, and explainability.', difficulty: 'Advanced', focus: 'ML Ops', accent: '#7c3aed' },
  { name: 'Placement Prep', icon: '🏆', description: 'Mixed aptitude, CS core, and behavioural constructs.', difficulty: 'All levels', focus: 'Mixed bag', accent: '#0f172a' }
];

const enforcement = [
  '45-minute timer • auto submit on expiry',
  'Camera stream + face validation required',
  'Fullscreen lock + max 3 tab violations'
];

const examStats = [
  { label: 'Questions', value: '40 MCQs', detail: 'curated per subject' },
  { label: 'Benchmark', value: '82%', detail: 'avg. top performer score' },
  { label: 'Attempts', value: '12k+', detail: 'mock exams completed' }
];

const Exam = () => {
  const navigate = useNavigate();

  return (
    <div className="exam-shell min-vh-100 py-5">
      <div className="container">
        <section className="exam-hero rounded-4 shadow-lg p-5 mb-5 position-relative overflow-hidden">
          <div className="row g-4 align-items-center">
            <div className="col-lg-7">
              <p className="badge bg-white text-danger-emphasis mb-3 px-3 py-2 rounded-pill fw-semibold">
                Proctored mock · enterprise controls
              </p>
              <h1 className="display-5 fw-bold text-white mb-3">
                Choose a subject to launch your 45-minute mock exam.
              </h1>
              <p className="lead text-white-50 mb-4">
                Built for high-stakes interviews. Each module mirrors onsite rigor with modern monitoring, adaptive question pools, and executive-grade reports.
              </p>
              <ul className="hero-guards text-white-75 mb-4">
                {enforcement.map((item) => (
                  <li key={item} className="d-flex align-items-center gap-2">
                    <span className="guard-dot" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="d-flex flex-wrap gap-2">
                <button className="btn btn-light text-danger fw-semibold px-4" onClick={() => navigate('/dashboard')}>
                  Review readiness
                </button>
                <button className="btn btn-outline-light fw-semibold px-4" onClick={() => navigate('/Quiz')}>
                  Switch to quick quizzes
                </button>
              </div>
            </div>
            <div className="col-lg-5">
              <div className="exam-stats-grid">
                {examStats.map((stat) => (
                  <div key={stat.label} className="stat-card rounded-4 p-4 bg-white shadow-sm">
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
              <p className="text-uppercase text-muted fw-semibold mb-1">Exam catalog</p>
              <h4 className="fw-bold mb-0" style={{ color: '#0f172a' }}>Select your domain</h4>
            </div>
            <span className="text-muted small">10 subjects • 40 MCQs • strict proctoring</span>
          </div>

          <div className="exam-grid">
            {subjects.map((subject) => (
              <article
                key={subject.name}
                className="exam-card rounded-4"
                role="button"
                onClick={() => navigate(`/exam/${subject.name}`)}
              >
                <div className="exam-icon" style={{ background: subject.accent }}>
                  <span>{subject.icon}</span>
                </div>
                <div className="exam-body">
                  <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                    <h5 className="fw-bold mb-0">{subject.name}</h5>
                    <span className="badge bg-light text-muted text-capitalize">{subject.difficulty}</span>
                  </div>
                  <p className="text-muted mb-2">{subject.description}</p>
                  <div className="d-flex justify-content-between align-items-center text-muted small mb-3 flex-wrap gap-2">
                    <span>🔒 Focus: {subject.focus}</span>
                    <span>⏱ 45 min · 40 MCQs</span>
                  </div>
                  <button className="btn btn-danger w-100 fw-semibold">Start exam</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <style>{`
        .exam-shell {
          background: radial-gradient(circle at top, #fee2e2, #fff5f5 35%, #ffffff 90%);
        }
        .exam-hero {
          background: linear-gradient(120deg, #b91c1c, #dc2626 45%, #f97316);
          border: none;
        }
        .hero-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 20% -10%, rgba(255,255,255,0.35), transparent 60%);
          pointer-events: none;
        }
        .hero-guards {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .hero-guards li {
          font-size: 0.95rem;
        }
        .guard-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.65);
          display: inline-block;
        }
        .exam-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
        }
        .exam-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1.5rem;
        }
        .exam-card {
          background: #fff;
          padding: 1.75rem;
          border: 1px solid #fee2e2;
          box-shadow: 0 18px 45px -25px rgba(185, 28, 28, 0.35);
          transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
        }
        .exam-card:hover {
          transform: translateY(-6px);
          border-color: #fca5a5;
          box-shadow: 0 28px 55px -25px rgba(220, 38, 38, 0.35);
        }
        .exam-icon {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          font-size: 1.5rem;
          color: #fff;
          margin-bottom: 1rem;
        }
        .exam-body h5 {
          color: #111827;
        }
        .exam-body button {
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(185, 28, 28, 0.35);
        }
        .exam-body button:hover {
          background-color: #b91c1c;
        }
      `}</style>
    </div>
  );
};

export default Exam;
