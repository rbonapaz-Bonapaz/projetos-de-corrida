
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn, fileToDataURI } from '@/lib/utils';
import type { Workout, TrainingPlan, AthleteProfile } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";

const dayOrder = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default function TrainingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const context = React.useContext(TrainingContext);
  const { user } = useUser();
  const firestore = useFirestore();

  // Conexão Direta: Carrega dados do Firestore baseados no usuário logado
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
    toast({ title: "🧠 Gemini Coach está analisando...", description: "Processando arquivos e orientações." });

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
              <h1 className="text-3xl md:text-4xl font-headline font-black uppercase italic tracking-tight">
                <span className="text-white">Meu</span> <span className="text-primary">Plano</span>
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-1 italic">
                {syncLoading ? "Sincronizando com a nuvem..." : "Sua planilha inteligente de alta performance."}
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
                {plan ? "Recalibrar Ciclo" : "Gerar Meu Ciclo"}
              </Button>
            </div>
          </header>

          {/* Versão para Impressão */}
          <div className="hidden print:block space-y-8 p-10 bg-white text-black min-h-screen">
            <div className="flex justify-between items-center border-b-4 border-black pb-4">
               <h1 className="text-4xl font-black italic uppercase">Planilha de Treino <span className="text-emerald-600">CorreJunto</span></h1>
               <div className="text-right">
                  <p className="text-sm font-bold uppercase">{profile?.name}</p>
                  <p className="text-xs">{profile?.raceName} | Alvo: {profile?.raceDate}</p>
               </div>
            </div>
            <div className="space-y-6">
                {plan?.weeklyPlans.map(week => (
                    <div key={week.weekNumber} className="border p-4 rounded-xl">
                        <h2 className="text-xl font-black uppercase italic border-b mb-3">Semana {week.weekNumber} - {week.focus}</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {week.runs.map(run => (
                                <div key={run.id} className="text-sm border-b pb-2">
                                    <p className="font-black uppercase">{run.day} - {run.type}</p>
                                    <p className="italic text-xs">{run.distance} @ {run.paceZone}</p>
                                    <p className="text-[10px] leading-tight mt-1">{run.description}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 text-[10px] italic">
                            <strong>Fortalecimento:</strong> {week.strength}
                        </div>
                    </div>
                ))}
            </div>
          </div>

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-500 px-2 print:hidden">
              {sortedWorkouts.map((w: Workout) => (
                <Card 
                  key={w.id} 
                  className={cn(
                      "group cursor-pointer transition-all hover:border-primary/50 relative overflow-hidden rounded-2xl",
                      w.completed ? "bg-secondary/20 opacity-80" : "bg-card border-primary/10 shadow-lg"
                  )}
                  onClick={() => setSelectedWorkout(w)}
                >
                  {w.completed && (
                      <div className="absolute top-3 right-3">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                  )}
                  <CardHeader className="pb-2">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{w.day}</p>
                      <CardTitle className="font-headline text-xl italic uppercase font-black truncate">{w.type}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <p className="text-xs text-muted-foreground line-clamp-2 italic leading-relaxed">"{w.description}"</p>
                      <div className="flex gap-2">
                          <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold">{w.distance}</Badge>
                          <Badge variant="outline" className="font-bold border-border/50">{w.paceZone}</Badge>
                      </div>
                  </CardContent>
                  <CardFooter className="pt-0 border-t border-border/10 mt-2 flex justify-between items-center group-hover:bg-primary/5 transition-colors">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase py-3">Ver Detalhes</span>
                      <ChevronRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          <Dialog open={!!selectedWorkout} onOpenChange={(open) => !open && setSelectedWorkout(null)}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar border-primary/20 bg-card rounded-3xl">
                  {selectedWorkout && (
                      <div className="space-y-6">
                          <DialogHeader>
                              <div className="flex justify-between items-start pr-8">
                                  <div>
                                      <p className="text-[10px] font-black uppercase text-primary tracking-widest">{selectedWorkout.day}</p>
                                      <DialogTitle className="font-headline text-3xl font-black uppercase italic">{selectedWorkout.type}</DialogTitle>
                                  </div>
                                  {selectedWorkout.completed && <Badge className="bg-emerald-500 text-white font-black uppercase italic">REALIZADO</Badge>}
                              </div>
                          </DialogHeader>

                          <Tabs defaultValue={selectedWorkout.completed ? "feedback" : "prescrito"} className="w-full">
                              <TabsList className="grid w-full grid-cols-2 bg-secondary/30 h-12 p-1 rounded-xl">
                                  <TabsTrigger value="prescrito" className="font-bold text-xs uppercase italic data-[state=active]:bg-primary data-[state=active]:text-black rounded-lg transition-all">Prescrição</TabsTrigger>
                                  <TabsTrigger value="feedback" className="font-bold text-xs uppercase italic data-[state=active]:bg-primary data-[state=active]:text-black rounded-lg transition-all">
                                      {selectedWorkout.completed ? 'Análise do Coach' : 'Registrar'}
                                  </TabsTrigger>
                              </TabsList>

                              <TabsContent value="prescrito" className="space-y-6 pt-4">
                                  <div className="p-4 rounded-xl bg-secondary/20 border-l-4 border-primary space-y-2">
                                      <h4 className="text-[10px] font-black uppercase text-primary tracking-widest">Objetivo Técnico</h4>
                                      <p className="text-sm italic leading-relaxed">"{selectedWorkout.description}"</p>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                      <div className="bg-background/50 border p-4 rounded-xl flex items-center gap-3">
                                          <div className="p-2 rounded-md bg-primary/10 text-primary"><Route size={20}/></div>
                                          <div><p className="text-[9px] font-bold text-muted-foreground uppercase leading-none">Distância</p><p className="text-lg font-black">{selectedWorkout.distance}</p></div>
                                      </div>
                                      <div className="bg-background/50 border p-4 rounded-xl flex items-center gap-3">
                                          <div className="p-2 rounded-md bg-primary/10 text-primary"><Clock size={20}/></div>
                                          <div><p className="text-[9px] font-bold text-muted-foreground uppercase leading-none">Zona</p><p className="text-lg font-black uppercase">{selectedWorkout.paceZone}</p></div>
                                      </div>
                                  </div>
                              </TabsContent>

                              <TabsContent value="feedback" className="pt-4 space-y-6">
                                  {selectedWorkout.completed && selectedWorkout.analysis ? (
                                      <div className="space-y-6">
                                          <div className="grid grid-cols-3 gap-2">
                                              <MetricBox label="Pace Médio" value={selectedWorkout.analysis.actualMetrics?.averagePace || '--'} unit="min/km" />
                                              <MetricBox label="Cadência" value={selectedWorkout.analysis.actualMetrics?.averageCadence || '--'} unit="ppm" tooltip="Passos por minuto. Ideal entre 170-190 para eficiência." />
                                              <MetricBox 
                                                  label="Razão Passada" 
                                                  value={selectedWorkout.analysis.actualMetrics?.strideRatio ? `${selectedWorkout.analysis.actualMetrics.strideRatio}%` : '--'} 
                                                  highlight={Number(selectedWorkout.analysis.actualMetrics?.strideRatio) > 11 ? 'destructive' : 'primary'}
                                                  tooltip="Relação entre oscilação vertical e comprimento da passada. Menos de 10% indica alta eficiência."
                                              />
                                          </div>

                                          <div className="space-y-4">
                                              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
                                                  <div className="flex items-center gap-2 text-primary"><BrainCircuit size={16}/><h4 className="text-xs font-black uppercase italic">Análise do Coach IA</h4></div>
                                                  <p className="text-sm leading-relaxed whitespace-pre-wrap italic text-muted-foreground">{selectedWorkout.analysis.analysisSummary}</p>
                                              </div>
                                              
                                              <div className="p-4 rounded-xl bg-accent/5 border border-accent/10 space-y-2">
                                                  <div className="flex items-center gap-2 text-accent"><Zap size={16}/><h4 className="text-xs font-black uppercase italic">Próximos Passos</h4></div>
                                                  <p className="text-sm leading-relaxed text-white font-medium italic">"{selectedWorkout.analysis.recommendations}"</p>
                                              </div>
                                          </div>

                                          <Button className="w-full bg-primary text-black font-black uppercase h-12 gap-2 rounded-xl transition-all hover:scale-105" onClick={() => router.push('/coach')}>
                                              <MessageSquare size={18}/> CONVERSAR COM O COACH
                                          </Button>
                                      </div>
                                  ) : (
                                      <div className="space-y-6">
                                          <div className="space-y-3">
                                              <label className="text-[10px] font-black uppercase text-muted-foreground italic">Como você se sentiu? (Feedback Subjetivo)</label>
                                              <Textarea 
                                                  placeholder="Ex: Treino forte, senti um pouco de cansaço no final. Ritmo encaixou bem." 
                                                  className="bg-secondary/10 min-h-[100px] font-medium rounded-xl border-border/50 italic"
                                                  value={athleteFeedback}
                                                  onChange={(e) => setAthleteFeedback(e.target.value)}
                                              />
                                          </div>

                                          <div className="space-y-3">
                                              <div className="flex items-center gap-2">
                                                <label className="text-[10px] font-black uppercase text-muted-foreground italic">Anexar Evidência ou Orientação</label>
                                                <Tooltip>
                                                  <TooltipTrigger asChild><Info className="size-3 text-muted-foreground cursor-help" /></TooltipTrigger>
                                                  <TooltipContent><p className="max-w-xs text-[10px]">Envie um arquivo .FIT do relógio, print do Strava ou um PDF com orientações do seu treinador/IA.</p></TooltipContent>
                                                </Tooltip>
                                              </div>
                                              <div 
                                                  className={cn(
                                                    "border-2 border-dashed rounded-2xl p-8 text-center space-y-4 cursor-pointer transition-all",
                                                    uploadedFileUri ? "border-primary bg-primary/10" : "border-primary/20 hover:bg-primary/5"
                                                  )}
                                                  onClick={() => fileInputRef.current?.click()}
                                              >
                                                  <input 
                                                    type="file" 
                                                    ref={fileInputRef} 
                                                    className="sr-only" 
                                                    onChange={handleFileUpload} 
                                                    accept=".fit,.csv,image/*,.pdf" 
                                                  />
                                                  {uploadedFileUri ? (
                                                    <div className="space-y-2 animate-in zoom-in-95">
                                                       <div className="flex justify-center">
                                                         <div className="relative">
                                                            <div className="p-4 rounded-full bg-primary text-black shadow-lg">
                                                              {uploadedFileName?.endsWith('.pdf') ? (
                                                                <FileText size={32} />
                                                              ) : uploadedFileName?.endsWith('.fit') || uploadedFileName?.endsWith('.csv') ? (
                                                                <FileDigit size={32}/>
                                                              ) : (
                                                                <ImageIcon size={32}/>
                                                              )}
                                                            </div>
                                                            <Button 
                                                              variant="destructive" 
                                                              size="icon" 
                                                              className="absolute -top-2 -right-2 size-6 rounded-full shadow-lg"
                                                              onClick={clearFile}
                                                            >
                                                              <X size={14}/>
                                                            </Button>
                                                         </div>
                                                       </div>
                                                       <div>
                                                          <p className="text-xs font-black uppercase italic text-primary">DOCUMENTO PRONTO</p>
                                                          <p className="text-[10px] text-muted-foreground truncate max-w-[200px] mx-auto italic">{uploadedFileName}</p>
                                                       </div>
                                                    </div>
                                                  ) : (
                                                    <>
                                                      <div className="flex justify-center gap-4">
                                                          <div className="p-3 rounded-full bg-secondary/50 text-muted-foreground"><FileText size={24}/></div>
                                                          <div className="p-3 rounded-full bg-primary/10 text-primary shadow-inner"><Upload size={24}/></div>
                                                          <div className="p-3 rounded-full bg-secondary/50 text-muted-foreground"><ImageIcon size={24}/></div>
                                                      </div>
                                                      <div>
                                                          <p className="text-xs font-black uppercase italic tracking-widest">Importar PDF, .FIT ou Print</p>
                                                          <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-tighter italic opacity-70">Analise treinos ou envie novas orientações</p>
                                                      </div>
                                                    </>
                                                  )}
                                              </div>
                                          </div>

                                          <Button 
                                              className="w-full bg-primary text-black font-black uppercase h-14 tracking-widest text-lg shadow-xl shadow-primary/20 rounded-xl transition-all hover:scale-105"
                                              disabled={analyzing || !athleteFeedback.trim()}
                                              onClick={handleFinalizeAnalysis}
                                          >
                                              {analyzing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> ANALISANDO...</> : 'FINALIZAR E ANALISAR'}
                                          </Button>
                                      </div>
                                  )}
                              </TabsContent>
                          </Tabs>
                      </div>
                  )}
              </DialogContent>
          </Dialog>
        </div>
      </TooltipProvider>
    </DashboardLayout>
  );
}

function MetricBox({ label, value, unit, highlight = 'default', tooltip }: { label: string, value: string, unit?: string, highlight?: 'default' | 'primary' | 'destructive', tooltip?: string }) {
    return (
        <div className="bg-secondary/10 border p-3 rounded-xl text-center space-y-1 relative group transition-colors hover:bg-secondary/20">
            <div className="flex items-center justify-center gap-1">
              <p className="text-[9px] font-bold text-muted-foreground uppercase leading-none italic">{label}</p>
              {tooltip && (
                <Tooltip>
                  <TooltipTrigger asChild><Info className="size-2 text-muted-foreground cursor-help opacity-50 hover:opacity-100" /></TooltipTrigger>
                  <TooltipContent className="bg-popover border-border"><p className="max-w-xs text-[9px] italic">{tooltip}</p></TooltipContent>
                </Tooltip>
              )}
            </div>
            <p className={cn(
                "text-sm md:text-base font-black italic uppercase tracking-tight",
                highlight === 'primary' ? 'text-primary' : highlight === 'destructive' ? 'text-rose-500' : 'text-foreground'
            )}>
                {value} {unit && <span className="text-[9px] font-normal opacity-50 lowercase">{unit}</span>}
            </p>
        </div>
    );
}
