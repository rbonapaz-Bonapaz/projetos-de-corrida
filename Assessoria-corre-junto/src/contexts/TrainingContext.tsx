'use client';

import { createContext, useState, useEffect, type ReactNode, useCallback, useMemo } from 'react';
import { doc, onSnapshot, setDoc, collection, query, where, updateDoc, getDoc } from 'firebase/firestore';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  type User
} from 'firebase/auth';
import { useAuth, useFirestore } from '@/firebase';
import {
  isBiometricSupported,
  hasBiometricRegistered,
  registerBiometricUnlock,
  unlockWithBiometric,
  removeBiometricUnlock,
} from '@/lib/biometric-auth';
import type { AthleteProfile, TrainingPlan, Workout, WeeklyPlan, DietPlan } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { generateTrainingAction, generateDietAction } from '@/ai/actions';
import { validateTrainingPlanInputs, validateDietPlanInputs, buildSafetyDirectives, calcAge } from '@/ai/plan-rules';
import { deriveFitnessSnapshot, formatFitnessSnapshotForPrompt } from '@/lib/records';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type PlanGenerationStatus = 'idle' | 'pending' | 'success' | 'error';

interface TrainingContextType {
  isHydrated: boolean;
  profiles: AthleteProfile[];
  activeProfile: AthleteProfile | null;
  switchProfile: (profileId: string | null) => void;
  saveProfile: (data: Partial<AthleteProfile>) => void;
  deleteProfile: (id: string) => Promise<void>;
  trainingPlan: TrainingPlan | null;
  updateWorkout: (workoutId: string, updates: Partial<Workout>) => void;
  planGenerationStatus: PlanGenerationStatus;
  generateRunningPlanAsync: (profile: AthleteProfile) => Promise<void>;
  dietPlan: DietPlan | null;
  dietGenerationStatus: PlanGenerationStatus;
  generateDietPlanAsync: (profile: AthleteProfile) => Promise<void>;
  loginGoogle: () => Promise<void>;
  loginBiometric: () => Promise<void>;
  loginEmail: (email: string, pass: string) => Promise<void>;
  registerEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  toggleIntegration: (service: 'strava' | 'coros', connected: boolean) => void;
  user: User | null;
  getAnamnesisSummary: () => string;
  biometricSupported: boolean;
  biometricRegistered: boolean;
  registerBiometric: (email: string, pass: string) => Promise<void>;
  unregisterBiometric: () => void;
  askPasswordEveryTime: boolean;
  setAskPasswordEveryTime: (value: boolean) => void;
}

export const TrainingContext = createContext<TrainingContextType | null>(null);

const STORAGE_KEYS = {
  LAST_PROFILE_ID: 'corre_junto_last_profile_id',
  LOCAL_PROFILES: 'corre_junto_local_profiles',
  ASK_PASSWORD_EVERY_TIME: 'corre_junto_ask_password_every_time'
};

