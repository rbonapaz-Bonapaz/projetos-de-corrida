/**
 * @fileOverview Fluxo Genkit Elite para gerar blocos de treinamento.
 * OBRIGATORIAMENTE NUMÉRICO e baseado em VDOT.
 */

import { getAi } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateTrainingBlockInputSchema = z.object({
  raceName: z.string().optional().describe('Nome da prova alvo.'),
  currentVDOT: z.number().describe('Score VDOT/VO2 atual do atleta.'),
  hrZone1End: z.number().describe('Limite superior da Zona 1.'),
  hrZone2End: z.number().describe('Limite superior da Zona 2.'),
  hrZone3End: z.number().describe('Limite superior da Zona 3.'),
  hrZone4End: z.number().describe('Limite superior da Zona 4.'),
  hrMax: z.number().describe('Frequência cardíaca máxima.'),
  trainingBlockType: z.enum(['Base', 'Construction', 'Polishing']).describe('Fase atual do bloco.'),
  planGenerationType: z.enum(['full', 'blocks']).describe('Volume de geração.'),
  raceDate: z.string().describe('Data da prova (YYYY-MM-DD).'),
  weeklyMileageGoal: z.number().describe('Meta de volume semanal (KM).'),
  targetRaceDistance: z.string().describe('Distância (ex: 21k).'),
  targetPace: z.string().optional().describe('Pace alvo.'),
  targetTime: z.string().optional().describe('Tempo alvo.'),
  currentLongRunDistance: z.number().describe('Último longo realizado.'),
  weeklyAvailability: z.string().describe('Dias disponíveis.'),
  injuryHistory: z.string().describe('Histórico clínico.'),
  preferredWorkoutDays: z.string().describe('Dias de intensidade.'),
  legDay: z.string().optional().describe('Dia de treino de pernas.'),
  referenceFileDataUri: z.string().optional().describe('Documento de referência.'),
  referenceHandling: z.enum(['faithful', 'optimized']).optional().default('optimized'),
  anamnesisContext: z.string().optional().describe('Contexto biométrico completo.'),
});

export type GenerateTrainingBlockInput = z.infer<typeof GenerateTrainingBlockInputSchema>;

const GenerateTrainingBlockOutputSchema = z.object({
  blockType: z.string(),
  durationWeeks: z.number(),
  weeklyPlans: z.array(z.object({
    weekNumber: z.number(),
    dateRange: z.string().optional(),
    focus: z.string(),
    runs: z.array(z.object({
      id: z.string().optional(),
      day: z.string(),
      type: z.string(),
      distance: z.string(),
      paceZone: z.string(),
      description: z.string(),
      rpe: z.number(),
      estimatedDuration: z.string(),
      technicalDetails: z.array(z.object({
        label: z.string(),
        value: z.string()
      })).optional(),
      phases: z.array(z.object({
        name: z.string(),
        distance: z.string(),
        pace: z.string().optional(),
        description: z.string()
      })).optional()
    })),
    strength: z.string(),
    notes: z.string(),
  })),
});

export type GenerateTrainingBlockOutput = z.infer<typeof GenerateTrainingBlockOutputSchema>;

export async function generateTrainingBlock(input: GenerateTrainingBlockInput): Promise<GenerateTrainingBlockOutput> {
  const ai = getAi();
  
  const prompt = ai.definePrompt({
    name: 'generateTrainingBlockPrompt',
    input: { schema: GenerateTrainingBlockInputSchema },
    output: { schema: GenerateTrainingBlockOutputSchema },
    prompt: `Você é o Diretor Técnico do CorreJunto Lab. Gere uma periodização de ELITE.
      
      REGRAS DE OURO:
      1. VDOT {{currentVDOT}}: Todos os paces devem ser baseados EXATAMENTE nesta métrica.
      2. CAMPO 'paceZone': Exiba a faixa exata (ex: "4:30 - 4:40/KM").
      3. ESTRUTURA: Se o treino for INTERVALADO, detalhe as fases (Aquecimento, Tiros, Arrefecimento).
      4. SEGURANÇA: Se houver Leg Day ({{legDay}}), o dia seguinte DEVE ser Regenerativo ou OFF.
      5. TERMINOLOGIA: Use apenas REGENERATIVO, RODAGEM, PROGRESSIVO, FARTLEK, LIMIAR, TIROS, SUBIDAS, LONGÃO.

      CONTEXTO BIOMÉTRICO:
      {{anamnesisContext}}
      
      OBJETIVO: {{targetRaceDistance}} em {{raceDate}}.`,
  });

  const { output } = await prompt(input);
  if (!output) throw new Error('Falha na geração do plano de performance.');

  output.weeklyPlans.forEach((week: any) => {
    week.runs.forEach((run: any) => {
      if (!run.id) run.id = Math.random().toString(36).substring(2, 11);
    });
  });

  return output;
}
