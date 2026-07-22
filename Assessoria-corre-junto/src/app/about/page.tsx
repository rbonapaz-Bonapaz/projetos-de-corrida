"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Bot,
  Activity,
  MessageSquare,
  ArrowRight,
  Calculator,
  BookOpen,
  Trophy,
  Database,
  FileCode,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Bot,
    color: "text-primary bg-primary/10",
    title: "Motor de periodização IA",
    desc: "Geração de ciclos completos (base, construção e polimento) a partir do seu VDOT, FC limiar e disponibilidade real — incluindo a lógica de evitar treinos intensos após o dia de perna.",
  },
  {
    icon: Activity,
    color: "text-destructive bg-destructive/10",
    title: "Laboratório biomecânico",
    desc: "Extração de métricas a partir de arquivos .FIT e .CSV. Analisamos cadência, tempo de contato e razão de passada para identificar desperdício de energia.",
  },
  {
    icon: MessageSquare,
    color: "text-orange-400 bg-orange-500/10",
    title: "Coach contextual",
    desc: "Um treinador que conhece seu plano e sua biometria. Suporta análise visual: envie um print do Strava ou Garmin e ele interpreta os dados na hora.",
  },
  {
    icon: Calculator,
    color: "text-sky-400 bg-sky-500/10",
    title: "Central de cálculos",
    desc: "Pace, previsão de Riegel, estratégia de prova com parciais km a km, hidratação com eletrólitos e conversor de esteira calibrado.",
  },
  {
    icon: BookOpen,
    color: "text-amber-400 bg-amber-500/10",
    title: "Dicionário do corredor",
    desc: "Base de conhecimento com explicações técnicas sobre tipos de treino, zonas de frequência cardíaca e conceitos como VO2 máx e taper.",
  },
  {
    icon: Trophy,
    color: "text-purple-400 bg-purple-500/10",
    title: "Cofre de recordes",
    desc: "Gestão histórica de marcas pessoais e conquistas. Monitore distância total acumulada e evolução de nível.",
  },
];

export default function AboutPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-10">
        <header className="text-center max-w-2xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            O universo <span className="text-primary">CorreJunto</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-3">
            Combinamos inteligência artificial com a ciência clássica do esporte para criar o ambiente completo do atleta.
          </p>
        </header>

        <div className="bento">
          {features.map((f, i) => (
            <div key={i} className="card-plain span-4">
              <div className={cn("size-11 rounded-xl flex items-center justify-center mb-4", f.color)}>
                <f.icon size={22} />
              </div>
              <h3 className="font-bold text-[15px] tracking-tight">{f.title}</h3>
              <p className="text-muted-foreground text-[12.5px] leading-relaxed mt-2">{f.desc}</p>
            </div>
          ))}
        </div>

        <section className="card-plain">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-5">
              <h2 className="text-xl font-bold tracking-tight leading-snug">
                Privacidade e <span className="text-primary">portabilidade de dados</span>
              </h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Database size={18} className="text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-[13px]">Processamento local</h4>
                    <p className="text-[12px] text-muted-foreground leading-relaxed mt-0.5">
                      Seus dados biométricos e chaves de API ficam salvos no seu navegador. Não armazenamos suas informações em servidores externos.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <FileCode size={18} className="text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-[13px]">Backup em JSON</h4>
                    <p className="text-[12px] text-muted-foreground leading-relaxed mt-0.5">
                      Exporte todo o seu histórico e planos para um arquivo JSON e importe em qualquer outro dispositivo.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="metric-tile !py-5">
                <b className="!text-primary !text-2xl">VDOT</b>
                <small className="mt-1.5 block leading-tight normal-case font-medium text-[10px]">Cálculos baseados em Jack Daniels</small>
              </div>
              <div className="metric-tile !py-5">
                <b className="!text-primary !text-2xl">L2</b>
                <small className="mt-1.5 block leading-tight normal-case font-medium text-[10px]">Zonas por limiar de lactato</small>
              </div>
              <div className="metric-tile !py-5">
                <b className="!text-primary !text-2xl">OCR</b>
                <small className="mt-1.5 block leading-tight normal-case font-medium text-[10px]">Interpretação de prints de treino</small>
              </div>
              <div className="metric-tile !py-5">
                <b className="!text-primary !text-2xl">FIT</b>
                <small className="mt-1.5 block leading-tight normal-case font-medium text-[10px]">Parsing de arquivos de sensores</small>
              </div>
            </div>
          </div>
        </section>

        <section className="card-plain text-center !bg-primary !text-primary-foreground space-y-4 py-10">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            Transforme seus dados em performance
          </h2>
          <p className="text-sm max-w-xl mx-auto opacity-90">
            O CorreJunto não é apenas uma planilha — é um laboratório de performance no seu bolso.
          </p>
          <Button asChild size="lg" className="!bg-background !text-foreground hover:opacity-90 rounded-full px-8 h-12">
            <Link href="/profile" className="flex items-center gap-2">
              Iniciar meu ciclo agora <ArrowRight className="size-4" />
            </Link>
          </Button>
        </section>
      </div>
    </DashboardLayout>
  );
}
