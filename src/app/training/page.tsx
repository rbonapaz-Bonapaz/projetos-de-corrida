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
  ArrowRight
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
import { cn, fileToDataURI } from '@/lib/utils';
import type { Workout, TrainingPlan, AthleteProfile } from "@/lib/types";
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

  const sortedWorkouts = React.useMemo(() => {
    if (!plan) return [];
    return plan.weeklyPlans.flatMap(week => week.runs).sort((a, b) => {
      return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
    });
  }, [plan]);

  const handleGenerate = async () => {
    if (!profile) {
      toast({ variant: "destructive", title: "Perfil Incompleto", description: "Configure seus dados em 'Meus Dados' primeiro." });
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
    toast({ title: "🧠 Gemini Coach está analisando...", description: "Processando arquivos e feedbacks." });

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
        analysis: {
          actualMetrics: result.actualMetrics,
          analysisSummary: result.analysisSummary.summary + "\n\n" + result.analysisSummary.technicalReview,
          recommendations: result.recommendations,
          areasOfImprovement: result.areasOfImprovement
        }
      };
      
      context?.updateWorkout(selectedWorkout.id, updatedWorkout);
      setSelectedWorkout(updatedWorkout as any);
      setUploadedFileUri(null);
      setUploadedFileName(null);
      setAthleteFeedback("");
      toast({ title: "✅ Treino Registrado!", description: "Sua análise de elite está pronta." });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: "Erro na análise", description: "Verifique sua conexão e chave de API." });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExportPDF = () => {
    if (!plan) return;
    toast({ title: "Gerando PDF...", description: "Preparando versão otimizada para impressão." });
    window.print();
  };

  return (
    <DashboardLayout>
      <TooltipProvider>
        <div className="space-y-6 md:space-y-8 max-w-5xl mx-auto pb-20 print:p-0">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2 print:hidden">
            <div>
              <h1 className="text-3xl md:text-5xl font-headline font-black uppercase italic tracking-tighter">
                <span className="text-white">MEU</span> <span className="text-primary">PLANO</span>
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-1 font-bold uppercase tracking-widest italic">
                {syncLoading ? "SINCRONIZANDO LABORATÓRIO..." : "PLANILHA INTELIGENTE DE ALTA PERFORMANCE"}
              </p>
            </div>
            <div className="flex gap-2">
              {plan && (
                <Button 
                  onClick={handleExportPDF}
                  variant="outline"
                  className="border-primary/30 text-primary h-12 px-6 font-black uppercase tracking-widest text-[10px] italic rounded-xl"
                >
                  <FileDown className="mr-2 size-4" /> Exportar PDF
                </Button>
              )}
              <Button 
                onClick={handleGenerate} 
                disabled={localLoading || !profile}
                className="bg-primary text-black hover:bg-primary/90 min-w-[180px] h-12 font-black uppercase tracking-widest text-[10px] italic rounded-xl shadow-lg shadow-primary/10"
              >
                {localLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
                {plan ? "RECALIBRAR CICLO" : "GERAR MEU CICLO"}
              </Button>
            </div>
          </header>

          {!plan && !syncLoading && (
            <Card className="mx-2 border-primary/20 bg-primary/5 p-20 text-center rounded-3xl shadow-lg border-2 border-dashed print:hidden">
              <CardContent className="flex flex-col items-center space-y-6">
                  <div className="p-6 rounded-full bg-primary/10 animate-pulse">
                      <CalendarDays className="h-12 w-12 text-primary" />
                  </div>
                  <div className="space-y-2">
                      <h2 className="text-2xl font-black uppercase italic">Sem Plano Ativo</h2>
                      <p className="text-muted-foreground max-w-xs mx-auto">Sincronize ou gere sua planilha personalizada no seu perfil para começar.</p>
                  </div>
                  <Button asChild size="lg" className="h-14 px-8 font-black uppercase tracking-widest bg-primary text-black rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-105">
                      <Link href="/profile">CONFIGURAR MEU CICLO</Link>
                  </Button>
              </CardContent>
            </Card>
          )}

          {plan && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500 px-2 print:hidden">
              {sortedWorkouts.map((w: Workout) => (
                <Card 
                  key={w.id} 
                  className={cn(
                      "group cursor-pointer transition-all hover:border-primary/50 relative overflow-hidden rounded-2xl border-2",
                      w.completed ? "bg-secondary/20 opacity-80 border-border" : "bg-card border-primary/5 shadow-2xl"
                  )}
                  onClick={() => setSelectedWorkout(w)}
                >
                  {w.completed && (
                      <div className="absolute top-3 right-3">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                  )}
                  <CardHeader className="pb-2">
                      <p className="text-[10px] font-black uppercase text-primary tracking-widest italic">{w.day}</p>
                      <CardTitle className="font-headline text-2xl italic uppercase font-black truncate text-white">{w.type}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <p className="text-[11px] text-muted-foreground line-clamp-2 italic leading-relaxed font-bold">"{w.description}"</p>
                      <div className="flex gap-2">
                          <Badge variant="secondary" className="bg-primary/20 text-primary border-none font-black italic uppercase text-[10px]">{w.distance}</Badge>
                          <Badge variant="outline" className="font-black border-border/50 italic uppercase text-[10px]">{w.paceZone}</Badge>
                      </div>
                  </CardContent>
                  <CardFooter className="pt-0 border-t border-border/10 mt-2 flex justify-between items-center group-hover:bg-primary/5 transition-colors h-12">
                      <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest italic">Ver Detalhes Técnicos</span>
                      <ChevronRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          <Dialog open={!!selectedWorkout} onOpenChange={(open) => !open && setSelectedWorkout(null)}>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar border-primary/20 bg-background rounded-[2rem] p-0 overflow-hidden shadow-2xl">
                  {selectedWorkout && (
                      <div className="flex flex-col">
                          <div className="p-8 space-y-2 bg-gradient-to-b from-secondary/30 to-background border-b border-border/50">
                              <p className="text-[11px] font-black uppercase text-primary tracking-[0.2em] italic">{selectedWorkout.day}</p>
                              <h2 className="font-headline text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-white leading-none">
                                {selectedWorkout.type}
                              </h2>
                          </div>

                          <div className="p-8 space-y-8">
                            <Tabs defaultValue={selectedWorkout.completed ? "feedback" : "prescrito"} className="w-full">
                                <TabsList className="grid w-full grid-cols-2 bg-secondary/30 h-14 p-1 rounded-2xl gap-2">
                                    <TabsTrigger value="prescrito" className="font-black text-xs uppercase italic data-[state=active]:bg-primary data-[state=active]:text-black rounded-xl transition-all">PRESCRIÇÃO</TabsTrigger>
                                    <TabsTrigger value="feedback" className="font-black text-xs uppercase italic data-[state=active]:bg-primary data-[state=active]:text-black rounded-xl transition-all">
                                        {selectedWorkout.completed ? 'ANÁLISE DO COACH' : 'REGISTRAR'}
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="prescrito" className="space-y-8 pt-8">
                                    <div className="p-6 rounded-2xl bg-secondary/20 border-l-4 border-primary space-y-3">
                                        <h4 className="text-[10px] font-black uppercase text-primary tracking-[0.2em] italic">OBJETIVO TÉCNICO</h4>
                                        <p className="text-base italic font-bold leading-relaxed text-white">"{selectedWorkout.description}"</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <MetricBoxElite icon={Route} label="DISTÂNCIA" value={selectedWorkout.distance} />
                                        <MetricBoxElite icon={Clock} label="ZONA" value={selectedWorkout.paceZone} color="primary" />
                                    </div>

                                    {selectedWorkout.phases && selectedWorkout.phases.length > 0 && (
                                      <div className="space-y-4">
                                        <h4 className="text-xs font-black uppercase text-white italic tracking-widest">DIVISÃO POR FASES</h4>
                                        <div className="grid gap-3">
                                          {selectedWorkout.phases.map((phase, idx) => (
                                            <div key={idx} className="flex gap-4 p-5 rounded-2xl bg-black/40 border border-border/50 hover:border-primary/20 transition-all group">
                                              <div className="size-10 rounded-xl bg-secondary flex items-center justify-center shrink-0 text-primary font-black italic">
                                                {idx + 1}
                                              </div>
                                              <div className="space-y-1 flex-1">
                                                <div className="flex justify-between items-center">
                                                  <span className="text-xs font-black uppercase italic text-white">{phase.name}</span>
                                                  <span className="text-[10px] font-bold text-primary">{phase.distance}</span>
                                                </div>
                                                <p className="text-[11px] text-muted-foreground leading-snug italic">{phase.description}</p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="feedback" className="pt-8 space-y-8">
                                    {selectedWorkout.completed && selectedWorkout.analysis ? (
                                        <div className="space-y-8">
                                            <div className="grid grid-cols-3 gap-3">
                                                <MetricBoxDetail label="Pace Médio" value={selectedWorkout.analysis.actualMetrics?.averagePace || '--'} unit="min/km" />
                                                <MetricBoxDetail label="Cadência" value={selectedWorkout.analysis.actualMetrics?.averageCadence || '--'} unit="ppm" />
                                                <MetricBoxDetail 
                                                    label="Razão Passada" 
                                                    value={selectedWorkout.analysis.actualMetrics?.strideRatio ? `${selectedWorkout.analysis.actualMetrics.strideRatio}%` : '--'} 
                                                    highlight={Number(selectedWorkout.analysis.actualMetrics?.strideRatio) > 11 ? 'destructive' : 'primary'}
                                                />
                                            </div>

                                            <div className="space-y-4">
                                                <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 space-y-4">
                                                    <div className="flex items-center gap-3 text-primary"><BrainCircuit size={20}/><h4 className="text-sm font-black uppercase italic tracking-widest">DIAGNÓSTICO DO COACH IA</h4></div>
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap italic font-bold text-muted-foreground">{selectedWorkout.analysis.analysisSummary}</p>
                                                </div>
                                                
                                                <div className="p-6 rounded-2xl bg-accent/5 border border-accent/20 space-y-4">
                                                    <div className="flex items-center gap-3 text-accent"><Zap size={20}/><h4 className="text-sm font-black uppercase italic tracking-widest">RECOMENDAÇÕES DE PERFORMANCE</h4></div>
                                                    <p className="text-sm leading-relaxed text-white font-black italic">"{selectedWorkout.analysis.recommendations}"</p>
                                                </div>
                                            </div>

                                            <Button className="w-full bg-primary text-black font-black uppercase h-16 gap-3 rounded-2xl transition-all hover:scale-[1.02] text-sm italic" onClick={() => router.push('/coach')}>
                                                <MessageSquare size={20}/> CONSULTAR COACH NO CHAT
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-8">
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black uppercase text-muted-foreground italic tracking-widest">RELATO SUBJETIVO DO ATLETA</label>
                                                <Textarea 
                                                    placeholder="Como foi o treino? Senti pernas pesadas, ritmo fluiu bem..." 
                                                    className="bg-secondary/10 min-h-[150px] font-bold rounded-2xl border-border/50 italic text-sm p-6"
                                                    value={athleteFeedback}
                                                    onChange={(e) => setAthleteFeedback(e.target.value)}
                                                />
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2">
                                                  <label className="text-[10px] font-black uppercase text-muted-foreground italic tracking-widest">EVIDÊNCIA TÉCNICA</label>
                                                  <Tooltip><TooltipTrigger asChild><Info className="size-3 text-muted-foreground cursor-help opacity-50" /></TooltipTrigger><TooltipContent><p className="max-w-xs text-[10px]">Envie arquivo .FIT, print do Strava ou Garmin.</p></TooltipContent></Tooltip>
                                                </div>
                                                <div 
                                                    className={cn(
                                                      "border-2 border-dashed rounded-[2rem] p-12 text-center space-y-6 cursor-pointer transition-all",
                                                      uploadedFileUri ? "border-primary bg-primary/10" : "border-border/50 hover:bg-secondary/20"
                                                    )}
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    <input type="file" ref={fileInputRef} className="sr-only" onChange={handleFileUpload} accept=".fit,.csv,image/*,.pdf" />
                                                    {uploadedFileUri ? (
                                                      <div className="space-y-3 animate-in zoom-in-95">
                                                         <div className="flex justify-center">
                                                            <div className="relative">
                                                              <div className="p-6 rounded-2xl bg-primary text-black shadow-2xl">
                                                                {uploadedFileName?.endsWith('.pdf') ? <FileText size={40} /> : <ImageIcon size={40}/>}
                                                              </div>
                                                              <Button variant="destructive" size="icon" className="absolute -top-3 -right-3 size-8 rounded-full shadow-2xl" onClick={clearFile}><X size={16}/></Button>
                                                            </div>
                                                         </div>
                                                         <div>
                                                            <p className="text-xs font-black uppercase italic text-primary">ARQUIVO PRONTO</p>
                                                            <p className="text-[10px] text-muted-foreground truncate max-w-[250px] mx-auto italic font-bold">{uploadedFileName}</p>
                                                         </div>
                                                      </div>
                                                    ) : (
                                                      <div className="space-y-6">
                                                          <div className="flex justify-center gap-6">
                                                              <div className="p-4 rounded-2xl bg-secondary/50 text-muted-foreground"><FileDigit size={32}/></div>
                                                              <div className="p-4 rounded-2xl bg-primary/20 text-primary animate-bounce"><Upload size={32}/></div>
                                                              <div className="p-4 rounded-2xl bg-secondary/50 text-muted-foreground"><ImageIcon size={32}/></div>
                                                          </div>
                                                          <div>
                                                              <p className="text-sm font-black uppercase italic tracking-[0.2em] text-white">IMPORTAR DADOS SENSORES</p>
                                                              <p className="text-[10px] text-muted-foreground mt-2 uppercase italic font-bold">PDF, .FIT OU PRINT DE TREINO</p>
                                                          </div>
                                                      </div>
                                                    )}
                                                </div>
                                            </div>

                                            <Button 
                                                className="w-full bg-primary text-black font-black uppercase h-16 tracking-widest text-lg shadow-2xl shadow-primary/20 rounded-2xl transition-all hover:scale-[1.02] italic"
                                                disabled={analyzing || !athleteFeedback.trim()}
                                                onClick={handleFinalizeAnalysis}
                                            >
                                                {analyzing ? <><Loader2 className="mr-3 h-6 w-6 animate-spin" /> PROCESSANDO...</> : 'REGISTRAR E ANALISAR'}
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
    <div className="flex items-center gap-5 p-6 rounded-2xl bg-black/30 border border-border/50 group hover:border-primary/30 transition-all">
      <div className={cn(
        "size-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
        color === "primary" ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
      )}>
        <Icon size={28} />
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest italic">{label}</p>
        <p className="text-2xl font-black uppercase italic text-white tracking-tighter">{value}</p>
      </div>
    </div>
  );
}

function MetricBoxDetail({ label, value, unit, highlight = 'default' }: { label: string, value: string, unit?: string, highlight?: 'default' | 'primary' | 'destructive' }) {
    return (
        <div className="bg-secondary/10 border border-border/50 p-5 rounded-2xl text-center space-y-2 group transition-all hover:bg-secondary/20">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest italic">{label}</p>
            <p className={cn(
                "text-lg md:text-xl font-black italic uppercase tracking-tighter leading-none",
                highlight === 'primary' ? 'text-primary' : highlight === 'destructive' ? 'text-rose-500' : 'text-white'
            )}>
                {value} {unit && <span className="text-[10px] font-bold lowercase opacity-40">{unit}</span>}
            </p>
        </div>
    );
}