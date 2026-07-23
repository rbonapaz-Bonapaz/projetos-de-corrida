"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TrainingContext } from "@/contexts/TrainingContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { parseFitFile } from "@/lib/fit-parser";
import type { ImportedActivity } from "@/lib/types";
import { CheckCircle2, Link2, Upload, Loader2, Trash2, Activity as ActivityIcon } from "lucide-react";

const StravaLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="size-7">
    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.637h4.122L10.379 0 3 14.702h4.122" />
  </svg>
);

const CorosLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="size-7">
    <path d="M12 4.4L18.6 8.2V15.8L12 19.6L5.4 15.8V8.2L12 4.4ZM12 0L2 5.8V18.2L12 24L22 18.2V5.8L12 0Z" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

export default function IntegrationsPage() {
  const context = React.useContext(TrainingContext);
  const { toast } = useToast();
  const stravaConnected = !!context?.activeProfile?.integrations?.strava?.connected;
  const corosConnected = !!context?.activeProfile?.integrations?.coros?.connected;
  const importedActivities = context?.activeProfile?.importedActivities || [];

  const [importing, setImporting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleToggle = (service: 'strava' | 'coros') => {
    const isConnected = service === 'strava' ? stravaConnected : corosConnected;
    context?.toggleIntegration(service, !isConnected);
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !context?.activeProfile) return;

    setImporting(true);
    const newActivities: ImportedActivity[] = [];
    let skipped = 0;

    for (const file of files) {
      const name = file.name.toLowerCase();
      if (!name.endsWith('.fit')) {
        skipped++;
        continue;
      }
      try {
        const buffer = await file.arrayBuffer();
        const summary = await parseFitFile(buffer);
        newActivities.push({
          id: (typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2)),
          source: 'coros',
          fileName: file.name,
          importedAt: new Date().toISOString(),
          sport: summary.sport,
          startTime: summary.startTime,
          distanceKm: summary.distanceKm,
          durationSec: summary.durationSec,
          durationText: summary.durationText,
          avgPace: summary.avgPace,
          avgHr: summary.avgHr,
          avgCadenceSpm: summary.avgCadenceSpm,
          avgGroundContactTimeMs: summary.avgGroundContactTimeMs,
          avgVerticalOscillationCm: summary.avgVerticalOscillationCm,
          totalAscentM: summary.totalAscentM,
          calories: summary.calories,
        });
      } catch (err) {
        skipped++;
      }
    }

    if (newActivities.length) {
      await context.saveProfile({
        importedActivities: [...newActivities, ...importedActivities],
      });
      context.toggleIntegration('coros', true);
    }

    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (newActivities.length) {
      toast({ title: `${newActivities.length} atividade(s) importada(s)`, description: skipped ? `${skipped} arquivo(s) ignorado(s) (formato não suportado).` : undefined });
    } else {
      toast({ variant: "destructive", title: "Nada importado", description: "Envie arquivos .fit exportados do COROS." });
    }
  };

  const handleRemove = (id: string) => {
    if (!context?.activeProfile) return;
    context.saveProfile({ importedActivities: importedActivities.filter(a => a.id !== id) });
  };

  return (
    <DashboardLayout>
      <header className="mb-6">
        <h1 className="text-2xl md:text-[26px] font-bold tracking-tight flex items-center gap-2.5">
          <Link2 className="size-6 text-primary" /> Integrações
        </h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Conecte suas plataformas para importar treinos realizados e exportar treinos planejados.
        </p>
      </header>

      <div className="flex flex-col gap-5">
        <section className="card-plain">
          <h3 className="eyebrow mb-1">Conexões</h3>
          <p className="text-[12px] text-muted-foreground mb-5">
            Marca a plataforma como conectada — hoje ainda não sincroniza automaticamente (sem OAuth). Use a importação manual abaixo para o COROS.
          </p>

          <div className="flex flex-wrap gap-5">
            <button
              onClick={() => handleToggle('strava')}
              className={cn(
                "group relative flex flex-col items-center justify-center w-36 h-36 rounded-2xl transition-all duration-300 border",
                stravaConnected
                  ? "bg-[#FC6100] text-white border-[#FC6100]"
                  : "bg-secondary/40 text-[#FC6100] border-border hover:border-[#FC6100]/40"
              )}
            >
              <StravaLogo />
              <span className={cn("mt-2.5 text-[11px] font-semibold", stravaConnected ? "text-white" : "text-muted-foreground")}>
                Strava
              </span>
              {stravaConnected && (
                <div className="absolute top-3 right-3 p-0.5 bg-white rounded-full">
                  <CheckCircle2 className="size-4 text-[#FC6100]" />
                </div>
              )}
            </button>

            <button
              onClick={() => handleToggle('coros')}
              className={cn(
                "group relative flex flex-col items-center justify-center w-36 h-36 rounded-2xl transition-all duration-300 border",
                corosConnected
                  ? "bg-foreground text-background border-foreground"
                  : "bg-secondary/40 text-foreground border-border hover:border-foreground/30"
              )}
            >
              <CorosLogo />
              <span className={cn("mt-2.5 text-[11px] font-semibold", corosConnected ? "text-background" : "text-muted-foreground")}>
                Coros
              </span>
              {corosConnected && (
                <div className="absolute top-3 right-3 p-0.5 bg-background rounded-full">
                  <CheckCircle2 className="size-4 text-foreground" />
                </div>
              )}
            </button>
          </div>
        </section>

        <section className="card-plain">
          <h3 className="eyebrow mb-1">Importar dados do COROS</h3>
          <p className="text-[12px] text-muted-foreground mb-5">
            Envie um ou mais arquivos <span className="text-foreground font-medium">.fit</span> exportados do seu relógio COROS (PACE Pro e similares). Suporte a exportação em lote (.zip/.csv) chega em seguida.
          </p>

          <div
            className={cn(
              "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all",
              importing ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/30"
            )}
            onClick={() => !importing && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".fit"
              multiple
              className="hidden"
              onChange={handleFilesSelected}
              disabled={importing}
            />
            {importing ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="size-6 text-primary animate-spin" />
                <p className="text-[13px] font-semibold text-primary">Importando…</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary w-fit"><Upload size={20} /></div>
                <p className="text-[13px] font-semibold">Selecionar arquivos .fit</p>
                <p className="text-[11px] text-muted-foreground">Pode selecionar vários de uma vez</p>
              </div>
            )}
          </div>

          {!!importedActivities.length && (
            <div className="mt-5 flex flex-col gap-2.5">
              <p className="eyebrow">{importedActivities.length} atividade(s) importada(s)</p>
              {importedActivities.map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-secondary/30">
                  <div className="size-9 rounded-lg bg-secondary flex items-center justify-center shrink-0 border border-border text-primary">
                    <ActivityIcon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate">
                      {a.sport || 'Atividade'}{a.distanceKm ? ` · ${a.distanceKm} km` : ''}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {[a.avgPace, a.durationText, a.avgHr ? `${a.avgHr} bpm` : null].filter(Boolean).join(' · ') || a.fileName}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 hidden sm:block">
                    {new Date(a.importedAt).toLocaleDateString('pt-BR')}
                  </span>
                  <button
                    onClick={() => handleRemove(a.id)}
                    className="text-muted-foreground hover:text-destructive shrink-0"
                    aria-label="Remover"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
