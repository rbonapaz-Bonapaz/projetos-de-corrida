/**
 * Cloud Functions "stravaExchangeToken" e "stravaSync" — ponte servidor
 * pra OAuth do Strava.
 *
 * Diferente do COROS, o Strava tem API pública oficial e documentada
 * (não precisa engenharia reversa) — mas o fluxo OAuth "authorization
 * code" exige trocar o código por token usando o Client Secret, que NUNCA
 * pode ficar no navegador. Por isso essas duas funções existem só pra
 * essa troca (inicial e no refresh do token expirado); a listagem de
 * atividades em si já usa o access token, sem precisar do secret de novo.
 *
 * O Client Secret vive só no Secret Manager do Firebase (definido via
 * `firebase functions:secrets:set STRAVA_CLIENT_SECRET`), nunca no código.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";

const stravaClientSecret = defineSecret("STRAVA_CLIENT_SECRET");

const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const STRAVA_ACTIVITIES_URL = "https://www.strava.com/api/v3/athlete/activities";
const DEFAULT_MAX_ACTIVITIES = 15;
const HARD_CAP_MAX_ACTIVITIES = 30;

interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number; // epoch seconds
  athlete?: { id: number; firstname?: string; lastname?: string };
}

interface StravaExchangeRequest {
  code: string;
  clientId: string;
}

interface StravaExchangeResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
  athleteName?: string;
}

export const stravaExchangeToken = onCall(
  { secrets: [stravaClientSecret], region: "southamerica-east1", timeoutSeconds: 30 },
  async (request): Promise<StravaExchangeResponse> => {
    if (!request.auth) {
      throw new HttpsError("permission-denied", "É preciso estar logado no CorreJunto para conectar o Strava.");
    }
    const { code, clientId } = (request.data || {}) as StravaExchangeRequest;
    if (!code || !clientId) {
      throw new HttpsError("invalid-argument", "Faltou o código de autorização do Strava.");
    }

    let resp: Response;
    try {
      resp = await fetch(STRAVA_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: stravaClientSecret.value(),
          code,
          grant_type: "authorization_code",
        }),
      });
    } catch {
      throw new HttpsError("unavailable", "Não foi possível conectar ao Strava. Tente novamente.");
    }

    if (!resp.ok) {
      logger.warn("stravaExchangeToken: falha na troca de código", { status: resp.status });
      throw new HttpsError("unauthenticated", "Não foi possível concluir a conexão com o Strava — tente autorizar de novo.");
    }

    const data = (await resp.json()) as StravaTokenResponse;
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at * 1000,
      athleteName: data.athlete ? [data.athlete.firstname, data.athlete.lastname].filter(Boolean).join(" ") : undefined,
    };
  }
);

interface StravaSyncRequest {
  clientId: string;
  refreshToken: string;
  maxActivities?: number;
}

interface StravaActivitySummary {
  id: number;
  name?: string;
  type?: string;
  sport_type?: string;
  distance?: number; // metros
  moving_time?: number; // segundos
  start_date?: string; // ISO
  average_speed?: number; // m/s
  average_heartrate?: number;
  max_heartrate?: number;
  average_cadence?: number;
  total_elevation_gain?: number; // metros
  calories?: number;
}

interface StravaSyncResponse {
  activities: StravaActivitySummary[];
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
}

async function refreshStravaToken(clientId: string, refreshToken: string): Promise<StravaTokenResponse> {
  const resp = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: stravaClientSecret.value(),
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!resp.ok) {
    throw new HttpsError("unauthenticated", "Sua conexão com o Strava expirou — reconecte em Integrações.");
  }
  return resp.json() as Promise<StravaTokenResponse>;
}

export const stravaSync = onCall(
  { secrets: [stravaClientSecret], region: "southamerica-east1", timeoutSeconds: 60 },
  async (request): Promise<StravaSyncResponse> => {
    if (!request.auth) {
      throw new HttpsError("permission-denied", "É preciso estar logado no CorreJunto para sincronizar.");
    }
    const { clientId, refreshToken, maxActivities } = (request.data || {}) as StravaSyncRequest;
    if (!clientId || !refreshToken) {
      throw new HttpsError("invalid-argument", "Conecte o Strava primeiro em Integrações.");
    }

    const refreshed = await refreshStravaToken(clientId, refreshToken);
    const cap = Math.min(Math.max(1, maxActivities ?? DEFAULT_MAX_ACTIVITIES), HARD_CAP_MAX_ACTIVITIES);

    const url = `${STRAVA_ACTIVITIES_URL}?per_page=${cap}`;
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${refreshed.access_token}` },
    });
    if (!resp.ok) {
      throw new HttpsError("internal", "O Strava não respondeu à consulta de atividades. Tente novamente em alguns minutos.");
    }
    const activities = (await resp.json()) as StravaActivitySummary[];

    logger.info("stravaSync: concluído", { uid: request.auth.uid, count: activities.length });

    return {
      activities,
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token,
      expiresAt: refreshed.expires_at * 1000,
    };
  }
);
