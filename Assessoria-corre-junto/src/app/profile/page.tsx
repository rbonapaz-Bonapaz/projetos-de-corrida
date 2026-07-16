
'use client';

import { useContext, useState, useEffect, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { TrainingContext } from '@/contexts/TrainingContext';
import { useToast } from '@/hooks/use-toast';
import { fileToDataURI, cn } from "@/lib/utils";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    Form, 
    FormControl, 
    FormField, 
    FormItem, 
    FormLabel, 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Loader2, 
    Zap, 
    Camera, 
    Dumbbell, 
    CheckCircle2,
    ShieldCheck,
    Utensils,
    Trophy,
    Info,
    Activity,
    User as UserIcon,
    Calendar as CalendarIcon,
    Target,
    Upload,
    ImageIcon,
    X,
    ClipboardList
} from 'lucide-react';
import { 
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from '@/components/ui/skeleton';
import type { AthleteProfile } from '@/lib/types';
import Link from 'next/link';

const weekDays = [
  { id: 'Domingo', label: 'DOM' },
  { id: 'Segunda', label: 'SEG' },
  { id: 'Terça', label: 'TER' },
  { id: 'Quarta', label: 'QUA' },
  { id: 'Quinta', label: 'QUI' },
  { id: 'Sexta', label: 'SEX' },
  { id: 'Sábado', label: 'SÁB' },
] as const;

const profileSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório.'),
  avatarUrl: z.string().default(''),
  birthDate: z.string().default(''),
  currentWeight: z.coerce.number().default(70),
  height: z.coerce.number().default(175),
  restingHr: z.coerce.number().default(50),
  vo2Max: z.coerce.number().default(45),
  thresholdPace: z.string().default('4:50'),
  thresholdHr: z.coerce.number().default(165),
  raceName: z.string().default(''),
  raceDistance: z.string().default('10k'),
  raceDate: z.string().default(''),
  targetPace: z.string().default(''),
  targetTime: z.string().default(''),
  trainingDays: z.array(z.string()).default(['Segunda', 'Quarta', 'Sexta']),
  longRunDay: z.string().default('Domingo'),
  planGenerationType: z.enum(['full', 'blocks']).default('blocks'),
  experienceLevel: z.enum(['run_walk', 'beginner', 'intermediate', 'advanced']).default('beginner'),
  referenceDocumentUri: z.string().default(''),
  aestheticGoal: z.enum(['performance', 'cutting', 'bulking', 'recomp']).default('performance'),
  legDay: z.string().default(''),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const context = useContext(TrainingContext);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("perfil");
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const planFileRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [targetType, setTargetType] = useState<'pace' | 'time'>('pace');

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      avatarUrl: '',
      birthDate: '',
      currentWeight: 70,
      height: 175,
      restingHr: 50,
      vo2Max: 45,
      thresholdPace: '4:50',
      thresholdHr: 165,
      raceName: '',
      raceDistance: '10k',
      raceDate: '',
      targetPace: '',
      targetTime: '',
      trainingDays: ['Segunda', 'Quarta', 'Sexta'],
      longRunDay: 'Domingo',
      planGenerationType: 'blocks',
      experienceLevel: 'beginner',
      referenceDocumentUri: '',
      legDay: '',
      aestheticGoal: 'performance',
    }
  });

  const { reset, watch, setValue } = form;

  useEffect(() => {
    if (context?.isHydrated && context.activeProfile) {
      const p = context.activeProfile;
      reset({
        ...p,
        name: p.name || '',
        avatarUrl: p.avatarUrl || '',
        birthDate: p.birthDate || '',
        currentWeight: p.currentWeight || 70,
        height: p.height || 175,
        restingHr: p.restingHr || 50,
        vo2Max: p.vo2Max || 45,
        thresholdPace: p.thresholdPace || '4:50',
        thresholdHr: p.thresholdHr || 165,
        raceName: p.raceName || p.anamnesis?.targetRace || '',
        raceDistance: p.raceDistance || '10k',
        raceDate: p.raceDate || '',
        targetPace: p.targetPace || '',
        targetTime: p.targetTime || '',
        trainingDays: p.trainingDays || ['Segunda', 'Quarta', 'Sexta'],
        longRunDay: p.longRunDay || 'Domingo',
        planGenerationType: p.planGenerationType || 'blocks',
        experienceLevel: p.experienceLevel || 'beginner',
        aestheticGoal: p.dietPreferences?.aestheticGoal || 'performance',
        legDay: p.strengthPreferences?.legDay || (p.anamnesis?.strengthDays?.[0] ? weekDays.find(d => d.id === p.anamnesis?.strengthDays[0])?.label : ''),
      } as any);
      
      if (p.targetTime && !p.targetPace) setTargetType('time');
      else setTargetType('pace');
    }
  }, [context?.isHydrated, context?.activeProfile, reset]);

  const watchAvatarUrl = watch('avatarUrl');
  const watchTrainingDays = watch('trainingDays');
  const watchReferenceDocumentUri = watch('referenceDocumentUri');

  const availableLongRunDays = useMemo(() => {
    return weekDays.filter(day => watchTrainingDays.includes(day.id));
  }, [watchTrainingDays]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const uri = await fileToDataURI(e.target.files[0]);
      setValue('avatarUrl', uri);
    }
  };

  const handlePlanFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const uri = await fileToDataURI(e.target.files[0]);
      setValue('referenceDocumentUri', uri);
      toast({ title: "Referência Carregada", description: "O Gemini Coach usará esta imagem para traduzir seu plano." });
    }
  };

  const onSave = async (data: ProfileFormValues) => {
    if (!context) return;
    setIsSaving(true);
    
    try {
      const finalData = { ...data };
      if (targetType === 'pace') finalData.targetTime = '';
      else finalData.targetPace = '';

      const profileData: Partial<AthleteProfile> = {
        ...finalData,
        dietPreferences: {
          ...context.activeProfile?.dietPreferences,
          aestheticGoal: data.aestheticGoal,
        },
        strengthPreferences: {
          ...context.activeProfile?.strengthPreferences,
          legDay: data.legDay,
        }
      };
      
      await context.saveProfile(profileData);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erro ao Salvar', description: 'Não foi possível persistir seus dados.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerate = async () => {
    if (!context) return;
    
    const isValid = await form.trigger();
    if (!isValid) {
      toast({ variant: "destructive", title: "Dados Incompletos", description: "Preencha os campos obrigatórios." });
      return;
    }

    const formData = form.getValues();
    setIsProcessing(true);

    try {
      await onSave(formData);
      
      const tempProfile: AthleteProfile = {
        ...context.activeProfile,
        ...formData,
      } as any;

      await context.generateRunningPlanAsync(tempProfile);
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!context?.isHydrated) return <DashboardLayout><Skeleton className="h-96 w-full bg-secondary/20 rounded-3xl"/></DashboardLayout>;

  return (
    <DashboardLayout>
      <TooltipProvider>
        <div className="space-y-8 pb-20 max-w-5xl mx-auto animate-in fade-in duration-700">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
                <ShieldCheck size={24}/>
              </div>
              <div>
                <h1 className="font-headline text-2xl md:text-3xl font-black uppercase italic tracking-tighter leading-none">
                  <span className="text-white">MEU</span> <span className="text-primary">PERFIL</span>
                </h1>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-[0.2em] italic mt-1">Laboratório Cloud Sincronizado</p>
              </div>
            </div>
            <Button asChild variant="outline" className="h-10 border-primary/20 text-primary font-black uppercase text-[10px] italic tracking-widest rounded-xl hover:bg-primary hover:text-black">
              <Link href="/anamnesis"><ClipboardList size={16} className="mr-2"/> VER ANAMNESE</Link>
            </Button>
          </header>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSave)} className="space-y-8">
              <Tabs defaultValue="perfil" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 h-auto bg-secondary/20 p-1.5 rounded-2xl gap-2 shadow-inner">
                  <TabsTrigger value="perfil" className="py-3 font-headline font-black text-[10px] md:text-xs uppercase italic tracking-wider data-[state=active]:bg-primary data-[state=active]:text-black transition-all rounded-xl">PERFIL</TabsTrigger>
                  <TabsTrigger value="corrida" className="py-3 font-headline font-black text-[10px] md:text-xs uppercase italic tracking-wider data-[state=active]:bg-primary data-[state=active]:text-black transition-all rounded-xl">CORRIDA</TabsTrigger>
                  <TabsTrigger value="alimentacao" className="py-3 font-headline font-black text-[10px] md:text-xs uppercase italic tracking-wider data-[state=active]:bg-primary data-[state=active]:text-black transition-all rounded-xl">DIETA</TabsTrigger>
                  <TabsTrigger value="musculacao" className="py-3 font-headline font-black text-[10px] md:text-xs uppercase italic tracking-wider data-[state=active]:bg-primary data-[state=active]:text-black transition-all rounded-xl">FORÇA</TabsTrigger>
                </TabsList>

                <TabsContent value="perfil" className="mt-8 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                  <Card className="bg-card/40 border-border/50 rounded-2xl overflow-hidden shadow-xl">
                    <CardHeader className="bg-secondary/10 border-b border-border/10 py-6 px-8">
                      <div className="flex flex-col sm:flex-row items-center gap-8">
                        <div className="relative group">
                          <Avatar className="h-24 w-24 border-2 border-primary/20 rounded-2xl shadow-xl transition-transform group-hover:scale-105 duration-300">
                            <AvatarImage src={watchAvatarUrl} className="object-cover" />
                            <AvatarFallback className="text-2xl font-black italic bg-secondary">{watch('name')?.[0] || '?'}</AvatarFallback>
                          </Avatar>
                          <input type="file" ref={avatarFileRef} className="sr-only" onChange={handleAvatarChange} accept="image/*" />
                          <Button type="button" variant="secondary" size="icon" className="absolute -bottom-1 -right-1 rounded-xl h-9 w-9 bg-primary text-black hover:bg-white shadow-xl transition-all" onClick={() => avatarFileRef.current?.click()}>
                            <Camera size={16}/>
                          </Button>
                        </div>
                        <div className="space-y-1 text-center sm:text-left">
                          <CardTitle className="font-headline text-xl md:text-2xl uppercase italic font-black tracking-tighter text-white">IDENTIDADE ATLETA</CardTitle>
                          <CardDescription className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground italic">Dados básicos e biometria de performance.</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8">
                      <FormField control={form.control} name="name" render={({field}) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic flex items-center gap-2">
                            <UserIcon className="size-3" /> Nome Completo
                          </FormLabel>
                          <FormControl><Input {...field} value={field.value || ''} className="bg-black/30 h-10 font-bold text-sm rounded-xl border-border/40 focus:border-primary px-4" /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="birthDate" render={({field}) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Data de Nascimento</FormLabel>
                          <FormControl><Input type="date" {...field} value={field.value || ''} className="bg-black/30 h-10 font-bold text-sm rounded-xl border-border/40 focus:border-primary px-4 text-center" /></FormControl>
                        </FormItem>
                      )} />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="currentWeight" render={({field}) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Peso (kg)</FormLabel>
                            <FormControl><Input type="number" step="0.1" {...field} value={field.value ?? 0} className="bg-black/30 h-10 text-center font-bold text-sm rounded-xl border-border/40 focus:border-primary" /></FormControl>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="height" render={({field}) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Altura (cm)</FormLabel>
                            <FormControl><Input type="number" {...field} value={field.value ?? 0} className="bg-black/30 h-10 text-center font-bold text-sm rounded-xl border-border/40 focus:border-primary" /></FormControl>
                          </FormItem>
                        )} />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="corrida" className="mt-8 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                  <Card className="bg-card/40 border-border/50 rounded-2xl overflow-hidden shadow-xl">
                    <CardHeader className="py-6 px-8 space-y-1">
                      <h2 className="text-xl md:text-2xl font-headline font-black uppercase italic text-primary leading-none">INTELIGÊNCIA DE CORRIDA</h2>
                      <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-widest">Fisiologia e Disponibilidade Semanal</p>
                    </CardHeader>
                    
                    <CardContent className="p-8 space-y-10">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <FormField control={form.control} name="restingHr" render={({field}) => (
                          <FormItem className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <FormLabel className="text-[9px] font-black uppercase text-white italic">FC REPOUSO</FormLabel>
                              <Tooltip><TooltipTrigger asChild><Info className="size-3 text-muted-foreground cursor-help"/></TooltipTrigger><TooltipContent><p className="text-[10px]">Frequência cardíaca basal ao acordar.</p></TooltipContent></Tooltip>
                            </div>
                            <FormControl><Input type="number" {...field} value={field.value ?? 0} className="bg-black/40 border-border/40 h-10 text-center font-bold rounded-xl text-sm" /></FormControl>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="vo2Max" render={({field}) => (
                          <FormItem className="space-y-1.5">
                             <div className="flex items-center gap-2">
                              <FormLabel className="text-[9px] font-black uppercase text-white italic">VO2 MÁX / VDOT</FormLabel>
                              <Tooltip><TooltipTrigger asChild><Info className="size-3 text-muted-foreground cursor-help"/></TooltipTrigger><TooltipContent><p className="text-[10px]">Seu nível de performance (VDOT).</p></TooltipContent></Tooltip>
                            </div>
                            <FormControl><Input type="number" step="0.1" {...field} value={field.value ?? 0} className="bg-black/40 border-border/40 h-10 text-center font-bold rounded-xl text-sm" /></FormControl>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="thresholdPace" render={({field}) => (
                          <FormItem className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <FormLabel className="text-[9px] font-black uppercase text-white italic">PACE LIMIAR</FormLabel>
                              <Tooltip><TooltipTrigger asChild><Info className="size-3 text-muted-foreground cursor-help"/></TooltipTrigger><TooltipContent><p className="text-[10px]">Pace de limiar de lactato (T-Pace).</p></TooltipContent></Tooltip>
                            </div>
                            <FormControl><Input {...field} value={field.value || ''} className="bg-black/40 border-border/40 h-10 text-center font-bold rounded-xl text-sm" /></FormControl>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="thresholdHr" render={({field}) => (
                          <FormItem className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <FormLabel className="text-[9px] font-black uppercase text-white italic">FC LIMIAR (L2)</FormLabel>
                              <Tooltip><TooltipTrigger asChild><Info className="size-3 text-muted-foreground cursor-help"/></TooltipTrigger><TooltipContent><p className="text-[10px]">Batimentos no limiar anaeróbico.</p></TooltipContent></Tooltip>
                            </div>
                            <FormControl><Input type="number" {...field} value={field.value ?? 0} className="bg-black/40 border-border/40 h-10 text-center font-bold rounded-xl text-sm" /></FormControl>
                          </FormItem>
                        )} />
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <CalendarIcon className="size-4 text-primary" />
                             <span className="text-[10px] font-black uppercase text-white italic tracking-widest">DISPONIBILIDADE (DOMINGO É O 1º DIA)</span>
                          </div>
                          <span className="text-[9px] font-black uppercase text-primary italic tracking-widest bg-primary/10 px-3 py-1 rounded-full">
                            {watchTrainingDays.length} DIAS / SEMANA
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {weekDays.map((day) => (
                            <button
                              key={day.id}
                              type="button"
                              onClick={() => {
                                const newVal = watchTrainingDays.includes(day.id)
                                  ? watchTrainingDays.filter((d) => d !== day.id)
                                  : [...watchTrainingDays, day.id];
                                setValue('trainingDays', newVal);
                                if (watch('longRunDay') === day.id && !newVal.includes(day.id)) {
                                  setValue('longRunDay', '');
                                }
                              }}
                              className={cn(
                                "flex-1 min-w-[70px] h-12 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 group",
                                watchTrainingDays.includes(day.id)
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border/40 bg-black/20 text-muted-foreground hover:border-primary/50"
                              )}
                            >
                              <span className="text-[9px] font-black italic">{day.label}</span>
                              {watchTrainingDays.includes(day.id) && <Activity className="size-3 animate-pulse" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <FormField control={form.control} name="experienceLevel" render={({field}) => (
                            <FormItem className="space-y-2">
                              <FormLabel className="text-[10px] font-black uppercase text-white italic">EXPERIÊNCIA ATUAL</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || 'beginner'}>
                                <FormControl><SelectTrigger className="bg-black/40 border-border/40 h-10 font-bold italic rounded-xl px-4 text-sm"><SelectValue/></SelectTrigger></FormControl>
                                <SelectContent className="bg-card border-border">
                                  <SelectItem value="run_walk" className="font-bold italic uppercase">Começando (&lt; 15 km/semana)</SelectItem>
                                  <SelectItem value="beginner" className="font-bold italic uppercase">Iniciante (15-30 km/semana)</SelectItem>
                                  <SelectItem value="intermediate" className="font-bold italic uppercase">Intermediário (30-60 km/semana)</SelectItem>
                                  <SelectItem value="advanced" className="font-bold italic uppercase">Avançado / Elite (&gt; 60 km/semana)</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )} />
                        </div>

                        <div className="space-y-4">
                          <FormField control={form.control} name="planGenerationType" render={({field}) => (
                            <FormItem className="space-y-2">
                              <FormLabel className="text-[10px] font-black uppercase text-white italic">ESTRATÉGIA DE CICLO</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || 'blocks'}>
                                <FormControl><SelectTrigger className="bg-black/40 border-border/40 h-10 font-bold italic rounded-xl px-4 text-sm"><SelectValue/></SelectTrigger></FormControl>
                                <SelectContent>
                                  <SelectItem value="blocks" className="font-bold italic uppercase">Blocos (4 Semanas)</SelectItem>
                                  <SelectItem value="full" className="font-bold italic uppercase">Ciclo Até a Prova</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )} />

                          <FormField control={form.control} name="longRunDay" render={({field}) => (
                            <FormItem className="space-y-2">
                              <FormLabel className="text-[10px] font-black uppercase text-white italic">DIA DO LONGÃO (LSD)</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ''}>
                                <FormControl><SelectTrigger className="bg-black/40 border-border/40 h-10 font-bold italic rounded-xl px-4 text-sm"><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                                <SelectContent className="bg-card border-border">
                                  {availableLongRunDays.length > 0 ? (
                                    availableLongRunDays.map(d => <SelectItem key={d.id} value={d.id} className="font-bold italic uppercase">{d.id}</SelectItem>)
                                  ) : (
                                    <p className="p-4 text-[9px] italic text-muted-foreground text-center">Selecione disponibilidade acima.</p>
                                  )}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )} />
                        </div>
                      </div>

                      <div className="pt-8 border-t border-border/20 space-y-6">
                        <div className="flex items-center gap-2">
                           <Trophy className="text-primary size-5" />
                           <h3 className="text-lg font-black uppercase italic text-white tracking-tighter">PROVA ALVO</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <FormField control={form.control} name="raceName" render={({field}) => (
                            <FormItem className="space-y-2">
                              <FormLabel className="text-[10px] font-black uppercase text-white italic">NOME DO EVENTO</FormLabel>
                              <FormControl><Input placeholder="Ex: Maratona de SP" {...field} value={field.value || ''} className="bg-black/40 border-border/40 h-10 font-bold italic rounded-xl px-4 text-sm" /></FormControl>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="raceDate" render={({field}) => (
                            <FormItem className="space-y-2">
                              <FormLabel className="text-[10px] font-black uppercase text-white italic">DATA DA LARGADA</FormLabel>
                              <FormControl><Input type="date" {...field} value={field.value || ''} className="bg-black/40 border-border/40 h-10 font-bold italic rounded-xl px-4 text-center text-sm" /></FormControl>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="raceDistance" render={({field}) => (
                            <FormItem className="space-y-2">
                              <FormLabel className="text-[10px] font-black uppercase text-white italic">DISTÂNCIA</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || '10k'}>
                                <FormControl><SelectTrigger className="bg-black/40 border-border/40 h-10 font-bold italic rounded-xl px-4 text-sm"><SelectValue placeholder="Distância" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  <SelectItem value="5k" className="font-bold italic">5 KM</SelectItem>
                                  <SelectItem value="10k" className="font-bold italic">10 KM</SelectItem>
                                  <SelectItem value="21k" className="font-bold italic">MEIA MARATONA</SelectItem>
                                  <SelectItem value="42k" className="font-bold italic">MARATONA</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )} />
                        </div>

                        <div className="bg-primary/5 p-6 rounded-xl border border-primary/10 space-y-4">
                           <div className="flex items-center gap-2">
                             <Target className="size-4 text-primary" />
                             <span className="text-[10px] font-black uppercase italic tracking-widest text-primary">META DE PERFORMANCE</span>
                           </div>

                           <Tabs value={targetType} onValueChange={(v) => setTargetType(v as any)} className="w-full">
                              <TabsList className="grid w-full grid-cols-2 h-9 bg-black/40 p-0.5 rounded-lg gap-1">
                                <TabsTrigger value="pace" className="font-black italic uppercase data-[state=active]:bg-primary data-[state=active]:text-black rounded-md text-[9px]">PACE ALVO</TabsTrigger>
                                <TabsTrigger value="time" className="font-black italic uppercase data-[state=active]:bg-primary data-[state=active]:text-black rounded-md text-[9px]">TEMPO ALVO</TabsTrigger>
                              </TabsList>

                              <div className="mt-4">
                                {targetType === 'pace' ? (
                                  <FormField control={form.control} name="targetPace" render={({field}) => (
                                    <FormItem className="space-y-2">
                                      <FormControl><Input placeholder="Ex: 4:15 min/km" {...field} value={field.value || ''} className="bg-black/50 border-border/40 h-10 text-center font-bold text-sm rounded-xl focus:border-primary" /></FormControl>
                                    </FormItem>
                                  )} />
                                ) : (
                                  <FormField control={form.control} name="targetTime" render={({field}) => (
                                    <FormItem className="space-y-2">
                                      <FormControl><Input placeholder="Ex: 03:30:00" {...field} value={field.value || ''} className="bg-black/50 border-border/40 h-10 text-center font-bold text-sm rounded-xl focus:border-primary" /></FormControl>
                                    </FormItem>
                                  )} />
                                )}
                              </div>
                           </Tabs>
                        </div>
                      </div>

                      <div className="pt-8 border-t border-border/20 space-y-6">
                        <div className="flex items-center gap-2">
                           <ImageIcon className="text-primary size-5" />
                           <h3 className="text-lg font-black uppercase italic text-white tracking-tighter">TRADUÇÃO DE PLANILHA (WILDCARD)</h3>
                        </div>

                        <div className="space-y-4">
                          <p className="text-[10px] text-muted-foreground leading-relaxed italic uppercase font-bold tracking-tight">
                            Tire uma foto da sua planilha física ou do seu relógio e o Gemini traduzirá isso automaticamente para o formato digital.
                          </p>
                          <div 
                            className={cn(
                              "border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all",
                              watchReferenceDocumentUri ? "border-primary bg-primary/5" : "border-border/40 hover:border-primary/50"
                            )}
                            onClick={() => planFileRef.current?.click()}
                          >
                            <input type="file" ref={planFileRef} className="sr-only" onChange={handlePlanFileChange} accept="image/*,.pdf" />
                            {watchReferenceDocumentUri ? (
                              <div className="flex items-center justify-center gap-3">
                                <div className="p-2 rounded-lg bg-primary text-black"><CheckCircle2 size={18} /></div>
                                <div className="text-left">
                                  <p className="text-[10px] font-black uppercase text-primary italic">Documento Carregado</p>
                                  <p className="text-[9px] text-muted-foreground italic">Pronto para ser traduzido pela IA.</p>
                                </div>
                                <Button variant="ghost" size="icon" className="ml-auto" onClick={(e) => { e.stopPropagation(); setValue('referenceDocumentUri', ''); }}>
                                  <X size={14} />
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <Upload className="size-6 text-muted-foreground mx-auto" />
                                <p className="text-[10px] font-black uppercase italic tracking-widest">Anexar Foto da Planilha</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="alimentacao" className="mt-8 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                  <Card className="bg-card/40 border-border/50 rounded-2xl overflow-hidden shadow-xl">
                    <CardHeader className="bg-orange-500/10 border-b border-border/10 py-8 px-10">
                      <CardTitle className="font-headline text-xl md:text-2xl uppercase italic text-orange-500 font-black flex items-center gap-4 tracking-tighter leading-none">
                        <Utensils size={32}/> ESTRATÉGIA NUTRICIONAL
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 p-8">
                       <FormField control={form.control} name="aestheticGoal" render={({field}) => (
                         <FormItem className="space-y-2">
                           <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">OBJETIVO CORPORAL</FormLabel>
                           <Select onValueChange={field.onChange} value={field.value || 'performance'}>
                             <FormControl><SelectTrigger className="bg-black/30 h-12 font-bold text-sm rounded-xl border-border/40 px-6 transition-all focus:border-orange-500"><SelectValue placeholder="Qual sua meta..." /></SelectTrigger></FormControl>
                             <SelectContent className="bg-card border-border">
                               <SelectItem value="performance" className="font-bold italic uppercase">PERFORMANCE PURA</SelectItem>
                               <SelectItem value="cutting" className="font-bold italic uppercase">DEFINIÇÃO (CUTTING)</SelectItem>
                               <SelectItem value="bulking" className="font-bold italic uppercase">GANHO DE MASSA (BULKING)</SelectItem>
                               <SelectItem value="recomp" className="font-bold italic uppercase">RECOMPOSIÇÃO CORPORAL</SelectItem>
                             </SelectContent>
                           </Select>
                         </FormItem>
                       )} />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="musculacao" className="mt-8 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                  <Card className="bg-card/40 border-border/50 rounded-2xl overflow-hidden shadow-xl">
                    <CardHeader className="bg-purple-500/10 border-b border-border/10 py-8 px-10">
                      <CardTitle className="font-headline text-xl md:text-2xl uppercase italic text-purple-500 font-black flex items-center gap-4 tracking-tighter leading-none">
                        <Dumbbell size={32}/> SUPORTE MECÂNICO
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8 p-8">
                      <FormField control={form.control} name="legDay" render={({field}) => (
                        <FormItem className="space-y-4">
                          <div className="flex items-center gap-2">
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">DIA DE TREINO DE PERNA (LEG DAY) - SINCRONIZADO</FormLabel>
                            <Tooltip><TooltipTrigger asChild><Info className="size-4 text-muted-foreground cursor-help"/></TooltipTrigger><TooltipContent><p className="text-[10px]">A IA evitará intensidade alta no dia seguinte ao Leg Day. Sincronizado com Anamnese.</p></TooltipContent></Tooltip>
                          </div>
                          <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl><SelectTrigger className="bg-black/30 h-12 font-bold text-sm rounded-xl border-border/40 px-6 transition-all focus:border-purple-500"><SelectValue placeholder="Escolha o dia da musculação de perna..." /></SelectTrigger></FormControl>
                            <SelectContent className="bg-card border-border">
                              <SelectItem value="None" className="font-bold italic">NENHUM</SelectItem>
                              {weekDays.map(d => <SelectItem key={d.id} value={d.label} className="font-bold italic uppercase">{d.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-border/20 px-2 pb-20">
                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={isSaving} 
                  className="flex-1 h-12 font-black uppercase tracking-widest italic bg-white text-black hover:bg-primary transition-all duration-300 rounded-2xl shadow-xl hover:scale-[1.02]"
                >
                  {isSaving ? <Loader2 className="animate-spin mr-3 size-5" /> : <CheckCircle2 className="mr-3 size-5" />}
                  SALVAR DADOS
                </Button>
                
                <Button 
                  type="button" 
                  size="lg" 
                  className="flex-1 h-12 font-black uppercase tracking-widest italic bg-primary text-black shadow-xl rounded-2xl transition-all hover:scale-[1.02] hover:bg-white"
                  onClick={handleGenerate}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="animate-spin mr-3 size-5" /> : <Zap className="mr-3 size-5" />} 
                  {watchReferenceDocumentUri ? "TRADUZIR PLANILHA" : "GERAR CICLO IA"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </TooltipProvider>
    </DashboardLayout>
  );
}
