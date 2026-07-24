/**
 * Biometria local (WebAuthn) — desbloqueio de login neste dispositivo.
 *
 * O CorreJunto é 100% estático (Plano Spark, sem backend próprio), então não
 * há como fazer um FIDO2/WebAuthn "de verdade" (que exige um servidor para
 * verificar a assinatura da chave privada). Em vez disso, usamos o WebAuthn
 * só como PORTA DE ENTRADA: o navegador pede a digital/rosto do atleta e,
 * se confirmar, liberamos o email/senha guardados (só neste navegador, nunca
 * no Firestore) para logar normalmente via signInWithEmailAndPassword.
 *
 * Ou seja: a biometria não substitui a senha — ela guarda a senha de forma
 * protegida pelo sensor do aparelho, evitando digitar toda vez.
 */

const CREDENTIAL_ID_KEY = 'corre_junto_biometric_credential_id';
const VAULT_KEY = 'corre_junto_biometric_vault';

export function isBiometricSupported(): boolean {
  return typeof window !== 'undefined' && !!window.PublicKeyCredential;
}

export function hasBiometricRegistered(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return !!localStorage.getItem(CREDENTIAL_ID_KEY) && !!localStorage.getItem(VAULT_KEY);
  } catch {
    return false;
  }
}

function bufToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function base64ToBuf(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

/**
 * Registra a biometria neste dispositivo, associando-a ao email/senha
 * já usados no login por email. Chamado a partir de Meus Dados, com o
 * atleta já autenticado.
 */
export async function registerBiometricUnlock(email: string, password: string): Promise<void> {
  if (!isBiometricSupported()) {
    throw new Error('Este dispositivo ou navegador não suporta biometria.');
  }

  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = crypto.getRandomValues(new Uint8Array(16));

  let credential: Credential | null;
  try {
    credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'CorreJunto', id: window.location.hostname },
        user: { id: userId, name: email, displayName: email },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        timeout: 60000,
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
      },
    });
  } catch (error: any) {
    if (error?.name === 'NotAllowedError') {
      throw new Error('Você cancelou o cadastro da biometria.');
    }
    throw new Error('Não foi possível registrar a biometria neste dispositivo.');
  }

  if (!credential) throw new Error('Falha ao registrar biometria.');

  localStorage.setItem(CREDENTIAL_ID_KEY, bufToBase64((credential as PublicKeyCredential).rawId));
  // Guardado só neste navegador (localStorage), nunca enviado à nuvem.
  localStorage.setItem(VAULT_KEY, btoa(JSON.stringify({ email, password })));
}

/**
 * Pede a digital/rosto do atleta e, se confirmar, devolve o email/senha
 * guardados neste dispositivo para logar.
 */
export async function unlockWithBiometric(): Promise<{ email: string; password: string }> {
  if (!isBiometricSupported()) {
    throw new Error('Este dispositivo ou navegador não suporta biometria.');
  }
  const credentialIdB64 = localStorage.getItem(CREDENTIAL_ID_KEY);
  const vaultRaw = localStorage.getItem(VAULT_KEY);
  if (!credentialIdB64 || !vaultRaw) {
    throw new Error('Nenhuma biometria cadastrada neste dispositivo. Ative em Meus Dados.');
  }

  const challenge = crypto.getRandomValues(new Uint8Array(32));

  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        timeout: 60000,
        userVerification: 'required',
        allowCredentials: [
          { type: 'public-key', id: base64ToBuf(credentialIdB64), transports: ['internal'] },
        ],
      },
    });
    if (!assertion) throw new Error('Biometria não reconhecida.');
  } catch (error: any) {
    if (error?.name === 'NotAllowedError') {
      throw new Error('Biometria não reconhecida ou cancelada.');
    }
    throw new Error('Falha ao validar biometria.');
  }

  const { email, password } = JSON.parse(atob(vaultRaw));
  return { email, password };
}

export function removeBiometricUnlock(): void {
  localStorage.removeItem(CREDENTIAL_ID_KEY);
  localStorage.removeItem(VAULT_KEY);
}
