/**
 * Sincronização automática com a COROS — chama a Cloud Function "corosSync"
 * (proxy server-side, contorna o bloqueio de CORS da API não-oficial da
 * COROS) e reaproveita o parser de .fit já usado na importação manual em
 * Integrações, garantindo o mesmo pipeline de merge/dedupe.
 *
 * A senha é enviada uma única vez por chamada, direto pro Cloud Function
 * (HTTPS), e nunca é persistida em lugar nenhum deste módulo.
 */

'use client';

import { getApps, getApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { parseFitFile } from '@/lib/fit-parser';
import { fitSummaryToEntry, fitSummaryToImportedActivity, mergePersonalRecords, addActivityStats, trimRecentActivities } from '@/lib/records';
import type { AthleteProfile, ImportedActivity, IntegrationData } from '@/lib/types';

const FUNCTIONS_REGION = 'southamerica-east1';

interface CorosSyncActivityResult {
  labelId: string;
  name?: string;
  startTime?: string;
  sportType?: number;
  fitBase64: string;
}

interface CorosSyncCallResponse {
  activities: CorosSyncActivityResult[];
  totalFoundOnCoros: number;
  skippedAlreadyKnown: number;
  skippedNoFitAvailable: number;
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/** "Nome de arquivo" sintético pras atividades trazidas via sync — reaproveita a mesma dedupe (importedFileNames) já usada na importação manual, sem precisar de um segundo mecanismo. */
export function corosApiFileName(labelId: string): string {
  return `coros-api-${labelId}.fit`;
}

export interface CorosSyncResult {
  update: Partial<AthleteProfile>;
  imported: number;
  skippedAlreadyKnown: number;
  skippedUnparseable: number;
  totalFoundOnCoros: number;
}

export async function syncCorosActivities(
  profile: AthleteProfile,
  email: string,
  password: string
): Promise<CorosSyncResult> {
  if (!getApps().length) throw new Error('Firebase não inicializado.');
  const functions = getFunctions(getApp(), FUNCTIONS_REGION);
  const call = httpsCallable<
    { email: string; password: string; knownLabelIds: string[]; maxActivities: number },
    CorosSyncCallResponse
  >(functions, 'corosSync');

  const knownLabelIds = (profile.importedFileNames || [])
    .filter((f) => f.startsWith('coros-api-'))
    .map((f) => f.replace(/^coros-api-/, '').replace(/\.fit$/, ''));

  const res = await call({ email, password, knownLabelIds, maxActivities: 15 });
  const { activities, totalFoundOnCoros, skippedAlreadyKnown } = res.data;

  const batch: ImportedActivity[] = [];
  let skippedUnparseable = 0;

  for (const a of activities) {
    try {
      const buffer = base64ToArrayBuffer(a.fitBase64);
      const summary = await parseFitFile(buffer);
      batch.push(fitSummaryToImportedActivity(summary, { fileName: corosApiFileName(a.labelId), source: 'coros' }));
    } catch {
      skippedUnparseable++;
    }
  }

  const recentActivities = profile.importedActivities || [];
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
      strava: profile.integrations?.strava as IntegrationData,
      coros: {
        ...profile.integrations?.coros,
        connected: true,
        autoSync: true,
        lastSync: new Date().toISOString(),
      } as IntegrationData,
    },
  };

  // Mesma proteção de tamanho de documento usada na importação manual (limite ~1MB do Firestore).
  const estimatedBytes = new Blob([JSON.stringify({ ...profile, ...update })]).size;
  if (estimatedBytes > 850_000) {
    updatedRecent = trimRecentActivities([...batch, ...recentActivities], 15);
    update.importedActivities = updatedRecent;
  }

  return {
    update,
    imported: batch.length,
    skippedAlreadyKnown,
    skippedUnparseable,
    totalFoundOnCoros,
  };
}
