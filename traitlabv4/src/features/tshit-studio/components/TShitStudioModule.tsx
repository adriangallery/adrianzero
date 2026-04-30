/**
 * T-Shit Studio root.
 * Mobile (<lg): canvas-hero + sticky bottom toolbar + bottom sheets for pickers.
 * Desktop (lg+): canvas + tools left, sidebar right (unchanged).
 */
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Shirt } from 'lucide-react';
import { Canvas } from './Canvas';
import { Toolbar } from './Toolbar';
import { ColorPalette } from './ColorPalette';
import { TextTool } from './TextTool';
import { StickerLibrary } from './StickerLibrary';
import { MintFlow } from './MintFlow';
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
    <div className="mx-auto max-w-6xl px-2 py-3 lg:px-4 lg:py-6 lg:space-y-6">
      <header className="space-y-1 px-1 lg:px-0 mb-3 lg:mb-0">
        <div className="flex items-center gap-2">
          <Shirt className="h-5 w-5 lg:h-6 lg:w-6 text-emerald-400" />
          <h1 className="text-lg lg:text-3xl font-bold text-white">T-Shit Studio</h1>
        </div>
        <p className="hidden lg:block text-sm text-zinc-400">
          Design a 1/1 pixel-art T-shirt trait. 1000 $ZERO per mint, fully burned.
          Each design lives forever on the AdrianTraitsCore ERC1155.
        </p>
      </header>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6">
        <div className="space-y-3 lg:space-y-4">
          <Canvas pixelSize={4} />
          {/* Desktop-only inline toolbar — mobile uses the sticky MobileToolbar */}
          <div className="hidden lg:block">
            <Toolbar />
          </div>
        </div>

        <aside className="hidden lg:block space-y-5 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
          <PendingStampControls />
          <TshirtColorPicker />
          <hr className="border-zinc-800" />
          <ColorPalette />
          <hr className="border-zinc-800" />
          <TextTool />
          <hr className="border-zinc-800" />
          <StickerLibrary />
          <hr className="border-zinc-800" />
          {isConnected ? (
            <MintFlow />
          ) : (
            <div className="text-sm text-zinc-400 text-center py-3 border border-zinc-800 rounded">
              Connect a wallet to mint your design.
            </div>
          )}
        </aside>
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
