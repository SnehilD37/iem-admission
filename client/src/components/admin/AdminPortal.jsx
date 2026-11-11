import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApplication } from '../../context/ApplicationContext';
import { adminApi } from '../../services/api';
import StatusBadge from '../common/StatusBadge';
import SplitScreenVerification from './SplitScreenVerification';
import MeritRankModal from './MeritRankModal';
import { 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  CreditCard, 
  Search, 
  Filter, 
  Award, 
  FileSpreadsheet, 
  Eye,
  RefreshCw
} from 'lucide-react';

export const AdminPortal = () => {
  const { user } = useAuth();
  const { 
    adminStats, 
    adminApplications, 
    adminFilters, 
    setAdminFilters, 
    loadingAdmin, 
    refreshAdminData, 
    showNotification
  } = useApplication();

  const [selectedAppForReview, setSelectedAppForReview] = useState(null);
  const [meritModalOpen, setMeritModalOpen] = useState(false);

  // Search and filter handling
  const handleSearchChange = (e) => {
    setAdminFilters({ ...adminFilters, search: e.target.value });
  };

  const handleStatusFilterChange = (e) => {
    setAdminFilters({ ...adminFilters, status: e.target.value });
  };

  const handleBranchFilterChange = (e) => {
    setAdminFilters({ ...adminFilters, branch: e.target.value });
  };

  const handleExportCsv = () => {
    const exportUrl = adminApi.getRosterExportUrl();
    window.open(exportUrl, '_blank');
    showNotification('Exporting official admissions roster (IEM_Admissions_Roster_2027.csv)...', 'success');
  };

  const quotas = adminStats?.quotas || {
    CSE: { name: 'Computer Science & Engineering', totalSeats: 120, allotted: 0, confirmed: 0 },
    'CSE-AIML': { name: 'CSE (AI & ML)', totalSeats: 60, allotted: 0, confirmed: 0 },
    IT: { name: 'Information Technology', totalSeats: 60, allotted: 0, confirmed: 0 },
    CSBS: { name: 'CS & Business Systems', totalSeats: 60, allotted: 0, confirmed: 0 },
    ECE: { name: 'Electronics & Comm. Engg.', totalSeats: 90, allotted: 0, confirmed: 0 }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 180px)', backgroundColor: 'var(--background)', padding: '2rem 0 5rem' }}>
      <div className="container-wide">
        
        {/* Top Title & Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: 'var(--secondary)', color: '#FFFFFF' }}>
                ADMIN SCRUTINY COMMITTEE CONSOLE
              </span>
            </div>
            <h1 className="heading-2" style={{ marginTop: '4px' }}>
              Admissions Command Center & Scrutiny Board
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setMeritModalOpen(true)}
              className="btn btn-outline btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Award size={15} color="var(--primary)" />
              <span>Merit Ranking Engine</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <FileSpreadsheet size={15} />
              <span>Export Roster CSV</span>
            </button>

            <button
              onClick={refreshAdminData}
              title="Refresh Roster"
              className="btn btn-outline btn-sm"
            >
              <RefreshCw size={14} className={loadingAdmin ? 'spin' : ''} />
            </button>
          </div>
        </div>

        {/* 1. Command Center Statistics Cards */}
        <div className="grid grid-cols-5 md-col-1 gap-4" style={{ marginBottom: '2rem' }}>
          <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--muted)', fontSize: '0.75rem', fontWeight: 600 }}>
              <span>TOTAL APPLICANTS</span>
              <Users size={18} color="var(--primary)" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--secondary)', marginTop: '4px' }}>
              {adminStats?.total ?? 0}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '2px' }}>
              Phase-1 Intake Active
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--muted)', fontSize: '0.75rem', fontWeight: 600 }}>
              <span>PENDING SCRUTINY</span>
              <Clock size={18} color="var(--warning)" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--warning)', marginTop: '4px' }}>
              {adminStats?.pendingScrutiny ?? 0}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '2px' }}>
              Awaiting officer verification
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--muted)', fontSize: '0.75rem', fontWeight: 600 }}>
              <span>QUERIES OPEN (FR-17)</span>
              <AlertTriangle size={18} color="var(--destructive)" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--destructive)', marginTop: '4px' }}>
              {adminStats?.activeQueries ?? 0}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '2px' }}>
              Discrepancy flags awaiting student
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--muted)', fontSize: '0.75rem', fontWeight: 600 }}>
              <span>CONFIRMED ADMISSIONS</span>
              <CheckCircle size={18} color="var(--success)" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
              {adminStats?.confirmedAdmissions ?? 0}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '2px' }}>
              Fees processed & IDs issued
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem', background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#1E3A8A', fontSize: '0.75rem', fontWeight: 600 }}>
              <span>TOTAL FEES SETTLED</span>
              <CreditCard size={18} color="#1E3A8A" />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1E3A8A', marginTop: '4px' }}>
              ₹{((adminStats?.totalFeesCollected ?? 0)).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#3B82F6', marginTop: '2px' }}>
              via Razorpay Gateway
            </div>
          </div>
        </div>

        {/* 2. Department Quota Capacity Tracker */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 className="heading-3" style={{ fontSize: '0.95rem', marginBottom: '1.25rem', color: 'var(--secondary)' }}>
            Engineering Department Capacity & Intake Monitor
          </h3>

          <div className="grid grid-cols-5 md-col-1 gap-4">
            {Object.entries(quotas).map(([code, q]) => {
              const pct = Math.round(((q.allotted || 0) / q.totalSeats) * 100);
              return (
                <div key={code} style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--primary)' }}>{code}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>
                      {q.allotted}/{q.totalSeats} Allotted
                    </span>
                  </div>

                  <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden', margin: '6px 0' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: pct > 85 ? 'var(--warning)' : 'var(--primary)' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--muted)' }}>
                    <span>Confirmed: <strong>{q.confirmed || 0}</strong></span>
                    <span>Remaining: <strong>{q.totalSeats - (q.allotted || 0)}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Applicant Data Grid & Filter Toolbar */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          
          {/* Toolbar */}
          <div style={{ padding: '1.25rem 1.5rem', background: '#FFFFFF', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            
            {/* Search Input */}
            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--muted)' }} />
              <input
                type="text"
                value={adminFilters.search}
                onChange={handleSearchChange}
                placeholder="Search candidate name, App #, rank..."
                className="form-input"
                style={{ paddingLeft: '36px', height: '38px' }}
              />
            </div>

            {/* Filter Dropdowns */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Filter size={15} color="var(--muted)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)' }}>Status:</span>
                <select
                  value={adminFilters.status}
                  onChange={handleStatusFilterChange}
                  className="form-select"
                  style={{ width: '160px', padding: '6px 10px', fontSize: '0.8rem' }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="ACTION_REQUIRED">Query Pending</option>
                  <option value="VERIFIED_ELIGIBLE">Verified Eligible</option>
                  <option value="SEAT_OFFERED">Seat Offered</option>
                  <option value="ADMISSION_CONFIRMED">Admission Confirmed</option>
                  <option value="WAITLISTED">Waitlisted</option>
                  <option value="REJECTED">Ineligible / Rejected</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)' }}>Branch:</span>
                <select
                  value={adminFilters.branch}
                  onChange={handleBranchFilterChange}
                  className="form-select"
                  style={{ width: '130px', padding: '6px 10px', fontSize: '0.8rem' }}
                >
                  <option value="ALL">All Branches</option>
                  <option value="CSE">CSE</option>
                  <option value="CSE-AIML">CSE-AIML</option>
                  <option value="IT">IT</option>
                  <option value="CSBS">CSBS</option>
                  <option value="ECE">ECE</option>
                </select>
              </div>
            </div>

          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--card-border)', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '12px 16px' }}>App ID</th>
                  <th style={{ padding: '12px 16px' }}>Candidate Name</th>
                  <th style={{ padding: '12px 16px' }}>Entrance Rank</th>
                  <th style={{ padding: '12px 16px' }}>12th PCM %</th>
                  <th style={{ padding: '12px 16px' }}>Allotted / 1st Choice</th>
                  <th style={{ padding: '12px 16px' }}>Lifecycle Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Scrutiny Action</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(adminApplications) ? adminApplications : []).map((app) => (
                  <tr key={app.id} style={{ borderBottom: '1px solid #E2E8F0', transition: 'background-color 150ms' }} className="table-row-hover">
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="font-mono" style={{ fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-light)', padding: '2px 6px', borderRadius: '4px' }}>
                          {app.id}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--secondary)' }}>
                        {app.personal?.fullName}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--muted)' }}>
                        {app.personal?.email}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {app.academic?.examType || 'WBJEE'} <strong>#{app.academic?.examRank || 'N/A'}</strong>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontWeight: 700, color: app.academic?.pcmPercentage >= 60 ? 'var(--success)' : 'var(--destructive)' }}>
                        {app.academic?.pcmPercentage}%
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontWeight: 600, color: app.allottedBranch ? 'var(--primary)' : 'var(--muted)' }}>
                        {app.allottedBranch || app.preferences?.[0] || 'CSE'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <StatusBadge status={app.status} />
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setSelectedAppForReview(app)}
                          className="btn btn-outline btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}
                        >
                          <Eye size={13} /> Review
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div style={{ padding: '10px 16px', background: '#F8FAFC', borderTop: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--muted)' }}>
            <span>Showing {(Array.isArray(adminApplications) ? adminApplications : []).length} candidate application records • Live Firebase Cloud Records</span>
            <span>IEM Central Admission Scrutiny Protocol</span>
          </div>

        </div>

      </div>

      {/* Split-Screen Scrutiny Modal */}
      {selectedAppForReview && (
        <SplitScreenVerification
          application={selectedAppForReview}
          onClose={() => setSelectedAppForReview(null)}
          onUpdated={() => {
            refreshAdminData();
            setSelectedAppForReview(null);
          }}
        />
      )}

      {/* Merit Rankings Modal */}
      <MeritRankModal
        isOpen={meritModalOpen}
        onClose={() => setMeritModalOpen(false)}
        onAllotted={() => refreshAdminData()}
      />

    </div>
  );
};

export default AdminPortal;
