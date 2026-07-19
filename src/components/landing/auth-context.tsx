"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface AuthState {
  open: boolean;
  mode: "login" | "register";
  profile: string;
  redirectAfterAuth: string | null;
  openAuth: (mode: "login" | "register", profile?: string) => void;
  closeAuth: () => void;
  setRedirect: (path: string | null) => void;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [profile, setProfile] = useState("passenger");
  const [redirectAfterAuth, setRedirectAfterAuth] = useState<string | null>(null);

  const openAuth = useCallback((m: "login" | "register", p?: string) => {
    setMode(m);
    if (p) setProfile(p);
    setOpen(true);
  }, []);

  const closeAuth = useCallback(() => setOpen(false), []);
  const setRedirect = useCallback((path: string | null) => setRedirectAfterAuth(path), []);

  return (
    <AuthCtx.Provider value={{ open, mode, profile, redirectAfterAuth, openAuth, closeAuth, setRedirect }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
