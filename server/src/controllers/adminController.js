import { store, BRANCH_QUOTAS } from '../data/initialStore.js';
import { calculatePcmAggregate } from '../utils/meritCalculator.js';
import { firebaseDb } from '../config/firebaseAdmin.js';

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

export const updateApplicationData = async (req, res) => {
  const { id } = req.params;
  const { personal, academic, allottedBranch, status, preferences, note, officerName } = req.body;

  const application = store.applications.find(a => a.id === id);
  if (!application) {
    return res.status(404).json({ success: false, message: 'Application record not found' });
  }

  // Handle branch change / initial allotment / clearing allotment
  if (allottedBranch !== undefined && allottedBranch !== application.allottedBranch) {
    const oldBranch = application.allottedBranch;
    application.allottedBranch = allottedBranch || null;
    if (allottedBranch && !application.allotmentDate) {
      application.allotmentDate = new Date().toISOString();
    } else if (!allottedBranch) {
      application.allotmentDate = null;
    }
    // Update quotas
    if (allottedBranch && store.quotas[allottedBranch]) {
      store.quotas[allottedBranch].allotted = (store.quotas[allottedBranch].allotted || 0) + 1;
    }
    if (oldBranch && store.quotas[oldBranch] && store.quotas[oldBranch].allotted > 0) {
      store.quotas[oldBranch].allotted -= 1;
    }
  }

  // Update personal details
  if (personal) {
    application.personal = { ...application.personal, ...personal };
  }

  // Update academic details
  if (academic) {
    if (academic.physicsMarks && academic.chemistryMarks && academic.mathMarks) {
      academic.pcmPercentage = calculatePcmAggregate(
        academic.physicsMarks,
        academic.chemistryMarks,
        academic.mathMarks
      );
    }
    application.academic = { ...application.academic, ...academic };
  }

  // Update status if provided
  if (status) {
    application.status = status;
  }

  // Update preferences if provided
  if (preferences) {
    application.preferences = preferences;
  }

  const actor = officerName || req.user?.name || 'Scrutiny Officer';
  application.history = application.history || [];
  application.history.push({
    timestamp: new Date().toISOString(),
    event: `Candidate profile & branch allotment updated by Admin (${actor})${note ? `: ${note}` : ''}`,
    actor
  });

  store.save();

  // Also sync to Cloud Firestore if initialized
  if (firebaseDb) {
    try {
      const applicantName = application.personal?.fullName || '';
      const email = application.personal?.email || '';
      const phone = application.personal?.phone || '';
      const cleanApp = { ...application };
      delete cleanApp.data;
      await firebaseDb.collection('applications').doc(application.id).set({
        ...cleanApp,
        applicantName,
        email,
        phone,
        data: JSON.stringify(cleanApp),
        lastSyncedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      // safe ignore if cloud credentials not present in this process
    }
  }

  res.json({
    success: true,
    message: 'Candidate data successfully updated in database and admissions roster',
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
