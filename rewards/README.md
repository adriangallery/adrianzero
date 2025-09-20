# AdrianREWARDS

Sistema de recompensas para holders de AdrianPunks basado en el contrato AdrianOGREWARDS.

## Descripción

AdrianREWARDS es un frontend que permite a los holders de AdrianPunks reclamar recompensas basadas en sus tokens OG. El sistema está diseñado para ser simple y eficiente, mostrando solo la cantidad de tokens que posee el usuario y permitiendo reclamar recompensas de forma individual o por lotes.

## Características

- **Conexión de Wallet**: Integración con MetaMask para conectar la wallet del usuario
- **Detección de AdrianPunks**: Carga automática de los tokens AdrianPunks del usuario
- **Campañas de Recompensas**: Visualización de campañas activas con detalles completos
- **Claim Individual**: Reclamar recompensas para todos los tokens de una vez
- **Claim por Lotes**: Seleccionar tokens específicos para reclamar
- **Validación en Tiempo Real**: Verificación de elegibilidad antes de permitir claims
- **Interfaz Responsiva**: Diseño adaptado para móviles y escritorio

## Estructura de Archivos

```
rewards/
├── index.html          # Frontend principal
├── config.js           # Configuración de contratos y ABIs
├── adrianogrewards.sol # Contrato inteligente
└── README.md           # Documentación
```

## Contratos

### AdrianOGREWARDS (Contrato Principal)
- **Dirección**: `0x0000000000000000000000000000000000000000` (Mockup - actualizar después del deploy)
- **Funcionalidad**: Gestión de campañas de recompensas y claims

### AdrianPunks (ERC721)
- **Dirección**: `0x79BE8AcdD339C7b92918fcC3fd3875b5Aaad7566`
- **Funcionalidad**: Verificación de ownership de tokens

### AdrianLAB (TraitsCore)
- **Dirección**: `0x90546848474fb3c9fda3fdad887969bb244e7e58`
- **Funcionalidad**: Mint de recompensas a los usuarios

## Funcionalidades del Contrato

### Para Administradores
- `createCampaign()`: Crear nueva campaña de recompensas
- `configureCampaign()`: Configurar campaña existente
- `setCampaignActive()`: Activar/desactivar campaña
- `setPunkIdRange()`: Configurar rango válido de token IDs

### Para Usuarios
- `claim()`: Reclamar recompensa para un token específico
- `batchClaim()`: Reclamar recompensas para múltiples tokens
- `canClaim()`: Verificar si puede reclamar
- `hasClaimed()`: Verificar si ya reclamó

## Uso

1. **Conectar Wallet**: El usuario debe conectar su wallet MetaMask
2. **Cargar Tokens**: El sistema carga automáticamente los AdrianPunks del usuario
3. **Ver Campañas**: Se muestran las campañas activas disponibles
4. **Reclamar**: El usuario puede reclamar recompensas individualmente o por lotes

## Configuración

### Actualizar Dirección del Contrato
Una vez desplegado el contrato AdrianOGREWARDS, actualizar la dirección en `config.js`:

```javascript
this.REWARDS_CONTRACT = "0xNUEVA_DIRECCION_DEL_CONTRATO";
```

### Configurar Red
El sistema está configurado para Base Mainnet por defecto. Para cambiar de red, modificar en `config.js`:

```javascript
this.NETWORK = {
    name: "Base Mainnet",
    chainId: 8453,
    rpcUrl: "https://mainnet.base.org"
};
```

## Estilo Visual

El frontend utiliza:
- **Fuente**: VT323 (monospace retro)
- **Colores**: Esquema oscuro con acentos verdes y naranjas
- **Diseño**: Cards responsivas con efectos hover
- **Iconos**: Emojis y símbolos para mejor UX

## Dependencias

- **Ethers.js**: Para interacción con contratos
- **Bootstrap 5**: Para componentes UI
- **Google Fonts**: Para tipografía VT323

## Desarrollo

### Estructura del Código
- **HTML**: Estructura semántica con clases CSS
- **CSS**: Estilos personalizados con variables y media queries
- **JavaScript**: Lógica de interacción con contratos y UI

### Funciones Principales
- `init()`: Inicialización de la aplicación
- `loadUserPunks()`: Carga de tokens del usuario
- `loadCampaigns()`: Carga de campañas activas
- `claimReward()`: Proceso de claim individual
- `batchClaim()`: Proceso de claim por lotes

## Seguridad

- **Validación de Ownership**: Verificación de que el usuario es propietario de los tokens
- **Prevención de Reentrancy**: El contrato incluye ReentrancyGuard
- **Validación de Ventanas**: Verificación de fechas de inicio y fin
- **Verificación de Estado**: Validación de campañas activas

## Roadmap

- [ ] Integración con contrato desplegado
- [ ] Historial de claims
- [ ] Notificaciones push
- [ ] Modo oscuro/claro
- [ ] Soporte para múltiples redes
- [ ] Dashboard de administración

## Contacto

Para soporte o preguntas sobre el sistema de recompensas, contactar al equipo de desarrollo de Adrian Zero.
