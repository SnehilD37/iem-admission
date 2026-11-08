import React, { useState, useEffect } from 'react';
import { X, Award, CheckCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { meritApi } from '../../services/api';
import { useApplication } from '../../context/ApplicationContext';
import StatusBadge from '../common/StatusBadge';

export const MeritRankModal = ({ isOpen, onClose, onAllotted }) => {
  const { showNotification } = useApplication();
  const [meritList, setMeritList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allotting, setAllotting] = useState(false);

  const fetchMerit = async () => {
    setLoading(true);
    try {
      const res = await meritApi.getRanking();
      if (res.data.success) {
        setMeritList(res.data.meritList);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchMerit();
  }, [isOpen]);

  const handleBatchAllot = async () => {
    setAllotting(true);
    try {
      const res = await meritApi.batchAllot();
      if (res.data.success) {
        showNotification(res.data.message, 'success');
        await fetchMerit();
        if (onAllotted) onAllotted();
      }
    } catch (err) {
      showNotification('Batch allotment error: ' + err.message, 'error');
    } finally {
      setAllotting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '860px', padding: 0 }}
      >
        <div style={{ padding: '1.25rem 1.5rem', background: '#FFFFFF', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={20} />
            </div>
            <div>
              <h3 className="heading-3">Central Automated Merit Ranking Engine</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                Composite index computed from Entrance Rank (40%), Class 12 PCM (35%), and Class 10 (25%)
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleBatchAllot}
              disabled={allotting}
              className="btn btn-primary btn-sm"
              style={{ background: '#6D28D9' }}
            >
              <RefreshCw size={14} className={allotting ? 'spin' : ''} />
              <span>{allotting ? 'Running Engine...' : 'Run Auto Batch Allotment'}</span>
            </button>
            <button onClick={onClose} className="btn-ghost">
              <X size={18} />
            </button>
          </div>
        </div>

        <div style={{ padding: '1.5rem', maxHeight: '65vh', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
              Computing composite scores and evaluating department cutoffs...
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '2px solid var(--card-border)', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '10px 12px' }}>Merit #</th>
                  <th style={{ padding: '10px 12px' }}>Candidate Name</th>
                  <th style={{ padding: '10px 12px' }}>Composite Score</th>
                  <th style={{ padding: '10px 12px' }}>Exam Rank</th>
                  <th style={{ padding: '10px 12px' }}>PCM %</th>
                  <th style={{ padding: '10px 12px' }}>Allotted Branch</th>
                  <th style={{ padding: '10px 12px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {meritList.map((cand) => (
                  <tr key={cand.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 800, color: 'var(--primary)' }}>
                      #{cand.meritRank}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--secondary)' }}>{cand.fullName}</div>
                      <div className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{cand.id}</div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontWeight: 800, color: '#047857', background: 'var(--success-light)', padding: '2px 8px', borderRadius: '4px' }}>
                        {cand.meritScore} / 100
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {cand.examType} <strong>{cand.examRank}</strong>
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                      {cand.pcmPercentage}%
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {cand.allottedBranch ? (
                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{cand.allottedBranch}</span>
                      ) : (
                        <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Pending Allotment</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <StatusBadge status={cand.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeritRankModal;
