import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const categories = [
  "All",
  "Core Subjects",
  "Coding Platforms",
  "Placement Resources",
  "Mini Project Ideas",
  "Downloadable Notes",
  "Books",
];

const categoryIcons = {
  "Core Subjects": "📘",
  "Coding Platforms": "💻",
  "Placement Resources": "🎯",
  "Mini Project Ideas": "🧠",
  "Downloadable Notes": "📝",
  Books: "📚",
  default: "📎"
};

const Resources = () => {
  const [resources, setResources] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    axios
      .get("http://localhost:5001/resources")
      .then((res) => {
        setResources(res.data);
      })
      .catch((err) => console.error("Error fetching resources:", err));
  }, []);

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const matchesCategory =
        activeCategory === "All" || resource.category === activeCategory;
      const matchesSearch =
        resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.type.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [resources, activeCategory, searchTerm]);

  const insights = [
    { label: "Total assets", value: resources.length, accent: "#6366f1" },
    {
      label: "Subject coverage",
      value: `${categories.length - 1}+`,
      accent: "#0ea5e9",
    },
    { label: "Fresh uploads", value: "8 this week", accent: "#f97316" },
  ];

  return (
    <div className="resources-shell py-5">
      <div className="container">
        {/* Hero */}
        <section className="resource-hero rounded-4 p-4 p-md-5 mb-5 position-relative overflow-hidden">
          <div className="row align-items-center">
            <div className="col-lg-7">
              <p className="text-uppercase small fw-semibold text-white-50 mb-2">
                Library 2.0
              </p>
              <h1 className="text-white fw-bold display-6">
                Curated playbooks & tools for every CS milestone
              </h1>
              <p className="text-white-50 fs-6 mb-4">
                From core subject primers to placement kits and project ideas, everything has
                been hand-picked so you can study like an enterprise team.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <div className="glass-chip">
                  <span>🎯</span> Personalized picks from StudyBuddy
                </div>
                <div className="glass-chip">
                  <span>⚡️</span> Weekly new drops
                </div>
              </div>
            </div>
            <div className="col-lg-5 mt-4 mt-lg-0">
              <div className="resource-stats-panel p-4 rounded-4">
                <p className="text-uppercase text-white-50 small mb-3">
                  Resource pulse
                </p>
                <div className="row g-3">
                  {insights.map((item) => (
                    <div className="col-4" key={item.label}>
                      <div className="text-white">
                        <span className="badge" style={{ background: item.accent }}>
                          ●
                        </span>
                        <p className="text-white-50 small mb-1 mt-2">{item.label}</p>
                        <h4 className="mb-0">{item.value}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="hero-orbit" />
        </section>

        {/* Filters */}
        <section className="mb-4">
          <div className="d-flex flex-column flex-lg-row gap-3 align-items-lg-center justify-content-between">
            <div className="chip-group d-flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`filter-chip ${activeCategory === category ? "active" : ""}`}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="resource-search">
              <span>🔎</span>
              <input
                type="text"
                placeholder="Search by title or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Grid */}
        <section>
          {filteredResources.length === 0 ? (
            <div className="text-center p-5 rounded-4 bg-white shadow-sm">
              <h5 className="fw-bold mb-2">No resources match that filter</h5>
              <p className="text-muted mb-0">
                Try a different category or clear the search keyword.
              </p>
            </div>
          ) : (
            <div className="row g-4">
              {filteredResources.map((item, index) => (
                <div className="col-md-6 col-xl-4" key={`${item.title}-${index}`}>
                  <div className="resource-card-modern h-100 p-4 rounded-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="resource-icon">
                        {categoryIcons[item.category] || categoryIcons.default}
                      </div>
                      <span className="badge bg-light text-muted">{item.category}</span>
                    </div>
                    <h5 className="fw-bold" style={{ color: "#0f172a" }}>
                      {item.title}
                    </h5>
                    <p className="text-muted small mb-4">Type: {item.type}</p>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline-primary rounded-pill px-4 fw-semibold"
                    >
                      Open resource →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <style>{`
        .resources-shell {
          background: radial-gradient(circle at top, #eef2ff 0%, #f8fafc 50%, #ffffff 100%);
          min-height: 100vh;
        }
        .resource-hero {
          background: linear-gradient(135deg,#312e81 0%,#6366f1 40%,#14b8a6 100%);
          color: #fff;
        }
        .resource-stats-panel {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
        }
        .glass-chip {
          padding: 0.4rem 1rem;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.4);
          color: #fff;
          display: inline-flex;
          gap: 0.4rem;
          align-items: center;
        }
        .hero-orbit {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 80% 20%, rgba(255,255,255,0.25), transparent 50%);
          pointer-events: none;
        }
        .chip-group .filter-chip {
          border: 1px solid #e2e8f0;
          background: #fff;
          border-radius: 999px;
          padding: 0.35rem 0.9rem;
          font-weight: 600;
          font-size: 0.9rem;
          color: #475569;
          transition: all 0.2s ease;
        }
        .filter-chip.active, .filter-chip:hover {
          border-color: #818cf8;
          color: #312e81;
          background: #eef2ff;
        }
        .resource-search {
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          padding: 0.4rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          background: #fff;
        }
        .resource-search input {
          border: none;
          outline: none;
          flex: 1;
        }
        .resource-card-modern {
          background: #fff;
          border: 1px solid #e2e8f0;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .resource-card-modern:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 40px rgba(15,23,42,0.12);
          border-color: #c7d2fe;
        }
        .resource-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: #eef2ff;
          display: grid;
          place-items: center;
          font-size: 1.8rem;
        }
      `}</style>
    </div>
  );
};

export default Resources;
