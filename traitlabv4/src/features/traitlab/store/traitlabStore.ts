/**
 * Store del editor TraitLab (F4). Vive solo en memoria (no persiste): al
 * recargar la página se vuelve a partir de lo equipado on-chain, que es la
 * fuente de verdad. Lo que SÍ persiste es el último token usado
 * (`lib/tokenHistory.ts`, localStorage aparte).
 *
 * Modelo: `equipped[category]` = lo que hay puesto on-chain (se rellena al
 * abrir un token con `getAppliedTraits`); `selections[category]` = lo que
 * el usuario quiere (ver `lib/changes.ts` para el significado de
 * undefined/null/traitId). `history` es una pila de snapshots de
 * `selections` para el botón deshacer del ActionBar.
 */

import { create } from 'zustand';
import type { CategoryEquipped, CategorySelections } from '../lib/changes';
import { computeChanges } from '../lib/changes';

interface TraitlabState {
  selectedTokenId: string | null;
  equipped: CategoryEquipped;
  selections: CategorySelections;
  history: CategorySelections[];
  /** IDs de trait cuyo `canApplyTraits` ya se comprobó y falló — cacheado por id, ver useAppliedTraits. */
  lockedReasons: Record<string, string>;

  setSelectedToken: (tokenId: string | null) => void;
  setEquipped: (equipped: CategoryEquipped) => void;
  /** Selecciona un trait en su categoría (o lo deselecciona si ya estaba elegido). */
  selectTrait: (category: string, traitId: string) => void;
  /** Marca la quita provisional del trait equipado de una categoría. */
  removeEquipped: (category: string) => void;
  undo: () => void;
  clearSelections: () => void;
  setLockedReason: (traitId: string, reason: string | null) => void;
}

function snapshot(selections: CategorySelections): CategorySelections {
  return { ...selections };
}

export const useTraitlabStore = create<TraitlabState>((set, get) => ({
  selectedTokenId: null,
  equipped: {},
  selections: {},
  history: [],
  lockedReasons: {},

  setSelectedToken: (tokenId) =>
    set({ selectedTokenId: tokenId, equipped: {}, selections: {}, history: [], lockedReasons: {} }),

  setEquipped: (equipped) => set({ equipped }),

  selectTrait: (category, traitId) => {
    const { selections, equipped, history } = get();
    const next = snapshot(selections);
    const current = equipped[category];
    const alreadyChosen = (next[category] ?? current) === traitId;

    if (alreadyChosen) {
      // Repetir tap sobre lo ya elegido = volver a "sin cambio" en esa categoría.
      delete next[category];
    } else {
      next[category] = traitId;
    }

    set({ selections: next, history: [...history, snapshot(selections)] });
  },

  removeEquipped: (category) => {
    const { selections, history } = get();
    const next = snapshot(selections);
    next[category] = next[category] === null ? undefined : null;
    set({ selections: next, history: [...history, snapshot(selections)] });
  },

  undo: () => {
    const { history } = get();
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    set({ selections: previous, history: history.slice(0, -1) });
  },

  clearSelections: () => set({ selections: {}, history: [] }),

  setLockedReason: (traitId, reason) =>
    set((state) => {
      const next = { ...state.lockedReasons };
      if (reason) next[traitId] = reason;
      else delete next[traitId];
      return { lockedReasons: next };
    }),
}));

/** Cambios pendientes derivados (adds/removes/count) — ver `lib/changes.ts`. */
export function selectTraitlabChanges(state: TraitlabState) {
  return computeChanges(state.equipped, state.selections);
}
