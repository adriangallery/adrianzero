/**
 * Cargador y procesador de máscaras
 * 
 * Carga PNG de máscaras, lee colores de píxeles, y proporciona funciones helper
 */

import * as PIXI from 'pixi.js';

export interface MaskRegion {
  id: string;
  color: string;
  bounds: { x: number; y: number; width: number; height: number };
  centroid: { x: number; y: number };
  pixels: Array<{ x: number; y: number }>;
}

export interface MaskMapping {
  walkableColor: string;
  hotspotColor: string;
  triggerColor: string;
  blockedColor?: string;
  regionIdStrategy: 'manual' | 'auto';
}

export class MaskLoader {
  private maskTexture: PIXI.Texture | null = null;
  private maskImageData: ImageData | null = null;
  private regions: Map<string, MaskRegion> = new Map();

  /**
   * Cargar máscara desde URL
   */
  async loadMask(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          // Crear texture de PixiJS
          this.maskTexture = PIXI.Texture.from(img);

          // Crear ImageData para lectura de píxeles
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('No se pudo obtener contexto 2D'));
            return;
          }

          ctx.drawImage(img, 0, 0);
          this.maskImageData = ctx.getImageData(0, 0, img.width, img.height);
          
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = (error) => {
        reject(new Error(`Error cargando máscara desde ${url}: ${error}`));
      };

      // Si es data URL, cargar directamente, sino usar src
      if (url.startsWith('data:')) {
        img.src = url;
      } else {
        img.src = url;
      }
    });
  }

  /**
   * Obtener color de un píxel
   */
  getPixelColor(x: number, y: number): string | null {
    if (!this.maskImageData) return null;

    const index = (Math.floor(y) * this.maskImageData.width + Math.floor(x)) * 4;
    const r = this.maskImageData.data[index];
    const g = this.maskImageData.data[index + 1];
    const b = this.maskImageData.data[index + 2];
    const a = this.maskImageData.data[index + 3];

    if (a === 0) return null; // Transparente

    return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
  }

  /**
   * Verificar si un punto es walkable
   */
  isWalkable(x: number, y: number, mapping: MaskMapping): boolean {
    const color = this.getPixelColor(x, y);
    if (!color) return false;
    
    return color.toUpperCase() === mapping.walkableColor.toUpperCase();
  }

  /**
   * Verificar si un punto es un hotspot
   */
  isHotspot(x: number, y: number, mapping: MaskMapping): boolean {
    const color = this.getPixelColor(x, y);
    if (!color) return false;
    
    return color.toUpperCase() === mapping.hotspotColor.toUpperCase();
  }

  /**
   * Verificar si un punto es un trigger
   */
  isTrigger(x: number, y: number, mapping: MaskMapping): boolean {
    const color = this.getPixelColor(x, y);
    if (!color) return false;
    
    return color.toUpperCase() === mapping.triggerColor.toUpperCase();
  }

  /**
   * Extraer regiones de la máscara (connected components)
   */
  extractRegions(mapping: MaskMapping): Map<string, MaskRegion> {
    if (!this.maskImageData) {
      return new Map();
    }

    const regions = new Map<string, MaskRegion>();
    const visited = new Set<string>();
    const width = this.maskImageData.width;
    const height = this.maskImageData.height;

    // Función helper para obtener key de coordenada
    const getKey = (x: number, y: number) => `${x},${y}`;

    // Función para flood fill
    const floodFill = (startX: number, startY: number, targetColor: string, regionId: string): MaskRegion | null => {
      const pixels: Array<{ x: number; y: number }> = [];
      const stack: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];
      let minX = startX, minY = startY, maxX = startX, maxY = startY;

      while (stack.length > 0) {
        const { x, y } = stack.pop()!;
        const key = getKey(x, y);

        if (visited.has(key)) continue;
        if (x < 0 || x >= width || y < 0 || y >= height) continue;

        const pixelColor = this.getPixelColor(x, y);
        if (!pixelColor || pixelColor.toUpperCase() !== targetColor.toUpperCase()) continue;

        visited.add(key);
        pixels.push({ x, y });

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);

        // Agregar vecinos
        stack.push(
          { x: x + 1, y },
          { x: x - 1, y },
          { x, y: y + 1 },
          { x, y: y - 1 }
        );
      }

      if (pixels.length === 0) return null;

      // Calcular centroide
      const centroidX = pixels.reduce((sum, p) => sum + p.x, 0) / pixels.length;
      const centroidY = pixels.reduce((sum, p) => sum + p.y, 0) / pixels.length;

      return {
        id: regionId,
        color: targetColor,
        bounds: {
          x: minX,
          y: minY,
          width: maxX - minX + 1,
          height: maxY - minY + 1
        },
        centroid: { x: centroidX, y: centroidY },
        pixels
      };
    };

    // Extraer hotspots
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const key = getKey(x, y);
        if (visited.has(key)) continue;

        const color = this.getPixelColor(x, y);
        if (!color) continue;

        if (color.toUpperCase() === mapping.hotspotColor.toUpperCase()) {
          const regionId = mapping.regionIdStrategy === 'auto' 
            ? `hs_auto_${regions.size + 1}`
            : `hs_${x}_${y}`; // Fallback si no hay ID manual
          
          const region = floodFill(x, y, color, regionId);
          if (region) {
            regions.set(regionId, region);
          }
        } else if (color.toUpperCase() === mapping.triggerColor.toUpperCase()) {
          const regionId = mapping.regionIdStrategy === 'auto'
            ? `tr_auto_${regions.size + 1}`
            : `tr_${x}_${y}`;
          
          const region = floodFill(x, y, color, regionId);
          if (region) {
            regions.set(regionId, region);
          }
        }
      }
    }

    this.regions = regions;
    return regions;
  }

  /**
   * Obtener región en un punto
   */
  getRegionAt(x: number, y: number, mapping: MaskMapping): MaskRegion | null {
    const color = this.getPixelColor(x, y);
    if (!color) return null;

    // Buscar región que contenga este punto
    for (const region of this.regions.values()) {
      if (region.color.toUpperCase() === color.toUpperCase()) {
        // Verificar si el punto está dentro de los bounds
        if (
          x >= region.bounds.x &&
          x < region.bounds.x + region.bounds.width &&
          y >= region.bounds.y &&
          y < region.bounds.y + region.bounds.height
        ) {
          // Verificar si realmente está en los píxeles de la región
          const key = `${Math.floor(x)},${Math.floor(y)}`;
          if (region.pixels.some(p => `${p.x},${p.y}` === key)) {
            return region;
          }
        }
      }
    }

    return null;
  }

  /**
   * Obtener todas las regiones
   */
  getAllRegions(): Map<string, MaskRegion> {
    return new Map(this.regions);
  }

  /**
   * Obtener texture de la máscara
   */
  getTexture(): PIXI.Texture | null {
    return this.maskTexture;
  }

  /**
   * Limpiar recursos
   */
  destroy(): void {
    if (this.maskTexture) {
      this.maskTexture.destroy();
      this.maskTexture = null;
    }
    this.maskImageData = null;
    this.regions.clear();
  }
}

