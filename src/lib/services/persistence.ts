"use client";

import { createClient } from "@/lib/supabase/browser";
import { debounce } from "@/lib/utils/helpers";

const STORAGE_PREFIX = "txd-state-";
const SYNC_DEBOUNCE = 500;

type Persistable = Record<string, any>;

interface PersistenceOptions {
  /** Also sync to Supabase table */
  syncToDb?: boolean;
  /** Supabase table name for sync */
  tableName?: string;
  /** Column name for the profile_id FK */
  profileIdColumn?: string;
  /** Maximum age in ms before considering state stale */
  maxAge?: number;
}

class PersistenceService {
  private syncQueue: Map<string, Persistable> = new Map();
  private syncTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Save state to localStorage and optionally sync to Supabase.
   * Uses debounced batch sync to avoid too many DB writes.
   */
  saveState<T extends Persistable>(key: string, data: T, options: PersistenceOptions = {}): void {
    const storageKey = `${STORAGE_PREFIX}${key}`;
    const payload = {
      data,
      version: 1,
      timestamp: Date.now(),
    };

    // Always persist to localStorage
    try {
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (e) {
      // localStorage full — clear old entries
      this.clearOldEntries();
      try {
        localStorage.setItem(storageKey, JSON.stringify(payload));
      } catch {}
    }

    // Debounced sync to Supabase
    if (options.syncToDb && options.tableName) {
      this.syncQueue.set(key, data);
      this.scheduleSync(options);
    }
  }

  /**
   * Load state from localStorage.
   * Returns defaultData if nothing found or state is stale.
   */
  loadState<T extends Persistable>(key: string, defaultData: T, options: PersistenceOptions = {}): T {
    const storageKey = `${STORAGE_PREFIX}${key}`;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return defaultData;

      const parsed = JSON.parse(raw);

      // Check staleness
      if (options.maxAge) {
        const age = Date.now() - parsed.timestamp;
        if (age > options.maxAge) {
          localStorage.removeItem(storageKey);
          return defaultData;
        }
      }

      return { ...defaultData, ...parsed.data };
    } catch {
      return defaultData;
    }
  }

  /**
   * Clear a specific state key
   */
  clearState(key: string): void {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  }

  /**
   * Clear all TXD states from localStorage
   */
  clearAll(): void {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX));
    keys.forEach(k => localStorage.removeItem(k));
  }

  /**
   * Remove old entries when localStorage is full
   */
  private clearOldEntries(): void {
    const entries: { key: string; timestamp: number }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(STORAGE_PREFIX)) {
        try {
          const v = JSON.parse(localStorage.getItem(k)!);
          entries.push({ key: k, timestamp: v.timestamp || 0 });
        } catch {}
      }
    }
    // Remove oldest 20%
    entries.sort((a, b) => a.timestamp - b.timestamp);
    const toRemove = Math.ceil(entries.length * 0.2);
    entries.slice(0, toRemove).forEach(e => localStorage.removeItem(e.key));
  }

  /**
   * Debounced sync to Supabase
   */
  private scheduleSync(options: PersistenceOptions): void {
    if (this.syncTimer) clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(async () => {
      const entries = Array.from(this.syncQueue.entries());
      this.syncQueue.clear();

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      for (const [key, data] of entries) {
        try {
          await supabase
            .from(options.tableName!)
            .upsert({
              [options.profileIdColumn || 'profile_id']: user.id,
              state_key: key,
              state_data: data,
              updated_at: new Date().toISOString(),
            }, { onConflict: `${options.profileIdColumn || 'profile_id'},state_key` });
        } catch {}
      }
    }, SYNC_DEBOUNCE);
  }
}

export const persistence = new PersistenceService();

/**
 * Step validator: checks if previous steps are completed before allowing navigation.
 * Returns the first incomplete step index, or -1 if all complete.
 */
export function getFirstIncompleteStep<T extends Persistable>(
  flowKey: string,
  steps: { key: string; validator: (data: any) => boolean }[]
): number {
  const flow = persistence.loadState(flowKey, { completedSteps: [] } as any);
  const completed = flow.completedSteps || [];
  
  for (let i = 0; i < steps.length; i++) {
    if (!completed.includes(steps[i].key)) {
      const stepData = persistence.loadState(steps[i].key, {} as any);
      if (!steps[i].validator(stepData)) {
        return i;
      }
    }
  }
  return -1;
}

/**
 * Mark a step as completed in the flow tracker
 */
export function completeStep(flowKey: string, stepKey: string): void {
  const flow = persistence.loadState(flowKey, { completedSteps: [] } as any);
  const completed = flow.completedSteps || [];
  if (!completed.includes(stepKey)) {
    completed.push(stepKey);
  }
  persistence.saveState(flowKey, { ...flow, completedSteps: completed });
}

/**
 * History Stack: maintains a stack of routes for proper back navigation
 */
class HistoryStackService {
  private stack: string[] = [];

  constructor() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}history-stack`);
      if (saved) {
        try { this.stack = JSON.parse(saved); } catch { this.stack = []; }
      }
    }
  }

  push(route: string): void {
    // Don't push duplicates
    if (this.stack[this.stack.length - 1] === route) return;
    this.stack.push(route);
    this.persist();
  }

  pop(): string | null {
    const route = this.stack.pop() || null;
    this.persist();
    return route;
  }

  peek(): string | null {
    return this.stack[this.stack.length - 1] || null;
  }

  clear(): void {
    this.stack = [];
    this.persist();
  }

  get length(): number {
    return this.stack.length;
  }

  private persist(): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}history-stack`, JSON.stringify(this.stack));
    } catch {}
  }
}

export const historyStack = new HistoryStackService();
