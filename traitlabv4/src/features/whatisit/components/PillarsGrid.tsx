/**
 * PillarsGrid Component
 * 4 pillar cards with smooth scroll navigation
 */

const pillars = [
  {
    emoji: '💰',
    title: '$ADRIAN',
    subtitle: 'The Fuel',
    anchor: '#section-adrian',
    description: 'Powers everything in the ecosystem',
  },
  {
    emoji: '👾',
    title: 'AdrianPunks',
    subtitle: 'OG Roots',
    anchor: '#section-punks',
    description: 'Where it all started',
  },
  {
    emoji: '🧑',
    title: 'AdrianZERO',
    subtitle: 'Living Avatars',
    anchor: '#section-zero',
    description: 'Your customizable NFT identity',
  },
  {
    emoji: '🧪',
    title: 'AdrianLAB',
    subtitle: 'The Machine',
    anchor: '#section-lab',
    description: 'Tools, traits, and experiments',
  },
];

export function PillarsGrid() {
  const handleClick = (anchor: string) => {
    const element = document.querySelector(anchor);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {pillars.map((pillar) => (
        <button
          key={pillar.anchor}
          onClick={() => handleClick(pillar.anchor)}
          className="group rounded-lg border border-border bg-card p-6 text-left transition-all hover:scale-105 hover:border-primary hover:shadow-lg hover:shadow-primary/20"
        >
          <div className="mb-3 text-4xl">{pillar.emoji}</div>
          <h3 className="mb-1 text-xl font-bold text-foreground">{pillar.title}</h3>
          <p className="mb-2 text-sm text-primary">{pillar.subtitle}</p>
          <p className="text-sm text-muted-foreground">{pillar.description}</p>
        </button>
      ))}
    </div>
  );
}
