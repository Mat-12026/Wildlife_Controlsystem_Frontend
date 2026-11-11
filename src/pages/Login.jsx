import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [credenciales, setCredenciales] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredenciales({ ...credenciales, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('https://both-smirk-entrust.ngrok-free.dev/api/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(credenciales)
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('operator_user', data.username);
        navigate('/admin/dashboard');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError('Connection error. Ensure Django backend and Ngrok tunnel are active.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="d-flex align-items-center justify-content-center" 
      style={{ 
        minHeight: '100vh', 
        backgroundColor: '#121212', 
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.9)), url("https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1920&q=80")', 
        backgroundSize: 'cover' 
      }}
    >
      <div 
        className="card p-5 shadow-lg bg-dark text-light border border-secondary rounded-0" 
        style={{ width: '100%', maxWidth: '450px' }}
      >
        <div className="text-center mb-4">
          <p className="text-uppercase mb-1" style={{ color: 'var(--tp-gold)', fontWeight: '700', letterSpacing: '2px', fontSize: '0.8rem' }}>
            OPERATOR PORTAL
          </p>
          <h2 className="fw-bold text-uppercase text-white mb-2" style={{ letterSpacing: '1px' }}>
            To Patagonia Logistics
          </h2>
          <p className="small opacity-75" style={{ color: '#b0b0b0' }}>
            Enter your Django corporate credentials to access management console.
          </p>
        </div>

        {error && (
          <div className="alert alert-danger rounded-0 small py-2 text-center" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label text-light small text-uppercase fw-bold" style={{ letterSpacing: '0.5px' }}>
              Corporate Username
            </label>
            <div className="input-group">
              <span className="input-group-text bg-black border-secondary text-light rounded-0">
                <i className="bi bi-person"></i>
              </span>
              <input 
                type="text" 
                name="username" 
                className="form-control bg-black text-light border-secondary rounded-0" 
                placeholder="e.g. admin" 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="form-label text-light small text-uppercase fw-bold" style={{ letterSpacing: '0.5px' }}>
              Password
            </label>
            <div className="input-group">
              <span className="input-group-text bg-black border-secondary text-light rounded-0">
                <i className="bi bi-lock"></i>
              </span>
              <input 
                type="password" 
                name="password" 
                className="form-control bg-black text-light border-secondary rounded-0" 
                placeholder="••••••••" 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn w-100 fw-bold text-uppercase rounded-0 py-3 mb-3" 
            style={{ backgroundColor: 'var(--tp-gold)', color: '#000', letterSpacing: '1px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
        
        <div className="text-center mt-3">
          <a href="/" className="text-light opacity-75 text-decoration-none small text-uppercase" style={{ letterSpacing: '1px' }}>
            <i className="bi bi-arrow-left me-2"></i>Return to Public Site
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;