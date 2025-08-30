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
        
        console.log('📊 TraitLABDataManager: Iniciando carga en background...');
        this.isInitialized = true;
        
        // Cargar todo en paralelo
        await Promise.allSettled([
            this.loadAdrianZeroTokens(),
            this.loadAdrianLabTokens()
        ]);
        
        console.log('📊 TraitLABDataManager: Carga en background completada');
    }

    /**
     * Cargar tokens AdrianZERO (ERC721)
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
                }
            }
        } catch (error) {
            console.warn('📊 Error cargando AdrianZERO tokens:', error);
        } finally {
            this.cache.loading.adrianZero = false;
            this.cache.ready.adrianZero = true;
            this.emit('adrianZeroReady', { tokens: this.cache.adrianZero });
        }
    }

    /**
     * Cargar tokens AdrianLAB (ERC1155) con rate limiting inteligente
     */
    async loadAdrianLabTokens() {
        if (this.cache.loading.adrianLab || this.cache.ready.adrianLab) return;
        
        this.cache.loading.adrianLab = true;
        console.log('📊 Cargando tokens AdrianLAB...');
        
        try {
            // Usar el módulo zero existente si está disponible
            if (window.app && window.app.modules.zero) {
                const userAddress = window.app.modules.wallet?.getCurrentAccount();
                if (userAddress) {
                    const contractAddress = "0x90546848474fb3c9fda3fdad887969bb244e7e58";
                    
                    // Cargar traits primero (ya están cargados, usar cache)
                    console.log('📊 Usando traits del cache...');
                    const traits = this.cache.adrianLab?.traits || [];
                    
                    // Cargar floppys y serums con delay para evitar rate limiting
                    console.log('📊 Cargando floppys con delay...');
                    const floppys = await this.loadTokensWithRetry(userAddress, contractAddress, 'floppy');
                    
                    console.log('📊 Esperando 3 segundos antes de cargar serums...');
                    await this.delay(3000);
                    
                    console.log('📊 Cargando serums...');
                    const serums = await this.loadTokensWithRetry(userAddress, contractAddress, 'serum');
                    
                    // Separar por tipo
                    this.cache.adrianLab = {
                        traits: traits,
                        floppys: floppys.filter(t => t.tokenType === 'ERC1155'),
                        packs: [], // Por ahora vacío, se puede implementar después
                        serums: serums.filter(t => t.tokenType === 'ERC1155')
                    };
                    
                    console.log('📊 AdrianLAB tokens cargados:', {
                        traits: this.cache.adrianLab.traits.length,
                        floppys: this.cache.adrianLab.floppys.length,
                        packs: this.cache.adrianLab.packs.length,
                        serums: this.cache.adrianLab.serums.length
                    });
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
     * Cargar tokens con reintentos y rate limiting
     */
    async loadTokensWithRetry(userAddress, contractAddress, filter, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`📊 Intento ${attempt}/${maxRetries} cargando ${filter}...`);
                const tokens = await window.app.modules.zero.loadTokens(userAddress, contractAddress, filter);
                console.log(`✅ ${filter} cargados exitosamente en intento ${attempt}`);
                return tokens;
            } catch (error) {
                if (error.message.includes('429') && attempt < maxRetries) {
                    const delayTime = attempt * 5000; // 5s, 10s, 15s
                    console.log(`⏳ Rate limit (429), esperando ${delayTime/1000}s antes de reintentar...`);
                    await this.delay(delayTime);
                } else {
                    console.warn(`❌ Error cargando ${filter} en intento ${attempt}:`, error.message);
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
