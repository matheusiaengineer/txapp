export interface WebAuthnResponse {
  success: boolean;
  error?: string;
  user?: any;
}

export async function isBiometricSupported(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export async function registerBiometric(userId: string, email: string): Promise<WebAuthnResponse> {
  try {
    const challengeRes = await fetch("/api/webauthn/challenge", {
      method: "POST",
      body: JSON.stringify({ action: "register_start", userId }),
    });
    const challengeData = await challengeRes.json();
    if (!challengeRes.ok) return { success: false, error: challengeData.error || "Falha ao obter challenge" };

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: base64ToArrayBuffer(challengeData.challenge),
        rp: { id: window.location.hostname, name: "TXDAPP" },
        user: {
          id: new TextEncoder().encode(userId),
          name: email,
          displayName: email,
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
        },
        timeout: 60000,
        attestation: "none",
      },
    }) as PublicKeyCredential;

    const attResp = credential.response as AuthenticatorAttestationResponse;
    const registerRes = await fetch("/api/webauthn/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        credentialId: credential.id,
        rawId: arrayBufferToBase64(credential.rawId),
        attestationObject: arrayBufferToBase64(attResp.attestationObject),
        clientDataJSON: arrayBufferToBase64(attResp.clientDataJSON),
        transports: attResp.getTransports?.() || [],
      }),
    });

    const registerData = await registerRes.json();
    return { success: registerRes.ok, error: registerData.error };
  } catch (err: any) {
    if (err.name === "NotAllowedError") {
      return { success: false, error: "Biometria cancelada pelo usuário" };
    }
    return { success: false, error: err.message || "Erro ao registrar biometria" };
  }
}

export async function loginWithBiometric(): Promise<WebAuthnResponse> {
  try {
    const challengeRes = await fetch("/api/webauthn/challenge", {
      method: "POST",
      body: JSON.stringify({ action: "login_start" }),
    });
    const challengeData = await challengeRes.json();
    if (!challengeRes.ok) return { success: false, error: challengeData.error || "Falha ao obter challenge" };

    const allowedCredentials = (challengeData.credentials || []).map((c: any) => ({
      id: base64ToArrayBuffer(c.id),
      type: "public-key" as const,
      transports: c.transports || ["internal"],
    }));

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: base64ToArrayBuffer(challengeData.challenge),
        allowCredentials: allowedCredentials.length > 0 ? allowedCredentials : undefined,
        userVerification: "required",
        timeout: 60000,
      },
    }) as PublicKeyCredential;

    const authResp = assertion.response as AuthenticatorAssertionResponse;
    const loginRes = await fetch("/api/webauthn/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        credentialId: assertion.id,
        rawId: arrayBufferToBase64(assertion.rawId),
        authenticatorData: arrayBufferToBase64(authResp.authenticatorData),
        signature: arrayBufferToBase64(authResp.signature),
        userHandle: authResp.userHandle ? arrayBufferToBase64(authResp.userHandle) : null,
        clientDataJSON: arrayBufferToBase64(authResp.clientDataJSON),
      }),
    });

    const loginData = await loginRes.json();
    if (loginRes.ok && loginData.success) {
      return { success: true, user: loginData.user };
    }
    return { success: false, error: loginData.error || "Falha no login biométrico" };
  } catch (err: any) {
    if (err.name === "NotAllowedError") {
      return { success: false, error: "Biometria cancelada pelo usuário" };
    }
    if (err.name === "SecurityError") {
      return { success: false, error: "Biometria não disponível neste contexto" };
    }
    return { success: false, error: err.message || "Erro no login biométrico" };
  }
}
