/**
 * Fotos de progresso — armazenamento e análise por IA.
 *
 * A imagem em si vai pro Firebase Storage (nunca pro Firestore — estoura o
 * limite de 1MB por documento rapidinho). Só metadados (data, nota,
 * comentário da IA, caminho no Storage) ficam no Firestore, numa coleção
 * própria (progress_photos), separada do documento do atleta.
 *
 * Privacidade: nunca usamos getDownloadURL() (gera um link público que
 * funciona pra qualquer um que o tenha, sem checar autenticação de novo).
 * Sempre buscamos os bytes com getBytes(), que passa pela regra de
 * segurança do Storage (só o dono, uid do Firebase Auth) toda vez.
 */

'use client';

import { getApp } from 'firebase/app';
import { getFirestore, collection, addDoc, deleteDoc, doc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getBytes, deleteObject } from 'firebase/storage';
import { generateText } from '@/ai/genkit';
import type { ProgressPhoto } from '@/lib/types';

const COLLECTION = 'progress_photos';

function storagePathFor(uid: string, fileName: string): string {
  const safeExt = fileName.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const id = typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  return `progress-photos/${uid}/${id}.${safeExt}`;
}

async function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const ANALYSIS_SYSTEM_PROMPT = `Você é um preparador físico experiente do CorreJunto, avaliando uma foto de progresso que o próprio atleta enviou pra calibrar o treino de força.

REGRAS OBRIGATÓRIAS:
1. NUNCA estime percentual de gordura corporal, peso ou qualquer métrica numérica de composição corporal — uma foto não permite essa precisão, e apresentar um número como se fosse exato seria enganoso.
2. NUNCA comente atratividade, compare com um "corpo ideal" ou faça julgamento estético. Tom técnico e construtivo, como um treinador orientando o próximo ciclo — nunca crítico.
3. Foque só em: distribuição aparente de desenvolvimento muscular entre grupos (core, superior, inferior, anterior/posterior) e como isso se conecta a prioridades de treino de força.
4. Seja breve: 3 a 5 frases. Se a foto não permitir uma leitura útil (ângulo, iluminação, roupa cobrindo o necessário), diga isso honestamente em vez de inventar.
5. Termine com 1-2 sugestões concretas de foco pro treino de força do próximo ciclo.

Responda em português (Brasil).`;

/** Envia a foto pro Storage e devolve o caminho salvo (não a URL pública). */
export async function uploadProgressPhotoFile(uid: string, file: File): Promise<string> {
  const storage = getStorage(getApp());
  const path = storagePathFor(uid, file.name);
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file, { contentType: file.type || 'image/jpeg' });
  return path;
}

/** Pede à IA um comentário qualitativo (não numérico) sobre foco de treino a partir da foto. */
export async function analyzeProgressPhoto(file: File, athleteContext?: string): Promise<string> {
  const imageDataUri = await fileToDataUri(file);
  return generateText({
    system: ANALYSIS_SYSTEM_PROMPT,
    prompt: athleteContext
      ? `Contexto do atleta: ${athleteContext}\n\nAvalie a foto de progresso anexada.`
      : 'Avalie a foto de progresso anexada.',
    imageDataUri,
    temperature: 0.4,
  });
}

export async function createProgressPhotoRecord(params: {
  ownerUid: string;
  athleteId: string;
  storagePath: string;
  takenAt: string;
  note?: string;
  aiComment?: string;
}): Promise<ProgressPhoto> {
  const db = getFirestore(getApp());
  const payload = {
    ownerUid: params.ownerUid,
    athleteId: params.athleteId,
    storagePath: params.storagePath,
    takenAt: params.takenAt,
    note: params.note || '',
    aiComment: params.aiComment || '',
    createdAt: new Date().toISOString(),
  };
  const docRef = await addDoc(collection(db, COLLECTION), payload);
  return { id: docRef.id, ...payload };
}

export async function listProgressPhotos(uid: string): Promise<ProgressPhoto[]> {
  const db = getFirestore(getApp());
  const q = query(collection(db, COLLECTION), where('ownerUid', '==', uid), orderBy('takenAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ProgressPhoto, 'id'>) }));
}

export async function deleteProgressPhoto(photo: ProgressPhoto): Promise<void> {
  const db = getFirestore(getApp());
  const storage = getStorage(getApp());
  await Promise.all([
    deleteDoc(doc(db, COLLECTION, photo.id)),
    deleteObject(ref(storage, photo.storagePath)).catch(() => {
      // Se o arquivo já não existir no Storage, segue o baile — o registro no Firestore é o que importa remover.
    }),
  ]);
}

/** Busca os bytes da foto (respeitando as regras de acesso) e devolve uma object URL local — nunca um link público. */
export async function getProgressPhotoObjectUrl(storagePath: string): Promise<string> {
  const storage = getStorage(getApp());
  const bytes = await getBytes(ref(storage, storagePath));
  const blob = new Blob([bytes]);
  return URL.createObjectURL(blob);
}
