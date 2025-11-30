import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetUrl, setResetUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setResetUrl('');
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email });
      
      setMessage(res.data.message);
      
      // In development, show the reset URL if provided
      if (res.data.resetUrl) {
        setResetUrl(res.data.resetUrl);
      }
      
      // Also show resetToken if available (for development)
      if (res.data.resetToken) {
        setResetUrl(`${window.location.origin}/reset-password/${res.data.resetToken}`);
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      
      // Better error handling
      if (err.response) {
        // Server responded with error status
        setError(err.response.data?.message || 'Failed to send reset email. Please try again.');
      } else if (err.request) {
        // Request was made but no response received
        setError('Unable to connect to server. Please check if the backend is running.');
      } else {
        // Something else happened
        setError(err.message || 'Failed to send reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="card shadow p-4" style={{ width: '100%', maxWidth: '400px' }}>
        <h3 className="text-center mb-4">🔑 Reset Password</h3>
        <p className="text-muted text-center mb-4">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-danger">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}
          
          {resetUrl && (
            <div className="alert alert-info">
              <strong>Development Mode:</strong> Click the link below to reset your password:
              <br />
              <a href={resetUrl} target="_blank" rel="noopener noreferrer" className="text-break">
                {resetUrl}
              </a>
            </div>
          )}

          <div className="mb-3">
            <label className="form-label">Email address</label>
            <input
              type="email"
              className="form-control"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@gmail.com"
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="text-center mt-3">
          <Link to="/login" style={{ textDecoration: 'none', color: '#6366f1' }}>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
