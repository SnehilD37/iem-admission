import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle, 
  Calculator, 
  Award, 
  BookOpen, 
  Calendar, 
  FileText, 
  CreditCard, 
  GraduationCap, 
  ChevronRight,
  TrendingUp,
  Cpu,
  Brain,
  Network,
  Briefcase,
  Radio
} from 'lucide-react';
import { meritApi } from '../../services/api';

export const LandingPage = ({ onApplyClick, onTrackClick }) => {
  // Eligibility Checker State
  const [physics, setPhysics] = useState(88);
  const [chemistry, setChemistry] = useState(84);
  const [math, setMath] = useState(90);
  const [examType, setExamType] = useState('WBJEE');
  const [examRank, setExamRank] = useState(3150);
  const [checking, setChecking] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState(null);

  const calculateLivePcm = () => {
    const p = parseFloat(physics) || 0;
    const c = parseFloat(chemistry) || 0;
    const m = parseFloat(math) || 0;
    if (!p || !c || !m) return 0;
    return ((p + c + m) / 3).toFixed(2);
  };

  const handleCheckEligibility = async (e) => {
    e?.preventDefault();
    setChecking(true);
    try {
      const res = await meritApi.checkEligibility({
        physics,
        chemistry,
        math,
        examType,
        examRank
      });
      if (res.data.success) {
        setEligibilityResult(res.data);
      }
    } catch (err) {
      console.error('Error evaluating eligibility:', err);
    } finally {
      setChecking(false);
    }
  };

  const programs = [
    {
      code: 'CSE',
      name: 'Computer Science & Engineering',
      icon: Cpu,
      seats: 120,
      cutoffWBJEE: '< 3,200',
      cutoffJEE: '< 24,000',
      highlights: ['Algorithms & Data Structures', 'Cloud Systems & DevOps', 'Distributed Computing'],
      tag: 'Highest Demand'
    },
    {
      code: 'CSE-AIML',
      name: 'CSE (Artificial Intelligence & ML)',
      icon: Brain,
      seats: 60,
      cutoffWBJEE: '< 4,500',
      cutoffJEE: '< 31,000',
      highlights: ['Deep Neural Networks', 'Computer Vision & NLP', 'Generative AI & LLMs'],
      tag: 'Industry 4.0'
    },
    {
      code: 'IT',
      name: 'Information Technology',
      icon: Network,
      seats: 60,
      cutoffWBJEE: '< 5,800',
      cutoffJEE: '< 42,000',
      highlights: ['Full-Stack Web Architectures', 'Cybersecurity & Cryptography', 'Database Systems'],
      tag: 'Top Placement'
    },
    {
      code: 'CSBS',
      name: 'Computer Science & Business Systems',
      icon: Briefcase,
      seats: 60,
      cutoffWBJEE: '< 7,200',
      cutoffJEE: '< 53,000',
      highlights: ['Designed with TCS', 'Financial Analytics', 'Enterprise Systems & ERP'],
      tag: 'TCS Industry Co-Design'
    },
    {
      code: 'ECE',
      name: 'Electronics & Communication Engg.',
      icon: Radio,
      seats: 90,
      cutoffWBJEE: '< 8,500',
      cutoffJEE: '< 62,000',
      highlights: ['VLSI & Embedded Systems', '5G / 6G Wireless Tech', 'IoT & Robotics'],
      tag: 'Core & Semi-Conductor'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4.5rem', paddingBottom: '4rem' }}>
      
      {/* =========================================================================
          HERO SECTION (VOLTWAY INSPIRED)
         ========================================================================= */}
      <section style={{ paddingTop: '3.5rem', position: 'relative' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '880px' }}>
          
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '9999px', backgroundColor: 'var(--primary-light)', border: '1px solid #BFDBFE', color: 'var(--primary)', fontSize: '0.825rem', fontWeight: 600, marginBottom: '1.5rem' }}>
            <Sparkles size={15} />
            <span>• 2027–2028 B.Tech Admissions Open</span>
          </div>

          {/* Display Headline */}
          <h1 className="display-1" style={{ marginBottom: '1.25rem' }}>
            Shape Your Engineering Future at <span style={{ color: 'var(--primary)' }}>IEM</span>
          </h1>

          {/* Subtitle */}
          <p style={{ fontSize: '1.125rem', lineHeight: 1.6, color: 'var(--muted)', marginBottom: '2.25rem', maxWidth: '720px', marginInline: 'auto' }}>
            Next-generation automated admission pipeline. Real-time eligibility computation, split-screen document scrutiny, online fee settlement via Razorpay, and instant verifiable Student IDs.
          </p>

          {/* Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '3.5rem' }}>
            <button 
              onClick={onApplyClick}
              className="btn btn-primary btn-lg" 
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span>Apply Online for 2027</span>
              <ArrowRight size={18} />
            </button>

            <button 
              onClick={onTrackClick}
              className="btn btn-outline btn-lg"
            >
              Track Application Status
            </button>
          </div>

          {/* 4-METRIC RIBBON (Voltway Inspired) */}
          <div className="metric-ribbon">
            <div className="metric-item">
              <div className="metric-value">5+</div>
              <div className="metric-label">Premier B.Tech Specializations</div>
            </div>
            <div className="metric-item">
              <div className="metric-value">100%</div>
              <div className="metric-label">Placement Assistance Record</div>
            </div>
            <div className="metric-item">
              <div className="metric-value">15,000+</div>
              <div className="metric-label">Distinguished Global Alumni</div>
            </div>
            <div className="metric-item">
              <div className="metric-value" style={{ color: 'var(--accent)' }}>₹72 LPA</div>
              <div className="metric-label">Highest Package Offered</div>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          INTERACTIVE ELIGIBILITY CHECKER WIDGET
         ========================================================================= */}
      <section className="container">
        <div className="card card-elevated" style={{ padding: '2.5rem', border: '1px solid #CBD5E1', background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calculator size={22} />
            </div>
            <div>
              <h2 className="heading-2">Interactive B.Tech Eligibility & Cutoff Evaluator</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                Calculate your Class 12 PCM aggregate % and cross-reference your WBJEE / JEE Main rank against real-time departmental cutoffs.
              </p>
            </div>
          </div>

          <form onSubmit={handleCheckEligibility}>
            <div className="grid grid-cols-4 md-col-1 gap-4" style={{ marginBottom: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Physics Marks (100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={physics}
                  onChange={e => setPhysics(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Chemistry Marks (100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={chemistry}
                  onChange={e => setChemistry(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Mathematics Marks (100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={math}
                  onChange={e => setMath(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Calculated PCM %</label>
                <div style={{ height: '42px', display: 'flex', alignItems: 'center', padding: '0 12px', background: 'var(--primary-light)', borderRadius: 'var(--radius)', border: '1px solid #BFDBFE', fontWeight: 700, color: 'var(--primary)' }}>
                  {calculateLivePcm()}%
                  {parseFloat(calculateLivePcm()) >= 60 ? (
                    <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--success)', fontWeight: 600 }}>✓ PCM ≥ 60%</span>
                  ) : (
                    <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--destructive)', fontWeight: 600 }}>✕ Below 60%</span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 md-col-1 gap-4" style={{ alignItems: 'flex-end', marginBottom: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Entrance Examination</label>
                <select 
                  value={examType} 
                  onChange={e => setExamType(e.target.value)}
                  className="form-select"
                >
                  <option value="WBJEE">WBJEE 2027 (General Merit Rank)</option>
                  <option value="JEE Main">JEE Main 2027 (All India CRL)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Your Entrance Exam Rank</label>
                <input
                  type="number"
                  min="1"
                  max="200000"
                  value={examRank}
                  onChange={e => setExamRank(e.target.value)}
                  className="form-input"
                  placeholder="e.g. 2140"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={checking}
                className="btn btn-primary"
                style={{ height: '42px', width: '100%' }}
              >
                {checking ? 'Evaluating Criteria...' : 'Evaluate Cutoff Verdict'}
              </button>
            </div>
          </form>

          {/* Results Output */}
          {eligibilityResult && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--card-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {eligibilityResult.isOverallEligible ? (
                    <CheckCircle size={22} color="var(--success)" />
                  ) : (
                    <AlertCircle size={22} color="var(--warning)" />
                  )}
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--secondary)' }}>
                    {eligibilityResult.isOverallEligible 
                      ? 'Congratulations! You qualify for admission in the following branch(es):'
                      : 'Cutoff analysis indicates limited eligibility based on current rank:'}
                  </span>
                </div>

                <button 
                  onClick={onApplyClick}
                  className="btn btn-sm btn-primary"
                >
                  Proceed to Form Fill <ArrowRight size={14} />
                </button>
              </div>

              <div className="grid grid-cols-2 md-col-1 gap-3">
                {eligibilityResult.eligibleDepartments?.map((d) => (
                  <div key={d.branch} style={{ padding: '12px 14px', borderRadius: '8px', background: 'var(--success-light)', border: '1px solid var(--success-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: '0.9rem' }}>
                        ✓ {d.name} ({d.branch})
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#047857' }}>
                        Cutoff Rank: {d.cutoff} | Your Rank: {d.candidateRank}
                      </div>
                    </div>
                    <span className="badge badge-verified-eligible">ELIGIBLE</span>
                  </div>
                ))}

                {eligibilityResult.ineligibleDepartments?.map((d) => (
                  <div key={d.branch} style={{ padding: '12px 14px', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.85 }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--muted)', fontSize: '0.85rem' }}>
                        ✕ {d.name} ({d.branch})
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                        {d.reason}
                      </div>
                    </div>
                    <span className="badge badge-draft">ROUND 2 WAITLIST</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          PROGRAMS SHOWCASE
         ========================================================================= */}
      <section className="container">
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 className="heading-2" style={{ marginBottom: '0.5rem' }}>
            Undergraduate Engineering Specializations (B.Tech)
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>
            Four-year degree curriculum strictly aligned with AICTE, MAKAUT, and modern industry paradigms.
          </p>
        </div>

        <div className="grid grid-cols-3 md-col-1 gap-6">
          {programs.map((prog) => {
            const Icon = prog.icon;
            return (
              <div key={prog.code} className="card card-elevated" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={22} />
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: 'var(--muted-bg)', color: 'var(--secondary)' }}>
                    {prog.tag}
                  </span>
                </div>

                <h3 className="heading-3" style={{ marginBottom: '0.35rem' }}>
                  {prog.name}
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '1rem' }}>
                  Intake: <strong>{prog.seats} Seats</strong> | Code: <span className="font-mono">{prog.code}</span>
                </div>

                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '10px', marginBottom: '1.25rem', border: '1px solid #E2E8F0', fontSize: '0.78rem' }}>
                  <div style={{ color: 'var(--muted)', marginBottom: '4px' }}>Expected Closing Ranks:</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                    <span>WBJEE: {prog.cutoffWBJEE}</span>
                    <span>JEE: {prog.cutoffJEE}</span>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem', flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    Curriculum Pillars:
                  </div>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', color: '#334155' }}>
                    {prog.highlights.map((h, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent)' }}></div>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button 
                  onClick={onApplyClick}
                  className="btn btn-outline"
                  style={{ width: '100%', fontSize: '0.8rem' }}
                >
                  Select as Choice <ChevronRight size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          ADMISSION PROCEDURES & SCHEDULE
         ========================================================================= */}
      <section className="container">
        <div className="card" style={{ padding: '2.5rem', background: '#0F172A', color: '#FFFFFF', border: 'none' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.5rem' }}>
              Formal 4-Step Digital Admission Pipeline
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem' }}>
              Transparent, automated, and tamper-proof workflow designed by DevForge for IEM.
            </p>
          </div>

          <div className="grid grid-cols-4 md-col-1 gap-6">
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3B82F6', marginBottom: '0.5rem' }}>01</div>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#FFFFFF' }}>Online Wizard</h4>
              <p style={{ fontSize: '0.8rem', color: '#94A3B8', lineHeight: 1.5 }}>
                Fill demographic, Class 10/12 marks, rank card, and stream preferences with auto-saving drafts.
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3B82F6', marginBottom: '0.5rem' }}>02</div>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#FFFFFF' }}>Split Scrutiny</h4>
              <p style={{ fontSize: '0.8rem', color: '#94A3B8', lineHeight: 1.5 }}>
                Admission committee verifies marksheet & certificates with interactive discrepancy resolution (FR-17).
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3B82F6', marginBottom: '0.5rem' }}>03</div>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#FFFFFF' }}>Seat Offer</h4>
              <p style={{ fontSize: '0.8rem', color: '#94A3B8', lineHeight: 1.5 }}>
                Automated merit index calculation cross-referenced against real-time departmental seat quotas.
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10B981', marginBottom: '0.5rem' }}>04</div>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#FFFFFF' }}>Fee & Enrolled</h4>
              <p style={{ fontSize: '0.8rem', color: '#94A3B8', lineHeight: 1.5 }}>
                Online payment via Razorpay, formal printable Admission Slip, and verified Student ID generation.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
