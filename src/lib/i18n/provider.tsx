"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { type Locale, detectLocale, LOCALES } from "./config";
import { translations } from "./translations";

type I18nContext = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  dir: "ltr" | "rtl";
  locales: typeof LOCALES;
};

const I18nCtx = createContext<I18nContext | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("pt-BR");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("txd-locale") as Locale | null;
    setLocaleState(saved || detectLocale());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.lang = locale;
    const loc = LOCALES.find(l => l.code === locale);
    if (loc) document.documentElement.dir = loc.dir;
    localStorage.setItem("txd-locale", locale);
  }, [locale, mounted]);

  const setLocale = useCallback((l: Locale) => setLocaleState(l), []);
  const loc = LOCALES.find(l => l.code === locale);

  const t = useCallback((key: string, vars?: Record<string, string | number>): string => {
    const keys = key.split(".");
    let value: any = translations[locale];
    for (const k of keys) {
      if (value && typeof value === "object") value = value[k];
      else { value = undefined; break; }
    }
    if (!value) {
      value = translations["pt-BR"];
      for (const k of keys) {
        if (value && typeof value === "object") value = value[k];
        else { value = key; break; }
      }
    }
    if (typeof value !== "string") return key;
    if (vars) {
      return value.replace(/\{\{(\w+)\}\}/g, (_, v) => String(vars[v] ?? `{{${v}}}`));
    }
    return value;
  }, [locale]);

  if (!mounted) return <>{children}</>;

  return (
    <I18nCtx.Provider value={{ locale, setLocale, t, dir: loc?.dir || "ltr", locales: LOCALES }}>
      {children}
    </I18nCtx.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
