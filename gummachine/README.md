# 🍬 Adrian Gumball Machine

Una dApp pixel art retro para jugar y obtener NFTs aleatorios de la colección AdrianZERO en Base Network.

## ✨ Características

- **🎨 Diseño Pixel Art Retro**: Gummachine visualmente atractiva con animaciones
- **📱 Responsive**: Optimizada para móvil y desktop
- **🔗 Web3**: Conexión directa con MetaMask
- **🎯 Juego Simple**: Inserta monedas y recibe NFTs aleatorios
- **📊 Historial**: Visualiza los últimos drops
- **⚡ Base Network**: Compatible con Base Mainnet

## 🚀 Instalación

1. **Clona el repositorio**:
   ```bash
   git clone <repository-url>
   cd gummachine
   ```

2. **Abre `index.html`** en tu navegador o usa un servidor local:
   ```bash
   python3 -m http.server 8000
   # Luego abre http://localhost:8000
   ```

## ⚙️ Configuración

### 1. Dirección del Contrato
Edita `app.js` y actualiza la dirección del contrato:
```javascript
this.contractAddress = '0x...'; // Dirección real del contrato AdrianGumballV2
```

### 2. Red de Base
La dApp está configurada para Base Mainnet (Chain ID: 8453). Asegúrate de tener ETH en Base para jugar.

## 🎮 Cómo Jugar

1. **Conecta tu Wallet**: Haz clic en "CONNECT WALLET" y autoriza MetaMask
2. **Selecciona Cantidad**: Elige cuántos NFTs quieres (1, 3, 5, o 10)
3. **Inserta Monedas**: Haz clic en "PLAY NOW" y confirma la transacción
4. **Recibe tu NFT**: El contrato te enviará un NFT aleatorio de AdrianZERO

## 🏗️ Arquitectura

### Archivos Principales
- **`index.html`**: Estructura HTML con overlay UI
- **`styles.css`**: Estilos CSS pixel art retro
- **`gumball-machine.js`**: Renderer de la máquina en Canvas
- **`app.js`**: Lógica principal de la dApp

### Estructura del Contrato
El frontend interactúa con el contrato `AdrianGumballV2` que:
- Acepta pagos en ETH
- Mantiene un pool de NFTs disponibles
- Distribuye NFTs aleatorios usando blockhash
- Mantiene historial de claims

## 🎨 Personalización

### Colores
Edita `gumball-machine.js` para cambiar los colores:
```javascript
this.colors = {
    machine: '#2a2a2a',      // Cuerpo principal
    metal: '#444444',        // Elementos metálicos
    glass: '#87CEEB',        // Ventanas de cristal
    accent: '#00ff88',       // Acentos verdes
    // ... más colores
};
```

### Animaciones
Las animaciones están en `styles.css`:
- `pixelGlow`: Efecto de brillo en hover
- `coinInsert`: Animación de inserción de moneda
- `dispense`: Animación de dispensado

## 📱 Responsive Design

La dApp se adapta automáticamente:
- **Desktop**: Tamaño completo con todos los elementos
- **Tablet**: Escala a 0.8x manteniendo funcionalidad
- **Móvil**: Escala a 0.7x con layout optimizado

## 🔧 Funciones del Contrato

### Lectura
- `availableSupply()`: Total de NFTs disponibles
- `freeSupply()`: NFTs no reservados
- `priceETH()`: Precio por intento
- `getClaimHistory()`: Historial de claims

### Escritura
- `requestPlayETH(qty)`: Solicita jugar con ETH
- Requiere `fulfill()` en bloque posterior para completar

## 🚨 Consideraciones de Seguridad

- **Verificación de Red**: La dApp verifica que estés en Base Mainnet
- **Validación de Transacciones**: Verifica que el valor enviado sea correcto
- **Manejo de Errores**: Captura y muestra errores de manera amigable

## 🐛 Troubleshooting

### Problemas Comunes

1. **"MetaMask not detected"**
   - Instala MetaMask en tu navegador

2. **"Wrong network"**
   - Cambia a Base Mainnet en MetaMask

3. **"Insufficient funds"**
   - Asegúrate de tener ETH en Base Network

4. **"Transaction failed"**
   - Verifica que tengas suficiente ETH para gas

### Debug
Abre la consola del navegador para ver logs detallados de:
- Conexión de wallet
- Llamadas al contrato
- Errores de transacción

## 🔮 Futuras Mejoras

- [ ] Soporte para tokens ERC20
- [ ] Modo oscuro/claro
- [ ] Sonidos retro
- [ ] Estadísticas de usuario
- [ ] Leaderboard de jugadores

## 📄 Licencia

MIT License - Usa libremente para tus proyectos.

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Abre un issue o pull request.

---

**¡Disfruta jugando en la Adrian Gumball Machine! 🍬✨**
