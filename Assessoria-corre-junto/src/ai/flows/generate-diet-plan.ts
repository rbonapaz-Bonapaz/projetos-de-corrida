/**
 * @fileOverview Geração de plano alimentar/dieta personalizado.
 * Browser-safe: usa o cliente Gemini via fetch (sem Genkit/Express).
 */

import { generateJSON } from '@/ai/genkit';
import { computeDietBaseline } from '@/ai/plan-rules';
import { z } from 'zod';

const GenerateDietPlanInputSchema = z.object({
  age: z.number().optional(),
  gender: z.string().optional(),
  currentWeight: z.number(),
  height: z.number(),
  targetWeight: z.number().optional(),
  aestheticGoal: z.string().describe('cutting | bulking | recomp | performance'),
  activityLevel: z.string().describe('sedentary | light | moderate | active | very_active'),
  dietStyle: z.string().describe('onivoro | vegetariano | vegano | low_carb | cetogenica | flexivel'),
  mealCount: z.number(),
  trainingTiming: z.string().optional(),
  weeklyMileage: z.number().optional(),
  strengthFrequency: z.number().optional(),
  supplements: z.string().optional(),
  allergies: z.string().optional(),
  preferredFoods: z.string().optional(),
  excludedFoods: z.string().optional(),
  anamnesisContext: z.string().optional(),
  safetyDirectives: z.string().optional().describe('Regras de segurança já derivadas da anamnese (imperativas).'),
});

export type GenerateDietPlanInput = z.infer<typeof GenerateDietPlanInputSchema>;

const GenerateDietPlanOutputSchema = z.object({
  targetCalories: z.number(),
  macros: z.object({
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
  }),
  waterLiters: z.number(),
  strategy: z.string(),
  meals: z.array(z.object({
    name: z.string(),
    time: z.string(),
    calories: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
    items: z.array(z.string()),
    notes: z.string().optional(),
  })),
  trainingDayNotes: z.string(),
  restDayNotes: z.string(),
  supplementation: z.string(),
  generalTips: z.array(z.string()),
});

export type GenerateDietPlanOutput = z.infer<typeof GenerateDietPlanOutputSchema>;

const GOAL_LABELS: Record<string, string> = {
  cutting: 'Cutting (perda de gordura preservando massa)',
  bulking: 'Bulking (ganho de massa muscular)',
  recomp: 'Recomposição corporal',
  performance: 'Performance esportiva',
};

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: 'sedentário (trabalho de escritório)',
  light: 'levemente ativo',
  moderate: 'moderadamente ativo',
  active: 'ativo',
  very_active: 'muito ativo (trabalho físico)',
};

const STYLE_LABELS: Record<string, string> = {
  onivoro: 'onívoro',
  vegetariano: 'vegetariano',
  vegano: 'vegano',
  low_carb: 'low carb',
  cetogenica: 'cetogênica',
  flexivel: 'flexível (IIFYM)',
};

