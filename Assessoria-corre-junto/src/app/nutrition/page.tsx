"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TrainingContext } from "@/contexts/TrainingContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Apple, Flame, Droplets, Utensils, Loader2, Sparkles,
  Beef, Wheat, Nut, Lightbulb, Pill, Moon, Zap
} from "lucide-react";

const MacroTile = ({ icon: Icon, label, value, color }: any) => (
  <div className="stat-tile flex flex-col items-center text-center gap-1">
    <Icon className={cn("size-4", color)} />
    <b className="num !text-xl">
      {value}
      <span className="text-xs text-muted-foreground not-italic font-medium">g</span>
    </b>
    <small>{label}</small>
  </div>
);

export default function NutritionPage() {
  const context = React.useContext(TrainingContext);
  const { toast } = useToast();
  const plan = context?.dietPlan;
  const status = context?.dietGenerationStatus;
  const profile = context?.activeProfile;
  const isPending = status === "pending";

  const handleGenerate = () => {
    if (!profile) {
      toast({ variant: "destructive", title: "Crie um perfil primeiro", description: "Preencha seus dados em Meus Dados." });
      return;
    }
    context?.generateDietPlanAsync(profile);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-[26px] font-bold tracking-tight flex items-center gap-2.5">
            <Apple className="size-6 text-primary" /> Plano alimentar
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Dieta personalizada gerada por IA a partir do seu perfil.
          </p>
        </div>
        {plan && (
          <Button onClick={handleGenerate} disabled={isPending} variant="outline" className="rounded-xl shrink-0">
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <><Sparkles className="size-4 mr-2" /> Regenerar</>}
          </Button>
        )}
      </div>

      {/* ESTADO VAZIO */}
      {!plan && !isPending && (
        <div className="card-plain flex flex-col items-center text-center gap-5 py-14 px-6">
          <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Apple className="size-8" />
          </div>
          <div className="space-y-2 max-w-md">
            <h2 className="text-lg font-bold">Nenhum plano ainda</h2>
            <p className="text-muted-foreground text-sm">
              A IA vai calcular suas calorias e macros e montar suas refeições com base no seu peso, objetivo,
              nível de atividade e preferências. Confira seus dados na aba <span className="text-primary font-semibold">Dieta</span> de
              Meus Dados.
            </p>
          </div>
          <Button onClick={handleGenerate} disabled={isPending} className="h-11 rounded-xl px-6">
            <Sparkles className="size-4 mr-2" /> Gerar plano alimentar
          </Button>
        </div>
      )}

      {/* LOADING */}
      {isPending && (
        <div className="card-plain flex flex-col items-center text-center gap-4 py-16">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="font-semibold text-primary text-sm animate-pulse">
            Calculando calorias e montando refeições…
          </p>
        </div>
      )}

      {/* PLANO */}
      {plan && !isPending && (
        <div className="flex flex-col gap-5">
          {/* META DIÁRIA */}
          <section className="card-plain">
            <h3 className="eyebrow flex items-center gap-1.5">
              <Flame className="size-3.5 text-primary" /> Meta diária
            </h3>
            <div className="flex flex-col md:flex-row md:items-center gap-6 mt-4">
              <div className="text-center md:text-left shrink-0">
                <div className="num text-5xl font-bold leading-none">{plan.targetCalories}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2 font-semibold">kcal / dia</div>
              </div>
              <div className="grid grid-cols-3 gap-2.5 flex-1 max-w-md">
                <MacroTile icon={Beef} label="Proteína" value={plan.macros?.protein} color="text-rose-400" />
                <MacroTile icon={Wheat} label="Carbo" value={plan.macros?.carbs} color="text-amber-400" />
                <MacroTile icon={Nut} label="Gordura" value={plan.macros?.fat} color="text-sky-400" />
              </div>
              <div className="flex items-center gap-2.5 chip !py-2.5 !px-4 shrink-0">
                <Droplets className="size-4 text-sky-400 shrink-0" />
                <span className="text-[13px] font-semibold">{plan.waterLiters} L de água/dia</span>
              </div>
            </div>
            {plan.strategy && (
              <p className="text-[13px] text-muted-foreground leading-relaxed border-t border-border pt-4 mt-4">
                {plan.strategy}
              </p>
            )}
          </section>

          {/* REFEIÇÕES */}
          <div>
            <h3 className="eyebrow flex items-center gap-1.5 mb-2.5">
              <Utensils className="size-3.5 text-primary" /> Refeições do dia
            </h3>
            <div className="bento">
              {plan.meals?.map((meal, i) => (
                <div key={i} className="card-plain span-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-[15px] leading-none">{meal.name}</h4>
                      <span className="text-[10px] uppercase tracking-widest text-primary font-semibold">{meal.time}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="num text-xl font-bold leading-none">{meal.calories}</div>
                      <div className="text-[8px] uppercase tracking-widest text-muted-foreground font-semibold">kcal</div>
                    </div>
                  </div>
                  <ul className="space-y-1.5 mt-3.5">
                    {meal.items?.map((item, j) => (
                      <li key={j} className="text-[13px] text-foreground/80 flex items-start gap-2">
                        <span className="text-primary mt-1 shrink-0">•</span>{item}
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-3 pt-3 mt-3 border-t border-border text-[10px] font-bold uppercase tracking-wide">
                    <span className="text-rose-400">P {meal.protein}g</span>
                    <span className="text-amber-400">C {meal.carbs}g</span>
                    <span className="text-sky-400">G {meal.fat}g</span>
                  </div>
                  {meal.notes && <p className="text-[11px] text-muted-foreground mt-2">{meal.notes}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* NOTAS DIA TREINO / DESCANSO */}
          <div className="bento">
            {plan.trainingDayNotes && (
              <div className="card-plain span-6">
                <h4 className="font-bold text-sm flex items-center gap-2 text-primary"><Zap className="size-4" /> Dias de treino</h4>
                <p className="text-[13px] text-foreground/80 leading-relaxed mt-2">{plan.trainingDayNotes}</p>
              </div>
            )}
            {plan.restDayNotes && (
              <div className="card-plain span-6">
                <h4 className="font-bold text-sm flex items-center gap-2 text-muted-foreground"><Moon className="size-4" /> Dias de descanso</h4>
                <p className="text-[13px] text-foreground/80 leading-relaxed mt-2">{plan.restDayNotes}</p>
              </div>
            )}
          </div>

          {/* SUPLEMENTAÇÃO + DICAS */}
          <div className="bento">
            {plan.supplementation && (
              <div className="card-plain span-6">
                <h4 className="font-bold text-sm flex items-center gap-2 text-primary"><Pill className="size-4" /> Suplementação</h4>
                <p className="text-[13px] text-foreground/80 leading-relaxed mt-2">{plan.supplementation}</p>
              </div>
            )}
            {plan.generalTips?.length > 0 && (
              <div className="card-plain span-6">
                <h4 className="font-bold text-sm flex items-center gap-2"><Lightbulb className="size-4 text-amber-400" /> Dicas</h4>
                <ul className="space-y-1.5 mt-2.5">
                  {plan.generalTips.map((tip, i) => (
                    <li key={i} className="text-[13px] text-foreground/80 flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5 shrink-0">✓</span>{tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <p className="text-[11px] text-center text-muted-foreground px-4">
            Este plano é uma orientação gerada por IA. Para condições clínicas específicas, consulte um nutricionista.
          </p>
        </div>
      )}
    </DashboardLayout>
  );
}
