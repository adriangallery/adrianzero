/**
 * Auto-save the canvas to localStorage every few seconds. On mount, expose a
 * helper to restore the last saved draft. Keeps the user from losing work to
 * an accidental refresh.
 */
import { useEffect, useRef } from 'react';
import { useTShitStore } from '../store/tshitStore';
import type { Pixel } from '../types/tshit.types';

const STORAGE_KEY = 'tshit-studio:draft:v1';
const SAVE_INTERVAL_MS = 5000;

interface Draft {
  pixels: Pixel[];
  savedAt: number;
}

export function useDraftAutosave() {
  const lastSerialised = useRef<string>('');

  useEffect(() => {
    const tick = () => {
      const pixels = useTShitStore.getState().getAllPixels();
      const draft: Draft = { pixels, savedAt: Date.now() };
      const next = JSON.stringify(draft);
      if (next === lastSerialised.current) return;
      try {
        localStorage.setItem(STORAGE_KEY, next);
        lastSerialised.current = next;
      } catch {
        // quota exceeded or storage disabled — silently ignore
      }
    };
    const id = window.setInterval(tick, SAVE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);
}

export function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Draft;
    if (!draft.pixels || !Array.isArray(draft.pixels)) return null;
    return draft;
  } catch {
    return null;
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
