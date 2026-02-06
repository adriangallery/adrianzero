import { useState, useCallback } from 'react';

interface SelectedTraits {
  [category: string]: string | null;
}

export const useTraitSelection = () => {
  const [selectedTraits, setSelectedTraits] = useState<SelectedTraits>({});

  const selectTrait = useCallback((category: string, traitId: string) => {
    setSelectedTraits((prev) => ({
      ...prev,
      [category]: traitId,
    }));
  }, []);

  const clearTrait = useCallback((category: string) => {
    setSelectedTraits((prev) => {
      const newTraits = { ...prev };
      delete newTraits[category];
      return newTraits;
    });
  }, []);

  const clearAll = useCallback(() => {
    setSelectedTraits({});
  }, []);

  const getSelectedTraitIds = useCallback((): string[] => {
    return Object.values(selectedTraits).filter((id): id is string => id !== null);
  }, [selectedTraits]);

  const buildPreviewUrl = useCallback(
    (baseTokenId: string): string => {
      const traitIds = getSelectedTraitIds();
      if (traitIds.length === 0) {
        return `https://adrianlab.vercel.app/api/render/${baseTokenId}.png`;
      }
      return `https://adrianlab.vercel.app/api/render/custom-external/${baseTokenId}?trait=${traitIds.join(',')}`;
    },
    [getSelectedTraitIds]
  );

  return {
    selectedTraits,
    selectTrait,
    clearTrait,
    clearAll,
    getSelectedTraitIds,
    buildPreviewUrl,
  };
};
