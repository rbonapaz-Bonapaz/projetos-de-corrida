
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

/**
 * Inicializa o Firebase de forma segura para o Next.js.
 * Garante que a execução ocorra apenas no ambiente de navegador e uma única vez.
 */
export function initializeFirebase(): {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
} {
  if (typeof window === 'undefined') {
    return { 
      firebaseApp: null as any, 
      firestore: null as any, 
      auth: null as any 
    };
  }

  try {
    const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const firestore = getFirestore(firebaseApp);
    const auth = getAuth(firebaseApp);

    return { firebaseApp, firestore, auth };
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    return { 
      firebaseApp: null as any, 
      firestore: null as any, 
      auth: null as any 
    };
  }
}
