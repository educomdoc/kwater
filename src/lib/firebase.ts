import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isConfigValid = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== '여기에_API_KEY_입력';

if (!isConfigValid) {
  console.warn('Firebase 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요.');
}

// 앱 초기화 (싱글톤 패턴)
const app = getApps().length > 0 ? getApp() : (isConfigValid ? initializeApp(firebaseConfig) : null);
const db = app ? getFirestore(app) : null as any;
const auth = app ? getAuth(app) : null as any;

export { app, db, auth };
