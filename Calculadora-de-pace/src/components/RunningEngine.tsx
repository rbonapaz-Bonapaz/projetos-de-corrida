
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export function RunningEngine() {
  const [distance, setDistance] = useState("21.097");
  const [hours, setHours] = useState("1");
  const [minutes, setMinutes] = useState("35");
  const [seconds, setSeconds] = useState("50");
  const [paceMin, setPaceMin] = useState("4");
  const [paceSec, setPaceSec] = useState("30");

  const [treadmillMode, setTreadmillMode] = useState<"paceToVel" | "velToPace">("paceToVel");
  const [tPaceMin, setTPaceMin] = useState("");
  const [tPaceSec, setTPaceSec] = useState("");
  const [tSpeed, setTSpeed] = useState("");

  const [result, setResult] = useState<{ label: string; value: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const calculatePace = () => {
    const d = parseFloat(distance);
    const totalSeconds = (parseInt(hours || "0") * 3600) + (parseInt(minutes || "0") * 60) + parseInt(seconds || "0");
    if (d > 0 && totalSeconds > 0) {
      const paceTotalSec = totalSeconds / d;
      const m = Math.floor(paceTotalSec / 60);
      const s = Math.round(paceTotalSec % 60);
      setResult({ label: "Pace Médio", value: `${m}:${s.toString().padStart(2, '0')} min/km` });
    }
  };

  const calculateTime = () => {
    const d = parseFloat(distance);
    const pTotalSec = (parseInt(paceMin || "0") * 60) + parseInt(paceSec || "0");
    if (d > 0 && pTotalSec > 0) {
      const totalSec = d * pTotalSec;
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = Math.round(totalSec % 60);
      setResult({ label: "Tempo Estimado", value: `${h}h ${m}m ${s}s` });
    }
  };

  const calculateDistance = () => {
    const totalSec = (parseInt(hours || "0") * 3600) + (parseInt(minutes || "0") * 60) + parseInt(seconds || "0");
    const pTotalSec = (parseInt(paceMin || "0") * 60) + parseInt(paceSec || "0");
    if (totalSec > 0 && pTotalSec > 0) {
      const d = totalSec / pTotalSec;
      setResult({ label: "Distância Total", value: `${d.toFixed(3)} km` });
    }
  };

  const calculateTreadmill = () => {
    if (treadmillMode === "paceToVel") {
      const min = parseFloat(tPaceMin || "0");
      const sec = parseFloat(tPaceSec || "0");
      const totalMin = min + sec / 60;
      if (totalMin > 0) {
        const speed = 60 / totalMin;
        setResult({ label: "Velocidade na Esteira", value: `${speed.toFixed(1)} km/h` });
      }
    } else {
      const speed = parseFloat(tSpeed || "0");
      if (speed > 0) {
        const paceTotalSec = 3600 / speed;
        const m = Math.floor(paceTotalSec / 60);
        const s = Math.round(paceTotalSec % 60);
        setResult({ label: "Pace na Esteira", value: `${m}:${s.toString().padStart(2, '0')} min/km` });
      }
    }
  };

  if (!mounted) return null;

  return (
    <Card className="border-border shadow-md bg-card">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-primary text-xl">Cálculos principais</CardTitle>
        <CardDescription className="text-xs">Descubra pace, tempo e distância.</CardDescription>
      </CardHeader>
      <CardContent className="p-4 md:p-6 space-y-6">
        <Tabs defaultValue="pace" className="w-full">
          <TabsList className="grid grid-cols-4 bg-transparent h-auto gap-2 p-0 border-b border-border/20">
            <TabsTrigger value="pace" className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none uppercase text-[10px] font-bold px-0 pb-2">Pace</TabsTrigger>
            <TabsTrigger value="time" className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none uppercase text-[10px] font-bold px-0 pb-2">Tempo</TabsTrigger>
            <TabsTrigger value="dist" className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none uppercase text-[10px] font-bold px-0 pb-2">Distância</TabsTrigger>
            <TabsTrigger value="treadmill" className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none uppercase text-[10px] font-bold px-0 pb-2">Esteira</TabsTrigger>
          </TabsList>

          <TabsContent value="pace" className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Distância (km)</Label>
              <Input type="number" value={distance} onChange={(e) => setDistance(e.target.value)} className="h-14 text-center font-mono text-xl bg-secondary/10" />
              <div className="grid grid-cols-4 gap-2">
                <Button variant="outline" size="sm" className="text-[10px] font-bold h-10 border-border/50" onClick={() => setDistance("5")}>5k</Button>
                <Button variant="outline" size="sm" className="text-[10px] font-bold h-10 border-border/50" onClick={() => setDistance("10")}>10k</Button>
                <Button variant="outline" size="sm" className="text-[10px] font-bold h-10 border-border/50" onClick={() => setDistance("21.097")}>Meia</Button>
                <Button variant="outline" size="sm" className="text-[10px] font-bold h-10 border-border/50" onClick={() => setDistance("42.195")}>Maratona</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Tempo Final</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input type="number" placeholder="h" value={hours} onChange={(e) => setHours(e.target.value)} className="text-center h-12 bg-secondary/10" />
                <Input type="number" placeholder="m" value={minutes} onChange={(e) => setMinutes(e.target.value)} className="text-center h-12 bg-secondary/10" />
                <Input type="number" placeholder="s" value={seconds} onChange={(e) => setSeconds(e.target.value)} className="text-center h-12 bg-secondary/10" />
              </div>
            </div>
            <Button onClick={calculatePace} className="w-full h-14 bg-accent hover:bg-accent/90 text-white font-black uppercase text-lg rounded-xl shadow-lg shadow-accent/20">Calcular Pace</Button>
          </TabsContent>

          <TabsContent value="time" className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Distância (km)</Label>
              <Input type="number" value={distance} onChange={(e) => setDistance(e.target.value)} className="h-14 text-center font-mono text-xl bg-secondary/10" />
              <div className="grid grid-cols-4 gap-2">
                <Button variant="outline" size="sm" className="text-[10px] font-bold h-10 border-border/50" onClick={() => setDistance("5")}>5k</Button>
                <Button variant="outline" size="sm" className="text-[10px] font-bold h-10 border-border/50" onClick={() => setDistance("10")}>10k</Button>
                <Button variant="outline" size="sm" className="text-[10px] font-bold h-10 border-border/50" onClick={() => setDistance("21.097")}>Meia</Button>
                <Button variant="outline" size="sm" className="text-[10px] font-bold h-10 border-border/50" onClick={() => setDistance("42.195")}>Maratona</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Pace Alvo (min/km)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" placeholder="min" value={paceMin} onChange={(e) => setPaceMin(e.target.value)} className="text-center h-12 bg-secondary/10" />
                <Input type="number" placeholder="seg" value={paceSec} onChange={(e) => setPaceSec(e.target.value)} className="text-center h-12 bg-secondary/10" />
              </div>
            </div>
            <Button onClick={calculateTime} className="w-full h-14 bg-accent hover:bg-accent/90 text-white font-black uppercase text-lg rounded-xl shadow-lg shadow-accent/20">Calcular Tempo</Button>
          </TabsContent>
          
          <TabsContent value="dist" className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Tempo Disponível</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input type="number" placeholder="h" value={hours} onChange={(e) => setHours(e.target.value)} className="text-center h-12 bg-secondary/10" />
                <Input type="number" placeholder="m" value={minutes} onChange={(e) => setMinutes(e.target.value)} className="text-center h-12 bg-secondary/10" />
                <Input type="number" placeholder="s" value={seconds} onChange={(e) => setSeconds(e.target.value)} className="text-center h-12 bg-secondary/10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Pace Médio (min/km)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" placeholder="min" value={paceMin} onChange={(e) => setPaceMin(e.target.value)} className="text-center h-12 bg-secondary/10" />
                <Input type="number" placeholder="seg" value={paceSec} onChange={(e) => setPaceSec(e.target.value)} className="text-center h-12 bg-secondary/10" />
              </div>
            </div>
            <Button onClick={calculateDistance} className="w-full h-14 bg-accent hover:bg-accent/90 text-white font-black uppercase text-lg rounded-xl shadow-lg shadow-accent/20">Calcular Distância</Button>
          </TabsContent>

          <TabsContent value="treadmill" className="space-y-6 mt-6">
            <div className="flex bg-secondary/50 p-1 rounded-xl">
              <button onClick={() => setTreadmillMode("paceToVel")} className={cn("flex-1 py-3 text-[10px] font-black uppercase rounded-lg transition-all", treadmillMode === "paceToVel" ? "bg-card text-primary shadow-sm" : "text-muted-foreground")}>Pace ➔ Velocidade</button>
              <button onClick={() => setTreadmillMode("velToPace")} className={cn("flex-1 py-3 text-[10px] font-black uppercase rounded-lg transition-all", treadmillMode === "velToPace" ? "bg-card text-primary shadow-sm" : "text-muted-foreground")}>Velocidade ➔ Pace</button>
            </div>
            <div className="space-y-4">
              {treadmillMode === "paceToVel" ? (
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Pace na Esteira (min/km)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="number" placeholder="min" value={tPaceMin} onChange={(e) => setTPaceMin(e.target.value)} className="h-12 text-center bg-secondary/10" />
                    <Input type="number" placeholder="seg" value={tPaceSec} onChange={(e) => setTPaceSec(e.target.value)} className="h-12 text-center bg-secondary/10" />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Velocidade na Esteira (km/h)</Label>
                  <Input type="number" step="0.1" value={tSpeed} onChange={(e) => setTSpeed(e.target.value)} className="h-14 text-center text-xl font-mono bg-secondary/10" />
                </div>
              )}
              <Button onClick={calculateTreadmill} className="w-full h-14 bg-accent hover:bg-accent/90 text-white font-black uppercase text-lg rounded-xl shadow-lg shadow-accent/20">Converter Agora</Button>
            </div>
          </TabsContent>
        </Tabs>

        {result && (
          <div className="mt-8 p-8 bg-primary/5 border-2 border-accent/20 rounded-3xl text-center animate-in fade-in zoom-in-95 duration-500">
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">{result.label}</p>
            <p className="text-4xl font-black text-accent font-mono tracking-tighter">{result.value}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
