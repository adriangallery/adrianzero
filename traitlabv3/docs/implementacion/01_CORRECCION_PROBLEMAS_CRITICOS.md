# 📋 DOCUMENTO 1: CORRECCIÓN DE PROBLEMAS CRÍTICOS

Este documento detalla las correcciones necesarias para resolver los problemas críticos detectados antes de proceder con la refactorización.

## 🎯 Objetivo

Corregir todos los problemas críticos identificados en `PROBLEMAS_DETECTADOS.md` para asegurar una base sólida antes de la refactorización.

---

## ✅ PROBLEMA 1: Orden de Inicialización

### **Archivo**: `modules/app-initializer.js`

#### **Código Actual (líneas 40-48)**:
```javascript
// Zero Manager
this.app.modules.zero = new window.TraitLABZero();
this.app.modules.zero.init();

// Sticky Popup Manager (maneja toda la lógica del sticky popup)
this.app.stickyPopupManager = new window.StickyPopupManager();
this.app.stickyPopupManager.init();

// Data Manager
this.app.modules.dataManager = new window.TraitLABDataManager();
```

#### **Código a Modificar**:
```javascript
// Zero Manager
this.app.modules.zero = new window.TraitLABZero();
this.app.modules.zero.init();

// Sticky Popup Manager (maneja toda la lógica del sticky popup)
this.app.stickyPopupManager = new window.StickyPopupManager();
this.app.stickyPopupManager.init();

// Data Manager - MOVER DESPUÉS de zero para evitar dependencias
this.app.modules.dataManager = new window.TraitLABDataManager();
// NO llamar init() aquí, se llamará después de que todos los módulos estén listos
```

#### **Código Nuevo (al final de initializeModules, después de todos los módulos)**:
```javascript
// ... después de inicializar todos los módulos ...

// Inicializar DataManager después de que todos los módulos estén listos
if (this.app.modules.dataManager) {
    try {
        await this.app.modules.dataManager.init();
        console.log('✅ DataManager inicializado correctamente');
    } catch (error) {
        console.error('❌ Error inicializando DataManager:', error);
        // Continuar aunque falle, no es crítico para la app
    }
}
```

#### **Archivo**: `modules/data-manager.js`

#### **Código Actual (líneas 68-72)**:
```javascript
if (window.app && window.app.modules.zero) {
    const userAddress = window.app.modules.wallet?.getCurrentAccount();
    if (userAddress) {
        const contractAddress = "0x6e369bf0e4e0c106192d606fb6d85836d684da75";
        const tokens = await window.app.modules.zero.loadTokens(userAddress, contractAddress);
```

#### **Código a Modificar**:
```javascript
// Validación más robusta antes de acceder a módulos
if (!window.app?.modules?.zero || !window.app?.modules?.wallet) {
    console.warn('⚠️ DataManager: Módulos zero o wallet no disponibles');
    return;
}

const userAddress = window.app.modules.wallet.getCurrentAccount();
if (!userAddress) {
    console.warn('⚠️ DataManager: No hay wallet conectada');
    return;
}

try {
    const contractAddress = "0x6e369bf0e4e0c106192d606fb6d85836d684da75";
    const tokens = await window.app.modules.zero.loadTokens(userAddress, contractAddress);
```

---

## ✅ PROBLEMA 2: Referencia a `window.traitImageLoader`

### **Archivo**: `modules/zero.js`

#### **Código Actual (líneas 485-495)**:
```javascript
if (window.traitImageLoader) {
    const imageUrls = window.traitImageLoader.getTraitImageUrl(
        tokenIdInt,
        alchemyImageUrl || `https://adrianlab.vercel.app/api/render/floppy/${tokenIdInt}.png`
    );
    mediaUrl = imageUrls.localUrl;
    fallbackImageUrl = imageUrls.fallbackUrl;
} else {
    // Fallback to original logic if TraitImageLoader not available
    mediaUrl = alchemyImageUrl;
}
```

#### **Código a Modificar**:
```javascript
if (window.traitImageLoader && typeof window.traitImageLoader.getTraitImageUrl === 'function') {
    try {
        const imageUrls = window.traitImageLoader.getTraitImageUrl(
            tokenIdInt,
            alchemyImageUrl || `https://adrianlab.vercel.app/api/render/floppy/${tokenIdInt}.png`
        );
        mediaUrl = imageUrls.localUrl;
        fallbackImageUrl = imageUrls.fallbackUrl;
    } catch (error) {
        console.warn('⚠️ Error usando TraitImageLoader, usando fallback:', error);
        mediaUrl = alchemyImageUrl;
    }
} else {
    console.warn('⚠️ TraitImageLoader no disponible, usando fallback');
    // Fallback to original logic if TraitImageLoader not available
    mediaUrl = alchemyImageUrl;
}
```

---

## ✅ PROBLEMA 3: Eventos sin Listeners

### **Archivo**: `modules/app-initializer.js`

#### **Código a Agregar (después de setupEventListeners, línea 140)**:
```javascript
/**
 * Configurar listeners para eventos opcionales
 */
