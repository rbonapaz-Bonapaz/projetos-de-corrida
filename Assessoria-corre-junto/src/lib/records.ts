/**
 * Deriva o "Cofre de Recordes" e o condicionamento atual a partir de dados
 * reais: atividades importadas do COROS (em lote ou individualmente) e
 * treinos do plano marcados como concluídos com análise da IA.
 *
 * Importante: um histórico completo (centenas/milhares de atividades) não
 * cabe num documento Firestore (limite de 1MB). Por isso a importação
 * calcula os recordes/estatísticas sobre o LOTE INTEIRO recebido, mas só
 * persiste o resultado (melhores marcas + totais acumulados + um log
 * limitado das atividades mais recentes) — nunca a lista completa.
 */

import type { AthleteProfile, PersonalRecordEntry, StoredPersonalRecord, ActivityStats, ImportedActivity } from '@/lib/types';

const DISTANCE_BUCKETS = [
  { key: '5k', label: '5K', km: 5, tolerance: 0.6 },
  { key: '10k', label: '10K', km: 10, tolerance: 1 },
  { key: '21k', label: 'Meia Maratona', km: 21.097, tolerance: 2 },
  { key: '42k', label: 'Maratona', km: 42.195, tolerance: 3 },
];

/** Recordes por distância só fazem sentido para esportes "a pé" — ciclismo/natação ficam de fora dos buckets 5K/10K/21K/42K. */
export function isRunningSport(sport?: string): boolean {
  if (!sport) return true;
  const s = sport.toLowerCase();
  return s === 'running' || s === 'walking' || s === 'hiking' || s.includes('run');
}

