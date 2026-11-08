import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApplication } from '../../context/ApplicationContext';
import ApplicationWizard from './ApplicationWizard';
import StatusAndPaymentHub from './StatusAndPaymentHub';
import { PlusCircle, Search, FileText, ArrowRight } from 'lucide-react';

export const StudentPortal = () => {
  const { user } = useAuth();
  const { application, loadingApp, refreshStudentApplication } = useApplication();
  const [viewMode, setViewMode] = useState(application ? 'status' : 'wizard'); // 'wizard' | 'status'

  // If application exists and in non-draft status, default to status
  const hasSubmittedApp = application && application.status !== 'DRAFT';

  return (
    <div style={{ minHeight: 'calc(100vh - 180px)', backgroundColor: 'var(--background)' }}>
      {/* Sub-header Navigation */}
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--card-border)', padding: '12px 0' }}>
        <div className="container flex items-center justify-between">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--secondary)' }}>
              Student Admission Center
            </span>
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
                  View Submitted Form Details
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
