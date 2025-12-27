# AdrianAdventure - Motor del Juego Completo

Este directorio contiene el motor completo del juego point-and-click AdrianAdventure, con sistema modular de blockchain, renderizado con PixiJS, y todas las funcionalidades necesarias para un juego de aventura gráfica estilo Monkey Island.

## 📁 Estructura de Directorios

```
adventure/
├── src/
│   ├── engine/                  # Motor de renderizado y sistemas base
│   │   ├── renderer.ts          # Motor PixiJS con resize handling
│   │   ├── camera.ts            # Sistema de cámara (pan, follow, bounds)
│   │   ├── input.ts             # Sistema de input (mouse + touch)
│   │   ├── mask-loader.ts       # Cargador y procesador de máscaras
│   │   └── index.ts
│   │
│   ├── game/                    # Lógica del juego
│   │   ├── scene-loader.ts      # Cargador de escenas
│   │   ├── script-engine.ts     # Motor de scripts (opcodes)
│   │   ├── verb-system.ts       # Sistema de verbos/acciones
│   │   ├── interaction-resolver.ts # Resolvedor de interacciones
│   │   ├── save-load.ts         # Sistema de guardado/carga
│   │   ├── filters/             # Sistema de filtros extensible
│   │   │   ├── filter-config.ts
│   │   │   └── index.ts
│   │   └── inventory/           # Gestor de inventario
│   │       ├── inventory-manager.ts
│   │       └── index.ts
│   │
│   ├── web3/                    # Módulos de blockchain
│   │   ├── config.ts            # Configuración centralizada
│   │   ├── alchemy-client.ts    # Cliente de Alchemy con fallback
│   │   ├── nft-loader.ts        # Carga de NFTs desde Alchemy
│   │   ├── gating.ts            # Sistema de gating (ERC721/ERC20)
│   │   └── index.ts
│   │
│   ├── ui/                      # Sistema de UI
│   │   └── game-ui.ts           # Bottom bar (desktop) y drawer móvil
│   │
│   └── examples/                # Ejemplos de uso
│       └── usage-example.ts
│
├── assets/                       # Assets del juego
│   ├── scenes/                  # Escenas (background, walkmask, scene.json)
│   └── ui/                      # UI assets (iconos, fuentes)
│
├── README.md                    # Este archivo
├── ESTRUCTURA.md                # Estructura detallada
└── promptinicial.json           # Especificación del proyecto
```

## 🚀 Características Principales

### Motor del Juego

1. **Renderizador PixiJS** (`src/engine/renderer.ts`)
   - Inicialización con DPR scaling
   - Resize handling automático
   - Contenedores separados para mundo y UI

2. **Sistema de Cámara** (`src/engine/camera.ts`)
   - Seguimiento suave del jugador (lerp)
   - Clamp a límites del mundo
   - Conversión de coordenadas pantalla/mundo

3. **Sistema de Input** (`src/engine/input.ts`)
   - Soporte mouse + touch
   - Detección de tap vs drag
   - Eventos unificados

4. **Cargador de Máscaras** (`src/engine/mask-loader.ts`)
   - Carga de PNG de máscaras
   - Lectura de colores de píxeles
   - Extracción de regiones (connected components)
   - Detección de walkable/hotspot/trigger

5. **Cargador de Escenas** (`src/game/scene-loader.ts`)
   - Carga de scene.json
   - Carga de assets (background, mask)
   - Gestión de hotspots, triggers, items

6. **Motor de Scripts** (`src/game/script-engine.ts`)
   - Ejecución de opcodes
   - Operaciones predefinidas (say, setFlag, ifFlag, etc.)
   - Extensible con operaciones personalizadas

7. **Sistema de Verbos** (`src/game/verb-system.ts`)
   - Gestión de verbos (LOOK, USE, TALK, PICK, OPEN, CLOSE, WALK)
   - Reglas de interacción
   - Scripts de fallback

