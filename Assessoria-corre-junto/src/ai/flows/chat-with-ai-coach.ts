/**
 * @fileOverview Treinador de IA conversacional para corredores.
 */

import { getAi } from '@/ai/genkit';
import { z } from 'genkit';

const ChatWithAICoachInputSchema = z.object({
  conversationHistory: z.array(
    z.object({
      role: z.enum(['user', 'model']),
      parts: z.string(),
    })
  ).describe('Histórico da conversa.'),
  workoutHistory: z.string().describe('Desempenho e histórico de treinos.'),
  trainingPlan: z.string().describe('Plano de treinamento atual.'),
  anamnesis: z.string().optional().describe('Contexto clínico e técnico do atleta.'),
  imageDataUri: z.string().optional().describe('Imagem anexada para análise visual.'),
});

export type ChatWithAICoachInput = z.infer<typeof ChatWithAICoachInputSchema>;

export async function chatWithAICoach(input: ChatWithAICoachInput): Promise<{ feedback: string }> {
  const ai = getAi();
  
  const historyString = input.conversationHistory
    .map(m => `${m.role === 'user' ? 'Atleta' : 'Coach'}: ${m.parts}`)
    .join('\n');

  const { text } = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    system: `Você é o Gemini Coach, um treinador de elite especialista em biomecânica e fisiologia do exercício.
    Responda em PORTUGUÊS (Brasil). Seja técnico, motivador e foque em dados de performance.
    
    CONTEXTO BIOMÉTRICO (ANAMNESE):
    ${input.anamnesis || 'Ainda não preenchida.'}
    
    CONTEXTO DO ATLETA: ${input.workoutHistory}
    PLANO ATUAL: ${input.trainingPlan}
    
    DIRETRIZ: Se o atleta tiver histórico de lesão ou dores ativas citadas na anamnese, seja conservador e priorize a recuperação.`,
    prompt: [
      { text: `Histórico da conversa atual:\n${historyString}\n\nAnalise e forneça feedback sobre a última interação ou imagem enviada.` },
      ...(input.imageDataUri ? [{ media: { url: input.imageDataUri } }] : []),
    ],
    config: { temperature: 0.7 }
  });

  return { feedback: text };
}
