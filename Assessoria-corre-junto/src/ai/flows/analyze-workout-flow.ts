/**
 * @fileOverview Fluxo Genkit para analisar o desempenho biomecânico.
 */

import { getAi } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeWorkoutInputSchema = z.object({
  prescribedWorkout: z.string().describe('O treino que foi planejado.'),
  athleteFeedback: z.string().describe('O relato do atleta sobre o treino.'),
  fileDataUri: z.string().optional().describe("URI de dados do arquivo (.FIT, .CSV ou imagem)."),
  athleteProfile: z.string().describe('Dados biográficos e fisiológicos do atleta.'),
  anamnesis: z.string().optional().describe('Dados clínicos para análise de segurança.'),
});

export type AnalyzeWorkoutInput = z.infer<typeof AnalyzeWorkoutInputSchema>;

const AnalyzeWorkoutOutputSchema = z.object({
  actualMetrics: z.object({
    averagePace: z.string(),
    averageCadence: z.string(),
    strideRatio: z.number().describe('A razão entre oscilação vertical e comprimento de passada.'),
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
  const ai = getAi();

  const { output } = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    system: `Você é um analista biomecânico de elite. Sua missão é extrair métricas de arquivos e feedbacks para avaliar a eficiência do atleta.
    Compare o que foi prescrito (${input.prescribedWorkout}) com o que foi realizado.
    
    CONSIDERE A SAÚDE DO ATLETA:
    ${input.anamnesis || 'Dados clínicos não fornecidos.'}
    
    Foque em métricas como Cadência e Razão de Passada. 
    Se o atleta relatou dor em um local já citado na anamnese como histórico de lesão, destaque isso como um alerta crítico.
    Responda em PORTUGUÊS (Brasil).`,
    prompt: [
      { text: `Analise o treino executado. Feedback: ${input.athleteFeedback}. Perfil: ${input.athleteProfile}.` },
      ...(input.fileDataUri ? [{ media: { url: input.fileDataUri } }] : []),
    ],
    output: { schema: AnalyzeWorkoutOutputSchema },
    config: { temperature: 0.4 }
  });

  if (!output) throw new Error('Falha na análise técnica do treino.');
  return output;
}
