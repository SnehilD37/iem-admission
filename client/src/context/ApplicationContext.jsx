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

  // Admin state
  // Admin state with localStorage persistence
  const [adminApplications, setAdminApplications] = useState(() => {
    try {
      const saved = localStorage.getItem('iem_admin_applications');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [adminFilters, setAdminFilters] = useState({ status: 'ALL', branch: 'ALL', search: '' });
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [adminStats, setAdminStats] = useState(null);

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

  // Fetch student application whenever user or role changes
  const refreshStudentApplication = async () => {
    if (!user) return;
    setLoadingApp(true);
    try {
      const res = await applicationApi.getMyApplication(user.uid, user.applicationId);
      if (res.data.success && res.data.exists) {
        setApplication(res.data.application);
      } else {
        // Fallback: check Firebase Firestore directly
        const fsRes = await firestoreService.getAllApplications();
        if (fsRes.success && fsRes.applications.length > 0) {
          const userApp = fsRes.applications.find(a => a.userId === user.uid || a.id === user.applicationId);
          if (userApp) {
            setApplication(userApp);
            return;
          }
        }
        setApplication(null);
      }
    } catch (err) {
      console.error('Error fetching application:', err);
    } finally {
      setLoadingApp(false);
    }
  };

  // Fetch admin dashboard data & synchronize with Firebase Firestore
  const refreshAdminData = async () => {
    setLoadingAdmin(true);
    try {
      const [statsRes, appsRes] = await Promise.all([
        adminApi.getDashboardStats().catch(() => ({ data: { success: false } })),
        adminApi.getApplications(adminFilters).catch(() => ({ data: { success: false } }))
      ]);

      let applications = appsRes.data?.success ? appsRes.data.applications : [];
      let stats = statsRes.data?.success ? statsRes.data.stats : null;

      // Merge with locally stored applications so that verification actions, queries, etc. NEVER vanish on reload
      try {
        const local = localStorage.getItem('iem_admin_applications');
        if (local) {
          const localApps = JSON.parse(local);
          const localMap = new Map(localApps.map(a => [a.id, a]));
          // Prefer local status if local has updated status or history
          applications = applications.map(app => {
            const loc = localMap.get(app.id);
            if (loc && ((loc.history?.length || 0) >= (app.history?.length || 0) || loc.status !== 'SUBMITTED')) {
              return loc;
            }
            return app;
          });
          // Also bring in any applications that exist locally
          localApps.forEach(loc => {
            if (!applications.some(a => a.id === loc.id)) {
              applications.unshift(loc);
            }
          });
        }
      } catch (e) {}

      // Check live Cloud Firestore status
      const fsStatus = await firestoreService.checkStatus();
      setFirestoreStatus(fsStatus);

      if (fsStatus.available) {
        const fsAppsRes = await firestoreService.getAllApplications();
        if (fsAppsRes.success && fsAppsRes.applications.length > 0) {
          // Merge Firebase Firestore records
          const fsMap = new Map(fsAppsRes.applications.map(a => [a.id, a]));
          applications = applications.map(app => fsMap.get(app.id) || app);
          fsAppsRes.applications.forEach(fsApp => {
            if (!applications.some(a => a.id === fsApp.id)) {
              applications.unshift(fsApp);
            }
          });
        }
      }

      // Persist merged roster to localStorage so page reloads never lose verification records
      try {
        localStorage.setItem('iem_admin_applications', JSON.stringify(applications));
      } catch (e) {}

      // Update total applicants count to reflect actual merged applications
      if (stats) {
        stats.total = applications.length;
        setAdminStats(stats);
      }
      setAdminApplications(applications);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoadingAdmin(false);
    }
  };

  // Explicit sync of all applications to Firebase Firestore
  const syncAllToFirestore = async () => {
    setSyncingFirebase(true);
    try {
      const synced = await firestoreService.syncBatch(adminApplications);
      const updatedStatus = await firestoreService.checkStatus();
      setFirestoreStatus(updatedStatus);
      showNotification(`🔥 Successfully synced ${synced} application records! Verification and status preserved permanently.`, 'success');
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

  useEffect(() => {
    if (role === 'student' && user) {
      refreshStudentApplication();
    } else if (role === 'admin') {
      refreshAdminData();
    }
  }, [user, role, adminFilters]);

  const saveApplicationDraft = async (draftData) => {
    try {
      const res = await applicationApi.saveDraft({
        userId: user?.uid,
        ...draftData
      });
      if (res.data.success) {
        const savedApp = res.data.application;
        setApplication(savedApp);
        // Persist draft into Firebase Firestore
        firestoreService.saveApplication(savedApp).catch(e => {
          console.warn('Could not mirror draft to Firestore:', e.message);
        });
        showNotification('Draft saved successfully! You can resume anytime.', 'success');
        return savedApp;
      }
    } catch (err) {
      showNotification('Failed to save draft: ' + err.message, 'error');
      throw err;
    }
  };

  const submitApplication = async (formData) => {
    try {
      const res = await applicationApi.submitApplication({
        userId: user?.uid,
        ...formData
      });
      if (res.data.success) {
        const submittedApp = res.data.application;
        setApplication(submittedApp);
        // Store student application directly into Firebase Firestore
        firestoreService.saveApplication(submittedApp).catch(e => {
          console.warn('Could not mirror submission to Firestore:', e.message);
        });
        showNotification('🎉 Application submitted successfully! Application ID: ' + res.data.applicationId, 'success');
        return submittedApp;
      }
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
        firestoreService.saveApplication(updatedApp).catch(e => {
          console.warn('Could not mirror query response to Firestore:', e.message);
        });
        showNotification('Response submitted! Your application is back in the review queue.', 'success');
        return updatedApp;
      }
    } catch (err) {
      showNotification('Query resolution error: ' + err.message, 'error');
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
        syncAllToFirestore
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
