/**
 * @fileOverview Geração de plano alimentar/dieta personalizado.
 * Browser-safe: usa o cliente Gemini via fetch (sem Genkit/Express).
 */

import { generateJSON } from '@/ai/genkit';
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
  const system = `Você é um nutricionista esportivo de elite do CorreJunto Lab, especialista em corredores.

DIRETRIZES:
1. Calcule a necessidade calórica com base em TMB (Mifflin-St Jeor) x fator de atividade, ajustada ao objetivo (déficit para cutting, superávit para bulking, manutenção para recomp/performance).
2. Distribua os macros de forma adequada ao objetivo e ao volume de corrida (proteína 1.6–2.2 g/kg; carboidrato conforme volume; gordura restante).
3. Respeite RIGOROSAMENTE alergias, restrições e o padrão alimentar informado (ex: vegano = zero produtos animais).
4. Some as calorias/macros das refeições de forma coerente com a meta diária.
5. Seja prático: use alimentos acessíveis no Brasil e porções em medidas caseiras + gramas.
6. Responda SEMPRE em PORTUGUÊS (Brasil).

SEGURANÇA CLÍNICA:
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
