/**
 * Motor de renderizado con PixiJS
 * 
 * Maneja la inicialización de PixiJS, resize handling, y DPR scaling
 */

import * as PIXI from 'pixi.js';

export interface RendererConfig {
  width: number;
  height: number;
  backgroundColor?: number;
  resolution?: number;
  antialias?: boolean;
  autoDensity?: boolean;
}

export class GameRenderer {
  public app: PIXI.Application;
  public stage: PIXI.Container;
  public worldContainer: PIXI.Container;
  public uiContainer: PIXI.Container;
  
  private config: RendererConfig;
  private resizeObserver?: ResizeObserver;

  constructor(config: RendererConfig) {
    this.config = {
      backgroundColor: 0x000000,
      resolution: window.devicePixelRatio || 1,
      antialias: true,
      autoDensity: true,
      ...config
    };

    // No inicializar app aquí, se hará en init()
    this.app = {} as PIXI.Application;
    this.stage = {} as PIXI.Container;
    
    // Contenedores principales (se inicializarán en init)
    this.worldContainer = new PIXI.Container();
    this.uiContainer = new PIXI.Container();
  }

  /**
   * Inicializar el renderer
   */
  async init(canvas?: HTMLCanvasElement): Promise<void> {
    // Crear y inicializar la aplicación
    this.app = new PIXI.Application();
    
    await this.app.init({
      width: this.config.width,
      height: this.config.height,
      backgroundColor: this.config.backgroundColor,
      resolution: this.config.resolution,
      antialias: this.config.antialias,
      autoDensity: this.config.autoDensity,
      canvas: canvas || undefined
    });

    // Obtener stage después de inicializar
    this.stage = this.app.stage;
    
    // Agregar contenedores al stage
    this.stage.addChild(this.worldContainer);
    this.stage.addChild(this.uiContainer);

    // Configurar contenedores
    this.worldContainer.sortableChildren = true;
    this.uiContainer.sortableChildren = true;
    this.uiContainer.zIndex = 1000; // UI siempre encima

    // Asegurar que el canvas tenga estilo
    if (this.app.canvas) {
      this.app.canvas.style.display = 'block';
      this.app.canvas.style.position = 'absolute';
      this.app.canvas.style.top = '0';
      this.app.canvas.style.left = '0';
    }

    // Setup resize handling
    this.setupResizeHandling();
  }

  /**
   * Configurar manejo de resize
   */
  private setupResizeHandling(): void {
    const handleResize = () => {
      const container = this.app.canvas.parentElement;
      if (!container) return;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Mantener aspect ratio si es necesario
      const aspectRatio = this.config.width / this.config.height;
      let width = containerWidth;
      let height = containerHeight;

      if (width / height > aspectRatio) {
        width = height * aspectRatio;
      } else {
        height = width / aspectRatio;
      }

      this.app.renderer.resize(width, height);
      
      // Escalar contenedores para mantener resolución lógica
      const scaleX = width / this.config.width;
      const scaleY = height / this.config.height;
      const scale = Math.min(scaleX, scaleY);

      this.stage.scale.set(scale);
    };

    // Resize inicial
    handleResize();

    // Listeners de resize
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // ResizeObserver para cambios en el contenedor
    const container = this.app.canvas.parentElement;
    if (container && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(handleResize);
      this.resizeObserver.observe(container);
    }
  }

  /**
   * Obtener viewport actual
   */
  getViewport(): { width: number; height: number } {
    return {
      width: this.app.screen.width,
      height: this.app.screen.height
    };
  }

  /**
   * Obtener escala actual
   */
  getScale(): number {
    return this.stage.scale.x;
  }

  /**
   * Limpiar recursos
   */
  destroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('orientationchange', this.handleResize);

    this.app.destroy(true, {
      children: true,
      texture: true,
      baseTexture: true
    });
  }

  private handleResize = () => {
    // Handler para cleanup
  };
}

