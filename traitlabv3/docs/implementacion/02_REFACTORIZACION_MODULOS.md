# 📋 DOCUMENTO 2: REFACTORIZACIÓN DE MÓDULOS

Este documento detalla los cambios necesarios para refactorizar los módulos existentes según el plan de refactorización.

## 🎯 Objetivo

Refactorizar los módulos existentes para mejorar la separación de responsabilidades, eliminar código duplicado y mejorar la mantenibilidad.

---

## 📦 MÓDULO 1: Config (`modules/config.js`)

### **Estado**: ✅ Ya está refactorizado

**No requiere cambios**. Este módulo ya está correctamente estructurado.

---

## 📦 MÓDULO 2: Wallet (`modules/wallet.js`)

### **Estado**: ✅ Ya está refactorizado

**No requiere cambios**. Este módulo ya está correctamente estructurado.

---

## 📦 MÓDULO 3: UI (`modules/ui.js`)

### **Cambios Necesarios**

#### **1. Estandarizar método `displayTokens`** (ya corregido en Documento 1)

#### **2. Eliminar código duplicado de selección de tokens**

**Código Actual (líneas 619-738)** - Método `handleTokenSelection` muy largo:

**Código a Refactorizar**:
```javascript
handleTokenSelection(tokenCard, token) {
    console.log('🔍 handleTokenSelection called with:', { token, currentFilter: this.currentFilter });
    
    const tokensGrid = this.domElements.get('tokens-grid');
    if (!tokensGrid) {
        console.error('❌ tokensGrid not found');
        return;
    }

    if (token.tokenType === 'ERC721') {
        this.handleERC721Selection(tokenCard, token, tokensGrid);
    } else {
        this.handleERC1155Selection(tokenCard, token, tokensGrid);
    }
    
    // Emitir evento
    this.emit('tokenSelected', { token, filter: this.currentFilter });
    
    // Manejar acciones específicas por filtro
    this.handleFilterSpecificActions(token);
}

/**
 * Manejar selección de tokens ERC721
 */
handleERC721Selection(tokenCard, token, tokensGrid) {
    // Single selection for ERC721
    if (this.selectedERC721 && this.selectedERC721.tokenId === token.tokenId) {
        this.selectedERC721 = null;
        tokenCard.classList.remove('selected');
    } else {
        // Deselect previous ERC721
        const prevSelected = tokensGrid.querySelector('.token-card.selected');
        if (prevSelected) prevSelected.classList.remove('selected');
        
        this.selectedERC721 = token;
        tokenCard.classList.add('selected');
    }
}

/**
 * Manejar selección de tokens ERC1155
 */
handleERC1155Selection(tokenCard, token, tokensGrid) {
    if (this.currentFilter === 'floppy') {
        this.handleFloppySelection(tokenCard, token, tokensGrid);
    } else if (this.currentFilter === 'serum') {
        this.handleSerumSelection(tokenCard, token, tokensGrid);
    } else {
        this.handleTraitsSelection(tokenCard, token);
    }
}

/**
 * Manejar selección de floppy
 */
handleFloppySelection(tokenCard, token, tokensGrid) {
    const packIndex = this.selectedPacks.findIndex(p => p.tokenId === token.tokenId);
    if (packIndex !== -1) {
        this.selectedPacks.splice(packIndex, 1);
        tokenCard.classList.remove('selected');
        this.selectedFloppy = null;
    } else {
        if (this.selectedPacks.length > 0) {
            const prevSelectedCard = tokensGrid.querySelector('.token-card.selected');
            if (prevSelectedCard) {
                prevSelectedCard.classList.remove('selected');
            }
            this.selectedPacks = [];
        }
        
        this.selectedPacks = [token];
        tokenCard.classList.add('selected');
        this.selectedFloppy = token;
    }
    
    this.emit('packsSelectionChanged', { 
        selectedPacks: this.selectedPacks,
        selectedFloppy: this.selectedFloppy 
    });
}

/**
 * Manejar selección de serum
 */
handleSerumSelection(tokenCard, token, tokensGrid) {
    if (this.selectedSerum && this.selectedSerum.tokenId === token.tokenId) {
        this.selectedSerum = null;
        tokenCard.classList.remove('selected');
    } else {
        const prevSelected = tokensGrid.querySelector('.token-card.selected');
        if (prevSelected) prevSelected.classList.remove('selected');
        
        this.selectedSerum = token;
        tokenCard.classList.add('selected');
    }
}

/**
 * Manejar selección de traits
 */
handleTraitsSelection(tokenCard, token) {
    // Delegar al módulo de traits
    if (window.app?.modules?.traits) {
        const wasSelected = window.app.modules.traits.handleTraitSelection(token);
        if (wasSelected) {
            tokenCard.classList.add('selected');
        } else {
            tokenCard.classList.remove('selected');
        }
    } else {
        // Fallback: toggle simple
        tokenCard.classList.toggle('selected');
    }
}

/**
 * Manejar acciones específicas por filtro
 */
handleFilterSpecificActions(token) {
    // Rename tab
    if (this.currentFilter === 'rename' && token.tokenType === 'ERC721') {
        if (window.app?.modules?.stickyPopupManager?.showRenameSection) {
            window.app.modules.stickyPopupManager.showRenameSection();
        }
    }
    
    // Lambo tab
    if (this.currentFilter === 'lambo' && token.tokenType === 'ERC721') {
        if (window.app?.modules?.lambo) {
            window.app.modules.lambo.selectAdrianZero(token);
            this.showLamboModal(token);
        }
    }
    
    // Customise tab
    if (this.currentFilter === 'customise' && token.tokenType === 'ERC721') {
        if (window.app?.modules?.stickyPopupManager) {
            window.app.modules.stickyPopupManager.selectedERC721 = token;
            window.app.modules.stickyPopupManager.openCustomiseModal();
        }
    }
}
```

