import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Flame, 
  User, 
  GraduationCap, 
  BookOpen, 
  AlertCircle, 
  CheckCircle, 
  RotateCw, 
  Briefcase 
} from 'lucide-react';
import { useApplication } from '../../context/ApplicationContext';

export const EditCandidateModal = ({ application, onClose, onSaved }) => {
  const { updateCandidateDataByAdmin, showNotification } = useApplication();

  if (!application) return null;

  // Form State initialized from application
  const [formData, setFormData] = useState({
    allottedBranch: application.allottedBranch || '',
    status: application.status || 'SUBMITTED',
    // Personal
    fullName: application.personal?.fullName || application.applicantName || '',
    email: application.personal?.email || application.email || '',
    phone: application.personal?.phone || application.phone || '',
    dob: application.personal?.dob || '',
    gender: application.personal?.gender || 'Male',
    category: application.personal?.category || 'General',
    guardianName: application.personal?.guardianName || '',
    address: application.personal?.address || '',
    // Academic
    examType: application.academic?.examType || 'WBJEE',
    examRank: application.academic?.examRank || '',
    examRoll: application.academic?.examRoll || '',
    percent10: application.academic?.percent10 || '',
    board10: application.academic?.board10 || 'CBSE',
    physicsMarks: application.academic?.physicsMarks ?? '',
    chemistryMarks: application.academic?.chemistryMarks ?? '',
    mathMarks: application.academic?.mathMarks ?? '',
    // Scrutiny note
    note: ''
  });

  const [pcmPercentage, setPcmPercentage] = useState(application.academic?.pcmPercentage || 0);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('allotment'); // 'allotment' | 'personal' | 'academic'

  // Live recalculate PCM aggregate %
  useEffect(() => {
    const p = parseFloat(formData.physicsMarks);
    const c = parseFloat(formData.chemistryMarks);
    const m = parseFloat(formData.mathMarks);

    if (!isNaN(p) && !isNaN(c) && !isNaN(m)) {
      const avg = ((p + c + m) / 300) * 100;
      setPcmPercentage(Math.round(avg * 100) / 100);
    }
  }, [formData.physicsMarks, formData.chemistryMarks, formData.mathMarks]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatePayload = {
        allottedBranch: formData.allottedBranch || null,
        status: formData.status,
        personal: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          dob: formData.dob,
          gender: formData.gender,
          category: formData.category,
          guardianName: formData.guardianName,
          address: formData.address
        },
        academic: {
          examType: formData.examType,
          examRank: Number(formData.examRank) || formData.examRank,
          examRoll: formData.examRoll,
          percent10: Number(formData.percent10) || formData.percent10,
          board10: formData.board10,
          physicsMarks: Number(formData.physicsMarks) || 0,
          chemistryMarks: Number(formData.chemistryMarks) || 0,
          mathMarks: Number(formData.mathMarks) || 0,
          pcmPercentage: pcmPercentage
        },
        note: formData.note || `Data & allotment updated by Admin Scrutiny Officer (${formData.status}${formData.allottedBranch ? ` - ${formData.allottedBranch}` : ''})`
      };

      const updated = await updateCandidateDataByAdmin(application.id, updatePayload);
      if (onSaved) onSaved(updated);
      onClose();
    } catch (err) {
      showNotification('Failed to update candidate: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 1250 }} onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '780px', width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0 }}
      >
        {/* Modal Header */}
        <div style={{ padding: '1.25rem 1.5rem', background: '#FFFFFF', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#4F46E5', color: '#FFFFFF' }}>
                ADMIN DATA MODIFICATION
              </span>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)' }}>
                Application: <strong style={{ color: 'var(--foreground)' }}>{application.id}</strong>
              </span>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)' }}>
                User ID: <strong style={{ color: 'var(--foreground)' }}>{application.userId}</strong>
              </span>
            </div>
            <h2 className="heading-3" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Edit Candidate Details & Branch Allotment
            </h2>
          </div>
          <button onClick={onClose} className="btn-ghost" title="Close">
            <X size={20} />
          </button>
        </div>

        {/* Firebase Sync Notice Banner */}
        <div style={{ padding: '8px 1.5rem', background: '#EEF2FF', borderBottom: '1px solid #C7D2FE', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#3730A3' }}>
          <Flame size={15} color="#4F46E5" />
          <span>
            <strong>Cloud Firebase Sync:</strong> Any updates saved here will be stored directly into Firebase Firestore under collection <code>applications/{application.id}</code> for candidate <strong>{formData.fullName || application.id}</strong>.
          </span>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', background: '#F8FAFC', borderBottom: '1px solid var(--card-border)', padding: '0 1.5rem' }}>
          <button
            type="button"
            onClick={() => setActiveTab('allotment')}
            style={{
              padding: '10px 16px',
              fontSize: '0.85rem',
              fontWeight: 600,
              border: 'none',
              background: 'transparent',
              color: activeTab === 'allotment' ? '#4F46E5' : 'var(--muted)',
              borderBottom: activeTab === 'allotment' ? '2px solid #4F46E5' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Briefcase size={14} /> Branch & Seat Allotment
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            style={{
              padding: '10px 16px',
              fontSize: '0.85rem',
              fontWeight: 600,
              border: 'none',
              background: 'transparent',
              color: activeTab === 'personal' ? '#4F46E5' : 'var(--muted)',
              borderBottom: activeTab === 'personal' ? '2px solid #4F46E5' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <User size={14} /> Personal Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('academic')}
            style={{
              padding: '10px 16px',
              fontSize: '0.85rem',
              fontWeight: 600,
              border: 'none',
              background: 'transparent',
              color: activeTab === 'academic' ? '#4F46E5' : 'var(--muted)',
              borderBottom: activeTab === 'academic' ? '2px solid #4F46E5' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <GraduationCap size={14} /> Academic & Entrance Scores
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '1.5rem', flex: 1 }}>

          {/* TAB 1: Branch & Status Allotment */}
          {activeTab === 'allotment' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ background: '#F1F5F9', padding: '1rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '0.9rem', color: 'var(--secondary)' }}>
                  🏛️ Engineering Specialization & Admission Allocation
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)' }}>
                  Assign or change the branch allotted to this student. The institutional seat quota counter and applicant status will update automatically.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Allotted Branch</label>
                  <select
                    name="allottedBranch"
                    value={formData.allottedBranch}
                    onChange={handleChange}
                    className="form-select"
                    style={{ fontWeight: 600 }}
                  >
                    <option value="">Not Allotted Yet (None)</option>
                    <option value="CSE">CSE - Computer Science & Engineering</option>
                    <option value="CSE-AIML">CSE-AIML - Artificial Intelligence & ML</option>
                    <option value="IT">IT - Information Technology</option>
                    <option value="CSBS">CSBS - Computer Science & Business Systems</option>
                    <option value="ECE">ECE - Electronics & Communication Engg.</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Allotment / Lifecycle Status *</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="form-select"
                    style={{ fontWeight: 600 }}
                  >
                    <option value="DRAFT">DRAFT (Draft Application)</option>
                    <option value="SUBMITTED">SUBMITTED (Submitted for Review)</option>
                    <option value="UNDER_REVIEW">UNDER_REVIEW (In Review Queue)</option>
                    <option value="ACTION_REQUIRED">ACTION_REQUIRED (Query Raised)</option>
                    <option value="VERIFIED_ELIGIBLE">VERIFIED_ELIGIBLE (Document Verified)</option>
                    <option value="SEAT_OFFERED">SEAT_OFFERED (Provisional Seat Offered)</option>
                    <option value="ADMISSION_CONFIRMED">ADMISSION_CONFIRMED (Fee Paid & Enrolled)</option>
                    <option value="WAITLISTED">WAITLISTED (Waitlisted)</option>
                    <option value="REJECTED">REJECTED (Ineligible / Rejected)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Scrutiny Officer Remarks / Reason for Modification</label>
                <input
                  type="text"
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  placeholder="e.g. Branch upgraded to CSE based on Round-2 seat vacancies."
                  className="form-input"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Personal Details */}
          {activeTab === 'personal' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className="form-select">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Category / Caste</label>
                  <select name="category" value={formData.category} onChange={handleChange} className="form-select">
                    <option value="General">General / Open</option>
                    <option value="OBC-A">OBC-A</option>
                    <option value="OBC-B">OBC-B</option>
                    <option value="SC">Scheduled Caste (SC)</option>
                    <option value="ST">Scheduled Tribe (ST)</option>
                    <option value="EWS">EWS</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Guardian / Parent Name</label>
                  <input
                    type="text"
                    name="guardianName"
                    value={formData.guardianName}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Residential Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Academic & Entrance Scores */}
          {activeTab === 'academic' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Entrance Exam</label>
                  <select name="examType" value={formData.examType} onChange={handleChange} className="form-select">
                    <option value="WBJEE">WBJEE (West Bengal JEE)</option>
                    <option value="JEE Main">JEE Main (All India)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">General Merit Rank (GMR) *</label>
                  <input
                    type="number"
                    name="examRank"
                    required
                    value={formData.examRank}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Exam Roll / Admit No.</label>
                  <input
                    type="text"
                    name="examRoll"
                    value={formData.examRoll}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Class 10 Board %</label>
                  <input
                    type="number"
                    step="0.1"
                    name="percent10"
                    value={formData.percent10}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Class 10 Board</label>
                  <select name="board10" value={formData.board10} onChange={handleChange} className="form-select">
                    <option value="CBSE">CBSE</option>
                    <option value="ICSE">ICSE</option>
                    <option value="WBBSE">WBBSE</option>
                    <option value="Other">Other Board</option>
                  </select>
                </div>
              </div>

              {/* Class 12 PCM Subject Marks */}
              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--secondary)' }}>
                    Class 12 PCM Marks (Out of 100 Each)
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: pcmPercentage >= 60 ? '#DCFCE7' : '#FEE2E2', padding: '3px 10px', borderRadius: '20px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: pcmPercentage >= 60 ? '#166534' : '#991B1B' }}>
                      PCM Aggregate: {pcmPercentage}% {pcmPercentage >= 60 ? '✓ (Eligible)' : '⚠️ (Below 60%)'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Physics Marks</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      name="physicsMarks"
                      value={formData.physicsMarks}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Chemistry Marks</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      name="chemistryMarks"
                      value={formData.chemistryMarks}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mathematics Marks</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      name="mathMarks"
                      value={formData.mathMarks}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--card-border)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn btn-outline btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary btn-sm"
              style={{ background: '#4F46E5', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {saving ? (
                <>
                  <RotateCw size={14} className="spin" />
                  <span>Saving to Firebase...</span>
                </>
              ) : (
                <>
                  <Flame size={15} color="#FFD166" />
                  <span>Save & Sync to Firebase</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EditCandidateModal;

