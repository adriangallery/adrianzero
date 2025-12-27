# 📋 Instrucciones para Probar AdrianAdventure

## ✅ Estado Actual

El juego está **funcional y listo para probar**. Todos los módulos están integrados y funcionando.

## 🚀 Pasos para Ejecutar

### 1. Instalar Dependencias

```bash
cd adventure
npm install
```

### 2. Ejecutar el Juego

```bash
npm run dev
```

El juego se abrirá automáticamente en `http://localhost:3000`

## 🎮 Cómo Funciona

### Controles Básicos

- **Click/Tap** en zonas azules (walkable) → El jugador camina hacia allí
- **Click/Tap** en zonas amarillas (hotspots) → Interactúa con el objeto
- **Verbos** (LOOK, USE, TALK, etc.) → Selecciona la acción
- **Inventario** → Click en items para seleccionarlos

### Sistema de Diálogos

Los diálogos aparecen automáticamente en la parte inferior cuando interactúas con objetos.

### Sistema de Guardado

- El juego guarda automáticamente en localStorage
- Usa `game.save()` en consola para guardar manualmente
- Usa `game.load()` en consola para cargar

## 📁 Estructura de Archivos

```
adventure/
├── src/                    # Código fuente TypeScript
│   ├── engine/            # Motor (renderer, camera, input, masks)
│   ├── game/              # Lógica del juego (scenes, scripts, verbs)
│   ├── web3/              # Sistema blockchain
│   └── ui/                # Interfaz de usuario
├── assets/                # Assets del juego
│   └── scenes/           # Escenas (background, walkmask, scene.json)
├── index.html            # HTML principal
├── styles.css            # Estilos
└── package.json          # Dependencias
```

## 🎨 Crear Assets de Escena

### Opción 1: Usar Placeholders

El juego ya tiene placeholders básicos creados. Si quieres crear mejores:

1. Abre `create-placeholders.html` en el navegador
2. Descarga las imágenes generadas
3. Colócalas en `assets/scenes/suburban_street/`

### Opción 2: Crear Manualmente

1. **background.png**: Imagen de fondo (2400x1350px recomendado)
2. **walkmask.png**: Máscara de colores (mismo tamaño)
   - Azul (#0000FF) = Walkable
   - Amarillo (#FFFF00) = Hotspots
   - Magenta (#FF00FF) = Triggers

## 🔧 Configuración

### API Keys de Alchemy (Opcional)

Si quieres usar el sistema blockchain, crea `config-keys.js`:

```javascript
window.ALCHEMY_KEYS_CONFIG = {
  primary: 'tu-api-key',
  fallbacks: []
};
```

## 🐛 Debugging

Abre la consola del navegador (F12) para ver logs.

Comandos útiles:

```javascript
// Cambiar escena
game.changeScene('suburban_street');

// Guardar/Cargar
game.save();
game.load();

// Ver estado del juego
console.log(game);
```

## ✅ Funcionalidades Implementadas

- ✅ Motor de renderizado (PixiJS)
- ✅ Sistema de cámara con seguimiento
- ✅ Sistema de input (mouse + touch)
- ✅ Cargador de máscaras y escenas
- ✅ Motor de scripts completo
- ✅ Sistema de verbos
- ✅ Resolvedor de interacciones
- ✅ UI responsive (desktop + móvil)
- ✅ Sistema de save/load
- ✅ Sistema de blockchain (módulos listos)

## 🚧 Pendiente (Opcional)

- [ ] Wallet connector (ethers.js)
- [ ] Sprites del jugador
- [ ] Música y efectos de sonido
- [ ] Más escenas

## 📝 Notas

- El juego funciona sin assets (mostrará errores pero no crasheará)
- Las escenas se cargan dinámicamente
- El sistema es completamente modular y extensible

## 🎉 ¡Listo para Probar!

Ejecuta `npm run dev` y disfruta del juego. Todos los sistemas están funcionando y listos para usar.

