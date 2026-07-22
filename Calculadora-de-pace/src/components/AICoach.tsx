
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Sparkles, Timer, Info, Lock } from "lucide-react";
import { useUser, useDoc } from "@/firebase";

export function AICoach() {
  const { user } = useUser();
  const profilePath = user ? `users/${user.uid}/profile/current` : null;
  const { data: profile } = useDoc(profilePath);

  const [mounted, setMounted] = useState(false);

  // Simulação de treinos recentes para exibição visual
  const [recentRuns] = useState([
    { date: "2024-03-01", distanceKm: 10, durationMinutes: 52, paceMinPerKm: 5.2, notes: "Senti-me bem" },
    { date: "2024-03-03", distanceKm: 15, durationMinutes: 85, paceMinPerKm: 5.6, notes: "Cansaço nas pernas no final" },
    { date: "2024-03-05", distanceKm: 5, durationMinutes: 24, paceMinPerKm: 4.8, notes: "Treino de tiro" },
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <Card className="border-border shadow-md overflow-hidden bg-primary/5">
        <CardHeader className="bg-primary/10 border-b border-primary/20">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-primary flex items-center gap-2">
                <Brain className="w-6 h-6" />
                Treinador IA Corre Junto
              </CardTitle>
              <CardDescription>Analise sua performance com inteligência artificial.</CardDescription>
            </div>
            <Sparkles className="w-8 h-8 text-accent animate-pulse" />
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Timer className="w-4 h-4" /> Últimos Treinos Visualizados
              </h3>
            </div>
            
            <div className="grid gap-3">
              {recentRuns.map((run, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-[10px] font-black">
                      {run.distanceKm}k
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">{new Date(run.date).toLocaleDateString('pt-BR')}</span>
                      <span className="text-[10px] text-muted-foreground">{run.notes}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-primary">{run.paceMinPerKm.toFixed(2)}'</div>
                    <div className="text-[10px] text-muted-foreground">min/km</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-secondary/20 rounded-2xl border border-dashed border-border text-center space-y-4">
            <Lock className="w-8 h-8 text-muted-foreground mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-bold">Funcionalidade IA Desativada em Modo Estático</p>
              <p className="text-xs text-muted-foreground">
                Para usar o Treinador IA (Genkit), sua conta deve estar no plano **Blaze (Pay-as-you-go)** para permitir o processamento no servidor.
              </p>
            </div>
            <Button disabled className="w-full opacity-50">
              INDISPONÍVEL NO PLANO GRATUITO
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="p-10 border-2 border-dashed border-border rounded-3xl text-center space-y-4">
        <div className="bg-secondary w-16 h-16 rounded-full flex items-center justify-center mx-auto text-muted-foreground">
          <Info className="w-8 h-8" />
        </div>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Para ativar o processamento de ritmos via IA, o aplicativo precisa de uma infraestrutura de servidor ativa.
        </p>
      </div>
    </div>
  );
}
