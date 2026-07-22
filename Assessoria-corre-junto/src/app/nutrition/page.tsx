"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TrainingContext } from "@/contexts/TrainingContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Apple, Flame, Droplets, Dumbbell, Utensils, Loader2, Sparkles,
  Beef, Wheat, Nut, Lightbulb, Pill, Moon, Zap
} from "lucide-react";

const MacroPill = ({ icon: Icon, label, value, color }: any) => (
  <div className="flex-1 flex flex-col items-center gap-1.5 p-4 rounded-2xl bg-black/30 border border-white/5">
    <Icon className={cn("size-5", color)} />
    <span className="text-2xl font-headline font-black italic text-white leading-none">{value}<span className="text-xs text-muted-foreground">g</span></span>
    <span className="text-[9px] font-black uppercase italic tracking-widest text-muted-foreground">{label}</span>
  </div>
);

export default function NutritionPage() {
  const context = React.useContext(TrainingContext);
  const { toast } = useToast();
  const plan = context?.dietPlan;
  const status = context?.dietGenerationStatus;
  const profile = context?.activeProfile;
  const isPending = status === 'pending';

  const handleGenerate = () => {
    if (!profile) {
      toast({ variant: "destructive", title: "Crie um perfil primeiro", description: "Preencha seus dados em Meus Dados." });
      return;
    }
    context?.generateDietPlanAsync(profile);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24">
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 px-1">
          <div>
            <h1 className="text-3xl md:text-6xl font-headline font-black uppercase italic tracking-tighter leading-none">
              <span className="text-white">PLANO</span>{" "}
              <span className="text-green-400">ALIMENTAR</span>
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm font-medium mt-3">
              Dieta personalizada gerada por IA a partir do seu perfil.
            </p>
          </div>
          {plan && (
            <Button onClick={handleGenerate} disabled={isPending}
              className="bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-black font-black uppercase italic text-[10px] rounded-xl h-11 px-5 shrink-0">
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <><Sparkles className="size-4 mr-2" /> Regenerar</>}
            </Button>
          )}
        </header>

        {/* ESTADO VAZIO */}
        {!plan && !isPending && (
          <Card className="bg-[#0a0c10] border-border/50 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <CardContent className="p-10 md:p-16 flex flex-col items-center text-center gap-6">
              <div className="size-20 rounded-3xl bg-green-500/10 flex items-center justify-center text-green-400">
                <Apple className="size-10" />
              </div>
              <div className="space-y-2 max-w-md">
                <h2 className="text-xl md:text-2xl font-headline font-black uppercase italic text-white">Nenhum plano ainda</h2>
                <p className="text-muted-foreground text-sm font-medium">
                  A IA vai calcular suas calorias e macros e montar suas refeições com base no seu peso, objetivo, nível de atividade e preferências. Confira seus dados na aba <span className="text-green-400 font-bold">DIETA</span> de Meus Dados.
                </p>
              </div>
              <Button onClick={handleGenerate} disabled={isPending}
                className="h-14 bg-green-500 text-black font-black uppercase italic tracking-widest rounded-2xl shadow-xl hover:bg-white transition-all px-8">
                <Sparkles className="size-5 mr-2" /> Gerar Plano Alimentar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* LOADING */}
        {isPending && (
          <Card className="bg-[#0a0c10] border-border/50 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <CardContent className="p-16 flex flex-col items-center text-center gap-5">
              <Loader2 className="size-12 animate-spin text-green-400" />
              <p className="font-headline font-black uppercase italic tracking-widest text-green-400 animate-pulse text-sm">
                Calculando calorias e montando refeições...
              </p>
            </CardContent>
          </Card>
        )}

        {/* PLANO */}
        {plan && !isPending && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* RESUMO */}
            <Card className="bg-[#0a0c10] border-border/50 rounded-[2rem] overflow-hidden shadow-2xl">
              <CardHeader className="bg-green-500/10 border-b border-white/5 p-6 md:p-8">
                <h2 className="text-lg md:text-xl font-headline font-black uppercase italic text-green-400 flex items-center gap-3">
                  <Flame className="size-6" /> META DIÁRIA
                </h2>
              </CardHeader>
              <CardContent className="p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <div className="text-center">
                    <div className="text-5xl md:text-7xl font-headline font-black italic text-white leading-none">{plan.targetCalories}</div>
                    <div className="text-[10px] font-black uppercase italic tracking-widest text-muted-foreground mt-2">KCAL / DIA</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <MacroPill icon={Beef} label="Proteína" value={plan.macros?.protein} color="text-rose-400" />
                  <MacroPill icon={Wheat} label="Carbo" value={plan.macros?.carbs} color="text-amber-400" />
                  <MacroPill icon={Nut} label="Gordura" value={plan.macros?.fat} color="text-sky-400" />
                </div>
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-sky-500/5 border border-sky-500/10">
                  <Droplets className="size-5 text-sky-400 shrink-0" />
                  <span className="text-sm font-bold text-white">{plan.waterLiters} L de água por dia</span>
                </div>
                {plan.strategy && (
                  <p className="text-xs md:text-sm text-muted-foreground font-medium leading-relaxed border-t border-white/5 pt-5">
                    {plan.strategy}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* REFEIÇÕES */}
            <div className="space-y-4">
              <h3 className="text-sm font-headline font-black uppercase italic tracking-widest text-white/80 flex items-center gap-2 px-1">
                <Utensils className="size-4 text-green-400" /> Refeições do dia
              </h3>
              {plan.meals?.map((meal, i) => (
                <Card key={i} className="bg-[#0a0c10] border-border/50 rounded-[1.5rem] overflow-hidden shadow-xl">
                  <CardContent className="p-5 md:p-6 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-headline font-black uppercase italic text-white text-base leading-none">{meal.name}</h4>
                        <span className="text-[10px] font-black uppercase italic tracking-widest text-green-400">{meal.time}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xl font-headline font-black italic text-white leading-none">{meal.calories}</div>
                        <div className="text-[8px] font-black uppercase italic tracking-widest text-muted-foreground">KCAL</div>
                      </div>
                    </div>
                    <ul className="space-y-1.5">
                      {meal.items?.map((item, j) => (
                        <li key={j} className="text-xs md:text-sm text-white/80 font-medium flex items-start gap-2">
                          <span className="text-green-400 mt-1 shrink-0">•</span>{item}
                        </li>
                      ))}
                    </ul>
                    <div className="flex gap-3 pt-2 border-t border-white/5 text-[10px] font-black uppercase italic tracking-wider">
                      <span className="text-rose-400">P {meal.protein}g</span>
                      <span className="text-amber-400">C {meal.carbs}g</span>
                      <span className="text-sky-400">G {meal.fat}g</span>
                    </div>
                    {meal.notes && <p className="text-[11px] text-muted-foreground italic">{meal.notes}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* NOTAS DIA TREINO / DESCANSO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plan.trainingDayNotes && (
                <Card className="bg-[#0a0c10] border-border/50 rounded-[1.5rem] overflow-hidden">
                  <CardContent className="p-6 space-y-2">
                    <h4 className="font-headline font-black uppercase italic text-primary text-sm flex items-center gap-2"><Zap className="size-4" /> Dias de Treino</h4>
                    <p className="text-xs text-white/80 font-medium leading-relaxed">{plan.trainingDayNotes}</p>
                  </CardContent>
                </Card>
              )}
              {plan.restDayNotes && (
                <Card className="bg-[#0a0c10] border-border/50 rounded-[1.5rem] overflow-hidden">
                  <CardContent className="p-6 space-y-2">
                    <h4 className="font-headline font-black uppercase italic text-muted-foreground text-sm flex items-center gap-2"><Moon className="size-4" /> Dias de Descanso</h4>
                    <p className="text-xs text-white/80 font-medium leading-relaxed">{plan.restDayNotes}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* SUPLEMENTAÇÃO */}
            {plan.supplementation && (
              <Card className="bg-[#0a0c10] border-border/50 rounded-[1.5rem] overflow-hidden">
                <CardContent className="p-6 space-y-2">
                  <h4 className="font-headline font-black uppercase italic text-green-400 text-sm flex items-center gap-2"><Pill className="size-4" /> Suplementação</h4>
                  <p className="text-xs text-white/80 font-medium leading-relaxed">{plan.supplementation}</p>
                </CardContent>
              </Card>
            )}

            {/* DICAS */}
            {plan.generalTips?.length > 0 && (
              <Card className="bg-[#0a0c10] border-border/50 rounded-[1.5rem] overflow-hidden">
                <CardContent className="p-6 space-y-3">
                  <h4 className="font-headline font-black uppercase italic text-white text-sm flex items-center gap-2"><Lightbulb className="size-4 text-amber-400" /> Dicas</h4>
                  <ul className="space-y-2">
                    {plan.generalTips.map((tip, i) => (
                      <li key={i} className="text-xs text-white/80 font-medium flex items-start gap-2">
                        <span className="text-amber-400 mt-0.5 shrink-0">✓</span>{tip}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <p className="text-[10px] text-center text-muted-foreground/60 italic px-4">
              Este plano é uma orientação gerada por IA. Para condições clínicas específicas, consulte um nutricionista.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
