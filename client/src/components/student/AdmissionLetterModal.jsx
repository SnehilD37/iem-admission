import React from 'react';
import { X, Printer, Download, Award, CheckCircle, ShieldCheck } from 'lucide-react';

export const AdmissionLetterModal = ({ isOpen, onClose, application }) => {
  if (!isOpen || !application) return null;

  const handlePrint = () => {
    window.print();
  };

  const studentName = application.personal?.fullName || 'Candidate';
  const studentId = application.studentId || 'IEM-BTECH-2026-042';
  const branch = application.allottedBranch || 'Computer Science & Engineering';
  const rollNo = application.academic?.examRoll || 'WBJEE-2026-88192';
  const rank = application.academic?.examRank || 2140;
  const paymentId = application.payment?.paymentId || 'pay_rzp_iem_88194012';
  const receiptNo = application.payment?.receiptNumber || 'IEM/FEE/2026/0842';
  const paymentDate = application.payment?.timestamp 
    ? new Date(application.payment.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '19 August 2026';

  return (
    <div className="modal-backdrop no-print" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '820px', padding: '0', background: '#F8FAFC' }}
      >
        {/* Top Control Bar */}
        <div className="no-print" style={{ padding: '1rem 1.5rem', background: '#FFFFFF', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={20} color="var(--primary)" />
            <span style={{ fontWeight: 700, color: 'var(--secondary)', fontSize: '0.95rem' }}>
              Official Provisional Admission Certificate (2027–28)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={handlePrint} className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Printer size={15} /> Print / Save as PDF
            </button>
            <button onClick={onClose} className="btn-ghost" style={{ padding: '4px', borderRadius: '50%' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Formal Printable Document Sheet */}
        <div 
          className="admission-letter-sheet"
          style={{
            margin: '1.5rem auto',
            maxWidth: '720px',
            backgroundColor: '#FFFFFF',
            padding: '3rem 3.5rem',
            borderRadius: '4px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
            border: '1px solid #E2E8F0',
            position: 'relative',
            color: '#0F172A'
          }}
        >
          {/* Watermark / Digital Seal */}
          <div style={{ position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%) rotate(-30deg)', opacity: 0.04, pointerEvents: 'none', fontSize: '5rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--primary)' }}>
            IEM VERIFIED
          </div>

          {/* Letterhead */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #1E3A8A', paddingBottom: '1.25rem', marginBottom: '2rem' }}>
            <img src="/logo.png" alt="IEM" style={{ height: '56px', width: 'auto', objectFit: 'contain', margin: '0 auto 8px', display: 'block' }} />
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1E3A8A', letterSpacing: '-0.01em' }}>
              INSTITUTE OF ENGINEERING & MANAGEMENT (IEM)
            </div>
            <div style={{ fontSize: '0.825rem', color: '#475569', fontWeight: 500, marginTop: '2px' }}>
              Sector V, Salt Lake Electronics Complex, Kolkata, West Bengal — 700091
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
              Autonomous Institute Affiliated to MAKAUT | NAAC Grade 'A' | Approved by AICTE, New Delhi
            </div>
            <div style={{ marginTop: '0.75rem', display: 'inline-block', padding: '3px 12px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#1E3A8A', letterSpacing: '0.04em' }}>
              OFFICE OF THE REGISTRAR & CENTRAL ADMISSION COMMITTEE
            </div>
          </div>

          {/* Reference & Date */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#475569', marginBottom: '1.5rem' }}>
            <div>
              <strong>Ref. No:</strong> IEM/ADM/BTECH/2027/{studentId.split('-').pop()}
            </div>
            <div>
              <strong>Date of Issue:</strong> {paymentDate}
            </div>
          </div>

          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, textDecoration: 'underline', color: '#0F172A' }}>
              PROVISIONAL ADMISSION LETTER & ENROLLMENT RECEIPT
            </h2>
            <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600, marginTop: '4px' }}>
              Academic Session: 2027–2031 (Four-Year B.Tech Degree)
            </div>
          </div>

          {/* Candidate Profile Details Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.75rem', fontSize: '0.825rem' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <td style={{ padding: '8px 10px', width: '30%', color: '#64748B', fontWeight: 600 }}>Candidate Name:</td>
                <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0F172A' }}>{studentName}</td>
                <td style={{ padding: '8px 10px', width: '20%', color: '#64748B', fontWeight: 600 }}>Permanent Student ID:</td>
                <td style={{ padding: '8px 10px', fontWeight: 800, color: '#1E3A8A', fontFamily: 'monospace' }}>{studentId}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <td style={{ padding: '8px 10px', color: '#64748B', fontWeight: 600 }}>Allotted Department:</td>
                <td style={{ padding: '8px 10px', fontWeight: 700, color: '#1E3A8A' }}>{branch}</td>
                <td style={{ padding: '8px 10px', color: '#64748B', fontWeight: 600 }}>Application No:</td>
                <td style={{ padding: '8px 10px', fontWeight: 600 }}>{application.id}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <td style={{ padding: '8px 10px', color: '#64748B', fontWeight: 600 }}>Entrance Examination:</td>
                <td style={{ padding: '8px 10px' }}>{application.academic?.examType || 'WBJEE'} (Rank: <strong>{rank}</strong>)</td>
                <td style={{ padding: '8px 10px', color: '#64748B', fontWeight: 600 }}>Exam Roll No:</td>
                <td style={{ padding: '8px 10px' }}>{rollNo}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <td style={{ padding: '8px 10px', color: '#64748B', fontWeight: 600 }}>Guardian Name:</td>
                <td style={{ padding: '8px 10px' }}>{application.personal?.guardianName || 'N/A'}</td>
                <td style={{ padding: '8px 10px', color: '#64748B', fontWeight: 600 }}>12th PCM Aggregate:</td>
                <td style={{ padding: '8px 10px', fontWeight: 700 }}>{application.academic?.pcmPercentage || '92.6'}%</td>
              </tr>
            </tbody>
          </table>

          {/* Payment Settlement Information Box */}
          <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '12px 16px', marginBottom: '1rem', fontSize: '0.8rem' }}>
            <div style={{ fontWeight: 700, color: '#059669', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={15} /> Fee Settlement Verified via Razorpay Gateway
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', color: '#334155' }}>
              <div>Amount Settled: <strong>₹85,000.00</strong></div>
              <div>Txn / Payment ID: <span style={{ fontFamily: 'monospace' }}>{paymentId}</span></div>
              <div>Receipt No: <strong>{receiptNo}</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdmissionLetterModal;
