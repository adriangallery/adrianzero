/**
 * QuantitySelector Component
 * Plus/minus buttons for selecting kit quantity
 */

import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  quantity: number;
  min?: number;
  max: number;
  onIncrement: () => void;
  onDecrement: () => void;
  disabled?: boolean;
}

export function QuantitySelector({
  quantity,
  min = 1,
  max,
  onIncrement,
  onDecrement,
  disabled = false,
}: QuantitySelectorProps) {
  const canDecrement = quantity > min && !disabled;
  const canIncrement = quantity < max && !disabled;

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={onDecrement}
        disabled={!canDecrement}
        className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-accent/30 bg-accent/10 text-accent transition-all hover:border-accent/50 hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Decrease quantity"
      >
        <Minus className="h-5 w-5" />
      </button>

      <div className="min-w-[60px] rounded-lg border-2 border-accent/30 bg-accent/10 px-4 py-2 text-center text-2xl font-bold text-accent">
        {quantity}
      </div>

      <button
        onClick={onIncrement}
        disabled={!canIncrement}
        className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-accent/30 bg-accent/10 text-accent transition-all hover:border-accent/50 hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Increase quantity"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}
