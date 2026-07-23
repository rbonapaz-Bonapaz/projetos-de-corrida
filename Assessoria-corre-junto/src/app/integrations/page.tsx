"use client";

import * as React from "react";
import JSZip from "jszip";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TrainingContext } from "@/contexts/TrainingContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { parseFitFile } from "@/lib/fit-parser";
import { mergePersonalRecords, addActivityStats, trimRecentActivities, fitSummaryToEntry } from "@/lib/records";
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

interface RawFitFile {
  name: string;
  buffer: ArrayBuffer;
}

/** Expande arquivos .fit e .zip (inclusive .zip aninhados, até 2 níveis) numa lista plana de buffers. */
async function expandFiles(files: File[], depth = 0): Promise<RawFitFile[]> {
  const out: RawFitFile[] = [];
  for (const file of files) {
    const name = file.name.toLowerCase();
    if (name.endsWith('.fit')) {
      out.push({ name: file.name, buffer: await file.arrayBuffer() });
    } else if (name.endsWith('.zip') && depth < 2) {
      const zip = await JSZip.loadAsync(file);
      const entryNames = Object.keys(zip.files).filter((n) => !zip.files[n].dir);
      for (const entryName of entryNames) {
        const lower = entryName.toLowerCase();
        if (lower.endsWith('.fit')) {
          const buffer = await zip.files[entryName].async('arraybuffer');
          out.push({ name: entryName.split('/').pop() || entryName, buffer });
        } else if (lower.endsWith('.zip') && depth < 1) {
          const nestedBlob = await zip.files[entryName].async('blob');
          const nestedFile = new File([nestedBlob], entryName);
          out.push(...await expandFiles([nestedFile], depth + 1));
        }
      }
    }
  }
  return out;
}

