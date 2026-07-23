/**
 * Integração com o Strava — OAuth oficial (API pública e documentada,
 * diferente do COROS). O fluxo:
 *
 * 1. Cliente redireciona pro Strava (stravaAuthorizeUrl) com o Client ID
 *    (público, seguro expor).
 * 2. Strava redireciona de volta pra /integrations com ?code=...
 * 3. Cliente manda esse code pra Cloud Function "stravaExchangeToken",
 *    que troca por access/refresh token usando o Client Secret (nunca
 *    exposto no navegador).
 * 4. Sincronizações seguintes chamam "stravaSync", que renova o token
 *    (também precisa do secret) e busca as atividades recentes.
 *
 * Diferente do COROS, os campos do Strava são documentados publicamente
 * (distância em metros, tempo em segundos etc.) — dá pra mapear direto
 * pro nosso formato, sem precisar baixar/reprocessar um arquivo bruto.
 */

'use client';

import { getApps, getApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { mergePersonalRecords, addActivityStats, trimRecentActivities, fitSummaryToEntry, isDuplicateActivity } from '@/lib/records';
import type { AthleteProfile, ImportedActivity, IntegrationData } from '@/lib/types';

const FUNCTIONS_REGION = 'southamerica-east1';
const CLIENT_ID = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID || '';

export function isStravaConfigured(): boolean {
  return !!CLIENT_ID;
}

export function stravaAuthorizeUrl(redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirectUri,
    approval_prompt: 'auto',
    scope: 'activity:read_all',
  });
  return `https://www.strava.com/oauth/authorize?${params.toString()}`;
}

interface StravaExchangeResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  athleteName?: string;
}

export async function exchangeStravaCode(code: string): Promise<StravaExchangeResponse> {
  if (!getApps().length) throw new Error('Firebase não inicializado.');
  const functions = getFunctions(getApp(), FUNCTIONS_REGION);
  const call = httpsCallable<{ code: string; clientId: string }, StravaExchangeResponse>(functions, 'stravaExchangeToken');
  const res = await call({ code, clientId: CLIENT_ID });
  return res.data;
}

interface StravaActivitySummary {
  id: number;
  name?: string;
  type?: string;
  sport_type?: string;
  distance?: number;
  moving_time?: number;
  start_date?: string;
  average_speed?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_cadence?: number;
  total_elevation_gain?: number;
  calories?: number;
}

interface StravaSyncCallResponse {
  activities: StravaActivitySummary[];
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

function mapStravaSport(type?: string, sportType?: string): string {
  const t = (sportType || type || '').toLowerCase();
  if (t.includes('run')) return 'running';
  if (t.includes('walk')) return 'walking';
  if (t.includes('hike')) return 'hiking';
  if (t.includes('ride') || t.includes('bike') || t.includes('cycl')) return 'cycling';
  return t || 'other';
}

function paceFromSpeedMs(speedMs?: number): string | undefined {
  if (!speedMs || speedMs <= 0) return undefined;
  const minPerKm = 1000 / (speedMs * 60);
  const m = Math.floor(minPerKm);
  const s = Math.round((minPerKm - m) * 60);
  const mm = s === 60 ? m + 1 : m;
  const ss = s === 60 ? 0 : s;
  return `${mm}:${String(ss).padStart(2, '0')}/km`;
}

function formatDurationText(sec?: number): string | undefined {
  if (!sec) return undefined;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.round(sec % 60);
  return h > 0 ? `${h}h${String(m).padStart(2, '0')}min` : `${m}min${String(s).padStart(2, '0')}s`;
}

function stravaActivityToImportedActivity(a: StravaActivitySummary): ImportedActivity {
  const sport = mapStravaSport(a.type, a.sport_type);
  const isRunning = sport === 'running' || sport === 'walking' || sport === 'hiking';
  return {
    id: typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2),
    source: 'strava',
    fileName: `strava-${a.id}`,
    importedAt: new Date().toISOString(),
    sport,
    startTime: a.start_date,
    distanceKm: a.distance !== undefined ? Number((a.distance / 1000).toFixed(2)) : undefined,
    durationSec: a.moving_time,
    durationText: formatDurationText(a.moving_time),
    avgPace: isRunning ? paceFromSpeedMs(a.average_speed) : undefined,
    avgSpeedKmh: !isRunning && a.average_speed ? Number((a.average_speed * 3.6).toFixed(1)) : undefined,
    avgHr: a.average_heartrate ? Math.round(a.average_heartrate) : undefined,
    maxHr: a.max_heartrate ? Math.round(a.max_heartrate) : undefined,
    // Cadência de corrida no Strava vem "por perna" (mesma convenção do Garmin/COROS) — dobra pra SPM total.
    avgCadenceSpm: a.average_cadence ? Math.round(a.average_cadence * (isRunning ? 2 : 1)) : undefined,
    totalAscentM: a.total_elevation_gain ? Math.round(a.total_elevation_gain) : undefined,
    calories: a.calories ? Math.round(a.calories) : undefined,
  };
}

