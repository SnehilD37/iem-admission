import { store } from '../data/initialStore.js';
import { calculatePcmAggregate } from '../utils/meritCalculator.js';
import { firebaseDb } from '../config/firebaseAdmin.js';

export const getMyApplication = (req, res) => {
  const userId = req.user?.uid || req.query.userId;
  const appId = req.query.appId;

  let application = null;
  if (appId) {
    application = store.applications.find(a => a.id === appId);
  }
  if (!application && userId) {
    application = store.applications.find(a => a.userId === userId);
  }

  if (!application) {
    return res.json({
      success: true,
      exists: false,
      application: null,
      message: 'No active application found for this account. Ready to start draft.'
    });
  }

  res.json({
    success: true,
    exists: true,
    application
  });
};

const DEPRECATED_ACADEMIC_FIELDS = ['overall12Percent'];
const stripDeprecatedAcademic = (academic) => {
  if (!academic || typeof academic !== 'object') return academic;
  const cleaned = { ...academic };
  DEPRECATED_ACADEMIC_FIELDS.forEach(f => delete cleaned[f]);
  return cleaned;
};

export const saveDraft = (req, res) => {
  const userId = req.user?.uid || req.body.userId || 'usr_draft_' + Date.now();
  const { personal, academic, preferences, documents, applicationId, id } = req.body;
  const incomingId = applicationId || id;
  const cleanAcademic = stripDeprecatedAcademic(academic);

  let application =
    (incomingId && store.applications.find(a => a.id === incomingId)) ||
    store.applications.find(a => a.userId === userId && a.status === 'DRAFT') ||
    store.applications.find(a => a.userId === userId);

  if (cleanAcademic?.physicsMarks && cleanAcademic?.chemistryMarks && cleanAcademic?.mathMarks) {
    cleanAcademic.pcmPercentage = calculatePcmAggregate(
      cleanAcademic.physicsMarks,
      cleanAcademic.chemistryMarks,
      cleanAcademic.mathMarks
    );
  }

  if (!application) {
    const draftId = (incomingId && !String(incomingId).startsWith('IEM-2026-DRAFT-'))
      ? incomingId
      : `IEM-2026-DRAFT-${Math.floor(1000 + Math.random() * 9000)}`;
    application = {
      id: draftId,
      userId,
      status: 'DRAFT',
      lastSaved: new Date().toISOString(),
      personal: personal || {},
      academic: cleanAcademic || {},
      preferences: preferences || [],
      documents: documents || {},
      queries: [],
      history: [{ timestamp: new Date().toISOString(), event: 'Draft created', actor: personal?.fullName || 'Applicant' }]
    };
    store.applications.push(application);
  } else {
    application.personal = { ...application.personal, ...personal };
    application.academic = stripDeprecatedAcademic({ ...application.academic, ...cleanAcademic });
    if (preferences) application.preferences = preferences;
    if (documents) application.documents = { ...application.documents, ...documents };
    application.lastSaved = new Date().toISOString();
  }

  store.save();

  if (firebaseDb) {
    try {
      const applicantName = application.personal?.fullName || '';
      const email = application.personal?.email || '';
      const phone = application.personal?.phone || '';
      const cleanApp = { ...application };
      delete cleanApp.data;
      firebaseDb.collection('applications').doc(application.id).set({
        ...cleanApp,
        applicantName,
        email,
        phone,
        data: JSON.stringify(cleanApp),
        lastSyncedAt: new Date().toISOString()
      }, { merge: true }).catch(() => {});
    } catch (e) {}
  }

  res.json({
    success: true,
    message: 'Application draft saved successfully',
    application
  });
};