setupOptionalEventListeners() {
    console.log('🔧 AppInitializer: Configurando listeners opcionales...');
    
    try {
        // Traits events
        if (this.app.modules.traits) {
            this.app.modules.traits.on('traitsDatabaseLoaded', (data) => {
                console.log('✅ Traits database cargada:', data);
            });
            
            this.app.modules.traits.on('traitsDatabaseError', (error) => {
                console.error('❌ Error cargando traits database:', error);
            });
        }
        
        // UI events
        if (this.app.modules.ui) {
            this.app.modules.ui.on('selectionInfoUpdate', () => {
                // Este evento es informativo, no requiere acción
                console.log('ℹ️ Selection info actualizada');
            });
        }
        
        // Zero events (ya configurados en setupProgressiveLoading, pero agregar aquí también)
        if (this.app.modules.zero) {
            this.app.modules.zero.on('tokensReadyForDisplay', (data) => {
                // Ya manejado en setupProgressiveLoading, pero asegurar que está configurado
                console.log('🎯 Tokens listos para mostrar:', data.tokens?.length || 0);
            });
        }
        
        console.log('✅ AppInitializer: Listeners opcionales configurados');
    } catch (error) {
        console.error('❌ AppInitializer: Error configurando listeners opcionales:', error);
    }
}
```

#### **Código a Modificar en `initialize()` (línea 189-208)**:
```javascript
async initialize() {
    console.log('🚀 AppInitializer: Iniciando inicialización completa...');
    
    try {
        // Inicializar módulos
        await this.initializeModules();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // 🚨 NUEVO: Configurar listeners opcionales
        this.setupOptionalEventListeners();
        
        // Configurar tabs
        this.setupTabs();
        
        console.log('✅ AppInitializer: Aplicación inicializada correctamente');
        
    } catch (error) {
        console.error('❌ AppInitializer: Error en inicialización:', error);
        throw error;
    }
}
```

---

## ✅ PROBLEMA 4: Acceso a `window.app.modules` antes de inicialización

### **Archivo**: `modules/data-manager.js`

#### **Código Actual (líneas 68-83)**:
```javascript
try {
    if (window.app && window.app.modules.zero) {
        const userAddress = window.app.modules.wallet?.getCurrentAccount();
        if (userAddress) {
            const contractAddress = "0x6e369bf0e4e0c106192d606fb6d85836d684da75";
            const tokens = await window.app.modules.zero.loadTokens(userAddress, contractAddress);
            this.cache.adrianZero = tokens;
            console.log('📊 AdrianZERO tokens básicos cargados:', tokens.length);
            
            // Mostrar tokens inmediatamente
            this.displayTokensImmediately(tokens, 'adrianzero');
            
            this.cache.loading.adrianZero = false;
            this.cache.ready.adrianZero = true;
            this.emit('adrianZeroReady', { tokens: this.cache.adrianZero });
        }
    }
} catch (error) {
    console.warn('📊 Error cargando AdrianZERO tokens básicos:', error);
    this.cache.loading.adrianZero = false;
    this.cache.ready.adrianZero = true;
}
```

#### **Código a Modificar**:
```javascript
try {
    // Validación robusta antes de acceder a módulos
    if (!window.app?.modules?.zero) {
        console.warn('⚠️ DataManager: Módulo zero no disponible');
        this.cache.loading.adrianZero = false;
        this.cache.ready.adrianZero = false;
        return;
    }
    
    if (!window.app?.modules?.wallet) {
        console.warn('⚠️ DataManager: Módulo wallet no disponible');
        this.cache.loading.adrianZero = false;
        this.cache.ready.adrianZero = false;
        return;
    }
    
    const userAddress = window.app.modules.wallet.getCurrentAccount();
    if (!userAddress) {
        console.warn('⚠️ DataManager: No hay wallet conectada');
        this.cache.loading.adrianZero = false;
        this.cache.ready.adrianZero = false;
        return;
    }
    
    const contractAddress = "0x6e369bf0e4e0c106192d606fb6d85836d684da75";
    const tokens = await window.app.modules.zero.loadTokens(userAddress, contractAddress);
    this.cache.adrianZero = tokens;
    console.log('📊 AdrianZERO tokens básicos cargados:', tokens.length);
    
    // Mostrar tokens inmediatamente
    if (window.app?.modules?.ui) {
        window.app.modules.ui.displayTokens(tokens, false, true);
    }
    
    this.cache.loading.adrianZero = false;
    this.cache.ready.adrianZero = true;
    this.emit('adrianZeroReady', { tokens: this.cache.adrianZero });
} catch (error) {
    console.warn('📊 Error cargando AdrianZERO tokens básicos:', error);
    this.cache.loading.adrianZero = false;
    this.cache.ready.adrianZero = false; // Cambiar a false para permitir reintento
}
```

---

## ✅ PROBLEMA 5: Dependencia Circular

### **Archivo**: `modules/app-initializer.js`

#### **Código Actual (líneas 35-48)**:
```javascript
// UI Manager
this.app.modules.ui = new window.TraitLABUI();
this.app.modules.ui.init();

