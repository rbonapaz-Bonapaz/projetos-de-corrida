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

/** Converte um data URI (data:<mime>;base64,<dados>) em uma parte inlineData. */
function dataUriToPart(uri?: string) {
  if (!uri) return null;
  const match = uri.match(/^data:(.+?);base64,(.*)$/s);
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
  const model = getClient().getGenerativeModel({
    model: MODEL_ID,
    ...(opts.system ? { systemInstruction: opts.system } : {}),
  });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: buildParts(opts) }],
    generationConfig: { temperature: opts.temperature ?? 0.7 },
  });

  return result.response.text();
}

/** Geração estruturada: retorna JSON validado (opcionalmente) por um schema Zod. */
export async function generateJSON<T = any>(
  opts: GenOptions & { schema?: ZodType<T> }
): Promise<T> {
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

  const raw = result.response.text().trim();
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
