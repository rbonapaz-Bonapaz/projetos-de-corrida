import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Chave de API de fallback para o laboratório CorreJunto.
 */
const DEFAULT_KEY = "AIzaSyDPO6BpCQC9jHhuavasgY2OhkJvleHL8v0";

/**
 * Resolve a chave de API com base na prioridade: 
 * 1. Chave injetada manualmente pelo usuário no App
 * 2. GEMINI_API_KEY (Ambiente)
 * 3. Fallback fixo
 */
const getEffectiveKey = (userKey?: string) => {
  if (userKey && userKey.trim() !== "" && userKey.startsWith("AIza")) {
    return userKey.trim();
  }
  
  const envKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (envKey && envKey.startsWith("AIza")) {
    return envKey;
  }
  
  return DEFAULT_KEY;
};

/**
 * Retorna uma instância configurada do Genkit.
 * Padronizado para o motor Gemini 2.5 Flash para máxima performance e estabilidade.
 */
export const getAiWithKey = (userApiKey?: string) => {
  const apiKey = getEffectiveKey(userApiKey);
  
  return genkit({
    plugins: [
      googleAI({ 
        apiKey
      })
    ],
    model: 'googleai/gemini-2.5-flash',
  });
};

/**
 * Instância padrão do Genkit para o sistema.
 */
export const ai = getAiWithKey();
