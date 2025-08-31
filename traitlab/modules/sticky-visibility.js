/**
 * StickyVisibilityManager - Módulo para manejar visibilidad inteligente en modo sticky
 * 
 * REGLAS DE PRIORIDAD:
 * 1. ADRIANZERO_TRAITS tiene PRIORIDAD ALTA sobre otros estados
 * 2. En caso de conflicto, siempre prevalece ADRIANZERO_TRAITS
 * 3. RENAME puede combinarse con otros estados para MIXED_RENAME
 * 
 * Estados disponibles:
 * - DEFAULT: Solo botón minimize
 * - ADRIANZERO_ONLY: AdrianZero sin traits/serum
 * - ADRIANZERO_TRAITS: AdrianZero + traits (PRIORIDAD ALTA)
 * - ADRIANZERO_SERUM: AdrianZero + serum
 * - FLOPPY_PACK: Floppy o pack seleccionado
 * - RENAME: Modo rename activo
 * - MIXED_RENAME: AdrianZero + traits/serum + rename
 */

class StickyVisibilityManager {
    constructor() {
        console.log('🔧 DEBUG: StickyVisibilityManager constructor llamado');
        this.currentState = 'default';
        this.elements = new Map();
        this.states = {
            'default': {
                show: ['minimize-btn'],
                hide: ['selection-text', 'generated-image', 'erc721-actions', 'traits-actions', 'use-serum-section', 'open-floppy-section', 'open-pack-section', 'rename-section']
            },
            'adrianzero-only': {
                show: ['selection-text', 'generated-image', 'minimize-btn', 'erc721-actions'],
                hide: ['traits-actions', 'use-serum-section', 'open-floppy-section', 'open-pack-section', 'rename-section']
            },
            'adrianzero-traits': {
                show: ['selection-text', 'generated-image', 'minimize-btn', 'traits-actions'],
                hide: ['erc721-actions', 'use-serum-section', 'open-floppy-section', 'open-pack-section', 'rename-section']
            },
            'adrianzero-serum': {
                show: ['selection-text', 'minimize-btn', 'use-serum-section'],
                hide: ['generated-image', 'erc721-actions', 'traits-actions', 'open-floppy-section', 'open-pack-section', 'rename-section']
            },
            'floppy-pack': {
                show: ['selection-text', 'minimize-btn', 'open-floppy-section'],
                hide: ['generated-image', 'erc721-actions', 'traits-actions', 'use-serum-section', 'open-pack-section', 'rename-section']
            },
            'rename': {
                show: ['selection-text', 'minimize-btn', 'rename-section'],
                hide: ['generated-image', 'erc721-actions', 'traits-actions', 'use-serum-section', 'open-floppy-section', 'open-pack-section']
            }
        };
        
        console.log('🔧 DEBUG: StickyVisibilityManager constructor completado, llamando init()');
        this.init();
    }

    init() {
        try {
            // Mapear elementos del DOM
            this.mapElements();
            console.log('🔧 StickyVisibilityManager inicializado correctamente');
        } catch (error) {
            console.warn('⚠️ StickyVisibilityManager: Error durante inicialización, continuando sin sticky:', error);
            // No fallar la aplicación si hay problemas con sticky
        }
    }

    mapElements() {
        try {
            // Elementos principales del sticky
            this.elements.set('selection-info', document.getElementById('selection-info'));
            this.elements.set('minimize-btn', document.getElementById('minimizeBtn'));
            this.elements.set('selection-text', document.getElementById('selection-text'));
            this.elements.set('generated-image', document.getElementById('generated-image'));
            this.elements.set('combined-image', document.getElementById('combined-image'));
            this.elements.set('image-loading-overlay', document.getElementById('image-loading-overlay'));
            
            // Secciones de acciones
            this.elements.set('erc721-actions', document.getElementById('erc721-actions-section'));
            this.elements.set('traits-actions', document.getElementById('traits-actions-section'));
            this.elements.set('open-floppy-section', document.getElementById('open-floppy-section'));
            this.elements.set('open-pack-section', document.getElementById('open-pack-section'));
            this.elements.set('use-serum-section', document.getElementById('use-serum-section'));
            this.elements.set('rename-section', document.getElementById('rename-section'));
            
            // Botones específicos
            this.elements.set('activate-token-btn', document.getElementById('activateTokenBtn'));
            this.elements.set('show-rename-section-btn', document.getElementById('showRenameSectionBtn'));
            this.elements.set('apply-traits-btn', document.getElementById('applyTraitsBtn'));
            this.elements.set('open-floppy-btn', document.getElementById('openFloppyBtn'));
            this.elements.set('open-pack-btn', document.getElementById('openPackBtn'));
            this.elements.set('use-serum-btn', document.getElementById('useSerumBtn'));
            this.elements.set('approve-rename-btn', document.getElementById('approveRenameBtn'));
            this.elements.set('rename-token-btn', document.getElementById('renameTokenBtn'));
            
            // Status elements
            this.elements.set('open-floppy-status', document.getElementById('open-floppy-status'));
            this.elements.set('open-pack-status', document.getElementById('open-pack-status'));
            this.elements.set('use-serum-status', document.getElementById('use-serum-status'));
            this.elements.set('rename-status', document.getElementById('rename-status'));
            
            console.log('✅ Elementos mapeados correctamente');
        } catch (error) {
            console.warn('⚠️ StickyVisibilityManager: Error mapeando elementos:', error);
        }
    }

