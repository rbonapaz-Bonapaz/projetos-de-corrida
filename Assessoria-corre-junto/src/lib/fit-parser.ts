/**
 * Parser de arquivos .FIT (COROS PACE PRO, Garmin, etc.) no navegador.
 * Extrai as métricas reais do treino para servir de "fonte da verdade"
 * à análise da IA — evitando que o modelo tente ler o binário cru.
 */

// @ts-ignore - a lib não traz tipos
import FitParser from 'fit-file-parser';

export interface FitSummary {
  sport?: string;
  startTime?: string;
  distanceKm?: number;
  durationSec?: number;
  durationText?: string;
  avgPace?: string;
  maxPace?: string;
  avgHr?: number;
  maxHr?: number;
  avgCadenceSpm?: number;
  maxCadenceSpm?: number;
  avgVerticalOscillationCm?: number;
  avgGroundContactTimeMs?: number;
  avgStrideLengthM?: number;
  avgVerticalRatio?: number;
  avgPowerW?: number;
  totalAscentM?: number;
  totalDescentM?: number;
  calories?: number;
  avgTemperatureC?: number;
}

function paceFromSpeedKmh(kmh?: number): string | undefined {
  if (!kmh || kmh <= 0) return undefined;
  const minPerKm = 60 / kmh;
  const m = Math.floor(minPerKm);
  const s = Math.round((minPerKm - m) * 60);
  const ss = s === 60 ? 0 : s;
  const mm = s === 60 ? m + 1 : m;
  return `${mm}:${String(ss).padStart(2, '0')}/km`;
}

function secToText(sec?: number): string | undefined {
  if (!sec || sec <= 0) return undefined;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.round(sec % 60);
  return h > 0
    ? `${h}h${String(m).padStart(2, '0')}min`
    : `${m}min${String(s).padStart(2, '0')}s`;
}

function avg(nums: number[]): number | undefined {
  const valid = nums.filter((n) => typeof n === 'number' && !isNaN(n));
  if (!valid.length) return undefined;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

/** Normaliza a cadência do FIT para passos por minuto (SPM). */
function toSpm(cadence?: number, fractional?: number): number | undefined {
  if (cadence == null) return undefined;
  const raw = cadence + (fractional || 0);
  // FIT costuma gravar cadência de corrida "por perna" (~85). SPM real = x2.
  return raw > 0 && raw < 130 ? Math.round(raw * 2) : Math.round(raw);
}

export function parseFitFile(buffer: ArrayBuffer): Promise<FitSummary> {
  return new Promise((resolve, reject) => {
    const parser = new FitParser({
      force: true,
      speedUnit: 'km/h',
      lengthUnit: 'km',
      temperatureUnit: 'celsius',
      elapsedRecordField: true,
      mode: 'list',
    });

    parser.parse(buffer, (error: any, data: any) => {
      if (error) {
        reject(new Error('Não foi possível ler o arquivo .FIT.'));
        return;
      }

      try {
        const session = data?.sessions?.[0] || {};
        const records: any[] = data?.records || [];

        // Running dynamics geralmente só existem nos records.
        const vo = avg(records.map((r) => r.vertical_oscillation).filter(Boolean));
        const gct = avg(records.map((r) => r.stance_time).filter(Boolean));
        const vr = avg(records.map((r) => r.vertical_ratio).filter(Boolean));
        const stride = avg(records.map((r) => r.step_length).filter(Boolean)); // mm
        const power = avg(records.map((r) => r.power).filter(Boolean));

        const summary: FitSummary = {
          sport: session.sport || data?.activity?.sessions?.[0]?.sport,
          startTime: session.start_time ? new Date(session.start_time).toISOString() : undefined,
          distanceKm: session.total_distance ? Number(session.total_distance.toFixed(2)) : undefined,
          durationSec: session.total_timer_time ? Math.round(session.total_timer_time) : undefined,
          durationText: secToText(session.total_timer_time),
          avgPace: paceFromSpeedKmh(session.avg_speed),
          maxPace: paceFromSpeedKmh(session.max_speed),
          avgHr: session.avg_heart_rate ? Math.round(session.avg_heart_rate) : undefined,
          maxHr: session.max_heart_rate ? Math.round(session.max_heart_rate) : undefined,
          avgCadenceSpm: toSpm(session.avg_running_cadence ?? session.avg_cadence, session.avg_fractional_cadence),
          maxCadenceSpm: toSpm(session.max_running_cadence ?? session.max_cadence),
          avgVerticalOscillationCm: vo ? Number((vo / 10).toFixed(1)) : undefined, // mm -> cm
          avgGroundContactTimeMs: gct ? Math.round(gct) : undefined,
          avgVerticalRatio: vr ? Number(vr.toFixed(1)) : undefined,
          avgStrideLengthM: stride ? Number((stride / 1000).toFixed(2)) : undefined, // mm -> m
          avgPowerW: power ? Math.round(power) : undefined,
          // lengthUnit 'km' também converte ascent/descent; reconverte para metros.
          totalAscentM: session.total_ascent ? Math.round(session.total_ascent * 1000) : undefined,
          totalDescentM: session.total_descent ? Math.round(session.total_descent * 1000) : undefined,
          calories: session.total_calories ? Math.round(session.total_calories) : undefined,
          avgTemperatureC: session.avg_temperature ? Math.round(session.avg_temperature) : undefined,
        };

        resolve(summary);
      } catch (e) {
        reject(new Error('Falha ao interpretar os dados do arquivo .FIT.'));
      }
    });
  });
}

/** Converte o resumo em texto legível para a IA (fonte da verdade). */
export function fitSummaryToText(s: FitSummary): string {
  const lines: string[] = [];
  const push = (label: string, value: any, unit = '') => {
    if (value !== undefined && value !== null && value !== '') lines.push(`- ${label}: ${value}${unit}`);
  };
  push('Esporte', s.sport);
  push('Distância', s.distanceKm, ' km');
  push('Duração', s.durationText);
  push('Pace médio', s.avgPace);
  push('Pace máximo (mais rápido)', s.maxPace);
  push('FC média', s.avgHr, ' bpm');
  push('FC máxima', s.maxHr, ' bpm');
  push('Cadência média', s.avgCadenceSpm, ' spm');
  push('Cadência máxima', s.maxCadenceSpm, ' spm');
  push('Comprimento de passada médio', s.avgStrideLengthM, ' m');
  push('Oscilação vertical média', s.avgVerticalOscillationCm, ' cm');
  push('Tempo de contato com o solo (GCT)', s.avgGroundContactTimeMs, ' ms');
  push('Razão vertical', s.avgVerticalRatio, ' %');
  push('Potência média', s.avgPowerW, ' W');
  push('Ganho de elevação', s.totalAscentM, ' m');
  push('Perda de elevação', s.totalDescentM, ' m');
  push('Calorias', s.calories, ' kcal');
  push('Temperatura média', s.avgTemperatureC, ' °C');
  return lines.length ? lines.join('\n') : 'Nenhuma métrica pôde ser extraída do arquivo.';
}
