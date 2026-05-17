'use server';
/**
 * @fileOverview Fluxo Genkit para gerar blocos de treinamento personalizados.
 */

import { getAiWithKey } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateTrainingBlockInputSchema = z.object({
  apiKey: z.string().optional().describe('Chave de API do usuário para processamento.'),
  raceName: z.string().optional().describe('Nome da prova alvo.'),
  currentVDOT: z.number().describe('Score VDOT/VO2 atual do atleta.'),
  hrZone1End: z.number().describe('Limite superior da Zona 1.'),
  hrZone2End: z.number().describe('Limite superior da Zona 2.'),
  hrZone3End: z.number().describe('Limite superior da Zona 3.'),
  hrZone4End: z.number().describe('Limite superior da Zona 4.'),
  hrMax: z.number().describe('Frequência cardíaca máxima.'),
  trainingBlockType: z.enum(['Base', 'Construction', 'Polishing']).describe('Fase atual do bloco de treinamento.'),
  planGenerationType: z.enum(['full', 'blocks']).describe('Se deve gerar 4 semanas ou o ciclo até a prova.'),
  raceDate: z.string().describe('Data da prova alvo no formato YYYY-MM-DD.'),
  weeklyMileageGoal: z.number().describe('Meta de volume semanal em quilômetros.'),
  targetRaceDistance: z.string().describe('Distância da prova (ex: 10k, 21k, 42k).'),
  targetPace: z.string().optional().describe('Pace alvo para a prova (min/km).'),
  targetTime: z.string().optional().describe('Tempo alvo para a prova (HH:MM:SS).'),
  currentLongRunDistance: z.number().describe('Distância atual do treino longo mais recente.'),
  weeklyAvailability: z.string().describe('Dias da semana disponíveis para treino.'),
  injuryHistory: z.string().describe('Histórico de lesões para moderação de carga.'),
  preferredWorkoutDays: z.string().describe('Dias preferidos para treinos de qualidade/tiros.'),
  legDay: z.string().optional().describe('Dia da semana reservado para treino de pernas na musculação.'),
  referenceFileDataUri: z.string().optional().describe('URI de dados de arquivo de referência.'),
});

export type GenerateTrainingBlockInput = z.infer<typeof GenerateTrainingBlockInputSchema>;

const GenerateTrainingBlockOutputSchema = z.object({
  blockType: z.string(),
  durationWeeks: z.number(),
  weeklyPlans: z.array(z.object({
    weekNumber: z.number(),
    focus: z.string(),
    runs: z.array(z.object({
      id: z.string().optional(),
      day: z.string(),
      type: z.string(),
      distance: z.string(),
      paceZone: z.string(),
      description: z.string(),
      rpe: z.number().describe('Nível de esforço percebido de 1 a 10.'),
      estimatedDuration: z.string().describe('Duração estimada do treino em minutos.'),
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
  const aiInstance = getAiWithKey(input.apiKey);

  const systemPrompt = `Você é um treinador de corrida de elite e especialista em performance. 
    REGRAS CRÍTICAS:
    1. Use VDOT ${input.currentVDOT} para prescrever ritmos exatos.
    2. Meta de Volume: ${input.weeklyMileageGoal}km semanais.
    3. Prova Alvo: ${input.raceName || 'Objetivo'} em ${input.raceDate}.
    4. Disponibilidade: ${input.weeklyAvailability}.
    5. Zonas de FC: Z1<${input.hrZone1End}, Z2<${input.hrZone2End}, Z3<${input.hrZone3End}, Z4<${input.hrZone4End}.
    6. Jamais prescreva treinos de alta intensidade no dia seguinte ao Leg Day (${input.legDay || 'Não definido'}).
    7. A semana deve começar no DOMINGO.
    8. Para treinos de qualidade (Intervalados, Tempo Run), divida sempre em fases: Aquecimento, Principal e Desaquecimento.`;

  const { output } = await aiInstance.generate({
    model: 'googleai/gemini-2.5-flash',
    system: systemPrompt,
    prompt: `Gere um bloco de treinamento de performance para o atleta seguindo rigorosamente os dados fornecidos. 
    Bloco: ${input.trainingBlockType}. 
    Histórico: ${input.injuryHistory}.
    Referência: ${input.referenceFileDataUri ? `Use este arquivo como base visual para o plano: ${input.referenceFileDataUri}` : 'Nenhuma'}`,
    output: { schema: GenerateTrainingBlockOutputSchema },
  });

  if (!output) throw new Error('Falha na geração do plano de performance.');

  // Garantir IDs únicos para os treinos
  output.weeklyPlans.forEach(week => {
    week.runs.forEach(run => {
      if (!run.id) run.id = Math.random().toString(36).substring(2, 11);
    });
  });

  return output;
}