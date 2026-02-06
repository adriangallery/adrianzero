/**
 * Zustand store for LOST timeline state
 */

import { create } from 'zustand';
import type { YearOption } from '../types/lost.types';

interface LostStore {
  selectedWeeks: number;
  selectedYear: YearOption;
  setSelectedWeeks: (weeks: number) => void;
  setSelectedYear: (year: YearOption) => void;
}

export const useLostStore = create<LostStore>((set) => ({
  selectedWeeks: 4,
  selectedYear: null,
  setSelectedWeeks: (weeks) => set({ selectedWeeks: weeks, selectedYear: null }),
  setSelectedYear: (year) => set({ selectedYear: year }),
}));
