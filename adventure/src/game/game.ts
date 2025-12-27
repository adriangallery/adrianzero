/**
 * Motor principal del juego
 * 
 * Integra todos los sistemas: renderer, camera, input, scenes, scripts, etc.
 */

import { GameRenderer } from '../engine/renderer';
import { Camera } from '../engine/camera';
import { InputManager, InputEvent } from '../engine/input';
import { MaskLoader } from '../engine/mask-loader';
import { SceneLoader, SceneData } from './scene-loader';
import { ScriptEngine, GameState, ScriptContext } from './script-engine';
import { VerbSystem, Verb, VerbRules } from './verb-system';
import { InteractionResolver } from './interaction-resolver';
import { GameUI } from '../ui/game-ui';
import { getSaveLoadManager } from './save-load';
import { getInventoryManager } from './inventory/inventory-manager';
import * as PIXI from 'pixi.js';

export interface GameConfig {
  container: HTMLElement;
  initialSceneId?: string;
  verbs?: Verb[];
  verbRules?: VerbRules;
}

export class Game {
  private renderer: GameRenderer;
  private camera: Camera;
  private input: InputManager;
  private sceneLoader: SceneLoader;
  private scriptEngine: ScriptEngine;
  private verbSystem: VerbSystem;
  private interactionResolver: InteractionResolver;
  private ui: GameUI;
  private saveLoadManager = getSaveLoadManager();
  private inventoryManager = getInventoryManager();

  private currentSceneData: SceneData | null = null;
  private maskLoader: MaskLoader | null = null;
  private gameState: GameState;
  private player: { x: number; y: number; targetX?: number; targetY?: number; speed: number } = {
    x: 0,
    y: 0,
    speed: 280
  };
  private backgroundSprite: PIXI.Sprite | null = null;
  private isRunning = false;
  private lastTime = 0;

  constructor(config: GameConfig) {
    // Inicializar game state
    this.gameState = this.loadOrCreateState(config.initialSceneId || 'suburban_street');

    // Inicializar renderer
    this.renderer = new GameRenderer({
      width: window.innerWidth,
      height: window.innerHeight
    });

    // Inicializar sistemas
    this.sceneLoader = new SceneLoader();
    this.verbSystem = new VerbSystem(
      config.verbs || this.getDefaultVerbs(),
      config.verbRules || this.getDefaultVerbRules()
    );
    
    // Crear script context
    const scriptContext: ScriptContext = {
      state: this.gameState,
      setState: (updater) => {
        this.gameState = updater(this.gameState);
      },
      say: (text) => {
        this.showDialogue(text);
      },
      gotoScene: (sceneId, spawn) => {
        this.changeScene(sceneId, spawn);
      },
      checkWeb3: async () => {
        return this.gameState.web3.connected;
      },
      checkERC721: async (contract, minBalance) => {
        // TODO: Implementar verificación ERC721
        return false;
      },
      checkERC20: async (contract, minBalance) => {
        // TODO: Implementar verificación ERC20
        return false;
      }
    };

    this.scriptEngine = new ScriptEngine(scriptContext);
    this.interactionResolver = new InteractionResolver(
      this.verbSystem,
      this.sceneLoader,
      this.scriptEngine
    );

    // Inicializar cámara (se actualizará cuando se cargue la escena)
    this.camera = new Camera({
      startX: 0,
      startY: 0,
      followPlayer: true,
      lerp: 0.12,
      clampToWorld: true,
      worldWidth: 2400,
      worldHeight: 1350,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    });

    // Input se inicializará después de que el renderer esté listo
    this.input = null as any;

    // Inicializar UI
    this.ui = new GameUI(config.container, {
      verbs: this.verbSystem.getAllVerbs().map(v => v.id),
      mobileDrawerDefault: 'collapsed',
      onVerbSelect: (verbId) => {
        this.verbSystem.selectVerb(verbId);
        this.gameState.ui.selectedVerb = verbId;
      },
      onItemSelect: (itemId) => {
        this.gameState.ui.selectedItemId = itemId;
      }
    });

    // Setup event listeners se hará después de inicializar el input
  }

