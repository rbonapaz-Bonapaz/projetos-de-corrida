
'use client';

import React, { useEffect, useState } from 'react';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';

/**
 * Cliente Provider otimizado para Next.js 15.
 * Garante que o Firebase seja inicializado apenas no navegador e lida com o estado inicial.
 */
export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const [firebaseInstance, setFirebaseInstance] = useState<ReturnType<typeof initializeFirebase> | null>(null);

  useEffect(() => {
    // Inicialização segura no lado do cliente
    const instance = initializeFirebase();
    setFirebaseInstance(instance);
  }, []);

  // Para evitar erros de hidratação, renderizamos os filhos. 
  // O FirebaseProvider dentro do contexto garantirá que os hooks funcionem assim que o estado mudar.
  return (
    <FirebaseProvider 
      app={firebaseInstance?.app || null} 
      db={firebaseInstance?.db || null} 
      auth={firebaseInstance?.auth || null}
    >
      {children}
    </FirebaseProvider>
  );
}
