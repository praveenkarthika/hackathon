import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/api';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await loginUser(email, password);
      
      if (!data.token) {
        throw new Error('Invalid response from server: No token received');
      }

      localStorage.setItem('token', data.token);
      onLogin();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex min-vh-100">
      {/* Left Side - Brand/Image */}
      <div className="d-none d-lg-flex flex-column justify-content-center align-items-center col-lg-6 p-5" 
           style={{ 
             backgroundColor: '#ffffff',
             position: 'relative',
             overflow: 'hidden',
             color: '#334155'
           }}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '500px' }}>
          <div className="mb-4">
            <img src="/logo1.png" alt="IT HelpDesk Dashboard" className="img-fluid" style={{ maxHeight: '120px' }} />
          </div>
          <p className="lead mb-5" style={{ color: '#64748b' }}>
            Streamline your IT support workflow with our comprehensive ticketing and asset management solution.
          </p>
          <div className="d-flex gap-4" style={{ color: '#64748b' }}>
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-check-circle-fill text-primary"></i> Real-time tracking
            </div>
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-check-circle-fill text-primary"></i> SLA monitoring
            </div>
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-check-circle-fill text-primary"></i> Asset insights
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div 
        className="col-12 col-lg-6 d-flex align-items-center justify-content-center p-4"
        style={{ backgroundColor: '#1a1b67dd', borderColor: '#1a1b67dd' }}
      >
        <div className="w-100" style={{ maxWidth: '420px' }}>
          <div className="text-center mb-5 d-lg-none">
            <h2 className="fw-bold text-primary">HelpDesk</h2>
          </div>
          
          <div className="card shadow-lg border-0 rounded-4">
            <div className="card-body p-5">
              <div className="mb-4">
                <h4 className="fw-bold mb-1">Welcome</h4>
                <p className="text-muted small">Please enter your details to sign in.</p>
              </div>

              {error && (
                <div className="alert alert-danger py-2 small d-flex align-items-center gap-2" role="alert">
                  <i className="bi bi-exclamation-circle-fill"></i>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label text-muted small fw-bold">Email</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted">
                      <i className="bi bi-envelope"></i>
                    </span>
                    <input 
                      type="email" 
                      className="form-control border-start-0 ps-0" 
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      style={{ boxShadow: 'none' }}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label text-muted small fw-bold mb-0">Password</label>
                    {/* <a href="#" className="text-decoration-none small text-primary fw-semibold">Forgot password?</a> */}
                  </div>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted">
                      <i className="bi bi-lock"></i>
                    </span>
                    <input 
                      type="password" 
                      className="form-control border-start-0 ps-0" 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{ boxShadow: 'none' }}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary w-100 py-2 fw-semibold shadow-sm" 
                  disabled={loading}
                  style={{ backgroundColor: '#1a1b67dd', borderColor: '#1a1b67dd' }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>
            </div>
          </div>
          
          {/* <div className="text-center mt-4 text-muted small">
            Don't have an account? <a href="#" className="text-primary fw-semibold text-decoration-none">Contact Admin</a>
          </div> */}
        </div>
      </div>
    </div>
  );
}

export default Login;
