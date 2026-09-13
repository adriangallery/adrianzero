/**
 * Editor TraitLab (F4) — pantalla más importante del rediseño mobile-first
 * (D11/D12, `PLAN_ADRIANZERO_2026-09.md` FASE 5.1). Maqueta de referencia:
 * `orquestacion-fable/design/adrianzero-redesign/Main.dc.html`.
 *
 * Ruta `/traitlab` (deliverable #1) — sustituye a la vieja pestaña
 * "Traits" de `/mynfts` como pantalla propia, alcanzable desde la TabBar y
 * desde "Editar" en Mis NFTs.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { Button, ActionBar, Skeleton, Badge, UndoIcon, WalletSheet } from '@/ui';
import { useWalletPrompt } from '@/hooks/useWalletPrompt';
import { useNotifications } from '@/hooks/useNotifications';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useAdrianZeroStore } from '@/features/adrianzero/store/adrianZeroStore';
import { useTraitsByCategory } from '@/features/traits/hooks/useTraits';
import { vercelImageService } from '@/lib/api/vercel/imageService';
import { humanError } from '@/lib/web3/humanError';
import { useTraitlabStore } from '../store/traitlabStore';
import { computeChanges, planSignatures } from '../lib/changes';
import { computeTraitCardState } from '../lib/traitCardState';
import { getLastUsedTokenId, setLastUsedTokenId } from '../lib/tokenHistory';
import { useEquippedTraits } from '../hooks/useEquippedTraits';
import { useCanApplyTraits } from '../hooks/useCanApplyTraits';
import { useApplyTraitlabChanges } from '../hooks/useApplyTraitlabChanges';
import { TokenSelectorSheet } from './TokenSelectorSheet';
import { CategoryChips } from './CategoryChips';
import { TraitCard, GetMoreInShopCard } from './TraitCard';
import { ApplyResultSheet } from './ApplyResultSheet';
import type { Trait } from '@/types/nft.types';

const PREVIEW_DEBOUNCE_MS = 400;
const PREVIEW_TIMEOUT_MS = 8000;

type PreviewStatus = 'idle' | 'loading' | 'ready' | 'error' | 'timeout';

export function TraitLabModule() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isConnected } = useAccount();
  const { requireWallet } = useWalletPrompt();
  const notifications = useNotifications();
  // El TabBar inferior fijo solo existe <768px (MainLayout) — sin ella, el
  // ActionBar debe pegarse al fondo real del viewport, no flotar 64px por encima de nada.
  const hasMobileTabBar = useMediaQuery('(max-width: 767px)');

  const adrianZeroSelected = useAdrianZeroStore((s) => s.selectedToken);
  const selectedTokenId = useTraitlabStore((s) => s.selectedTokenId);
  const equipped = useTraitlabStore((s) => s.equipped);
  const selections = useTraitlabStore((s) => s.selections);
  const history = useTraitlabStore((s) => s.history);
  const lockedReasons = useTraitlabStore((s) => s.lockedReasons);
  const setSelectedToken = useTraitlabStore((s) => s.setSelectedToken);
  const selectTraitAction = useTraitlabStore((s) => s.selectTrait);
  const undo = useTraitlabStore((s) => s.undo);
  const clearSelections = useTraitlabStore((s) => s.clearSelections);
  // BUG (React #185, hallado en revisión visual 13-sep): `useTraitlabStore(selectTraitlabChanges)`
  // pasaba por `useSyncExternalStoreWithSelector`, que compara el resultado del selector con
  // Object.is — pero `computeChanges` construye un objeto/arrays NUEVOS en cada llamada, así que
  // la comparación SIEMPRE daba "cambió", incluso con `equipped`/`selections` sin tocar (vacíos
  // incluso, sin wallet). Eso disparaba un re-render → nueva instantánea → otro re-render sin fin
  // ("Maximum update depth exceeded"). Fix: leer los campos crudos del store (ya estables, son
  // referencias directas que solo cambian cuando una acción los reemplaza) y derivar `changes`
  // con `useMemo` en React, no dentro del selector de zustand. Ver
  // `__tests__/traitlabSelectorStability.test.ts` para el test de regresión.
  const changes = useMemo(() => computeChanges(equipped, selections), [equipped, selections]);

  const [tokenSheetOpen, setTokenSheetOpen] = useState(!selectedTokenId);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [comparing, setComparing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus>('idle');
  const [resultOpen, setResultOpen] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [walletSheetOpen, setWalletSheetOpen] = useState(false);

  const { isLoading: isLoadingEquipped } = useEquippedTraits(selectedTokenId);
  const { checkTrait } = useCanApplyTraits(selectedTokenId);
  const applyMutation = useApplyTraitlabChanges(selectedTokenId);
  const { data: traitsByCategory = {}, isLoading: isLoadingTraits } = useTraitsByCategory();

  // Resolución del token inicial: ?token= de la URL > hint de Mis NFTs > último usado > hoja de elegir.
  useEffect(() => {
    const fromQuery = searchParams.get('token');
    if (fromQuery && fromQuery !== selectedTokenId) {
      setSelectedToken(fromQuery);
      setTokenSheetOpen(false);
      return;
    }
    if (!selectedTokenId) {
      const hint = adrianZeroSelected?.tokenId ?? getLastUsedTokenId();
      if (hint) {
        setSelectedToken(hint);
        setTokenSheetOpen(false);
      } else {
        setTokenSheetOpen(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(
    () =>
      Object.keys(traitsByCategory)
        .sort()
        .map((name) => ({ name, count: traitsByCategory[name].length })),
    [traitsByCategory]
  );

  useEffect(() => {
    if (!activeCategory && categories.length > 0) {
      setActiveCategory(categories[0].name);
    }
  }, [categories, activeCategory]);

  const handleTokenSelect = useCallback(
    (tokenId: string) => {
      setSelectedToken(tokenId);
      setLastUsedTokenId(tokenId);
      setSearchParams((params) => {
        params.set('token', tokenId);
        return params;
      });
      setTokenSheetOpen(false);
    },
    [setSelectedToken, setSearchParams]
  );

  // ─── Preview en vivo: debounce 400ms + timeout 8s + reintento ────────────
  const previewSeq = useRef(0);
  const toApplyKey = changes.toApply.slice().sort().join(',');

  const runPreview = useCallback(() => {
    if (!selectedTokenId) return;
    const seq = ++previewSeq.current;
    if (changes.toApply.length === 0) {
      setPreviewStatus('ready');
      setPreviewUrl(`https://adrianlab.vercel.app/api/render/${selectedTokenId}.png`);
      return;
    }
    setPreviewStatus('loading');
    const url = vercelImageService.generateCombinedImageUrl({ tokenId: selectedTokenId, traitIds: changes.toApply });
    const timeout = setTimeout(() => {
      if (previewSeq.current === seq) setPreviewStatus('timeout');
    }, PREVIEW_TIMEOUT_MS);

    vercelImageService.preloadImage(url).then((ok) => {
      if (previewSeq.current !== seq) return;
      clearTimeout(timeout);
      if (ok) {
        setPreviewUrl(url);
        setPreviewStatus('ready');
      } else {
        setPreviewStatus('error');
      }
    });
  }, [selectedTokenId, changes.toApply]);

  useEffect(() => {
    if (!selectedTokenId) return;
    const t = setTimeout(runPreview, PREVIEW_DEBOUNCE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTokenId, toApplyKey]);

  const baseImageUrl = selectedTokenId ? `https://adrianlab.vercel.app/api/render/${selectedTokenId}.png` : '';
  const displayedUrl = comparing ? baseImageUrl : previewUrl ?? baseImageUrl;

  // ─── Selección de traits ──────────────────────────────────────────────
  const handleSelectTrait = useCallback(
    async (trait: Trait) => {
      // Menos fricción que el toast "Wallet Required" (revisión visual
      // 13-sep): tocar un trait sin wallet abre directo la hoja de conectar.
      if (!isConnected) {
        setWalletSheetOpen(true);
        return;
      }
      const category = trait.category;
      const current = selections[category] ?? equipped[category];

      if (current === trait.tokenId) {
        selectTraitAction(category, trait.tokenId); // toggle off
        return;
      }

      const { can, reason } = await checkTrait(trait.tokenId);
      if (!can) {
        notifications.warning('Not allowed', reason || 'This trait cannot be applied to this token', true);
        return;
      }
      selectTraitAction(category, trait.tokenId);
    },
    [isConnected, selections, equipped, selectTraitAction, checkTrait, notifications]
  );

  // ─── Aplicar cambios ──────────────────────────────────────────────────
  const plan = planSignatures(changes, applyMutation.needsApproval);

  useEffect(() => {
    if (selectedTokenId && isConnected) applyMutation.checkApproval();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTokenId, isConnected]);

  const handleApply = useCallback(async () => {
    if (!requireWallet('apply your changes')) return;
    if (changes.count === 0) return;

    // El guardián de verdad (simulateContract de applyTraitMultiple) vive
    // dentro de useApplyTraitlabChanges — el contrato no expone un
    // canApplyTraits con motivo (13-sep-2026), así que revertir es la única
    // forma fiable de saber "por qué no" para una combinación completa.
    try {
      const result = await applyMutation.mutateAsync(changes);
      clearSelections();
      setLastTxHash(result.lastTxHash);
      setResultOpen(true);
      notifications.success('Changes applied!', `AdrianZERO #${result.tokenId} updated on-chain`, false, result.lastTxHash);
    } catch (error) {
      // El toast de error ya lo dispara useApplyTraitlabChanges#onError; solo
      // registramos aquí por si algún día se quiere telemetría adicional.
      void humanError(error);
    }
  }, [requireWallet, changes, notifications, applyMutation, clearSelections]);

  const gridTraits = activeCategory ? traitsByCategory[activeCategory] ?? [] : [];
  const noToken = !selectedTokenId;

  return (
    <div className="flex flex-col">
      {/* Cabecera: token + cambiar */}
      <div className="flex items-center justify-between gap-3 px-4 pb-2.5 pt-3.5">
        <button
          type="button"
          data-testid="traitlab-change-token"
          onClick={() => setTokenSheetOpen(true)}
          className="flex min-w-0 items-center gap-2.5 text-left"
        >
          {selectedTokenId ? (
            <img
              src={`https://adrianlab.vercel.app/api/render/${selectedTokenId}.png`}
              alt=""
              className="h-9 w-9 flex-none rounded-[var(--r-md)] border-2 border-line bg-panel object-cover"
            />
          ) : (
            <div className="h-9 w-9 flex-none rounded-[var(--r-md)] border-2 border-line bg-panel" />
          )}
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-display text-[10px]">
              {selectedTokenId ? `ZERO #${selectedTokenId}` : 'Choose a ZERO'}
            </span>
            <span className="text-[12px] text-mute">Change token &rsaquo;</span>
          </span>
        </button>
        <span className="flex flex-none items-center gap-1.5 text-[12px] text-mute">
          <span
            className="h-2 w-2 rounded-full bg-acc"
            aria-hidden="true"
            style={{ visibility: previewStatus === 'loading' ? 'hidden' : 'visible' }}
          />
          Live preview
        </span>
      </div>

      {noToken ? (
        <div className="flex min-h-[50dvh] items-center justify-center px-6 text-center text-sm text-mute">
          Choose a ZERO to start customizing it.
        </div>
      ) : (
        <>
          {/* Preview: cuadrado responsive, nunca vh (barra de Safari) — en un
              viewport bajo (≈664px con las barras del navegador) arranca en
              ~34dvh y deja al menos una fila de tarjetas visible sin scroll
              (revisión visual 13-sep: el h-[300px] fijo se comía toda la
              pantalla en móviles reales). */}
          <div className="px-4">
            <div
              className="relative mx-auto select-none overflow-hidden rounded-[var(--r-lg)] border-2 border-line bg-panel"
              style={{
                width: 'min(calc(100vw - 32px), 34dvh)',
                height: 'min(calc(100vw - 32px), 34dvh)',
                minWidth: 160,
                minHeight: 160,
              }}
              onPointerDown={() => setComparing(true)}
              onPointerUp={() => setComparing(false)}
              onPointerLeave={() => setComparing(false)}
              onPointerCancel={() => setComparing(false)}
              data-testid="traitlab-preview"
            >
            {previewStatus === 'loading' ? (
              <Skeleton className="h-full w-full" />
            ) : displayedUrl ? (
              <img src={displayedUrl} alt="Preview" className="h-full w-full object-contain" />
            ) : null}

            {previewStatus === 'loading' ? (
              <span className="absolute inset-x-0 bottom-3 text-center text-[12px] text-mute">Rendering…</span>
            ) : null}
            {previewStatus === 'error' || previewStatus === 'timeout' ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-bg/90 text-center text-[12px] text-mute">
                <span>{previewStatus === 'timeout' ? 'This is taking a while…' : 'Could not render the preview.'}</span>
                <Button size="md" variant="secondary" onClick={runPreview}>
                  Retry
                </Button>
              </div>
            ) : null}

            <span className="absolute bottom-3 left-3 flex items-center gap-2 rounded-[var(--r-md)] border border-line bg-bg/85 px-2 py-1.5 text-[11px] text-mute">
              Hold to compare
            </span>
            {changes.count > 0 ? (
              <Badge tone="acc" className="absolute right-3 top-3 !rounded-full !border-acc">
                {changes.count} change{changes.count === 1 ? '' : 's'}
              </Badge>
            ) : null}
            </div>
          </div>

          {/* Categorías: sticky bajo el header (--header-h) para que, al
              hacer scroll de página, no se vayan detrás de las tarjetas —
              antes vivían dentro de un contenedor con scroll propio que
              dejaba la rejilla sin altura real (revisión visual 13-sep). */}
          <div className="sticky z-10 bg-bg" style={{ top: 'var(--header-h)' }}>
            {isLoadingTraits ? (
              <div className="flex gap-2 px-4 pb-2.5 pt-3.5">
                <Skeleton className="h-[38px] w-24" />
                <Skeleton className="h-[38px] w-20" />
                <Skeleton className="h-[38px] w-24" />
              </div>
            ) : (
              <CategoryChips categories={categories} active={activeCategory} onSelect={setActiveCategory} />
            )}
          </div>

          {/* Grid de traits: flujo normal de página (el scroll lo hace el
              contenedor de MainLayout, no un flex-1/overflow-y-auto propio
              que dejaba la rejilla sin altura real — revisión visual
              13-sep). padding-bottom = --tabbar-h (F3.5) + altura real de la
              ActionBar (48px de botón + 10px/12px de padding vertical =
              70px) + 16px de aire, para que la última fila no quede
              cortada bajo la barra fija. */}
          <div className="px-4 pb-[calc(var(--tabbar-h)+86px)]">
            {isLoadingTraits || isLoadingEquipped ? (
              <div className="grid grid-cols-3 gap-2.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square w-full" />
                ))}
              </div>
            ) : gridTraits.length === 0 && !activeCategory ? (
              <p className="py-10 text-center text-sm text-mute">You don't own any traits yet.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2.5" data-testid="traitlab-grid">
                {gridTraits.map((trait) => {
                  const category = trait.category;
                  const isEquipped = equipped[category] === trait.tokenId;
                  const desired = selections[category];
                  const isSelected = (desired ?? equipped[category]) === trait.tokenId;
                  const state = computeTraitCardState({
                    balance: trait.balance,
                    isEquipped,
                    isSelected,
                    lockedReason: lockedReasons[trait.tokenId] ?? null,
                  });
                  return (
                    <div key={trait.tokenId} className="flex flex-col">
                      <TraitCard
                        trait={trait}
                        state={state}
                        onSelect={handleSelectTrait}
                        // El contrato no soporta desequipar (13-sep-2026) — se
                        // sustituye aplicando otro trait de la misma categoría.
                        equippedHint={isEquipped ? "Can't remove — apply another trait here to replace it" : undefined}
                      />
                    </div>
                  );
                })}
                <GetMoreInShopCard />
              </div>
            )}
          </div>

          {/* Barra de acción */}
          <ActionBar
            aboveTabBar={hasMobileTabBar}
            secondary={
              <button
                type="button"
                aria-label="Undo"
                data-testid="traitlab-undo"
                disabled={history.length === 0}
                onClick={undo}
                className="disabled:opacity-40"
              >
                <UndoIcon size={20} />
              </button>
            }
            primary={
              <Button
                full
                size="lg"
                disabled={changes.count === 0 || applyMutation.isPending}
                loading={applyMutation.isPending}
                onClick={handleApply}
                trailing={
                  // Solo con cambios reales: needsApproval empieza en true por
                  // defecto (antes de leer isApprovedForAll), así que sin esto
                  // "Apply 0 changes" salía con "1 signature" pegado.
                  changes.count > 0 && plan.signatureCount > 0
                    ? `${plan.signatureCount} signature${plan.signatureCount === 1 ? '' : 's'} · Base`
                    : undefined
                }
                data-testid="traitlab-apply"
              >
                Apply {changes.count} change{changes.count === 1 ? '' : 's'}
              </Button>
            }
          />
        </>
      )}

      <TokenSelectorSheet
        open={tokenSheetOpen}
        onOpenChange={(open) => {
          setTokenSheetOpen(open);
          if (!open && !selectedTokenId) navigate('/mynfts');
        }}
        onSelect={handleTokenSelect}
      />

      {lastTxHash && selectedTokenId ? (
        <ApplyResultSheet
          open={resultOpen}
          onOpenChange={setResultOpen}
          tokenId={selectedTokenId}
          txHash={lastTxHash}
        />
      ) : null}

      <WalletSheet open={walletSheetOpen} onOpenChange={setWalletSheetOpen} />
    </div>
  );
}
