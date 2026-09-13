import { describe, it, expect, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { canApplyQueryPrefix } from '../hooks/useCanApplyTraits';

/**
 * Caché de `checkTrait` (revisión del crítico 13-sep): antes de este pase,
 * tocar la misma tarjeta varias veces (probar, deshacer, volver a probar)
 * disparaba `canUserAccessTrait` + `isTraitAvailable` de nuevo cada vez.
 * `useCanApplyTraits.checkTrait` ahora envuelve esas 2 lecturas en un
 * único `queryClient.fetchQuery` con clave `[...canApplyQueryPrefix,
 * address, tokenId, traitId]` y `staleTime`.
 *
 * Este test no monta el hook (requeriría mockear wagmi + jsdom, no
 * disponible) — ejercita directamente el `QueryClient` de React Query,
 * que es agnóstico de React, con el mismo patrón de clave y `staleTime`
 * que usa el hook real.
 */

const STALE_TIME_MS = 30_000;

describe('caché de checkTrait (QueryClient.fetchQuery)', () => {
  it('no repite la lectura on-chain para el mismo trait dentro de staleTime', async () => {
    const queryClient = new QueryClient();
    const queryFn = vi.fn().mockResolvedValue({ canAccess: true, isAvailable: true });
    const key = [...canApplyQueryPrefix, '0xabc', '146', '444'];

    const first = await queryClient.fetchQuery({ queryKey: key, queryFn, staleTime: STALE_TIME_MS });
    const second = await queryClient.fetchQuery({ queryKey: key, queryFn, staleTime: STALE_TIME_MS });

    expect(first).toEqual({ canAccess: true, isAvailable: true });
    expect(second).toEqual({ canAccess: true, isAvailable: true });
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it('un trait distinto es una clave distinta — sí dispara una lectura nueva', async () => {
    const queryClient = new QueryClient();
    const queryFn = vi.fn().mockResolvedValue({ canAccess: true, isAvailable: true });

    await queryClient.fetchQuery({ queryKey: [...canApplyQueryPrefix, '0xabc', '146', '444'], queryFn, staleTime: STALE_TIME_MS });
    await queryClient.fetchQuery({ queryKey: [...canApplyQueryPrefix, '0xabc', '146', '700'], queryFn, staleTime: STALE_TIME_MS });

    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it('cambiar de token (mismo traitId) también es una clave distinta', async () => {
    const queryClient = new QueryClient();
    const queryFn = vi.fn().mockResolvedValue({ canAccess: true, isAvailable: true });

    await queryClient.fetchQuery({ queryKey: [...canApplyQueryPrefix, '0xabc', '146', '444'], queryFn, staleTime: STALE_TIME_MS });
    await queryClient.fetchQuery({ queryKey: [...canApplyQueryPrefix, '0xabc', '999', '444'], queryFn, staleTime: STALE_TIME_MS });

    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it('invalidar el prefijo (tras un apply) fuerza una lectura nueva en la siguiente llamada', async () => {
    const queryClient = new QueryClient();
    const queryFn = vi.fn().mockResolvedValue({ canAccess: true, isAvailable: true });
    const key = [...canApplyQueryPrefix, '0xabc', '146', '444'];

    await queryClient.fetchQuery({ queryKey: key, queryFn, staleTime: STALE_TIME_MS });
    await queryClient.invalidateQueries({ queryKey: canApplyQueryPrefix });
    await queryClient.fetchQuery({ queryKey: key, queryFn, staleTime: STALE_TIME_MS });

    expect(queryFn).toHaveBeenCalledTimes(2);
  });
});
