
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';

/**
 * Ouvinte global para erros contextuais do Firestore.
 * Ajuda a identificar falhas de permissão em tempo real.
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = errorEmitter.on('permission-error', (error: any) => {
      console.error("FIREBASE PERMISSION ERROR:", error);
      
      toast({
        variant: "destructive",
        title: "Erro de Sincronização",
        description: "Você não tem permissão para realizar esta ação na nuvem. Verifique seu login.",
      });
    });

    return () => unsubscribe();
  }, [toast]);

  return null;
}
