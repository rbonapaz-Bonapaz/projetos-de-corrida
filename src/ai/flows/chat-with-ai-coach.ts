'use server';
/**
 * @fileOverview Treinador de IA conversacional para corredores.
 */

import { getAiWithKey } from '@/ai/genkit';
import { z } from 'genkit';

const ChatWithAICoachInputSchema = z.object({
  apiKey: z.string().optional().describe('A chave de API do usuário.'),
  conversationHistory: z.array(
    z.object({
      role: z.enum(['user', 'model']),
      parts: z.string(),
    })
  ).describe('Histórico da conversa.'),
  workoutHistory: z.string().describe('Desempenho e histórico de treinos.'),
  trainingPlan: z.string().describe('Plano de treinamento atual.'),
  imageDataUri: z.string().optional().describe('Imagem anexada para análise visual.'),
});

export type ChatWithAICoachInput = z.infer<typeof ChatWithAICoachInputSchema>;

export async function chatWithAICoach(input: ChatWithAICoachInput): Promise<{ feedback: string }> {
  const aiInstance = getAiWithKey(input.apiKey);
  
  const historyString = input.conversationHistory
    .map(m => `${m.role === 'user' ? 'Atleta' : 'Coach'}: ${m.parts}`)
    .join('\n');

  const { text } = await aiInstance.generate({
    model: 'googleai/gemini-2.5-flash',
    system: `Você é o Gemini Coach, um treinador de elite especialista em biomecânica e fisiologia do exercício.
    Responda em PORTUGUÊS (Brasil). Seja técnico, motivador e foque em dados de performance.
    Contexto do Atleta: ${input.workoutHistory}
    Plano Atual: ${input.trainingPlan}`,
    prompt: [
      { text: `Histórico da conversa atual:\n${historyString}\n\nAnalise e forneça feedback sobre a última interação ou imagem enviada.` },
      ...(input.imageDataUri ? [{ media: { url: input.imageDataUri } }] : []),
    ],
    config: { temperature: 0.7 }
  });

  return { feedback: text };
}
