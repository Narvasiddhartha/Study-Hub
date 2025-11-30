import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const features = [
  {
    title: 'Smart Quizzes',
    desc: 'Practice with adaptive, timed quizzes and detailed review of your answers.',
    img: 'https://cdn-icons-png.flaticon.com/512/3135/3135768.png',
  },
  {
    title: 'AI Recommendations',
    desc: 'Get personalized study plans and predictions using AI and ML.',
    img: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png',
  },
  {
    title: 'Resource Library',
    desc: 'Access curated notes, books, and coding platforms for every CS subject.',
    img: 'https://cdn-icons-png.flaticon.com/512/2991/2991108.png',
  },
  {
    title: 'Malpractice Prevention',
    desc: 'Face detection and monitoring for fair, secure online assessments.',
    img: 'https://cdn-icons-png.flaticon.com/512/2920/2920256.png',
  },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('token');
  const subjectNames = [
    'Java', 'Python', 'DSA', 'Operating Systems', 'DBMS', 'Computer Networks',
    'Web Dev', 'AI/ML', 'Software Engineering', 'Aptitude'
  ];

  // Landing page is public - if user is logged in, they can still access it
  // No redirects needed

  return (
    <div style={{ background: 'linear-gradient(180deg,#ffffff 0%, #f8fafc 100%)' }}>
      {/* Light, minimal hero with split layout */}
      <section className="py-5 py-md-5">
        <div className="container" style={{ maxWidth: 1140 }}>
          <div className="row align-items-center g-4">
            <div className="col-12 col-md-7">
              <div className="mb-2" style={{ color: '#6366f1', fontWeight: 800, letterSpacing: 1 }}>STUDYHUB</div>
              <h1 style={{ fontWeight: 900, fontSize: 48, lineHeight: 1.1, color: '#0f172a', marginBottom: 12 }}>Master concepts faster</h1>
              <p className="mb-4" style={{ color: '#475569', fontSize: 18 }}>Practice quizzes, curated resources, and clear insights. Built to keep you moving forward every day.</p>
              {!isAuthenticated ? (
                <div className="d-flex flex-wrap gap-2">
                  <Link to="/register" className="btn btn-primary px-4 py-2" style={{ fontWeight: 800, background: 'linear-gradient(90deg,#6366f1,#60a5fa)', border: 'none' }}>Get started</Link>
                  <Link to="/login" className="btn btn-outline-primary px-4 py-2 lp-outline" style={{ fontWeight: 800, borderColor: '#6366f1', color: '#6366f1' }}>Login</Link>
                </div>
              ) : (
                <Link to="/dashboard" className="btn btn-primary px-4 py-2" style={{ fontWeight: 800, background: 'linear-gradient(90deg,#6366f1,#60a5fa)', border: 'none' }}>Open Dashboard</Link>
              )}
            </div>
            <div className="col-12 col-md-5">
              <div className="subject-anim">
                <div className="track track-1">
                  {subjectNames.concat(subjectNames).map((s, i) => (
                    <span key={`t1-${i}`} className="subject-chip">{s}</span>
                  ))}
                </div>
                <div className="track track-2">
                  {subjectNames.concat(subjectNames).map((s, i) => (
                    <span key={`t2-${i}`} className="subject-chip">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="py-4">
        <div className="container" style={{ maxWidth: 1140 }}>
          <div className="row g-4">
            {features.map((f, idx) => (
              <div key={idx} className="col-12 col-md-6 col-lg-3 d-flex align-items-stretch">
                <div className="card h-100 border-0 feature-card p-4 text-center" style={{ borderRadius: 16 }}>
                  <div className="icon-wrap mx-auto mb-3 d-flex align-items-center justify-content-center">
                    <img src={f.img} alt={f.title} style={{ width: 42, height: 42, objectFit: 'contain' }} />
                  </div>
                  <h5 className="mb-1" style={{ color: '#111827', fontWeight: 800 }}>{f.title}</h5>
                  <p className="text-muted mb-0" style={{ fontSize: 14 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits strip */}
      <section className="py-5">
        <div className="container" style={{ maxWidth: 1140 }}>
          <div className="row g-3 text-center">
            {[
              { title: 'Fast & Lightweight', desc: 'Zero clutter UI focused on speed.' },
              { title: 'Always Free', desc: 'Core features available for everyone.' },
              { title: 'Mobile Friendly', desc: 'Works great on phones and tablets.' }
            ].map((b) => (
              <div key={b.title} className="col-12 col-md-4">
                <div className="p-4 rounded-3 shadow-sm" style={{ background: '#ffffff' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{b.title}</div>
                  <div className="text-muted" style={{ fontSize: 14 }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-5 text-center">
        <div className="container">
          <h3 style={{ fontWeight: 900, color: '#0f172a' }}>Ready to begin?</h3>
          <Link to={isAuthenticated ? '/dashboard' : '/register'} className="btn btn-primary mt-2 px-4 py-2" style={{ fontWeight: 800, background: 'linear-gradient(90deg,#6366f1,#60a5fa)', border: 'none' }}>
            {isAuthenticated ? 'Go to Dashboard' : 'Create free account'}
          </Link>
        </div>
      </section>

      <style>{`
        .feature-card { background: #fff; box-shadow: 0 10px 28px rgba(17,24,39,0.08); }
        .feature-card:hover { transform: translateY(-3px); box-shadow: 0 16px 40px rgba(17,24,39,0.12); }
        .icon-wrap { width: 64px; height: 64px; border-radius: 14px; background: linear-gradient(180deg,#eef2ff,#e0e7ff); box-shadow: inset 0 1px 0 rgba(255,255,255,0.6); }
        .subject-anim { position: relative; height: 200px; overflow: hidden; }
        .track { position: absolute; display: flex; gap: 12px; white-space: nowrap; }
        .track-1 { top: 40px; animation: scroll-left 18s linear infinite; }
        .track-2 { bottom: 30px; animation: scroll-right 22s linear infinite; }
        .subject-chip { padding: 8px 14px; border-radius: 9999px; border: 1px solid rgba(99,102,241,0.25); background: rgba(255,255,255,0.35); backdrop-filter: blur(6px); color: #0f172a; font-weight: 800; font-size: 14px; }
        @keyframes scroll-left { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes scroll-right { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
        .lp-outline { color: #6366f1 !important; border-color: #6366f1 !important; background: transparent; }
        .lp-outline:hover, .lp-outline:focus { color: #6366f1 !important; border-color: #6366f1 !important; background: rgba(99,102,241,0.12) !important; box-shadow: none; }
      `}</style>
    </div>
  );
};

export default LandingPage;
