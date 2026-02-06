import { usePreviousDrops } from '../hooks/useDropsData';
import { DropCard } from './DropCard';

export function PreviousDrops() {
  const { previousDrops } = usePreviousDrops();

  if (previousDrops.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📦</div>
        <div className="text-muted-foreground">No previous drops yet</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Previous Drops</h2>
        <p className="text-muted-foreground">
          Check out our past drops — some may still be available on OpenSea
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {previousDrops.map((drop) => (
          <DropCard key={drop.id} drop={drop} />
        ))}
      </div>
    </div>
  );
}
