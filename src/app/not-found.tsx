"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
      <div className="space-y-6 max-w-md">
        <h1 className="text-9xl font-headline font-black italic text-primary/20 tracking-tighter">404</h1>
        <div className="space-y-2">
          <h2 className="text-2xl font-headline font-black uppercase italic text-white">Rota não encontrada</h2>
          <p className="text-muted-foreground text-sm font-medium">
            O laboratório não conseguiu localizar os dados solicitados. A página pode ter sido movida ou excluída.
          </p>
        </div>
        <div className="flex flex-col gap-3 pt-4">
          <Button asChild className="h-12 bg-primary text-black font-black uppercase italic rounded-xl shadow-xl hover:bg-white transition-all">
            <Link href="/" className="flex items-center gap-2">
              <Home size={18} /> VOLTAR PARA O DASHBOARD
            </Link>
          </Button>
          <Button variant="ghost" className="text-muted-foreground hover:text-white" onClick={() => window.history.back()}>
            <ArrowLeft size={16} className="mr-2" /> Voltar anterior
          </Button>
        </div>
      </div>
    </div>
  );
}
