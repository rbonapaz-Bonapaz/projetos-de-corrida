/**
 * Cloud Function "corosSync" — ponte servidor para a API não-oficial da
 * COROS (teamapi.coros.com). Existe só porque o navegador bloqueia essas
 * chamadas por CORS quando feitas direto do app estático.
 *
 * Endpoints e formato de login reverso-engenheirados a partir do projeto
 * open-source coros_data_extractor (github.com/gandroz/coros_data_extractor) —
 * não é uma API pública documentada pela COROS, pode quebrar sem aviso.
 *
 * Design deliberado: essa função só FAZ LOGIN, LISTA e BAIXA o .fit bruto de
 * cada atividade nova — não interpreta nenhum campo numérico proprietário da
 * COROS (distância, pace, etc. têm unidades não documentadas). O parsing de
 * verdade acontece no cliente, reaproveitando o mesmo parser de .fit já
 * usado (e validado) na importação manual em Integrações.
 *
 * A senha da COROS nunca é persistida aqui — chega em cada chamada, é usada
 * uma vez pra logar, e descartada. Não é logada em nenhum momento.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as crypto from "crypto";

const COROS_BASE = "https://teamapi.coros.com";
const LOGIN_URL = `${COROS_BASE}/account/login`;
const ACTIVITIES_URL = `${COROS_BASE}/activity/query`;
const ACTIVITY_DOWNLOAD_URL = `${COROS_BASE}/activity/detail/download`;

const DEFAULT_MAX_ACTIVITIES = 10;
const HARD_CAP_MAX_ACTIVITIES = 30;
const FIT_FILE_TYPE = 4; // ActivityFileType.FIT no protocolo da COROS

interface CorosSyncRequest {
  email: string;
  password: string;
  knownLabelIds?: string[];
  maxActivities?: number;
}

interface CorosActivitySummary {
  labelId: string;
  name?: string;
  startTime?: string;
  sportType?: number;
}

interface CorosSyncActivityResult extends CorosActivitySummary {
  fitBase64: string;
}

interface CorosSyncResponse {
  activities: CorosSyncActivityResult[];
  totalFoundOnCoros: number;
  skippedAlreadyKnown: number;
  skippedNoFitAvailable: number;
}

async function corosLogin(email: string, password: string): Promise<string> {
  const pwdHash = crypto.createHash("md5").update(password).digest("hex");

  let resp: Response;
  try {
    resp = await fetch(LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account: email, accountType: 2, pwd: pwdHash }),
    });
  } catch {
    throw new HttpsError("unavailable", "Não foi possível conectar ao servidor da COROS. Tente novamente em instantes.");
  }

  if (!resp.ok) {
    throw new HttpsError("unauthenticated", "Não foi possível entrar na sua conta COROS — confira email e senha.");
  }

  const json: any = await resp.json().catch(() => null);
  const token = json?.data?.accessToken;
  if (!token) {
    throw new HttpsError("unauthenticated", "Não foi possível entrar na sua conta COROS — confira email e senha.");
  }
  return token;
}

async function fetchRecentActivities(accessToken: string, size: number): Promise<CorosActivitySummary[]> {
  const url = `${ACTIVITIES_URL}?modeList=&pageNumber=1&size=${size}`;
  const resp = await fetch(url, { headers: { Accesstoken: accessToken } });
  if (!resp.ok) {
    throw new HttpsError("internal", "A COROS não respondeu à consulta de atividades. Tente novamente em alguns minutos.");
  }
  const json: any = await resp.json().catch(() => null);
  const list = json?.data?.dataList;
  if (!Array.isArray(list)) return [];
  return list.map((a: any) => ({
    labelId: String(a.labelId),
    name: typeof a.name === "string" ? a.name : undefined,
    startTime: a.startTime !== undefined ? String(a.startTime) : undefined,
    sportType: typeof a.sportType === "number" ? a.sportType : undefined,
  }));
}

async function downloadFitFile(accessToken: string, activity: CorosActivitySummary): Promise<string | null> {
  let resp: Response;
  try {
    resp = await fetch(ACTIVITY_DOWNLOAD_URL, {
      method: "POST",
      headers: {
        Accesstoken: accessToken,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        labelId: activity.labelId,
        fileType: String(FIT_FILE_TYPE),
        sportType: String(activity.sportType ?? ""),
      }),
    });
  } catch {
    return null;
  }
  if (!resp.ok) return null;

  const json: any = await resp.json().catch(() => null);
  const fileUrl = json?.data?.fileUrl;
  if (!fileUrl) return null;

  const fileResp = await fetch(fileUrl);
  if (!fileResp.ok) return null;
  const buffer = Buffer.from(await fileResp.arrayBuffer());
  return buffer.toString("base64");
}

export const corosSync = onCall(
  { region: "southamerica-east1", timeoutSeconds: 120, memory: "256MiB" },
  async (request): Promise<CorosSyncResponse> => {
    if (!request.auth) {
      throw new HttpsError("permission-denied", "É preciso estar logado no CorreJunto para sincronizar.");
    }

    const data = (request.data || {}) as CorosSyncRequest;
    const { email, password, knownLabelIds, maxActivities } = data;
    if (!email || !password) {
      throw new HttpsError("invalid-argument", "Informe email e senha da sua conta COROS.");
    }

    const cap = Math.min(Math.max(1, maxActivities ?? DEFAULT_MAX_ACTIVITIES), HARD_CAP_MAX_ACTIVITIES);
    const knownSet = new Set(knownLabelIds || []);

    logger.info("corosSync: iniciando", { uid: request.auth.uid });

    const accessToken = await corosLogin(email, password);
    const recent = await fetchRecentActivities(accessToken, Math.max(cap * 2, 20));

    const totalFoundOnCoros = recent.length;
    const unseen = recent.filter((a) => !knownSet.has(a.labelId)).slice(0, cap);
    const skippedAlreadyKnown = recent.length - unseen.length;

    const activities: CorosSyncActivityResult[] = [];
    let skippedNoFitAvailable = 0;

    for (const activity of unseen) {
      try {
        const fitBase64 = await downloadFitFile(accessToken, activity);
        if (fitBase64) {
          activities.push({ ...activity, fitBase64 });
        } else {
          skippedNoFitAvailable++;
        }
      } catch (err) {
        logger.warn("corosSync: falha ao baixar atividade", { labelId: activity.labelId, err: String(err) });
        skippedNoFitAvailable++;
      }
    }

    logger.info("corosSync: concluído", {
      uid: request.auth.uid,
      totalFoundOnCoros,
      returned: activities.length,
      skippedAlreadyKnown,
      skippedNoFitAvailable,
    });

    return { activities, totalFoundOnCoros, skippedAlreadyKnown, skippedNoFitAvailable };
  }
);