export interface StravaSyncResult {
  update: Partial<AthleteProfile>;
  imported: number;
  skippedDuplicateContent: number;
}

export async function syncStravaActivities(profile: AthleteProfile): Promise<StravaSyncResult> {
  const refreshToken = profile.integrations?.strava?.refreshToken;
  if (!refreshToken) {
    throw new Error('Conecte sua conta Strava primeiro.');
  }
  if (!getApps().length) throw new Error('Firebase não inicializado.');
  const functions = getFunctions(getApp(), FUNCTIONS_REGION);
  const call = httpsCallable<{ clientId: string; refreshToken: string; maxActivities: number }, StravaSyncCallResponse>(
    functions,
    'stravaSync'
  );
  const res = await call({ clientId: CLIENT_ID, refreshToken, maxActivities: 15 });
  const { activities, accessToken, refreshToken: newRefreshToken, expiresAt } = res.data;

  const recentActivities = profile.importedActivities || [];
  const batch: ImportedActivity[] = [];
  let skippedDuplicateContent = 0;

  for (const a of activities) {
    const imported = stravaActivityToImportedActivity(a);
    if (isDuplicateActivity([...recentActivities, ...batch], imported.startTime)) {
      skippedDuplicateContent++;
      continue;
    }
    batch.push(imported);
  }

  const candidateEntries = batch.map(fitSummaryToEntry).filter((e): e is NonNullable<typeof e> => !!e);
  const updatedRecords = mergePersonalRecords(profile.personalRecords, candidateEntries);
  const updatedStats = addActivityStats(profile.activityStats, batch);
  let updatedRecent = trimRecentActivities([...batch, ...recentActivities]);
  const updatedFileNames = [...(profile.importedFileNames || []), ...batch.map((b) => b.fileName)];

  const update: Partial<AthleteProfile> = {
    personalRecords: updatedRecords,
    activityStats: updatedStats,
    importedActivities: updatedRecent,
    importedFileNames: updatedFileNames,
    integrations: {
      coros: profile.integrations?.coros as IntegrationData,
      strava: {
        ...profile.integrations?.strava,
        connected: true,
        autoSync: true,
        accessToken,
        refreshToken: newRefreshToken,
        lastSync: new Date().toISOString(),
      } as IntegrationData,
    },
  };

  const estimatedBytes = new Blob([JSON.stringify({ ...profile, ...update })]).size;
  if (estimatedBytes > 850_000) {
    updatedRecent = trimRecentActivities([...batch, ...recentActivities], 15);
    update.importedActivities = updatedRecent;
  }

  // expiresAt não é usado no cliente hoje (a function sempre renova via
  // refresh_token a cada sync), guardado só pra eventual uso futuro.
  void expiresAt;

  return { update, imported: batch.length, skippedDuplicateContent };
}
