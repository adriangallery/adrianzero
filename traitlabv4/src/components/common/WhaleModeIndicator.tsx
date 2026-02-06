/**
 * WhaleModeIndicator Component
 * Banner that appears when whale mode is available but not enabled
 * Informs users about performance optimizations for large collections
 */

import { AlertCircle, Zap, X } from 'lucide-react';
import { useState } from 'react';

interface WhaleModeIndicatorProps {
  isWhale: boolean;
  whaleModeEnabled: boolean;
  itemCount: number;
  onToggle: () => void;
  className?: string;
}

export function WhaleModeIndicator({
  isWhale,
  whaleModeEnabled,
  itemCount,
  onToggle,
  className = '',
}: WhaleModeIndicatorProps) {
  const [dismissed, setDismissed] = useState(false);

  // Only show if whale mode is available but not enabled
  if (!isWhale || whaleModeEnabled || dismissed) {
    return null;
  }

  return (
    <div
      className={`relative bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg p-4 ${className}`}
    >
      {/* Dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 pr-8">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <AlertCircle className="h-5 w-5 text-amber-500" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            Large Collection Detected
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            You have <strong>{itemCount} items</strong>. Enable Whale Mode for better performance
            on mobile devices - includes virtualization, progressive loading, and reduced animations.
          </p>

          {/* Action button */}
          <button
            onClick={onToggle}
            className="mt-3 px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors text-sm font-medium inline-flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            Enable Whale Mode
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact version for in-page notifications
 */
export function WhaleModeToggle({
  whaleModeEnabled,
  onToggle,
  className = '',
}: {
  whaleModeEnabled: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
        whaleModeEnabled
          ? 'bg-amber-500/20 text-amber-600 hover:bg-amber-500/30'
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
      } ${className}`}
    >
      <Zap className={`h-4 w-4 ${whaleModeEnabled ? 'text-amber-500' : ''}`} />
      <span className="font-medium">
        {whaleModeEnabled ? 'Whale Mode ON' : 'Whale Mode OFF'}
      </span>
    </button>
  );
}
