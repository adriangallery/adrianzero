/**
 * TRAITLAB - DataManager
 * Carga todos los tokens en background y los cache para uso de los módulos
 */

class TraitLABDataManager {
    constructor() {
        this.cache = {
            adrianZero: null,      // ERC721 tokens
            adrianLab: null,       // ERC1155 tokens (traits, floppys, packs, serums)
            loading: {
                adrianZero: false,
                adrianLab: false
            },
            ready: {
                adrianZero: false,
                adrianLab: false
            }
        };
        
        this.eventListeners = new Map();
        this.isInitialized = false;
        
        console.log('📊 TraitLABDataManager: Inicializado');
    }

    /**
     * Inicializar y comenzar carga en background
     */
    async init() {
        if (this.isInitialized) return;
        
        console.log('📊 TraitLABDataManager: Iniciando carga secuencial...');
        this.isInitialized = true;
        
        // 1. Cargar AdrianZERO primero
        await this.loadAdrianZeroTokens();
        
        // 2. Esperar a que se complete la mejora de nombres
        await this.waitForAdrianZeroImprovement();
        
        // 3. Luego cargar AdrianLAB
        await this.loadAdrianLabTokens();
        
        console.log('📊 TraitLABDataManager: Carga secuencial completada');
    }

    /**
     * Cargar tokens AdrianZERO (ERC721) con carga progresiva
     */
    async loadAdrianZeroTokens() {
        if (this.cache.loading.adrianZero || this.cache.ready.adrianZero) return;
        
        this.cache.loading.adrianZero = true;
        console.log('📊 Cargando tokens AdrianZERO...');
        
        try {
            // Usar el módulo zero existente si está disponible
            if (window.app && window.app.modules.zero) {
                const userAddress = window.app.modules.wallet?.getCurrentAccount();
                if (userAddress) {
                    const contractAddress = "0x6e369bf0e4e0c106192d606fb6d85836d684da75";
                    const tokens = await window.app.modules.zero.loadTokens(userAddress, contractAddress);
                    this.cache.adrianZero = tokens;
                    console.log('📊 AdrianZERO tokens cargados:', tokens.length);
                    
                    // 🚀 MOSTRAR PLACEHOLDERS INMEDIATAMENTE para dar sensación de carga
                    this.displayPlaceholdersImmediately(tokens, 'adrianzero');
                    
                    // 🔄 MEJORAR nombres personalizados EN BACKGROUND (no bloquea)
                    this.improveTokenNamesInBackground(tokens);
                    
                    // Marcar como listo para continuar con AdrianLAB
                    this.cache.loading.adrianZero = false;
                    this.cache.ready.adrianZero = true;
                    this.emit('adrianZeroReady', { tokens: this.cache.adrianZero });
                }
            }
        } catch (error) {
            console.warn('📊 Error cargando AdrianZERO tokens:', error);
            // En caso de error, marcar como no cargando
            this.cache.loading.adrianZero = false;
            this.cache.ready.adrianZero = true;
            this.emit('adrianZeroReady', { tokens: this.cache.adrianZero });
        }
        // NO marcar como completo aquí - se hará al final de improveTokenNamesInBackground
    }

    /**
     * Cargar tokens AdrianLAB (ERC1155) - TODOS LOS TOKENS SIN FILTRAR
     */
    async loadAdrianLabTokens() {
        if (this.cache.loading.adrianLab || this.cache.ready.adrianLab) return;
        
        this.cache.loading.adrianLab = true;
        console.log('📊 Cargando tokens AdrianLAB (ERC1155)...');
        
        try {
            // Usar el módulo zero existente si está disponible
            if (window.app && window.app.modules.zero) {
                const userAddress = window.app.modules.wallet?.getCurrentAccount();
                if (userAddress) {
                    const contractAddress = "0x90546848474fb3c9fda3fdad887969bb244e7e58";
                    
                    // 🚀 CARGAR TOKENS PROGRESIVAMENTE
                    console.log('📊 Cargando tokens ERC1155 progresivamente...');
                    await this.loadTokensProgressive(userAddress, contractAddress);
                }
            }
        } catch (error) {
            console.warn('📊 Error cargando AdrianLAB tokens:', error);
        } finally {
            this.cache.loading.adrianLab = false;
            this.cache.ready.adrianLab = true;
            this.emit('adrianLabReady', { tokens: this.cache.adrianLab });
        }
    }

