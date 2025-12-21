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
        
        // Estado de paginación para carga por batches
        this.paginationState = {
            traits: {
                pageKey: null,
                hasMore: false,
                batchSize: 50, // Cargar 50 traits por vez
                isBatchMode: false
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
        
        console.log('📊 TraitLABDataManager: Iniciando carga en paralelo...');
        this.isInitialized = true;
        
        // 1. Cargar AdrianZERO y AdrianLAB en paralelo
        await Promise.all([
            this.loadAdrianZeroTokensBasic(),
            this.loadAdrianLabTokens()
        ]);
        
        // 2. MEJORA DE NOMBRES COMENTADA - Cargando metadata completa desde Alchemy
        // Si necesitamos reactivar la mejora de nombres, descomentar:
        // this.improveAdrianZeroNamesInBackground();
        
        console.log('📊 TraitLABDataManager: Carga en paralelo completada');
    }

    /**
     * Cargar tokens AdrianZERO básicos (sin mejoras en background)
     */
    async loadAdrianZeroTokensBasic() {
        if (this.cache.loading.adrianZero || this.cache.ready.adrianZero) return;
        
        this.cache.loading.adrianZero = true;
        console.log('📊 Cargando primera página de tokens AdrianZERO...');
        
        try {
            if (window.app && window.app.modules.zero) {
                const userAddress = window.app.modules.wallet?.getCurrentAccount();
                if (userAddress) {
                    const contractAddress = "0x6e369bf0e4e0c106192d606fb6d85836d684da75";
                    // Cargar solo la primera página (100 tokens) para mostrar inmediatamente
                    const tokens = await window.app.modules.zero.loadTokens(
                        userAddress, 
                        contractAddress, 
                        null, // filter
                        false, // skipIndividualMetadata
                        100, // limit: solo primera página
                        null, // startPageKey
                        { includeMetadata: true, maxTokens: 100 } // options: limitar a 100 tokens
                    );
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
    }

    /**
     * Mejorar nombres AdrianZERO en background (no bloquea)
     */
    async improveAdrianZeroNamesInBackground() {
        console.log('🔄 Iniciando mejora de nombres AdrianZERO en background...');
        
        if (!this.cache.adrianZero || this.cache.adrianZero.length === 0) {
            console.log('No hay tokens AdrianZERO para mejorar nombres');
            return;
        }
        
        // Ejecutar en background sin bloquear
        setTimeout(() => {
            this.improveTokenNamesInBackground(this.cache.adrianZero);
        }, 100);
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
                    console.log('🔍 DEBUG: tokens type:', typeof tokens, 'isArray:', Array.isArray(tokens));
                    
                    // 🚀 MOSTRAR TOKENS INMEDIATAMENTE con loading wheels
                    this.displayTokensImmediately(tokens, 'adrianzero');
                    
                    // 🔄 MEJORA DE NOMBRES COMENTADA - Cargando metadata completa desde Alchemy
                    // Si necesitamos reactivar la mejora de nombres, descomentar:
                    // console.log('🔍 DEBUG: Iniciando mejora de nombres en background...');
                    // this.improveTokenNamesInBackground(tokens);
                    
                    // Marcar como listo para continuar con AdrianLAB
                    this.cache.loading.adrianZero = false;
                    this.cache.ready.adrianZero = true;
                    this.emit('adrianZeroReady', { tokens: this.cache.adrianZero });
                    console.log('🔍 DEBUG: AdrianZERO marcado como listo');
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
     * Verificar si debemos usar modo batch (móvil + tab traits)
     */
    shouldUseBatchMode() {
        const isMobile = window.innerWidth <= 768;
        const currentFilter = window.app?.modules?.ui?.getCurrentFilter?.() || window.app?.currentFilter;
        const isTraitsTab = currentFilter === 'traits';
        return isMobile && isTraitsTab;
    }

    /**
     * Resetear estado de paginación de traits
     */
    resetTraitsPagination() {
        this.paginationState.traits = {
            pageKey: null,
            hasMore: false,
            batchSize: 50, // Cargar 50 traits por vez
            isBatchMode: false
        };
        console.log('🔄 Estado de paginación de traits reseteado');
    }

    /**
     * Cargar tokens AdrianLAB (ERC1155) - TODOS LOS TOKENS SIN FILTRAR o por batches
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
                    
                    // 🚀 VERIFICAR SI USAR MODO BATCH
                    const useBatchMode = this.shouldUseBatchMode();
                    this.paginationState.traits.isBatchMode = useBatchMode;
                    
                    // 🚀 CARGAR TOKENS PROGRESIVAMENTE
                    console.log('📊 Cargando tokens ERC1155 progresivamente...');
                    await this.loadTokensProgressive(userAddress, contractAddress);
                } else {
                    console.warn('📊 No hay wallet conectada, no se pueden cargar tokens AdrianLAB');
                }
            } else {
                console.warn('📊 Módulo zero no disponible, no se pueden cargar tokens AdrianLAB');
            }
        } catch (error) {
            console.error('📊 Error cargando AdrianLAB tokens:', error);
            // Emitir evento de error para que la UI pueda manejarlo
            this.emit('adrianLabError', { error: error.message || 'Error desconocido cargando tokens' });
            // No lanzar el error para evitar crashes, solo loguearlo
        } finally {
            this.cache.loading.adrianLab = false;
            this.cache.ready.adrianLab = true;
            this.emit('adrianLabReady', { tokens: this.cache.adrianLab });
        }
    }

    /**
     * Cargar tokens AdrianLAB bajo demanda (desde fuera del módulo)
     * Útil cuando el usuario hace clic en el tab "traits" antes de que termine la carga inicial
     */
    async loadAdrianLabTokensOnDemand() {
        try {
            // Si ya están cargados o cargando, no hacer nada
            if (this.cache.ready.adrianLab) {
                console.log('📊 Traits ya están cargados');
                return;
            }
            
            if (this.cache.loading.adrianLab) {
                console.log('📊 Traits ya están en proceso de carga');
                return;
            }
            
            // Iniciar carga inmediatamente
            console.log('📊 Iniciando carga de traits bajo demanda...');
            await this.loadAdrianLabTokens();
        } catch (error) {
            console.error('📊 Error en loadAdrianLabTokensOnDemand:', error);
            // No lanzar el error para evitar crashes, solo loguearlo
            // El error ya fue manejado en loadAdrianLabTokens
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
        
        // 🚨 VERIFICACIÓN: Validar que tokens existe y es un array
        if (!tokens || !Array.isArray(tokens)) {
            console.warn('⚠️ displayTokensImmediately: tokens es undefined, null o no es un array:', tokens);
            return;
        }
        
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
            console.log('🔍 DEBUG: Llamando a window.app.modules.ui.displayTokens con:', { tokensCount: tokens.length, filter });
            
            try {
                // 🚨 NUEVO: Pasar hasLoadingWheels=true para mostrar loading wheels
                window.app.modules.ui.displayTokens(tokens, false, true);
                console.log('✅ displayTokens ejecutado exitosamente con loading wheels');
            } catch (error) {
                console.error('❌ Error en displayTokens:', error);
            }
            
            // 🚨 NUEVO: Marcar que los tokens ya fueron mostrados
            window.app.tokensAlreadyDisplayed = true;
            console.log('🚩 Flag tokensAlreadyDisplayed establecido a true');
            
            // Actualizar el estado de la aplicación
            if (window.app.onTokensLoaded) {
                console.log('🔍 DEBUG: Llamando a onTokensLoaded...');
                window.app.onTokensLoaded({ tokens, filter });
            }
            
            // Ocultar loading si está visible
            if (window.app.hideLoading) {
                console.log('🔍 DEBUG: Llamando a hideLoading...');
                window.app.hideLoading();
            }
        } else {
            console.warn('⚠️ UI module no disponible para mostrar tokens');
            console.log('🔍 DEBUG: window.app:', !!window.app);
            console.log('🔍 DEBUG: window.app.modules:', !!window.app?.modules);
            console.log('🔍 DEBUG: window.app.modules.ui:', !!window.app?.modules?.ui);
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
            
            // Usar provider con fallbacks para evitar saturación de MetaMask RPC
            let provider = window.TraitLABConfig?.getBaseProviderWithFallback();
            if (!provider) {
                console.log('No se pudo crear provider con fallback, usando MetaMask como fallback');
                // Fallback a MetaMask si no se puede crear el provider con fallbacks
                if (!window.ethereum) {
                    console.log('MetaMask no disponible, saltando mejora de nombres');
                    return;
                }
                const fallbackProvider = new ethers.providers.Web3Provider(window.ethereum);
                const network = await fallbackProvider.getNetwork();
                if (network.chainId !== 8453) {
                    console.log('No estamos en Base network, saltando mejora de nombres');
                    return;
                }
                provider = fallbackProvider;
            } else {
                // Verificar que estamos en Base (usando el primer provider del fallback)
                try {
                    const network = await provider.getNetwork();
                    if (network.chainId !== 8453) {
                        console.log('No estamos en Base network, saltando mejora de nombres');
                        return;
                    }
                } catch (error) {
                    console.warn('Error verificando red, continuando de todas formas:', error.message);
                }
            }
            
            // Cargar ABI del contrato de nombres
            const contractABI = await this.loadNameRegistryABI();
            if (!contractABI) return;
            
            // Crear instancia del contrato
            const nameRegistryContract = new ethers.Contract(
                window.TraitLABConfig?.ADRIAN_NAME_REGISTRY_CONTRACT || "0xaeC5ED33c88c1943BB7452aC4B571ad0b4c4068C",
                contractABI, 
                provider
            );
            
            // Procesar tokens en lotes con delays para evitar rate limiting
            const batchSize = 5; // Procesar 5 tokens a la vez
            const delayBetweenBatches = 2000; // 2 segundos entre lotes
            const nameMap = new Map();
            let processedCount = 0;
            
            for (let i = 0; i < adrianZeroTokens.length; i += batchSize) {
                const batch = adrianZeroTokens.slice(i, i + batchSize);
                console.log(`📦 Procesando lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(adrianZeroTokens.length/batchSize)} (${batch.length} tokens)`);
                
                const batchPromises = batch.map(async (token) => {
                    try {
                        const customName = await nameRegistryContract.getTokenName(token.tokenId);
                        if (customName && customName.trim()) {
                            nameMap.set(token.tokenId, customName.trim());
                            console.log(`✅ Nombre personalizado encontrado para token ${token.tokenId}: "${customName.trim()}"`);
                        }
                    } catch (error) {
                        console.log(`⚠️ Error obteniendo nombre para token ${token.tokenId}:`, error.message);
                    }
                    
                    processedCount++;
                    console.log(`📊 Progreso: ${processedCount}/${adrianZeroTokens.length} tokens procesados`);
                });
                
                await Promise.all(batchPromises);
                
                // 🚨 NUEVO: Verificar cancelación antes de actualizar
                if (window.app && window.app.loadingCancelled) {
                    console.log('🛑 Mejora de nombres cancelada - no actualizando display');
                    return;
                }
                
                // Actualizar display con nombres encontrados hasta ahora
                if (nameMap.size > 0) {
                    console.log(`🔄 Actualizando display con ${nameMap.size} nombres personalizados encontrados...`);
                    this.updateTokenNamesOnly(nameMap);
                }
                
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
    /**
     * Actualizar solo los nombres de tokens sin recargar todo el grid
     * Basado en la lógica de index.html
     */
    updateTokenNamesOnly(nameMap) {
        console.log(`🔄 Iniciando actualización de nombres para ${nameMap.size} tokens...`);
        
        // 🚨 NUEVO: Verificar si estamos en el tab correcto
        if (window.app && window.app.currentFilter !== 'adrianzero') {
            console.log('🛑 Saltando actualización de nombres - no estamos en tab AdrianZERO');
            return;
        }
        
        // Usar requestAnimationFrame para actualizaciones suaves
        requestAnimationFrame(() => {
            nameMap.forEach((customName, tokenId) => {
                // Buscar el token card por token ID
                const selector = `[data-token-id="${tokenId}"][data-contract="0x6e369bf0e4e0c106192d606fb6d85836d684da75"]`;
                const tokenCard = document.querySelector(selector);
                
                if (tokenCard) {
                    // Buscar el elemento de título dentro del card
                    const titleElement = tokenCard.querySelector('.token-title');
                    if (titleElement) {
                        const oldName = titleElement.textContent;
                        // Solo actualizar si el nombre es realmente diferente
                        if (oldName !== customName) {
                            titleElement.textContent = customName;
                            console.log(`✨ Nombre actualizado para token ${tokenId}: "${oldName}" → "${customName}"`);
                            
                            // Agregar efecto visual de actualización
                            titleElement.style.transition = 'color 0.3s ease';
                            titleElement.style.color = '#00ff00';
                            setTimeout(() => {
                                titleElement.style.color = '';
                            }, 1000);
                        } else {
                            console.log(`ℹ️ Nombre ya actualizado para token ${tokenId}: "${customName}"`);
                        }
                    } else {
                        console.log(`⚠️ Elemento de título no encontrado para token ${tokenId}`);
                    }
                } else {
                    console.log(`⚠️ Token card no encontrado para token ${tokenId} con selector: ${selector}`);
                }
            });
            
            console.log(`✅ Actualización de nombres completada para ${nameMap.size} tokens`);
        });
    }

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
        if (filterType === 'adrianzero' || filterType === 'rename' || filterType === 'customise') {
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

    off(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
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
     * @param {string} userAddress - User wallet address
     * @param {string} contractAddress - Contract address
     * @param {boolean} batchMode - (Desactivado) antes limitaba a 150 tokens
     */
    async loadTokensProgressive(userAddress, contractAddress, batchMode = false) {
        try {
            // Cargar tokens con metadata completa desde Alchemy - SOLO PRIMERA PÁGINA
            console.log(`📊 Cargando primera página de tokens ERC1155 con metadata completa desde Alchemy...`);
            
            let basicTokens = [];
            let loadResult = null;
            try {
                // Cargar solo la primera página (100 tokens) para mostrar inmediatamente
                // El usuario puede cargar más después si lo necesita
                loadResult = await this.loadBasicTokens(userAddress, contractAddress, 100); // Limitar a 100 tokens (1 página)
                basicTokens = Array.isArray(loadResult) ? loadResult : (loadResult?.tokens || []);
            } catch (error) {
                console.error('📊 Error cargando tokens básicos ERC1155:', error);
                // Emitir evento de error
                this.emit('adrianLabError', { 
                    error: error.message || 'Error cargando tokens básicos',
                    step: 'loadBasicTokens'
                });
                // Retornar array vacío en lugar de fallar
                basicTokens = [];
            }
            
            if (basicTokens.length === 0) {
                console.log('📊 No hay tokens ERC1155 básicos');
                // Emitir evento indicando que no hay tokens
                this.emit('adrianLabTokensReady', {
                    floppys: [],
                    serums: [],
                    traits: []
                });
                return;
            }
            
            // Separar por tipo usando filters.js
            try {
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
                    
                    // 🚨 NUEVO: Emitir evento para notificar que los tokens están listos
                    this.emit('adrianLabTokensReady', {
                        floppys: floppys,
                        serums: serums,
                        traits: traits
                    });

                    // 🚀 MEJORA DE METADATA COMENTADA - Cargando metadata completa desde Alchemy
                    // Si necesitamos reactivar la mejora de metadata, descomentar estas secciones:
                    /*
                    // 🚀 Mejorar metadata solo para el primer batch visible (rápido y barato)
                    try {
                        const enrichedCount = await this.enrichFirstBatchMetadata(traits, contractAddress, 'ERC1155', 50, 3);
                        console.log(`📊 Metadata enriquecida para ${enrichedCount} traits iniciales`);
                        this.emit('adrianLabMetadataUpdated', {
                            updatedCount: enrichedCount,
                            traits: this.cache.adrianLab.traits
                        });
                    } catch (metadataError) {
                        console.warn('📊 Error enriqueciendo metadata inicial de traits (no crítico):', metadataError);
                    }
                    
                    // 🔄 MEJORAR METADATA EN BACKGROUND (no bloquear si falla)
                    try {
                        this.improveERC1155MetadataInBackground(basicTokens);
                    } catch (metadataError) {
                        console.warn('📊 Error mejorando metadata en background (no crítico):', metadataError);
                    }
                    */
                } else {
                    console.warn('📊 Módulo filters no disponible');
                }
            } catch (error) {
                console.error('📊 Error procesando tokens ERC1155:', error);
                this.emit('adrianLabError', { 
                    error: error.message || 'Error procesando tokens',
                    step: 'filterTokens'
                });
            }
        } catch (error) {
            console.error('📊 Error crítico en carga progresiva:', error);
            // Emitir evento de error crítico
            this.emit('adrianLabError', { 
                error: error.message || 'Error crítico en carga progresiva',
                step: 'loadTokensProgressive'
            });
            // No lanzar el error para evitar crashes
        }
    }

    /**
     * Cargar más traits (siguiente batch) desde Alchemy
     * @returns {Promise<Array>} Array de nuevos traits cargados
     */
    async loadMoreTraits() {
        if (!this.paginationState.traits.isBatchMode) {
            console.warn('📊 loadMoreTraits llamado pero no estamos en modo batch');
            return [];
        }
        
        if (!this.paginationState.traits.hasMore) {
            console.log('📊 No hay más traits para cargar');
            return [];
        }
        
        if (!window.app || !window.app.modules.zero || !window.app.modules.wallet) {
            console.warn('📊 Módulos necesarios no disponibles');
            return [];
        }
        
        const userAddress = window.app.modules.wallet.getCurrentAccount();
        if (!userAddress) {
            console.warn('📊 No hay wallet conectada');
            return [];
        }
        
        const contractAddress = "0x90546848474fb3c9fda3fdad887969bb244e7e58";
        const batchSize = this.paginationState.traits.batchSize;
        const pageKey = this.paginationState.traits.pageKey;
        
        console.log(`📦 Cargando siguiente batch de ${batchSize} traits desde Alchemy...`);
        
        try {
            // Cargar siguiente batch
            const loadResult = await this.loadBasicTokens(userAddress, contractAddress, batchSize, pageKey);
            
            if (!loadResult || typeof loadResult !== 'object' || !loadResult.tokens) {
                console.warn('📊 Resultado inválido de loadBasicTokens');
                return [];
            }
            
            const newTokens = loadResult.tokens;
            
            // Actualizar estado de paginación
            this.paginationState.traits.pageKey = loadResult.nextPageKey;
            this.paginationState.traits.hasMore = loadResult.hasMore;
            
            console.log(`✅ Batch cargado: ${newTokens.length} nuevos traits, hasMore: ${loadResult.hasMore}`);
            
            // Separar por tipo usando filters.js
            if (window.app && window.app.modules.filters) {
                const newTraits = window.app.modules.filters.filterTraitTokens(newTokens);
                
                // Agregar nuevos traits al cache existente
                if (this.cache.adrianLab && this.cache.adrianLab.traits) {
                    this.cache.adrianLab.traits = [...this.cache.adrianLab.traits, ...newTraits];
                    this.cache.adrianLab.all = [...(this.cache.adrianLab.all || []), ...newTokens];
                } else {
                    // Si no hay cache, inicializarlo
                    const floppys = window.app.modules.filters.filterFloppyTokens(newTokens);
                    const serums = window.app.modules.filters.filterSerumTokens(newTokens);
                    this.cache.adrianLab = {
                        all: newTokens,
                        traits: newTraits,
                        floppys: floppys,
                        packs: [],
                        serums: serums
                    };
                }
                
                // Emitir evento con nuevos traits
                this.emit('adrianLabMoreTraitsLoaded', {
                    newTraits: newTraits,
                    hasMore: loadResult.hasMore,
                    totalTraits: this.cache.adrianLab.traits.length
                });
                
                return newTraits;
            } else {
                console.warn('📊 Módulo filters no disponible');
                return [];
            }
        } catch (error) {
            console.error('📊 Error cargando más traits:', error);
            this.emit('adrianLabError', { 
                error: error.message || 'Error cargando más traits',
                step: 'loadMoreTraits'
            });
            return [];
        }
    }

    /**
     * Cargar tokens con metadata completa desde Alchemy
     * @param {string} userAddress - User wallet address
     * @param {string} contractAddress - Contract address
     * @param {number|null} limit - Maximum number of tokens to load (null = all)
     * @param {string|null} pageKey - Page key to start from (null = start from beginning)
     * @returns {Promise<Array|Object>} Array of tokens or {tokens, hasMore, nextPageKey} if limit is provided
     */
    async loadBasicTokens(userAddress, contractAddress, limit = null, pageKey = null) {
        try {
            // Usar el método loadTokens del zero.js con parámetros de paginación
            // includeMetadata=true por defecto ahora, así que la metadata viene en la respuesta principal
            const result = await window.app.modules.zero.loadTokens(
                userAddress, 
                contractAddress, 
                null, // filter
                false, // skip individual metadata (false porque metadata viene en respuesta principal)
                limit, // limit (para batch mode)
                pageKey, // startPageKey (para continuar desde donde quedó)
                { includeMetadata: false } // Respuesta mínima (omitMetadata)
            );
            
            // Si limit fue proporcionado, result es un objeto {tokens, hasMore, nextPageKey}
            // Si no, result es un array
            return result || (limit ? { tokens: [], hasMore: false, nextPageKey: null } : []);
        } catch (error) {
            console.warn('📊 Error cargando tokens básicos:', error);
            return limit ? { tokens: [], hasMore: false, nextPageKey: null } : [];
        }
    }

    /**
     * Mejorar metadata de tokens ERC1155 en background
     */
    async enrichFirstBatchMetadata(tokens, contractAddress, tokenType = 'ERC1155', batchLimit = 50, concurrency = 3) {
        if (!tokens || tokens.length === 0) {
            return 0;
        }

        const apiKeys = window.TraitLABConfig?.getAllAlchemyApiKeys() || [window.TraitLABConfig?.ALCHEMY_API_KEY || "pqRmKgTaLqm2eak9iML1f"];
        const zeroModule = window.app?.modules?.zero;
        if (!zeroModule || typeof zeroModule.fetchWithAlchemyFallback !== 'function') {
            console.warn('📊 No se puede enriquecer metadata: zero module o fetchWithAlchemyFallback no disponible');
            return 0;
        }

        const targetTokens = tokens.slice(0, batchLimit);
        let enriched = 0;
        let index = 0;

        const worker = async () => {
            while (index < targetTokens.length) {
                const currentIndex = index++;
                const token = targetTokens[currentIndex];

                try {
                    const metadataUrlTemplate = `https://base-mainnet.g.alchemy.com/nft/v3/{API_KEY}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${token.tokenId}&tokenType=${tokenType}`;
                    const response = await zeroModule.fetchWithAlchemyFallback(metadataUrlTemplate, apiKeys, 12000);

                    if (!response.ok) {
                        console.warn(`📊 Metadata no disponible para token ${token.tokenId}: ${response.status}`);
                        continue;
                    }

                    const metadataData = await response.json();
                    const metadata = metadataData.metadata || {};

                    token.metadata = metadata;

                    // Categoria
                    let category = metadata.category || metadata.Category || '';
                    if (!category && metadata.attributes) {
                        const categoryAttr = metadata.attributes.find(attr => attr.trait_type && attr.trait_type.toLowerCase() === 'category');
                        if (categoryAttr) {
                            category = categoryAttr.value.toLowerCase();
                        }
                    }
                    if (category) {
                        token.category = category;
                    }

                    // Imagen si no teníamos
                    if (!token.imageUrl && metadata.image) {
                        token.imageUrl = metadata.image;
                    }

                    enriched++;
                } catch (error) {
                    console.warn(`📊 Error enriqueciendo metadata para token ${token.tokenId}:`, error.message || error);
                }
            }
        };

        // Ejecutar con concurrencia limitada
        const workers = [];
        const workerCount = Math.max(1, Math.min(concurrency, batchLimit));
        for (let i = 0; i < workerCount; i++) {
            workers.push(worker());
        }
        await Promise.all(workers);

        return enriched;
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
