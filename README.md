# AdrianLAB - Retro Adventure DApp

Una dapp retro pixel art inspirada en los juegos point & click de los años 80, construida para la red BASE.

## 🎮 Características

- **Diseño Retro Pixel Art**: Interfaz inspirada en los juegos clásicos de los 80
- **Compatibilidad Móvil**: Optimizada para dispositivos móviles
- **Integración MetaMask**: Conexión de wallet nativa
- **Música de Fondo**: Banda sonora retro con opción de mute
- **Red BASE**: Compatible con la red Base de Coinbase
- **Transiciones Suaves**: Efectos de fade in/out para una experiencia fluida

## 🚀 Funcionalidades

### Pantalla de Intro
- Imagen de introducción con fade in/out de 2 segundos
- Auto-transición después de 10 segundos
- Click para saltar la intro

### Pantalla Principal
- Fondo con imagen `basement.png`
- Botón de conexión de wallet
- Control de música (mute/unmute)
- Área clickeable que muestra popup de mint

### Sistema de Wallet
- Conexión automática con MetaMask
- Detección y cambio automático a red BASE
- Interfaz adaptativa según estado de conexión

### Compra de Floppy
- Pantalla dedicada para compra de Floppy Disk
- Precio: 0.01 ETH
- Transacciones en red BASE

## 🛠️ Tecnologías Utilizadas

- **HTML5**: Estructura semántica
- **CSS3**: Estilos retro pixel art con animaciones
- **JavaScript (ES6+)**: Lógica de la aplicación
- **Ethers.js**: Interacción con blockchain
- **MetaMask**: Wallet integration
- **Google Fonts**: Fuente "Press Start 2P" para estilo retro

## 📱 Compatibilidad

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Dispositivos móviles (iOS/Android)

## 🎵 Audio

- **Archivo**: `Retro Adventure.mp3`
- **Volumen**: 30% por defecto
- **Loop**: Reproducción continua
- **Control**: Botón de mute/unmute

## 🖼️ Assets

- `intro.png`: Imagen de introducción
- `basement.png`: Fondo de la pantalla principal
- `Retro Adventure.mp3`: Música de fondo

## 🔗 Contratos

- **AdrianPackTokenMinter.sol**: `0x9e569BA579bc9fB9A2A826555e6A9C456a981D14`
- **Adrian Token**: `0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea`

## 🚀 Instalación y Uso

1. **Clona el repositorio**:
   ```bash
   git clone [URL_DEL_REPOSITORIO]
   cd AdrianLAB
   ```

2. **Abre el archivo**:
   - Abre `index.html` en tu navegador
   - O usa un servidor local:
   ```bash
   python -m http.server 8000
   # o
   npx serve .
   ```

3. **Conecta tu wallet**:
   - Instala MetaMask si no lo tienes
   - Haz click en "Connect Wallet"
   - Acepta la conexión en MetaMask

4. **Cambia a red BASE**:
   - La dapp automáticamente te pedirá cambiar a la red BASE
   - Si no tienes la red configurada, se agregará automáticamente

## 🎯 Uso de la DApp

1. **Intro**: Espera 10 segundos o haz click para continuar
2. **Pantalla Principal**: Conecta tu wallet y explora
3. **Mint**: Haz click en el área principal para ver el popup de mint
4. **Compra Floppy**: Navega a la pantalla de compra de Floppy

## 🔧 Configuración de Red BASE

La dapp automáticamente configura la red BASE con estos parámetros:
- **Chain ID**: 8453 (0x2105)
- **RPC URL**: https://mainnet.base.org
- **Explorer**: https://basescan.org
- **Símbolo**: ETH

## 🎨 Estilo Retro

La dapp utiliza:
- **Fuente**: Press Start 2P (Google Fonts)
- **Colores**: Verde fosforescente (#00ff00) sobre negro
- **Efectos**: Glow, blink, pixel-perfect rendering
- **Animaciones**: Fade in/out, hover effects

## 📝 Notas de Desarrollo

- **Responsive Design**: Optimizado para móviles
- **Touch Events**: Soporte completo para dispositivos táctiles
- **Error Handling**: Notificaciones informativas para el usuario
- **Performance**: Optimizado para carga rápida

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

Si encuentras algún problema o tienes sugerencias:
- Abre un issue en GitHub
- Contacta al desarrollador

---

**Desarrollado con ❤️ para la comunidad crypto** # Force Vercel redeploy after restore to stable commit
# Verificación: Mejora #2 - Undo/Redo funcionando correctamente
