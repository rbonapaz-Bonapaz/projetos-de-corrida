"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  FileSearch, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  BarChart3,
  Dna
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AnalysisPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [results, setResults] = React.useState<any | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const startAnalysis = () => {
    setAnalyzing(true);
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 30;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setTimeout(() => {
          setAnalyzing(false);
          setResults({
            efficiency: "92%",
            cadence: "178 spm",
            groundContact: "215 ms",
            strideRatio: "7.8%",
            verticalOscillation: "8.2 cm"
          });
        }, 500);
      }
      setProgress(p);
    }, 400);
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
        <header>
          <h1 className="text-3xl font-headline font-bold">Analisador Biomecânico</h1>
          <p className="text-muted-foreground">Extraia métricas avançadas de eficiência de arquivos .FIT ou .CSV.</p>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1 bg-card border-border shadow-lg h-fit">
            <CardHeader>
              <CardTitle className="font-headline">Entrada de Dados</CardTitle>
              <CardDescription>Envie o arquivo do treino para inspeção profunda.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div 
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all ${
                  file ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'
                }`}
              >
                <div className="size-12 rounded-full bg-secondary flex items-center justify-center mb-4">
                  {file ? <CheckCircle2 className="size-6 text-accent" /> : <Upload className="size-6 text-muted-foreground" />}
                </div>
                {file ? (
                  <div className="text-center">
                    <div className="font-bold truncate max-w-[150px]">{file.name}</div>
                    <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="font-medium">Solte o arquivo aqui</div>
                    <div className="text-xs text-muted-foreground">ou clique para navegar</div>
                  </div>
                )}
                <input 
                  type="file" 
                  accept=".fit,.csv" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={handleFileChange}
                  disabled={analyzing}
                />
              </div>

              {analyzing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Extraindo dados dos sensores...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5 bg-secondary" />
                </div>
              )}

              <Button 
                className="w-full bg-primary hover:bg-primary/90" 
                disabled={!file || analyzing}
                onClick={startAnalysis}
              >
                {analyzing ? "Processando..." : "Iniciar Extração"}
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            {!results && !analyzing && (
              <Card className="bg-secondary/20 border-border border-dashed p-12 text-center flex flex-col items-center">
                <Dna className="size-12 text-muted-foreground/30 mb-4" />
                <h3 className="font-headline text-lg font-bold text-muted-foreground">Sem dados de análise</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-2">
                  Envie um arquivo de treino contendo métricas avançadas como tempo de contato com o solo e oscilação vertical.
                </p>
              </Card>
            )}

            {results && (
              <div className="grid gap-4 animate-in slide-in-from-right-4 duration-500">
                <Card className="bg-card border-border shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-headline flex items-center gap-2">
                        <BarChart3 className="size-5 text-accent" /> Score de Eficiência
                      </CardTitle>
                      <Badge className="bg-accent/20 text-accent border-accent/30">{results.efficiency}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Cadência</div>
                        <div className="text-xl font-headline font-bold">{results.cadence}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">TCS</div>
                        <div className="text-xl font-headline font-bold">{results.groundContact}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Razão de Passada</div>
                        <div className="text-xl font-headline font-bold">{results.strideRatio}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Oscilação Vert.</div>
                        <div className="text-xl font-headline font-bold">{results.verticalOscillation}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border shadow-md">
                  <CardHeader>
                    <CardTitle className="font-headline text-lg">Insights dos Sensores</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/30 border">
                      <div className="size-8 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
                        <CheckCircle2 className="size-5" />
                      </div>
                      <div className="text-sm">
                        <span className="font-bold block mb-1">Excelente Estabilidade de Cadência</span>
                        <p className="text-muted-foreground">Sua cadência permaneceu dentro de ±2 spm durante toda a sessão, indicando alta eficiência metabólica.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                      <div className="size-8 rounded-full bg-destructive/10 flex items-center justify-center text-destructive shrink-0">
                        <AlertCircle className="size-5" />
                      </div>
                      <div className="text-sm">
                        <span className="font-bold block mb-1">Assimetria de Contato com o Solo</span>
                        <p className="text-muted-foreground">Detectado desvio de 3.2% para o pé esquerdo nos últimos 3km. Possível fadiga ou desequilíbrio na cadeia posterior direita.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
