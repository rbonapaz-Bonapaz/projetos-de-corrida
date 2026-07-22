/**
 * @fileOverview Regras de negócio compartilhadas pelos geradores de IA
 * (treino, dieta e futuras planilhas). Centraliza três coisas que antes
 * viviam soltas dentro de cada flow:
 *
 * 1. Validação pré-voo — o que precisa estar preenchido no perfil antes de
 *    acionar a IA, para não gastar a chamada com um resultado genérico.
 * 2. Diretrizes de segurança — transforma dados de anamnese (lesões, sono,
 *    estresse, liberação médica...) em instruções imperativas para o
 *    modelo, em vez de deixá-los como texto solto que a IA pode ignorar.
 * 3. Cálculo determinístico de baseline calórico — a aritmética de TMB/GET
 *    fica no código (confiável) e serve de âncora para a IA, que só
 *    precisa ajustar/justificar, não calcular do zero.
 */

import type { AthleteProfile, AnamnesisData } from '@/lib/types';

export function calcAge(birthDate?: string): number | undefined {
  if (!birthDate) return undefined;
  const diff = Date.now() - new Date(birthDate).getTime();
  if (isNaN(diff)) return undefined;
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

// ---------------------------------------------------------------------------
// 1. Validação pré-voo
// ---------------------------------------------------------------------------

export function validateTrainingPlanInputs(profile: AthleteProfile): string[] {
  const missing: string[] = [];
  if (!profile.raceDistance) missing.push('Distância da prova alvo');
  if (!profile.raceDate) missing.push('Data da prova alvo');
  if (!profile.weeklyMileageGoal) missing.push('Meta de volume semanal (km)');
  if (!profile.trainingDays?.length) missing.push('Dias de treino disponíveis');
  if (!profile.thresholdPace && !profile.vo2Max) missing.push('Pace limiar ou VDOT/VO2 (ao menos um)');
  if (!profile.experienceLevel) missing.push('Nível de experiência');
  return missing;
}

export function validateDietPlanInputs(profile: AthleteProfile): string[] {
  const missing: string[] = [];
  if (!profile.currentWeight) missing.push('Peso atual');
  if (!profile.height) missing.push('Altura');
  if (!profile.gender) missing.push('Gênero (para cálculo de TMB)');
  if (!profile.birthDate) missing.push('Data de nascimento (para cálculo de TMB)');
  if (!profile.dietPreferences?.activityLevel) missing.push('Nível de atividade diária (aba Dieta)');
  if (!profile.dietPreferences?.dietStyle) missing.push('Padrão alimentar (aba Dieta)');
  return missing;
}

// ---------------------------------------------------------------------------
// 2. Diretrizes de segurança — a partir da anamnese e do perfil
// ---------------------------------------------------------------------------

export function buildSafetyDirectives(profile: AthleteProfile): string {
  const a: AnamnesisData = profile.anamnesis || {};
  const rules: string[] = [];

  if (a.medicalRelease === 'Não') {
    rules.push('SEM liberação médica confirmada: manter TODAS as sessões em Z1-Z2 (fácil/regenerativo), sem treinos de qualidade, e incluir aviso recomendando avaliação médica antes de progredir.');
  } else if (a.medicalRelease === 'Parcial (com restrições)') {
    rules.push('Liberação médica PARCIAL: respeitar rigorosamente as restrições relatadas e evitar picos de intensidade (sem VO2 máx/tiros nas primeiras semanas).');
  }

  if (a.chronicIllness === 'Sim') {
    rules.push(`Doença crônica declarada${a.chronicIllnessDetail ? ` (${a.chronicIllnessDetail})` : ''}: adaptar volume/intensidade com margem de segurança e sugerir acompanhamento médico contínuo.`);
  }

  if (a.medication) {
    rules.push(`Medicação em uso (${a.medication}): considerar possível efeito sobre FC/percepção de esforço; priorizar RPE sobre zona de FC se houver suspeita de interferência.`);
  }

  if (a.activeInjuries) {
    rules.push(`Dor/lesão ATIVA agora (${a.activeInjuries}): evitar estímulos que agravem a região; preferir crosstraining de baixo impacto até resolução.`);
  }

  if (a.injuryHistory?.length && !a.injuryHistory.includes('Nenhuma')) {
    rules.push(`Histórico de lesões (${a.injuryHistory.join(', ')}): incluir fortalecimento/mobilidade preventiva para essas regiões nas notas de força da semana.`);
  }

  if ((a.sleepQuality ?? 3) <= 2 || (a.stressLevel ?? 3) >= 4) {
    rules.push('Sono ruim e/ou estresse elevado relatados: reduzir a densidade de estímulos fortes (nunca 2 dias de qualidade seguidos) e priorizar recuperação até o quadro melhorar.');
  }

  if ((a.commitmentLevel ?? 10) <= 4) {
    rules.push('Comprometimento declarado baixo: montar plano mais simples, com menos dias de treino e progressão mais lenta, priorizando adesão sobre volume.');
  }

  const beginnerLike = profile.experienceLevel === 'beginner' || profile.experienceLevel === 'run_walk'
    || a.practiceTime === 'Menos de 6 meses';
  if (beginnerLike) {
    rules.push('Atleta iniciante: no máximo 1 sessão de intensidade por semana, progressão de volume conservadora, sempre com aquecimento e arrefecimento explícitos nas fases.');
  }

  if (!rules.length) {
    rules.push('Nenhuma restrição clínica relevante informada — ainda assim, aplique a regra geral de progressão segura (item abaixo).');
  }

  return rules.map((r) => `- ${r}`).join('\n');
}

// ---------------------------------------------------------------------------
// Regras de progressão de treino (texto fixo, reutilizado no prompt)
// ---------------------------------------------------------------------------

export const TRAINING_PROGRESSION_RULES = `
- REGRA DOS 10%: o volume semanal total nunca deve crescer mais que ~10% em relação à semana anterior.
- DELOAD: a cada 4 semanas, reduza o volume em 20-30% (semana de recuperação) antes de retomar a progressão.
- TAPER: nas últimas 2-3 semanas antes da prova, reduza volume gradualmente mantendo pequenos estímulos de intensidade, preservando o "frescor" para o dia da prova.
- LONGÃO: o treino mais longo da semana não deve ultrapassar ~30-35% do volume semanal total, exceto em blocos específicos de maratona.
- ENCADEAMENTO: um dia de qualidade (limiar/tiros/subidas) deve ser seguido por um dia regenerativo ou de descanso — nunca dois dias de alta intensidade seguidos.
- FORÇA: coordene os dias de treino de força informados pelo atleta para não coincidir com — nem anteceder diretamente — os dias de corrida de qualidade.
- RPE COERENTE: o campo 'rpe' deve refletir o 'type' (ex.: Regenerativo = RPE 2-3, Longão = RPE 5-7, Tiros/Limiar = RPE 8-9).
`.trim();

// ---------------------------------------------------------------------------
// 3. Baseline calórico determinístico (Mifflin-St Jeor)
// ---------------------------------------------------------------------------

const ACTIVITY_MULTIPLIER: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

// Ajuste percentual sobre o GET conforme o objetivo estético/de composição.
const GOAL_ADJUSTMENT: Record<string, number> = {
  cutting: -0.18,
  bulking: 0.12,
  recomp: -0.05,
  performance: 0,
};

// Proteína em g/kg de peso corporal, por objetivo (corredores precisam de mais que sedentários).
const PROTEIN_G_PER_KG: Record<string, number> = {
  cutting: 2.0,
  bulking: 1.8,
  recomp: 2.0,
  performance: 1.7,
};

export interface DietBaseline {
  bmr: number;
  tdee: number;
  targetCalories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
}

/** Calcula TMB (Mifflin-St Jeor), GET e a distribuição de macros como âncora numérica para a IA. */
export function computeDietBaseline(params: {
  gender?: string;
  age?: number;
  currentWeight: number;
  height: number;
  activityLevel: string;
  aestheticGoal: string;
}): DietBaseline {
  const { gender, age = 30, currentWeight, height, activityLevel, aestheticGoal } = params;

  // Mifflin-St Jeor: homens +5, mulheres -161, "outro" usa a média dos dois.
  const genderOffset = gender === 'male' ? 5 : gender === 'female' ? -161 : -78;
  const bmr = (10 * currentWeight) + (6.25 * height) - (5 * age) + genderOffset;

  const activityFactor = ACTIVITY_MULTIPLIER[activityLevel] ?? ACTIVITY_MULTIPLIER.moderate;
  const tdee = bmr * activityFactor;

  const goalAdj = GOAL_ADJUSTMENT[aestheticGoal] ?? 0;
  const targetCalories = Math.round(tdee * (1 + goalAdj));

  const proteinPerKg = PROTEIN_G_PER_KG[aestheticGoal] ?? 1.8;
  const proteinG = Math.round(currentWeight * proteinPerKg);
  const fatG = Math.round((targetCalories * 0.25) / 9);
  const carbsKcal = targetCalories - (proteinG * 4) - (fatG * 9);
  const carbsG = Math.max(0, Math.round(carbsKcal / 4));

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories,
    proteinG,
    fatG,
    carbsG,
  };
}
