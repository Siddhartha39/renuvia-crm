import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { logAudit } from '../services/auditService';

const AuthContext = createContext(null);

/**
 * Strict Master Admin Whitelist.
 * Only exact matching emails get immediate active administrator access.
 * All other registrations are quarantined in 'pending_approval' until an admin manually approves them.
 */
export const MASTER_ADMIN_EMAILS = [
  'info@renuviarecycling.com',
  '6387siddhartha@gmail.com',
];

export function isMasterAdminEmail(email) {
  if (!email) return false;
  return MASTER_ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

// Clean out legacy demo storage
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('renuvia_demo_auth');
    localStorage.removeItem('galaxy_demo_auth');
  } catch (e) {
    // Ignore error
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    let unsubscribe = () => {};

    try {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        clearTimeout(safetyTimer);
        try {
          if (firebaseUser) {
            setUser(firebaseUser);

            const isMaster = isMasterAdminEmail(firebaseUser.email);

            // Fetch profile document from Firestore
            try {
              const userDocRef = doc(db, 'users', firebaseUser.uid);
              const snap = await getDoc(userDocRef);

              if (snap.exists()) {
                const existingData = snap.data();
                // Ensure master admins are always active admin
                if (isMaster && (existingData.status !== 'active' || existingData.role !== 'admin')) {
                  const upgraded = { ...existingData, role: 'admin', status: 'active' };
                  setUserProfile(upgraded);
                  try {
                    await setDoc(userDocRef, { role: 'admin', status: 'active', updatedAt: serverTimestamp() }, { merge: true });
                  } catch (uErr) {
                    console.warn('Could not update admin doc in Firestore:', uErr);
                  }
                } else {
                  setUserProfile(existingData);
                }
              } else {
                // New user: ONLY master admins get active admin status. All others get pending approval.
                const profileData = {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Executive',
                  role: isMaster ? 'admin' : 'employee',
                  status: isMaster ? 'active' : 'pending_approval',
                  createdAt: serverTimestamp(),
                  lastLoginAt: serverTimestamp(),
                };

                await setDoc(userDocRef, profileData, { merge: true });
                setUserProfile(profileData);
              }
            } catch (dbErr) {
              console.warn('Could not read/write user profile doc:', dbErr);
              setUserProfile({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Executive',
                role: isMaster ? 'admin' : 'employee',
                status: isMaster ? 'active' : 'pending_approval',
              });
            }
          } else {
            setUser(null);
            setUserProfile(null);
          }
        } catch (err) {
          console.error('Error in auth state change:', err);
        } finally {
          setLoading(false);
        }
      });
    } catch (e) {
      console.warn('onAuthStateChanged setup error:', e);
      setLoading(false);
    }

    return () => {
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, []);

  // Login
  const login = async (email, password) => {
    setAuthError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await logAudit({
        action: 'USER_LOGIN',
        targetType: 'auth',
        targetId: cred.user.uid,
        targetName: email,
        user: cred.user,
      });
      return cred.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  // Sign up
  const signup = async (email, password, displayName) => {
    setAuthError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }

      const isMaster = isMasterAdminEmail(email);
      const finalRole = isMaster ? 'admin' : 'employee';
      const finalStatus = isMaster ? 'active' : 'pending_approval';

      const profileData = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: displayName || email.split('@')[0],
        role: finalRole,
        status: finalStatus,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      };

      try {
        await setDoc(doc(db, 'users', cred.user.uid), profileData, { merge: true });
      } catch (e) {
        console.warn('Could not save user profile doc in Firestore:', e);
      }

      setUserProfile(profileData);

      await logAudit({
        action: 'USER_REGISTERED',
        targetType: 'auth',
        targetId: cred.user.uid,
        targetName: email,
        details: { role: finalRole, status: finalStatus },
        user: cred.user,
      });

      return cred.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  // Password Reset
  const resetPassword = async (email) => {
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  // Refresh profile from Firestore
  const refreshProfile = async () => {
    if (!user) return null;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data();
        if (isMasterAdminEmail(user.email) && (data.status !== 'active' || data.role !== 'admin')) {
          await setDoc(userDocRef, { role: 'admin', status: 'active', updatedAt: serverTimestamp() }, { merge: true });
          const updated = { ...data, role: 'admin', status: 'active' };
          setUserProfile(updated);
          return updated;
        }
        setUserProfile(data);
        return data;
      }
    } catch (e) {
      console.warn('Error refreshing profile:', e);
    }
    return userProfile;
  };

  // Logout
  const logout = async () => {
    try {
      await logAudit({
        action: 'USER_LOGOUT',
        targetType: 'auth',
        targetId: user?.uid,
        targetName: user?.email,
        user,
      });
      await signOut(auth);
    } catch (err) {
      console.warn('Sign out complete:', err);
    } finally {
      setUser(null);
      setUserProfile(null);
      setLoading(false);
    }
  };

  const isAdmin =
    userProfile?.role === 'admin' ||
    isMasterAdminEmail(user?.email);
  const isEmployee = userProfile?.role === 'employee' || isAdmin;
  const isApproved = userProfile?.status === 'active' || isMasterAdminEmail(user?.email);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        authError,
        isAdmin,
        isEmployee,
        isApproved,
        login,
        signup,
        resetPassword,
        refreshProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
