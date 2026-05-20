'use client';

import { createContext, useState, useEffect, type ReactNode, useCallback, useMemo } from 'react';
import { doc, onSnapshot, setDoc, getDoc, collection, query, where, updateDoc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { useAuth, useFirestore, useUser, useCollection } from '@/firebase';
import type { AthleteProfile, TrainingPlan, Workout } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { generateTrainingBlock } from '@/ai/flows/generate-training-block';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type PlanGenerationStatus = 'idle' | 'pending' | 'success' | 'error';

interface TrainingContextType {
  isHydrated: boolean;
  apiKey: string | null;
  setApiKey: (key: string) => Promise<void>;
  profiles: AthleteProfile[];
  activeProfile: AthleteProfile | null;
  switchProfile: (profileId: string | null) => void;
  saveProfile: (data: Partial<AthleteProfile>) => Promise<void>;
  trainingPlan: TrainingPlan | null;
  updateWorkout: (workoutId: string, updates: Partial<Workout>) => Promise<void>;
  planGenerationStatus: PlanGenerationStatus;
  generateRunningPlanAsync: (profile: AthleteProfile) => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  toggleIntegration: (service: 'strava' | 'coros', connected: boolean) => void;
}

export const TrainingContext = createContext<TrainingContextType | null>(null);

const STORAGE_KEYS = {
  PROFILE: 'corre_junto_local_profile',
  PLAN: 'corre_junto_local_plan',
  API_KEY: 'corre_junto_local_api_key',
  LAST_PROFILE_ID: 'corre_junto_last_profile_id'
};

export function TrainingProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();

  const [isHydrated, setIsHydrated] = useState(false);
  const [localApiKey, setLocalApiKey] = useState<string | null>(null);
  const [localActiveProfileId, setLocalActiveProfileId] = useState<string | null>(null);
  const [planGenerationStatus, setPlanGenerationStatus] = useState<PlanGenerationStatus>('idle');

  // 1. Configurações globais do usuário logado
  const userConfigRef = useMemo(() => user ? doc(db, 'user_data', user.uid) : null, [db, user]);
  
  const [userConfig, setUserConfig] = useState<any>(null);

  useEffect(() => {
    // Carrega dados locais
    const lKey = localStorage.getItem(STORAGE_KEYS.API_KEY);
    const lProfId = localStorage.getItem(STORAGE_KEYS.LAST_PROFILE_ID);
    if (lKey) setLocalApiKey(lKey);
    if (lProfId) setLocalActiveProfileId(lProfId);
    setIsHydrated(true);

    if (user && db) {
      const unsubscribe = onSnapshot(doc(db, 'user_data', user.uid), (snap) => {
        if (snap.exists()) setUserConfig(snap.data());
      });
      return () => unsubscribe();
    }
  }, [user, db]);

  const effectiveApiKey = user ? (userConfig?.apiKey || null) : localApiKey;
  const persistedActiveProfileId = user ? (userConfig?.lastActiveProfileId || null) : localActiveProfileId;

  // 2. Busca perfis do usuário (como Coach ou como Atleta)
  const coachProfilesQuery = useMemo(() => {
    if (user) return query(collection(db, 'athletes'), where('ownerUid', '==', user.uid));
    return query(collection(db, 'athletes'), where('ownerUid', '==', 'local-user'));
  }, [db, user]);
  const { data: coachProfiles } = useCollection<AthleteProfile>(coachProfilesQuery);

  const athleteProfilesQuery = useMemo(() => {
    if (user?.email) return query(collection(db, 'athletes'), where('athleteEmail', '==', user.email));
    return null;
  }, [db, user]);
  const { data: athleteProfiles } = useCollection<AthleteProfile>(athleteProfilesQuery);

  const profiles = useMemo(() => {
    const map = new Map<string, AthleteProfile>();
    (coachProfiles || []).forEach(p => map.set(p.id, p));
    (athleteProfiles || []).forEach(p => map.set(p.id, p));
    return Array.from(map.values());
  }, [coachProfiles, athleteProfiles]);

  const activeProfile = useMemo(() => {
    return profiles.find(p => p.id === persistedActiveProfileId) || profiles[0] || null;
  }, [profiles, persistedActiveProfileId]);

  const trainingPlan = activeProfile?.trainingPlan || null;

  // Ações
  const setApiKey = async (key: string) => {
    const cleanKey = key.trim();
    if (user && userConfigRef) {
      setDoc(userConfigRef, { apiKey: cleanKey }, { merge: true }).catch(err => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userConfigRef.path,
          operation: 'write',
          requestResourceData: { apiKey: cleanKey }
        }));
      });
    } else {
      localStorage.setItem(STORAGE_KEYS.API_KEY, cleanKey);
      setLocalApiKey(cleanKey);
    }
    toast({ title: "Motor Ativo", description: "Sua chave Gemini foi configurada." });
  };

  const switchProfile = (id: string | null) => {
    if (user && userConfigRef) {
      setDoc(userConfigRef, { lastActiveProfileId: id }, { merge: true });
    } else {
      localStorage.setItem(STORAGE_KEYS.LAST_PROFILE_ID, id || '');
      setLocalActiveProfileId(id);
    }
  };

  const saveProfile = useCallback(async (data: Partial<AthleteProfile>) => {
    const id = data.id || activeProfile?.id || crypto.randomUUID();
    const ownerUid = data.ownerUid || (user ? user.uid : 'local-user');
    const docRef = doc(db, 'athletes', id);
    
    const newProfile = { ...(activeProfile || {}), ...data, id, ownerUid } as AthleteProfile;

    setDoc(docRef, newProfile, { merge: true }).then(() => {
      if (!persistedActiveProfileId) switchProfile(id);
      toast({ title: 'Dados Sincronizados', description: 'Informações salvas na nuvem.' });
    }).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: docRef.path,
        operation: 'write',
        requestResourceData: newProfile
      }));
    });
  }, [user, db, activeProfile, persistedActiveProfileId, toast]);

  const updateWorkout = useCallback(async (workoutId: string, updates: Partial<Workout>) => {
    if (!activeProfile || !activeProfile.trainingPlan) return;
    
    const currentPlan = activeProfile.trainingPlan;
    const newWeeklyPlans = currentPlan.weeklyPlans.map((week) => ({
      ...week,
      runs: week.runs.map((run) => run.id === workoutId ? { ...run, ...updates } : run)
    }));

    const docRef = doc(db, 'athletes', activeProfile.id);
    updateDoc(docRef, {
      trainingPlan: { ...currentPlan, weeklyPlans: newWeeklyPlans }
    }).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: docRef.path,
        operation: 'update'
      }));
    });
  }, [db, activeProfile]);

  const generateRunningPlanAsync = async (profile: AthleteProfile) => {
    if (!effectiveApiKey) {
      toast({ variant: "destructive", title: "IA Offline", description: "Configure sua API Key no menu." });
      return;
    }

    setPlanGenerationStatus('pending');
    toast({ title: "Processando Biometria", description: "O Gemini Coach está desenhando seu ciclo..." });

    try {
      let weeklyMileageGoal = 30;
      if (profile.experienceLevel === 'run_walk') weeklyMileageGoal = 15;
      else if (profile.experienceLevel === 'beginner') weeklyMileageGoal = 25;
      else if (profile.experienceLevel === 'intermediate') weeklyMileageGoal = 45;
      else if (profile.experienceLevel === 'advanced') weeklyMileageGoal = 75;

      const result = await generateTrainingBlock({
        apiKey: effectiveApiKey,
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
        weeklyMileageGoal,
        targetRaceDistance: profile.raceDistance || '10k',
        targetPace: profile.targetPace,
        targetTime: profile.targetTime,
        currentLongRunDistance: 15,
        weeklyAvailability: profile.trainingDays.join(', '),
        injuryHistory: profile.trainingHistory || 'Nenhuma reportada',
        preferredWorkoutDays: profile.trainingDays.slice(0, 2).join(', '),
        legDay: profile.strengthPreferences?.legDay,
        referenceFileDataUri: profile.referenceDocumentUri
      });

      result.weeklyPlans.forEach(week => {
        week.runs.forEach(run => { if (!run.id) run.id = crypto.randomUUID(); });
      });

      await saveProfile({ ...profile, trainingPlan: result });
      setPlanGenerationStatus('success');
      toast({ title: "Ciclo Gerado!", description: "Sua planilha de elite está pronta." });
    } catch (error: any) {
      console.error(error);
      setPlanGenerationStatus('error');
      toast({ variant: "destructive", title: "Erro na IA", description: "Falha na conexão com o Gemini." });
    }
  };

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      toast({ variant: 'destructive', title: "Erro no Login" });
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setLocalActiveProfileId(null);
      toast({ title: "Sessão encerrada" });
    } catch (e) {
      toast({ variant: 'destructive', title: "Erro ao sair" });
    }
  };

  const toggleIntegration = (service: 'strava' | 'coros', connected: boolean) => {
    if (!activeProfile) return;
    saveProfile({ 
      integrations: { 
        ...activeProfile.integrations, 
        [service]: { ...activeProfile.integrations?.[service], connected, autoSync: connected } 
      } as any
    });
  };

  return (
    <TrainingContext.Provider value={{
      isHydrated: isHydrated && !authLoading, 
      apiKey: effectiveApiKey, 
      setApiKey,
      profiles,
      activeProfile,
      switchProfile,
      saveProfile,
      trainingPlan,
      updateWorkout,
      planGenerationStatus,
      generateRunningPlanAsync,
      login,
      logout,
      toggleIntegration
    }}>
      {children}
    </TrainingContext.Provider>
  );
}
