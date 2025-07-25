# AdrianLAB Adventure Game

Juego de aventura retro con temática web3 y blockchain.

## 🎮 Estructura del Proyecto

```
adventure/
├── index.html              # Archivo principal del juego
├── index.js                # Lógica principal del juego
├── styles.css              # Estilos principales
├── intro.png               # Imagen de introducción
├── Banner_Mobile.png       # Banner para móviles
├── retroadrian.mp3         # Música de fondo
├── startermint.html        # Interfaz de minting
├── game-system/            # Sistema modular del juego
│   ├── game-styles.css     # Estilos del sistema de juego
│   ├── game-engine.js      # Motor del juego
│   ├── game-init.js        # Inicialización del juego
│   ├── screen-base.js      # Clase base para pantallas
│   ├── ui-manager.js       # Gestor de interfaz
│   └── screens/            # Pantallas específicas
│       ├── intro-screen.js
│       └── basement-screen.js
└── scenes/                 # Escenas del juego
    ├── scene-manager-v2.js # Gestor de escenas
    ├── base-scene.js       # Clase base para escenas
    ├── outside.js          # Escena exterior
    ├── frontdoor.js        # Escena de la puerta
    ├── lobby.js            # Escena del lobby
    ├── basement.js         # Escena del sótano
    ├── upstairs.js         # Escena del piso superior
    └── images/             # Imágenes de las escenas
        ├── outside.png
        ├── frontdoor.png
        ├── lobby.png
        ├── basement.png
        ├── upstairs.png
        ├── mountain.png
        └── rehabfrontdoor.png
```

## 🚀 Cómo Jugar

1. Abre `index.html` en tu navegador
2. Conecta tu wallet (MetaMask recomendado)
3. Navega por las diferentes escenas haciendo clic
4. Usa los comandos: EXPLORE, USE, TAKE, INSPECT, OPEN, CLOSE
5. Interactúa con objetos y descubre secretos web3

## 🔧 Características

- **Sistema de Escenas**: Navegación fluida entre diferentes áreas
- **Inventario NFT**: Carga automática de NFTs desde blockchain
- **Comandos Interactivos**: Sistema de comandos para interactuar con objetos
- **Audio Retro**: Música de fondo con controles de mute
- **Responsive**: Funciona en desktop y móvil
- **Web3 Integration**: Conexión con MetaMask y Base network

## 🎯 Comandos Disponibles

- **EXPLORE**: Examinar el área
- **USE**: Usar objetos
- **TAKE**: Recoger objetos
- **INSPECT**: Inspeccionar detalladamente
- **OPEN**: Abrir objetos/áreas
- **CLOSE**: Cerrar objetos/áreas

## 🌐 Redes Soportadas

- **Base Network** (Chain ID: 8453)
- **MetaMask** para conexión de wallet

## 📱 Compatibilidad

- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Móvil (iOS Safari, Android Chrome)
- ✅ Tablet (iPad, Android tablets)

## 🎵 Audio

El juego incluye música retro que se reproduce automáticamente. Los usuarios pueden:
- Silenciar/activar música con el botón 🔊
- La música se adapta automáticamente a las políticas del navegador

## 🔗 Dependencias Externas

- **Ethers.js**: Cargado dinámicamente para interacción blockchain
- **Google Fonts**: Press Start 2P, VT323 para estilos retro
- **Alchemy API**: Para carga de inventario NFT

## 🐛 Solución de Problemas

### La música no se reproduce
- Los navegadores modernos requieren interacción del usuario para reproducir audio
- Haz clic en cualquier parte de la pantalla para activar el audio

### El wallet no se conecta
- Asegúrate de tener MetaMask instalado
- Verifica que estés en la red Base
- Si no tienes Base, se agregará automáticamente

### Las imágenes no cargan
- Verifica que todos los archivos estén en la carpeta correcta
- Asegúrate de que el servidor web esté configurado correctamente

## 📝 Notas de Desarrollo

Este juego fue migrado desde la estructura anterior `indextest.*` a la nueva organización modular en `adventure/`. Todas las rutas relativas se mantuvieron para preservar la funcionalidad existente. 