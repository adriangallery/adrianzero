/**
 * Cargador de escenas
 * 
 * Carga background, mask, scene.json, y spawns hotspots & triggers
 */

import * as PIXI from 'pixi.js';
import { MaskLoader, MaskMapping } from '../engine/mask-loader';

export interface SceneData {
  version: number;
  id: string;
  title: string;
  assets: {
    background: string;
    walkmask: string;
    atlas?: string | null;
  };
  render: {
    world: { width: number; height: number };
    camera: {
      start: { x: number; y: number };
      followPlayer: boolean;
      lerp: number;
      clampToWorld: boolean;
    };
  };
  player: {
    spawn: { x: number; y: number };
    speed: number;
    sprite: {
      sheet?: string | null;
      idle?: string | null;
      walk?: string | null;
    };
  };
  ui: {
    verbs: string[];
    mobileDrawerDefault: 'collapsed' | 'expanded';
  };
  maskMapping: MaskMapping;
  regions: {
    hotspots: HotspotData[];
    triggers: TriggerData[];
  };
  items?: {
    sceneItems: SceneItemData[];
  };
  combos?: Array<{
    a: string;
    b: string;
    result: string;
    script: ScriptOperation[];
  }>;
  dialogue?: {
    defaultVoice?: string | null;
    lines: Record<string, string>;
  };
  audio?: {
    music?: string | null;
    ambience?: string | null;
    sfx: Record<string, string>;
  };
  transitions?: {
    goto: Array<{
      id: string;
      toScene: string;
      spawn: { x: number; y: number };
    }>;
  };
}

export interface HotspotData {
  id: string;
  maskRegionId: string;
  name: string;
  cursor?: string;
  scripts: Record<string, ScriptOperation[]>;
}

export interface TriggerData {
  id: string;
  maskRegionId: string;
  once: boolean;
  onEnter: ScriptOperation[];
}

export interface SceneItemData {
  id: string;
  name: string;
  icon: string;
  spawn: {
    type: 'hotspot' | 'position' | 'none';
    hotspotId?: string;
    x?: number;
    y?: number;
  };
  pickup: {
    enabled: boolean;
    verb: string;
    onPickup: ScriptOperation[];
  };
}

export interface ScriptOperation {
  op: string;
  [key: string]: any;
}

export class SceneLoader {
  private basePath: string;

  constructor(basePath: string = 'assets/scenes') {
    this.basePath = basePath;
  }

  /**
   * Cargar escena desde JSON
   */
  async loadScene(sceneId: string): Promise<SceneData> {
    const scenePath = `${this.basePath}/${sceneId}/scene.json`;
    
    try {
      const response = await fetch(scenePath);
      if (!response.ok) {
        throw new Error(`Error cargando escena: ${response.statusText}`);
      }

      const data: SceneData = await response.json();
      
      // Validar estructura básica
      if (!data.id || !data.assets || !data.render) {
        throw new Error('Escena inválida: faltan campos requeridos');
      }

      return data;
    } catch (error) {
      console.error(`Error cargando escena ${sceneId}:`, error);
      throw error;
    }
  }

  /**
   * Cargar assets de la escena (background, mask)
   */
  async loadSceneAssets(
    sceneData: SceneData,
    sceneId: string
  ): Promise<{
    background: PIXI.Sprite;
    maskLoader: MaskLoader;
  }> {
    const assetsPath = `${this.basePath}/${sceneId}`;

    // Cargar background
    let background: PIXI.Sprite;
    try {
      const backgroundUrl = `${assetsPath}/${sceneData.assets.background}`;
      const backgroundTexture = await PIXI.Assets.load(backgroundUrl);
      background = new PIXI.Sprite(backgroundTexture);
    } catch (error) {
      console.warn(`⚠️ Error cargando background: ${error}. Usando placeholder.`);
      // Crear placeholder usando la nueva API de PixiJS v8
      const placeholder = new PIXI.Graphics();
      placeholder.rect(0, 0, sceneData.render.world.width, sceneData.render.world.height);
      placeholder.fill({ color: 0x282828 });
      background = placeholder as any;
    }

    // Cargar mask
    const maskLoader = new MaskLoader();
    try {
      const maskUrl = `${assetsPath}/${sceneData.assets.walkmask}`;
      await maskLoader.loadMask(maskUrl);
    } catch (error) {
      console.warn(`⚠️ Error cargando walkmask: ${error}. Creando mask por defecto.`);
      // Crear mask por defecto (todo walkable) usando canvas
      const canvas = document.createElement('canvas');
      canvas.width = sceneData.render.world.width;
      canvas.height = sceneData.render.world.height;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#0000FF'; // Azul = walkable
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Convertir canvas a data URL y cargar
      const dataUrl = canvas.toDataURL('image/png');
      await maskLoader.loadMask(dataUrl);
    }

    // Extraer regiones de la máscara
    maskLoader.extractRegions(sceneData.maskMapping);

    return {
      background,
      maskLoader
    };
  }

  /**
   * Obtener hotspot por ID
   */
  getHotspot(sceneData: SceneData, hotspotId: string): HotspotData | undefined {
    return sceneData.regions.hotspots.find(h => h.id === hotspotId);
  }

  /**
   * Obtener trigger por ID
   */
  getTrigger(sceneData: SceneData, triggerId: string): TriggerData | undefined {
    return sceneData.regions.triggers.find(t => t.id === triggerId);
  }

  /**
   * Obtener item de escena por ID
   */
  getSceneItem(sceneData: SceneData, itemId: string): SceneItemData | undefined {
    return sceneData.items?.sceneItems.find(i => i.id === itemId);
  }

  /**
   * Obtener script para una interacción
   */
  getInteractionScript(
    sceneData: SceneData,
    hotspotId: string,
    verb: string
  ): ScriptOperation[] {
    const hotspot = this.getHotspot(sceneData, hotspotId);
    if (!hotspot) return [];

    return hotspot.scripts[verb] || [];
  }

  /**
   * Obtener combo por items
   */
  getCombo(
    sceneData: SceneData,
    itemA: string,
    itemB: string
  ): SceneData['combos'] extends Array<infer T> ? T | undefined : undefined {
    if (!sceneData.combos) return undefined;

    return sceneData.combos.find(
      combo => 
        (combo.a === itemA && combo.b === itemB) ||
        (combo.a === itemB && combo.b === itemA)
    ) as any;
  }
}

