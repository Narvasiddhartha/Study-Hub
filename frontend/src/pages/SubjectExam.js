import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as faceapi from 'face-api.js';

const SubjectExam = () => {
  const { subject } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const [timerActive, setTimerActive] = useState(false);
  const [cameraPermission, setCameraPermission] = useState('pending');
  const [showPermissionModal, setShowPermissionModal] = useState(true);
  const [videoStream, setVideoStream] = useState(null);
  const videoRef = useRef(null);
  const [faceStatus, setFaceStatus] = useState('pending');
  const [faceWarning, setFaceWarning] = useState('');
  const [userAnswers, setUserAnswers] = useState([]);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [violations, setViolations] = useState(0);
  const [faceCaptured, setFaceCaptured] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const canvasRef = useRef(null);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const checkFullscreen = () => {
      const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
      setIsFullscreen(isFull);
      if (examStarted && !isFull && !showResult) {
        console.warn('Fullscreen exited during exam');
      }
    };
    checkFullscreen();
    document.addEventListener('fullscreenchange', checkFullscreen);
    document.addEventListener('webkitfullscreenchange', checkFullscreen);
    document.addEventListener('mozfullscreenchange', checkFullscreen);
    document.addEventListener('MSFullscreenChange', checkFullscreen);
    return () => {
      document.removeEventListener('fullscreenchange', checkFullscreen);
      document.removeEventListener('webkitfullscreenchange', checkFullscreen);
      document.removeEventListener('mozfullscreenchange', checkFullscreen);
      document.removeEventListener('MSFullscreenChange', checkFullscreen);
    };
  }, [examStarted, showResult]);

  useEffect(() => {
    if (!examStarted) return;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const newTabSwitches = tabSwitches + 1;
        setTabSwitches(newTabSwitches);
        setViolations(newTabSwitches);
        if (newTabSwitches >= 3) {
          alert('You have switched tabs 3 times. Exam will be auto-submitted.');
          finishExam();
        } else {
          alert(`Warning: You switched tabs (${newTabSwitches}/3). Exam will be auto-submitted after 3 violations.`);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [examStarted, tabSwitches]);

  const requestFullscreen = async () => {
    try {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      } else {
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, 300));
      const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
      setIsFullscreen(isFull);
      return isFull;
    } catch (error) {
      return false;
    }
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }, audio: false });
      setVideoStream(stream);
      setCameraPermission('granted');
      await new Promise(resolve => setTimeout(resolve, 100));
      const videoElements = document.querySelectorAll('video');
      videoElements.forEach(video => {
        if (video === videoRef.current || !video.srcObject) {
          video.srcObject = stream;
          video.onloadedmetadata = () => { video.play().catch(() => {}); };
          video.play().catch(() => {});
        }
      });
    } catch (error) {
      setCameraPermission('denied');
      alert('Camera access is required to start the exam.');
    }
  };

  useEffect(() => {
    if (videoStream && videoRef.current) {
      videoRef.current.srcObject = videoStream;
      const playVideo = (attempt = 1) => {
        if (videoRef.current && videoRef.current.readyState >= 2) {
          videoRef.current.play().catch(() => {
            if (attempt < 5) setTimeout(() => playVideo(attempt + 1), 200 * attempt);
          });
        } else if (attempt < 10) {
          setTimeout(() => playVideo(attempt + 1), 100 * attempt);
        }
      };
      playVideo();
    }
  }, [videoStream, cameraPermission, examStarted]);

  const captureFace = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      setFaceCaptured(true);
      return canvas.toDataURL('image/jpeg');
    }
    return null;
  };

  const startExam = async () => {
    if (cameraPermission !== 'granted') {
      alert('Camera access is required to start the exam.');
      return;
    }
    if (faceStatus !== 'ok') {
      alert('Please ensure your face is clearly visible in the camera before starting.');
      return;
    }
    try {
      const fullscreenSuccess = await requestFullscreen();
      if (!fullscreenSuccess) {
        alert('Fullscreen mode is required to start the exam.');
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      alert('Could not enter fullscreen mode.');
      return;
    }
    captureFace();
    setExamStarted(true);
    setStartTime(Date.now());
    setTimerActive(true);
    setShowPermissionModal(false);
  };

  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      } catch (err) {
        setFaceStatus('error');
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    let interval = null;
    const detectFace = async () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        try {
          const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions());
          if (detections.length === 1) {
            setFaceStatus('ok');
            setFaceWarning('');
          } else if (detections.length === 0) {
            setFaceStatus('none');
            setFaceWarning('No face detected!');
          } else {
            setFaceStatus('multiple');
            setFaceWarning('Multiple faces detected!');
          }
        } catch (err) {
          setFaceStatus('error');
        }
      }
    };
    if (cameraPermission === 'granted' && videoStream) {
      interval = setInterval(detectFace, 1000);
    }
    return () => clearInterval(interval);
  }, [cameraPermission, videoStream]);

  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0 && !showResult) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => {
          if (timeLeft <= 1) {
            finishExam();
            return 0;
          }
          return timeLeft - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, showResult]);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const res = await axios.get(`/exam/${subject}`);
        setQuestions(res.data.slice(0, 40));
        setLoading(false);
      } catch (error) {
        setQuestions([]);
        setLoading(false);
      }
    };
    fetchExam();
  }, [subject]);

  const handleOptionSelect = (option) => {
    if (showResult || !examStarted) return;
    setSelectedOption(option);
    const newAnswers = [...userAnswers];
    newAnswers[currentIndex] = option;
    setUserAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(userAnswers[currentIndex + 1] || null);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedOption(userAnswers[currentIndex - 1] || null);
    }
  };

  const exitFullscreen = () => {
    try {
      const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
      if (!isFull) return;
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen().catch(() => {});
      else if (document.mozCancelFullScreen) document.mozCancelFullScreen().catch(() => {});
      else if (document.msExitFullscreen) document.msExitFullscreen().catch(() => {});
    } catch (error) {}
  };

  const finishExam = () => {
    if (showResult) return;
    setTimerActive(false);
    let finalScore = 0;
    const correctAnswers = questions.map(q => q.answer);
    userAnswers.forEach((answer, index) => {
      if (answer === correctAnswers[index]) finalScore++;
    });
    setScore(finalScore);
    setShowResult(true);
    exitFullscreen();
    saveExamResult(finalScore, questions.length);
  };

  const saveExamResult = async (finalScore, totalQuestions) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setSaving(true);
    try {
      const duration = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
      const correctAnswers = questions.map(q => q.answer);
      const response = await axios.post('/exam/save-result', {
        subject, score: finalScore, totalQuestions,
        questions: questions.map(q => q.question), userAnswers, correctAnswers,
        duration, tabSwitches, violations, faceCaptured
      }, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data?.streak) {
        console.log('Updated streak from exam:', response.data.streak);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('examCompleted'));
        window.dispatchEvent(new Event('streakUpdated'));
      }
      alert('Exam submitted successfully!');
    } catch (error) {
      alert('Error saving exam result.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    return () => {
      if (videoStream) videoStream.getTracks().forEach(track => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      try {
        const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
        if (isFull) {
          if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
          else if (document.webkitExitFullscreen) document.webkitExitFullscreen().catch(() => {});
          else if (document.mozCancelFullScreen) document.mozCancelFullScreen().catch(() => {});
          else if (document.msExitFullscreen) document.msExitFullscreen().catch(() => {});
        }
      } catch (error) {}
    };
  }, [videoStream]);

  if (loading) {
    return (
      <div className="container text-center mt-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading exam...</span>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="container text-center mt-5">
        <h3>No exam questions available for {subject}</h3>
        <button className="btn btn-primary mt-3" onClick={() => navigate('/Quiz')}>Back to Quizzes</button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {showPermissionModal && !examStarted && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Exam Security Requirements</h5>
              </div>
              <div className="modal-body">
                <p><strong>Before starting:</strong></p>
                <ul>
                  <li>Camera access is granted</li>
                  <li>Your face is clearly visible</li>
                  <li>Ready to enter fullscreen mode</li>
                  <li>Will not switch tabs (3 violations = auto-submit)</li>
                </ul>
                <p className="text-danger"><strong>Duration: 45 minutes | Questions: 40 MCQs</strong></p>
                {cameraPermission === 'pending' && (
                  <button className="btn btn-primary w-100 mt-3" onClick={requestCameraPermission}>Enable Camera</button>
                )}
                {cameraPermission === 'granted' && (
                  <div className="mt-3">
                    <div className="card" style={{ maxWidth: '350px', margin: '0 auto' }}>
                      <div className="card-header" style={{ background: '#374151', color: '#fff', padding: '10px 15px' }}>
                        <span>📹 Camera Preview</span>
                      </div>
                      <div className="card-body p-0" style={{ background: '#000' }}>
                        <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', minHeight: '200px', objectFit: 'cover' }} />
                      </div>
                      <div className="card-footer" style={{ background: '#f9fafb', padding: '10px 15px' }}>
                        <small className={faceStatus === 'ok' ? 'text-success' : 'text-danger'}>
                          {faceStatus === 'ok' ? '✓ Face detected' : faceWarning || 'Waiting...'}
                        </small>
                      </div>
                    </div>
                    <button className="btn btn-success w-100 mt-3" onClick={startExam} disabled={faceStatus !== 'ok'}>
                      Start Exam (Will Enter Fullscreen)
                    </button>
                  </div>
                )}
                {cameraPermission === 'denied' && (
                  <p className="text-danger mt-3">Camera access is required.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {examStarted && !showResult && !isFullscreen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: '#dc2626', color: '#fff', padding: '20px', zIndex: 9999 }}>
          <div className="container d-flex justify-content-between align-items-center">
            <div><strong>⚠️ Warning: Fullscreen mode is required!</strong></div>
            <button className="btn btn-light" onClick={async () => { await requestFullscreen(); }}>🔲 Enter Fullscreen</button>
          </div>
        </div>
      )}

      {examStarted && !showResult && (
        <div className="container py-4" style={{ marginTop: examStarted && !isFullscreen ? '60px' : '0' }}>
          <div className="card mb-3">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-3"><h5 className="mb-0">{subject} Exam</h5><small>Question {currentIndex + 1} of {questions.length}</small></div>
                <div className="col-md-3 text-center"><div className="badge bg-danger">Time: {formatTime(timeLeft)}</div></div>
                <div className="col-md-3 text-center"><div className="badge bg-warning">Tab Switches: {tabSwitches}/3</div></div>
                <div className="col-md-3 text-end">
                  {!isFullscreen ? (
                    <button className="btn btn-danger btn-sm" onClick={async () => { await requestFullscreen(); }}>🔲 Enter Fullscreen</button>
                  ) : (
                    <div className="badge bg-success">✓ Fullscreen Active</div>
                  )}
                </div>
              </div>
              <div className="progress mt-2"><div className="progress-bar" style={{ width: `${progress}%` }}></div></div>
            </div>
          </div>

          <div className="card mb-3">
            <div className="card-body">
              <h5>Q{currentIndex + 1}: {currentQuestion.question}</h5>
              <div className="mt-3">
                {currentQuestion.options.map((option, idx) => (
                  <button key={idx} className={`btn w-100 mb-2 text-start ${selectedOption === option ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => handleOptionSelect(option)}>
                    {String.fromCharCode(65 + idx)}. {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <button className="btn btn-secondary" onClick={handlePrevious} disabled={currentIndex === 0}>Previous</button>
                <div>
                  {questions.map((_, idx) => (
                    <button key={idx} className={`btn btn-sm m-1 ${idx === currentIndex ? 'btn-primary' : userAnswers[idx] ? 'btn-success' : 'btn-outline-secondary'}`} onClick={() => { setCurrentIndex(idx); setSelectedOption(userAnswers[idx] || null); }}>
                      {idx + 1}
                    </button>
                  ))}
                </div>
                {currentIndex === questions.length - 1 ? (
                  <button className="btn btn-danger" onClick={finishExam}>Submit Exam</button>
                ) : (
                  <button className="btn btn-primary" onClick={handleNext}>Next</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showResult && (
        <div className="container py-5">
          <div className="card">
            <div className="card-body text-center">
              <h3>Exam Completed!</h3>
              <h2 className={score >= questions.length * 0.6 ? 'text-success' : 'text-danger'}>Score: {score} / {questions.length}</h2>
              <p>Percentage: {((score / questions.length) * 100).toFixed(1)}%</p>
              <button className="btn btn-primary" onClick={() => navigate('/profile')}>View Results in Profile</button>
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default SubjectExam;
