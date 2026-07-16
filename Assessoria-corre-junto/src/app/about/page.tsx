"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Bot, 
  Activity, 
  MessageSquare, 
  Target, 
  Heart, 
  ShieldCheck, 
  Zap,
  ArrowRight,
  Calculator,
  BookOpen,
  Trophy,
  Database,
  FileCode
} from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
        <header className="text-center space-y-4">
            <h1 className="text-4xl md:text-6xl font-headline font-black uppercase italic text-white tracking-tighter">
                O UNIVERSO <span className="text-primary">CORREJUNTO</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-lg">
                Combinamos inteligência artificial de última geração com a ciência clássica do esporte para criar o ambiente definitivo para o atleta de elite.
            </p>
        </header>

        {/* Grid de Funcionalidades Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-card/40 border-border/50 p-8 hover:border-primary/30 transition-all group">
            <CardContent className="p-0 space-y-4">
              <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Bot size={28} />
              </div>
              <h3 className="text-xl font-headline font-black uppercase italic text-white tracking-tight leading-none">
                Motor de Periodização IA
              </h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Geração de ciclos completos (Base, Construção e Polimento) baseados no seu VDOT, FC Limiar e disponibilidade real, incluindo a inteligência de evitar treinos intensos após o "Leg Day".
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border/50 p-8 hover:border-primary/30 transition-all group">
            <CardContent className="p-0 space-y-4">
              <div className="size-12 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive group-hover:scale-110 transition-transform">
                <Activity size={28} />
              </div>
              <h3 className="text-xl font-headline font-black uppercase italic text-white tracking-tight leading-none">
                Laboratório Biomecânico
              </h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Extração profunda de métricas a partir de arquivos .FIT e .CSV. Analisamos Cadência, Tempo de Contato e a crítica "Razão de Passada" para identificar desperdício de energia.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border/50 p-8 hover:border-primary/30 transition-all group">
            <CardContent className="p-0 space-y-4">
              <div className="size-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                <MessageSquare size={28} />
              </div>
              <h3 className="text-xl font-headline font-black uppercase italic text-white tracking-tight leading-none">
                Coach Contextual Vision
              </h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Um treinador que conhece seu plano e biometria. Suporta análise visual: cole um print do Strava ou Garmin e ele interpretará os dados para ajustar seu treino na hora.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border/50 p-8 hover:border-primary/30 transition-all group">
            <CardContent className="p-0 space-y-4">
              <div className="size-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                <Calculator size={28} />
              </div>
              <h3 className="text-xl font-headline font-black uppercase italic text-white tracking-tight leading-none">
                Central de Cálculos Elite
              </h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Suíte completa com Calculadora de Pace, Previsão de Riegel, Estratégia de Prova com parciais KM a KM, Nutrição com cálculo de eletrólitos e conversor de esteira calibrado.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border/50 p-8 hover:border-primary/30 transition-all group">
            <CardContent className="p-0 space-y-4">
              <div className="size-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 group-hover:scale-110 transition-transform">
                <BookOpen size={28} />
              </div>
              <h3 className="text-xl font-headline font-black uppercase italic text-white tracking-tight leading-none">
                Dicionário do Corredor
              </h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Base de conhecimento integrada com explicações técnicas sobre tipos de treinos, zonas de frequência cardíaca e conceitos fisiológicos como VO2 Máx e Taper.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border/50 p-8 hover:border-primary/30 transition-all group">
            <CardContent className="p-0 space-y-4">
              <div className="size-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                <Trophy size={28} />
              </div>
              <h3 className="text-xl font-headline font-black uppercase italic text-white tracking-tight leading-none">
                Cofre de Recordes
              </h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Gestão histórica de marcas pessoais e conquistas. Monitore suas métricas vitalícias como distância total acumulada e evolução de nível do atleta.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Seção Diferencial Técnico */}
        <div className="bg-secondary/20 rounded-[2.5rem] p-8 md:p-12 border border-border/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                    <h2 className="text-3xl font-headline font-black uppercase italic text-white leading-tight">
                        PRIVACIDADE E <br/> <span className="text-primary">PORTABILIDADE DE DADOS</span>
                    </h2>
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="mt-1 text-primary"><Database size={20} /></div>
                            <div>
                                <h4 className="font-bold text-white text-sm uppercase">Processamento Local</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">Seus dados biométricos e API Keys são salvos exclusivamente no seu navegador. Nós não armazenamos suas informações em servidores externos.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="mt-1 text-primary"><FileCode size={20} /></div>
                            <div>
                                <h4 className="font-bold text-white text-sm uppercase">Backup JSON de Elite</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">Você tem controle total. Exporte todo o seu histórico e planos para um arquivo JSON e importe em qualquer outro dispositivo instantaneamente.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 rounded-3xl bg-black/40 border border-border/50 text-center space-y-2">
                        <div className="text-primary font-black text-2xl italic">VDOT</div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-tight">Cálculos baseados em Jack Daniels</p>
                    </div>
                    <div className="p-6 rounded-3xl bg-black/40 border border-border/50 text-center space-y-2">
                        <div className="text-primary font-black text-2xl italic">L2</div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-tight">Zonas por Limiar de Lactato</p>
                    </div>
                    <div className="p-6 rounded-3xl bg-black/40 border border-border/50 text-center space-y-2">
                        <div className="text-primary font-black text-2xl italic">OCR</div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-tight">Interpretação de Prints de Treino</p>
                    </div>
                    <div className="p-6 rounded-3xl bg-black/40 border border-border/50 text-center space-y-2">
                        <div className="text-primary font-black text-2xl italic">FIT</div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-tight">Parsing de Arquivos Binários de Sensores</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Banner Final de Conversão */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-accent p-8 md:p-16 text-black text-center space-y-6 shadow-2xl shadow-accent/20">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Zap size={200} />
          </div>
          <div className="absolute bottom-0 left-0 p-4 opacity-10">
            <Zap size={150} />
          </div>
          
          <h2 className="text-3xl md:text-5xl font-headline font-black uppercase italic tracking-tighter leading-none">
            TRANSFORME SEUS DADOS <br/> EM PERFORMANCE
          </h2>
          <p className="text-sm md:text-lg font-bold max-w-xl mx-auto leading-tight italic">
            O CorreJunto não é apenas uma planilha, é um laboratório de performance no seu bolso.
          </p>
          <div className="pt-4">
            <Button asChild size="lg" className="bg-black text-white hover:bg-black/80 font-black uppercase tracking-widest px-10 h-14 rounded-full text-sm shadow-xl">
              <Link href="/profile">INICIAR MEU CICLO AGORA <ArrowRight className="ml-2 size-5" /></Link>
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
