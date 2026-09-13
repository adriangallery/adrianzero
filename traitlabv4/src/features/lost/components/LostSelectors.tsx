/**
 * LostSelectors Component
 * Weeks slider and year buttons for filtering events
 */

import { useLostStore } from '../store/lostStore';
import { useEventFiltering } from '../hooks/useEventFiltering';
import styles from './LostSelectors.module.css';

export function LostSelectors() {
  const { selectedWeeks, selectedYear, setSelectedWeeks, setSelectedYear } = useLostStore();
  const { events } = useEventFiltering();

  return (
    <div className="mb-8 space-y-6">
      {/* Weeks Slider */}
      <div className="rounded-lg border border-line bg-panel p-6">
        <div className="mb-4 flex items-center justify-between">
          <label className="text-sm font-medium text-fg">
            Last {selectedWeeks} week{selectedWeeks > 1 ? 's' : ''}
          </label>
          <span className="text-sm text-mute">{events.length} events</span>
        </div>
        <input
          type="range"
          min="1"
          max="52"
          value={selectedWeeks}
          onChange={(e) => setSelectedWeeks(Number(e.target.value))}
          className={styles.slider}
          disabled={selectedYear !== null}
        />
        <div className="mt-2 flex justify-between text-xs text-mute">
          <span>1 week</span>
          <span>52 weeks</span>
        </div>
      </div>

      {/* Year Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setSelectedYear('2025')}
          className={`rounded-lg border px-6 py-3 font-medium transition-all ${
            selectedYear === '2025'
              ? 'border-acc bg-acc text-acc-fg'
              : 'border-line bg-panel text-fg hover:border-acc'
          }`}
        >
          2025
        </button>
        <button
          onClick={() => setSelectedYear('2026')}
          className={`rounded-lg border px-6 py-3 font-medium transition-all ${
            selectedYear === '2026'
              ? 'border-acc bg-acc text-acc-fg'
              : 'border-line bg-panel text-fg hover:border-acc'
          }`}
        >
          2026
        </button>
        <button
          onClick={() => setSelectedYear('all')}
          className={`rounded-lg border px-6 py-3 font-medium transition-all ${
            selectedYear === 'all'
              ? 'border-acc bg-acc text-acc-fg'
              : 'border-line bg-panel text-fg hover:border-acc'
          }`}
        >
          All Years
        </button>
        {selectedYear && (
          <button
            onClick={() => setSelectedYear(null)}
            className="rounded-lg border border-line bg-panel px-6 py-3 font-medium text-fg transition-all hover:border-bad hover:text-bad"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
