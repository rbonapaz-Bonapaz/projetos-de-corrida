'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, DocumentData, Query } from 'firebase/firestore';
import { useFirestore } from '../provider';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

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
        setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setIsLoading(false);
      },
      async (error) => {
        const permissionError = new FirestorePermissionError({
          path: 'collection',
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query]);

  return { data, isLoading };
}
