import {useEffect, useState} from 'react';

const BASE_URL =
    import.meta.env.VITE_BUDOKAI_API_URL ?? 'https://zerobot.zerothetoken.com';

interface Sponsor {
    budgetId?: string;
    wallet: string | null;
    display_name: string;
    logo_url: string | null;
    link_url: string | null;
    tagline: string | null;
}

/**
 * Sponsored Budokai hero banner. Renders above the LiveStrip when the
 * current Budokai has a sponsor recorded — cross-community ad slot for
 * whoever paid the seed pool. Self-hides when there's no sponsor or the
 * fetch fails (it's purely additive, never blocking).
 */
export function SponsorBanner({budokaiId}: {budokaiId: number | null}) {
    const [sponsor, setSponsor] = useState<Sponsor | null>(null);

    useEffect(() => {
        if (budokaiId === null || budokaiId === undefined) {
            setSponsor(null);
            return;
        }
        let cancelled = false;
        fetch(`${BASE_URL}/api/budokai/sponsor/${budokaiId}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((j) => {
                if (cancelled) return;
                setSponsor(j?.sponsor ?? null);
            })
            .catch(() => {
                if (cancelled) return;
                setSponsor(null);
            });
        return () => {
            cancelled = true;
        };
    }, [budokaiId]);

    if (!sponsor) return null;

    const inner = (
        <div className="flex items-center gap-3 px-4 py-3">
            {sponsor.logo_url ? (
                <img
                    src={sponsor.logo_url}
                    alt={sponsor.display_name}
                    className="h-10 w-10 rounded border border-cyan-500/40 object-cover"
                />
            ) : (
                <div className="grid h-10 w-10 place-items-center rounded border border-cyan-500/40 bg-cyan-500/10 text-base">
                    🤝
                </div>
            )}
            <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-cyan-400">
                    Sponsored by
                </p>
                <p className="truncate text-base font-bold text-cyan-100">
                    {sponsor.display_name}
                </p>
                {sponsor.tagline && (
                    <p className="truncate text-xs text-cyan-200/70">
                        {sponsor.tagline}
                    </p>
                )}
            </div>
            {sponsor.link_url && (
                <span className="hidden rounded border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300 sm:inline-block">
                    Visit →
                </span>
            )}
        </div>
    );

    const cls =
        'block rounded border border-cyan-500/40 bg-gradient-to-r from-cyan-950/40 via-cyan-950/20 to-transparent shadow-[0_0_24px_rgba(34,211,238,0.10)] transition-colors hover:from-cyan-950/60 hover:to-cyan-900/20';

    return sponsor.link_url ? (
        <a href={sponsor.link_url} target="_blank" rel="noreferrer" className={cls}>
            {inner}
        </a>
    ) : (
        <div className={cls}>{inner}</div>
    );
}
