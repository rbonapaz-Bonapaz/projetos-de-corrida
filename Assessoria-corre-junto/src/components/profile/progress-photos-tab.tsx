'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  uploadProgressPhotoFile,
  analyzeProgressPhoto,
  createProgressPhotoRecord,
  listProgressPhotos,
  deleteProgressPhoto,
  getProgressPhotoObjectUrl,
} from '@/lib/progress-photos';
import type { ProgressPhoto } from '@/lib/types';
import { Camera, Loader2, Trash2, Sparkles, Lock, GitCompareArrows, X } from 'lucide-react';

interface ProgressPhotosTabProps {
  uid?: string;
  athleteId?: string;
  athleteContext?: string;
}

interface PhotoWithUrl extends ProgressPhoto {
  objectUrl?: string;
}

export function ProgressPhotosTab({ uid, athleteId, athleteContext }: ProgressPhotosTabProps) {
  const { toast } = useToast();
  const [photos, setPhotos] = React.useState<PhotoWithUrl[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [pendingFile, setPendingFile] = React.useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = React.useState<string | null>(null);
  const [takenAt, setTakenAt] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = React.useState('');
  const [compareIds, setCompareIds] = React.useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const loadPhotos = React.useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const list = await listProgressPhotos(uid);
      const withUrls = await Promise.all(
        list.map(async (p) => {
          try {
            const objectUrl = await getProgressPhotoObjectUrl(p.storagePath);
            return { ...p, objectUrl };
          } catch {
            return { ...p, objectUrl: undefined };
          }
        })
      );
      setPhotos(withUrls);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro ao carregar fotos', description: err?.message });
    } finally {
      setLoading(false);
    }
  }, [uid, toast]);

  React.useEffect(() => {
    loadPhotos();
    // Revoga as object URLs ao desmontar, pra não vazar memória.
    return () => {
      setPhotos((prev) => {
        prev.forEach((p) => p.objectUrl && URL.revokeObjectURL(p.objectUrl));
        return prev;
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setPendingPreviewUrl(URL.createObjectURL(file));
  };

  const cancelPending = () => {
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    setPendingFile(null);
    setPendingPreviewUrl(null);
    setNote('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!uid || !athleteId || !pendingFile) return;
    setUploading(true);
    try {
      const [storagePath, aiComment] = await Promise.all([
        uploadProgressPhotoFile(uid, pendingFile),
        analyzeProgressPhoto(pendingFile, athleteContext).catch((err) => {
          toast({ variant: 'destructive', title: 'IA não conseguiu avaliar a foto', description: err?.message || 'A foto foi salva mesmo assim.' });
          return '';
        }),
      ]);
      await createProgressPhotoRecord({ ownerUid: uid, athleteId, storagePath, takenAt, note, aiComment });
      toast({ title: 'Foto salva', description: 'Adicionada às suas fotos de progresso.' });
      cancelPending();
      await loadPhotos();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro ao salvar foto', description: err?.message });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photo: PhotoWithUrl) => {
    if (!window.confirm('Apagar esta foto de progresso? Não tem como desfazer.')) return;
    try {
      await deleteProgressPhoto(photo);
      if (photo.objectUrl) URL.revokeObjectURL(photo.objectUrl);
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      setCompareIds((prev) => prev.filter((id) => id !== photo.id));
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro ao apagar', description: err?.message });
    }
  };

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const comparePhotos = compareIds
    .map((id) => photos.find((p) => p.id === id))
    .filter((p): p is PhotoWithUrl => !!p)
    .sort((a, b) => a.takenAt.localeCompare(b.takenAt));

  if (!uid) {
    return (
      <div className="card-plain text-center py-14 px-6">
        <div className="flex flex-col items-center gap-4">
          <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Lock className="size-6 text-primary" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-bold text-[15px]">Só disponível logado</h3>
            <p className="text-muted-foreground text-[12px] max-w-xs mx-auto">
              Fotos de progresso ficam guardadas de forma privada na sua conta — entre com login para usar essa aba.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="card-plain">
        <div className="flex items-start gap-3 mb-4">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Camera size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[15px] flex items-center gap-2">
              Fotos de progresso <Lock size={12} className="text-muted-foreground" />
            </h3>
            <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
              Guardadas de forma privada — só você acessa. A IA dá um comentário qualitativo de foco de treino (nunca um número de composição
              corporal, isso não dá pra estimar com precisão a partir de uma foto).
            </p>
          </div>
        </div>

        {!pendingFile ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all border-border hover:bg-secondary/30"
          >
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelected} />
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary w-fit"><Camera size={20} /></div>
              <p className="text-[13px] font-semibold">Adicionar foto</p>
              <p className="text-[11px] text-muted-foreground">JPG ou PNG</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative w-full sm:w-40 h-40 shrink-0 rounded-xl overflow-hidden border border-border bg-secondary/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pendingPreviewUrl!} alt="Prévia" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={cancelPending}
                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-background/80 text-foreground hover:text-destructive"
                aria-label="Cancelar"
                disabled={uploading}
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex-1 space-y-3">
              <div className="space-y-1.5">
                <Label className="eyebrow">Data da foto</Label>
                <Input type="date" value={takenAt} onChange={(e) => setTakenAt(e.target.value)} disabled={uploading} className="h-11 rounded-xl text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="eyebrow">Nota (opcional)</Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ex: início do bloco de força, 3º mês de treino..."
                  disabled={uploading}
                  className="rounded-xl text-sm min-h-[70px]"
                />
              </div>
              <Button onClick={handleSave} disabled={uploading} className="rounded-xl gap-2 w-full sm:w-auto">
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {uploading ? 'Salvando e avaliando…' : 'Salvar foto'}
              </Button>
            </div>
          </div>
        )}
      </section>

      {compareIds.length === 2 && (
        <section className="card-plain">
          <div className="flex items-center justify-between mb-4">
            <h3 className="eyebrow flex items-center gap-1.5"><GitCompareArrows size={13} className="text-primary" /> Comparativo</h3>
            <button type="button" onClick={() => setCompareIds([])} className="text-[11px] text-muted-foreground hover:text-foreground">
              Limpar seleção
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {comparePhotos.map((p, i) => (
              <div key={p.id} className="space-y-2">
                <span className="tag num">{i === 0 ? 'Antes' : 'Depois'} · {new Date(p.takenAt + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                <div className="rounded-xl overflow-hidden border border-border aspect-[3/4] bg-secondary/30">
                  {p.objectUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.objectUrl} alt={`Foto de ${p.takenAt}`} className="w-full h-full object-cover" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card-plain">
        <div className="flex items-center justify-between mb-4">
          <h3 className="eyebrow">Suas fotos {photos.length > 0 && `(${photos.length})`}</h3>
          {photos.length >= 2 && (
            <span className="text-[11px] text-muted-foreground">Marque duas pra comparar</span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="size-5 animate-spin text-primary" /></div>
        ) : photos.length === 0 ? (
          <p className="text-[12px] text-muted-foreground text-center py-8">Nenhuma foto ainda.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {photos.map((p) => (
              <div key={p.id} className="flex flex-col gap-1.5">
                <div
                  onClick={() => toggleCompare(p.id)}
                  className={cn(
                    "relative rounded-xl overflow-hidden border-2 aspect-[3/4] bg-secondary/30 cursor-pointer transition-all",
                    compareIds.includes(p.id) ? "border-primary" : "border-transparent hover:border-border"
                  )}
                >
                  {p.objectUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.objectUrl} alt={`Foto de ${p.takenAt}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">Sem prévia</div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDelete(p); }}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-background/80 text-muted-foreground hover:text-destructive"
                    aria-label="Apagar foto"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <span className="num text-[10.5px] font-semibold text-center">
                  {new Date(p.takenAt + 'T00:00:00').toLocaleDateString('pt-BR')}
                </span>
                {p.aiComment && (
                  <details className="text-[10.5px] text-muted-foreground leading-relaxed">
                    <summary className="cursor-pointer text-primary font-semibold list-none flex items-center gap-1">
                      <Sparkles size={10} /> Ver avaliação
                    </summary>
                    <p className="mt-1">{p.aiComment}</p>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
