
"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { User, ShieldCheck, Loader2, Heart, Scale, Calendar, Trophy, Bookmark, Zap, Activity, Info } from "lucide-react";
import { useUser, useFirestore, useDoc } from "@/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Footer } from "@/components/Footer";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useAuth } from "@/firebase";
import { differenceInYears, parseISO } from "date-fns";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function PerfilPage() {
  const { user, isLoading: userLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();

  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    birthDate: "",
    weight: "",
    maxHR: "",
    restHR: "",
    thresholdHR: "",
    thresholdPace: "",
    fitnessLevel: "intermediate",
  });

  const profilePath = user ? `users/${user.uid}/profile/current` : null;
  const { data: existingData, isLoading: dataLoading } = useDoc(profilePath);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (existingData) {
      setFormData({
        birthDate: existingData.birthDate || "",
        weight: existingData.weight?.toString() || "",
        maxHR: existingData.maxHR?.toString() || "",
        restHR: existingData.restHR?.toString() || "",
        thresholdHR: existingData.thresholdHR?.toString() || "",
        thresholdPace: existingData.thresholdPace || "",
        fitnessLevel: existingData.fitnessLevel || "intermediate",
      });
    }
  }, [existingData]);

  useEffect(() => {
    if (formData.birthDate && mounted) {
      try {
        const birth = parseISO(formData.birthDate);
        if (!isNaN(birth.getTime())) {
          setCalculatedAge(differenceInYears(new Date(), birth));
        }
      } catch (e) {
        setCalculatedAge(null);
      }
    } else {
      setCalculatedAge(null);
    }
  }, [formData.birthDate, mounted]);

  const handleLogin = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({ title: "Bem-vindo!" });
    } catch (error) {
      console.error(error);
      toast({ 
        variant: "destructive", 
        title: "Erro no Login",
        description: "Verifique se o domínio está autorizado no Firebase Console."
      });
    }
  };

  const handleSave = async () => {
    if (!user || !db || !profilePath) return;

    setSaving(true);
    const docRef = doc(db, profilePath);
    const syncData = {
      ...formData,
      weight: formData.weight ? Number(formData.weight) : 0,
      maxHR: formData.maxHR ? Number(formData.maxHR) : 0,
      restHR: formData.restHR ? Number(formData.restHR) : 0,
      thresholdHR: formData.thresholdHR ? Number(formData.thresholdHR) : 0,
      updatedAt: serverTimestamp(),
    };

    setDoc(docRef, syncData, { merge: true })
      .then(() => {
        toast({ title: "Perfil Atualizado!", description: "Suas métricas foram salvas com segurança." });
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

  if (!mounted || userLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background running-bg-gradient">
        <Navbar />
        <main className="container mx-auto px-4 py-8 md:py-12 max-w-2xl">
          <div className="text-center space-y-8">
            <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Evolua sua conta grátis</h1>
              <p className="text-sm text-muted-foreground">Sincronize seus dados e acesse ferramentas exclusivas.</p>
            </div>
            <div className="grid gap-3 text-left">
              <BenefitItem icon={<Zap className="text-yellow-500" />} title="Auto-preenchimento" desc="Peso, Pace e FC carregados automaticamente." />
              <BenefitItem icon={<Trophy className="text-primary" />} title="Quadro de Recordes (PBs)" desc="Salve e acompanhe seus melhores tempos." />
              <BenefitItem icon={<Bookmark className="text-accent" />} title="Cofre de Estratégias" desc="Guarde seus planos de prova." />
            </div>
            <Button onClick={handleLogin} className="w-full h-14 text-lg font-bold gap-3 rounded-xl shadow-xl shadow-primary/20 text-white">
              <User className="w-5 h-5" /> Entrar com Google
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background running-bg-gradient pb-20">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2 flex items-center gap-3"><User className="w-6 h-6 md:w-8 md:h-8" />Meu Perfil</h1>
          <p className="text-sm text-muted-foreground">Automatize seus cálculos de performance.</p>
        </header>

        <Card className="border-border overflow-hidden bg-card">
          <CardHeader className="bg-secondary/20 p-6">
            <CardTitle className="text-lg md:text-xl">Métricas de Atleta</CardTitle>
            <CardDescription className="text-xs">Sincronize as calculadoras com seus dados reais.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pt-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="birthDate" className="flex items-center gap-2 text-foreground"><Calendar className="w-4 h-4" /> Nascimento</Label>
                <Input id="birthDate" type="date" className="h-12 bg-secondary/50" value={formData.birthDate} onChange={(e) => setFormData({...formData, birthDate: e.target.value})} />
                {calculatedAge !== null && <p className="text-[10px] font-bold text-primary">Idade: {calculatedAge} anos</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight" className="flex items-center gap-2 text-foreground"><Scale className="w-4 h-4" /> Peso (kg)</Label>
                <Input id="weight" type="number" placeholder="Ex: 78.5" className="h-12 bg-secondary/50" value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t">
              <div className="space-y-2">
                <Label htmlFor="maxHR" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                  <Heart className="w-4 h-4 text-red-500" /> FC Máxima
                </Label>
                <Input id="maxHR" type="number" placeholder="Ex: 186" className="h-12 bg-secondary/50" value={formData.maxHR} onChange={(e) => setFormData({...formData, maxHR: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="restHR" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                  <Heart className="w-4 h-4 text-blue-500" /> FC Repouso
                </Label>
                <Input id="restHR" type="number" placeholder="Ex: 49" className="h-12 bg-secondary/50" value={formData.restHR} onChange={(e) => setFormData({...formData, restHR: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="thresholdHR" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                  <Activity className="w-4 h-4 text-orange-500" /> FC Limiar
                </Label>
                <Input id="thresholdHR" type="number" placeholder="Ex: 165" className="h-12 bg-secondary/50" value={formData.thresholdHR} onChange={(e) => setFormData({...formData, thresholdHR: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
              <div className="space-y-2">
                <Label htmlFor="thresholdPace" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                  <Zap className="w-4 h-4 text-accent" /> Pace Limiar (min/km)
                </Label>
                <Input id="thresholdPace" placeholder="Ex: 04:47" className="h-12 bg-secondary/50" value={formData.thresholdPace} onChange={(e) => setFormData({...formData, thresholdPace: e.target.value})} />
              </div>
              <div className="flex items-center gap-3 bg-primary/5 p-4 rounded-xl border border-primary/10">
                <Info className="w-5 h-5 text-primary shrink-0" />
                <div className="text-[10px] text-muted-foreground leading-tight">
                  Encontre no seu relógio: <br />
                  <b>Garmin:</b> Zonas FC {" > "} FC Máx. <br />
                  <b>Coros:</b> Perfil {" > "} Zonas FC.
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t">
              <Label className="text-lg">Nível de Condicionamento</Label>
              <RadioGroup value={formData.fitnessLevel} onValueChange={(val) => setFormData({...formData, fitnessLevel: val})} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {["beginner", "intermediate", "advanced"].map((lvl) => (
                  <div key={lvl} className="flex items-center space-x-2 border p-4 rounded-xl hover:bg-secondary/50 cursor-pointer border-border">
                    <RadioGroupItem value={lvl} id={lvl} />
                    <Label htmlFor={lvl} className="cursor-pointer capitalize">{lvl === 'beginner' ? 'Iniciante' : lvl === 'intermediate' ? 'Intermediário' : 'Avançado'}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
          <CardFooter className="bg-secondary/10 p-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground"><ShieldCheck className="w-4 h-4 text-accent" />Dados privados.</div>
            <Button onClick={handleSave} disabled={saving} className="font-bold bg-accent hover:bg-accent/90 text-white min-w-[140px] h-12 rounded-xl">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Salvar Perfil"}
            </Button>
          </CardFooter>
        </Card>
        <Footer />
      </main>
    </div>
  );
}

function BenefitItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex gap-4 p-4 rounded-xl border border-border/50 bg-card">
      <div className="shrink-0 mt-1">{icon}</div>
      <div className="space-y-1">
        <p className="font-bold text-sm text-foreground">{title}</p>
        <p className="text-[11px] text-muted-foreground leading-tight">{desc}</p>
      </div>
    </div>
  );
}
