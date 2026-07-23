/**
 * Sincronização direta com a Google Agenda — sem passar por .ics. Usa a API
 * oficial do Google (OAuth via Google Identity Services), diferente do COROS:
 * aqui existe um jeito suportado e documentado de escrever eventos.
 *
 * Cria (ou reaproveita) dois calendários próprios do atleta — "CorreJunto —
 * Corrida" e "CorreJunto — Força" — e sincroniza os treinos de cada um lá,
 * sem misturar com a agenda pessoal. Dieta fica de fora (é um molde diário
 * fixo, não tem data pra virar evento).
 *
 * Reenviar o mesmo treino não duplica: cada evento usa um iCalUID estável
 * (derivado do id do treino), e o Google faz upsert por esse UID.
 */

'use client';

import { getRichDescription, calculateWorkoutDate, normalizeDayName } from '@/lib/calendar-utils';
import type { AthleteProfile, TrainingPlan } from '@/lib/types';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const SCOPE = 'https://www.googleapis.com/auth/calendar';
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const CORRIDA_CALENDAR_NAME = 'CorreJunto — Corrida';
const FORCA_CALENDAR_NAME = 'CorreJunto — Força';

declare global {
  interface Window {
    google?: any;
  }
}

let scriptLoadPromise: Promise<void> | null = null;

function loadGoogleIdentityServices(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Disponível só no navegador.'));
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Não foi possível carregar o script do Google.'));
    document.head.appendChild(script);
  });
  return scriptLoadPromise;
}

export function isGoogleCalendarConfigured(): boolean {
  return !!CLIENT_ID;
}

/** Abre o popup de login/permissão do Google e devolve um access token válido por ~1h. */
export async function requestGoogleAccessToken(): Promise<string> {
  if (!CLIENT_ID) {
    throw new Error('Sincronização com Google Agenda não configurada neste app (falta NEXT_PUBLIC_GOOGLE_CLIENT_ID).');
  }
  await loadGoogleIdentityServices();

  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (resp: any) => {
        if (resp?.access_token) resolve(resp.access_token);
        else reject(new Error('Permissão da Google Agenda negada ou não concedida.'));
      },
      error_callback: () => reject(new Error('Permissão da Google Agenda negada ou não concedida.')),
    });
    client.requestAccessToken();
  });
}