    /**
     * Detectar el estado actual basado en las selecciones del usuario
     * PRIORIDAD: ADRIANZERO_TRAITS > otros estados
     */
    detectCurrentState(appState) {
        const { selectedERC721, selectedERC1155, selectedFloppy, selectedSerum, currentTab } = appState;
        
        console.log('🔍 Detectando estado sticky:', {
            selectedERC721: selectedERC721?.tokenId,
            selectedERC1155: selectedERC1155?.length,
            selectedFloppy: selectedFloppy?.tokenId,
            selectedSerum: selectedSerum?.tokenId,
            currentTab
        });

        // REGLA 1: ADRIANZERO_TRAITS tiene PRIORIDAD ALTA
        if (selectedERC721 && selectedERC1155 && selectedERC1155.length > 0) {
            console.log('🔍 DEBUG detectCurrentState: Regla 1 aplicada - ADRIANZERO_TRAITS');
            // Si estamos en tab rename, es MIXED_RENAME
            if (currentTab === 'rename') {
                console.log('🔍 DEBUG detectCurrentState: Sub-regla 1a aplicada - MIXED_RENAME');
                return 'mixed-rename';
            }
            return 'adrianzero-traits';
        }

        // REGLA 2: ADRIANZERO_SERUM
        if (selectedERC721 && selectedSerum) {
            console.log('🔍 DEBUG detectCurrentState: Regla 2 aplicada - ADRIANZERO_SERUM');
            if (currentTab === 'rename') {
                console.log('🔍 DEBUG detectCurrentState: Sub-regla 2a aplicada - MIXED_RENAME');
                return 'mixed-rename';
            }
            return 'adrianzero-serum';
        }

        // REGLA 3: FLOPPY_PACK
        if (selectedFloppy) {
            console.log('🔍 DEBUG detectCurrentState: Regla 3 aplicada - FLOPPY_PACK');
            return 'floppy-pack';
        }

        // REGLA 4: RENAME (solo si no hay otros elementos seleccionados)
        if (currentTab === 'rename' && selectedERC721 && !selectedERC1155?.length && !selectedSerum) {
            console.log('🔍 DEBUG detectCurrentState: Regla 4 aplicada - RENAME');
            return 'rename';
        }

        // REGLA 5: ADRIANZERO_ONLY
        if (selectedERC721 && !selectedERC1155?.length && !selectedSerum) {
            console.log('🔍 DEBUG detectCurrentState: Regla 5 aplicada - ADRIANZERO_ONLY');
            return 'adrianzero-only';
        }

        // REGLA 6: DEFAULT
        console.log('🔍 DEBUG detectCurrentState: Regla 6 aplicada - DEFAULT');
        return 'default';
    }

    /**
     * Aplicar visibilidad según el estado detectado
     */
    applyState(state) {
        if (!this.states[state]) {
            console.warn('⚠️ Estado sticky no reconocido:', state);
            return;
        }

        console.log('🎯 Aplicando estado sticky:', state);
        
        // Limpiar clases de estado anteriores
        const selectionInfo = document.getElementById('selection-info');
        console.log('🔍 DEBUG applyState: selection-info encontrado?', !!selectionInfo);
        
        if (selectionInfo) {
            console.log('🔍 DEBUG applyState: Clases antes de limpiar:', selectionInfo.className);
            selectionInfo.classList.remove('adrianzero-only', 'adrianzero-traits', 'adrianzero-serum', 'floppy-pack', 'rename', 'mixed-rename');
            console.log('🔍 DEBUG applyState: Clases después de limpiar:', selectionInfo.className);
            selectionInfo.classList.add(state);
            console.log('🔍 DEBUG applyState: Clases después de agregar', state, ':', selectionInfo.className);
            
            // Verificar si la clase se agregó correctamente
            console.log('🔍 DEBUG applyState: selection-info tiene clase', state, '?', selectionInfo.classList.contains(state));
        } else {
            console.log('❌ DEBUG applyState: selection-info NO encontrado!');
        }
        
        // En lugar de usar showElement/hideElement, usar clases CSS
        // El CSS se encargará de mostrar/ocultar según el estado
        console.log('🎨 Estado aplicado via CSS:', state);

        this.currentState = state;
    }

