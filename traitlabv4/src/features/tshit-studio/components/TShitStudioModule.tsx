/**
 * T-Shit Studio root.
 * Mobile-first layout — canvas on top, tools below. Desktop side-by-side.
 */
import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Shirt } from 'lucide-react';
import { Canvas } from './Canvas';
import { Toolbar } from './Toolbar';
import { ColorPalette } from './ColorPalette';
import { TextTool } from './TextTool';
import { YearTool } from './YearTool';
import { StickerLibrary } from './StickerLibrary';
import { MintFlow } from './MintFlow';
import { useDraftAutosave, loadDraft } from '../hooks/useDraftAutosave';
import { useTShitStore } from '../store/tshitStore';

export function TShitStudioModule() {
  const { isConnected } = useAccount();
  const loadFromPixels = useTShitStore(s => s.loadFromPixels);
  useDraftAutosave();

  // Restore last draft on mount, once
  useEffect(() => {
    const draft = loadDraft();
    if (draft && draft.pixels.length > 0) {
      loadFromPixels(draft.pixels);
    }
  }, [loadFromPixels]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Shirt className="w-6 h-6 text-emerald-400" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">T-Shit Studio</h1>
        </div>
        <p className="text-sm text-zinc-400">
          Design a 1/1 pixel-art T-shirt trait. 1000 $ZERO per mint, fully burned.
          Each design lives forever on the AdrianTraitsCore ERC1155.
        </p>
      </header>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
        <div className="space-y-4">
          <Canvas pixelSize={4} />
          <Toolbar />
        </div>

        <aside className="space-y-5 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
          <ColorPalette />
          <hr className="border-zinc-800" />
          <TextTool />
          <hr className="border-zinc-800" />
          <YearTool />
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
    </div>
  );
}