// Zero Manager
this.app.modules.zero = new window.TraitLABZero();
this.app.modules.zero.init();

// ... otros módulos ...

// Data Manager
this.app.modules.dataManager = new window.TraitLABDataManager();
```

#### **Código a Modificar (asegurar orden correcto)**:
```javascript
// Zero Manager - PRIMERO (no tiene dependencias de otros módulos de negocio)
this.app.modules.zero = new window.TraitLABZero();
this.app.modules.zero.init();

// Data Manager - SEGUNDO (depende de zero y wallet)
this.app.modules.dataManager = new window.TraitLABDataManager();
// NO llamar init() aquí todavía

// UI Manager - TERCERO (depende de dataManager)
this.app.modules.ui = new window.TraitLABUI();
this.app.modules.ui.init();
```

---

## ✅ PROBLEMA 6: Lazy Loading - Listeners configurados tarde

### **Archivo**: `modules/ui.js`

#### **Código Actual (líneas 484-508)**:
```javascript
// Escuchar eventos del data-manager para cuando se carguen más traits desde Alchemy
const dataManager = window.app?.modules?.dataManager;
if (dataManager) {
    // Remover listener anterior si existe
    if (this._moreTraitsLoadedHandler) {
        dataManager.off('adrianLabMoreTraitsLoaded', this._moreTraitsLoadedHandler);
    }
    
    // Crear nuevo handler
    this._moreTraitsLoadedHandler = (data) => {
        // ... código del handler ...
    };
    
    dataManager.on('adrianLabMoreTraitsLoaded', this._moreTraitsLoadedHandler);
}
```

#### **Código a Modificar (configurar listeners ANTES de setupLazyLoading)**:
```javascript
/**
 * Configurar listeners de data-manager ANTES de iniciar lazy loading
 */
setupDataManagerListeners() {
    const dataManager = window.app?.modules?.dataManager;
    if (!dataManager) {
        console.warn('⚠️ DataManager no disponible para configurar listeners');
        return;
    }
    
    // Remover listener anterior si existe
    if (this._moreTraitsLoadedHandler) {
        dataManager.off('adrianLabMoreTraitsLoaded', this._moreTraitsLoadedHandler);
    }
    
    // Crear nuevo handler
    this._moreTraitsLoadedHandler = (data) => {
        if (this.lazyLoadingState.enabled && data.newTraits) {
            console.log(`📡 Nuevos traits cargados desde Alchemy: ${data.newTraits.length}`);
            // Los nuevos traits ya fueron agregados a allTokens en loadNextBatch
            // Solo necesitamos verificar si debemos continuar cargando
            if (data.hasMore && this.lazyLoadingState.sentinel) {
                // Asegurar que el sentinel esté siendo observado
                if (this.lazyLoadingState.observer) {
                    this.lazyLoadingState.observer.observe(this.lazyLoadingState.sentinel);
                }
            }
        }
    };
    
    // Configurar listener ANTES de que dataManager comience a cargar
    dataManager.on('adrianLabMoreTraitsLoaded', this._moreTraitsLoadedHandler);
    console.log('✅ Listeners de DataManager configurados');
}

/**
 * Setup lazy loading for traits on mobile
 */
