import type { TraitCategory } from '../types/zero.types';

export const SAMPLE_TRAITS: TraitCategory[] = [
  {
    name: 'Eyes',
    traits: [
      { id: '1', name: 'Laser Eyes', category: 'eyes' },
      { id: '2', name: 'Heart Eyes', category: 'eyes' },
      { id: '3', name: 'Fire Eyes', category: 'eyes' },
      { id: '4', name: 'Star Eyes', category: 'eyes' },
    ],
  },
  {
    name: 'Mouth',
    traits: [
      { id: '5', name: 'Gold Grill', category: 'mouth' },
      { id: '6', name: 'Smile', category: 'mouth' },
      { id: '7', name: 'Tongue Out', category: 'mouth' },
    ],
  },
  {
    name: 'Head',
    traits: [
      { id: '8', name: 'Crown', category: 'head' },
      { id: '9', name: 'Halo', category: 'head' },
      { id: '10', name: 'Horns', category: 'head' },
    ],
  },
  {
    name: 'Background',
    traits: [
      { id: '11', name: 'Neon', category: 'background' },
      { id: '12', name: 'Galaxy', category: 'background' },
      { id: '13', name: 'Matrix', category: 'background' },
    ],
  },
];

export const UTILITY_CARDS = [
  {
    title: 'TraitLAB Customization',
    description: 'Mix and match 1,100+ traits to create your perfect ZERO',
    icon: '🔧',
  },
  {
    title: 'ShitDROP Rewards',
    description: 'Earn exclusive traits and rewards through community events',
    icon: '🎁',
  },
  {
    title: 'Builder Battle Events',
    description: 'Compete in creative challenges and showcase your designs',
    icon: '⚔️',
  },
  {
    title: '$ZERO Token Economy',
    description: 'Deflationary token — swap tax fuels the floor engine, burns, and staking',
    icon: '💰',
  },
  {
    title: 'ZEROmovies',
    description: 'Rent movies with $ZERO. Own a piece of the story.',
    icon: '🎬',
  },
  {
    title: 'TraitSHOP',
    description: 'Buy traits, floppies, and serums directly with $ZERO or $ADRIAN',
    icon: '🛒',
  },
];

export const STATS_DATA = [
  { value: '750+', label: 'ZEROs Minted' },
  { value: '1,100+', label: 'Unique Traits' },
  { value: '1,000', label: 'AdrianPunks' },
  { value: '55+', label: 'Weekly Recaps' },
];
