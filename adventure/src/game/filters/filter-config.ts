/**
 * Configuración de filtros para items del juego
 * 
 * Este archivo define los criterios de filtrado para diferentes tipos de items.
 * Es fácilmente extensible para agregar nuevos tipos de items en el futuro.
 */

export interface FilterRule {
  type: 'tokenId' | 'tokenIdRange' | 'contract' | 'tokenType' | 'custom';
  value: any;
  operator?: 'equals' | 'in' | 'range' | 'startsWith' | 'custom';
}

export interface ItemFilterConfig {
  id: string;
  name: string;
  description?: string;
  rules: FilterRule[];
  displayName?: (tokenId: number) => string;
  targetContract?: (tokenId: number) => string;
}

export interface GameItem {
  tokenId: number | string;
  contract?: string;
  tokenType?: 'ERC721' | 'ERC1155';
  title?: string;
  name?: string;
  imageUrl?: string;
  metadata?: any;
  [key: string]: any;
}

/**
 * Configuración de filtros para items del juego
 * Basado en los filtros de adventureold/ y TRAITLAB/
 */
export const ITEM_FILTERS: Record<string, ItemFilterConfig> = {
  // Floppy Discs (10000-10005, 15000-15015, 1123)
  floppy: {
    id: 'floppy',
    name: 'Floppy Discs',
    description: 'Discos floppy del juego',
    rules: [
      {
        type: 'tokenIdRange',
        value: { min: 10000, max: 10005 },
        operator: 'range'
      },
      {
        type: 'tokenIdRange',
        value: { min: 15000, max: 15015 },
        operator: 'range'
      },
      {
        type: 'tokenId',
        value: 1123,
        operator: 'equals'
      }
    ],
    displayName: (tokenId: number) => {
      const names: Record<number, string> = {
        10003: 'GLITCH Floppy',
        10004: 'GF Floppy',
        10005: 'Golden Floppy',
        1123: 'CensorPACK'
      };
      return names[tokenId] || `Floppy #${tokenId}`;
    }
  },

  // AdrianGF (262144)
  adrianGF: {
    id: 'adrianGF',
    name: 'AdrianGF',
    description: 'AdrianGF items',
    rules: [
      {
        type: 'tokenId',
        value: 262144,
        operator: 'equals'
      }
    ],
    displayName: () => 'AdrianGF'
  },

  // Serums (262144-262147)
  serum: {
    id: 'serum',
    name: 'Serums',
    description: 'Serums del juego',
    rules: [
      {
        type: 'tokenIdRange',
        value: { min: 262144, max: 262147 },
        operator: 'range'
      }
    ],
    displayName: (tokenId: number) => `Serum #${tokenId - 262143}`
  },

  // AdrianZERO (ERC721)
  adrianZero: {
    id: 'adrianZero',
    name: 'AdrianZERO',
    description: 'NFTs AdrianZERO (ERC721)',
    rules: [
      {
        type: 'tokenType',
        value: 'ERC721',
        operator: 'equals'
      }
    ]
  },

  // Traits (ERC1155 excluyendo floppies y serums)
  traits: {
    id: 'traits',
    name: 'Traits',
    description: 'Traits del juego (ERC1155)',
    rules: [
      {
        type: 'tokenType',
        value: 'ERC1155',
        operator: 'equals'
      }
    ]
  }
};

/**
 * Verificar si un item cumple con una regla de filtro
 */
export function matchesRule(item: GameItem, rule: FilterRule): boolean {
  const tokenId = typeof item.tokenId === 'string' 
    ? parseInt(item.tokenId, 10) 
    : item.tokenId;

  switch (rule.type) {
    case 'tokenId':
      return tokenId === rule.value;

    case 'tokenIdRange':
      if (rule.operator === 'range' && typeof rule.value === 'object') {
        const { min, max } = rule.value;
        return tokenId >= min && tokenId <= max;
      }
      return false;

    case 'tokenType':
      return item.tokenType === rule.value;

    case 'contract':
      return item.contract?.toLowerCase() === rule.value?.toLowerCase();

    case 'custom':
      // Permitir funciones personalizadas
      if (typeof rule.value === 'function') {
        return rule.value(item);
      }
      return false;

    default:
      return false;
  }
}

/**
 * Verificar si un item cumple con todas las reglas de un filtro
 */
export function matchesFilter(item: GameItem, filter: ItemFilterConfig): boolean {
  // Un item debe cumplir con AL MENOS UNA regla (OR lógico entre reglas)
  return filter.rules.some(rule => matchesRule(item, rule));
}

/**
 * Filtrar array de items según un filtro
 */
export function filterItems(items: GameItem[], filterId: string): GameItem[] {
  const filter = ITEM_FILTERS[filterId];
  if (!filter) {
    console.warn(`⚠️ Filtro desconocido: ${filterId}`);
    return items;
  }

  return items.filter(item => matchesFilter(item, filter));
}

/**
 * Obtener estadísticas de items
 */
export function getItemStats(items: GameItem[]): Record<string, number> {
  const stats: Record<string, number> = {
    total: items.length
  };

  Object.keys(ITEM_FILTERS).forEach(filterId => {
    stats[filterId] = filterItems(items, filterId).length;
  });

  return stats;
}

/**
 * Obtener todos los filtros disponibles
 */
export function getAvailableFilters(): ItemFilterConfig[] {
  return Object.values(ITEM_FILTERS);
}

/**
 * Agregar un nuevo filtro dinámicamente
 */
export function addCustomFilter(filter: ItemFilterConfig): void {
  ITEM_FILTERS[filter.id] = filter;
  console.log(`✅ Filtro personalizado agregado: ${filter.id}`);
}



