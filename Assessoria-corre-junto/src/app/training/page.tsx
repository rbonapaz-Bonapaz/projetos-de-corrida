"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { analyzeWorkoutAction } from "@/ai/actions";
import { TrainingContext } from "@/contexts/TrainingContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CalendarDays,
  ChevronRight,
  CheckCircle2,
  Upload,
  BrainCircuit,
  MessageSquare,
  Route,
  X,
  FileDigit,
  Activity,
  ArrowRight,
  RefreshCcw,
  Target,
  TrendingUp,
  Calendar as CalendarIcon,
  CalendarPlus,
  Download,
  Info,
} from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn, fileToDataURI } from '@/lib/utils';
import { parseFitFile, fitSummaryToText, type FitSummary } from '@/lib/fit-parser';
import type { Workout, ImportedActivity } from "@/lib/types";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { generateGoogleCalendarUrl, calculateWorkoutDate, downloadPlanAsICS, normalizeDayName } from "@/lib/calendar-utils";
import { MonthCalendar } from "@/components/training/month-calendar";
import { ActivityDetailDialog } from "@/components/shared/activity-detail-dialog";
import { requestGoogleAccessToken, syncPlanToGoogleCalendar, checkGoogleCalendarChanges, isGoogleCalendarConfigured } from "@/lib/google-calendar-sync";
import { StravaLogo, CorosLogo } from "@/components/shared/brand-logos";

