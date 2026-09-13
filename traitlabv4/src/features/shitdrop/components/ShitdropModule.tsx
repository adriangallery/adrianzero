import { CurrentDrop } from './CurrentDrop';
import { PreviousDrops } from './PreviousDrops';

export function ShitdropModule() {
  return (
    <div className="min-h-[60dvh] bg-bg p-6">
      <div className="mx-auto max-w-7xl space-y-12">
        {/* Current Drop */}
        <CurrentDrop />

        {/* Divider */}
        <div className="border-t border-line" />

        {/* Previous Drops */}
        <PreviousDrops />
      </div>
    </div>
  );
}