    /**
     * Cargar tokens con reintentos y rate limiting - SIN FILTRO
     */
    async loadTokensWithRetry(userAddress, contractAddress, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`📊 Intento ${attempt}/${maxRetries} cargando tokens ERC1155...`);
                // NO pasar filtro - zero.js ya no filtra
                const tokens = await window.app.modules.zero.loadTokens(userAddress, contractAddress);
                console.log(`✅ Tokens ERC1155 cargados exitosamente en intento ${attempt}: ${tokens.length}`);
                return tokens;
            } catch (error) {
                if (error.message.includes('429') && attempt < maxRetries) {
                    const delayTime = attempt * 5000; // 5s, 10s, 15s
                    console.log(`⏳ Rate limit (429), esperando ${delayTime/1000}s antes de reintentar...`);
                    await this.delay(delayTime);
                } else {
                    console.warn(`❌ Error cargando tokens ERC1155 en intento ${attempt}:`, error.message);
                    if (attempt === maxRetries) {
                        return []; // Retornar array vacío en lugar de fallar
                    }
                }
            }
        }
        return [];
    }

    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 🚀 Mostrar placeholders inmediatamente para dar sensación de carga
     */
    displayPlaceholdersImmediately(tokens, filter) {
        console.log('🚀 Mostrando placeholders inmediatamente para dar sensación de carga...');
        console.log(`📊 Placeholders a mostrar: ${tokens.length}, Filter: ${filter}`);
        
        // 🚨 VERIFICACIÓN: Solo mostrar placeholders AdrianZERO inmediatamente
        if (filter !== 'adrianzero') {
            console.log(`⚠️ Saltando displayPlaceholdersImmediately - Solo AdrianZERO se muestra inmediatamente. Filter: ${filter}`);
            return;
        }
        
        if (window.app && window.app.modules.ui) {
            // Mostrar placeholders inmediatamente
            console.log('🎯 Mostrando placeholders AdrianZERO inmediatamente en la UI...');
            window.app.modules.ui.displayPlaceholders(tokens, filter);
            
            // Ocultar loading si está visible
            if (window.app.hideLoading) {
                window.app.hideLoading();
            }
        } else {
            console.warn('⚠️ UI module no disponible para mostrar placeholders');
        }
    }

    /**
     * 🚀 Mostrar tokens inmediatamente con nombres de Alchemy
     */
    displayTokensImmediately(tokens, filter) {
        console.log('🚀 Mostrando tokens inmediatamente con nombres de Alchemy...');
        console.log(`📊 Tokens a mostrar: ${tokens.length}, Filter: ${filter}`);
        
        // 🚨 VERIFICACIÓN: Solo mostrar tokens AdrianZERO inmediatamente
        // Los tokens ERC1155 se mostrarán cuando el usuario cambie de tab
        if (filter !== 'adrianzero') {
            console.log(`⚠️ Saltando displayTokensImmediately - Solo AdrianZERO se muestra inmediatamente. Filter: ${filter}`);
            return;
        }
        
        if (window.app && window.app.modules.ui) {
            // Mostrar tokens inmediatamente sin esperar mejoras
            console.log('🎯 Mostrando AdrianZERO tokens inmediatamente en la UI...');
            window.app.modules.ui.displayTokens(tokens, filter);
            
            // Actualizar el estado de la aplicación
            if (window.app.onTokensLoaded) {
                window.app.onTokensLoaded({ tokens, filter });
            }
            
            // Ocultar loading si está visible
            if (window.app.hideLoading) {
                window.app.hideLoading();
            }
        } else {
            console.warn('⚠️ UI module no disponible para mostrar tokens');
        }
    }

    /**
     * 🔄 Mejorar nombres de tokens en background
     */
    async improveTokenNamesInBackground(tokens) {
        console.log('🔄 Iniciando mejora de nombres en background...');
        
        // Solo procesar tokens AdrianZERO (ERC721)
        const adrianZeroTokens = tokens.filter(token => 
            token.tokenType === 'ERC721' && 
            token.contract?.toLowerCase() === "0x6e369bf0e4e0c106192d606fb6d85836d684da75".toLowerCase()
        );
        
        if (adrianZeroTokens.length === 0) {
            console.log('No hay tokens AdrianZERO para mejorar nombres');
            return;
        }
        
        try {
            // Cargar ethers si no está disponible
            let ethers = window.ethers;
            if (typeof ethers === 'undefined') {
                console.log('Ethers no disponible, cargando dinámicamente...');
                await this.loadEthersDynamically();
                ethers = window.ethers;
            }
            
            if (!ethers || !window.ethereum) {
                console.log('Ethers o wallet no disponible, saltando mejora de nombres');
                return;
            }
            
            // Verificar red Base
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const network = await provider.getNetwork();
            if (network.chainId !== 8453) {
                console.log('No estamos en Base network, saltando mejora de nombres');
                return;
            }
            
            // Cargar ABI del contrato de nombres
            const contractABI = await this.loadNameRegistryABI();
            if (!contractABI) return;
            
            // Crear instancia del contrato
            const nameRegistryContract = new ethers.Contract(
                "0x90546848474fb3c9fda3fdad887969bb244e7e58", // ADRIAN_NAME_REGISTRY_CONTRACT
                contractABI, 
                provider
            );
            
            // Procesar tokens en lotes con delays para evitar rate limiting
            const batchSize = 3; // Reducir tamaño de lote
            const delayBetweenBatches = 5000; // Aumentar delay entre lotes
            
            for (let i = 0; i < adrianZeroTokens.length; i += batchSize) {
                const batch = adrianZeroTokens.slice(i, i + batchSize);
                
                console.log(`📦 Procesando lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(adrianZeroTokens.length/batchSize)} (${batch.length} tokens)`);
                
                // Procesar lote con delays individuales
                const batchPromises = batch.map(async (token, index) => {
                    await this.delay(index * 1000); // 1 segundo entre cada request
                    
                    try {
                        const customName = await nameRegistryContract.getTokenName(token.tokenId);
                        if (customName && customName.trim()) {
                            // Actualizar token con nombre personalizado
                            token.title = customName.trim();
                            token.customName = customName.trim();
                            console.log(`✅ Nombre personalizado encontrado para token ${token.tokenId}: "${customName.trim()}"`);
                            
                            // Actualizar UI en tiempo real
                            this.updateTokenInUI(token);
                        }
                    } catch (error) {
                        console.log(`⚠️ Error obteniendo nombre para token ${token.tokenId}:`, error.message);
                    }
                });
                
                await Promise.allSettled(batchPromises);
                
                // Esperar entre lotes
                if (i + batchSize < adrianZeroTokens.length) {
                    console.log(`⏳ Esperando ${delayBetweenBatches}ms antes del siguiente lote...`);
                    await this.delay(delayBetweenBatches);
                }
            }
            
            console.log('✅ Mejora de nombres completada');
            
        } catch (error) {
            console.warn('⚠️ Error en mejora de nombres:', error);
        } finally {
            // Marcar que la mejora de nombres está completa
            console.log('✅ Mejora de nombres AdrianZERO completada');
        }
    }

    /**
     * Esperar a que se complete la mejora de nombres de AdrianZERO
     */
    async waitForAdrianZeroImprovement() {
        console.log('⏳ AdrianZERO ya está listo - continuando con AdrianLAB...');
        
        // No esperar - AdrianZERO ya está listo y mostrado
        // La mejora de nombres se ejecuta en background sin bloquear
        
        console.log('✅ Continuando con carga de AdrianLAB');
    }

    /**
     * Cargar ethers dinámicamente
     */
    async loadEthersDynamically() {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/ethers@5.7.2/dist/ethers.umd.min.js';
            script.onload = () => {
                console.log('✅ Ethers cargado dinámicamente');
                resolve();
            };
            script.onerror = () => {
                console.log('❌ Error cargando ethers dinámicamente');
                resolve();
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Cargar ABI del contrato de nombres
     */
    async loadNameRegistryABI() {
        try {
            const response = await fetch('./adrian-name-registry-abi.json');
            if (!response.ok) {
                console.log('❌ Error cargando ABI del contrato de nombres');
                return null;
            }
            return await response.json();
        } catch (error) {
            console.log('❌ Error cargando ABI:', error);
            return null;
        }
    }

    /**
     * Actualizar token en la UI en tiempo real
     */
    updateTokenInUI(token) {
        // Buscar el elemento del token en el DOM
        const tokenElement = document.querySelector(`[data-token-id="${token.tokenId}"]`);
        if (tokenElement) {
            // Actualizar el título del token
            const titleElement = tokenElement.querySelector('.token-title');
            if (titleElement) {
                titleElement.textContent = token.title;
            }
            
            // Agregar indicador visual de que se actualizó
            tokenElement.classList.add('name-updated');
            
            // Remover la clase después de un tiempo
            setTimeout(() => {
                tokenElement.classList.remove('name-updated');
            }, 3000);
        }
    }

    /**
     * Obtener tokens por tipo
     */
    getTokens(type, category = null) {
        if (type === 'adrianZero') {
            return this.cache.adrianZero || [];
        } else if (type === 'adrianLab') {
            if (category) {
                return this.cache.adrianLab?.[category] || [];
            }
            return this.cache.adrianLab || {};
        }
        return [];
    }

    /**
     * Obtener tokens filtrados por tipo (floppy, serum, traits, adrianzero)
     */
    getFilteredTokens(filterType) {
        if (filterType === 'adrianzero') {
            return this.getTokens('adrianZero');
        } else if (filterType === 'floppy') {
            return this.getTokens('adrianLab', 'floppys');
        } else if (filterType === 'serum') {
            return this.getTokens('adrianLab', 'serums');
        } else if (filterType === 'traits') {
            return this.getTokens('adrianLab', 'traits');
        } else if (filterType === 'crafting') {
            return this.getTokens('adrianLab', 'traits'); // Crafting usa traits
        }
        return [];
    }

    /**
     * Verificar si un tipo está listo
     */
    isReady(type) {
        return this.cache.ready[type] || false;
    }

    /**
     * Verificar si un tipo está cargando
     */
    isLoading(type) {
        return this.cache.loading[type] || false;
    }

    /**
     * Obtener estado completo
     */
    getStatus() {
        return {
            adrianZero: {
                ready: this.cache.ready.adrianZero,
                loading: this.cache.loading.adrianZero,
                count: this.cache.adrianZero?.length || 0
            },
            adrianLab: {
                ready: this.cache.ready.adrianLab,
                loading: this.cache.loading.adrianLab,
                counts: this.cache.adrianLab ? {
                    traits: this.cache.adrianLab.traits?.length || 0,
                    floppys: this.cache.adrianLab.floppys?.length || 0,
                    packs: this.cache.adrianLab.packs?.length || 0,
                    serums: this.cache.adrianLab.serums?.length || 0
                } : {}
            }
        };
    }

    /**
     * Sistema de eventos
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => callback(data));
        }
    }

    /**
     * Forzar recarga de un tipo específico
     */
    async reload(type) {
        if (type === 'adrianZero') {
            this.cache.ready.adrianZero = false;
            await this.loadAdrianZeroTokens();
        } else if (type === 'adrianLab') {
            this.cache.ready.adrianLab = false;
            await this.loadAdrianLabTokens();
        }
    }

    /**
     * Cargar tokens ERC1155 progresivamente
     */
    async loadTokensProgressive(userAddress, contractAddress) {
        try {
            // Cargar tokens básicos primero (sin metadata individual)
            console.log('📊 Cargando tokens básicos ERC1155...');
            const basicTokens = await this.loadBasicTokens(userAddress, contractAddress);
            
            if (basicTokens.length === 0) {
                console.log('📊 No hay tokens ERC1155 básicos');
                return;
            }
            
            // Separar por tipo usando filters.js
            if (window.app && window.app.modules.filters) {
                const traits = window.app.modules.filters.filterTraitTokens(basicTokens);
                const floppys = window.app.modules.filters.filterFloppyTokens(basicTokens);
                const serums = window.app.modules.filters.filterSerumTokens(basicTokens);
                
                this.cache.adrianLab = {
                    all: basicTokens,
                    traits: traits,
                    floppys: floppys,
                    packs: [], // Por ahora vacío
                    serums: serums
                };
                
                console.log('📊 Tokens ERC1155 básicos separados:', {
                    total: basicTokens.length,
                    traits: traits.length,
                    floppys: floppys.length,
                    packs: 0,
                    serums: serums.length
                });
                
                // 🚀 NO MOSTRAR TOKENS AQUÍ - se mostrarán cuando el usuario cambie de tab
                // Los tokens se mostrarán automáticamente via getFilteredTokens() cuando sea necesario
                
                // 🔄 MEJORAR METADATA EN BACKGROUND
                this.improveERC1155MetadataInBackground(basicTokens);
            }
        } catch (error) {
            console.warn('📊 Error en carga progresiva:', error);
        }
    }

    /**
     * Cargar tokens básicos sin metadata individual
     */
    async loadBasicTokens(userAddress, contractAddress) {
        try {
            // Usar el método loadTokens del zero.js pero con un flag para saltar metadata individual
            const tokens = await window.app.modules.zero.loadTokens(userAddress, contractAddress, null, true); // true = skip individual metadata
            return tokens || [];
        } catch (error) {
            console.warn('📊 Error cargando tokens básicos:', error);
            return [];
        }
    }

    /**
     * Mejorar metadata de tokens ERC1155 en background
     */
    async improveERC1155MetadataInBackground(basicTokens) {
        console.log('🔄 Iniciando mejora de metadata ERC1155 en background...');
        
        // Procesar en lotes pequeños para evitar rate limiting
        const batchSize = 10;
        const batches = [];
        
        for (let i = 0; i < basicTokens.length; i += batchSize) {
            batches.push(basicTokens.slice(i, i + batchSize));
        }
        
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            console.log(`📦 Procesando lote ${i + 1}/${batches.length} (${batch.length} tokens)`);
            
            // Procesar cada token del lote
            for (const token of batch) {
                try {
                    // Aquí se podría mejorar el metadata individual si es necesario
                    // Por ahora solo logueamos el progreso
                    console.log(`🔄 Mejorando metadata para token ${token.tokenId}`);
                } catch (error) {
                    console.warn(`⚠️ Error mejorando metadata para token ${token.tokenId}:`, error);
                }
            }
            
            // Delay entre lotes para evitar rate limiting
            if (i < batches.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        console.log('✅ Mejora de metadata ERC1155 completada');
    }

    /**
     * Limpiar cache
     */
    clearCache() {
        this.cache.adrianZero = null;
        this.cache.adrianLab = null;
        this.cache.ready.adrianZero = false;
        this.cache.ready.adrianLab = false;
        console.log('📊 Cache limpiado');
    }
}

// Exportar para uso externo
if (typeof window !== 'undefined') {
    window.TraitLABDataManager = TraitLABDataManager;
}
