import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase 앱 초기화 함수
function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApps()[0];
  }
  return initializeApp(firebaseConfig);
}

// 지연 초기화를 위한 getter 함수들
function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

function getFirebaseFirestore(): Firestore {
  return getFirestore(getFirebaseApp());
}

function getFirebaseStorage(): FirebaseStorage {
  return getStorage(getFirebaseApp());
}

// 클라이언트 사이드에서만 사용할 수 있도록 lazy initialization
export const app = typeof window !== 'undefined' ? getFirebaseApp() : (null as unknown as FirebaseApp);
export const auth = typeof window !== 'undefined' ? getFirebaseAuth() : (null as unknown as Auth);
export const db = typeof window !== 'undefined' ? getFirebaseFirestore() : (null as unknown as Firestore);
export const storage = typeof window !== 'undefined' ? getFirebaseStorage() : (null as unknown as FirebaseStorage);

export { getFirebaseApp, getFirebaseAuth, getFirebaseFirestore, getFirebaseStorage };
