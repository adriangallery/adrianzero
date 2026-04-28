interface MovieCoverProps {
    /** Static SVG path. Default state on desktop hover-capable devices. */
    stillUrl: string;
    /** Animated GIF path. Default state on touch, hover state on desktop. */
    gifUrl: string;
    /** When false, only render the still — no hover/touch swap. */
    hasAnimation: boolean;
    /** Visible alt + title. */
    alt: string;
    /** Tailwind classes for the outer wrapper (sizing, border, ring). */
    className?: string;
    /** Optional eager-load on the primary view (`above-the-fold` covers). */
    eager?: boolean;
}

/**
 * Cover renderer with a UX rule:
 *   - desktop (mouse): static SVG by default, GIF on hover
 *   - touch (no hover): GIF directly (no hover state to trigger anyway)
 *
 * Implemented by stacking both <img>s and toggling opacity via Tailwind v4
 * variants — `pointer-coarse:` flips opacity for touch, `group-hover:` for
 * desktop hover.
 */
export function MovieCover({stillUrl, gifUrl, hasAnimation, alt, className = '', eager = false}: MovieCoverProps) {
    if (!hasAnimation) {
        return (
            <div className={`relative overflow-hidden ${className}`}>
                <img
                    src={stillUrl}
                    alt={alt}
                    title={alt}
                    className="aspect-square w-full object-contain"
                    style={{imageRendering: 'pixelated'}}
                    loading={eager ? 'eager' : 'lazy'}
                />
            </div>
        );
    }

    // Note: this component is designed to live INSIDE a parent that has the
    // `group` class set, so siblings of MovieCover can also react to hover
    // (e.g. an "Animated · GIF" badge that fades out when the user previews).
    // If MovieCover added its own `group`, parent siblings couldn't use
    // `group-hover:` to react. Internally we use `peer` so the still and GIF
    // sync correctly without depending on the parent.
    return (
        <div className={`relative overflow-hidden ${className}`}>
            {/* Still — visible by default on desktop; hidden on touch and on parent hover */}
            <img
                src={stillUrl}
                alt={alt}
                title={alt}
                aria-hidden="true"
                className="
                    absolute inset-0 aspect-square h-full w-full object-contain
                    transition-opacity duration-150
                    group-hover:opacity-0
                    pointer-coarse:opacity-0
                "
                style={{imageRendering: 'pixelated'}}
                loading={eager ? 'eager' : 'lazy'}
            />
            {/* GIF — hidden by default on desktop; visible on parent hover and on touch */}
            <img
                src={gifUrl}
                alt={alt}
                title={alt}
                className="
                    relative aspect-square w-full object-contain
                    opacity-0 transition-opacity duration-150
                    group-hover:opacity-100
                    pointer-coarse:opacity-100
                "
                style={{imageRendering: 'pixelated'}}
                loading={eager ? 'eager' : 'lazy'}
            />
        </div>
    );
}
