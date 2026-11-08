import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApplication } from '../../context/ApplicationContext';
import { 
  GraduationCap, 
  ShieldCheck, 
  ChevronDown, 
  UserCheck, 
  LogOut, 
  RotateCcw,
  Sparkles,
  PhoneCall,
  Bell,
  Activity
} from 'lucide-react';
import DiagnosticsModal from './DiagnosticsModal';


export const Navbar = () => {
  const { user, role, loginAsDemo, demoUsers, logout } = useAuth();
  const { resetAllDemoData } = useApplication();
  const [demoDropdownOpen, setDemoDropdownOpen] = useState(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);

  const isAdmin = role === 'admin' || user?.role === 'admin';

  const handleSelectDemo = async (uid) => {
    setDemoDropdownOpen(false);
    await loginAsDemo(uid);
  };

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

          {/* Right Action: User identity & Logout */}
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button 
                onClick={resetAllDemoData}
                title="Reset candidates to initial seed state"
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.75rem', padding: '5px 9px', display: 'flex', alignItems: 'center', gap: '4px', color: '#64748B' }}
              >
                <RotateCcw size={12} />
                <span>Reset Demo Store</span>
              </button>
            )}

            {/* Codebase Diagnostics & Error Locator Button */}
            <button
              onClick={() => setDiagnosticsOpen(true)}
              title="Open Codebase Diagnostics & Error Locator"
              className="btn btn-outline btn-sm"
              style={{
                fontSize: '0.75rem',
                padding: '5px 9px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                color: '#2563EB',
                borderColor: '#BFDBFE',
                backgroundColor: '#EFF6FF'
              }}
            >
              <Activity size={13} />
              <span>Diagnostics</span>
            </button>
            {/* Quick Demo Switcher (Helpful for test reviews) */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setDemoDropdownOpen(!demoDropdownOpen)}
                className="btn btn-outline btn-sm"
                style={{ borderColor: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Switch test profiles"
              >
                <Sparkles size={14} color="#D97706" />
                <span style={{ fontWeight: 600, fontSize: '0.78rem' }}>
                  {user ? `${user.name.split(' ')[0]} (${isAdmin ? 'Admin' : 'Student'})` : 'Test Profiles'}
                </span>
                <ChevronDown size={14} />
              </button>

              {demoDropdownOpen && (
                <div 
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '110%',
                    width: '280px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-xl)',
                    border: '1px solid var(--card-border)',
                    padding: '8px',
                    zIndex: 200
                  }}
                >
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', padding: '6px 8px' }}>
                    Quick Test Account Switcher:
                  </div>

                  {demoUsers.map((u) => (
                    <button
                      key={u.uid}
                      onClick={() => handleSelectDemo(u.uid)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: user?.uid === u.uid ? 'var(--primary-light)' : 'transparent',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                      className="btn-ghost"
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--secondary)' }}>{u.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                          {u.role === 'admin' ? '🛡️ Scrutiny Convener' : `Applicant (${u.applicationId || 'New'})`}
                        </div>
                      </div>
                      {user?.uid === u.uid && <UserCheck size={16} color="var(--primary)" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

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

      {/* Codebase Diagnostics & Issue Locator Modal */}
      <DiagnosticsModal 
        isOpen={diagnosticsOpen} 
        onClose={() => setDiagnosticsOpen(false)} 
      />
    </>
  );
};

export default Navbar;

