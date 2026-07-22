'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';

import { TrainingContext } from '@/contexts/TrainingContext';
import { useToast } from '@/hooks/use-toast';
import { fileToDataURI, cn } from "@/lib/utils";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    Form, 
    FormControl, 
    FormField, 
    FormItem, 
    FormLabel, 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { 
    Loader2, 
    Zap, 
    Camera, 
    CheckCircle2,
    ShieldCheck,
    Activity,
    Trophy,
    Calendar,
    Dumbbell,
    MessageSquare,
    Apple,
    Timer,
    Milestone,
    History
} from 'lucide-react';

const weekDays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const profileSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório.'),
  avatarUrl: z.string().default(''),
  birthDate: z.string().default(''),
  gender: z.enum(['male', 'female', 'other']).default('male'),
  currentWeight: z.coerce.number().default(70),
  height: z.coerce.number().default(175),
  restingHr: z.coerce.number().default(50),
  vo2Max: z.coerce.number().default(45),
  thresholdPace: z.string().default('4:50'),
  thresholdHr: z.coerce.number().default(165),
  experienceLevel: z.enum(['run_walk', 'beginner', 'intermediate', 'advanced']).default('beginner'),
  trainingDays: z.array(z.string()).default(['Segunda', 'Quarta', 'Sexta']),
  longRunDay: z.string().default('Domingo'),
  weeklyMileageGoal: z.coerce.number().default(30),
  currentWeeklyMileage: z.coerce.number().default(0),
  longestRun: z.coerce.number().default(10),
  mainObjective: z.string().default('performance'),
  trainingHistory: z.string().default(''),
  planGenerationType: z.enum(['full', 'blocks']).default('blocks'),
  raceName: z.string().default(''),
  raceDistance: z.string().default('10k'),
  raceDate: z.string().default(''),
  targetPace: z.string().default(''),
  targetTime: z.string().default(''),
  // Dieta
  dietAestheticGoal: z.string().default('performance'),
  dietTargetWeight: z.coerce.number().default(0),
  dietActivityLevel: z.string().default('moderate'),
  dietStyle: z.string().default('onivoro'),
  dietMealCount: z.coerce.number().default(4),
  dietTrainingTiming: z.string().default('manha'),
  dietSupplements: z.string().default(''),
  dietAllergies: z.string().default(''),
  dietPreferredFoods: z.string().default(''),
  dietExcludedFoods: z.string().default(''),
  // Força
  strengthSplit: z.string().default('full_body'),
  strengthObjective: z.string().default('hypertryphy'),
  strengthFrequency: z.coerce.number().default(2),
  strengthDays: z.array(z.string()).default([]),
  strengthLocation: z.string().default('academia'),
  strengthFocusAreas: z.string().default(''),
  strengthLimitations: z.string().default(''),
  legDay: z.string().default('Quinta'),
  prBench: z.coerce.number().default(0),
  prSquat: z.coerce.number().default(0),
  prDeadlift: z.coerce.number().default(0),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const context = React.useContext(TrainingContext);
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [targetMode, setTargetMode] = useState<'time' | 'pace'>('pace');
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '', avatarUrl: '', birthDate: '', gender: 'male',
      currentWeight: 70, height: 175, restingHr: 50, vo2Max: 45,
      thresholdPace: '4:50', thresholdHr: 165, experienceLevel: 'beginner',
      trainingDays: ['Segunda', 'Quarta', 'Sexta'], longRunDay: 'Domingo',
      weeklyMileageGoal: 30, currentWeeklyMileage: 0, longestRun: 10, mainObjective: 'performance',
      trainingHistory: '',
      planGenerationType: 'blocks', raceName: '', raceDistance: '10k',
      raceDate: '', targetPace: '', targetTime: '',
      dietAestheticGoal: 'performance', dietTargetWeight: 0, dietActivityLevel: 'moderate',
      dietStyle: 'onivoro', dietMealCount: 4, dietTrainingTiming: 'manha',
      dietSupplements: '', dietAllergies: '', dietPreferredFoods: '', dietExcludedFoods: '',
      strengthSplit: 'full_body', strengthObjective: 'hypertryphy', strengthFrequency: 2,
      strengthDays: [], strengthLocation: 'academia', strengthFocusAreas: '', strengthLimitations: '',
      legDay: 'Quinta', prBench: 0, prSquat: 0, prDeadlift: 0,
    }
  });

  useEffect(() => {
    if (context?.isHydrated && context.activeProfile) {
      const p = context.activeProfile;
      form.reset({
        name: p.name || '',
        avatarUrl: p.avatarUrl || '',
        birthDate: p.birthDate || '',
        gender: p.gender || 'male',
        currentWeight: p.currentWeight || 70,
        height: p.height || 175,
        restingHr: p.restingHr || 50,
        vo2Max: p.vo2Max || 45,
        thresholdPace: p.thresholdPace || '4:50',
        thresholdHr: p.thresholdHr || 165,
        experienceLevel: p.experienceLevel || 'beginner',
        trainingDays: p.trainingDays || ['Segunda', 'Quarta', 'Sexta'],
        longRunDay: p.longRunDay || 'Domingo',
        weeklyMileageGoal: p.weeklyMileageGoal || 30,
        currentWeeklyMileage: p.currentWeeklyMileage || 0,
        longestRun: p.longestRun || 10,
        mainObjective: p.mainObjective || 'performance',
        trainingHistory: p.trainingHistory || '',
        planGenerationType: p.planGenerationType || 'blocks',
        raceName: p.raceName || '',
        raceDistance: p.raceDistance || '10k',
        raceDate: p.raceDate || '',
        targetPace: p.targetPace || '',
        targetTime: p.targetTime || '',
        dietAestheticGoal: p.dietPreferences?.aestheticGoal || 'performance',
        dietTargetWeight: p.dietPreferences?.targetWeight || 0,
        dietActivityLevel: p.dietPreferences?.activityLevel || 'moderate',
        dietStyle: p.dietPreferences?.dietStyle || 'onivoro',
        dietMealCount: p.dietPreferences?.mealCount || 4,
        dietTrainingTiming: p.dietPreferences?.trainingTiming || 'manha',
        dietSupplements: p.dietPreferences?.supplements || '',
        dietAllergies: p.dietPreferences?.allergies || '',
        dietPreferredFoods: p.dietPreferences?.preferredFoods || '',
        dietExcludedFoods: p.dietPreferences?.excludedFoods || '',
        strengthSplit: p.strengthPreferences?.splitPreference || 'full_body',
        strengthObjective: p.strengthPreferences?.objective || 'hypertryphy',
        strengthFrequency: p.strengthPreferences?.frequency || 2,
        strengthDays: p.strengthPreferences?.trainingDays || [],
        strengthLocation: p.strengthPreferences?.equipment?.[0] || 'academia',
        strengthFocusAreas: (p.strengthPreferences?.focusAreas || []).join(', '),
        strengthLimitations: p.strengthPreferences?.limitations || '',
        legDay: p.strengthPreferences?.legDay || (p as any).legDay || 'Quinta',
        prBench: p.strengthPreferences?.prBench || 0,
        prSquat: p.strengthPreferences?.prSquat || 0,
        prDeadlift: p.strengthPreferences?.prDeadlift || 0,
      });
      if (p.targetTime && !p.targetPace) setTargetMode('time');
      else setTargetMode('pace');
    }
  }, [context?.isHydrated, context?.activeProfile?.id, form]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const uri = await fileToDataURI(e.target.files[0]);
      form.setValue('avatarUrl', uri);
    }
  };

  const onSave = async (data: ProfileFormValues) => {
    if (!context) return;
    setIsSaving(true);
    try {
      await context.saveProfile({
        ...data,
        dietPreferences: {
          aestheticGoal: data.dietAestheticGoal as any,
          targetWeight: data.dietTargetWeight,
          activityLevel: data.dietActivityLevel as any,
          dietStyle: data.dietStyle as any,
          mealCount: data.dietMealCount,
          trainingTiming: data.dietTrainingTiming as any,
          supplements: data.dietSupplements,
          allergies: data.dietAllergies,
          preferredFoods: data.dietPreferredFoods,
          excludedFoods: data.dietExcludedFoods
        },
        strengthPreferences: {
          legDay: data.legDay,
          splitPreference: data.strengthSplit as any,
          objective: data.strengthObjective as any,
          frequency: data.strengthFrequency,
          trainingDays: data.strengthDays,
          equipment: data.strengthLocation ? [data.strengthLocation] : [],
          focusAreas: data.strengthFocusAreas
            ? data.strengthFocusAreas.split(',').map(s => s.trim()).filter(Boolean)
            : [],
          limitations: data.strengthLimitations,
          prBench: data.prBench,
          prSquat: data.prSquat,
          prDeadlift: data.prDeadlift
        }
      });
      toast({ title: "Laboratório Sincronizado" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerate = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;
    setIsProcessing(true);
    try {
      const data = form.getValues();
      await onSave(data);
      if (context?.activeProfile) {
        await context.generateRunningPlanAsync(context.activeProfile);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedTrainingDays = form.watch('trainingDays') || [];
  const selectedStrengthDays = form.watch('strengthDays') || [];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-headline font-black uppercase italic tracking-tighter text-white leading-none">MEUS <span className="text-primary">DADOS</span></h1>
              <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest italic mt-1 opacity-60">Cockpit de Performance CorreJunto</p>
            </div>
          </div>
          
          <Button asChild variant="outline" className="h-12 border-primary/20 text-primary font-black uppercase italic text-[11px] tracking-widest rounded-2xl hover:bg-primary hover:text-black transition-all gap-2 px-6">
            <Link href="/coach">
              <MessageSquare size={18} /> TREINADOR IA
            </Link>
          </Button>
        </header>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-8">
            <Tabs defaultValue="corrida" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-secondary/20 p-1 rounded-xl h-auto gap-1">
                <TabsTrigger value="perfil" className="py-3 font-headline font-black text-[9px] uppercase italic">IDENTIDADE</TabsTrigger>
                <TabsTrigger value="corrida" className="py-3 font-headline font-black text-[9px] uppercase italic text-primary">CORRIDA</TabsTrigger>
                <TabsTrigger value="dieta" className="py-3 font-headline font-black text-[9px] uppercase italic text-green-400">DIETA</TabsTrigger>
                <TabsTrigger value="forca" className="py-3 font-headline font-black text-[9px] uppercase italic text-orange-500">FORÇA</TabsTrigger>
              </TabsList>

              <TabsContent value="perfil" className="mt-8 space-y-6">
                <Card className="bg-[#0a0c10] border-border/50 rounded-[2.5rem] overflow-hidden shadow-2xl">
                  <CardHeader className="bg-secondary/10 border-b border-border/10 p-8 flex flex-row items-center gap-8">
                    <div className="relative">
                      <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-primary/20 rounded-2xl">
                        <AvatarImage src={form.watch('avatarUrl')} className="object-cover" />
                        <AvatarFallback className="font-black italic bg-secondary text-2xl">{form.watch('name')?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                      <Button type="button" variant="secondary" size="icon" className="absolute -bottom-2 -right-2 rounded-lg bg-primary text-black size-8" onClick={() => document.getElementById('avatar-input')?.click()}>
                        <Camera size={14} />
                      </Button>
                      <input id="avatar-input" type="file" className="sr-only" onChange={handleAvatarChange} accept="image/*" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-2xl font-headline font-black uppercase italic text-white leading-none">Perfil Atleta</h2>
                      <p className="text-xs font-bold text-muted-foreground italic">Identificação de elite.</p>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="name" render={({field}) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">Nome Completo</FormLabel>
                        <FormControl><Input {...field} className="bg-black/30 border-border/40 font-bold h-12 rounded-xl" /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="birthDate" render={({field}) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">Data de Nascimento</FormLabel>
                        <FormControl><Input type="date" {...field} className="bg-black/30 border-border/40 font-bold h-12 rounded-xl text-center" /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="gender" render={({field}) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">Gênero</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger className="bg-black/30 border-border/40 h-12 rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent className="bg-[#0c0e12]">
                            <SelectItem value="male">Masculino</SelectItem>
                            <SelectItem value="female">Feminino</SelectItem>
                            <SelectItem value="other">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="corrida" className="mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                  {/* FISIOLOGIA */}
                  <Card className="bg-[#0a0c10] border-border/50 rounded-[2rem] overflow-hidden shadow-2xl h-full">
                    <CardHeader className="bg-primary/5 border-b border-white/5 p-8">
                      <h2 className="text-xl font-headline font-black uppercase italic text-primary leading-none flex items-center gap-3">
                        <Activity className="size-6" /> FISIOLOGIA
                      </h2>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                      <div className="grid grid-cols-2 gap-6">
                        <FormField control={form.control} name="currentWeight" render={({field}) => (
                          <FormItem className="space-y-2">
                            <Label className="text-[9px] font-black text-muted-foreground uppercase italic tracking-widest text-center block">PESO (KG)</Label>
                            <FormControl><Input type="number" {...field} className="bg-black/40 text-center font-black h-12 rounded-2xl border-white/5 text-lg" /></FormControl>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="vo2Max" render={({field}) => (
                          <FormItem className="space-y-2">
                            <Label className="text-[9px] font-black text-primary uppercase italic tracking-widest text-center block">VDOT / VO2</Label>
                            <FormControl><Input type="number" step="0.1" {...field} className="bg-black/40 text-center font-black h-12 rounded-2xl border-primary/30 text-lg text-primary" /></FormControl>
                          </FormItem>
                        )} />
                      </div>
                      <div className="space-y-6 pt-4 border-t border-white/5">
                        <FormField control={form.control} name="thresholdPace" render={({field}) => (
                          <FormItem className="space-y-2">
                            <Label className="text-[9px] font-black text-muted-foreground uppercase italic tracking-widest">PACE LIMIAR (T-PACE)</Label>
                            <FormControl><Input placeholder="4:50" {...field} className="bg-black/40 h-12 text-center font-black italic rounded-2xl border-primary/20 text-lg" /></FormControl>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="thresholdHr" render={({field}) => (
                          <FormItem className="space-y-2">
                            <Label className="text-[9px] font-black text-muted-foreground uppercase italic tracking-widest">FC LIMIAR (LTHR)</Label>
                            <FormControl><Input type="number" {...field} className="bg-black/40 h-12 text-center font-black italic rounded-2xl border-primary/20 text-lg" /></FormControl>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="restingHr" render={({field}) => (
                          <FormItem className="space-y-2">
                            <Label className="text-[9px] font-black text-muted-foreground uppercase italic tracking-widest">FC REPOUSO</Label>
                            <FormControl><Input type="number" {...field} className="bg-black/40 h-12 text-center font-black italic rounded-2xl border-white/5 text-lg" /></FormControl>
                          </FormItem>
                        )} />
                      </div>
                    </CardContent>
                  </Card>

                  {/* PLANEJAMENTO */}
                  <Card className="bg-[#0a0c10] border-border/50 rounded-[2rem] overflow-hidden shadow-2xl h-full">
                    <CardHeader className="bg-secondary/10 border-b border-white/5 p-8">
                      <h2 className="text-xl font-headline font-black uppercase italic text-white leading-none flex items-center gap-3">
                        <Calendar className="size-6 text-primary" /> PLANEJAMENTO
                      </h2>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                      <div className="grid grid-cols-2 gap-6">
                        <FormField control={form.control} name="experienceLevel" render={({field}) => (
                          <FormItem className="space-y-2">
                            <Label className="text-[10px] font-black text-muted-foreground uppercase italic tracking-widest">NÍVEL</Label>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger className="bg-black/40 border-white/5 h-11 font-black italic rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent className="bg-[#0c0e12]">
                                <SelectItem value="run_walk" className="font-bold italic">CAMINHADA/CORRIDA</SelectItem>
                                <SelectItem value="beginner" className="font-bold italic">INICIANTE</SelectItem>
                                <SelectItem value="intermediate" className="font-bold italic">INTERMEDIÁRIO</SelectItem>
                                <SelectItem value="advanced" className="font-bold italic">ELITE</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="weeklyMileageGoal" render={({field}) => (
                          <FormItem className="space-y-2">
                            <Label className="text-[10px] font-black text-primary uppercase italic tracking-widest flex items-center gap-1.5"><Milestone size={12}/> META KM</Label>
                            <FormControl><Input type="number" {...field} className="bg-black/40 h-11 text-center font-black rounded-xl border-primary/20" /></FormControl>
                          </FormItem>
                        )} />
                      </div>

                      <FormField control={form.control} name="mainObjective" render={({field}) => (
                        <FormItem className="space-y-2">
                          <Label className="text-[10px] font-black text-muted-foreground uppercase italic tracking-widest">OBJETIVO PRINCIPAL</Label>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger className="bg-black/40 border-white/5 h-11 font-black italic rounded-xl text-[11px]"><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent className="bg-[#0c0e12]">
                              <SelectItem value="saude" className="font-bold italic">SAÚDE / CONDICIONAMENTO</SelectItem>
                              <SelectItem value="emagrecimento" className="font-bold italic">EMAGRECIMENTO</SelectItem>
                              <SelectItem value="primeira_prova" className="font-bold italic">TERMINAR PRIMEIRA PROVA</SelectItem>
                              <SelectItem value="recorde" className="font-bold italic">BATER RECORDE (PR)</SelectItem>
                              <SelectItem value="performance" className="font-bold italic">PERFORMANCE / COMPETIR</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />

                      <div className="grid grid-cols-2 gap-6">
                        <FormField control={form.control} name="currentWeeklyMileage" render={({field}) => (
                          <FormItem className="space-y-2">
                            <Label className="text-[9px] font-black text-muted-foreground uppercase italic tracking-widest text-center block">VOLUME ATUAL (KM/SEM)</Label>
                            <FormControl><Input type="number" {...field} className="bg-black/40 h-11 text-center font-black rounded-xl border-white/5" /></FormControl>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="longestRun" render={({field}) => (
                          <FormItem className="space-y-2">
                            <Label className="text-[9px] font-black text-muted-foreground uppercase italic tracking-widest text-center block">MAIOR LONGO (KM)</Label>
                            <FormControl><Input type="number" {...field} className="bg-black/40 h-11 text-center font-black rounded-xl border-white/5" /></FormControl>
                          </FormItem>
                        )} />
                      </div>

                      <div className="space-y-4">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase italic tracking-widest">DIAS DE TREINO</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {weekDays.map((day) => (
                            <div key={day} className={cn("flex items-center space-x-3 p-3 rounded-2xl border transition-all cursor-pointer", selectedTrainingDays.includes(day) ? "bg-primary/10 border-primary/40" : "bg-black/30 border-white/5 hover:border-primary/20")} onClick={() => {
                                const current = form.getValues('trainingDays') || [];
                                const next = current.includes(day) ? current.filter(d => d !== day) : [...current, day];
                                form.setValue('trainingDays', next);
                              }}>
                              <Checkbox checked={selectedTrainingDays.includes(day)} className="size-4" />
                              <span className="text-[10px] font-black uppercase italic text-white/90">{day}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <FormField control={form.control} name="longRunDay" render={({field}) => (
                        <FormItem className="space-y-2">
                          <Label className="text-[9px] font-black text-muted-foreground uppercase italic tracking-widest">DIA DO LONGÃO</Label>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger className="bg-black/40 h-11 rounded-xl text-[10px] font-bold"><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent className="bg-[#0c0e12]">
                              {weekDays.filter(day => selectedTrainingDays.includes(day)).map(d => <SelectItem key={d} value={d} className="text-[10px] font-bold italic">{d.toUpperCase()}</SelectItem>)}
                              {selectedTrainingDays.length === 0 && <SelectItem value="Domingo" disabled className="text-[10px]">Selecione dias primeiro</SelectItem>}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="trainingHistory" render={({field}) => (
                        <FormItem className="space-y-2">
                          <Label className="text-[10px] font-black text-muted-foreground uppercase italic tracking-widest flex items-center gap-1.5"><History size={12}/> HISTÓRICO TÉCNICO</Label>
                          <FormControl><Textarea {...field} placeholder="Relate seu volume recente ou lesões..." className="bg-black/40 border-white/5 rounded-xl min-h-[80px] text-xs italic" /></FormControl>
                        </FormItem>
                      )} />
                    </CardContent>
                  </Card>

                  {/* PROVA ALVO */}
                  <Card className="bg-[#0a0c10] border-border/50 rounded-[2rem] overflow-hidden shadow-2xl h-full">
                    <CardHeader className="bg-primary/10 border-b border-white/5 p-8">
                      <h2 className="text-xl font-headline font-black uppercase italic text-primary leading-none flex items-center gap-3">
                        <Trophy className="size-6" /> PROVA ALVO
                      </h2>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                      <FormField control={form.control} name="raceName" render={({field}) => (
                        <FormItem className="space-y-2">
                          <Label className="text-[10px] font-black text-muted-foreground uppercase italic tracking-widest">NOME DA PROVA</Label>
                          <FormControl><Input {...field} className="bg-black/40 font-bold h-12 rounded-2xl border-white/5" placeholder="Ex: Maratona de SP" /></FormControl>
                        </FormItem>
                      )} />
                      <div className="grid grid-cols-2 gap-6">
                        <FormField control={form.control} name="raceDistance" render={({field}) => (
                          <FormItem className="space-y-2">
                            <Label className="text-[10px] font-black text-muted-foreground uppercase italic tracking-widest">DISTÂNCIA</Label>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger className="bg-black/40 h-12 rounded-2xl font-black italic"><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent className="bg-[#0c0e12]">
                                <SelectItem value="5k" className="font-bold italic">5K</SelectItem>
                                <SelectItem value="10k" className="font-bold italic">10K</SelectItem>
                                <SelectItem value="21k" className="font-bold italic">MEIA (21K)</SelectItem>
                                <SelectItem value="42k" className="font-bold italic">MARA (42K)</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="raceDate" render={({field}) => (
                          <FormItem className="space-y-2">
                            <Label className="text-[10px] font-black text-muted-foreground uppercase italic tracking-widest">DATA</Label>
                            <FormControl><Input type="date" {...field} className="bg-black/40 font-bold h-12 rounded-2xl border-white/5 text-center" /></FormControl>
                          </FormItem>
                        )} />
                      </div>

                      <div className="space-y-4 pt-6 border-t border-white/5">
                        {/* TOGGLE INTELIGENTE */}
                        <div className="flex bg-secondary/20 p-1 rounded-xl gap-1">
                          <button type="button" onClick={() => setTargetMode('time')} className={cn("flex-1 py-2 text-[9px] font-black uppercase italic tracking-widest rounded-lg transition-all", targetMode === 'time' ? "bg-white text-black shadow-lg" : "text-muted-foreground/40")}>TEMPO ALVO</button>
                          <button type="button" onClick={() => setTargetMode('pace')} className={cn("flex-1 py-2 text-[9px] font-black uppercase italic tracking-widest rounded-lg transition-all", targetMode === 'pace' ? "bg-primary text-black shadow-lg" : "text-muted-foreground/40")}>PACE ALVO</button>
                        </div>

                        {targetMode === 'time' ? (
                          <FormField control={form.control} name="targetTime" render={({field}) => (
                            <FormItem><FormControl><Input placeholder="00:00:00" {...field} className="bg-black/40 font-black text-center h-14 rounded-2xl border-white/5 text-xl" /></FormControl></FormItem>
                          )} />
                        ) : (
                          <FormField control={form.control} name="targetPace" render={({field}) => (
                            <FormItem><FormControl><Input placeholder="4:30" {...field} className="bg-black/40 font-black text-center h-14 rounded-2xl border-primary/30 text-primary text-xl" /></FormControl></FormItem>
                          )} />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="dieta" className="mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="bg-[#0a0c10] border-border/50 rounded-[2rem] overflow-hidden shadow-2xl">
                    <CardHeader className="bg-green-500/10 border-b border-white/5 p-8"><h2 className="text-xl font-headline font-black uppercase italic text-green-400 leading-none flex items-center gap-3"><Apple className="size-6" /> NUTRIÇÃO</h2></CardHeader>
                    <CardContent className="p-8 space-y-6">
                       <FormField control={form.control} name="dietAestheticGoal" render={({field}) => (
                          <FormItem className="space-y-2">
                            <Label className="text-[10px] font-black text-muted-foreground uppercase italic tracking-widest">OBJETIVO</Label>
                            <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="bg-black/40 h-12 rounded-xl font-bold"><SelectValue /></SelectTrigger></FormControl><SelectContent className="bg-[#0c0e12]"><SelectItem value="performance" className="font-bold italic">PERFORMANCE</SelectItem><SelectItem value="cutting" className="font-bold italic">CUTTING (EMAGRECER)</SelectItem><SelectItem value="bulking" className="font-bold italic">BULKING (GANHAR)</SelectItem><SelectItem value="recomp" className="font-bold italic">RECOMPOSIÇÃO</SelectItem></SelectContent></Select>
                          </FormItem>
                        )} />
                       <div className="grid grid-cols-2 gap-4">
                         <FormField control={form.control} name="dietTargetWeight" render={({field}) => (
                          <FormItem className="space-y-2"><Label className="text-[9px] font-black text-muted-foreground uppercase italic tracking-widest">PESO-ALVO (KG)</Label><FormControl><Input type="number" {...field} className="bg-black/40 h-12 text-center font-black rounded-xl" /></FormControl></FormItem>
                        )} />
                         <FormField control={form.control} name="dietMealCount" render={({field}) => (
                          <FormItem className="space-y-2"><Label className="text-[9px] font-black text-muted-foreground uppercase italic tracking-widest">REFEIÇÕES/DIA</Label><FormControl><Input type="number" {...field} className="bg-black/40 h-12 text-center font-black rounded-xl" /></FormControl></FormItem>
                        )} />
                       </div>
                       <FormField control={form.control} name="dietActivityLevel" render={({field}) => (
                          <FormItem className="space-y-2">
                            <Label className="text-[10px] font-black text-muted-foreground uppercase italic tracking-widest">NÍVEL DE ATIVIDADE DIÁRIA</Label>
                            <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="bg-black/40 h-12 rounded-xl font-bold text-[11px]"><SelectValue /></SelectTrigger></FormControl><SelectContent className="bg-[#0c0e12]"><SelectItem value="sedentary" className="font-bold italic">SEDENTÁRIO (ESCRITÓRIO)</SelectItem><SelectItem value="light" className="font-bold italic">LEVE</SelectItem><SelectItem value="moderate" className="font-bold italic">MODERADO</SelectItem><SelectItem value="active" className="font-bold italic">ATIVO</SelectItem><SelectItem value="very_active" className="font-bold italic">MUITO ATIVO (FÍSICO)</SelectItem></SelectContent></Select>
                          </FormItem>
                        )} />
                       <FormField control={form.control} name="dietStyle" render={({field}) => (
                          <FormItem className="space-y-2">
                            <Label className="text-[10px] font-black text-muted-foreground uppercase italic tracking-widest">PADRÃO ALIMENTAR</Label>
                            <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="bg-black/40 h-12 rounded-xl font-bold text-[11px]"><SelectValue /></SelectTrigger></FormControl><SelectContent className="bg-[#0c0e12]"><SelectItem value="onivoro" className="font-bold italic">ONÍVORO</SelectItem><SelectItem value="vegetariano" className="font-bold italic">VEGETARIANO</SelectItem><SelectItem value="vegano" className="font-bold italic">VEGANO</SelectItem><SelectItem value="low_carb" className="font-bold italic">LOW CARB</SelectItem><SelectItem value="cetogenica" className="font-bold italic">CETOGÊNICA</SelectItem><SelectItem value="flexivel" className="font-bold italic">FLEXÍVEL (IIFYM)</SelectItem></SelectContent></Select>
                          </FormItem>
                        )} />
                       <FormField control={form.control} name="dietTrainingTiming" render={({field}) => (
                          <FormItem className="space-y-2">
                            <Label className="text-[10px] font-black text-muted-foreground uppercase italic tracking-widest">HORÁRIO DO TREINO</Label>
                            <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="bg-black/40 h-12 rounded-xl font-bold text-[11px]"><SelectValue /></SelectTrigger></FormControl><SelectContent className="bg-[#0c0e12]"><SelectItem value="jejum" className="font-bold italic">EM JEJUM</SelectItem><SelectItem value="manha" className="font-bold italic">MANHÃ</SelectItem><SelectItem value="meio-dia" className="font-bold italic">MEIO-DIA</SelectItem><SelectItem value="tarde" className="font-bold italic">TARDE</SelectItem><SelectItem value="noite" className="font-bold italic">NOITE</SelectItem></SelectContent></Select>
                          </FormItem>
                        )} />
                       <FormField control={form.control} name="dietSupplements" render={({field}) => (
                        <FormItem className="space-y-2"><Label className="text-[10px] font-black text-muted-foreground uppercase italic tracking-widest">SUPLEMENTAÇÃO</Label><FormControl><Input {...field} className="bg-black/40 h-12 rounded-xl" placeholder="Whey, Creatina, Géis..." /></FormControl></FormItem>
                      )} />
                    </CardContent>
                  </Card>
                  <Card className="bg-[#0a0c10] border-border/50 rounded-[2rem] overflow-hidden shadow-2xl">
                    <CardHeader className="bg-secondary/10 border-b border-white/5 p-8"><h2 className="text-xl font-headline font-black uppercase italic text-white leading-none flex items-center gap-3"><Timer className="size-6 text-green-400" /> PREFERÊNCIAS & RESTRIÇÕES</h2></CardHeader>
                    <CardContent className="p-8 space-y-6">
                      <FormField control={form.control} name="dietPreferredFoods" render={({field}) => (<FormItem className="space-y-2"><Label className="text-[10px] font-black text-muted-foreground uppercase italic tracking-widest">ALIMENTOS PREFERIDOS</Label><FormControl><Textarea {...field} placeholder="Ex: frango, arroz, batata-doce, frutas..." className="bg-black/40 rounded-xl min-h-[80px] text-xs italic" /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="dietAllergies" render={({field}) => (<FormItem className="space-y-2"><Label className="text-[10px] font-black text-rose-400 uppercase italic tracking-widest">ALERGIAS / INTOLERÂNCIAS</Label><FormControl><Textarea {...field} placeholder="Ex: lactose, glúten, amendoim..." className="bg-black/40 rounded-xl min-h-[70px] text-xs italic border-rose-500/20" /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="dietExcludedFoods" render={({field}) => (<FormItem className="space-y-2"><Label className="text-[10px] font-black text-muted-foreground uppercase italic tracking-widest">ALIMENTOS EXCLUÍDOS</Label><FormControl><Textarea {...field} placeholder="Desgostos ou o que evita comer..." className="bg-black/40 rounded-xl min-h-[70px] text-xs italic" /></FormControl></FormItem>)} />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="forca" className="mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="bg-[#0a0c10] border-border/50 rounded-[2rem] overflow-hidden shadow-2xl">
                    <CardHeader className="bg-orange-500/10 border-b border-white/5 p-8"><h2 className="text-xl font-headline font-black uppercase italic text-orange-500 leading-none flex items-center gap-3"><Dumbbell className="size-6" /> MUSCULAÇÃO</h2></CardHeader>
                    <CardContent className="p-8 space-y-6">
                       <div className="grid grid-cols-2 gap-4">
                         <FormField control={form.control} name="strengthObjective" render={({field}) => (
                            <FormItem className="space-y-2">
                              <Label className="text-[9px] font-black text-muted-foreground uppercase italic tracking-widest">OBJETIVO</Label>
                              <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="bg-black/40 h-12 rounded-xl font-bold text-[11px]"><SelectValue /></SelectTrigger></FormControl><SelectContent className="bg-[#0c0e12]"><SelectItem value="hypertryphy" className="font-bold italic">HIPERTROFIA</SelectItem><SelectItem value="strength" className="font-bold italic">FORÇA</SelectItem><SelectItem value="endurance" className="font-bold italic">RESISTÊNCIA</SelectItem><SelectItem value="performance" className="font-bold italic">PERFORMANCE</SelectItem></SelectContent></Select>
                            </FormItem>
                          )} />
                         <FormField control={form.control} name="strengthFrequency" render={({field}) => (
                            <FormItem className="space-y-2">
                              <Label className="text-[9px] font-black text-muted-foreground uppercase italic tracking-widest">FREQUÊNCIA/SEM</Label>
                              <FormControl><Input type="number" {...field} className="bg-black/40 h-12 text-center font-black rounded-xl" /></FormControl>
                            </FormItem>
                          )} />
                       </div>
                       <FormField control={form.control} name="strengthSplit" render={({field}) => (
                          <FormItem className="space-y-2">
                            <Label className="text-[10px] font-black text-muted-foreground uppercase italic tracking-widest">DIVISÃO DE TREINO</Label>
                            <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="bg-black/40 h-12 rounded-xl font-bold"><SelectValue /></SelectTrigger></FormControl><SelectContent className="bg-[#0c0e12]"><SelectItem value="full_body" className="font-bold italic">FULL BODY</SelectItem><SelectItem value="upper_lower" className="font-bold italic">UPPER/LOWER</SelectItem><SelectItem value="ppl" className="font-bold italic">PUSH/PULL/LEGS</SelectItem></SelectContent></Select>
                          </FormItem>
                        )} />
                       <FormField control={form.control} name="strengthLocation" render={({field}) => (
                          <FormItem className="space-y-2">
                            <Label className="text-[10px] font-black text-muted-foreground uppercase italic tracking-widest">LOCAL / EQUIPAMENTOS</Label>
                            <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="bg-black/40 h-12 rounded-xl font-bold text-[11px]"><SelectValue /></SelectTrigger></FormControl><SelectContent className="bg-[#0c0e12]"><SelectItem value="academia" className="font-bold italic">ACADEMIA COMPLETA</SelectItem><SelectItem value="halteres_casa" className="font-bold italic">CASA (HALTERES/ELÁSTICOS)</SelectItem><SelectItem value="peso_corporal" className="font-bold italic">SÓ PESO CORPORAL</SelectItem></SelectContent></Select>
                          </FormItem>
                        )} />
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black text-muted-foreground uppercase italic tracking-widest">DIAS DE MUSCULAÇÃO</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {weekDays.map((day) => (
                              <div key={day} className={cn("flex items-center space-x-2 p-2.5 rounded-xl border transition-all cursor-pointer", selectedStrengthDays.includes(day) ? "bg-orange-500/10 border-orange-500/40" : "bg-black/30 border-white/5 hover:border-orange-500/20")} onClick={() => {
                                  const current = form.getValues('strengthDays') || [];
                                  const next = current.includes(day) ? current.filter(d => d !== day) : [...current, day];
                                  form.setValue('strengthDays', next);
                                }}>
                                <Checkbox checked={selectedStrengthDays.includes(day)} className="size-4" />
                                <span className="text-[9px] font-black uppercase italic text-white/90">{day}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <FormField control={form.control} name="legDay" render={({field}) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-[10px] font-black text-orange-500 uppercase italic tracking-widest">LEG DAY (TREINO PESADO)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger className="bg-black/40 h-12 rounded-xl font-black italic"><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent className="bg-[#0c0e12]">
                                {weekDays.map(d => <SelectItem key={d} value={d} className="text-[10px] font-bold italic">{d.toUpperCase()}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="strengthFocusAreas" render={({field}) => (
                          <FormItem className="space-y-2"><Label className="text-[10px] font-black text-muted-foreground uppercase italic tracking-widest">ÁREAS DE FOCO</Label><FormControl><Input {...field} placeholder="Ex: glúteos, core, panturrilhas" className="bg-black/40 h-11 rounded-xl text-xs italic" /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="strengthLimitations" render={({field}) => (
                          <FormItem className="space-y-2"><Label className="text-[10px] font-black text-rose-400 uppercase italic tracking-widest">LIMITAÇÕES / LESÕES</Label><FormControl><Textarea {...field} placeholder="Ex: dor no ombro, evitar impacto no joelho..." className="bg-black/40 rounded-xl min-h-[70px] text-xs italic border-rose-500/20" /></FormControl></FormItem>
                        )} />
                    </CardContent>
                  </Card>
                  <Card className="bg-[#0a0c10] border-border/50 rounded-[2rem] overflow-hidden shadow-2xl">
                    <CardHeader className="bg-secondary/10 border-b border-white/5 p-8"><h2 className="text-xl font-headline font-black uppercase italic text-white leading-none flex items-center gap-3"><Zap className="size-6 text-orange-500" /> COFRE DE PRs</h2></CardHeader>
                    <CardContent className="p-8 grid grid-cols-3 gap-4">
                      <FormField control={form.control} name="prBench" render={({field}) => (<FormItem className="space-y-1"><FormLabel className="text-[8px] text-center block">SUPINO</FormLabel><FormControl><Input type="number" {...field} className="bg-black/40 h-10 text-center font-bold" /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="prSquat" render={({field}) => (<FormItem className="space-y-1"><FormLabel className="text-[8px] text-center block">AGACHA</FormLabel><FormControl><Input type="number" {...field} className="bg-black/40 h-10 text-center font-bold" /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="prDeadlift" render={({field}) => (<FormItem className="space-y-1"><FormLabel className="text-[8px] text-center block">TERRA</FormLabel><FormControl><Input type="number" {...field} className="bg-black/40 h-10 text-center font-bold" /></FormControl></FormItem>)} />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex flex-col sm:flex-row gap-4 pt-10 border-t border-white/5 px-2">
              <Button type="submit" disabled={isSaving} className="h-16 flex-1 bg-white text-black font-black uppercase tracking-widest italic rounded-2xl shadow-2xl">{isSaving ? <Loader2 className="animate-spin mr-3 size-5" /> : <CheckCircle2 className="mr-3 size-5" />} SALVAR LABORATÓRIO</Button>
              <Button type="button" onClick={handleGenerate} disabled={isProcessing} className="h-16 flex-1 bg-primary text-black font-black uppercase tracking-widest italic rounded-2xl shadow-2xl">{isProcessing ? <Loader2 className="animate-spin mr-3 size-5" /> : <Zap className="mr-3 size-5" />} GERAR CICLO IA</Button>
            </div>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}
