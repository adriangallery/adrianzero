// Detects the deep-link civilian-entry flow triggered by BudokaiBOT's
// /budokai-enter slash command. The bot generates a URL like:
//
//   https://adrianzero.com/budokai
//     ?action=enterCivilian
//     &user=<discordUserId>
//     &ref=<guildId>
//     &repChain=ethereum&repContract=0x..&repTokenId=42
//     &repName=Pudgy+Penguin+%231234&repImage=https://...
//
// When this hook returns isActive=true, the SamuraiDojoModule renders
// the CivilianEntryDialog modal pre-populated with the skin metadata.

import {useEffect, useMemo, useState} from 'react';
import {useSearchParams, useNavigate} from 'react-router-dom';

export interface CivilianRepresentation {
    chain: string;
    contract: string;
    tokenId: string;
    name: string;
    imageUrl: string | null;
}

export interface CivilianEntryFlow {
    isActive: boolean;
    discordUserId: string | null;
    guildId: string | null;
    representation: CivilianRepresentation | null;
    /** Clears the URL params and closes the dialog without entering. */
    dismiss: () => void;
}

export function useCivilianEntryFlow(): CivilianEntryFlow {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const [dismissed, setDismissed] = useState(false);

    const data = useMemo(() => {
        if (params.get('action') !== 'enterCivilian') return null;
        const discordUserId = params.get('user');
        const guildId = params.get('ref');
        if (!discordUserId) return null;
        const repContract = params.get('repContract');
        const repTokenId = params.get('repTokenId');
        const representation: CivilianRepresentation | null =
            repContract && repTokenId
                ? {
                      chain: params.get('repChain') ?? 'ethereum',
                      contract: repContract.toLowerCase(),
                      tokenId: repTokenId,
                      name: params.get('repName') ?? `${repContract.slice(0, 6)}…#${repTokenId}`,
                      imageUrl: params.get('repImage'),
                  }
                : null;
        return {discordUserId, guildId, representation};
    }, [params]);

    // Reset dismissed state if the user navigates with new flow params.
    useEffect(() => {
        setDismissed(false);
    }, [data?.discordUserId, data?.guildId, data?.representation?.tokenId]);

    const dismiss = () => {
        setDismissed(true);
        // Strip flow params so refresh doesn't re-trigger the dialog.
        navigate('/budokai', {replace: true});
    };

    if (!data || dismissed) {
        return {
            isActive: false,
            discordUserId: null,
            guildId: null,
            representation: null,
            dismiss,
        };
    }

    return {
        isActive: true,
        discordUserId: data.discordUserId,
        guildId: data.guildId,
        representation: data.representation,
        dismiss,
    };
}
