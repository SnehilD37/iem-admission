import React, { useState } from 'react';
import { useApplication } from '../../context/ApplicationContext';
import ApplicationWizard from './ApplicationWizard';
import StatusAndPaymentHub from './StatusAndPaymentHub';
import { PlusCircle, FileText, Edit3, Eye, Lock } from 'lucide-react';

export const StudentPortal = () => {
  const { application } = useApplication();
  const [viewMode, setViewMode] = useState(application ? 'status' : 'wizard'); // 'wizard' | 'status'

  // If application exists and in non-draft status, default to status
  const hasSubmittedApp = application && application.status !== 'DRAFT';
  const isVerified = ['VERIFIED_ELIGIBLE', 'SEAT_OFFERED', 'ADMISSION_CONFIRMED', 'REJECTED'].includes(application?.status);

  return (
    <div style={{ minHeight: 'calc(100vh - 180px)', backgroundColor: 'var(--background)' }}>
      {/* Sub-header Navigation */}
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--card-border)', padding: '12px 0' }}>
        <div className="container flex items-center justify-between">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--secondary)' }}>
              Student Admission Center
            </span>
            {hasSubmittedApp && (
              isVerified ? (
                <span className="badge" style={{ fontSize: '0.7rem', background: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Lock size={11} /> Verified & Locked
                </span>
              ) : (
                <span className="badge" style={{ fontSize: '0.7rem', background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Edit3 size={11} /> Pre-Verification (Editable)
                </span>
              )
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {hasSubmittedApp ? (
              <>
                <button
                  onClick={() => setViewMode('status')}
                  className={`btn btn-sm ${viewMode === 'status' ? 'btn-primary' : 'btn-outline'}`}
                >
                  <FileText size={14} /> Application Status & Fee Hub
                </button>
                <button
                  onClick={() => setViewMode('wizard')}
                  className={`btn btn-sm ${viewMode === 'wizard' ? 'btn-primary' : 'btn-outline'}`}
                >
                  {isVerified ? (
                    <>
                      <Eye size={14} /> View Submitted Form (Locked)
                    </>
                  ) : (
                    <>
                      <Edit3 size={14} /> Edit Application Form
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => setViewMode('wizard')}
                className="btn btn-sm btn-primary"
              >
                <PlusCircle size={14} /> Application Form Wizard
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'wizard' ? (
        <ApplicationWizard onComplete={() => setViewMode('status')} />
      ) : (
        <StatusAndPaymentHub onEditDraft={() => setViewMode('wizard')} />
      )}
    </div>
  );
};

export default StudentPortal;
