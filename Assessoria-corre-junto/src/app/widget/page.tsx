"use client";

import * as React from "react";
import { TrainingContext } from "@/contexts/TrainingContext";
import { Button } from "@/components/ui/button";
import { Zap, ArrowRight, Activity, ChevronRight } from "lucide-react";
import Link from "next/link";

/**
 * Agenda de elite — widget de tela de início. Página standalone (sem
 * DashboardLayout) pensada para ser adicionada à home screen do celular.
 */
export default function WidgetPage() {
  const context = React.useContext(TrainingContext);
  const profile = context?.activeProfile;
  const plan = context?.trainingPlan;

  const [daysToRace, setDaysToRace] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (profile?.raceDate) {
      const raceDate = new Date(profile.raceDate);
      const today = new Date();
      const diffTime = raceDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysToRace(diffDays > 0 ? diffDays : 0);
    }
  }, [profile?.raceDate]);

  const upcomingWorkouts = React.useMemo(() => {
    if (!plan) return [];
    const allWorkouts: any[] = [];
    plan.weeklyPlans.forEach(week => {
      week.runs.forEach(run => {
        if (!run.completed && run.type !== "Descanso") {
          allWorkouts.push(run);
        }
      });
    });
    return allWorkouts.slice(0, 4);
  }, [plan]);

  if (!context?.isHydrated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center gap-3">
        <Activity className="size-10 text-primary animate-pulse" />
        <p className="text-primary text-xs font-semibold">Sincronizando…</p>
      </div>
    );
  }

  const mainWorkout = upcomingWorkouts[0];
  const others = upcomingWorkouts.slice(1);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-8 px-4 select-none overflow-y-auto">
      <div className="w-full max-w-sm flex items-center justify-between mb-6 px-1">
        <div>
          <h1 className="text-xl font-bold tracking-tight leading-none">
            Corre<span className="text-primary">Junto</span>
          </h1>
          <p className="eyebrow mt-1">Agenda de elite</p>
        </div>
        {daysToRace !== null && (
          <div className="flex flex-col items-end">
            <span className="num text-sm font-bold">{daysToRace} dias</span>
            <span className="text-[9px] text-primary font-semibold uppercase tracking-wide">Prova alvo</span>
          </div>
        )}
      </div>

      <div className="w-full max-w-sm flex flex-col gap-6">
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2 eyebrow !text-primary px-1">
            <div className="size-1.5 rounded-full bg-primary animate-pulse" /> Próxima sessão
          </div>

          {mainWorkout ? (
            <Link href="/training">
              <div className="card-plain relative overflow-hidden active:scale-[0.98] transition-transform">
                <h2 className="text-2xl font-bold tracking-tight leading-none">{mainWorkout.type}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[12px] font-semibold text-primary">{mainWorkout.day}</span>
                  <span className="text-[11px] text-muted-foreground">• {mainWorkout.paceZone}</span>
                </div>
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                  <span className="tag acc num">{mainWorkout.distance}</span>
                  <ChevronRight className="size-4 text-primary/60" />
                </div>
              </div>
            </Link>
          ) : (
            <div className="card-plain border-dashed text-center py-8">
              <p className="text-[12px] text-muted-foreground">Nenhum treino pendente</p>
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <div className="eyebrow px-1">Cronograma semanal</div>
          <div className="flex flex-col gap-2.5">
            {others.length > 0 ? (
              others.map((w, idx) => (
                <Link key={idx} href="/training">
                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-secondary/30 active:bg-secondary/60 transition-colors">
                    <div className="size-9 rounded-lg bg-secondary flex items-center justify-center shrink-0 border border-border">
                      <span className="text-[9px] font-bold text-primary uppercase">{w.day.substring(0, 3)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold truncate">{w.type}</p>
                      <p className="text-[10px] text-muted-foreground">{w.distance} • {w.paceZone}</p>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground/40 shrink-0" />
                  </div>
                </Link>
              ))
            ) : (
              !mainWorkout && (
                <Button asChild className="w-full h-12 rounded-xl gap-2">
                  <Link href="/profile">Configurar plano <Zap className="size-4" /></Link>
                </Button>
              )
            )}
          </div>
        </section>
      </div>

      <div className="mt-auto pt-8 text-center w-full max-w-sm space-y-4">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Para usar como widget: abra no Safari/Chrome e selecione{" "}
          <span className="text-primary/70">"Adicionar à tela de início"</span>.
        </p>
        <Button asChild variant="ghost" className="text-primary hover:text-foreground text-xs h-11 w-full gap-2">
          <Link href="/training">Abrir laboratório completo <ArrowRight size={14} /></Link>
        </Button>
      </div>
    </div>
  );
}
