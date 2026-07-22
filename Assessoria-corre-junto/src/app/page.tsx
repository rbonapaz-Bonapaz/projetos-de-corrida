
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
  Info,
  Trophy,
  Timer,
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

  const [daysToRace, setDaysToRace] = React.useState<number | null>(null);
  const [recoveryPercent, setRecoveryPercent] = React.useState(82);

  React.useEffect(() => {
    if (profile?.raceDate) {
      const raceDate = new Date(profile.raceDate);
      const today = new Date();
      const diffTime = raceDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysToRace(diffDays > 0 ? diffDays : 0);
    }

    const timer = setInterval(() => {
      setRecoveryPercent(prev => (prev < 100 ? prev + 1 : 100));
    }, 120000); 

    return () => clearInterval(timer);
  }, [profile?.raceDate]);

  const getRecoveryStatus = (percent: number) => {
    if (percent <= 29) return { 
      label: "FADIGA AGUDA", 
      color: "text-rose-500", 
      dot: "bg-rose-500", 
      phase: "Fase 1",
      desc: "Exausto. Repouso absoluto necessário." 
    };
    if (percent <= 59) return { 
      label: "RECU. PARCIAL", 
      color: "text-orange-500", 
      dot: "bg-orange-500", 
      phase: "Fase 2",
      desc: "Recuperando. Apenas Regenerativos liberados." 
    };
    if (percent <= 89) return { 
      label: "PRONTIDÃO BOA", 
      color: "text-yellow-500", 
      dot: "bg-yellow-500", 
      phase: "Fase 3",
      desc: "Condicionado. Sinal verde para Base e Longões." 
    };
    return { 
      label: "PRONTIDÃO TOTAL", 
      color: "text-primary", 
      dot: "bg-primary", 
      phase: "Fase 4",
      desc: "Pico de Performance. Ideal para Intervalados." 
    };
  };

  const recoveryStatus = getRecoveryStatus(recoveryPercent);

  const stats = [
    { 
      label: "Volume Semanal", 
      value: "86.7 KM", 
      change: "+4.2%", 
      icon: Milestone,
      description: "Quilômetros totais nos últimos 7 dias.",
      color: "text-primary"
    },
    { 
      label: "VDOT Atual", 
      value: profile?.vo2Max?.toString() || "54.2", 
      change: "+0.8", 
      icon: Zap,
      description: "Performance baseada no modelo Jack Daniels.",
      color: "text-primary"
    },
    { 
      label: "FC Média", 
      value: "142 BPM", 
      change: "-2.1%", 
      icon: Activity,
      description: "Média de batimentos durante as sessões.",
      color: "text-primary"
    },
    { 
      label: "Recuperação", 
      value: `${recoveryPercent}%`, 
      change: recoveryStatus.label, 
      icon: Clock,
      description: recoveryStatus.desc,
      isRecovery: true,
      color: recoveryStatus.color
    },
  ];

  return (
    <DashboardLayout>
      <TooltipProvider>
        <div className="space-y-6 md:space-y-12 animate-in fade-in duration-700">
          
          {/* Stats Grid - 2 columns on mobile */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {stats.map((stat) => (
              <Card key={stat.label} className="bg-card/40 border-white/5 hover:border-primary/40 transition-all duration-300 shadow-2xl relative overflow-hidden group rounded-xl md:rounded-2xl">
                <div className="absolute top-0 right-0 p-2 md:p-4 opacity-5 md:opacity-10 group-hover:scale-125 transition-transform">
                  <stat.icon className="h-6 w-6 md:h-12 md:w-12" />
                </div>
                <CardHeader className="flex flex-row items-center justify-between pb-0.5 md:pb-2 space-y-0 px-3 md:px-4 pt-3 md:pt-4">
                  <div className="flex items-center gap-1 md:gap-2 min-w-0">
                    <CardTitle className="text-[7px] md:text-[10px] font-black uppercase italic tracking-widest text-muted-foreground/60 truncate">
                      {stat.label}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-3 md:px-4 pb-3 md:pb-4">
                  <div className="text-base md:text-3xl font-headline font-black uppercase italic tracking-tighter text-white">{stat.value}</div>
                  <div className={cn(
                    "text-[6px] md:text-[10px] font-black uppercase italic tracking-widest mt-0.5 md:mt-1 flex items-center gap-1 md:gap-1.5",
                    stat.color
                  )}>
                    {stat.isRecovery ? (
                      <div className="flex items-center gap-1 md:gap-1.5">
                        <div className={cn("size-1 md:size-1.5 rounded-full animate-pulse", recoveryStatus.dot)} />
                        <span>{stat.change}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span>{stat.change}</span>
                        <ArrowUpRight className="h-2 w-2 md:h-3 md:w-3" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 space-y-6 md:space-y-8">
              <Card className="bg-card/40 border-white/5 shadow-2xl rounded-2xl md:rounded-3xl overflow-hidden">
                <CardHeader className="p-4 md:p-8 border-b border-white/5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <CardTitle className="font-headline font-black uppercase italic text-lg md:text-3xl tracking-tighter text-white flex items-center gap-2 md:gap-3">
                        <TrendingUp size={18} className="text-primary md:size-6" /> PROGRESSÃO
                      </CardTitle>
                      <CardDescription className="text-[7px] md:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 italic truncate">Volume Semanal (KM)</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-2 md:p-8">
                  <div className="h-[180px] md:h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <XAxis 
                          dataKey="day" 
                          stroke="hsl(var(--muted-foreground))" 
                          fontSize={8} 
                          fontWeight="bold"
                          tickLine={false} 
                          axisLine={false} 
                          tickFormatter={(v) => v.toUpperCase()}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))" 
                          fontSize={8} 
                          fontWeight="bold" 
                          tickLine={false} 
                          axisLine={false} 
                        />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: 'rgba(10, 12, 16, 0.95)', border: 'none', borderRadius: '0.75rem' }}
                          itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold', fontSize: '9px' }}
                        />
                        <Area 
                          name="REAL" 
                          type="monotone" 
                          dataKey="real" 
                          stroke="hsl(var(--primary))" 
                          fill="hsl(var(--primary)/0.1)" 
                          strokeWidth={3} 
                        />
                        <Area 
                          name="ALVO" 
                          type="monotone" 
                          dataKey="previsto" 
                          stroke="white" 
                          strokeOpacity={0.1}
                          strokeDasharray="4 4" 
                          fill="transparent" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/40 border-white/5 shadow-2xl rounded-2xl md:rounded-3xl overflow-hidden">
                <CardHeader className="p-4 md:p-8 pb-2">
                  <CardTitle className="font-headline font-black uppercase italic text-lg md:text-2xl tracking-tighter text-white flex items-center gap-2 md:gap-3">
                    <Trophy size={18} className="text-primary md:size-6" /> CRONOGRAMA
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-8 pt-0">
                  {profile?.raceName ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 md:p-6 rounded-xl md:rounded-2xl bg-secondary/30 border border-white/5 group hover:border-primary/30 transition-all gap-3">
                        <div className="flex items-center gap-3 md:gap-6 min-w-0 flex-1">
                          <div className="size-10 md:size-14 rounded-lg md:rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shrink-0">
                            <Timer size={20} className="md:size-28" />
                          </div>
                          <div className="space-y-0.5 md:space-y-1 min-w-0 flex-1">
                            <h4 className="font-headline font-black uppercase italic text-white text-sm md:text-lg leading-none truncate">{profile.raceName}</h4>
                            <p className="text-[7px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 italic truncate">{profile.raceDistance} • {new Date(profile.raceDate).toLocaleDateString('pt-BR')}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xl md:text-3xl font-headline font-black uppercase italic tracking-tighter text-primary leading-none">{daysToRace}</p>
                          <p className="text-[7px] md:text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 italic">DIAS</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 md:py-10 border-2 border-dashed border-white/5 rounded-xl">
                       <p className="text-[8px] md:text-[10px] text-muted-foreground font-black uppercase italic tracking-widest">Nenhuma prova configurada</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6 md:space-y-8">
              <Card className="bg-card/40 border-white/5 shadow-2xl rounded-2xl md:rounded-3xl overflow-hidden flex flex-col h-full">
                <CardHeader className="p-4 md:p-8">
                  <CardTitle className="font-headline font-black uppercase italic text-lg md:text-xl tracking-tight text-white flex items-center gap-2">
                    <Zap size={18} className="text-primary md:size-20" /> PRÓXIMA SESSÃO
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 md:px-8 md:pb-8 flex-1 flex flex-col">
                  {plan ? (
                     <div className="p-4 md:p-6 rounded-xl md:rounded-2xl bg-secondary/30 border border-white/5 space-y-3 md:space-y-4 flex-1">
                        <div className="flex items-center gap-2 text-primary font-black italic uppercase text-[8px] md:text-[10px] tracking-widest">
                          <Calendar className="size-3 md:size-4" />
                          <span>{plan.weeklyPlans[0]?.runs[0]?.day.toUpperCase() || 'HOJE'}</span>
                        </div>
                        <h3 className="font-headline text-lg md:text-2xl font-black uppercase italic tracking-tighter text-white line-clamp-2 leading-none">
                          {plan.weeklyPlans[0]?.runs[0]?.type || 'DESCANSO (OFF)'}
                        </h3>
                        <div className="text-[9px] md:text-[11px] text-muted-foreground leading-relaxed italic font-medium opacity-80 line-clamp-3">
                          "{plan.weeklyPlans[0]?.runs[0]?.description || 'Recupere as fibras para o próximo estímulo.'}"
                        </div>
                      </div>
                  ) : (
                    <div className="text-center py-6 md:py-10 space-y-4 md:space-y-6 flex-1 flex flex-col justify-center">
                      <p className="text-[8px] md:text-[9px] text-muted-foreground italic font-medium uppercase tracking-widest">Inicie seu ciclo no perfil</p>
                    </div>
                  )}
                  <div className="pt-4 md:pt-8">
                    <Button asChild className="w-full h-11 md:h-14 bg-white text-black font-black uppercase italic rounded-xl md:rounded-2xl shadow-xl hover:bg-primary transition-all text-xs tracking-tight px-4 flex items-center justify-center">
                      <Link href="/training" className="flex items-center gap-2">
                        PLANILHA <ArrowRight className="size-3 md:size-4 shrink-0" />
                      </Link>
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