export async function generateDietPlan(input: GenerateDietPlanInput): Promise<GenerateDietPlanOutput> {
  const baseline = computeDietBaseline({
    gender: input.gender,
    age: input.age,
    currentWeight: input.currentWeight,
    height: input.height,
    activityLevel: input.activityLevel,
    aestheticGoal: input.aestheticGoal,
  });

  const system = `Você é um nutricionista esportivo de elite do CorreJunto Lab, especialista em corredores.

CÁLCULO DE REFERÊNCIA (já calculado deterministicamente — use como ÂNCORA, não recalcule do zero):
- TMB (Mifflin-St Jeor): ${baseline.bmr} kcal.
- GET (TMB x fator de atividade): ${baseline.tdee} kcal.
- Meta calórica sugerida (GET ajustado ao objetivo): ${baseline.targetCalories} kcal/dia.
- Proteína sugerida: ${baseline.proteinG} g/dia. Gordura sugerida: ${baseline.fatG} g/dia. Carboidrato sugerido: ${baseline.carbsG} g/dia.
Use estes números como ponto de partida. Só desvie se houver uma razão fisiológica clara (ex: volume de corrida muito alto pede mais carboidrato) — e nesse caso, explique o desvio no campo 'strategy'.

DIRETRIZES:
1. A meta calórica e os macros finais devem ficar próximos da âncora acima, salvo justificativa em 'strategy'.
2. Distribua os macros entre as refeições de forma coerente com o volume de corrida e o horário de treino informado.
3. Respeite RIGOROSAMENTE alergias, restrições e o padrão alimentar informado (ex: vegano = zero produtos animais). Isto é uma regra DURA, não uma preferência.
4. Some as calorias/macros das refeições de forma coerente com a meta diária (a soma das refeições deve bater com o total).
5. Seja prático: use alimentos acessíveis no Brasil e porções em medidas caseiras + gramas.
6. Responda SEMPRE em PORTUGUÊS (Brasil).

REGRAS DE SEGURANÇA DESTE ATLETA (derivadas da anamnese — trate como restrições obrigatórias):
${input.safetyDirectives || '- Nenhuma restrição adicional informada.'}

CONTEXTO CLÍNICO COMPLETO (texto livre):
${input.anamnesisContext || 'Sem dados clínicos adicionais.'}`;

  const prompt = `Gere um plano alimentar personalizado em JSON válido, EXATAMENTE neste formato:
{
  "targetCalories": <kcal/dia inteiro>,
  "macros": { "protein": <g>, "carbs": <g>, "fat": <g> },
  "waterLiters": <litros/dia>,
  "strategy": "<explicação curta da estratégia calórica e de macros>",
  "meals": [
    {
      "name": "<ex: Café da manhã>",
      "time": "<ex: 07:00>",
      "calories": <kcal>,
      "protein": <g>, "carbs": <g>, "fat": <g>,
      "items": ["<alimento + medida caseira + gramas>", "..."],
      "notes": "<opcional: dica ou timing>"
    }
  ],
  "trainingDayNotes": "<ajustes nutricionais em dias de treino intenso/longão>",
  "restDayNotes": "<ajustes em dias de descanso>",
  "supplementation": "<orientação de suplementos, se aplicável>",
  "generalTips": ["<dica 1>", "<dica 2>"]
}

Crie exatamente ${input.mealCount} refeições distribuídas ao longo do dia.

DADOS DO ATLETA:
- Idade: ${input.age ?? 'não informada'} | Sexo: ${input.gender ?? 'não informado'}
- Peso atual: ${input.currentWeight} kg | Altura: ${input.height} cm${input.targetWeight ? ` | Peso-alvo: ${input.targetWeight} kg` : ''}
- Objetivo: ${GOAL_LABELS[input.aestheticGoal] || input.aestheticGoal}
- Nível de atividade diária: ${ACTIVITY_LABELS[input.activityLevel] || input.activityLevel}
- Padrão alimentar: ${STYLE_LABELS[input.dietStyle] || input.dietStyle}
- Horário do treino: ${input.trainingTiming || 'não informado'}
- Volume de corrida: ${input.weeklyMileage ?? 0} km/semana | Musculação: ${input.strengthFrequency ?? 0}x/semana
- Suplementos em uso: ${input.supplements || 'nenhum'}
- Alergias/intolerâncias: ${input.allergies || 'nenhuma'}
- Alimentos preferidos: ${input.preferredFoods || 'sem preferências'}
- Alimentos a EVITAR: ${input.excludedFoods || 'nenhum'}`;

  const output = await generateJSON<GenerateDietPlanOutput>({
    system,
    prompt,
    temperature: 0.5,
    schema: GenerateDietPlanOutputSchema,
  });

  if (!output?.meals) throw new Error('Falha na geração do plano alimentar.');
  return output;
}
