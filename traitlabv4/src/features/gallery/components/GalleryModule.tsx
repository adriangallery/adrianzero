import { GalleryGrid } from './GalleryGrid';
import { GalleryModal } from './GalleryModal';
import { useGalleryNFTs } from '../hooks/useGalleryNFTs';

export function GalleryModule() {

  const { data: nfts, isLoading, isError, error, refetch } = useGalleryNFTs();

  // Loading state with shimmer skeleton
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-green-400 border-t-transparent mx-auto" />
          <div className="text-xl font-semibold text-foreground">Loading Gallery...</div>
          <div className="mt-2 text-sm text-muted-foreground">
            Fetching AdrianZERO NFTs
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="max-w-md text-center">
          <div className="text-6xl">⚠️</div>
          <div className="mt-4 text-xl font-semibold text-foreground">
            Failed to Load Gallery
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'An unknown error occurred'}
          </div>
          <button
            onClick={() => refetch()}
            className="mt-6 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!nfts || nfts.length === 0) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-6xl">🎨</div>
          <div className="mt-4 text-xl font-semibold text-foreground">No NFTs Found</div>
          <div className="mt-2 text-sm text-muted-foreground">
            The gallery is currently empty
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-module relative h-screen w-full overflow-hidden bg-background">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gallery</h1>
            <p className="text-sm text-muted-foreground">
              {nfts.length} AdrianZERO NFT{nfts.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Optional: Add filters/controls here */}
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="h-full pt-20">
        <GalleryGrid nfts={nfts} />
      </div>

      {/* Modal */}
      <GalleryModal />
    </div>
  );
}
