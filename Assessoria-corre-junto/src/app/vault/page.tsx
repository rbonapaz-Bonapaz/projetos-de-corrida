"use client";

import * as React from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TrainingContext } from "@/contexts/TrainingContext";
import { Button } from "@/components/ui/button";
import { Trophy, History, Calendar, Clock, MapPin, Milestone, Zap, Upload, Gauge } from "lucide-react";
import {
  getDisplayRecords,
  formatSecondsAsClock,
  formatDurationHuman,
  formatPace,
  deriveFitnessSnapshot,
} from "@/lib/records";

export default function VaultPage() {
  const context = React.useContext(TrainingContext);
  const profile = context?.activeProfile;

  const records = React.useMemo(() => getDisplayRecords(profile), [profile]);
  const stats = profile?.activityStats;
  const recentActivities = profile?.importedActivities || [];
  const fitness = React.useMemo(() => deriveFitnessSnapshot(profile), [profile]);

  const hasData = records.length > 0 || (stats && stats.activityCount > 0);

  return (
    <DashboardLayout>
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-[26px] font-bold tracking-tight flex items-center gap-2.5">
            <Trophy className="size-6 text-primary" /> Cofre de recordes
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">Seu legado atlético, a partir dos treinos analisados e importados.</p>
        </div>
        <span className="chip w-fit">
          <Trophy className="size-3.5 text-primary" /> {stats?.activityCount || 0} atividade{stats?.activityCount === 1 ? '' : 's'} registrada{stats?.activityCount === 1 ? '' : 's'}
        </span>
      </header>

      {!hasData && (
        <div className="card-plain text-center py-14 px-6 flex flex-col items-center gap-4">
          <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Trophy className="size-8" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h2 className="text-lg font-bold">Nenhum recorde ainda</h2>
            <p className="text-muted-foreground text-sm">
              Analise treinos do seu plano (com .FIT do COROS) ou importe seu histórico em <span className="text-primary font-semibold">Integrações</span> para
              o cofre começar a preencher sozinho — sem dado inventado.
            </p>
          </div>
          <Button asChild className="rounded-xl h-11 px-6">
            <Link href="/integrations" className="flex items-center gap-2">
              <Upload className="size-4" /> Importar do COROS
            </Link>
          </Button>
        </div>
      )}

      {hasData && (
        <>
          <div className="bento mb-5">
            {records.map((r) => (
              <div key={r.key} className="card-plain span-3">
                <p className="eyebrow !text-primary">{r.label}</p>
                <div className="num text-3xl font-bold mt-1">{formatSecondsAsClock(r.best.timeSeconds)}</div>
                <div className="mt-4 space-y-1.5">
                  {r.best.date && (
                    <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                      <Calendar className="size-3" /> {new Date(r.best.date).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                    <MapPin className="size-3" /> <span className="truncate">{r.best.label} · {r.best.source === 'plano' ? 'plano de treino' : r.best.source}</span>
                  </div>
                </div>
                <span className="tag num mt-3 inline-block">{formatPace(r.best.paceSecPerKm)}</span>
              </div>
            ))}
          </div>

          {fitness && (
            <section className="card-plain mb-5">
              <h3 className="eyebrow flex items-center gap-1.5 mb-4">
                <Gauge className="size-3.5 text-primary" /> Condicionamento atual (últimas {fitness.weeksAnalyzed} semanas)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="stat-tile">
                  <small>Volume médio</small>
                  <b className="num">{fitness.avgWeeklyKm}<i className="text-xs text-muted-foreground not-italic font-medium"> km/sem</i></b>
                </div>
                <div className="stat-tile">
                  <small>Sessões/semana</small>
                  <b className="num">{fitness.sessionsPerWeek}</b>
                </div>
                <div className="stat-tile">
                  <small>Maior recente</small>
                  <b className="num">{fitness.longestRecentRunKm}<i className="text-xs text-muted-foreground not-italic font-medium"> km</i></b>
                </div>
                <div className="stat-tile">
                  <small>VDOT estimado</small>
                  <b className="num">{fitness.estimatedVdot ?? '—'}</b>
                </div>
              </div>
              {fitness.daysSinceLastActivity !== undefined && fitness.daysSinceLastActivity > 14 && (
                <p className="text-[12px] text-amber-400 mt-3">
                  {fitness.daysSinceLastActivity} dias sem atividade registrada — o próximo ciclo gerado vai considerar isso.
                </p>
              )}
              <p className="text-[11px] text-muted-foreground mt-3">
                Esse condicionamento é usado automaticamente ao gerar um novo ciclo de treino em Meus Dados.
              </p>
            </section>
          )}

          <div className="bento">
            <section className="card-plain span-8">
              <h3 className="eyebrow flex items-center gap-1.5 mb-5">
                <History className="size-3.5 text-primary" /> Atividades recentes
              </h3>
              {recentActivities.length ? (
                <div className="space-y-5">
                  {recentActivities.slice(0, 8).map((a, i) => (
                    <div key={a.id} className="flex gap-4 relative">
                      {i !== Math.min(recentActivities.length, 8) - 1 && <div className="absolute left-[15px] top-9 bottom-[-20px] w-px bg-border" />}
                      <div className="size-8 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0 z-10">
                        <Zap className="size-4 text-primary" />
                      </div>
                      <div className="pb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[13px]">{a.sport || 'Atividade'}{a.distanceKm ? ` · ${a.distanceKm.toFixed(1)} km` : ''}</span>
                          <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-secondary rounded">
                            {a.startTime ? new Date(a.startTime).toLocaleDateString('pt-BR') : '—'}
                          </span>
                        </div>
                        <p className="text-[12px] text-muted-foreground mt-0.5">
                          {[a.durationText, a.avgPace, a.avgHr ? `${a.avgHr} bpm` : null].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-muted-foreground">
                  Os treinos concluídos pelo plano ainda não têm data associada — importe do COROS em Integrações para ver a linha do tempo aqui.
                </p>
              )}
            </section>

            <section className="card-plain span-4 h-fit">
              <h3 className="eyebrow mb-4">Métricas vitalícias</h3>
              <div className="flex flex-col gap-3">
                <div className="stat-tile flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[12px] text-muted-foreground"><Milestone className="size-4" /> Distância total</span>
                  <b className="num !text-base !mt-0">{(stats?.totalKm || 0).toFixed(1)} km</b>
                </div>
                <div className="stat-tile flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[12px] text-muted-foreground"><Clock className="size-4" /> Tempo de treino</span>
                  <b className="num !text-base !mt-0">{formatDurationHuman(stats?.totalDurationSec || 0)}</b>
                </div>
                {!!stats?.totalCalories && (
                  <div className="stat-tile flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[12px] text-muted-foreground"><Zap className="size-4" /> Calorias</span>
                    <b className="num !text-base !mt-0">{stats.totalCalories.toLocaleString('pt-BR')} kcal</b>
                  </div>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
