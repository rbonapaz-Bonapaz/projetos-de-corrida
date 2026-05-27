'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

/**
 * Inicializa o Firebase de forma segura para o Next.js 15.
 * Resiliência total para o ambiente de build onde o 'window' não existe.
 */
export function initializeFirebase(): {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
} {
  // Segurança para o ambiente de servidor/build
  if (typeof window === 'undefined') {
    return { 
      firebaseApp: null as any, 
      firestore: null as any, 
      auth: null as any 
    };
  }

  try {
    // Singleton pattern robusto
    const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const firestore = getFirestore(firebaseApp);
    const auth = getAuth(firebaseApp);

    return { firebaseApp, firestore, auth };
  } catch (error) {
    console.error("Firebase init error:", error);
    return { 
      firebaseApp: null as any, 
      firestore: null as any, 
      auth: null as any 
    };
  }
}