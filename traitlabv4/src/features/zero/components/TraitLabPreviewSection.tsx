/**
 * TraitLabPreviewSection Component
 * Demo mode preview for TraitLAB customization
 * Extracted from ZeroModule for better code organization
 */

import { useEffect, useMemo, useState, memo } from 'react';
import { useAccount } from 'wagmi';
import { getGitHubImageUrl } from '@/config/images';
import { useHasAdrianZero } from '@/features/onboarding/hooks/useHasAdrianZero';
import { vercelImageService } from '@/lib/api/vercel/imageService';

const LIME = '#00ff00';
const DEMO_TOKEN_ID = '146';
const DEMO_TRAIT_IDS = ['444', '700', '83', '7', '1007', '754', '852', '33', '420', '456', '460', '550'];

interface DemoTrait {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
}

interface DemoTraitCategory {
  name: string;
  traits: DemoTrait[];
}

export const TraitLabPreviewSection = memo(function TraitLabPreviewSection() {
  const { isConnected } = useAccount();
  const { hasAdrianZero } = useHasAdrianZero();
  const [categories, setCategories] = useState<DemoTraitCategory[]>([]);
  const [activeCategoryName, setActiveCategoryName] = useState('');
  const [activeTraitByCategory, setActiveTraitByCategory] = useState<Record<string, number>>({});
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const shouldShowPreview = !isConnected || !hasAdrianZero;

  useEffect(() => {
    const loadDemoTraits = async () => {
      try {
        const response = await fetch('/data/traits.json');
        const payload = await response.json();
        const traits = Array.isArray(payload?.traits) ? payload.traits : [];

        const selectedTraits = DEMO_TRAIT_IDS.map((id) => {
          const trait = traits.find((item: { tokenId: number | string }) => item.tokenId.toString() === id);
          if (!trait) return null;

          return {
            id,
            name: trait.name,
            category: String(trait.category || 'other'),
            imageUrl: `https://raw.githubusercontent.com/adriangallery/adrianzero/main/traitlabv3/assets/traits/${id}.svg`,
          } as DemoTrait;
        }).filter((trait): trait is DemoTrait => trait !== null);

        const grouped = selectedTraits.reduce((acc, trait) => {
          const key = trait.category.toUpperCase();
          const existing = acc.find((entry) => entry.name === key);
          if (existing) {
            existing.traits.push(trait);
          } else {
            acc.push({ name: key, traits: [trait] });
          }
          return acc;
        }, [] as DemoTraitCategory[]);

        setCategories(grouped);
        if (grouped.length > 0) {
          setActiveCategoryName(grouped[0].name);
        }
      } catch {
        setCategories([]);
      }
    };

    void loadDemoTraits();
  }, []);

  const currentCategory = categories.find((item) => item.name === activeCategoryName) || categories[0] || null;
  const selectedTraitIndex = currentCategory ? (activeTraitByCategory[currentCategory.name] ?? 0) : 0;
  const selectedTrait = currentCategory?.traits[selectedTraitIndex] ?? currentCategory?.traits[0] ?? null;

  useEffect(() => {
    if (!currentCategory) return;
    if (activeTraitByCategory[currentCategory.name] !== undefined) return;

    setActiveTraitByCategory((prev) => ({
      ...prev,
      [currentCategory.name]: 0,
    }));
  }, [activeTraitByCategory, currentCategory]);

  const selectedTraitIds = useMemo(
    () =>
      categories
        .map((category) => {
        const traitIndex = activeTraitByCategory[category.name];
        if (traitIndex === undefined) return null;
        return category.traits[traitIndex]?.id ?? null;
        })
        .filter((id): id is string => id !== null),
    [activeTraitByCategory, categories]
  );

  const previewImageUrl = useMemo(() => {
    if (selectedTraitIds.length === 0) {
      return `https://adrianlab.vercel.app/api/render/${DEMO_TOKEN_ID}`;
    }

    return vercelImageService.generateCombinedImageUrl({
      tokenId: DEMO_TOKEN_ID,
      traitIds: selectedTraitIds,
    });
  }, [selectedTraitIds]);

  useEffect(() => {
    if (!shouldShowPreview) return;
    if (!previewImageUrl) return;

    setIsPreviewLoading(true);
    vercelImageService.preloadImage(previewImageUrl).finally(() => {
      setIsPreviewLoading(false);
    });
  }, [previewImageUrl, shouldShowPreview]);

  if (!shouldShowPreview || !currentCategory || !selectedTrait) return null;

  return (
    <section className="relative z-[5] mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-[#00ff00]/35 bg-[#0b110f] p-5 sm:p-7">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#00ff00]/35 bg-[#00ff00]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#b8ffba]">
          Demo Mode
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <h3 className="text-2xl font-black sm:text-3xl">
              Build your <span style={{ color: LIME }}>ZERO</span>
            </h3>
            <p className="mt-2 text-sm text-[#c9d6ce] sm:text-base">
              Preview how TraitLAB customization feels before minting. Select trait groups and style your identity.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.name}
                  type="button"
                  onClick={() => setActiveCategoryName(category.name)}
                  className="rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] transition-colors sm:text-sm"
                  style={{
                    borderColor:
                      currentCategory.name === category.name ? 'rgba(0,255,0,0.55)' : 'rgba(255,255,255,0.18)',
                    background:
                      currentCategory.name === category.name ? 'rgba(0,255,0,0.16)' : 'rgba(255,255,255,0.04)',
                    color: currentCategory.name === category.name ? '#d9ffda' : '#d0ddd1',
                  }}
                >
                  {category.name}
                </button>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {currentCategory.traits.map((trait, traitIndex) => {
                const isActive = selectedTraitIndex === traitIndex;
                return (
                  <button
                    key={trait.id}
                    type="button"
                    onClick={() => {
                      setActiveTraitByCategory((prev) => ({
                        ...prev,
                        [currentCategory.name]: traitIndex,
                      }));
                    }}
                    className="rounded-lg border p-2 text-left text-xs font-semibold transition-colors sm:text-sm"
                    style={{
                      borderColor: isActive ? 'rgba(0,255,0,0.55)' : 'rgba(255,255,255,0.15)',
                      background: isActive ? 'rgba(0,255,0,0.14)' : 'rgba(255,255,255,0.03)',
                      color: isActive ? '#e4ffe5' : '#c7d4c8',
                    }}
                  >
                    <img
                      src={trait.imageUrl}
                      alt={trait.name}
                      className="mb-2 h-14 w-14 rounded-md bg-white/5 p-1"
                      loading="lazy"
                    />
                    <span className="line-clamp-2 block">{trait.name}</span>
                  </button>
                );
              })}
            </div>

            <p className="mt-5 text-xs text-[#9fb0a0] sm:text-sm">
              This preview uses the same demo trait IDs as MyNFTs demo mode and applies them live over ZERO #{DEMO_TOKEN_ID}.
            </p>
          </div>

          <div className="rounded-2xl border border-white/20 bg-[#0a1210] p-4">
            <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.12em] text-[#a7b9aa]">
              <span>TraitLAB Preview</span>
              <span>{selectedTrait.name}</span>
            </div>
            <div className="relative">
              {isPreviewLoading && (
                <div className="absolute inset-0 z-[2] animate-pulse rounded-xl bg-[#0d1a0f]" />
              )}
              <img
                src={previewImageUrl}
                alt="TraitLAB preview"
                className="aspect-square w-full rounded-xl object-cover"
                onError={(event) => {
                  event.currentTarget.src = getGitHubImageUrl('zeronaked.png');
                }}
              />
            </div>
            <p className="mt-3 text-xs text-[#b9c8ba] sm:text-sm">
              Demo NFT #{DEMO_TOKEN_ID} - Selected: <span style={{ color: LIME }}>{currentCategory.name}</span> - {selectedTrait.name}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
});
