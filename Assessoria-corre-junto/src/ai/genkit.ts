/**
 * MOTOR DE IA - CORREJUNTO ELITE
 * Cliente Gemini 100% compatível com navegador (Plano Spark / output: export).
 *
 * Usa o SDK @google/generative-ai (baseado em fetch) em vez do Genkit, que
 * dependia do Express e quebrava no bundle do cliente
 * ("Cannot read properties of undefined (reading 'prototype')").
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ZodType } from 'zod';

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const MODEL_ID = 'gemini-2.5-flash';

let client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!API_KEY) {
    throw new Error(
      'Chave de IA não configurada. Defina NEXT_PUBLIC_GEMINI_API_KEY para ativar o Coach.'
    );
  }
  if (!client) client = new GoogleGenerativeAI(API_KEY);
  return client;
}

/** Indica se a IA está pronta para uso (chave presente). */
export function isAiConfigured(): boolean {
  return !!API_KEY;
}

/**
 * Traduz erros crus da SDK do Gemini (em inglês, técnicos) para mensagens
 * curtas e acionáveis em português — o atleta não precisa entender HTTP 429
 * para saber que precisa colocar crédito na conta.
 */
function translateAiError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);

  if (/prepayment (has been )?depleted/i.test(raw)) {
    return 'O saldo pré-pago da chave de IA (Google AI Studio) acabou. Acesse aistudio.google.com, na seção de faturamento do projeto, e adicione créditos para continuar usando o Coach.';
  }
  if (/RESOURCE_EXHAUSTED|quota/i.test(raw) || /\[429/.test(raw)) {
    return 'A IA atingiu o limite de uso no momento (muitas requisições em pouco tempo, ou cota esgotada). Aguarde alguns minutos e tente novamente — se persistir, verifique o saldo em aistudio.google.com.';
  }
  if (/API[_ ]?KEY[_ ]?INVALID|API key not valid/i.test(raw)) {
    return 'A chave de IA configurada (NEXT_PUBLIC_GEMINI_API_KEY) é inválida. Gere uma nova em aistudio.google.com/apikey e atualize o .env.local.';
  }
  if (/PERMISSION_DENIED|\[403/.test(raw)) {
    return 'A chave de IA não tem permissão para este modelo. Confira as restrições da chave em aistudio.google.com.';
  }
  if (/Failed to fetch|NetworkError|ENOTFOUND|ECONNREFUSED/i.test(raw)) {
    return 'Não foi possível conectar ao servidor de IA. Verifique sua internet e tente novamente.';
  }
  if (raw.startsWith('Chave de IA não configurada')) {
    return raw;
  }

  return raw || 'Ocorreu um erro inesperado ao falar com a IA.';
}

/** Converte um data URI (data:<mime>;base64,<dados>) em uma parte inlineData. */
function dataUriToPart(uri?: string) {
  if (!uri) return null;
  const match = uri.match(/^data:(.+?);base64,([\s\S]*)$/);
  if (!match) return null;
  return { inlineData: { mimeType: match[1], data: match[2] } };
}

export interface GenOptions {
  system?: string;
  prompt: string;
  imageDataUri?: string;
  temperature?: number;
}

function buildParts(opts: GenOptions) {
  const parts: any[] = [{ text: opts.prompt }];
  const media = dataUriToPart(opts.imageDataUri);
  if (media) parts.push(media);
  return parts;
}

/** Geração de texto livre (chat, feedback). */
export async function generateText(opts: GenOptions): Promise<string> {
  try {
    const model = getClient().getGenerativeModel({
      model: MODEL_ID,
      ...(opts.system ? { systemInstruction: opts.system } : {}),
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: buildParts(opts) }],
      generationConfig: { temperature: opts.temperature ?? 0.7 },
    });

    return result.response.text();
  } catch (error) {
    throw new Error(translateAiError(error));
  }
}

/** Geração estruturada: retorna JSON validado (opcionalmente) por um schema Zod. */
export async function generateJSON<T = any>(
  opts: GenOptions & { schema?: ZodType<T> }
): Promise<T> {
  let raw: string;
  try {
    const model = getClient().getGenerativeModel({
      model: MODEL_ID,
      ...(opts.system ? { systemInstruction: opts.system } : {}),
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: buildParts(opts) }],
      generationConfig: {
        temperature: opts.temperature ?? 0.4,
        responseMimeType: 'application/json',
      },
    });

    raw = result.response.text().trim();
  } catch (error) {
    throw new Error(translateAiError(error));
  }
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Fallback: extrai o primeiro bloco JSON caso o modelo adicione texto extra.
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1) {
      throw new Error('A IA retornou uma resposta em formato inesperado.');
    }
    parsed = JSON.parse(raw.slice(start, end + 1));
  }

  if (opts.schema) {
    const check = opts.schema.safeParse(parsed);
    if (check.success) return check.data;
    // Tolerante: devolve o objeto bruto se o schema divergir levemente,
    // evitando quebrar a experiência do atleta por um campo a mais/menos.
    console.warn('Schema divergente na resposta da IA:', check.error?.issues?.slice(0, 3));
  }
  return parsed as T;
}
