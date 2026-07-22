"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Cell
} from "recharts";
import { 
  Zap, 
  Activity,
  Heart,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TrainingContext } from "@/contexts/TrainingContext";

const ZONE_COLORS = [
  "#22d3ee", "#22c55e", "#facc15", "#f97316", "#ea580c", "#ef4444",
];

export default function CalculatorsPage() {
  const context = React.useContext(TrainingContext);
  const profile = context?.activeProfile;

  const [zLTHR, setZLTHR] = React.useState("165");
  const [zTPace, setZTPace] = React.useState("04:47");

  React.useEffect(() => {
    if (profile) {
      const pLTHR = profile.thresholdHr?.toString();
      const pTPace = profile.thresholdPace;
      
      if (pLTHR && pLTHR !== zLTHR) setZLTHR(pLTHR);
      if (pTPace && pTPace !== zTPace) setZTPace(pTPace);
    }
  }, [profile?.id, profile?.thresholdHr, profile?.thresholdPace]);

  const pad = (n: number) => String(Math.floor(n)).padStart(2, '0');
  
  const formatPace = (minPerKm: number) => {
    if (!minPerKm || minPerKm === Infinity || isNaN(minPerKm)) return "00:00";
    const totalSec = Math.round(minPerKm * 60);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${pad(m)}:${pad(s)}`;
  };

  const parsePaceToMinutes = (paceStr: string): number => {
    if (!paceStr) return 0;
    const parts = paceStr.split(':').map(Number);
    if (parts.length === 2) return parts[0] + parts[1] / 60;
    return 0;
  };

  const { hrZones, paceZones, chartData } = React.useMemo(() => {
    const lthr = parseInt(zLTHR) || 165;
    const tPaceMin = parsePaceToMinutes(zTPace) || 4.78;

    const hr = [
      { label: "Recuperação", value: `< ${Math.round(lthr * 0.80)}`, color: "bg-cyan-400" },
      { label: "Base", value: `${Math.round(lthr * 0.80)} - ${Math.round(lthr * 0.90)}`, color: "bg-green-500" },
      { label: "Potência", value: `${Math.round(lthr * 0.91)} - ${Math.round(lthr * 0.95)}`, color: "bg-yellow-400" },
      { label: "Limiar", value: `${Math.round(lthr * 0.96)} - ${Math.round(lthr * 1.02)}`, color: "bg-orange-500" },
      { label: "Anaeróbica", value: `${Math.round(lthr * 1.03)} - ${Math.round(lthr * 1.06)}`, color: "bg-orange-600" },
      { label: "VO2 Máx", value: `> ${Math.round(lthr * 1.06)}`, color: "bg-red-500" },
    ];

    const pace = [
      { label: "Recuperação Ativa", sub: "Aquecimento e regenerativos.", value: `> ${formatPace(tPaceMin * 1.25)}`, color: "bg-cyan-400" },
      { label: "Resistência Aeróbica", sub: "Base aeróbica.", value: `${formatPace(tPaceMin * 1.10)} - ${formatPace(tPaceMin * 1.24)}`, color: "bg-green-500" },
      { label: "Potência Aeróbica", sub: "Ritmo de maratona.", value: `${formatPace(tPaceMin * 1.05)} - ${formatPace(tPaceMin * 1.09)}`, color: "bg-yellow-400" },
      { label: "Limiar de Lactato", sub: "Ritmo de 10k/21k.", value: `${formatPace(tPaceMin * 0.98)} - ${formatPace(tPaceMin * 1.04)}`, color: "bg-orange-500" },
      { label: "Anaeróbico", sub: "Intervalados de 1km.", value: `${formatPace(tPaceMin * 0.90)} - ${formatPace(tPaceMin * 0.97)}`, color: "bg-orange-600" },
      { label: "VO2 Máx", sub: "Esforço máximo.", value: `< ${formatPace(tPaceMin * 0.90)}`, color: "bg-red-500" },
    ];

    const chart = [
      { name: "Z1", val: Math.round(lthr * 0.80) },
      { name: "Z2", val: Math.round(lthr * 0.90) },
      { name: "Z3", val: Math.round(lthr * 0.95) },
      { name: "Z4", val: Math.round(lthr * 1.02) },
      { name: "Z5", val: Math.round(lthr * 1.06) },
      { name: "Z6", val: Math.round(lthr * 1.15) },
    ];

    return { hrZones: hr, paceZones: pace, chartData: chart };
  }, [zLTHR, zTPace]);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20">
        <header>
          <h1 className="text-3xl md:text-7xl font-headline font-black uppercase italic tracking-tighter leading-none">
            <span className="text-white">CENTRAL DE</span> <br/>
            <span className="text-primary">CÁLCULOS</span>
          </h1>
        </header>

        <Tabs defaultValue="zonas" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-secondary/20 p-1 rounded-xl h-auto gap-1">
            <TabsTrigger value="basicos" className="py-2.5 font-black text-[9px] uppercase italic gap-1">BÁSICOS</TabsTrigger>
            <TabsTrigger value="estrategias" className="py-2.5 font-black text-[9px] uppercase italic gap-1">ESTRATEGIA</TabsTrigger>
            <TabsTrigger value="zonas" className="py-2.5 font-black text-[9px] uppercase italic gap-1 text-primary">ZONAS</TabsTrigger>
          </TabsList>

          <TabsContent value="zonas" className="mt-8">
             <Card className="bg-[#0c0e12] border-border/50 rounded-[2rem] overflow-hidden shadow-2xl">
                <CardHeader className="p-10 border-b border-white/5">
                  <CardTitle className="font-headline text-3xl font-black uppercase italic text-white flex items-center gap-3">
                     <Activity className="size-6 text-primary" /> Zonas de Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-white/5">
                    <div className="p-10 space-y-10">
                      <div className="flex items-center gap-2 text-primary font-black uppercase italic text-xs tracking-widest"><Heart size={16} /> FREQUÊNCIA CARDÍACA</div>
                      <div className="grid grid-cols-3 gap-3">
                        <MetricInput label="LIMIAR" value={zLTHR} setter={setZLTHR} />
                        <MetricInput label="MÁXIMA" value={String((parseInt(zLTHR)||165)+20)} setter={() => {}} />
                        <MetricInput label="REPOUSO" value={profile?.restingHr?.toString() || "49"} setter={() => {}} />
                      </div>
                      <div className="h-[220px] w-full pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 20, right: 0, left: -40, bottom: 0 }}>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} fontWeight="900" tick={{ fill: 'rgba(255,255,255,0.4)' }}/>
                            <YAxis domain={[0, 220]} ticks={[0, 55, 110, 165, 220]} axisLine={false} tickLine={false} fontSize={10} tick={{ fill: 'rgba(255,255,255,0.2)' }}/>
                            <Bar dataKey="val" radius={[6, 6, 0, 0]} barSize={40}>
                              {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={ZONE_COLORS[index % ZONE_COLORS.length]} />)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2">
                        {hrZones.map((z, i) => (
                          <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                            <div className="flex items-center gap-3">
                              <div className={cn("size-2.5 rounded-full shadow-lg", z.color)} />
                              <span className="text-[10px] font-black uppercase italic text-white/80">{z.label}</span>
                            </div>
                            <span className="text-[10px] font-bold text-white/90">{z.value} <span className="text-[8px] opacity-40">bpm</span></span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-10 space-y-10">
                      <div className="flex items-center gap-2 text-primary font-black uppercase italic text-xs tracking-widest"><Zap size={16} /> ZONAS DE PACE</div>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center space-y-2 relative overflow-hidden group">
                         <p className="text-[10px] font-black uppercase italic text-muted-foreground/60 tracking-widest">PACE DE LIMIAR (MIN/KM)</p>
                         <h3 className="text-6xl font-headline font-black text-primary italic tracking-tighter leading-none">{zTPace}</h3>
                      </div>
                      <div className="space-y-6">
                        {paceZones.map((z, i) => (
                          <div key={i} className="flex items-center justify-between group">
                            <div className="flex gap-4">
                              <div className={cn("w-1.5 h-12 rounded-full", z.color)} />
                              <div className="space-y-0.5">
                                <h4 className="text-sm font-black uppercase italic text-white leading-none">{z.label}</h4>
                                <p className="text-[10px] font-bold text-muted-foreground/60 italic leading-none">{z.sub}</p>
                              </div>
                            </div>
                            <div className="text-right">
                               <p className="text-xl font-headline font-black italic text-white leading-none">{z.value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-secondary/10 p-10 border-t border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-3 text-muted-foreground/60 max-w-xl">
                      <Info size={24} className="shrink-0 text-primary/40" />
                      <p className="text-[10px] font-bold uppercase italic leading-relaxed">Calculado via Limiar de Lactato.</p>
                   </div>
                   <div className="flex gap-2">
                      <Input value={zLTHR} onChange={e => setZLTHR(e.target.value)} className="w-24 bg-black/40 h-12 text-center font-black italic border-white/10" />
                      <Input value={zTPace} onChange={e => setZTPace(e.target.value)} className="w-24 bg-black/40 h-12 text-center font-black italic border-white/10" />
                   </div>
                </CardFooter>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function MetricInput({ label, value, setter }: { label: string, value: string, setter: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] font-black text-muted-foreground text-center block tracking-widest">{label}</Label>
      <Input value={value} onChange={e => setter(e.target.value)} className="bg-black/30 border-white/10 h-12 text-center font-black text-sm rounded-xl" />
    </div>
  );
}