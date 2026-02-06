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
    description: 'Mix and match thousands of traits to create your perfect ZERO',
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
    title: '$ADRIAN Token Integration',
    description: 'Use tokens for traits, upgrades, and ecosystem features',
    icon: '💰',
  },
  {
    title: 'Community Voting',
    description: 'Shape the future with governance and trait proposals',
    icon: '🗳️',
  },
  {
    title: 'Future Expansion',
    description: 'New utilities, integrations, and experiences coming soon',
    icon: '🚀',
  },
];

export const STATS_DATA = [
  { value: '10,000', label: 'ZEROs Minted' },
  { value: '5,000+', label: 'Traits Applied' },
  { value: '1,000+', label: 'Active Holders' },
  { value: '500+', label: 'Events Completed' },
];
