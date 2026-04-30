import type { ReactNode } from 'react';
import {
  Award,
  Calendar,
  DollarSign,
  Droplets,
  Film,
  Frame,
  Gamepad2,
  Grid,
  HelpCircle,
  Rocket,
  Shirt,
  ShoppingBag,
  Sword,
  Zap,
} from 'lucide-react';

export interface NavItem {
  path: string;
  label: string;
  icon: ReactNode;
  requiresAdrianZero?: boolean;
  requiresAdrianPunks?: boolean;
  requiresConnection?: boolean;
  highlight?: boolean;
  /** Opens in top frame (breaks out of iframe) */
  external?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { path: '/zero', label: 'Home', icon: <Zap className="h-5 w-5" /> },
  { path: '/mint', label: 'Mint', icon: <Rocket className="h-5 w-5" /> },
  { path: '/mynfts', label: 'My NFTs', icon: <Frame className="h-5 w-5" />, requiresConnection: true },
  { path: '/shop', label: 'Shop', icon: <ShoppingBag className="h-5 w-5" /> },
  { path: '/tshit', label: 'Studio', icon: <Shirt className="h-5 w-5" /> },
  { path: '/buy', label: 'Buy $ZERO', icon: <DollarSign className="h-5 w-5" />, highlight: true },
  { path: '/adventure/', label: 'Adventure', icon: <Gamepad2 className="h-5 w-5" />, external: true },
  { path: '/zeromovies', label: 'ZEROmovies', icon: <Film className="h-5 w-5" /> },
  { path: '/budokai', label: 'Budokai', icon: <Sword className="h-5 w-5" /> },
  { path: '/gallery', label: 'Gallery', icon: <Grid className="h-5 w-5" /> },
  { path: '/punks', label: 'Punks', icon: <Award className="h-5 w-5" />, requiresAdrianPunks: true },
  { path: '/shitdrop', label: 'ShitDROP', icon: <Droplets className="h-5 w-5" /> },
  { path: '/timeline', label: 'Timeline', icon: <Calendar className="h-5 w-5" /> },
  { path: '/about', label: 'About', icon: <HelpCircle className="h-5 w-5" /> },
];
