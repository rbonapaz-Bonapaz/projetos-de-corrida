import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * CONFIGURAÇÃO DO MOTOR DE IA - CORREJUNTO ELITE
 * Blindado contra módulos de servidor para rodar 100% no navegador (Plano Spark).
 * Integrada API Key do Atleta.
 */
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

let aiInstance: any = null;

export const getAi = () => {
  // Garantia de execução apenas no cliente
  if (typeof window === 'undefined') return null;

  if (!aiInstance) {
    try {
      // Inicialização da IA com proteção contra falhas de ambiente Node
      aiInstance = genkit({
        plugins: [
          googleAI({ 
            apiKey: API_KEY 
          })
        ],
        model: 'googleai/gemini-2.5-flash',
      });
    } catch (error) {
      console.warn("IA Genkit operando em modo de compatibilidade reduzida:", error);
      // Fallback robusto: evita que o app quebre se o Genkit não inicializar no navegador
      aiInstance = {
        generate: async () => ({ text: "O Coach está recalibrando os sensores. Tente novamente em instantes.", output: null }),
        definePrompt: () => (async () => ({ output: null })),
        defineFlow: () => (async () => ({ output: null })),
        defineSchema: (name: string, schema: any) => schema,
        checkOperation: async () => ({ done: true, error: { message: "IA em manutenção" } })
      };
    }
  }
  return aiInstance;
};