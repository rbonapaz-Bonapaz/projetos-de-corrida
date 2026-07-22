"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  BarChart3,
  Dna,
  Loader2,
  Activity
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
        toast({ title: "COROS sincronizado", description: "Métricas reais extraídas do .FIT." });
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
      toast({ title: "Análise concluída", description: "Métricas extraídas com sucesso no servidor." });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro na IA", description: "Não foi possível processar este arquivo." });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <DashboardLayout>
      <header className="mb-6">
        <h1 className="text-2xl md:text-[26px] font-bold tracking-tight flex items-center gap-2.5">
          <Activity className="size-6 text-primary" /> Evolução
        </h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Analisador biomecânico — extração profunda de arquivos de treino via IA.
        </p>
      </header>

      <div className="bento">
        <section className="card-plain span-4 h-fit">
          <h3 className="eyebrow">Entrada de dados</h3>
          <p className="text-[12px] text-muted-foreground mt-1 mb-4">Suporta .FIT, .CSV ou print do treino</p>

          <div
            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all relative ${
              file ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/30'
            }`}
          >
            <div className="size-11 rounded-xl bg-secondary flex items-center justify-center mb-3">
              {file ? <CheckCircle2 className="size-5 text-primary" /> : <Upload className="size-5 text-muted-foreground" />}
            </div>
            {file ? (
              <div className="text-center">
                <div className="font-semibold text-[12px] truncate max-w-[180px]">{file.name}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{(file.size / 1024).toFixed(1)} KB</div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-[13px] font-semibold">Solte o arquivo</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">ou clique para navegar</div>
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
            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-[11px] font-semibold text-primary">
                <span>Processando no servidor…</span>
                <span className="num">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-1.5 rounded-full overflow-hidden" />
            </div>
          )}

          <Button
            className="w-full h-11 rounded-xl mt-4 gap-2"
            disabled={!file || analyzing}
            onClick={startAnalysis}
          >
            {analyzing ? <Loader2 className="animate-spin size-4" /> : <>Iniciar extração <ArrowRight className="size-4" /></>}
          </Button>
        </section>

        <div className="span-8 flex flex-col gap-5">
          {!results && !analyzing && (
            <div className="card-plain border-dashed py-20 text-center flex flex-col items-center">
              <Dna className="size-14 text-muted-foreground/30 mb-4" />
              <h3 className="font-bold text-muted-foreground/60">Aguardando telemetria</h3>
              <p className="text-[12px] text-muted-foreground/50 max-w-sm mt-2">
                Envie um arquivo de treino contendo métricas avançadas para iniciar a análise biomecânica no backend.
              </p>
            </div>
          )}

          {results && (
            <>
              <section className="card-plain">
                <div className="flex items-center justify-between">
                  <h3 className="eyebrow flex items-center gap-1.5">
                    <BarChart3 className="size-3.5 text-primary" /> Diagnóstico técnico
                  </h3>
                  <Badge className="text-[10px]">Eficiência ativa</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2.5 mt-4">
                  <div className="metric-tile">
                    <small>Pace médio</small>
                    <b>{results.actualMetrics.averagePace}</b>
                  </div>
                  <div className="metric-tile">
                    <small>Cadência</small>
                    <b>{results.actualMetrics.averageCadence}</b>
                  </div>
                  <div className="metric-tile">
                    <small>Razão passada</small>
                    <b className="!text-primary">{results.actualMetrics.strideRatio}%</b>
                  </div>
                </div>
              </section>

              <div className="bento">
                <div className="span-6 card-plain space-y-3" style={{ background: "hsl(var(--accent-soft))" }}>
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary"><CheckCircle2 size={16} /></div>
                    <h4 className="eyebrow !text-primary">Resumo do coach</h4>
                  </div>
                  <p className="text-[13px] leading-relaxed">{results.analysisSummary.summary}</p>
                </div>

                <div className="span-6 card-plain space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500"><AlertCircle size={16} /></div>
                    <h4 className="eyebrow">Ajuste de técnica</h4>
                  </div>
                  <p className="text-[13px] font-medium leading-relaxed">{results.recommendations}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {results.areasOfImprovement.map((area: string, i: number) => (
                      <span key={i} className="tag">{area}</span>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