export function parsePaceToSecPerKm(pace?: string): number | undefined {
  if (!pace) return undefined;
  const m = pace.match(/(\d+):(\d{2})/);
  if (!m) return undefined;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

function parseWorkoutDistanceKm(distance?: string): number | undefined {
  if (!distance) return undefined;
  const m = distance.replace(',', '.').match(/(\d+(\.\d+)?)/);
  if (!m) return undefined;
  return parseFloat(m[1]);
}

export function formatSecondsAsClock(totalSeconds: number): string {
  const s = Math.round(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function formatPace(secPerKm: number): string {
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, '0')}/km`;
}

/** Para totais grandes (horas de treino acumuladas) — "1159:24:26" não é legível; usa "48d 7h" / "12h 30min". */
export function formatDurationHuman(totalSeconds: number): string {
  const totalMinutes = Math.round(totalSeconds / 60);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
}

/** Entradas "candidatas" a partir de treinos do plano concluídos+analisados (lista sempre pequena, ok recalcular sempre). */
export function derivePlanEntries(profile: AthleteProfile | null | undefined): PersonalRecordEntry[] {
  if (!profile) return [];
  const entries: PersonalRecordEntry[] = [];
  profile.trainingPlan?.weeklyPlans?.forEach((week) => {
    week.runs?.forEach((run) => {
      if (!run.completed || !run.analysis) return;
      const distanceKm = parseWorkoutDistanceKm(run.distance);
      const paceSecPerKm = parsePaceToSecPerKm(run.analysis.actualMetrics?.averagePace);
      if (!distanceKm || !paceSecPerKm) return;
      entries.push({
        distanceKm,
        timeSeconds: distanceKm * paceSecPerKm,
        paceSecPerKm,
        label: run.type,
        source: 'plano',
      });
    });
  });
  return entries;
}

/** Converte um resumo de arquivo .fit recém-parseado numa entrada candidata a recorde. */
export function fitSummaryToEntry(
  summary: { distanceKm?: number; durationSec?: number; avgPace?: string; startTime?: string; sport?: string },
): PersonalRecordEntry | null {
  if (!summary.distanceKm || !isRunningSport(summary.sport)) return null;
  let timeSeconds = summary.durationSec;
  if (!timeSeconds && summary.avgPace) {
    const pace = parsePaceToSecPerKm(summary.avgPace);
    if (pace) timeSeconds = pace * summary.distanceKm;
  }
  if (!timeSeconds) return null;
  return {
    distanceKm: summary.distanceKm,
    timeSeconds,
    paceSecPerKm: timeSeconds / summary.distanceKm,
    date: summary.startTime,
    label: summary.sport ? summary.sport.charAt(0).toUpperCase() + summary.sport.slice(1) : 'Atividade importada',
    source: 'coros',
  };
}

/** Funde candidatos novos com os recordes já salvos, mantendo só o melhor por distância-padrão. */
export function mergePersonalRecords(
  existing: StoredPersonalRecord[] | undefined,
  candidates: PersonalRecordEntry[],
): StoredPersonalRecord[] {
  const byKey = new Map<string, StoredPersonalRecord>();
  (existing || []).forEach((r) => byKey.set(r.key, r));

  for (const bucket of DISTANCE_BUCKETS) {
    const matches = candidates.filter((e) => Math.abs(e.distanceKm - bucket.km) <= bucket.tolerance);
    if (!matches.length) continue;
    const bestCandidate = matches.reduce((a, b) => (a.timeSeconds < b.timeSeconds ? a : b));
    const current = byKey.get(bucket.key);
    if (!current || bestCandidate.timeSeconds < current.best.timeSeconds) {
      byKey.set(bucket.key, { key: bucket.key, label: bucket.label, best: bestCandidate });
    }
  }

  return DISTANCE_BUCKETS.map((b) => byKey.get(b.key)).filter((r): r is StoredPersonalRecord => !!r);
}

/** Soma os totais de um novo lote aos totais já acumulados. */
export function addActivityStats(existing: ActivityStats | undefined, batch: { distanceKm?: number; durationSec?: number; calories?: number }[]): ActivityStats {
  const base = existing || { totalKm: 0, totalDurationSec: 0, totalCalories: 0, activityCount: 0 };
  return {
    totalKm: base.totalKm + batch.reduce((s, a) => s + (a.distanceKm || 0), 0),
    totalDurationSec: base.totalDurationSec + batch.reduce((s, a) => s + (a.durationSec || 0), 0),
    totalCalories: base.totalCalories + batch.reduce((s, a) => s + (a.calories || 0), 0),
    activityCount: base.activityCount + batch.length,
  };
}

/** Mantém só as N atividades mais recentes (por data), mais novas primeiro. */
export function trimRecentActivities(activities: ImportedActivity[], cap = 60): ImportedActivity[] {
  return [...activities]
    .sort((a, b) => new Date(b.startTime || b.importedAt).getTime() - new Date(a.startTime || a.importedAt).getTime())
    .slice(0, cap);
}

/** Vista combinada para a tela do Cofre: recordes salvos + candidatos ao vivo do plano de treino. */
export function getDisplayRecords(profile: AthleteProfile | null | undefined): StoredPersonalRecord[] {
  const planEntries = derivePlanEntries(profile);
  return mergePersonalRecords(profile?.personalRecords, planEntries);
}

export interface FitnessSnapshot {
  weeksAnalyzed: number;
  avgWeeklyKm: number;
  sessionsPerWeek: number;
  longestRecentRunKm: number;
  recentAvgPaceSecPerKm?: number;
  daysSinceLastActivity?: number;
  estimatedVdot?: number;
}

/**
 * Estima o condicionamento atual a partir das atividades importadas mais
 * recentes (últimas ~8 semanas) — usado para calibrar o próximo ciclo de
 * treino com dados reais em vez de só o que o atleta digitou no perfil.
 */
export function deriveFitnessSnapshot(profile: AthleteProfile | null | undefined, weeks = 8): FitnessSnapshot | null {
  const activities = profile?.importedActivities || [];
  if (!activities.length) return null;

  const cutoff = Date.now() - weeks * 7 * 24 * 60 * 60 * 1000;
  const recent = activities.filter((a) => a.startTime && new Date(a.startTime).getTime() >= cutoff && isRunningSport(a.sport));
  if (!recent.length) return null;

  const totalKm = recent.reduce((s, a) => s + (a.distanceKm || 0), 0);
  const longest = Math.max(...recent.map((a) => a.distanceKm || 0));
  const paced = recent.filter((a) => a.avgPace && a.distanceKm && a.distanceKm >= 3);
  const avgPaceSec = paced.length
    ? paced.reduce((s, a) => s + (parsePaceToSecPerKm(a.avgPace) || 0), 0) / paced.length
    : undefined;

  const mostRecent = [...recent].sort((a, b) => new Date(b.startTime!).getTime() - new Date(a.startTime!).getTime())[0];
  const daysSinceLastActivity = mostRecent?.startTime
    ? Math.floor((Date.now() - new Date(mostRecent.startTime).getTime()) / (1000 * 60 * 60 * 24))
    : undefined;

  // VDOT aproximado (Daniels/Gilbert) a partir do melhor esforço recente >= 15min.
  const raceLike = recent
    .filter((a) => (a.durationSec || 0) >= 900 && a.distanceKm)
    .map((a) => fitSummaryToEntry(a))
    .filter((e): e is PersonalRecordEntry => !!e);
  const estimatedVdot = raceLike.length ? estimateVdotFromEntries(raceLike) : undefined;

  return {
    weeksAnalyzed: weeks,
    avgWeeklyKm: Math.round((totalKm / weeks) * 10) / 10,
    sessionsPerWeek: Math.round((recent.length / weeks) * 10) / 10,
    longestRecentRunKm: Math.round(longest * 10) / 10,
    recentAvgPaceSecPerKm: avgPaceSec,
    daysSinceLastActivity,
    estimatedVdot,
  };
}

/** VDOT aproximado (fórmula de Daniels/Gilbert) a partir do melhor esforço disponível. */
function estimateVdotFromEntries(entries: PersonalRecordEntry[]): number | undefined {
  const best = entries.reduce((a, b) => (a.paceSecPerKm < b.paceSecPerKm ? a : b));
  const t = best.timeSeconds / 60; // minutos
  const velocityMPerMin = (best.distanceKm * 1000) / t;
  const vo2 = -4.6 + 0.182258 * velocityMPerMin + 0.000104 * velocityMPerMin * velocityMPerMin;
  const pctMax = 0.8 + 0.1894393 * Math.exp(-0.012778 * t) + 0.2989558 * Math.exp(-0.1932605 * t);
  if (!pctMax) return undefined;
  const vdot = vo2 / pctMax;
  return Math.round(vdot * 10) / 10;
}

export function formatFitnessSnapshotForPrompt(snap: FitnessSnapshot | null): string {
  if (!snap) return 'Sem histórico de atividades importado ainda — considere apenas os dados do perfil.';
  const lines: string[] = [];
  lines.push(`Últimas ${snap.weeksAnalyzed} semanas: média de ${snap.avgWeeklyKm} km/semana em ${snap.sessionsPerWeek} sessões/semana.`);
  lines.push(`Maior corrida recente: ${snap.longestRecentRunKm} km.`);
  if (snap.recentAvgPaceSecPerKm) lines.push(`Pace médio recente: ${formatPace(snap.recentAvgPaceSecPerKm)}.`);
  if (snap.estimatedVdot) lines.push(`VDOT estimado a partir do histórico real: ${snap.estimatedVdot}.`);
  if (snap.daysSinceLastActivity !== undefined) {
    lines.push(
      snap.daysSinceLastActivity > 14
        ? `Atenção: ${snap.daysSinceLastActivity} dias sem atividade registrada — tratar como possível destreino, retomar progressão do zero.`
        : `Última atividade registrada há ${snap.daysSinceLastActivity} dia(s).`
    );
  }
  return lines.join(' ');
}
