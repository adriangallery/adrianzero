/**
 * Punto de entrada principal del juego
 */

import { Game } from './game/game';

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('game-ui-container');
  const canvasContainer = document.getElementById('game-canvas-container');

  if (!container || !canvasContainer) {
    console.error('❌ No se encontraron los contenedores necesarios');
    return;
  }

  try {
    // Crear instancia del juego
    const game = new Game({
      container,
      initialSceneId: 'suburban_street'
    });

    // Inicializar juego
    await game.init();

    // Exponer game globalmente para debugging
    (window as any).game = game;

    console.log('✅ Juego inicializado correctamente');
  } catch (error) {
    console.error('❌ Error inicializando juego:', error);
  }
});

