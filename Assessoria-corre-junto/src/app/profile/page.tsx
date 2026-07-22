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
import { downloadProfileBackup, parseProfileBackup } from '@/lib/backup';
import { DashboardLayout } from "@/components/layout/dashboard-layout";

import { Button } from '@/components/ui/button';
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
    UserRound,
    Activity,
    Trophy,
    Calendar,
    Dumbbell,
    MessageSquare,
    Apple,
    Timer,
    Milestone,
    History,
    Download,
    Upload
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
      toast({ title: "Perfil sincronizado" });
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

  const backupInputRef = React.useRef<HTMLInputElement>(null);

  const handleExportBackup = () => {
    if (!context?.activeProfile) {
      toast({ variant: "destructive", title: "Nada para exportar", description: "Crie um perfil primeiro." });
      return;
    }
    downloadProfileBackup(context.activeProfile);
    toast({ title: "Backup exportado", description: "Guarde o arquivo .json em local seguro." });
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !context) return;
    try {
      const imported = await parseProfileBackup(file);
      const confirmed = window.confirm(
        `Importar "${file.name}"? Isso vai sobrescrever os dados do perfil ativo (${context.activeProfile?.name || 'sem nome'}) com o conteúdo do backup.`
      );
      if (!confirmed) return;
      await context.saveProfile(imported);
      toast({ title: "Backup importado", description: "Recarregando para aplicar os dados..." });
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro ao importar", description: err?.message || "Arquivo inválido." });
    } finally {
      if (backupInputRef.current) backupInputRef.current.value = "";
    }
  };

  const selectedTrainingDays = form.watch('trainingDays') || [];
  const selectedStrengthDays = form.watch('strengthDays') || [];

  return (
    <DashboardLayout>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <UserRound size={20} />
          </div>
          <div>
            <h1 className="text-2xl md:text-[26px] font-bold tracking-tight">Meus dados</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">Identidade, treino, dieta e força.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Button type="button" variant="outline" className="rounded-xl gap-2" onClick={handleExportBackup}>
            <Download size={16} /> Exportar backup
          </Button>
          <Button type="button" variant="outline" className="rounded-xl gap-2" onClick={() => backupInputRef.current?.click()}>
            <Upload size={16} /> Importar backup
          </Button>
          <input ref={backupInputRef} type="file" accept="application/json,.json" className="hidden" onChange={handleImportBackup} />
          <Button asChild variant="outline" className="rounded-xl gap-2">
            <Link href="/coach">
              <MessageSquare size={16} /> Treinador IA
            </Link>
          </Button>
        </div>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSave)} className="flex flex-col gap-6">
          <Tabs defaultValue="corrida" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1.5 rounded-xl gap-1.5">
              <TabsTrigger value="perfil" className="py-2.5 text-[12px] font-semibold rounded-lg">Identidade</TabsTrigger>
              <TabsTrigger value="corrida" className="py-2.5 text-[12px] font-semibold rounded-lg">Corrida</TabsTrigger>
              <TabsTrigger value="dieta" className="py-2.5 text-[12px] font-semibold rounded-lg">Dieta</TabsTrigger>
              <TabsTrigger value="forca" className="py-2.5 text-[12px] font-semibold rounded-lg">Força</TabsTrigger>
            </TabsList>

            <TabsContent value="perfil" className="mt-6">
              <section className="card-plain">
                <div className="flex items-center gap-5 pb-6 mb-6 border-b border-border">
                  <div className="relative shrink-0">
                    <Avatar className="h-20 w-20 border-4 border-primary/15 rounded-2xl">
                      <AvatarImage src={form.watch('avatarUrl')} className="object-cover" />
                      <AvatarFallback className="bg-secondary text-xl font-bold">{form.watch('name')?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    <Button type="button" variant="secondary" size="icon" className="absolute -bottom-1.5 -right-1.5 rounded-lg bg-primary text-primary-foreground size-7" onClick={() => document.getElementById('avatar-input')?.click()}>
                      <Camera size={13} />
                    </Button>
                    <input id="avatar-input" type="file" className="sr-only" onChange={handleAvatarChange} accept="image/*" />
                  </div>
                  <div>
                    <h2 className="font-bold text-[15px]">Perfil do atleta</h2>
                    <p className="text-[12px] text-muted-foreground">Identificação básica.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <FormField control={form.control} name="name" render={({field}) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="eyebrow">Nome completo</FormLabel>
                      <FormControl><Input {...field} className="h-11 rounded-xl text-sm" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="birthDate" render={({field}) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="eyebrow">Data de nascimento</FormLabel>
                      <FormControl><Input type="date" {...field} className="h-11 rounded-xl text-sm" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="gender" render={({field}) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="eyebrow">Gênero</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className="h-11 rounded-xl text-sm"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="male">Masculino</SelectItem>
                          <SelectItem value="female">Feminino</SelectItem>
                          <SelectItem value="other">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </div>
              </section>
            </TabsContent>

            <TabsContent value="corrida" className="mt-6">
              <div className="bento">
                {/* FISIOLOGIA */}
                <section className="card-plain span-4">
                  <h3 className="eyebrow flex items-center gap-1.5 mb-5"><Activity className="size-3.5 text-primary" /> Fisiologia</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="currentWeight" render={({field}) => (
                      <FormItem className="space-y-1.5">
                        <Label className="eyebrow">Peso (kg)</Label>
                        <FormControl><Input type="number" {...field} className="h-11 text-center rounded-xl text-sm num" /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="vo2Max" render={({field}) => (
                      <FormItem className="space-y-1.5">
                        <Label className="eyebrow !text-primary">VDOT / VO2</Label>
                        <FormControl><Input type="number" step="0.1" {...field} className="h-11 text-center rounded-xl text-sm num text-primary border-primary/30" /></FormControl>
                      </FormItem>
                    )} />
                  </div>
                  <div className="space-y-4 mt-5 pt-5 border-t border-border">
                    <FormField control={form.control} name="thresholdPace" render={({field}) => (
                      <FormItem className="space-y-1.5">
                        <Label className="eyebrow">Pace limiar (T-pace)</Label>
                        <FormControl><Input placeholder="4:50" {...field} className="h-11 text-center rounded-xl text-sm num" /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="thresholdHr" render={({field}) => (
                      <FormItem className="space-y-1.5">
                        <Label className="eyebrow">FC limiar (LTHR)</Label>
                        <FormControl><Input type="number" {...field} className="h-11 text-center rounded-xl text-sm num" /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="restingHr" render={({field}) => (
                      <FormItem className="space-y-1.5">
                        <Label className="eyebrow">FC repouso</Label>
                        <FormControl><Input type="number" {...field} className="h-11 text-center rounded-xl text-sm num" /></FormControl>
                      </FormItem>
                    )} />
                  </div>
                </section>

                {/* PLANEJAMENTO */}
                <section className="card-plain span-4">
                  <h3 className="eyebrow flex items-center gap-1.5 mb-5"><Calendar className="size-3.5 text-primary" /> Planejamento</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="experienceLevel" render={({field}) => (
                      <FormItem className="space-y-1.5">
                        <Label className="eyebrow">Nível</Label>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger className="h-11 rounded-xl text-sm"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="run_walk">Caminhada/corrida</SelectItem>
                            <SelectItem value="beginner">Iniciante</SelectItem>
                            <SelectItem value="intermediate">Intermediário</SelectItem>
                            <SelectItem value="advanced">Avançado</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="weeklyMileageGoal" render={({field}) => (
                      <FormItem className="space-y-1.5">
                        <Label className="eyebrow !text-primary flex items-center gap-1"><Milestone size={11} /> Meta km</Label>
                        <FormControl><Input type="number" {...field} className="h-11 text-center rounded-xl text-sm num border-primary/30" /></FormControl>
                      </FormItem>
                    )} />
                  </div>

                  <div className="mt-4">
                    <FormField control={form.control} name="mainObjective" render={({field}) => (
                      <FormItem className="space-y-1.5">
                        <Label className="eyebrow">Objetivo principal</Label>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger className="h-11 rounded-xl text-sm"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="saude">Saúde / condicionamento</SelectItem>
                            <SelectItem value="emagrecimento">Emagrecimento</SelectItem>
                            <SelectItem value="primeira_prova">Terminar primeira prova</SelectItem>
                            <SelectItem value="recorde">Bater recorde (PR)</SelectItem>
                            <SelectItem value="performance">Performance / competir</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <FormField control={form.control} name="currentWeeklyMileage" render={({field}) => (
                      <FormItem className="space-y-1.5">
                        <Label className="eyebrow">Volume atual (km/sem)</Label>
                        <FormControl><Input type="number" {...field} className="h-11 text-center rounded-xl text-sm num" /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="longestRun" render={({field}) => (
                      <FormItem className="space-y-1.5">
                        <Label className="eyebrow">Maior longo (km)</Label>
                        <FormControl><Input type="number" {...field} className="h-11 text-center rounded-xl text-sm num" /></FormControl>
                      </FormItem>
                    )} />
                  </div>

                  <div className="space-y-2.5 mt-5 pt-5 border-t border-border">
                    <Label className="eyebrow">Dias de treino</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {weekDays.map((day) => (
                        <div key={day} className={cn("flex items-center gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer", selectedTrainingDays.includes(day) ? "bg-primary/10 border-primary/40" : "bg-secondary/40 border-border hover:border-primary/30")} onClick={() => {
                            const current = form.getValues('trainingDays') || [];
                            const next = current.includes(day) ? current.filter(d => d !== day) : [...current, day];
                            form.setValue('trainingDays', next);
                          }}>
                          <Checkbox checked={selectedTrainingDays.includes(day)} className="size-4" />
                          <span className="text-[11px] font-medium">{day}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4">
                    <FormField control={form.control} name="longRunDay" render={({field}) => (
                      <FormItem className="space-y-1.5">
                        <Label className="eyebrow">Dia do longão</Label>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger className="h-11 rounded-xl text-sm"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {weekDays.filter(day => selectedTrainingDays.includes(day)).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            {selectedTrainingDays.length === 0 && <SelectItem value="Domingo" disabled>Selecione dias primeiro</SelectItem>}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                  </div>

                  <div className="mt-4">
                    <FormField control={form.control} name="trainingHistory" render={({field}) => (
                      <FormItem className="space-y-1.5">
                        <Label className="eyebrow flex items-center gap-1"><History size={11} /> Histórico técnico</Label>
                        <FormControl><Textarea {...field} placeholder="Relate seu volume recente ou lesões..." className="rounded-xl min-h-[80px] text-sm" /></FormControl>
                      </FormItem>
                    )} />
                  </div>
                </section>

                {/* PROVA ALVO */}
                <section className="card-plain span-4">
                  <h3 className="eyebrow flex items-center gap-1.5 mb-5"><Trophy className="size-3.5 text-primary" /> Prova alvo</h3>
                  <FormField control={form.control} name="raceName" render={({field}) => (
                    <FormItem className="space-y-1.5">
                      <Label className="eyebrow">Nome da prova</Label>
                      <FormControl><Input {...field} className="h-11 rounded-xl text-sm" placeholder="Ex: Maratona de SP" /></FormControl>
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <FormField control={form.control} name="raceDistance" render={({field}) => (
                      <FormItem className="space-y-1.5">
                        <Label className="eyebrow">Distância</Label>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger className="h-11 rounded-xl text-sm"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="5k">5K</SelectItem>
                            <SelectItem value="10k">10K</SelectItem>
                            <SelectItem value="21k">Meia (21K)</SelectItem>
                            <SelectItem value="42k">Maratona (42K)</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="raceDate" render={({field}) => (
                      <FormItem className="space-y-1.5">
                        <Label className="eyebrow">Data</Label>
                        <FormControl><Input type="date" {...field} className="h-11 rounded-xl text-sm text-center" /></FormControl>
                      </FormItem>
                    )} />
                  </div>

                  <div className="space-y-3 mt-5 pt-5 border-t border-border">
                    <div className="flex bg-secondary/50 p-1 rounded-xl gap-1">
                      <button type="button" onClick={() => setTargetMode('time')} className={cn("flex-1 py-2 text-[11px] font-semibold rounded-lg transition-all", targetMode === 'time' ? "bg-foreground text-background" : "text-muted-foreground")}>Tempo alvo</button>
                      <button type="button" onClick={() => setTargetMode('pace')} className={cn("flex-1 py-2 text-[11px] font-semibold rounded-lg transition-all", targetMode === 'pace' ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>Pace alvo</button>
                    </div>

                    {targetMode === 'time' ? (
                      <FormField control={form.control} name="targetTime" render={({field}) => (
                        <FormItem><FormControl><Input placeholder="00:00:00" {...field} className="text-center h-14 rounded-xl text-xl num font-bold" /></FormControl></FormItem>
                      )} />
                    ) : (
                      <FormField control={form.control} name="targetPace" render={({field}) => (
                        <FormItem><FormControl><Input placeholder="4:30" {...field} className="text-center h-14 rounded-xl text-primary border-primary/30 text-xl num font-bold" /></FormControl></FormItem>
                      )} />
                    )}
                  </div>
                </section>
              </div>
            </TabsContent>

            <TabsContent value="dieta" className="mt-6">
              <div className="bento">
                <section className="card-plain span-6">
                  <h3 className="eyebrow flex items-center gap-1.5 mb-5"><Apple className="size-3.5 text-primary" /> Nutrição</h3>
                  <div className="space-y-4">
                    <FormField control={form.control} name="dietAestheticGoal" render={({field}) => (
                      <FormItem className="space-y-1.5">
                        <Label className="eyebrow">Objetivo</Label>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger className="h-11 rounded-xl text-sm"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="performance">Performance</SelectItem>
                            <SelectItem value="cutting">Cutting (emagrecer)</SelectItem>
                            <SelectItem value="bulking">Bulking (ganhar)</SelectItem>
                            <SelectItem value="recomp">Recomposição</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="dietTargetWeight" render={({field}) => (
                        <FormItem className="space-y-1.5"><Label className="eyebrow">Peso-alvo (kg)</Label><FormControl><Input type="number" {...field} className="h-11 text-center rounded-xl text-sm num" /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="dietMealCount" render={({field}) => (
                        <FormItem className="space-y-1.5"><Label className="eyebrow">Refeições/dia</Label><FormControl><Input type="number" {...field} className="h-11 text-center rounded-xl text-sm num" /></FormControl></FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="dietActivityLevel" render={({field}) => (
                      <FormItem className="space-y-1.5">
                        <Label className="eyebrow">Nível de atividade diária</Label>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger className="h-11 rounded-xl text-sm"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="sedentary">Sedentário (escritório)</SelectItem>
                            <SelectItem value="light">Leve</SelectItem>
                            <SelectItem value="moderate">Moderado</SelectItem>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="very_active">Muito ativo (físico)</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="dietStyle" render={({field}) => (
                      <FormItem className="space-y-1.5">
                        <Label className="eyebrow">Padrão alimentar</Label>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger className="h-11 rounded-xl text-sm"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="onivoro">Onívoro</SelectItem>
                            <SelectItem value="vegetariano">Vegetariano</SelectItem>
                            <SelectItem value="vegano">Vegano</SelectItem>
                            <SelectItem value="low_carb">Low carb</SelectItem>
                            <SelectItem value="cetogenica">Cetogênica</SelectItem>
                            <SelectItem value="flexivel">Flexível (IIFYM)</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="dietTrainingTiming" render={({field}) => (
                      <FormItem className="space-y-1.5">
                        <Label className="eyebrow">Horário do treino</Label>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger className="h-11 rounded-xl text-sm"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="jejum">Em jejum</SelectItem>
                            <SelectItem value="manha">Manhã</SelectItem>
                            <SelectItem value="meio-dia">Meio-dia</SelectItem>
                            <SelectItem value="tarde">Tarde</SelectItem>
                            <SelectItem value="noite">Noite</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="dietSupplements" render={({field}) => (
                      <FormItem className="space-y-1.5"><Label className="eyebrow">Suplementação</Label><FormControl><Input {...field} className="h-11 rounded-xl text-sm" placeholder="Whey, creatina, géis..." /></FormControl></FormItem>
                    )} />
                  </div>
                </section>
                <section className="card-plain span-6">
                  <h3 className="eyebrow flex items-center gap-1.5 mb-5"><Timer className="size-3.5 text-primary" /> Preferências e restrições</h3>
                  <div className="space-y-4">
                    <FormField control={form.control} name="dietPreferredFoods" render={({field}) => (<FormItem className="space-y-1.5"><Label className="eyebrow">Alimentos preferidos</Label><FormControl><Textarea {...field} placeholder="Ex: frango, arroz, batata-doce, frutas..." className="rounded-xl min-h-[80px] text-sm" /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="dietAllergies" render={({field}) => (<FormItem className="space-y-1.5"><Label className="eyebrow !text-destructive">Alergias / intolerâncias</Label><FormControl><Textarea {...field} placeholder="Ex: lactose, glúten, amendoim..." className="rounded-xl min-h-[70px] text-sm border-destructive/25" /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="dietExcludedFoods" render={({field}) => (<FormItem className="space-y-1.5"><Label className="eyebrow">Alimentos excluídos</Label><FormControl><Textarea {...field} placeholder="Desgostos ou o que evita comer..." className="rounded-xl min-h-[70px] text-sm" /></FormControl></FormItem>)} />
                  </div>
                </section>
              </div>
            </TabsContent>

            <TabsContent value="forca" className="mt-6">
              <div className="bento">
                <section className="card-plain span-6">
                  <h3 className="eyebrow flex items-center gap-1.5 mb-5"><Dumbbell className="size-3.5 text-primary" /> Musculação</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="strengthObjective" render={({field}) => (
                        <FormItem className="space-y-1.5">
                          <Label className="eyebrow">Objetivo</Label>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger className="h-11 rounded-xl text-sm"><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="hypertryphy">Hipertrofia</SelectItem>
                              <SelectItem value="strength">Força</SelectItem>
                              <SelectItem value="endurance">Resistência</SelectItem>
                              <SelectItem value="performance">Performance</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="strengthFrequency" render={({field}) => (
                        <FormItem className="space-y-1.5">
                          <Label className="eyebrow">Frequência/sem</Label>
                          <FormControl><Input type="number" {...field} className="h-11 text-center rounded-xl text-sm num" /></FormControl>
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="strengthSplit" render={({field}) => (
                      <FormItem className="space-y-1.5">
                        <Label className="eyebrow">Divisão de treino</Label>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger className="h-11 rounded-xl text-sm"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="full_body">Full body</SelectItem>
                            <SelectItem value="upper_lower">Upper/lower</SelectItem>
                            <SelectItem value="ppl">Push/pull/legs</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="strengthLocation" render={({field}) => (
                      <FormItem className="space-y-1.5">
                        <Label className="eyebrow">Local / equipamentos</Label>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger className="h-11 rounded-xl text-sm"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="academia">Academia completa</SelectItem>
                            <SelectItem value="halteres_casa">Casa (halteres/elásticos)</SelectItem>
                            <SelectItem value="peso_corporal">Só peso corporal</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <div className="space-y-2.5">
                      <Label className="eyebrow">Dias de musculação</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {weekDays.map((day) => (
                          <div key={day} className={cn("flex items-center gap-2 p-2.5 rounded-lg border transition-all cursor-pointer", selectedStrengthDays.includes(day) ? "bg-amber-500/10 border-amber-500/40" : "bg-secondary/40 border-border hover:border-amber-500/30")} onClick={() => {
                              const current = form.getValues('strengthDays') || [];
                              const next = current.includes(day) ? current.filter(d => d !== day) : [...current, day];
                              form.setValue('strengthDays', next);
                            }}>
                            <Checkbox checked={selectedStrengthDays.includes(day)} className="size-4" />
                            <span className="text-[11px] font-medium">{day}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <FormField control={form.control} name="legDay" render={({field}) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="eyebrow !text-amber-400">Leg day (treino pesado)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger className="h-11 rounded-xl text-sm"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {weekDays.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="strengthFocusAreas" render={({field}) => (
                      <FormItem className="space-y-1.5"><Label className="eyebrow">Áreas de foco</Label><FormControl><Input {...field} placeholder="Ex: glúteos, core, panturrilhas" className="h-11 rounded-xl text-sm" /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="strengthLimitations" render={({field}) => (
                      <FormItem className="space-y-1.5"><Label className="eyebrow !text-destructive">Limitações / lesões</Label><FormControl><Textarea {...field} placeholder="Ex: dor no ombro, evitar impacto no joelho..." className="rounded-xl min-h-[70px] text-sm border-destructive/25" /></FormControl></FormItem>
                    )} />
                  </div>
                </section>
                <section className="card-plain span-6 h-fit">
                  <h3 className="eyebrow flex items-center gap-1.5 mb-5"><Zap className="size-3.5 text-primary" /> Cofre de PRs</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <FormField control={form.control} name="prBench" render={({field}) => (<FormItem className="space-y-1.5"><FormLabel className="eyebrow text-center block">Supino</FormLabel><FormControl><Input type="number" {...field} className="h-11 text-center rounded-xl text-sm num" /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="prSquat" render={({field}) => (<FormItem className="space-y-1.5"><FormLabel className="eyebrow text-center block">Agacha</FormLabel><FormControl><Input type="number" {...field} className="h-11 text-center rounded-xl text-sm num" /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="prDeadlift" render={({field}) => (<FormItem className="space-y-1.5"><FormLabel className="eyebrow text-center block">Terra</FormLabel><FormControl><Input type="number" {...field} className="h-11 text-center rounded-xl text-sm num" /></FormControl></FormItem>)} />
                  </div>
                </section>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
            <Button type="submit" disabled={isSaving} variant="outline" className="h-12 flex-1 rounded-xl gap-2">
              {isSaving ? <Loader2 className="animate-spin size-4" /> : <CheckCircle2 className="size-4" />} Salvar perfil
            </Button>
            <Button type="button" onClick={handleGenerate} disabled={isProcessing} className="h-12 flex-1 rounded-xl gap-2">
              {isProcessing ? <Loader2 className="animate-spin size-4" /> : <Zap className="size-4" />} Gerar ciclo IA
            </Button>
          </div>
        </form>
      </Form>
    </DashboardLayout>
  );
}
