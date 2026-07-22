/**
 * @fileOverview Client-side handlers para IA do Laboratório CorreJunto.
 * Removido 'use server' para suportar deploy estático gratuito (Plano Spark).
 */

import { generateTrainingBlock, type GenerateTrainingBlockInput, type GenerateTrainingBlockOutput } from './flows/generate-training-block';
import { chatWithAICoach, type ChatWithAICoachInput } from './flows/chat-with-ai-coach';
import { analyzeWorkout, type AnalyzeWorkoutInput, type AnalyzeWorkoutOutput } from './flows/analyze-workout-flow';
import { generateDietPlan, type GenerateDietPlanInput, type GenerateDietPlanOutput } from './flows/generate-diet-plan';

export async function generateTrainingAction(input: GenerateTrainingBlockInput): Promise<GenerateTrainingBlockOutput> {
  try {
    return await generateTrainingBlock(input);
  } catch (error: any) {
    console.error("Erro IA (Gerar Plano):", error);
    throw new Error(error.message || "Falha ao gerar bloco de treinamento.");
  }
}

export async function chatWithCoachAction(input: ChatWithAICoachInput): Promise<{ feedback: string }> {
  try {
    return await chatWithAICoach(input);
  } catch (error) {
    console.error("Erro IA (Chat):", error);
    throw new Error("Falha na comunicação com o Coach IA.");
  }
}

export async function analyzeWorkoutAction(input: AnalyzeWorkoutInput): Promise<AnalyzeWorkoutOutput> {
  try {
    return await analyzeWorkout(input);
  } catch (error) {
    console.error("Erro IA (Análise):", error);
    throw new Error("Falha na análise biomecânica.");
  }
}

export async function generateDietAction(input: GenerateDietPlanInput): Promise<GenerateDietPlanOutput> {
  try {
    return await generateDietPlan(input);
  } catch (error: any) {
    console.error("Erro IA (Dieta):", error);
    throw new Error(error.message || "Falha ao gerar o plano alimentar.");
  }
}