#### **3. Extraer lógica de creación de token cards**

**Código Actual (líneas 199-343)** - Método `createTokenCard` muy largo:

**Código a Refactorizar** - Dividir en métodos más pequeños:
```javascript
createTokenCard(token) {
    const tokenCard = document.createElement('div');
    tokenCard.className = 'token-card';
    tokenCard.setAttribute('data-token-id', token.tokenId);
    tokenCard.setAttribute('data-contract', token.contract.toLowerCase());
    
    // Obtener imagen y título
    const { imageUrl, displayTitle } = this.getTokenDisplayInfo(token);
    
    // Crear contenido HTML
    tokenCard.innerHTML = this.buildTokenCardHTML(token, imageUrl, displayTitle);
    
    // Agregar event listeners
    this.attachTokenCardListeners(tokenCard, token);
    
    return tokenCard;
}

/**
 * Obtener información de visualización del token
 */
getTokenDisplayInfo(token) {
    let imageUrl = token.imageUrl || this.getDefaultImageUrl();
    let displayTitle = token.title;
    
    // Aplicar lógica específica por filtro
    if (this.currentFilter === 'floppy') {
        displayTitle = this.getFloppyDisplayName(token.tokenId);
        imageUrl = this.getFloppyImageUrl(token);
    } else if (this.currentFilter === 'serum') {
        imageUrl = this.getSerumImageUrl(token);
    }
    
    return { imageUrl, displayTitle };
}

/**
 * Construir HTML del token card
 */
buildTokenCardHTML(token, imageUrl, displayTitle) {
    const quantityTag = this.getQuantityTag(token);
    const categoryDisplay = this.getCategoryDisplay(token);
    const imgTag = this.buildImageTag(token, imageUrl, displayTitle);
    
    return `
        <div style="position: relative;">
            ${imgTag}
            ${quantityTag}
        </div>
        <div class="token-info">
            <div class="token-title">${displayTitle}</div>
            <div class="token-id">ID: ${token.tokenId}</div>
            ${categoryDisplay}
        </div>
    `;
}

/**
 * Construir tag de imagen con fallback
 */
buildImageTag(token, imageUrl, displayTitle) {
    if (token.fallbackImageUrl && imageUrl !== token.fallbackImageUrl) {
        const fallbackUrl = token.fallbackImageUrl.replace(/'/g, "\\'");
        return `<img src="${imageUrl}" alt="${displayTitle}" class="token-image" loading="lazy" onerror="if('${fallbackUrl}') { this.src='${fallbackUrl}'; this.onerror=function(){ this.src='${this.getDefaultImageUrl()}'; }; }">`;
    } else {
        return `<img src="${imageUrl}" alt="${displayTitle}" class="token-image" loading="lazy" onerror="this.src='${this.getDefaultImageUrl()}'">`;
    }
}

/**
 * Obtener URL de imagen por defecto
 */
getDefaultImageUrl() {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+';
}

/**
 * Obtener tag de cantidad
 */
getQuantityTag(token) {
    return token.tokenType === 'ERC1155' && token.balance > 1 ? 
        `<div class="token-quantity-tag">x${token.balance}</div>` : '';
}

/**
 * Obtener display de categoría
 */
getCategoryDisplay(token) {
    return token.tokenType === 'ERC1155' && token.category ? 
        `<div class="token-category">${token.category}</div>` : '';
}

/**
 * Obtener nombre de display para floppy
 */
getFloppyDisplayName(tokenId) {
    const floppyNames = {
        10003: 'GLITCH Floppy',
        10004: 'GF Floppy',
        10005: 'Golden Floppy',
        10007: 'NEONpack',
        10008: 'OPTICALpack',
        10009: 'PUNKSfloppy',
        10010: 'ComradesUSB',
        1123: 'CensorPACK',
        15010: 'Back to Work'
    };
    
    return floppyNames[tokenId] || tokenId.toString().replace(/^\d+\s*/, '');
}

/**
 * Obtener URL de imagen para floppy
 */
getFloppyImageUrl(token) {
    if (window.app?.modules?.floppy) {
        return window.app.modules.floppy.getFloppyImageUrl(token.tokenId);
    }
    return token.imageUrl;
}

/**
 * Obtener URL de imagen para serum
 */
getSerumImageUrl(token) {
    if (window.app?.modules?.serums) {
        return window.app.modules.serums.getSerumImageUrl(token.tokenId);
    }
    return token.imageUrl;
}

/**
 * Adjuntar event listeners al token card
 */
attachTokenCardListeners(tokenCard, token) {
    const clickHandler = () => {
        this.handleTokenSelection(tokenCard, token);
    };
    
    tokenCard._clickHandler = clickHandler;
    tokenCard.addEventListener('click', clickHandler);
}
```

