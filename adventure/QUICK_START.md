# 🚀 Quick Start - AdrianAdventure

## Instalación y Ejecución

### 1. Instalar dependencias

```bash
cd adventure
npm install
```

### 2. Ejecutar en desarrollo

```bash
npm run dev
```

El juego se abrirá automáticamente en `http://localhost:3000`

### 3. Probar el juego

- **Click/Tap** en la pantalla para caminar (si es zona walkable - azul)
- **Click/Tap** en hotspots (amarillo) para interactuar
- Usa los **verbos** (LOOK, USE, TALK, etc.) en la barra inferior
- Los **diálogos** aparecerán en la parte inferior de la pantalla

## 📝 Notas Importantes

### Assets Placeholder

Si no tienes las imágenes de la escena, el juego intentará cargarlas pero mostrará errores en consola. El juego seguirá funcionando.

Para crear placeholders básicos:
1. Abre `create-placeholders.html` en el navegador
2. Descarga las imágenes generadas
3. Colócalas en `assets/scenes/suburban_street/`

### Estructura Mínima de Escena

Cada escena necesita:
- `scene.json` - Configuración (ya creado)
- `background.png` - Imagen de fondo (2400x1350px)
- `walkmask.png` - Máscara de colores (mismo tamaño)

### Colores de Máscara

- **Azul (#0000FF)**: Zonas caminables
- **Amarillo (#FFFF00)**: Hotspots (interactuables)
- **Magenta (#FF00FF)**: Triggers (transiciones)
- **Otros**: Bloqueado

## 🐛 Debugging

Abre la consola del navegador (F12) para ver logs.

El objeto `game` está disponible globalmente:

```javascript
game.save()              // Guardar
game.load()              // Cargar
game.changeScene('id')   // Cambiar escena
```

## ✅ Checklist de Funcionalidad

- [x] Motor de renderizado (PixiJS)
- [x] Sistema de cámara
- [x] Sistema de input (mouse + touch)
- [x] Cargador de máscaras
- [x] Cargador de escenas
- [x] Motor de scripts
- [x] Sistema de verbos
- [x] Resolvedor de interacciones
- [x] Sistema de UI
- [x] Save/Load
- [x] Sistema de blockchain (módulos listos)
- [ ] Wallet connector (pendiente)
- [ ] Sprites del jugador (pendiente)

## 🎮 Próximos Pasos

1. Agregar imágenes reales de las escenas
2. Crear sprites del jugador
3. Integrar wallet connector
4. Agregar música y efectos de sonido
5. Crear más escenas

