import React from 'react';
import { BrowserRouter as Router, Routes, Route ,Navigate, useLocation} from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import LandingPage from './components/LandingPage';
import Register from './components/Register';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import ProtectedRoute from './components/ProtectedRoute'; // ✅ import it
import Dashboard from './components/Dashboard';
import DSA from './pages/DSA';
import OS from './pages/OS';
import CN from './pages/CN';
import DBMS from './pages/DBMS';
import Java from './pages/Java';
import Python from './pages/Python';
import WebDev from './pages/WebDev';
import SE from './pages/SE';
import ML from './pages/ML';
import Resources from './components/Resources';
import Notes from './pages/Notes';
import SubjectNotePad from './pages/SubjectNotePad';
import Profile from './components/Profile';
import SubjectQuiz from './pages/SubjectQuiz'; // or correct path
import SubjectExam from './pages/SubjectExam';
import QuizPage from './pages/QuizPage';
import ExamPage from './pages/ExamPage';
import Contact from './pages/Contact';
import FAQ from './pages/FAQ';
import AIPredictor from './pages/AIPredictor';
import Chatbot from './components/Chatbot';
import CodeEditor from './components/CodeEditor';
import { useState, useEffect } from 'react';
// Component to conditionally show chatbot based on route
const AppContent = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('token'));
  const [showChatPopup, setShowChatPopup] = useState(false);
  const location = useLocation();

  // Listen for auth changes (login/logout)
  useEffect(() => {
    const handleAuthChange = () => {
      const hasToken = !!localStorage.getItem('token');
      setIsAuthenticated(hasToken);
      
      // If logged out and on protected route, redirect immediately
      if (!hasToken && location.pathname !== '/' && 
          location.pathname !== '/login' && 
          location.pathname !== '/register' &&
          !location.pathname.startsWith('/forgot-password') &&
          !location.pathname.startsWith('/reset-password')) {
        window.location.href = '/';
      }
    };
    
    // Check immediately
    handleAuthChange();
    
    window.addEventListener('authChange', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    
    // Check on location change (back/forward button)
    const checkAuthOnNavigation = () => {
      handleAuthChange();
    };
    window.addEventListener('popstate', checkAuthOnNavigation);
    
    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('popstate', checkAuthOnNavigation);
    };
  }, [location.pathname]);

  // Disable initial chatbot promo popup per user request
  useEffect(() => {
    setShowChatPopup(false);
    sessionStorage.removeItem('chatPopupShown');
  }, [isAuthenticated]);

  // Check if current route is a quiz or exam route
  const isQuizRoute = location.pathname.startsWith('/quiz/') || location.pathname.startsWith('/exam/');
  const isExamRoute = location.pathname.startsWith('/exam/');

  return (
    <>
      {/* Hide header during exam */}
      {!isExamRoute && <Header />}
      
      <div className="flex-grow-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
   <Route
    path="/dashboard"
     element={
     <ProtectedRoute>
      <Dashboard />
     </ProtectedRoute>
      }
          />
      <Route path="/dsa" element={<DSA />} />
      <Route path="/os" element={<OS />} />
      <Route path="/cn" element={<CN />} />
      <Route path="/dbms" element={<DBMS />} />
      <Route path="/java" element={<Java />} />
      <Route path="/python" element={<Python />} />
      <Route path="/web-dev" element={<WebDev />} />
      <Route path="/se" element={<SE />} />
      <Route path="/ml" element={<ML />} />
      <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
      <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
      <Route path="/notes/:subject" element={<ProtectedRoute><SubjectNotePad /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
       <Route path="/Quiz" element={<QuizPage />} />
       <Route path="/quiz/:subject" element={<SubjectQuiz />} />
       <Route path="/Exam" element={<ExamPage />} />
       <Route path="/exam/:subject" element={<SubjectExam />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/ai-predictor" element={<AIPredictor />} />
      <Route path="/faq" element={<FAQ />} /> 
      <Route path="/code-editor" element={<CodeEditor />} />
        </Routes>
      </div>
      
      {/* Hide footer during exam */}
      {!isExamRoute && <Footer />}
      {/* Hide chatbot when on quiz route */}
      {isAuthenticated && !isQuizRoute && <Chatbot />}
      {/* Chat helper popup removed as requested */}
    </>
  );
};

const App = () => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Router>
        <AppContent />
      </Router>
    </div>
  );
};

export default App;