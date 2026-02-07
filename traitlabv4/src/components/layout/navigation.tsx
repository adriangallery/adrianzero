import type { ReactNode } from 'react';
import {
  Award,
  BarChart3,
  Calendar,
  Car,
  Droplets,
  Edit3,
  FlaskConical,
  Frame,
  Gift,
  Grid,
  Hammer,
  HelpCircle,
  Package,
  Palette,
  Rocket,
  Search,
  ShoppingBag,
  Zap,
} from 'lucide-react';

export interface NavItem {
  path: string;
  label: string;
  icon: ReactNode;
  requiresAdrianZero?: boolean;
  requiresAdrianPunks?: boolean;
  requiresConnection?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: <BarChart3 className="h-5 w-5" /> },
  { path: '/adrianzero', label: 'My NFTs', icon: <Frame className="h-5 w-5" /> },
  { path: '/zero', label: 'ZERO', icon: <Zap className="h-5 w-5" /> },
  { path: '/onboarding', label: 'Mint', icon: <Rocket className="h-5 w-5" /> },
  { path: '/traits', label: 'Traits', icon: <Palette className="h-5 w-5" />, requiresConnection: true },
  { path: '/packs', label: 'Packs', icon: <Package className="h-5 w-5" />, requiresConnection: true },
  { path: '/serum', label: 'Serum', icon: <FlaskConical className="h-5 w-5" /> },
  { path: '/crafting', label: 'Crafting', icon: <Hammer className="h-5 w-5" />, requiresAdrianZero: true },
  { path: '/custom', label: 'Custom', icon: <Edit3 className="h-5 w-5" />, requiresAdrianZero: true },
  { path: '/lambo', label: 'Lambo', icon: <Car className="h-5 w-5" />, requiresAdrianZero: true },
  { path: '/search', label: 'Search', icon: <Search className="h-5 w-5" />, requiresAdrianZero: true },
  // { path: '/gallery', label: 'Gallery', icon: <Grid className="h-5 w-5" /> }, // Hidden
  { path: '/shitdrop', label: 'ShitDROP', icon: <Droplets className="h-5 w-5" /> },
  { path: '/rewards', label: 'Rewards', icon: <Gift className="h-5 w-5" />, requiresAdrianPunks: true },
  { path: '/ogclaim', label: 'OG Claim', icon: <Award className="h-5 w-5" />, requiresAdrianPunks: true },
  { path: '/shop', label: 'Shop', icon: <ShoppingBag className="h-5 w-5" /> },
  { path: '/lost', label: 'Timeline', icon: <Calendar className="h-5 w-5" /> },
  { path: '/whatisit', label: 'About', icon: <HelpCircle className="h-5 w-5" /> },
];
