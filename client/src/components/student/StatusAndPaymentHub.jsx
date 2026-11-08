import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { useApplication } from '../../context/ApplicationContext';
import { paymentApi } from '../../services/api';
import { initiateRazorpayPayment } from '../../services/razorpay';
import StatusBadge from '../common/StatusBadge';
import RazorpaySimulatorModal from './RazorpaySimulatorModal';
import AdmissionLetterModal from './AdmissionLetterModal';
import { 
  CreditCard, 
  Award, 
  AlertTriangle, 
  Send, 
  UploadCloud, 
  CheckCircle, 
  Clock, 
  ArrowRight, 
  FileText, 
  Calendar, 
  User, 
  Printer,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const StatusAndPaymentHub = ({ onEditDraft }) => {
  const { user } = useAuth();
  const { application, setApplication, resolveQuery, showNotification, refreshStudentApplication } = useApplication();

  const [queryResponseText, setQueryResponseText] = useState('');
  const [reuploadedDocUrl, setReuploadedDocUrl] = useState('');
  const [reuploading, setReuploading] = useState(false);
  const [submittingQuery, setSubmittingQuery] = useState(false);

  // Payment states
  const [paying, setPaying] = useState(false);
  const [simModalOpen, setSimModalOpen] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);

  // Admission Letter Modal
  const [letterModalOpen, setLetterModalOpen] = useState(false);

  if (!application) {
    return (
      <div className="container" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)' }}>No application submitted yet.</p>
        <button onClick={onEditDraft} className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Start Application Form
        </button>
      </div>
    );
  }

  const status = application.status;
  const isActionRequired = status === 'ACTION_REQUIRED';
  const isSeatOffered = status === 'SEAT_OFFERED';
  const isConfirmed = status === 'ADMISSION_CONFIRMED';

  // Lifecycle steps
  const lifecycleSteps = [
    { key: 'SUBMITTED', label: 'Application Submitted' },
    { key: 'UNDER_REVIEW', label: 'Committee Scrutiny' },
    { key: 'VERIFIED_ELIGIBLE', label: 'Verified & Merit Listed' },
    { key: 'SEAT_OFFERED', label: 'Provisional Seat Offered' },
    { key: 'ADMISSION_CONFIRMED', label: 'Fee Settled & Enrolled' }
  ];

  const getStepStatus = (stepKey) => {
    const order = ['SUBMITTED', 'UNDER_REVIEW', 'ACTION_REQUIRED', 'VERIFIED_ELIGIBLE', 'SEAT_OFFERED', 'ADMISSION_CONFIRMED'];
    const currentIdx = order.indexOf(status);
    const stepIdx = order.indexOf(stepKey);

    if (status === 'ACTION_REQUIRED' && stepKey === 'UNDER_REVIEW') return 'warning';
    if (currentIdx > stepIdx || (status === 'ADMISSION_CONFIRMED')) return 'completed';
    if (currentIdx === stepIdx) return 'active';
    return 'pending';
  };

  // Handle Query Resolution
  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    if (!queryResponseText.trim()) {
      showNotification('Please provide a clarification explanation.', 'error');
      return;
    }
    setSubmittingQuery(true);
    try {
      const activeQuery = application.queries?.[0];
      await resolveQuery({
        applicationId: application.id,
        queryId: activeQuery?.id,
        responseText: queryResponseText,
        reuploadedDocumentUrl: reuploadedDocUrl || 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800&q=80',
        documentField: 'marksheet12'
      });
      setQueryResponseText('');
      setReuploadedDocUrl('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingQuery(false);
    }
  };

  // Handle Razorpay Payment flow
  const handlePayFee = async () => {
    setPaying(true);
    try {
      const orderRes = await paymentApi.createOrder(application.id);
      if (orderRes.data.success) {
        const orderData = orderRes.data.order;
        setPendingOrder(orderData);

        const result = await initiateRazorpayPayment({
          order: orderData,
          keyId: orderRes.data.keyId,
          user: application.personal,
          onPaymentSuccess: handlePaymentSuccess,
          onPaymentDismiss: () => setPaying(false)
        });

        if (result.mode === 'simulation') {
          setSimModalOpen(true);
        }
      }
    } catch (err) {
      showNotification('Failed to initialize payment gateway: ' + err.message, 'error');
    } finally {
      setPaying(false);
    }
  };

  const handlePaymentSuccess = async (paymentData) => {
    try {
      const res = await paymentApi.verifySignature({
        applicationId: application.id,
        ...paymentData
      });

      if (res.data.success) {
        setApplication(res.data.application);
        showNotification('🎉 Payment settled! Admission formally confirmed.', 'success');
        
        // Trigger celebratory confetti
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });

        // Open admission letter certificate
        setTimeout(() => {
          setLetterModalOpen(true);
        }, 800);
      }
    } catch (err) {
      showNotification('Payment verification error: ' + err.message, 'error');
    }
  };

  return (
    <div className="container" style={{ maxWidth: '1080px', padding: '2rem 1.5rem 5rem' }}>
      
      {/* 1. Header Banner */}
      <div className="card card-elevated" style={{ padding: '1.75rem 2rem', marginBottom: '1.75rem', borderLeft: '4px solid var(--primary)', background: '#FFFFFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-light)', padding: '2px 8px', borderRadius: '4px' }}>
                {application.id}
              </span>
              <StatusBadge status={application.status} />
            </div>
            <h1 className="heading-2">
              {application.personal?.fullName || 'Candidate Portal'}
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              12th PCM: <strong>{application.academic?.pcmPercentage || '92.6'}%</strong> • {application.academic?.examType || 'WBJEE'} Rank: <strong>{application.academic?.examRank || '2140'}</strong>
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            {application.allottedBranch ? (
              <div style={{ background: '#EFF6FF', padding: '10px 16px', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                <div style={{ fontSize: '0.725rem', color: '#1E3A8A', fontWeight: 600, textTransform: 'uppercase' }}>Allotted Branch</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E3A8A' }}>
                  {application.allottedBranch}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                Target Preferences: <strong>{application.preferences?.join(', ')}</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Visual 8-Stage Progress Stepper */}
      <div className="card" style={{ padding: '1.75rem 2rem', marginBottom: '1.75rem' }}>
        <h3 className="heading-3" style={{ fontSize: '0.95rem', marginBottom: '1.25rem', color: 'var(--secondary)' }}>
          Admission Lifecycle Milestones
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
          {lifecycleSteps.map((s, idx) => {
            const stepStatus = getStepStatus(s.key);
            const isCompleted = stepStatus === 'completed';
            const isActive = stepStatus === 'active';
            const isWarning = stepStatus === 'warning';

            let bgColor = '#F1F5F9';
            let textColor = '#64748B';
            let borderColor = '#E2E8F0';

            if (isCompleted) {
              bgColor = '#ECFDF5';
              textColor = '#047857';
              borderColor = '#A7F3D0';
            } else if (isActive) {
              bgColor = '#EFF6FF';
              textColor = '#1D4ED8';
              borderColor = '#BFDBFE';
            } else if (isWarning) {
              bgColor = '#FEF2F2';
              textColor = '#DC2626';
              borderColor = '#FECACA';
            }

            return (
              <div 
                key={s.key} 
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: bgColor,
                  border: `1px solid ${borderColor}`,
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: textColor, textTransform: 'uppercase', marginBottom: '2px' }}>
                  0{idx + 1}
                </div>
                <div style={{ fontSize: '0.775rem', fontWeight: 600, color: textColor, lineHeight: 1.25 }}>
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Discrepancy Query Box (FR-17) */}
      {isActionRequired && (
        <div className="card" style={{ padding: '1.75rem', marginBottom: '1.75rem', backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
            <AlertTriangle size={24} color="var(--destructive)" />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--destructive)' }}>
                Action Required: Scrutiny Discrepancy Query (FR-17)
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#991B1B' }}>
                The Admission Scrutiny Committee has flagged an issue with your submitted documents. Please reply and re-upload the requested file below.
              </p>
            </div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '8px', border: '1px solid #FCA5A5', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
              <span>Officer Note: <strong>{application.queries?.[0]?.officer || 'Scrutiny Officer'}</strong></span>
              <span className="badge badge-action-required">PENDING RESPONSE</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#1E293B', fontStyle: 'italic', lineHeight: 1.5 }}>
              "{application.queries?.[0]?.message || 'Uploaded marksheet is blurry. Please provide clear scanned copy.'}"
            </p>
          </div>

          <form onSubmit={handleQuerySubmit}>
            <div className="form-group">
              <label className="form-label" style={{ color: '#991B1B' }}>Your Explanation / Clarification Note *</label>
              <textarea
                rows={2}
                required
                value={queryResponseText}
                onChange={e => setQueryResponseText(e.target.value)}
                placeholder="Explain the correction or clarify the discrepancy for the scrutiny officer..."
                className="form-textarea"
                style={{ borderColor: '#FCA5A5' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', borderColor: '#FCA5A5' }}>
                <UploadCloud size={16} /> Re-upload Clear Scanned Document
                <input 
                  type="file" 
                  accept="image/*,application/pdf"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setReuploadedDocUrl('https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800&q=80');
                      showNotification(`Selected ${f.name} for re-upload`, 'success');
                    }
                  }} 
                  style={{ display: 'none' }} 
                />
              </label>

              <button
                type="submit"
                disabled={submittingQuery}
                className="btn btn-destructive"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Send size={15} />
                <span>{submittingQuery ? 'Submitting Clarification...' : 'Submit Clarification & Return to Scrutiny'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Razorpay Fee Payment Hub (Active when SEAT_OFFERED) */}
      {isSeatOffered && (
        <div className="card card-elevated" style={{ padding: '2rem', marginBottom: '1.75rem', border: '1px solid #DDD6FE', background: 'linear-gradient(180deg, #FAF5FF 0%, #FFFFFF 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#EDE9FE', color: '#6D28D9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={24} />
            </div>
            <div>
              <h3 className="heading-3" style={{ color: '#5B21B6' }}>
                Provisional Seat Offered: Settle Semester Fee Online
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                Your academic credentials have been verified. Pay the admission settlement fee to secure your allotted seat.
              </p>
            </div>
          </div>

          <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid var(--card-border)', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.75rem' }}>
              Itemized Fee Breakdown (1st Semester)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>1. Semester 1 Tuition Fee:</span>
                <span className="font-mono">₹65,000.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>2. Laboratory, Library & Computing Amenities:</span>
                <span className="font-mono">₹12,000.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>3. Institutional Caution Deposit (One-time, Refundable):</span>
                <span className="font-mono">₹8,000.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.05rem', color: 'var(--secondary)', borderTop: '1px solid var(--card-border)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                <span>Total Amount Payable:</span>
                <span style={{ color: 'var(--primary)' }}>₹85,000.00</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
              🔒 Protected by 256-bit Razorpay PCI-DSS Level 1 Encrypted Payment Gateway
            </div>

            <button
              onClick={handlePayFee}
              disabled={paying}
              className="btn btn-primary btn-lg"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#6D28D9' }}
            >
              <CreditCard size={18} />
              <span>{paying ? 'Connecting Gateway...' : 'Pay ₹85,000 via Razorpay'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 5. Admission Confirmed Certificate Banner */}
      {isConfirmed && (
        <div className="card card-elevated" style={{ padding: '2rem', marginBottom: '1.75rem', background: 'linear-gradient(180deg, #ECFDF5 0%, #FFFFFF 100%)', border: '1px solid #A7F3D0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#D1FAE5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={28} />
              </div>
              <div>
                <span className="badge badge-admission-confirmed" style={{ marginBottom: '4px' }}>
                  ADMISSION FORMALLY CONFIRMED
                </span>
                <h3 className="heading-3" style={{ color: '#065F46' }}>
                  Welcome to IEM! Your Seat is Enrolled
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#047857' }}>
                  Student ID: <strong className="font-mono">{application.studentId || 'IEM-BTECH-2026-042'}</strong> | Transaction: <span className="font-mono">{application.payment?.paymentId || 'pay_rzp_iem_88194012'}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setLetterModalOpen(true)}
              className="btn btn-success btn-lg"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Printer size={18} />
              <span>View & Print Admission Letter</span>
            </button>
          </div>
        </div>
      )}

      {/* 6. Application Details Summary & Audit Log */}
      <div className="grid grid-cols-2 md-col-1 gap-6">
        
        {/* Profile Card */}
        <div className="card">
          <h3 className="heading-3" style={{ fontSize: '0.95rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} color="var(--primary)" />
            <span>Applicant Records & Marksheet</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.825rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Full Name:</span>
              <strong>{application.personal?.fullName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Email / Phone:</span>
              <span>{application.personal?.email} | {application.personal?.phone}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">10th Board:</span>
              <span>{application.academic?.board10} ({application.academic?.percent10}%)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">12th PCM Marks:</span>
              <span>P:{application.academic?.physicsMarks} C:{application.academic?.chemistryMarks} M:{application.academic?.mathMarks} ({application.academic?.pcmPercentage}%)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Entrance Exam:</span>
              <span>{application.academic?.examType} (Rank: {application.academic?.examRank})</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Preferences:</span>
              <span>{application.preferences?.join(' ➔ ')}</span>
            </div>
          </div>
        </div>

        {/* Audit Log Timeline */}
        <div className="card">
          <h3 className="heading-3" style={{ fontSize: '0.95rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} color="var(--primary)" />
            <span>Audit History & Verification Events</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '240px', overflowY: 'auto' }}>
            {application.history?.map((h, idx) => (
              <div key={idx} style={{ padding: '8px 10px', borderRadius: '6px', background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '0.78rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--secondary)' }}>{h.event}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', marginTop: '2px', fontSize: '0.7rem' }}>
                  <span>Actor: {h.actor}</span>
                  <span>{new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Razorpay Simulator Modal */}
      <RazorpaySimulatorModal
        isOpen={simModalOpen}
        onClose={() => setSimModalOpen(false)}
        order={pendingOrder}
        user={application.personal}
        onSuccess={handlePaymentSuccess}
      />

      {/* Provisional Admission Letter Modal */}
      <AdmissionLetterModal
        isOpen={letterModalOpen}
        onClose={() => setLetterModalOpen(false)}
        application={application}
      />

    </div>
  );
};

export default StatusAndPaymentHub;
