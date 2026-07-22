"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

/**
 * @fileOverview Página 404 customizada (Client Component).
 * Diretiva "use client" é obrigatória para evitar erros de PageNotFoundError durante build estático.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#06080a] flex flex-col items-center justify-center p-6 text-center">
      <div className="space-y-6 max-w-md">
        <h1 className="text-9xl font-headline font-black italic text-primary/20 tracking-tighter">404</h1>
        <div className="space-y-2">
          <h2 className="text-2xl font-headline font-black uppercase italic text-white leading-tight">
            ROTA <span className="text-primary">NÃO ENCONTRADA</span>
          </h2>
          <p className="text-muted-foreground text-sm font-medium">
            O laboratório não conseguiu localizar os dados solicitados.
          </p>
        </div>
        <div className="pt-4">
          <Button asChild className="h-14 bg-primary text-black font-black uppercase italic rounded-2xl shadow-xl hover:bg-white transition-all px-8">
            <Link href="/" className="flex items-center gap-2">
              <Home size={20} /> VOLTAR AO DASHBOARD
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
