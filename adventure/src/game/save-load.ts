/**
 * Sistema de save/load
 * 
 * Guarda y carga el estado del juego desde localStorage
 */

import { GameState } from './script-engine';

const SAVE_KEY = 'adrianAdventure_save';
const SAVE_VERSION = 1;

export interface SaveData {
  version: number;
  timestamp: number;
  state: GameState;
}

export class SaveLoadManager {
  /**
   * Guardar estado del juego
   */
  save(state: GameState): boolean {
    try {
      const saveData: SaveData = {
        version: SAVE_VERSION,
        timestamp: Date.now(),
        state: {
          ...state,
          // Serializar flags correctamente
          flags: { ...state.flags }
        }
      };

      const json = JSON.stringify(saveData);
      localStorage.setItem(SAVE_KEY, json);
      
      console.log('✅ Juego guardado');
      return true;
    } catch (error) {
      console.error('❌ Error guardando juego:', error);
      return false;
    }
  }

  /**
   * Cargar estado del juego
   */
  load(): GameState | null {
    try {
      const json = localStorage.getItem(SAVE_KEY);
      if (!json) {
        console.log('ℹ️ No hay guardado disponible');
        return null;
      }

      const saveData: SaveData = JSON.parse(json);

      // Validar versión
      if (saveData.version !== SAVE_VERSION) {
        console.warn(`⚠️ Versión de guardado diferente: ${saveData.version} vs ${SAVE_VERSION}`);
        // Podríamos hacer migración aquí si es necesario
      }

      console.log('✅ Juego cargado');
      return saveData.state;
    } catch (error) {
      console.error('❌ Error cargando juego:', error);
      return null;
    }
  }

  /**
   * Verificar si hay un guardado disponible
   */
  hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  /**
   * Eliminar guardado
   */
  deleteSave(): boolean {
    try {
      localStorage.removeItem(SAVE_KEY);
      console.log('✅ Guardado eliminado');
      return true;
    } catch (error) {
      console.error('❌ Error eliminando guardado:', error);
      return false;
    }
  }

  /**
   * Obtener información del guardado
   */
  getSaveInfo(): { timestamp: number; version: number } | null {
    try {
      const json = localStorage.getItem(SAVE_KEY);
      if (!json) return null;

      const saveData: SaveData = JSON.parse(json);
      return {
        timestamp: saveData.timestamp,
        version: saveData.version
      };
    } catch (error) {
      console.error('❌ Error obteniendo info del guardado:', error);
      return null;
    }
  }

  /**
   * Exportar guardado como JSON (para backup)
   */
  exportSave(): string | null {
    try {
      const json = localStorage.getItem(SAVE_KEY);
      return json;
    } catch (error) {
      console.error('❌ Error exportando guardado:', error);
      return null;
    }
  }

  /**
   * Importar guardado desde JSON
   */
  importSave(json: string): boolean {
    try {
      const saveData: SaveData = JSON.parse(json);
      
      // Validar estructura básica
      if (!saveData.state || !saveData.version) {
        throw new Error('Formato de guardado inválido');
      }

      localStorage.setItem(SAVE_KEY, json);
      console.log('✅ Guardado importado');
      return true;
    } catch (error) {
      console.error('❌ Error importando guardado:', error);
      return false;
    }
  }
}

// Instancia singleton
let saveLoadInstance: SaveLoadManager | null = null;

/**
 * Obtener instancia singleton del gestor de save/load
 */
export function getSaveLoadManager(): SaveLoadManager {
  if (!saveLoadInstance) {
    saveLoadInstance = new SaveLoadManager();
  }
  return saveLoadInstance;
}

export default getSaveLoadManager();

