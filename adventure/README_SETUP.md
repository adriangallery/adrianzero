# Setup y Ejecución de AdrianAdventure

## 🚀 Inicio Rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Ejecutar en desarrollo

```bash
npm run dev
```

El juego se abrirá en `http://localhost:3000`

### 3. Build para producción

```bash
npm run build
```

Los archivos compilados estarán en `dist/`

## 📁 Estructura de Assets

### Escenas

Cada escena debe estar en `assets/scenes/<sceneId>/`:

```
assets/scenes/suburban_street/
├── scene.json          # Configuración de la escena
├── background.png      # Imagen de fondo
└── walkmask.png        # Máscara de colores
```

### Máscaras

Las máscaras usan colores específicos:
- **Azul (#0000FF)**: Zonas caminables
- **Amarillo (#FFFF00)**: Hotspots (interactuables)
- **Magenta (#FF00FF)**: Triggers (transiciones)
- **Otros colores**: Bloqueado

## 🎮 Controles

- **Click/Tap**: Interactuar con hotspots o caminar
- **Verbos**: Seleccionar acción (LOOK, USE, TALK, etc.)
- **Inventario**: Click en items para seleccionarlos

## 🔧 Configuración

### API Keys de Alchemy

Crea `config-keys.js` en la raíz (opcional):

```javascript
window.ALCHEMY_KEYS_CONFIG = {
  primary: 'tu-api-key-primaria',
  fallbacks: ['fallback-1', 'fallback-2']
};
```

Si no existe, se usará la key de fallback definida en `src/web3/config.ts`.

## 🐛 Debugging

El objeto `game` está expuesto globalmente en la consola:

```javascript
// En la consola del navegador
game.save()           // Guardar juego
game.load()           // Cargar juego
game.changeScene('scene_id')  // Cambiar escena
```

## 📝 Notas

- El juego funciona sin assets (mostrará errores pero no crasheará)
- Las escenas se cargan dinámicamente desde `assets/scenes/`
- El sistema de save/load usa localStorage

