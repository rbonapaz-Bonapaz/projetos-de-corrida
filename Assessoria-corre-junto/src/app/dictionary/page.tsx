"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Activity, 
  Heart, 
  Brain,
  Zap,
  TrendingUp,
  Target,
  Clock,
  Dumbbell,
  Milestone
} from "lucide-react";
import { cn } from "@/lib/utils";

const trainingTerms = [
  { term: "RODAGEM (EASY RUN)", def: "É o \"arroz com feijão\" do treino. O objetivo é construir sua base aeróbica (seu motor). O ritmo deve ser leve o suficiente para você conseguir conversar normalmente. Ajuda a fortalecer articulações e queimar gordura de forma eficiente." },
  { term: "LONGÃO (LSD)", def: "O treino mais longo da semana. Foco no \"tempo de pé\". Ensina o corpo a oxidar gordura como combustível e prepara a mente para distâncias maiores e fadiga acumulada." },
  { term: "INTERVALADO (TIROS)", def: "Picos de esforço intenso (VO2 Máx) seguidos por descanso. É o treino que aumenta sua velocidade máxima e melhora a eficiência cardiovascular. Exige alta carga metabólica." },
  { term: "TEMPO RUN (LIMIAR)", def: "Ritmo \"confortavelmente difícil\". Intensidade mantida no limiar de lactato (L2). Ensina o corpo a remover o lactato do sangue enquanto corre em velocidade firme." },
  { term: "REGENERATIVO", def: "Corrida extremamente leve (Z1) para ajudar na circulação e recuperação muscular após sessões intensas. Se houver qualquer esforço, está rápido demais." },
  { term: "FARTLEK", def: "Do sueco \"brincar de correr\". Alternar ritmos usando o ambiente como referência, sem a pressão de tempos fixos. Excelente para desenvolver percepção de esforço (RPE)." },
  { term: "SUBIDAS (HILL REPEATS)", def: "A musculação específica do corredor. Melhora a potência mecânica, a postura de corrida e previne lesões por fortalecer a cadeia posterior." },
  { term: "PROGRESSIVO", def: "Treino que começa em ritmo leve e termina em ritmo de prova ou superior. Ótimo para controle de pacing e simulação de final de prova." },
  { term: "DESCANSO (OFF)", def: "O treino mais importante. O momento em que o corpo absorve o estímulo e reconstrói as fibras musculares (Supercompensação). Sem descanso, não há evolução." },
];

const hrZones = [
  {
    z: "Z1",
    label: "Recuperação",
    percent: "Até 85% do L2",
    effort: "2-3/10",
    talkTest: "Conversa fluída e sem pausas.",
    focus: "Regeneração ativa e aquecimento.",
    color: "bg-blue-500",
    textColor: "text-blue-400"
  },
  {
    z: "Z2",
    label: "Resistência Aeróbica",
    percent: "85-89% do L2",
    effort: "4-5/10",
    talkTest: "Consegue falar frases completas.",
    focus: "Base aeróbica e queima de gordura.",
    color: "bg-green-500",
    textColor: "text-green-400"
  },
  {
    z: "Z3",
    label: "Moderado / Ritmo",
    percent: "90-94% do L2",
    effort: "6-7/10",
    talkTest: "Consegue falar apenas frases curtas.",
    focus: "Eficiência cardiovascular e ritmo de maratona.",
    color: "bg-yellow-500",
    textColor: "text-yellow-400"
  },
  {
    z: "Z4",
    label: "Limiar de Lactato",
    percent: "95-100% do L2",
    effort: "8-9/10",
    talkTest: "Quase impossível falar; palavras isoladas.",
    focus: "Aumentar a velocidade sustentável (T-Pace).",
    color: "bg-orange-500",
    textColor: "text-orange-400"
  },
  {
    z: "Z5",
    label: "Máxima / VO2 Máx",
    percent: "> 100% do L2",
    effort: "10/10",
    talkTest: "Impossível falar.",
    focus: "Capacidade anaeróbica e potência máxima.",
    color: "bg-red-500",
    textColor: "text-red-400"
  }
];

