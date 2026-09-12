/**
 * Tx pendiente del editor TraitLab, en un store GLOBAL (no local al
 * componente) para que sobreviva al cambio de pestaña/ruta — recon
 * §0.3/§8.8: hoy el spinner se pierde si el usuario navega mientras la tx
 * sigue en curso. `PendingApplyBanner` (montado en `MainLayout`, fuera de
 * `/traitlab`) lo lee para mostrar "Applying… view" en cualquier pantalla.
 */

import { create } from 'zustand';

export interface PendingApply {
  tokenId: string;
  /** Paso actual, 1-indexado, sobre el total del plan de firmas. */
  step: number;
  totalSteps: number;
  startedAt: number;
}

interface PendingTxState {
  pending: PendingApply | null;
  start: (tokenId: string, totalSteps: number) => void;
  setStep: (step: number) => void;
  clear: () => void;
}

export const usePendingTxStore = create<PendingTxState>((set) => ({
  pending: null,
  start: (tokenId, totalSteps) => set({ pending: { tokenId, step: 1, totalSteps, startedAt: Date.now() } }),
  setStep: (step) =>
    set((state) => (state.pending ? { pending: { ...state.pending, step } } : state)),
  clear: () => set({ pending: null }),
}));
