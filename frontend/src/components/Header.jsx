import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import defaultAvatar from '../assets/default-avatar.png';

const Header = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0
  });
  const [userProfileImage, setUserProfileImage] = useState(null);
  const [userName, setUserName] = useState('Profile');

  const handleLogout = () => {
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear any cached data
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    // Dispatch auth change event
    window.dispatchEvent(new Event('authChange'));
    
    // Replace current history entry to prevent back navigation
    window.history.replaceState(null, '', '/');
    
    // Force immediate redirect to home
    window.location.href = '/';
  };

  const fetchStreakData = async () => {
    const token = localStorage.getItem('token');
    if (!token || !isAuthenticated) return;

    try {
      const response = await axios.get('/auth/streak', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStreakData(response.data);
    } catch (error) {
      console.error('Error fetching streak data:', error);
    }
  };

  useEffect(() => {
    const updateAuth = () => {
      const token = localStorage.getItem('token');
      setIsAuthenticated(!!token);
    };
    
    updateAuth();
    window.addEventListener('authChange', updateAuth);
    window.addEventListener('storage', updateAuth);
    return () => {
      window.removeEventListener('authChange', updateAuth);
      window.removeEventListener('storage', updateAuth);
    };
  }, []);

  const updateUserInfo = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserName(user?.name || 'Profile');
        const profileImg = user?.profileImage || null;
        setUserProfileImage(profileImg);
        console.log('Header - User profile image:', profileImg);
      } else {
        // If no user in localStorage, try to fetch from API
        fetchUserProfile();
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  };

  const fetchUserProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token || !isAuthenticated) return;

    try {
      const response = await axios.get('/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const user = response.data.user;
      setUserName(user?.name || 'Profile');
      const profileImg = user?.profileImage || null;
      setUserProfileImage(profileImg);
      console.log('Header - Fetched profile image from API:', profileImg);
      
      // Update localStorage with latest user data
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchStreakData();
      updateUserInfo();
      // Also fetch from API to get latest profile image
      fetchUserProfile();
    } else {
      setUserProfileImage(null);
      setUserName('Profile');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    const refreshStreak = () => {
      fetchStreakData();
    };

    window.addEventListener('streakUpdated', refreshStreak);
    window.addEventListener('quizCompleted', refreshStreak);
    window.addEventListener('examCompleted', refreshStreak);

    return () => {
      window.removeEventListener('streakUpdated', refreshStreak);
      window.removeEventListener('quizCompleted', refreshStreak);
      window.removeEventListener('examCompleted', refreshStreak);
    };
  }, [isAuthenticated]);

  // Listen for user updates (e.g., after profile image upload)
  useEffect(() => {
    const handleStorageChange = () => {
      updateUserInfo();
    };
    
    const handleCustomEvent = () => {
      // Refresh user info when custom events fire
      updateUserInfo();
      if (isAuthenticated) {
        fetchUserProfile();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authChange', handleCustomEvent);
    window.addEventListener('profileUpdated', handleCustomEvent);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleCustomEvent);
      window.removeEventListener('profileUpdated', handleCustomEvent);
    };
  }, [isAuthenticated]);

  // Single icon display only; number reflects streak

  const authenticatedLinks = [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Resources', to: '/resources' },
    { label: 'Notes', to: '/notes' },
    { label: 'Quiz', to: '/Quiz' },
    { label: 'Exam', to: '/Exam' },
    { label: 'AI Desk', to: '/ai-predictor' },
    { label: 'Code Editor', to: '/code-editor' },
    { label: 'Contact', to: '/contact' },
    { label: 'FAQ', to: '/faq' }
  ];

  return (
    <header className="global-header shadow-sm">
      <div className="container-xl py-3 d-flex flex-column gap-3">
        <div className="d-flex flex-column flex-xl-row gap-3 align-items-stretch align-items-xl-center justify-content-between">
          {/* Brand */}
          <Link className="brand-mark text-decoration-none d-flex align-items-center gap-3" to="/">
            <div className="brand-icon">
              <span>SH</span>
            </div>
            <div className="d-flex flex-column">
              <span className="brand-title">StudyHub</span>
              <small className="brand-tagline">Upskill like a product team</small>
            </div>
          </Link>

          {/* Meta */}
          <div className="d-flex align-items-center gap-3 justify-content-end flex-wrap">
            {isAuthenticated ? (
              <div className="user-meta d-flex align-items-center gap-3">
                {streakData.currentStreak > 0 && (
                  <div className="streak-pill">
                    <span>🔥</span>
                    <div>
                      <small className="text-muted text-uppercase">Streak</small>
                      <strong>{streakData.currentStreak} days</strong>
                    </div>
                  </div>
                )}
                <Link to="/profile" className="text-decoration-none d-flex align-items-center gap-2">
                  <img
                    src={userProfileImage && userProfileImage.trim() !== '' ? userProfileImage : defaultAvatar}
                    alt="Profile"
                    className="user-avatar"
                    onError={(e) => {
                      e.target.src = defaultAvatar;
                    }}
                  />
                  <div>
                    <span className="fw-semibold text-dark d-block">{userName}</span>
                    <small className="text-muted">View profile</small>
                  </div>
                </Link>
                <button className="btn btn-outline-danger rounded-pill px-3 fw-semibold" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            ) : (
              <div className="d-flex gap-2">
                <Link to="/login" className="btn btn-outline-primary rounded-pill px-3">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary rounded-pill px-3">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>

        {isAuthenticated && (
          <div className="nav-pill-group">
            {authenticatedLinks.map((link) => (
              <Link key={link.to} to={link.to} className="nav-pill">
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .global-header {
          position: sticky;
          top: 0;
          z-index: 1100;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid #e2e8f0;
        }
        .brand-icon {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          background: linear-gradient(135deg,#4c1d95,#7c3aed,#22d3ee);
          display: grid;
          place-items: center;
          color: #fff;
          font-weight: 700;
          font-size: 20px;
        }
        .brand-title {
          font-size: 1.4rem;
          font-weight: 700;
          color: #0f172a;
        }
        .brand-tagline {
          letter-spacing: 0.1em;
          color: #94a3b8;
          font-size: 0.75rem;
        }
        .user-meta {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          padding: 0.35rem 0.75rem;
        }
        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #c7d2fe;
          background: #eef2ff;
        }
        .streak-pill {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.35rem 0.8rem;
          border-radius: 999px;
          border: 1px solid #fee2e2;
          background: #fff5f5;
        }
        .streak-pill strong {
          color: #b91c1c;
        }
        .nav-pill-group {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }
        .nav-pill {
          padding: 0.4rem 1rem;
          border-radius: 999px;
          border: 1px solid #e2e8f0;
          text-decoration: none;
          color: #475569;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }
        .nav-pill:hover {
          border-color: #818cf8;
          color: #312e81;
          background: #eef2ff;
        }
        @media (max-width: 992px) {
          .user-meta {
            flex-wrap: wrap;
            justify-content: center;
          }
        }
      `}</style>
    </header>
  );
};

export default Header;
