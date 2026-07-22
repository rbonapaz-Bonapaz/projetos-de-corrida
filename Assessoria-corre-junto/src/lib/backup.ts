/**
 * Backup completo do perfil em JSON — exportar para arquivo e reimportar
 * em qualquer dispositivo. Mantém a promessa feita na tela "Sobre".
 */

import type { AthleteProfile } from '@/lib/types';

const BACKUP_VERSION = 1;

interface BackupFile {
  _correjunto_backup: true;
  version: number;
  exportedAt: string;
  profile: AthleteProfile;
}

/** Gera o arquivo .json e dispara o download no navegador. */
export function downloadProfileBackup(profile: AthleteProfile) {
  const payload: BackupFile = {
    _correjunto_backup: true,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    profile,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = (profile.name || 'atleta').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  a.href = url;
  a.download = `correjunto-backup-${safeName}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Lê e valida um arquivo de backup. Remove identidade (id/ownerUid/
 * athleteEmail) para que a importação sempre se funda ao perfil ativo
 * atual em vez de tentar assumir a identidade de outra conta.
 */
export async function parseProfileBackup(file: File): Promise<Partial<AthleteProfile>> {
  const text = await file.text();
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Arquivo inválido: não é um JSON válido.');
  }

  const profile = parsed?._correjunto_backup ? parsed.profile : parsed;
  if (!profile || typeof profile !== 'object' || !('name' in profile)) {
    throw new Error('Este arquivo não parece ser um backup do CorreJunto.');
  }

  const { id, ownerUid, athleteEmail, ...rest } = profile;
  return rest as Partial<AthleteProfile>;
}