const dayOrder = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export function TrainingProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [localActiveProfileId, setLocalActiveProfileId] = useState<string | null>(null);
  const [planGenerationStatus, setPlanGenerationStatus] = useState<PlanGenerationStatus>('idle');
  const [dietGenerationStatus, setDietGenerationStatus] = useState<PlanGenerationStatus>('idle');
  
  const [remoteConfig, setRemoteConfig] = useState<any>(null);
  const [cloudProfiles, setRemoteProfiles] = useState<AthleteProfile[]>([]);
  const [localProfiles, setLocalProfiles] = useState<AthleteProfile[]>([]);

  const [biometricRegistered, setBiometricRegistered] = useState(false);
  const [askPasswordEveryTime, setAskPasswordEveryTimeState] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setBiometricRegistered(hasBiometricRegistered());
    setAskPasswordEveryTimeState(localStorage.getItem(STORAGE_KEYS.ASK_PASSWORD_EVERY_TIME) === 'true');
  }, []);

  const setAskPasswordEveryTime = useCallback((value: boolean) => {
    setAskPasswordEveryTimeState(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.ASK_PASSWORD_EVERY_TIME, String(value));
    }
  }, []);

  // Garantia de abertura do sistema: Força a hidratação se demorar demais
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const lProfId = localStorage.getItem(STORAGE_KEYS.LAST_PROFILE_ID);
      const lProfs = localStorage.getItem(STORAGE_KEYS.LOCAL_PROFILES);

      if (lProfId) setLocalActiveProfileId(lProfId);
      if (lProfs) {
        try { setLocalProfiles(JSON.parse(lProfs)); } catch (e) {}
      }
    }
  }, []);

  useEffect(() => {
    if (!auth) return;
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsHydrated(true);
    }, () => {
      setIsHydrated(true);
    });
    return () => unsubAuth();
  }, [auth]);

  useEffect(() => {
    if (!user || !db) {
      setRemoteConfig(null);
      setRemoteProfiles([]);
      return;
    }

    const userRef = doc(db, 'user_data', user.uid);
    const unsubConfig = onSnapshot(userRef, (snap) => {
      if (snap.exists()) setRemoteConfig(snap.data());
    }, () => {});

    const athletesRef = collection(db, 'athletes');
    const qOwn = query(athletesRef, where('ownerUid', '==', user.uid));
    const unsubOwn = onSnapshot(qOwn, (snap) => {
      const docs = snap.docs.map(d => ({ ...d.data(), id: d.id } as AthleteProfile));
      setRemoteProfiles(docs);
    }, () => {});

    return () => {
      unsubConfig();
      unsubOwn();
    };
  }, [user, db]);

  const profiles = useMemo(() => {
    const map = new Map<string, AthleteProfile>();
    cloudProfiles.forEach(p => map.set(p.id, p));
    localProfiles.forEach(p => { if (!map.has(p.id)) map.set(p.id, p); });
    return Array.from(map.values());
  }, [cloudProfiles, localProfiles]);

  const persistedActiveProfileId = user ? (remoteConfig?.lastActiveProfileId || null) : localActiveProfileId;

  const activeProfile = useMemo(() => {
    const found = profiles.find(p => p.id === persistedActiveProfileId);
    return found || profiles[0] || null;
  }, [profiles, persistedActiveProfileId]);

  const getAnamnesisSummary = useCallback(() => {
    if (!activeProfile?.anamnesis) return "Anamnese não preenchida.";
    const a = activeProfile.anamnesis;
    const lines: string[] = [];
    const push = (label: string, value: any) => {
      if (value !== undefined && value !== null && value !== '' && !(Array.isArray(value) && value.length === 0)) {
        lines.push(`${label}: ${Array.isArray(value) ? value.join(', ') : value}.`);
      }
    };
    push('Objetivo', a.objective);
    push('Prova-alvo', a.targetRace);
    push('Liberação médica', a.medicalRelease);
    push('Doença crônica', a.chronicIllness === 'Sim' ? `Sim (${a.chronicIllnessDetail || 'sem detalhe'})` : a.chronicIllness);
    push('Medicação em uso', a.medication);
    push('Histórico de lesões', a.injuryHistory);
    push('Dores/lesões ativas', a.activeInjuries);
    push('Tempo de prática', a.practiceTime);
    push('Consistência', a.consistency);
    push('Semana espelho (relato)', a.mirrorWeek);
    push('Calçado', a.footwear);
    push('Turno preferido', a.preferredShift);
    push('Dias de força', a.strengthDays);
    push('Monitoramento de intensidade', a.intensityMonitoring);
    push('Terreno habitual', a.terrain);
    push('Dispositivos', a.devices);
    push('Maior dificuldade', a.biggestDifficulty);
    push('Nível de comprometimento (0-10)', a.commitmentLevel);
    push('Qualidade do sono (1-5)', a.sleepQuality);
    push('Nível de estresse (1-5)', a.stressLevel);
    return lines.length ? lines.join(' ') : "Anamnese não preenchida.";
  }, [activeProfile]);

  const saveProfile = useCallback((data: Partial<AthleteProfile>) => {
    const currentId = data.id || activeProfile?.id || (typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substring(7));
    const ownerUid = user ? user.uid : (data.ownerUid || 'local-user');
    
    const baseProfile = profiles.find(p => p.id === currentId) || activeProfile || {};
    const newProfile = { ...baseProfile, ...data, id: currentId, ownerUid } as AthleteProfile;

    // Verificação de igualdade profunda básica para evitar loops
    if (JSON.stringify(baseProfile) === JSON.stringify(newProfile)) return;

    if (user && db) {
      const docRef = doc(db, 'athletes', currentId);
      setDoc(docRef, newProfile, { merge: true }).catch(err => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: docRef.path, operation: 'write', requestResourceData: newProfile
        }));
      });
    } else {
      setLocalProfiles(prev => {
        const next = [...prev.filter(p => p.id !== currentId), newProfile];
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.LOCAL_PROFILES, JSON.stringify(next));
        }
        return next;
      });
    }
  }, [user, db, activeProfile, profiles]);

  const toggleIntegration = useCallback((service: 'strava' | 'coros', connected: boolean) => {
    if (!activeProfile) return;
    saveProfile({
      integrations: {
        ...activeProfile.integrations,
        [service]: {
          ...activeProfile.integrations?.[service],
          connected,
          autoSync: connected
        }
      }
    } as any);
  }, [activeProfile, saveProfile]);

  const applyChosenPersistence = async () => {
    if (!auth) return;
    // "Pedir senha toda vez" ativado -> sessão não sobrevive ao fechar o navegador.
    // Desativado (padrão) -> permanece logado entre visitas, como a maioria dos apps.
    await setPersistence(auth, askPasswordEveryTime ? browserSessionPersistence : browserLocalPersistence);
  };

  const loginGoogle = async (): Promise<void> => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await applyChosenPersistence();
      const result = await signInWithPopup(auth, provider);
      if (db && result.user) {
        const userRef = doc(db, 'user_data', result.user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          await setDoc(userRef, { lastActiveProfileId: localActiveProfileId || "" }, { merge: true });
        }
        toast({ title: "Sincronização Cloud Ativada" });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Falha no Login", description: "Verifique se as popups estão permitidas." });
    }
  };

  const loginBiometric = async () => {
    if (!auth) return;
    try {
      toast({ title: "Validando Biometria...", description: "Use sua digital ou face para acessar." });
      const { email, password } = await unlockWithBiometric();
      await applyChosenPersistence();
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Acesso Biométrico Liberado" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro Biométrico", description: e?.message || 'Não foi possível autenticar.' });
    }
  };

  const loginEmail = async (email: string, pass: string) => {
    if (!auth) return;
    try {
      await applyChosenPersistence();
      await signInWithEmailAndPassword(auth, email, pass);
      toast({ title: "Acesso Liberado" });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Falha no Acesso' });
    }
  };

  const registerBiometric = async (email: string, pass: string) => {
    try {
      await registerBiometricUnlock(email, pass);
      setBiometricRegistered(true);
      toast({ title: "Biometria Ativada", description: "Agora você pode entrar com digital ou rosto neste aparelho." });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro ao Ativar Biometria', description: e?.message });
      throw e;
    }
  };

  const unregisterBiometric = () => {
    removeBiometricUnlock();
    setBiometricRegistered(false);
    toast({ title: "Biometria Desativada" });
  };

  const registerEmail = async (email: string, pass: string) => {
    if (!auth) return;
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      toast({ title: "Cadastro Realizado" });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Falha no Cadastro' });
    }
  };

  const logout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setUser(null);
      toast({ title: "Sessão Encerrada" });
    } catch (e) {
      if (typeof window !== 'undefined') window.location.reload();
    }
  };

  const switchProfile = useCallback((id: string | null) => {
    if (user && db) {
      setDoc(doc(db, 'user_data', user.uid), { lastActiveProfileId: id }, { merge: true });
    } else {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.LAST_PROFILE_ID, id || '');
      }
      setLocalActiveProfileId(id);
    }
  }, [user, db]);

  const updateWorkout = useCallback((workoutId: string, updates: Partial<Workout>) => {
    if (!activeProfile || !activeProfile.trainingPlan) return;
    const currentPlan = activeProfile.trainingPlan;
    const newWeeklyPlans = currentPlan.weeklyPlans.map((week) => ({
      ...week,
      runs: week.runs.map((run) => run.id === workoutId ? { ...run, ...updates } : run)
    }));
    const updatedPlan = { ...currentPlan, weeklyPlans: newWeeklyPlans };

    if (user && db) {
      updateDoc(doc(db, 'athletes', activeProfile.id), { trainingPlan: updatedPlan });
    } else {
      saveProfile({ trainingPlan: updatedPlan });
    }
  }, [db, user, activeProfile, saveProfile]);

  const generateRunningPlanAsync = async (profile: AthleteProfile) => {
    const missing = validateTrainingPlanInputs(profile);
    if (missing.length) {
      toast({
        variant: "destructive",
        title: "Complete seu perfil antes de gerar",
        description: `Faltando: ${missing.join(', ')}.`
      });
      return;
    }

    setPlanGenerationStatus('pending');
    try {
      const strength = profile.strengthPreferences;
      const strengthContext = strength
        ? `objetivo ${strength.objective || 'não informado'}, ${strength.frequency || 0}x/semana, dias: ${(strength.trainingDays || []).join(', ') || 'não informado'}${strength.limitations ? `, limitações: ${strength.limitations}` : ''}`
        : undefined;

      const aiResult = await generateTrainingAction({
        raceName: profile.raceName,
        currentVDOT: profile.vo2Max || 40,
        hrZone1End: Math.round((profile.thresholdHr || 160) * 0.8),
        hrZone2End: Math.round((profile.thresholdHr || 160) * 0.9),
        hrZone3End: Math.round((profile.thresholdHr || 160) * 0.95),
        hrZone4End: profile.thresholdHr || 160,
        hrMax: (profile.thresholdHr || 160) + 20,
        trainingBlockType: 'Construction',
        planGenerationType: profile.planGenerationType || 'blocks',
        raceDate: profile.raceDate || new Date().toISOString().split('T')[0],
        weeklyMileageGoal: profile.weeklyMileageGoal || 30,
        currentWeeklyMileage: profile.currentWeeklyMileage,
        targetRaceDistance: profile.raceDistance || '10k',
        targetPace: profile.targetPace,
        targetTime: profile.targetTime,
        currentLongRunDistance: profile.longestRun || 15,
        weeklyAvailability: (profile.trainingDays || []).join(', '),
        injuryHistory: profile.trainingHistory || 'Nenhuma',
        preferredWorkoutDays: (profile.trainingDays || []).join(', '),
        legDay: profile.strengthPreferences?.legDay || (profile as any).legDay,
        age: calcAge(profile.birthDate),
        gender: profile.gender,
        experienceLevel: profile.experienceLevel,
        mainObjective: profile.mainObjective,
        strengthContext,
        referenceFileDataUri: profile.referenceDocumentUri,
        referenceHandling: profile.referenceHandling || 'optimized',
        anamnesisContext: getAnamnesisSummary(),
        safetyDirectives: buildSafetyDirectives(profile),
        fitnessSnapshotContext: formatFitnessSnapshotForPrompt(deriveFitnessSnapshot(profile)),
      });

      const finalPlan: TrainingPlan = {
        blockType: aiResult.blockType,
        durationWeeks: aiResult.durationWeeks,
        weeklyPlans: aiResult.weeklyPlans.map(week => ({
          weekNumber: week.weekNumber,
          dateRange: week.dateRange,
          focus: week.focus,
          strength: week.strength,
          notes: week.notes,
          runs: week.runs.map(run => ({
            ...run,
            id: run.id || (typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substring(7))
          } as Workout))
        } as WeeklyPlan))
      };

      saveProfile({ ...profile, trainingPlan: finalPlan });
      setPlanGenerationStatus('success');
      toast({ title: "Ciclo IA Gerado!" });
    } catch (error: any) {
      setPlanGenerationStatus('error');
      toast({ variant: "destructive", title: "Erro na IA", description: error.message });
    }
  };

  const generateDietPlanAsync = async (profile: AthleteProfile) => {
    const missing = validateDietPlanInputs(profile);
    if (missing.length) {
      toast({
        variant: "destructive",
        title: "Complete seu perfil antes de gerar",
        description: `Faltando: ${missing.join(', ')}.`
      });
      return;
    }

    setDietGenerationStatus('pending');
    try {
      const diet = profile.dietPreferences || {};

      const aiResult = await generateDietAction({
        age: calcAge(profile.birthDate),
        gender: profile.gender,
        currentWeight: profile.currentWeight || 70,
        height: profile.height || 175,
        targetWeight: diet.targetWeight || undefined,
        aestheticGoal: diet.aestheticGoal || 'performance',
        activityLevel: diet.activityLevel || 'moderate',
        dietStyle: diet.dietStyle || 'onivoro',
        mealCount: diet.mealCount || 4,
        trainingTiming: diet.trainingTiming,
        weeklyMileage: profile.weeklyMileageGoal || profile.currentWeeklyMileage,
        strengthFrequency: profile.strengthPreferences?.frequency,
        supplements: diet.supplements,
        allergies: diet.allergies,
        preferredFoods: diet.preferredFoods,
        excludedFoods: diet.excludedFoods,
        anamnesisContext: getAnamnesisSummary(),
        safetyDirectives: buildSafetyDirectives(profile),
      });

      saveProfile({ ...profile, dietPlan: aiResult as DietPlan });
      setDietGenerationStatus('success');
      toast({ title: "Plano Alimentar Gerado!" });
    } catch (error: any) {
      setDietGenerationStatus('error');
      toast({ variant: "destructive", title: "Erro na Nutrição IA", description: error.message });
    }
  };

  return (
    <TrainingContext.Provider value={{
      isHydrated, profiles, activeProfile,
      switchProfile, saveProfile, deleteProfile: async (id) => {
        if (user && db) await updateDoc(doc(db, 'athletes', id), { ownerUid: 'deleted' });
      }, 
      trainingPlan: activeProfile?.trainingPlan || null,
      updateWorkout, planGenerationStatus, generateRunningPlanAsync,
      dietPlan: activeProfile?.dietPlan || null,
      dietGenerationStatus, generateDietPlanAsync,
      loginGoogle,
      loginBiometric, toggleIntegration,
      loginEmail, registerEmail, logout, user, getAnamnesisSummary,
      biometricSupported: isBiometricSupported(),
      biometricRegistered, registerBiometric, unregisterBiometric,
      askPasswordEveryTime, setAskPasswordEveryTime
    }}>
      {children}
    </TrainingContext.Provider>
  );
}
