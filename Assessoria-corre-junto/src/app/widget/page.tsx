"use client";

import * as React from "react";
import { TrainingContext } from "@/contexts/TrainingContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Timer, Trophy, ArrowRight, Activity, CalendarDays, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

/**
 * @fileOverview Agenda de Elite (Widget de Tela de Início).
 * Exibe o treino atual e os próximos 3 sessões em estilo linha do tempo.
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

  // Busca os próximos 4 treinos não completados
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
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Activity className="size-12 text-primary animate-pulse" />
        <p className="font-headline font-black uppercase italic text-primary text-xs tracking-widest">Sincronizando Lab...</p>
      </div>
    );
  }

  const mainWorkout = upcomingWorkouts[0];
  const others = upcomingWorkouts.slice(1);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center py-10 px-4 select-none animate-in fade-in duration-700 overflow-y-auto">
      
      {/* Header do Lab */}
      <div className="w-full max-w-sm flex items-center justify-between mb-8 px-2">
         <div className="space-y-1">
            <h1 className="font-headline font-black italic text-primary text-2xl tracking-tighter leading-none">CORREJUNTO</h1>
            <p className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-[0.3em] italic">AGENDA DE ELITE</p>
         </div>
         <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-white italic">{daysToRace} DIAS</span>
            <span className="text-[7px] font-bold text-primary uppercase tracking-widest">PROVA ALVO</span>
         </div>
      </div>

      {/* Container Principal */}
      <div className="w-full max-w-sm space-y-8">
        
        {/* TREINO ATUAL - DESTAQUE */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase italic text-primary/60 tracking-widest px-2">
             <div className="size-1.5 rounded-full bg-primary animate-pulse" />
             PRÓXIMA SESSÃO
          </div>
          
          {mainWorkout ? (
            <Link href="/training">
              <div className="w-full bg-[#0c0e12] border-2 border-primary/30 rounded-[2.5rem] p-8 shadow-[0_0_40px_rgba(74,222,128,0.05)] relative overflow-hidden group active:scale-[0.98] transition-all">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                   <Activity size={160} />
                </div>
                
                <div className="space-y-6 relative z-10">
                  <div className="space-y-1">
                    <h2 className="text-4xl font-headline font-black uppercase italic text-white tracking-tighter leading-none">
                      {mainWorkout.type}
                    </h2>
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-bold text-primary italic uppercase">{mainWorkout.day}</span>
                       <span className="text-[10px] text-muted-foreground italic">• {mainWorkout.paceZone}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <Badge className="bg-primary text-black font-black italic text-[12px] h-8 px-5 rounded-xl shadow-lg uppercase">
                      {mainWorkout.distance}
                    </Badge>
                    <ChevronRight className="size-5 text-primary/40" />
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <div className="p-12 border-2 border-dashed border-white/5 rounded-[2.5rem] text-center">
               <p className="text-xs font-bold text-muted-foreground/30 uppercase italic">Nenhum treino pendente</p>
            </div>
          )}
        </section>

        {/* PRÓXIMAS SESSÕES - ESTILO AGENDA */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase italic text-muted-foreground tracking-widest px-2">
             CRONOGRAMA SEMANAL
          </div>

          <div className="space-y-3">
             {others.length > 0 ? others.map((w, idx) => (
               <Link key={idx} href="/training">
                 <div className="flex items-center gap-4 p-5 bg-[#0a0c10] border border-white/5 rounded-2xl active:bg-white/5 transition-colors mb-3">
                    <div className="size-10 rounded-xl bg-secondary flex flex-col items-center justify-center shrink-0 border border-white/5">
                       <span className="text-[8px] font-black uppercase text-primary italic leading-none">{w.day.substring(0,3)}</span>
                    </div>
                    <div className="flex-1 space-y-0.5">
                       <p className="text-sm font-black uppercase italic text-white tracking-tight leading-none">{w.type}</p>
                       <p className="text-[9px] font-bold text-muted-foreground/60 italic uppercase tracking-wider">{w.distance} • {w.paceZone}</p>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground/20" />
                 </div>
               </Link>
             )) : (
                others.length === 0 && !mainWorkout && (
                  <Button asChild className="w-full h-14 bg-primary text-black font-black uppercase italic rounded-2xl">
                    <Link href="/profile">CONFIGURAR PLANO <Zap className="ml-2 size-4"/></Link>
                  </Button>
                )
             )}
          </div>
        </section>
      </div>

      {/* Footer de Instrução */}
      <div className="mt-auto pt-10 space-y-6 text-center w-full max-w-sm">
        <p className="text-[9px] font-black uppercase italic text-muted-foreground/40 tracking-[0.2em] leading-relaxed">
          PARA USAR COMO WIDGET: <br/>
          ABRA NO SAFARI/CHROME E SELECIONE <br/>
          <span className="text-primary/60">"ADICIONAR À TELA DE INÍCIO"</span>
        </p>
        <Button asChild variant="ghost" className="text-primary hover:text-white font-black italic uppercase text-xs h-12 w-full">
          <Link href="/training" className="flex items-center justify-center gap-2">ABRIR LABORATÓRIO COMPLETO <ArrowRight size={14} /></Link>
        </Button>
      </div>
    </div>
  );
}
