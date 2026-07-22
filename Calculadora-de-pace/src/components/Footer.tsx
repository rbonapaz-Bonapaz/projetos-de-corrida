
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Copy, Check, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase";

export function Footer() {
  const { toast } = useToast();
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const pixKey = "5555996265753";

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const handleCopyKey = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    toast({
      title: "Chave copiada!",
      description: "A chave PIX foi copiada para sua área de transferência.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (!mounted) return null;

  return (
    <footer className="mt-20 pb-10 flex flex-col items-center gap-4 text-center">
      <Dialog>
        <DialogTrigger asChild>
          {user ? (
            <button className="text-[10px] font-bold text-muted-foreground hover:text-primary flex items-center gap-1.5 transition-colors uppercase tracking-widest opacity-60 hover:opacity-100 p-2">
              <Zap className="w-3 h-3 text-accent fill-accent" />
              <span>Apoiar projeto (CarboGel)</span>
            </button>
          ) : (
            <button className="flex items-center gap-2 text-primary font-bold hover:opacity-80 transition-opacity bg-primary/5 px-6 py-3 rounded-full border border-primary/20 shadow-sm group animate-in fade-in duration-1000">
              <Zap className="w-5 h-5 text-accent fill-accent group-hover:scale-110 transition-transform" />
              <span>Apoie o projeto: Pague um CarboGel</span>
            </button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-primary font-bold text-2xl flex items-center justify-center gap-2">
              <Zap className="w-6 h-6 text-accent fill-accent" />
              Abasteça o Desenvolvedor
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="bg-white p-4 rounded-2xl shadow-xl border border-border overflow-hidden">
              <div className="relative w-[280px] h-[280px]">
                <Image 
                  src="/pix-qrcode.png" 
                  alt="QR Code PIX" 
                  fill
                  className="rounded-xl object-contain"
                  priority
                  unoptimized
                />
              </div>
            </div>
            <div className="text-center space-y-4 w-full px-4">
              <div className="space-y-1 bg-secondary/50 p-4 rounded-xl border border-border/50">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Chave PIX (Telefone):</p>
                <p className="text-xl font-mono font-black text-primary">{pixKey}</p>
              </div>
              
              <Button 
                onClick={handleCopyKey} 
                className="w-full gap-2 bg-accent hover:bg-accent/90 text-white h-14 text-lg font-black shadow-lg shadow-accent/20 rounded-xl"
              >
                {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                {copied ? "CHAVE COPIADA!" : "PAGAR UM CARBOGEL"}
              </Button>

              <p className="text-[11px] text-muted-foreground leading-relaxed italic px-2">
                "Gel de carboidrato é o combustível do corredor, o PIX é o combustível do servidor." ⚡
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <p className="text-xs text-muted-foreground font-medium border-t border-border/50 pt-4 w-full max-w-xs">
        Desenvolvido por: Rodrigo Turra Bonapaz
      </p>
    </footer>
  );
}
