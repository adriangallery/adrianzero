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
        this.currentState = 'default';
        this.elements = new Map();
        this.states = {
            'default': {
                show: ['minimize-btn'],
                hide: ['token-title', 'generated-image', 'selected-traits-list', 'traits-actions', 'serum-actions', 'floppy-actions', 'rename-form', 'rename-buttons']
            },
            'adrianzero-only': {
                show: ['token-title', 'generated-image', 'minimize-btn', 'erc721-actions'],
                hide: ['selected-traits-list', 'traits-actions', 'serum-actions', 'floppy-actions', 'rename-form', 'rename-buttons']
            },
            'adrianzero-traits': {
                show: ['token-title', 'generated-image', 'apply-traits-btn', 'minimize-btn'],
                hide: ['selected-traits-list', 'serum-actions', 'floppy-actions', 'rename-form', 'rename-buttons']
            },
            'adrianzero-serum': {
                show: ['token-title', 'serum-btn', 'minimize-btn'],
                hide: ['generated-image', 'selected-traits-list', 'traits-actions', 'floppy-actions', 'rename-form', 'rename-buttons']
            },
            'floppy-pack': {
                show: ['floppy-info', 'open-btn', 'minimize-btn'],
                hide: ['generated-image', 'selected-traits-list', 'traits-actions', 'serum-actions', 'rename-form', 'rename-buttons']
            },
            'rename': {
                show: ['token-title', 'rename-form', 'rename-buttons', 'minimize-btn'],
                hide: ['generated-image', 'selected-traits-list', 'traits-actions', 'serum-actions', 'floppy-actions']
            },
            'mixed-rename': {
                show: ['token-title', 'rename-form', 'rename-buttons', 'minimize-btn'],
                hide: ['generated-image', 'selected-traits-list', 'traits-actions', 'serum-actions', 'floppy-actions']
            }
        };
        
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
            // Elementos principales - usar getElementById de manera segura
            this.elements.set('minimize-btn', document.getElementById('minimizeBtn'));
            this.elements.set('token-title', document.querySelector('.selected-token-title'));
            this.elements.set('generated-image', document.getElementById('generated-image'));
            this.elements.set('selected-traits-list', document.querySelector('.selected-traits-title'));
            this.elements.set('traits-actions', document.getElementById('traits-actions-section'));
            this.elements.set('serum-actions', document.getElementById('use-serum-section'));
            this.elements.set('floppy-actions', document.getElementById('open-floppy-section'));
            this.elements.set('rename-form', document.getElementById('rename-section'));
            this.elements.set('rename-buttons', document.querySelectorAll('#rename-section button'));
            this.elements.set('apply-traits-btn', document.getElementById('traits-actions-section'));
            this.elements.set('serum-btn', document.getElementById('use-serum-section'));
            this.elements.set('open-btn', document.getElementById('open-floppy-section') || document.getElementById('open-pack-section'));
            this.elements.set('erc721-actions', document.getElementById('erc721-actions-section'));
            
            // Buscar elementos de floppy de manera más robusta - actualizado para "Floppy Selected"
            const floppyInfoElement = document.querySelector('h4')?.textContent?.includes('Floppy Selected') 
                ? document.querySelector('h4') 
                : null;
            this.elements.set('floppy-info', floppyInfoElement);
            
            console.log('✅ Elementos mapeados correctamente');
        } catch (error) {
            console.warn('⚠️ StickyVisibilityManager: Error mapeando elementos:', error);
            // Continuar con elementos básicos
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
            // Si estamos en tab rename, es MIXED_RENAME
            if (currentTab === 'rename') {
                return 'mixed-rename';
            }
            return 'adrianzero-traits';
        }

        // REGLA 2: ADRIANZERO_SERUM
        if (selectedERC721 && selectedSerum) {
            if (currentTab === 'rename') {
                return 'mixed-rename';
            }
            return 'adrianzero-serum';
        }

        // REGLA 3: FLOPPY_PACK
        if (selectedFloppy) {
            return 'floppy-pack';
        }

        // REGLA 4: RENAME (solo si no hay otros elementos seleccionados)
        if (currentTab === 'rename' && selectedERC721 && !selectedERC1155?.length && !selectedSerum) {
            return 'rename';
        }

        // REGLA 5: ADRIANZERO_ONLY
        if (selectedERC721 && !selectedERC1155?.length && !selectedSerum) {
            return 'adrianzero-only';
        }

        // REGLA 6: DEFAULT
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
        if (selectionInfo) {
            selectionInfo.classList.remove('adrianzero-only', 'adrianzero-traits', 'adrianzero-serum', 'floppy-pack', 'rename', 'mixed-rename');
            selectionInfo.classList.add(state);
        }
        
        const rules = this.states[state];
        
        // Mostrar elementos
        rules.show.forEach(selector => {
            this.showElement(selector);
        });
        
        // Ocultar elementos
        rules.hide.forEach(selector => {
            this.hideElement(selector);
        });

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
        // Re-mapear elementos si es necesario (por si el DOM cambió)
        this.remapElementsIfNeeded();
        
        const newState = this.detectCurrentState(appState);
        
        if (newState !== this.currentState) {
            console.log('🔄 Cambio de estado sticky:', this.currentState, '→', newState);
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
}

// Exportar para uso externo
window.StickyVisibilityManager = StickyVisibilityManager;
