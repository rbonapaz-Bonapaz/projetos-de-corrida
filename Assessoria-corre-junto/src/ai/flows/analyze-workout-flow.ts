/**
 * @fileOverview Análise de desempenho biomecânico de treinos.
 * Browser-safe: usa o cliente Gemini via fetch (sem Genkit/Express).
 */

import { generateJSON } from '@/ai/genkit';
import { z } from 'zod';

const AnalyzeWorkoutInputSchema = z.object({
  prescribedWorkout: z.string().describe('O treino que foi planejado.'),
  athleteFeedback: z.string().describe('O relato do atleta sobre o treino.'),
  deviceData: z.string().optional().describe('Métricas reais extraídas do arquivo .FIT/.CSV do dispositivo (fonte da verdade).'),
  fileDataUri: z.string().optional().describe("URI de dados de imagem (print/foto) para leitura visual."),
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
  const system = `Você é um analista biomecânico de elite. Sua missão é extrair métricas de arquivos e feedbacks para avaliar a eficiência do atleta.
Compare o que foi prescrito com o que foi realizado.

CONSIDERE A SAÚDE DO ATLETA:
${input.anamnesis || 'Dados clínicos não fornecidos.'}

Foque em métricas como Cadência e Razão de Passada.
Se o atleta relatou dor em um local já citado na anamnese como histórico de lesão, destaque isso como um alerta crítico.
Responda em PORTUGUÊS (Brasil).`;

  const prompt = `Analise o treino executado e retorne JSON válido EXATAMENTE neste formato:
{
  "actualMetrics": {
    "averagePace": "<ex: 5:12/KM>",
    "averageCadence": "<ex: 178 spm>",
    "strideRatio": <número, oscilação vertical / comprimento de passada>,
    "groundContactTime": "<ex: 245 ms>",
    "verticalOscillation": "<ex: 8.1 cm>"
  },
  "analysisSummary": {
    "summary": "<resumo do desempenho>",
    "technicalReview": "<revisão técnica biomecânica>"
  },
  "recommendations": "<recomendações práticas>",
  "areasOfImprovement": ["<ponto 1>", "<ponto 2>"]
}
${input.deviceData ? `
IMPORTANTE: Use os DADOS REAIS DO DISPOSITIVO abaixo como FONTE DA VERDADE para preencher 'actualMetrics'.
NÃO invente números — se um dado não estiver presente, estime com cautela ou deixe genérico.

DADOS REAIS DO DISPOSITIVO (.FIT do COROS/Garmin):
${input.deviceData}
` : ''}
TREINO PRESCRITO: ${input.prescribedWorkout}
FEEDBACK DO ATLETA: ${input.athleteFeedback}
PERFIL DO ATLETA: ${input.athleteProfile}

Compare o REALIZADO (dados do dispositivo) com o PRESCRITO e avalie se o atleta cumpriu o objetivo (pace/zona/distância).`;

  const output = await generateJSON<AnalyzeWorkoutOutput>({
    system,
    prompt,
    imageDataUri: input.fileDataUri,
    temperature: 0.4,
    schema: AnalyzeWorkoutOutputSchema,
  });

  if (!output?.actualMetrics) throw new Error('Falha na análise técnica do treino.');
  return output;
}
