/**
 * Sistema de input
 * 
 * Maneja mouse + touch (tap, drag pan, pinch opcional)
 */

export interface InputEvent {
  type: 'click' | 'tap' | 'drag' | 'dragStart' | 'dragEnd' | 'move';
  x: number;
  y: number;
  worldX: number;
  worldY: number;
  button?: number;
  touches?: Touch[];
  originalEvent: MouseEvent | TouchEvent;
}

export type InputCallback = (event: InputEvent) => void;

export class InputManager {
  private callbacks: Map<string, Set<InputCallback>> = new Map();
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private lastTouchTime = 0;
  private touchStartDistance = 0;
  private screenToWorld: (x: number, y: number) => { x: number; y: number };

  constructor(
    element: HTMLElement,
    screenToWorld: (x: number, y: number) => { x: number; y: number }
  ) {
    this.screenToWorld = screenToWorld;
    this.setupEventListeners(element);
  }

  /**
   * Configurar event listeners
   */
  private setupEventListeners(element: HTMLElement): void {
    // Mouse events
    element.addEventListener('mousedown', this.handleMouseDown);
    element.addEventListener('mousemove', this.handleMouseMove);
    element.addEventListener('mouseup', this.handleMouseUp);
    element.addEventListener('click', this.handleClick);

    // Touch events
    element.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    element.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    element.addEventListener('touchend', this.handleTouchEnd);
    element.addEventListener('touchcancel', this.handleTouchEnd);

    // Prevenir context menu
    element.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /**
   * Convertir evento a coordenadas
   */
  private getEventCoordinates(e: MouseEvent | TouchEvent): { x: number; y: number } {
    if ('touches' in e && e.touches.length > 0) {
      const touch = e.touches[0];
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    } else {
      const mouseEvent = e as MouseEvent;
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      return {
        x: mouseEvent.clientX - rect.left,
        y: mouseEvent.clientY - rect.top
      };
    }
  }

  /**
   * Emitir evento
   */
  private emit(type: string, event: InputEvent): void {
    const listeners = this.callbacks.get(type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error en callback de input:', error);
        }
      });
    }
  }

  /**
   * Handlers de mouse
   */
  private handleMouseDown = (e: MouseEvent): void => {
    const coords = this.getEventCoordinates(e);
    const world = this.screenToWorld(coords.x, coords.y);

    this.isDragging = true;
    this.dragStartX = coords.x;
    this.dragStartY = coords.y;

    this.emit('dragStart', {
      type: 'dragStart',
      x: coords.x,
      y: coords.y,
      worldX: world.x,
      worldY: world.y,
      button: e.button,
      originalEvent: e
    });
  };

  private handleMouseMove = (e: MouseEvent): void => {
    const coords = this.getEventCoordinates(e);
    const world = this.screenToWorld(coords.x, coords.y);

    if (this.isDragging) {
      this.emit('drag', {
        type: 'drag',
        x: coords.x,
        y: coords.y,
        worldX: world.x,
        worldY: world.y,
        button: e.button,
        originalEvent: e
      });
    } else {
      this.emit('move', {
        type: 'move',
        x: coords.x,
        y: coords.y,
        worldX: world.x,
        worldY: world.y,
        originalEvent: e
      });
    }
  };

  private handleMouseUp = (e: MouseEvent): void => {
    if (this.isDragging) {
      this.isDragging = false;
      const coords = this.getEventCoordinates(e);
      const world = this.screenToWorld(coords.x, coords.y);

      this.emit('dragEnd', {
        type: 'dragEnd',
        x: coords.x,
        y: coords.y,
        worldX: world.x,
        worldY: world.y,
        button: e.button,
        originalEvent: e
      });
    }
  };

  private handleClick = (e: MouseEvent): void => {
    if (!this.isDragging) {
      const coords = this.getEventCoordinates(e);
      const world = this.screenToWorld(coords.x, coords.y);

      this.emit('click', {
        type: 'click',
        x: coords.x,
        y: coords.y,
        worldX: world.x,
        worldY: world.y,
        button: e.button,
        originalEvent: e
      });
    }
  };

  /**
   * Handlers de touch
   */
  private handleTouchStart = (e: TouchEvent): void => {
    if (e.touches.length === 1) {
      const coords = this.getEventCoordinates(e);
      const world = this.screenToWorld(coords.x, coords.y);

      this.isDragging = true;
      this.dragStartX = coords.x;
      this.dragStartY = coords.y;
      this.lastTouchTime = Date.now();

      this.emit('dragStart', {
        type: 'dragStart',
        x: coords.x,
        y: coords.y,
        worldX: world.x,
        worldY: world.y,
        touches: Array.from(e.touches),
        originalEvent: e
      });
    } else if (e.touches.length === 2) {
      // Pinch gesture
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      this.touchStartDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
    }
  };

  private handleTouchMove = (e: TouchEvent): void => {
    if (e.touches.length === 1 && this.isDragging) {
      const coords = this.getEventCoordinates(e);
      const world = this.screenToWorld(coords.x, coords.y);

      // Detectar si es drag o tap
      const dragDistance = Math.hypot(
        coords.x - this.dragStartX,
        coords.y - this.dragStartY
      );

      if (dragDistance > 10) {
        // Es un drag
        this.emit('drag', {
          type: 'drag',
          x: coords.x,
          y: coords.y,
          worldX: world.x,
          worldY: world.y,
          touches: Array.from(e.touches),
          originalEvent: e
        });
      }
    }
  };

  private handleTouchEnd = (e: TouchEvent): void => {
    if (this.isDragging && e.touches.length === 0) {
      this.isDragging = false;
      const coords = this.getEventCoordinates(e);
      const world = this.screenToWorld(coords.x, coords.y);

      // Determinar si fue tap o drag
      const dragDistance = Math.hypot(
        coords.x - this.dragStartX,
        coords.y - this.dragStartY
      );
      const timeSinceStart = Date.now() - this.lastTouchTime;

      if (dragDistance < 10 && timeSinceStart < 300) {
        // Es un tap
        this.emit('tap', {
          type: 'tap',
          x: coords.x,
          y: coords.y,
          worldX: world.x,
          worldY: world.y,
          originalEvent: e
        });
      }

      this.emit('dragEnd', {
        type: 'dragEnd',
        x: coords.x,
        y: coords.y,
        worldX: world.x,
        worldY: world.y,
        originalEvent: e
      });
    }
  };

  /**
   * Suscribirse a eventos
   */
  on(type: string, callback: InputCallback): () => void {
    if (!this.callbacks.has(type)) {
      this.callbacks.set(type, new Set());
    }
    this.callbacks.get(type)!.add(callback);

    // Retornar función para desuscribirse
    return () => {
      this.callbacks.get(type)?.delete(callback);
    };
  }

  /**
   * Desuscribirse de eventos
   */
  off(type: string, callback: InputCallback): void {
    this.callbacks.get(type)?.delete(callback);
  }

  /**
   * Limpiar recursos
   */
  destroy(): void {
    this.callbacks.clear();
  }
}

