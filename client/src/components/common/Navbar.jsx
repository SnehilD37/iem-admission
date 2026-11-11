import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LogOut,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';


export const Navbar = () => {
  const { user, role, canAccessAdmin, switchRole, logout } = useAuth();

  const isAdmin = canAccessAdmin && role === 'admin';

  return (
    <>
      {/* Main Navigation Bar */}
      <header className="glass-panel" style={{ position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid var(--card-border)', backgroundColor: '#FFFFFF' }}>
        <div className="container flex items-center justify-between" style={{ minHeight: '84px', padding: '8px 1.5rem' }}>
          
          {/* Brand Logo & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img 
              src="/logo.png" 
              alt="IEM Logo" 
              style={{ 
                height: '76px', 
                width: 'auto', 
                objectFit: 'contain', 
                display: 'block' 
              }} 
            />

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--secondary)', letterSpacing: '-0.02em' }}>
                  IEM
                </span>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: isAdmin ? 'var(--secondary)' : 'var(--primary-light)',
                  color: isAdmin ? '#FFFFFF' : 'var(--primary)'
                }}>
                  {isAdmin ? '🛡️ SCRUTINY DESK' : '🎓 APPLICANT PORTAL'}
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 500, marginTop: '2px' }}>
                {isAdmin 
                  ? 'Faculty Scrutiny Committee & Registrar Seat Allocation' 
                  : 'Institute of Engineering & Management • B.Tech Admissions 2027'}
              </p>
            </div>
          </div>

          {/* Right Action: Portal Switch (Admins only), User identity & Logout */}
          <div className="flex items-center gap-3">
            {canAccessAdmin && (
              <button
                onClick={() => switchRole(isAdmin ? 'student' : 'admin')}
                className="btn btn-outline btn-sm"
                title={isAdmin ? 'Switch to Student Portal' : 'Switch to Admin Scrutiny Desk'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  borderColor: isAdmin ? 'var(--accent)' : 'var(--secondary)',
                  color: isAdmin ? 'var(--primary)' : 'var(--secondary)'
                }}
              >
                {isAdmin ? <GraduationCap size={15} /> : <ShieldCheck size={15} />}
                <span>{isAdmin ? 'Student Portal' : 'Admin Portal'}</span>
              </button>
            )}

            {/* User Profile Pill */}
            {user && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px',
                borderRadius: '8px',
                backgroundColor: 'var(--muted-bg)',
                border: '1px solid var(--card-border)'
              }}>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: isAdmin ? 'var(--secondary)' : 'var(--primary)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}>
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div className="hidden-mobile" style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--secondary)', lineHeight: 1.2 }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--muted)', lineHeight: 1 }}>
                    {user.email}
                  </div>
                </div>
              </div>
            )}

            {/* Logout Button */}
            <button 
              onClick={logout} 
              className="btn btn-outline btn-sm"
              title="Sign Out to Login Page"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--destructive)',
                borderColor: 'var(--destructive-border)'
              }}
            >
              <LogOut size={15} />
              <span className="hidden-mobile" style={{ fontWeight: 600 }}>Sign Out</span>
            </button>
          </div>

        </div>
      </header>
    </>
  );
};

export default Navbar;

