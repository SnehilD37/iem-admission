import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Lock, Mail, User, ShieldCheck, GraduationCap, Check } from 'lucide-react';

export const AuthModal = ({ isOpen, onClose, initialRole = 'student' }) => {
  const { loginCustom, loginWithGoogle, register } = useAuth();
  const [activeTab, setActiveTab] = useState(initialRole === 'admin' ? 'admin' : 'login'); // 'login' | 'register' | 'admin'
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const targetRole = activeTab === 'admin' ? 'admin' : 'student';
    const res = await loginWithGoogle(targetRole);
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Google Sign-in failed');
    }
  };

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await loginCustom({ email, password, roleType: 'student' });
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Login failed');
    }
  };

  const handleStudentRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await register({ email, fullName, phone, password });
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Registration failed');
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await loginCustom({ email, password, roleType: 'admin' });
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Admin verification failed');
    }
  };


  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {activeTab === 'admin' ? <ShieldCheck size={20} /> : <GraduationCap size={20} />}
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--secondary)' }}>
                {activeTab === 'admin' ? 'IEM Admission Scrutiny Staff Login' : 'IEM Applicant Authentication'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                Powered by Firebase Auth Integration
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '4px', borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        {/* Tab switchers */}
        <div style={{ display: 'flex', background: 'var(--muted-bg)', padding: '4px', borderBottom: '1px solid var(--card-border)' }}>
          <button
            onClick={() => { setActiveTab('login'); setError(''); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              borderRadius: '6px',
              backgroundColor: activeTab === 'login' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'login' ? 'var(--primary)' : 'var(--muted)',
              boxShadow: activeTab === 'login' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            Applicant Login
          </button>
          <button
            onClick={() => { setActiveTab('register'); setError(''); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              borderRadius: '6px',
              backgroundColor: activeTab === 'register' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'register' ? 'var(--primary)' : 'var(--muted)',
              boxShadow: activeTab === 'register' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            Register
          </button>
          <button
            onClick={() => { setActiveTab('admin'); setError(''); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              borderRadius: '6px',
              backgroundColor: activeTab === 'admin' ? 'var(--secondary)' : 'transparent',
              color: activeTab === 'admin' ? '#FFFFFF' : 'var(--muted)',
              boxShadow: activeTab === 'admin' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Admin Console
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {error && (
            <div style={{ padding: '8px 12px', borderRadius: '6px', background: 'var(--destructive-light)', color: 'var(--destructive)', fontSize: '0.8rem', marginBottom: '1rem', border: '1px solid var(--destructive-border)' }}>
              {error}
            </div>
          )}

          {activeTab === 'login' && (
            <form onSubmit={handleStudentLogin}>

              <div className="form-group">
                <label className="form-label">Registered Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--muted)' }} />
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul.sen26@gmail.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '34px' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--muted)' }} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '34px' }}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                {loading ? 'Authenticating...' : 'Sign In as Applicant'}
              </button>
            </form>
          )}

          {activeTab === 'register' && (
            <form onSubmit={handleStudentRegister}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--muted)' }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Joydeep Ghosh"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '34px' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--muted)' }} />
                  <input
                    type="email"
                    required
                    placeholder="e.g. joydeep@gmail.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '34px' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <input
                  type="tel"
                  placeholder="9876543210"
                  maxLength={10}
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--muted)' }} />
                  <input
                    type="password"
                    required
                    placeholder="Create secure password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '34px' }}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                {loading ? 'Creating Account...' : 'Register & Start Application'}
              </button>
            </form>
          )}

          {activeTab === 'admin' && (
            <form onSubmit={handleAdminLogin}>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '10px 14px', borderRadius: '6px', fontSize: '0.78rem', color: '#475569', marginBottom: '1rem' }}>
                🛡️ Scrutiny Committee & Registrar Authorized Access Only.
              </div>

              <div className="form-group">
                <label className="form-label">Faculty / Staff Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--muted)' }} />
                  <input
                    type="email"
                    required
                    placeholder="admin@iem.edu.in"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '34px' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Master Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--muted)' }} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '34px' }}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }}>
                {loading ? 'Verifying Staff Credentials...' : 'Access Scrutiny Console'}
              </button>
            </form>
          )}

          {/* OR CONTINUE WITH GOOGLE Divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0 1rem', color: 'var(--muted)' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--card-border)' }} />
            <span style={{ padding: '0 10px', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              or continue with google
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--card-border)' }} />
          </div>

          {/* Google Sign-in Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px 14px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              fontSize: '0.825rem',
              fontWeight: 600,
              color: '#1E293B',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.borderColor = '#94A3B8'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>
              {activeTab === 'admin'
                ? 'Sign In with Google'
                : activeTab === 'register'
                  ? 'Sign Up with Google'
                  : 'Sign In with Google'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
