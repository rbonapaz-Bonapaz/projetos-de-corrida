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
import { mergePersonalRecords, addActivityStats, trimRecentActivities, fitSummaryToEntry, fitSummaryToImportedActivity, isDuplicateActivity, dedupeActivities } from "@/lib/records";
import { syncCorosActivities } from "@/lib/coros-sync";
import { isStravaConfigured, stravaAuthorizeUrl, exchangeStravaCode, syncStravaActivities } from "@/lib/strava-sync";
import type { ImportedActivity } from "@/lib/types";
import { ActivityDetailDialog } from "@/components/shared/activity-detail-dialog";
import { StravaLogo, CorosLogo } from "@/components/shared/brand-logos";
import { CheckCircle2, Link2, Upload, Loader2, Trash2, Activity as ActivityIcon, RefreshCw, Eye, EyeOff, ShieldAlert } from "lucide-react";

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

  const [corosEmail, setCorosEmail] = React.useState('');
  const [corosPassword, setCorosPassword] = React.useState('');
  const [showCorosPassword, setShowCorosPassword] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const lastSync = context?.activeProfile?.integrations?.coros?.lastSync;
  const [selectedActivity, setSelectedActivity] = React.useState<ImportedActivity | null>(null);
  const [syncingStrava, setSyncingStrava] = React.useState(false);
  const [connectingStrava, setConnectingStrava] = React.useState(false);
  const stravaLastSync = context?.activeProfile?.integrations?.strava?.lastSync;

  const handleToggle = (service: 'coros') => {
    const isConnected = service === 'coros' ? corosConnected : false;
    context?.toggleIntegration(service, !isConnected);
  };

  const handleConnectStrava = () => {
    window.location.href = stravaAuthorizeUrl(`${window.location.origin}/integrations`);
  };

  // Captura o ?code= que o Strava devolve depois do usuário autorizar.
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code || !context?.activeProfile) return;

    // Limpa a URL na hora, pra não reprocessar o mesmo code se o usuário recarregar a página.
    window.history.replaceState({}, '', window.location.pathname);

    setConnectingStrava(true);
    exchangeStravaCode(code)
      .then((res) => {
        context.saveProfile({
          integrations: {
            coros: context.activeProfile!.integrations?.coros as any,
            strava: {
              connected: true,
              autoSync: true,
              accessToken: res.accessToken,
              refreshToken: res.refreshToken,
              username: res.athleteName,
            } as any,
          },
        });
        toast({ title: "Strava conectado", description: res.athleteName ? `Conta: ${res.athleteName}` : "Pode sincronizar suas atividades agora." });
      })
      .catch((err: any) => {
        toast({ variant: "destructive", title: "Erro ao conectar o Strava", description: err?.message });
      })
      .finally(() => setConnectingStrava(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context?.activeProfile?.id]);

  const handleStravaSync = async () => {
    if (!context?.activeProfile) return;
    setSyncingStrava(true);
    try {
      const result = await syncStravaActivities(context.activeProfile);
      context.saveProfile(result.update as any);
      const parts = [`${result.imported} nova(s) atividade(s) importada(s)`];
      if (result.skippedDuplicateContent) parts.push(`${result.skippedDuplicateContent} já existia(m)`);
      toast({ title: "Sincronização Strava concluída", description: parts.join(' · ') });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro ao sincronizar Strava", description: err?.message });
    } finally {
      setSyncingStrava(false);
    }
  };

  const handleAutoSync = async () => {
    if (!context?.activeProfile) return;
    if (!corosEmail.trim() || !corosPassword.trim()) {
      toast({ variant: "destructive", title: "Preencha email e senha da COROS" });
      return;
    }
    setSyncing(true);
    try {
      const result = await syncCorosActivities(context.activeProfile, corosEmail.trim(), corosPassword);
      context.saveProfile(result.update as any);
      const parts = [`${result.imported} nova(s) atividade(s) importada(s)`];
      if (result.skippedAlreadyKnown) parts.push(`${result.skippedAlreadyKnown} já sincronizada(s) antes`);
      if (result.skippedDuplicateContent) parts.push(`${result.skippedDuplicateContent} já importada(s) manualmente antes`);
      if (result.skippedUnparseable) parts.push(`${result.skippedUnparseable} não reconhecida(s)`);
      toast({ title: "Sincronização concluída", description: parts.join(' · ') });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro ao sincronizar", description: err?.message || "Não foi possível conectar à COROS." });
    } finally {
      setCorosPassword(''); // nunca fica guardada além do necessário pra essa chamada
      setSyncing(false);
    }
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

    // Evita duplicar totais/recordes se o mesmo export (ou um export mais
    // recente que inclui arquivos já importados antes) for enviado de novo.
    const alreadyImported = new Set(context.activeProfile.importedFileNames || []);
    const newRawFiles = rawFiles.filter((f) => !alreadyImported.has(f.name));
    const duplicates = rawFiles.length - newRawFiles.length;

    setProgress({ done: 0, total: newRawFiles.length, stage: 'Processando' });

    const existingActivities = context.activeProfile.importedActivities || [];
    const batch: ImportedActivity[] = [];
    let skipped = 0;
    let skippedDuplicateContent = 0;

    for (let i = 0; i < newRawFiles.length; i++) {
      const { name, buffer } = newRawFiles[i];
      try {
        const summary = await parseFitFile(buffer);
        // Mesmo horário de início já importado antes (ex: via sincronização
        // automática, que usa um nome de arquivo diferente) — evita duplicar.
        if (isDuplicateActivity([...existingActivities, ...batch], summary.startTime)) {
          skippedDuplicateContent++;
          continue;
        }
        batch.push(fitSummaryToImportedActivity(summary, { fileName: name, source: 'coros' }));
      } catch {
        skipped++;
      }

      if (i % 15 === 0 || i === newRawFiles.length - 1) {
        setProgress({ done: i + 1, total: newRawFiles.length, stage: 'Processando' });
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
        const updatedFileNames = [...(profile.importedFileNames || []), ...batch.map(a => a.fileName)];

        const update = {
          personalRecords: updatedRecords,
          activityStats: updatedStats,
          importedActivities: updatedRecent,
          importedFileNames: updatedFileNames,
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

    const notes: string[] = [];
    if (duplicates) notes.push(`${duplicates} já importado(s) antes (ignorado(s) para não duplicar).`);
    if (skippedDuplicateContent) notes.push(`${skippedDuplicateContent} já existia(m) com outro nome de arquivo (ignorado(s)).`);
    if (skipped) notes.push(`${skipped} arquivo(s) ignorado(s) (formato não reconhecido).`);

    if (saveError) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: saveError });
    } else if (batch.length) {
      toast({
        title: `${batch.length} atividade(s) nova(s) processada(s)`,
        description: notes.length ? notes.join(' ') : "Recordes e totais atualizados."
      });
    } else if (duplicates) {
      toast({ title: "Nada novo para importar", description: `Todo(s) os ${duplicates} arquivo(s) já tinham sido importados antes.` });
    } else {
      toast({ variant: "destructive", title: "Nada importado", description: "Nenhum .fit válido foi encontrado." });
    }
  };

  const handleRemoveFromRecent = (id: string) => {
    if (!context?.activeProfile) return;
    context.saveProfile({ importedActivities: recentActivities.filter(a => a.id !== id) });
  };

  const handleWipeImportedData = () => {
    if (!context?.activeProfile) return;
    const confirmed = window.confirm(
      "Apagar todo o histórico importado (recordes, totais e atividades recentes)? Isso não afeta seu plano de treino nem seus dados de perfil — só o que foi importado do COROS/Strava. Você pode reimportar o export depois."
    );
    if (!confirmed) return;
    context.saveProfile({
      personalRecords: [],
      activityStats: { totalKm: 0, totalDurationSec: 0, totalCalories: 0, activityCount: 0 },
      importedActivities: [],
      importedFileNames: [],
    });
    toast({ title: "Histórico importado apagado", description: "Pode importar o export do COROS novamente quando quiser." });
  };

  const handleDedupeActivities = () => {
    if (!context?.activeProfile) return;
    const current = context.activeProfile.importedActivities || [];
    const deduped = dedupeActivities(current);
    const removed = current.length - deduped.length;
    if (!removed) {
      toast({ title: "Nenhuma duplicata encontrada" });
      return;
    }
    const confirmed = window.confirm(
      `${removed} atividade(s) duplicada(s) encontrada(s) (mesmo horário de início, importadas por caminhos diferentes). Remover? Os totais acumulados (km, horas, calorias) serão recalculados a partir do que sobrar na lista recente — se alguma duplicata já tinha saído dessa lista, o total pode ficar levemente menor que o real.`
    );
    if (!confirmed) return;
    context.saveProfile({
      importedActivities: deduped,
      activityStats: addActivityStats(undefined, deduped),
    });
    toast({ title: "Duplicatas removidas", description: `${removed} atividade(s) removida(s). Totais recalculados.` });
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
            Escolha o(s) relógio(s)/app(s) que você usa — dá pra conectar os dois ao mesmo tempo, sem duplicar atividades. Toque no ícone de{" "}
            <RefreshCw size={11} className="inline -mt-0.5" /> para sincronizar a qualquer momento.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strava */}
            <div className="rounded-2xl border border-border p-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (!stravaConnected && isStravaConfigured()) handleConnectStrava();
                  }}
                  disabled={connectingStrava || (!isStravaConfigured() && !stravaConnected)}
                  title={!isStravaConfigured() ? "Integração com Strava ainda não configurada neste app" : undefined}
                  className={cn(
                    "size-12 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                    stravaConnected ? "bg-[#FC6100] text-white" : "bg-[#FC6100]/10 text-[#FC6100]"
                  )}
                >
                  {connectingStrava ? <Loader2 className="size-5 animate-spin" /> : <StravaLogo />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[14px] flex items-center gap-1.5">
                    Strava
                    {stravaConnected && <CheckCircle2 size={13} className="text-[#FC6100]" />}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {connectingStrava ? "Conectando…" : stravaConnected ? "Conectado via OAuth" : "Login oficial (OAuth)"}
                  </p>
                </div>
                {stravaConnected && (
                  <button
                    type="button"
                    onClick={handleStravaSync}
                    disabled={syncingStrava}
                    title="Sincronizar Strava agora"
                    aria-label="Sincronizar Strava agora"
                    className="size-9 rounded-lg bg-secondary/60 hover:bg-[#FC6100]/15 hover:text-[#FC6100] flex items-center justify-center shrink-0 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={15} className={cn(syncingStrava && "animate-spin")} />
                  </button>
                )}
              </div>

              {!stravaConnected ? (
                isStravaConfigured() && (
                  <Button onClick={handleConnectStrava} disabled={connectingStrava} className="mt-3.5 w-full rounded-xl bg-[#FC6100] hover:bg-[#FC6100]/90">
                    Conectar com Strava
                  </Button>
                )
              ) : (
                <p className="mt-3.5 text-[11px] text-muted-foreground">
                  {syncingStrava
                    ? "Sincronizando…"
                    : stravaLastSync
                      ? `Última sincronização: ${new Date(stravaLastSync).toLocaleString('pt-BR')}`
                      : "Ainda não sincronizado — toque no ícone de atualizar."}
                </p>
              )}
            </div>

            {/* COROS */}
            <div className="rounded-2xl border border-border p-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggle('coros')}
                  className={cn(
                    "size-12 rounded-xl flex items-center justify-center shrink-0 transition-all",
                    corosConnected ? "bg-foreground text-background" : "bg-secondary/60 text-foreground"
                  )}
                >
                  <CorosLogo />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[14px] flex items-center gap-1.5">
                    Coros
                    {corosConnected && <CheckCircle2 size={13} />}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {corosConnected ? "Sincronização ativada" : "Toque para ativar"}
                  </p>
                </div>
                {corosConnected && (
                  <button
                    type="button"
                    onClick={handleAutoSync}
                    disabled={syncing || !corosEmail.trim() || !corosPassword.trim()}
                    title="Sincronizar COROS agora"
                    aria-label="Sincronizar COROS agora"
                    className="size-9 rounded-lg bg-secondary/60 hover:bg-primary/15 hover:text-primary flex items-center justify-center shrink-0 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={15} className={cn(syncing && "animate-spin")} />
                  </button>
                )}
              </div>

              {corosConnected && (
                <div className="mt-3.5 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="email"
                      value={corosEmail}
                      onChange={(e) => setCorosEmail(e.target.value)}
                      placeholder="Email da conta COROS"
                      disabled={syncing}
                      className="h-10 rounded-lg border border-border bg-secondary/30 px-3 text-[13px] outline-none focus:border-primary/50"
                    />
                    <div className="relative">
                      <input
                        type={showCorosPassword ? "text" : "password"}
                        value={corosPassword}
                        onChange={(e) => setCorosPassword(e.target.value)}
                        placeholder="Senha"
                        disabled={syncing}
                        className="h-10 w-full rounded-lg border border-border bg-secondary/30 px-3 pr-9 text-[13px] outline-none focus:border-primary/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCorosPassword((v) => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showCorosPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showCorosPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground flex items-start gap-1.5 leading-relaxed">
                    <ShieldAlert size={12} className="text-amber-500 shrink-0 mt-0.5" />
                    API não-oficial: sua senha é usada uma vez pra logar na COROS e nunca é guardada.
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {syncing
                      ? "Sincronizando…"
                      : lastSync
                        ? `Última sincronização: ${new Date(lastSync).toLocaleString('pt-BR')}`
                        : "Ainda não sincronizado — preencha email/senha e toque no ícone de atualizar."}
                  </p>
                </div>
              )}
            </div>
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
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="eyebrow">Atividades recentes (mostrando as últimas {recentActivities.length})</p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleDedupeActivities}
                    className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1"
                  >
                    <RefreshCw size={12} /> Remover duplicatas
                  </button>
                  <button
                    type="button"
                    onClick={handleWipeImportedData}
                    className="text-[11px] text-muted-foreground hover:text-destructive flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Apagar histórico importado
                  </button>
                </div>
              </div>
              <div className="max-h-[420px] overflow-y-auto custom-scrollbar flex flex-col gap-2.5 pr-1">
                {recentActivities.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => setSelectedActivity(a)}
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-secondary/30 cursor-pointer transition-colors hover:border-primary/40"
                  >
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
                      onClick={(e) => { e.stopPropagation(); handleRemoveFromRecent(a.id); }}
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

      <ActivityDetailDialog activity={selectedActivity} onOpenChange={(open) => !open && setSelectedActivity(null)} />
    </DashboardLayout>
  );
}
