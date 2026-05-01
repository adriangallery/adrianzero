/**
 * T-Shit Studio root.
 * Mobile (<lg): canvas-hero + sticky bottom toolbar + bottom sheets for pickers.
 * Desktop (lg+): single Photoshop-style workspace panel — vertical icon
 *   toolbar on the left, canvas centered, properties (colors / text / stickers
 *   / mint) docked on the right.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { useAccount } from 'wagmi';
import { Shirt } from 'lucide-react';
import { Canvas } from './Canvas';
import { Toolbar } from './Toolbar';
import { ColorPalette } from './ColorPalette';
import { TextTool } from './TextTool';
import { StickerLibrary } from './StickerLibrary';
import { MintFlow } from './MintFlow';
import { MintBar } from './MintBar';
import { PendingStampControls } from './PendingStampControls';
import { TshirtColorPicker } from './TshirtColorPicker';
import { MobileToolbar, type MobileSheet } from './MobileToolbar';
import { BottomSheet } from './BottomSheet';
import { useDraftAutosave, loadDraft } from '../hooks/useDraftAutosave';
import { useTShitStore } from '../store/tshitStore';

export function TShitStudioModule() {
  const { isConnected } = useAccount();
  const loadFromPixels = useTShitStore(s => s.loadFromPixels);
  const pendingStamp = useTShitStore(s => s.pendingStamp);
  const [activeSheet, setActiveSheet] = useState<MobileSheet>(null);
  useDraftAutosave();

  // Restore last draft on mount, once
  useEffect(() => {
    const draft = loadDraft();
    if (draft && draft.pixels.length > 0) {
      loadFromPixels(draft.pixels);
    }
  }, [loadFromPixels]);

  return (
    <div className="mx-auto max-w-7xl px-2 py-3 lg:px-4 lg:py-6 space-y-4">
      <header className="px-1 lg:px-0">
        <div className="flex items-center gap-2">
          <Shirt className="h-5 w-5 lg:h-6 lg:w-6 text-emerald-400" />
          <h1 className="text-lg lg:text-3xl font-bold text-white">T-Shit Studio</h1>
        </div>
      </header>

      {/* ============== DESKTOP WORKSPACE ============== */}
      <div
        className="hidden lg:flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/60 overflow-hidden shadow-lg shadow-black/30"
        style={{ height: 'min(820px, calc(100vh - 180px))', minHeight: 680 }}
      >
        {/* Top row: tools | canvas | properties */}
        <div className="flex flex-1 min-h-0">
          {/* Left: vertical icon toolbar */}
          <div className="w-16 shrink-0 border-r border-zinc-800 bg-zinc-900/50">
            <Toolbar />
          </div>

          {/* Center: canvas workspace (darker neutral background, like Photoshop) */}
          <div className="relative flex-1 flex items-center justify-center bg-zinc-950 p-6 overflow-auto">
            <Canvas pixelSize={4} />
            {/* Pending stamp controls float over the canvas — they're contextual
                to a placed sticker/text and shouldn't push the right panel around. */}
            {pendingStamp && (
              <div className="absolute top-4 right-4 w-[280px]">
                <div className="rounded-lg border border-emerald-500/40 bg-zinc-950/95 p-3 shadow-xl backdrop-blur">
                  <PendingStampControls />
                </div>
              </div>
            )}
          </div>

          {/* Right: properties panel */}
          <aside className="w-[340px] shrink-0 border-l border-zinc-800 bg-zinc-900/50 overflow-y-auto">
            <PropertiesPanel />
          </aside>
        </div>

        {/* Bottom: persistent mint bar (always visible, spans full workspace) */}
        <MintBar isConnected={isConnected} />
      </div>

      {/* Description sits below the workspace as a small caption */}
      <p className="hidden lg:block text-xs text-zinc-500 px-1">
        Design a 1/1 pixel-art T-shirt trait. 1000 $ZERO per mint, fully burned.
        Each design lives forever on the AdrianTraitsCore ERC1155.
      </p>

      {/* ============== MOBILE LAYOUT ============== */}
      <div className="lg:hidden">
        <Canvas pixelSize={4} />
      </div>

      {/* Mobile: floating pending-stamp panel (sits above the toolbar) */}
      {pendingStamp && (
        <div
          className="fixed inset-x-2 z-30 lg:hidden"
          style={{ bottom: 'calc(120px + env(safe-area-inset-bottom, 0px))' }}
        >
          <PendingStampControls variant="mobile" />
        </div>
      )}

      {/* Mobile: sticky bottom toolbar */}
      <MobileToolbar
        onOpenSheet={setActiveSheet}
        isConnected={isConnected}
      />

      {/* Mobile: sheets */}
      <BottomSheet
        open={activeSheet === 'color'}
        onOpenChange={open => setActiveSheet(open ? 'color' : null)}
        title="Color"
      >
        <ColorPalette />
      </BottomSheet>

      <BottomSheet
        open={activeSheet === 'stickers'}
        onOpenChange={open => setActiveSheet(open ? 'stickers' : null)}
        title="Stickers & Text"
      >
        <div className="space-y-5">
          <TextTool />
          <hr className="border-zinc-800" />
          <StickerLibrary />
        </div>
      </BottomSheet>

      <BottomSheet
        open={activeSheet === 'tshirt'}
        onOpenChange={open => setActiveSheet(open ? 'tshirt' : null)}
        title="T-shirt color"
      >
        <TshirtColorPicker />
      </BottomSheet>

      <BottomSheet
        open={activeSheet === 'mint'}
        onOpenChange={open => setActiveSheet(open ? 'mint' : null)}
        title="Mint"
        maxHeight="85vh"
      >
        {isConnected ? (
          <MintFlow />
        ) : (
          <div className="rounded border border-zinc-800 py-3 text-center text-sm text-zinc-400">
            Connect a wallet to mint your design.
          </div>
        )}
      </BottomSheet>

      {/* Spacer so the canvas/aside don't sit under the fixed mobile toolbar */}
      <div className="h-[110px] lg:hidden" aria-hidden />
    </div>
  );
}

/**
 * Right-hand properties panel — each section is its own card so the panel
 * reads as a stack of related-but-distinct controls instead of one long list.
 * Mint lives in the persistent footer bar, not here.
 */
function PropertiesPanel() {
  return (
    <div className="divide-y divide-zinc-800">
      <Section title="T-shirt color">
        <TshirtColorPicker />
      </Section>
      <Section title="Brush color">
        <ColorPalette />
      </Section>
      <Section title="Text & year">
        <TextTool />
      </Section>
      <Section title="Stickers">
        <StickerLibrary />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="p-4">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 mb-2.5">
        {title}
      </h2>
      {children}
    </section>
  );
}
