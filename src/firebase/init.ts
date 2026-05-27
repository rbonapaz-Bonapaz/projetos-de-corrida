'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

/**
 * Inicializa o Firebase de forma segura para o Next.js 15.
 * Adicionada resiliência para ambientes de build onde as variáveis de ambiente podem estar ausentes.
 */
export function initializeFirebase(): {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
} {
  // Verificação de segurança para o ambiente de build (SSR)
  const isServer = typeof window === 'undefined';
  const hasConfig = !!firebaseConfig.apiKey;

  if (isServer && !hasConfig) {
    // Retorna objetos nulos/mocks se não houver config no servidor para não quebrar o build
    return { 
      firebaseApp: {} as FirebaseApp, 
      firestore: {} as Firestore, 
      auth: {} as Auth 
    };
  }

  try {
    // Singleton pattern para evitar inicializações múltiplas no hot-reload
    const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const firestore = getFirestore(firebaseApp);
    const auth = getAuth(firebaseApp);

    return { firebaseApp, firestore, auth };
  } catch (error) {
    console.warn("Falha ao inicializar Firebase (esperado durante pre-rendering se config ausente):", error);
    return { 
      firebaseApp: {} as FirebaseApp, 
      firestore: {} as Firestore, 
      auth: {} as Auth 
    };
  }
}
