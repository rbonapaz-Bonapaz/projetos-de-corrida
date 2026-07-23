/**
 * @fileOverview Geração de blocos de treinamento (VDOT + zonas de FC).
 * Browser-safe: usa o cliente Gemini via fetch (sem Genkit/Express).
 */

import { generateJSON } from '@/ai/genkit';
import { TRAINING_PROGRESSION_RULES } from '@/ai/plan-rules';
import { z } from 'zod';

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
  currentWeeklyMileage: z.number().optional().describe('Volume semanal atual (KM).'),
  targetRaceDistance: z.string().describe('Distância (ex: 21k).'),
  targetPace: z.string().optional().describe('Pace alvo.'),
  targetTime: z.string().optional().describe('Tempo alvo.'),
  currentLongRunDistance: z.number().describe('Último longo realizado.'),
  weeklyAvailability: z.string().describe('Dias disponíveis.'),
  injuryHistory: z.string().describe('Histórico clínico.'),
  preferredWorkoutDays: z.string().describe('Dias de intensidade.'),
  legDay: z.string().optional().describe('Dia de treino de pernas.'),
  age: z.number().optional().describe('Idade do atleta.'),
  gender: z.string().optional().describe('Gênero do atleta.'),
  experienceLevel: z.string().optional().describe('Nível de experiência declarado.'),
  mainObjective: z.string().optional().describe('Objetivo principal declarado.'),
  strengthContext: z.string().optional().describe('Resumo das preferências de musculação do atleta.'),
  referenceFileDataUri: z.string().optional().describe('Documento de referência.'),
  referenceHandling: z.enum(['faithful', 'optimized']).optional().default('optimized'),
  anamnesisContext: z.string().optional().describe('Contexto biométrico completo (texto livre).'),
  safetyDirectives: z.string().optional().describe('Regras de segurança já derivadas da anamnese (imperativas).'),
  fitnessSnapshotContext: z.string().optional().describe('Condicionamento atual real, calculado a partir do histórico de atividades importado (COROS).'),
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
  const system = `Você é o Diretor Técnico do CorreJunto Lab, especialista em periodização de corrida de elite.

REGRAS DE OURO:
1. VDOT ${input.currentVDOT}: Todos os paces devem ser baseados EXATAMENTE nesta métrica.
2. CAMPO 'paceZone': Exiba a faixa exata (ex: "4:30 - 4:40/KM").
3. ESTRUTURA: Se o treino for INTERVALADO, detalhe as fases em 'phases' (Aquecimento, Tiros, Arrefecimento).
4. SEGURANÇA: Se houver Leg Day (${input.legDay || 'nenhum'}), o dia seguinte DEVE ser Regenerativo ou OFF.
5. TERMINOLOGIA (campo 'type'): use apenas REGENERATIVO, RODAGEM, PROGRESSIVO, FARTLEK, LIMIAR, TIROS, SUBIDAS, LONGÃO.
5b. CAMPO 'day': use EXATAMENTE uma destas 7 strings, sem sufixo "-feira" e sem variação: Domingo, Segunda, Terça, Quarta, Quinta, Sexta, Sábado.
6. Zonas de FC: Z1<=${input.hrZone1End}, Z2<=${input.hrZone2End}, Z3<=${input.hrZone3End}, Z4<=${input.hrZone4End}, FCmax=${input.hrMax}.

REGRAS DE PROGRESSÃO (aplique SEMPRE, sem exceção):
${TRAINING_PROGRESSION_RULES}

REGRAS DE SEGURANÇA DESTE ATLETA (derivadas da anamnese — trate como restrições obrigatórias):
${input.safetyDirectives || '- Nenhuma restrição adicional informada.'}

CONDICIONAMENTO ATUAL REAL (calculado a partir do histórico de treinos importado, não do que o atleta digitou no formulário):
${input.fitnessSnapshotContext || 'Sem histórico de atividades importado — use apenas os campos do perfil abaixo.'}
Se houver conflito entre este condicionamento real e a "meta de volume semanal" declarada pelo atleta, a semana 1 do plano DEVE partir do volume/frequência REAL recente (não do desejado), respeitando a regra dos 10% a partir dali.

Responda SEMPRE em PORTUGUÊS (Brasil).`;

  const prompt = `Gere uma periodização de ELITE em JSON válido, seguindo EXATAMENTE este formato:
{
  "blockType": "${input.trainingBlockType}",
  "durationWeeks": <número de semanas>,
  "weeklyPlans": [
    {
      "weekNumber": 1,
      "dateRange": "DD/MM - DD/MM",
      "focus": "<foco da semana>",
      "runs": [
        {
          "day": "<dia da semana>",
          "type": "<REGENERATIVO|RODAGEM|PROGRESSIVO|FARTLEK|LIMIAR|TIROS|SUBIDAS|LONGÃO>",
          "distance": "<ex: 10 KM>",
          "paceZone": "<ex: 4:30 - 4:40/KM>",
          "description": "<descrição técnica>",
          "rpe": <1-10>,
          "estimatedDuration": "<ex: 50 min>",
          "technicalDetails": [{ "label": "<rótulo>", "value": "<valor>" }],
          "phases": [{ "name": "<nome>", "distance": "<dist>", "pace": "<pace>", "description": "<desc>" }]
        }
      ],
      "strength": "<orientação de força para a semana>",
      "notes": "<observações>"
    }
  ]
}

PARÂMETROS DO ATLETA:
- Idade/gênero: ${input.age ?? 'não informado'} anos, ${input.gender ?? 'não informado'}.
- Nível de experiência: ${input.experienceLevel ?? 'não informado'}. Objetivo principal: ${input.mainObjective ?? 'não informado'}.
- Objetivo: ${input.targetRaceDistance} em ${input.raceDate}${input.raceName ? ` (${input.raceName})` : ''}.
- Pace/tempo alvo: ${input.targetPace || input.targetTime || 'não informado'}.
- Volume semanal ATUAL: ${input.currentWeeklyMileage ?? 'não informado'} KM. Volume semanal ALVO: ${input.weeklyMileageGoal} KM. Último longo: ${input.currentLongRunDistance} KM.
- Volume de geração: ${input.planGenerationType === 'full' ? 'ciclo completo' : 'bloco de 4 semanas'}.
- Dias disponíveis: ${input.weeklyAvailability}. Dias de intensidade: ${input.preferredWorkoutDays}.
- Musculação: ${input.strengthContext || 'sem preferências informadas'}.
- Histórico clínico (texto livre do atleta): ${input.injuryHistory}.
- Tratamento da referência: ${input.referenceHandling === 'faithful' ? 'seguir fielmente o documento de referência' : 'otimizar a partir da referência'}.

CONTEXTO BIOMÉTRICO E DE ANAMNESE (completo):
${input.anamnesisContext || 'Não fornecido.'}`;

  const output = await generateJSON<GenerateTrainingBlockOutput>({
    system,
    prompt,
    imageDataUri: input.referenceFileDataUri,
    temperature: 0.5,
    schema: GenerateTrainingBlockOutputSchema,
  });

  if (!output?.weeklyPlans) throw new Error('Falha na geração do plano de performance.');

  output.weeklyPlans.forEach((week: any) => {
    week.runs?.forEach((run: any) => {
      if (!run.id) run.id = Math.random().toString(36).substring(2, 11);
    });
  });

  return output;
}
