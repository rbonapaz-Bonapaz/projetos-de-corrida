"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { analyzeWorkout } from "@/ai/flows/analyze-workout-flow";
import { TrainingContext } from "@/contexts/TrainingContext";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  CalendarDays,
  Zap,
  ChevronRight,
  CheckCircle2,
  Upload,
  BrainCircuit,
  MessageSquare,
  Route,
  X,
  FileDigit,
  FileDown,
  Activity,
  ArrowRight,
  RefreshCcw,
  Target,
  TrendingUp,
  AlertTriangle,
  Calendar as CalendarIcon
} from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, fileToDataURI } from '@/lib/utils';
import type { Workout, TrainingPlan } from "@/lib/types";
import { useRouter } from "next/navigation";

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
  const [athleteFeedback, setAthleteFeedback] = React.useState("");
  const [uploadedFileUri, setUploadedFileUri] = React.useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Sincronização do treino selecionado em tempo real
  React.useEffect(() => {
    if (selectedWorkout && plan) {
      for (const week of plan.weeklyPlans) {
        const found = week.runs.find(r => r.id === selectedWorkout.id);
        if (found) {
          setSelectedWorkout(found);
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
    try {
      const uri = await fileToDataURI(file);
      setUploadedFileUri(uri);
      setUploadedFileName(file.name);
      toast({ title: "DADOS CARREGADOS", description: "Pronto para sincronização cloud." });
    } catch (err) {
      toast({ variant: 'destructive', title: "FALHA NO UPLOAD" });
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedFileUri(null);
    setUploadedFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFinalizeAnalysis = async () => {
    if (!selectedWorkout || !profile || !context?.apiKey) return;
    
    setAnalyzing(true);
    toast({ title: "🧠 ANALISANDO MÉTRICAS...", description: "Gemini Coach processando sensores." });

    try {
      const result = await analyzeWorkout({
        apiKey: context.apiKey,
        prescribedWorkout: JSON.stringify(selectedWorkout),
        athleteFeedback,
        athleteProfile: JSON.stringify(profile),
        fileDataUri: uploadedFileUri || undefined
      });

      const updatedWorkout = { 
        ...selectedWorkout, 
        completed: true, 
        analysis: result
      };
      
      await context?.updateWorkout(selectedWorkout.id, updatedWorkout);
      setUploadedFileUri(null);
      setUploadedFileName(null);
      setAthleteFeedback("");
      toast({ title: "✅ SESSÃO REGISTRADA", description: "Sincronizado com todos os seus dispositivos." });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: "ERRO NA ANÁLISE" });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReschedule = async (newDay: string) => {
    if (!selectedWorkout) return;
    const updatedWorkout = { ...selectedWorkout, day: newDay };
    await context?.updateWorkout(selectedWorkout.id, updatedWorkout);
    toast({ title: "REAGENDAMENTO OK", description: `Sessão movida para ${newDay.toUpperCase()}.` });
  };

  const calculateWeekVolume = (runs: Workout[]) => {
    return runs.reduce((acc, run) => {
      const d = parseFloat(run.distance.replace('KM', '').replace('km', '').replace(',', '.'));
      return acc + (isNaN(d) ? 0 : d);
    }, 0).toFixed(1);
  };

  return (
    <DashboardLayout>
      <TooltipProvider>
        <div className="space-y-12 max-w-6xl mx-auto pb-20 print:p-0 animate-in fade-in duration-700">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 px-4 print:hidden">
            <div>
              <h1 className="text-4xl md:text-7xl font-headline font-black uppercase italic tracking-tighter leading-[0.8]">
                <span className="text-white">MEU</span> <br/> <span className="text-primary">PLANO</span>
              </h1>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-4 font-black uppercase tracking-[0.4em] italic opacity-60">
                PLANILHA SINCRONIZADA EM TEMPO REAL NA NUVEM
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={handleGenerate} 
                disabled={localLoading || !profile}
                className="bg-primary text-black hover:bg-white min-w-[240px] h-16 font-black uppercase tracking-widest text-[11px] italic rounded-2xl shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02]"
              >
                {localLoading ? <Loader2 className="mr-3 size-5 animate-spin" /> : <RefreshCcw className="mr-3 size-5" />}
                {plan ? "RECALIBRAR CICLO" : "GERAR MEU CICLO"}
              </Button>
            </div>
          </header>

          {!plan && (
            <Card className="mx-4 border-primary/20 bg-primary/5 p-32 text-center rounded-[3rem] shadow-2xl border-4 border-dashed print:hidden">
              <CardContent className="flex flex-col items-center space-y-10">
                  <div className="size-28 rounded-[2rem] bg-primary/10 flex items-center justify-center animate-pulse shadow-2xl shadow-primary/10">
                      <CalendarDays className="size-14 text-primary" />
                  </div>
                  <div className="space-y-4">
                      <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">Laboratório Vazio</h2>
                      <p className="text-muted-foreground max-w-sm mx-auto font-bold uppercase italic text-[11px] tracking-widest opacity-60">Sua biometria será salva na nuvem e sincronizada com seu celular.</p>
                  </div>
                  <Button asChild size="lg" className="h-20 px-16 font-black uppercase tracking-widest bg-primary text-black rounded-[1.5rem] shadow-2xl shadow-primary/30 transition-all hover:scale-105 hover:bg-white text-base">
                      <a href="/profile">INICIAR PERIODIZAÇÃO <ArrowRight className="ml-4 size-6" /></a>
                  </Button>
              </CardContent>
            </Card>
          )}

          {plan && (
            <div className="space-y-24 px-4">
              {plan.weeklyPlans.map((week, weekIdx) => (
                <div key={weekIdx} className="space-y-10">
                  <div className="flex items-end justify-between border-b-4 border-primary/20 pb-6 relative">
                    <div className="space-y-2">
                      <h2 className="text-4xl md:text-5xl font-headline font-black uppercase italic text-primary tracking-tighter leading-none">
                        W{String(week.weekNumber).padStart(2, '0')}
                      </h2>
                      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">{week.focus.toUpperCase()}</p>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">VOLUME DA SEMANA</p>
                      <Badge className="bg-primary text-black font-black italic uppercase text-base px-6 py-2 rounded-xl shadow-xl shadow-primary/10">
                        {calculateWeekVolume(week.runs)} KM
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {week.runs
                      .filter(w => w.type !== "Descanso")
                      .sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day))
                      .map((w: Workout) => (
                      <Card 
                        key={w.id} 
                        className={cn(
                            "group cursor-pointer transition-all hover:border-primary/50 relative overflow-hidden rounded-[2.5rem] border-2 flex flex-col h-full bg-[#0a0c10] shadow-2xl min-h-[320px]",
                            w.completed ? "opacity-40 border-border grayscale-[0.5]" : "border-white/5 hover:-translate-y-2"
                        )}
                        onClick={() => setSelectedWorkout(w)}
                      >
                        {w.completed && (
                            <div className="absolute top-8 right-8 z-10 p-1 bg-primary rounded-full shadow-2xl">
                                <CheckCircle2 className="size-6 text-black" />
                            </div>
                        )}
                        <CardHeader className="p-10 pb-6">
                            <p className="text-[11px] font-black uppercase text-primary tracking-[0.3em] italic mb-4">{w.day.toUpperCase()}</p>
                            <CardTitle className="font-headline text-4xl italic uppercase font-black tracking-tighter text-white leading-[0.9]">
                              {w.type}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-10 pt-0 flex-1 space-y-8">
                            <p className="text-xs text-muted-foreground italic leading-relaxed font-bold line-clamp-3">"{w.description}"</p>
                            <div className="flex flex-wrap gap-3">
                                <Badge className="bg-primary text-black font-black italic uppercase text-[10px] h-9 px-5 rounded-xl shadow-lg">{w.distance}</Badge>
                                <Badge variant="outline" className="border-white/10 bg-white/5 font-black italic uppercase text-[10px] h-9 px-5 rounded-xl text-white tracking-widest">{w.paceZone}</Badge>
                            </div>
                        </CardContent>
                        <CardFooter className="p-10 pt-0 border-t border-white/5 mt-auto flex justify-between items-center group-hover:bg-primary/5 transition-colors h-20">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic opacity-40">VER DETALHES TÉCNICOS</span>
                            <ChevronRight className="size-6 text-primary transition-all group-hover:translate-x-2" />
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <Dialog open={!!selectedWorkout} onOpenChange={(open) => !open && setSelectedWorkout(null)}>
              <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto custom-scrollbar border-primary/20 bg-[#06080a] rounded-[3rem] p-0 overflow-hidden shadow-2xl">
                  {selectedWorkout && (
                      <div className="flex flex-col">
                          <div className="p-12 space-y-6 bg-gradient-to-b from-secondary/40 to-transparent border-b border-white/5 relative">
                              <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-3">
                                     <p className="text-xs font-black uppercase text-primary tracking-[0.4em] italic">{selectedWorkout.day.toUpperCase()}</p>
                                     <Badge variant="outline" className="border-primary/30 text-primary font-black italic text-[9px] uppercase">{plan?.blockType}</Badge>
                                  </div>
                                  <h2 className="font-headline text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-white leading-none">
                                    {selectedWorkout.type}
                                  </h2>
                                </div>
                                {!selectedWorkout.completed && (
                                  <div className="flex flex-col items-end gap-3">
                                    <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-[0.2em] italic">REAGENDAR SESSÃO</span>
                                    <Select onValueChange={handleReschedule} value={selectedWorkout.day}>
                                      <SelectTrigger className="w-48 bg-black/60 border-primary/30 rounded-2xl h-12 font-black italic uppercase text-[11px] tracking-widest shadow-2xl">
                                        <div className="flex items-center gap-2"><CalendarIcon size={14} className="text-primary"/><SelectValue /></div>
                                      </SelectTrigger>
                                      <SelectContent className="bg-[#0c0e12] border-white/10">
                                        {dayOrder.map(day => (
                                          <SelectItem key={day} value={day} className="font-black italic uppercase text-[10px] tracking-widest focus:bg-primary focus:text-black">{day}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                              </div>
                          </div>

                          <div className="p-12 pt-0 space-y-12">
                            <Tabs defaultValue={selectedWorkout.completed ? "analise" : "prescrito"} className="w-full">
                                <TabsList className="grid w-full grid-cols-2 bg-black/60 h-20 p-2 rounded-[1.5rem] gap-3 shadow-inner">
                                    <TabsTrigger value="prescrito" className="font-black text-[12px] uppercase italic tracking-widest data-[state=active]:bg-primary data-[state=active]:text-black rounded-xl transition-all duration-300">PRESCRIÇÃO TÉCNICA</TabsTrigger>
                                    <TabsTrigger value="analise" className="font-black text-[12px] uppercase italic tracking-widest data-[state=active]:bg-primary data-[state=active]:text-black rounded-xl transition-all duration-300">
                                        {selectedWorkout.completed ? 'ANÁLISE DE PERFORMANCE' : 'REGISTRAR TREINO'}
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="prescrito" className="space-y-12 pt-12 animate-in slide-in-from-bottom-4">
                                    <div className="p-10 rounded-[2.5rem] bg-primary/5 border-l-[12px] border-primary space-y-4 shadow-2xl">
                                        <h4 className="text-[12px] font-black uppercase text-primary tracking-[0.3em] italic">OBJETIVO TÉCNICO</h4>
                                        <p className="text-2xl italic font-bold leading-relaxed text-white">"{selectedWorkout.description}"</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <MetricBoxElite icon={Route} label="DISTÂNCIA ALVO" value={selectedWorkout.distance} />
                                        <MetricBoxElite icon={Target} label="ZONA DE PACE" value={selectedWorkout.paceZone} color="primary" />
                                    </div>

                                    {selectedWorkout.phases && selectedWorkout.phases.length > 0 && (
                                      <div className="space-y-8">
                                        <div className="flex items-center gap-4">
                                          <TrendingUp className="size-6 text-primary" />
                                          <h4 className="text-base font-black uppercase text-white italic tracking-tighter">ESTRUTURA DA SESSÃO</h4>
                                        </div>
                                        <div className="grid gap-6">
                                          {selectedWorkout.phases.map((phase, idx) => (
                                            <div key={idx} className="flex gap-8 p-8 rounded-[2rem] bg-secondary/20 border border-white/5 hover:border-primary/30 transition-all shadow-xl group">
                                              <div className="size-16 rounded-2xl bg-[#0c0e12] border border-white/10 flex items-center justify-center shrink-0 text-primary font-black italic text-2xl group-hover:scale-110 transition-transform shadow-2xl">
                                                {String(idx + 1).padStart(2, '0')}
                                              </div>
                                              <div className="space-y-3 flex-1">
                                                <div className="flex justify-between items-center">
                                                  <span className="text-lg font-black uppercase italic text-white tracking-tight leading-none">{phase.name}</span>
                                                  <Badge className="bg-primary/20 text-primary border-none font-black italic text-xs px-4 h-7">{phase.distance}</Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground leading-relaxed italic font-medium opacity-80">{phase.description}</p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="analise" className="pt-12 space-y-12 animate-in slide-in-from-bottom-4">
                                    {selectedWorkout.completed && selectedWorkout.analysis ? (
                                        <div className="space-y-12">
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                                <MetricBoxDetail 
                                                  label="Pace Realizado" 
                                                  value={selectedWorkout.analysis.actualMetrics?.averagePace || '--'} 
                                                  unit="min/km" 
                                                  highlight="primary"
                                                />
                                                <MetricBoxDetail 
                                                  label="Cadência Média" 
                                                  value={selectedWorkout.analysis.actualMetrics?.averageCadence || '--'} 
                                                  unit="ppm" 
                                                />
                                                <MetricBoxDetail 
                                                    label="Razão de Passada" 
                                                    value={selectedWorkout.analysis.actualMetrics?.strideRatio ? `${selectedWorkout.analysis.actualMetrics.strideRatio}%` : '--'} 
                                                    highlight={Number(selectedWorkout.analysis.actualMetrics?.strideRatio) > 11 ? 'destructive' : 'default'}
                                                />
                                            </div>

                                            {Number(selectedWorkout.analysis.actualMetrics?.strideRatio) > 11 && (
                                              <div className="p-8 rounded-[2rem] bg-rose-500/10 border border-rose-500/20 flex items-center gap-6 animate-pulse">
                                                <AlertTriangle className="size-8 text-rose-500 shrink-0" />
                                                <div className="space-y-1">
                                                  <p className="font-black uppercase italic text-rose-500 tracking-widest text-[11px]">ALERTA DE INEFICIÊNCIA BIOMECÂNICA</p>
                                                  <p className="text-muted-foreground italic font-bold text-sm leading-tight">Oscilação vertical excessiva detectada. Tente projetar o centro de massa levemente à frente.</p>
                                                </div>
                                              </div>
                                            )}

                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                <div className="p-10 rounded-[2.5rem] bg-primary/5 border border-primary/20 space-y-8 shadow-2xl relative overflow-hidden">
                                                    <BrainCircuit className="size-8 text-primary" />
                                                    <h4 className="text-base font-black uppercase italic tracking-[0.2em] text-primary">PARECER TÉCNICO IA</h4>
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap italic font-bold text-muted-foreground/90">
                                                      {selectedWorkout.analysis.analysisSummary.summary}
                                                      {"\n\n"}
                                                      {selectedWorkout.analysis.analysisSummary.technicalReview}
                                                    </p>
                                                </div>
                                                
                                                <div className="p-10 rounded-[2.5rem] bg-accent/5 border border-accent/20 space-y-8 shadow-2xl">
                                                    <Target className="size-8 text-accent" />
                                                    <h4 className="text-base font-black uppercase italic tracking-[0.2em] text-accent">RECOMENDAÇÃO DO COACH</h4>
                                                    <p className="text-lg leading-relaxed text-white font-black italic">"{selectedWorkout.analysis.recommendations}"</p>
                                                    <div className="pt-4 flex flex-wrap gap-2">
                                                      {selectedWorkout.analysis.areasOfImprovement?.map((area, idx) => (
                                                        <Badge key={idx} variant="secondary" className="bg-white/5 text-white/60 border-none italic uppercase text-[9px] font-black">{area}</Badge>
                                                      ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <Button className="w-full bg-primary text-black font-black uppercase h-24 gap-4 rounded-[1.5rem] transition-all hover:scale-[1.02] hover:bg-white text-lg italic shadow-2xl shadow-primary/20" onClick={() => router.push('/coach')}>
                                                <MessageSquare size={24}/> CONVERSAR SOBRE ESTA SESSÃO
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-12">
                                            <div className="space-y-4">
                                                <label className="text-[11px] font-black uppercase text-muted-foreground/60 italic tracking-[0.3em]">FEEDBACK SUBJETIVO</label>
                                                <Textarea 
                                                    placeholder="Como você se sentiu hoje? Relate dores, clima ou percepção de esforço..." 
                                                    className="bg-black/40 min-h-[220px] font-bold rounded-[2rem] border-white/5 italic text-lg p-10 focus:border-primary shadow-inner"
                                                    value={athleteFeedback}
                                                    onChange={(e) => setAthleteFeedback(e.target.value)}
                                                />
                                            </div>

                                            <div className="space-y-6">
                                                <label className="text-[11px] font-black uppercase text-muted-foreground/60 italic tracking-[0.3em]">IMPORTAR SENSORES (FIT / CSV / PRINT)</label>
                                                <div 
                                                    className={cn(
                                                      "border-4 border-dashed rounded-[3rem] p-20 text-center space-y-10 cursor-pointer transition-all duration-500",
                                                      uploadedFileUri ? "border-primary bg-primary/5" : "border-white/5 hover:bg-white/5 hover:border-primary/40"
                                                    )}
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    <input type="file" ref={fileInputRef} className="sr-only" onChange={handleFileUpload} accept=".fit,.csv,image/*,.pdf" />
                                                    {uploadedFileUri ? (
                                                      <div className="space-y-6 animate-in zoom-in-95">
                                                         <div className="flex justify-center">
                                                            <div className="relative group">
                                                              <div className="p-10 rounded-[2.5rem] bg-primary text-black shadow-2xl group-hover:scale-105 transition-transform">
                                                                <FileDigit size={64}/>
                                                              </div>
                                                              <Button variant="destructive" size="icon" className="absolute -top-4 -right-4 size-12 rounded-full shadow-2xl hover:scale-110" onClick={clearFile}><X size={24}/></Button>
                                                            </div>
                                                         </div>
                                                         <div className="space-y-2">
                                                            <p className="text-base font-black uppercase italic text-primary tracking-widest">ARQUIVO CARREGADO</p>
                                                            <p className="text-[11px] text-muted-foreground truncate max-w-[400px] mx-auto italic font-bold opacity-60 uppercase">{uploadedFileName}</p>
                                                         </div>
                                                      </div>
                                                    ) : (
                                                      <div className="space-y-10">
                                                          <div className="flex justify-center gap-12">
                                                              <div className="p-8 rounded-[2rem] bg-secondary/40 text-muted-foreground/20"><Route size={48}/></div>
                                                              <div className="p-10 rounded-[2.5rem] bg-primary/20 text-primary animate-bounce shadow-2xl"><Upload size={56}/></div>
                                                              <div className="p-8 rounded-[2rem] bg-secondary/40 text-muted-foreground/20"><Activity size={48}/></div>
                                                          </div>
                                                          <div className="space-y-3">
                                                              <p className="text-2xl font-black uppercase italic tracking-[0.4em] text-white">LABORATÓRIO DE DADOS</p>
                                                              <p className="text-[11px] text-muted-foreground uppercase italic font-black tracking-widest opacity-40">CLIQUE PARA ANEXAR ARQUIVO DO RELÓGIO</p>
                                                          </div>
                                                      </div>
                                                    )}
                                                </div>
                                            </div>

                                            <Button 
                                                className="w-full bg-primary text-black font-black uppercase h-24 tracking-[0.3em] text-2xl shadow-2xl shadow-primary/20 rounded-[1.5rem] transition-all hover:scale-[1.02] hover:bg-white italic"
                                                disabled={analyzing || !athleteFeedback.trim()}
                                                onClick={handleFinalizeAnalysis}
                                            >
                                                {analyzing ? <><Loader2 className="mr-5 size-8 animate-spin" /> SINCRONIZANDO COM A NUVEM...</> : 'PROCESSAR ANÁLISE'}
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
    <div className="flex items-center gap-8 p-10 rounded-[2.5rem] bg-black/40 border border-white/5 group hover:border-primary/40 transition-all shadow-2xl">
      <div className={cn(
        "size-20 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl transition-transform group-hover:scale-110 duration-300",
        color === "primary" ? "bg-primary text-black" : "bg-secondary text-primary/70"
      )}>
        <Icon size={36} />
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.3em] italic">{label}</p>
        <p className="text-4xl font-black uppercase italic text-white tracking-tighter leading-none">{value}</p>
      </div>
    </div>
  );
}

function MetricBoxDetail({ label, value, unit, highlight = 'default' }: { label: string, value: string, unit?: string, highlight?: 'default' | 'primary' | 'destructive' }) {
    return (
        <div className="bg-black/60 border border-white/5 p-8 rounded-[2rem] text-center space-y-4 group transition-all hover:bg-secondary/20 shadow-2xl">
            <p className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] italic">{label}</p>
            <p className={cn(
                "text-4xl font-black italic uppercase tracking-tighter leading-none",
                highlight === 'primary' ? 'text-primary' : highlight === 'destructive' ? 'text-rose-500' : 'text-white'
            )}>
                {value} {unit && <span className="text-[12px] font-bold lowercase opacity-30 ml-2 tracking-normal">{unit}</span>}
            </p>
        </div>
    );
}
