/**
 * TRAITLABv3 - Módulo de Cache con Supabase
 * Maneja el cache de datos de wallet y tokens globales en Supabase
 */

class SupabaseCache {
    constructor() {
        this.supabase = null;
        this.config = null;
        this.initialized = false;
    }

    /**
     * Inicializar conexión con Supabase
     */
    async init() {
        if (this.initialized) {
            return;
        }

        try {
            // Cargar configuración
            this.config = this.loadConfig();
            
            if (!this.config.url || !this.config.anonKey) {
                console.warn('⚠️ SupabaseCache: Configuración no encontrada, cache deshabilitado');
                return;
            }

            // Cargar cliente de Supabase
            if (typeof window.supabase === 'undefined') {
                // Cargar desde CDN si no está disponible
                await this.loadSupabaseClient();
            }

            this.supabase = window.supabase.createClient(this.config.url, this.config.anonKey);
            this.initialized = true;
            console.log('✅ SupabaseCache: Inicializado correctamente');
        } catch (error) {
            console.error('❌ SupabaseCache: Error al inicializar:', error);
            this.initialized = false;
        }
    }

    /**
     * Cargar configuración de Supabase
     */
    loadConfig() {
        // Intentar desde variables de entorno o config
        const url = window.SUPABASE_URL || 
                   (window.app?.config?.supabase?.url) || 
                   null;
        const anonKey = window.SUPABASE_ANON_KEY || 
                       (window.app?.config?.supabase?.anonKey) || 
                       null;

        return { url, anonKey };
    }

    /**
     * Cargar cliente de Supabase desde CDN
     */
    async loadSupabaseClient() {
        return new Promise((resolve, reject) => {
            if (window.supabase) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
            script.type = 'module';
            script.onload = () => {
                console.log('✅ Supabase client cargado desde CDN');
                resolve();
            };
            script.onerror = () => {
                console.error('❌ Error al cargar Supabase client');
                reject(new Error('Failed to load Supabase client'));
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Obtener datos de wallet desde cache
     */
    async getWalletData(walletAddress) {
        if (!this.initialized || !walletAddress) {
            return null;
        }

        try {
            const { data, error } = await this.supabase
                .from('wallet_data')
                .select('*')
                .eq('wallet_address', walletAddress.toLowerCase())
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                console.error('❌ Error al obtener wallet data:', error);
                return null;
            }

            if (data) {
                console.log('✅ Datos de wallet obtenidos desde cache:', walletAddress);
                return data;
            }

            return null;
        } catch (error) {
            console.error('❌ Error en getWalletData:', error);
            return null;
        }
    }

    /**
     * Obtener datos globales de un token
     */
    async getGlobalTokenData(tokenId, contractType) {
        if (!this.initialized || !tokenId || !contractType) {
            return null;
        }

        try {
            const { data, error } = await this.supabase
                .from('global_token_data')
                .select('*')
                .eq('token_id', tokenId)
                .eq('contract_type', contractType)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('❌ Error al obtener global token data:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('❌ Error en getGlobalTokenData:', error);
            return null;
        }
    }

    /**
     * Actualizar datos de wallet
     */
    async updateWalletData(walletAddress, data) {
        if (!this.initialized || !walletAddress) {
            return false;
        }

        try {
            const walletData = {
                wallet_address: walletAddress.toLowerCase(),
                adrianzero_tokens: data.adrianzero_tokens || [],
                adrianlab_tokens: data.adrianlab_tokens || [],
                custom_names: data.custom_names || {},
                last_updated: new Date().toISOString()
            };

            const { error } = await this.supabase
                .from('wallet_data')
                .upsert(walletData, {
                    onConflict: 'wallet_address'
                });

            if (error) {
                console.error('❌ Error al actualizar wallet data:', error);
                return false;
            }

            console.log('✅ Wallet data actualizado en cache:', walletAddress);
            return true;
        } catch (error) {
            console.error('❌ Error en updateWalletData:', error);
            return false;
        }
    }

    /**
     * Actualizar datos globales de un token
     */
    async updateGlobalTokenData(tokenId, contractType, data) {
        if (!this.initialized || !tokenId || !contractType) {
            return false;
        }

        try {
            const tokenData = {
                token_id: tokenId,
                contract_type: contractType,
                name: data.name || null,
                metadata: data.metadata || {},
                image_url: data.image_url || null,
                last_updated: new Date().toISOString()
            };

            const { error } = await this.supabase
                .from('global_token_data')
                .upsert(tokenData, {
                    onConflict: 'token_id,contract_type'
                });

            if (error) {
                console.error('❌ Error al actualizar global token data:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('❌ Error en updateGlobalTokenData:', error);
            return false;
        }
    }

    /**
     * Sincronizar tokens de wallet
     */
    async syncWalletTokens(walletAddress, tokens, contractType) {
        if (!this.initialized || !walletAddress || !tokens || !Array.isArray(tokens)) {
            return false;
        }

        try {
            const walletAddressLower = walletAddress.toLowerCase();
            
            // Eliminar mappings antiguos de este tipo de contrato
            await this.supabase
                .from('wallet_token_mapping')
                .delete()
                .eq('wallet_address', walletAddressLower)
                .eq('contract_type', contractType);

            // Insertar nuevos mappings
            const mappings = tokens.map(token => ({
                wallet_address: walletAddressLower,
                token_id: token.tokenId || token.id,
                contract_type: contractType,
                quantity: token.quantity || 1,
                last_synced: new Date().toISOString()
            }));

            if (mappings.length > 0) {
                const { error } = await this.supabase
                    .from('wallet_token_mapping')
                    .insert(mappings);

                if (error) {
                    console.error('❌ Error al sincronizar wallet tokens:', error);
                    return false;
                }
            }

            console.log(`✅ ${mappings.length} tokens sincronizados para ${contractType}`);
            return true;
        } catch (error) {
            console.error('❌ Error en syncWalletTokens:', error);
            return false;
        }
    }

    /**
     * Verificar si los datos están actualizados (menos de 24 horas)
     */
    isDataRecent(lastUpdated) {
        if (!lastUpdated) {
            return false;
        }

        const lastUpdate = new Date(lastUpdated);
        const now = new Date();
        const hoursDiff = (now - lastUpdate) / (1000 * 60 * 60);

        return hoursDiff < 24; // Considerar reciente si tiene menos de 24 horas
    }

    /**
     * Actualizar datos en background (no bloquea)
     */
    async updateInBackground(walletAddress, data) {
        // Ejecutar en background sin bloquear
        setTimeout(async () => {
            try {
                await this.updateWalletData(walletAddress, data);
            } catch (error) {
                console.error('❌ Error en actualización background:', error);
            }
        }, 0);
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.SupabaseCache = SupabaseCache;
}