async function gcalFetch(accessToken: string, path: string, init?: RequestInit): Promise<any> {
  const resp = await fetch(`${CALENDAR_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => null);
    throw new Error(body?.error?.message || `Erro na Google Agenda (${resp.status}).`);
  }
  if (resp.status === 204) return null;
  return resp.json();
}

/** Reaproveita o calendário guardado no perfil se ele ainda existir; senão busca por nome; senão cria. */
async function findOrCreateCalendar(accessToken: string, summary: string, existingId?: string): Promise<string> {
  if (existingId) {
    try {
      await gcalFetch(accessToken, `/calendars/${encodeURIComponent(existingId)}`);
      return existingId;
    } catch {
      // Calendário foi apagado do lado da Google — recria abaixo.
    }
  }

  const list = await gcalFetch(accessToken, '/users/me/calendarList?minAccessRole=owner');
  const found = (list?.items || []).find((c: any) => c.summary === summary);
  if (found) return found.id;

  const created = await gcalFetch(accessToken, '/calendars', {
    method: 'POST',
    body: JSON.stringify({ summary, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
  });
  return created.id;
}

async function upsertEvent(
  accessToken: string,
  calendarId: string,
  params: { uid: string; summary: string; description: string; start: Date; durationMinutes: number }
): Promise<void> {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const end = new Date(params.start.getTime() + params.durationMinutes * 60 * 1000);
  await gcalFetch(accessToken, `/calendars/${encodeURIComponent(calendarId)}/events/import`, {
    method: 'POST',
    body: JSON.stringify({
      iCalUID: params.uid,
      summary: params.summary,
      description: params.description,
      start: { dateTime: params.start.toISOString(), timeZone },
      end: { dateTime: end.toISOString(), timeZone },
    }),
  });
}

export interface GoogleCalendarSyncResult {
  corridaCalendarId: string;
  forcaCalendarId: string;
  runsSynced: number;
  strengthSynced: number;
}

export async function syncPlanToGoogleCalendar(
  accessToken: string,
  plan: TrainingPlan,
  profile: AthleteProfile
): Promise<GoogleCalendarSyncResult> {
  const anchorToRaceDate = profile.planGenerationType === 'full';
  const [corridaCalendarId, forcaCalendarId] = await Promise.all([
    findOrCreateCalendar(accessToken, CORRIDA_CALENDAR_NAME, profile.googleCalendarIds?.corrida),
    findOrCreateCalendar(accessToken, FORCA_CALENDAR_NAME, profile.googleCalendarIds?.forca),
  ]);

  let runsSynced = 0;
  let strengthSynced = 0;
  const strengthDays = profile.strengthPreferences?.trainingDays || [];

  for (const week of plan.weeklyPlans) {
    for (const run of week.runs) {
      if (run.type.includes('DESCANSO')) continue;
      const date = calculateWorkoutDate(week.weekNumber, run.day, profile.raceDate, plan.durationWeeks, anchorToRaceDate);
      // Horário: usa o horário atual como referência de dia + um horário padrão fixo (7h), já que o plano não define hora.
      date.setHours(7, 0, 0, 0);
      await upsertEvent(accessToken, corridaCalendarId, {
        uid: `correjunto-run-${run.id}@correjunto`,
        summary: `🏃 ${run.type} (${run.distance})`,
        description: getRichDescription(run),
        start: date,
        durationMinutes: 60,
      });
      runsSynced++;
    }

    if (week.strength?.trim() && strengthDays.length) {
      for (const dayName of strengthDays) {
        const dayIdx = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].indexOf(normalizeDayName(dayName));
        if (dayIdx === -1) continue;
        const date = calculateWorkoutDate(week.weekNumber, normalizeDayName(dayName), profile.raceDate, plan.durationWeeks, anchorToRaceDate);
        date.setHours(18, 0, 0, 0);
        await upsertEvent(accessToken, forcaCalendarId, {
          uid: `correjunto-strength-w${week.weekNumber}-${dayIdx}@correjunto`,
          summary: `🏋️ Musculação — Semana ${week.weekNumber}`,
          description: week.strength,
          start: date,
          durationMinutes: 60,
        });
        strengthSynced++;
      }
    }
  }

  return { corridaCalendarId, forcaCalendarId, runsSynced, strengthSynced };
}

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export interface GoogleCalendarChange {
  runId: string;
  weekNumber: number;
  originalDay: string;
  type: 'rescheduled' | 'missing';
  newDay?: string;
}

/**
 * Compara os treinos de corrida do plano com o estado atual dos eventos na
 * Google Agenda (mão única: só corrida, só o que já foi sincronizado antes).
 * Detecta dois casos, deliberadamente conservador no que reporta:
 * - 'rescheduled': o evento foi movido pra outro dia DENTRO DA MESMA SEMANA
 *   do plano — dá pra aplicar de volta (run.day) com segurança.
 * - 'missing': o evento não existe mais na agenda (apagado) OU foi movido
 *   pra fora da semana original — mapear de volta pra uma weekNumber
 *   diferente é ambíguo demais pra automatizar, por isso não tentamos.
 */
export async function checkGoogleCalendarChanges(
  accessToken: string,
  plan: TrainingPlan,
  profile: AthleteProfile
): Promise<GoogleCalendarChange[]> {
  const corridaCalendarId = profile.googleCalendarIds?.corrida;
  if (!corridaCalendarId) return [];

  const anchorToRaceDate = profile.planGenerationType === 'full';
  const eventsResp = await gcalFetch(
    accessToken,
    `/calendars/${encodeURIComponent(corridaCalendarId)}/events?singleEvents=true&maxResults=2500`
  );
  const events: any[] = eventsResp?.items || [];
  const byUid = new Map(events.map((e) => [e.iCalUID, e]));

  const changes: GoogleCalendarChange[] = [];

  for (const week of plan.weeklyPlans) {
    const weekStart = calculateWorkoutDate(week.weekNumber, 'Domingo', profile.raceDate, plan.durationWeeks, anchorToRaceDate);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    for (const run of week.runs) {
      if (run.type.includes('DESCANSO')) continue;
      const event = byUid.get(`correjunto-run-${run.id}@correjunto`);
      if (!event) {
        changes.push({ runId: run.id, weekNumber: week.weekNumber, originalDay: run.day, type: 'missing' });
        continue;
      }

      const eventStart = event.start?.dateTime ? new Date(event.start.dateTime) : null;
      if (!eventStart) continue;
      const expectedDate = calculateWorkoutDate(week.weekNumber, run.day, profile.raceDate, plan.durationWeeks, anchorToRaceDate);
      if (eventStart.toDateString() === expectedDate.toDateString()) continue;

      if (eventStart >= weekStart && eventStart < weekEnd) {
        changes.push({
          runId: run.id,
          weekNumber: week.weekNumber,
          originalDay: run.day,
          type: 'rescheduled',
          newDay: DAY_NAMES[eventStart.getDay()],
        });
      } else {
        changes.push({ runId: run.id, weekNumber: week.weekNumber, originalDay: run.day, type: 'missing' });
      }
    }
  }

  return changes;
}
