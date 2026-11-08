import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc 
} from 'firebase/firestore';

/**
 * Service to store and retrieve student applications directly in Firebase Firestore.
 * Supports persistent local mirror fallback so data and verifications NEVER disappear on reload
 * even when the cloud database is still pending console creation.
 */

const COLLECTION_NAME = 'applications';
const LOCAL_STORAGE_KEY = 'iem_firestore_cached_apps';

const withTimeout = (promise, ms = 6000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Firestore operation timed out')), ms)
    )
  ]);
};

const getLocalCache = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

const setLocalCache = (cache) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cache));
  } catch (e) {}
};

export const firestoreService = {
  /**
   * Check if Firestore is provisioned and accessible for the project
   */
  async checkStatus() {
    if (!db) {
      return { 
        available: false, 
        message: 'Firebase SDK not initialized.',
        provisioningNeeded: true 
      };
    }
    try {
      const colRef = collection(db, COLLECTION_NAME);
      const snapshot = await withTimeout(getDocs(colRef), 5000);
      return {
        available: true,
        provisioningNeeded: false,
        count: snapshot.size,
        message: `Connected to Cloud Firestore (${snapshot.size} live cloud applications in '${COLLECTION_NAME}')`
      };
    } catch (err) {
      const cached = getLocalCache();
      const localCount = Object.keys(cached).length;
      const isNotFound = err?.message?.toLowerCase().includes('not-found') || err?.code === 'not-found';
      return {
        available: false,
        provisioningNeeded: isNotFound,
        count: localCount,
        error: err.message,
        message: isNotFound 
          ? 'Cloud Firestore database not yet provisioned in Firebase Console for project iem-admission. Local persistence active.'
          : `Firestore notice: ${err.message}. Local persistence active.`
      };
    }
  },

  /**
   * Save or update an application document in Firestore with immediate local cache
   */
  async saveApplication(application) {
    if (!application?.id) return { success: false, reason: 'Invalid application' };

    // 1. Immediately persist in local browser cache so it never vanishes on reload
    const cached = getLocalCache();
    cached[application.id] = {
      ...application,
      lastSyncedAt: new Date().toISOString()
    };
    setLocalCache(cached);

    // 2. Mirror to Cloud Firestore if connected
    if (db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, application.id);
        const payload = {
          ...application,
          lastSyncedAt: new Date().toISOString()
        };
        await withTimeout(setDoc(docRef, payload, { merge: true }), 2500);
        console.log(`🔥 [Firestore] Persisted application: ${application.id}`);
        return { success: true, id: application.id, cloud: true };
      } catch (err) {
        console.warn(`💾 [Local Persistence] Saved application ${application.id} locally (${err.message})`);
        return { success: true, id: application.id, cloud: false };
      }
    }
    return { success: true, id: application.id, cloud: false };
  },

  /**
   * Retrieve all applications from Firestore or local cache
   */
  async getAllApplications() {
    const cached = getLocalCache();
    const localApps = Object.values(cached);

    if (db) {
      try {
        const colRef = collection(db, COLLECTION_NAME);
        const snapshot = await withTimeout(getDocs(colRef), 5000);
        const applications = [];
        snapshot.forEach(docSnap => {
          const docData = docSnap.data();
          let parsedData = docData;
          if (docData.data && typeof docData.data === 'string') {
            try {
              parsedData = { ...JSON.parse(docData.data), ...docData };
            } catch (e) {}
          }
          applications.push({ ...parsedData, id: docSnap.id });
        });
        if (applications.length > 0) {
          // Update local cache with remote records
          const newCache = { ...cached };
          applications.forEach(a => { newCache[a.id] = a; });
          setLocalCache(newCache);
          return { success: true, count: applications.length, applications };
        }
      } catch (err) {
        console.warn('⚠️ [Firestore GetAll] Using local application records:', err.message);
      }
    }

    return {
      success: true,
      count: localApps.length,
      applications: localApps
    };
  },

  /**
   * Retrieve a specific application by its ID
   */
  async getApplicationById(id) {
    if (!id) return { success: false, application: null };

    // Check local cache first
    const cached = getLocalCache();
    if (cached[id]) {
      return { success: true, application: cached[id] };
    }

    if (db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await withTimeout(getDoc(docRef), 5000);
        if (docSnap.exists()) {
          const docData = docSnap.data();
          let parsedData = docData;
          if (docData.data && typeof docData.data === 'string') {
            try {
              parsedData = { ...JSON.parse(docData.data), ...docData };
            } catch (e) {}
          }
          const app = { ...parsedData, id: docSnap.id };
          cached[id] = app;
          setLocalCache(cached);
          return { success: true, application: app };
        }
      } catch (err) {
        console.warn(`⚠️ [Firestore GetById] Error:`, err.message);
      }
    }

    return { success: false, message: 'Application document not found' };
  },

  /**
   * Update lifecycle status or review notes in Firestore and local cache
   */
  async updateStatus(id, newStatus, historyEntry) {
    if (!id) return { success: false };

    // Update local cache
    const cached = getLocalCache();
    if (cached[id]) {
      cached[id].status = newStatus;
      cached[id].lastModified = new Date().toISOString();
      if (historyEntry) {
        cached[id].history = cached[id].history || [];
        cached[id].history.push(historyEntry);
      }
      setLocalCache(cached);
    }

    if (db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, id);
        const updateData = {
          status: newStatus,
          lastModified: new Date().toISOString()
        };
        if (historyEntry) {
          const docSnap = await withTimeout(getDoc(docRef), 2000);
          const existingHistory = docSnap.exists() ? docSnap.data().history || [] : [];
          updateData.history = [...existingHistory, historyEntry];
        }
        await withTimeout(updateDoc(docRef, updateData), 2500);
        return { success: true, cloud: true };
      } catch (err) {
        console.warn(`💾 [Local Persistence] Status updated locally for ${id}`);
        return { success: true, cloud: false };
      }
    }
    return { success: true, cloud: false };
  },

  /**
   * Seed / Sync batch of applications to Firestore and local cache
   */
  async syncBatch(applicationsList) {
    if (!Array.isArray(applicationsList)) return 0;
    let synced = 0;
    for (const app of applicationsList) {
      if (app?.id) {
        await this.saveApplication(app);
        synced++;
      }
    }
    return synced;
  }
};