8. **Resolvedor de Interacciones** (`src/game/interaction-resolver.ts`)
   - Resuelve verb + item + hotspot → script
   - Manejo de triggers
   - Verificación de walkable

9. **Sistema de UI** (`src/ui/game-ui.ts`)
   - Bottom bar para desktop
   - Drawer móvil colapsable
   - Gestión de verbos e inventario

10. **Save/Load** (`src/game/save-load.ts`)
    - Guardado en localStorage
    - Export/import de guardados
    - Gestión de versiones

### Sistema de Blockchain

### 1. Configuración Centralizada (`src/web3/config.ts`)

- **Contratos**: Direcciones de todos los contratos (ERC721, ERC1155, ERC20)
- **Red**: Configuración de Base Mainnet
- **Alchemy**: API keys con soporte para múltiples keys y fallback
- **ABIs**: ABIs mínimos necesarios para cada tipo de contrato

```typescript
import { getBlockchainConfig } from './src/web3/config';

const config = getBlockchainConfig();
const erc721Address = config.getContractAddress('ERC721');
const apiKeys = config.getAllAlchemyApiKeys();
```

### 2. Cliente de Alchemy (`src/web3/alchemy-client.ts`)

- **Fallback automático**: Intenta con múltiples API keys si una falla
- **Rate limiting**: Controla requests por segundo (25 req/s por defecto)
- **Retry con exponential backoff**: Maneja errores temporales
- **Timeout configurable**: Evita requests colgados

```typescript
import { getAlchemyClient } from './src/web3/alchemy-client';

const client = getAlchemyClient();
const nfts = await client.getNFTsForOwner(
  '0x...',
  ['0x...'], // contract addresses
  'ERC1155'
);
```

### 3. Sistema de Filtros Extensible (`src/game/filters/filter-config.ts`)

- **Filtros predefinidos**: Floppy discs, Serums, AdrianZERO, Traits
- **Fácilmente extensible**: Agregar nuevos filtros es simple
- **Configuración declarativa**: Define filtros con reglas claras

```typescript
import { filterItems, addCustomFilter } from './src/game/filters';

// Filtrar items
const floppies = filterItems(allItems, 'floppy');

// Agregar filtro personalizado
addCustomFilter({
  id: 'myFilter',
  name: 'My Custom Filter',
  rules: [
    { type: 'tokenIdRange', value: { min: 20000, max: 20010 }, operator: 'range' }
  ]
});
```

### 4. Carga de NFTs (`src/web3/nft-loader.ts`)

- **Paginación automática**: Carga todas las páginas necesarias
- **Filtrado integrado**: Aplica filtros durante la carga
- **Procesamiento de metadata**: Extrae imágenes, nombres, etc.
- **Límites configurables**: Controla cuántos items cargar

```typescript
import { loadAllNFTs } from './src/web3/nft-loader';

const items = await loadAllNFTs(
  '0x...', // owner
  ['0x...'], // contract addresses
  'ERC1155',
  'floppy' // filterId opcional
);
```

### 5. Sistema de Gating (`src/web3/gating.ts`)

- **Verificación de ownership**: ERC721, ERC1155, ERC20
- **Filtros de items**: Gating basado en tipos de items
- **Reglas múltiples**: AND y OR lógicos
- **Helpers**: Funciones para casos comunes

```typescript
import { checkGatingRule, createFloppyGatingRule } from './src/web3/gating';

// Verificar gating para floppy discs
const rule = createFloppyGatingRule();
const check = await checkGatingRule('0x...', rule);

if (check.passed) {
  // Usuario tiene acceso
}
```

### 6. Gestor de Inventario (`src/game/inventory/inventory-manager.ts`)

- **Carga automática**: Carga items cuando se conecta wallet
- **Categorización**: Organiza items por tipo
- **Selección**: Maneja item seleccionado
- **Eventos**: Sistema de listeners para cambios
- **Estadísticas**: Cuenta items por categoría

