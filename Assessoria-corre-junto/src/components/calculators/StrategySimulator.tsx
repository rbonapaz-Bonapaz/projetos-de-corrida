
"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, Loader2, Bookmark, LineChart, Info, Lock, Zap, Timer, Activity, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection } from "./_firebase";
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

type StrategyType = "negative" | "even" | "positive";

export function StrategySimulator() {
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();

  const [raceType, setRaceType] = useState("5k");
  const [customDistance, setCustomDistance] = useState("5");
  const [strategyType, setStrategyType] = useState<StrategyType>("negative");
  const [targetPaceMin, setTargetPaceMin] = useState("5");
  const [targetPaceSec, setTargetPaceSec] = useState("00");
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const strategiesQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, `users/${user.uid}/strategies`), orderBy("createdAt", "desc"));
  }, [db, user]);

  const { data: savedStrategies } = useCollection(strategiesQuery);

  const distance = useMemo(() => {
    if (raceType === "5k") return 5;
    if (raceType === "10k") return 10;
    if (raceType === "21k") return 21.097;
    if (raceType === "42k") return 42.195;
    return parseFloat(customDistance) || 0;
  }, [raceType, customDistance]);

  const basePaceDecimal = useMemo(() => {
    return (parseInt(targetPaceMin || "0")) + (parseInt(targetPaceSec || "0") / 60);
  }, [targetPaceMin, targetPaceSec]);

  const formatPace = (decimal: number) => {
    if (!decimal || isNaN(decimal)) return "00:00";
    const min = Math.floor(decimal);
    const sec = Math.round((decimal % 1) * 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const formatTime = (totalMinutes: number) => {
    const h = Math.floor(totalMinutes / 60);
    const m = Math.floor(totalMinutes % 60);
    const s = Math.round((totalMinutes * 60) % 60);
    return h > 0 
      ? `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const strategyData = useMemo(() => {
    if (!showResult || distance <= 0 || basePaceDecimal <= 0) return null;

    let pInicio = basePaceDecimal;
    let pMeio = basePaceDecimal;
    let pFim = basePaceDecimal;

    if (strategyType === "negative") { 
      pInicio = basePaceDecimal * 1.02; 
      pMeio = basePaceDecimal * 0.99; 
      pFim = basePaceDecimal * 0.96; 
    } else if (strategyType === "positive") { 
      pInicio = basePaceDecimal * 0.97; 
      pMeio = basePaceDecimal * 1.01; 
      pFim = basePaceDecimal * 1.05; 
    }

    const segments = [
      {
        name: "Início",
        rangeLabel: `0 a ${(distance * 0.5).toFixed(1)}k`,
        dist: (distance * 0.5),
        pace: pInicio,
        advice: "Poupe energia, ritmo sob controle."
      },
      {
        name: "Manutenção",
        rangeLabel: `${(distance * 0.5).toFixed(1)}k a ${(distance * 0.94).toFixed(1)}k`,
        dist: (distance * 0.44),
        pace: pMeio,
        advice: "Hora de acelerar e buscar o tempo alvo."
      },
      {
        name: "Sprint",
        rangeLabel: `${(distance * 0.94).toFixed(1)}k ao fim`,
        dist: (distance * 0.06),
        pace: pFim,
        advice: "Dê tudo de si, sprint total!"
      }
    ];

    const kmData = [];
    let cumulativeTime = 0;
    for (let i = 1; i <= Math.ceil(distance); i++) {
      const isLast = i >= distance;
      const progress = i / distance;
      const currentPace = progress <= 0.5 ? pInicio : progress <= 0.94 ? pMeio : pFim;
      const kmDist = isLast ? (distance - (i - 1)) : 1;
      cumulativeTime += currentPace * kmDist;
      kmData.push({ 
        km: isLast ? distance.toFixed(1) : i.toString(), 
        passagem: formatTime(cumulativeTime), 
        ritmo: `${formatPace(currentPace)} min/km`, 
        isLast,
        isSprint: isLast && distance > 1
      });
      if (isLast) break;
    }

    return { kmData, segments };
  }, [showResult, distance, basePaceDecimal, strategyType]);

  const handleSaveStrategy = () => {
    if (!user || !db) return;
    setIsSaving(true);
    const strategiesRef = collection(db, `users/${user.uid}/strategies`);
    const data = {
      name: `${raceType.toUpperCase()} - ${formatPace(basePaceDecimal)}`,
      distance,
      targetPace: formatPace(basePaceDecimal),
      strategyType,
      createdAt: serverTimestamp(),
    };

    addDoc(strategiesRef, data)
      .then(() => {
        toast({ title: "Estratégia Salva!" });
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: strategiesRef.path,
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
    const docRef = doc(db, `users/${user.uid}/strategies`, strategyId);
    deleteDoc(docRef)
      .then(() => {
        toast({ title: "Estratégia excluída." });
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
    if (!s) return;
    setCustomDistance(s.distance.toString());
    setRaceType("other");
    const paceStr = s.targetPace || "05:00";
    const [min, sec] = paceStr.split(":");
    setTargetPaceMin(parseInt(min || "5").toString());
    setTargetPaceSec(sec || "00");
    setStrategyType(s.strategyType || "negative");
    setShowResult(true);
  };

  const copyStrategy = () => {
    if (!strategyData) return;
    const text = strategyData.kmData.map(d => `KM ${d.km}: ${d.ritmo} (${d.passagem})`).join('\n');
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!" });
  };

  if (!mounted) return null;

  return (
    <Card className="border-border shadow-md overflow-hidden">
      <CardHeader>
        <CardTitle className="text-primary flex items-center gap-2">
          <LineChart className="w-6 h-6" />
          Estratégia de Prova
        </CardTitle>
        <CardDescription>Planeje seus splits e salve seus planos favoritos.</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
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
                          Você realmente deseja excluir "{s.name}"? Esta ação não pode ser desfeita.
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

        <div className="bg-secondary/20 p-6 rounded-2xl border border-border/40 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">DISTÂNCIA (KM)</Label>
              <div className="flex gap-2">
                <Input 
                  type="number" 
                  value={customDistance} 
                  disabled={raceType !== "other"} 
                  onChange={(e) => setCustomDistance(e.target.value)} 
                  className="bg-card h-12 text-center text-lg font-mono font-bold flex-1" 
                />
                <Select value={raceType} onValueChange={(val) => { 
                  setRaceType(val); 
                  if(val !== "other") setCustomDistance(val === "5k" ? "5" : val === "10k" ? "10" : val === "21k" ? "21.097" : "42.195"); 
                }}>
                  <SelectTrigger className="w-[110px] h-12 border-border/50 font-bold bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5k">5 km</SelectItem>
                    <SelectItem value="10k">10 km</SelectItem>
                    <SelectItem value="21k">Meia</SelectItem>
                    <SelectItem value="42k">Maratona</SelectItem>
                    <SelectItem value="other">Outra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">PACE ALVO (MIN/KM)</Label>
              <div className="flex items-center gap-1 bg-card p-1 rounded-xl border border-border/50 h-12">
                <input type="number" value={targetPaceMin} onChange={(e) => setTargetPaceMin(e.target.value)} className="bg-transparent text-center w-full focus:outline-none font-mono font-bold text-xl" />
                <span className="text-muted-foreground font-bold px-1">:</span>
                <input type="number" value={targetPaceSec} onChange={(e) => setTargetPaceSec(e.target.value)} className="bg-transparent text-center w-full focus:outline-none font-mono font-bold text-xl" />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="space-y-2 flex-1">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">TIPO DE SPLIT</Label>
              <Select value={strategyType} onValueChange={(val: StrategyType) => setStrategyType(val)}>
                <SelectTrigger className="w-full h-12 bg-card border-border/50 font-medium"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="negative">Negative Split (Recomendado)</SelectItem>
                  <SelectItem value="even">Ritmo Constante</SelectItem>
                  <SelectItem value="positive">Positive Split</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:self-end flex-shrink-0">
              <Button 
                onClick={handleSaveStrategy} 
                disabled={isSaving || !user}
                className="h-12 w-full sm:w-auto bg-accent hover:bg-accent/90 text-white gap-2 font-bold px-6 rounded-xl"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : user ? <Save className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {user ? "Salvar Plano" : "Faça login para salvar"}
              </Button>
            </div>
          </div>
        </div>

        <Button 
          onClick={() => setShowResult(true)} 
          className="w-full h-14 bg-accent hover:bg-accent/90 text-white font-black uppercase text-lg rounded-xl shadow-lg shadow-accent/20"
        >
          GERAR ESTRATÉGIA
        </Button>

        {strategyData && (
          <div className="mt-8 border-2 border-accent rounded-3xl overflow-hidden bg-card animate-in fade-in slide-in-from-top-4 duration-500">
             <div className="p-6 md:p-8 space-y-8">
                <div className="flex justify-center">
                   <Button variant="outline" size="sm" onClick={copyStrategy} className="h-8 text-[10px] uppercase font-bold tracking-widest text-muted-foreground border-border/50 rounded-lg">
                      Copiar
                   </Button>
                </div>

                <div className="text-center">
                  <p className="text-sm font-bold text-muted-foreground">Pace Médio Alvo: <span className="text-foreground font-black">{formatPace(basePaceDecimal)} min/km</span></p>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-border/50 pb-2">
                    <span className="text-sm font-black text-primary uppercase tracking-tight">Segmento</span>
                    <span className="text-sm font-black text-primary uppercase tracking-tight">Pace alvo</span>
                  </div>

                  {strategyData.segments.map((seg, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground">
                            {seg.name} ({seg.rangeLabel}) — <span className="text-primary font-black">{seg.dist.toFixed(2)}km</span>
                          </span>
                          <span className="text-[11px] text-muted-foreground italic leading-tight">{seg.advice}</span>
                        </div>
                        <span className="text-base font-black text-foreground font-mono">
                          {formatPace(seg.pace)} <span className="text-[10px] text-muted-foreground font-bold">min/km</span>
                        </span>
                      </div>
                      <div className="h-px bg-border/30 w-full mt-2" />
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-black text-primary uppercase tracking-tight">Parciais de prova</h4>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-none hover:bg-transparent">
                          <TableHead className="h-10 text-[10px] font-black uppercase p-2 text-primary">KM</TableHead>
                          <TableHead className="h-10 text-[10px] font-black uppercase p-2 text-accent text-center">Passagem</TableHead>
                          <TableHead className="h-10 text-[10px] font-black uppercase p-2 text-primary text-right">Ritmo do trecho</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {strategyData.kmData.map((row, idx) => (
                          <TableRow key={idx} className={cn("h-12 border-b border-border/20 last:border-0", row.isSprint && "bg-accent/5 border-l-4 border-l-accent")}>
                            <TableCell className="p-2 text-sm font-black uppercase">
                              KM {row.km} {row.isSprint && "• Sprint final"}
                            </TableCell>
                            <TableCell className="p-2 text-center text-sm font-black text-accent font-mono">{row.passagem}</TableCell>
                            <TableCell className="p-2 text-right text-sm font-bold text-primary font-mono">{row.ritmo}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="bg-secondary/10 p-4 rounded-xl space-y-2">
                  <div className="text-[10px] text-muted-foreground leading-relaxed">
                    Como ler: <span className="text-accent font-black">Passagem</span> mostra o relógio total previsto até cada marca. <span className="text-primary font-black">Ritmo do trecho</span> mostra o pace planejado naquele quilômetro ou trecho final. A última linha destaca o sprint / fechamento da prova.
                  </div>
                </div>

                <div className="bg-primary/5 border-2 border-dashed border-accent/30 rounded-2xl p-6 text-center space-y-4 mt-4">
                  <p className="text-sm font-black text-foreground leading-tight">
                    🚀 Quer uma planilha personalizada para bater seu recorde?
                  </p>
                  <Button asChild className="bg-accent hover:bg-accent/90 text-white font-bold rounded-xl h-12 w-full shadow-lg shadow-accent/20">
                    <a href="https://wa.me/5555996265753" target="_blank" rel="noopener noreferrer">
                      Solicitar via WhatsApp
                    </a>
                  </Button>
                </div>
             </div>
          </div>
        )}

        {!strategyData && (
          <div className="p-5 bg-secondary/10 rounded-2xl border border-border/30 space-y-4 mt-8">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Info className="w-4 h-4" /> Orientações Técnicas
            </div>
            <div className="space-y-3 text-[11px] leading-relaxed text-muted-foreground">
              <p><b>Negative Split (Recomendado):</b> A estratégia de ouro para recordes pessoais. Comece de 2% a 3% mais lento que o pace alvo e acelere na segunda metade.</p>
              <p><b>Ritmo Constante (Even Split):</b> Ideal para quem tem domínio total do pace e conhece seus limites. Exige foco mental alto do início ao fim.</p>
              <p><b>Positive Split:</b> Arriscado. Começar mais rápido pode levar ao esgotamento de energia muito antes da linha de chegada, resultando na famosa "quebra".</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
