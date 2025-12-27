/**
 * Sistema de UI del juego
 * 
 * Maneja bottom bar (desktop) y drawer móvil (mobile)
 */

export interface UIOptions {
  verbs: string[];
  mobileDrawerDefault: 'collapsed' | 'expanded';
  onVerbSelect?: (verbId: string) => void;
  onItemSelect?: (itemId: string | null) => void;
}

export class GameUI {
  private container: HTMLElement;
  private verbBar: HTMLElement | null = null;
  private inventoryBar: HTMLElement | null = null;
  private mobileDrawer: HTMLElement | null = null;
  private isMobile: boolean;
  private selectedVerb: string = 'WALK';
  private selectedItemId: string | null = null;
  private callbacks: {
    onVerbSelect?: (verbId: string) => void;
    onItemSelect?: (itemId: string | null) => void;
  } = {};

  constructor(container: HTMLElement, options: UIOptions) {
    this.container = container;
    this.isMobile = this.detectMobile();
    this.callbacks = {
      onVerbSelect: options.onVerbSelect,
      onItemSelect: options.onItemSelect
    };

    this.createUI(options);
  }

  /**
   * Detectar si es móvil
   */
  private detectMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  }

  /**
   * Crear UI
   */
  private createUI(options: UIOptions): void {
    // Limpiar contenedor
    this.container.innerHTML = '';

    if (this.isMobile) {
      this.createMobileUI(options);
    } else {
      this.createDesktopUI(options);
    }
  }

  /**
   * Crear UI móvil (drawer)
   */
  private createMobileUI(options: UIOptions): void {
    const drawer = document.createElement('div');
    drawer.className = 'game-ui-mobile-drawer';
    drawer.classList.add(options.mobileDrawerDefault);

    // Header del drawer (toggle)
    const header = document.createElement('div');
    header.className = 'drawer-header';
    header.innerHTML = `
      <button class="drawer-toggle">☰</button>
      <span class="drawer-title">Actions</span>
    `;
    header.querySelector('.drawer-toggle')?.addEventListener('click', () => {
      drawer.classList.toggle('collapsed');
    });

    // Contenido del drawer
    const content = document.createElement('div');
    content.className = 'drawer-content';

    // Verbos
    const verbsSection = document.createElement('div');
    verbsSection.className = 'verbs-section';
    verbsSection.innerHTML = '<h3>Verbs</h3>';
    const verbsList = document.createElement('div');
    verbsList.className = 'verbs-list';
    options.verbs.forEach(verbId => {
      const verbBtn = this.createVerbButton(verbId);
      verbsList.appendChild(verbBtn);
    });
    verbsSection.appendChild(verbsList);
    content.appendChild(verbsSection);

    // Inventario
    const inventorySection = document.createElement('div');
    inventorySection.className = 'inventory-section';
    inventorySection.innerHTML = '<h3>Inventory</h3>';
    const inventoryList = document.createElement('div');
    inventoryList.className = 'inventory-list';
    inventoryList.id = 'inventory-list';
    inventorySection.appendChild(inventoryList);
    content.appendChild(inventorySection);

    drawer.appendChild(header);
    drawer.appendChild(content);
    this.container.appendChild(drawer);
    this.mobileDrawer = drawer;
  }

  /**
   * Crear UI desktop (bottom bar)
   */
  private createDesktopUI(options: UIOptions): void {
    // Bottom bar
    const bottomBar = document.createElement('div');
    bottomBar.className = 'game-ui-bottom-bar';

    // Verbos (izquierda)
    const verbBar = document.createElement('div');
    verbBar.className = 'verb-bar';
    options.verbs.forEach(verbId => {
      const verbBtn = this.createVerbButton(verbId);
      verbBar.appendChild(verbBtn);
    });
    bottomBar.appendChild(verbBar);

    // Inventario (derecha)
    const inventoryBar = document.createElement('div');
    inventoryBar.className = 'inventory-bar';
    inventoryBar.id = 'inventory-bar';
    bottomBar.appendChild(inventoryBar);

    this.container.appendChild(bottomBar);
    this.verbBar = verbBar;
    this.inventoryBar = inventoryBar;
  }

  /**
   * Crear botón de verbo
   */
  private createVerbButton(verbId: string): HTMLElement {
    const button = document.createElement('button');
    button.className = 'verb-button';
    button.dataset.verbId = verbId;
    button.textContent = verbId;
    
    if (verbId === this.selectedVerb) {
      button.classList.add('active');
    }

    button.addEventListener('click', () => {
      this.selectVerb(verbId);
    });

    return button;
  }

  /**
   * Seleccionar verbo
   */
  selectVerb(verbId: string): void {
    this.selectedVerb = verbId;

    // Actualizar UI
    this.container.querySelectorAll('.verb-button').forEach(btn => {
      if (btn instanceof HTMLElement && btn.dataset.verbId === verbId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Callback
    this.callbacks.onVerbSelect?.(verbId);
  }

  /**
   * Seleccionar item
   */
  selectItem(itemId: string | null): void {
    this.selectedItemId = itemId;

    // Actualizar UI
    this.container.querySelectorAll('.inventory-item').forEach(item => {
      if (item instanceof HTMLElement && item.dataset.itemId === itemId) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });

    // Callback
    this.callbacks.onItemSelect?.(itemId);
  }

  /**
   * Actualizar inventario
   */
  updateInventory(items: Array<{ id: string; name: string; icon?: string }>): void {
    const inventoryContainer = this.isMobile
      ? this.container.querySelector('#inventory-list')
      : this.container.querySelector('#inventory-bar');

    if (!inventoryContainer) return;

    inventoryContainer.innerHTML = '';

    items.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.className = 'inventory-item';
      itemElement.dataset.itemId = item.id;
      
      if (item.icon) {
        const img = document.createElement('img');
        img.src = item.icon;
        img.alt = item.name;
        itemElement.appendChild(img);
      }
      
      const label = document.createElement('span');
      label.textContent = item.name;
      itemElement.appendChild(label);

      itemElement.addEventListener('click', () => {
        this.selectItem(item.id);
      });

      inventoryContainer.appendChild(itemElement);
    });
  }

  /**
   * Obtener verbo seleccionado
   */
  getSelectedVerb(): string {
    return this.selectedVerb;
  }

  /**
   * Obtener item seleccionado
   */
  getSelectedItem(): string | null {
    return this.selectedItemId;
  }

  /**
   * Limpiar selección de item
   */
  clearItemSelection(): void {
    this.selectItem(null);
  }

  /**
   * Toggle drawer móvil
   */
  toggleMobileDrawer(): void {
    if (this.mobileDrawer) {
      this.mobileDrawer.classList.toggle('collapsed');
    }
  }

  /**
   * Limpiar UI
   */
  destroy(): void {
    this.container.innerHTML = '';
  }
}