export default function DictionaryPage() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
        <header className="space-y-2 px-2">
          <h1 className="text-3xl md:text-5xl font-headline font-black uppercase italic tracking-tighter">
            <span className="text-white">DICIONÁRIO DO</span> <span className="text-primary">CORREDOR</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-lg font-medium">
            Seu guia completo de termos, treinos e conceitos da corrida de alta performance.
          </p>
        </header>

        <Tabs defaultValue="treinos" className="w-full">
          <div className="px-2">
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 bg-secondary/20 p-1.5 rounded-xl h-auto gap-2">
              <TabsTrigger value="treinos" className="py-3 font-black text-[10px] md:text-xs uppercase italic gap-2">
                <Activity className="size-4 text-primary" /> Treinos
              </TabsTrigger>
              <TabsTrigger value="zonas" className="py-3 font-black text-[10px] md:text-xs uppercase italic gap-2">
                <Heart className="size-4" /> Zonas FC
              </TabsTrigger>
              <TabsTrigger value="conceitos" className="py-3 font-black text-[10px] md:text-xs uppercase italic gap-2">
                <Brain className="size-4" /> Conceitos
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="treinos" className="mt-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500 px-2">
            <div className="space-y-1">
              <h2 className="text-xl md:text-2xl font-headline font-black uppercase italic text-white">Tipos de Treinamento</h2>
              <p className="text-muted-foreground text-xs md:text-sm italic">A finalidade técnica de cada sessão na sua planilha periodizada.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trainingTerms.map((item, i) => (
                <Card key={i} className="bg-card/40 border-border/50 hover:border-primary/30 transition-all group shadow-lg">
                  <CardContent className="p-6 space-y-3">
                    <h3 className="font-headline font-black text-primary italic text-sm md:text-base tracking-tight uppercase">
                      {item.term}
                    </h3>
                    <p className="text-muted-foreground text-xs md:text-sm leading-relaxed font-medium">
                      {item.def}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="zonas" className="mt-8 px-2 animate-in fade-in">
             <div className="space-y-1 mb-8">
              <h2 className="text-xl md:text-2xl font-headline font-black uppercase italic text-white">ZONAS DE FREQUÊNCIA CARDÍACA</h2>
              <p className="text-muted-foreground text-xs md:text-sm italic">As faixas de esforço baseadas no seu Limiar de Lactato (L2) e FC Máxima.</p>
            </div>
            <div className="grid gap-4">
               {hrZones.map((item, i) => (
                 <Card key={i} className="bg-card/40 border-border/50 overflow-hidden relative">
                   <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", item.color)} />
                   <CardContent className="p-6">
                     <div className="mb-4">
                       <h3 className="font-black italic text-sm md:text-base text-white uppercase flex items-center gap-2">
                         {item.z} - {item.label} <span className={cn("text-[10px] md:text-xs opacity-70", item.textColor)}>({item.percent})</span>
                       </h3>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="space-y-1">
                         <span className="text-[9px] font-black uppercase text-muted-foreground block">Esforço:</span>
                         <span className="text-xs font-bold text-white">{item.effort}</span>
                       </div>
                       <div className="space-y-1">
                         <span className="text-[9px] font-black uppercase text-muted-foreground block">Teste da Fala:</span>
                         <span className="text-xs text-muted-foreground leading-tight block">{item.talkTest}</span>
                       </div>
                       <div className="space-y-1">
                         <span className="text-[9px] font-black uppercase text-muted-foreground block">Foco:</span>
                         <span className="text-xs text-muted-foreground leading-tight block">{item.focus}</span>
                       </div>
                     </div>
                   </CardContent>
                 </Card>
               ))}
            </div>
          </TabsContent>

          <TabsContent value="conceitos" className="mt-8 px-2 animate-in fade-in">
            <div className="space-y-1 mb-8">
              <h2 className="text-xl md:text-2xl font-headline font-black uppercase italic text-white">Conceitos Fisiológicos</h2>
              <p className="text-muted-foreground text-xs md:text-sm italic">A ciência por trás do desempenho atlético de elite.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {[
                 { title: "VO2 MÁX", icon: Zap, desc: "Indica o teto aeróbico. É o volume máximo de oxigênio que seu corpo consegue captar, transportar e utilizar para gerar energia durante o exercício intenso." },
                 { title: "VDOT", icon: Target, desc: "Fórmula desenvolvida por Jack Daniels que traduz o desempenho de uma prova recente em um único valor, permitindo prescrever ritmos exatos para cada tipo de treino." },
                 { title: "TAPER", icon: Dumbbell, desc: "Fase de polimento. Uma redução estratégica e gradual do volume de treino nas semanas que antecedem a prova, visando a supercompensação e recuperação total." },
                 { title: "CADÊNCIA", icon: Activity, desc: "Frequência de passos por minuto (SPM). Manter uma cadência próxima a 180 ajuda a reduzir o tempo de contato com o solo e o impacto, aumentando a eficiência biomecânica." },
                 { title: "DROP", icon: Milestone, desc: "A diferença de altura entre a base do calcanhar e a frente do tênis. Drops baixos favorecem a pisada com o médio-pé, enquanto drops altos são comuns em modelos de amortecimento clássico." },
                 { title: "LIMIAR", icon: Clock, desc: "A intensidade máxima na qual o corpo ainda consegue remover o lactato produzido. Treinar nesta zona aumenta sua velocidade sustentável por longos períodos." },
               ].map((item, i) => (
                 <Card key={i} className="bg-card/40 border-border/50 text-center group hover:bg-primary/5 transition-colors h-full">
                   <CardContent className="p-8 space-y-4 flex flex-col items-center">
                     <item.icon className="size-8 text-primary group-hover:scale-110 transition-transform" />
                     <h4 className="font-black italic text-white uppercase tracking-tight">{item.title}</h4>
                     <p className="text-[10px] text-muted-foreground leading-relaxed font-medium italic">{item.desc}</p>
                   </CardContent>
                 </Card>
               ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}