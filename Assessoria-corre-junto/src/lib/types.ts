
export type ExperienceLevel = 'run_walk' | 'beginner' | 'intermediate' | 'advanced';
export type PlanGenerationType = 'full' | 'blocks';
export type Gender = 'male' | 'female' | 'other';
export type ReferenceHandling = 'faithful' | 'optimized';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type DietStyle = 'onivoro' | 'vegetariano' | 'vegano' | 'low_carb' | 'cetogenica' | 'flexivel';

export interface DietPreferences {
  aestheticGoal?: 'cutting' | 'bulking' | 'recomp' | 'performance';
  targetWeight?: number;
  activityLevel?: ActivityLevel;
  dietStyle?: DietStyle;
  trainingTiming?: 'jejum' | 'manha' | 'meio-dia' | 'tarde' | 'noite';
  mealCount?: number;
  supplements?: string;
  allergies?: string;
  preferredFoods?: string;
  excludedFoods?: string;
}

export interface StrengthPreferences {
  splitPreference?: 'full_body' | 'upper_lower' | 'ppl';
  objective?: 'strength' | 'hypertryphy' | 'performance' | 'endurance';
  frequency?: number;
  trainingDays?: string[];
  equipment?: string[];
  focusAreas?: string[];
  legDay?: string;
  limitations?: string;
  prBench?: number;
  prSquat?: number;
  prDeadlift?: number;
}

export interface IntegrationData {
  connected: boolean;
  lastSync?: string;
  username?: string;
  autoSync: boolean;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface AnamnesisData {
  whatsapp?: string;
  profession?: string;
  emergencyContact?: string;
  medicalRelease?: string;
  chronicIllness?: string;
  chronicIllnessDetail?: string;
  medication?: string;
  injuryHistory?: string[];
  activeInjuries?: string;
  practiceTime?: string;
  consistency?: string;
  mirrorWeek?: string;
  mirrorWeekFileUri?: string;
  easyPace?: string;
  hardPace?: string;
  trainingStructure?: string;
  footwear?: string;
  recentRecord?: string;
  maxContinuousDistance?: string;
  preferredShift?: string;
  timeWeekdays?: string;
  timeWeekends?: string;
  strengthDays?: string[];
  strengthFocus?: string;
  strengthLocation?: string;
  intensityMonitoring?: string;
  terrain?: string;
  devices?: string[];
  biggestDifficulty?: string;
  commitmentLevel?: number;
  sleepQuality?: number;
  stressLevel?: number;
  dietClassification?: string;
  objective?: string;
  targetRace?: string;
}

export interface AthleteProfile {
  id: string;
  name: string;
  ownerUid: string;
  athleteEmail?: string;
  avatarUrl?: string;
  location?: string;
  birthDate: string;
  gender: Gender;
  currentWeight: number;
  height: number;
  restingHr: number;
  vo2Max: number;
  thresholdPace: string;
  thresholdHr: number;
  raceName?: string;
  raceDistance: string;
  raceDate: string;
  raceGoal?: string;
  targetPace?: string;
  targetTime?: string;
  trainingDays: string[];
  longRunDay: string;
  weeklyMileageGoal: number;
  currentWeeklyMileage?: number;
  longestRun?: number;
  mainObjective?: string;
  planGenerationType: PlanGenerationType;
  experienceLevel: ExperienceLevel;
  trainingHistory: string;
  referenceDocumentUri?: string;
  referenceHandling?: ReferenceHandling;
  trainingPlan?: TrainingPlan;
  dietPlan?: DietPlan;
  dietPreferences?: DietPreferences;
  strengthPreferences?: StrengthPreferences;
  integrations?: {
    strava: IntegrationData;
    coros: IntegrationData;
  };
  anamnesis?: AnamnesisData;
  importedActivities?: ImportedActivity[];
}

export interface ImportedActivity {
  id: string;
  source: 'coros' | 'strava' | 'manual';
  fileName: string;
  importedAt: string;
  sport?: string;
  startTime?: string;
  distanceKm?: number;
  durationSec?: number;
  durationText?: string;
  avgPace?: string;
  avgHr?: number;
  avgCadenceSpm?: number;
  avgGroundContactTimeMs?: number;
  avgVerticalOscillationCm?: number;
  totalAscentM?: number;
  calories?: number;
}

export interface AiAnalysis {
  actualMetrics: {
    averagePace: string;
    averageCadence: string;
    strideRatio: number;
    groundContactTime?: string;
    verticalOscillation?: string;
  };
  analysisSummary: {
    summary: string;
    technicalReview: string;
  };
  recommendations: string;
  areasOfImprovement: string[];
}

export interface Workout {
  id: string;
  day: string;
  type: string;
  distance: string;
  paceZone: string;
  description: string;
  rpe?: number;
  estimatedDuration?: string;
  technicalDetails?: Array<{ label: string, value: string }>;
  phases: Array<{
    name: string;
    distance: string;
    pace?: string;
    description: string;
  }>;
  completed?: boolean;
  analysis?: AiAnalysis;
}

export interface WeeklyPlan {
  weekNumber: number;
  dateRange?: string;
  focus: string;
  runs: Workout[];
  strength: string;
  notes: string;
}

export interface TrainingPlan {
  blockType: string;
  durationWeeks: number;
  weeklyPlans: WeeklyPlan[];
}

export interface DietMeal {
  name: string;
  time: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  items: string[];
  notes?: string;
}

export interface DietPlan {
  targetCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  waterLiters: number;
  strategy: string;
  meals: DietMeal[];
  trainingDayNotes: string;
  restDayNotes: string;
  supplementation: string;
  generalTips: string[];
}
