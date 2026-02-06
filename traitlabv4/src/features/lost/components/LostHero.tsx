/**
 * LostHero Component
 * Hero section with logo and subtitle
 */

export function LostHero() {
  return (
    <div className="mb-8 text-center">
      <h1 className="mb-4 text-5xl font-bold text-foreground">
        <span className="bg-gradient-to-r from-cyan-500 to-green-500 bg-clip-text text-transparent">
          LOST
        </span>
      </h1>
      <p className="text-lg text-muted-foreground">
        Timeline of $ADRIAN ecosystem updates and events
      </p>
    </div>
  );
}