    /**
     * Mostrar elemento específico
     */
    showElement(selector) {
        const element = this.elements.get(selector);
        if (element) {
            try {
                if (Array.isArray(element)) {
                    element.forEach(el => {
                        if (el && el.style) el.style.display = 'block';
                    });
                } else if (element && element.style) {
                    element.style.display = 'block';
                }
                console.log('✅ Mostrando elemento:', selector);
            } catch (error) {
                console.warn('⚠️ Error mostrando elemento:', selector, error);
            }
        } else {
            console.log('ℹ️ Elemento no encontrado para mostrar:', selector);
        }
    }

    /**
     * Ocultar elemento específico
     */
    hideElement(selector) {
        const element = this.elements.get(selector);
        if (element) {
            try {
                if (Array.isArray(element)) {
                    element.forEach(el => {
                        if (el && el.style) el.style.display = 'none';
                    });
                } else if (element && element.style) {
                    element.style.display = 'none';
                }
                console.log('❌ Ocultando elemento:', selector);
            } catch (error) {
                console.warn('⚠️ Error ocultando elemento:', selector, error);
            }
        } else {
            console.log('ℹ️ Elemento no encontrado para ocultar:', selector);
        }
    }

    /**
     * Método público para actualizar visibilidad
     * Se llama desde la clase principal cuando cambian las selecciones
     */
    update(appState) {
        console.log('🔍 DEBUG StickyManager: update() llamado con:', appState);
        
        // Re-mapear elementos si es necesario (por si el DOM cambió)
        this.remapElementsIfNeeded();
        
        const newState = this.detectCurrentState(appState);
        console.log('🔍 DEBUG StickyManager: Estado detectado:', newState);
        console.log('🔍 DEBUG StickyManager: Estado actual:', this.currentState);
        
        // Siempre aplicar el estado detectado, incluso si es el mismo
        // Esto asegura que las clases CSS se apliquen desde el primer momento
        if (newState !== this.currentState) {
            console.log('🔄 Cambio de estado sticky:', this.currentState, '→', newState);
            this.applyState(newState);
        } else {
            console.log('🔍 DEBUG StickyManager: Mismo estado, pero aplicando para asegurar clases CSS');
            this.applyState(newState);
        }
    }

    /**
     * Forzar un estado específico (útil para testing)
     */
    forceState(state) {
        console.log('🔧 Forzando estado sticky:', state);
        this.applyState(state);
    }

    /**
     * Obtener estado actual
     */
    getCurrentState() {
        return this.currentState;
    }

    /**
     * Re-mapear elementos si es necesario (por si el DOM cambió)
     */
    remapElementsIfNeeded() {
        // Verificar si los elementos principales existen
        const minimizeBtn = document.getElementById('minimizeBtn');
        if (!minimizeBtn) {
            console.log('🔄 Re-mapeando elementos del DOM...');
            this.mapElements();
        }
    }

    /**
     * Debug: mostrar estado actual y elementos mapeados
     */
    debug() {
        console.log('🔍 Debug StickyVisibilityManager:');
        console.log('Estado actual:', this.currentState);
        console.log('Elementos mapeados:', this.elements);
        console.log('Estados disponibles:', Object.keys(this.states));
    }

    /**
     * Deshabilitar sticky-visibility
     */
    disable() {
        console.log('🔧 StickyVisibilityManager: Deshabilitando sticky-visibility');
        this.disabled = true;
        // Ocultar el selection-info completamente
        const selectionInfo = document.getElementById('selection-info');
        if (selectionInfo) {
            selectionInfo.style.display = 'none';
        }
    }

    /**
     * Rehabilitar sticky-visibility
     */
    enable() {
        console.log('🔧 StickyVisibilityManager: Rehabilitando sticky-visibility');
        this.disabled = false;
        // Mostrar el selection-info si hay selecciones activas
        const selectionInfo = document.getElementById('selection-info');
        if (selectionInfo && this.currentState !== 'default') {
            selectionInfo.style.display = 'block';
        }
    }

    /**
     * Toggle sticky mode
     */
    toggleSticky() {
        const selectionInfo = this.elements.get('selection-info');
        if (selectionInfo) {
            if (selectionInfo.classList.contains('sticky')) {
                selectionInfo.classList.remove('sticky');
                console.log('🔧 Sticky mode desactivado');
            } else {
                selectionInfo.classList.add('sticky');
                console.log('🔧 Sticky mode activado');
            }
        }
    }

    /**
     * Minimize selection info
     */
    minimize() {
        const selectionInfo = this.elements.get('selection-info');
        if (selectionInfo) {
            selectionInfo.classList.add('minimized');
            console.log('🔧 Selection info minimizado');
        }
    }

    /**
     * Expand selection info
     */
    expand() {
        const selectionInfo = this.elements.get('selection-info');
        if (selectionInfo) {
            selectionInfo.classList.remove('minimized');
            console.log('🔧 Selection info expandido');
        }
    }
}

// Exportar para uso externo
window.StickyVisibilityManager = StickyVisibilityManager;
