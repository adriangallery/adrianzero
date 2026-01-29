# INFORME TÉCNICO DE TRAITLAB

**Fecha de análisis**: 2026-01-28
**Versión analizada**: TraitLAB v2/v3
**Objetivo**: Documentación exhaustiva de arquitectura, componentes y flujos para optimizaciones futuras

---

## 📑 ÍNDICE DE NAVEGACIÓN RÁPIDA

### 1. Visión General
- [Resumen Ejecutivo](#resumen-ejecutivo)
- [Estadísticas del Sistema](#estadísticas-del-sistema)
- [Propósito y Funcionalidad](#propósito-y-funcionalidad)

### 2. Arquitectura
- [Patrón Arquitectónico](#patrón-arquitectónico)
- [Flujo de Inicialización](#flujo-de-inicialización)
- [Estructura de Directorios](#estructura-de-directorios)

### 3. Componentes (Módulos)
- [Mapa de Módulos (19 módulos)](#mapa-de-módulos)
- [Core Modules](#core-modules)
- [Feature Modules](#feature-modules)
- [Utility Modules](#utility-modules)

### 4. Flujo de Datos
- [Diagrama de Flujo General](#diagrama-de-flujo-general)
- [Estados y Caché](#estados-y-caché)
- [Eventos Inter-Módulos](#eventos-inter-módulos)

### 5. Dependencias
- [Librerías Externas](#librerías-externas)
- [Contratos Blockchain](#contratos-blockchain)
- [APIs y Servicios](#apis-y-servicios)

### 6. Lógica de Negocio
- [Flujos de Usuario](#flujos-de-usuario)
- [Reglas y Validaciones](#reglas-y-validaciones)
- [Operaciones Clave](#operaciones-clave)

### 7. Optimización
- [Áreas de Optimización](#áreas-de-optimización)
- [Patrones de Performance](#patrones-de-performance)

### 8. Referencia Rápida
- [Índice de Ubicaciones](#índice-de-ubicaciones)
- [Glosario de Términos](#glosario-de-términos)
- [Whale Fixes Issue](#whale-fixes-issue)

---

## RESUMEN EJECUTIVO

**TRAITLAB** es una aplicación web completa (no un simple componente) construida con JavaScript vanilla que gestiona NFTs en el ecosistema AdrianZERO sobre la blockchain Base Mainnet.

### ¿Qué hace?
- Gestiona tokens ERC721 (AdrianZERO) y ERC1155 (traits, packs, serums)
- Permite aplicar traits visuales a tokens NFT
- Sistema de apertura de packs/floppies
- Personalización de tokens (nombres, efectos, combinaciones)
- Generación de imágenes combinadas
- Sistema de crafting de items

### Características Técnicas
- **Arquitectura**: Modular event-driven con singletons
- **Sin frameworks**: JavaScript vanilla puro
- **19 módulos** independientes y reutilizables
- **3 versiones**: producción (`/traitlab`), experimental (`/traitlabv3`), testing (`/traitlabtests`)
- **Carga paralela**: Background loading de datos
- **Lazy loading**: Paginación para grandes colecciones
- **Whale Fixes**: Sistema de Virtual DOM para limitar elementos DOM en móviles (SAFU mode)

---

## ESTADÍSTICAS DEL SISTEMA

```
Líneas de código JS:    ~14,656 líneas
Número de módulos:       19 módulos principales
Tamaño total:            1.0 GB (principalmente assets SVG)
Contratos blockchain:    13 contratos diferentes
Red:                     Base Mainnet (Chain ID: 8453)
Versiones:              3 (traitlab, traitlabv3, traitlabtests)
```

---

## PROPÓSITO Y FUNCIONALIDAD

TRAITLAB es un **laboratorio digital de composición de NFTs** donde los usuarios pueden:

1. **Personalizar tokens** aplicando traits visuales por categoría
2. **Abrir packs** para obtener nuevos activos aleatorios
3. **Aplicar serums** para modificar tokens
4. **Renombrar tokens** usando el Name Registry
5. **Generar visualizaciones** (Lambo images, combinaciones de traits)
6. **Craftear items** siguiendo recetas del contrato

---

## PATRÓN ARQUITECTÓNICO

### Tipo: Modular Singleton + Event-Driven

```
┌─────────────────────────────────────────────────────┐
│           TraitLABv2 (Root Application)             │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │        AppInitializer (Orchestrator)          │  │
│  │  - Inicializa módulos en orden                │  │
│  │  - Configura event listeners                  │  │
│  │  - Setup tabs y UI                            │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │         Módulos Core (6 módulos)            │   │
│  │  ┌─────────┐  ┌─────────┐  ┌────────────┐  │   │
│  │  │ Config  │  │ Wallet  │  │    Data    │  │   │
│  │  │         │  │ Manager │  │  Manager   │  │   │
│  │  └─────────┘  └─────────┘  └────────────┘  │   │
│  │  ┌─────────┐  ┌─────────┐  ┌────────────┐  │   │
│  │  │   UI    │  │  Zero   │  │   Filters  │  │   │
│  │  │ Manager │  │ Manager │  │            │  │   │
│  │  └─────────┘  └─────────┘  └────────────┘  │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │      Feature Modules (10 módulos)           │   │
│  │  - Traits, Floppy, Serums                   │   │
│  │  - Crafting, Customise, Lambo               │   │
│  │  - StickyPopup, TokenSelection              │   │
│  │  - Display, Gallery                         │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │         Utilidades (3 módulos)              │   │
│  │  - UITemplates, ImageLoader, Utils          │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
           ↕ Event-driven communication
        (on/emit pattern entre módulos)
```

### Características Arquitectónicas

**1. Modularidad Total**
- Cada módulo es independiente y exportado a `window`
- Singletons accesibles globalmente (e.g., `window.TraitLABConfig`)
- Sin dependencias circulares

**2. Event-Driven Communication**
- Módulos se comunican via eventos (`.on()`, `.emit()`)
- Desacoplamiento entre componentes
- Ejemplo: `wallet.on('walletConnected', handler)`

**3. Lazy Loading & Virtual DOM**
- Carga bajo demanda de datos (traits paginados)
- Paginación con `pageKey` de Alchemy API
- **Virtual DOM en modo SAFU** (limita elementos en móviles):
  - **Problema original**: Algunos móviles no podían renderizar más de ~100-200 elementos DOM simultáneamente sin crashear
  - **Solución implementada**: Sistema de Virtual DOM que mantiene máximo 100 elementos en DOM
  - **Estado actual**: ⚠️ Implementación parcial - no muestra correctamente todos los traits en wallets grandes (whales)
  - Ver sección "Whale Fixes Issue" para análisis detallado y soluciones propuestas

**4. Caché Centralizado**
- `DataManager` mantiene caché de todos los tokens
- Carga paralela de ERC721 y ERC1155
- Estados de carga compartidos

**5. Fallbacks Múltiples**
- RPC providers con fallback automático
- URLs de imágenes local → Vercel CDN
- API keys de Alchemy con retry logic

---

## FLUJO DE INICIALIZACIÓN

### Secuencia de Arranque

```
1. index.html carga
   ↓
2. Cargar scripts en orden específico:
   config-keys.js → config.js → utils → wallet → modules → app-initializer
   ↓
3. DOMContentLoaded event
   ↓
4. new TraitLABv2() (clase raíz)
   ↓
5. window.app.init()
   ↓
6. AppInitializer.initialize()
   ├─→ initializeModules() (instanciar 19 módulos)
   ├─→ setupEventListeners() (conectar eventos)
   └─→ setupTabs() (configurar UI)
   ↓
7. Wallet auto-connect check
   ↓
8. DataManager.init() - Carga paralela:
   ├─→ loadAdrianZeroTokens() [ERC721]
   └─→ loadAdrianLabTokens() [ERC1155]
   ↓
9. UI renderiza tokens
   ↓
10. App lista para interacción
```

### Orden de Carga de Scripts (CRÍTICO)

```html
<!-- 1. Configuración -->
<script src="config-keys.js"></script>
<script src="modules/config.js"></script>

<!-- 2. Utilidades -->
<script src="modules/utils/image-loader.js"></script>

<!-- 3. Core modules -->
<script src="modules/wallet.js"></script>
<script src="modules/sticky-popup-manager.js"></script>
<script src="modules/data-manager.js"></script>
<script src="modules/filters.js"></script>
<script src="modules/display-manager.js"></script>
<script src="modules/token-selection-manager.js"></script>

<!-- 4. Orchestrator -->
<script src="modules/app-initializer.js"></script>

<!-- 5. UI y templates -->
<script src="modules/ui-templates.js"></script>

<!-- 6. Feature modules -->
<script src="modules/traits.js"></script>
<script src="modules/floppy.js"></script>
<script src="modules/serums.js"></script>
<script src="modules/crafting.js"></script>
<script src="modules/zero.js"></script>
<script src="modules/customise.js"></script>
<script src="modules/lambo.js"></script>
<script src="modules/ui.js"></script>
```

**⚠️ IMPORTANTE**: El orden es crítico. `config.js` debe cargarse antes que cualquier módulo que lo use.

---

## ESTRUCTURA DE DIRECTORIOS

### /traitlab (PRODUCCIÓN)

```
traitlab/
├── index.html              # Punto de entrada principal
├── play.html               # Versión play/testing
├── playground.html         # Área de pruebas
├── test-modules.html       # Testing de módulos
│
├── config-keys.js          # API keys (generado por CI/CD)
├── adrian-name-registry-abi.json
├── zoom-toggle-abi.json
│
├── modules/                # 19 módulos principales
│   ├── app-initializer.js  # Orchestrator (8KB)
│   ├── config.js           # Configuración centralizada (6KB)
│   ├── wallet.js           # Gestión wallet (15KB)
│   ├── ui.js               # UI principal (103KB) ⚠️
│   ├── ui-templates.js     # Templates HTML (22KB)
│   ├── data-manager.js     # Caché y carga (79KB) ⚠️
│   ├── zero.js             # Tokens ERC721 (75KB) ⚠️
│   ├── display-manager.js  # Visualización (25KB)
│   ├── sticky-popup-manager.js  # Popup flotante (82KB) ⚠️
│   ├── token-selection-manager.js (15KB)
│   ├── filters.js          # Filtrado (8.5KB)
│   ├── traits.js           # Traits logic (17KB)
│   ├── floppy.js           # Floppys (46KB)
│   ├── serums.js           # Serums (14KB)
│   ├── crafting.js         # Crafting (16KB)
│   ├── customise.js        # Personalización (43KB)
│   ├── lambo.js            # Lambo generator (5.7KB)
│   ├── gallery-manager.js  # Galería (28KB)
│   ├── styles.css          # Estilos (51KB)
│   └── utils/
│       └── image-loader.js # Cargador de imágenes
│
├── json/
│   └── traits.json         # Base de datos de traits
│
├── assets/
│   └── traits/             # Imágenes SVG (la mayoría del 1GB)
│       ├── 100690.svg
│       ├── 111.svg
│       └── ... (cientos de archivos)
│
└── docs/
    └── IMPLEMENTACION_IMAGENES_LOCALES.md
```

**⚠️ Archivos pesados** (candidatos para optimización):
- `ui.js` (103KB)
- `sticky-popup-manager.js` (82KB)
- `data-manager.js` (79KB)
- `zero.js` (75KB)

### /traitlabv3 (EXPERIMENTAL)

Misma estructura que `/traitlab` con adiciones:

```
traitlabv3/
├── [todos los archivos de /traitlab]
├── modules/
│   └── supabase-cache.js   # NUEVO: Caché de Supabase
└── docs/
    ├── SUPABASE_SETUP.md
    ├── CHECKLIST_REVISION_ORIGINAL_VS_V3.md
    ├── PLAN_REVISION_POPUP_Y_MEMORIA.md
    └── implementacion/
        └── [múltiples docs de implementación]
```

### /traitlabtests (TESTING)

Estructura idéntica a `/traitlab` para QA.

---

## MAPA DE MÓDULOS

### Core Modules (6 módulos)

#### 1. **Config** (`modules/config.js`)
**Clase**: `TraitLABConfig` (singleton en `window.TraitLABConfig`)
**Responsabilidad**: Configuración centralizada
**Tamaño**: 6.4 KB

**Propiedades clave**:
```javascript
CONTRACTS = {
    ERC721: "0x6e369bf0e4e0c106192d606fb6d85836d684da75",
    ERC1155: "0x90546848474fb3c9fda3fdad887969bb244e7e58",
    CRAFTING: "0x9ab651F50ac78A13a1612CCDDF5a074B2e570829"
}

NETWORK = {
    name: "Base Mainnet",
    chainId: 8453,
    rpcUrl: "https://mainnet.base.org"
}

BASE_RPC_URLS = [
    "https://mainnet.base.org",
    "https://base.llamarpc.com",
    "https://base-rpc.publicnode.com"
]
```

**Métodos importantes**:
- `getAllAlchemyApiKeys()` - Obtener API keys con fallback
- `getBaseProviderWithFallback()` - Provider con múltiples RPC
- `loadAlchemyKeysFromConfig()` - Cargar desde CI/CD

**Contratos adicionales** (13 en total):
```javascript
ADRIAN_LAB_CORE_CONTRACT
TRAITS_EXTENSIONS_CONTRACT
ADRIAN_CRAFTING_CONTRACT
ADRIAN_NAME_REGISTRY_CONTRACT
ACTION_PACKS_CONTRACT
NEW_FLOPPY_PACK_CONTRACT
ADRIAN_FLOPPY_DISCS_CONTRACT
PACK_TOKEN_MINTER_CONTRACT
ACTION_PACK_10007_CONTRACT
OPENPACK_V4_CONTRACT
SERUM_MODULE_CONTRACT
ZOOM_TOGGLE_CONTRACT
ADRIAN_TOKEN (ERC20)
```

#### 2. **Wallet Manager** (`modules/wallet.js`)
**Clase**: `WalletManager` (en `window.TraitLABWallet`)
**Responsabilidad**: Gestión de conexión a wallet
**Tamaño**: 15 KB

**Métodos principales**:
```javascript
connectWallet()        // Conectar MetaMask/WalletConnect
disconnectWallet()     // Desconectar
checkConnection()      // Verificar estado
getCurrentAccount()    // Obtener cuenta actual
isWalletConnect()      // Detectar tipo de wallet
```

**Features**:
- Soporte WalletConnect con delays especiales
- Auto-detección de tipo de wallet
- Eventos: `walletConnected`, `walletDisconnected`, `uiUpdate`
- Verificación de red (Base Mainnet)

#### 3. **Data Manager** (`modules/data-manager.js`)
**Clase**: `TraitLABDataManager`
**Responsabilidad**: Carga y caché de datos en background
**Tamaño**: 79 KB ⚠️

**Estructura de caché**:
```javascript
cache = {
    adrianZero: null,      // ERC721 tokens
    adrianLab: null,       // ERC1155 tokens
    loading: {
        adrianZero: false,
        adrianLab: false
    },
    ready: {
        adrianZero: false,
        adrianLab: false
    }
}

paginationState = {
    traits: {
        pageKey: null,
        hasMore: false,
        batchSize: 50,
        seenPageKeys: new Set()
    }
}
```

**Métodos clave**:
```javascript
init()                          // Carga paralela de datos
loadAdrianZeroTokensBasic()     // ERC721 completo
loadAdrianLabTokens()           // ERC1155 con paginación
getFilteredTokens(filter)       // Del caché
loadMoreTraits()                // Paginación bajo demanda
loadFloppyTokensOnDemand()
loadAdrianLabTokensOnDemand()
```

**Eventos**:
- `adrianZeroReady`
- `adrianLabReady`
- `adrianLabTokensReady`

**Optimización**: Carga paralela con `Promise.all()`:
```javascript
await Promise.all([
    this.loadAdrianZeroTokensBasic(),
    this.loadAdrianLabTokens()
]);
```

#### 4. **UI Manager** (`modules/ui.js`)
**Clase**: `UIManager` (en `window.TraitLABUI`)
**Responsabilidad**: Renderizado principal de interfaz
**Tamaño**: 103 KB ⚠️ (el más pesado)

**Métodos principales**:
```javascript
displayTokens(tokens, filter)       // Renderizar grid
displayPlaceholders(count)          // Placeholders durante carga
updateSelectionInfo()               // Info de selección
getImagePath(token, filter)         // Ruta imagen con fallback
showLoading/hideLoading()
showError/showSuccess()
displayLamboImage()
displayTokenNamesOnly()             // Actualización progresiva
refreshTokensMetadata()             // Sin re-render
```

**Features especiales**:
- **Virtual DOM (SAFU mode)**: Limita elementos en móviles
- **Lazy loading**: Paginación visual
- **Actualización progresiva**: Nombres sin recargar imágenes
- **Multi-selección de packs**: Hasta 4 packs simultáneos

#### 5. **Zero Manager** (`modules/zero.js`)
**Clase**: `ZeroManager` (en `window.TraitLABZero`)
**Responsabilidad**: Gestión tokens ERC721 (AdrianZERO)
**Tamaño**: 75 KB ⚠️

**Métodos clave**:
```javascript
loadTokens(address, contract, filter, skipMetadata, limit, pageKey, options)
loadCustomNames()                   // Desde Name Registry
refreshMetadata()                   // Actualizar desde Alchemy
activateToken(tokenId)              // Toggle en contrato
renameToken(tokenId, newName)       // Renombrar
loadActiveToggles()                 // Toggles de Zoom contract
fetchWithAlchemyFallback()          // Fetch con retry
```

**Features**:
- Manejo completo de metadata
- Sistema de nombres personalizados
- Integración con Zoom Toggle contract
- Retry logic para rate limits (429)
- Fallback entre múltiples API keys

#### 6. **Filters** (`modules/filters.js`)
**Clase**: `TokenFilters` (en `window.TraitLABFilters`)
**Responsabilidad**: Filtrado de tokens por tipo
**Tamaño**: 8.5 KB

**Métodos de filtrado**:
```javascript
filterTokensByType(tokens, filterType)
filterFloppyTokens(tokens)      // IDs: 10000-10018, 15000-15015, 1123
filterSerumTokens(tokens)       // IDs: 262144-262147
filterTraitTokens(tokens)       // Traits ERC1155
filterAdrianZeroTokens(tokens)  // ERC721
isFloppyToken(tokenId)
isSerumToken(tokenId)
getTokenStats(tokens)
```

**Lógica de filtrado**: Basada en rangos de ID específicos (no automático)

### Feature Modules (10 módulos)

#### 7. **Traits Manager** (`modules/traits.js`)
**Clase**: `TraitsManager` (en `window.TraitLABTraits`)
**Tamaño**: 17 KB

**Funcionalidad**: Base de datos de traits y aplicación a tokens

**Métodos**:
```javascript
loadTraitsDatabase()            // Cargar traits.json
getTraitCategory(traitId)       // Categoría del trait
handleTraitSelection(token)     // Manejar selección
generateCombinedImage()         // Generar preview
applyTraitsToNFT(tokenId, traitIds)  // Aplicar en blockchain
clearTraitsSelection()
```

**Reglas de negocio**:
- Solo 1 trait por categoría
- Click en trait seleccionado = deseleccionar
- Validación de categorías antes de enviar transacción

**URL de imagen combinada**:
```
https://adrianlab.vercel.app/api/render/custom-external/{tokenId}?trait=X&trait=Y&trait=Z
```

**Eventos**:
- `traitsDatabaseLoaded`
- `traitSelected`, `traitDeselected`
- `traitsSelectionUpdated`, `traitsSelectionCleared`
- `imageGenerated`
- `traitsApplied`

#### 8. **Floppy Manager** (`modules/floppy.js`)
**Clase**: `FloppyManager` (en `window.TraitLABFloppy`)
**Tamaño**: 46 KB

**Funcionalidad**: Gestión de floppy discs y packs

**Métodos de apertura** (múltiples tipos):
```javascript
openFloppy(tokenId)             // Disco normal
openSelectedPack()              // Pack seleccionado
openPack(tokenId)               // Pack genérico
openActionPack(tokenId)         // Action pack
openActionPack10007(tokenId)    // Pack específico 10007
```

**Mapeo de contratos por tokenId**:
```javascript
// OpenPackV4
10000-10005, 10009-10010, 10013-10015, 10018

// ActionPack10007
10007

// ActionPacks
10008, 10011, 10012, 10016, 15008-15015 (excepto 15010), 1123

// ADRIAN_FLOPPY_DISCS
10006
```

**Features**:
- Multi-selección de packs (hasta 4)
- Determinación automática de contrato correcto
- Validación de eligibilidad
- Cantidad variable por tipo

#### 9. **Serums Manager** (`modules/serums.js`)
**Clase**: `SerumsManager` (en `window.TraitLABSerums`)
**Tamaño**: 14 KB

**Métodos**:
```javascript
useSerum(tokenId, serumId)
loadSerumMetadata()
getSerumInfo(serumId)
```

**IDs de serums**: 262144-262147

#### 10. **Crafting Module** (`modules/crafting.js`)
**Clase**: `TraitLABCrafting`
**Tamaño**: 16 KB

**Métodos**:
```javascript
loadRecipes()               // Del contrato
craft(recipeId, inputs)
getAvailableRecipes()
```

**Feature**: Lee recetas directamente del contrato inteligente

#### 11. **Customise Manager** (`modules/customise.js`)
**Clase**: `CustomiseManager` (en `window.TraitLABCustomise`)
**Tamaño**: 43 KB

**Métodos**:
```javascript
customiseToken(tokenId)
generateCustomImage()
applyCustomisation()
```

**Feature**: Editor visual de tokens

#### 12. **Lambo Manager** (`modules/lambo.js`)
**Clase**: `LamboManager` (en `window.TraitLABLambo`)
**Tamaño**: 5.7 KB

**Métodos**:
```javascript
generateLamboImage(tokenId, color)
selectLamboColor(color)
getLamboColors()
```

**Colores disponibles** (11):
Yellow, Red, Blue, Cyan, Green, Indigo, Lilac, Orange, Pink, Purple, Rainbow

**Eventos**:
- `lamboImageGenerated`
- `lamboColorSelected`

#### 13. **Sticky Popup Manager** (`modules/sticky-popup-manager.js`)
**Clase**: `StickyPopupManager`
**Tamaño**: 82 KB ⚠️

**Funcionalidad**: Popup flotante en el lado derecho

**Métodos**:
```javascript
init()
configureFloppyButtons()
updateSelectionInfo()
displayPopupContent(filter)
setupScrollHideBehavior()       // Ocultar en scroll (móviles)
```

**Features**:
- Multi-selección de packs (hasta 4)
- Ocultamiento durante scroll en móviles
- Contenido dinámico según tab activo
- Botones contextuales

#### 14. **Token Selection Manager** (`modules/token-selection-manager.js`)
**Tamaño**: 15 KB

**Métodos**:
```javascript
onTokenSelected(token, filter)
updateSelection()
getSelectionState()
```

**Feature**: Coordina selecciones entre módulos

#### 15. **Display Manager** (`modules/display-manager.js`)
**Clase**: `DisplayManager` (en `window.TraitLABDisplayManager`)
**Tamaño**: 25 KB

**Métodos**:
```javascript
displayCraftingContent()
getRecipeOutputImageTag()
```

**Feature**: Renderizado especializado de crafting

#### 16. **Gallery Manager** (`modules/gallery-manager.js`)
**Clase**: `GalleryManager`
**Tamaño**: 28 KB

**Funcionalidad**: Gestión de galería de tokens

### Utility Modules (3 módulos)

#### 17. **UI Templates** (`modules/ui-templates.js`)
**Clase**: `UITemplates`
**Tamaño**: 22 KB

**Métodos**:
```javascript
renderAllTemplates()
getMenuTemplate()
getMainTemplate()
// Templates para cada tab
```

**Feature**: Todos los templates HTML organizados en métodos

#### 18. **Image Loader** (`modules/utils/image-loader.js`)
**Clase**: `TraitImageLoader`
**Tamaño**: Pequeño

**Métodos**:
```javascript
getTraitImageUrl(tokenId, local)  // Con fallback local → Vercel
cacheImageUrl(tokenId, url)
```

**Fallback chain**:
```
Local: ./assets/traits/{id}.svg
 ↓ (si falla)
Vercel: https://adrianzero.com/traitlab/assets/traits/{id}.svg
```

#### 19. **App Initializer** (`modules/app-initializer.js`)
**Clase**: `AppInitializer`
**Tamaño**: 8.1 KB

**Métodos de orchestration**:
```javascript
initializeModules()         // Instanciar 19 módulos en orden
setupEventListeners()       // Conectar eventos
setupTabs()                 // Configurar UI tabs
initialize()                // Flujo completo
```

**Delay especial para WalletConnect**:
```javascript
if (detectWalletConnect) {
    await new Promise(resolve => setTimeout(resolve, 1500));
}
```

---

## DIAGRAMA DE FLUJO GENERAL

### Flujo de Datos Principal

```
1. CONEXIÓN
   Usuario → MetaMask/WalletConnect
             ↓
   WalletManager.connectWallet()
             ↓
   Verificar red Base (chainId: 8453)
             ↓
   Emit 'walletConnected'

2. CARGA DE DATOS (Paralela)
   DataManager.init()
       ↓
   Promise.all([
       loadAdrianZero(),    // ERC721 via Alchemy
       loadAdrianLab()      // ERC1155 via Alchemy
   ])
       ↓
   Cache en DataManager
       ↓
   Emit 'adrianZeroReady', 'adrianLabReady'

3. RENDERIZADO
   UIManager.displayTokens(tokens, filter)
       ↓
   Filtrar por tipo (Filters.filterTokensByType)
       ↓
   Generar HTML cards
       ↓
   Lazy loading / Virtual DOM (SAFU mode)
       ↓
   Mostrar en grid

4. INTERACCIÓN USUARIO

   A) Aplicar Traits:
      Seleccionar ERC721 → Seleccionar Traits (ERC1155)
                        ↓
      TraitsManager.generateCombinedImage()
                        ↓
      Preview en Vercel API
                        ↓
      TraitsManager.applyTraitsToNFT()
                        ↓
      Transacción blockchain (TRAITS_EXTENSIONS_CONTRACT)
                        ↓
      tx.wait() → Success

   B) Abrir Pack:
      Seleccionar Pack → FloppyManager.openSelectedPack()
                      ↓
      Determinar contrato (OpenPackV4, ActionPack, etc.)
                      ↓
      Transacción blockchain
                      ↓
      Emit 'floppyOpened'

   C) Renombrar Token:
      ZeroManager.renameToken()
           ↓
      Approve ADRIAN token (ERC20)
           ↓
      NAME_REGISTRY.setTokenName()
           ↓
      Emit 'tokenRenamed'
```

---

## ESTADOS Y CACHÉ

### Estado Global de la App

**Ubicación**: `window.app` (instancia de `TraitLABv2`)

```javascript
window.app = {
    modules: {
        wallet,
        zero,
        ui,
        dataManager,
        traits,
        floppy,
        serums,
        crafting,
        customise,
        lambo,
        filters,
        displayManager,
        tokenSelection
    },
    stickyPopupManager,
    currentContract: "ERC721" | "ERC1155",
    currentFilter: "adrianzero" | "traits" | "floppy" | "serum" | "crafting" | ...,
    tokensAlreadyDisplayed: boolean,
    pendingAdrianZeroTokens: []
}
```

### Caché de DataManager

```javascript
{
    adrianZero: Token[],        // Todos los ERC721
    adrianLab: Token[],         // Todos los ERC1155
    loading: {
        adrianZero: boolean,
        adrianLab: boolean
    },
    ready: {
        adrianZero: boolean,
        adrianLab: boolean
    }
}
```

### Estados de Selección

**Traits Manager**:
```javascript
{
    selectedERC721: Token | null,
    selectedERC1155: Token[],        // Múltiples traits
    categoriesMap: Map<category, traitId>
}
```

**Floppy Manager**:
```javascript
{
    selectedPacks: Token[],          // Hasta 4 packs
    selectedFloppy: Token | null
}
```

---

## EVENTOS INTER-MÓDULOS

### Patrón de Eventos

Todos los módulos implementan:
```javascript
on(eventName, callback)      // Suscribirse
emit(eventName, data)        // Emitir
```

### Eventos por Módulo

**WalletManager**:
```javascript
'walletConnected' → { account, contract }
'walletDisconnected' → {}
'uiUpdate' → { type, account, contract }
'contractChanged' → { contract }
```

**DataManager**:
```javascript
'adrianZeroReady' → { tokens }
'adrianLabReady' → { tokens }
'adrianLabTokensReady' → { tokens }
```

**TraitsManager**:
```javascript
'traitsDatabaseLoaded' → {}
'traitsDatabaseError' → { error }
'traitSelected' → { token, category }
'traitDeselected' → { token, category }
'traitsSelectionUpdated' → { selected }
'traitsSelectionCleared' → {}
'imageGenerated' → { imageUrl }
'traitsApplied' → { tokenId, traitIds, txHash }
```

**FloppyManager**:
```javascript
'floppySelected' → { token }
'floppySelectionCleared' → {}
'floppyOpened' → { tokenId, txHash, receipt }
```

**UIManager**:
```javascript
'tokenSelected' → { token, filter }
'packsSelectionChanged' → { packs }
```

**LamboManager**:
```javascript
'adrianZeroTokensLoaded' → { tokens }
'adrianZeroSelected' → { token }
'lamboColorSelected' → { color }
'lamboImageGenerated' → { tokenId, color, imageUrl }
'selectionCleared' → {}
```

**ZeroManager**:
```javascript
'erc721Selected' → { token }
'erc721SelectionCleared' → {}
```

---

## LIBRERÍAS EXTERNAS

### JavaScript Libraries

**ethers.js v5.7.2**
- **Uso**: Interacción con blockchain
- **Carga**: Dinámica (solo cuando se necesita transacción)
- **Funciones usadas**:
  - `ethers.Contract()` - Instanciar contratos
  - `ethers.providers.JsonRpcProvider()` - Provider
  - `ethers.providers.FallbackProvider()` - Múltiples RPC
  - `ethers.utils.formatEther()` - Formatear precios
  - `signer.sendTransaction()` - Enviar transacciones

**Bootstrap 5.3.0**
- **Uso**: UI framework (solo CSS)
- **CDN**: `https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css`

### Fonts

**Google Fonts: VT323**
- **Tipo**: Monospace retro
- **URL**: `https://fonts.googleapis.com/css2?family=VT323&display=swap`

**Font Custom: ADRIAN_ZERO_FONT**
- **Ubicación**: `../components/fonts/ADRIAN_ZERO.otf`
- **Uso**: Branding específico

---

## CONTRATOS BLOCKCHAIN

### Red: Base Mainnet

```javascript
Chain ID: 8453 (0x2105 hex)
RPC URLs (con fallback):
  1. https://mainnet.base.org
  2. https://base.llamarpc.com
  3. https://base-rpc.publicnode.com
```

### Contratos Principales

| Nombre | Dirección | ABI | Uso |
|--------|-----------|-----|-----|
| **AdrianZERO (ERC721)** | `0x6e369bf0e4e0c106192d606fb6d85836d684da75` | Estándar ERC721 | Tokens principales NFT |
| **AdrianLAB (ERC1155)** | `0x90546848474fb3c9fda3fdad887969bb244e7e58` | Estándar ERC1155 | Traits, packs, serums |
| **AdrianCrafting** | `0x9ab651F50ac78A13a1612CCDDF5a074B2e570829` | Custom | Sistema de crafting |
| **TraitsExtensions** | `0x0995c0dA1ca071b792E852b6Ec531b7cD7d1F8D6` | Custom | Aplicar traits a tokens |
| **AdrianNameRegistry** | `0xaeC5ED33c88c1943BB7452aC4B571ad0b4c4068C` | Custom (`modules/adrian-name-registry-abi.json`) | Renombrar tokens |
| **ActionPacks** | `0xa7e2ae50e7f15d220cd3f61728e52d0e6e1b2e36` | Custom | Packs de acción |
| **NewFloppyPack** | `0x03f501158103dd54A23898bADf8E77Cb8305EB38` | Custom | Nuevos packs |
| **AdrianFloppyDiscs** | `0x56B3fCc1417f269138CB7eBA1272e8Ccfee8fFc8` | Custom | Floppies específicos |
| **PackTokenMinter** | `0x673bE1968A12470F93BE374AAB529a89d5D607d5` | Custom | Minting de packs |
| **ActionPack10007** | `0xA7e2Ae50E7f15D220CD3f61728E52D0E6e1b2E36` | Custom | Pack específico 10007 |
| **OpenPackV4** | `0x238083148F4FBF4232efe16261e7aa87CE787022` | Custom | Apertura de packs v4 |
| **SerumModule** | `0xEb84a51F8d59d1C55cACFd15074AeB104D82B2ec` | Custom | Uso de serums |
| **ZoomToggle** | `0x568933634be4027339c80F126C91742d41A515A0` | Custom (`zoom-toggle-abi.json`) | Toggles de zoom |
| **ADRIAN Token (ERC20)** | `0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea` | Estándar ERC20 | Pagos en token ADRIAN |

### ABIs Disponibles

**En archivos JSON**:
- `adrian-name-registry-abi.json`
- `zoom-toggle-abi.json`

**En config.js**:
```javascript
ERC20_ABI = [
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function balanceOf(address owner) view returns (uint256)"
]

ADRIAN_NAME_REGISTRY_ABI = [
    "function setTokenName(uint256 tokenId, string newName)",
    "function getTokenName(uint256 tokenId) view returns (string)",
    "function namePrice() view returns (uint256)",
    "function getCoreContract() view returns (address)"
]
```

---

## APIS Y SERVICIOS

### Alchemy API (Primario)

**Base URL**: `https://base-mainnet.g.alchemy.com/nft/v3`

**Endpoints usados**:
```javascript
GET /nft/v3/{apiKey}/getNFTsForOwner
  Params:
    - owner: address
    - contractAddresses[]: address[]
    - withMetadata: true
    - pageKey: string (para paginación)
    - pageSize: number (default 100)

GET /nft/v3/{apiKey}/getNFTMetadata
  Params:
    - contractAddress: address
    - tokenId: uint256
    - tokenType: ERC721 | ERC1155
```

**API Keys**:
- Cargadas desde `config-keys.js` (generado por GitHub Actions)
- Source: GitHub Secrets (`ALCHEMY_PRIMARY_KEY`)
- Fallback: Múltiples keys con retry logic

**Rate Limiting**:
- Detecta 429 (Too Many Requests)
- Retry con exponential backoff
- Fallback a siguiente API key

### Vercel API (Renderizado de Imágenes)

**Endpoints**:
```javascript
// Renderizar AdrianZERO base
GET https://adrianlab.vercel.app/api/render/{tokenId}.png

// Renderizar con zoom
GET https://adrianlab.vercel.app/api/render/{tokenId}.png?closeup=true

// Renderizar con traits aplicados
GET https://adrianlab.vercel.app/api/render/custom-external/{baseTokenId}
  Query params:
    - trait={traitId} (múltiples)
    Ejemplo: ?trait=1001&trait=1002&trait=1003

// Refresh metadata
GET https://adrianlab.vercel.app/api/metadata/{tokenId}
```

### Assets Locales

**Base de datos de traits**:
```
./json/traits.json
```
Estructura:
```json
{
  "traits": [
    {
      "id": 1001,
      "name": "Trait Name",
      "category": "EYES",
      "maxSupply": 100,
      ...
    }
  ]
}
```

**Imágenes SVG de traits**:
```
./assets/traits/{tokenId}.svg
```
Fallback: `https://adrianzero.com/traitlab/assets/traits/{tokenId}.svg`

---

## FLUJOS DE USUARIO

### 1. Aplicar Traits a Token

```
Usuario conecta wallet
   ↓
Selecciona tab "AdrianZERO"
   ↓
Click en token ERC721
   → ZeroManager.setSelectedERC721()
   → Emit 'erc721Selected'
   ↓
Selecciona tab "Traits"
   ↓
Click en trait (ERC1155)
   → TraitsManager.handleTraitSelection()
   → Validar categoría (1 por categoría)
   → Si categoria existe, reemplazar trait anterior
   → Emit 'traitSelected'
   ↓
Ver preview de imagen combinada
   → TraitsManager.generateCombinedImage()
   → URL: custom-external/{tokenId}?trait=X&trait=Y
   → Mostrar en UI
   ↓
Click "Apply Traits"
   → TraitsManager.applyTraitsToNFT()
   → Validar: ERC721 + al menos 1 trait
   → Validar: No duplicados de categoría
   → Cargar ethers.js dinámicamente
   → Contract: TRAITS_EXTENSIONS_CONTRACT.applyTraitMultiple()
   → MetaMask popup para firma
   → tx.wait() para confirmación
   ↓
Success
   → Emit 'traitsApplied' {tokenId, traitIds, txHash}
   → Limpiar selecciones
   → Mostrar mensaje de éxito
```

### 2. Abrir Pack/Floppy

```
Usuario conecta wallet
   ↓
Selecciona tab "Floppy"
   ↓
Click en pack (puede seleccionar hasta 4)
   → UI.onTokenSelected()
   → Emit 'packsSelectionChanged'
   → StickyPopupManager.configureFloppyButtons()
   ↓
Click "Open Pack" en sticky popup
   → FloppyManager.openSelectedPack()
   → Determinar contrato por tokenId:
      • 10000-10005, etc. → OPENPACK_V4
      • 10007 → ACTION_PACK_10007
      • 10008, etc. → ACTION_PACKS
      • 10006 → ADRIAN_FLOPPY_DISCS
   → Validar eligibilidad (canOpenPack)
   ↓
Transacción blockchain
   → contract.openPacks(packIds, quantities)
   → MetaMask popup
   → tx.wait()
   ↓
Success
   → Emit 'floppyOpened' {tokenId, txHash, receipt}
   → Refresh tokens del usuario
   → Mostrar contenido recibido
```

### 3. Renombrar Token

```
Usuario conecta wallet
   ↓
Selecciona tab "AdrianZERO"
   ↓
Click en token
   ↓
Click "Rename" en sticky popup
   ↓
ZeroManager.loadNamePrice()
   → NAME_REGISTRY.namePrice()
   → Formatear en ADRIAN tokens
   → Mostrar en UI
   ↓
Usuario ingresa nuevo nombre
   ↓
Click "Approve"
   → ZeroManager.approveRename()
   → ADRIAN_TOKEN.approve(NAME_REGISTRY, price)
   → tx.wait()
   ↓
Click "Rename"
   → ZeroManager.renameToken(tokenId, newName)
   → NAME_REGISTRY.setTokenName(tokenId, newName)
   → tx.wait()
   ↓
Success
   → Emit 'tokenRenamed'
   → Actualizar nombre en UI
   → Refresh custom names
```

### 4. Generar Lambo Image

```
Usuario conecta wallet
   ↓
Selecciona tab "Lambo"
   ↓
Click en token AdrianZERO
   → LamboManager.onAdrianZeroSelected()
   ↓
Selecciona color (11 opciones)
   → LamboManager.selectLamboColor(color)
   → Emit 'lamboColorSelected'
   ↓
LamboManager.generateLamboImage()
   → Construir URL con color
   → Emit 'lamboImageGenerated' {imageUrl, tokenId, color}
   ↓
UIManager.displayLamboImage()
   → Mostrar imagen generada
```

### 5. Crafting de Traits

```
Usuario conecta wallet
   ↓
Selecciona tab "Crafting"
   ↓
CraftingManager.loadRecipes()
   → Contract: ADRIAN_CRAFTING.getRecipes()
   → Mostrar recetas disponibles
   ↓
Selecciona receta
   ↓
Selecciona inputs (traits requeridos)
   ↓
Click "Craft"
   → CraftingManager.craft(recipeId, inputs)
   → Contract: ADRIAN_CRAFTING.craft()
   → tx.wait()
   ↓
Success
   → Recibir output trait
   → Refresh tokens del usuario
```

---

## REGLAS Y VALIDACIONES

### Reglas de Selección de Traits

**1. Un trait por categoría**:
```javascript
// Si existe trait en categoría X, al seleccionar otro en X:
categoriesMap.has(category) → Reemplazar anterior
```

**2. Toggle de selección**:
```javascript
// Click en trait ya seleccionado:
if (selectedERC1155.includes(token)) {
    // Deseleccionar
} else {
    // Seleccionar
}
```

**3. Validación pre-aplicación**:
```javascript
// Antes de enviar transacción:
- Verificar: selectedERC721 !== null
- Verificar: selectedERC1155.length > 0
- Verificar: No duplicados de categoría
- Verificar: Wallet conectada
- Verificar: Red correcta (Base)
```

### Reglas de Apertura de Packs

**1. Ownership**:
```javascript
// Usuario debe ser owner del pack
balance[user][packId] > 0
```

**2. Eligibilidad**:
```javascript
// Verificación en contrato
canOpenPack(user, packId) == true
```

**3. Pack activo**:
```javascript
// Para OpenPackV4
packConfigs(packId).active == true
```

**4. Cantidad**:
```javascript
// OpenPackV4 soporta múltiples packs
quantities[] ≤ balance[]

// Otros contratos: solo 1 por vez
quantity = 1
```

**5. No reapertura**:
```javascript
// Algunos packs solo pueden abrirse una vez
// Validación en contrato
```

### Reglas de Uso de Serums

**1. Selección singular**:
```javascript
// Solo 1 serum por operación
selectedSerum: Token | null
```

**2. Token activado**:
```javascript
// Pre-verificación (continúa si falla)
try {
    await checkTokenActivated(tokenId)
} catch {
    // Continuar de todos modos
}
```

**3. Ownership**:
```javascript
// Validación en contrato
balance[user][serumId] > 0
```

### Reglas de Renombrado

**1. Solo ERC721**:
```javascript
// No aplica a traits/packs
tokenType === "ERC721"
```

**2. Precio en ADRIAN**:
```javascript
// Debe aprobar ADRIAN token primero
ADRIAN.approve(NAME_REGISTRY, price)
```

**3. Validación de nombre**:
```javascript
// En contrato (ejemplo):
- Longitud: 1-32 caracteres
- Caracteres permitidos: alphanumeric + espacios
- No ofensivo (lista negra)
```

### Validación de Red

**1. Base Mainnet requerida**:
```javascript
chainId === 8453 // 0x2105 hex
```

**2. Auto-switch**:
```javascript
// Si usuario en otra red:
try {
    await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x2105' }]
    })
} catch (error) {
    if (error.code === 4902) {
        // Red no agregada, agregar
        await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{ chainId: '0x2105', ... }]
        })
    }
}
```

---

## OPERACIONES CLAVE

### Cálculo de URL de Imagen Combinada

**Entrada**: `baseTokenId` (ERC721), `traitIds[]` (ERC1155)

**Proceso**:
```javascript
const baseUrl = 'https://adrianlab.vercel.app/api/render/custom-external';
const queryParams = traitIds.map(id => `trait=${id}`).join('&');
const finalUrl = `${baseUrl}/${baseTokenId}?${queryParams}`;
```

**Ejemplo**:
```
Base: 208
Traits: [1001, 1002, 1003]
URL: https://adrianlab.vercel.app/api/render/custom-external/208?trait=1001&trait=1002&trait=1003
```

### Determinación de Contrato para Pack

**Entrada**: `tokenId` (del pack)

**Mapeo**:
```javascript
function getPackContract(tokenId) {
    // OpenPackV4
    if ([10000,10001,10002,10003,10004,10005,10009,10010,10013,10014,10015,10018].includes(tokenId)) {
        return OPENPACK_V4_CONTRACT;
    }

    // ActionPack10007
    if (tokenId === 10007) {
        return ACTION_PACK_10007_CONTRACT;
    }

    // ActionPacks
    if ([10008,10011,10012,10016,1123].includes(tokenId) ||
        (tokenId >= 15008 && tokenId <= 15015 && tokenId !== 15010)) {
        return ACTION_PACKS_CONTRACT;
    }

    // AdrianFloppyDiscs
    if (tokenId === 10006) {
        return ADRIAN_FLOPPY_DISCS_CONTRACT;
    }

    throw new Error('Unknown pack type');
}
```

### Resolución de Ruta de Imagen

**Entrada**: `tokenId`, `filter`, `isLocal`

**Proceso**:
```javascript
function getImagePath(tokenId, filter, isLocal = false) {
    const baseLocal = isLocal ? '.' : 'https://adrianzero.com/traitlab';

    if (filter === 'traits') {
        // Traits: SVG
        return `${baseLocal}/assets/traits/${tokenId}.svg`;
    } else if (filter === 'floppy') {
        // Floppys: PNG
        return `${baseLocal}/../components/images/${tokenId}.png`;
    } else if (filter === 'adrianzero') {
        // AdrianZERO: Vercel API
        return `https://adrianlab.vercel.app/api/render/${tokenId}.png`;
    }

    // Fallback
    return `${baseLocal}/../components/images/${tokenId}.png`;
}
```

**Fallback automático** (ImageLoader):
```javascript
async function getTraitImageUrl(tokenId) {
    const localUrl = `./assets/traits/${tokenId}.svg`;

    try {
        // Intentar local
        await fetch(localUrl);
        return localUrl;
    } catch {
        // Fallback a Vercel
        return `https://adrianzero.com/traitlab/assets/traits/${tokenId}.svg`;
    }
}
```

### Validación de Categorías de Traits

**Entrada**: `traitIds[]`

**Proceso**:
```javascript
function validateTraitCategories(traitIds) {
    const categoriesMap = new Map();

    for (const traitId of traitIds) {
        const category = getTraitCategory(traitId); // De traits.json

        if (categoriesMap.has(category)) {
            throw new Error(`Duplicate category: ${category}`);
        }

        categoriesMap.set(category, traitId);
    }

    return true;
}
```

**Categorías típicas**: EYES, MOUTH, HAT, BACKGROUND, ACCESSORY, etc.

### Retry Logic para Alchemy API

**Proceso**:
```javascript
async function fetchWithAlchemyFallback(url, options, retries = 3) {
    const apiKeys = TraitLABConfig.getAllAlchemyApiKeys();
    let lastError;

    for (let i = 0; i < apiKeys.length; i++) {
        const apiKey = apiKeys[i];
        const urlWithKey = url.replace('{apiKey}', apiKey);

        for (let retry = 0; retry < retries; retry++) {
            try {
                const response = await fetch(urlWithKey, options);

                if (response.status === 429) {
                    // Rate limited, esperar y reintentar
                    const delay = Math.pow(2, retry) * 1000; // Exponential backoff
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }

                if (response.ok) {
                    return await response.json();
                }
            } catch (error) {
                lastError = error;
                // Continuar a siguiente API key
                break;
            }
        }
    }

    throw lastError;
}
```

---

## ÁREAS DE OPTIMIZACIÓN

### 1. Tamaño de Archivos (Performance)

**Archivos pesados identificados**:

| Archivo | Tamaño | Oportunidad |
|---------|--------|-------------|
| `ui.js` | 103 KB | ⚠️ Dividir en sub-módulos (grid, cards, updates) |
| `sticky-popup-manager.js` | 82 KB | ⚠️ Lazy load de funcionalidad por tab |
| `data-manager.js` | 79 KB | ⚠️ Mover lógica de paginación a módulo separado |
| `zero.js` | 75 KB | ⚠️ Separar metadata loading de operaciones |
| `styles.css` | 51 KB | Minificar, eliminar CSS no usado |
| `floppy.js` | 46 KB | Dividir por tipo de pack |
| `customise.js` | 43 KB | Lazy load completo |

**Impacto estimado**: Reducción de 30-40% en tamaño inicial con code splitting.

### 2. Carga de Datos (Network)

**Oportunidades**:

**A. Paginación agresiva**:
```javascript
// Actual: carga 100 tokens por página
pageSize: 100

// Optimización: reducir a 50 para primera carga
pageSize: 50
```

**B. Índice local de traits**:
```javascript
// Actual: carga traits.json completo (~XKB)
// Optimización: crear índice ligero + carga bajo demanda
{
    "index": [
        {"id": 1001, "category": "EYES", "name": "..."}
    ],
    "details": {
        "1001": { ...metadata completa... }
    }
}
```

**C. Service Worker para assets**:
```javascript
// Cachear SVGs de traits en service worker
// Reducir peticiones repetidas
```

### 3. Renderizado (UI Performance)

**Oportunidades**:

**A. Virtual scrolling**:
```javascript
// Actual: renderiza todos los tokens (puede ser 100+)
// Optimización: solo renderizar elementos visibles + buffer
// Usar IntersectionObserver
```

**B. Image lazy loading nativo**:
```html
<!-- Actual: carga todas las imágenes -->
<img src="...">

<!-- Optimización: lazy loading nativo -->
<img src="..." loading="lazy">
```

**C. Debounce de búsquedas/filtros**:
```javascript
// Actual: filtrado inmediato
// Optimización: debounce 300ms
const debouncedFilter = debounce(filterTokens, 300);
```

### 4. Blockchain Calls (Cost/Speed)

**Oportunidades**:

**A. Batch calls con Multicall**:
```javascript
// Actual: múltiples llamadas individuales
await contract.getTokenName(1);
await contract.getTokenName(2);
await contract.getTokenName(3);

// Optimización: Multicall para batch
const multicall = new Multicall(...);
const results = await multicall.aggregate([
    contract.interface.encodeFunctionData('getTokenName', [1]),
    contract.interface.encodeFunctionData('getTokenName', [2]),
    contract.interface.encodeFunctionData('getTokenName', [3])
]);
```

**B. Caché de datos on-chain**:
```javascript
// Implementado en v3: supabase-cache.js
// Cachear nombres, toggles, etc. en Supabase
// Reducir llamadas a blockchain
```

**C. RPC optimizado**:
```javascript
// Actual: FallbackProvider intenta en orden
// Optimización: medir latencia y usar el más rápido
const fastestProvider = await selectFastestProvider(BASE_RPC_URLS);
```

### 5. Memoria (Mobile)

**Oportunidades**:

**A. Limpieza de caché**:
```javascript
// Agregar política de expiración
cache.expiry = Date.now() + 5 * 60 * 1000; // 5 min

// Limpiar caché viejo periódicamente
setInterval(() => cleanExpiredCache(), 60000);
```

**B. Reducir tamaño de tokens en caché**:
```javascript
// Actual: guarda metadata completa
// Optimización: solo campos necesarios
const minimalToken = {
    tokenId,
    title,
    imageUrl,
    category
    // Omitir: metadata completa, attributes, etc.
};
```

**C. SAFU mode más agresivo**:
```javascript
// Actual: limita a X elementos en móvil
// Optimización: detectar memoria disponible
if (navigator.deviceMemory < 4) {
    maxElements = 20;
} else {
    maxElements = 50;
}
```

### 6. Code Splitting

**Módulos para lazy load**:

```javascript
// Actual: todos los módulos se cargan al inicio
// Optimización: lazy load por tab

// Solo cargar cuando usuario accede a tab
const loadTraitsModule = () => import('./modules/traits.js');
const loadFloppyModule = () => import('./modules/floppy.js');
const loadCraftingModule = () => import('./modules/crafting.js');

// En setupTabs()
btn.addEventListener('click', async () => {
    if (filter === 'traits' && !modules.traits) {
        modules.traits = await loadTraitsModule();
    }
});
```

**Impacto**: Reducción de 50-60% en JS inicial.

### 7. API Calls Optimization

**A. Request deduplication**:
```javascript
// Evitar múltiples llamadas idénticas simultáneas
const pendingRequests = new Map();

async function fetchWithDedup(url) {
    if (pendingRequests.has(url)) {
        return pendingRequests.get(url);
    }

    const promise = fetch(url).then(r => r.json());
    pendingRequests.set(url, promise);

    try {
        return await promise;
    } finally {
        pendingRequests.delete(url);
    }
}
```

**B. GraphQL en lugar de REST** (para Alchemy):
```javascript
// Si Alchemy soporta GraphQL, hacer queries más específicas
// Reducir over-fetching de metadata
```

### 8. Bundle Optimization

**Webpack/Rollup config**:
```javascript
// Minificación
// Tree shaking
// Code splitting automático
// Dynamic imports

// Ejemplo rollup.config.js
export default {
    input: 'modules/app-initializer.js',
    output: {
        dir: 'dist',
        format: 'es',
        manualChunks: {
            'vendor': ['ethers'],
            'core': ['config', 'wallet', 'data-manager'],
            'features': ['traits', 'floppy', 'serums']
        }
    },
    plugins: [
        terser(), // Minificación
        // ...
    ]
};
```

---

## PATRONES DE PERFORMANCE

### Patrones Ya Implementados ✅

**1. Carga Paralela**:
```javascript
// DataManager.init()
await Promise.all([
    loadAdrianZeroTokens(),
    loadAdrianLabTokens()
]);
```

**2. Paginación**:
```javascript
// Carga progresiva con pageKey
loadMoreTraits(pageKey)
```

**3. Virtual DOM (SAFU mode)**:
```javascript
// Limita elementos DOM en móviles
if (isMobile && tokens.length > maxElements) {
    tokens = tokens.slice(0, maxElements);
}
```

**4. Event-driven**:
```javascript
// Desacoplamiento mediante eventos
// Evita re-renders innecesarios
```

**5. Caché centralizado**:
```javascript
// DataManager evita re-fetch
if (cache.ready.adrianZero) {
    return cache.adrianZero;
}
```

**6. Fallback automático**:
```javascript
// RPC, API keys, imagen URLs
// Resilencia ante fallos
```

**7. Lazy loading de ethers.js**:
```javascript
// Solo carga cuando se necesita transacción
if (typeof ethers === 'undefined') {
    await loadEthers();
}
```

### Patrones a Implementar 🔧

**1. Service Worker** (para assets estáticos)
**2. Virtual scrolling** (para listas largas)
**3. Image lazy loading** (nativo HTML)
**4. Debouncing** (filtros/búsquedas)
**5. Multicall** (batch blockchain calls)
**6. Code splitting** (lazy load por tab)
**7. Request deduplication** (evitar duplicados)
**8. Bundle optimization** (webpack/rollup)

---

## ÍNDICE DE UBICACIONES

### Por Funcionalidad

**Conexión de Wallet**:
- Módulo: `modules/wallet.js` → `WalletManager`
- Métodos: `connectWallet()`, `disconnectWallet()`, `checkConnection()`
- Eventos: `walletConnected`, `walletDisconnected`

**Carga de Tokens**:
- Módulo: `modules/data-manager.js` → `TraitLABDataManager`
- Métodos: `init()`, `loadAdrianZeroTokens()`, `loadAdrianLabTokens()`
- Caché: `cache.adrianZero`, `cache.adrianLab`

**Filtrado de Tokens**:
- Módulo: `modules/filters.js` → `TokenFilters`
- Métodos: `filterTokensByType()`, `filterFloppyTokens()`, `filterSerumTokens()`

**Renderizado de UI**:
- Módulo: `modules/ui.js` → `UIManager`
- Métodos: `displayTokens()`, `displayPlaceholders()`, `updateSelectionInfo()`
- Templates: `modules/ui-templates.js` → `UITemplates`

**Gestión de Traits**:
- Módulo: `modules/traits.js` → `TraitsManager`
- BD: `json/traits.json`
- Métodos: `handleTraitSelection()`, `applyTraitsToNFT()`, `generateCombinedImage()`

**Gestión de Packs**:
- Módulo: `modules/floppy.js` → `FloppyManager`
- Métodos: `openFloppy()`, `openSelectedPack()`, `openPack()`, `openActionPack()`

**Gestión de Serums**:
- Módulo: `modules/serums.js` → `SerumsManager`
- Métodos: `useSerum()`, `loadSerumMetadata()`

**Renombrado**:
- Módulo: `modules/zero.js` → `ZeroManager`
- Métodos: `renameToken()`, `loadNamePrice()`, `approveRename()`
- Contrato: `ADRIAN_NAME_REGISTRY_CONTRACT`

**Crafting**:
- Módulo: `modules/crafting.js` → `TraitLABCrafting`
- Métodos: `loadRecipes()`, `craft()`
- Contrato: `ADRIAN_CRAFTING_CONTRACT`

**Lambo Generator**:
- Módulo: `modules/lambo.js` → `LamboManager`
- Métodos: `generateLamboImage()`, `selectLamboColor()`

**Personalización**:
- Módulo: `modules/customise.js` → `CustomiseManager`
- Métodos: `customiseToken()`, `generateCustomImage()`

**Popup Flotante**:
- Módulo: `modules/sticky-popup-manager.js` → `StickyPopupManager`
- Métodos: `configureFloppyButtons()`, `updateSelectionInfo()`

**Configuración**:
- Módulo: `modules/config.js` → `TraitLABConfig`
- Global: `window.TraitLABConfig`
- Contratos, RPC URLs, API keys

**Inicialización**:
- Módulo: `modules/app-initializer.js` → `AppInitializer`
- Métodos: `initialize()`, `initializeModules()`, `setupEventListeners()`, `setupTabs()`

**Utilidades**:
- Image Loader: `modules/utils/image-loader.js` → `TraitImageLoader`

### Por Tipo de Token

**ERC721 (AdrianZERO)**:
- ID range: Variable (tokens principales NFT)
- Módulo: `modules/zero.js`
- Operaciones: renombrar, activar, aplicar traits

**ERC1155 - Traits**:
- ID range: 1-262143 (excluyendo floppys y serums)
- Módulo: `modules/traits.js`
- BD: `json/traits.json`
- Operaciones: aplicar a ERC721, craftear

**ERC1155 - Floppys**:
- ID range: 10000-10018, 15000-15015, 1123
- Módulo: `modules/floppy.js`
- Operaciones: abrir packs

**ERC1155 - Serums**:
- ID range: 262144-262147
- Módulo: `modules/serums.js`
- Operaciones: aplicar a tokens

### Por Contrato

**ERC721**: `modules/zero.js`, `modules/wallet.js`
**ERC1155**: `modules/data-manager.js`, `modules/filters.js`
**TraitsExtensions**: `modules/traits.js`
**NameRegistry**: `modules/zero.js` (renameToken)
**ActionPacks**: `modules/floppy.js`
**OpenPackV4**: `modules/floppy.js`
**SerumModule**: `modules/serums.js`
**Crafting**: `modules/crafting.js`
**ZoomToggle**: `modules/zero.js` (loadActiveToggles)

---

## GLOSARIO DE TÉRMINOS

**AdrianZERO**: Colección de tokens ERC721 principales

**AdrianLAB**: Colección de tokens ERC1155 (traits, packs, serums)

**Trait**: Característica visual aplicable a un AdrianZERO (ERC1155)

**Floppy / Pack**: Token ERC1155 que puede abrirse para obtener contenido aleatorio

**Serum**: Token ERC1155 que modifica características de un token

**Base Mainnet**: Blockchain Layer 2 de Ethereum (Chain ID: 8453)

**Alchemy**: Proveedor de API para interacción con blockchain

**Vercel API**: Servicio de renderizado de imágenes NFT

**SAFU mode**: Modo seguro que limita elementos DOM en móviles

**PageKey**: Token de paginación de Alchemy para cargar más resultados

**Virtual DOM**: Limitación de elementos renderizados para performance

**Sticky Popup**: Popup flotante lateral con info de selección

**Toggle**: Estado especial de token (activado/desactivado)

**Crafting**: Sistema de creación de items combinando ingredientes

**Name Registry**: Contrato de nombres personalizados para tokens

**Multi-select**: Selección de múltiples packs (hasta 4)

**Fallback**: Estrategia de backup cuando falla operación principal

**Event-driven**: Arquitectura basada en eventos (on/emit)

**Singleton**: Patrón de una sola instancia global

**Lazy loading**: Carga bajo demanda de recursos

**Code splitting**: División de código en chunks para carga selectiva

---

## CONCLUSIONES Y RECOMENDACIONES

### Fortalezas del Sistema

✅ **Arquitectura modular sólida** - Fácil mantenimiento y extensión
✅ **Event-driven** - Desacoplamiento efectivo entre módulos
✅ **Carga paralela** - Optimización de tiempos de carga
✅ **Fallbacks múltiples** - Resiliencia ante fallos
✅ **SAFU mode** - Considera limitaciones de móviles
✅ **Lazy loading** - Paginación para grandes colecciones

### Áreas Prioritarias de Optimización

1. **Code Splitting** - Reducir bundle inicial en 50-60%
2. **Virtual Scrolling** - Mejorar renderizado de listas largas
3. **Service Worker** - Cachear assets SVG
4. **Multicall** - Reducir llamadas blockchain
5. **Dividir archivos pesados** - ui.js (103KB), sticky-popup-manager.js (82KB)
6. **Bundle optimization** - Minificación, tree shaking

### Próximos Pasos Sugeridos

Para futuras optimizaciones, consultar:
- Sección "Áreas de Optimización" para oportunidades específicas
- "Índice de Ubicaciones" para encontrar rápidamente cualquier componente
- "Patrones de Performance" para implementar mejoras

---

**FIN DEL INFORME TÉCNICO**

---

## WHALE FIXES ISSUE

### Problema Crítico: DOM Limitado en Móviles

**Estado**: ⚠️ IMPLEMENTACIÓN PARCIAL - REQUIERE CORRECCIÓN

**Descripción**: 
Los usuarios con wallets grandes (whales) que poseen cientos o miles de traits no pueden ver todos sus tokens en dispositivos móviles. Esto se debe a limitaciones de memoria en móviles que crashean cuando hay más de ~100-200 elementos DOM renderizados simultáneamente.

**Solución Actual**:
- Sistema de Virtual DOM (SAFU mode) que limita a 100 elementos DOM
- Carga por batches de 50 tokens
- Cleanup de elementos fuera del viewport

**Problemas Identificados**:
1. ❌ Virtual DOM solo se activa si `tokens.length > 50` (después de filtros)
2. ❌ Límite fijo de 100 elementos (no considera capacidad del dispositivo)
3. ❌ Pierde estado de selección al hacer scroll
4. ❌ Carga automática completa (ineficiente)
5. ❌ Sin indicador visual de más contenido

**Impacto**:
- **Usuarios afectados**: Whales con >100 traits
- **Gravedad**: 🔴 ALTA
- **Síntoma**: No pueden seleccionar traits que no se muestran

### Plan de Solución

Ver documento completo: **[WHALE_FIXES_REPORT.md](./WHALE_FIXES_REPORT.md)**

**Fases de implementación**:

#### 🔴 Fase 1: Fixes Críticos (1-2 días)
1. Activación temprana de Virtual DOM
2. Preservar estado de selección
3. Indicador visual de progreso

#### 🟡 Fase 2: Optimizaciones (3-4 días)
4. Detección dinámica de capacidad del dispositivo
5. Carga progresiva real (lazy loading)
6. Cache de altura de cards

#### 🟢 Fase 3: Mejoras UX (2-3 días)
7. Búsqueda de traits
8. Indicadores visuales completos

### Ubicación del Código

**Virtual DOM System**:
- Archivo: `traitlab/modules/ui.js`
- Estado: Líneas 40-50
- Activación: Líneas 1247-1260
- Setup: Líneas 615-684
- Renderizado: Líneas 541-610
- Cleanup: Líneas 776-831

**Carga Automática**:
- Archivo: `traitlab/modules/data-manager.js`
- SAFU Mode: Líneas 980-1075
- Load All: Líneas 1476-1514

### Casos de Prueba Críticos

1. **Wallet con 1000+ traits**:
   - Debe mostrar contador "X de 1000"
   - Debe poder hacer scroll para ver todos
   - Debe mantener selección al hacer scroll

2. **Filtrado por categoría**:
   - Virtual DOM debe seguir activo
   - Contador debe reflejar filtros
   - Debe poder acceder a todos los traits filtrados

3. **Dispositivos gama baja**:
   - Límite de DOM debe ajustarse a 30-50
   - No debe crashear
   - FPS debe ser >25

### Referencias

- **Análisis completo**: [WHALE_FIXES_REPORT.md](./WHALE_FIXES_REPORT.md)
- **Task list**: Ver tareas en el sistema de gestión de tareas
- **Tests**: `traitlab/tests/whale-fixes.test.js` (por crear)

