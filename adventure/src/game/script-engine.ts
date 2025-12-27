/**
 * Motor de scripts (opcodes)
 * 
 * Ejecuta operaciones de script definidas en scene.json
 */

import { ScriptOperation } from './scene-loader';
import { getInventoryManager } from './inventory/inventory-manager';

export interface GameState {
  currentSceneId: string;
  player: {
    x: number;
    y: number;
  };
  ui: {
    selectedVerb: string;
    selectedItemId: string | null;
    mobileDrawer: 'collapsed' | 'expanded';
  };
  inventory: string[];
  flags: Record<string, boolean | number | string | null>;
  web3: {
    connected: boolean;
    address: string | null;
    chainId: number | null;
  };
}

export interface ScriptContext {
  state: GameState;
  setState: (updater: (state: GameState) => GameState) => void;
  say: (text: string) => void;
  gotoScene: (sceneId: string, spawn: { x: number; y: number }) => void;
  checkWeb3: () => Promise<boolean>;
  checkERC721: (contract: string, minBalance: number) => Promise<boolean>;
  checkERC20: (contract: string, minBalance: string) => Promise<boolean>;
}

export class ScriptEngine {
  private context: ScriptContext;
  private opHandlers: Map<string, (op: ScriptOperation, context: ScriptContext) => Promise<void> | void> = new Map();

  constructor(context: ScriptContext) {
    this.context = context;
    this.registerDefaultOps();
  }

  /**
   * Registrar operaciones por defecto
   */
  private registerDefaultOps(): void {
    // say
    this.registerOp('say', async (op, ctx) => {
      ctx.say(op.text);
    });

    // setFlag
    this.registerOp('setFlag', async (op, ctx) => {
      ctx.setState(state => ({
        ...state,
        flags: {
          ...state.flags,
          [op.flag]: op.value
        }
      }));
    });

    // ifFlag
    this.registerOp('ifFlag', async (op, ctx) => {
      const flagValue = ctx.state.flags[op.flag];
      const isTruthy = flagValue !== false && flagValue !== null && flagValue !== 0 && flagValue !== '';
      
      const script = isTruthy ? op.then : op.else;
      if (script && script.length > 0) {
        await this.execute(script, ctx);
      }
    });

    // addItem
    this.registerOp('addItem', async (op, ctx) => {
      const inventory = getInventoryManager();
      // TODO: Agregar item al inventario del juego
      ctx.setState(state => ({
        ...state,
        inventory: state.inventory.includes(op.itemId)
          ? state.inventory
          : [...state.inventory, op.itemId]
      }));
    });

    // removeItem
    this.registerOp('removeItem', async (op, ctx) => {
      ctx.setState(state => ({
        ...state,
        inventory: state.inventory.filter(id => id !== op.itemId)
      }));
    });

    // selectVerb
    this.registerOp('selectVerb', async (op, ctx) => {
      ctx.setState(state => ({
        ...state,
        ui: {
          ...state.ui,
          selectedVerb: op.verbId
        }
      }));
    });

    // selectItem
    this.registerOp('selectItem', async (op, ctx) => {
      ctx.setState(state => ({
        ...state,
        ui: {
          ...state.ui,
          selectedItemId: op.itemId
        }
      }));
    });

    // clearSelection
    this.registerOp('clearSelection', async (op, ctx) => {
      ctx.setState(state => ({
        ...state,
        ui: {
          ...state.ui,
          selectedVerb: 'WALK',
          selectedItemId: null
        }
      }));
    });

    // gotoScene
    this.registerOp('gotoScene', async (op, ctx) => {
      ctx.gotoScene(op.sceneId, op.spawn);
    });

    // ifItemSelected
    this.registerOp('ifItemSelected', async (op, ctx) => {
      const isSelected = ctx.state.ui.selectedItemId === op.itemId;
      const script = isSelected ? op.then : op.else;
      if (script && script.length > 0) {
        await this.execute(script, ctx);
      }
    });

    // requireItem
    this.registerOp('requireItem', async (op, ctx) => {
      if (!ctx.state.inventory.includes(op.itemId)) {
        if (op.onFail && op.onFail.length > 0) {
          await this.execute(op.onFail, ctx);
        }
        return; // Detener ejecución
      }
    });

    // ifWeb3Connected
    this.registerOp('ifWeb3Connected', async (op, ctx) => {
      const isConnected = await ctx.checkWeb3();
      const script = isConnected ? op.then : op.else;
      if (script && script.length > 0) {
        await this.execute(script, ctx);
      }
    });

    // web3Require
    this.registerOp('web3Require', async (op, ctx) => {
      const isConnected = await ctx.checkWeb3();
      if (!isConnected) {
        if (op.onFail && op.onFail.length > 0) {
          await this.execute(op.onFail, ctx);
        }
        return; // Detener ejecución
      }
    });

    // web3CheckERC721
    this.registerOp('web3CheckERC721', async (op, ctx) => {
      try {
        const hasBalance = await ctx.checkERC721(op.contract, op.minBalance);
        ctx.setState(state => ({
          ...state,
          flags: {
            ...state.flags,
            [op.setFlag]: hasBalance
          }
        }));
      } catch (error) {
        if (op.onError && op.onError.length > 0) {
          await this.execute(op.onError, ctx);
        }
      }
    });

    // web3CheckERC20
    this.registerOp('web3CheckERC20', async (op, ctx) => {
      try {
        const hasBalance = await ctx.checkERC20(op.contract, op.minBalance);
        ctx.setState(state => ({
          ...state,
          flags: {
            ...state.flags,
            [op.setFlag]: hasBalance
          }
        }));
      } catch (error) {
        if (op.onError && op.onError.length > 0) {
          await this.execute(op.onError, ctx);
        }
      }
    });

    // stop
    this.registerOp('stop', async (op, ctx) => {
      // No hacer nada, el motor detendrá la ejecución
    });
  }

  /**
   * Registrar una operación personalizada
   */
  registerOp(
    opName: string,
    handler: (op: ScriptOperation, context: ScriptContext) => Promise<void> | void
  ): void {
    this.opHandlers.set(opName, handler);
  }

  /**
   * Ejecutar un script
   */
  async execute(script: ScriptOperation[], context?: ScriptContext): Promise<void> {
    const ctx = context || this.context;
    let shouldStop = false;

    for (const op of script) {
      if (shouldStop) break;

      const handler = this.opHandlers.get(op.op);
      if (!handler) {
        console.warn(`⚠️ Operación desconocida: ${op.op}`);
        continue;
      }

      try {
        await handler(op, ctx);
        
        // Detener si la operación es 'stop'
        if (op.op === 'stop') {
          shouldStop = true;
        }
      } catch (error) {
        console.error(`❌ Error ejecutando operación ${op.op}:`, error);
        // Continuar con la siguiente operación
      }
    }
  }
}