---

## 📦 MÓDULO 4: Traits (`modules/traits.js`)

### **Estado**: ✅ Ya está refactorizado

**No requiere cambios mayores**. Este módulo ya está correctamente estructurado.

---

## 📦 MÓDULO 5: Floppy (`modules/floppy.js`)

### **Estado**: ✅ Ya está refactorizado

**No requiere cambios mayores**. Este módulo ya está correctamente estructurado.

---

## 📦 MÓDULO 6: Serums (`modules/serums.js`)

### **Estado**: ✅ Ya está refactorizado

**No requiere cambios mayores**. Este módulo ya está correctamente estructurado.

---

## 📦 MÓDULO 7: Zero (`modules/zero.js`)

### **Cambios Necesarios**

#### **1. Extraer lógica de procesamiento de NFTs**

**Código Actual (líneas 397-541)** - Método `loadTokens` tiene lógica de procesamiento muy larga:

**Código a Refactorizar**:
```javascript
// En loadTokens, reemplazar el map con:
let tokens = allNfts.map(nft => this.processNFT(nft, isERC721, contractAddress))
    .filter(token => token !== null);

/**
 * Procesar un NFT individual
 */
processNFT(nft, isERC721, contractAddress) {
    try {
        const tokenId = this.extractTokenId(nft);
        if (!tokenId) return null;
        
        const tokenIdInt = this.parseTokenId(tokenId);
        if (isNaN(tokenIdInt)) return null;
        
        const title = this.extractTitle(nft, tokenIdInt);
        const { imageUrl, fallbackImageUrl } = this.extractImageUrl(nft, tokenIdInt, isERC721);
        const balance = nft.balance || '1';
        const category = this.extractCategory(nft);
        
        const tokenObj = {
            tokenId: tokenIdInt,
            title: title,
            imageUrl: imageUrl,
            contract: nft.contract.address,
            contractName: nft.contract.name || 'Unknown Contract',
            tokenType: isERC721 ? 'ERC721' : 'ERC1155',
            category: category,
            balance: balance,
            metadata: nft.metadata || {}
        };
        
        if (fallbackImageUrl && !isERC721) {
            tokenObj.fallbackImageUrl = fallbackImageUrl;
        }
        
        return tokenObj;
    } catch (err) {
        console.error("Error processing NFT:", err, nft);
        return null;
    }
}

/**
 * Extraer tokenId del NFT
 */
extractTokenId(nft) {
    if (nft.tokenId) {
        return nft.tokenId;
    } else if (nft.id && nft.id.tokenId) {
        return nft.id.tokenId;
    }
    console.error("No tokenId found in NFT:", nft);
    return null;
}

/**
 * Parsear tokenId a entero
 */
parseTokenId(tokenId) {
    if (typeof tokenId === 'number') {
        return tokenId;
    } else if (tokenId.startsWith('0x')) {
        return parseInt(tokenId, 16);
    } else {
        return parseInt(tokenId, 10);
    }
}

/**
 * Extraer título del NFT
 */
extractTitle(nft, tokenIdInt) {
    if (nft.title) {
        return nft.title;
    } else if (nft.name) {
        return nft.name;
    } else if (nft.metadata && nft.metadata.name) {
        return nft.metadata.name;
    } else if (nft.contract && nft.contract.name) {
        return `${nft.contract.name} #${tokenIdInt}`;
    }
    return `Token #${tokenIdInt}`;
}

