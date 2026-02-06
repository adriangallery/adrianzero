import { CurrentDrop } from './CurrentDrop';
import { PreviousDrops } from './PreviousDrops';

export function ShitdropModule() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-12">
        {/* Current Drop */}
        <CurrentDrop />

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Previous Drops */}
        <PreviousDrops />
      </div>
    </div>
  );
}