setupLazyLoading(tokens) {
    const tokensGrid = this.domElements.get('tokens-grid');
    if (!tokensGrid) return;
    
    // 🚨 NUEVO: Configurar listeners ANTES de iniciar lazy loading
    this.setupDataManagerListeners();
    
    // Clean up any existing lazy loading
    this.cleanupLazyLoading();
    
    // ... resto del código ...
}
```

---

## ✅ PROBLEMA 7: Parámetros inconsistentes en `displayTokens`

### **Archivo**: `modules/ui.js`

#### **Código Actual (línea 514)**:
```javascript
displayTokens(tokens, skipSelectionUpdate = false, hasLoadingWheels = false) {
```

#### **Código a Modificar (estandarizar firma)**:
```javascript
/**
 * Display tokens in grid
 * @param {Array} tokens - Array de tokens a mostrar
 * @param {Object} options - Opciones de visualización
 * @param {string} options.filter - Filtro actual (opcional, se usa currentFilter si no se proporciona)
 * @param {boolean} options.skipSelectionUpdate - Si true, no actualiza selección
 * @param {boolean} options.hasLoadingWheels - Si true, muestra loading wheels
 */
displayTokens(tokens, options = {}) {
    // Compatibilidad con llamadas antiguas
    let filter, skipSelectionUpdate, hasLoadingWheels;
    
    if (typeof options === 'string') {
        // Llamada antigua: displayTokens(tokens, 'filter')
        filter = options;
        skipSelectionUpdate = false;
        hasLoadingWheels = false;
    } else if (typeof options === 'boolean') {
        // Llamada antigua: displayTokens(tokens, skipSelectionUpdate, hasLoadingWheels)
        skipSelectionUpdate = options;
        hasLoadingWheels = arguments[2] || false;
        filter = this.currentFilter;
    } else {
        // Llamada nueva: displayTokens(tokens, { filter, skipSelectionUpdate, hasLoadingWheels })
        filter = options.filter || this.currentFilter;
        skipSelectionUpdate = options.skipSelectionUpdate || false;
        hasLoadingWheels = options.hasLoadingWheels || false;
    }
    
    const tokensGrid = this.domElements.get('tokens-grid');
    if (!tokensGrid) return;

    // ... resto del código usando filter, skipSelectionUpdate, hasLoadingWheels ...
```

#### **Archivos a Actualizar**:

**1. `index.html` línea 341**:
```javascript
// ANTES:
this.modules.ui.displayTokens(data.tokens, 'adrianzero');

// DESPUÉS:
this.modules.ui.displayTokens(data.tokens, { filter: 'adrianzero' });
```

**2. `index.html` línea 366**:
```javascript
// ANTES:
this.modules.ui.displayTokens(floppys, 'floppy');

// DESPUÉS:
this.modules.ui.displayTokens(floppys, { filter: 'floppy' });
```

**3. `data-manager.js` línea 332**:
```javascript
// ANTES:
window.app.modules.ui.displayTokens(tokens, false, true);

// DESPUÉS:
window.app.modules.ui.displayTokens(tokens, { 
    skipSelectionUpdate: false, 
    hasLoadingWheels: true 
});
```

---

## ✅ PROBLEMA 8: Nombre incorrecto de módulo

### **Archivo**: `modules/zero.js`

#### **Código Actual (líneas 1219-1224)**:
```javascript
let tokenId = this.selectedERC721?.tokenId;
if (typeof tokenId === 'undefined') {
    // Intentar obtener desde tokenSelectionManager como fallback
    tokenId = window.app?.modules?.tokenSelectionManager?.selectedERC721?.tokenId;
    console.log('🎯 Fallback: tokenId obtenido desde tokenSelectionManager:', tokenId);
}
```

#### **Código a Modificar**:
```javascript
let tokenId = this.selectedERC721?.tokenId;
if (typeof tokenId === 'undefined') {
    // Intentar obtener desde tokenSelection como fallback (nombre correcto del módulo)
    tokenId = window.app?.modules?.tokenSelection?.selectedERC721?.tokenId;
    console.log('🎯 Fallback: tokenId obtenido desde tokenSelection:', tokenId);
}
```

---

## ✅ PROBLEMA 9: Método `displayTokensImmediately` no existe

### **Archivo**: `modules/data-manager.js`

#### **Código a Buscar y Eliminar**:
```javascript
// ELIMINAR estas líneas:
this.displayTokensImmediately(tokens, 'adrianzero'); // línea 77
this.displayTokensImmediately(tokens, 'adrianzero'); // línea 129
```

#### **Código a Reemplazar**:
```javascript
// REEMPLAZAR con:
if (window.app?.modules?.ui) {
    window.app.modules.ui.displayTokens(tokens, { 
        filter: 'adrianzero',
        hasLoadingWheels: true 
    });
} else {
    console.warn('⚠️ UIManager no disponible para mostrar tokens');
}
```

---

## ✅ PROBLEMA 10: Manejo de errores en inicialización

### **Archivo**: `modules/app-initializer.js`

#### **Código Actual (líneas 13-89)**:
```javascript
async initializeModules() {
    console.log('🔧 AppInitializer: Inicializando módulos...');
    
    try {
        // Wallet Manager
        this.app.modules.wallet = new window.TraitLABWallet();
        await this.app.modules.wallet.init();
        
        // UI Manager
        this.app.modules.ui = new window.TraitLABUI();
        this.app.modules.ui.init();
        
        // ... resto de módulos ...
    } catch (error) {
        console.error('❌ AppInitializer: Error inicializando módulos:', error);
        throw error;
    }
}
```

#### **Código a Modificar (try-catch individual)**:
```javascript
async initializeModules() {
    console.log('🔧 AppInitializer: Inicializando módulos...');
    
    // Módulos críticos (la app no funciona sin ellos)
    const criticalModules = ['wallet', 'ui', 'zero'];
    
    // Módulos opcionales (la app puede funcionar sin ellos)
    const optionalModules = ['traits', 'floppy', 'serums', 'crafting', 'lambo', 'customise'];
    
    // Inicializar módulos críticos
    for (const moduleName of criticalModules) {
        try {
            await this.initializeModule(moduleName);
        } catch (error) {
            console.error(`❌ Error crítico inicializando ${moduleName}:`, error);
            throw error; // Si un módulo crítico falla, detener inicialización
        }
    }
    
    // Inicializar módulos opcionales
    for (const moduleName of optionalModules) {
        try {
            await this.initializeModule(moduleName);
        } catch (error) {
            console.warn(`⚠️ Error inicializando módulo opcional ${moduleName}:`, error);
            // Continuar aunque falle
        }
    }
    
    // Inicializar DataManager después de todos los módulos
    if (this.app.modules.dataManager) {
        try {
            await this.app.modules.dataManager.init();
            console.log('✅ DataManager inicializado correctamente');
        } catch (error) {
            console.error('❌ Error inicializando DataManager:', error);
            // Continuar aunque falle, no es crítico
        }
    }
}

/**
 * Inicializar un módulo individual
 */
async initializeModule(moduleName) {
    const moduleMap = {
        'wallet': () => {
            this.app.modules.wallet = new window.TraitLABWallet();
            return this.app.modules.wallet.init();
        },
        'ui': () => {
            this.app.modules.ui = new window.TraitLABUI();
            this.app.modules.ui.init();
        },
        'zero': () => {
            this.app.modules.zero = new window.TraitLABZero();
            return this.app.modules.zero.init();
        },
        'traits': () => {
            this.app.modules.traits = new window.TraitLABTraits();
            return this.app.modules.traits.init();
        },
        'floppy': () => {
            this.app.modules.floppy = new window.TraitLABFloppy();
            this.app.modules.floppy.init();
        },
        'serums': () => {
            this.app.modules.serums = new window.TraitLABSerums();
            this.app.modules.serums.init();
        },
        'crafting': () => {
            this.app.modules.crafting = new window.TraitLABCrafting();
            this.app.modules.crafting.init();
        },
        'lambo': () => {
            this.app.modules.lambo = new window.TraitLABLambo();
            this.app.modules.lambo.init();
        },
        'customise': () => {
            this.app.modules.customise = new window.TraitLABCustomise();
            this.app.modules.customise.init();
        }
    };
    
    const initFunction = moduleMap[moduleName];
    if (!initFunction) {
        throw new Error(`Módulo ${moduleName} no encontrado en moduleMap`);
    }
    
    console.log(`🔧 Inicializando ${moduleName}...`);
    await initFunction();
    console.log(`✅ ${moduleName} inicializado correctamente`);
}
```

---

## 📝 NOTAS IMPORTANTES

1. **Orden de ejecución**: Resolver los problemas en el orden indicado, ya que algunos dependen de otros.
2. **Testing**: Después de cada corrección, probar que la funcionalidad afectada sigue funcionando.
3. **Backup**: Hacer commit después de cada corrección importante.
4. **Logging**: Mantener los console.log para facilitar debugging durante la implementación.

---

## 🔄 SIGUIENTE PASO

Una vez completadas todas las correcciones, proceder con el **Documento 2: Refactorización de Módulos**.

