import { initializeApp, getApp, getApps } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAgKIE1gqLjsgbvLcoOEBMHudFNWKkxQcA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "renuvia-crm.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "renuvia-crm",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "renuvia-crm.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "963936969635",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:963936969635:web:f8f27f0433521b68f8b016",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-3B5ZH88FFS"
};

export const app = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export async function initializeAnalytics() {
  if (typeof window === "undefined") return null;

  try {
    if (await isSupported()) {
      return getAnalytics(app);
    }
  } catch (error) {
    console.warn("Firebase Analytics unavailable:", error);
  }

  return null;
}