  /**
   * Inicializar el juego
   */
  async init(): Promise<void> {
    // Inicializar renderer
    await this.renderer.init();
    this.renderer.app.canvas.style.width = '100%';
    this.renderer.app.canvas.style.height = '100%';
    
    // Agregar canvas al contenedor
    const canvasContainer = document.getElementById('game-canvas-container');
    if (canvasContainer && !canvasContainer.contains(this.renderer.app.canvas)) {
      canvasContainer.appendChild(this.renderer.app.canvas);
    }

    // Inicializar input después de que el canvas esté listo
    this.input = new InputManager(
      this.renderer.app.canvas,
      (x, y) => this.camera.screenToWorld(x, y)
    );
    
    // Re-setup event listeners con el input inicializado
    this.setupEventListeners();

    // Cargar escena inicial
    await this.changeScene(this.gameState.currentSceneId);

    // Iniciar loop usando el ticker de PixiJS
    this.isRunning = true;
    this.lastTime = performance.now();
    
    // Usar el ticker de PixiJS para el game loop
    this.renderer.app.ticker.add((ticker) => {
      if (!this.isRunning) return;
      const deltaTime = ticker.deltaTime * 16.67; // Convertir a ms
      this.update(deltaTime);
      this.render();
    });
    
    console.log('✅ Game loop iniciado');
  }

  // Game loop ahora usa PixiJS ticker (ver init())

  /**
   * Update
   */
  private update(deltaTime: number): void {
    // Update player movement
    if (this.player.targetX !== undefined && this.player.targetY !== undefined) {
      const dx = this.player.targetX - this.player.x;
      const dy = this.player.targetY - this.player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 5) {
        const moveDistance = (this.player.speed * deltaTime) / 1000;
        const ratio = Math.min(1, moveDistance / distance);
        this.player.x += dx * ratio;
        this.player.y += dy * ratio;
      } else {
        this.player.x = this.player.targetX;
        this.player.y = this.player.targetY;
        this.player.targetX = undefined;
        this.player.targetY = undefined;
      }
    }

    // Update camera
    this.camera.setFollowTarget(this.player);
    this.camera.update(deltaTime);

