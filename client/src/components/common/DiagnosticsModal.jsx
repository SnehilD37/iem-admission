import React, { useState, useEffect } from 'react';
import { 
  X, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Search, 
  Terminal, 
  Layers, 
  Wrench, 
  RefreshCw, 
  Play,
  FileCode,
  ShieldCheck,
  Server,
  Monitor
} from 'lucide-react';
import { diagnosticsApi } from '../../services/api';

export const DiagnosticsModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('locate'); // 'locate' | 'health' | 'scan' | 'tester'
  
  // Locate error state
  const [errorInput, setErrorInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [methodInput, setMethodInput] = useState('GET');
  const [statusInput, setStatusInput] = useState('');
  const [loadingLocate, setLoadingLocate] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState(null);

  // Health state
  const [healthData, setHealthData] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  // Scan state
  const [scanData, setScanData] = useState(null);
  const [loadingScan, setLoadingScan] = useState(false);

  // Tester state
  const [testPath, setTestPath] = useState('/api/health');
  const [testMethod, setTestMethod] = useState('GET');
  const [testResult, setTestResult] = useState(null);
  const [loadingTest, setLoadingTest] = useState(false);

  const handleLocateError = async () => {
    if (!errorInput.trim()) return;
    setLoadingLocate(true);
    setDiagnosisResult(null);
    try {
      const res = await diagnosticsApi.locateError({
        error: errorInput,
        stack: errorInput,
        url: urlInput || undefined,
        method: methodInput,
        statusCode: statusInput ? parseInt(statusInput, 10) : undefined
      });
      setDiagnosisResult(res.data);
    } catch (err) {
      setDiagnosisResult({
        success: false,
        origin: 'NETWORK_OR_PROXY',
        errorSummary: err.message,
        explanation: 'Could not connect to /api/diagnostics/locate-error endpoint. Make sure the backend server is running.'
      });
    } finally {
      setLoadingLocate(false);
    }
  };

  const fetchHealth = async () => {
    setLoadingHealth(true);
    try {
      const res = await diagnosticsApi.getCodebaseHealth();
      setHealthData(res.data);
    } catch (err) {
      console.error(err);
      setHealthData({
        overallStatus: 'error',
        issues: [{ side: 'server', message: 'Failed to reach /api/diagnostics/health. Is the backend server running?' }],
        checks: []
      });
    } finally {
      setLoadingHealth(false);
    }
  };

  const runCodebaseScan = async () => {
    setLoadingScan(true);
    try {
      const res = await diagnosticsApi.scanCodebase();
      setScanData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingScan(false);
    }
  };

  const runRouteTest = async () => {
    setLoadingTest(true);
    setTestResult(null);
    try {
      const res = await diagnosticsApi.testEndpoint({
        path: testPath,
        method: testMethod
      });
      setTestResult(res.data);
    } catch (err) {
      setTestResult({
        success: false,
        diagnostics: { origin: 'NETWORK_OR_PROXY', message: err.message }
      });
    } finally {
      setLoadingTest(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'health' && !healthData) {
        fetchHealth();
      }
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // Preset error loaders for quick demo/testing
  const loadPreset = (type) => {
    if (type === 'client') {
      setErrorInput(`TypeError: Cannot read properties of undefined (reading 'pcmPercentage')\n    at calculateMarks (http://localhost:5173/src/components/student/ApplicationWizard.jsx:142:25)\n    at onClick (http://localhost:5173/src/components/student/ApplicationWizard.jsx:210:12)`);
      setUrlInput('');
      setStatusInput('');
    } else if (type === 'server') {
      setErrorInput(`TypeError: store.applications.find is not a function\n    at getMyApplication (C:\\Users\\PC\\Desktop\\IEM Admission System\\server\\src\\controllers\\applicationController.js:10:35)\n    at Layer.handle (C:\\Users\\PC\\Desktop\\IEM Admission System\\server\\node_modules\\express\\lib\\router\\layer.js:95:5)`);
      setUrlInput('/api/applications/my-application');
      setStatusInput('500');
    } else if (type === 'route404') {
      setErrorInput(`AxiosError: Request failed with status code 404`);
      setUrlInput('/api/applications/unknown-action-endpoint');
      setStatusInput('404');
    } else if (type === 'network') {
      setErrorInput(`AxiosError: Network Error\n    at XMLHttpRequest.handleError (http://localhost:5173/node_modules/axios/lib/adapters/xhr.js:155:14)`);
      setUrlInput('/api/health');
      setStatusInput('0');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1200 }}>
      <div 
        className="modal-content glass-card" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '840px', width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'between', backgroundColor: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#2563EB' }}>
              <Activity size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--secondary)' }}>
                Codebase Diagnostics & Issue Locator
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)' }}>
                Identify whether errors reside in Client (React) or Server (Express/Data Store)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ cursor: 'pointer', border: 'none', background: 'none' }}>
            <X size={20} color="var(--muted)" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--card-border)', backgroundColor: '#F8FAFC', padding: '0 16px' }}>
          <button 
            onClick={() => setActiveTab('locate')}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'locate' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'locate' ? 'var(--primary)' : 'var(--muted)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Search size={16} /> Error Pinpointer
          </button>
          <button 
            onClick={() => { setActiveTab('health'); fetchHealth(); }}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'health' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'health' ? 'var(--primary)' : 'var(--muted)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ShieldCheck size={16} /> Codebase Health & Route Parity
          </button>
          <button 
            onClick={() => { setActiveTab('scan'); if (!scanData) runCodebaseScan(); }}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'scan' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'scan' ? 'var(--primary)' : 'var(--muted)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Wrench size={16} /> Static Scanner
          </button>
          <button 
            onClick={() => setActiveTab('tester')}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'tester' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'tester' ? 'var(--primary)' : 'var(--muted)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Terminal size={16} /> Endpoint Tester
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          
          {/* TAB 1: Error Pinpointer */}
          {activeTab === 'locate' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--secondary)' }}>
                    Paste Error Message or Stack Trace:
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)', alignSelf: 'center' }}>Quick test:</span>
                    <button onClick={() => loadPreset('client')} style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#F8FAFC', cursor: 'pointer' }}>Client React Crash</button>
                    <button onClick={() => loadPreset('server')} style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#F8FAFC', cursor: 'pointer' }}>Server Controller 500</button>
                    <button onClick={() => loadPreset('route404')} style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#F8FAFC', cursor: 'pointer' }}>Missing Route 404</button>
                    <button onClick={() => loadPreset('network')} style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#F8FAFC', cursor: 'pointer' }}>Network/Proxy Error</button>
                  </div>
                </div>
                <textarea
                  value={errorInput}
                  onChange={(e) => setErrorInput(e.target.value)}
                  placeholder="Paste error, e.g.: TypeError: Cannot read properties of undefined at http://localhost:5173/src/components/... or server stack trace"
                  rows={5}
                  style={{
                    width: '100%',
                    fontFamily: 'monospace',
                    fontSize: '0.82rem',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--card-border)',
                    backgroundColor: '#0F172A',
                    color: '#F8FAFC',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '10px', marginBottom: '16px', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '4px' }}>
                    Request URL / Endpoint (optional):
                  </label>
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="/api/applications/save-draft"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--card-border)', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '4px' }}>
                    Method:
                  </label>
                  <select
                    value={methodInput}
                    onChange={(e) => setMethodInput(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--card-border)', fontSize: '0.82rem' }}
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PATCH">PATCH</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '4px' }}>
                    Status Code:
                  </label>
                  <input
                    type="text"
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value)}
                    placeholder="e.g. 500, 404, 0"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--card-border)', fontSize: '0.82rem' }}
                  />
                </div>
                <button
                  onClick={handleLocateError}
                  disabled={loadingLocate || !errorInput.trim()}
                  className="btn btn-primary"
                  style={{
                    padding: '8px 18px',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 700,
                    cursor: loadingLocate || !errorInput.trim() ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loadingLocate ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
                  Locate Issue
                </button>
              </div>

              {/* Diagnosis Output */}
              {diagnosisResult && (
                <div style={{ marginTop: '20px', borderRadius: '10px', border: '1px solid var(--card-border)', overflow: 'hidden' }}>
                  {/* Origin Banner */}
                  <div style={{
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 
                      diagnosisResult.origin === 'CLIENT' ? '#EFF6FF' :
                      diagnosisResult.origin === 'SERVER' ? '#FEF2F2' :
                      diagnosisResult.origin === 'SERVER_ROUTE_MISSING' ? '#FFFBEB' : '#F1F5F9',
                    borderBottom: '1px solid var(--card-border)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {diagnosisResult.origin === 'CLIENT' && <Monitor size={22} color="#2563EB" />}
                      {diagnosisResult.origin === 'SERVER' && <Server size={22} color="#DC2626" />}
                      {diagnosisResult.origin === 'SERVER_ROUTE_MISSING' && <AlertTriangle size={22} color="#D97706" />}
                      {diagnosisResult.origin === 'NETWORK_OR_PROXY' && <Activity size={22} color="#D97706" />}
                      <div>
                        <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800, color: 'var(--muted)' }}>
                          Issue Location Origin:
                        </div>
                        <div style={{
                          fontSize: '1.05rem',
                          fontWeight: 800,
                          color: 
                            diagnosisResult.origin === 'CLIENT' ? '#1D4ED8' :
                            diagnosisResult.origin === 'SERVER' ? '#B91C1C' :
                            diagnosisResult.origin === 'SERVER_ROUTE_MISSING' ? '#B45309' : '#0F172A'
                        }}>
                          {diagnosisResult.origin === 'CLIENT' && '🖥️ CLIENT CODEBASE (React / Browser)'}
                          {diagnosisResult.origin === 'SERVER' && '⚙️ SERVER CODEBASE (Express / Node / Store)'}
                          {diagnosisResult.origin === 'SERVER_ROUTE_MISSING' && '⚠️ SERVER ROUTE MISSING (API 404)'}
                          {diagnosisResult.origin === 'NETWORK_OR_PROXY' && '🌐 NETWORK / VITE PROXY (Connection Issue)'}
                          {diagnosisResult.origin === 'SERVER_CONFIGURATION' && '🔑 CONFIGURATION / CREDENTIALS (Firebase/Razorpay)'}
                          {diagnosisResult.origin === 'CLIENT_SESSION' && '🔒 CLIENT AUTHENTICATION SESSION (Token Missing)'}
                        </div>
                      </div>
                    </div>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: '#FFFFFF',
                      border: '1px solid rgba(0,0,0,0.1)'
                    }}>
                      Category: {diagnosisResult.category}
                    </span>
                  </div>

                  <div style={{ padding: '16px 18px', backgroundColor: '#FFFFFF' }}>
                    {/* Location details */}
                    {diagnosisResult.detectedLocation?.file && (
                      <div style={{ marginBottom: '14px', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                          <FileCode size={16} color="var(--primary)" />
                          <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>Pinpointed File:</span>
                          <code style={{ color: 'var(--primary)', fontWeight: 700 }}>{diagnosisResult.detectedLocation.file}</code>
                          {diagnosisResult.detectedLocation.line && (
                            <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                              at line <strong style={{ color: '#0F172A' }}>{diagnosisResult.detectedLocation.line}</strong>
                              {diagnosisResult.detectedLocation.column && ` col ${diagnosisResult.detectedLocation.column}`}
                            </span>
                          )}
                          {diagnosisResult.detectedLocation.symbol && (
                            <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                              in <code>{diagnosisResult.detectedLocation.symbol}()</code>
                            </span>
                          )}
                        </div>

                        {/* Code snippet if available */}
                        {diagnosisResult.detectedLocation.codeSnippet && diagnosisResult.detectedLocation.codeSnippet.length > 0 && (
                          <div style={{ marginTop: '10px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#0F172A', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                            {diagnosisResult.detectedLocation.codeSnippet.map((line, idx) => (
                              <div
                                key={idx}
                                style={{
                                  padding: '2px 12px',
                                  display: 'flex',
                                  backgroundColor: line.isTarget ? 'rgba(239, 68, 68, 0.25)' : 'transparent',
                                  borderLeft: line.isTarget ? '3px solid #EF4444' : '3px solid transparent'
                                }}
                              >
                                <span style={{ width: '36px', color: line.isTarget ? '#EF4444' : '#64748B', userSelect: 'none' }}>
                                  {line.lineNumber}
                                </span>
                                <span style={{ color: line.isTarget ? '#FFFFFF' : '#CBD5E1', whiteSpace: 'pre' }}>
                                  {line.code}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Explanation */}
                    <div style={{ marginBottom: '14px' }}>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '0.88rem', fontWeight: 700, color: 'var(--secondary)' }}>
                        Diagnosis:
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>
                        {diagnosisResult.explanation}
                      </p>
                    </div>

                    {/* Suggested fixes */}
                    {diagnosisResult.suggestedFixes?.length > 0 && (
                      <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '0.84rem', fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle size={15} /> Suggested Fixes:
                        </h4>
                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.82rem', color: '#15803D', lineHeight: 1.5 }}>
                          {diagnosisResult.suggestedFixes.map((fix, idx) => (
                            <li key={idx} style={{ marginBottom: '4px' }}>{fix}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Health & Route Parity */}
          {activeTab === 'health' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--secondary)' }}>
                    Automated Subsystem & Route Parity Status
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)' }}>
                    Verifies server process, client build files, and client-to-server route synchronization
                  </p>
                </div>
                <button
                  onClick={fetchHealth}
                  disabled={loadingHealth}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px' }}
                >
                  <RefreshCw size={14} className={loadingHealth ? 'animate-spin' : ''} />
                  Re-check
                </button>
              </div>

              {loadingHealth && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                  <p>Running diagnostics across client and server...</p>
                </div>
              )}

              {healthData && !loadingHealth && (
                <div>
                  {/* Status Banner */}
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: healthData.overallStatus === 'healthy' ? '#F0FDF4' : '#FFFBEB',
                    border: `1px solid ${healthData.overallStatus === 'healthy' ? '#BBF7D0' : '#FDE68A'}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {healthData.overallStatus === 'healthy' ? (
                        <CheckCircle size={20} color="#16A34A" />
                      ) : (
                        <AlertTriangle size={20} color="#D97706" />
                      )}
                      <div>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: healthData.overallStatus === 'healthy' ? '#166534' : '#92400E' }}>
                          Overall System Status: {healthData.overallStatus.toUpperCase()}
                        </span>
                        <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                          Node: {healthData.system?.nodeVersion} | Platform: {healthData.system?.platform} | Memory: {healthData.system?.memoryUsageMB}MB
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--secondary)' }}>
                      {healthData.clientEndpointCount} Client Endpoints ↔ {healthData.serverRouteCount} Server Routes
                    </span>
                  </div>

                  {/* Checks Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    {healthData.checks?.map((chk, idx) => (
                      <div key={idx} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--card-border)', backgroundColor: '#FFFFFF' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--secondary)' }}>
                            {chk.name}
                          </span>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: chk.status === 'ok' ? '#DCFCE7' : '#FEF3C7',
                            color: chk.status === 'ok' ? '#15803D' : '#B45309'
                          }}>
                            {chk.status.toUpperCase()}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted)' }}>
                          {chk.details}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Route parity mismatches if any */}
                  {healthData.routeMismatches?.length > 0 && (
                    <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#B91C1C', marginBottom: '6px' }}>
                        Detected Route Discrepancies:
                      </div>
                      {healthData.routeMismatches.map((m, idx) => (
                        <div key={idx} style={{ fontSize: '0.8rem', color: '#7F1D1D' }}>
                          Client calls <code>{m.clientMethod} {m.fullRequested}</code>, but server has no matching router endpoint.
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Static Scanner */}
          {activeTab === 'scan' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--secondary)' }}>
                    Codebase Anti-Pattern Scanner
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)' }}>
                    Checks for hardcoded localhost URLs, missing async try/catch blocks, and unhandled promise hazards
                  </p>
                </div>
                <button
                  onClick={runCodebaseScan}
                  disabled={loadingScan}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px' }}
                >
                  <RefreshCw size={14} className={loadingScan ? 'animate-spin' : ''} />
                  Run Scan
                </button>
              </div>

              {loadingScan && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                  <p>Scanning files in client/src and server/src...</p>
                </div>
              )}

              {scanData && !loadingScan && (
                <div>
                  <div style={{ marginBottom: '12px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--secondary)' }}>
                    {scanData.summary}
                  </div>

                  {/* Client issues */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1D4ED8', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Monitor size={15} /> Client Files ({scanData.scanResults?.client?.length || 0} notices):
                    </div>
                    {scanData.scanResults?.client?.length === 0 ? (
                      <div style={{ fontSize: '0.8rem', color: '#166534', padding: '8px 12px', backgroundColor: '#F0FDF4', borderRadius: '6px' }}>
                        ✓ No hardcoded localhost URLs detected in client components.
                      </div>
                    ) : (
                      scanData.scanResults.client.map((c, i) => (
                        <div key={i} style={{ padding: '8px 12px', backgroundColor: '#EFF6FF', borderRadius: '6px', marginBottom: '6px', fontSize: '0.8rem' }}>
                          <strong>{c.file}:{c.line}</strong> - {c.issue}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Server issues */}
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#B91C1C', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Server size={15} /> Server Controllers ({scanData.scanResults?.server?.length || 0} notices):
                    </div>
                    {scanData.scanResults?.server?.length === 0 ? (
                      <div style={{ fontSize: '0.8rem', color: '#166534', padding: '8px 12px', backgroundColor: '#F0FDF4', borderRadius: '6px' }}>
                        ✓ All async controllers contain try/catch handling.
                      </div>
                    ) : (
                      scanData.scanResults.server.map((s, i) => (
                        <div key={i} style={{ padding: '8px 12px', backgroundColor: '#FEF2F2', borderRadius: '6px', marginBottom: '6px', fontSize: '0.8rem' }}>
                          <strong>{s.file}</strong>: {s.issue}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Endpoint Tester */}
          {activeTab === 'tester' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 800, color: 'var(--secondary)' }}>
                  Server Endpoint Contract Verifier
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)' }}>
                  Test if an endpoint is registered on the Express server without external tools
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <select
                  value={testMethod}
                  onChange={(e) => setTestMethod(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--card-border)', fontSize: '0.85rem' }}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
                <input
                  type="text"
                  value={testPath}
                  onChange={(e) => setTestPath(e.target.value)}
                  placeholder="/api/merit/ranking"
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--card-border)', fontSize: '0.85rem' }}
                />
                <button
                  onClick={runRouteTest}
                  disabled={loadingTest || !testPath}
                  className="btn btn-primary"
                  style={{ padding: '8px 18px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                >
                  {loadingTest ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
                  Verify Route
                </button>
              </div>

              {testResult && (
                <div style={{
                  padding: '14px 16px',
                  borderRadius: '8px',
                  backgroundColor: testResult.success ? '#F0FDF4' : '#FEF2F2',
                  border: `1px solid ${testResult.success ? '#BBF7D0' : '#FECACA'}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    {testResult.success ? <CheckCircle size={18} color="#16A34A" /> : <XCircle size={18} color="#DC2626" />}
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: testResult.success ? '#166534' : '#991B1B' }}>
                      Status {testResult.status}: {testResult.diagnostics?.message}
                    </span>
                  </div>
                  {testResult.diagnostics?.recommendation && (
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#7F1D1D' }}>
                      Recommendation: {testResult.diagnostics.recommendation}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ padding: '12px 24px', borderTop: '1px solid var(--card-border)', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
            IEM DevForge Diagnostic Controller • Endpoint: <code>/api/diagnostics/locate-error</code>
          </span>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px 16px', fontSize: '0.82rem' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticsModal;

