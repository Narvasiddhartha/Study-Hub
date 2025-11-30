import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SUBJECTS } from '../data/subjects';

const Notes = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const noteSubjects = useMemo(
    () =>
      SUBJECTS.map((subject) => ({
        name: subject.name,
        slug: subject.slug,
        icon: subject.icon || '📝',
        summary: subject.description,
        topics: (subject.topics || []).slice(0, 3),
        path: `/notes/${subject.slug}`,
      })),
    []
  );

  const filtered = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return noteSubjects.filter(
      (subject) =>
        subject.name.toLowerCase().includes(query) ||
        subject.topics.some((topic) => topic.toLowerCase().includes(query))
    );
  }, [noteSubjects, searchTerm]);

  return (
    <div className="notes-shell py-5">
      <div className="container">
        {/* Hero */}
        <section className="notes-hero rounded-4 p-4 p-md-5 mb-5 text-white position-relative overflow-hidden">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <p className="text-uppercase small fw-semibold text-white-50 mb-2">
                Notebook HQ
              </p>
              <h1 className="display-6 fw-bold mb-3">
                Structured notebooks for every CS track
              </h1>
              <p className="text-white-50 fs-6 mb-4">
                Jump back into any module with curated outlines, suggested reflection prompts,
                and space to capture insights your future self will thank you for.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <div className="hero-chip">
                  <span>⚡</span>
                  Syncs with StudyBuddy
                </div>
                <div className="hero-chip">
                  <span>📎</span>
                  Attach links & snippets
                </div>
              </div>
            </div>
            <div className="col-lg-4 mt-4 mt-lg-0">
              <div className="notes-quickcard p-4 rounded-4 bg-white text-dark shadow-sm">
                <p className="text-uppercase small text-muted mb-2">Today’s template</p>
                <h5 className="fw-bold mb-2">“OS Scheduling Lab”</h5>
                <ul className="list-unstyled small text-muted mb-3">
                  <li>• Prep: Round robin vs priority</li>
                  <li>• Lab reflection checklist</li>
                  <li>• Key code snippets</li>
                </ul>
                <Link to="/notes/os" className="btn btn-primary rounded-pill px-4 fw-semibold">
                  Open notebook
                </Link>
              </div>
            </div>
          </div>
          <div className="hero-orbit" />
        </section>

        {/* Search */}
        <section className="d-flex flex-column flex-md-row gap-3 align-items-md-center justify-content-between mb-4">
          <div>
            <p className="text-uppercase small fw-semibold text-muted mb-1">
              Subjects
            </p>
            <h4 className="mb-0">Choose a notebook to continue</h4>
          </div>
          <div className="notes-search">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search by subject or topic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </section>

        {/* Grid */}
        <section>
          {filtered.length === 0 ? (
            <div className="text-center p-5 rounded-4 bg-white shadow-sm">
              <h5 className="fw-bold mb-2">No notebooks found</h5>
              <p className="text-muted mb-0">
                Try adjusting your search term or explore another subject.
              </p>
            </div>
          ) : (
            <div className="row g-4">
              {filtered.map((subject) => (
                <div className="col-md-6 col-xl-4" key={subject.slug}>
                  <div className="note-card h-100 rounded-4 p-4 d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="note-icon">{subject.icon}</div>
                      <span className="badge bg-light text-muted">
                        {subject.topics.length} topics
                      </span>
                    </div>
                    <h5 className="fw-bold" style={{ color: '#0f172a' }}>
                      {subject.name}
                    </h5>
                    <p className="text-muted small mb-3 flex-grow-1">{subject.summary}</p>
                    <div className="d-flex flex-wrap gap-1 mb-3">
                      {subject.topics.map((topic) => (
                        <span key={topic} className="mini-chip">
                          {topic}
                        </span>
                      ))}
                    </div>
                    <Link
                      to={subject.path}
                      className="btn btn-outline-primary rounded-pill px-4 fw-semibold mt-auto"
                    >
                      Open notes →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <style>{`
        .notes-shell {
          background: radial-gradient(circle at top, #e0f2fe 0%, #f8fafc 55%, #ffffff 100%);
          min-height: 100vh;
        }
        .notes-hero {
          background: linear-gradient(135deg,#0f172a 0%,#312e81 40%,#9333ea 100%);
          color: #fff;
        }
        .hero-chip {
          border: 1px solid rgba(255,255,255,0.4);
          border-radius: 999px;
          padding: 0.35rem 1rem;
          display: inline-flex;
          gap: 0.4rem;
          align-items: center;
          color: #fff;
        }
        .notes-quickcard ul li {
          margin-bottom: 0.2rem;
        }
        .hero-orbit {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 85% 10%, rgba(255,255,255,0.2), transparent 40%);
          pointer-events: none;
        }
        .notes-search {
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          background: #fff;
          padding: 0.4rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .notes-search input {
          border: none;
          outline: none;
          flex: 1;
        }
        .note-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .note-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 40px rgba(15,23,42,0.12);
          border-color: #c7d2fe;
        }
        .note-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: #eef2ff;
          display: grid;
          place-items: center;
          font-size: 1.8rem;
        }
        .mini-chip {
          font-size: 0.7rem;
          padding: 0.2rem 0.6rem;
          border-radius: 999px;
          background: #f1f5f9;
          color: #475569;
        }
      `}</style>
    </div>
  );
};

export default Notes;
