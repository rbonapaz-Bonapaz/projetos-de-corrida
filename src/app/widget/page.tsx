
"use client";

import * as React from "react";
import { TrainingContext } from "@/contexts/TrainingContext";
import { Badge } from "@/components/ui/badge";
import { Zap, Timer, Calendar, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * @fileOverview Uma visualização minimalista estilo 'Widget' para ser fixada na Home Screen do celular.
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

  const nextWorkout = plan?.weeklyPlans[0]?.runs[0];

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm aspect-square bg-card border-2 border-primary/20 rounded-[2.5rem] shadow-2xl p-8 flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 opacity-5">
           <Zap size={120} />
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-headline font-black italic text-primary text-xl tracking-tighter">CORREJUNTO</div>
            <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black italic uppercase">WIDGET v1.0</Badge>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-muted-foreground/60 italic tracking-widest">PRÓXIMA SESSÃO</p>
            <h2 className="text-3xl font-headline font-black uppercase italic text-white tracking-tighter leading-none">
              {nextWorkout?.type || "DESCANSO"}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="border-white/10 text-white font-black italic text-[10px] uppercase">
                {nextWorkout?.distance || "0KM"}
              </Badge>
              <span className="text-[10px] font-bold text-primary italic uppercase tracking-widest">
                {nextWorkout?.day || "HOJE"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground/60">
              <Trophy size={10} />
              <span className="text-[8px] font-black uppercase italic tracking-widest">META</span>
            </div>
            <p className="text-sm font-black italic text-white leading-none">{profile?.raceDistance || "--"}</p>
          </div>
          <div className="space-y-1 text-right">
            <div className="flex items-center justify-end gap-1.5 text-primary">
              <Timer size={10} />
              <span className="text-[8px] font-black uppercase italic tracking-widest">CONTAGEM</span>
            </div>
            <p className="text-sm font-black italic text-white leading-none">{daysToRace ?? 0} DIAS</p>
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/10 rounded-full" />
      </div>
      
      <p className="mt-8 text-[10px] font-black uppercase italic text-muted-foreground/40 text-center tracking-widest leading-relaxed">
        ADICIONE ESTA PÁGINA À TELA DE INÍCIO <br/> PARA USAR COMO WIDGET
      </p>
    </div>
  );
}
