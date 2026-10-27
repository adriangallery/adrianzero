/**
 * AZombie builder — static spec (mirror of ~/build/zombie-spec/zombie-spec.json, 27-oct-2026).
 *
 * Grid 37×37. Paint order: skeleton → skin (masked; omitted when variant=1) →
 * BODY → MOUTH → EYES → HEAD → WEAPON (= slot order 0..4).
 * Layer PNGs live in /public/zombie/layers/.
 */

export const GRID = 37;
export const PIXELS = GRID * GRID; // 1369
export const MASK_BYTES = 172; // ceil(1369 / 8)

/** 1 = skin pixel is opaque (erasable). Same bit order as the mask. */
export const SKIN_BITMAP_HEX =
  '00000000000000000000000000000000000000000000000000000000000ff8000000ffe000000fff8000007ffc000003ffe000001fff000000fff8000007ffc000007ffe000003fff000001fff8000007ffc000001ffe000000fff0000007ff8000003ffc000001ffe000000ffe0000007fe0000003f00000001f80000000fc0000001ff8000003fff800007ffff00007ffffc0007fffff0003fffff8001fffffc000fffffe0007fffff0000';

export const LAYER_BASE = '/zombie/layers';

export type SlotName = 'BODY' | 'MOUTH' | 'EYES' | 'HEAD' | 'WEAPON';

export interface TraitOption {
  value: number;
  name: string;
  file: string;
}

export interface Slot {
  slot: number;
  name: SlotName;
  options: TraitOption[];
}

export const SLOTS: Slot[] = [
  {
    slot: 0,
    name: 'BODY',
    options: [
      { value: 1, name: 'Bunny Suit', file: 'body-1.png' },
      { value: 2, name: 'General Uniform', file: 'body-2.png' },
      { value: 3, name: 'Grey Hoodie Up', file: 'body-3.png' },
      { value: 4, name: 'Hawaii Shirt', file: 'body-4.png' },
      { value: 5, name: 'Smoking', file: 'body-5.png' },
      { value: 6, name: 'SWAT Vest', file: 'body-6.png' },
      { value: 7, name: 'Space Suit', file: 'body-7.png' },
    ],
  },
  {
    slot: 1,
    name: 'MOUTH',
    options: [
      { value: 1, name: 'Cigarette', file: 'mouth-1.png' },
      { value: 2, name: 'SWAT Mask', file: 'mouth-2.png' },
    ],
  },
  {
    slot: 2,
    name: 'EYES',
    options: [{ value: 1, name: 'Classic Shades', file: 'eyes-1.png' }],
  },
  {
    slot: 3,
    name: 'HEAD',
    options: [
      { value: 1, name: 'General Cap', file: 'head-1.png' },
      { value: 2, name: 'Mouse Ears', file: 'head-2.png' },
      { value: 3, name: 'SWAT Helmet', file: 'head-3.png' },
      { value: 4, name: 'Space Helmet', file: 'head-4.png' },
    ],
  },
  {
    slot: 4,
    name: 'WEAPON',
    options: [
      { value: 1, name: 'Arrow', file: 'weapon-1.png' },
      { value: 2, name: 'K-Bar', file: 'weapon-2.png' },
      { value: 3, name: 'Machete', file: 'weapon-3.png' },
    ],
  },
];

export const SLOT_BODY = 0;
export const SLOT_HEAD = 3;

/** BODY options that already cover the head (hood) → HEAD slot is disabled. Frontend-only rule. */
export const HOODED_BODIES: readonly number[] = [1, 3]; // Bunny Suit, Grey Hoodie Up

export const VARIANT_ZOMBIE = 0;
export const VARIANT_ZOMBIE0 = 1;

/** Every layer file the renderer needs, keyed by file name. */
export const ALL_LAYER_FILES: string[] = [
  'skeleton.png',
  'skin.png',
  ...SLOTS.flatMap((s) => s.options.map((o) => o.file)),
];

export function optionFor(slot: number, value: number): TraitOption | undefined {
  if (!value) return undefined;
  return SLOTS[slot]?.options.find((o) => o.value === value);
}
