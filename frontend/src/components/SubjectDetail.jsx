import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { SUBJECTS_MAP } from '../data/subjects';

const SubjectDetail = ({ slug }) => {
  const subject = SUBJECTS_MAP[slug];

  if (!subject) {
    return (
      <Container className="py-5">
        <Card className="shadow-sm border-0">
          <Card.Body className="text-center py-5">
            <h4 className="mb-2">Subject not found</h4>
            <p className="text-muted mb-0">
              We couldn’t locate the subject you’re looking for. Please head back to the dashboard to pick another track.
            </p>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  const stats = [
    { label: 'Topics to aim', value: `${subject.topics?.length || 0}` },
    subject.focus && { label: 'Focus', value: subject.focus },
    subject.duration && { label: 'Suggested pace', value: subject.duration }
  ].filter(Boolean);

  return (
    <Container className="py-4 subject-detail-page">
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body>
          <div className="d-flex flex-column flex-md-row align-items-md-center gap-3">
            <div className="display-4">{subject.icon}</div>
            <div>
              <h2 className="mb-1">{subject.name}</h2>
              <p className="text-muted mb-0">{subject.description}</p>
            </div>
          </div>
          <Row className="g-3 mt-3">
            {stats.map((stat) => (
              <Col sm={4} key={stat.label}>
                <div className="subject-stat-card p-3 h-100">
                  <div className="text-uppercase small text-muted fw-semibold">{stat.label}</div>
                  <div className="fs-5 fw-bold">{stat.value}</div>
                </div>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>

      <Row className="g-4">
        <Col lg={8}>
          <Card className="shadow-sm border-0 mb-4">
            <Card.Body>
              <h5 className="fw-bold mb-3">📺 Watch & Learn</h5>
              <div className="ratio ratio-16x9 rounded overflow-hidden mb-3 subject-video">
                <iframe
                  src={`https://www.youtube.com/embed/${subject.youtubeId}`}
                  title={`${subject.name} walkthrough`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
              <p className="text-muted mb-0">
                Kick-start your revision with the curated video session above, then follow the roadmap to cover every essential concept.
              </p>
            </Card.Body>
          </Card>

          <Card className="shadow-sm border-0 mb-4">
            <Card.Body>
              <h5 className="fw-bold mb-3">🛣️ Roadmap</h5>
              <ol className="roadmap-list ps-3 mb-0">
                {subject.roadmap?.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="shadow-sm border-0 mb-4">
            <Card.Body>
              <h5 className="fw-bold mb-3">🧩 Topics To Aim</h5>
              <div className="d-flex flex-wrap gap-2">
                {(subject.topics || []).map((topic) => (
                  <span key={topic} className="badge bg-primary-subtle text-primary fw-semibold subject-chip-lg">
                    {topic}
                  </span>
                ))}
              </div>
            </Card.Body>
          </Card>

          {subject.resources?.length > 0 && (
            <Card className="shadow-sm border-0 mb-4">
              <Card.Body>
                <h5 className="fw-bold mb-3">🌐 Useful Links</h5>
                <ul className="list-unstyled mb-0">
                  {subject.resources.map((resource) => (
                    <li key={resource.label} className="mb-2">
                      <a href={resource.url} target="_blank" rel="noreferrer">
                        {resource.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </Card.Body>
            </Card>
          )}

          {subject.notes?.length > 0 && (
            <Card className="shadow-sm border-0 mb-4">
              <Card.Body>
                <h5 className="fw-bold mb-3">📚 Notes & PDFs</h5>
                <ul className="list-unstyled mb-0">
                  {subject.notes.map((note) => (
                    <li key={note.label} className="mb-2">
                      <a href={note.url} target="_blank" rel="noreferrer">
                        {note.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </Card.Body>
            </Card>
          )}

          {subject.practice?.length > 0 && (
            <Card className="shadow-sm border-0">
              <Card.Body>
                <h5 className="fw-bold mb-3">📝 Practice Sets</h5>
                <ul className="list-unstyled mb-0">
                  {subject.practice.map((item) => (
                    <li key={item.label} className="mb-2">
                      <a href={item.url} target="_blank" rel="noreferrer">
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      <style>{`
        .subject-detail-page .subject-stat-card {
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          background: #fff;
        }
        .subject-detail-page .subject-chip-lg {
          border-radius: 999px;
          background: #e0e7ff;
          color: #312e81;
        }
        .subject-detail-page .roadmap-list li::marker {
          color: #6366f1;
          font-weight: 600;
        }
        .subject-detail-page .subject-video iframe {
          border: none;
        }
      `}</style>
    </Container>
  );
};

export default SubjectDetail;

