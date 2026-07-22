
"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TrendingUp, Trophy, Star, Loader2, Info, CheckCircle2, Save, Lock, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy, limit, getDocs } from "firebase/firestore";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function RacePredictor() {
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();

  const [distance, setDistance] = useState("10");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("50");
  const [seconds, setSeconds] = useState("0");
  const [results, setResults] = useState<any[] | null>(null);
  const [isSavingPB, setIsSavingPB] = useState(false);
  const [isDeletingPB, setIsDeletingPB] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [pb5k, setPb5k] = useState("");
  const [pb10k, setPb10k] = useState("");
  const [pb21k, setPb21k] = useState("");
  const [pb42k, setPb42k] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const recordsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, `users/${user.uid}/records`), orderBy("date", "desc"), limit(20));
  }, [db, user]);

  const { data: savedRecords } = useCollection(recordsQuery);

  useEffect(() => {
    if (savedRecords && savedRecords.length > 0) {
      const latest = { "5K": "", "10K": "", "MEIA": "", "MARATONA": "" };
      savedRecords.forEach(rec => {
        if (!latest[rec.distance as keyof typeof latest]) {
          latest[rec.distance as keyof typeof latest] = rec.time;
        }
      });
      setPb5k(latest["5K"]);
      setPb10k(latest["10K"]);
      setPb21k(latest["MEIA"]);
      setPb42k(latest["MARATONA"]);
    } else {
      setPb5k("");
      setPb10k("");
      setPb21k("");
      setPb42k("");
    }
  }, [savedRecords]);

  const handleSaveManualPBs = async () => {
    if (!user || !db) return;

    setIsSavingPB(true);
    try {
      const pbs = [
        { dist: "5K", time: pb5k },
        { dist: "10K", time: pb10k },
        { dist: "MEIA", time: pb21k },
        { dist: "MARATONA", time: pb42k }
      ].filter(pb => pb.time && pb.time.trim() !== "");

      if (pbs.length === 0) {
        toast({ variant: "destructive", title: "Preencha um tempo" });
        setIsSavingPB(false);
        return;
      }

      for (const pb of pbs) {
        await addDoc(collection(db, `users/${user.uid}/records`), {
          distance: pb.dist,
          time: pb.time,
          date: serverTimestamp(),
        });
      }

      toast({ title: "Recordes Atualizados!" });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao salvar" });
    } finally {
      setIsSavingPB(false);
    }
  };

  const handleClearPBs = async () => {
    if (!user || !db) return;
    setIsDeletingPB(true);
    try {
      const q = query(collection(db, `users/${user.uid}/records`));
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      setPb5k("");
      setPb10k("");
      setPb21k("");
      setPb42k("");
      
      toast({ title: "Recordes limpos com sucesso." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao limpar recordes" });
    } finally {
      setIsDeletingPB(false);
    }
  };

  const calculatePredictions = () => {
    const d1 = parseFloat(distance);
    const t1 = (parseInt(hours || "0") * 3600) + (parseInt(minutes || "0") * 60) + parseInt(seconds || "0");
    
    if (d1 <= 0 || t1 <= 0) {
      toast({ variant: "destructive", title: "Dados inválidos" });
      return;
    }

    const targets = [
      { name: "5K", dist: 5 }, 
      { name: "10K", dist: 10 }, 
      { name: "MEIA", dist: 21.097 }, 
      { name: "MARATONA", dist: 42.195 }
    ];

    const predictions = targets.map((target) => {
      const t2 = t1 * Math.pow(target.dist / d1, 1.06);
      const h = Math.floor(t2 / 3600);
      const m = Math.floor((t2 % 3600) / 60);
      const s = Math.round(t2 % 60);
      
      const timeStr = h > 0 
        ? `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      
      const paceTotalSec = (t2 / target.dist);
      const paceStr = `${Math.floor(paceTotalSec / 60)}:${Math.round(paceTotalSec % 60).toString().padStart(2, '0')}`;
      
      return { 
        name: target.name, 
        dist: target.dist, 
        time: timeStr, 
        pace: `${paceStr} min/km` 
      };
    });
    setResults(predictions);
  };

  if (!mounted) return null;

  return (
    <div className="space-y-8">
      <Card className="border-border shadow-md overflow-hidden">
        <CardHeader className="bg-secondary/20">
          <div className="flex justify-between items-center">
            <CardTitle className="text-primary flex items-center gap-2 text-xl">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Meus Recordes Reais (PBs)
            </CardTitle>
            {user && (savedRecords && savedRecords.length > 0) && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 gap-1 h-8 text-[10px] font-bold">
                    <Trash2 className="w-3 h-3" /> LIMPAR TODOS
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Limpar todos os recordes?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Isso removerá permanentemente todos os seus recordes pessoais salvos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleClearPBs}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Limpar Tudo
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          <CardDescription>Insira seus melhores tempos oficiais já conquistados.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest text-center block">5K</Label>
              <Input placeholder="00:00" value={pb5k} onChange={(e) => setPb5k(e.target.value)} className="h-12 text-center font-mono font-bold bg-secondary/10" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest text-center block">10K</Label>
              <Input placeholder="00:00" value={pb10k} onChange={(e) => setPb10k(e.target.value)} className="h-12 text-center font-mono font-bold bg-secondary/10" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest text-center block">Meia (21k)</Label>
              <Input placeholder="00:00:00" value={pb21k} onChange={(e) => setPb21k(e.target.value)} className="h-12 text-center font-mono font-bold bg-secondary/10" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest text-center block">Maratona (42k)</Label>
              <Input placeholder="00:00:00" value={pb42k} onChange={(e) => setPb42k(e.target.value)} className="h-12 text-center font-mono font-bold bg-secondary/10" />
            </div>
          </div>
          <Button 
            onClick={handleSaveManualPBs} 
            disabled={isSavingPB || !user}
            className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-bold gap-2 rounded-xl"
          >
            {isSavingPB ? <Loader2 className="w-4 h-4 animate-spin" /> : user ? <Save className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            {user ? "Salvar Meus Recordes" : "Faça login para salvar"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border shadow-md">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Preditor de Prova
          </CardTitle>
          <CardDescription>Estime o que você pode fazer baseado em um treino recente.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">DISTÂNCIA BASE (KM)</Label>
              <Input type="number" value={distance} onChange={(e) => setDistance(e.target.value)} className="h-14 text-center font-mono text-lg bg-secondary/10" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">TEMPO DA SUA PROVA BASE</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input type="number" placeholder="h" value={hours} onChange={(e) => setHours(e.target.value)} className="text-center h-12 bg-secondary/10" />
                <Input type="number" placeholder="m" value={minutes} onChange={(e) => setMinutes(e.target.value)} className="text-center h-12 bg-secondary/10" />
                <Input type="number" placeholder="s" value={seconds} onChange={(e) => setSeconds(e.target.value)} className="text-center h-12 bg-secondary/10" />
              </div>
            </div>
          </div>

          <Button 
            onClick={calculatePredictions} 
            className="w-full h-14 bg-accent hover:bg-accent/90 text-white font-black uppercase text-lg rounded-xl shadow-lg shadow-accent/20"
          >
            CALCULAR PREVISÕES
          </Button>

          {results && (
            <div className="mt-8 border-2 border-accent rounded-3xl overflow-hidden bg-card animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex justify-center">
                   <Button variant="outline" size="sm" onClick={() => {
                      const text = results.map(r => `${r.name}: ${r.time} (${r.pace})`).join('\n');
                      navigator.clipboard.writeText(text);
                      toast({ title: "Copiado!" });
                    }} className="h-8 text-[10px] uppercase font-bold tracking-widest text-muted-foreground border-border/50 rounded-lg">
                      COPIAR PREVISÕES
                   </Button>
                </div>

                <h3 className="text-xl font-black text-accent text-center uppercase tracking-tight">PROJEÇÕES DE PERFORMANCE</h3>

                <div className="space-y-1">
                  {results.map((r, i) => (
                    <div key={i} className="flex justify-between py-5 border-b border-border/30 last:border-0 items-center hover:bg-secondary/5 px-2 rounded-lg">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-4 h-4 text-accent/60" />
                        <div className="flex flex-col">
                          <span className="font-black text-base text-foreground uppercase tracking-tight">{r.name}</span>
                          <span className="text-[10px] text-muted-foreground font-medium lowercase">{r.pace}</span>
                        </div>
                      </div>
                      <span className="font-mono font-black text-xl text-foreground">{r.time}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-primary/5 border-2 border-dashed border-accent/30 rounded-2xl p-6 text-center space-y-4 mt-4">
                  <p className="text-xs font-black text-foreground leading-tight">
                    🚀 Quer transformar essas projeções em recordes reais?
                  </p>
                  <Button asChild className="bg-accent hover:bg-accent/90 text-white font-bold rounded-xl h-12 w-full">
                    <a href="https://wa.me/5555996265753" target="_blank" rel="noopener noreferrer">
                      SOLICITAR PLANO DE TREINO
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
