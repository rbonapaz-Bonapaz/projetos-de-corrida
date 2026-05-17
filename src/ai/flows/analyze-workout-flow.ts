'use server';
/**
 * @fileOverview Fluxo Genkit para analisar o desempenho biomecânico do atleta.
 */

import { getAiWithKey } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeWorkoutInputSchema = z.object({
  apiKey: z.string().optional().describe('A chave de API do usuário.'),
  prescribedWorkout: z.string().describe('O treino que foi planejado.'),
  athleteFeedback: z.string().describe('O relato do atleta sobre o treino.'),
  fileDataUri: z.string().optional().describe("URI de dados do arquivo (.FIT, .CSV ou imagem)."),
  athleteProfile: z.string().describe('Dados biográficos e fisiológicos do atleta.'),
});

export type AnalyzeWorkoutInput = z.infer<typeof AnalyzeWorkoutInputSchema>;

const AnalyzeWorkoutOutputSchema = z.object({
  actualMetrics: z.object({
    averagePace: z.string(),
    averageCadence: z.string(),
    strideRatio: n.number(),
    groundContactTime: z.string().optional(),
    verticalOscillation: z.string().optional(),
  }),
  analysisSummary: z.object({
    summary: z.string(),
    technicalReview: z.string(),
  }),
  recommendations: z.string(),
  areasOfImprovement: z.array(z.string()),
});

export type AnalyzeWorkoutOutput = z.infer<typeof AnalyzeWorkoutOutputSchema>;

export async function analyzeWorkout(input: AnalyzeWorkoutInput): Promise<AnalyzeWorkoutOutput> {
  const aiInstance = getAiWithKey(input.apiKey);

  const { output } = await aiInstance.generate({
    model: 'googleai/gemini-2.5-flash',
    system: `Você é um analista biomecânico de elite. Sua missão é extrair métricas de arquivos e feedbacks para avaliar a eficiência do atleta.
    Compare o que foi prescrito (${input.prescribedWorkout}) com o que foi realizado.
    Foque em métricas como Cadência e Razão de Passada para identificar desperdício de energia.
    Responda em PORTUGUÊS (Brasil).`,
    prompt: [
      { text: `Analise o treino executado pelo atleta. Feedback: ${input.athleteFeedback}. Perfil: ${input.athleteProfile}.` },
      ...(input.fileDataUri ? [{ media: { url: input.fileDataUri } }] : []),
    ],
    output: { schema: AnalyzeWorkoutOutputSchema },
    config: { temperature: 0.4 }
  });

  if (!output) throw new Error('Falha na análise técnica do treino.');
  return output;
}
