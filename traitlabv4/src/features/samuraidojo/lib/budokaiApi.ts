// Thin client for the zerobot BUDOKAI public API. CORS-permissive on the
// backend (no cookies needed); we identify the user by their linked
// Discord ID + the zerobot wallet-link table.
//
// Public-API base: configurable via VITE_BUDOKAI_API_URL, defaults to
// the production zerobot instance on Railway.

const BASE_URL =
    import.meta.env.VITE_BUDOKAI_API_URL ?? 'https://zerobot-production.up.railway.app';

export interface CreateIntentRequest {
    discordUserId: string;
    guildId: string;
    representation: {
        chain: string;
        contract: string;
        tokenId: string;
        name: string;
        imageUrl: string | null;
    } | null;
}

export interface CreateIntentResponse {
    intentId: number;
    budokaiId: string;
    wallet: string;
}

export interface PrefillResponse {
    intentId: number;
    budokaiId: string;
    wallet: string;
    status: 'pending' | 'entered' | 'expired';
    representation:
        | {kind: 'anonymous'}
        | {
              kind: 'nft';
              chain: string | null;
              contract: string | null;
              tokenId: string | null;
              name: string | null;
              imageUrl: string | null;
          };
}

async function jsonFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        ...init,
        headers: {'content-type': 'application/json', ...(init.headers ?? {})},
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`${res.status} ${text || res.statusText}`);
    }
    return (await res.json()) as T;
}

/**
 * Create (or upsert by UNIQUE(budokaiId, wallet)) the civilian-entry
 * intent. Returns the intent id + the wallet linked to that Discord
 * user — the frontend uses the wallet to verify the connected account
 * matches before showing the tx UI.
 */
export async function createCivilianIntent(
    body: CreateIntentRequest,
): Promise<{ok: true} & CreateIntentResponse> {
    return jsonFetch<{ok: true} & CreateIntentResponse>('/api/budokai/civil-intent', {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

/**
 * Look up the prefill data for an existing intent. Used after navigating
 * back to the page (e.g. user closed and reopened the link) so we don't
 * have to recreate the intent.
 */
export async function fetchPrefill(intentId: number): Promise<{ok: true} & PrefillResponse> {
    return jsonFetch<{ok: true} & PrefillResponse>(
        `/api/budokai/enter-prefill?intent=${intentId}`,
    );
}

/**
 * Acknowledge a tx hash for an intent. Best-effort — the on-chain
 * watcher promotes the intent independently when CivilianEntered fires
 * for the wallet, so this endpoint is purely cosmetic ("tx submitted,
 * waiting for confirmation").
 */
export async function confirmIntent(
    intentId: number,
    txHash: string,
    wallet: string,
): Promise<{ok: true}> {
    return jsonFetch<{ok: true}>(`/api/budokai/civil-intent/${intentId}/confirm`, {
        method: 'POST',
        body: JSON.stringify({txHash, wallet}),
    });
}
