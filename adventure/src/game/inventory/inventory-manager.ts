/**
 * Gestor de inventario integrado
 * 
 * Este módulo gestiona el inventario del jugador, incluyendo:
 * - Carga de items desde blockchain
 * - Selección de items
 * - Filtrado y categorización
 * - Integración con el sistema de gating
 */

import { loadAllNFTs, GameItem, LoadNFTsOptions } from '../../web3/nft-loader';
import { getBlockchainConfig } from '../../web3/config';
import { filterItems, getItemStats, ITEM_FILTERS } from '../filters/filter-config';
import { checkGatingRule, GatingRule } from '../../web3/gating';

export interface InventoryCategory {
  id: string;
  name: string;
  items: GameItem[];
}

export interface InventoryState {
  allItems: GameItem[];
  selectedItem: GameItem | null;
  categories: InventoryCategory[];
  isLoading: boolean;
  lastLoadedAccount: string | null;
  stats: Record<string, number>;
}

export class InventoryManager {
  private state: InventoryState = {
    allItems: [],
    selectedItem: null,
    categories: [],
    isLoading: false,
    lastLoadedAccount: null,
    stats: {}
  };

  private listeners: Map<string, Set<(state: InventoryState) => void>> = new Map();

  constructor() {
    console.log('📦 InventoryManager inicializado');
  }

  /**
   * Cargar inventario para un usuario
   */
  async loadInventory(
    owner: string,
    options: Partial<LoadNFTsOptions> = {}
  ): Promise<void> {
    // Prevenir múltiples cargas simultáneas
    if (this.state.isLoading) {
      console.log('⚠️ Inventario ya se está cargando, saltando...');
      return;
    }

    // Si es la misma cuenta, no recargar
    if (owner === this.state.lastLoadedAccount && this.state.allItems.length > 0) {
      console.log('ℹ️ Inventario ya cargado para esta cuenta');
      return;
    }

    this.state.isLoading = true;
    this.state.lastLoadedAccount = owner;
    this.notifyListeners('loading', this.state);

    console.log(`📦 Cargando inventario para ${owner}...`);

    try {
      const config = getBlockchainConfig();
      
      const loadOptions: LoadNFTsOptions = {
        owner,
        contractAddresses: [
          config.getContractAddress('ERC721') || '',
          config.getContractAddress('ERC1155') || ''
        ].filter(Boolean),
        ...options
      };

      const result = await loadAllNFTs(
        loadOptions.owner,
        loadOptions.contractAddresses,
        loadOptions.tokenType,
        loadOptions.filterId
      );

      this.state.allItems = result;
      this.updateCategories();
      this.updateStats();

      console.log(`✅ Inventario cargado: ${this.state.allItems.length} items`);

    } catch (error) {
      console.error('❌ Error cargando inventario:', error);
      this.state.allItems = [];
      this.updateCategories();
      this.updateStats();
    } finally {
      this.state.isLoading = false;
      this.notifyListeners('loaded', this.state);
    }
  }

  /**
   * Actualizar categorías de items
   */
  private updateCategories(): void {
    const categories: InventoryCategory[] = [];

    // Crear categoría para cada filtro
    Object.values(ITEM_FILTERS).forEach(filter => {
      const items = filterItems(this.state.allItems, filter.id);
      if (items.length > 0) {
        categories.push({
          id: filter.id,
          name: filter.name,
          items
        });
      }
    });

    // Categoría "Todos"
    categories.unshift({
      id: 'all',
      name: 'Todos',
      items: this.state.allItems
    });

    this.state.categories = categories;
  }

  /**
   * Actualizar estadísticas
   */
  private updateStats(): void {
    this.state.stats = getItemStats(this.state.allItems);
  }

  /**
   * Obtener items por categoría
   */
  getItemsByCategory(categoryId: string): GameItem[] {
    const category = this.state.categories.find(cat => cat.id === categoryId);
    return category?.items || [];
  }

  /**
   * Obtener items por filtro
   */
  getItemsByFilter(filterId: string): GameItem[] {
    return filterItems(this.state.allItems, filterId);
  }

  /**
   * Seleccionar un item
   */
  selectItem(item: GameItem | null): void {
    // Si el item ya está seleccionado, deseleccionarlo
    if (this.state.selectedItem && item && 
        this.state.selectedItem.tokenId === item.tokenId) {
      this.state.selectedItem = null;
    } else {
      this.state.selectedItem = item;
    }

    this.notifyListeners('selection', this.state);
  }

  /**
   * Obtener item seleccionado
   */
  getSelectedItem(): GameItem | null {
    return this.state.selectedItem;
  }

  /**
   * Verificar si un item está seleccionado
   */
  isItemSelected(item: GameItem): boolean {
    if (!this.state.selectedItem) return false;
    
    const selectedId = typeof this.state.selectedItem.tokenId === 'string'
      ? parseInt(this.state.selectedItem.tokenId, 10)
      : this.state.selectedItem.tokenId;
    
    const itemId = typeof item.tokenId === 'string'
      ? parseInt(item.tokenId, 10)
      : item.tokenId;

    return selectedId === itemId;
  }

  /**
   * Limpiar inventario
   */
  clearInventory(): void {
    this.state.allItems = [];
    this.state.selectedItem = null;
    this.state.categories = [];
    this.state.lastLoadedAccount = null;
    this.state.stats = {};
    this.notifyListeners('cleared', this.state);
  }

  /**
   * Obtener estado completo del inventario
   */
  getState(): InventoryState {
    return { ...this.state };
  }

  /**
   * Obtener todos los items
   */
  getAllItems(): GameItem[] {
    return [...this.state.allItems];
  }

  /**
   * Obtener estadísticas
   */
  getStats(): Record<string, number> {
    return { ...this.state.stats };
  }

  /**
   * Obtener categorías
   */
  getCategories(): InventoryCategory[] {
    return [...this.state.categories];
  }

  /**
   * Verificar si el inventario está cargando
   */
  isLoading(): boolean {
    return this.state.isLoading;
  }

  /**
   * Suscribirse a cambios del inventario
   */
  on(event: 'loading' | 'loaded' | 'selection' | 'cleared', callback: (state: InventoryState) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Retornar función para desuscribirse
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * Notificar a los listeners
   */
  private notifyListeners(event: 'loading' | 'loaded' | 'selection' | 'cleared', state: InventoryState): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(state);
        } catch (error) {
          console.error('Error en listener de inventario:', error);
        }
      });
    }
  }

  /**
   * Verificar gating para un item específico
   */
  async checkItemGating(owner: string, item: GameItem): Promise<boolean> {
    const config = getBlockchainConfig();
    
    if (!item.contract) {
      return false;
    }

    const rule: GatingRule = {
      type: item.tokenType || 'ERC1155',
      contractAddress: item.contract,
      tokenId: typeof item.tokenId === 'string' 
        ? parseInt(item.tokenId, 10) 
        : item.tokenId
    };

    const check = await checkGatingRule(owner, rule);
    return check.passed;
  }
}

// Instancia singleton
let inventoryInstance: InventoryManager | null = null;

/**
 * Obtener instancia singleton del gestor de inventario
 */
export function getInventoryManager(): InventoryManager {
  if (!inventoryInstance) {
    inventoryInstance = new InventoryManager();
  }
  return inventoryInstance;
}

export default getInventoryManager();



