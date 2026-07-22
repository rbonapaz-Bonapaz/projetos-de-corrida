'use server';
/**
 * @fileOverview Um agente de IA para analisar dados históricos de corrida e fornecer recomendações de ritmo e avisos de fadiga.
 *
 * - analyzePaceAndRecommendations - Uma função que gerencia o processo de análise e recomendação.
 * - AnalyzePaceInput - O tipo de entrada para a função analyzePaceAndRecommendations.
 * - AnalyzePaceOutput - O tipo de retorno para a função analyzePaceAndRecommendations.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define o esquema de entrada para a análise de ritmo e recomendações
const AnalyzePaceInputSchema = z.object({
  historicalRuns: z.array(
    z.object({
      date: z.string().describe('Data da corrida no formato YYYY-MM-DD.'),
      distanceKm: z.number().describe('Distância da corrida em quilômetros.'),
      durationMinutes: z.number().describe('Duração da corrida em minutos.'),
      paceMinPerKm: z
        .number()
        .describe(
          'Ritmo médio da corrida em minutos por quilômetro (ex: 5.5 para 5 minutos e 30 segundos por km).'
        ),
      heartRateAvgBPM: z
        .number()
        .optional()
        .describe('Frequência cardíaca média durante a corrida em BPM.'),
      notes: z
        .string()
        .optional()
        .describe('Notas específicas sobre a corrida (ex: "senti-me cansado", "corrida fácil", "dia de prova").'),
    })
  ).describe('Histórico de corridas do usuário.'),
  userWeightKg: z.number().describe('Peso do usuário em quilogramas.'),
  userAgeYears: z.number().describe('Idade do usuário em anos.'),
});
export type AnalyzePaceInput = z.infer<typeof AnalyzePaceInputSchema>;

// Define o esquema de saída para as recomendações de ritmo e avisos de fadiga
const AnalyzePaceOutputSchema = z.object({
  paceRecommendations: z.object({
    easyRunPaceMinPerKm: z.number().describe('Ritmo recomendado para corridas fáceis em minutos por quilômetro.'),
    tempoRunPaceMinPerKm: z.number().describe('Ritmo recomendado para corridas de tempo em minutos por quilômetro.'),
    intervalPaceMinPerKm: z.number().describe('Ritmo recomendado para treinos intervalados em minutos por quilômetro.'),
    racePace5kMinPerKm: z.number().describe('Ritmo de prova recomendado para 5k em minutos por quilômetro.'),
    racePace10kMinPerKm: z.number().describe('Ritmo de prova recomendado para 10k em minutos por quilômetro.'),
    explanation: z.string().describe('Explicação detalhada das recomendações de ritmo, baseada no histórico do usuário.'),
  }).describe('Recomendações de ritmo personalizadas.'),
  fatigueWarnings: z.object({
    riskLevel: z.enum(['BAIXO', 'MÉDIO', 'ALTO']).describe('Nível de risco de fadiga ou sobretreino (BAIXO, MÉDIO, ALTO).'),
    warningDetails: z.string().describe('Detalhes específicos sobre o risco de fadiga, se houver, e as razões.'),
    recommendations: z.string().describe('Recomendações para mitigar a fadiga e evitar lesões.'),
  }).describe('Alertas inteligentes sobre fadiga e sobretreino.'),
});
export type AnalyzePaceOutput = z.infer<typeof AnalyzePaceOutputSchema>;

// Define o prompt de IA usando os esquemas de entrada e saída
const analyzePacePrompt = ai.definePrompt({
  name: 'analyzePacePrompt',
  input: { schema: AnalyzePaceInputSchema },
  output: { schema: AnalyzePaceOutputSchema },
  prompt: `Você é um treinador de corrida de IA. Seu objetivo é analisar o histórico de corrida de um usuário e fornecer recomendações de ritmo personalizada para os próximos treinos ou corridas, além de alertas inteligentes sobre potenciais riscos de sobretreino ou fadiga.

O usuário tem {{userAgeYears}} anos e pesa {{userWeightKg}} kg.

Aqui está o histórico de corridas do usuário:
{{#each historicalRuns}}
  - Data: {{this.date}}, Distância: {{this.distanceKm}} km, Duração: {{this.durationMinutes}} min, Ritmo: {{this.paceMinPerKm}} min/km{{#if this.heartRateAvgBPM}}, FC Média: {{this.heartRateAvgBPM}} BPM{{/if}}{{#if this.notes}}, Notas: "{{this.notes}}"{{/if}}
{{/each}}

Analise os dados fornecidos, considerando a consistência, volume, intensidade e quaisquer notas. Preste atenção especial a:
- Mudanças significativas no volume ou intensidade.
- Padrões de fadiga ou desempenho reduzido mencionados nas notas.
- Ritmos consistentes para diferentes tipos de corrida.
- Qualquer indício de sobretreino ou recuperação insuficiente.

Com base nesta análise, gere:
1. Recomendações de ritmo para diferentes tipos de corrida (fácil, tempo, intervalado, 5k, 10k).
2. Um nível de risco de fadiga (BAIXO, MÉDIO, ALTO).
3. Detalhes específicos sobre o risco de fadiga e suas razões, se houver.
4. Recomendações para mitigar a fadiga e evitar lesões.

Certifique-se de que todas as suas saídas sejam em português do Brasil e sigam estritamente o formato JSON fornecido.`,
});

// Define o fluxo Genkit que utiliza o prompt
const analyzePaceRecommendationsFlow = ai.defineFlow(
  {
    name: 'analyzePaceRecommendationsFlow',
    inputSchema: AnalyzePaceInputSchema,
    outputSchema: AnalyzePaceOutputSchema,
  },
  async (input) => {
    const { output } = await analyzePacePrompt(input);
    if (!output) {
      throw new Error('A resposta do modelo de IA está vazia.');
    }
    return output;
  }
);

// Função wrapper exportada para ser utilizada pelo Next.js
export async function analyzePaceAndRecommendations(
  input: AnalyzePaceInput
): Promise<AnalyzePaceOutput> {
  return analyzePaceRecommendationsFlow(input);
}
