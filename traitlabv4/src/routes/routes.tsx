/**
 * Application Routes
 * Lazy-loaded routes for code splitting
 */

import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

// Lazy load all modules
const DashboardModule = lazy(() =>
  import('@/features/dashboard/components/DashboardModule').then((m) => ({
    default: m.DashboardModule,
  }))
);

const AdrianZeroModule = lazy(() =>
  import('@/features/adrianzero/components/AdrianZeroModule').then((m) => ({
    default: m.AdrianZeroModule,
  }))
);

const TraitsModule = lazy(() =>
  import('@/features/traits/components/TraitsModule').then((m) => ({
    default: m.TraitsModule,
  }))
);

const PacksModule = lazy(() =>
  import('@/features/packs/components/PacksModule').then((m) => ({
    default: m.PacksModule,
  }))
);

const SerumModule = lazy(() =>
  import('@/features/serum/components/SerumModule').then((m) => ({
    default: m.SerumModule,
  }))
);

const CraftingModule = lazy(() =>
  import('@/features/crafting/components/CraftingModule').then((m) => ({
    default: m.CraftingModule,
  }))
);

const CustomModule = lazy(() =>
  import('@/features/customization/components/CustomModule').then((m) => ({
    default: m.CustomModule,
  }))
);

const LamboModule = lazy(() =>
  import('@/features/lambo/components/LamboModule').then((m) => ({
    default: m.LamboModule,
  }))
);

const SearchModule = lazy(() =>
  import('@/features/search/components/SearchModule').then((m) => ({
    default: m.SearchModule,
  }))
);

const OnboardingModule = lazy(() =>
  import('@/features/onboarding/components/OnboardingModule').then((m) => ({
    default: m.OnboardingModule,
  }))
);

const ShopModule = lazy(() =>
  import('@/features/shop/components/ShopModule').then((m) => ({
    default: m.ShopModule,
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

const GalleryModule = lazy(() =>
  import('@/features/gallery/components/GalleryModule').then((m) => ({
    default: m.GalleryModule,
  }))
);

const ShitdropModule = lazy(() =>
  import('@/features/shitdrop/components/ShitdropModule').then((m) => ({
    default: m.ShitdropModule,
  }))
);

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <DashboardModule />,
  },
  {
    path: '/adrianzero',
    element: <AdrianZeroModule />,
  },
  {
    path: '/traits',
    element: <TraitsModule />,
  },
  {
    path: '/packs',
    element: <PacksModule />,
  },
  {
    path: '/serum',
    element: <SerumModule />,
  },
  {
    path: '/crafting',
    element: <CraftingModule />,
  },
  {
    path: '/custom',
    element: <CustomModule />,
  },
  {
    path: '/lambo',
    element: <LamboModule />,
  },
  {
    path: '/search',
    element: <SearchModule />,
  },
  {
    path: '/onboarding',
    element: <OnboardingModule />,
  },
  {
    path: '/mint',
    element: <OnboardingModule />,
  },
  {
    path: '/shop',
    element: <ShopModule />,
  },
  {
    path: '/lost',
    element: <LostModule />,
  },
  {
    path: '/whatisit',
    element: <WhatIsItModule />,
  },
  {
    path: '/gallery',
    element: <GalleryModule />,
  },
  {
    path: '/shitdrop',
    element: <ShitdropModule />,
  },
];
