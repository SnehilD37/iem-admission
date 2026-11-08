import React, { useState } from 'react';
import { 
  X, 
  CheckCircle, 
  AlertTriangle, 
  GraduationCap, 
  XCircle, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  FileText, 
  User, 
  BookOpen, 
  Send,
  Eye,
  RefreshCw
} from 'lucide-react';
import { adminApi } from '../../services/api';
import { firestoreService } from '../../services/firestoreService';
import { useApplication } from '../../context/ApplicationContext';
import StatusBadge from '../common/StatusBadge';

export const SplitScreenVerification = ({ application, onClose, onUpdated }) => {
  const { showNotification } = useApplication();
  
  // Document viewer controls
  const [selectedDocKey, setSelectedDocKey] = useState('marksheet12');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Action states
  const [queryModalOpen, setQueryModalOpen] = useState(false);
  const [queryMessage, setQueryMessage] = useState('Uploaded Class 12 marksheet is illegible. Please re-upload a clean, high-resolution original scan.');
  const [selectedBranch, setSelectedBranch] = useState(application?.preferences?.[0] || 'CSE');
  const [processing, setProcessing] = useState(false);

  if (!application) return null;

  const currentDoc = application.documents?.[selectedDocKey] || {
    name: 'document.pdf',
    url: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800&q=80'
  };

  // Zoom / Rotate controls
  const handleZoomIn = () => setZoomLevel(prev => Math.min(2.5, prev + 0.25));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(0.6, prev - 0.25));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleResetView = () => { setZoomLevel(1); setRotation(0); };

  const updateLocalAppStatus = (appId, newStatus, historyEvent, actor) => {
    try {
      const raw = localStorage.getItem('iem_admin_applications');
      if (raw) {
        const apps = JSON.parse(raw);
        const app = apps.find(a => a.id === appId);
        if (app) {
          app.status = newStatus;
          if (historyEvent) {
            app.history = app.history || [];
            app.history.push({
              timestamp: new Date().toISOString(),
              event: historyEvent,
              actor: actor || 'Scrutiny Officer'
            });
          }
          localStorage.setItem('iem_admin_applications', JSON.stringify(apps));
        }
      }
    } catch (e) {}
  };

  // Action: Approve & Verify
  const handleApprove = async () => {
    setProcessing(true);
    try {
      const res = await adminApi.updateStatus(application.id, {
        status: 'VERIFIED_ELIGIBLE',
        note: 'All academic credentials and uploaded marksheets verified successfully.'
      });
      if (res.data.success) {
        updateLocalAppStatus(application.id, 'VERIFIED_ELIGIBLE', 'All academic credentials and uploaded marksheets verified successfully.', 'Admission Officer (Scrutiny Committee)');
        firestoreService.updateStatus(application.id, 'VERIFIED_ELIGIBLE', {
          timestamp: new Date().toISOString(),
          event: 'All academic credentials and uploaded marksheets verified successfully.',
          actor: 'Admission Officer (Scrutiny Committee)'
        }).catch(e => console.warn('Firestore update note:', e.message));
        showNotification(`Application ${application.id} verified and marked eligible!`, 'success');
        onUpdated();
        onClose();
      }
    } catch (err) {
      showNotification('Error verifying application: ' + err.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Action: Raise Query (FR-17)
  const handleRaiseQuery = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const res = await adminApi.raiseQuery(application.id, {
        documentField: selectedDocKey,
        message: queryMessage,
        officerName: 'Prof. A. K. Banerjee (Scrutiny Committee)'
      });
      if (res.data.success) {
        updateLocalAppStatus(application.id, 'ACTION_REQUIRED', `Discrepancy query raised on ${selectedDocKey}: ${queryMessage}`, 'Prof. A. K. Banerjee (Scrutiny Committee)');
        firestoreService.updateStatus(application.id, 'ACTION_REQUIRED', {
          timestamp: new Date().toISOString(),
          event: `Discrepancy query raised on ${selectedDocKey}: ${queryMessage}`,
          actor: 'Prof. A. K. Banerjee (Scrutiny Committee)'
        }).catch(e => console.warn('Firestore update note:', e.message));
        showNotification(`Discrepancy query dispatched to student portal for ${application.id}`, 'success');
        setQueryModalOpen(false);
        onUpdated();
        onClose();
      }
    } catch (err) {
      showNotification('Error raising query: ' + err.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Action: Offer Seat
  const handleOfferSeat = async () => {
    setProcessing(true);
    try {
      const res = await adminApi.offerSeat(application.id, {
        branch: selectedBranch,
        round: 'Round 1'
      });
      if (res.data.success) {
        updateLocalAppStatus(application.id, 'SEAT_OFFERED', `Provisional admission seat offered in ${selectedBranch} (Round 1)`, 'Central Allotment Engine');
        firestoreService.updateStatus(application.id, 'SEAT_OFFERED', {
          timestamp: new Date().toISOString(),
          event: `Provisional admission seat offered in ${selectedBranch} (Round 1)`,
          actor: 'Central Allotment Engine'
        }).catch(e => console.warn('Firestore update note:', e.message));
        showNotification(`Seat in ${selectedBranch} offered to ${application.personal?.fullName}!`, 'success');
        onUpdated();
        onClose();
      }
    } catch (err) {
      showNotification('Error offering seat: ' + err.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Action: Reject
  const handleReject = async () => {
    if (!window.confirm('Are you sure you want to mark this application as Ineligible / Rejected?')) return;
    setProcessing(true);
    try {
      const res = await adminApi.updateStatus(application.id, {
        status: 'REJECTED',
        note: 'Minimum academic or rank eligibility criteria not fulfilled.'
      });
      if (res.data.success) {
        updateLocalAppStatus(application.id, 'REJECTED', 'Application marked ineligible / rejected', 'Admission Officer');
        firestoreService.updateStatus(application.id, 'REJECTED', {
          timestamp: new Date().toISOString(),
          event: 'Application marked ineligible / rejected',
          actor: 'Admission Officer'
        }).catch(e => console.warn('Firestore update note:', e.message));
        showNotification(`Application ${application.id} marked as Ineligible`, 'success');
        onUpdated();
        onClose();
      }
    } catch (err) {
      showNotification('Error rejecting application: ' + err.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="modal-backdrop" style={{ padding: '1rem', zIndex: 1000 }} onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '1360px', width: '96vw', height: '94vh', display: 'flex', flexDirection: 'column', padding: 0 }}
      >
        {/* Header Bar */}
        <div style={{ padding: '0.875rem 1.5rem', background: '#FFFFFF', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="font-mono" style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-light)', padding: '3px 8px', borderRadius: '4px' }}>
              {application.id}
            </span>
            <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--secondary)' }}>
              {application.personal?.fullName}
            </span>
            <StatusBadge status={application.status} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
              Split-Screen Scrutiny Suite
            </span>
            <button onClick={onClose} className="btn-ghost" style={{ padding: '4px', borderRadius: '50%' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 50 / 50 Split Screen Workspace */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden' }}>
          
          {/* ================= LEFT PANE: STUDENT DEMOGRAPHICS & MARKS ================= */}
          <div style={{ padding: '1.5rem', overflowY: 'auto', background: '#F8FAFC', borderRight: '1px solid var(--card-border)' }}>
            
            {/* Quick Metrics Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '1.5rem' }}>
              <div style={{ background: '#FFFFFF', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 600 }}>12th PCM AGGREGATE</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: application.academic?.pcmPercentage >= 60 ? 'var(--success)' : 'var(--destructive)' }}>
                  {application.academic?.pcmPercentage}%
                </div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 600 }}>{application.academic?.examType || 'WBJEE'} RANK</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {application.academic?.examRank || 'N/A'}
                </div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 600 }}>CLASS 10 SCORE</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--secondary)' }}>
                  {application.academic?.percent10}%
                </div>
              </div>
            </div>

            {/* Academic Marks Breakdown */}
            <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen size={16} color="var(--primary)" /> Academic Qualifications
              </h4>
              <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '6px 0', color: 'var(--muted)' }}>Class 12 Board & School:</td>
                    <td style={{ padding: '6px 0', fontWeight: 600 }}>{application.academic?.board12} — {application.academic?.school12 || 'Recognized Council'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '6px 0', color: 'var(--muted)' }}>Subject Marks (P / C / M):</td>
                    <td style={{ padding: '6px 0', fontWeight: 700 }}>
                      Physics: {application.academic?.physicsMarks}/100 • Chemistry: {application.academic?.chemistryMarks}/100 • Math: {application.academic?.mathMarks}/100
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '6px 0', color: 'var(--muted)' }}>Entrance Exam Roll No:</td>
                    <td style={{ padding: '6px 0', fontFamily: 'monospace' }}>{application.academic?.examRoll || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Demographic & Guardian */}
            <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={16} color="var(--primary)" /> Demographic & Guardian
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' }}>
                <div>Email: <strong>{application.personal?.email}</strong></div>
                <div>Phone: <strong>{application.personal?.phone}</strong></div>
                <div>Guardian: <strong>{application.personal?.guardianName}</strong></div>
                <div>DOB: <strong>{application.personal?.dob}</strong> ({application.personal?.gender})</div>
                <div style={{ gridColumn: 'span 2' }}>
                  Address: {application.personal?.address}, {application.personal?.city}, {application.personal?.state} - {application.personal?.pincode}
                </div>
              </div>
            </div>

            {/* Branch Preferences */}
            <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.5rem' }}>
                Candidate's Priority Order
              </h4>
              <div style={{ display: 'flex', gap: '8px', fontSize: '0.8rem' }}>
                {application.preferences?.map((pref, i) => (
                  <span key={pref} style={{ padding: '4px 10px', borderRadius: '6px', background: i === 0 ? 'var(--primary-light)' : '#F1F5F9', color: i === 0 ? 'var(--primary)' : 'var(--secondary)', fontWeight: 700, border: '1px solid #CBD5E1' }}>
                    #{i + 1} {pref}
                  </span>
                ))}
              </div>
            </div>

            {/* Active Discrepancy Note if any */}
            {application.queries?.length > 0 && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '12px', fontSize: '0.8rem', color: '#991B1B' }}>
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>Active Scrutiny Query:</div>
                <p>"{application.queries[0].message}"</p>
                {application.queries[0].responses?.length > 0 && (
                  <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #FCA5A5', color: '#047857' }}>
                    <strong>Student Response:</strong> "{application.queries[0].responses[0].responseText}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ================= RIGHT PANE: IN-BROWSER HIGH-RES DOCUMENT VIEWER ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0F172A' }}>
            
            {/* Document Selector Tabs */}
            <div style={{ background: '#1E293B', padding: '6px 12px', display: 'flex', gap: '6px', borderBottom: '1px solid rgba(255,255,255,0.1)', overflowX: 'auto' }}>
              {[
                { key: 'marksheet12', label: '12th Marksheet' },
                { key: 'rankCard', label: 'Rank Card' },
                { key: 'admit10', label: '10th Admit' },
                { key: 'photo', label: 'Photo' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => { setSelectedDocKey(tab.key); handleResetView(); }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: selectedDocKey === tab.key ? 'var(--primary)' : 'transparent',
                    color: selectedDocKey === tab.key ? '#FFFFFF' : '#94A3B8'
                  }}
                >
                  {tab.label}
                  {application.documents?.[tab.key]?.flagged && ' ⚠️'}
                </button>
              ))}
            </div>

            {/* Canvas Viewer */}
            <div className="doc-viewer-canvas" style={{ flex: 1, position: 'relative' }}>
              <img
                src={currentDoc.url}
                alt="Document Preview"
                className="doc-preview-img"
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`
                }}
              />

              {/* Floating Controls */}
              <div className="doc-viewer-controls">
                <button onClick={handleZoomOut} className="doc-control-btn" title="Zoom Out">
                  <ZoomOut size={16} />
                </button>
                <span style={{ color: '#94A3B8', fontSize: '0.75rem', padding: '0 4px', display: 'flex', alignItems: 'center' }}>
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button onClick={handleZoomIn} className="doc-control-btn" title="Zoom In">
                  <ZoomIn size={16} />
                </button>
                <button onClick={handleRotate} className="doc-control-btn" title="Rotate 90 Degrees">
                  <RotateCw size={16} />
                </button>
                <button onClick={handleResetView} className="doc-control-btn" title="Reset View">
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Scrutiny Action Bar (Bottom Footer) */}
        <div style={{ padding: '1rem 1.5rem', background: '#FFFFFF', borderTop: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>Allocate Branch:</span>
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              className="form-select"
              style={{ width: '130px', padding: '4px 8px', fontSize: '0.8rem' }}
            >
              <option value="CSE">CSE</option>
              <option value="CSE-AIML">CSE-AIML</option>
              <option value="IT">IT</option>
              <option value="CSBS">CSBS</option>
              <option value="ECE">ECE</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleReject}
              disabled={processing}
              className="btn btn-destructive-outline btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <XCircle size={15} /> Reject Criteria
            </button>

            <button
              onClick={() => setQueryModalOpen(true)}
              disabled={processing}
              className="btn btn-outline btn-sm"
              style={{ borderColor: 'var(--warning)', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <AlertTriangle size={15} /> Flag Discrepancy (Query)
            </button>

            <button
              onClick={handleOfferSeat}
              disabled={processing}
              className="btn btn-primary btn-sm"
              style={{ background: '#6D28D9', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <GraduationCap size={15} /> Offer Seat in {selectedBranch}
            </button>

            <button
              onClick={handleApprove}
              disabled={processing}
              className="btn btn-success btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <CheckCircle size={15} /> Verify & Mark Eligible
            </button>
          </div>
        </div>

        {/* Raise Query Modal */}
        {queryModalOpen && (
          <div className="modal-backdrop" style={{ zIndex: 1200 }} onClick={() => setQueryModalOpen(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 className="heading-3" style={{ color: 'var(--warning)' }}>
                  ⚠️ Flag Discrepancy Query (FR-17)
                </h3>
                <button onClick={() => setQueryModalOpen(false)} className="btn-ghost">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleRaiseQuery}>
                <div className="form-group">
                  <label className="form-label">Flagged Document</label>
                  <input
                    type="text"
                    disabled
                    value={selectedDocKey}
                    className="form-input"
                    style={{ background: '#F1F5F9' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Discrepancy Reason & Instructions *</label>
                  <textarea
                    rows={3}
                    required
                    value={queryMessage}
                    onChange={e => setQueryMessage(e.target.value)}
                    className="form-textarea"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setQueryModalOpen(false)} className="btn btn-outline btn-sm">
                    Cancel
                  </button>
                  <button type="submit" disabled={processing} className="btn btn-primary btn-sm">
                    <Send size={14} /> Dispatch Query Alert
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SplitScreenVerification;
