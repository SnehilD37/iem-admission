import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc,
  deleteField,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';

/**
 * Service to store and retrieve student applications directly in Firebase Firestore.
 * Supports persistent local mirror fallback so data and verifications NEVER disappear on reload
 * even when the cloud database is still pending console creation.
 */

const COLLECTION_NAME = 'applications';
const LOCAL_STORAGE_KEY = 'iem_firestore_cached_apps';

// Fields that were written by seed data but do NOT exist in the admission form
const DEPRECATED_ACADEMIC_FIELDS = ['overall12Percent'];

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

/**
 * Normalizes a Firestore document snapshot into a complete Application object
 */
const parseFirestoreDoc = (docSnap) => {
  if (!docSnap.exists()) return null;
  const docData = docSnap.data();
  let baseData = {};
  if (docData.data && typeof docData.data === 'string') {
    try {
      baseData = JSON.parse(docData.data);
      // Strip deprecated fields from the parsed data blob too
      if (baseData.academic) {
        DEPRECATED_ACADEMIC_FIELDS.forEach(f => delete baseData.academic[f]);
      }
    } catch (e) {}
  }

  const merged = {
    ...baseData,
    ...docData,
    id: docSnap.id
  };

  // Reconstitute personal information structure if only top-level fields were written
  merged.personal = {
    ...(baseData.personal || {}),
    ...(docData.personal || {}),
    fullName: docData.applicantName || docData.personal?.fullName || baseData.personal?.fullName || '',
    email: docData.email || docData.personal?.email || baseData.personal?.email || '',
    phone: docData.phone || docData.personal?.phone || baseData.personal?.phone || ''
  };

  merged.academic = {
    ...(baseData.academic || {}),
    ...(docData.academic || {})
  };
  // Strip deprecated fields not present in the admission form
  delete merged.academic.overall12Percent;

  merged.applicantName = merged.personal.fullName;
  merged.email = merged.personal.email;
  merged.phone = merged.personal.phone;

  return merged;
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
   * Save or update an application document in Firestore for a user with immediate local cache
   */
  async saveApplication(application) {
    if (!application?.id) return { success: false, reason: 'Invalid application' };

    const applicantName = application.personal?.fullName || application.applicantName || 'Applicant';
    const email = application.personal?.email || application.email || '';
    const phone = application.personal?.phone || application.phone || '';
    const userId = application.userId || '';
    const status = application.status || 'DRAFT';
    const submissionDate = application.submissionDate || new Date().toISOString();
    const allottedBranch = application.allottedBranch || null;
    const allotmentDate = application.allotmentDate || null;

    // Clean application object to avoid redundant nested stringification & undefined values
    const stripUndefined = (obj) => JSON.parse(JSON.stringify(obj));
    const cleanApp = stripUndefined({ ...application });
    delete cleanApp.data;

    // Strip deprecated academic fields not in the admission form
    if (cleanApp.academic) {
      DEPRECATED_ACADEMIC_FIELDS.forEach(f => delete cleanApp.academic[f]);
    }

    // Build compact copy for legacy `data` field without duplicating large base64 data URLs
    const compactForData = { ...cleanApp };
    if (compactForData.documents && typeof compactForData.documents === 'object') {
      const compactDocs = {};
      for (const [k, v] of Object.entries(compactForData.documents)) {
        if (v && typeof v === 'object') {
          compactDocs[k] = {
            ...v,
            url: typeof v.url === 'string' && v.url.startsWith('data:') ? '[stored-in-documents]' : v.url
          };
        } else {
          compactDocs[k] = v;
        }
      }
      compactForData.documents = compactDocs;
    }

    // Canonical schema mirroring Firebase Firestore console
    const payload = stripUndefined({
      ...cleanApp,
      id: application.id,
      userId,
      applicantName,
      email,
      phone,
      status,
      submissionDate,
      allottedBranch,
      allotmentDate,
      data: JSON.stringify(compactForData),
      lastSyncedAt: new Date().toISOString()
    });

    // 1. Immediately persist in local browser cache so it never vanishes on reload
    const cached = getLocalCache();
    cached[application.id] = {
      ...payload,
      personal: cleanApp.personal,
      academic: cleanApp.academic
    };
    setLocalCache(cached);

    // 2. Mirror to Cloud Firestore
    if (db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, application.id);
        await withTimeout(setDoc(docRef, payload, { merge: true }), 10000);
        // Remove any deprecated fields still lingering in the Firestore document
        try {
          const fieldDeletions = {};
          DEPRECATED_ACADEMIC_FIELDS.forEach(f => {
            fieldDeletions[`academic.${f}`] = deleteField();
          });
          await updateDoc(docRef, fieldDeletions);
        } catch (_) { /* best-effort cleanup */ }
        console.log(`🔥 [Firestore] Persisted application to Cloud: ${application.id} for user: ${userId}`);
        return { success: true, id: application.id, cloud: true };
      } catch (err) {
        console.warn(`💾 [Local Persistence] Cloud Firestore save failed for ${application.id}:`, err.message);
        return { success: true, id: application.id, cloud: false, error: err.message };
      }
    }
    return { success: true, id: application.id, cloud: false, error: 'Firebase Firestore client is not initialized.' };
  },

  /**
   * Retrieve all applications from Cloud Firestore first, falling back to local cache only when offline
   */
  async getAllApplications() {
    const cached = getLocalCache();
    const localApps = Object.values(cached);

    if (db) {
      try {
        const colRef = collection(db, COLLECTION_NAME);
        const snapshot = await withTimeout(getDocs(colRef), 6000);
        const applications = [];
        snapshot.forEach(docSnap => {
          const app = parseFirestoreDoc(docSnap);
          if (app) applications.push(app);
        });
        // Reconcile local cache directly with Cloud Firestore state (so deleted cloud docs stay gone)
        const newCache = {};
        applications.forEach(a => { newCache[a.id] = a; });
        setLocalCache(newCache);
        return { success: true, count: applications.length, applications, cloudAuthoritative: true };
      } catch (err) {
        console.warn('⚠️ [Firestore GetAll] Using local application records:', err.message);
      }
    }

    return {
      success: true,
      count: localApps.length,
      applications: localApps,
      cloudAuthoritative: false
    };
  },

  /**
   * Retrieve a specific application by its ID (Cloud Firestore first, cache fallback on error)
   */
  async getApplicationById(id) {
    if (!id) return { success: false, application: null };
    const cached = getLocalCache();

    if (db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await withTimeout(getDoc(docRef), 5000);
        if (docSnap.exists()) {
          const app = parseFirestoreDoc(docSnap);
          cached[id] = app;
          setLocalCache(cached);
          return { success: true, application: app, cloudAuthoritative: true };
        }
        // Authoritative miss: remove stale cache copy if deleted in Firebase Console
        if (cached[id]) {
          delete cached[id];
          setLocalCache(cached);
        }
        return { success: false, application: null, message: 'Application document not found', cloudAuthoritative: true };
      } catch (err) {
        console.warn(`⚠️ [Firestore GetById] Error, checking local cache:`, err.message);
      }
    }

    if (cached[id]) {
      return { success: true, application: cached[id], cloudAuthoritative: false };
    }

    return { success: false, application: null, message: 'Application document not found', cloudAuthoritative: false };
  },

  /**
   * Retrieve an application for a specific user ID (Cloud Firestore first, cache fallback on error)
   */
  async getApplicationByUserId(userId) {
    if (!userId) return { success: false, application: null };
    const cached = getLocalCache();

    // 1. Query Cloud Firestore FIRST so stale local cache never masks Firebase edits/deletions
    if (db) {
      try {
        const colRef = collection(db, COLLECTION_NAME);
        const q = query(colRef, where('userId', '==', userId));
        const snap = await withTimeout(getDocs(q), 5000);
        if (!snap.empty) {
          const matches = snap.docs.map(d => parseFirestoreDoc(d)).filter(Boolean);
          // Prefer non-draft / already allotted record if user has multiple docs
          const preferred =
            matches.find(a => a.allottedBranch) ||
            matches.find(a => a.status && a.status !== 'DRAFT') ||
            matches[0];

          if (preferred) {
            cached[preferred.id] = preferred;
            setLocalCache(cached);
            return { success: true, application: preferred, cloudAuthoritative: true };
          }
        }

        // Firestore query succeeded and found no record for this user -> remove any stale cached entry
        let cacheDirty = false;
        Object.keys(cached).forEach(k => {
          if (cached[k]?.userId === userId) {
            delete cached[k];
            cacheDirty = true;
          }
        });
        if (cacheDirty) setLocalCache(cached);

        return { success: false, application: null, cloudAuthoritative: true };
      } catch (err) {
        console.warn('⚠️ [Firestore GetByUserId] Query error, trying fallback:', err.message);
      }
    }

    // 2. Offline / error fallback: check local cache
    const localMatch = Object.values(cached).find(a => a.userId === userId);
    if (localMatch) {
      return { success: true, application: localMatch, cloudAuthoritative: false };
    }

    return { success: false, application: null, cloudAuthoritative: false };
  },

  /**
   * Update candidate details by Admin (specifically when allotted to a branch)
   */
  async updateCandidateData(id, updatePayload, actorName = 'Admin Scrutiny Officer') {
    if (!id) return { success: false, message: 'Invalid ID' };

    const currentRes = await this.getApplicationById(id);
    const existing = currentRes.application || {};

    const updatedApp = {
      ...existing,
      ...updatePayload,
      personal: {
        ...(existing.personal || {}),
        ...(updatePayload.personal || {})
      },
      academic: {
        ...(existing.academic || {}),
        ...(updatePayload.academic || {})
      },
      id,
      history: [
        ...(existing.history || []),
        {
          timestamp: new Date().toISOString(),
          event: `Candidate data & branch updated by Admin (${actorName})${updatePayload.note ? `: ${updatePayload.note}` : ''}`,
          actor: actorName
        }
      ],
      lastModified: new Date().toISOString()
    };

    if (updatePayload.allottedBranch) {
      updatedApp.allottedBranch = updatePayload.allottedBranch;
      if (!updatedApp.allotmentDate) {
        updatedApp.allotmentDate = new Date().toISOString();
      }
    }

    return await this.saveApplication(updatedApp);
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
   * Subscribe to real-time updates of all applications in Cloud Firestore
   */
  subscribeAllApplications(onData, onError) {
    if (!db) return () => {};
    try {
      const colRef = collection(db, COLLECTION_NAME);
      return onSnapshot(
        colRef,
        (snapshot) => {
          const applications = [];
          snapshot.forEach((docSnap) => {
            const app = parseFirestoreDoc(docSnap);
            if (app) applications.push(app);
          });
          const newCache = {};
          applications.forEach((a) => { newCache[a.id] = a; });
          setLocalCache(newCache);
          if (onData) onData(applications);
        },
        (err) => {
          console.warn('⚠️ [Firestore Subscribe] Error:', err.message);
          if (onError) onError(err);
        }
      );
    } catch (err) {
      if (onError) onError(err);
      return () => {};
    }
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
  },

  /**
   * Remove deprecated academic fields (overall12Percent)
   * from a specific Firestore document. Call once per document to clean existing data.
   */
  async cleanupDeprecatedFields(appId) {
    if (!db || !appId) return { success: false };
    try {
      const docRef = doc(db, COLLECTION_NAME, appId);
      const fieldDeletions = {};
      DEPRECATED_ACADEMIC_FIELDS.forEach(f => {
        fieldDeletions[`academic.${f}`] = deleteField();
      });
      await withTimeout(updateDoc(docRef, fieldDeletions), 3500);
      console.log(`🧹 [Firestore] Cleaned deprecated fields from ${appId}`);
      return { success: true };
    } catch (err) {
      console.warn(`⚠️ [Firestore Cleanup] Failed for ${appId}:`, err.message);
      return { success: false, error: err.message };
    }
  },

  /**
   * Batch-clean all applications in the collection to remove deprecated fields
   */
  async cleanupAllDeprecatedFields() {
    if (!db) return { success: false, cleaned: 0 };
    try {
      const colRef = collection(db, COLLECTION_NAME);
      const snapshot = await withTimeout(getDocs(colRef), 6000);
      let cleaned = 0;
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const hasDeprecated = DEPRECATED_ACADEMIC_FIELDS.some(
          f => data.academic && f in data.academic
        );
        if (hasDeprecated) {
          await this.cleanupDeprecatedFields(docSnap.id);
          cleaned++;
        }
      }
      console.log(`🧹 [Firestore] Batch cleanup complete: ${cleaned} documents cleaned`);
      return { success: true, cleaned };
    } catch (err) {
      console.warn('⚠️ [Firestore Batch Cleanup] Error:', err.message);
      return { success: false, cleaned: 0, error: err.message };
    }
  }
};
