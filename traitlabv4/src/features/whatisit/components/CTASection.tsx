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
    <div className="rounded-lg border border-line bg-panel p-8 text-center">
      <h2 className="mb-4 text-3xl font-bold text-fg">Ready to Dive In?</h2>
      <p className="mb-8 text-mute">
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
                ? 'bg-acc text-acc-fg hover:opacity-90'
                : 'border border-line bg-panel text-fg hover:border-acc'
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
