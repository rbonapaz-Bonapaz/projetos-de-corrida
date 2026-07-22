
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Footprints, Save, Loader2, Lock, Bookmark, X, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from "firebase/firestore";
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
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function RunWalkCalculator() {
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();

  const [distance, setDistance] = useState("10");
  const [runPaceMin, setRunPaceMin] = useState("5");
  const [runPaceSec, setRunPaceSec] = useState("0");
  const [walkPaceMin, setWalkPaceMin] = useState("10");
  const [walkPaceSec, setWalkPaceSec] = useState("0");
  const [runTimeMin, setRunTimeMin] = useState("20");
  const [runTimeSec, setRunTimeSec] = useState("0");
  const [walkTimeMin, setWalkTimeMin] = useState("2");
  const [walkTimeSec, setWalkTimeSec] = useState("0");
  
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const savedRwQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, `users/${user.uid}/runwalk_strategies`), orderBy("createdAt", "desc"));
  }, [db, user]);

  const { data: savedStrategies } = useCollection(savedRwQuery);

  const calculateRunWalk = () => {
    const dTarget = parseFloat(distance);
    const runPaceTotalMin = (parseInt(runPaceMin || "0")) + (parseInt(runPaceSec || "0") / 60);
    const walkPaceTotalMin = (parseInt(walkPaceMin || "0")) + (parseInt(walkPaceSec || "0") / 60);
    const runTimeTotalMin = (parseInt(runTimeMin || "0")) + (parseInt(runTimeSec || "0") / 60);
    const walkTimeTotalMin = (parseInt(walkTimeMin || "0")) + (parseInt(walkTimeSec || "0") / 60);

    if (dTarget <= 0 || runPaceTotalMin <= 0 || walkPaceTotalMin <= 0 || runTimeTotalMin <= 0) {
      toast({ variant: "destructive", title: "Dados inválidos", description: "Verifique os valores de tempo e pace." });
      return;
    }

    const vRun = 1 / runPaceTotalMin;
    const vWalk = 1 / walkPaceTotalMin;

    const dRunCycle = runTimeTotalMin * vRun;
    const dWalkCycle = walkTimeTotalMin * vWalk;
    const dCycle = dRunCycle + dWalkCycle;
    const tCycle = runTimeTotalMin + walkTimeTotalMin;

    const nCycles = Math.floor(dTarget / dCycle);
    const dRemaining = dTarget - (nCycles * dCycle);

    let tPartial = 0;
    let finalBlock = "Termina correndo";

    if (dRemaining <= dRunCycle) {
      tPartial = dRemaining / vRun;
    } else {
      tPartial = runTimeTotalMin + (dRemaining - dRunCycle) / vWalk;
      finalBlock = "Termina caminhando";
    }

    const totalTimeMin = (nCycles * tCycle) + tPartial;
    const avgPaceMin = totalTimeMin / dTarget;

    const formatTime = (totalMinutes: number) => {
      const h = Math.floor(totalMinutes / 60);
      const m = Math.floor(totalMinutes % 60);
      const s = Math.round((totalMinutes * 60) % 60);
      return h > 0 
        ? `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const formatPace = (paceMinutes: number) => {
      const m = Math.floor(paceMinutes);
      const s = Math.round((paceMinutes % 1) * 60);
      return `${m}:${s.toString().padStart(2, '0')} min/km`;
    };

    setResult({
      strategy: `${runTimeMin.toString().padStart(2, '0')}:${runTimeSec.toString().padStart(2, '0')} correndo + ${walkTimeMin.toString().padStart(2, '0')}:${walkTimeSec.toString().padStart(2, '0')} caminhando`,
      estimatedTime: formatTime(totalTimeMin),
      avgPace: formatPace(avgPaceMin),
      distPerCycle: dCycle.toFixed(2),
      fullCycles: nCycles,
      finalBlock
    });
  };

  const handleSaveStrategy = () => {
    if (!user || !db) return;
    setIsSaving(true);
    const collectionRef = collection(db, `users/${user.uid}/runwalk_strategies`);
    const data = {
      name: `${distance}k - ${runTimeMin}:${runTimeSec}/${walkTimeMin}:${walkTimeSec}`,
      distance: parseFloat(distance),
      runPace: `${runPaceMin}:${runPaceSec}`,
      runTime: `${runTimeMin}:${runTimeSec}`,
      walkPace: `${walkPaceMin}:${walkPaceSec}`,
      walkTime: `${walkTimeMin}:${walkTimeSec}`,
      createdAt: serverTimestamp(),
    };

    addDoc(collectionRef, data)
      .then(() => {
        toast({ title: "Estratégia Run/Walk Salva!" });
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: collectionRef.path,
          operation: 'create',
          requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setIsSaving(false));
  };

  const handleDeleteStrategy = (strategyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !db) return;
    const docRef = doc(db, `users/${user.uid}/runwalk_strategies`, strategyId);
    deleteDoc(docRef)
      .then(() => {
        toast({ title: "Estratégia Run/Walk excluída." });
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const loadStrategy = (s: any) => {
    setDistance(s.distance.toString());
    const [rpMin, rpSec] = s.runPace.split(":");
    setRunPaceMin(rpMin); setRunPaceSec(rpSec);
    const [rtMin, rtSec] = s.runTime.split(":");
    setRunTimeMin(rtMin); setRunTimeSec(rtSec);
    const [wpMin, wpSec] = s.walkPace.split(":");
    setWalkPaceMin(wpMin); setWalkPaceSec(wpSec);
    const [wtMin, wtSec] = s.walkTime.split(":");
    setWalkTimeMin(wtMin); setWalkTimeSec(wtSec);
    toast({ title: "Estratégia carregada" });
  };

  const copyToClipboard = () => {
    if (!result) return;
    const text = `Estratégia Run/Walk: ${result.strategy}\nTempo Estimado: ${result.estimatedTime}\nPace Médio: ${result.avgPace}\nDistância por Ciclo: ${result.distPerCycle} km`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: "Estratégia copiada." });
  };

  if (!mounted) return null;

  return (
    <Card className="border-border shadow-md">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-primary flex items-center gap-2 text-xl">
          <Footprints className="w-5 h-5 md:w-6 md:h-6" />
          Corrida + Caminhada
        </CardTitle>
        <CardDescription className="text-xs">Defina sua estratégia de intercalar ritmos.</CardDescription>
      </CardHeader>
      <CardContent className="p-4 md:p-6 space-y-6">
        {user && savedStrategies && savedStrategies.length > 0 && (
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1">
              <Bookmark className="w-3 h-3" /> Salvas
            </Label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {savedStrategies.map((s: any) => (
                <div key={s.id} className="relative group shrink-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => loadStrategy(s)}
                    className="whitespace-nowrap h-8 text-[10px] font-bold pr-7 border-border/50"
                  >
                    {s.name}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button 
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1 hover:bg-destructive/10 rounded-full text-muted-foreground hover:text-destructive transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir estratégia?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Você deseja excluir a estratégia "{s.name}"?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={(e) => handleDeleteStrategy(s.id, e as any)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Distância Alvo (km)</Label>
            <Input type="number" value={distance} onChange={(e) => setDistance(e.target.value)} className="h-14 text-center font-mono text-lg bg-secondary/10" />
            <div className="grid grid-cols-4 gap-2">
              <Button variant="outline" size="sm" className="text-[10px] font-bold h-10 border-border/50" onClick={() => setDistance("5")}>5k</Button>
              <Button variant="outline" size="sm" className="text-[10px] font-bold h-10 border-border/50" onClick={() => setDistance("10")}>10k</Button>
              <Button variant="outline" size="sm" className="text-[10px] font-bold h-10 border-border/50" onClick={() => setDistance("21.097")}>Meia</Button>
              <Button variant="outline" size="sm" className="text-[10px] font-bold h-10 border-border/50" onClick={() => setDistance("42.195")}>Maratona</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10 space-y-4">
              <div className="space-y-2">
                <Label className="text-green-700 dark:text-green-400 font-bold text-[10px] uppercase tracking-widest">PACE CORRENDO (MIN/KM)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" placeholder="Min" value={runPaceMin} onChange={(e) => setRunPaceMin(e.target.value)} className="text-center h-12 border-green-500/20 bg-card font-mono text-lg" />
                  <Input type="number" placeholder="Seg" value={runPaceSec} onChange={(e) => setRunPaceSec(e.target.value)} className="text-center h-12 border-green-500/20 bg-card font-mono text-lg" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-green-700 dark:text-green-400 font-bold text-[10px] uppercase tracking-widest">CORRE POR (MINUTOS)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" placeholder="Min" value={runTimeMin} onChange={(e) => setRunTimeMin(e.target.value)} className="text-center h-12 border-green-500/20 bg-card font-mono text-lg" />
                  <Input type="number" placeholder="Seg" value={runTimeSec} onChange={(e) => setRunTimeSec(e.target.value)} className="text-center h-12 border-green-500/20 bg-card font-mono text-lg" />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/10 space-y-4">
              <div className="space-y-2">
                <Label className="text-yellow-700 dark:text-yellow-400 font-bold text-[10px] uppercase tracking-widest">PACE CAMINHANDO (MIN/KM)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" placeholder="Min" value={walkPaceMin} onChange={(e) => setWalkPaceMin(e.target.value)} className="text-center h-12 border-yellow-500/20 bg-card font-mono text-lg" />
                  <Input type="number" placeholder="Seg" value={walkPaceSec} onChange={(e) => setWalkPaceSec(e.target.value)} className="text-center h-12 border-yellow-500/20 bg-card font-mono text-lg" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-yellow-700 dark:text-yellow-400 font-bold text-[10px] uppercase tracking-widest">CAMINHA POR (MINUTOS)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" placeholder="Min" value={walkTimeMin} onChange={(e) => setWalkTimeMin(e.target.value)} className="text-center h-12 border-yellow-500/20 bg-card font-mono text-lg" />
                  <Input type="number" placeholder="Seg" value={walkTimeSec} onChange={(e) => setWalkTimeSec(e.target.value)} className="text-center h-12 border-yellow-500/20 bg-card font-mono text-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-2">
          <Button onClick={calculateRunWalk} className="w-full h-14 bg-accent hover:bg-accent/90 text-white font-black uppercase text-lg rounded-xl shadow-lg shadow-accent/20">
            CALCULAR ESTRATÉGIA
          </Button>
          <Button 
            onClick={handleSaveStrategy} 
            disabled={isSaving || !user}
            variant="outline"
            className="w-full h-12 gap-2 border-accent text-accent hover:bg-accent/5 font-bold rounded-xl"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : user ? <Save className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            {user ? "SALVAR ESTRATÉGIA" : "FAÇA LOGIN PARA SALVAR"}
          </Button>
        </div>

        {result && (
          <div className="mt-8 border-2 border-accent rounded-3xl overflow-hidden bg-card animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex justify-center">
                 <Button variant="outline" size="sm" onClick={copyToClipboard} className="h-8 text-[10px] uppercase font-bold tracking-widest text-muted-foreground border-border/50 rounded-lg">
                    COPIAR PLANO
                 </Button>
              </div>

              <h3 className="text-xl font-black text-accent text-center uppercase tracking-tight">PLANO PERSONALIZADO RUN/WALK</h3>

              <div className="space-y-2">
                <div className="flex justify-between py-4 border-b border-border/30">
                  <span className="font-bold text-sm text-foreground">Ciclos Sugeridos</span>
                  <span className="font-mono font-black text-foreground">{result.strategy}</span>
                </div>
                <div className="flex justify-between py-4 border-b border-border/30">
                  <span className="font-bold text-sm text-foreground">Tempo Estimado Final</span>
                  <span className="font-mono font-black text-xl text-accent">{result.estimatedTime}</span>
                </div>
                <div className="flex justify-between py-4 border-b border-border/30">
                  <span className="font-bold text-sm text-foreground">Pace Médio do Plano</span>
                  <span className="font-mono font-black text-foreground">{result.avgPace}</span>
                </div>
                <div className="flex justify-between py-4 border-b border-border/30">
                  <span className="font-bold text-sm text-foreground">Distância por Ciclo</span>
                  <span className="font-mono font-black text-foreground">{result.distPerCycle} km</span>
                </div>
                <div className="flex justify-between py-4 border-b border-border/30">
                  <span className="font-bold text-sm text-foreground">Total de Ciclos Completos</span>
                  <span className="font-mono font-black text-foreground">{result.fullCycles}</span>
                </div>
                <div className="flex justify-between py-4 border-b border-border/30">
                  <span className="font-bold text-sm text-foreground">Fechamento da Prova</span>
                  <span className="font-black text-accent uppercase text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {result.finalBlock}
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground leading-relaxed pt-2 text-center italic">
                Nota: O cálculo assume que você inicia cada ciclo correndo. Ajuste a intensidade se sentir cansaço excessivo.
              </p>

              <div className="bg-primary/5 border-2 border-dashed border-accent/30 rounded-2xl p-6 text-center space-y-4">
                <p className="text-xs font-black text-foreground leading-tight">
                  🏃 Quer evoluir do Run/Walk para correr distâncias maiores sem parar?
                </p>
                <Button asChild className="bg-accent hover:bg-accent/90 text-white font-bold rounded-xl h-12 w-full">
                  <a href="https://wa.me/5555996265753" target="_blank" rel="noopener noreferrer">
                    SOLICITAR PLANO DE EVOLUÇÃO
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
