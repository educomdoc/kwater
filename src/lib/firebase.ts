import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyDmVabQV3OEJAvlq5paQpwyEQShvzcTFNg",
  authDomain: "kwater-a3c9b.firebaseapp.com",
  projectId: "kwater-a3c9b",
  storageBucket: "kwater-a3c9b.firebasestorage.app",
  messagingSenderId: "875308166788",
  appId: "1:875308166788:web:5ed4ad85fc34914897dcd1",
  measurementId: "G-89M0VYZS20",
};

// 앱 초기화
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Analytics는 브라우저 환경에서만 초기화
const analytics = typeof window !== 'undefined' && app ? isSupported().then(yes => yes ? getAnalytics(app) : null) : null;

export { app, db, auth, analytics };
