import { CurrentDrop } from './CurrentDrop';
import { PreviousDrops } from './PreviousDrops';

export function ShitdropModule() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="font-adrian text-5xl font-bold text-foreground sm:text-6xl">
            Shit<span className="text-accent">DROP</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Free weekly drops on Base. Unique traits and packs for your AdrianZERO.
          </p>
        </div>

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
