import { store } from '../data/initialStore.js';
import { calculatePcmAggregate } from '../utils/meritCalculator.js';

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

export const saveDraft = (req, res) => {
  const userId = req.user?.uid || req.body.userId || 'usr_draft_' + Date.now();
  const { personal, academic, preferences, documents } = req.body;

  let application = store.applications.find(a => a.userId === userId && a.status === 'DRAFT');

  if (academic?.physicsMarks && academic?.chemistryMarks && academic?.mathMarks) {
    academic.pcmPercentage = calculatePcmAggregate(
      academic.physicsMarks,
      academic.chemistryMarks,
      academic.mathMarks
    );
  }

  if (!application) {
    const draftId = `IEM-2026-DRAFT-${Math.floor(1000 + Math.random() * 9000)}`;
    application = {
      id: draftId,
      userId,
      status: 'DRAFT',
      lastSaved: new Date().toISOString(),
      personal: personal || {},
      academic: academic || {},
      preferences: preferences || [],
      documents: documents || {},
      queries: [],
      history: [{ timestamp: new Date().toISOString(), event: 'Draft created', actor: personal?.fullName || 'Applicant' }]
    };
    store.applications.push(application);
  } else {
    application.personal = { ...application.personal, ...personal };
    application.academic = { ...application.academic, ...academic };
    if (preferences) application.preferences = preferences;
    if (documents) application.documents = { ...application.documents, ...documents };
    application.lastSaved = new Date().toISOString();
  }

  store.save();

  res.json({
    success: true,
    message: 'Application draft saved successfully',
    application
  });
};

export const submitApplication = (req, res) => {
  const userId = req.user?.uid || req.body.userId || 'usr_submitted_' + Date.now();
  const { personal, academic, preferences, documents } = req.body;

  if (academic?.physicsMarks && academic?.chemistryMarks && academic?.mathMarks) {
    academic.pcmPercentage = calculatePcmAggregate(
      academic.physicsMarks,
      academic.chemistryMarks,
      academic.mathMarks
    );
  }

  let application = store.applications.find(a => a.userId === userId);

  const officialAppId = `IEM-2026-${Math.floor(1300 + Math.random() * 8000)}`;

  if (!application) {
    application = {
      id: officialAppId,
      userId,
      status: 'SUBMITTED',
      submissionDate: new Date().toISOString(),
      personal: personal || {},
      academic: academic || {},
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
    application.status = 'SUBMITTED';
    application.submissionDate = new Date().toISOString();
    application.personal = { ...application.personal, ...personal };
    application.academic = { ...application.academic, ...academic };
    if (preferences) application.preferences = preferences;
    if (documents) application.documents = { ...application.documents, ...documents };
    application.history.push({
      timestamp: new Date().toISOString(),
      event: `Application officially finalized and submitted as ${officialAppId}`,
      actor: personal?.fullName || application.personal?.fullName || 'Applicant'
    });
  }

  store.save();

  res.status(201).json({
    success: true,
    message: 'Application submitted successfully! Application ID generated.',
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
