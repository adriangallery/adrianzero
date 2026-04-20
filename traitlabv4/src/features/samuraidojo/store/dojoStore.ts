import {create} from 'zustand';

type ActionKind = 'enter' | 'revive' | null;

interface DojoState {
    selectedTokenId: number | null;
    isDetailOpen: boolean;
    isBracketOpen: boolean;
    bracketBudokaiId: number | null;
    successAction: ActionKind;
    successTokenId: number | null;
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
    selectSamurai: (tokenId) => set({selectedTokenId: tokenId, isDetailOpen: true}),
    closeDetail: () => set({isDetailOpen: false}),
    openBracket: (budokaiId) => set({isBracketOpen: true, bracketBudokaiId: budokaiId}),
    closeBracket: () => set({isBracketOpen: false}),
    showSuccess: (kind, tokenId) => set({successAction: kind, successTokenId: tokenId, isDetailOpen: false}),
    clearSuccess: () => set({successAction: null, successTokenId: null}),
}));
