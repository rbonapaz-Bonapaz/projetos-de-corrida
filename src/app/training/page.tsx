
"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { analyzeWorkout } from "@/ai/flows/analyze-workout-flow";
import { TrainingContext } from "@/contexts/TrainingContext";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Loader2, 
  CalendarDays,
  Zap,
  ChevronRight,
  CheckCircle2,
  Upload,
  FileText,
  ImageIcon,
  BrainCircuit,
  MessageSquare,
  Route,
  Clock,
  X,
  FileDigit,
  Info,
  FileDown,
  Activity,
  ArrowRight,
  Calendar as CalendarIcon,
  RefreshCcw,
  Target
} from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, fileToDataURI } from '@/lib/utils';
import type { Workout, TrainingPlan, AthleteProfile, WeeklyPlan } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import Link from "next/link";

const dayOrder = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default function TrainingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const context = React.useContext(TrainingContext);
  const { user } = useUser();
  const firestore = useFirestore();

  const userDocRef = React.useMemo(() => 
    user ? doc(firestore, 'user_data', user.uid) : null, 
  [user, firestore]);
  
  const { data: userData, loading: syncLoading } = useDoc<any>(userDocRef);

  const profile = (userData?.profile || context?.activeProfile) as AthleteProfile | null;
  const plan = (userData?.trainingPlan || context?.trainingPlan) as TrainingPlan | null;

  const [localLoading, setLocalLoading] = React.useState(false);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [selectedWorkout, setSelectedWorkout] = React.useState<Workout | null>(null);
  const [athleteFeedback, setAthleteFeedback] = React.useState("");
  const [uploadedFileUri, setUploadedFileUri] = React.useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (!profile) {
      toast({ variant: "destructive", title: "Perfil Incompleto", description: "Configure seus dados no perfil primeiro." });
      return;
    }
    setLocalLoading(true);
    try {
      await context?.generateRunningPlanAsync(profile);
    } catch (err) {
      console.error(err);
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
      toast({ title: "Arquivo pronto!", description: `${file.name} foi carregado para análise.` });
    } catch (err) {
      toast({ variant: 'destructive', title: "Erro no upload" });
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
    toast({ title: "🧠 Gemini Coach está analisando...", description: "Processando sensores e feedback." });

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
      
      context?.updateWorkout(selectedWorkout.id, updatedWorkout);
      setSelectedWorkout(updatedWorkout as any);
      setUploadedFileUri(null);
      setUploadedFileName(null);
      setAthleteFeedback("");
      toast({ title: "✅ Treino Registrado!", description: "Análise biomecânica concluída." });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: "Erro na análise", description: "Verifique sua chave de API." });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReschedule = (newDay: string) => {
    if (!selectedWorkout) return;
    const updatedWorkout = { ...selectedWorkout, day: newDay };
    context?.updateWorkout(selectedWorkout.id, updatedWorkout);
    setSelectedWorkout(updatedWorkout);
    toast({ title: "Treino Reagendado", description: `Sessão movida para ${newDay}.` });
  };

  const handleExportPDF = () => {
    if (!plan) return;
    toast({ title: "Gerando PDF...", description: "Preparando versão otimizada para impressão." });
    window.print();
  };

  const calculateWeekVolume = (runs: Workout[]) => {
    return runs.reduce((acc, run) => {
      const d = parseFloat(run.distance.replace('km', '').replace(',', '.'));
      return acc + (isNaN(d) ? 0 : d);
    }, 0).toFixed(1);
  };

  return (
    <DashboardLayout>
      <TooltipProvider>
        <div className="space-y-6 md:space-y-10 max-w-6xl mx-auto pb-20 print:p-0">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 print:hidden">
            <div>
              <h1 className="text-4xl md:text-6xl font-headline font-black uppercase italic tracking-tighter leading-none">
                <span className="text-white">MEU</span> <span className="text-primary">PLANO</span>
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-2 font-black uppercase tracking-[0.3em] italic">
                {syncLoading ? "SINCRONIZANDO LABORATÓRIO..." : "PLANILHA INTELIGENTE DE ALTA PERFORMANCE"}
              </p>
            </div>
            <div className="flex gap-3">
              {plan && (
                <Button 
                  onClick={handleExportPDF}
                  variant="outline"
                  className="border-white/10 bg-black/40 text-white h-14 px-8 font-black uppercase tracking-widest text-[11px] italic rounded-2xl hover:bg-white hover:text-black transition-all"
                >
                  <FileDown className="mr-2 size-5" /> EXPORTAR PDF
                </Button>
              )}
              <Button 
                onClick={handleGenerate} 
                disabled={localLoading || !profile}
                className="bg-primary text-black hover:bg-white min-w-[200px] h-14 font-black uppercase tracking-widest text-[11px] italic rounded-2xl shadow-2xl shadow-primary/20 transition-all hover:scale-105"
              >
                {localLoading ? <Loader2 className="mr-2 size-5 animate-spin" /> : <RefreshCcw className="mr-2 size-5" />}
                {plan ? "RECALIBRAR CICLO" : "GERAR MEU CICLO"}
              </Button>
            </div>
          </header>

          {!plan && !syncLoading && (
            <Card className="mx-4 border-primary/20 bg-primary/5 p-24 text-center rounded-[3rem] shadow-2xl border-4 border-dashed print:hidden">
              <CardContent className="flex flex-col items-center space-y-8">
                  <div className="size-24 rounded-3xl bg-primary/10 flex items-center justify-center animate-pulse">
                      <CalendarDays className="size-12 text-primary" />
                  </div>
                  <div className="space-y-3">
                      <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Laboratório Vazio</h2>
                      <p className="text-muted-foreground max-w-sm mx-auto font-medium">Configure sua biometria e prova alvo no perfil para que o Gemini gere sua periodização.</p>
                  </div>
                  <Button asChild size="lg" className="h-16 px-12 font-black uppercase tracking-widest bg-primary text-black rounded-2xl shadow-2xl shadow-primary/30 transition-all hover:scale-105 hover:bg-white">
                      <Link href="/profile">INICIAR PERIODIZAÇÃO <ArrowRight className="ml-3 size-5" /></Link>
                  </Button>
              </CardContent>
            </Card>
          )}

          {plan && (
            <div className="space-y-16 animate-in fade-in duration-700 px-4">
              {plan.weeklyPlans.map((week, weekIdx) => (
                <div key={weekIdx} className="space-y-8">
                  <div className="flex items-end justify-between border-b-2 border-primary/20 pb-4">
                    <div className="space-y-1">
                      <h2 className="text-3xl font-headline font-black uppercase italic text-primary tracking-tighter">
                        SEMANA {String(week.weekNumber).padStart(2, '0')}
                      </h2>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Foco: {week.focus}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">VOLUME PLANEJADO</p>
                      <Badge className="bg-primary text-black font-black italic uppercase text-sm px-4 py-1 rounded-lg">
                        {calculateWeekVolume(week.runs)} KM
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {week.runs
                      .filter(w => w.type !== "Descanso") // Filtra apenas dias de treino
                      .sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day))
                      .map((w: Workout) => (
                      <Card 
                        key={w.id} 
                        className={cn(
                            "group cursor-pointer transition-all hover:border-primary/50 relative overflow-hidden rounded-[2rem] border-2 flex flex-col h-full bg-[#0a0c10] shadow-2xl",
                            w.completed ? "opacity-60 border-border" : "border-white/5 hover:translate-y-[-4px]"
                        )}
                        onClick={() => setSelectedWorkout(w)}
                      >
                        {w.completed && (
                            <div className="absolute top-6 right-6 z-10">
                                <CheckCircle2 className="size-6 text-primary" />
                            </div>
                        )}
                        <CardHeader className="p-8 pb-4">
                            <p className="text-[11px] font-black uppercase text-primary tracking-[0.2em] italic mb-3">{w.day}</p>
                            <CardTitle className="font-headline text-3xl italic uppercase font-black tracking-tighter text-white leading-tight">
                              {w.type}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 flex-1 space-y-6">
                            <p className="text-xs text-muted-foreground italic leading-relaxed font-bold">"{w.description}"</p>
                            <div className="flex flex-wrap gap-2">
                                <Badge className="bg-primary text-black font-black italic uppercase text-[10px] h-7 px-4 rounded-full">{w.distance}</Badge>
                                <Badge variant="outline" className="border-white/10 bg-white/5 font-black italic uppercase text-[10px] h-7 px-4 rounded-full text-white">{w.paceZone}</Badge>
                                {w.rpe && <Badge variant="secondary" className="text-[9px] font-black italic">RPE {w.rpe}/10</Badge>}
                            </div>
                        </CardContent>
                        <CardFooter className="p-8 pt-0 border-t border-white/5 mt-auto flex justify-between items-center group-hover:bg-primary/5 transition-colors h-16">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">DETALHES TÉCNICOS</span>
                            <ChevronRight className="size-5 text-primary transition-all group-hover:translate-x-1" />
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <Dialog open={!!selectedWorkout} onOpenChange={(open) => !open && setSelectedWorkout(null)}>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar border-primary/20 bg-[#0a0c10] rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
                  {selectedWorkout && (
                      <div className="flex flex-col">
                          <div className="p-10 space-y-4 bg-gradient-to-b from-secondary/30 to-transparent border-b border-white/5 relative">
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  <p className="text-xs font-black uppercase text-primary tracking-[0.3em] italic">{selectedWorkout.day}</p>
                                  <h2 className="font-headline text-5xl md:text-6xl font-black uppercase italic tracking-tighter text-white leading-none">
                                    {selectedWorkout.type}
                                  </h2>
                                </div>
                                {!selectedWorkout.completed && (
                                  <div className="flex flex-col items-end gap-2">
                                    <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest italic">REAGENDAR</span>
                                    <Select onValueChange={handleReschedule} defaultValue={selectedWorkout.day}>
                                      <SelectTrigger className="w-40 bg-black/40 border-primary/20 rounded-xl h-10 font-black italic uppercase text-[10px]">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="bg-card border-border">
                                        {dayOrder.map(day => (
                                          <SelectItem key={day} value={day} className="font-black italic uppercase text-[10px]">{day}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                              </div>
                          </div>

                          <div className="p-10 space-y-10">
                            <Tabs defaultValue={selectedWorkout.completed ? "feedback" : "prescrito"} className="w-full">
                                <TabsList className="grid w-full grid-cols-2 bg-black/40 h-16 p-1.5 rounded-2xl gap-2">
                                    <TabsTrigger value="prescrito" className="font-black text-[11px] uppercase italic tracking-widest data-[state=active]:bg-primary data-[state=active]:text-black rounded-xl transition-all">PRESCRIÇÃO TÉCNICA</TabsTrigger>
                                    <TabsTrigger value="feedback" className="font-black text-[11px] uppercase italic tracking-widest data-[state=active]:bg-primary data-[state=active]:text-black rounded-xl transition-all">
                                        {selectedWorkout.completed ? 'ANÁLISE BIOMECÂNICA' : 'REGISTRAR SESSÃO'}
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="prescrito" className="space-y-10 pt-10">
                                    <div className="p-8 rounded-3xl bg-primary/5 border-l-8 border-primary space-y-4">
                                        <h4 className="text-[11px] font-black uppercase text-primary tracking-widest italic">OBJETIVO DA SESSÃO</h4>
                                        <p className="text-xl italic font-bold leading-relaxed text-white">"{selectedWorkout.description}"</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <MetricBoxElite icon={Route} label="DISTÂNCIA" value={selectedWorkout.distance} />
                                        <MetricBoxElite icon={Clock} label="ZONA PACE" value={selectedWorkout.paceZone} color="primary" />
                                    </div>

                                    {selectedWorkout.phases && selectedWorkout.phases.length > 0 && (
                                      <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                          <Activity className="size-5 text-primary" />
                                          <h4 className="text-sm font-black uppercase text-white italic tracking-widest">DIVISÃO POR FASES</h4>
                                        </div>
                                        <div className="grid gap-4">
                                          {selectedWorkout.phases.map((phase, idx) => (
                                            <div key={idx} className="flex gap-6 p-6 rounded-3xl bg-black/40 border border-white/5 hover:border-primary/20 transition-all group">
                                              <div className="size-12 rounded-2xl bg-secondary flex items-center justify-center shrink-0 text-primary font-black italic text-lg shadow-xl">
                                                {String(idx + 1).padStart(2, '0')}
                                              </div>
                                              <div className="space-y-2 flex-1">
                                                <div className="flex justify-between items-center">
                                                  <span className="text-sm font-black uppercase italic text-white tracking-tight">{phase.name}</span>
                                                  <Badge className="bg-primary/10 text-primary border-none font-black italic">{phase.distance}</Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground leading-relaxed italic font-medium">{phase.description}</p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="feedback" className="pt-10 space-y-10">
                                    {selectedWorkout.completed && selectedWorkout.analysis ? (
                                        <div className="space-y-10">
                                            <div className="grid grid-cols-3 gap-4">
                                                <MetricBoxDetail label="Pace Médio" value={selectedWorkout.analysis.actualMetrics?.averagePace || '--'} unit="min/km" />
                                                <MetricBoxDetail label="Cadência" value={selectedWorkout.analysis.actualMetrics?.averageCadence || '--'} unit="ppm" />
                                                <MetricBoxDetail 
                                                    label="Razão Passada" 
                                                    value={selectedWorkout.analysis.actualMetrics?.strideRatio ? `${selectedWorkout.analysis.actualMetrics.strideRatio}%` : '--'} 
                                                    highlight={Number(selectedWorkout.analysis.actualMetrics?.strideRatio) > 11 ? 'destructive' : 'primary'}
                                                />
                                            </div>

                                            <div className="space-y-6">
                                                <div className="p-8 rounded-3xl bg-primary/5 border border-primary/20 space-y-6">
                                                    <div className="flex items-center gap-4 text-primary"><BrainCircuit size={24}/><h4 className="text-sm font-black uppercase italic tracking-[0.2em]">ANÁLISE DO COACH IA</h4></div>
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap italic font-bold text-muted-foreground">
                                                      {selectedWorkout.analysis.analysisSummary.summary}
                                                      {"\n\n"}
                                                      {selectedWorkout.analysis.analysisSummary.technicalReview}
                                                    </p>
                                                </div>
                                                
                                                <div className="p-8 rounded-3xl bg-accent/5 border border-accent/20 space-y-6">
                                                    <div className="flex items-center gap-4 text-accent"><Target size={24}/><h4 className="text-sm font-black uppercase italic tracking-[0.2em]">RECOMENDAÇÕES DE ELITE</h4></div>
                                                    <p className="text-base leading-relaxed text-white font-black italic">"{selectedWorkout.analysis.recommendations}"</p>
                                                </div>
                                            </div>

                                            <Button className="w-full bg-primary text-black font-black uppercase h-20 gap-4 rounded-3xl transition-all hover:scale-[1.02] hover:bg-white text-base italic shadow-2xl shadow-primary/20" onClick={() => router.push('/coach')}>
                                                <MessageSquare size={24}/> CONVERSAR SOBRE ESTE TREINO
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-10">
                                            <div className="space-y-4">
                                                <label className="text-[11px] font-black uppercase text-muted-foreground italic tracking-[0.2em]">RELATO SUBJETIVO DO ATLETA</label>
                                                <Textarea 
                                                    placeholder="Como foi o treino? Senti pernas pesadas, ritmo fluiu bem..." 
                                                    className="bg-black/30 min-h-[180px] font-bold rounded-[2rem] border-white/10 italic text-base p-8 focus:border-primary"
                                                    value={athleteFeedback}
                                                    onChange={(e) => setAthleteFeedback(e.target.value)}
                                                />
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                  <label className="text-[11px] font-black uppercase text-muted-foreground italic tracking-[0.2em]">IMPORTAR DADOS (FIT, Strava, Foto)</label>
                                                  <Tooltip><TooltipTrigger asChild><Info className="size-4 text-muted-foreground cursor-help opacity-40 hover:opacity-100" /></TooltipTrigger><TooltipContent><p className="max-w-xs text-[10px]">Aceitamos arquivos .FIT, .CSV ou foto do relógio.</p></TooltipContent></Tooltip>
                                                </div>
                                                <div 
                                                    className={cn(
                                                      "border-4 border-dashed rounded-[3rem] p-16 text-center space-y-8 cursor-pointer transition-all",
                                                      uploadedFileUri ? "border-primary bg-primary/5" : "border-white/5 hover:bg-white/5 hover:border-primary/30"
                                                    )}
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    <input type="file" ref={fileInputRef} className="sr-only" onChange={handleFileUpload} accept=".fit,.csv,image/*,.pdf" />
                                                    {uploadedFileUri ? (
                                                      <div className="space-y-4 animate-in zoom-in-95">
                                                         <div className="flex justify-center">
                                                            <div className="relative">
                                                              <div className="p-8 rounded-3xl bg-primary text-black shadow-2xl">
                                                                {uploadedFileName?.endsWith('.pdf') ? <FileText size={50} /> : <ImageIcon size={50}/>}
                                                              </div>
                                                              <Button variant="destructive" size="icon" className="absolute -top-4 -right-4 size-10 rounded-full shadow-2xl hover:scale-110" onClick={clearFile}><X size={20}/></Button>
                                                            </div>
                                                         </div>
                                                         <div className="space-y-1">
                                                            <p className="text-sm font-black uppercase italic text-primary tracking-widest">ARQUIVO CARREGADO</p>
                                                            <p className="text-xs text-muted-foreground truncate max-w-[300px] mx-auto italic font-bold opacity-60">{uploadedFileName}</p>
                                                         </div>
                                                      </div>
                                                    ) : (
                                                      <div className="space-y-8">
                                                          <div className="flex justify-center gap-8">
                                                              <div className="p-6 rounded-3xl bg-secondary/50 text-muted-foreground/30"><FileDigit size={40}/></div>
                                                              <div className="p-6 rounded-3xl bg-primary/20 text-primary animate-bounce shadow-xl"><Upload size={40}/></div>
                                                              <div className="p-6 rounded-3xl bg-secondary/50 text-muted-foreground/30"><ImageIcon size={40}/></div>
                                                          </div>
                                                          <div>
                                                              <p className="text-lg font-black uppercase italic tracking-[0.3em] text-white">CIÊNCIA DE DADOS</p>
                                                              <p className="text-[11px] text-muted-foreground mt-3 uppercase italic font-bold tracking-widest">CLIQUE PARA IMPORTAR TREINO REALIZADO</p>
                                                          </div>
                                                      </div>
                                                    )}
                                                </div>
                                            </div>

                                            <Button 
                                                className="w-full bg-primary text-black font-black uppercase h-20 tracking-[0.2em] text-xl shadow-2xl shadow-primary/20 rounded-3xl transition-all hover:scale-[1.02] hover:bg-white italic"
                                                disabled={analyzing || !athleteFeedback.trim()}
                                                onClick={handleFinalizeAnalysis}
                                            >
                                                {analyzing ? <><Loader2 className="mr-4 size-7 animate-spin" /> PROCESSANDO LABORATÓRIO...</> : 'FINALIZAR SESSÃO'}
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
    <div className="flex items-center gap-6 p-8 rounded-[2rem] bg-black/40 border border-white/5 group hover:border-primary/30 transition-all shadow-xl">
      <div className={cn(
        "size-16 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl transition-transform group-hover:scale-110",
        color === "primary" ? "bg-primary text-black" : "bg-secondary text-muted-foreground"
      )}>
        <Icon size={32} />
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] italic">{label}</p>
        <p className="text-3xl font-black uppercase italic text-white tracking-tighter leading-none">{value}</p>
      </div>
    </div>
  );
}

function MetricBoxDetail({ label, value, unit, highlight = 'default' }: { label: string, value: string, unit?: string, highlight?: 'default' | 'primary' | 'destructive' }) {
    return (
        <div className="bg-black/40 border border-white/5 p-6 rounded-[1.5rem] text-center space-y-3 group transition-all hover:bg-secondary/20 shadow-lg">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] italic">{label}</p>
            <p className={cn(
                "text-2xl md:text-3xl font-black italic uppercase tracking-tighter leading-none",
                highlight === 'primary' ? 'text-primary' : highlight === 'destructive' ? 'text-rose-500' : 'text-white'
            )}>
                {value} {unit && <span className="text-[11px] font-bold lowercase opacity-30 ml-1">{unit}</span>}
            </p>
        </div>
    );
}
