/**
 * Deriva o "Cofre de Recordes" a partir de dados reais em vez de mock:
 * atividades importadas do COROS (src/lib/backup + integrations) e
 * treinos do plano marcados como concluídos com análise da IA.
 */

import type { AthleteProfile } from '@/lib/types';

export interface RecordEntry {
  distanceKm: number;
  timeSeconds: number;
  paceSecPerKm: number;
  date?: string;
  label: string;
  source: 'coros' | 'strava' | 'manual' | 'plano';
}

export interface PersonalRecord {
  key: string;
  label: string;
  best: RecordEntry;
}

export interface LifetimeStats {
  totalKm: number;
  totalDurationSec: number;
  totalCalories: number;
  activityCount: number;
}

const DISTANCE_BUCKETS = [
  { key: '5k', label: '5K', km: 5, tolerance: 0.6 },
  { key: '10k', label: '10K', km: 10, tolerance: 1 },
  { key: '21k', label: 'Meia Maratona', km: 21.097, tolerance: 2 },
  { key: '42k', label: 'Maratona', km: 42.195, tolerance: 3 },
];

function parsePaceToSecPerKm(pace?: string): number | undefined {
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

/** Une atividades importadas (COROS) e treinos do plano concluídos+analisados numa única linha do tempo. */
export function deriveRecordEntries(profile: AthleteProfile | null | undefined): RecordEntry[] {
  if (!profile) return [];
  const entries: RecordEntry[] = [];

  (profile.importedActivities || []).forEach((a) => {
    if (!a.distanceKm) return;
    let timeSeconds = a.durationSec;
    if (!timeSeconds && a.avgPace) {
      const pace = parsePaceToSecPerKm(a.avgPace);
      if (pace) timeSeconds = pace * a.distanceKm;
    }
    if (!timeSeconds) return;
    entries.push({
      distanceKm: a.distanceKm,
      timeSeconds,
      paceSecPerKm: timeSeconds / a.distanceKm,
      date: a.startTime,
      label: a.sport ? a.sport.charAt(0).toUpperCase() + a.sport.slice(1) : 'Atividade importada',
      source: a.source,
    });
  });

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
        date: undefined,
        label: run.type,
        source: 'plano',
      });
    });
  });

  return entries;
}

/** Melhor tempo por distância-padrão (5K/10K/Meia/Maratona), só para buckets com dado real. */
export function computePersonalRecords(entries: RecordEntry[]): PersonalRecord[] {
  const records: PersonalRecord[] = [];
  for (const bucket of DISTANCE_BUCKETS) {
    const candidates = entries.filter((e) => Math.abs(e.distanceKm - bucket.km) <= bucket.tolerance);
    if (!candidates.length) continue;
    const best = candidates.reduce((a, b) => (a.timeSeconds < b.timeSeconds ? a : b));
    records.push({ key: bucket.key, label: bucket.label, best });
  }
  return records;
}

export function computeLifetimeStats(profile: AthleteProfile | null | undefined, entries: RecordEntry[]): LifetimeStats {
  const totalKm = entries.reduce((sum, e) => sum + e.distanceKm, 0);
  const totalDurationSec = entries.reduce((sum, e) => sum + e.timeSeconds, 0);
  const totalCalories = (profile?.importedActivities || []).reduce((sum, a) => sum + (a.calories || 0), 0);
  return { totalKm, totalDurationSec, totalCalories, activityCount: entries.length };
}