const dayOrder = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default function TrainingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const context = React.useContext(TrainingContext);

  const profile = context?.activeProfile;
  const plan = context?.trainingPlan;
  // Mostra só a plataforma que o atleta realmente usa — se as duas estiverem
  // conectadas, COROS tem prioridade visual aqui (era a integração original).
  const corosConnected = !!profile?.integrations?.coros?.connected;
  const stravaConnected = !corosConnected && !!profile?.integrations?.strava?.connected;

  const [localLoading, setLocalLoading] = React.useState(false);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [selectedWorkout, setSelectedWorkout] = React.useState<Workout | null>(null);
  const [selectedWorkoutWeek, setSelectedWorkoutWeek] = React.useState<number>(1);
  const [selectedActivity, setSelectedActivity] = React.useState<ImportedActivity | null>(null);
  const [syncingGoogle, setSyncingGoogle] = React.useState(false);
  const [checkingGoogle, setCheckingGoogle] = React.useState(false);
  const [athleteFeedback, setAthleteFeedback] = React.useState("");
  const [uploadedFileUri, setUploadedFileUri] = React.useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = React.useState<string | null>(null);
  const [deviceData, setDeviceData] = React.useState<string | null>(null);
  const [fitSummary, setFitSummary] = React.useState<FitSummary | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (selectedWorkout && plan) {
      for (const week of plan.weeklyPlans) {
        const found = week.runs.find(r => r.id === selectedWorkout.id);
        if (found) {
          setSelectedWorkout(found);
          setSelectedWorkoutWeek(week.weekNumber);
          break;
        }
      }
    }
  }, [plan, selectedWorkout?.id]);

  const handleGenerate = async () => {
    if (!profile) {
      toast({ variant: "destructive", title: "Perfil incompleto", description: "Configure seus dados no perfil primeiro." });
      return;
    }
    setLocalLoading(true);
    try {
      await context?.generateRunningPlanAsync(profile);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = file.name.toLowerCase();
    setUploadedFileName(file.name);
    try {
      if (name.endsWith('.fit')) {
        const buffer = await file.arrayBuffer();
        const summary = await parseFitFile(buffer);
        setFitSummary(summary);
        setDeviceData(fitSummaryToText(summary));
        setUploadedFileUri(null);
        toast({ title: "COROS sincronizado", description: "Métricas reais extraídas do arquivo .FIT." });
      } else if (name.endsWith('.csv') || name.endsWith('.txt')) {
        const text = await file.text();
        setDeviceData(`Conteúdo do arquivo ${file.name}:\n${text.slice(0, 4000)}`);
        setFitSummary(null);
        setUploadedFileUri(null);
        toast({ title: "Arquivo preparado", description: "Dados prontos para análise." });
      } else {
        const uri = await fileToDataURI(file);
        setUploadedFileUri(uri);
        setDeviceData(null);
        setFitSummary(null);
        toast({ title: "Imagem preparada", description: "Pronta para leitura visual." });
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Erro no upload", description: err?.message || "Não foi possível ler o arquivo." });
      setUploadedFileName(null);
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedFileUri(null);
    setUploadedFileName(null);
    setDeviceData(null);
    setFitSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFinalizeAnalysis = async () => {
    if (!selectedWorkout || !profile) return;

    setAnalyzing(true);
    toast({ title: "Analisando sensores…", description: "Extraindo métricas de performance via Server Action." });

    try {
      const anamnesisContext = context?.getAnamnesisSummary() || "Sem contexto.";

      const result = await analyzeWorkoutAction({
        prescribedWorkout: JSON.stringify(selectedWorkout),
        athleteFeedback,
        athleteProfile: JSON.stringify(profile),
        anamnesis: anamnesisContext,
        deviceData: deviceData || undefined,
        fileDataUri: uploadedFileUri || undefined
      });

      const updatedWorkout = {
        ...selectedWorkout,
        completed: true,
        analysis: result
      };

      context?.updateWorkout(selectedWorkout.id, updatedWorkout);
      setUploadedFileUri(null);
      setUploadedFileName(null);
      setDeviceData(null);
      setFitSummary(null);
      setAthleteFeedback("");
      toast({ title: "Sessão sincronizada", description: "Dados registrados na nuvem com sucesso." });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: "Erro na análise" });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReschedule = (newDay: string) => {
    if (!selectedWorkout) return;
    const updatedWorkout = { ...selectedWorkout, day: newDay };
    context?.updateWorkout(selectedWorkout.id, updatedWorkout);
    toast({ title: "Treino reagendado", description: `Sessão movida para ${newDay}.` });
  };

  const handleCopySummary = () => {
    if (!selectedWorkout) return;
    const details = selectedWorkout.technicalDetails?.map(d => `• ${d.label}: ${d.value}`).join('\n') || '';
    const text = `${selectedWorkout.day} - ${selectedWorkout.type}: ${selectedWorkout.distance}\n\n${selectedWorkout.description}\n\n${details}\n\nGerado via CorreJunto.`;
    navigator.clipboard.writeText(text);
    toast({ title: "Resumo copiado", description: "Texto pronto para compartilhar." });
  };

  const calculateWeekVolume = (runs: Workout[]) => {
    return runs.reduce((acc, run) => {
      const d = parseFloat(run.distance.replace('KM', '').replace('km', '').replace(',', '.'));
      return acc + (isNaN(d) ? 0 : d);
    }, 0).toFixed(1);
  };

  // Só ancora no dia da prova pra um ciclo completo — num bloco curto (padrão),
  // a prova pode estar meses no futuro e isso empurrava o bloco inteiro pra lá
  // em vez de começar a partir de hoje.
  const anchorToRaceDate = profile?.planGenerationType === 'full';

  const handleExportICS = () => {
    if (!plan) return;
    downloadPlanAsICS(plan, profile?.raceDate, anchorToRaceDate);
    toast({ title: "Calendário gerado", description: "Abra o arquivo .ics para importar todos os treinos." });
  };

  const handleSingleExport = () => {
    if (!selectedWorkout || !plan) return;
    const date = calculateWorkoutDate(selectedWorkoutWeek, selectedWorkout.day, profile?.raceDate, plan.durationWeeks, anchorToRaceDate);
    const url = generateGoogleCalendarUrl(selectedWorkout, date);
    window.open(url, '_blank');
  };

  const handleGoogleCalendarSync = async () => {
    if (!plan || !profile || !context) return;
    setSyncingGoogle(true);
    try {
      const accessToken = await requestGoogleAccessToken();
      const result = await syncPlanToGoogleCalendar(accessToken, plan, profile);
      context.saveProfile({
        googleCalendarIds: { corrida: result.corridaCalendarId, forca: result.forcaCalendarId },
      });
      toast({
        title: "Sincronizado com a Google Agenda",
        description: `${result.runsSynced} treino(s) de corrida e ${result.strengthSynced} de força enviados, em calendários próprios ("CorreJunto — Corrida" / "CorreJunto — Força").`,
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro ao sincronizar com a Google Agenda", description: err?.message });
    } finally {
      setSyncingGoogle(false);
    }
  };

  const handleCheckGoogleCalendarChanges = async () => {
    if (!plan || !profile || !context) return;
    setCheckingGoogle(true);
    try {
      const accessToken = await requestGoogleAccessToken();
      const changes = await checkGoogleCalendarChanges(accessToken, plan, profile);
      const rescheduled = changes.filter((c) => c.type === 'rescheduled');
      const missing = changes.filter((c) => c.type === 'missing');

      if (!changes.length) {
        toast({ title: "Nenhuma mudança encontrada", description: "A agenda está batendo com o plano." });
        return;
      }

      const lines = [
        ...rescheduled.map((c) => `• Semana ${c.weekNumber}: ${c.originalDay} → ${c.newDay}`),
        ...missing.map((c) => `• Semana ${c.weekNumber}: ${c.originalDay} não está mais na agenda (apagado ou movido pra outra semana — ajuste manual)`),
      ];
      const applyMsg = rescheduled.length
        ? `\n\nAplicar os ${rescheduled.length} reagendamento(s) ao plano?`
        : '\n\nOs itens "não está mais na agenda" precisam de ajuste manual — nada será alterado automaticamente.';

      const confirmed = window.confirm(`Mudanças encontradas na Google Agenda:\n\n${lines.join('\n')}${applyMsg}`);
      if (confirmed && rescheduled.length) {
        rescheduled.forEach((c) => context.updateWorkout(c.runId, { day: c.newDay }));
        toast({ title: "Plano atualizado", description: `${rescheduled.length} treino(s) reagendado(s) conforme a Google Agenda.` });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro ao verificar a Google Agenda", description: err?.message });
    } finally {
      setCheckingGoogle(false);
    }
  };

  return (
    <DashboardLayout>
      <TooltipProvider>
        <div className="flex flex-col gap-6 print:p-0">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
            <div>
              <h1 className="text-2xl md:text-[26px] font-bold tracking-tight flex items-center gap-2.5">
                <Target className="size-6 text-primary" /> Meu plano
              </h1>
              <p className="text-[13px] text-muted-foreground mt-1">Planilha sincronizada na nuvem.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
              {(corosConnected || stravaConnected) && (
                <Link
                  href="/integrations"
                  title={corosConnected ? "Sincronizado via COROS — toque para gerenciar" : "Sincronizado via Strava — toque para gerenciar"}
                  className={cn(
                    "size-10 rounded-xl flex items-center justify-center shrink-0 self-center sm:self-auto",
                    corosConnected ? "bg-foreground text-background" : "bg-[#FC6100]/10 text-[#FC6100]"
                  )}
                >
                  {corosConnected ? <CorosLogo className="size-5" /> : <StravaLogo className="size-5" />}
                </Link>
              )}
              {plan && isGoogleCalendarConfigured() && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={syncingGoogle || checkingGoogle}
                      className="rounded-xl gap-2"
                      title="Sincronização com a Google Agenda"
                    >
                      {syncingGoogle || checkingGoogle ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <CalendarIcon size={14} />
                      )}
                      Google Agenda
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl w-[220px]">
                    <DropdownMenuItem onClick={handleGoogleCalendarSync} disabled={syncingGoogle} className="gap-2.5 cursor-pointer">
                      <CalendarPlus size={15} />
                      {syncingGoogle ? "Sincronizando…" : "Sincronizar plano"}
                    </DropdownMenuItem>
                    {profile?.googleCalendarIds?.corrida && (
                      <DropdownMenuItem onClick={handleCheckGoogleCalendarChanges} disabled={checkingGoogle} className="gap-2.5 cursor-pointer">
                        <RefreshCcw size={15} />
                        {checkingGoogle ? "Verificando…" : "Verificar mudanças"}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {plan && (
                <Button variant="outline" onClick={handleExportICS} className="rounded-xl gap-2">
                  <Download size={14} /> Exportar .ics
                </Button>
              )}
              <Button onClick={handleGenerate} disabled={localLoading || !profile} className="rounded-xl gap-2 md:min-w-[180px]">
                {localLoading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}
                {plan ? "Recalibrar" : "Gerar ciclo"}
              </Button>
            </div>
          </header>

          {!plan && (
            <div className="card-plain text-center py-16 px-6 print:hidden">
              <div className="flex flex-col items-center gap-5">
                <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <CalendarDays className="size-8 text-primary" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-lg font-bold">Nenhum plano ainda</h2>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                    Inicie sua periodização para ver seus treinos aqui.
                  </p>
                </div>
                <Button asChild className="rounded-xl h-11 px-6">
                  <Link href="/profile" className="flex items-center gap-2">
                    Iniciar periodização <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {plan && (
            <Tabs defaultValue="lista" className="w-full">
              <TabsList className="grid w-full max-w-[280px] grid-cols-2 h-10 rounded-xl print:hidden">
                <TabsTrigger value="lista" className="text-xs font-semibold rounded-lg">Lista</TabsTrigger>
                <TabsTrigger value="calendario" className="text-xs font-semibold rounded-lg">Calendário</TabsTrigger>
              </TabsList>

              <TabsContent value="calendario" className="pt-5">
                <MonthCalendar
                  plan={plan}
                  raceDate={profile?.raceDate}
                  anchorToRaceDate={anchorToRaceDate}
                  realActivities={profile?.importedActivities}
                  onSelectWorkout={(workout, weekNumber) => {
                    setSelectedWorkout(workout);
                    setSelectedWorkoutWeek(weekNumber);
                  }}
                  onSelectActivity={setSelectedActivity}
                />
              </TabsContent>

              <TabsContent value="lista" className="pt-5">
                <div className="flex flex-col gap-10">
                  {plan.weeklyPlans.map((week, weekIdx) => (
                    <div key={weekIdx} className="flex flex-col gap-4">
                      <div className="flex items-end justify-between border-b border-border pb-3">
                        <div>
                          <h2 className="text-lg font-bold text-primary tracking-tight">
                            Semana {String(week.weekNumber).padStart(2, '0')}
                          </h2>
                          <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mt-0.5">
                            {week.focus}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Volume</p>
                          <span className="num text-sm font-bold text-primary">{calculateWeekVolume(week.runs)} km</span>
                        </div>
                      </div>

                      <div className="bento">
                        {week.runs
                          .filter(w => !w.type.includes("DESCANSO"))
                          .sort((a, b) => dayOrder.indexOf(normalizeDayName(a.day)) - dayOrder.indexOf(normalizeDayName(b.day)))
                          .map((w: Workout) => (
                            <div
                              key={w.id}
                              className={cn(
                                "card-plain span-4 cursor-pointer transition-all relative flex flex-col gap-3 hover:border-primary/40",
                                w.completed && "opacity-60"
                              )}
                              onClick={() => setSelectedWorkout(w)}
                            >
                              {w.completed && (
                                <div className="absolute top-4 right-4 p-0.5 bg-primary rounded-full">
                                  <CheckCircle2 className="size-3.5 text-primary-foreground" />
                                </div>
                              )}
                              <div>
                                <p className="eyebrow text-primary">{w.day}</p>
                                <h3 className="font-bold text-lg tracking-tight mt-0.5">{w.type}</h3>
                              </div>
                              <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2">{w.description}</p>
                              <div className="flex flex-wrap gap-1.5 mt-auto">
                                <span className="tag acc num">{w.distance}</span>
                                <span className="tag num">{w.paceZone}</span>
                              </div>
                              <div className="flex justify-between items-center pt-3 border-t border-border">
                                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Detalhes</span>
                                <ChevronRight className="size-4 text-primary" />
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}

          <Dialog open={!!selectedWorkout} onOpenChange={(open) => !open && setSelectedWorkout(null)}>
            <DialogContent className="max-w-4xl w-full max-h-[100svh] sm:max-h-[90vh] overflow-y-auto custom-scrollbar rounded-none sm:rounded-[1.5rem] p-0 overflow-hidden">
              <DialogTitle className="sr-only">Detalhes do Treino</DialogTitle>
              {selectedWorkout && (
                <div className="flex flex-col h-full">
                  <div className="p-5 md:p-8 space-y-4 bg-secondary/30 border-b border-border shrink-0">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="eyebrow text-primary">{selectedWorkout.day}</p>
                          <Badge variant="outline" className="text-[9px] uppercase h-5 rounded-md">{plan?.blockType}</Badge>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">{selectedWorkout.type}</h2>
                      </div>
                      <div className="flex flex-col items-start md:items-end gap-3 w-full md:w-auto">
                        <div className="flex flex-wrap gap-2 w-full">
                          <Button onClick={handleSingleExport} variant="outline" size="sm" className="flex-1 md:flex-none rounded-lg gap-1.5">
                            <CalendarPlus size={14} /> Agenda
                          </Button>
                          <Button onClick={handleCopySummary} variant="outline" size="sm" className="flex-1 md:flex-none rounded-lg">
                            Copiar
                          </Button>
                        </div>

                        {!selectedWorkout.completed && (
                          <div className="flex flex-col items-start md:items-end gap-1 w-full">
                            <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-widest">Reagendar</span>
                            <Select onValueChange={handleReschedule} value={selectedWorkout.day}>
                              <SelectTrigger className="w-full md:w-48 rounded-lg h-9 text-xs">
                                <div className="flex items-center gap-2"><CalendarIcon size={12} /><SelectValue /></div>
                              </SelectTrigger>
                              <SelectContent>
                                {dayOrder.map(day => (
                                  <SelectItem key={day} value={day} className="text-xs">{day}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 md:p-8 space-y-6 overflow-y-auto">
                    <Tabs defaultValue={selectedWorkout.completed ? "analise" : "prescrito"} className="w-full">
                      <TabsList className="grid w-full grid-cols-2 h-10 rounded-xl">
                        <TabsTrigger value="prescrito" className="text-xs font-semibold rounded-lg">Detalhes</TabsTrigger>
                        <TabsTrigger value="analise" className="text-xs font-semibold rounded-lg">
                          {selectedWorkout.completed ? 'Análise' : 'Registrar'}
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="prescrito" className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                          <div className="space-y-6">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5 text-primary">
                                <Info size={13} />
                                <h4 className="eyebrow !text-primary">Resumo técnico</h4>
                              </div>
                              <p className="text-sm leading-relaxed">{selectedWorkout.description}</p>
                            </div>

                            {!!selectedWorkout.technicalDetails?.length && (
                              <div className="space-y-2">
                                <h4 className="eyebrow">Métricas alvo</h4>
                                <div className="grid gap-2">
                                  {selectedWorkout.technicalDetails.map((detail, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-secondary/40 border border-border">
                                      <span className="text-[11px] text-muted-foreground font-medium">{detail.label}</span>
                                      <p className="text-[13px] font-semibold num">{detail.value}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-2.5">
                              <div className="metric-tile">
                                <small className="flex items-center justify-center gap-1"><Route size={10} /> Distância</small>
                                <b>{selectedWorkout.distance}</b>
                              </div>
                              <div className="metric-tile">
                                <small className="flex items-center justify-center gap-1"><Target size={10} /> Zona pace</small>
                                <b>{selectedWorkout.paceZone}</b>
                              </div>
                            </div>

                            {selectedWorkout.phases && selectedWorkout.phases.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-1.5">
                                  <TrendingUp size={13} className="text-primary" />
                                  <h4 className="eyebrow">Estrutura</h4>
                                </div>
                                <div className="flex flex-col gap-2">
                                  {selectedWorkout.phases.map((phase, idx) => (
                                    <div key={idx} className="phase-row items-start">
                                      <span className="n">{idx + 1}</span>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex justify-between items-center gap-2">
                                          <span className="text-[13px] font-semibold truncate">{phase.name}</span>
                                          <span className="tag acc num shrink-0">{phase.distance}</span>
                                        </div>
                                        <p className="text-[12px] text-muted-foreground mt-0.5">{phase.description}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="analise" className="pt-6">
                        {selectedWorkout.completed && selectedWorkout.analysis ? (
                          <div className="flex flex-col gap-6">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                              <div className="metric-tile">
                                <small>Ritmo</small>
                                <b>{selectedWorkout.analysis.actualMetrics?.averagePace || '—'}</b>
                              </div>
                              <div className="metric-tile">
                                <small>Cadência</small>
                                <b>{selectedWorkout.analysis.actualMetrics?.averageCadence || '—'}</b>
                              </div>
                              <div className="metric-tile col-span-2 sm:col-span-1">
                                <small>Razão passada</small>
                                <b>{selectedWorkout.analysis.actualMetrics?.strideRatio ? `${selectedWorkout.analysis.actualMetrics.strideRatio}%` : '—'}</b>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div className="rounded-2xl p-5 space-y-3" style={{ background: "hsl(var(--accent-soft))" }}>
                                <BrainCircuit className="size-5 text-primary" />
                                <h4 className="eyebrow !text-primary">Análise do coach</h4>
                                <p className="text-[13px] leading-relaxed">{selectedWorkout.analysis.analysisSummary.summary}</p>
                              </div>

                              <div className="card-plain space-y-3">
                                <Target className="size-5 text-primary" />
                                <h4 className="eyebrow">Recomendação</h4>
                                <p className="text-[13px] leading-relaxed font-medium">{selectedWorkout.analysis.recommendations}</p>
                              </div>
                            </div>

                            <Button className="w-full rounded-xl h-11 gap-2" onClick={() => router.push('/coach')}>
                              <MessageSquare size={16} /> Chat com coach
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-6">
                            <div className="space-y-2">
                              <label className="eyebrow">Feedback sensorial</label>
                              <Textarea
                                placeholder="Como se sentiu hoje?"
                                className="min-h-[110px] rounded-xl text-sm"
                                value={athleteFeedback}
                                onChange={(e) => setAthleteFeedback(e.target.value)}
                              />
                            </div>

                            <div className="space-y-2.5">
                              <label className="eyebrow">Upload do COROS (.fit) / .csv / print</label>
                              <div
                                className={cn(
                                  "border-2 border-dashed rounded-2xl p-8 text-center space-y-4 cursor-pointer transition-all",
                                  (uploadedFileUri || deviceData) ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/30"
                                )}
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".fit,.csv,.txt,image/*" />
                                {(uploadedFileUri || deviceData) ? (
                                  <div className="space-y-2">
                                    <div className="p-4 rounded-2xl bg-primary text-primary-foreground w-fit mx-auto relative">
                                      <FileDigit size={26} />
                                      <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 size-6 rounded-full" onClick={clearFile}><X size={12} /></Button>
                                    </div>
                                    <p className="text-[12px] font-semibold text-primary truncate max-w-[220px] mx-auto">{uploadedFileName}</p>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    <div className="p-4 rounded-2xl bg-primary/10 text-primary w-fit mx-auto"><Upload size={22} /></div>
                                    <p className="text-[13px] font-semibold">Anexar telemetria</p>
                                  </div>
                                )}
                              </div>

                              {fitSummary && (
                                <div className="rounded-2xl p-4 space-y-2.5" style={{ background: "hsl(var(--accent-soft))" }}>
                                  <div className="flex items-center gap-1.5 text-primary">
                                    <Activity size={12} />
                                    <h5 className="eyebrow !text-primary">Métricas reais detectadas</h5>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2">
                                    {fitSummary.distanceKm != null && <FitStat label="Dist" value={`${fitSummary.distanceKm}km`} />}
                                    {fitSummary.avgPace && <FitStat label="Pace" value={fitSummary.avgPace.replace('/km', '')} />}
                                    {fitSummary.avgSpeedKmh != null && <FitStat label="Veloc" value={`${fitSummary.avgSpeedKmh}km/h`} />}
                                    {fitSummary.durationText && <FitStat label="Tempo" value={fitSummary.durationText} />}
                                    {fitSummary.avgHr != null && <FitStat label="FC méd" value={`${fitSummary.avgHr}`} />}
                                    {fitSummary.avgCadenceSpm != null && <FitStat label={fitSummary.sport === 'cycling' ? 'RPM' : 'Cadência'} value={`${fitSummary.avgCadenceSpm}`} />}
                                    {fitSummary.avgVerticalOscillationCm != null && <FitStat label="Osc.vert" value={`${fitSummary.avgVerticalOscillationCm}cm`} />}
                                    {fitSummary.avgGroundContactTimeMs != null && <FitStat label="GCT" value={`${fitSummary.avgGroundContactTimeMs}ms`} />}
                                    {fitSummary.avgPowerW != null && <FitStat label="Pot" value={`${fitSummary.avgPowerW}w`} />}
                                    {fitSummary.totalAscentM != null && <FitStat label="Elev" value={`${fitSummary.totalAscentM}m`} />}
                                  </div>
                                </div>
                              )}
                            </div>

                            <Button
                              className="w-full rounded-xl h-11"
                              disabled={analyzing || (!athleteFeedback.trim() && !deviceData && !uploadedFileUri)}
                              onClick={handleFinalizeAnalysis}
                            >
                              {analyzing ? <><Loader2 className="mr-2 animate-spin size-4" /> Analisando…</> : 'Finalizar sessão'}
                            </Button>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <ActivityDetailDialog activity={selectedActivity} onOpenChange={(open) => !open && setSelectedActivity(null)} />
        </div>
      </TooltipProvider>
    </DashboardLayout>
  );
}

function FitStat({ label, value }: { label: string, value: string }) {
  return (
    <div className="metric-tile !p-2">
      <small>{label}</small>
      <b className="!text-[13px]">{value}</b>
    </div>
  );
}
