
/**
 * @fileOverview Utilitários para integração com calendários (Google e ICS).
 */

import type { Workout, TrainingPlan } from './types';

const DAY_PREFIX_MAP: Record<string, string> = {
  dom: 'Domingo', seg: 'Segunda', ter: 'Terça', qua: 'Quarta',
  qui: 'Quinta', sex: 'Sexta', sab: 'Sábado',
};
const DAY_INDEX: Record<string, number> = {
  Domingo: 0, Segunda: 1, Terça: 2, Quarta: 3, Quinta: 4, Sexta: 5, Sábado: 6,
};

/**
 * Normaliza variações do nome do dia vindas da IA ("Terça-feira", "domingo",
 * "SEX") para a forma canônica usada no app. O campo 'day' do plano é texto
 * livre no prompt — sem isso, qualquer variação de formato não batia com o
 * dayMap original e todos os treinos "não reconhecidos" colapsavam pro
 * mesmo dia (o fallback era sempre Segunda).
 */
export function normalizeDayName(day: string): string {
  const prefix = (day || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .slice(0, 3);
  return DAY_PREFIX_MAP[prefix] || 'Segunda';
}

/**
 * Calcula a data de um treino baseado no número da semana e dia.
 *
 * `anchorToRaceDate` só deve ser true para um plano de CICLO COMPLETO
 * (planGenerationType 'full'), onde a última semana do plano de fato
 * termina na semana da prova. Para um bloco curto (4 semanas, o modo
 * padrão), a prova pode estar meses no futuro — ancorar nela empurrava o
 * bloco inteiro pra data da prova em vez de começar a partir de hoje.
 */
export function calculateWorkoutDate(
  weekNumber: number,
  dayName: string,
  raceDateStr?: string,
  planDurationWeeks: number = 4,
  anchorToRaceDate: boolean = false
): Date {
  const dayIdx = DAY_INDEX[normalizeDayName(dayName)] ?? 1;

  if (raceDateStr && anchorToRaceDate) {
    const raceDate = new Date(raceDateStr);
    raceDate.setMinutes(raceDate.getMinutes() + raceDate.getTimezoneOffset());

    // Assume que a última semana do plano termina na semana da prova.
    const weeksToSubtract = planDurationWeeks - weekNumber;
    const targetDate = new Date(raceDate);
    targetDate.setDate(targetDate.getDate() - (weeksToSubtract * 7));

    const currentDay = targetDate.getDay();
    targetDate.setDate(targetDate.getDate() + (dayIdx - currentDay));
    return targetDate;
  } else {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + (7 - startDate.getDay()));
    startDate.setDate(startDate.getDate() + (weekNumber - 1) * 7 + dayIdx);
    return startDate;
  }
}

/**
 * Cor semântica (token CSS, ex. "var(--good)") por tipo de treino — usada
 * na visão de calendário mensal para dar contexto visual rápido sem abrir
 * cada treino. Agrupa os 8 tipos que a IA usa (ver generate-training-block)
 * por intensidade: fácil/regenerativo, longo, qualidade moderada, alta intensidade.
 */
const WORKOUT_TYPE_COLORS: Record<string, string> = {
  LONGÃO: 'var(--info)',
  LIMIAR: 'var(--crit)',
  TIROS: 'var(--crit)',
  SUBIDAS: 'var(--warn)',
  PROGRESSIVO: 'var(--warn)',
  FARTLEK: 'var(--warn)',
  RODAGEM: 'var(--good)',
  REGENERATIVO: 'var(--good)',
};

export function getWorkoutTypeColor(type: string): string {
  const upper = (type || '').toUpperCase();
  const key = Object.keys(WORKOUT_TYPE_COLORS).find((k) => upper.includes(k));
  return key ? WORKOUT_TYPE_COLORS[key] : 'var(--primary)';
}

/**
 * Gera uma descrição detalhada em texto para o calendário.
 */
export function getRichDescription(workout: Workout): string {
  const techDetails = workout.technicalDetails?.map(d => `${d.label.toUpperCase()}: ${d.value}`).join('\n') || '';
  const phases = workout.phases?.map(p => `- ${p.name}: ${p.distance} (${p.description})`).join('\n') || '';
  
  return `OBJETIVO: ${workout.description}\n\n` +
         `${techDetails}\n\n` +
         `ESTRUTURA:\n${phases}\n\n` +
         `Gerado via CorreJunto Lab.`;
}

/**
 * Gera uma URL para adicionar o evento diretamente na Google Agenda.
 */
export function generateGoogleCalendarUrl(workout: Workout, date: Date): string {
  const baseUrl = "https://www.google.com/calendar/render?action=TEMPLATE";
  const title = encodeURIComponent(`🏃‍♂️ ${workout.type} (${workout.distance})`);
  
  const start = date.toISOString().replace(/-|:|\.\d\d\d/g, "");
  const endDate = new Date(date);
  endDate.setHours(date.getHours() + 1);
  const end = endDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
  
  const details = encodeURIComponent(getRichDescription(workout));
  
  return `${baseUrl}&text=${title}&dates=${start}/${end}&details=${details}&sf=true&output=xml`;
}

/**
 * Gera um arquivo .ics contendo todo o plano de treinamento.
 */
export function downloadPlanAsICS(plan: TrainingPlan, raceDate?: string, anchorToRaceDate: boolean = false) {
  let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//CorreJunto//NONSGML Training Plan//PT\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n";

  plan.weeklyPlans.forEach(week => {
    week.runs.forEach(run => {
      const date = calculateWorkoutDate(week.weekNumber, run.day, raceDate, plan.durationWeeks, anchorToRaceDate);
      const start = date.toISOString().replace(/-|:|\.\d\d\d/g, "");
      const end = new Date(date.getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "");
      
      const description = getRichDescription(run).replace(/\n/g, "\\n");
      
      icsContent += "BEGIN:VEVENT\n";
      icsContent += `SUMMARY:🏃‍♂️ ${run.type} (${run.distance})\n`;
      icsContent += `DTSTART:${start}\n`;
      icsContent += `DTEND:${end}\n`;
      icsContent += `DESCRIPTION:${description}\n`;
      icsContent += "STATUS:CONFIRMED\n";
      icsContent += "END:VEVENT\n";
    });
  });
  
  icsContent += "END:VCALENDAR";
  
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Ciclo_CorreJunto_${plan.blockType}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
