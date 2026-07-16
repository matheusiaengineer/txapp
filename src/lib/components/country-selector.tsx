"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, Globe } from "lucide-react";
import { COUNTRIES, type Country } from "@/lib/auth/countries";

interface CountrySelectorProps {
  selected: Country;
  onSelect: (country: Country) => void;
  label?: string;
}

export function CountrySelector({ selected, onSelect, label = "País / Cidadania" }: CountrySelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.namePt.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={ref} className="relative">
      <label className="text-sm text-gray-400 mb-1.5 block">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full bg-background border border-card-border rounded-lg p-3 flex items-center justify-between hover:border-primary/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{selected.flag}</span>
          <div className="text-left">
            <span className="text-white font-medium">{selected.namePt}</span>
            <span className="text-gray-500 text-xs ml-2">+{selected.phoneCode}</span>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            className="absolute z-50 mt-2 w-full bg-card-bg border border-card-border rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="p-3 border-b border-card-border">
              <div className="flex items-center bg-background rounded-lg px-3 py-2 gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Buscar país..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="bg-transparent border-none outline-none text-white text-sm w-full"
                />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">Nenhum país encontrado</div>
              ) : (
                filtered.map(country => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => { onSelect(country); setOpen(false); setSearch(""); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-background transition-colors text-left ${
                      selected.code === country.code ? "bg-primary/10 border-l-2 border-primary" : ""
                    }`}
                  >
                    <span className="text-xl">{country.flag}</span>
                    <div className="flex-1">
                      <span className={`text-sm font-medium ${selected.code === country.code ? "text-primary" : "text-white"}`}>
                        {country.namePt}
                      </span>
                      <span className="text-gray-500 text-xs ml-2">{country.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{country.phoneCode}</span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
