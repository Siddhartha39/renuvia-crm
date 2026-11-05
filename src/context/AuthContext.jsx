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
    // Safety timer to prevent perpetual loading on network issues
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

            // Fetch profile document from Firestore
            try {
              const userDocRef = doc(db, 'users', firebaseUser.uid);
              const snap = await getDoc(userDocRef);

              if (snap.exists()) {
                setUserProfile(snap.data());
              } else {
                const allUsersSnap = await getDocs(collection(db, 'users'));
                const isFirstUser = allUsersSnap.empty;
                const isKnownAdmin =
                  firebaseUser.email === '6387siddhartha@gmail.com' ||
                  firebaseUser.email === '63387siddhartha@gmail.com' ||
                  firebaseUser.email === 'siddhartha@gmail.com';

                const newProfile = {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Executive',
                  role: (isFirstUser || isKnownAdmin) ? 'admin' : 'employee',
                  status: (isFirstUser || isKnownAdmin) ? 'active' : 'pending_approval',
                  createdAt: serverTimestamp(),
                  lastLoginAt: serverTimestamp(),
                };

                await setDoc(userDocRef, newProfile);
                setUserProfile(newProfile);
              }
            } catch (dbErr) {
              console.warn('Could not read/write user profile doc:', dbErr);
              const isKnownAdmin =
                firebaseUser.email === '6387siddhartha@gmail.com' ||
                firebaseUser.email === '63387siddhartha@gmail.com' ||
                firebaseUser.email === 'siddhartha@gmail.com';

              setUserProfile({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || 'Executive',
                role: isKnownAdmin ? 'admin' : 'employee',
                status: isKnownAdmin ? 'active' : 'pending_approval',
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

      let finalRole = 'employee';
      let finalStatus = 'pending_approval';

      const isKnownAdmin =
        email === '6387siddhartha@gmail.com' ||
        email === '63387siddhartha@gmail.com' ||
        email === 'siddhartha@gmail.com';

      try {
        const allUsersSnap = await getDocs(collection(db, 'users'));
        if (allUsersSnap.empty || isKnownAdmin) {
          finalRole = 'admin';
          finalStatus = 'active';
        }
      } catch (e) {
        if (isKnownAdmin) {
          finalRole = 'admin';
          finalStatus = 'active';
        }
      }

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
        await setDoc(doc(db, 'users', cred.user.uid), profileData);
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
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const data = snap.data();
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
    (!userProfile?.role &&
      (user?.email === '6387siddhartha@gmail.com' ||
        user?.email === '63387siddhartha@gmail.com' ||
        user?.email === 'siddhartha@gmail.com'));
  const isEmployee = userProfile?.role === 'employee' || isAdmin;
  const isApproved = userProfile?.status === 'active';

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
