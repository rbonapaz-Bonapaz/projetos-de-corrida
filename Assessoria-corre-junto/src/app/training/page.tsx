"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { analyzeWorkoutAction } from "@/ai/actions";
import { TrainingContext } from "@/contexts/TrainingContext";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
  Copy,
  Info
} from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, fileToDataURI } from '@/lib/utils';
import { parseFitFile, fitSummaryToText, type FitSummary } from '@/lib/fit-parser';
import type { Workout } from "@/lib/types";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { generateGoogleCalendarUrl, calculateWorkoutDate, downloadPlanAsICS } from "@/lib/calendar-utils";

const dayOrder = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default function TrainingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const context = React.useContext(TrainingContext);

  const profile = context?.activeProfile;
  const plan = context?.trainingPlan;

  const [localLoading, setLocalLoading] = React.useState(false);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [selectedWorkout, setSelectedWorkout] = React.useState<Workout | null>(null);
  const [selectedWorkoutWeek, setSelectedWorkoutWeek] = React.useState<number>(1);
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
      toast({ variant: "destructive", title: "Perfil Incompleto", description: "Configure seus dados no perfil primeiro." });
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
        toast({ title: "COROS Sincronizado", description: "Métricas reais extraídas do arquivo .FIT." });
      } else if (name.endsWith('.csv') || name.endsWith('.txt')) {
        const text = await file.text();
        setDeviceData(`Conteúdo do arquivo ${file.name}:\n${text.slice(0, 4000)}`);
        setFitSummary(null);
        setUploadedFileUri(null);
        toast({ title: "Arquivo Preparado", description: "Dados prontos para análise." });
      } else {
        const uri = await fileToDataURI(file);
        setUploadedFileUri(uri);
        setDeviceData(null);
        setFitSummary(null);
        toast({ title: "Imagem Preparada", description: "Pronta para leitura visual." });
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Erro no Upload", description: err?.message || "Não foi possível ler o arquivo." });
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
    toast({ title: "🧠 Analisando Sensores...", description: "Extraindo métricas de performance via Server Action." });

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
      toast({ title: "✅ Sessão Sincronizada", description: "Dados registrados na nuvem com sucesso." });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: "Erro na Análise" });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReschedule = (newDay: string) => {
    if (!selectedWorkout) return;
    const updatedWorkout = { ...selectedWorkout, day: newDay };
    context?.updateWorkout(selectedWorkout.id, updatedWorkout);
    toast({ title: "Treino Reagendado", description: `Sessão movida para ${newDay.toUpperCase()}.` });
  };

  const handleCopySummary = () => {
    if (!selectedWorkout) return;
    const details = selectedWorkout.technicalDetails?.map(d => `• ${d.label}: ${d.value}`).join('\n') || '';
    const text = `${selectedWorkout.day} - ${selectedWorkout.type}: ${selectedWorkout.distance}\n\n${selectedWorkout.description}\n\n${details}\n\nGerado via CorreJunto Lab.`;
    navigator.clipboard.writeText(text);
    toast({ title: "Resumo Copiado!", description: "Texto pronto para compartilhar." });
  };

  const calculateWeekVolume = (runs: Workout[]) => {
    return runs.reduce((acc, run) => {
      const d = parseFloat(run.distance.replace('KM', '').replace('km', '').replace(',', '.'));
      return acc + (isNaN(d) ? 0 : d);
    }, 0).toFixed(1);
  };

  const handleExportICS = () => {
    if (!plan) return;
    downloadPlanAsICS(plan, profile?.raceDate);
    toast({ title: "Calendário Gerado", description: "Abra o arquivo .ics para importar todos os treinos." });
  };

  const handleSingleExport = () => {
    if (!selectedWorkout || !plan) return;
    const date = calculateWorkoutDate(selectedWorkoutWeek, selectedWorkout.day, profile?.raceDate, plan.durationWeeks);
    const url = generateGoogleCalendarUrl(selectedWorkout, date);
    window.open(url, '_blank');
  };

  return (
    <DashboardLayout>
      <TooltipProvider>
        <div className="space-y-8 md:space-y-12 max-w-6xl mx-auto pb-20 print:p-0 animate-in fade-in duration-700">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8 px-2 print:hidden">
            <div className="space-y-1">
              <h1 className="text-3xl md:text-7xl font-headline font-black uppercase italic tracking-tighter leading-none">
                <span className="text-white">MEU</span> <span className="text-primary">PLANO</span>
              </h1>
              <p className="text-[8px] md:text-xs text-muted-foreground font-black uppercase tracking-[0.3em] italic opacity-60">
                PLANILHA SINCRONIZADA CLOUD
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full md:w-auto">
              {plan && (
                 <Button 
                    variant="outline"
                    onClick={handleExportICS}
                    className="h-11 md:h-16 border-white/10 text-white font-black uppercase italic text-[9px] md:text-[11px] px-6 md:px-8 rounded-xl md:rounded-2xl hover:bg-white/5 gap-2"
                  >
                    <Download size={14} className="md:size-4" /> EXPORTAR .ICS
                  </Button>
              )}
              <Button 
                onClick={handleGenerate} 
                disabled={localLoading || !profile}
                className="bg-primary text-black hover:bg-white w-full md:min-w-[240px] h-11 md:h-16 font-black uppercase tracking-widest text-[9px] md:text-[11px] italic rounded-xl md:rounded-2xl shadow-2xl shadow-primary/20 transition-all active:scale-[0.98]"
              >
                {localLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCcw className="mr-2 size-4" />}
                {plan ? "RECALIBRAR" : "GERAR CICLO"}
              </Button>
            </div>
          </header>

          {!plan && (
            <Card className="mx-2 md:mx-4 border-primary/20 bg-primary/5 p-8 md:p-32 text-center rounded-[1.5rem] md:rounded-[3rem] shadow-2xl border-2 border-dashed print:hidden">
              <CardContent className="flex flex-col items-center space-y-6 md:space-y-10">
                  <div className="size-16 md:size-28 rounded-2xl md:rounded-[2rem] bg-primary/10 flex items-center justify-center animate-pulse">
                      <CalendarDays className="size-8 md:size-14 text-primary" />
                  </div>
                  <div className="space-y-2">
                      <h2 className="text-xl md:text-4xl font-black uppercase italic tracking-tighter text-white">Laboratório Vazio</h2>
                      <p className="text-muted-foreground max-w-sm mx-auto font-bold uppercase italic text-[8px] md:text-[11px] tracking-widest opacity-60">
                        Inicie sua periodização para ver seus treinos aqui.
                      </p>
                  </div>
                  <Button asChild size="lg" className="h-12 md:h-20 px-8 md:px-16 font-black uppercase tracking-widest bg-primary text-black rounded-xl md:rounded-[1.5rem] shadow-2xl transition-all active:scale-95 text-[10px] md:text-base">
                      <Link href="/profile">INICIAR PERIODIZAÇÃO <ArrowRight className="ml-2 md:ml-4 size-4 md:size-6" /></Link>
                  </Button>
              </CardContent>
            </Card>
          )}

          {plan && (
            <div className="space-y-12 md:space-y-24 px-2 md:px-4">
              {plan.weeklyPlans.map((week, weekIdx) => (
                <div key={weekIdx} className="space-y-6 md:space-y-10">
                  <div className="flex items-end justify-between border-b-2 border-primary/20 pb-4 relative">
                    <div className="space-y-1">
                      <h2 className="text-xl md:text-4xl font-headline font-black uppercase italic text-primary tracking-tighter leading-none">
                        SEMANA {String(week.weekNumber).padStart(2, '0')}
                      </h2>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 md:gap-4">
                        <p className="text-[7px] md:text-[11px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-muted-foreground/60 italic">{week.focus.toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-[7px] md:text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 italic">VOLUME</p>
                      <Badge className="bg-primary text-black font-black italic uppercase text-[10px] md:text-base px-2 md:px-6 py-0.5 md:py-2 rounded-md md:rounded-xl shadow-xl">
                        {calculateWeekVolume(week.runs)} KM
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                    {week.runs
                      .filter(w => !w.type.includes("DESCANSO"))
                      .sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day))
                      .map((w: Workout) => (
                      <Card 
                        key={w.id} 
                        className={cn(
                            "group cursor-pointer transition-all active:scale-[0.98] relative overflow-hidden rounded-[1.25rem] md:rounded-[2.5rem] border-2 flex flex-col h-full bg-[#0a0c10] shadow-2xl min-h-[200px] md:min-h-[320px]",
                            w.completed ? "opacity-40 border-border grayscale-[0.5]" : "border-white/5 md:hover:-translate-y-2"
                        )}
                        onClick={() => setSelectedWorkout(w)}
                      >
                        {w.completed && (
                            <div className="absolute top-4 right-4 md:top-8 md:right-8 z-10 p-0.5 md:p-1 bg-primary rounded-full">
                                <CheckCircle2 className="size-3 md:size-6 text-black" />
                            </div>
                        )}
                        <CardHeader className="p-5 md:p-10 pb-2 md:pb-6">
                            <p className="text-[8px] md:text-[11px] font-black uppercase text-primary tracking-[0.2em] md:tracking-[0.3em] italic mb-1 md:mb-4">{w.day.toUpperCase()}</p>
                            <CardTitle className="font-headline text-lg md:text-4xl italic uppercase font-black tracking-tighter text-white leading-[0.9]">
                              {w.type}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 md:p-10 pt-0 flex-1 space-y-3 md:space-y-8">
                            <p className="text-[9px] md:text-xs text-muted-foreground italic leading-relaxed font-bold line-clamp-2 md:line-clamp-3">"{w.description}"</p>
                            <div className="flex flex-wrap gap-1.5 md:gap-3">
                                <Badge className="bg-primary text-black font-black italic uppercase text-[7px] md:text-[10px] h-6 md:h-9 px-2 md:px-5 rounded-md md:rounded-xl">{w.distance}</Badge>
                                <Badge variant="outline" className="border-white/10 bg-white/5 font-black italic uppercase text-[7px] md:text-[10px] h-6 md:h-9 px-2 md:px-5 rounded-md md:rounded-xl text-white">{w.paceZone}</Badge>
                            </div>
                        </CardContent>
                        <CardFooter className="p-5 md:p-10 pt-0 border-t border-white/5 mt-auto flex justify-between items-center h-10 md:h-20">
                            <span className="text-[7px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest italic opacity-40">DETALHES</span>
                            <ChevronRight className="size-3 md:size-6 text-primary" />
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <Dialog open={!!selectedWorkout} onOpenChange={(open) => !open && setSelectedWorkout(null)}>
              <DialogContent className="max-w-4xl w-full max-h-[100svh] sm:max-h-[90vh] overflow-y-auto custom-scrollbar border-primary/20 bg-[#06080a] rounded-none sm:rounded-[2rem] md:rounded-[3rem] p-0 overflow-hidden shadow-2xl">
                  <DialogTitle className="sr-only">Detalhes do Treino</DialogTitle>
                  {selectedWorkout && (
                      <div className="flex flex-col h-full">
                          <div className="p-5 md:p-12 space-y-4 md:space-y-6 bg-gradient-to-b from-secondary/40 to-transparent border-b border-white/5 shrink-0">
                              <div className="flex flex-col md:flex-row justify-between items-start gap-4 md:gap-6">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                     <p className="text-[9px] md:text-xs font-black uppercase text-primary tracking-widest italic">{selectedWorkout.day.toUpperCase()}</p>
                                     <Badge variant="outline" className="border-primary/30 text-primary font-black italic text-[7px] md:text-[9px] uppercase h-5">{plan?.blockType}</Badge>
                                  </div>
                                  <h2 className="font-headline text-2xl md:text-7xl font-black uppercase italic tracking-tighter text-white leading-none">
                                    {selectedWorkout.type}
                                  </h2>
                                </div>
                                <div className="flex flex-col items-start md:items-end gap-3 w-full md:w-auto">
                                   <div className="flex flex-wrap gap-2 w-full">
                                      <Button 
                                        onClick={handleSingleExport}
                                        className="flex-1 md:flex-none bg-primary/10 text-primary border border-primary/20 h-9 md:h-12 rounded-lg md:rounded-xl px-3 md:px-6 font-black uppercase text-[8px] md:text-[10px] gap-2"
                                      >
                                        <CalendarPlus size={14} /> AGENDA
                                      </Button>
                                      <Button 
                                        onClick={handleCopySummary}
                                        variant="outline"
                                        className="flex-1 md:flex-none border-white/10 text-white h-9 md:h-12 rounded-lg md:rounded-xl px-3 md:px-6 font-black uppercase text-[8px] md:text-[10px]"
                                      >
                                        COPIAR
                                      </Button>
                                   </div>

                                    {!selectedWorkout.completed && (
                                      <div className="flex flex-col items-start md:items-end gap-1 w-full">
                                        <span className="text-[7px] md:text-[9px] font-black uppercase text-muted-foreground/60 italic tracking-widest">REAGENDAR</span>
                                        <Select onValueChange={handleReschedule} value={selectedWorkout.day}>
                                          <SelectTrigger className="w-full md:w-48 bg-black/60 border-primary/30 rounded-lg md:rounded-2xl h-9 md:h-12 font-black italic uppercase text-[8px] md:text-[11px] tracking-widest">
                                            <div className="flex items-center gap-2"><CalendarIcon size={12}/><SelectValue /></div>
                                          </SelectTrigger>
                                          <SelectContent className="bg-[#0c0e12] border-white/10">
                                            {dayOrder.map(day => (
                                              <SelectItem key={day} value={day} className="font-black italic uppercase text-[9px] md:text-[10px]">{day}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    )}
                                </div>
                              </div>
                          </div>

                          <div className="p-5 md:p-12 pt-4 md:pt-12 space-y-6 md:space-y-12 overflow-y-auto">
                            <Tabs defaultValue={selectedWorkout.completed ? "analise" : "prescrito"} className="w-full">
                                <TabsList className="grid w-full grid-cols-2 bg-black/60 h-11 md:h-20 p-1 md:p-2 rounded-xl md:rounded-[1.5rem] gap-1 md:gap-3">
                                    <TabsTrigger value="prescrito" className="font-black text-[8px] md:text-[12px] uppercase italic data-[state=active]:bg-primary data-[state=active]:text-black rounded-lg md:rounded-xl transition-all">DETALHES</TabsTrigger>
                                    <TabsTrigger value="analise" className="font-black text-[8px] md:text-[12px] uppercase italic data-[state=active]:bg-primary data-[state=active]:text-black rounded-lg md:rounded-xl transition-all">
                                        {selectedWorkout.completed ? 'ANÁLISE' : 'REGISTRAR'}
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="prescrito" className="space-y-6 md:space-y-12 pt-6 md:pt-12">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-start">
                                      <div className="space-y-6 md:space-y-10">
                                         <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-primary">
                                              <Info size={12} />
                                              <h4 className="text-[8px] md:text-[11px] font-black uppercase italic tracking-widest">RESUMO TÉCNICO</h4>
                                            </div>
                                            <p className="text-sm md:text-xl italic font-bold leading-relaxed text-white">"{selectedWorkout.description}"</p>
                                         </div>

                                         <div className="space-y-3">
                                            <h4 className="text-[8px] md:text-[11px] font-black uppercase text-muted-foreground italic tracking-widest">MÉTRICAS ALVO</h4>
                                            <div className="grid gap-2">
                                              {selectedWorkout.technicalDetails?.map((detail, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 md:p-5 rounded-lg md:rounded-2xl bg-white/5 border border-white/5">
                                                    <span className="text-[8px] md:text-[10px] font-black uppercase text-primary/60 italic tracking-widest">{detail.label}</span>
                                                    <p className="text-[10px] md:text-sm font-black italic text-white">{detail.value}</p>
                                                </div>
                                              ))}
                                            </div>
                                         </div>
                                      </div>

                                      <div className="space-y-6 md:space-y-10">
                                        <div className="grid grid-cols-1 gap-3 md:gap-6">
                                          <MetricBoxElite icon={Route} label="DISTÂNCIA" value={selectedWorkout.distance} />
                                          <MetricBoxElite icon={Target} label="ZONA PACE" value={selectedWorkout.paceZone} color="primary" />
                                        </div>

                                        {selectedWorkout.phases && selectedWorkout.phases.length > 0 && (
                                          <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                              <TrendingUp size={14} className="text-primary" />
                                              <h4 className="text-[8px] md:text-[11px] font-black uppercase text-white italic tracking-widest">ESTRUTURA</h4>
                                            </div>
                                            <div className="grid gap-2 md:gap-4">
                                              {selectedWorkout.phases.map((phase, idx) => (
                                                <div key={idx} className="flex gap-3 md:gap-6 p-3 md:p-6 rounded-lg md:rounded-2xl bg-secondary/20 border border-white/5">
                                                  <div className="size-8 md:size-12 rounded-md md:rounded-xl bg-[#0c0e12] border border-white/10 flex items-center justify-center shrink-0 text-primary font-black italic text-sm md:text-lg">
                                                    {idx + 1}
                                                  </div>
                                                  <div className="space-y-0.5 flex-1 min-w-0">
                                                    <div className="flex justify-between items-center">
                                                      <span className="text-[10px] md:text-sm font-black uppercase italic text-white truncate">{phase.name}</span>
                                                      <Badge className="bg-primary/20 text-primary border-none font-black italic text-[7px] md:text-[9px] h-4 px-1.5 shrink-0">{phase.distance}</Badge>
                                                    </div>
                                                    <p className="text-[9px] md:text-xs text-muted-foreground leading-tight italic font-medium opacity-80 truncate md:whitespace-normal">{phase.description}</p>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="analise" className="pt-6 md:pt-12 space-y-6 md:space-y-12">
                                    {selectedWorkout.completed && selectedWorkout.analysis ? (
                                        <div className="space-y-6 md:space-y-12 pb-6">
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-6">
                                                <MetricBoxDetail label="Ritmo" value={selectedWorkout.analysis.actualMetrics?.averagePace || '--'} unit="min/km" highlight="primary" />
                                                <MetricBoxDetail label="Cadência" value={selectedWorkout.analysis.actualMetrics?.averageCadence || '--'} unit="ppm" />
                                                <div className="col-span-2 sm:col-span-1">
                                                  <MetricBoxDetail label="Razão Passada" value={selectedWorkout.analysis.actualMetrics?.strideRatio ? `${selectedWorkout.analysis.actualMetrics.strideRatio}%` : '--'} />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
                                                <div className="p-5 md:p-10 rounded-xl md:rounded-[2.5rem] bg-primary/5 border border-primary/20 space-y-4 shadow-2xl">
                                                    <BrainCircuit className="size-5 md:size-8 text-primary" />
                                                    <h4 className="text-[10px] md:text-base font-black uppercase italic tracking-widest text-primary">ANÁLISE DO COACH</h4>
                                                    <p className="text-[11px] md:text-sm leading-relaxed italic font-bold text-muted-foreground/90">
                                                      {selectedWorkout.analysis.analysisSummary.summary}
                                                    </p>
                                                </div>
                                                
                                                <div className="p-5 md:p-10 rounded-xl md:rounded-[2.5rem] bg-accent/5 border border-accent/20 space-y-4 shadow-2xl">
                                                    <Target className="size-5 md:size-8 text-accent" />
                                                    <h4 className="text-[10px] md:text-base font-black uppercase italic tracking-widest text-accent">RECOMENDAÇÃO</h4>
                                                    <p className="text-xs md:text-lg leading-relaxed text-white font-black italic">"{selectedWorkout.analysis.recommendations}"</p>
                                                </div>
                                            </div>

                                            <Button className="w-full bg-primary text-black font-black uppercase h-14 md:h-24 rounded-xl md:rounded-[1.5rem] text-xs md:text-lg italic" onClick={() => router.push('/coach')}>
                                                <MessageSquare size={16} className="mr-2"/> CHAT COM COACH
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-6 md:space-y-12 pb-10">
                                            <div className="space-y-2">
                                                <label className="text-[8px] md:text-[11px] font-black uppercase text-muted-foreground/60 italic tracking-widest">FEEDBACK SENSORIAL</label>
                                                <Textarea 
                                                    placeholder="Como se sentiu hoje?" 
                                                    className="bg-black/40 min-h-[120px] md:min-h-[220px] font-bold rounded-xl md:rounded-[2rem] border-white/5 italic text-xs md:text-lg p-4 md:p-10"
                                                    value={athleteFeedback}
                                                    onChange={(e) => setAthleteFeedback(e.target.value)}
                                                />
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[8px] md:text-[11px] font-black uppercase text-muted-foreground/60 italic tracking-widest">UPLOAD DO COROS (.FIT) / .CSV / PRINT</label>
                                                <div
                                                    className={cn(
                                                      "border-2 border-dashed rounded-xl md:rounded-[3rem] p-8 md:p-20 text-center space-y-4 md:space-y-10 cursor-pointer transition-all",
                                                      (uploadedFileUri || deviceData) ? "border-primary bg-primary/5" : "border-white/5 hover:bg-white/5"
                                                    )}
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".fit,.csv,.txt,image/*" />
                                                    {(uploadedFileUri || deviceData) ? (
                                                      <div className="space-y-2">
                                                         <div className="p-4 md:p-10 rounded-xl md:rounded-[2.5rem] bg-primary text-black w-fit mx-auto shadow-2xl relative group">
                                                            <FileDigit size={30} className="md:size-64"/>
                                                            <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 size-7 md:size-10 rounded-full shadow-2xl" onClick={clearFile}><X size={14}/></Button>
                                                         </div>
                                                         <p className="text-[10px] md:text-base font-black uppercase italic text-primary truncate max-w-[200px] mx-auto">{uploadedFileName}</p>
                                                      </div>
                                                    ) : (
                                                      <div className="space-y-4">
                                                          <div className="flex justify-center gap-4 md:gap-12">
                                                              <div className="p-4 md:p-10 rounded-xl md:rounded-[2.5rem] bg-primary/10 text-primary animate-bounce shadow-2xl"><Upload size={24} className="md:size-56"/></div>
                                                          </div>
                                                          <p className="text-[10px] md:text-2xl font-black uppercase italic tracking-widest text-white">ANEXAR TELEMETRIA</p>
                                                      </div>
                                                    )}
                                                </div>

                                                {fitSummary && (
                                                  <div className="p-4 md:p-6 rounded-xl md:rounded-[1.5rem] bg-primary/5 border border-primary/20 space-y-3">
                                                    <div className="flex items-center gap-2 text-primary">
                                                      <Activity size={12} />
                                                      <h5 className="text-[8px] md:text-[10px] font-black uppercase italic tracking-widest">MÉTRICAS REAIS DETECTADAS</h5>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2 md:gap-3">
                                                      {fitSummary.distanceKm != null && <FitStat label="DIST" value={`${fitSummary.distanceKm}km`} />}
                                                      {fitSummary.avgPace && <FitStat label="PACE" value={fitSummary.avgPace.replace('/km','')} />}
                                                      {fitSummary.avgSpeedKmh != null && <FitStat label="VELOC" value={`${fitSummary.avgSpeedKmh}km/h`} />}
                                                      {fitSummary.durationText && <FitStat label="TEMPO" value={fitSummary.durationText} />}
                                                      {fitSummary.avgHr != null && <FitStat label="FC MÉD" value={`${fitSummary.avgHr}`} />}
                                                      {fitSummary.avgCadenceSpm != null && <FitStat label={fitSummary.sport === 'cycling' ? 'RPM' : 'CADÊNCIA'} value={`${fitSummary.avgCadenceSpm}`} />}
                                                      {fitSummary.avgVerticalOscillationCm != null && <FitStat label="OSC.VERT" value={`${fitSummary.avgVerticalOscillationCm}cm`} />}
                                                      {fitSummary.avgGroundContactTimeMs != null && <FitStat label="GCT" value={`${fitSummary.avgGroundContactTimeMs}ms`} />}
                                                      {fitSummary.avgPowerW != null && <FitStat label="POT" value={`${fitSummary.avgPowerW}w`} />}
                                                      {fitSummary.totalAscentM != null && <FitStat label="ELEV" value={`${fitSummary.totalAscentM}m`} />}
                                                    </div>
                                                  </div>
                                                )}
                                            </div>

                                            <Button
                                                className="w-full bg-primary text-black font-black uppercase h-14 md:h-24 text-xs md:text-2xl shadow-2xl rounded-xl md:rounded-[1.5rem] italic"
                                                disabled={analyzing || (!athleteFeedback.trim() && !deviceData && !uploadedFileUri)}
                                                onClick={handleFinalizeAnalysis}
                                            >
                                                {analyzing ? <><Loader2 className="mr-2 animate-spin size-4" /> ANALISANDO...</> : 'FINALIZAR SESSÃO'}
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
        </div>
      </TooltipProvider>
    </DashboardLayout>
  );
}

function MetricBoxElite({ icon: Icon, label, value, color = "default" }: { icon: any, label: string, value: string, color?: "default" | "primary" }) {
  return (
    <div className="flex items-center gap-3 md:gap-6 p-3 md:p-6 rounded-xl md:rounded-2xl bg-black/40 border border-white/5 shadow-2xl">
      <div className={cn(
        "size-9 md:size-14 rounded-lg md:rounded-xl flex items-center justify-center shrink-0",
        color === "primary" ? "bg-primary text-black" : "bg-secondary text-primary/70"
      )}>
        <Icon size={16} className="md:size-24" />
      </div>
      <div className="space-y-0.5">
        <p className="text-[7px] md:text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest italic">{label}</p>
        <p className="text-sm md:text-2xl font-black uppercase italic text-white leading-none">{value}</p>
      </div>
    </div>
  );
}

function FitStat({ label, value }: { label: string, value: string }) {
  return (
    <div className="bg-black/40 border border-white/5 rounded-lg md:rounded-xl p-2 md:p-3 text-center">
      <p className="text-[6px] md:text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest italic leading-none">{label}</p>
      <p className="text-[11px] md:text-base font-black italic text-white leading-none mt-1">{value}</p>
    </div>
  );
}

function MetricBoxDetail({ label, value, unit, highlight = 'default' }: { label: string, value: string, unit?: string, highlight?: 'default' | 'primary' | 'destructive' }) {
    return (
        <div className="bg-black/60 border border-white/5 p-4 md:p-8 rounded-xl md:rounded-[2rem] text-center space-y-1 md:space-y-4">
            <p className="text-[7px] md:text-[11px] font-black text-muted-foreground/60 uppercase tracking-widest italic">{label}</p>
            <p className={cn(
                "text-lg md:text-4xl font-black italic uppercase tracking-tighter leading-none",
                highlight === 'primary' ? 'text-primary' : highlight === 'destructive' ? 'text-rose-500' : 'text-white'
            )}>
                {value} {unit && <span className="text-[8px] md:text-[12px] font-bold lowercase opacity-30 ml-0.5">{unit}</span>}
            </p>
        </div>
    );
}