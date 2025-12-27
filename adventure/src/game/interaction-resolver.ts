/**
 * Resolvedor de interacciones
 * 
 * Resuelve verb + selected item + hotspot -> action script
 */

import { VerbSystem } from './verb-system';
import { SceneLoader, HotspotData, ScriptOperation } from './scene-loader';
import { ScriptEngine, GameState } from './script-engine';
import { MaskLoader } from '../engine/mask-loader';

export interface InteractionContext {
  verb: string;
  selectedItemId: string | null;
  hotspot: HotspotData | null;
  worldX: number;
  worldY: number;
  gameState: GameState;
}

export class InteractionResolver {
  private verbSystem: VerbSystem;
  private sceneLoader: SceneLoader;
  private scriptEngine: ScriptEngine;
  private currentSceneData: any;

  constructor(
    verbSystem: VerbSystem,
    sceneLoader: SceneLoader,
    scriptEngine: ScriptEngine
  ) {
    this.verbSystem = verbSystem;
    this.sceneLoader = sceneLoader;
    this.scriptEngine = scriptEngine;
  }

  /**
   * Establecer datos de la escena actual
   */
  setSceneData(sceneData: any): void {
    this.currentSceneData = sceneData;
  }

  /**
   * Resolver interacción
   */
  async resolveInteraction(context: InteractionContext): Promise<void> {
    const { verb, selectedItemId, hotspot, worldX, worldY, gameState } = context;

    // Si es verbo de movimiento y no hay hotspot, manejar movimiento
    if (this.verbSystem.isMovementVerb() && !hotspot) {
      // El movimiento se maneja en otro lugar
      return;
    }

    // Si hay hotspot, resolver interacción
    if (hotspot) {
      await this.resolveHotspotInteraction(hotspot, verb, selectedItemId, gameState);
      return;
    }

    // Si hay item seleccionado pero no hotspot, verificar si es combo
    if (selectedItemId && !hotspot) {
      // Los combos se manejan en otro lugar (inventario)
      return;
    }

    // Fallback: usar script por defecto
    const fallbackScript = this.verbSystem.getFallbackScript();
    if (fallbackScript.length > 0) {
      await this.scriptEngine.execute(fallbackScript);
    }
  }

  /**
   * Resolver interacción con hotspot
   */
  private async resolveHotspotInteraction(
    hotspot: HotspotData,
    verb: string,
    selectedItemId: string | null,
    gameState: GameState
  ): Promise<void> {
    // Si hay item seleccionado, verificar si hay script específico para item+hotspot
    if (selectedItemId) {
      // TODO: Implementar lógica para item+hotspot si es necesario
      // Por ahora, usar el script del verbo normal
    }

    // Obtener script del verbo
    let script: ScriptOperation[] = [];

    if (this.currentSceneData) {
      script = this.sceneLoader.getInteractionScript(
        this.currentSceneData,
        hotspot.id,
        verb
      );
    } else {
      // Fallback: usar scripts del hotspot directamente
      script = hotspot.scripts[verb] || [];
    }

    // Si no hay script, usar fallback
    if (script.length === 0) {
      script = this.verbSystem.getFallbackScript();
    }

    // Ejecutar script
    if (script.length > 0) {
      await this.scriptEngine.execute(script);
    }
  }

  /**
   * Resolver interacción con trigger
   */
  async resolveTriggerInteraction(
    triggerId: string,
    gameState: GameState
  ): Promise<void> {
    if (!this.currentSceneData) return;

    const trigger = this.sceneLoader.getTrigger(this.currentSceneData, triggerId);
    if (!trigger) return;

    // Verificar si el trigger ya se ejecutó (si es once)
    if (trigger.once) {
      const flagKey = `trigger_${triggerId}_executed`;
      if (gameState.flags[flagKey]) {
        return; // Ya se ejecutó
      }

      // Marcar como ejecutado
      // Esto se hace en el script engine con setFlag
    }

    // Ejecutar script del trigger
    if (trigger.onEnter && trigger.onEnter.length > 0) {
      await this.scriptEngine.execute(trigger.onEnter);
    }
  }

  /**
   * Verificar si una posición es walkable
   */
  isWalkable(
    x: number,
    y: number,
    maskLoader: MaskLoader,
    maskMapping: any
  ): boolean {
    return maskLoader.isWalkable(x, y, maskMapping);
  }

  /**
   * Obtener hotspot en una posición
   */
  getHotspotAt(
    x: number,
    y: number,
    maskLoader: MaskLoader,
    maskMapping: any,
    sceneData: any
  ): HotspotData | null {
    const region = maskLoader.getRegionAt(x, y, maskMapping);
    if (!region) return null;

    // Buscar hotspot que coincida con el maskRegionId
    const hotspot = sceneData.regions.hotspots.find(
      (h: HotspotData) => h.maskRegionId === region.id
    );

    return hotspot || null;
  }

  /**
   * Obtener trigger en una posición
   */
  getTriggerAt(
    x: number,
    y: number,
    maskLoader: MaskLoader,
    maskMapping: any,
    sceneData: any
  ): any | null {
    const region = maskLoader.getRegionAt(x, y, maskMapping);
    if (!region) return null;

    // Buscar trigger que coincida con el maskRegionId
    const trigger = sceneData.regions.triggers.find(
      (t: any) => t.maskRegionId === region.id
    );

    return trigger || null;
  }
}