    // Update game state
    this.gameState.player.x = this.player.x;
    this.gameState.player.y = this.player.y;
  }

  /**
   * Render
   */
  private render(): void {
    // Aplicar cámara al contenedor del mundo
    if (this.camera && this.renderer.worldContainer) {
      this.camera.applyToContainer(this.renderer.worldContainer);
    }
    // PixiJS renderiza automáticamente con el ticker
  }

  /**
   * Cambiar de escena
   */
  async changeScene(sceneId: string, spawn?: { x: number; y: number }): Promise<void> {
    try {
      // Cargar datos de la escena
      const sceneData = await this.sceneLoader.loadScene(sceneId);
      this.currentSceneData = sceneData;
      this.interactionResolver.setSceneData(sceneData);

      // Cargar assets
      const { background, maskLoader } = await this.sceneLoader.loadSceneAssets(sceneData, sceneId);
      this.maskLoader = maskLoader;

      // Limpiar contenedor del mundo
      this.renderer.worldContainer.removeChildren();

      // Agregar background
      this.backgroundSprite = background;
      this.renderer.worldContainer.addChild(background);

      // Si no hay background válido, crear uno temporal
      if (!background || (!(background as any).texture && !(background as any).geometry)) {
        console.warn('⚠️ Background no cargado, creando placeholder');
        const placeholder = new PIXI.Graphics();
        placeholder.rect(0, 0, sceneData.render.world.width, sceneData.render.world.height);
        placeholder.fill({ color: 0x282828 }); // Gris oscuro
        
        // Agregar texto
        const text = new PIXI.Text({
          text: `${sceneData.title}\n(Placeholder - Agrega background.png)`,
          style: {
            fontFamily: 'monospace',
            fontSize: 32,
            fill: 0x00ff00,
            align: 'center'
          }
        });
        text.anchor.set(0.5);
        text.x = sceneData.render.world.width / 2;
        text.y = sceneData.render.world.height / 2;
        placeholder.addChild(text);
        
        this.renderer.worldContainer.addChild(placeholder);
        this.backgroundSprite = placeholder as any;
      }

      // Actualizar cámara
      this.camera.updateConfig({
        startX: sceneData.render.camera.start.x,
        startY: sceneData.render.camera.start.y,
        followPlayer: sceneData.render.camera.followPlayer,
        lerp: sceneData.render.camera.lerp,
        clampToWorld: sceneData.render.camera.clampToWorld,
        worldWidth: sceneData.render.world.width,
        worldHeight: sceneData.render.world.height,
        viewportWidth: this.renderer.getViewport().width,
        viewportHeight: this.renderer.getViewport().height
      });

      // Spawn player
      const spawnPos = spawn || sceneData.player.spawn;
      this.player.x = spawnPos.x;
      this.player.y = spawnPos.y;
      this.player.speed = sceneData.player.speed;

      // Actualizar game state
      this.gameState.currentSceneId = sceneId;

      // Actualizar UI
      this.ui.updateInventory(
        this.gameState.inventory.map(id => ({
          id,
          name: id,
          icon: undefined
        }))
      );

      console.log(`✅ Escena cargada: ${sceneId}`);
    } catch (error) {
      console.error(`❌ Error cargando escena ${sceneId}:`, error);
      // Crear escena de fallback
      this.createFallbackScene();
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (!this.input) return;
    
    // Input events
    this.input.on('click', (event) => this.handleClick(event));
    this.input.on('tap', (event) => this.handleClick(event));
  }

  /**
   * Handle click/tap
   */
  private async handleClick(event: InputEvent): Promise<void> {
    if (!this.currentSceneData || !this.maskLoader) return;

    const { worldX, worldY } = event;
    const selectedVerb = this.verbSystem.getSelectedVerb();

    // Si es verbo de movimiento
    if (selectedVerb?.isMovement) {
      // Verificar si es walkable
      if (this.maskLoader.isWalkable(worldX, worldY, this.currentSceneData.maskMapping)) {
        this.player.targetX = worldX;
        this.player.targetY = worldY;
        return;
      }
    }

    // Buscar hotspot
    const hotspot = this.interactionResolver.getHotspotAt(
      worldX,
      worldY,
      this.maskLoader,
      this.currentSceneData.maskMapping,
      this.currentSceneData
    );

    if (hotspot) {
      await this.interactionResolver.resolveInteraction({
        verb: selectedVerb?.id || 'LOOK',
        selectedItemId: this.gameState.ui.selectedItemId,
        hotspot,
        worldX,
        worldY,
        gameState: this.gameState
      });
      return;
    }

    // Buscar trigger
    const trigger = this.interactionResolver.getTriggerAt(
      worldX,
      worldY,
      this.maskLoader,
      this.currentSceneData.maskMapping,
      this.currentSceneData
    );

    if (trigger) {
      await this.interactionResolver.resolveTriggerInteraction(trigger.id, this.gameState);
    }
  }

  /**
   * Mostrar diálogo
   */
  private showDialogue(text: string): void {
    // Crear elemento de diálogo si no existe
    let dialogueEl = document.getElementById('game-dialogue');
    if (!dialogueEl) {
      dialogueEl = document.createElement('div');
      dialogueEl.id = 'game-dialogue';
      dialogueEl.className = 'game-dialogue';
      document.body.appendChild(dialogueEl);
    }

    dialogueEl.textContent = text;
    dialogueEl.style.display = 'block';

    // Auto-ocultar después de 3 segundos
    setTimeout(() => {
      if (dialogueEl) {
        dialogueEl.style.display = 'none';
      }
    }, 3000);
  }

  /**
   * Guardar juego
   */
  save(): boolean {
    return this.saveLoadManager.save(this.gameState);
  }

  /**
   * Cargar juego
   */
  load(): boolean {
    const state = this.saveLoadManager.load();
    if (state) {
      this.gameState = state;
      this.changeScene(state.currentSceneId, state.player);
      return true;
    }
    return false;
  }

  /**
   * Obtener verbos por defecto
   */
  private getDefaultVerbs(): Verb[] {
    return [
      { id: 'WALK', label: 'Walk', isMovement: true, priority: 0, mobileQuickSlot: true },
      { id: 'LOOK', label: 'Look', isMovement: false, priority: 10, mobileQuickSlot: true },
      { id: 'USE', label: 'Use', isMovement: false, priority: 20, mobileQuickSlot: true },
      { id: 'TALK', label: 'Talk', isMovement: false, priority: 30, mobileQuickSlot: false },
      { id: 'PICK', label: 'Pick', isMovement: false, priority: 40, mobileQuickSlot: false },
      { id: 'OPEN', label: 'Open', isMovement: false, priority: 50, mobileQuickSlot: false },
      { id: 'CLOSE', label: 'Close', isMovement: false, priority: 60, mobileQuickSlot: false }
    ];
  }

  /**
   * Obtener reglas de verbos por defecto
   */
  private getDefaultVerbRules(): VerbRules {
    return {
      tapHotspotWhenWalkSelected: 'moveToAndInteract',
      tapEmptyWhenVerbSelected: 'moveIfWalkableElsePan',
      inventoryUseMode: 'itemOnHotspot',
      interactionFallback: {
        onMissingVerbScript: [
          { op: 'say', text: "That doesn't do anything." }
        ]
      }
    };
  }

  /**
   * Cargar o crear estado inicial
   */
  private loadOrCreateState(initialSceneId: string): GameState {
    const saved = this.saveLoadManager.load();
    if (saved) {
      return saved;
    }

    return {
      currentSceneId: initialSceneId,
      player: { x: 520, y: 1040 },
      ui: {
        selectedVerb: 'WALK',
        selectedItemId: null,
        mobileDrawer: 'collapsed'
      },
      inventory: [],
      flags: {},
      web3: {
        connected: false,
        address: null,
        chainId: null
      }
    };
  }

  /**
   * Crear escena de fallback
   */
  private createFallbackScene(): void {
    // Limpiar contenedor
    this.renderer.worldContainer.removeChildren();

    // Crear fondo simple usando nueva API de PixiJS v8
    const bg = new PIXI.Graphics();
    bg.rect(0, 0, 2400, 1350);
    bg.fill({ color: 0x1a1a1a });

    // Agregar texto
    const text = new PIXI.Text({
      text: 'AdrianAdventure\n\nEscena no disponible\n\nAgrega assets/scenes/suburban_street/background.png\ny assets/scenes/suburban_street/walkmask.png',
      style: {
        fontFamily: 'monospace',
        fontSize: 24,
        fill: 0x00ff00,
        align: 'center'
      }
    });
    text.anchor.set(0.5);
    text.x = 1200;
    text.y = 675;

    bg.addChild(text);
    this.renderer.worldContainer.addChild(bg);
    this.backgroundSprite = bg as any;

    // Player en el centro
    this.player.x = 1200;
    this.player.y = 675;
  }

  /**
   * Destruir juego
   */
  destroy(): void {
    this.isRunning = false;
    if (this.input) {
      this.input.destroy();
    }
    this.renderer.destroy();
    if (this.maskLoader) {
      this.maskLoader.destroy();
    }
  }
}

