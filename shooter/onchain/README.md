# Shooter Game - Onchain Integration

Este sistema integra el juego shooter con recompensas onchain en Base, incluyendo un panel de administración protegido.

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Smart Contract│
│   (Game + UI)   │◄──►│   (Signing)     │◄──►│   (Rewards)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Estructura de Archivos

```
shooter/onchain/
├── contracts/
│   └── ShooterGameRewards.sol    # Contrato principal
├── backend/
│   ├── server.js                 # Servidor backend
│   ├── package.json              # Dependencias
│   └── env.example              # Variables de entorno
├── admin/
│   └── admin.html               # Panel de administración
├── utils/
│   └── wallet.js                # Utilidades de wallet
└── shooter-onchain.html         # Juego integrado
```

## 🚀 Instalación y Configuración

### 1. Desplegar Contrato

```bash
# Compilar contrato
npx hardhat compile

# Desplegar en Base
npx hardhat run scripts/deploy.js --network base
```

### 2. Configurar Backend

```bash
cd backend
npm install
cp env.example .env
```

Editar `.env`:
```env
BACKEND_PRIVATE_KEY=tu_private_key_aqui
CONTRACT_ADDRESS=0x... # Dirección del contrato desplegado
ADMIN_WALLET=0x4943407105999e3E97EFA2035F5cbC64D72581C6
```

Iniciar servidor:
```bash
npm start
```

### 3. Configurar Frontend

Editar `shooter-onchain.html`:
```javascript
this.contractAddress = '0x...'; // Dirección del contrato
this.backendUrl = 'https://tu-backend.com'; // URL del backend
```

## 🎮 Flujo del Juego

### 1. Conexión de Wallet
- El jugador conecta su wallet (MetaMask)
- El sistema verifica si posee un Key NFT
- Si no tiene, puede mintear uno pagando el costo

### 2. Juego
- El jugador juega normalmente
- El score se rastrea en tiempo real
- Al terminar, se envían los datos al backend

### 3. Recompensas
- Backend firma el score y genera nonce
- Frontend llama a `claimReward()` en el contrato
- Se quema el Key NFT y se mintean las recompensas

## 🔧 Panel de Administración

### Acceso
- URL: `https://tu-dominio.com/shooter/onchain/admin/admin.html`
- Solo la wallet `0x4943407105999e3E97EFA2035F5cbC64D72581C6` puede acceder

### Funcionalidades
- **Configuración del Juego**:
  - Token ID a quemar para jugar
  - Costo en ETH para jugar
- **Configuración de Recompensas**:
  - Score mínimo → Token ID de recompensa
  - Cantidad de tokens por score

## 🛡️ Seguridad

### Protecciones Implementadas
- **Nonce único**: Previene replay attacks
- **Expiry timestamp**: Firmas válidas por 10 minutos
- **Key binding**: Cada firma está ligada a un Key ID específico
- **Admin verification**: Solo wallet autorizada puede configurar
- **Signature verification**: Solo el backend puede firmar recompensas

### Flujo de Seguridad
1. Jugador juega y obtiene score
2. Backend genera nonce único y firma
3. Contrato verifica firma del backend
4. Se quema Key NFT y se transfieren recompensas

## 📊 Configuración de Recompensas

### Ejemplo de Configuración
```javascript
// Score 100+ → Token ID 1, Cantidad 1
// Score 500+ → Token ID 2, Cantidad 5  
// Score 1000+ → Token ID 3, Cantidad 10
```

### Panel de Admin
- Agregar/editar recompensas por score
- Configurar token ID a quemar
- Establecer costo de juego

## 🔄 API Endpoints

### Backend
- `POST /api/submit-score` - Enviar score del juego
- `POST /api/claim-reward` - Obtener firma para reclamar
- `GET /api/nonce/:address` - Obtener nonce del jugador
- `POST /api/admin/update-config` - Actualizar configuración
- `POST /api/admin/update-rewards` - Actualizar recompensas

### Contrato
- `mintKey()` - Mintear Key NFT
- `hasKey(address)` - Verificar si tiene Key
- `claimReward(...)` - Reclamar recompensas
- `setGameConfig(...)` - Configurar juego (solo admin)
- `setScoreReward(...)` - Configurar recompensas (solo admin)

## 🚨 Consideraciones Importantes

### Gas Optimization
- El contrato usa `nonReentrant` para prevenir reentrancy
- Las funciones están optimizadas para gas
- Se recomienda usar Base para gas fees bajos

### Escalabilidad
- Backend puede usar Redis para nonces
- Considerar Merkle trees para batch verification
- Implementar rate limiting en API

### Monitoreo
- Logs de transacciones en backend
- Eventos del contrato para tracking
- Dashboard de estadísticas del juego

## 🔧 Desarrollo

### Testing
```bash
# Test del contrato
npx hardhat test

# Test del backend
npm test

# Test de integración
npm run test:integration
```

### Deployment
```bash
# Deploy a Base mainnet
npx hardhat run scripts/deploy.js --network base

# Deploy backend a producción
npm run deploy
```

## 📞 Soporte

Para problemas o preguntas:
- GitHub Issues
- Discord: #shooter-game
- Email: admin@adrianzero.com

---

**¡Disfruta jugando y ganando recompensas onchain!** 🎮💰
