/**
 * Application Routes
 * Lazy-loaded routes for code splitting
 * Reorganized: 19 pages → 11 pages + redirects for backward compatibility
 */

import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { RootRoute } from './RootRoute';

// ─── Primary Modules (11 pages) ───────────────────────────────────────────────

const ZeroModule = lazy(() =>
  import('@/features/zero/components/ZeroModule').then((m) => ({
    default: m.ZeroModule,
  }))
);

const OnboardingModule = lazy(() =>
  import('@/features/onboarding/components/OnboardingModule').then((m) => ({
    default: m.OnboardingModule,
  }))
);

const MyNFTsModule = lazy(() =>
  import('@/features/mynfts/components/MyNFTsModule').then((m) => ({
    default: m.MyNFTsModule,
  }))
);

const ShopModule = lazy(() =>
  import('@/features/shop/components/ShopModule').then((m) => ({
    default: m.ShopModule,
  }))
);

const BuyModule = lazy(() =>
  import('@/features/buy/components/BuyModule').then((m) => ({
    default: m.BuyModule,
  }))
);

const ZEROmoviesModule = lazy(() =>
  import('@/features/zeromovies/components/ZEROmoviesModule').then((m) => ({
    default: m.ZEROmoviesModule,
  }))
);

const SamuraiDojoModule = lazy(() =>
  import('@/features/samuraidojo/components/SamuraiDojoModule').then((m) => ({
    default: m.SamuraiDojoModule,
  }))
);

const GalleryModule = lazy(() =>
  import('@/features/gallery/components/GalleryModule').then((m) => ({
    default: m.GalleryModule,
  }))
);

const PunksModule = lazy(() =>
  import('@/features/punks/components/PunksModule').then((m) => ({
    default: m.PunksModule,
  }))
);

const ShitdropModule = lazy(() =>
  import('@/features/shitdrop/components/ShitdropModule').then((m) => ({
    default: m.ShitdropModule,
  }))
);

const LostModule = lazy(() =>
  import('@/features/lost/components/LostModule').then((m) => ({
    default: m.LostModule,
  }))
);

const WhatIsItModule = lazy(() =>
  import('@/features/whatisit/components/WhatIsItModule').then((m) => ({
    default: m.WhatIsItModule,
  }))
);

const ExplainJBModule = lazy(() =>
  import('@/features/explainjb/components/ExplainJBModule').then((m) => ({
    default: m.ExplainJBModule,
  }))
);

const AnimationsModule = lazy(() =>
  import('@/features/animations/components/AnimationsModule').then((m) => ({
    default: m.AnimationsModule,
  }))
);

const BudokaiChronicleMockup = lazy(() =>
  import('@/features/samuraidojo/components/BudokaiChronicle').then((m) => ({
    default: () => <m.BudokaiChronicle budokaiId={1} />,
  }))
);

// ─── Routes ───────────────────────────────────────────────────────────────────

export const routes: RouteObject[] = [
  // Root redirect
  { path: '/', element: <RootRoute /> },

  // ─── 11 Primary Pages ────────────────────────────────────────────────────
  { path: '/zero', element: <ZeroModule /> },
  { path: '/mint', element: <OnboardingModule /> },
  { path: '/mynfts', element: <MyNFTsModule /> },
  { path: '/shop', element: <ShopModule /> },
  { path: '/buy', element: <BuyModule /> },
  { path: '/zeromovies', element: <ZEROmoviesModule /> },
  { path: '/budokai', element: <SamuraiDojoModule /> },
  { path: '/gallery', element: <GalleryModule /> },
  { path: '/punks', element: <PunksModule /> },
  { path: '/shitdrop', element: <ShitdropModule /> },
  { path: '/timeline', element: <LostModule /> },
  { path: '/about', element: <WhatIsItModule /> },

  // ─── Link-only (not in menu) ─────────────────────────────────────────────
  { path: '/explain-to-jb', element: <ExplainJBModule /> },
  { path: '/animations', element: <AnimationsModule /> },
  { path: '/budokai-replay-mockup', element: <BudokaiChronicleMockup /> },

  // ─── Redirects (backward compatibility) ──────────────────────────────────
  { path: '/dashboard', element: <Navigate to="/zero" replace /> },
  { path: '/adrianzero', element: <Navigate to="/mynfts" replace /> },
  { path: '/traits', element: <Navigate to="/mynfts?tab=traits" replace /> },
  { path: '/packs', element: <Navigate to="/mynfts?tab=packs" replace /> },
  { path: '/serum', element: <Navigate to="/mynfts?tab=serums" replace /> },
  { path: '/custom', element: <Navigate to="/mynfts?tab=customize" replace /> },
  { path: '/lambo', element: <Navigate to="/mynfts?tab=customize" replace /> },
  { path: '/crafting', element: <Navigate to="/mynfts?tab=craft" replace /> },
  { path: '/search', element: <Navigate to="/mynfts" replace /> },
  { path: '/rewards', element: <Navigate to="/punks" replace /> },
  { path: '/ogclaim', element: <Navigate to="/punks?tab=ogclaim" replace /> },
  { path: '/onboarding', element: <Navigate to="/mint" replace /> },
  { path: '/lost', element: <Navigate to="/timeline" replace /> },
  { path: '/whatisit', element: <Navigate to="/about" replace /> },
];
