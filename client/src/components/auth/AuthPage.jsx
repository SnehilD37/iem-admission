import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  GraduationCap, 
  ShieldCheck, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  ArrowRight, 
  CheckCircle, 
  Award, 
  Sparkles, 
  BookOpen, 
  Clock, 
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export const AuthPage = () => {
  const { loginCustom, loginWithGoogle, register } = useAuth();
  
  // Portal Role Tab: 'student' | 'admin'
  const [portalType, setPortalType] = useState('student');
  // Student Mode: 'login' | 'register'
  const [studentMode, setStudentMode] = useState('login');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await loginWithGoogle(portalType);
      if (!res.success) {
        setError(res.error || 'Google Sign-in failed.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during Google Sign-in.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (portalType === 'admin') {
        const res = await loginCustom({ email, password, roleType: 'admin' });
        if (!res.success) setError(res.error || 'Admin verification failed. Please check credentials.');
      } else {
        if (studentMode === 'login') {
          const res = await loginCustom({ email, password, roleType: 'student' });
          if (!res.success) setError(res.error || 'Student login failed. Please check your credentials.');
        } else {
          if (!fullName.trim()) {
            setError('Please enter your full name as per official marksheets.');
            setLoading(false);
            return;
          }
          const res = await register({ email, password, fullName, phone });
          if (!res.success) setError(res.error || 'Registration failed.');
        }
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC' }}>
      {/* Main Split Authentication Section */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '2rem 1rem' }}>
        <div className="container" style={{ maxWidth: '1120px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2.5rem',
            alignItems: 'center'
          }}>
            
            {/* Left Column: Institutional Info & Value Props */}
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0px', marginBottom: '1.75rem' }}>
                <img 
                  src="/logo.png" 
                  alt="IEM Logo" 
                  style={{ 
                    height: '220px', 
                    width: 'auto', 
                    maxWidth: '100%',
                    objectFit: 'contain', 
                    display: 'block',
                    marginTop: '-55px',
                    marginBottom: '-52px'
                  }} 
                />
                <p style={{ fontSize: '1.05rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  Online Admission & Counseling System
                </p>
              </div>

              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--secondary)', lineHeight: 1.3, marginBottom: '1rem' }}>
                Welcome to Institute of Engineering & Management
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: '0.925rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
                Please sign in to access your designated admission dashboard. Students can submit applications, verify documents, and pay fees. Authorized faculty conduct scrutiny and merit-based seat allocation.
              </p>

              {/* Feature Highlights */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                    <CheckCircle size={14} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--secondary)', margin: 0 }}>
                      Integrated WBJEE & JEE Main Seat Matrix
                    </h4>
                    <p style={{ fontSize: '0.775rem', color: 'var(--muted)', margin: 0 }}>
                      Automated merit ranking and transparent department seat quota allocation.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                    <ShieldCheck size={14} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--secondary)', margin: 0 }}>
                      Digital Scrutiny & Real-time Document Verification
                    </h4>
                    <p style={{ fontSize: '0.775rem', color: 'var(--muted)', margin: 0 }}>
                      Staff side-by-side verification with instant discrepancy resolution.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#FEF3C7', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                    <Award size={14} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--secondary)', margin: 0 }}>
                      Secure Online Admission Settlement
                    </h4>
                    <p style={{ fontSize: '0.775rem', color: 'var(--muted)', margin: 0 }}>
                      Instant seat provisional allotment letters with verified Razorpay payment.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Portal Login & Registration Card */}
            <div>
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid var(--card-border)',
                overflow: 'hidden'
              }}>
                {/* 1. Portal Type Tabs: Student vs Admin */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--card-border)', background: 'var(--muted-bg)', padding: '6px' }}>
                  <button
                    type="button"
                    onClick={() => { setPortalType('student'); setError(''); }}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      backgroundColor: portalType === 'student' ? '#FFFFFF' : 'transparent',
                      color: portalType === 'student' ? 'var(--primary)' : 'var(--muted)',
                      boxShadow: portalType === 'student' ? 'var(--shadow-sm)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <GraduationCap size={18} />
                    <span>Applicant Portal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setPortalType('admin'); setError(''); }}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      backgroundColor: portalType === 'admin' ? 'var(--secondary)' : 'transparent',
                      color: portalType === 'admin' ? '#FFFFFF' : 'var(--muted)',
                      boxShadow: portalType === 'admin' ? 'var(--shadow-sm)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <ShieldCheck size={18} />
                    <span>Admin Scrutiny Desk</span>
                  </button>
                </div>

                <div style={{ padding: '1.75rem 2rem' }}>
                  {/* Student Sub-Tabs: Sign In vs Register */}
                  {portalType === 'student' ? (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem' }}>
                      <button
                        type="button"
                        onClick={() => { setStudentMode('login'); setError(''); }}
                        style={{
                          flex: 1,
                          padding: '8px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          backgroundColor: studentMode === 'login' ? 'var(--primary-light)' : 'transparent',
                          color: studentMode === 'login' ? 'var(--primary)' : 'var(--muted)',
                          border: studentMode === 'login' ? '1px solid var(--accent)' : '1px solid transparent'
                        }}
                      >
                        Sign In as Applicant
                      </button>
                      <button
                        type="button"
                        onClick={() => { setStudentMode('register'); setError(''); }}
                        style={{
                          flex: 1,
                          padding: '8px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          backgroundColor: studentMode === 'register' ? 'var(--primary-light)' : 'transparent',
                          color: studentMode === 'register' ? 'var(--primary)' : 'var(--muted)',
                          border: studentMode === 'register' ? '1px solid var(--accent)' : '1px solid transparent'
                        }}
                      >
                        New Applicant Registration
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      backgroundColor: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      marginBottom: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.78rem',
                      color: '#334155'
                    }}>
                      <ShieldCheck size={18} color="var(--primary)" />
                      <span>
                        <strong>Authorized Staff Only:</strong> Scrutiny Committee, Faculty Verifiers, and Convener Registrar.
                      </span>
                    </div>
                  )}

                  {/* Header info */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--secondary)', marginBottom: '4px' }}>
                      {portalType === 'admin' 
                        ? 'Scrutiny Officer Sign In' 
                        : studentMode === 'login' 
                          ? 'Applicant Login' 
                          : 'Create Candidate Account'}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                      {portalType === 'admin'
                        ? 'Enter your institutional faculty email & security password.'
                        : studentMode === 'login'
                          ? 'Access your B.Tech 2027 application form & allotment status.'
                          : 'Register with your verified email to initiate your application.'}
                    </p>
                  </div>

                  {/* Error Alert */}
                  {error && (
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--destructive-light)',
                      border: '1px solid var(--destructive-border)',
                      color: 'var(--destructive)',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      marginBottom: '1.25rem'
                    }}>
                      <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleSubmit}>

                    {/* Full Name (Registration only) */}
                    {portalType === 'student' && studentMode === 'register' && (
                      <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                          Full Legal Name <span style={{ color: 'var(--destructive)' }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <User size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--muted)' }} />
                          <input
                            type="text"
                            required
                            placeholder="e.g. SOUVIK CHATTERJEE"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="form-input"
                            style={{ paddingLeft: '38px', fontSize: '0.85rem' }}
                          />
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                          As registered on Class 10/12 Board Admit Card
                        </span>
                      </div>
                    )}

                    {/* Email Input */}
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                        {portalType === 'admin' ? 'Institutional Email' : 'Candidate Email Address'} <span style={{ color: 'var(--destructive)' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--muted)' }} />
                        <input
                          type="email"
                          required
                          placeholder={portalType === 'admin' ? 'admin@iem.edu.in' : 'candidate@gmail.com'}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="form-input"
                          style={{ paddingLeft: '38px', fontSize: '0.85rem' }}
                        />
                      </div>
                    </div>

                    {/* Mobile Number (Registration only) */}
                    {portalType === 'student' && studentMode === 'register' && (
                      <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                          Mobile Number
                        </label>
                        <div style={{ position: 'relative' }}>
                          <Phone size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--muted)' }} />
                          <input
                            type="tel"
                            placeholder="9876543210"
                            maxLength={10}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            className="form-input"
                            style={{ paddingLeft: '38px', fontSize: '0.85rem' }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Password Input */}
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, margin: 0 }}>
                          Password <span style={{ color: 'var(--destructive)' }}>*</span>
                        </label>
                      </div>
                      <div style={{ position: 'relative' }}>
                        <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--muted)' }} />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          placeholder={studentMode === 'register' ? 'At least 6 characters' : '••••••••'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="form-input"
                          style={{ paddingLeft: '38px', paddingRight: '38px', fontSize: '0.85rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '2px' }}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className={portalType === 'admin' ? 'btn btn-secondary' : 'btn btn-primary'}
                      style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        borderRadius: '8px',
                        boxShadow: 'var(--shadow-md)'
                      }}
                    >
                      {loading ? (
                        <span>Authenticating with Firebase...</span>
                      ) : (
                        <>
                          <span>
                            {portalType === 'admin'
                              ? 'Enter Scrutiny Console'
                              : studentMode === 'login'
                                ? 'Sign In to Student Portal'
                                : 'Create Account & Begin'}
                          </span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </form>

                  {/* OR CONTINUE WITH GOOGLE Divider */}
                  <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0 1rem', color: 'var(--muted)' }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--card-border)' }} />
                    <span style={{ padding: '0 12px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                      or continue with google
                    </span>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--card-border)' }} />
                  </div>

                  {/* Google Sign-in Button */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '11px 16px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#1E293B',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.borderColor = '#94A3B8'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>
                      {portalType === 'admin'
                        ? 'Sign In with Google'
                        : studentMode === 'login'
                          ? 'Sign In with Google'
                          : 'Sign Up with Google'}
                    </span>
                  </button>

                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
