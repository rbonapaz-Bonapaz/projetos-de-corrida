import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Resolve a chave de API com base na prioridade: 
 * 1. Chave injetada manualmente pelo usuário no App (Client-side)
 * 2. GEMINI_API_KEY (Ambiente do Servidor)
 * 3. NEXT_PUBLIC_GEMINI_API_KEY (Ambiente do Cliente)
 */
const getEffectiveKey = (userKey?: string) => {
  if (userKey && userKey.trim() !== "" && userKey.startsWith("AIza")) {
    return userKey.trim();
  }
  
  const envKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (envKey && envKey.startsWith("AIza")) {
    return envKey;
  }
  
  return ""; 
};

/**
 * Retorna uma instância configurada do Genkit.
 * Padronizado para o motor Gemini 2.5 Flash para máxima performance e estabilidade.
 */
export const getAiWithKey = (userApiKey?: string) => {
  const apiKey = getEffectiveKey(userApiKey);
  
  if (!apiKey) {
    console.warn("Nenhuma API Key válida foi encontrada. Configure-a no menu lateral do CorreJunto.");
  }

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
