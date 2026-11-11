import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApplication } from '../../context/ApplicationContext';
import {
  User,
  BookOpen,
  Sliders,
  UploadCloud,
  CheckCircle,
  Save,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Check,
  Sparkles,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

const BRANCH_OPTIONS = [
  { value: 'CSE', label: 'Computer Science & Engineering (CSE)' },
  { value: 'CSE-AIML', label: 'CSE (Artificial Intelligence & ML)' },
  { value: 'IT', label: 'Information Technology (IT)' },
  { value: 'CSBS', label: 'Computer Science & Business Systems (CSBS)' },
  { value: 'ECE', label: 'Electronics & Communication Engg. (ECE)' }
];

const sanitizePreferences = (prefs) => {
  const allCodes = BRANCH_OPTIONS.map(b => b.value);
  const unique = [];
  for (const p of prefs || []) {
    if (p && allCodes.includes(p) && !unique.includes(p)) {
      unique.push(p);
    }
  }
  for (const code of allCodes) {
    if (unique.length >= 3) break;
    if (!unique.includes(code)) {
      unique.push(code);
    }
  }
  return unique.slice(0, 3);
};

export const ApplicationWizard = ({ onComplete }) => {
  const { user } = useAuth();
  const { application, saveApplicationDraft, submitApplication } = useApplication();

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [declarationAgreed, setDeclarationAgreed] = useState(false);

  // Helpers to clean digit strings
  const cleanPhone = (p) => {
    if (!p) return '';
    const digits = String(p).replace(/\D/g, '');
    return digits.length > 10 ? digits.slice(-10) : digits;
  };
  const cleanPin = (p) => {
    if (!p) return '';
    return String(p).replace(/\D/g, '').slice(0, 6);
  };

  // Form State
  const [personal, setPersonal] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: cleanPhone(user?.phone),
    dob: '',
    gender: '',
    guardianName: '',
    guardianRelation: '',
    guardianPhone: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });

  // Age eligibility check (17–21 years based on current date)
  const getAge = (dob) => {
    if (!dob) return null;
    const parts = String(dob).split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    const [birthYear, birthMonth, birthDay] = parts;
    const today = new Date();
    let age = today.getFullYear() - birthYear;
    const m = (today.getMonth() + 1) - birthMonth;
    if (m < 0 || (m === 0 && today.getDate() < birthDay)) age--;
    return age;
  };
  const candidateAge = getAge(personal.dob);
  const dobError = personal.dob
    ? candidateAge === null
      ? 'Please enter a valid Date of Birth.'
      : candidateAge < 17
        ? 'Candidate must be at least 17 years old to be eligible.'
        : candidateAge > 21
          ? 'Candidate must be 21 years or younger to be eligible.'
          : ''
    : '';

  const [academic, setAcademic] = useState({
    board10: '',
    school10: '',
    year10: '',
    percent10: '',
    board12: '',
    school12: '',
    year12: '',
    percent12: '',
    physicsMarks: '',
    chemistryMarks: '',
    mathMarks: '',
    pcmPercentage: 0,
    examType: '',
    examRoll: '',
    examRank: ''
  });

  const [preferences, setPreferences] = useState(['CSE', 'CSE-AIML', 'IT']);

  const [documents, setDocuments] = useState({
    photo: { name: 'passport_photo.jpg', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80', uploaded: true },
    admit10: { name: 'class10_admit.pdf', url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80', uploaded: true },
    marksheet12: { name: 'class12_marksheet.pdf', url: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800&q=80', uploaded: true },
    rankCard: { name: 'entrance_rankcard.pdf', url: 'https://images.unsplash.com/photo-1554415707-9e49fe83083f?w=800&q=80', uploaded: true }
  });

  // Hydrate if draft exists
  useEffect(() => {
    if (application) {
      if (application.personal) {
        setPersonal(prev => ({
          ...prev,
          ...application.personal,
          phone: cleanPhone(application.personal.phone || prev.phone),
          guardianPhone: cleanPhone(application.personal.guardianPhone || prev.guardianPhone),
          pincode: cleanPin(application.personal.pincode || prev.pincode)
        }));
      }
      if (application.academic) {
        setAcademic(prev => ({
          ...prev,
          ...application.academic,
          examRoll: (application.academic.examRoll || '').replace(/\D/g, '').slice(0, 10),
          year10: application.academic.year10 ? String(application.academic.year10).replace(/\D/g, '').slice(0, 4) : '',
          year12: application.academic.year12 ? String(application.academic.year12).replace(/\D/g, '').slice(0, 4) : ''
        }));
      }
      if (application.preferences && application.preferences.length > 0) {
        setPreferences(sanitizePreferences(application.preferences));
      }
      if (application.documents) setDocuments(prev => ({ ...prev, ...application.documents }));
    }
  }, [application]);

  // Ensure current preferences in state are always unique (deduplicates any existing repeated state)
  useEffect(() => {
    setPreferences(prev => {
      const sanitized = sanitizePreferences(prev);
      if (sanitized.some((val, i) => val !== prev[i])) {
        return sanitized;
      }
      return prev;
    });
  }, []);

  // Live PCM aggregate % calculation
  const calculatePcm = (p, c, m) => {
    const pVal = parseInt(p, 10) || 0;
    const cVal = parseInt(c, 10) || 0;
    const mVal = parseInt(m, 10) || 0;
    if (!pVal || !cVal || !mVal) return 0;
    return parseFloat(((pVal + cVal + mVal) / 3).toFixed(2));
  };

  const handleMarksChange = (field, val) => {
    if (val === '') {
      const nextAcademic = { ...academic, [field]: '' };
      nextAcademic.pcmPercentage = calculatePcm(
        field === 'physicsMarks' ? 0 : nextAcademic.physicsMarks,
        field === 'chemistryMarks' ? 0 : nextAcademic.chemistryMarks,
        field === 'mathMarks' ? 0 : nextAcademic.mathMarks
      );
      setAcademic(nextAcademic);
      return;
    }
    // Strip decimals — only allow integers
    const intVal = parseInt(val, 10);
    if (isNaN(intVal)) return;
    const num = Math.min(100, Math.max(0, intVal));
    const nextAcademic = { ...academic, [field]: num };
    nextAcademic.pcmPercentage = calculatePcm(
      field === 'physicsMarks' ? num : nextAcademic.physicsMarks,
      field === 'chemistryMarks' ? num : nextAcademic.chemistryMarks,
      field === 'mathMarks' ? num : nextAcademic.mathMarks
    );
    setAcademic(nextAcademic);
  };

  const currentYear = new Date().getFullYear();

  const handleYearChange = (field, val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length === 4 && Number(digits) > currentYear) {
      setAcademic(prev => ({ ...prev, [field]: String(currentYear) }));
      return;
    }
    setAcademic(prev => ({ ...prev, [field]: digits }));
  };

  const renderYearField = (field, placeholder) => {
    const val = academic[field] || '';
    const len = String(val).length;
    const isTooHigh = len === 4 && Number(val) > currentYear;
    const isInvalid = Boolean(val) && (len !== 4 || isTooHigh);
    return (
      <div className="form-group" style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Year of Passing</label>
          {val ? (
            <span style={{ fontSize: '0.72rem', color: isTooHigh ? 'var(--destructive)' : len === 4 ? 'var(--success)' : '#64748B', fontWeight: 600 }}>
              {len}/4 digits
            </span>
          ) : (
            <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Max {currentYear}</span>
          )}
        </div>
        <input
          type="text"
          value={val}
          onChange={e => handleYearChange(field, e.target.value)}
          className="form-input"
          style={{
            marginTop: '4px',
            borderColor: isInvalid ? 'var(--destructive)' : undefined
          }}
          placeholder={placeholder}
          maxLength={4}
        />
        {val && len !== 4 && (
          <span style={{ fontSize: '0.75rem', color: 'var(--destructive)', marginTop: '4px', display: 'block' }}>
            ⚠ Year must be exactly 4 digits
          </span>
        )}
        {isTooHigh && (
          <span style={{ fontSize: '0.75rem', color: 'var(--destructive)', marginTop: '4px', display: 'block' }}>
            ⚠ Year cannot exceed {currentYear}
          </span>
        )}
      </div>
    );
  };

  const handlePercent10Change = (val) => {
    if (val === '') {
      setAcademic(prev => ({ ...prev, percent10: '' }));
      return;
    }
    const num = parseFloat(val);
    if (isNaN(num)) return;
    if (num > 100) {
      setAcademic(prev => ({ ...prev, percent10: 100 }));
    } else if (num < 0) {
      setAcademic(prev => ({ ...prev, percent10: 0 }));
    } else {
      setAcademic(prev => ({ ...prev, percent10: val }));
    }
  };

  const handlePercent12Change = (val) => {
    if (val === '') {
      setAcademic(prev => ({ ...prev, percent12: '' }));
      return;
    }
    const num = parseFloat(val);
    if (isNaN(num)) return;
    if (num > 100) {
      setAcademic(prev => ({ ...prev, percent12: 100 }));
    } else if (num < 0) {
      setAcademic(prev => ({ ...prev, percent12: 0 }));
    } else {
      setAcademic(prev => ({ ...prev, percent12: val }));
    }
  };

  const handleFileUpload = (docKey, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setDocuments(prev => ({
        ...prev,
        [docKey]: {
          name: file.name,
          url: event.target.result,
          uploaded: true,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  // Preference handlers ensuring no duplicates exist across 1st, 2nd, and 3rd choices
  const handlePreferenceChange = (index, newValue) => {
    setPreferences(prev => {
      const next = [...prev];
      const prevValue = next[index];
      const duplicateIndex = next.findIndex((p, i) => i !== index && p === newValue);
      if (duplicateIndex !== -1) {
        // Swap with the other choice slot so neither is repeated
        next[duplicateIndex] = prevValue;
      }
      next[index] = newValue;
      return sanitizePreferences(next);
    });
  };

  const handleMovePreference = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= 3) return;
    setPreferences(prev => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    setErrorMsg('');
    try {
      await saveApplicationDraft({ personal, academic, preferences, documents });
    } catch (err) {
      setErrorMsg('Error saving draft: ' + err.message);
    } finally {
      setSavingDraft(false);
    }
  };

  const isStepValid = (step) => {
    if (step === 1) {
      const isNameValid = Boolean(personal.fullName && personal.fullName.trim().length >= 2);
      const isDobValid = Boolean(personal.dob && !dobError && candidateAge !== null && candidateAge >= 17 && candidateAge <= 21);
      const isPhoneValid = Boolean(personal.phone && personal.phone.length === 10);
      const isEmailValid = Boolean(personal.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.email));
      const isGuardianNameValid = Boolean(personal.guardianName && personal.guardianName.trim().length >= 2);
      const isGuardianPhoneValid = Boolean(personal.guardianPhone && personal.guardianPhone.length === 10);
      const isPinCodeValid = Boolean(personal.pincode && personal.pincode.length === 6);

      return Boolean(
        isNameValid &&
        isDobValid &&
        isPhoneValid &&
        isEmailValid &&
        isGuardianNameValid &&
        isGuardianPhoneValid &&
        isPinCodeValid
      );
    }
    if (step === 2) {
      const areMarksFilled =
        academic.physicsMarks !== '' &&
        academic.chemistryMarks !== '' &&
        academic.mathMarks !== '';
      const isPcmValid = Number(academic.pcmPercentage) >= 60;
      const isExamRollValid = Boolean(academic.examRoll && academic.examRoll.length === 10);
      const isExamRankValid = Boolean(academic.examRank && Number(academic.examRank) > 0);
      const isYearValid = !academic.year10 || (String(academic.year10).length === 4 && Number(academic.year10) <= currentYear);
      const isPercent10Valid = academic.percent10 === '' || (Number(academic.percent10) >= 0 && Number(academic.percent10) <= 100);
      const isYear12Valid = !academic.year12 || (String(academic.year12).length === 4 && Number(academic.year12) <= currentYear);
      const isPercent12Valid = academic.percent12 === '' || (Number(academic.percent12) >= 0 && Number(academic.percent12) <= 100);

      return Boolean(
        areMarksFilled &&
        isPcmValid &&
        isExamRollValid &&
        isExamRankValid &&
        isYearValid &&
        isPercent10Valid &&
        isYear12Valid &&
        isPercent12Valid
      );
    }
    if (step === 3) {
      return (
        preferences.length === 3 &&
        new Set(preferences).size === 3 &&
        preferences.every(p => Boolean(p))
      );
    }
    if (step === 4) {
      return Boolean(
        documents.photo?.uploaded &&
        documents.admit10?.uploaded &&
        documents.marksheet12?.uploaded &&
        documents.rankCard?.uploaded
      );
    }
    if (step === 5) {
      return Boolean(declarationAgreed && !submitting);
    }
    return true;
  };

  const handleNextStep = () => {
    setErrorMsg('');
    if (currentStep === 1) {
      if (!personal.fullName || !personal.fullName.trim()) {
        setErrorMsg('Please enter applicant full name.');
        return;
      }
      if (!personal.dob) {
        setErrorMsg('Please enter your Date of Birth.');
        return;
      }
      if (dobError) {
        setErrorMsg(dobError);
        return;
      }
      if (!personal.phone || personal.phone.length !== 10) {
        setErrorMsg('Applicant Mobile Number must be exactly 10 digits.');
        return;
      }
      if (!personal.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.email)) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }
      if (!personal.guardianName || !personal.guardianName.trim()) {
        setErrorMsg('Please enter guardian full name.');
        return;
      }
      if (!personal.guardianPhone || personal.guardianPhone.length !== 10) {
        setErrorMsg('Guardian Contact Number must be exactly 10 digits.');
        return;
      }
      if (!personal.pincode || personal.pincode.length !== 6) {
        setErrorMsg('PIN Code must be exactly 6 digits.');
        return;
      }
    }
    if (currentStep === 2) {
      if (academic.percent10 !== '' && (Number(academic.percent10) < 0 || Number(academic.percent10) > 100)) {
        setErrorMsg('Class 10 Aggregate % cannot exceed 100%.');
        return;
      }
      if (
        academic.physicsMarks === '' ||
        academic.chemistryMarks === '' ||
        academic.mathMarks === ''
      ) {
        setErrorMsg('Please enter marks for Physics, Chemistry, and Mathematics.');
        return;
      }
      if (academic.pcmPercentage < 60) {
        setErrorMsg('Class 12 PCM aggregate must be at least 60.0% to meet AICTE/MAKAUT minimum criteria.');
        return;
      }
      if (!academic.examRoll || academic.examRoll.length !== 10) {
        setErrorMsg('Examination Roll Number must be exactly 10 digits.');
        return;
      }
      if (!academic.examRank || Number(academic.examRank) <= 0) {
        setErrorMsg('Please enter a valid Entrance Exam Rank.');
        return;
      }
      if (academic.year10 && String(academic.year10).length !== 4) {
        setErrorMsg('Class 10 Year of Passing must be a 4-digit year.');
        return;
      }
      if (academic.year10 && Number(academic.year10) > currentYear) {
        setErrorMsg(`Class 10 Year of Passing cannot exceed ${currentYear}.`);
        return;
      }
      if (academic.year12 && String(academic.year12).length !== 4) {
        setErrorMsg('Class 12 Year of Passing must be a 4-digit year.');
        return;
      }
      if (academic.year12 && Number(academic.year12) > currentYear) {
        setErrorMsg(`Class 12 Year of Passing cannot exceed ${currentYear}.`);
        return;
      }
      if (academic.percent12 !== '' && (Number(academic.percent12) < 0 || Number(academic.percent12) > 100)) {
        setErrorMsg('Class 12 Aggregate % cannot exceed 100%.');
        return;
      }
    }
    if (currentStep === 3) {
      const unique = new Set(preferences);
      if (unique.size < 3) {
        setErrorMsg('Please select three distinct branch preferences in order of priority.');
        return;
      }
    }
    setCurrentStep(prev => Math.min(5, prev + 1));
  };

  const handleFinalSubmit = async () => {
    if (!declarationAgreed) {
      setErrorMsg('Please acknowledge and check the Solemn Declaration before final submission.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      await submitApplication({ personal, academic, preferences, documents });
      if (onComplete) onComplete();
    } catch (err) {
      setErrorMsg('Submission failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { num: 1, label: 'Personal & Guardian', icon: User },
    { num: 2, label: 'Academic & Exam', icon: BookOpen },
    { num: 3, label: 'Branch Priority', icon: Sliders },
    { num: 4, label: 'Document Uploads', icon: UploadCloud },
    { num: 5, label: 'Review & Submit', icon: CheckCircle }
  ];

  return (
    <div className="container" style={{ maxWidth: '960px', padding: '2rem 1.5rem 5rem' }}>

      {/* Wizard Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: 'var(--primary-light)', color: 'var(--primary)' }}>
              ONLINE APPLICATION FORM
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              • B.Tech Admissions 2027–2028
            </span>
          </div>
          <h1 className="heading-2" style={{ marginTop: '4px' }}>
            Undergraduate Admission Application Wizard
          </h1>
        </div>

        <button
          onClick={handleSaveDraft}
          disabled={savingDraft}
          className="btn btn-outline btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Save size={15} />
          <span>{savingDraft ? 'Saving Draft...' : 'Autosave Draft'}</span>
        </button>
      </div>

      {/* Stepper Navigation */}
      <div className="stepper-nav">
        <div className="stepper-progress-bar">
          <div
            className="stepper-progress-fill"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {steps.map((s) => {
          const Icon = s.icon;
          const isCompleted = currentStep > s.num;
          const isActive = currentStep === s.num;
          return (
            <div
              key={s.num}
              className={`step-node ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              onClick={() => {
                if (isCompleted) setCurrentStep(s.num);
              }}
              style={{ cursor: isCompleted ? 'pointer' : 'default' }}
            >
              <div className="step-circle">
                {isCompleted ? <Check size={18} /> : <Icon size={18} />}
              </div>
              <span className="step-label hidden-mobile">{s.label}</span>
            </div>
          );
        })}
      </div>

      {/* Error alert */}
      {errorMsg && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'var(--destructive-light)', color: 'var(--destructive)', border: '1px solid var(--destructive-border)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Wizard Step Cards */}
      <div className="card card-elevated" style={{ padding: '2rem' }}>

        {/* ================= STEP 1: PERSONAL & GUARDIAN ================= */}
        {currentStep === 1 && (
          <div>
            <h3 className="heading-3" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={20} color="var(--primary)" />
              <span>Step 1: Personal & Guardian Particulars</span>
            </h3>

            <div className="grid grid-cols-2 md-col-1 gap-4">
              <div className="form-group">
                <label className="form-label">Full Name of Applicant *</label>
                <input
                  type="text"
                  required
                  value={personal.fullName}
                  onChange={e => setPersonal({ ...personal, fullName: e.target.value.replace(/[^a-zA-Z\s.]/g, '') })}
                  className="form-input"
                  placeholder="e.g. Debojyoti Banerjee"
                  pattern="[a-zA-Z\s.]+"
                  title="Only letters, spaces, and dots are allowed"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Date of Birth *</label>
                <input
                  type="date"
                  required
                  max={new Date().toLocaleDateString('en-CA')}
                  value={personal.dob}
                  onChange={e => setPersonal({ ...personal, dob: e.target.value })}
                  className="form-input"
                  style={{
                    color: personal.dob === '' ? '#9CA3AF' : dobError ? 'var(--destructive)' : undefined,
                    borderColor: dobError ? 'var(--destructive)' : undefined
                  }}
                />
                {dobError && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--destructive)', marginTop: '4px', display: 'block' }}>
                    ⚠ {dobError}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Gender</label>
                <select
                  value={personal.gender}
                  onChange={e => setPersonal({ ...personal, gender: e.target.value })}
                  className="form-select"
                  style={{ color: personal.gender === '' ? '#9CA3AF' : undefined }}
                >
                  <option value="" disabled>Select</option>
                  <option value="Male" style={{ color: '#000' }}>Male</option>
                  <option value="Female" style={{ color: '#000' }}>Female</option>
                  <option value="Other" style={{ color: '#000' }}>Other</option>
                </select>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Mobile Number (Applicant) *</label>
                  <span style={{ fontSize: '0.72rem', color: personal.phone?.length === 10 ? 'var(--success)' : '#64748B', fontWeight: 600 }}>
                    {personal.phone?.length || 0}/10 digits
                  </span>
                </div>
                <input
                  type="tel"
                  required
                  value={personal.phone}
                  onChange={e => setPersonal({ ...personal, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  className="form-input"
                  style={{
                    marginTop: '4px',
                    borderColor: personal.phone && personal.phone.length !== 10 ? 'var(--destructive)' : undefined
                  }}
                  placeholder="9830123456"
                  maxLength={10}
                  minLength={10}
                  pattern="[0-9]{10}"
                  title="Please enter exactly 10 digits"
                />
                {personal.phone && personal.phone.length !== 10 && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--destructive)', marginTop: '4px', display: 'block' }}>
                    ⚠ Mobile number must be exactly 10 digits ({personal.phone.length}/10 entered)
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Email ID (Official communication) *</label>
                <input
                  type="email"
                  required
                  value={personal.email}
                  onChange={e => setPersonal({ ...personal, email: e.target.value })}
                  className="form-input"
                  placeholder="applicant@example.com"
                  pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
                  title="Please enter a valid email (e.g. name@domain.com)"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label className="form-label">Guardian Full Name *</label>
              <input
                type="text"
                required
                value={personal.guardianName}
                onChange={e => setPersonal({ ...personal, guardianName: e.target.value.replace(/[^a-zA-Z\s.]/g, '') })}
                className="form-input"
                placeholder="e.g. Asit Kumar Banerjee"
                pattern="[a-zA-Z\s.]+"
                title="Only letters, spaces, and dots are allowed"
              />
            </div>

            <div className="grid grid-cols-2 md-col-1 gap-4" style={{ marginTop: '0.5rem' }}>
              <div className="form-group">
                <label className="form-label">Guardian Relationship</label>
                <select
                  value={personal.guardianRelation}
                  onChange={e => setPersonal({ ...personal, guardianRelation: e.target.value })}
                  className="form-select"
                  style={{ color: personal.guardianRelation === '' ? '#9CA3AF' : undefined }}
                >
                  <option value="" disabled>Select</option>
                  <option value="Father" style={{ color: '#000' }}>Father</option>
                  <option value="Mother" style={{ color: '#000' }}>Mother</option>
                  <option value="Legal Guardian" style={{ color: '#000' }}>Legal Guardian</option>
                </select>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Guardian Contact Number *</label>
                  <span style={{ fontSize: '0.72rem', color: personal.guardianPhone?.length === 10 ? 'var(--success)' : '#64748B', fontWeight: 600 }}>
                    {personal.guardianPhone?.length || 0}/10 digits
                  </span>
                </div>
                <input
                  type="tel"
                  required
                  value={personal.guardianPhone}
                  onChange={e => setPersonal({ ...personal, guardianPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  className="form-input"
                  style={{
                    marginTop: '4px',
                    borderColor: personal.guardianPhone && personal.guardianPhone.length !== 10 ? 'var(--destructive)' : undefined
                  }}
                  placeholder="9830011223"
                  maxLength={10}
                  minLength={10}
                  pattern="[0-9]{10}"
                  title="Please enter exactly 10 digits"
                />
                {personal.guardianPhone && personal.guardianPhone.length !== 10 && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--destructive)', marginTop: '4px', display: 'block' }}>
                    ⚠ Guardian contact number must be exactly 10 digits ({personal.guardianPhone.length}/10 entered)
                  </span>
                )}
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label className="form-label">Permanent Postal Address</label>
              <textarea
                rows={2}
                value={personal.address}
                onChange={e => setPersonal({ ...personal, address: e.target.value })}
                className="form-textarea"
                placeholder="Flat / House No, Street name, Locality"
              />
            </div>

            <div className="grid grid-cols-3 md-col-1 gap-4">
              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  value={personal.city}
                  onChange={e => setPersonal({ ...personal, city: e.target.value.replace(/[^a-zA-Z\s]/g, '') })}
                  className="form-input"
                  placeholder="Enter City"
                  pattern="[a-zA-Z\s]+"
                  title="Only letters and spaces are allowed"
                />
              </div>

              <div className="form-group">
                <label className="form-label">State</label>
                <input
                  type="text"
                  value={personal.state}
                  onChange={e => setPersonal({ ...personal, state: e.target.value.replace(/[^a-zA-Z\s]/g, '') })}
                  className="form-input"
                  placeholder="Enter State"
                  pattern="[a-zA-Z\s]+"
                  title="Only letters and spaces are allowed"
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>PIN Code *</label>
                  <span style={{ fontSize: '0.72rem', color: personal.pincode?.length === 6 ? 'var(--success)' : '#64748B', fontWeight: 600 }}>
                    {personal.pincode?.length || 0}/6 digits
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={personal.pincode}
                  onChange={e => setPersonal({ ...personal, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  className="form-input"
                  style={{
                    marginTop: '4px',
                    borderColor: personal.pincode && personal.pincode.length !== 6 ? 'var(--destructive)' : undefined
                  }}
                  placeholder="Enter PIN Code"
                  maxLength={6}
                  minLength={6}
                  pattern="[0-9]{6}"
                  title="Please enter exactly 6 digits"
                />
                {personal.pincode && personal.pincode.length !== 6 && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--destructive)', marginTop: '4px', display: 'block' }}>
                    ⚠ PIN code must be exactly 6 digits ({personal.pincode.length}/6 entered)
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2: ACADEMIC & ENTRANCE EXAM ================= */}
        {currentStep === 2 && (
          <div>
            <h3 className="heading-3" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={20} color="var(--primary)" />
              <span>Step 2: Academic Qualifications & Entrance Exam</span>
            </h3>

            {/* Class 10 Details */}
            <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--secondary)', marginBottom: '1rem' }}>
                Class 10 (Secondary / Matriculation)
              </h4>
              <div className="grid grid-cols-4 md-col-1 gap-4">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Board / Council</label>
                  <select
                    value={academic.board10}
                    onChange={e => setAcademic({ ...academic, board10: e.target.value })}
                    className="form-select"
                    style={{ color: academic.board10 === '' ? '#9CA3AF' : undefined }}
                  >
                    <option value="" disabled>Select</option>
                    <option value="CBSE" style={{ color: '#000' }}>CBSE</option>
                    <option value="ICSE" style={{ color: '#000' }}>ICSE</option>
                    <option value="WBBSE" style={{ color: '#000' }}>WBBSE (Madhyamik)</option>
                    <option value="Other" style={{ color: '#000' }}>Other State Board</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">School / Institution</label>
                  <input
                    type="text"
                    value={academic.school10}
                    onChange={e => setAcademic({ ...academic, school10: e.target.value })}
                    className="form-input"
                    placeholder="School Name"
                  />
                </div>

                {renderYearField('year10', 'e.g. 2024')}

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Aggregate %</label>
                    <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Max 100%</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={academic.percent10}
                    onChange={e => handlePercent10Change(e.target.value)}
                    className="form-input"
                    style={{
                      marginTop: '4px',
                      borderColor: academic.percent10 !== '' && (Number(academic.percent10) < 0 || Number(academic.percent10) > 100) ? 'var(--destructive)' : undefined
                    }}
                    placeholder="Enter %"
                  />
                  {academic.percent10 !== '' && Number(academic.percent10) > 100 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--destructive)', marginTop: '4px', display: 'block' }}>
                      ⚠ Percentage cannot exceed 100%
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Class 12 Details */}
            <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--secondary)', marginBottom: '1rem' }}>
                Class 12 (Higher Secondary)
              </h4>
              <div className="grid grid-cols-4 md-col-1 gap-4">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Board / Council</label>
                  <select
                    value={academic.board12}
                    onChange={e => setAcademic({ ...academic, board12: e.target.value })}
                    className="form-select"
                    style={{ color: academic.board12 === '' ? '#9CA3AF' : undefined }}
                  >
                    <option value="" disabled>Select</option>
                    <option value="CBSE" style={{ color: '#000' }}>CBSE</option>
                    <option value="ISC" style={{ color: '#000' }}>ISC</option>
                    <option value="WBCHSE" style={{ color: '#000' }}>WBCHSE (HS)</option>
                    <option value="Other" style={{ color: '#000' }}>Other State Board</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">School / Institution</label>
                  <input
                    type="text"
                    value={academic.school12}
                    onChange={e => setAcademic({ ...academic, school12: e.target.value })}
                    className="form-input"
                    placeholder="School Name"
                  />
                </div>

                {renderYearField('year12', `e.g. ${currentYear}`)}

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Aggregate %</label>
                    <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Max 100%</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={academic.percent12}
                    onChange={e => handlePercent12Change(e.target.value)}
                    className="form-input"
                    style={{
                      marginTop: '4px',
                      borderColor: academic.percent12 !== '' && (Number(academic.percent12) < 0 || Number(academic.percent12) > 100) ? 'var(--destructive)' : undefined
                    }}
                    placeholder="Enter %"
                  />
                  {academic.percent12 !== '' && Number(academic.percent12) > 100 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--destructive)', marginTop: '4px', display: 'block' }}>
                      ⚠ Percentage cannot exceed 100%
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Class 12 PCM Details */}
            <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--secondary)' }}>
                  Class 12 (Higher Secondary) — Mandatory PCM Marks
                </h4>
                <div style={{ padding: '4px 10px', borderRadius: '6px', background: academic.pcmPercentage >= 60 ? 'var(--success-light)' : 'var(--destructive-light)', color: academic.pcmPercentage >= 60 ? 'var(--success)' : 'var(--destructive)', fontWeight: 700, fontSize: '0.8rem', border: '1px solid currentColor' }}>
                  PCM Aggregate: {academic.pcmPercentage}% {academic.pcmPercentage >= 60 ? '(Eligible)' : '(Criteria < 60%)'}
                </div>
              </div>

              <div className="grid grid-cols-3 md-col-1 gap-4" style={{ marginBottom: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Physics Marks (out of 100) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={academic.physicsMarks}
                    onChange={e => handleMarksChange('physicsMarks', e.target.value)}
                    className="form-input"
                    required
                    placeholder="Enter Marks"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Chemistry Marks (out of 100) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={academic.chemistryMarks}
                    onChange={e => handleMarksChange('chemistryMarks', e.target.value)}
                    className="form-input"
                    required
                    placeholder="Enter Marks"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Mathematics Marks (out of 100) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={academic.mathMarks}
                    onChange={e => handleMarksChange('mathMarks', e.target.value)}
                    className="form-input"
                    required
                    placeholder="Enter Marks"
                  />
                </div>
              </div>
            </div>

            {/* Entrance Exam */}
            <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--secondary)', marginBottom: '1rem' }}>
                Entrance Examination Scorecard
              </h4>
              <div className="grid grid-cols-3 md-col-1 gap-4">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Exam Body</label>
                  <select
                    value={academic.examType}
                    onChange={e => setAcademic({ ...academic, examType: e.target.value })}
                    className="form-select"
                    style={{ color: academic.examType === '' ? '#9CA3AF' : undefined }}
                  >
                    <option value="" disabled>Select</option>
                    <option value="WBJEE" style={{ color: '#000' }}>WBJEE 2027</option>
                    <option value="JEE Main" style={{ color: '#000' }}>JEE Main 2027</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Examination Roll No *</label>
                    <span style={{ fontSize: '0.72rem', color: academic.examRoll?.length === 10 ? 'var(--success)' : '#64748B', fontWeight: 600 }}>
                      {academic.examRoll?.length || 0}/10 digits
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Enter Roll No"
                    value={academic.examRoll}
                    onChange={e => setAcademic({ ...academic, examRoll: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className="form-input"
                    style={{
                      marginTop: '4px',
                      borderColor: academic.examRoll && academic.examRoll.length !== 10 ? 'var(--destructive)' : undefined
                    }}
                    maxLength={10}
                    minLength={10}
                    pattern="[0-9]{10}"
                    title="Please enter exactly 10 digits"
                  />
                  {academic.examRoll && academic.examRoll.length !== 10 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--destructive)', marginTop: '4px', display: 'block' }}>
                      ⚠ Roll number must be exactly 10 digits ({academic.examRoll.length}/10 entered)
                    </span>
                  )}
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">All-India / General Rank *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter Rank"
                    value={academic.examRank}
                    onChange={e => setAcademic({ ...academic, examRank: e.target.value.replace(/\D/g, '').slice(0, 7) })}
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 3: PROGRAM PREFERENCES ================= */}
        {currentStep === 3 && (
          <div>
            <h3 className="heading-3" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={20} color="var(--primary)" />
              <span>Step 3: Engineering Branch Preferences</span>
            </h3>

            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>
              Rank your chosen engineering branches in descending order of preference. Each priority choice must be distinct (no branch can be selected more than once). The automated allotment engine evaluates candidates strictly according to this priority ranking against published cutoffs.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { index: 0, num: 1, label: '1st Choice (Highest Priority)', bg: 'var(--primary)' },
                { index: 1, num: 2, label: '2nd Choice', bg: 'var(--secondary)' },
                { index: 2, num: 3, label: '3rd Choice', bg: '#64748B' }
              ].map(cfg => {
                const currentValue = preferences[cfg.index] || '';
                return (
                  <div
                    key={cfg.index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem',
                      border: '1px solid var(--card-border)',
                      borderRadius: '8px',
                      background: '#FFFFFF'
                    }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: cfg.bg,
                        color: '#FFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        flexShrink: 0
                      }}
                    >
                      {cfg.num}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>
                        {cfg.label}
                      </div>
                      <select
                        value={currentValue}
                        onChange={e => handlePreferenceChange(cfg.index, e.target.value)}
                        className="form-select"
                        style={{ marginTop: '4px' }}
                      >
                        {BRANCH_OPTIONS.map(branch => {
                          const isAlreadyChosen = preferences.some((p, i) => i !== cfg.index && p === branch.value);
                          const otherIdx = preferences.findIndex((p, i) => i !== cfg.index && p === branch.value);
                          const otherLabel = otherIdx === 0 ? '1st Choice' : otherIdx === 1 ? '2nd Choice' : otherIdx === 2 ? '3rd Choice' : '';

                          return (
                            <option
                              key={branch.value}
                              value={branch.value}
                              disabled={isAlreadyChosen}
                              style={isAlreadyChosen ? { color: '#94A3B8', backgroundColor: '#F8FAFC' } : { color: '#0F172A' }}
                            >
                              {branch.label} {isAlreadyChosen ? `(Already selected as ${otherLabel})` : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Priority Reordering Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => handleMovePreference(cfg.index, -1)}
                        disabled={cfg.index === 0}
                        className="btn btn-outline btn-sm"
                        style={{
                          padding: '4px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: cfg.index === 0 ? 0.25 : 1,
                          cursor: cfg.index === 0 ? 'not-allowed' : 'pointer'
                        }}
                        title="Move priority up"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMovePreference(cfg.index, 1)}
                        disabled={cfg.index === 2}
                        className="btn btn-outline btn-sm"
                        style={{
                          padding: '4px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: cfg.index === 2 ? 0.25 : 1,
                          cursor: cfg.index === 2 ? 'not-allowed' : 'pointer'
                        }}
                        title="Move priority down"
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= STEP 4: DOCUMENT UPLOADS ================= */}
        {currentStep === 4 && (
          <div>
            <h3 className="heading-3" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UploadCloud size={20} color="var(--primary)" />
              <span>Step 4: Mandatory Document Checklist & Uploads</span>
            </h3>

            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>
              Upload clear, high-resolution scanned copies (JPG, PNG, or PDF, max 5MB). Incomplete or blurry uploads will trigger an scrutiny discrepancy query (FR-17).
            </p>

            <div className="grid grid-cols-2 md-col-1 gap-4">
              {/* Slot 1: Photo */}
              <div style={{ border: '1px dashed #CBD5E1', borderRadius: '8px', padding: '1.25rem', background: '#F8FAFC' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>1. Passport Size Photo *</span>
                  <span className="badge badge-verified-eligible">READY</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={documents.photo.url} alt="Photo" style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{documents.photo.name}</div>
                    <label className="btn btn-outline btn-sm" style={{ marginTop: '4px', cursor: 'pointer', display: 'inline-flex' }}>
                      Change File
                      <input type="file" accept="image/*" onChange={e => handleFileUpload('photo', e)} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Slot 2: Class 10 Admit */}
              <div style={{ border: '1px dashed #CBD5E1', borderRadius: '8px', padding: '1.25rem', background: '#F8FAFC' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>2. Class 10 Admit / DOB Proof *</span>
                  <span className="badge badge-verified-eligible">READY</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '6px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E3A8A' }}>
                    <FileText size={24} />
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{documents.admit10.name}</div>
                    <label className="btn btn-outline btn-sm" style={{ marginTop: '4px', cursor: 'pointer', display: 'inline-flex' }}>
                      Change File
                      <input type="file" accept="image/*,application/pdf" onChange={e => handleFileUpload('admit10', e)} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Slot 3: Class 12 Marksheet */}
              <div style={{ border: '1px dashed #CBD5E1', borderRadius: '8px', padding: '1.25rem', background: '#F8FAFC' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>3. Class 12 Marksheet *</span>
                  <span className="badge badge-verified-eligible">READY</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '6px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E3A8A' }}>
                    <FileText size={24} />
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{documents.marksheet12.name}</div>
                    <label className="btn btn-outline btn-sm" style={{ marginTop: '4px', cursor: 'pointer', display: 'inline-flex' }}>
                      Change File
                      <input type="file" accept="image/*,application/pdf" onChange={e => handleFileUpload('marksheet12', e)} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Slot 4: Rank Card */}
              <div style={{ border: '1px dashed #CBD5E1', borderRadius: '8px', padding: '1.25rem', background: '#F8FAFC' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>4. Entrance Exam Rank Card *</span>
                  <span className="badge badge-verified-eligible">READY</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '6px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E3A8A' }}>
                    <FileText size={24} />
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{documents.rankCard.name}</div>
                    <label className="btn btn-outline btn-sm" style={{ marginTop: '4px', cursor: 'pointer', display: 'inline-flex' }}>
                      Change File
                      <input type="file" accept="image/*,application/pdf" onChange={e => handleFileUpload('rankCard', e)} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 5: REVIEW & DECLARATION ================= */}
        {currentStep === 5 && (
          <div>
            <h3 className="heading-3" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={20} color="var(--primary)" />
              <span>Step 5: Review Application & Final Solemn Declaration</span>
            </h3>

            {/* Summary Review Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>

              <div style={{ background: '#F8FAFC', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>Personal Details</strong>
                  <button onClick={() => setCurrentStep(1)} className="btn-ghost" style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>Edit</button>
                </div>
                <div className="grid grid-cols-3 md-col-1 gap-2" style={{ fontSize: '0.8rem' }}>
                  <div>Name: <strong>{personal.fullName}</strong></div>
                  <div>DOB: <strong>{personal.dob}</strong> ({personal.gender})</div>
                  <div>Guardian: <strong>{personal.guardianName}</strong></div>
                  <div>Contact: <strong>{personal.phone}</strong></div>
                  <div>Email: <strong>{personal.email}</strong></div>
                  <div>Location: <strong>{personal.city}, {personal.state}</strong></div>
                </div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>Academic Qualifications</strong>
                  <button onClick={() => setCurrentStep(2)} className="btn-ghost" style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>Edit</button>
                </div>
                <div className="grid grid-cols-3 md-col-1 gap-2" style={{ fontSize: '0.8rem' }}>
                  <div>Class 10: <strong>{academic.percent10}%</strong> ({academic.board10})</div>
                  <div>12th PCM: <strong style={{ color: 'var(--success)' }}>{academic.pcmPercentage}%</strong></div>
                  <div>Physics / Chem / Math: <strong>{academic.physicsMarks}/{academic.chemistryMarks}/{academic.mathMarks}</strong></div>
                  <div>Entrance Exam: <strong>{academic.examType}</strong></div>
                  <div>Roll No: <strong>{academic.examRoll}</strong></div>
                  <div>Rank: <strong>{academic.examRank}</strong></div>
                </div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>Department Choice Order</strong>
                  <button onClick={() => setCurrentStep(3)} className="btn-ghost" style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>Edit</button>
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', fontWeight: 600 }}>
                  <span>1. {preferences[0]}</span>
                  <span>2. {preferences[1]}</span>
                  <span>3. {preferences[2]}</span>
                </div>
              </div>
            </div>

            {/* Solemn Declaration Checkbox */}
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '1.25rem', borderRadius: '8px', marginBottom: '2rem' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={declarationAgreed}
                  onChange={e => setDeclarationAgreed(e.target.checked)}
                  style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--primary)' }}
                />
                <span style={{ fontSize: '0.8rem', lineHeight: 1.5, color: '#1E3A8A' }}>
                  <strong>Solemn Declaration:</strong> I hereby declare that the particulars furnished in this application are true, correct, and complete to the best of my knowledge and belief. I understand that if any information is found fraudulent or marks falsified, my candidature and subsequent provisional admission to IEM shall be revoked immediately without refund of fees.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--card-border)' }}>
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : <div />}

          {currentStep < 5 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <button
                type="button"
                disabled={!isStepValid(currentStep)}
                onClick={handleNextStep}
                className="btn btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: !isStepValid(currentStep) ? 0.5 : 1,
                  cursor: !isStepValid(currentStep) ? 'not-allowed' : 'pointer'
                }}
                title={!isStepValid(currentStep) ? 'Please complete all required fields with the correct number of digits to continue' : ''}
              >
                Continue to Step {currentStep + 1} <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={submitting || !declarationAgreed}
              onClick={handleFinalSubmit}
              className="btn btn-primary btn-lg"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow-glow)' }}
            >
              {submitting ? 'Submitting & Generating ID...' : 'Submit Application & Lock'}
              <CheckCircle size={18} />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default ApplicationWizard;
