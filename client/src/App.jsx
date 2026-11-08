import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ApplicationProvider } from './context/ApplicationContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import NotificationToast from './components/common/NotificationToast';
import AuthPage from './components/auth/AuthPage';
import StudentPortal from './components/student/StudentPortal';
import AdminPortal from './components/admin/AdminPortal';

function MainApp() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            margin: '0 auto 16px',
            width: '40px',
            height: '40px',
            border: '3px solid #E2E8F0',
            borderTop: '3px solid var(--primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <p style={{ color: 'var(--muted)', fontWeight: 600, fontSize: '0.9rem' }}>
            Connecting to IEM Admissions System...
          </p>
        </div>
      </div>
    );
  }

  // 1. Unauthenticated Visitor -> Directly show Login / Sign-up Page
  if (!user) {
    return (
      <>
        <AuthPage />
        <NotificationToast />
      </>
    );
  }

  // 2. Admin Role -> Dedicated Admin Scrutiny Console
  if (role === 'admin' || user.role === 'admin') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--background)' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <AdminPortal />
        </main>
        <Footer />
        <NotificationToast />
      </div>
    );
  }

  // 3. Student Role -> Dedicated Applicant Dashboard
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <StudentPortal />
      </main>
      <Footer />
      <NotificationToast />
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('App Crash Caught by ErrorBoundary:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', padding: '2rem' }}>
          <div style={{ maxWidth: '560px', width: '100%', background: '#FFFFFF', padding: '2rem', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', textAlign: 'center', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>Application Notice</h2>
            <p style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              {this.state.error?.message || 'An unexpected rendering error occurred. Your session data is intact.'}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button 
                onClick={() => { localStorage.clear(); window.location.reload(); }}
                className="btn btn-outline btn-sm"
              >
                Clear Cache & Reload
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="btn btn-primary btn-sm"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ApplicationProvider>
          <MainApp />
        </ApplicationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

