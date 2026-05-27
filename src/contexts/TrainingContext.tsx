'use client';

import { createContext, useState, useEffect, type ReactNode, useCallback, useMemo } from 'react';
import { doc, onSnapshot, setDoc, collection, query, where, updateDoc } from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  setPersistence, 
  browserLocalPersistence,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  type User
} from 'firebase/auth';
import { useAuth, useFirestore } from '@/firebase';
import type { AthleteProfile, TrainingPlan, Workout, AnamnesisData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { generateTrainingBlock } from '@/ai/flows/generate-training-block';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

type PlanGenerationStatus = 'idle' | 'pending' | 'success' | 'error';

interface TrainingContextType {
  isHydrated: boolean;
  apiKey: string | null;
  setApiKey: (key: string) => void;
  profiles: AthleteProfile[];
  activeProfile: AthleteProfile | null;
  switchProfile: (profileId: string | null) => void;
  saveProfile: (data: Partial<AthleteProfile>) => void;
  trainingPlan: TrainingPlan | null;
  updateWorkout: (workoutId: string, updates: Partial<Workout>) => void;
  planGenerationStatus: PlanGenerationStatus;
  generateRunningPlanAsync: (profile: AthleteProfile) => Promise<void>;
  loginGoogle: () => Promise<void>;
  loginEmail: (email: string, pass: string) => Promise<void>;
  registerEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  toggleIntegration: (service: 'strava' | 'coros', connected: boolean) => void;
  user: User | null;
  getAnamnesisSummary: () => string;
}

export const TrainingContext = createContext<TrainingContextType | null>(null);

const STORAGE_KEYS = {
  API_KEY: 'corre_junto_local_api_key',
  LAST_PROFILE_ID: 'corre_junto_last_profile_id'
};

export function TrainingProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [localApiKey, setLocalApiKey] = useState<string | null>(null);
  const [localActiveProfileId, setLocalActiveProfileId] = useState<string | null>(null);
  const [planGenerationStatus, setPlanGenerationStatus] = useState<PlanGenerationStatus>('idle');
  
  const [remoteConfig, setRemoteConfig] = useState<any>(null);
  const [cloudProfiles, setRemoteProfiles] = useState<AthleteProfile[]>([]);
  const [localProfiles, setLocalProfiles] = useState<AthleteProfile[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (e) {
        console.warn("Auth Persistence error:", e);
      }

      const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setIsHydrated(true);
      });

      const lKey = localStorage.getItem(STORAGE_KEYS.API_KEY);
      const lProfId = localStorage.getItem(STORAGE_KEYS.LAST_PROFILE_ID);
      const lProfs = localStorage.getItem('corre_junto_local_profiles');

      if (lKey) setLocalApiKey(lKey);
      if (lProfId) setLocalActiveProfileId(lProfId);
      if (lProfs) setLocalProfiles(JSON.parse(lProfs));

      return () => unsubAuth();
    };
    init();
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
    }, async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userRef.path,
        operation: 'get',
      } satisfies SecurityRuleContext));
    });

    const athletesRef = collection(db, 'athletes');
    const qOwn = query(athletesRef, where('ownerUid', '==', user.uid));
    const unsubOwn = onSnapshot(qOwn, (snap) => {
      const docs = snap.docs.map(d => ({ ...d.data(), id: d.id } as AthleteProfile));
      setRemoteProfiles(docs);
    }, async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: athletesRef.path,
        operation: 'list',
      } satisfies SecurityRuleContext));
    });

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

  const effectiveApiKey = user ? (remoteConfig?.apiKey || null) : localApiKey;
  const persistedActiveProfileId = user ? (remoteConfig?.lastActiveProfileId || null) : localActiveProfileId;

  const activeProfile = useMemo(() => {
    return profiles.find(p => p.id === persistedActiveProfileId) || profiles[0] || null;
  }, [profiles, persistedActiveProfileId]);

  const getAnamnesisSummary = useCallback(() => {
    if (!activeProfile?.anamnesis) return "Anamnese não preenchida.";
    const a = activeProfile.anamnesis;
    return `
      Histórico de Lesões: ${(a.injuryHistory || []).join(', ') || 'Nenhum'}
      Dores Atuais: ${a.activeInjuries || 'Nenhuma'}
      Saúde: Doença Crônica ${a.chronicIllness || 'Não'} (${a.chronicIllnessDetail || 'N/A'})
      Medicação: ${a.medication || 'Nenhuma'}
      Nível de Esforço Mental: Sono ${a.sleepQuality}/5, Estresse ${a.stressLevel}/5
      Realidade do Atleta: ${a.mirrorWeek || 'Não informada'}
    `;
  }, [activeProfile]);

  const trainingPlan = activeProfile?.trainingPlan || null;

  const loginGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast({ title: "Sincronização Ativa", description: "Seu laboratório está na nuvem." });
    } catch (e: any) {
      console.error(e);
      let errorMsg = "Erro no Login. Verifique as restrições da nova chave de API.";
      if (e.message?.includes('requests-to-this-api')) {
        errorMsg = "API Bloqueada! Vá no Google Cloud > Credenciais e mude a restrição da chave para 'Nenhuma'.";
      }
      toast({ variant: 'destructive', title: "Acesso Negado", description: errorMsg });
    }
  };

  const loginEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      toast({ title: "Bem-vindo!", description: "Sincronização iniciada." });
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Erro", description: "E-mail ou senha inválidos." });
    }
  };

  const registerEmail = async (email: string, pass: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      toast({ title: "Conta Criada!", description: "Seu laboratório cloud está pronto." });
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Erro", description: "Não foi possível criar a conta." });
    }
  };

  const logout = async () => {
    await signOut(auth);
    setLocalActiveProfileId(null);
    toast({ title: "Modo Local", description: "Você saiu da nuvem." });
  };

  const setApiKey = (key: string) => {
    const cleanKey = key.trim();
    if (user && db) {
      const userRef = doc(db, 'user_data', user.uid);
      setDoc(userRef, { apiKey: cleanKey }, { merge: true }).catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userRef.path,
          operation: 'write',
          requestResourceData: { apiKey: cleanKey }
        } satisfies SecurityRuleContext));
      });
    } else {
      localStorage.setItem(STORAGE_KEYS.API_KEY, cleanKey);
      setLocalApiKey(cleanKey);
    }
    toast({ title: "Chave Configurada", description: "IA pronta para uso." });
  };

  const switchProfile = (id: string | null) => {
    if (user && db) {
      const userRef = doc(db, 'user_data', user.uid);
      setDoc(userRef, { lastActiveProfileId: id }, { merge: true }).catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userRef.path,
          operation: 'write',
          requestResourceData: { lastActiveProfileId: id }
        } satisfies SecurityRuleContext));
      });
    } else {
      localStorage.setItem(STORAGE_KEYS.LAST_PROFILE_ID, id || '');
      setLocalActiveProfileId(id);
    }
  };

  const saveProfile = useCallback((data: Partial<AthleteProfile>) => {
    const id = data.id || activeProfile?.id || crypto.randomUUID();
    const ownerUid = user ? user.uid : (data.ownerUid || 'local-user');
    const newProfile = { ...(activeProfile || {}), ...data, id, ownerUid } as AthleteProfile;

    if (user && db) {
      const docRef = doc(db, 'athletes', id);
      setDoc(docRef, newProfile, { merge: true }).then(() => {
        if (!persistedActiveProfileId) switchProfile(id);
      }).catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: docRef.path,
          operation: 'write',
          requestResourceData: newProfile
        } satisfies SecurityRuleContext));
      });
    } else {
      const newLocal = profiles.map(p => p.id === id ? newProfile : p);
      if (!profiles.find(p => p.id === id)) newLocal.push(newProfile);
      setLocalProfiles(newLocal);
      localStorage.setItem('corre_junto_local_profiles', JSON.stringify(newLocal));
    }
  }, [user, db, activeProfile, persistedActiveProfileId, profiles]);

  const updateWorkout = useCallback((workoutId: string, updates: Partial<Workout>) => {
    if (!activeProfile || !activeProfile.trainingPlan) return;
    const currentPlan = activeProfile.trainingPlan;
    const newWeeklyPlans = currentPlan.weeklyPlans.map((week) => ({
      ...week,
      runs: week.runs.map((run) => run.id === workoutId ? { ...run, ...updates } : run)
    }));
    const updatedPlan = { ...currentPlan, weeklyPlans: newWeeklyPlans };

    if (user && db) {
      const docRef = doc(db, 'athletes', activeProfile.id);
      updateDoc(docRef, { trainingPlan: updatedPlan }).catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: { trainingPlan: updatedPlan }
        } satisfies SecurityRuleContext));
      });
    } else {
      saveProfile({ trainingPlan: updatedPlan });
    }
  }, [db, user, activeProfile, saveProfile]);

  const generateRunningPlanAsync = async (profile: AthleteProfile) => {
    if (!effectiveApiKey) {
      toast({ variant: "destructive", title: "IA Indisponível", description: "Configure sua API Key." });
      return;
    }
    setPlanGenerationStatus('pending');
    try {
      let weeklyMileageGoal = 30;
      if (profile.experienceLevel === 'run_walk') weeklyMileageGoal = 15;
      else if (profile.experienceLevel === 'beginner') weeklyMileageGoal = 25;
      else if (profile.experienceLevel === 'intermediate') weeklyMileageGoal = 45;
      else if (profile.experienceLevel === 'advanced') weeklyMileageGoal = 75;

      const anamnesisContext = getAnamnesisSummary();

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
        weeklyAvailability: (profile.trainingDays || []).join(', '),
        injuryHistory: profile.trainingHistory || 'Nenhuma reportada',
        preferredWorkoutDays: (profile.trainingDays || []).slice(0, 2).join(', '),
        legDay: profile.strengthPreferences?.legDay,
        referenceFileDataUri: profile.referenceDocumentUri,
        anamnesisContext
      });

      result.weeklyPlans.forEach(week => {
        week.runs.forEach(run => { if (!run.id) run.id = crypto.randomUUID(); });
      });

      saveProfile({ ...profile, trainingPlan: result });
      setPlanGenerationStatus('success');
      toast({ title: "Plano Gerado!", description: "Sincronizado com a nuvem." });
    } catch (error: any) {
      setPlanGenerationStatus('error');
      toast({ variant: "destructive", title: "Falha na Geração", description: "Verifique sua chave de API." });
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
      isHydrated, apiKey: effectiveApiKey, setApiKey, profiles, activeProfile, switchProfile, saveProfile, trainingPlan, updateWorkout,
      planGenerationStatus, generateRunningPlanAsync, loginGoogle, loginEmail, registerEmail, logout, toggleIntegration, user, getAnamnesisSummary
    }}>
      {children}
    </TrainingContext.Provider>
  );
}
