import {create} from 'zustand';

type ActionKind = 'enter' | 'revive' | 'batch' | null;

interface DojoState {
    selectedTokenId: number | null;
    isDetailOpen: boolean;
    isBracketOpen: boolean;
    bracketBudokaiId: number | null;
    successAction: ActionKind;
    successTokenId: number | null;
    // Multi-select mode
    multiSelectMode: boolean;
    selectedIds: Set<number>;
    toggleMultiSelectMode: () => void;
    toggleId: (tokenId: number) => void;
    clearSelection: () => void;
    selectMany: (tokenIds: number[], enableMultiSelect?: boolean) => void;
    selectSamurai: (tokenId: number) => void;
    closeDetail: () => void;
    openBracket: (budokaiId: number) => void;
    closeBracket: () => void;
    showSuccess: (kind: ActionKind, tokenId: number) => void;
    clearSuccess: () => void;
}

export const useDojoStore = create<DojoState>((set) => ({
    selectedTokenId: null,
    isDetailOpen: false,
    isBracketOpen: false,
    bracketBudokaiId: null,
    successAction: null,
    successTokenId: null,
    multiSelectMode: false,
    selectedIds: new Set<number>(),
    toggleMultiSelectMode: () =>
        set((state) => ({
            multiSelectMode: !state.multiSelectMode,
            selectedIds: new Set<number>(), // reset on toggle
        })),
    toggleId: (tokenId) =>
        set((state) => {
            const next = new Set(state.selectedIds);
            if (next.has(tokenId)) next.delete(tokenId);
            else next.add(tokenId);
            return {selectedIds: next};
        }),
    clearSelection: () => set({selectedIds: new Set<number>()}),
    selectMany: (tokenIds, enableMultiSelect = true) =>
        set(() => ({
            multiSelectMode: enableMultiSelect,
            selectedIds: new Set<number>(tokenIds),
        })),
    selectSamurai: (tokenId) => set({selectedTokenId: tokenId, isDetailOpen: true}),
    closeDetail: () => set({isDetailOpen: false}),
    openBracket: (budokaiId) => set({isBracketOpen: true, bracketBudokaiId: budokaiId}),
    closeBracket: () => set({isBracketOpen: false}),
    showSuccess: (kind, tokenId) => set({successAction: kind, successTokenId: tokenId, isDetailOpen: false}),
    clearSuccess: () => set({successAction: null, successTokenId: null}),
}));
