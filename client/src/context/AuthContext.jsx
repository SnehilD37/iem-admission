import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { authApi } from '../services/api';
import { isAuthorizedAdmin } from '../config/adminConfig';
import { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  googleProvider,
  signInWithPopup
} from '../services/firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('student'); // 'student' | 'admin'
  const [demoUsers, setDemoUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const authAttemptPendingRef = useRef(false);

  // Initialize session and Firebase Auth listener on mount
  useEffect(() => {
    let unsubscribe = null;
    let settled = false;

    const finishLoading = () => {
      if (!settled) {
        settled = true;
        setLoading(false);
      }
    };

    const bootTimeout = setTimeout(() => {
      finishLoading();
    }, 4500);

    const resolveEffectiveRole = (email, preferredRole) => {
      return preferredRole === 'admin' && isAuthorizedAdmin(email) ? 'admin' : 'student';
    };

    const restoreSavedSession = () => {
      try {
        const savedUser = localStorage.getItem('iem_user');
        const savedToken = localStorage.getItem('iem_auth_token');
        const savedRole = localStorage.getItem('iem_active_role');

        if (savedUser && savedToken) {
          const parsed = JSON.parse(savedUser);
          const effectiveRole = resolveEffectiveRole(parsed.email, savedRole || parsed.role);
          setUser({ ...parsed, role: effectiveRole });
          setRole(effectiveRole);
          localStorage.setItem('iem_active_role', effectiveRole);
        }
      } catch (e) {
        localStorage.removeItem('iem_user');
        localStorage.removeItem('iem_auth_token');
        localStorage.removeItem('iem_active_role');
      } finally {
        finishLoading();
      }
    };

    try {
      // Non-blocking demo user fetch
      authApi.getDemoUsers().then((res) => {
        if (res.data?.success) setDemoUsers(res.data.users);
      }).catch(() => {});

      if (auth) {
        unsubscribe = onAuthStateChanged(
          auth,
          async (firebaseUser) => {
            clearTimeout(bootTimeout);
            // Let active loginWithGoogle / loginCustom validate admin permissions before updating state
            if (authAttemptPendingRef.current) {
              finishLoading();
              return;
            }

            if (firebaseUser) {
              try {
                const token = await firebaseUser.getIdToken();
                const savedRole = localStorage.getItem('iem_active_role');
                const effectiveRole = resolveEffectiveRole(
                  firebaseUser.email,
                  savedRole || (isAuthorizedAdmin(firebaseUser.email) ? 'admin' : 'student')
                );

                const loggedInUser = {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                  photoURL: firebaseUser.photoURL || '',
                  role: effectiveRole
                };

                setUser(loggedInUser);
                setRole(effectiveRole);
                localStorage.setItem('iem_user', JSON.stringify(loggedInUser));
                localStorage.setItem('iem_auth_token', token);
                localStorage.setItem('iem_active_role', effectiveRole);
                finishLoading();
                return;
              } catch (tokenErr) {
                console.warn('Error refreshing Firebase ID token:', tokenErr);
              }
            }

            restoreSavedSession();
          },
          (err) => {
            clearTimeout(bootTimeout);
            console.warn('Firebase Auth listener note:', err?.message);
            finishLoading();
          }
        );
      } else {
        clearTimeout(bootTimeout);
        restoreSavedSession();
      }
    } catch (err) {
      clearTimeout(bootTimeout);
      console.error('Auth initialization error:', err);
      finishLoading();
    }

    return () => {
      clearTimeout(bootTimeout);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const loginAsDemo = async (uid) => {
    try {
      setLoading(true);
      const res = await authApi.loginWithDemo(uid);
      if (res.data?.success) {
        const loggedUser = res.data.user;
        setUser(loggedUser);
        setRole(loggedUser.role);
        localStorage.setItem('iem_user', JSON.stringify(loggedUser));
        localStorage.setItem('iem_auth_token', res.data.token);
        localStorage.setItem('iem_active_role', loggedUser.role);
        return { success: true, user: loggedUser };
      }
    } catch (err) {
      console.error('Demo login error:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const loginCustom = async ({ email, password, roleType = 'student' }) => {
    authAttemptPendingRef.current = true;
    try {
      if (!auth) {
        throw new Error('Firebase Auth is not initialized. Please verify your client .env Firebase variables.');
      }

      // Live Firebase Sign-In
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const signedInEmail = userCredential.user.email;
      const allowedAdmin = isAuthorizedAdmin(signedInEmail);

      // Block non-admin accounts from logging into Admin Portal
      if (roleType === 'admin' && !allowedAdmin) {
        await signOut(auth).catch(() => {});
        setUser(null);
        setRole('student');
        localStorage.removeItem('iem_user');
        localStorage.removeItem('iem_auth_token');
        localStorage.removeItem('iem_active_role');
        return {
          success: false,
          error: 'Access Denied: This email is not authorized for Admin Portal access. Please sign in as an Applicant.'
        };
      }

      const token = await userCredential.user.getIdToken();
      const effectiveRole = roleType === 'admin' && allowedAdmin ? 'admin' : 'student';

      const customUser = {
        uid: userCredential.user.uid,
        email: signedInEmail,
        name: userCredential.user.displayName || email.split('@')[0].toUpperCase(),
        photoURL: userCredential.user.photoURL || '',
        role: effectiveRole
      };

      setUser(customUser);
      setRole(effectiveRole);
      localStorage.setItem('iem_user', JSON.stringify(customUser));
      localStorage.setItem('iem_auth_token', token);
      localStorage.setItem('iem_active_role', effectiveRole);

      return { success: true, user: customUser };
    } catch (err) {
      console.error('Firebase Auth Login Error:', err);
      let message = err.message;
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        message = 'Invalid email or password. Please verify your credentials.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Too many failed login attempts. Please try again shortly.';
      } else if (err.code === 'auth/network-request-failed') {
        message = 'Network error connecting to Firebase. Please check your internet connection.';
      }
      return { success: false, error: message };
    } finally {
      authAttemptPendingRef.current = false;
    }
  };

  const loginWithGoogle = async (roleType = 'student') => {
    authAttemptPendingRef.current = true;
    try {
      if (!auth) {
        throw new Error('Firebase Auth is not initialized. Please verify your client .env Firebase variables.');
      }

      const result = await signInWithPopup(auth, googleProvider);
      const googleEmail = result.user.email;
      const allowedAdmin = isAuthorizedAdmin(googleEmail);

      // Block non-admin accounts from signing into Admin Portal
      if (roleType === 'admin' && !allowedAdmin) {
        await signOut(auth).catch(() => {});
        setUser(null);
        setRole('student');
        localStorage.removeItem('iem_user');
        localStorage.removeItem('iem_auth_token');
        localStorage.removeItem('iem_active_role');
        return {
          success: false,
          error: 'Access Denied: Only authorized admin Gmail accounts can sign into the Admin Portal.'
        };
      }

      const token = await result.user.getIdToken();
      const effectiveRole = roleType === 'admin' && allowedAdmin ? 'admin' : 'student';

      const googleUser = {
        uid: result.user.uid,
        email: googleEmail,
        name: result.user.displayName || googleEmail.split('@')[0],
        photoURL: result.user.photoURL || '',
        role: effectiveRole
      };

      setUser(googleUser);
      setRole(effectiveRole);
      localStorage.setItem('iem_user', JSON.stringify(googleUser));
      localStorage.setItem('iem_auth_token', token);
      localStorage.setItem('iem_active_role', effectiveRole);

      // Register or sync user profile in backend database
      try {
        await authApi.register({
          uid: result.user.uid,
          email: googleEmail,
          fullName: googleUser.name,
          phone: result.user.phoneNumber || ''
        });
      } catch (backendErr) {
        console.warn('Backend sync note for Google login:', backendErr.message);
      }

      return { success: true, user: googleUser };
    } catch (err) {
      console.error('Firebase Google Auth Error:', err);
      let message = err.message;
      if (err.code === 'auth/popup-closed-by-user') {
        message = 'Google Sign-in was cancelled before completion.';
      } else if (err.code === 'auth/cancelled-popup-request') {
        message = 'Only one Google sign-in request can be processed at a time.';
      } else if (err.code === 'auth/popup-blocked') {
        message = 'Google sign-in popup was blocked by your browser. Please allow popups for this site.';
      } else if (err.code === 'auth/network-request-failed') {
        message = 'Network error connecting to Google. Please check your internet connection.';
      } else if (err.code === 'auth/operation-not-allowed') {
        message = 'Google Sign-in is not yet enabled in your Firebase Console. Please enable Google provider under Authentication -> Sign-in method.';
      }
      return { success: false, error: message };
    } finally {
      authAttemptPendingRef.current = false;
    }
  };

  const register = async (formData) => {
    authAttemptPendingRef.current = true;
    try {
      if (!auth) {
        throw new Error('Firebase Auth is not initialized. Please verify your client .env Firebase variables.');
      }

      // Live Firebase Account Creation
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      
      if (formData.fullName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName: formData.fullName });
      }

      const token = await userCredential.user.getIdToken();
      const newUser = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name: formData.fullName || userCredential.user.displayName || formData.email.split('@')[0],
        phone: formData.phone || '',
        role: 'student'
      };

      setUser(newUser);
      setRole('student');
      localStorage.setItem('iem_user', JSON.stringify(newUser));
      localStorage.setItem('iem_auth_token', token);
      localStorage.setItem('iem_active_role', 'student');

      // Register profile in backend database
      try {
        await authApi.register({
          uid: userCredential.user.uid,
          email: formData.email,
          fullName: formData.fullName,
          phone: formData.phone
        });
      } catch (backendErr) {
        console.warn('Backend sync note:', backendErr.message);
      }

      return { success: true, user: newUser };
    } catch (err) {
      console.error('Firebase Auth Register Error:', err);
      let message = err.message;
      if (err.code === 'auth/email-already-in-use') {
        message = 'An account with this email address already exists. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please provide a valid email address.';
      }
      return { success: false, error: message };
    } finally {
      authAttemptPendingRef.current = false;
    }
  };

  const logout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
    } catch (err) {
      console.warn('Firebase signOut error:', err);
    }
    setUser(null);
    setRole('student');
    localStorage.removeItem('iem_user');
    localStorage.removeItem('iem_auth_token');
    localStorage.removeItem('iem_active_role');
  };

  const canAccessAdmin = Boolean(user && isAuthorizedAdmin(user.email));

  // Allow authorized admins to switch between Admin Portal and Student Portal views
  const switchRole = (newRole) => {
    if (newRole === 'admin' && !isAuthorizedAdmin(user?.email)) {
      return false;
    }
    const nextRole = newRole === 'admin' ? 'admin' : 'student';
    setRole(nextRole);
    localStorage.setItem('iem_active_role', nextRole);
    if (user) {
      const updatedUser = { ...user, role: nextRole };
      setUser(updatedUser);
      localStorage.setItem('iem_user', JSON.stringify(updatedUser));
    }
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        canAccessAdmin,
        demoUsers,
        loading,
        loginAsDemo,
        loginCustom,
        loginWithGoogle,
        register,
        logout,
        switchRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

