"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Apenas loga o erro de forma segura
    if (typeof window !== 'undefined') {
      console.error("Critical System Error:", error);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-[#06080a] flex flex-col items-center justify-center p-6 text-center">
      <div className="space-y-6 max-w-md">
        <div className="size-20 rounded-3xl bg-destructive/10 flex items-center justify-center text-destructive mx-auto shadow-2xl">
          <RefreshCcw size={40} className="animate-spin-slow" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-headline font-black uppercase italic text-white leading-tight">
            FALHA NO <span className="text-destructive">LABORATÓRIO</span>
          </h2>
          <p className="text-muted-foreground text-sm font-medium">
            Ocorreu um erro inesperado ao processar os dados biométricos. O sistema precisa ser recalibrado.
          </p>
        </div>
        <div className="flex flex-col gap-3 pt-4">
          <Button onClick={() => reset()} className="h-14 bg-white text-black font-black uppercase italic rounded-2xl shadow-xl hover:bg-primary transition-all">
             RECALIBRAR SISTEMA
          </Button>
          <Button asChild variant="outline" className="h-12 border-white/10 text-muted-foreground font-black uppercase italic rounded-xl hover:bg-white/5">
            <Link href="/">VOLTAR AO INÍCIO</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
