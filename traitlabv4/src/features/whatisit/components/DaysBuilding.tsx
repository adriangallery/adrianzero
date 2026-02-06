/**
 * DaysBuilding Component
 * Displays dynamic counter of days since project start
 */

import { useDaysBuilding } from '../hooks/useDaysBuilding';

export function DaysBuilding() {
  const days = useDaysBuilding();

  return (
    <p className="text-lg text-muted-foreground">
      <strong className="text-2xl text-[#00ff00]">{days} days</strong> building $ADRIAN
    </p>
  );
}
