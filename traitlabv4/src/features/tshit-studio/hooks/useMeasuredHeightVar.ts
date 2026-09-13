import { useLayoutEffect, useRef } from 'react';

/**
 * Measures the REAL rendered height of the element the returned ref is
 * attached to and publishes it live on `<html>` as a CSS custom property, so
 * anything that stacks against it (`bottom: calc(var(--x) + ...)`) always
 * matches instead of trusting a hardcoded pixel guess that can drift.
 *
 * Bug fix (13-sep hotfix, round 2): `MobileMintBar`/`MobileToolbar` were
 * originally positioned with hardcoded `--tshit-actionbar-h: 56px` /
 * `--tshit-toolbar-h: 104px` constants AND an extra
 * `+ env(safe-area-inset-bottom, 0px)` term stacked on top of `--tabbar-h`.
 * That double-counted the safe area: the global `TabBar` (`src/ui/TabBar.tsx`)
 * already absorbs `env(safe-area-inset-bottom)` INSIDE its fixed `h-16`
 * (border-box, so the box stays 64px regardless of the inset — only the nav
 * content shrinks to fit above it), so adding the inset again on top of
 * `--tabbar-h` pushed `MobileMintBar` up by the device's actual inset value
 * (observed as a 16px gap — a strip of canvas visible between the mint bar
 * and the TabBar). Measuring the real height removes the second failure
 * mode (a hardcoded height guessed wrong) permanently; consumers no longer
 * add `env(safe-area-inset-bottom)` a second time.
 */
export function useMeasuredHeightVar<T extends HTMLElement>(varName: `--${string}`) {
  const ref = useRef<T | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;

    const apply = () => {
      const h = el.getBoundingClientRect().height;
      if (h > 0) root.style.setProperty(varName, `${h}px`);
    };

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty(varName);
    };
  }, [varName]);

  return ref;
}
