import { store, BRANCH_QUOTAS } from '../data/initialStore.js';

export const getDashboardStats = (req, res) => {
  const apps = store.applications;
  const total = apps.length;
  const pendingScrutiny = apps.filter(a => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW').length;
  const activeQueries = apps.filter(a => a.status === 'ACTION_REQUIRED').length;
  const verifiedEligible = apps.filter(a => a.status === 'VERIFIED_ELIGIBLE').length;
  const seatOffered = apps.filter(a => a.status === 'SEAT_OFFERED').length;
  const confirmedAdmissions = apps.filter(a => a.status === 'ADMISSION_CONFIRMED').length;
  const totalFeesCollected = confirmedAdmissions * store.feeSchedule.totalAmount;

  res.json({
    success: true,
    stats: {
      total,
      pendingScrutiny,
      activeQueries,
      verifiedEligible,
      seatOffered,
      confirmedAdmissions,
      totalFeesCollected
    },
    quotas: store.quotas
  });
};

export const getAllApplications = (req, res) => {
  const { status, branch, search } = req.query;
  let results = [...store.applications];

  if (status && status !== 'ALL') {
    results = results.filter(a => a.status === status);
  }

  if (branch && branch !== 'ALL') {
    results = results.filter(a => 
      a.allottedBranch === branch || 
      (a.preferences && a.preferences.includes(branch))
    );
  }

  if (search && search.trim() !== '') {
    const q = search.toLowerCase().trim();
    results = results.filter(a => 
      a.id.toLowerCase().includes(q) ||
      a.personal?.fullName?.toLowerCase().includes(q) ||
      a.personal?.email?.toLowerCase().includes(q) ||
      String(a.academic?.examRank).includes(q) ||
      a.academic?.examRoll?.toLowerCase().includes(q)
    );
  }

  res.json({
    success: true,
    count: results.length,
    applications: results
  });
};

export const getApplicationById = (req, res) => {
  const { id } = req.params;
  const application = store.applications.find(a => a.id === id);

  if (!application) {
    return res.status(404).json({ success: false, message: 'Application record not found' });
  }

  res.json({
    success: true,
    application
  });
};

export const updateApplicationStatus = (req, res) => {
  const { id } = req.params;
  const { status, note, officerName } = req.body;

  const application = store.applications.find(a => a.id === id);
  if (!application) {
    return res.status(404).json({ success: false, message: 'Application record not found' });
  }

  const previousStatus = application.status;
  application.status = status;
  application.history.push({
    timestamp: new Date().toISOString(),
    event: `Status transitioned from ${previousStatus} to ${status}${note ? `: ${note}` : ''}`,
    actor: officerName || req.user?.name || 'Admission Officer'
  });

  store.save();

  res.json({
    success: true,
    message: `Application status updated to ${status}`,
    application
  });
};

export const raiseDiscrepancyQuery = (req, res) => {
  const { id } = req.params;
  const { documentField, message, officerName } = req.body;

  const application = store.applications.find(a => a.id === id);
  if (!application) {
    return res.status(404).json({ success: false, message: 'Application record not found' });
  }

  const queryId = `qry_${Date.now()}`;
  const query = {
    id: queryId,
    field: documentField || 'Class 12 Marksheet',
    officer: officerName || req.user?.name || 'Scrutiny Officer',
    message: message || 'Discrepancy identified in uploaded academic document.',
    timestamp: new Date().toISOString(),
    status: 'PENDING_STUDENT_RESPONSE',
    responses: []
  };

  application.queries = application.queries || [];
  application.queries.push(query);

  if (documentField && application.documents?.[documentField]) {
    application.documents[documentField].flagged = true;
    application.documents[documentField].verified = false;
  }

  application.status = 'ACTION_REQUIRED';
  application.history.push({
    timestamp: new Date().toISOString(),
    event: `Discrepancy Query raised regarding ${documentField}: "${message}"`,
    actor: officerName || req.user?.name || 'Scrutiny Officer'
  });

  store.save();

  res.json({
    success: true,
    message: 'Discrepancy query successfully dispatched to candidate portal',
    application
  });
};

export const offerSeat = (req, res) => {
  const { id } = req.params;
  const { branch, round, officerName } = req.body;

  const application = store.applications.find(a => a.id === id);
  if (!application) {
    return res.status(404).json({ success: false, message: 'Application record not found' });
  }

  const allocatedBranch = branch || application.preferences?.[0] || 'CSE';
  application.allottedBranch = allocatedBranch;
  application.allotmentDate = new Date().toISOString();
  application.status = 'SEAT_OFFERED';

  // Update capacity count in quotas
  if (store.quotas[allocatedBranch]) {
    store.quotas[allocatedBranch].allotted = (store.quotas[allocatedBranch].allotted || 0) + 1;
  }

  application.history.push({
    timestamp: new Date().toISOString(),
    event: `Provisional Seat Offered in ${allocatedBranch} (${round || 'Round 1'}). Fee settlement window opened.`,
    actor: officerName || req.user?.name || 'Central Allotment Engine'
  });

  store.save();

  res.json({
    success: true,
    message: `Seat offered in ${allocatedBranch} successfully!`,
    application
  });
};

export const exportRoster = (req, res) => {
  const headers = ['Application_ID', 'Candidate_Name', 'Email', 'Phone', 'Exam_Type', 'Exam_Rank', 'PCM_Percentage', 'Allotted_Branch', 'Status', 'Fee_Status', 'Submission_Date'];
  
  const rows = store.applications.map(app => [
    `"${app.id}"`,
    `"${app.personal?.fullName || ''}"`,
    `"${app.personal?.email || ''}"`,
    `"${app.personal?.phone || ''}"`,
    `"${app.academic?.examType || 'WBJEE'}"`,
    app.academic?.examRank || '',
    app.academic?.pcmPercentage || '',
    `"${app.allottedBranch || 'None'}"`,
    `"${app.status}"`,
    `"${app.payment?.status || (app.status === 'ADMISSION_CONFIRMED' ? 'PAID' : 'PENDING')}"`,
    `"${app.submissionDate || ''}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="IEM_Admissions_Roster_2026.csv"');
  res.status(200).send(csvContent);
};
