
"use client";

import * as React from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TrainingContext } from "@/contexts/TrainingContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Workout } from "@/lib/types";
import { ArrowRight, CheckCircle2, Plus } from "lucide-react";

const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const chartData = [
  { day: "D", previsto: 0, real: 0 },
  { day: "S", previsto: 5, real: 4.8 },
  { day: "T", previsto: 8, real: 8.2 },
  { day: "Q", previsto: 0, real: 0 },
  { day: "Q", previsto: 12, real: 11.5 },
  { day: "S", previsto: 6, real: 7.0 },
  { day: "S", previsto: 22, real: 22.4 },
];

function buildChartPath(values: number[], w: number, h: number, pad = 6) {
  const max = Math.max(...values, 1);
  const step = w / (values.length - 1);
  return values
    .map((v, i) => {
      const x = i * step;
      const y = h - pad - (v / max) * (h - pad * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function getRecoveryStatus(percent: number) {
  if (percent <= 29)
    return { label: "Fadiga aguda", color: "var(--crit)", desc: "Exausto. Repouso absoluto necessário." };
  if (percent <= 59)
    return { label: "Recuperação parcial", color: "var(--warn)", desc: "Recuperando. Apenas regenerativos liberados." };
  if (percent <= 89)
    return { label: "Prontidão boa", color: "var(--good)", desc: "Condicionado. Sinal verde para base e longões." };
  return { label: "Prontidão total", color: "var(--good)", desc: "Pico de performance. Ideal para intervalados." };
}

export default function Home() {
  const context = React.useContext(TrainingContext);
  const profile = context?.activeProfile;
  const plan = context?.trainingPlan;

  const [daysToRace, setDaysToRace] = React.useState<number | null>(null);
  const [recoveryPercent] = React.useState(82);

  React.useEffect(() => {
    if (profile?.raceDate) {
      const raceDate = new Date(profile.raceDate);
      const today = new Date();
      const diffTime = raceDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysToRace(diffDays > 0 ? diffDays : 0);
    }
  }, [profile?.raceDate]);

  const recoveryStatus = getRecoveryStatus(recoveryPercent);

  const week = plan?.weeklyPlans?.[0];
  const todayName = WEEKDAYS[new Date().getDay()];
  const todayWorkout: Workout | undefined =
    week?.runs?.find((r) => r.day === todayName) || week?.runs?.[0];

  const lastAnalyzed = React.useMemo(() => {
    if (!plan) return null;
    for (let wi = plan.weeklyPlans.length - 1; wi >= 0; wi--) {
      const runs = plan.weeklyPlans[wi].runs;
      for (let ri = runs.length - 1; ri >= 0; ri--) {
        if (runs[ri].completed && runs[ri].analysis) return runs[ri];
      }
    }
    return null;
  }, [plan]);

  const weeklyVolume = week?.runs?.reduce((sum, r) => sum + (parseFloat(r.distance) || 0), 0) || 0;

  const ringR = 64;
  const ringCirc = 2 * Math.PI * ringR;
  const ringOffset = ringCirc * (1 - recoveryPercent / 100);

  const chartW = 380;
  const chartH = 150;
  const realPath = buildChartPath(chartData.map((d) => d.real), chartW, chartH);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-1.5 mb-6">
        <h1 className="text-2xl md:text-[26px] font-bold tracking-tight">
          Bom treino{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}.
        </h1>
        <p className="text-[13px] text-muted-foreground">
          {plan
            ? `${plan.blockType} · Semana ${week?.weekNumber ?? 1} de ${plan.durationWeeks} · foco em ${week?.focus?.toLowerCase() || "base"}`
            : "Configure seu perfil para gerar um plano de treino."}
        </p>
      </div>

      <div className="bento">
        {/* Prontidão */}
        <section className="card-plain span-5">
          <h3 className="eyebrow">Prontidão de hoje</h3>
          <div className="flex gap-6 items-center flex-wrap mt-3.5">
            <div className="ring-wrap" style={{ width: 150, height: 150 }}>
              <svg width={150} height={150} viewBox="0 0 150 150">
                <circle cx="75" cy="75" r={ringR} fill="none" stroke="hsl(var(--ring-track))" strokeWidth="13" />
                <circle
                  cx="75"
                  cy="75"
                  r={ringR}
                  fill="none"
                  stroke="hsl(var(--good))"
                  strokeWidth="13"
                  strokeLinecap="round"
                  strokeDasharray={ringCirc}
                  strokeDashoffset={ringOffset}
                  style={{ transform: "rotate(-90deg)", transformOrigin: "75px 75px" }}
                />
              </svg>
              <div className="rv">
                <b className="num text-[38px] font-bold tracking-tight leading-none">{recoveryPercent}</b>
                <small className="block text-[10px] tracking-[0.14em] uppercase text-muted-foreground mt-0.5">
                  {recoveryStatus.label.split(" ")[0]}
                </small>
              </div>
            </div>
            <div className="min-w-[180px] flex-1">
              <span
                className="inline-flex items-center gap-1.5 font-bold text-sm px-2.5 py-1.5 rounded-lg mb-2.5"
                style={{ color: `hsl(${recoveryStatus.color})`, background: "hsl(var(--accent-soft))" }}
              >
                ● {recoveryStatus.label}
              </span>
              <p className="text-muted-foreground text-[13.5px] max-w-[42ch]">{recoveryStatus.desc}</p>
              <div className="flex gap-5 mt-4 flex-wrap">
                <div>
                  <small className="block text-[10px] uppercase tracking-wide text-muted-foreground">FC repouso</small>
                  <b className="num text-[17px] font-bold">{profile?.restingHr || "—"}</b>
                </div>
                <div>
                  <small className="block text-[10px] uppercase tracking-wide text-muted-foreground">Peso</small>
                  <b className="num text-[17px] font-bold">{profile?.currentWeight ? `${profile.currentWeight}kg` : "—"}</b>
                </div>
                <div>
                  <small className="block text-[10px] uppercase tracking-wide text-muted-foreground">VDOT</small>
                  <b className="num text-[17px] font-bold">{profile?.vo2Max || "—"}</b>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Countdown */}
        <section className="card-plain span-3">
          <h3 className="eyebrow">Próxima prova</h3>
          <div className="flex flex-col h-full justify-between mt-2.5">
            {profile?.raceName ? (
              <div>
                <div className="num text-[44px] font-bold tracking-tighter leading-none">
                  {daysToRace ?? "—"}
                  <span className="text-[16px] text-muted-foreground font-semibold tracking-normal"> dias</span>
                </div>
                <div className="font-bold text-[14px] mt-1 truncate">{profile.raceName}</div>
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {profile.targetPace && <span className="tag acc num">Pace-alvo {profile.targetPace}</span>}
                  {profile.raceDate && (
                    <span className="tag num">{new Date(profile.raceDate).toLocaleDateString("pt-BR")}</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-[11px] text-muted-foreground font-semibold">Nenhuma prova configurada</p>
              </div>
            )}
            {profile?.vo2Max && (
              <div className="mt-4">
                <span className="tag">
                  VDOT projeta <b className="num text-primary">{profile.vo2Max}</b>
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Volume semanal */}
        <section className="card-plain span-4">
          <div className="flex justify-between items-start">
            <h3 className="eyebrow">Volume da semana</h3>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                <i className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "hsl(var(--border))" }} />
                Previsto
              </span>
              <span className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                <i className="inline-block w-2.5 h-2.5 rounded-sm bg-primary" />
                Real
              </span>
            </div>
          </div>
          <div className="mt-2 overflow-x-auto">
            <svg width="100%" height={chartH} viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="none">
              <g stroke="hsl(var(--border))" strokeWidth="1">
                <line x1="0" y1="30" x2={chartW} y2="30" />
                <line x1="0" y1="70" x2={chartW} y2="70" />
                <line x1="0" y1="110" x2={chartW} y2="110" />
              </g>
              <path d={realPath} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex justify-between font-mono text-[10px] text-muted-foreground mt-0.5">
            {chartData.map((d, i) => (
              <span key={i}>{d.day}</span>
            ))}
          </div>
        </section>

        {/* Treino de hoje */}
        <section className="card-plain span-5">
          <div className="flex justify-between items-center">
            <h3 className="eyebrow">Treino de hoje · {todayName}</h3>
            {todayWorkout?.rpe && <span className="tag acc num">RPE {todayWorkout.rpe}</span>}
          </div>
          {todayWorkout ? (
            <>
              <div className="text-[22px] font-bold tracking-tight mt-3">{todayWorkout.type}</div>
              <div className="flex gap-2 my-3.5 flex-wrap">
                <b className="num text-[12.5px] font-semibold px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground">
                  {todayWorkout.distance}
                </b>
                {todayWorkout.paceZone && (
                  <b className="num text-[12.5px] font-semibold px-2.5 py-1.5 rounded-lg bg-secondary">
                    {todayWorkout.paceZone}
                  </b>
                )}
                {todayWorkout.estimatedDuration && (
                  <b className="num text-[12.5px] font-semibold px-2.5 py-1.5 rounded-lg bg-secondary">
                    {todayWorkout.estimatedDuration}
                  </b>
                )}
              </div>
              <p className="text-muted-foreground text-[13px]">{todayWorkout.description}</p>
              {!!todayWorkout.phases?.length && (
                <div className="mt-3.5 flex flex-col gap-2">
                  {todayWorkout.phases.map((ph, i) => (
                    <div key={i} className="phase-row">
                      <span className="n">{i + 1}</span>
                      <span className="font-semibold text-[13px]">{ph.name}</span>
                      <span className="ml-auto num text-[12.5px] text-muted-foreground">
                        {ph.distance}
                        {ph.pace ? ` · ${ph.pace}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-[12px] text-muted-foreground font-medium mb-3">Nenhum plano ativo ainda.</p>
              <Button asChild size="sm" className="rounded-lg">
                <Link href="/profile" className="flex items-center gap-1.5">
                  <Plus className="size-3.5" /> Configurar perfil
                </Link>
              </Button>
            </div>
          )}
        </section>

        {/* Marcadores */}
        <section className="card-plain span-4">
          <h3 className="eyebrow">Marcadores</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3.5">
            <div className="stat-tile">
              <small>Volume sem.</small>
              <b className="num">
                {weeklyVolume.toFixed(0)}
                <i className="text-xs text-muted-foreground not-italic font-medium"> km</i>
              </b>
            </div>
            <div className="stat-tile">
              <small>VDOT</small>
              <b className="num">{profile?.vo2Max || "—"}</b>
            </div>
            <div className="stat-tile">
              <small>FC limiar</small>
              <b className="num">{profile?.thresholdHr || "—"}</b>
            </div>
            <div className="stat-tile">
              <small>Pace limiar</small>
              <b className="num">{profile?.thresholdPace || "—"}</b>
            </div>
          </div>
        </section>

        {/* Última análise COROS */}
        <section className="card-plain span-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="eyebrow">Última análise</h3>
            <span className="text-[10px] font-bold tracking-wide px-2 py-1 rounded-md bg-primary/15 text-primary">
              COROS
            </span>
          </div>
          {lastAnalyzed ? (
            <>
              <div className="mt-2 font-bold text-sm truncate">
                {lastAnalyzed.type} · {lastAnalyzed.distance}
              </div>
              <div className="grid grid-cols-2 gap-2.5 my-3.5">
                <div className="metric-tile">
                  <small>Pace</small>
                  <b>{lastAnalyzed.analysis?.actualMetrics.averagePace || "—"}</b>
                </div>
                <div className="metric-tile">
                  <small>Cadência</small>
                  <b>{lastAnalyzed.analysis?.actualMetrics.averageCadence || "—"}</b>
                </div>
                <div className="metric-tile">
                  <small>GCT</small>
                  <b>
                    {lastAnalyzed.analysis?.actualMetrics.groundContactTime || "—"}
                  </b>
                </div>
                <div className="metric-tile">
                  <small>Osc. vert.</small>
                  <b>{lastAnalyzed.analysis?.actualMetrics.verticalOscillation || "—"}</b>
                </div>
              </div>
              <div className="flex gap-2.5 p-3 rounded-xl" style={{ background: "hsl(var(--accent-soft))" }}>
                <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[13px] leading-relaxed">
                  {lastAnalyzed.analysis?.analysisSummary.summary}
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-[12px] text-muted-foreground font-medium mb-3">Nenhum treino analisado ainda.</p>
              <Button asChild size="sm" variant="outline" className="rounded-lg">
                <Link href="/analysis" className="flex items-center gap-1.5">
                  Enviar .FIT <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