/**
 * Extraer URL de imagen del NFT
 */
extractImageUrl(nft, tokenIdInt, isERC721) {
    let mediaUrl = "";
    let fallbackImageUrl = null;
    
    if (isERC721) {
        mediaUrl = this.getERC721ImageUrl(tokenIdInt);
    } else {
        const result = this.getERC1155ImageUrl(nft, tokenIdInt);
        mediaUrl = result.imageUrl;
        fallbackImageUrl = result.fallbackUrl;
    }
    
    return { imageUrl: mediaUrl, fallbackImageUrl };
}

/**
 * Obtener URL de imagen para ERC721
 */
getERC721ImageUrl(tokenIdInt) {
    const hasZoomToggle = this.activeToggles.has(tokenIdInt) && 
                         this.activeToggles.get(tokenIdInt) === 1;
    
    if (hasZoomToggle) {
        return `https://adrianlab.vercel.app/api/render/${tokenIdInt}.png?closeup=true`;
    } else {
        return `https://adrianlab.vercel.app/api/render/${tokenIdInt}.png`;
    }
}

/**
 * Obtener URL de imagen para ERC1155
 */
getERC1155ImageUrl(nft, tokenIdInt) {
    // Floppy
    if (this.isFloppyToken(tokenIdInt)) {
        if (window.app?.modules?.floppy) {
            return {
                imageUrl: window.app.modules.floppy.getFloppyImageUrl(tokenIdInt),
                fallbackUrl: null
            };
        }
        return {
            imageUrl: `https://adrianlab.vercel.app/api/render/${tokenIdInt}.png`,
            fallbackUrl: null
        };
    }
    
    // Serum
    if (this.isSerumToken(tokenIdInt)) {
        if (window.app?.modules?.serums) {
            return {
                imageUrl: window.app.modules.serums.getSerumImageUrl(tokenIdInt),
                fallbackUrl: null
            };
        }
        return {
            imageUrl: `https://adrianlab.vercel.app/api/render/${tokenIdInt}.png`,
            fallbackUrl: null
        };
    }
    
    // Traits - usar TraitImageLoader
    const alchemyImageUrl = this.extractAlchemyImageUrl(nft);
    
    if (window.traitImageLoader) {
        const imageUrls = window.traitImageLoader.getTraitImageUrl(
            tokenIdInt,
            alchemyImageUrl || `https://adrianlab.vercel.app/api/render/floppy/${tokenIdInt}.png`
        );
        return {
            imageUrl: imageUrls.localUrl,
            fallbackUrl: imageUrls.fallbackUrl
        };
    }
    
    return {
        imageUrl: alchemyImageUrl,
        fallbackUrl: null
    };
}

