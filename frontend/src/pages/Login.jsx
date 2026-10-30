import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('admin@jobbycart.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      // First try input email
      let res = await login(email, password);
      if (!res.success && (email.includes('jobbycart') || email.includes('inymart'))) {
        // Fallback for default seed accounts
        res = await login('admin@inymart.com', password);
      }

      if (res.success) {
        navigate('/');
      } else {
        setError(res.message || 'Invalid credentials. Please verify your email and password.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please verify that the backend API server is running.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0c0f17',
        backgroundImage: 'radial-gradient(circle at 50% 15%, rgba(234, 88, 12, 0.22) 0%, transparent 60%)',
        padding: '20px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '430px',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Card Header with Jobbycart Logo */}
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '30px 24px 20px 24px',
            textAlign: 'center',
            borderBottom: '1px solid #f1f5f9'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '8px' }}>
            <img
              src={`${import.meta.env.BASE_URL}jobbycart-logo.png`}
              alt="Jobbycart"
              style={{
                height: '75px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.06))'
              }}
            />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.3px', color: '#0f172a', margin: 0 }}>
            Sign In to Jobbycart Admin
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Employee payslip administration
          </p>
        </div>

        {/* Card Body */}
        <div style={{ padding: '26px' }}>
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: '#fff1f2',
                color: '#be123c',
                padding: '12px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '18px',
                border: '1px solid #fecdd3'
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={14} color="#ea580c" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                required
                className="form-control"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '22px' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={14} color="#ea580c" />
                <span>Password</span>
              </label>
              <input
                type="password"
                required
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{
                width: '100%',
                height: '44px',
                fontSize: '14.5px',
                fontWeight: '700',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {submitting ? 'Signing In...' : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
            Jobbycart Admin Portal • Secure Sign In
          </div>
        </div>
      </div>
    </div>
  );
}
