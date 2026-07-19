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

export async function hasBiometricCredential(): Promise<boolean> {
  try {
    const res = await fetch("/api/webauthn/challenge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login_start" }),
    });
    const data = await res.json();
    return (data.credentials?.length || 0) > 0;
  } catch {
    return false;
  }
}

export async function registerBiometric(): Promise<WebAuthnResponse> {
  try {
    const challengeRes = await fetch("/api/webauthn/challenge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "register_start" }),
    });
    const options = await challengeRes.json();
    if (!challengeRes.ok) return { success: false, error: options.error || "Falha ao obter challenge" };

    const credential = await navigator.credentials.create({
      publicKey: options,
    });

    const registerRes = await fetch("/api/webauthn/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credential),
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login_start" }),
    });
    const options = await challengeRes.json();
    if (!challengeRes.ok) return { success: false, error: options.error || "Falha ao obter challenge" };

    const assertion = await navigator.credentials.get({
      publicKey: options,
    });

    const loginRes = await fetch("/api/webauthn/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(assertion),
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
