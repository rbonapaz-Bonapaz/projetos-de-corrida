'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { useFirestore } from '../provider';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useDoc(path: string | null) {
  const db = useFirestore();
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
      async (error) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, path]);

  return { data, isLoading };
}
