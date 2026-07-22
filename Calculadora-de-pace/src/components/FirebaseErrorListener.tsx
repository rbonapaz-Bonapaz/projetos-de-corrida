'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = errorEmitter.on('permission-error', (error) => {
      toast({
        variant: "destructive",
        title: "Erro de Permissão",
        description: `Acesso negado em: ${error.context.path}. Verifique suas Security Rules.`,
      });
    });

    return () => unsubscribe();
  }, [toast]);

  return null;
}
