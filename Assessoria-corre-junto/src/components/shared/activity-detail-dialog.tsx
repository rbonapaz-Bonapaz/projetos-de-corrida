'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { ImportedActivity } from '@/lib/types';
import { Activity as ActivityIcon } from 'lucide-react';

interface ActivityDetailDialogProps {
  activity: ImportedActivity | null;
  onOpenChange: (open: boolean) => void;
}

/** Detalhe completo de uma atividade importada — reaproveitado em Integrações e no calendário de Meu Plano. */
export function ActivityDetailDialog({ activity, onOpenChange }: ActivityDetailDialogProps) {
  return (
    <Dialog open={!!activity} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogTitle className="flex items-center gap-2 text-base">
          <ActivityIcon size={16} className="text-primary" />
          {activity?.sport || 'Atividade'}
        </DialogTitle>
        {activity && (
          <div className="space-y-4">
            <p className="text-[12px] text-muted-foreground">
              {activity.startTime ? new Date(activity.startTime).toLocaleString('pt-BR') : 'Data desconhecida'}
              {' · '}Fonte: {activity.source === 'coros' ? 'COROS' : activity.source}
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { label: 'Distância', value: activity.distanceKm ? `${activity.distanceKm} km` : undefined },
                { label: 'Duração', value: activity.durationText },
                { label: 'Calorias', value: activity.calories ? `${activity.calories} kcal` : undefined },
                { label: 'Pace médio', value: activity.avgPace },
                { label: 'Pace máximo', value: activity.maxPace },
                { label: 'Velocidade méd.', value: activity.avgSpeedKmh ? `${activity.avgSpeedKmh} km/h` : undefined },
                { label: 'FC média', value: activity.avgHr ? `${activity.avgHr} bpm` : undefined },
                { label: 'FC máxima', value: activity.maxHr ? `${activity.maxHr} bpm` : undefined },
                { label: 'Cadência média', value: activity.avgCadenceSpm ? `${activity.avgCadenceSpm} spm` : undefined },
                { label: 'Cadência máxima', value: activity.maxCadenceSpm ? `${activity.maxCadenceSpm} spm` : undefined },
                { label: 'Tempo de contato', value: activity.avgGroundContactTimeMs ? `${activity.avgGroundContactTimeMs} ms` : undefined },
                { label: 'Oscilação vertical', value: activity.avgVerticalOscillationCm ? `${activity.avgVerticalOscillationCm} cm` : undefined },
                { label: 'Vertical ratio', value: activity.avgVerticalRatio ? `${activity.avgVerticalRatio}%` : undefined },
                { label: 'Passada', value: activity.avgStrideLengthM ? `${activity.avgStrideLengthM} m` : undefined },
                { label: 'Potência média', value: activity.avgPowerW ? `${activity.avgPowerW} W` : undefined },
                { label: 'Ganho de elevação', value: activity.totalAscentM ? `${activity.totalAscentM} m` : undefined },
                { label: 'Perda de elevação', value: activity.totalDescentM ? `${activity.totalDescentM} m` : undefined },
                { label: 'Temperatura méd.', value: activity.avgTemperatureC ? `${activity.avgTemperatureC}°C` : undefined },
              ]
                .filter((m) => m.value !== undefined)
                .map((m) => (
                  <div key={m.label} className="metric-tile">
                    <small>{m.label}</small>
                    <b className="num !text-[15px]">{m.value}</b>
                  </div>
                ))}
            </div>
            <p className="text-[10px] text-muted-foreground border-t border-border pt-3">
              Arquivo: {activity.fileName} · Importado em {new Date(activity.importedAt).toLocaleString('pt-BR')}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
