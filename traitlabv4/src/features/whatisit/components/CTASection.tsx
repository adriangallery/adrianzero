/**
 * CTASection Component
 * Call-to-action buttons and links
 */

import { ExternalLink } from 'lucide-react';

const ctaButtons = [
  {
    label: 'Join Discord',
    url: 'https://discord.gg/adrianzero',
    primary: true,
  },
  {
    label: 'Buy $ZERO',
    url: '/buy',
    primary: true,
  },
  {
    label: 'Visit TraitLAB',
    url: '/mynfts',
    primary: false,
  },
  {
    label: 'Explore Timeline',
    url: '/timeline',
    primary: false,
  },
];

export function CTASection() {
  return (
    <div className="rounded-lg border border-border bg-card p-8 text-center">
      <h2 className="mb-4 text-3xl font-bold text-foreground">Ready to Dive In?</h2>
      <p className="mb-8 text-muted-foreground">
        Join the ecosystem and start building your AdrianZERO
      </p>

      <div className="flex flex-wrap justify-center gap-4">
        {ctaButtons.map((button, index) => (
          <a
            key={index}
            href={button.url}
            target={button.url.startsWith('http') ? '_blank' : undefined}
            rel={button.url.startsWith('http') ? 'noopener noreferrer' : undefined}
            className={`inline-flex items-center gap-2 rounded-lg px-6 py-3 font-bold transition-all ${
              button.primary
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'border border-border bg-card text-foreground hover:border-primary'
            }`}
          >
            {button.label}
            {button.url.startsWith('http') && <ExternalLink className="h-4 w-4" />}
          </a>
        ))}
      </div>
    </div>
  );
}
