"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  Heart,
  Brain,
  Zap,
  Target,
  Clock,
  Dumbbell,
  Milestone,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

const trainingTerms = [
  { term: "Regenerativo", def: "Corrida extremamente leve (Z1) para ajudar na circulação e recuperação muscular após sessões intensas. Se houver qualquer esforço, está rápido demais." },
  { term: "Rodagem (easy run)", def: "É o \"arroz com feijão\" do treino. O objetivo é construir sua base aeróbica. O ritmo deve ser leve o suficiente para você conseguir conversar normalmente." },
  { term: "Progressivo", def: "Treino que começa em ritmo leve e termina em ritmo de prova ou superior. Ótimo para controle de pacing e simulação de final de prova." },
  { term: "Fartlek", def: "Do sueco \"brincar de correr\". Alternar ritmos usando o ambiente como referência, sem a pressão de tempos fixos. Excelente para desenvolver percepção de esforço (RPE)." },
  { term: "Tempo run (limiar)", def: "Ritmo \"confortavelmente difícil\". Intensidade mantida no limiar de lactato (L2). Ensina o corpo a remover o lactato do sangue enquanto corre em velocidade firme." },
  { term: "Subidas (hill repeats)", def: "A musculação específica do corredor. Melhora a potência mecânica, a postura de corrida e previne lesões por fortalecer a cadeia posterior." },
  { term: "Intervalado (tiros)", def: "Picos de esforço intenso (VO2 máx) seguidos por descanso. É o treino que aumenta sua velocidade máxima e melhora a eficiência cardiovascular." },
  { term: "Longão (LSD)", def: "O treino mais longo da semana. Foco no \"tempo de pé\". Ensina o corpo a oxidar gordura como combustível e prepara a mente para a fadiga acumulada." },
  { term: "Estratégico (simulado)", def: "Sessão desenhada para replicar as condições da prova alvo. Foco em pacing, nutrição e mentalidade de competição." },
  { term: "Descanso (off)", def: "O treino mais importante. O momento em que o corpo absorve o estímulo e reconstrói as fibras musculares (supercompensação)." },
];

const hrZones = [
  { z: "Z1", label: "Recuperação", percent: "Até 85% do L2", effort: "2-3/10", talkTest: "Conversa fluída e sem pausas.", focus: "Regeneração ativa e aquecimento.", color: "bg-sky-500", textColor: "text-sky-400" },
  { z: "Z2", label: "Resistência aeróbica", percent: "85-89% do L2", effort: "4-5/10", talkTest: "Consegue falar frases completas.", focus: "Base aeróbica e queima de gordura.", color: "bg-primary", textColor: "text-primary" },
  { z: "Z3", label: "Moderado / ritmo", percent: "90-94% do L2", effort: "6-7/10", talkTest: "Consegue falar apenas frases curtas.", focus: "Eficiência cardiovascular e ritmo de maratona.", color: "bg-amber-500", textColor: "text-amber-400" },
  { z: "Z4", label: "Limiar de lactato", percent: "95-100% do L2", effort: "8-9/10", talkTest: "Quase impossível falar; palavras isoladas.", focus: "Aumentar a velocidade sustentável (T-pace).", color: "bg-orange-500", textColor: "text-orange-400" },
  { z: "Z5", label: "Máxima / VO2 máx", percent: "> 100% do L2", effort: "10/10", talkTest: "Impossível falar.", focus: "Capacidade anaeróbica e potência máxima.", color: "bg-rose-500", textColor: "text-rose-400" },
];

