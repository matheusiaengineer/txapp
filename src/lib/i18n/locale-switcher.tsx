"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "./provider";
import { type Locale } from "./config";

const flags: Record<string, string> = {
  "pt-BR": "🇧🇷",
  "en-US": "🇺🇸",
  "es-ES": "🇪🇸",
  "fr-FR": "🇫🇷",
  "de-DE": "🇩🇪",
  "it-IT": "🇮🇹",
  "ja-JP": "🇯🇵",
  "zh-CN": "🇨🇳",
  "hi-IN": "🇮🇳",
  "ar-SA": "🇸🇦",
  "ru-RU": "🇷🇺",
  "pt-PT": "🇵🇹",
  "nl-NL": "🇳🇱",
  "ko-KR": "🇰🇷",
  "tr-TR": "🇹🇷",
};

export function LocaleSwitcher() {
  const { locale, setLocale, locales } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const current = locales.find(l => l.code === locale);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
      >
        <span className="text-lg">{flags[locale]}</span>
        <span className="font-medium text-gray-900 dark:text-gray-100">{current?.native}</span>
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="h-4 w-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 z-50 mt-2 max-h-72 w-64 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="p-1">
              {locales.map(loc => (
                <button
                  key={loc.code}
                  onClick={() => { setLocale(loc.code as Locale); setOpen(false); }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    locale === loc.code
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  <span className="text-lg">{flags[loc.code]}</span>
                  <div className="flex flex-col">
                    <span className="font-medium">{loc.native}</span>
                    <span className="text-xs text-gray-400">{loc.name}</span>
                  </div>
                  {loc.dir === "rtl" && (
                    <span className="ml-auto text-[10px] uppercase tracking-wider text-gray-400">RTL</span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function LocaleSwitcherMinimal() {
  const { locale, setLocale, locales } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-full p-2 text-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        title="Switch language"
      >
        {flags[locale]}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 z-50 mt-2 grid grid-cols-5 gap-1 rounded-xl border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800"
          >
            {locales.map(loc => (
              <button
                key={loc.code}
                onClick={() => { setLocale(loc.code as Locale); setOpen(false); }}
                className={`flex items-center justify-center rounded-lg p-2 text-xl transition-colors ${
                  locale === loc.code
                    ? "bg-blue-50 ring-2 ring-blue-500 dark:bg-blue-900/30"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                title={loc.native}
              >
                {flags[loc.code]}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