export default function IntegrationsPage() {
  const context = React.useContext(TrainingContext);
  const { toast } = useToast();
  const stravaConnected = !!context?.activeProfile?.integrations?.strava?.connected;
  const corosConnected = !!context?.activeProfile?.integrations?.coros?.connected;
  const recentActivities = context?.activeProfile?.importedActivities || [];

  const [importing, setImporting] = React.useState(false);
  const [progress, setProgress] = React.useState({ done: 0, total: 0, stage: '' });
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleToggle = (service: 'strava' | 'coros') => {
    const isConnected = service === 'strava' ? stravaConnected : corosConnected;
    context?.toggleIntegration(service, !isConnected);
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !context?.activeProfile) return;

    setImporting(true);
    setProgress({ done: 0, total: 0, stage: 'Descompactando…' });

    let rawFiles: RawFitFile[];
    try {
      rawFiles = await expandFiles(files);
    } catch (err: any) {
      setImporting(false);
      toast({ variant: "destructive", title: "Erro ao ler o(s) arquivo(s)", description: err?.message });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (!rawFiles.length) {
      setImporting(false);
      toast({ variant: "destructive", title: "Nada para importar", description: "Envie arquivos .fit ou um .zip exportado do COROS." });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setProgress({ done: 0, total: rawFiles.length, stage: 'Processando' });

    const batch: ImportedActivity[] = [];
    let skipped = 0;

    for (let i = 0; i < rawFiles.length; i++) {
      const { name, buffer } = rawFiles[i];
      try {
        const summary = await parseFitFile(buffer);
        batch.push({
          id: (typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2)),
          source: 'coros',
          fileName: name,
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
      } catch {
        skipped++;
      }

      if (i % 15 === 0 || i === rawFiles.length - 1) {
        setProgress({ done: i + 1, total: rawFiles.length, stage: 'Processando' });
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    let saveError: string | null = null;

    if (batch.length) {
      setProgress({ done: rawFiles.length, total: rawFiles.length, stage: 'Salvando…' });

      try {
        const profile = context.activeProfile;
        if (!profile) throw new Error('Perfil não encontrado — recarregue a página e tente de novo.');

        const candidateEntries = batch.map(fitSummaryToEntry).filter((e): e is NonNullable<typeof e> => !!e);
        const updatedRecords = mergePersonalRecords(profile.personalRecords, candidateEntries);
        const updatedStats = addActivityStats(profile.activityStats, batch);
        let updatedRecent = trimRecentActivities([...batch, ...recentActivities]);

        const update = {
          personalRecords: updatedRecords,
          activityStats: updatedStats,
          importedActivities: updatedRecent,
          integrations: {
            ...profile.integrations,
            coros: { ...profile.integrations?.coros, connected: true, autoSync: true },
          },
        };

        // Firestore recusa documentos acima de ~1MB. Se o perfil já é grande
        // (planos/histórico antigos), reduz o log de atividades recentes em
        // vez de tentar salvar um documento fadado a falhar silenciosamente.
        const estimatedBytes = new Blob([JSON.stringify({ ...profile, ...update })]).size;
        if (estimatedBytes > 850_000) {
          updatedRecent = trimRecentActivities([...batch, ...recentActivities], 15);
          update.importedActivities = updatedRecent;
        }

        // Um único saveProfile: chamadas separadas (ex. depois um toggleIntegration)
        // se baseiam no `activeProfile` do contexto, que só atualiza no próximo
        // render — uma segunda chamada síncrona sobrescreveria estes campos.
        context.saveProfile(update as any);
      } catch (err: any) {
        saveError = err?.message || 'Falha ao salvar os dados importados.';
      }
    }

    setImporting(false);
    setProgress({ done: 0, total: 0, stage: '' });
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (saveError) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: saveError });
    } else if (batch.length) {
      toast({
        title: `${batch.length} atividade(s) processada(s)`,
        description: skipped ? `${skipped} arquivo(s) ignorado(s) (formato não reconhecido).` : "Recordes e totais atualizados."
      });
    } else {
      toast({ variant: "destructive", title: "Nada importado", description: "Nenhum .fit válido foi encontrado." });
    }
  };

  const handleRemoveFromRecent = (id: string) => {
    if (!context?.activeProfile) return;
    context.saveProfile({ importedActivities: recentActivities.filter(a => a.id !== id) });
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
            Envie um <span className="text-foreground font-medium">.zip</span> exportado do COROS (com todos os seus treinos) ou arquivos{" "}
            <span className="text-foreground font-medium">.fit</span> individuais — o mesmo lugar serve para a importação inicial em lote e para
            treinos novos, um por um, depois.
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
              accept=".fit,.zip"
              multiple
              className="hidden"
              onChange={handleFilesSelected}
              disabled={importing}
            />
            {importing ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="size-6 text-primary animate-spin" />
                <p className="text-[13px] font-semibold text-primary">
                  {progress.stage}{progress.total ? ` (${progress.done}/${progress.total})` : '…'}
                </p>
                {progress.total > 0 && (
                  <Progress value={(progress.done / progress.total) * 100} className="h-1.5 w-full max-w-xs rounded-full overflow-hidden" />
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary w-fit"><Upload size={20} /></div>
                <p className="text-[13px] font-semibold">Selecionar .zip ou .fit</p>
                <p className="text-[11px] text-muted-foreground">Pode selecionar vários de uma vez, incluindo um export completo</p>
              </div>
            )}
          </div>

          {!!recentActivities.length && (
            <div className="mt-5 flex flex-col gap-2.5">
              <p className="eyebrow">Atividades recentes (mostrando as últimas {recentActivities.length})</p>
              <div className="max-h-[420px] overflow-y-auto custom-scrollbar flex flex-col gap-2.5 pr-1">
                {recentActivities.map((a) => (
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
                      {a.startTime ? new Date(a.startTime).toLocaleDateString('pt-BR') : '—'}
                    </span>
                    <button
                      onClick={() => handleRemoveFromRecent(a.id)}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      aria-label="Remover da lista"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Esta lista mostra só as atividades mais recentes. Recordes pessoais e totais já contabilizados não somem ao remover um item daqui.
              </p>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
