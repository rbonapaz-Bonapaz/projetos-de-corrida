"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  BarChart3,
  Dna,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { analyzeWorkoutAction } from "@/ai/actions";
import { TrainingContext } from "@/contexts/TrainingContext";
import { useToast } from "@/hooks/use-toast";
import { fileToDataURI } from "@/lib/utils";
import { parseFitFile, fitSummaryToText } from "@/lib/fit-parser";

export default function AnalysisPage() {
  const context = React.useContext(TrainingContext);
  const { toast } = useToast();
  
  const [file, setFile] = React.useState<File | null>(null);
  const [fileUri, setFileUri] = React.useState<string | null>(null);
  const [deviceData, setDeviceData] = React.useState<string | null>(null);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [results, setResults] = React.useState<any | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    const name = selectedFile.name.toLowerCase();
    setFile(selectedFile);
    setFileUri(null);
    setDeviceData(null);
    try {
      if (name.endsWith('.fit')) {
        const buffer = await selectedFile.arrayBuffer();
        const summary = await parseFitFile(buffer);
        setDeviceData(fitSummaryToText(summary));
        toast({ title: "COROS Sincronizado", description: "Métricas reais extraídas do .FIT." });
      } else if (name.endsWith('.csv') || name.endsWith('.txt')) {
        const text = await selectedFile.text();
        setDeviceData(`Conteúdo do arquivo ${selectedFile.name}:\n${text.slice(0, 4000)}`);
      } else {
        const uri = await fileToDataURI(selectedFile);
        setFileUri(uri);
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro ao ler arquivo", description: err?.message });
      setFile(null);
    }
  };

  const startAnalysis = async () => {
    setAnalyzing(true);
    setProgress(10);
    
    try {
      const interval = setInterval(() => {
        setProgress(prev => (prev < 90 ? prev + 5 : prev));
      }, 500);

      const profileContext = context?.activeProfile ? JSON.stringify(context.activeProfile) : "Perfil não detalhado.";
      const anamnesisContext = context?.getAnamnesisSummary() || "Dados clínicos não fornecidos.";

      // Uso da Server Action
      const output = await analyzeWorkoutAction({
        prescribedWorkout: "Análise avulsa de arquivo biomecânico.",
        athleteFeedback: "Análise técnica de desempenho via arquivo de sensores.",
        athleteProfile: profileContext,
        anamnesis: anamnesisContext,
        deviceData: deviceData || undefined,
        fileDataUri: fileUri || undefined
      });

      clearInterval(interval);
      setProgress(100);
      setResults(output);
      toast({ title: "Análise Concluída", description: "Métricas extraídas com sucesso no servidor." });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro na IA", description: "Não foi possível processar este arquivo." });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
        <header>
          <h1 className="text-3xl font-headline font-black uppercase italic tracking-tighter text-white">Analisador <span className="text-primary">Biomecânico</span></h1>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest italic opacity-60">Laboratório de extração profunda via Server Action.</p>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1 bg-card/40 border-border/50 shadow-2xl h-fit rounded-3xl overflow-hidden">
            <CardHeader className="bg-secondary/10 border-b border-border/10 p-8">
              <CardTitle className="font-headline text-lg uppercase italic font-black text-white">Entrada de Dados</CardTitle>
              <CardDescription className="text-[10px] uppercase font-bold italic tracking-widest">Suporta .FIT, .CSV ou print do treino</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div 
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all relative ${
                  file ? 'border-primary bg-primary/5' : 'border-border/40 hover:border-primary/50'
                }`}
              >
                <div className="size-12 rounded-2xl bg-secondary flex items-center justify-center mb-4 shadow-xl">
                  {file ? <CheckCircle2 className="size-6 text-primary" /> : <Upload className="size-6 text-muted-foreground" />}
                </div>
                {file ? (
                  <div className="text-center">
                    <div className="font-black italic text-xs truncate max-w-[150px] uppercase">{file.name}</div>
                    <div className="text-[10px] font-bold text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-[10px] font-black uppercase italic tracking-widest text-white">Solte o arquivo</div>
                    <div className="text-[9px] text-muted-foreground font-bold uppercase">ou clique para navegar</div>
                  </div>
                )}
                <input 
                  type="file" 
                  accept=".fit,.csv,image/*" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={handleFileChange}
                  disabled={analyzing}
                />
              </div>

              {analyzing && (
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase italic text-primary tracking-widest">
                    <span>Processando no Servidor...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2 bg-black/40 rounded-full overflow-hidden" />
                </div>
              )}

              <Button 
                className="w-full h-14 bg-primary text-black font-black uppercase italic tracking-widest rounded-2xl shadow-xl hover:bg-white transition-all" 
                disabled={!file || analyzing}
                onClick={startAnalysis}
              >
                {analyzing ? <Loader2 className="animate-spin size-5" /> : "INICIAR EXTRAÇÃO"}
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            {!results && !analyzing && (
              <Card className="bg-secondary/10 border-border/30 border-dashed border-2 rounded-[2.5rem] p-20 text-center flex flex-col items-center">
                <Dna className="size-16 text-muted-foreground/20 mb-6 animate-pulse" />
                <h3 className="font-headline text-xl font-black uppercase italic text-muted-foreground/40 tracking-tighter">Aguardando Telemetria</h3>
                <p className="text-[10px] font-bold text-muted-foreground/30 max-w-sm mt-4 uppercase tracking-[0.2em] italic">
                  Envie um arquivo de treino contendo métricas avançadas para iniciar a análise biomecânica segura no backend.
                </p>
              </Card>
            )}

            {results && (
              <div className="grid gap-6 animate-in slide-in-from-right-10 duration-700">
                <Card className="bg-card/40 border-border/50 shadow-2xl rounded-3xl overflow-hidden">
                  <CardHeader className="bg-primary/10 border-b border-border/10 p-8">
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-headline flex items-center gap-3 text-white italic font-black uppercase">
                        <BarChart3 className="size-6 text-primary" /> Diagnóstico Técnico
                      </CardTitle>
                      <Badge className="bg-primary text-black font-black italic uppercase text-[10px] px-4 h-7 shadow-lg">EFICIÊNCIA ATIVA</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-10">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                      <div className="space-y-2">
                        <div className="text-[10px] text-muted-foreground uppercase font-black italic tracking-widest opacity-60">Pace Médio</div>
                        <div className="text-3xl font-headline font-black italic text-white leading-none">{results.actualMetrics.averagePace}</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-[10px] text-muted-foreground uppercase font-black italic tracking-widest opacity-60">Cadência</div>
                        <div className="text-3xl font-headline font-black italic text-white leading-none">{results.actualMetrics.averageCadence}</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-[10px] text-muted-foreground uppercase font-black italic tracking-widest opacity-60">Razão Passada</div>
                        <div className="text-3xl font-headline font-black italic text-primary leading-none">{results.actualMetrics.strideRatio}%</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <Card className="bg-primary/5 border-primary/20 shadow-xl rounded-3xl p-8 space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><CheckCircle2 size={20}/></div>
                        <h4 className="font-black italic uppercase text-xs text-white tracking-widest">Resumo do Coach</h4>
                      </div>
                      <p className="text-sm italic font-bold text-muted-foreground leading-relaxed">
                        {results.analysisSummary.summary}
                      </p>
                   </Card>

                   <Card className="bg-orange-500/5 border-orange-500/20 shadow-xl rounded-3xl p-8 space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500"><AlertCircle size={20}/></div>
                        <h4 className="font-black italic uppercase text-xs text-white tracking-widest">Ajuste de Técnica</h4>
                      </div>
                      <p className="text-sm italic font-black text-white leading-relaxed">
                        "{results.recommendations}"
                      </p>
                      <div className="pt-4 flex flex-wrap gap-2">
                         {results.areasOfImprovement.map((area: string, i: number) => (
                           <Badge key={i} variant="outline" className="border-white/10 text-[9px] font-black uppercase italic text-muted-foreground">{area}</Badge>
                         ))}
                      </div>
                   </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
