"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip, 
  XAxis, 
  YAxis 
} from "recharts";
import { 
  Activity, 
  TrendingUp, 
  Clock, 
  Milestone, 
  ArrowUpRight, 
  ArrowRight,
  Zap,
  Calendar,
  Info
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TrainingContext } from "@/contexts/TrainingContext";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const chartData = [
  { day: "Dom", previsto: 0, real: 0 },
  { day: "Seg", previsto: 5, real: 4.8 },
  { day: "Ter", previsto: 8, real: 8.2 },
  { day: "Qua", previsto: 0, real: 0 },
  { day: "Qui", previsto: 12, real: 11.5 },
  { day: "Sex", previsto: 6, real: 7.0 },
  { day: "Sáb", previsto: 22, real: 22.4 },
];

export default function Home() {
  const context = React.useContext(TrainingContext);
  const profile = context?.activeProfile;
  const plan = context?.trainingPlan;

  const stats = [
    { 
      label: "Volume Semanal", 
      value: "86.7 KM", 
      change: "+4.2%", 
      icon: Milestone,
      description: "Quilômetros totais nos últimos 7 dias."
    },
    { 
      label: "VDOT Atual", 
      value: profile?.vo2Max?.toString() || "54.2", 
      change: "+0.8", 
      icon: Zap,
      description: "Performance baseada no modelo de Jack Daniels."
    },
    { 
      label: "FC Média", 
      value: "142 BPM", 
      change: "-2.1%", 
      icon: Activity,
      description: "Média de batimentos durante as sessões."
    },
    { 
      label: "Recuperação", 
      value: "88%", 
      change: "Ideal", 
      icon: Clock,
      description: "Prontidão para o próximo estímulo de carga."
    },
  ];

  return (
    <DashboardLayout>
      <TooltipProvider>
        <div className="space-y-12 animate-in fade-in duration-700">
          {/* Header Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <Card key={stat.label} className="bg-card/40 border-white/5 hover:border-primary/40 transition-all duration-300 shadow-2xl relative overflow-hidden group rounded-2xl">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                  <stat.icon className="h-12 w-12" />
                </div>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-[10px] font-black uppercase italic tracking-widest text-muted-foreground/60">
                      {stat.label}
                    </CardTitle>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="size-3 text-muted-foreground/30 cursor-help hover:text-primary transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-popover border-border text-[9px] font-bold uppercase italic tracking-wider">
                        {stat.description}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-headline font-black uppercase italic tracking-tighter text-white">{stat.value}</div>
                  <p className={cn(
                    "text-[10px] font-black uppercase italic tracking-widest mt-1 flex items-center",
                    stat.change.startsWith("+") || stat.change === "Ideal" ? "text-primary" : "text-rose-500"
                  )}>
                    {stat.change}
                    <ArrowUpRight className="ml-1 h-3 w-3" />
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Volume Chart */}
            <Card className="lg:col-span-2 bg-card/40 border-white/5 shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader className="p-8 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="font-headline font-black uppercase italic text-3xl tracking-tighter text-white flex items-center gap-3">
                      <TrendingUp size={24} className="text-primary" /> PROGRESSÃO DE VOLUME
                    </CardTitle>
                    <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 italic">Previsto vs. Realizado (KM)</CardDescription>
                  </div>
                  <Badge variant="outline" className="border-primary/20 text-primary font-black italic uppercase text-[10px] px-3 py-1">Semana Atual</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="h-[380px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="day" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={10} 
                        fontWeight="bold"
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(v) => v.toUpperCase()}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={10} 
                        fontWeight="bold"
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'rgba(10, 12, 16, 0.95)', borderColor: 'rgba(255,255,255,0.05)', borderRadius: '1rem', backdropFilter: 'blur(10px)' }}
                        itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase' }}
                      />
                      <Area 
                        name="REALIZADO" 
                        type="monotone" 
                        dataKey="real" 
                        stroke="hsl(var(--primary))" 
                        fillOpacity={1} 
                        fill="url(#colorReal)" 
                        strokeWidth={4} 
                      />
                      <Area 
                        name="PLANEJADO" 
                        type="monotone" 
                        dataKey="previsto" 
                        stroke="white" 
                        strokeOpacity={0.2}
                        strokeDasharray="8 8" 
                        fill="transparent" 
                        strokeWidth={2} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Next Session & Quick Actions */}
            <div className="space-y-8">
              <Card className="bg-card/40 border-white/5 shadow-2xl rounded-3xl overflow-hidden flex flex-col h-full">
                <CardHeader className="p-8">
                  <CardTitle className="font-headline font-black uppercase italic text-xl tracking-tight text-white flex items-center gap-2">
                    <Zap size={20} className="text-primary" /> PRÓXIMA SESSÃO
                  </CardTitle>
                  <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 italic">Sincronizado na Nuvem</CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8 flex-1 flex flex-col">
                  {plan ? (
                     <div className="p-6 rounded-2xl bg-secondary/30 border border-white/5 space-y-4 flex-1">
                        <div className="flex items-center gap-2 text-primary font-black italic uppercase text-xs tracking-widest">
                          <Calendar className="size-4" />
                          <span>{plan.weeklyPlans[0]?.runs[0]?.day || 'HOJE'}</span>
                        </div>
                        <h3 className="font-headline text-2xl font-black uppercase italic tracking-tighter text-white">
                          {plan.weeklyPlans[0]?.runs[0]?.type || 'DESCANSO ATIVO'}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed italic font-medium opacity-80">
                          "{plan.weeklyPlans[0]?.runs[0]?.description || 'Recupere as fibras para o próximo estímulo de elite.'}"
                        </p>
                        <div className="pt-4 flex gap-2">
                          <Badge className="bg-primary text-black font-black italic uppercase text-[9px] tracking-widest px-3">
                            {plan.blockType}
                          </Badge>
                          <Badge variant="outline" className="border-white/10 text-white font-black italic uppercase text-[9px] tracking-widest px-3">
                            {plan.weeklyPlans[0]?.runs[0]?.distance}
                          </Badge>
                        </div>
                      </div>
                  ) : (
                    <div className="text-center py-10 space-y-6 flex-1 flex flex-col justify-center">
                      <p className="text-xs text-muted-foreground italic font-medium uppercase tracking-widest">Inicie seu ciclo no perfil</p>
                      <Button asChild variant="outline" className="w-full h-12 border-primary/20 text-primary font-black uppercase italic rounded-xl hover:bg-primary hover:text-black">
                        <Link href="/profile">CONFIGURAR PERFORMANCE</Link>
                      </Button>
                    </div>
                  )}
                  <div className="pt-8">
                    <Button asChild className="w-full h-14 bg-white text-black font-black uppercase italic tracking-widest rounded-2xl shadow-xl hover:bg-primary transition-all">
                      <Link href="/training">VER PLANILHA COMPLETA <ArrowRight className="ml-2 size-5" /></Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </DashboardLayout>
  );
}
