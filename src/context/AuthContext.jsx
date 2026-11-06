import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc, getDocs, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { logAudit } from '../services/auditService';

const AuthContext = createContext(null);

export function isKnownAdminEmail(email) {
  if (!email) return false;
  const e = email.toLowerCase().trim();
  return (
    e === 'info@renuviarecycling.com' ||
    e.endsWith('@renuviarecycling.com') ||
    e.endsWith('@renuvia.in') ||
    e === '6387siddhartha@gmail.com' ||
    e === '63387siddhartha@gmail.com' ||
    e === 'siddhartha@gmail.com' ||
    e.startsWith('admin@') ||
    e.startsWith('info@') ||
    e.startsWith('compliance@')
  );
}

// Clean out legacy demo auth from browser storage
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

            const isKnownAdmin = isKnownAdminEmail(firebaseUser.email);

            // Fetch profile document from Firestore
            try {
              const userDocRef = doc(db, 'users', firebaseUser.uid);
              const snap = await getDoc(userDocRef);

              if (snap.exists()) {
                const existingData = snap.data();
                if (isKnownAdmin && (existingData.status !== 'active' || existingData.role !== 'admin')) {
                  const upgraded = { ...existingData, role: 'admin', status: 'active' };
                  setUserProfile(upgraded);
                  try {
                    await setDoc(userDocRef, { role: 'admin', status: 'active', updatedAt: serverTimestamp() }, { merge: true });
                  } catch (uErr) {
                    console.warn('Could not upgrade admin doc in Firestore:', uErr);
                  }
                } else {
                  setUserProfile(existingData);
                }
              } else {
                let isFirstUser = false;
                try {
                  const allUsersSnap = await getDocs(collection(db, 'users'));
                  isFirstUser = allUsersSnap.empty;
                } catch (e) {
                  isFirstUser = true;
                }

                const shouldBeAdmin = isFirstUser || isKnownAdmin;
                const newProfile = {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Administrator',
                  role: shouldBeAdmin ? 'admin' : 'employee',
                  status: shouldBeAdmin ? 'active' : 'active', // Allow immediate access for smooth onboarding
                  createdAt: serverTimestamp(),
                  lastLoginAt: serverTimestamp(),
                };

                await setDoc(userDocRef, newProfile, { merge: true });
                setUserProfile(newProfile);
              }
            } catch (dbErr) {
              console.warn('Could not read/write user profile doc:', dbErr);
              setUserProfile({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Administrator',
                role: isKnownAdmin ? 'admin' : 'employee',
                status: 'active',
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
  const signup = async (email, password, displayName, role = 'employee') => {
    setAuthError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }

      const isKnownAdmin = isKnownAdminEmail(email);

      let isFirstUser = false;
      try {
        const allUsersSnap = await getDocs(collection(db, 'users'));
        isFirstUser = allUsersSnap.empty;
      } catch (e) {
        isFirstUser = true;
      }

      const shouldBeAdmin = isFirstUser || isKnownAdmin;
      const finalRole = shouldBeAdmin ? 'admin' : role;
      const finalStatus = 'active';

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

  // Activate Self as Admin
  const activateSelfAsAdmin = async () => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        role: 'admin',
        status: 'active',
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setUserProfile(prev => ({
        ...(prev || {}),
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'Administrator',
        role: 'admin',
        status: 'active',
      }));
      return true;
    } catch (err) {
      console.error('Failed to activate admin in Firestore:', err);
      setUserProfile(prev => ({
        ...(prev || {}),
        uid: user.uid,
        email: user.email,
        role: 'admin',
        status: 'active',
      }));
      return true;
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
        if (isKnownAdminEmail(user.email) && (data.status !== 'active' || data.role !== 'admin')) {
          await setDoc(userDocRef, { role: 'admin', status: 'active', updatedAt: serverTimestamp() }, { merge: true });
          const updated = { ...data, role: 'admin', status: 'active' };
          setUserProfile(updated);
          return updated;
        }
        setUserProfile(data);
        return data;
      } else {
        const newProf = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'Administrator',
          role: 'admin',
          status: 'active',
        };
        await setDoc(userDocRef, newProf, { merge: true });
        setUserProfile(newProf);
        return newProf;
      }
    } catch (e) {
      console.warn('Error refreshing profile:', e);
      if (isKnownAdminEmail(user.email)) {
        const fallback = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Administrator',
          role: 'admin',
          status: 'active',
        };
        setUserProfile(fallback);
        return fallback;
      }
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
    isKnownAdminEmail(user?.email) ||
    (!userProfile?.role && isKnownAdminEmail(user?.email));
  const isEmployee = userProfile?.role === 'employee' || isAdmin;
  const isApproved = userProfile?.status === 'active' || isKnownAdminEmail(user?.email);

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
        activateSelfAsAdmin,
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
