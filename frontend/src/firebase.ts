import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCHqL0-F5lfPXM262QgPc3022W9ARzm7NI",
  authDomain: "aloo-bhujiya.firebaseapp.com",
  projectId: "aloo-bhujiya",
  storageBucket: "aloo-bhujiya.firebasestorage.app",
  messagingSenderId: "528037145918",
  appId: "1:528037145918:web:1c71d50ef4c791f4c7506f",
  measurementId: "G-KE9RDE003F"
};

export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
