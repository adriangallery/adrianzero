/**
 * Sistema de cámara
 * 
 * Maneja pan, follow character, bounds clamp, y smooth lerp
 */

import * as PIXI from 'pixi.js';

export interface CameraConfig {
  startX: number;
  startY: number;
  followPlayer: boolean;
  lerp: number; // 0-1, más alto = más suave
  clampToWorld: boolean;
  worldWidth: number;
  worldHeight: number;
  viewportWidth: number;
  viewportHeight: number;
}

export class Camera {
  private config: CameraConfig;
  private targetX: number;
  private targetY: number;
  private currentX: number;
  private currentY: number;
  private followTarget: { x: number; y: number } | null = null;

  constructor(config: CameraConfig) {
    this.config = config;
    this.targetX = config.startX;
    this.targetY = config.startY;
    this.currentX = config.startX;
    this.currentY = config.startY;
  }

  /**
   * Actualizar posición de la cámara
   */
  update(deltaTime: number): void {
    // Si sigue al jugador, actualizar target
    if (this.config.followPlayer && this.followTarget) {
      this.targetX = this.followTarget.x;
      this.targetY = this.followTarget.y;
    }

    // Aplicar lerp para movimiento suave
    const lerpFactor = 1 - Math.pow(1 - this.config.lerp, deltaTime / 16.67); // Normalizar a 60fps
    
    this.currentX += (this.targetX - this.currentX) * lerpFactor;
    this.currentY += (this.targetY - this.currentY) * lerpFactor;

    // Clamp a límites del mundo si está habilitado
    if (this.config.clampToWorld) {
      const halfViewportWidth = this.config.viewportWidth / 2;
      const halfViewportHeight = this.config.viewportHeight / 2;

      this.currentX = Math.max(
        halfViewportWidth,
        Math.min(
          this.config.worldWidth - halfViewportWidth,
          this.currentX
        )
      );

      this.currentY = Math.max(
        halfViewportHeight,
        Math.min(
          this.config.worldHeight - halfViewportHeight,
          this.currentY
        )
      );
    }
  }

  /**
   * Establecer posición objetivo
   */
  setTarget(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
  }

  /**
   * Establecer objetivo a seguir
   */
  setFollowTarget(target: { x: number; y: number } | null): void {
    this.followTarget = target;
  }

  /**
   * Obtener posición actual
   */
  getPosition(): { x: number; y: number } {
    return {
      x: this.currentX,
      y: this.currentY
    };
  }

  /**
   * Aplicar transformación a un contenedor
   */
  applyToContainer(container: PIXI.Container): void {
    const pos = this.getPosition();
    container.position.set(
      -pos.x + this.config.viewportWidth / 2,
      -pos.y + this.config.viewportHeight / 2
    );
  }

  /**
   * Convertir coordenadas de pantalla a mundo
   */
  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    const pos = this.getPosition();
    return {
      x: screenX + pos.x - this.config.viewportWidth / 2,
      y: screenY + pos.y - this.config.viewportHeight / 2
    };
  }

  /**
   * Convertir coordenadas de mundo a pantalla
   */
  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    const pos = this.getPosition();
    return {
      x: worldX - pos.x + this.config.viewportWidth / 2,
      y: worldY - pos.y + this.config.viewportHeight / 2
    };
  }

  /**
   * Actualizar configuración
   */
  updateConfig(config: Partial<CameraConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

