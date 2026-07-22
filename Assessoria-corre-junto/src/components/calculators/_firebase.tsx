'use client';

/**
 * Adaptador de Firebase para os componentes de Calculadora migrados da
 * pasta Calculadora-de-pace. Mantém a API que aqueles componentes esperam
 * (useDoc por PATH string e useCollection retornando { data }), reutilizando
 * o provider/auth do app principal.
 */

import { useEffect, useState } from 'react';
import { doc, onSnapshot, DocumentData, Query } from 'firebase/firestore';
import { useFirestore as useFirestoreMain, useUser as useUserMain } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export const useUser = useUserMain;
export const useFirestore = useFirestoreMain;

/** useDoc que recebe um PATH string (compatível com as calculadoras). */
export function useDoc(path: string | null) {
  const db = useFirestoreMain();
  const [data, setData] = useState<DocumentData | null>(null);
  const [isLoading, setIsLoading] = useState(!!path);

  useEffect(() => {
    if (!db || !path) {
      setIsLoading(false);
      return;
    }
    const docRef = doc(db, path);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        setData(snapshot.data() || null);
        setIsLoading(false);
      },
      () => {
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({ path: docRef.path, operation: 'get' })
        );
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [db, path]);

  return { data, isLoading };
}

/** useCollection compatível com as calculadoras (retorna { data, isLoading }). */
export function useCollection(query: Query | null) {
  const [data, setData] = useState<DocumentData[]>([]);
  const [isLoading, setIsLoading] = useState(!!query);

  useEffect(() => {
    if (!query) {
      setIsLoading(false);
      return;
    }
    const unsubscribe = onSnapshot(
      query,
      (snapshot) => {
        setData(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setIsLoading(false);
      },
      () => {
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({ path: 'collection', operation: 'list' })
        );
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [query]);

  return { data, isLoading };
}