```typescript
import { getInventoryManager } from './src/game/inventory';

const inventory = getInventoryManager();

// Cargar inventario
await inventory.loadInventory('0x...');

// Obtener items por categoría
const floppies = inventory.getItemsByCategory('floppy');

// Seleccionar item
inventory.selectItem(item);

// Suscribirse a cambios
inventory.on('loaded', (state) => {
  console.log('Inventario cargado:', state.allItems.length);
});
```

## 🔧 Uso Básico

### Ejemplo: Cargar inventario de un usuario

```typescript
import { getInventoryManager } from './src/game/inventory';
import { getBlockchainConfig } from './src/web3/config';

const inventory = getInventoryManager();
const config = getBlockchainConfig();

// Cargar inventario
await inventory.loadInventory('0x...');

// Obtener floppy discs
const floppies = inventory.getItemsByFilter('floppy');

// Obtener estadísticas
const stats = inventory.getStats();
console.log(`Total items: ${stats.total}, Floppies: ${stats.floppy}`);
```

### Ejemplo: Verificar gating

```typescript
import { checkGatingRule, createFloppyGatingRule } from './src/web3/gating';

const rule = createFloppyGatingRule();
const check = await checkGatingRule('0x...', rule);

if (check.passed) {
  console.log('✅ Usuario tiene acceso');
  console.log('Items encontrados:', check.details?.items);
} else {
  console.log('❌ Acceso denegado:', check.reason);
}
```

### Ejemplo: Agregar filtro personalizado

```typescript
import { addCustomFilter } from './src/game/filters';

addCustomFilter({
  id: 'specialItems',
  name: 'Special Items',
  description: 'Items especiales del juego',
  rules: [
    {
      type: 'tokenIdRange',
      value: { min: 50000, max: 50099 },
      operator: 'range'
    }
  ],
  displayName: (tokenId) => `Special Item #${tokenId - 50000}`
});
```

## 🔄 Mejoras sobre adventureold/

1. **Modularidad**: Código separado en módulos reutilizables
2. **TypeScript**: Tipado fuerte para mejor mantenibilidad
3. **Fallback de API keys**: Múltiples keys de Alchemy con fallback automático
4. **Sistema de filtros extensible**: Fácil agregar nuevos tipos de items
5. **Gestor de inventario centralizado**: Estado único y eventos
6. **Sistema de gating**: Verificación de acceso basada en ownership
7. **Documentación**: Código documentado y README completo

## 📝 Notas de Implementación

### API Keys de Alchemy

Las API keys se pueden configurar de dos formas:

1. **Config externa** (recomendado para producción):
   - Crear `config-keys.js` con estructura:
   ```javascript
   window.ALCHEMY_KEYS_CONFIG = {
     primary: 'tu-api-key-primaria',
     fallbacks: ['fallback-1', 'fallback-2']
   };
   ```

2. **Fallback hardcodeado** (solo desarrollo):
   - Se usa la key de fallback definida en `config.ts`

### Extensión del Sistema

Para agregar nuevos elementos de blockchain:

1. **Nuevo tipo de contrato**: Agregar a `CONTRACTS` en `config.ts`
2. **Nuevo filtro**: Usar `addCustomFilter()` o agregar a `ITEM_FILTERS`
3. **Nueva regla de gating**: Crear función helper en `gating.ts`

## 🚧 Próximos Pasos

- [ ] Integrar wallet connector (ethers.js)
- [ ] Implementar verificación de balance ERC20
- [ ] Agregar caché local para NFTs
- [ ] Sistema de sincronización con Supabase (opcional)
- [ ] Tests unitarios

## 📚 Referencias

- **adventureold/**: Sistema original con lógica de inventario
- **MARKET/**: APIs de Alchemy y configuración de contratos
- **TRAITLAB/**: Sistema de filtros y carga de NFTs
- **promptinicial.json**: Especificación completa del proyecto



