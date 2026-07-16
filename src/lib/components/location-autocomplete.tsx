"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Clock, X } from "lucide-react";
import { mobilityEngine } from "@/lib/mobility/engine";

interface PlaceResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface LocationAutocompleteProps {
  onSelect: (place: PlaceResult) => void;
  placeholder?: string;
  value?: string;
  className?: string;
  inputClassName?: string;
  recentSearches?: PlaceResult[];
  onClearRecent?: () => void;
}

function loadRecentSearches(): PlaceResult[] {
  try {
    const stored = localStorage.getItem("txd_recent_searches");
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveRecentSearches(places: PlaceResult[]) {
  try {
    localStorage.setItem("txd_recent_searches", JSON.stringify(places.slice(0, 5)));
  } catch {}
}

export function LocationAutocomplete({
  onSelect,
  placeholder = "Buscar endereço ou local...",
  value = "",
  className = "",
  inputClassName = "",
  recentSearches: externalRecent,
  onClearRecent,
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<PlaceResult[]>(externalRecent || loadRecentSearches());
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (externalRecent) setRecentSearches(externalRecent);
  }, [externalRecent]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setIsOpen(false); return; }
    setIsLoading(true);
    try {
      const data = await mobilityEngine.searchPlaces(q);
      setResults(data as PlaceResult[]);
      setIsOpen(true);
      setHighlightIndex(-1);
    } catch { setResults([]); }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = useCallback((place: PlaceResult) => {
    setQuery(`${place.name}, ${place.address}`);
    setIsOpen(false);
    const updated = [place, ...recentSearches.filter(r => r.id !== place.id)];
    setRecentSearches(updated);
    saveRecentSearches(updated);
    onSelect(place);
  }, [onSelect, recentSearches]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const items = query.trim() ? results : recentSearches;
    if (!isOpen) {
      if (e.key === "ArrowDown") { setIsOpen(true); setHighlightIndex(0); return; }
      return;
    }
    if (items.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex(i => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex(i => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      handleSelect(items[highlightIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }, [isOpen, results, recentSearches, query, highlightIndex, handleSelect]);

  const clearInput = useCallback(() => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  }, []);

  const showRecent = !query.trim() && recentSearches.length > 0;
  const showResults = query.trim() && isOpen;
  const displayItems = query.trim() ? results : recentSearches;

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { if (query.trim() && results.length) setIsOpen(true); if (!query.trim() && recentSearches.length) setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full h-11 pl-10 pr-9 rounded-xl bg-card-bg border border-card-border text-foreground placeholder-gray-500 focus:outline-none focus:border-primary/50 text-sm transition-colors ${inputClassName}`}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
        />
        {query && (
          <button
            onClick={clearInput}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {(showResults || showRecent) && displayItems.length > 0 && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-full mt-1 left-0 right-0 bg-card-bg border border-card-border rounded-xl overflow-hidden shadow-xl z-50"
          >
            {showRecent && (
              <div className="px-3 py-2 flex items-center justify-between border-b border-card-border">
                <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Recentes
                </span>
                {onClearRecent && (
                  <button
                    onClick={onClearRecent}
                    className="text-xs text-primary hover:text-primary-hover transition-colors"
                  >
                    Limpar
                  </button>
                )}
              </div>
            )}
            <div className="max-h-60 overflow-y-auto" role="listbox">
              {displayItems.map((place, index) => (
                <button
                  key={place.id}
                  onClick={() => handleSelect(place)}
                  onMouseEnter={() => setHighlightIndex(index)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                    highlightIndex === index ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                  role="option"
                  aria-selected={highlightIndex === index}
                >
                  <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{place.name}</p>
                    <p className="text-xs text-gray-500 truncate">{place.address}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
