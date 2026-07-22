
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BarChart3, Heart, Zap, Info, Save, Loader2 } from "lucide-react";
import { useUser, useFirestore, useDoc } from "./_firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Cell, CartesianGrid, Tooltip } from "recharts";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function HRZoneMapper() {
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  const profilePath = user ? `users/${user.uid}/profile/current` : null;
  const { data: profile } = useDoc(profilePath);

  const [maxHR, setMaxHR] = useState<number>(186);
  const [restHR, setRestHR] = useState<number>(49);
  const [thresholdHR, setThresholdHR] = useState<number>(165);
  const [thresholdPace, setThresholdPace] = useState<string>("04:47");
  const [saving, setSaving] = useState(false);
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (profile) {
      if (profile.maxHR) setMaxHR(Number(profile.maxHR));
      if (profile.restHR) setRestHR(Number(profile.restHR));
      if (profile.thresholdHR) setThresholdHR(Number(profile.thresholdHR));
      if (profile.thresholdPace) setThresholdPace(profile.thresholdPace);
    }
  }, [profile]);

  const handleSyncProfile = async () => {
    if (!user || !db || !profilePath) return;

    setSaving(true);
    const docRef = doc(db, profilePath);
    
    const syncData = {
      maxHR: Number(maxHR),
      restHR: Number(restHR),
      thresholdHR: Number(thresholdHR),
      thresholdPace: thresholdPace,
      updatedAt: serverTimestamp(),
    };

    setDoc(docRef, syncData, { merge: true })
      .then(() => {
        toast({ 
          title: "Perfil Sincronizado!", 
          description: `Métricas atualizadas com sucesso.` 
        });
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: syncData,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setSaving(false));
  };

  const hrZones = useMemo(() => {
    const t = thresholdHR || 165;
    return [
      { id: "Z1", name: "Recuperação", bpm: Math.round(t * 0.80), prefix: "<", color: "#22d3ee" },
      { id: "Z2", name: "Base", bpm: Math.round(t * 0.90), min: Math.round(t * 0.81), max: Math.round(t * 0.90), color: "#10b981" },
      { id: "Z3", name: "Potência", bpm: Math.round(t * 0.95), min: Math.round(t * 0.91), max: Math.round(t * 0.95), color: "#facc15" },
      { id: "Z4", name: "Limiar", bpm: Math.round(t * 1.02), min: Math.round(t * 0.96), max: Math.round(t * 1.02), color: "#fb923c" },
      { id: "Z5", name: "Anaeróbica", bpm: Math.round(t * 1.06), min: Math.round(t * 1.03), max: Math.round(t * 1.06), color: "#ea580c" },
      { id: "Z6", name: "VO2 Máx", bpm: Math.round(t * 1.15), prefix: ">", min: Math.round(t * 1.07), color: "#ef4444" }
    ];
  }, [thresholdHR]);

  const paceZones = useMemo(() => {
    const paceToUse = thresholdPace || "05:00";
    const parts = paceToUse.split(":");
    const minPart = parseInt(parts[0] || "0");
    const secPart = parseInt(parts[1] || "0");
    
    const tSec = (minPart * 60) + secPart;
    if (!tSec || isNaN(tSec)) return [];

    const format = (s: number) => {
      const m = Math.floor(s / 60);
      const rS = Math.round(s % 60);
      return `${m.toString().padStart(2, '0')}:${rS.toString().padStart(2, '0')}`;
    };

    return [
      { id: "Z1", name: "Recuperação Ativa", prefix: ">", value: format(tSec * 1.25), hex: "#22d3ee", desc: "Aquecimento e regenerativos." },
      { id: "Z2", name: "Resistência Aeróbica", min: format(tSec * 1.12), max: format(tSec * 1.24), hex: "#10b981", desc: "Base aeróbica e queima de gordura." },
      { id: "Z3", name: "Potência Aeróbica", min: format(tSec * 1.06), max: format(tSec * 1.11), hex: "#facc15", desc: "Ritmo de maratona e rodagem firme." },
      { id: "Z4", name: "Limiar de Lactato", min: format(tSec * 0.99), max: format(tSec * 1.05), hex: "#fb923c", desc: "Ritmo de 10k e meia maratona." },
      { id: "Z5", name: "Anaeróbico", min: format(tSec * 0.94), max: format(tSec * 0.98), hex: "#ea580c", desc: "Intervalados e tiros de 1km." },
      { id: "Z6", name: "VO2 Máx", prefix: "<", value: format(tSec * 0.93), hex: "#ef4444", desc: "Esforço máximo e sprints curtos." }
    ];
  }, [thresholdPace]);

  if (!mounted) return null;

  return (
    <div className="space-y-6 pb-20">
      <Card className="border-border shadow-md overflow-hidden bg-card">
        <CardHeader className="border-b border-border/50 p-6 bg-primary/5">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold flex items-center gap-2 text-primary">
                <BarChart3 className="w-5 h-5" />
                Zonas de Performance
              </CardTitle>
              <CardDescription className="text-xs">Mapeamento baseado em seu Limiar.</CardDescription>
            </div>
            <Button size="sm" onClick={handleSyncProfile} disabled={saving || !user} className="bg-accent hover:bg-accent/90 text-white font-bold h-10 gap-2 rounded-xl shadow-lg shadow-accent/20">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span className="hidden sm:inline uppercase text-[10px] tracking-widest">Sincronizar Perfil</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-6 md:p-8 bg-background/50 border-b border-border/50">
            <h3 className="text-[10px] font-black uppercase text-primary mb-6 flex items-center gap-2 tracking-widest">
              <Heart className="w-4 h-4" /> Frequência Cardíaca (BPM)
            </h3>
            
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="space-y-1">
                <Label className="text-[9px] uppercase font-black text-muted-foreground">Limiar</Label>
                <Input type="number" value={thresholdHR} onChange={(e) => setThresholdHR(Number(e.target.value))} className="h-10 font-mono font-bold" />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] uppercase font-black text-muted-foreground">Máxima</Label>
                <Input type="number" value={maxHR} onChange={(e) => setMaxHR(Number(e.target.value))} className="h-10 font-mono font-bold" />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] uppercase font-black text-muted-foreground">Repouso</Label>
                <Input type="number" value={restHR} onChange={(e) => setRestHR(Number(e.target.value))} className="h-10 font-mono font-bold" />
              </div>
            </div>

            <div className="h-[250px] w-full mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hrZones} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                  <XAxis dataKey="id" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <Tooltip 
                    cursor={false}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    formatter={(value) => [`${value} BPM`, "BPM"]}
                    labelFormatter={(label) => `Zona ${label}`}
                  />
                  <Bar dataKey="bpm" radius={[4, 4, 0, 0]} barSize={40}>
                    {hrZones.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-6 md:p-8 bg-secondary/10">
            <h3 className="text-[10px] font-black uppercase text-primary mb-6 flex items-center gap-2 tracking-widest">
              <Zap className="w-4 h-4" /> Zonas de Pace (min/km)
            </h3>
            
            <div className="bg-card p-6 rounded-2xl border border-border/50 text-center mb-10 max-w-[280px] mx-auto shadow-sm">
              <Label className="text-[9px] uppercase font-black text-muted-foreground block mb-2">Pace de Limiar (MM:SS)</Label>
              <Input 
                value={thresholdPace} 
                onChange={(e) => setThresholdPace(e.target.value)}
                className="h-12 text-center text-4xl font-black text-primary bg-transparent border-none focus-visible:ring-0"
              />
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-2">Ritmo de sustentação máxima</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paceZones.map((zone) => (
                <div key={zone.id} className="p-5 bg-card rounded-xl border border-border/40 hover:border-primary/20 transition-all shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black uppercase tracking-tight" style={{ color: zone.hex }}>{zone.name}</span>
                    <span className="text-xl font-mono font-black" style={{ color: zone.hex }}>
                      {zone.prefix && <span className="mr-1">{zone.prefix === ">" ? ">" : zone.prefix === "<" ? "<" : zone.prefix}</span>}
                      {zone.value ? zone.value : `${zone.min} - ${zone.max}`}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">{zone.desc}</p>
                  <div className="h-1 w-full mt-4 rounded-full" style={{ backgroundColor: `${zone.hex}30` }}>
                    <div className="h-full rounded-full" style={{ backgroundColor: zone.hex, width: '40%' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex items-start gap-3">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-[10px] text-muted-foreground leading-relaxed italic">
          Nota Técnica: Estes cálculos utilizam o Pace de Limiar como âncora de performance. Ao clicar em Sincronizar Perfil, esses valores serão salvos como seus dados oficiais de atleta.
        </p>
      </div>
    </div>
  );
}
