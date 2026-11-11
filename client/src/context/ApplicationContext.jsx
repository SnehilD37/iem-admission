import React, { createContext, useContext, useState, useEffect } from 'react';
import { applicationApi, adminApi, paymentApi, systemApi } from '../services/api';
import { firestoreService } from '../services/firestoreService';
import { useAuth } from './AuthContext';

const ApplicationContext = createContext(null);

export const ApplicationProvider = ({ children }) => {
  const { user, role } = useAuth();
  
  // Student state
  const [application, setApplication] = useState(null);
  const [loadingApp, setLoadingApp] = useState(false);
  const [feeSchedule, setFeeSchedule] = useState(null);

  // Admin state — loaded automatically from Cloud Firestore
  const [rawAdminApplications, setRawAdminApplications] = useState([]);
  const [adminApplications, setAdminApplications] = useState([]);
  const [adminFilters, setAdminFilters] = useState({ status: 'ALL', branch: 'ALL', search: '' });
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [adminStats, setAdminStats] = useState(null);

  const computeAdminStats = (apps, feeAmount = 85000) => {
    const list = Array.isArray(apps) ? apps : [];
    const quotas = {
      CSE: { name: 'Computer Science & Engineering', totalSeats: 120, allotted: 0, confirmed: 0 },
      'CSE-AIML': { name: 'CSE (AI & ML)', totalSeats: 60, allotted: 0, confirmed: 0 },
      IT: { name: 'Information Technology', totalSeats: 60, allotted: 0, confirmed: 0 },
      CSBS: { name: 'CS & Business Systems', totalSeats: 60, allotted: 0, confirmed: 0 },
      ECE: { name: 'Electronics & Comm. Engg.', totalSeats: 90, allotted: 0, confirmed: 0 }
    };

    list.forEach((app) => {
      const branch = app.allottedBranch;
      if (branch && quotas[branch]) {
        if (app.status === 'SEAT_OFFERED' || app.status === 'ADMISSION_CONFIRMED' || app.allottedBranch) {
          quotas[branch].allotted += 1;
        }
        if (app.status === 'ADMISSION_CONFIRMED') {
          quotas[branch].confirmed += 1;
        }
      }
    });

    const confirmedAdmissions = list.filter(a => a.status === 'ADMISSION_CONFIRMED').length;

    return {
      total: list.length,
      pendingScrutiny: list.filter(a => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW').length,
      activeQueries: list.filter(a => a.status === 'ACTION_REQUIRED').length,
      verifiedEligible: list.filter(a => a.status === 'VERIFIED_ELIGIBLE').length,
      seatOffered: list.filter(a => a.status === 'SEAT_OFFERED').length,
      confirmedAdmissions,
      totalFeesCollected: confirmedAdmissions * (feeSchedule?.totalAmount || feeAmount),
      quotas
    };
  };

  const applyAdminFilters = (apps, filters) => {
    let results = Array.isArray(apps) ? [...apps] : [];

    if (filters.status && filters.status !== 'ALL') {
      results = results.filter(a => a.status === filters.status);
    }

    if (filters.branch && filters.branch !== 'ALL') {
      results = results.filter(
        a => a.allottedBranch === filters.branch || (a.preferences && a.preferences.includes(filters.branch))
      );
    }

    if (filters.search && filters.search.trim() !== '') {
      const q = filters.search.toLowerCase().trim();
      results = results.filter(a =>
        String(a.id || '').toLowerCase().includes(q) ||
        String(a.personal?.fullName || a.applicantName || '').toLowerCase().includes(q) ||
        String(a.personal?.email || a.email || '').toLowerCase().includes(q) ||
        String(a.academic?.examRank || '').includes(q) ||
        String(a.academic?.examRoll || '').toLowerCase().includes(q)
      );
    }

    return results;
  };

  // Firebase Firestore Live Sync State
  const [firestoreStatus, setFirestoreStatus] = useState({
    available: false,
    count: 0,
    provisioningNeeded: false,
    message: 'Checking Firebase Firestore connectivity...'
  });
  const [syncingFirebase, setSyncingFirebase] = useState(false);

  // Notifications
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Fetch student application directly from Firebase Firestore (or backend when Firestore unavailable)
  const refreshStudentApplication = async () => {
    if (!user) return;
    setLoadingApp(true);
    try {
      // 1. Check Cloud Firebase Firestore directly by user.uid
      const fsUserRes = await firestoreService.getApplicationByUserId(user.uid);
      if (fsUserRes.success && fsUserRes.application) {
        setApplication(fsUserRes.application);
        setLoadingApp(false);
        return;
      }

      // Check by user.applicationId if present
      if (user.applicationId) {
        const fsIdRes = await firestoreService.getApplicationById(user.applicationId);
        if (fsIdRes.success && fsIdRes.application) {
          setApplication(fsIdRes.application);
          setLoadingApp(false);
          return;
        }
        // If Firestore responded authoritatively that neither uid nor applicationId exists, respect cloud state
        if (fsUserRes.cloudAuthoritative && fsIdRes.cloudAuthoritative) {
          setApplication(null);
          setLoadingApp(false);
          return;
        }
      } else if (fsUserRes.cloudAuthoritative) {
        // Firestore responded authoritatively with no application for this user
        setApplication(null);
        setLoadingApp(false);
        return;
      }

      // 2. Offline / non-authoritative fallback: check backend API
      try {
        const res = await applicationApi.getMyApplication(user.uid, user.applicationId);
        if (res.data?.success && res.data.exists && res.data.application) {
          setApplication(res.data.application);
          await firestoreService.saveApplication(res.data.application);
          return;
        }
      } catch (apiErr) {
        console.warn('Backend getMyApplication fallback notice:', apiErr.message);
      }

      // Final fallback: check all Firestore apps
      const fsAll = await firestoreService.getAllApplications();
      if (fsAll.success && fsAll.applications.length > 0) {
        const match = fsAll.applications.find(a => a.userId === user.uid || a.id === user.applicationId);
        if (match) {
          setApplication(match);
          return;
        }
      }
      setApplication(null);
    } catch (err) {
      console.error('Error fetching application:', err);
    } finally {
      setLoadingApp(false);
    }
  };

  // Fetch admin dashboard data directly & automatically from Firebase Firestore
  const refreshAdminData = async () => {
    setLoadingAdmin(true);
    try {
      const fsAppsRes = await firestoreService.getAllApplications();
      if (fsAppsRes.success && fsAppsRes.cloudAuthoritative) {
        try { localStorage.removeItem('iem_admin_applications'); } catch (e) {}
        const allApps = fsAppsRes.applications || [];
        setRawAdminApplications(allApps);
        setAdminStats(computeAdminStats(allApps));
        setAdminApplications(applyAdminFilters(allApps, adminFilters));
        setFirestoreStatus({
          available: true,
          provisioningNeeded: false,
          count: allApps.length,
          message: `Connected to Cloud Firestore (${allApps.length} records)`
        });
        return;
      }

      // Offline / unprovisioned fallback only if Cloud Firestore is unreachable
      const [statsRes, appsRes] = await Promise.all([
        adminApi.getDashboardStats().catch(() => ({ data: { success: false } })),
        adminApi.getApplications(adminFilters).catch(() => ({ data: { success: false } }))
      ]);

      const applications = appsRes.data?.success ? appsRes.data.applications : (fsAppsRes.applications || []);
      setRawAdminApplications(applications);
      setAdminApplications(applyAdminFilters(applications, adminFilters));
      if (statsRes.data?.success && statsRes.data.stats) {
        setAdminStats({ ...statsRes.data.stats, quotas: statsRes.data.quotas });
      } else {
        setAdminStats(computeAdminStats(applications));
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoadingAdmin(false);
    }
  };

  // Explicit sync helper (kept for compatibility)
  const syncAllToFirestore = async () => {
    setSyncingFirebase(true);
    try {
      const synced = await firestoreService.syncBatch(rawAdminApplications);
      const updatedStatus = await firestoreService.checkStatus();
      setFirestoreStatus(updatedStatus);
      showNotification(`🔥 Successfully synced ${synced} application records!`, 'success');
      refreshAdminData();
    } catch (err) {
      showNotification(`Firebase sync note: ${err.message}`, 'error');
    } finally {
      setSyncingFirebase(false);
    }
  };

  // Fetch fee schedule
  useEffect(() => {
    const fetchFee = async () => {
      try {
        const res = await paymentApi.getFeeSchedule();
        if (res.data.success) setFeeSchedule(res.data.feeSchedule);
      } catch (e) {
        console.error('Failed to fetch fee schedule:', e);
      }
    };
    fetchFee();
  }, []);

  // Automatic real-time Firestore subscription for Admin & automatic load for Student
  useEffect(() => {
    if (role === 'student' && user) {
      refreshStudentApplication();
      return;
    }

    if (role === 'admin' && user) {
      let active = true;
      setLoadingAdmin(true);
      try { localStorage.removeItem('iem_admin_applications'); } catch (e) {}

      const unsubscribe = firestoreService.subscribeAllApplications(
        (apps) => {
          if (!active) return;
          setRawAdminApplications(apps);
          setAdminStats(computeAdminStats(apps));
          setFirestoreStatus({
            available: true,
            provisioningNeeded: false,
            count: apps.length,
            message: `Connected to Cloud Firestore (${apps.length} records)`
          });
          setLoadingAdmin(false);
        },
        () => {
          if (active) refreshAdminData();
        }
      );

      return () => {
        active = false;
        unsubscribe();
      };
    }
  }, [user, role]);

  // Re-apply filters smoothly in memory whenever filters or live Firestore applications update
  useEffect(() => {
    if (role === 'admin') {
      setAdminApplications(applyAdminFilters(rawAdminApplications, adminFilters));
    }
  }, [rawAdminApplications, adminFilters, role]);

  const saveApplicationDraft = async (draftData) => {
    try {
      let savedApp = null;
      try {
        const res = await applicationApi.saveDraft({
          userId: user?.uid,
          applicationId: application?.id,
          ...draftData
        });
        if (res.data?.success) {
          savedApp = res.data.application;
        }
      } catch (apiErr) {
        console.warn('Backend draft save unavailable, saving directly to Firestore:', apiErr.message);
      }

      if (!savedApp) {
        const draftId = application?.id || `IEM-2026-DRAFT-${Math.floor(1000 + Math.random() * 9000)}`;
        savedApp = {
          ...(application || {}),
          id: draftId,
          userId: user?.uid || application?.userId || '',
          status: application?.status || 'DRAFT',
          lastSaved: new Date().toISOString(),
          personal: { ...(application?.personal || {}), ...(draftData.personal || {}) },
          academic: { ...(application?.academic || {}), ...(draftData.academic || {}) },
          preferences: draftData.preferences || application?.preferences || [],
          documents: { ...(application?.documents || {}), ...(draftData.documents || {}) },
          queries: application?.queries || [],
          history: [
            ...(application?.history || []),
            { timestamp: new Date().toISOString(), event: 'Draft saved', actor: draftData.personal?.fullName || user?.name || 'Applicant' }
          ]
        };
      }

      setApplication(savedApp);
      const fsRes = await firestoreService.saveApplication(savedApp);
      if (fsRes.cloud) {
        showNotification('Draft saved to Firebase Firestore! You can resume anytime.', 'success');
      } else {
        showNotification(`Draft saved locally, but Cloud Firestore sync failed: ${fsRes.error || 'Unknown error'}`, 'error');
      }
      return savedApp;
    } catch (err) {
      showNotification('Failed to save draft: ' + err.message, 'error');
      throw err;
    }
  };

  const submitApplication = async (formData) => {
    try {
      let submittedApp = null;
      try {
        const res = await applicationApi.submitApplication({
          userId: user?.uid,
          applicationId: application?.id,
          status: application?.status,
          allottedBranch: application?.allottedBranch,
          allotmentDate: application?.allotmentDate,
          ...formData
        });
        if (res.data?.success) {
          submittedApp = res.data.application;
        }
      } catch (apiErr) {
        console.warn('Backend submit unavailable, submitting directly to Firestore:', apiErr.message);
      }

      if (!submittedApp) {
        const hasOfficialId = application?.id && !String(application.id).startsWith('IEM-2026-DRAFT-');
        const officialAppId = hasOfficialId
          ? application.id
          : `IEM-2026-${Math.floor(1300 + Math.random() * 8000)}`;
        const preservedStatuses = ['VERIFIED_ELIGIBLE', 'SEAT_OFFERED', 'ADMISSION_CONFIRMED', 'UNDER_REVIEW', 'WAITLISTED'];
        const nextStatus = preservedStatuses.includes(application?.status) ? application.status : 'SUBMITTED';

        submittedApp = {
          ...(application || {}),
          id: officialAppId,
          userId: user?.uid || application?.userId || '',
          status: nextStatus,
          submissionDate: application?.submissionDate || new Date().toISOString(),
          personal: { ...(application?.personal || {}), ...(formData.personal || {}) },
          academic: { ...(application?.academic || {}), ...(formData.academic || {}) },
          preferences: formData.preferences || application?.preferences || ['CSE', 'IT', 'ECE'],
          documents: { ...(application?.documents || {}), ...(formData.documents || {}) },
          queries: application?.queries || [],
          history: [
            ...(application?.history || []),
            {
              timestamp: new Date().toISOString(),
              event: `Application submitted as ${officialAppId}`,
              actor: formData.personal?.fullName || user?.name || 'Applicant'
            }
          ]
        };
      }

      setApplication(submittedApp);

      // Await Cloud Firestore write so any sync/size/permission error is surfaced immediately
      const fsRes = await firestoreService.saveApplication(submittedApp);
      if (!fsRes.cloud) {
        const errMsg = `Saved locally, but Cloud Firestore sync failed: ${fsRes.error || 'Unknown error'}`;
        showNotification(errMsg, 'error');
        throw new Error(errMsg);
      }

      showNotification('🎉 Application submitted & saved to Firebase! ID: ' + submittedApp.id, 'success');
      return submittedApp;
    } catch (err) {
      showNotification('Submission error: ' + err.message, 'error');
      throw err;
    }
  };

  const resolveQuery = async (queryPayload) => {
    try {
      const res = await applicationApi.resolveQuery(queryPayload);
      if (res.data.success) {
        const updatedApp = res.data.application;
        setApplication(updatedApp);
        // Store updated application query response in Firebase Firestore
        const fsRes = await firestoreService.saveApplication(updatedApp);
        if (!fsRes.cloud) {
          showNotification(`Response saved locally, but Cloud Firestore sync failed: ${fsRes.error || 'Unknown error'}`, 'error');
        } else {
          showNotification('Response submitted! Your application is back in the review queue.', 'success');
        }
        return updatedApp;
      }
    } catch (err) {
      showNotification('Query resolution error: ' + err.message, 'error');
      throw err;
    }
  };

  // Admin: Update candidate data, allotment status & branch directly in Firebase Firestore
  const updateCandidateDataByAdmin = async (applicationId, updatePayload) => {
    try {
      const current =
        rawAdminApplications.find(a => a.id === applicationId) ||
        adminApplications.find(a => a.id === applicationId) ||
        {};

      try {
        await adminApi.updateApplicationData(applicationId, {
          ...updatePayload,
          officerName: user?.name || 'Scrutiny Officer'
        });
      } catch (apiErr) {
        console.warn('Backend update notice:', apiErr.message);
      }

      const nextBranch = updatePayload.allottedBranch === undefined
        ? (current.allottedBranch || null)
        : (updatePayload.allottedBranch || null);

      const updatedApp = {
        ...current,
        ...updatePayload,
        id: applicationId,
        allottedBranch: nextBranch,
        allotmentDate: nextBranch ? (current.allotmentDate || new Date().toISOString()) : null,
        personal: { ...(current.personal || {}), ...(updatePayload.personal || {}) },
        academic: { ...(current.academic || {}), ...(updatePayload.academic || {}) },
        history: [
          ...(current.history || []),
          {
            timestamp: new Date().toISOString(),
            event: `Candidate data & allotment updated by Admin (${user?.name || 'Scrutiny Officer'})${updatePayload.note ? `: ${updatePayload.note}` : ''}`,
            actor: user?.name || 'Scrutiny Officer'
          }
        ]
      };

      // Persist directly into Cloud Firebase Firestore and verify cloud write
      const fsRes = await firestoreService.saveApplication(updatedApp);
      if (!fsRes.cloud) {
        const errMsg = `Could not save to Firebase Firestore: ${fsRes.error || 'Unknown error'}`;
        showNotification(errMsg, 'error');
        throw new Error(errMsg);
      }

      // Update live admin state immediately
      const updatedRaw = rawAdminApplications.some(a => a.id === applicationId)
        ? rawAdminApplications.map(a => (a.id === applicationId ? updatedApp : a))
        : [updatedApp, ...rawAdminApplications];
      setRawAdminApplications(updatedRaw);
      setAdminStats(computeAdminStats(updatedRaw));
      setAdminApplications(applyAdminFilters(updatedRaw, adminFilters));

      // If active student application matches, update it too
      if (application && application.id === applicationId) {
        setApplication(updatedApp);
      }

      showNotification(`✅ Candidate ${applicationId} updated & saved to Firebase!`, 'success');
      return updatedApp;
    } catch (err) {
      showNotification('Update error: ' + err.message, 'error');
      throw err;
    }
  };

  const resetAllDemoData = async () => {
    try {
      try {
        localStorage.removeItem('iem_admin_applications');
        localStorage.removeItem('iem_firestore_cached_apps');
      } catch (e) {}
      await systemApi.resetDemoData();
      showNotification('Demo store reset to initial seed state', 'success');
      if (role === 'admin') refreshAdminData();
      else refreshStudentApplication();
    } catch (err) {
      showNotification('Reset error: ' + err.message, 'error');
    }
  };

  return (
    <ApplicationContext.Provider
      value={{
        application,
        setApplication,
        loadingApp,
        feeSchedule,
        refreshStudentApplication,
        saveApplicationDraft,
        submitApplication,
        resolveQuery,
        adminStats,
        adminApplications,
        adminFilters,
        setAdminFilters,
        loadingAdmin,
        refreshAdminData,
        notification,
        showNotification,
        resetAllDemoData,
        firestoreStatus,
        syncingFirebase,
        syncAllToFirestore,
        updateCandidateDataByAdmin
      }}
    >
      {children}
    </ApplicationContext.Provider>
  );
};

export const useApplication = () => {
  const context = useContext(ApplicationContext);
  if (!context) throw new Error('useApplication must be used within an ApplicationProvider');
  return context;
};
