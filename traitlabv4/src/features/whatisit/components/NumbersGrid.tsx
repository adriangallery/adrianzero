/**
 * NumbersGrid Component
 * Stats cards showing ecosystem metrics
 */

import { useDaysBuilding } from '../hooks/useDaysBuilding';

export function NumbersGrid() {
  const days = useDaysBuilding();

  const stats = [
    { label: 'AdrianPunks', value: '1,000', emoji: '👾' },
    { label: 'AdrianZERO', value: '700+', emoji: '🧑' },
    { label: 'Traits Created', value: '1,200+', emoji: '🧬' },
    { label: 'Active Builders', value: '1', emoji: '🔨' },
    { label: '$ADRIAN Supply', value: '333M', emoji: '💰' },
    { label: 'Days Building', value: days.toString(), emoji: '📅' },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="rounded-lg border border-border bg-card p-6 text-center transition-all hover:border-primary hover:shadow-lg"
        >
          <div className="mb-2 text-4xl">{stat.emoji}</div>
          <div className="mb-1 text-3xl font-bold text-[#00ff00]">{stat.value}</div>
          <div className="text-sm text-muted-foreground">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