const concepts = [
  { title: "VO2 máx", icon: Zap, desc: "Indica o teto aeróbico. É o volume máximo de oxigênio que seu corpo consegue captar, transportar e utilizar para gerar energia durante o exercício intenso." },
  { title: "VDOT", icon: Target, desc: "Fórmula desenvolvida por Jack Daniels que traduz o desempenho de uma prova recente em um único valor, permitindo prescrever ritmos exatos para cada tipo de treino." },
  { title: "Taper", icon: Dumbbell, desc: "Fase de polimento. Uma redução estratégica e gradual do volume de treino nas semanas que antecedem a prova, visando a supercompensação e recuperação total." },
  { title: "Cadência", icon: Activity, desc: "Frequência de passos por minuto (SPM). Manter uma cadência próxima a 180 ajuda a reduzir o tempo de contato com o solo e o impacto, aumentando a eficiência biomecânica." },
  { title: "Drop", icon: Milestone, desc: "A diferença de altura entre a base do calcanhar e a frente do tênis. Drops baixos favorecem a pisada com o médio-pé, enquanto drops altos são comuns em modelos de amortecimento clássico." },
  { title: "Limiar", icon: Clock, desc: "A intensidade máxima na qual o corpo ainda consegue remover o lactato produzido. Treinar nesta zona aumenta sua velocidade sustentável por longos períodos." },
];

export default function DictionaryPage() {
  return (
    <DashboardLayout>
      <header className="mb-6">
        <h1 className="text-2xl md:text-[26px] font-bold tracking-tight flex items-center gap-2.5">
          <BookOpen className="size-6 text-primary" /> Dicionário do corredor
        </h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Guia de termos, treinos e conceitos da corrida de alta performance.
        </p>
      </header>

      <Tabs defaultValue="treinos" className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto p-1.5 rounded-xl gap-1.5">
          <TabsTrigger value="treinos" className="py-2.5 text-[12px] font-semibold gap-2 rounded-lg">
            <Activity className="size-4" /> Treinos
          </TabsTrigger>
          <TabsTrigger value="zonas" className="py-2.5 text-[12px] font-semibold gap-2 rounded-lg">
            <Heart className="size-4" /> Zonas FC
          </TabsTrigger>
          <TabsTrigger value="conceitos" className="py-2.5 text-[12px] font-semibold gap-2 rounded-lg">
            <Brain className="size-4" /> Conceitos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="treinos" className="mt-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold tracking-tight">Tipos de treinamento</h2>
            <p className="text-muted-foreground text-[12.5px] mt-0.5">A finalidade técnica de cada sessão na sua planilha periodizada.</p>
          </div>
          <div className="bento">
            {trainingTerms.map((item, i) => (
              <div key={i} className="card-plain span-6">
                <h3 className="font-bold text-primary text-[13px]">{item.term}</h3>
                <p className="text-muted-foreground text-[12.5px] leading-relaxed mt-1.5">{item.def}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="zonas" className="mt-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold tracking-tight">Zonas de frequência cardíaca</h2>
            <p className="text-muted-foreground text-[12.5px] mt-0.5">Faixas de esforço baseadas no seu limiar de lactato (L2) e FC máxima.</p>
          </div>
          <div className="flex flex-col gap-3">
            {hrZones.map((item, i) => (
              <div key={i} className="card-plain relative overflow-hidden pl-6">
                <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", item.color)} />
                <h3 className="font-bold text-[13px] flex items-center gap-2 flex-wrap">
                  {item.z} — {item.label} <span className={cn("text-[11px] font-medium", item.textColor)}>({item.percent})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                  <div>
                    <span className="eyebrow">Esforço</span>
                    <p className="text-[12.5px] font-semibold mt-0.5">{item.effort}</p>
                  </div>
                  <div>
                    <span className="eyebrow">Teste da fala</span>
                    <p className="text-[12.5px] text-muted-foreground mt-0.5">{item.talkTest}</p>
                  </div>
                  <div>
                    <span className="eyebrow">Foco</span>
                    <p className="text-[12.5px] text-muted-foreground mt-0.5">{item.focus}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="conceitos" className="mt-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold tracking-tight">Conceitos fisiológicos</h2>
            <p className="text-muted-foreground text-[12.5px] mt-0.5">A ciência por trás do desempenho atlético.</p>
          </div>
          <div className="bento">
            {concepts.map((item, i) => (
              <div key={i} className="card-plain span-4 text-center flex flex-col items-center gap-3">
                <item.icon size={26} className="text-primary" />
                <h4 className="font-bold text-[13px] tracking-tight">{item.title}</h4>
                <p className="text-[11.5px] text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
