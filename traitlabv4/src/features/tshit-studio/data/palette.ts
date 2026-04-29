/**
 * 16-color retro palette inherited from V1 traitcreator.
 * The user can also pick custom HEX, but these are the one-tap defaults.
 */
export const RETRO_COLORS: readonly string[] = [
  '#000000', // Black
  '#ffffff', // White
  '#0080ff', // Blue
  '#ff0080', // Magenta
  '#00ffff', // Cyan
  '#ff0000', // Red
  '#ff4000', // Red-Orange
  '#ff8000', // Orange
  '#00ff00', // Green
  '#ffff00', // Yellow
  '#8000ff', // Purple
  '#ff0040', // Deep Pink
  '#40ff00', // Lime
  '#8080ff', // Light Blue
  '#ff80ff', // Light Magenta
  '#80ffff', // Light Cyan
] as const;

export const DEFAULT_COLOR = '#000000';
