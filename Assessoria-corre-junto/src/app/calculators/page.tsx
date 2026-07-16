"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Droplets, 
  Heart, 
  Zap, 
  Copy,
  Clock,
  Target,
  Activity,
  Milestone,
  TrendingUp,
  MoveRight,
  Info
} from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function CalculatorsPage() {
  const { toast } = useToast();

  const pad = (n: number) => String(Math.floor(n)).padStart(2, '0');
  
  const formatPace = (minPerKm: number) => {
    if (!minPerKm || minPerKm === Infinity) return "00:00";
    const totalSec = Math.round(minPerKm * 60);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${pad(m)}:${pad(s)}`;
  };

  const formatTime = (totalMinutes: number) => {
    if (!totalMinutes || totalMinutes === Infinity) return "00:00:00";
    const totalSec = Math.round(totalMinutes * 60);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  };

  const copyToClipboard = (text: string, title: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "COPIADO!", description: `${title} salvo na área de transferência.` });
  };

  // --- 1. CALCULADORA DE PACE ---
  const [pDist, setPDist] = React.useState("10");
  const [pTimeH, setPTimeH] = React.useState("");
  const [pTimeM, setPTimeM] = React.useState("50");
  const [pTimeS, setPTimeS] = React.useState("00");
  const [pResult, setPResult] = React.useState<string | null>(null);

  const calcPaceAction = () => {
    const d = parseFloat(pDist);
    const t = (parseInt(pTimeH) || 0) * 60 + (parseInt(pTimeM) || 0) + (parseInt(pTimeS) || 0) / 60;
    if (d > 0 && t > 0) setPResult(formatPace(t / d));
  };

  // --- 2. ZONAS DE FC ---
  const [fcMax, setFCMax] = React.useState("185");
  const [fcLthr, setFCLthr] = React.useState("");
  const [fcZones, setFCZones] = React.useState<any[] | null>(null);

  const calcZonesAction = () => {
    const lthr = parseInt(fcLthr);
    const max = parseInt(fcMax);
    if (lthr > 0) {
      setFCZones([
        { label: "Z1 - RECUPERAÇÃO", range: `< ${Math.round(lthr * 0.80)}`, color: "bg-slate-500" },
        { label: "Z2 - AERÓBICO", range: `${Math.round(lthr * 0.80)}-${Math.round(lthr * 0.90)}`, color: "bg-emerald-500" },
        { label: "Z3 - POTÊNCIA", range: `${Math.round(lthr * 0.90)+1}-${Math.round(lthr * 0.95)}`, color: "bg-yellow-500" },
        { label: "Z4 - LIMIAR", range: `${Math.round(lthr * 0.95)+1}-${Math.round(lthr * 1.02)}`, color: "bg-orange-500" },
        { label: "Z5 - MÁXIMA", range: `> ${Math.round(lthr * 1.02)}`, color: "bg-red-500" },
      ]);
    } else {
      setFCZones([
        { label: "Z1 - REGEN", range: `${Math.round(max * 0.5)}-${Math.round(max * 0.6)}`, color: "bg-slate-500" },
        { label: "Z2 - BASE", range: `${Math.round(max * 0.6)+1}-${Math.round(max * 0.7)}`, color: "bg-emerald-500" },
        { label: "Z3 - MODERADO", range: `${Math.round(max * 0.7)+1}-${Math.round(max * 0.8)}`, color: "bg-yellow-500" },
        { label: "Z4 - LIMIAR", range: `${Math.round(max * 0.8)+1}-${Math.round(max * 0.9)}`, color: "bg-orange-500" },
        { label: "Z5 - MÁXIMA", range: `${Math.round(max * 0.9)+1}-${max}`, color: "bg-red-500" },
      ]);
    }
  };

  return (
    <DashboardLayout>
      <TooltipProvider>
        <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20">
          <header className="px-4">
            <h1 className="text-4xl md:text-7xl font-headline font-black uppercase italic tracking-tighter leading-[0.8]">
              <span className="text-white">LABORATÓRIO DE</span> <br/>
              <span className="text-primary">PRECISÃO</span>
            </h1>
            <p className="text-muted-foreground text-xs md:text-base font-black uppercase tracking-[0.3em] italic mt-6 opacity-60">
              Ferramentas técnicas calibradas para precisão de performance.
            </p>
          </header>

          <Tabs defaultValue="basicos" className="w-full">
            <div className="px-4 sticky top-16 z-20 bg-background/95 backdrop-blur-md py-6 border-b border-white/5">
              <TabsList className="grid w-full grid-cols-2 bg-secondary/20 p-2 rounded-2xl h-auto gap-3">
                <TabsTrigger value="basicos" className="py-5 font-black text-xs md:text-sm uppercase italic gap-3 data-[state=active]:bg-primary data-[state=active]:text-black transition-all rounded-xl">
                  <Zap className="size-4" /> CALCULADORAS
                </TabsTrigger>
                <TabsTrigger value="zonas" className="py-5 font-black text-xs md:text-sm uppercase italic gap-3 data-[state=active]:bg-primary data-[state=active]:text-black transition-all rounded-xl">
                  <Heart className="size-4" /> ZONAS DE ESFORÇO
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="basicos" className="mt-12 space-y-12 px-4 animate-in slide-in-from-bottom-6 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* CALC PACE */}
                <Card className="bg-card/40 border-white/5 flex flex-col hover:border-primary/40 transition-all rounded-3xl shadow-2xl overflow-hidden group">
                  <CardHeader className="pb-6 bg-secondary/10 border-b border-white/5 p-8">
                    <CardTitle className="text-[11px] font-black uppercase italic text-primary flex items-center gap-3 tracking-widest">
                      <Activity className="size-4" /> CALCULAR PACE MÉDIO
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8 p-10 pt-12">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest italic">DISTÂNCIA (KM)</Label>
                      <Input type="number" value={pDist} onChange={e => setPDist(e.target.value)} className="bg-black/30 h-16 text-3xl font-black border-white/10 focus:border-primary text-center rounded-2xl shadow-inner" />
                    </div>
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest italic text-center block">TEMPO ALVO</Label>
                      <div className="grid grid-cols-3 gap-3">
                        <Input type="number" placeholder="H" value={pTimeH} onChange={e => setPTimeH(e.target.value)} className="bg-black/30 h-14 text-center text-xl font-black rounded-xl border-white/10" />
                        <Input type="number" placeholder="M" value={pTimeM} onChange={e => setPTimeM(e.target.value)} className="bg-black/30 h-14 text-center text-xl font-black rounded-xl border-white/10" />
                        <Input type="number" placeholder="S" value={pTimeS} onChange={e => setPTimeS(e.target.value)} className="bg-black/30 h-14 text-center text-xl font-black rounded-xl border-white/10" />
                      </div>
                    </div>
                    
                    <div className="pt-4 space-y-6">
                      <Button className="w-full h-16 bg-primary text-black font-black uppercase text-xs tracking-[0.2em] italic rounded-2xl shadow-2xl shadow-primary/20 hover:bg-white transition-all" onClick={calcPaceAction}>PROCESSAR CÁLCULO</Button>
                      
                      {pResult && (
                        <div className="p-8 rounded-2xl bg-primary/10 border border-primary/20 text-center space-y-2 animate-in zoom-in-95">
                          <p className="text-[10px] font-black uppercase italic text-primary tracking-widest">PACE REQUERIDO</p>
                          <p className="text-5xl font-headline font-black uppercase italic tracking-tighter text-white">{pResult}<span className="text-xs font-bold lowercase opacity-30 ml-2">min/km</span></p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* ESTRATÉGIA NUTRICIONAL */}
                <Card className="bg-card/40 border-white/5 flex flex-col hover:border-primary/40 transition-all rounded-3xl shadow-2xl overflow-hidden">
                  <CardHeader className="pb-6 bg-secondary/10 border-b border-white/5 p-8">
                    <CardTitle className="text-[11px] font-black uppercase italic text-primary flex items-center gap-3 tracking-widest">
                      <Droplets className="size-4" /> NUTRIÇÃO & HIDRATAÇÃO
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-10 space-y-8">
                    <p className="text-[11px] text-muted-foreground leading-relaxed italic font-medium uppercase tracking-tight opacity-60">
                      Cálculos baseados em taxa de suor e oxidação de carboidratos por hora de esforço.
                    </p>
                    <div className="grid grid-cols-1 gap-6">
                       <div className="p-6 rounded-2xl bg-secondary/20 border border-white/5 space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase italic text-white/40 tracking-widest">Sódio (Dose)</span>
                            <span className="text-lg font-black italic text-primary">500MG / H</span>
                          </div>
                          <div className="flex justify-between items-center border-t border-white/5 pt-4">
                            <span className="text-[10px] font-black uppercase italic text-white/40 tracking-widest">Carbo (Elite)</span>
                            <span className="text-lg font-black italic text-primary">60G - 90G / H</span>
                          </div>
                       </div>
                    </div>
                    <Button variant="outline" className="w-full h-16 border-primary/20 text-primary font-black uppercase italic tracking-widest text-xs rounded-2xl hover:bg-primary hover:text-black transition-all">
                      <Copy className="mr-3 size-4" /> COPIAR PLANO 🍎
                    </Button>
                  </CardContent>
                </Card>

                {/* PREVISÃO DE PROVA */}
                <Card className="bg-card/40 border-white/5 flex flex-col hover:border-primary/40 transition-all rounded-3xl shadow-2xl overflow-hidden">
                  <CardHeader className="pb-6 bg-secondary/10 border-b border-white/5 p-8">
                    <CardTitle className="text-[11px] font-black uppercase italic text-primary flex items-center gap-3 tracking-widest">
                      <Target className="size-4" /> PREVISÃO (RIEGEL)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-10 space-y-8">
                    <p className="text-[11px] text-muted-foreground leading-relaxed italic font-medium uppercase tracking-tight opacity-60">
                      Estime seu tempo em outras distâncias baseado em um recorde pessoal recente.
                    </p>
                    <div className="space-y-4">
                       {[
                         { d: "5K", t: "00:19:45", p: "3:57" },
                         { d: "10K", t: "00:41:12", p: "4:07" },
                         { d: "21K", t: "01:31:05", p: "4:19" },
                         { d: "42K", t: "03:10:40", p: "4:31" },
                       ].map((r, i) => (
                         <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5">
                            <span className="text-[10px] font-black text-primary italic uppercase">{r.d}</span>
                            <span className="text-sm font-black text-white italic">{r.t}</span>
                            <span className="text-[10px] font-bold text-muted-foreground/50">{r.p}/KM</span>
                         </div>
                       ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="zonas" className="mt-12 space-y-12 px-4 animate-in fade-in duration-500">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <Card className="bg-card/40 border-white/5 rounded-3xl shadow-2xl overflow-hidden h-fit">
                    <CardHeader className="p-10 bg-secondary/10 border-b border-white/5">
                       <CardTitle className="text-xl font-headline font-black uppercase italic text-white flex items-center gap-4 tracking-tighter">
                          <Heart className="size-6 text-primary" /> CONFIGURAR LIMITES
                       </CardTitle>
                    </CardHeader>
                    <CardContent className="p-10 space-y-10">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest italic">FC MÁXIMA (BPM)</Label>
                            <Input type="number" value={fcMax} onChange={e => setFCMax(e.target.value)} className="bg-black/30 h-16 text-center text-2xl font-black rounded-2xl border-white/10" />
                         </div>
                         <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <Label className="text-[10px] font-black uppercase text-white italic tracking-widest">LIMIAR L2 (BPM)</Label>
                              <Tooltip><TooltipTrigger asChild><Info className="size-3 text-muted-foreground cursor-help"/></TooltipTrigger><TooltipContent><p className="text-[10px] uppercase font-bold italic">Padrão Ouro de Performance</p></TooltipContent></Tooltip>
                            </div>
                            <Input type="number" placeholder="EX: 168" value={fcLthr} onChange={e => setFCLthr(e.target.value)} className="bg-black/30 h-16 text-center text-2xl font-black rounded-2xl border-white/10" />
                         </div>
                       </div>
                       <Button className="w-full h-18 bg-primary text-black font-black uppercase text-base tracking-[0.3em] italic rounded-2xl shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all" onClick={calcZonesAction}>PROCESSAR ZONAS</Button>
                    </CardContent>
                  </Card>

                  <div className="space-y-6">
                    {fcZones ? (
                      <div className="grid gap-4 animate-in slide-in-from-right-10 duration-500">
                         {fcZones.map((z, i) => (
                           <div key={i} className="p-6 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between group hover:border-primary/30 transition-all shadow-xl">
                              <div className="flex items-center gap-6">
                                <div className={cn("size-3 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.2)]", z.color)} />
                                <span className="text-xs font-black uppercase italic text-white tracking-widest">{z.label}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-xl font-black italic text-primary tracking-tighter">{z.range}</span>
                                <span className="text-[9px] font-bold text-muted-foreground ml-2 uppercase">BPM</span>
                              </div>
                           </div>
                         ))}
                         <Button variant="ghost" className="w-full h-14 font-black uppercase italic text-primary tracking-widest hover:bg-primary/10" onClick={() => copyToClipboard(fcZones.map(z => `${z.label}: ${z.range} BPM`).join('\n'), "Zonas de FC")}>
                           <Copy className="mr-3 size-4" /> COPIAR ZONAS ❤️
                         </Button>
                      </div>
                    ) : (
                      <div className="h-[400px] border-4 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center p-12 text-center space-y-4">
                        <Heart className="size-16 text-muted-foreground/10" />
                        <p className="text-xs font-black uppercase italic text-muted-foreground/30 tracking-[0.3em]">Aguardando dados biométricos...</p>
                      </div>
                    )}
                  </div>
               </div>
            </TabsContent>
          </Tabs>
        </div>
      </TooltipProvider>
    </DashboardLayout>
  );
}