
"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Dumbbell, 
  Activity, 
  Info, 
  Zap, 
  Timer, 
  TrendingUp, 
  MessageSquare, 
  RefreshCw, 
  Footprints,
  Brain
} from "lucide-react";

export default function DictionaryPage() {
  return (
    <div className="min-h-screen bg-background running-bg-gradient pb-20">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl font-bold text-primary mb-2 flex items-center justify-center sm:justify-start gap-3">
            <BookOpen className="w-8 h-8" />
            Dicionário do Corredor
          </h1>
          <p className="text-muted-foreground">Entenda os termos, treinos e conceitos essenciais para sua evolução.</p>
        </header>

        <Tabs defaultValue="treinos" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full bg-secondary/30 h-auto p-1 rounded-xl border border-border/20">
            <TabsTrigger value="treinos" className="flex flex-col items-center gap-1 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-tight data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded-lg">
              <Dumbbell className="w-4 h-4" />
              Treinos
            </TabsTrigger>
            <TabsTrigger value="zonas" className="flex flex-col items-center gap-1 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-tight data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded-lg">
              <Activity className="w-4 h-4" />
              Zonas Performance
            </TabsTrigger>
            <TabsTrigger value="conceitos" className="flex flex-col items-center gap-1 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-tight data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded-lg">
              <Info className="w-4 h-4" />
              Conceitos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="treinos" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <TrainingCard 
                title="Rodagem (Easy Run)" 
                desc="Construção da base aeróbica. O ritmo deve permitir conversar normalmente sem perder o fôlego."
                icon={<Activity className="text-green-500" />}
              />
              <TrainingCard 
                title="Longão (LSD)" 
                desc="Ensina o corpo a utilizar gordura como combustível e fortalece a resistência mental."
                icon={<Timer className="text-blue-500" />}
              />
              <TrainingCard 
                title="Intervalado (Tiros)" 
                desc="Melhora o VO2 Máx e a velocidade. Picos de esforço intenso seguidos por descanso."
                icon={<Zap className="text-yellow-500" />}
              />
              <TrainingCard 
                title="Fartlek" 
                desc="Jogo de velocidade. Alternância de ritmos variados (lento e rápido) sem descanso fixo, guiado pelo feeling."
                icon={<Zap className="text-purple-500" />}
              />
              <TrainingCard 
                title="Tempo Run (Limiar)" 
                desc="Corrida firme no limite do lactato. Ensina a sustentar altas velocidades por mais tempo."
                icon={<Zap className="text-orange-500" />}
              />
              <TrainingCard 
                title="Progressivo" 
                desc="Começa leve e acelera gradualmente. Excelente para treinar o final de provas e controle de ritmo."
                icon={<TrendingUp className="text-indigo-500" />}
              />
              <TrainingCard 
                title="Regenerativo" 
                desc="Corrida muito leve para ajudar na recuperação muscular após dias de grande intensidade."
                icon={<RefreshCw className="text-emerald-500" />}
              />
              <TrainingCard 
                title="Subidas" 
                desc="Fortalecimento de pernas e melhora da mecânica. Aumenta a potência e previne lesões."
                icon={<TrendingUp className="text-red-500" />}
              />
              <TrainingCard 
                title="Educativos (Drills)" 
                desc="Exercícios focados na melhora da técnica, postura e eficiência da biomecânica da corrida."
                icon={<Footprints className="text-amber-500" />}
              />
              <TrainingCard 
                title="Striders" 
                desc="Acelerações curtas de 80-100m para trabalhar a mecânica e o giro das pernas após rodagens."
                icon={<Zap className="text-pink-500" />}
              />
              <TrainingCard 
                title="Treino de Força" 
                desc="Musculação ou funcional. Pilar essencial para prevenir lesões e sustentar a carga de treinos."
                icon={<Dumbbell className="text-slate-500" />}
              />
              <TrainingCard 
                title="Run/Walk (Galloway)" 
                desc="Método de intercalar corrida e caminhada para ganhar volume com segurança e menor fadiga."
                icon={<Brain className="text-cyan-500" />}
              />
            </div>
          </TabsContent>

          <TabsContent value="zonas" className="space-y-8">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle>Zonas de Performance</CardTitle>
                <CardDescription>Entenda como as zonas de Pace e Frequência Cardíaca (BPM) guiam seus treinos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <ZoneItem color="bg-cyan-400" label="Z1 - Recuperação" title="Até 80% do Limiar" desc="Foco em recuperação ativa. BPM baixo, esforço mínimo, ideal para o dia seguinte a provas." />
                  <ZoneItem color="bg-emerald-500" label="Z2 - Base" title="81% a 90% do Limiar" desc="Resistência aeróbica. Onde se constrói o 'motor' e a queima de gordura é otimizada." />
                  <ZoneItem color="bg-yellow-400" label="Z3 - Potência" title="91% a 95% do Limiar" desc="Ritmo de Maratona. Corrida firme e controlada, exige concentração no ritmo." />
                  <ZoneItem color="bg-orange-400" label="Z4 - Limiar" title="96% a 102% do Limiar" desc="Limiar de Lactato. O ponto de maior eficiência fisiológica para sustentar esforço prolongado." />
                  <ZoneItem color="bg-orange-600" label="Z5 - Anaeróbica" title="103% a 106% do Limiar" desc="Intervalados longos. Esforço alto, respiração ofegante, trabalha a tolerância ao lactato." />
                  <ZoneItem color="bg-red-500" label="Z6 - VO2 Máx" title="Acima de 107% do Limiar" desc="Esforço máximo. Sprints e tiros muito curtos para ganho de velocidade pura." />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conceitos" className="space-y-12">
            <ConceptSection title="Ritmo e Estratégia">
              <ConceptItem term="Pace de Limiar (T-Pace)" desc="O ritmo âncora para todos os cálculos. É a sua velocidade crítica onde o corpo ainda consegue limpar o lactato." />
              <ConceptItem term="Pace" desc="Métrica principal de velocidade expressa em minutos por quilômetro (min/km)." />
              <ConceptItem term="Negative Split" desc="Correr a segunda metade de uma prova ou treino mais rápido que a primeira metade." />
              <ConceptItem term="Economia de Corrida" desc="A eficiência com que o seu corpo utiliza o oxigênio em um determinado ritmo." />
            </ConceptSection>

            <ConceptSection title="Fisiologia">
              <ConceptItem term="Limiar de Lactato" desc="Intensidade de esforço onde o lactato começa a se acumular no sangue mais rápido do que pode ser removido." />
              <ConceptItem term="VO2 Máx" desc="A capacidade máxima do seu motor em captar, transportar e utilizar oxigênio." />
              <ConceptItem term="Cadência" desc="Número de passos por minuto (SPM). Aumentar a cadência costuma reduzir o impacto nas articulações." />
              <ConceptItem term="RPE" desc="Percepção Subjetiva de Esforço (Escala de 1 a 10)." />
            </ConceptSection>

            <div className="mt-12 p-8 rounded-3xl bg-primary/10 border-2 border-primary/20 text-center space-y-4">
              <div className="bg-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto text-white shadow-lg">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-primary uppercase tracking-tight">Consultoria de Performance</h3>
              <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Transforme sua teoria em prática com um plano de treino baseado no seu limiar real e objetivos.
              </p>
              <Button asChild className="h-14 px-8 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20">
                <a href="https://wa.me/5555996265753" target="_blank" rel="noopener noreferrer">
                  SOLICITAR PLANO AGORA
                </a>
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <Footer />
      </main>
    </div>
  );
}

function TrainingCard({ title, desc, icon }: { title: string, desc: string, icon: React.ReactNode }) {
  return (
    <Card className="border-border/50 hover:border-primary/20 transition-colors bg-card shadow-sm">
      <CardHeader className="pb-2 p-4">
        <CardTitle className="text-sm flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </CardContent>
    </Card>
  );
}

function ZoneItem({ color, label, title, desc }: { color: string, label: string, title: string, desc: string }) {
  return (
    <div className="flex gap-4 p-4 rounded-xl border border-border/50 bg-secondary/10">
      <div className={`w-3 rounded-full ${color} shrink-0`} />
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-tight">{label}</p>
        <p className="font-bold text-sm text-primary">{title}</p>
        <p className="text-xs text-muted-foreground leading-tight">{desc}</p>
      </div>
    </div>
  );
}

function ConceptSection({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold text-primary uppercase tracking-widest border-b border-border/50 pb-2">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {children}
      </div>
    </div>
  );
}

function ConceptItem({ term, desc }: { term: string, desc: string }) {
  return (
    <div className="space-y-1 p-4 rounded-xl bg-secondary/20 border border-border/30">
      <p className="font-bold text-sm">{term}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}
