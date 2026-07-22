
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Droplets, Timer, Pill, Zap, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useDoc } from "./_firebase";

type HydrationResult = {
  totalVolume: number;
  fractionation: number;
  electrolytes: { capsules: number; mg: number; interval: number; };
  carbs: { sachets: number; grams: number; interval: number; };
};

export function HydrationPlanner() {
  const { toast } = useToast();
  const { user } = useUser();
  const profilePath = user ? `users/${user.uid}/profile/current` : null;
  const { data: profile } = useDoc(profilePath);

  const [weight, setWeight] = useState<number>(76);
  const [hours, setHours] = useState<number>(1);
  const [minutes, setMinutes] = useState<number>(0);
  const [climate, setClimate] = useState<string>("cool");
  const [intensity, setIntensity] = useState<string>("moderate");
  const [result, setResult] = useState<HydrationResult | null>(null);

  useEffect(() => {
    if (profile && profile.weight) {
      setWeight(profile.weight);
    }
  }, [profile]);

  const calculateHydration = () => {
    const totalDurationHours = hours + minutes / 60;
    if (totalDurationHours <= 0) return;

    let baseRate = 7; 
    if (intensity === "low") baseRate -= 1;
    if (intensity === "high") baseRate += 2;
    if (climate === "cool") baseRate -= 1;
    if (climate === "hot") baseRate += 3;

    const totalVolume = Math.round(weight * baseRate * totalDurationHours);
    const fractionation = Math.round(totalVolume / (totalDurationHours * 4));

    const sodiumPerHour = intensity === "low" ? 0 : intensity === "moderate" ? 250 : 500;
    const totalCapsules = Math.max(0, Math.ceil(sodiumPerHour * totalDurationHours / 250));

    let carbsPerHour = 0;
    if (totalDurationHours >= 1) {
      carbsPerHour = intensity === "low" ? 30 : intensity === "moderate" ? 45 : 60;
    }
    const totalSachets = Math.ceil((carbsPerHour * totalDurationHours) / 25);

    setResult({
      totalVolume,
      fractionation,
      electrolytes: { capsules: totalCapsules, mg: totalCapsules * 250, interval: 60 },
      carbs: { sachets: totalSachets, grams: totalSachets * 25, interval: 30 }
    });
  };

  const copyToClipboard = () => {
    if (!result) return;
    const text = `Plano de Hidratação Personalizado:
- Volume Total: ~${result.totalVolume} ml
- Fracionamento: ~${result.fractionation} ml / 15 min
- Eletrólitos: ${result.electrolytes.capsules} cápsula(s) (${result.electrolytes.mg}mg de sódio) a cada ${result.electrolytes.interval} min
- Carboidratos: ${result.carbs.sachets} sachê(s) (${result.carbs.grams}g) a cada ${result.carbs.interval} min`;
    
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: "Plano copiado com sucesso." });
  };

  return (
    <Card className="border-border shadow-md">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-primary flex items-center gap-2">
              <Droplets className="w-6 h-6" />
              Hidratação
            </CardTitle>
            <CardDescription>Evite a quebra por desidratação.</CardDescription>
          </div>
          {profile && (
            <div className="bg-primary/10 px-3 py-1 rounded-full flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase">
              <UserCheck className="w-3 h-3" /> Peso Carregado
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <Label htmlFor="weight" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Seu Peso (kg)</Label>
            <Input 
              id="weight"
              type="number" 
              value={weight} 
              onChange={(e) => setWeight(Number(e.target.value))}
              className="h-12 text-center text-lg font-mono bg-secondary/30 border-border/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Horas</Label>
              <Input type="number" value={hours} onChange={(e) => setHours(Number(e.target.value))} className="h-12 text-center font-mono bg-secondary/30 border-border/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Minutos</Label>
              <Input type="number" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="h-12 text-center font-mono bg-secondary/30 border-border/50" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Clima</Label>
              <Select value={climate} onValueChange={setClimate}>
                <SelectTrigger className="h-12 bg-secondary/30 border-border/50 font-medium"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cool">Frio</SelectItem>
                  <SelectItem value="warm">Ameno</SelectItem>
                  <SelectItem value="hot">Quente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Intensidade</Label>
              <Select value={intensity} onValueChange={setIntensity}>
                <SelectTrigger className="h-12 bg-secondary/30 border-border/50 font-medium"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Leve</SelectItem>
                  <SelectItem value="moderate">Moderado</SelectItem>
                  <SelectItem value="high">Intenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Button 
          onClick={calculateHydration} 
          className="w-full h-14 bg-accent hover:bg-accent/90 text-white text-lg font-black uppercase rounded-xl shadow-lg shadow-accent/20"
        >
          CALCULAR HIDRATAÇÃO
        </Button>

        {result && (
          <div className="mt-8 border-2 border-accent rounded-3xl overflow-hidden bg-card animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex justify-center">
                 <Button variant="outline" size="sm" onClick={copyToClipboard} className="h-8 text-[10px] uppercase font-bold tracking-widest text-muted-foreground border-border/50 rounded-lg">
                    COPIAR PLANO
                 </Button>
              </div>

              <h3 className="text-xl font-black text-accent text-center uppercase tracking-tight">Plano de Hidratação Personalizado</h3>

              <div className="space-y-5">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/10 border border-border/30">
                  <Droplets className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="font-black text-accent text-[10px] uppercase tracking-wider">Volume total sugerido</span>
                    <span className="text-foreground font-black text-xl">{result.totalVolume} ml</span>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/10 border border-border/30">
                  <Timer className="w-6 h-6 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="font-black text-accent text-[10px] uppercase tracking-wider">Fracionamento</span>
                    <span className="text-foreground font-black text-xl">~{result.fractionation} ml a cada 15 min</span>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/10 border border-border/30">
                  <Pill className="w-6 h-6 text-blue-400 shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="font-black text-accent text-[10px] uppercase tracking-wider">Reposição de Eletrólitos</span>
                    <span className="text-foreground font-bold text-sm leading-snug">
                      {result.electrolytes.capsules} cápsula(s) (~{result.electrolytes.mg}mg de sódio) · 1 a cada {result.electrolytes.interval} min
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/10 border border-border/30">
                  <Zap className="w-6 h-6 text-accent shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="font-black text-accent text-[10px] uppercase tracking-wider">Suporte de Energia</span>
                    <span className="text-foreground font-bold text-sm leading-snug">
                      {result.carbs.sachets} sachê(s) de gel (~{result.carbs.grams}g carb) · 1 a cada {result.carbs.interval} min
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground leading-relaxed pt-4 border-t border-border/50 text-center italic">
                Atenção: Esta é uma estimativa baseada em seu peso e intensidade. Teste sempre sua estratégia nos treinos antes de uma prova oficial.
              </p>

              <div className="bg-primary/5 border-2 border-dashed border-accent/30 rounded-2xl p-6 text-center space-y-4">
                <p className="text-xs font-black text-foreground leading-tight">
                  🥤 Quer um protocolo de nutrição e hidratação de elite para sua próxima maratona?
                </p>
                <Button asChild className="bg-accent hover:bg-accent/90 text-white font-bold rounded-xl h-12 w-full">
                  <a href="https://wa.me/5555996265753" target="_blank" rel="noopener noreferrer">
                    SOLICITAR CONSULTORIA
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
