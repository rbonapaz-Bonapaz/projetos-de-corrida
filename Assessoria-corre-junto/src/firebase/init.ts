
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';
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
    // Muitos objetos do app (atividades importadas, recordes, etc.) têm campos
    // opcionais que ficam `undefined` — o setDoc() do Firestore rejeita isso
    // por padrão ("Unsupported field value: undefined"). Em vez de sanitizar
    // manualmente cada gravação, ignora undefined globalmente (equivale a
    // omitir o campo, que é o comportamento que já queríamos).
    let firestore: Firestore;
    try {
      firestore = initializeFirestore(firebaseApp, { ignoreUndefinedProperties: true });
    } catch {
      // Já inicializado nesta sessão (ex.: hot reload) — reaproveita a instância.
      firestore = getFirestore(firebaseApp);
    }
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