/**
 * Extraer URL de imagen de Alchemy
 */
extractAlchemyImageUrl(nft) {
    if (nft.raw?.metadata?.image) {
        return nft.raw.metadata.image;
    } else if (nft.media && Array.isArray(nft.media) && nft.media.length > 0) {
        return nft.media[0].gateway || nft.media[0].raw || '';
    } else if (nft.metadata?.image) {
        return nft.metadata.image;
    }
    return '';
}

/**
 * Extraer categoría del NFT
 */
extractCategory(nft) {
    if (!nft.metadata) return '';
    
    let category = nft.metadata.category || nft.metadata.Category || '';
    
    if (!category && nft.metadata.attributes) {
        const categoryAttr = nft.metadata.attributes.find(attr => 
            attr.trait_type && attr.trait_type.toLowerCase() === 'category'
        );
        if (categoryAttr) {
            category = categoryAttr.value.toLowerCase();
        }
    }
    
    return category;
}
```

---

## 📦 MÓDULO 8: Data Manager (`modules/data-manager.js`)

### **Cambios Necesarios**

#### **1. Eliminar método `displayTokensImmediately` si existe**

**Código a Buscar y Eliminar**:
```javascript
// Buscar y ELIMINAR si existe:
displayTokensImmediately(tokens, filter) {
    // ... cualquier implementación de este método ...
}
```

#### **2. Estandarizar llamadas a `displayTokens`**

**Código Actual (todas las llamadas)**:
```javascript
// Buscar todas las llamadas a displayTokensImmediately y reemplazar
```

**Código a Reemplazar**:
```javascript
// REEMPLAZAR con:
if (window.app?.modules?.ui) {
    window.app.modules.ui.displayTokens(tokens, { 
        filter: filter || 'adrianzero',
        hasLoadingWheels: true 
    });
}
```

---

## 📦 MÓDULO 9: App Initializer (`modules/app-initializer.js`)

### **Cambios Necesarios**

#### **1. Orden de inicialización corregido** (ya en Documento 1)

#### **2. Agregar método de validación de módulos**

**Código a Agregar**:
```javascript
/**
 * Validar que todos los módulos críticos están disponibles
 */
validateCriticalModules() {
    const criticalModules = ['wallet', 'ui', 'zero'];
    const missing = [];
    
    for (const moduleName of criticalModules) {
        if (!this.app.modules[moduleName]) {
            missing.push(moduleName);
        }
    }
    
    if (missing.length > 0) {
        throw new Error(`Módulos críticos faltantes: ${missing.join(', ')}`);
    }
    
    console.log('✅ Todos los módulos críticos están disponibles');
}
```

**Código a Modificar en `initialize()`**:
```javascript
async initialize() {
    console.log('🚀 AppInitializer: Iniciando inicialización completa...');
    
    try {
        // Inicializar módulos
        await this.initializeModules();
        
        // Validar módulos críticos
        this.validateCriticalModules();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Configurar listeners opcionales
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

## 🗑️ CÓDIGO A ELIMINAR

### **1. Funciones helper duplicadas**

Buscar y eliminar funciones que están duplicadas entre módulos:

- Funciones de `getImagePath` duplicadas (ya están en módulos específicos)
- Funciones de validación duplicadas
- Event handlers duplicados

### **2. Comentarios obsoletos**

Eliminar comentarios que ya no son relevantes o que describen código que ya no existe.

### **3. Código muerto**

Buscar y eliminar:
- Variables no utilizadas
- Funciones nunca llamadas
- Imports no utilizados
- Event listeners nunca activados

---

## 📝 NOTAS IMPORTANTES

1. **Testing**: Después de cada refactorización de módulo, probar que la funcionalidad sigue funcionando.
2. **Commits**: Hacer commit después de cada módulo refactorizado.
3. **Documentación**: Actualizar comentarios JSDoc si es necesario.

---

## 🔄 SIGUIENTE PASO

Una vez completada la refactorización de módulos, proceder con el **Documento 3: Integración y Testing**.

