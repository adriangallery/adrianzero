import {useEffect, useState} from 'react';
import {fetchSkinsForWallet, type PartnerSkin} from '../lib/budokaiApi';

interface State {
    skins: PartnerSkin[];
    loading: boolean;
    error: string | null;
    discord: {userId: string; username: string} | null;
}

/**
 * Lists the partner-collection NFTs owned by the connected wallet,
 * pulled from every guild's registered collections (currently Eth
 * mainnet only). Used by the dojo page to show "Doodle #X / Pudgy #Y"
 * cards alongside the user's AdrianZERO roster — civilian skin entry
 * for users who don't (yet) own a $ZERO NFT.
 */
export function usePartnerSkins(wallet: string | undefined): State {
    const [state, setState] = useState<State>({
        skins: [],
        loading: false,
        error: null,
        discord: null,
    });

    useEffect(() => {
        if (!wallet) {
            setState({skins: [], loading: false, error: null, discord: null});
            return;
        }
        let cancelled = false;
        setState((s) => ({...s, loading: true, error: null}));
        fetchSkinsForWallet(wallet)
            .then((res) => {
                if (cancelled) return;
                setState({
                    skins: res.skins,
                    loading: false,
                    error: null,
                    discord: res.discord,
                });
            })
            .catch((err) => {
                if (cancelled) return;
                setState((s) => ({
                    ...s,
                    loading: false,
                    error: err instanceof Error ? err.message : String(err),
                }));
            });
        return () => {
            cancelled = true;
        };
    }, [wallet]);

    return state;
}
