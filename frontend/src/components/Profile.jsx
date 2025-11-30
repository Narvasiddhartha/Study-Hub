import React, { useEffect, useState, useMemo } from 'react';
import axios from '../api/axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import defaultAvatar from '../assets/default-avatar.png'; // You may need to add a default avatar image

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

const Profile = () => {
  const [user, setUser] = useState({});
  const [quizHistory, setQuizHistory] = useState([]);
  const [examHistory, setExamHistory] = useState([]);
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    lastQuizDate: null,
    streakHistory: []
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentExamPage, setCurrentExamPage] = useState(1);
  const quizzesPerPage = 5;
  const examsPerPage = 5;
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const fetchUserProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get('/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.user);
      setQuizHistory(response.data.user.quizHistory || []);
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Fallback to localStorage user data
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const parsedUser = JSON.parse(userStr);
      setUser(parsedUser);
    } catch (e) {
      console.error("Failed to parse user:", e);
    }
  }
    } finally {
      setLoading(false);
    }
  };

  const fetchStreakData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await axios.get('/auth/streak', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStreakData(response.data);
    } catch (error) {
      console.error('Error fetching streak data:', error);
    }
  };

  const fetchExamHistory = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await axios.get('/exam/history/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Fetched exam history:', response.data);
      const history = response.data.examHistory || [];
      setExamHistory(history);
      console.log('Exam history set:', history.length, 'exams');
    } catch (error) {
      console.error('Error fetching exam history:', error);
      console.error('Error details:', error.response?.data);
    }
  };

  useEffect(() => {
    // Security check - verify token exists
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/';
      return;
    }
    
    fetchUserProfile();
    fetchStreakData();
    fetchExamHistory();
    
    // Refresh exam history and graph when exam is completed
    const handleExamCompleted = () => {
      console.log('Exam completed event received, refreshing exam history and graph...');
      fetchExamHistory();
      fetchUserProfile(); // This will also refresh quiz history
      fetchStreakData();
      setGraphUpdate(prev => prev + 1); // Update graph
    };
    
    // Refresh quiz history and graph when quiz is completed
    const handleQuizCompleted = () => {
      console.log('Quiz completed event received, refreshing quiz history and graph...');
      fetchUserProfile(); // This will refresh quiz history
      fetchStreakData();
      setGraphUpdate(prev => prev + 1); // Update graph
    };
    
    window.addEventListener('examCompleted', handleExamCompleted);
    window.addEventListener('quizCompleted', handleQuizCompleted);
    
    return () => {
      window.removeEventListener('examCompleted', handleExamCompleted);
      window.removeEventListener('quizCompleted', handleQuizCompleted);
    };
}, []);

  // Remove the useEffect that refetches on user.profileImage change
  // useEffect(() => {
  //   if (user.profileImage) {
  //     fetchUserProfile();
  //   }
  // }, [user.profileImage]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatStreakDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getScoreColor = (score, total) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'text-success';
    if (percentage >= 60) return 'text-warning';
    return 'text-danger';
  };

  // Render fire emojis for streak
  const renderStreakFires = (streak) => {
    const fires = [];
    for (let i = 0; i < Math.min(streak, 10); i++) {
      fires.push('🔥');
    }
    return fires.join('');
  };

  // Calculate overall statistics
  const calculateStats = () => {
    if (quizHistory.length === 0) return null;
    
    const totalQuizzes = quizHistory.length;
    const totalScore = quizHistory.reduce((sum, quiz) => sum + quiz.score, 0);
    const totalQuestions = quizHistory.reduce((sum, quiz) => sum + quiz.totalQuestions, 0);
    const averagePercentage = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
    
    const bestQuiz = quizHistory.reduce((best, current) => {
      const currentPercentage = (current.score / current.totalQuestions) * 100;
      const bestPercentage = (best.score / best.totalQuestions) * 100;
      return currentPercentage > bestPercentage ? current : best;
    });
    
    const bestPercentage = Math.round((bestQuiz.score / bestQuiz.totalQuestions) * 100);
    
    // Count unique subjects
    const uniqueSubjects = [...new Set(quizHistory.map(quiz => quiz.subject))].length;
    
    return {
      totalQuizzes,
      averagePercentage,
      bestPercentage,
      bestSubject: bestQuiz.subject,
      uniqueSubjects,
      totalScore,
      totalQuestions
    };
  };

  // ML-powered summary/advice
  const getMLSummary = () => {
    if (quizHistory.length === 0) return 'No quiz data available.';
    const stats = calculateStats();
    const trend = quizHistory.length > 1
      ? quizHistory[quizHistory.length - 1].score - quizHistory[0].score
      : 0;
    let advice = '';
    if (stats.averagePercentage >= 80) {
      advice = 'Excellent performance! Keep up the great work and try to maintain your consistency.';
    } else if (stats.averagePercentage >= 60) {
      advice = 'Good job! Focus on your weaker subjects and aim for more consistency.';
    } else {
      advice = 'There is room for improvement. Review your mistakes and try to practice regularly.';
    }
    if (trend > 0) advice += ' Your scores are improving over time.';
    else if (trend < 0) advice += ' Your scores have decreased recently. Try to review and revise.';
    else advice += ' Your performance is stable.';
    advice += `\nBest subject: ${stats.bestSubject}. Subjects attempted: ${stats.uniqueSubjects}.`;
    return advice;
  };

  // Calculate exam statistics
  const calculateExamStats = () => {
    if (examHistory.length === 0) return null;
    
    const totalExams = examHistory.length;
    const totalScore = examHistory.reduce((sum, exam) => sum + exam.score, 0);
    const totalQuestions = examHistory.reduce((sum, exam) => sum + exam.totalQuestions, 0);
    const averagePercentage = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
    
    const bestExam = examHistory.reduce((best, current) => {
      const currentPercentage = (current.score / current.totalQuestions) * 100;
      const bestPercentage = (best.score / best.totalQuestions) * 100;
      return currentPercentage > bestPercentage ? current : best;
    });
    
    const bestPercentage = Math.round((bestExam.score / bestExam.totalQuestions) * 100);
    const uniqueSubjects = [...new Set(examHistory.map(exam => exam.subject))].length;
    const totalDuration = examHistory.reduce((sum, exam) => sum + (exam.duration || 0), 0);
    const avgDuration = Math.round(totalDuration / totalExams / 60); // in minutes
    
    return {
      totalExams,
      averagePercentage,
      bestPercentage,
      bestSubject: bestExam.subject,
      uniqueSubjects,
      totalScore,
      totalQuestions,
      avgDuration
    };
  };

  // Download PDF report
  const handleDownloadReport = () => {
    const stats = calculateStats();
    const examStats = calculateExamStats();
    const doc = new jsPDF();
    
    // Header with gradient-like effect (using colored rectangle)
    doc.setFillColor(99, 102, 241); // Indigo color
    doc.rect(0, 0, 210, 35, 'F');
    
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text('StudyHub User Report', 105, 20, { align: 'center' });
    
    // Subtitle
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Comprehensive Performance Analysis', 105, 28, { align: 'center' });
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    let yPos = 45;
    
    // User Information Section
    doc.setFillColor(240, 245, 255); // Light indigo background
    doc.rect(10, yPos, 190, 30, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('User Information', 14, yPos + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    yPos += 12;
    
    // Wrap long text to fit in boxes
    const nameText = doc.splitTextToSize(`Name: ${user.name || 'N/A'}`, 85);
    const emailText = doc.splitTextToSize(`Email: ${user.email || 'N/A'}`, 85);
    doc.text(nameText, 14, yPos);
    doc.text(emailText, 110, yPos);
    yPos += Math.max(nameText.length, emailText.length) * 5;
    
    const joinedText = doc.splitTextToSize(`Joined: ${user.joined ? formatDate(user.joined) : 'N/A'}`, 85);
    const streakText = doc.splitTextToSize(`Current Streak: ${streakData.currentStreak} days`, 85);
    doc.text(joinedText, 14, yPos);
    doc.text(streakText, 110, yPos);
    yPos += Math.max(joinedText.length, streakText.length) * 5 + 5;
    
    // Quiz Statistics Section
    if (stats) {
      doc.setFillColor(236, 253, 245); // Light green background
      doc.rect(10, yPos, 92, 40, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Quiz Statistics', 14, yPos + 8);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      let quizY = yPos + 12;
      doc.text(`Quizzes: ${quizHistory.length}`, 14, quizY);
      quizY += 5;
      doc.text(`Avg Score: ${stats.averagePercentage}%`, 14, quizY);
      quizY += 5;
      doc.text(`Best: ${stats.bestPercentage}%`, 14, quizY);
      quizY += 5;
      doc.text(`Subjects: ${stats.uniqueSubjects}`, 14, quizY);
      quizY += 5;
      doc.text(`Total: ${stats.totalScore}/${stats.totalQuestions}`, 14, quizY);
    }
    
    // Exam Statistics Section
    if (examStats) {
      doc.setFillColor(254, 242, 242); // Light red background
      doc.rect(108, yPos, 92, 40, 'F');
    doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Exam Statistics', 112, yPos + 8);
    doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      let examY = yPos + 12;
      doc.text(`Exams: ${examHistory.length}`, 112, examY);
      examY += 5;
      doc.text(`Avg Score: ${examStats.averagePercentage}%`, 112, examY);
      examY += 5;
      doc.text(`Best: ${examStats.bestPercentage}%`, 112, examY);
      examY += 5;
      doc.text(`Subjects: ${examStats.uniqueSubjects}`, 112, examY);
      examY += 5;
      doc.text(`Avg: ${examStats.avgDuration} min`, 112, examY);
    }
    
    yPos += 45;
    
    // ML Performance Summary
    // First, calculate how much space we need
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    // Split summary text to fit within box (180mm width, accounting for 4mm margins on each side)
    const maxWidth = 180; // Maximum width for text
    const summaryText = doc.splitTextToSize(getMLSummary(), maxWidth);
    
    const lineHeight = 4.5;
    const titleHeight = 10;
    const topPadding = 8;
    const bottomPadding = 6;
    const leftPadding = 4;
    
    // Calculate total height needed
    const textHeight = summaryText.length * lineHeight;
    const summaryHeight = titleHeight + topPadding + textHeight + bottomPadding;
    
    // Draw the box
    doc.setFillColor(255, 251, 235); // Light yellow background
    doc.rect(10, yPos, 190, summaryHeight, 'F');
    
    // Draw title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('ML Performance Summary', 14, yPos + topPadding + 6);
    
    // Draw summary text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    let textY = yPos + titleHeight + topPadding;
    
    summaryText.forEach((line, index) => {
      const currentY = textY + (index * lineHeight);
      // Make sure we don't go outside the box
      if (currentY < yPos + summaryHeight - bottomPadding) {
        doc.text(line, 14 + leftPadding, currentY);
      }
    });
    
    yPos += summaryHeight + 5;
    
    // Quiz History Table
    if (quizHistory.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Quiz History', 14, yPos);
      yPos += 5;
      
      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Subject', 'Score', 'Percentage', 'Date']],
        body: quizHistory.map((q, idx) => [
          idx + 1,
          q.subject.length > 15 ? q.subject.substring(0, 15) + '...' : q.subject,
          `${q.score}/${q.totalQuestions}`,
          `${Math.round((q.score / q.totalQuestions) * 100)}%`,
          formatDate(q.completedAt).length > 12 ? formatDate(q.completedAt).substring(0, 12) : formatDate(q.completedAt)
        ]),
        theme: 'striped',
        headStyles: { 
          fillColor: [99, 102, 241],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        styles: { 
          fontSize: 8,
          cellPadding: 2,
          overflow: 'linebreak',
          cellWidth: 'wrap'
        },
        columnStyles: {
          0: { cellWidth: 15 }, // #
          1: { cellWidth: 50 }, // Subject
          2: { cellWidth: 30 }, // Score
          3: { cellWidth: 35 }, // Percentage
          4: { cellWidth: 50 }  // Date
        },
        margin: { left: 10, right: 10 },
      });
      
      yPos = doc.lastAutoTable.finalY + 10;
    }
    
    // Exam History Table
    if (examHistory.length > 0) {
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Exam History', 14, yPos);
      yPos += 5;
      
      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Subject', 'Score', '%', 'Duration', 'Violations', 'Date']],
        body: examHistory.map((exam, idx) => [
          idx + 1,
          exam.subject.length > 12 ? exam.subject.substring(0, 12) + '...' : exam.subject,
          `${exam.score}/${exam.totalQuestions}`,
          `${Math.round((exam.score / exam.totalQuestions) * 100)}%`,
          formatDuration(exam.duration || 0),
          exam.tabSwitches || 0,
          formatDate(exam.completedAt).length > 10 ? formatDate(exam.completedAt).substring(0, 10) : formatDate(exam.completedAt)
        ]),
        theme: 'striped',
        headStyles: { 
          fillColor: [220, 38, 38],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [254, 242, 242] },
        styles: { 
          fontSize: 8,
          cellPadding: 2,
          overflow: 'linebreak',
          cellWidth: 'wrap'
        },
        columnStyles: {
          0: { cellWidth: 12 }, // #
          1: { cellWidth: 40 }, // Subject
          2: { cellWidth: 25 }, // Score
          3: { cellWidth: 20 }, // Percentage
          4: { cellWidth: 30 }, // Duration
          5: { cellWidth: 25 }, // Violations
          6: { cellWidth: 40 }  // Date
        },
        margin: { left: 10, right: 10 },
      });
    }
    
    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Page ${i} of ${pageCount} | Generated on ${new Date().toLocaleDateString()}`,
        105,
        287,
        { align: 'center' }
      );
    }
    
    doc.save(`StudyHub_Report_${user.name || 'User'}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Pagination logic
  const indexOfLastQuiz = currentPage * quizzesPerPage;
  const indexOfFirstQuiz = indexOfLastQuiz - quizzesPerPage;
  const currentQuizzes = quizHistory.slice(indexOfFirstQuiz, indexOfLastQuiz);
  const totalPages = Math.ceil(quizHistory.length / quizzesPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleQuizClick = (quiz, index) => {
    setSelectedQuiz({ ...quiz, index });
    setShowQuizModal(true);
  };

  const handleExamClick = (exam, index) => {
    setSelectedExam({ ...exam, index });
    setShowExamModal(true);
  };

  // Exam pagination
  const indexOfLastExam = currentExamPage * examsPerPage;
  const indexOfFirstExam = indexOfLastExam - examsPerPage;
  const currentExams = examHistory.slice(indexOfFirstExam, indexOfLastExam);
  const totalExamPages = Math.ceil(examHistory.length / examsPerPage);

  const paginateExams = (pageNumber) => setCurrentExamPage(pageNumber);

  // Format duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const stats = calculateStats();

  // Real-time update state for blinking effect
  const [graphUpdate, setGraphUpdate] = useState(0);

  // Combined Performance Graph Data (Quiz + Exam in one graph)
  const combinedPerformanceData = useMemo(() => {
    // Get the maximum length to create proper labels
    const maxLength = Math.max(quizHistory.length, examHistory.length);
    
    // Create labels based on the maximum length
    const labels = [];
    for (let i = 0; i < maxLength; i++) {
      labels.push(`#${i + 1}`);
    }
    
    // Prepare quiz data (pad with null if needed)
    const quizData = quizHistory.map(q => Math.round((q.score / q.totalQuestions) * 100));
    while (quizData.length < maxLength) {
      quizData.push(null);
    }
    
    // Prepare exam data (pad with null if needed)
    const examData = examHistory.map(exam => Math.round((exam.score / exam.totalQuestions) * 100));
    while (examData.length < maxLength) {
      examData.push(null);
    }
    
    return {
      labels: labels.length > 0 ? labels : ['No Data'],
    datasets: [
      {
          label: 'Quiz Score (%)',
          data: quizData,
        fill: false,
        borderColor: '#6366f1',
        backgroundColor: '#6366f1',
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#6366f1',
        pointBorderWidth: 2,
          spanGaps: true,
        },
        {
          label: 'Exam Score (%)',
          data: examData,
          fill: false,
          borderColor: '#dc2626',
          backgroundColor: '#dc2626',
          tension: 0.3,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#dc2626',
          pointBorderWidth: 2,
          spanGaps: true,
      },
    ],
  };
  }, [quizHistory, examHistory, graphUpdate]);

  const combinedPerformanceOptions = {
    responsive: true,
    animation: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            weight: 600,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const datasetLabel = context.dataset.label || '';
            const value = context.parsed.y;
            if (value === null || isNaN(value)) return '';
            
            let details = '';
            const idx = context.dataIndex;
            
            if (datasetLabel.includes('Quiz')) {
              if (quizHistory[idx]) {
                const quiz = quizHistory[idx];
                details = ` ${quiz.subject} | ${formatDate(quiz.completedAt)} | ${quiz.score}/${quiz.totalQuestions} (${value}%)`;
              }
            } else if (datasetLabel.includes('Exam')) {
              if (examHistory[idx]) {
                const exam = examHistory[idx];
                details = ` ${exam.subject} | ${formatDate(exam.completedAt)} | ${exam.score}/${exam.totalQuestions} (${value}%) | Duration: ${formatDuration(exam.duration || 0)}`;
              }
            }
            
            return `${datasetLabel}: ${value}%${details}`;
          },
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
          color: '#3730a3',
          font: { weight: 600 },
        },
        grid: {
          color: '#e0e7ff',
        },
      },
      x: {
        ticks: {
          color: '#6366f1',
          font: { weight: 600 },
          maxRotation: 45,
          minRotation: 45,
        },
        grid: {
          color: '#f3f4f6',
        },
      },
    },
  };

  // Helper to render quiz details
  const renderQuizDetails = (quiz) => {
    if (!quiz.questions || !quiz.userAnswers || !quiz.correctAnswers) {
      return <p>No detailed data available for this quiz attempt.</p>;
    }
    return (
      <div>
        <table className="table table-bordered" style={{ borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
          <thead style={{ background: '#e0e7ff' }}>
            <tr>
              <th>#</th>
              <th>Question</th>
              <th>Your Answer</th>
              <th>Correct Answer</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {quiz.questions.map((q, idx) => {
              const userAns = quiz.userAnswers[idx] || '';
              const correctAns = quiz.correctAnswers[idx] || '';
              const isCorrect = userAns === correctAns;
              return (
                <tr key={idx} style={{ background: isCorrect ? '#e0ffe0' : '#ffe0e0' }}>
                  <td>{idx + 1}</td>
                  <td>{q}</td>
                  <td className={isCorrect ? 'text-success' : 'text-danger'}>{userAns || <em>Not answered</em>}</td>
                  <td>{correctAns}</td>
                  <td>
                    {isCorrect ? (
                      <span className="badge bg-success">Correct</span>
                    ) : (
                      <span className="badge bg-danger">Wrong</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Handle profile image upload
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const token = localStorage.getItem('token');
      const res = await axios.post('/auth/upload-profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      setUser(res.data.user); // update user state directly
      localStorage.setItem('user', JSON.stringify(res.data.user));
      // Dispatch event to notify Header component
      window.dispatchEvent(new Event('profileUpdated'));
    } catch (err) {
      setUploadError('Image upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Calculate per-subject success percentages
  const getSubjectSuccess = () => {
    if (!quizHistory.length) return [];
    const subjectMap = {};
    quizHistory.forEach(q => {
      if (!subjectMap[q.subject]) subjectMap[q.subject] = [];
      subjectMap[q.subject].push((q.score / q.totalQuestions) * 100);
    });
    const subjects = Object.keys(subjectMap);
    const subjectSuccess = subjects.map(subj => {
      const avg = subjectMap[subj].reduce((a, b) => a + b, 0) / subjectMap[subj].length;
      return { subject: subj, percentage: Math.round(avg) };
    });
    return subjectSuccess;
  };
  const subjectSuccess = getSubjectSuccess();
  const overallSuccess = subjectSuccess.length
    ? Math.round(subjectSuccess.reduce((a, b) => a + b.percentage, 0) / subjectSuccess.length)
    : 0;

  // Helper for bar color
  const getBarColor = (pct) => {
    if (pct >= 80) return '#22c55e'; // green
    if (pct >= 60) return '#eab308'; // yellow
    return '#ef4444'; // red
  };

  if (loading) {
    return <div className="text-center mt-5">Loading profile...</div>;
  }

  return (
    <div className="container py-5 min-vh-100">
      {/* Download Report Button */}
      <div className="mb-4 d-flex justify-content-end">
        <button
          className="btn btn-outline-primary px-4 py-2 shadow-sm"
          style={{ fontWeight: 600, borderRadius: 8 }}
          onClick={handleDownloadReport}
        >
          <span role="img" aria-label="download">⬇️</span> Download Report
        </button>
      </div>
      <div className="row g-4">
        {/* User Info */}
        <div className="col-md-4">
          <div className="card p-4 shadow-lg mb-4" style={{ borderRadius: 18 }}>
            <h3 className="text-center mb-3" style={{ color: '#6366f1', fontWeight: 700 }}>
              Profile
            </h3>
            <div className="d-flex flex-column align-items-center mb-3">
              {/* Loading fallback for image */}
              {user ? (
                <img
                  src={user.profileImage || defaultAvatar}
                  alt="Profile"
                  style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '3px solid #6366f1', marginBottom: 8 }}
                  key={user.profileImage || 'default'}
                />
              ) : (
                <div style={{ width: 96, height: 96, borderRadius: '50%', background: '#e0e7ff', marginBottom: 8 }} />
              )}
              <label htmlFor="profile-image-upload" className="btn btn-sm btn-outline-primary mt-2" style={{ fontWeight: 500 }}>
                {uploading ? 'Uploading...' : 'Change Photo'}
                <input
                  id="profile-image-upload"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageChange}
                  disabled={uploading}
                />
              </label>
              {uploadError && <div className="text-danger small mt-1">{uploadError}</div>}
            </div>
            <p><strong>Name:</strong> <span style={{ color: '#3730a3' }}>{user.name || "Not provided"}</span></p>
            <p><strong>Email:</strong> <span style={{ color: '#6366f1' }}>{user.email || "Not available"}</span></p>
            <p><strong>Joined:</strong> {user.joined ? formatDate(user.joined) : "Date not available"}</p>
            <p><strong>Quizzes Completed:</strong> <span style={{ color: '#22c55e', fontWeight: 600 }}>{quizHistory.length}</span></p>
          </div>
          {/* Streak Information */}
          <div className="card p-4 shadow-lg mt-4" style={{ borderRadius: 18 }}>
            <div className="d-flex justify-content-center align-items-center">
              <span className="h2 mb-0 me-2" style={{ color: '#ff6b35' }}>
                {renderStreakFires(streakData.currentStreak)}
              </span>
              <span className="h3 mb-0" style={{ color: '#ff6b35', fontWeight: 700 }}>
                {streakData.currentStreak}
              </span>
            </div>
          </div>
          {/* Overall Statistics */}
          {stats && (
            <div className="card p-4 shadow-lg mt-4" style={{ borderRadius: 18 }}>
              <h4 className="mb-3" style={{ color: '#3730a3', fontWeight: 700 }}>
                <span role="img" aria-label="stats">📊</span> Overall Statistics
              </h4>
              <div className="row text-center">
                <div className="col-6 mb-3">
                  <div className="border rounded p-2" style={{ background: '#f8fafc' }}>
                    <h5 className={`mb-1 ${stats.averagePercentage >= 80 ? 'text-success' : stats.averagePercentage >= 60 ? 'text-warning' : 'text-danger'}`}>{stats.averagePercentage}%</h5>
                    <small className="text-muted">Average Score</small>
                  </div>
                </div>
                <div className="col-6 mb-3">
                  <div className="border rounded p-2" style={{ background: '#f8fafc' }}>
                    <h5 className="mb-1 text-success">{stats.bestPercentage}%</h5>
                    <small className="text-muted">Best Score</small>
                  </div>
                </div>
                <div className="col-6 mb-3">
                  <div className="border rounded p-2" style={{ background: '#f8fafc' }}>
                    <h5 className="mb-1 text-info">{stats.uniqueSubjects}</h5>
                    <small className="text-muted">Subjects Attempted</small>
                  </div>
                </div>
                <div className="col-6 mb-3">
                  <div className="border rounded p-2" style={{ background: '#f8fafc' }}>
                    <h5 className="mb-1 text-primary">{stats.totalScore}/{stats.totalQuestions}</h5>
                    <small className="text-muted">Total Correct</small>
                  </div>
                </div>
              </div>
              <div className="text-center mt-2">
                <small className="text-muted">
                  Best Performance: <strong>{stats.bestSubject}</strong>
                </small>
              </div>
            </div>
          )}
          {/* Success to Crack MNCs Section */}
          {subjectSuccess.length > 0 && (
            <div className="card p-4 shadow-lg mt-4" style={{ borderRadius: 18 }}>
              <h4 className="mb-3" style={{ color: '#6366f1', fontWeight: 700 }}>
                <span role="img" aria-label="success">🏆</span> Success to Crack MNCs
              </h4>
              <div className="mb-3">
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Overall</div>
                <div style={{ background: '#e0e7ff', borderRadius: 8, height: 18, width: '100%', marginBottom: 12, position: 'relative' }}>
                  <div style={{
                    width: `${overallSuccess}%`,
                    background: getBarColor(overallSuccess),
                    height: '100%',
                    borderRadius: 8,
                    transition: 'width 0.4s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 13,
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    zIndex: 2,
                    minWidth: 36
                  }}>{overallSuccess}%</div>
                </div>
              </div>
              {subjectSuccess.map((s, idx) => (
                <div key={s.subject} className="mb-2">
                  <div style={{ fontWeight: 500, marginBottom: 2 }}>{s.subject}</div>
                  <div style={{ background: '#e0e7ff', borderRadius: 8, height: 14, width: '100%', position: 'relative' }}>
                    <div style={{
                      width: `${s.percentage}%`,
                      background: getBarColor(s.percentage),
                      height: '100%',
                      borderRadius: 8,
                      transition: 'width 0.4s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: 11,
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      zIndex: 2,
                      minWidth: 36
                    }}>{s.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Quiz & Exam History */}
        <div className="col-md-8">
          {/* Quiz History */}
          <div className="card p-4 shadow-lg mb-4" style={{ borderRadius: 18 }}>
            <h3 className="mb-3" style={{ color: '#6366f1', fontWeight: 700 }}>
              <span role="img" aria-label="quiz">📊</span> Quiz History
            </h3>
            {quizHistory.length === 0 ? (
              <p className="text-muted text-center">No quizzes completed yet. <a href="/Quiz" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}>Take your first quiz!</a></p>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-striped" style={{ borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
                    <thead style={{ background: '#e0e7ff' }}>
                      <tr>
                        <th>Subject</th>
                        <th>Score</th>
                        <th>Percentage</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentQuizzes.map((quiz, index) => (
                        <tr key={index} className="quiz-history-row" style={{ cursor: 'pointer', transition: 'background 0.18s' }}>
                          <td>
                            <button
                              className="btn btn-link btn-sm p-0 me-2"
                              style={{ textDecoration: 'underline', fontWeight: 500 }}
                              onClick={() => handleQuizClick(quiz, index + 1 + indexOfFirstQuiz)}
                            >
                              Quiz #{index + 1 + indexOfFirstQuiz}
                            </button>
                            <strong>{quiz.subject}</strong>
                          </td>
                          <td>{quiz.score}/{quiz.totalQuestions}</td>
                          <td className={getScoreColor(quiz.score, quiz.totalQuestions)}>
                            <strong>{Math.round((quiz.score / quiz.totalQuestions) * 100)}%</strong>
                          </td>
                          <td>{formatDate(quiz.completedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                {totalPages > 1 && (
                  <nav aria-label="Quiz history pagination">
                    <ul className="pagination justify-content-center">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => paginate(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </button>
                      </li>
                      {[...Array(totalPages)].map((_, index) => (
                        <li key={index + 1} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => paginate(index + 1)}
                          >
                            {index + 1}
                          </button>
                        </li>
                      ))}
                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => paginate(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </button>
                      </li>
                    </ul>
                    <div className="text-center mt-2">
                      <small className="text-muted">
                        Showing {indexOfFirstQuiz + 1} to {Math.min(indexOfLastQuiz, quizHistory.length)} of {quizHistory.length} quizzes
                      </small>
                    </div>
                  </nav>
                )}
              </>
            )}
          </div>

          {/* Exam History */}
          <div className="card p-4 shadow-lg mb-4" style={{ borderRadius: 18 }}>
            <h3 className="mb-3" style={{ color: '#dc2626', fontWeight: 700 }}>
              <span role="img" aria-label="exam">🎓</span> Exam History
            </h3>
            {examHistory.length === 0 ? (
              <p className="text-muted text-center">No exams completed yet. <a href="/Exam" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}>Take your first exam!</a></p>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-striped" style={{ borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
                    <thead style={{ background: '#fee2e2' }}>
                      <tr>
                        <th>Subject</th>
                        <th>Score</th>
                        <th>Percentage</th>
                        <th>Duration</th>
                        <th>Violations</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentExams.map((exam, index) => (
                        <tr key={index} className="exam-history-row" style={{ cursor: 'pointer', transition: 'background 0.18s' }}>
                          <td>
                            <button
                              className="btn btn-link btn-sm p-0 me-2"
                              style={{ textDecoration: 'underline', fontWeight: 500 }}
                              onClick={() => handleExamClick(exam, index + 1 + indexOfFirstExam)}
                            >
                              Exam #{index + 1 + indexOfFirstExam}
                            </button>
                            <strong>{exam.subject}</strong>
                          </td>
                          <td>{exam.score}/{exam.totalQuestions}</td>
                          <td className={getScoreColor(exam.score, exam.totalQuestions)}>
                            <strong>{Math.round((exam.score / exam.totalQuestions) * 100)}%</strong>
                          </td>
                          <td>{formatDuration(exam.duration || 0)}</td>
                          <td>
                            {exam.tabSwitches > 0 ? (
                              <span className="badge bg-warning text-dark">{exam.tabSwitches}</span>
                            ) : (
                              <span className="badge bg-success">0</span>
                            )}
                          </td>
                          <td>{formatDate(exam.completedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Exam Pagination */}
                {totalExamPages > 1 && (
                  <nav aria-label="Exam history pagination">
                    <ul className="pagination justify-content-center">
                      <li className={`page-item ${currentExamPage === 1 ? 'disabled' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => paginateExams(currentExamPage - 1)}
                          disabled={currentExamPage === 1}
                        >
                          Previous
                        </button>
                      </li>
                      {[...Array(totalExamPages)].map((_, index) => (
                        <li key={index + 1} className={`page-item ${currentExamPage === index + 1 ? 'active' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => paginateExams(index + 1)}
                          >
                            {index + 1}
                          </button>
                        </li>
                      ))}
                      <li className={`page-item ${currentExamPage === totalExamPages ? 'disabled' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => paginateExams(currentExamPage + 1)}
                          disabled={currentExamPage === totalExamPages}
                        >
                          Next
                        </button>
                      </li>
                    </ul>
                    <div className="text-center mt-2">
                      <small className="text-muted">
                        Showing {indexOfFirstExam + 1} to {Math.min(indexOfLastExam, examHistory.length)} of {examHistory.length} exams
                      </small>
                    </div>
                  </nav>
                )}
              </>
            )}
          </div>

          {/* Combined Performance Graph (Quiz + Exam in one box) */}
          {(quizHistory.length > 0 || examHistory.length > 0) && (
            <div className="card p-4 shadow-lg mt-4" style={{ borderRadius: 18 }}>
              <h4 className="mb-3" style={{ color: '#6366f1', fontWeight: 700 }}>
                <span role="img" aria-label="trend">📈</span> Performance Trend (Quiz & Exam)
              </h4>
              <div key={graphUpdate} style={{ animation: 'fadeIn 0.5s' }}>
                <Line 
                  data={combinedPerformanceData} 
                  options={combinedPerformanceOptions} 
                  height={280}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Quiz Details Modal (modern style) */}
      {showQuizModal && selectedQuiz && (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.3)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: 18 }}>
              <div className="modal-header" style={{ background: '#e0e7ff', borderTopLeftRadius: 18, borderTopRightRadius: 18 }}>
                <h5 className="modal-title">Quiz #{selectedQuiz.index} - {selectedQuiz.subject} Details</h5>
                <button type="button" className="btn-close" onClick={() => setShowQuizModal(false)}></button>
              </div>
              <div className="modal-body">
                {renderQuizDetails(selectedQuiz)}
              </div>
              <div className="modal-footer" style={{ background: '#f8fafc', borderBottomLeftRadius: 18, borderBottomRightRadius: 18 }}>
                <button className="btn btn-secondary" onClick={() => setShowQuizModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exam Details Modal */}
      {showExamModal && selectedExam && (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.3)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: 18 }}>
              <div className="modal-header" style={{ background: '#fee2e2', borderTopLeftRadius: 18, borderTopRightRadius: 18 }}>
                <h5 className="modal-title">Exam #{selectedExam.index} - {selectedExam.subject} Details</h5>
                <button type="button" className="btn-close" onClick={() => setShowExamModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <p><strong>Duration:</strong> {formatDuration(selectedExam.duration || 0)}</p>
                  <p><strong>Tab Switches:</strong> {selectedExam.tabSwitches || 0}</p>
                  <p><strong>Face Captured:</strong> {selectedExam.faceCaptured ? 'Yes ✓' : 'No ✗'}</p>
                </div>
                {renderQuizDetails(selectedExam)}
              </div>
              <div className="modal-footer" style={{ background: '#f8fafc', borderBottomLeftRadius: 18, borderBottomRightRadius: 18 }}>
                <button className="btn btn-secondary" onClick={() => setShowExamModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Quiz and Exam history row hover effect */}
      <style>{`
        .quiz-history-row:hover {
          background: #e0e7ff !important;
        }
        .exam-history-row:hover {
          background: #fee2e2 !important;
        }
        
        /* Blinking animation for real-time indicator */
        @keyframes blink {
          0%, 100% { 
            opacity: 1; 
            transform: scale(1);
          }
          50% { 
            opacity: 0.3; 
            transform: scale(0.8);
          }
        }
        
        /* Pulse animation for graph cards */
        @keyframes pulse {
          0%, 100% { 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          50% { 
            box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
          }
        }
        
        /* Fade in animation for graph updates */
        @keyframes fadeIn {
          from { 
            opacity: 0.5; 
            transform: translateY(-5px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Profile;