export const submitApplication = (req, res) => {
  const userId = req.user?.uid || req.body.userId || 'usr_submitted_' + Date.now();
  const { personal, academic, preferences, documents, applicationId, id, allottedBranch, allotmentDate, status: existingStatus } = req.body;
  const incomingId = applicationId || id;
  const cleanAcademic = stripDeprecatedAcademic(academic);

  if (cleanAcademic?.physicsMarks && cleanAcademic?.chemistryMarks && cleanAcademic?.mathMarks) {
    cleanAcademic.pcmPercentage = calculatePcmAggregate(
      cleanAcademic.physicsMarks,
      cleanAcademic.chemistryMarks,
      cleanAcademic.mathMarks
    );
  }

  let application =
    (incomingId && store.applications.find(a => a.id === incomingId)) ||
    store.applications.find(a => a.userId === userId && a.id && !a.id.startsWith('IEM-2026-DRAFT-')) ||
    store.applications.find(a => a.userId === userId);

  const hasOfficialIncomingId = incomingId && !String(incomingId).startsWith('IEM-2026-DRAFT-');
  const hasOfficialExistingId = application?.id && !String(application.id).startsWith('IEM-2026-DRAFT-');
  const officialAppId = hasOfficialExistingId
    ? application.id
    : (hasOfficialIncomingId ? incomingId : `IEM-2026-${Math.floor(1300 + Math.random() * 8000)}`);

  const PRESERVED_STATUSES = ['VERIFIED_ELIGIBLE', 'SEAT_OFFERED', 'ADMISSION_CONFIRMED', 'UNDER_REVIEW', 'WAITLISTED'];

  if (!application) {
    const resolvedStatus = PRESERVED_STATUSES.includes(existingStatus) ? existingStatus : 'SUBMITTED';
    application = {
      id: officialAppId,
      userId,
      status: resolvedStatus,
      submissionDate: new Date().toISOString(),
      ...(allottedBranch ? { allottedBranch } : {}),
      ...(allotmentDate ? { allotmentDate } : {}),
      personal: personal || {},
      academic: cleanAcademic || {},
      preferences: preferences || ['CSE', 'IT', 'ECE'],
      documents: documents || {},
      queries: [],
      history: [
        { timestamp: new Date().toISOString(), event: 'Application Submitted', actor: personal?.fullName || 'Applicant' }
      ]
    };
    store.applications.push(application);
  } else {
    application.id = officialAppId;
    if (!PRESERVED_STATUSES.includes(application.status)) {
      application.status = PRESERVED_STATUSES.includes(existingStatus) ? existingStatus : 'SUBMITTED';
    }
    if (!application.submissionDate) {
      application.submissionDate = new Date().toISOString();
    }
    if (allottedBranch && !application.allottedBranch) application.allottedBranch = allottedBranch;
    if (allotmentDate && !application.allotmentDate) application.allotmentDate = allotmentDate;
    application.personal = { ...application.personal, ...personal };
    application.academic = stripDeprecatedAcademic({ ...application.academic, ...cleanAcademic });
    if (preferences) application.preferences = preferences;
    if (documents) application.documents = { ...application.documents, ...documents };
    application.history = application.history || [];
    application.history.push({
      timestamp: new Date().toISOString(),
      event: `Application updated and submitted as ${officialAppId}`,
      actor: personal?.fullName || application.personal?.fullName || 'Applicant'
    });
  }

  store.save();

  if (firebaseDb) {
    try {
      const applicantName = application.personal?.fullName || '';
      const email = application.personal?.email || '';
      const phone = application.personal?.phone || '';
      const cleanApp = { ...application };
      delete cleanApp.data;
      firebaseDb.collection('applications').doc(application.id).set({
        ...cleanApp,
        applicantName,
        email,
        phone,
        data: JSON.stringify(cleanApp),
        lastSyncedAt: new Date().toISOString()
      }, { merge: true }).catch(() => {});
    } catch (e) {}
  }

  res.status(201).json({
    success: true,
    message: 'Application submitted successfully! Application ID preserved/generated.',
    applicationId: application.id,
    application
  });
};

export const resolveQuery = (req, res) => {
  const { applicationId, queryId, responseText, reuploadedDocumentUrl, documentField } = req.body;

  const application = store.applications.find(a => a.id === applicationId);
  if (!application) {
    return res.status(404).json({ success: false, message: 'Application not found' });
  }

  const query = application.queries?.find(q => q.id === queryId) || application.queries?.[0];
  if (query) {
    query.status = 'RESOLVED_BY_STUDENT';
    query.responses = query.responses || [];
    query.responses.push({
      timestamp: new Date().toISOString(),
      responseText,
      reuploadedUrl: reuploadedDocumentUrl
    });
  }

  if (documentField && reuploadedDocumentUrl && application.documents?.[documentField]) {
    application.documents[documentField].url = reuploadedDocumentUrl;
    application.documents[documentField].flagged = false;
    application.documents[documentField].resolved = true;
  }

  // State machine transition back to UNDER_REVIEW
  application.status = 'UNDER_REVIEW';
  application.history.push({
    timestamp: new Date().toISOString(),
    event: `Student responded to query on ${documentField || 'discrepancy'}. Application returned to scrutiny queue.`,
    actor: application.personal?.fullName || 'Student'
  });

  store.save();

  res.json({
    success: true,
    message: 'Query response submitted successfully. Status updated to UNDER_REVIEW.',
    application
  });
};
