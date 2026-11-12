import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCHqL0-F5lfPXM262QgPc3022W9ARzm7NI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "aloo-bhujiya.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "aloo-bhujiya",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "aloo-bhujiya.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "528037145918",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:528037145918:web:1c71d50ef4c791f4c7506f",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-KE9RDE003F",
};

export const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== "undefined" && firebaseConfig.measurementId ? getAnalytics(app) : null;
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
