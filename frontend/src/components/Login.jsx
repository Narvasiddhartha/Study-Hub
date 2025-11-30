import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios'; // Axios instance

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // If user is already logged in, redirect them
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

 const handleLogin = async (e) => {
  e.preventDefault();
  setError('');

  try {
    const res = await api.post('/auth/login', {
      email,
      password
    });

    const { token, user } = res.data;

    // Store token and user data
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    // Notify app about auth change
    window.dispatchEvent(new Event('authChange'));

    navigate('/dashboard');
  } catch (err) {
    console.error('Login error:', err);
    setError(err.response?.data?.message || 'Server error during login');
  }
};

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="card shadow p-4" style={{ width: '100%', maxWidth: '400px' }}>
        <h3 className="text-center mb-4">🔐 Login to StudyHub</h3>
        <form onSubmit={handleLogin}>
          {error && <div className="alert alert-danger">{error}</div>}
          <div className="mb-3">
            <label className="form-label">Email address</label>
            <input
              type="email"
              className="form-control"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@gmail.com"
            />
          </div>
          <div className="mb-4">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="1234"
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">Login</button>
        </form>
        <div className="text-center mt-3">
          <p className="mb-2">
            <Link to="/forgot-password" style={{ textDecoration: 'none', color: '#6366f1' }}>
              Forgot Password?
            </Link>
          </p>
          <p className="mb-0">
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
