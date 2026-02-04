/**
 * Onboarding Store
 * Manages quantity and UI state for kit selection
 */

import { create } from 'zustand';

interface OnboardingState {
  paidQuantity: number;
  selectedKit: 'free' | 'paid' | null;
  showSuccessModal: boolean;
  lastMintedKit: 'free' | 'paid' | null;
  lastMintedQuantity: number;

  // Actions
  setPaidQuantity: (quantity: number) => void;
  incrementPaidQuantity: (max: number) => void;
  decrementPaidQuantity: () => void;
  setSelectedKit: (kit: 'free' | 'paid' | null) => void;
  openSuccessModal: (kit: 'free' | 'paid', quantity: number) => void;
  closeSuccessModal: () => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  paidQuantity: 1,
  selectedKit: null,
  showSuccessModal: false,
  lastMintedKit: null,
  lastMintedQuantity: 1,

  setPaidQuantity: (quantity) =>
    set({ paidQuantity: Math.max(1, quantity) }),

  incrementPaidQuantity: (max) =>
    set((state) => ({
      paidQuantity: Math.min(state.paidQuantity + 1, max),
    })),

  decrementPaidQuantity: () =>
    set((state) => ({
      paidQuantity: Math.max(1, state.paidQuantity - 1),
    })),

  setSelectedKit: (kit) => set({ selectedKit: kit }),

  openSuccessModal: (kit, quantity) =>
    set({
      showSuccessModal: true,
      lastMintedKit: kit,
      lastMintedQuantity: quantity,
    }),

  closeSuccessModal: () =>
    set({
      showSuccessModal: false,
    }),

  reset: () =>
    set({
      paidQuantity: 1,
      selectedKit: null,
      showSuccessModal: false,
      lastMintedKit: null,
      lastMintedQuantity: 1,
    }),
}));
