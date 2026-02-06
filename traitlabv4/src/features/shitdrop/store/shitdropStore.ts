import { create } from 'zustand';
import type { ShitdropState } from '../types/shitdrop.types';

export const useShitdropStore = create<ShitdropState>((set) => ({
  isActive: false,
  userMinted: 0,
  config: null,
  currentDrop: null,
  previousDrops: [],

  setIsActive: (active) => set({ isActive: active }),
  setUserMinted: (minted) => set({ userMinted: minted }),
  setConfig: (config) => set({ config }),
  setCurrentDrop: (drop) => set({ currentDrop: drop }),
  setPreviousDrops: (drops) => set({ previousDrops: drops }),
}));
