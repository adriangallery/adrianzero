# Plan de Revisión: Popup Modal, Funciones Traits y Problema de Memoria

## Problemas Identificados

### 1. Botón "Apply Traits" no aparece
El botón `applyTraitsBtn` no se muestra cuando se seleccionan traits, aunque el código existe en el template y en `sticky-popup-manager.js`.

### 2. Imagen generada con traits no aparece
La imagen combinada no se genera o no se muestra cuando el usuario selecciona traits, aunque existe el método `generateCombinedImage()`.

### 3. Refresh automático de página con 1000+ traits
Cuando una wallet tiene 1000+ traits y el usuario hace scroll por un tiempo, la página se refresca automáticamente debido a problemas de memoria.

## Análisis del Problema de Memoria

### Causas Identificadas

1. **Lazy loading solo en móvil**: El lazy loading solo funciona en móvil (`isMobile() && filter === 'traits' && tokens.length > 50`). En desktop, se renderizan TODOS los tokens de una vez (líneas 607-610 de `ui.js`).

2. **Sin virtualización real**: Todos los elementos DOM permanecen en el DOM, incluso los que no son visibles. Con 1000 traits, esto significa 1000+ elementos DOM con imágenes.

3. **Memory leak de imágenes**: Las imágenes se cargan y permanecen en memoria sin limpieza. No hay cleanup de imágenes fuera del viewport.

4. **Sin límite de elementos DOM**: No hay límite en cuántos elementos se pueden renderizar simultáneamente.

5. **Navegador fuerza refresh**: Cuando el navegador se queda sin memoria, fuerza un refresh automático para liberar recursos.

## Soluciones Propuestas

### Fase 1: Corrección de Popup Modal y Apply Traits

#### Archivo: `traitlabv3/modules/sticky-popup-manager.js`

**Problema**: No escucha eventos de selección de traits desde `traits.js`.

**Solución**: Agregar listeners para `traitSelected` y `traitsSelectionUpdated` en el método de inicialización.

**Líneas a modificar**: Después de la línea 192 (después de configurar event listeners de botones)

**Código a agregar**:
```javascript
// Escuchar eventos de traits
if (window.app?.modules?.traits) {
    window.app.modules.traits.on('traitSelected', (data) => {
        console.log('🎯 StickyPopupManager: Trait seleccionado, actualizando UI');
        // Actualizar selectedERC1155 desde traits module
        if (window.app?.modules?.tokenSelection) {
            this.selectedERC1155 = window.app.modules.tokenSelection.selectedERC1155 || 
                                   window.app.modules.traits.getSelectedTraits();
        }
        this.updateUI();
    });
    
    window.app.modules.traits.on('traitsSelectionUpdated', (data) => {
        console.log('🎯 StickyPopupManager: Selección de traits actualizada');
        // Actualizar selectedERC1155 desde traits module
        if (window.app?.modules?.tokenSelection) {
            this.selectedERC1155 = window.app.modules.tokenSelection.selectedERC1155 || 
                                   window.app.modules.traits.getSelectedTraits();
        }
        this.updateUI();
    });
}
```

**Problema 2**: En `updateUI()` (líneas 492-499), la condición para mostrar traits puede no funcionar correctamente.

**Solución**: Mejorar la lógica de verificación.

**Líneas a modificar**: 492-499

**Código mejorado**:
```javascript
if (this.currentFilter === 'traits') {
    // Si hay AdrianZERO y traits seleccionados, mostrar Apply Traits y generar imagen
    if (this.selectedERC721 && this.selectedERC1155.length > 0) {
        this.showTraitsActionsOnly();
        this.generateCombinedImage();
    } else if (this.selectedERC721) {
        // Solo AdrianZERO, mostrar imagen base
        this.showBaseAdrianZeroImage();
    }
}
```

#### Archivo: `traitlabv3/modules/token-selection-manager.js`

**Problema**: En `updateSelectionInfo()` (líneas 244-250), muestra `traits-actions-section` directamente sin pasar por `sticky-popup-manager`.

**Solución**: Eliminar la manipulación directa del DOM y delegar completamente a `sticky-popup-manager`.

**Líneas a eliminar**: 244-250

**Problema 2**: `this.stickyPopupManager` puede ser `null`.

**Solución**: Usar `window.app.modules.stickyPopupManager` como fallback.

**Líneas a modificar**: 291-304

### Fase 2: Solución de Problema de Memoria

#### Archivo: `traitlabv3/modules/ui.js`

**Problema 1**: Lazy loading solo funciona en móvil.

**Solución**: Habilitar lazy loading también en desktop cuando hay muchos tokens (>100).

**Líneas a modificar**: 587-599

**Código actual**:
```javascript
const shouldUseLazyLoading = this.isMobile() && 
                             filter === 'traits' && 
                             tokens.length > 50;
```

**Código mejorado**:
```javascript
// Habilitar lazy loading en desktop también si hay muchos tokens
const shouldUseLazyLoading = filter === 'traits' && tokens.length > 100;
```

**Problema 2**: No hay limpieza de imágenes fuera del viewport.

**Solución**: Implementar cleanup de imágenes usando IntersectionObserver.

**Líneas a agregar**: Después de `renderTokenBatch()` (línea 194)

**Código a agregar**:
```javascript
/**
 * Cleanup imágenes fuera del viewport para liberar memoria
 */
setupImageCleanup() {
    if (!this.imageCleanupObserver) {
        this.imageCleanupObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const img = entry.target;
                if (!entry.isIntersecting) {
                    // Imagen fuera del viewport: limpiar src para liberar memoria
                    if (img.dataset.originalSrc) {
                        img.src = ''; // Liberar memoria
                        img.dataset.isUnloaded = 'true';
                    }
                } else {
                    // Imagen visible: restaurar src si fue descargada
                    if (img.dataset.isUnloaded === 'true' && img.dataset.originalSrc) {
                        img.src = img.dataset.originalSrc;
                        img.dataset.isUnloaded = 'false';
                    }
                }
            });
        }, {
            rootMargin: '200px' // Mantener 200px de margen
        });
    }
}

/**
 * Observar imagen para cleanup automático
 */
observeImageForCleanup(imgElement) {
    if (!this.imageCleanupObserver) {
        this.setupImageCleanup();
    }
    
    // Guardar src original
    if (imgElement.src && !imgElement.dataset.originalSrc) {
        imgElement.dataset.originalSrc = imgElement.src;
    }
    
    // Observar imagen
    this.imageCleanupObserver.observe(imgElement);
}
```

**Problema 3**: No hay virtualización real - todos los elementos permanecen en el DOM.

**Solución**: Implementar cleanup de elementos DOM fuera del viewport.

**Líneas a modificar**: `renderTokenBatch()` (línea 185)

**Código mejorado**:
```javascript
renderTokenBatch(tokens, startIndex, endIndex, tokensGrid) {
    const batch = tokens.slice(startIndex, endIndex);
    
    // Limpiar elementos fuera del viewport antes de agregar nuevos
    this.cleanupOffscreenElements(tokensGrid, startIndex, endIndex);
    
    batch.forEach(token => {
        const tokenCard = this.createTokenCard(token);
        tokensGrid.appendChild(tokenCard);
        
        // Observar imágenes para cleanup
        const img = tokenCard.querySelector('img');
        if (img) {
            this.observeImageForCleanup(img);
        }
    });
    
    return batch.length;
}

/**
 * Limpiar elementos fuera del viewport (virtualización)
 */
cleanupOffscreenElements(tokensGrid, currentStart, currentEnd) {
    const allCards = Array.from(tokensGrid.querySelectorAll('.token-card'));
    
    allCards.forEach(card => {
        const cardRect = card.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        // Si está más de 500px fuera del viewport, remover
        if (cardRect.bottom < -500 || cardRect.top > viewportHeight + 500) {
            // Limpiar imagen antes de remover
            const img = card.querySelector('img');
            if (img && this.imageCleanupObserver) {
                this.imageCleanupObserver.unobserve(img);
            }
            card.remove();
        }
    });
}
```

**Problema 4**: Batch size fijo puede ser ineficiente para wallets grandes.

**Solución**: Ajustar batch size dinámicamente.

**Líneas a modificar**: Constructor (línea 24) y `setupLazyLoading()` (línea 506)

**Código a modificar en `setupLazyLoading()`**:
```javascript
setupLazyLoading(tokens) {
    // ...
    
    // Ajustar batch size según cantidad total de traits
    if (tokens.length > 500) {
        this.lazyLoadingState.batchSize = 20; // Batch más pequeño para wallets grandes
    } else if (tokens.length > 200) {
        this.lazyLoadingState.batchSize = 25; // Default
    } else {
        this.lazyLoadingState.batchSize = 50; // Batch más grande para wallets pequeñas
    }
    
    // ...
}
```

**Problema 5**: No se limpia el `imageCleanupObserver` en `cleanupLazyLoading()`.

**Solución**: Agregar cleanup del observer de imágenes.

**Líneas a modificar**: 160-180

**Código a agregar en `cleanupLazyLoading()`**:
```javascript
cleanupLazyLoading() {
    // ... código existente ...
    
    // Limpiar observer de imágenes
    if (this.imageCleanupObserver) {
        this.imageCleanupObserver.disconnect();
        this.imageCleanupObserver = null;
    }
    
    // ... resto del código ...
}
```

## Orden de Implementación

1. **Fase 1 - Configurar listeners de eventos** (Crítico)
   - Agregar listeners en `sticky-popup-manager.js` para eventos de `traits.js`
   - Asegurar que `stickyPopupManager` esté configurado en `token-selection-manager.js`

2. **Fase 2 - Corregir lógica de `updateUI()`** (Crítico)
   - Mejorar la condición para mostrar traits en `sticky-popup-manager.js`
   - Asegurar que `showTraitsActionsOnly()` y `generateCombinedImage()` se llamen correctamente

3. **Fase 3 - Eliminar manipulación directa del DOM** (Importante)
   - Eliminar código en `token-selection-manager.js` que muestra `traits-actions-section` directamente
   - Delegar completamente a `sticky-popup-manager`

4. **Fase 4 - Verificar `generateCombinedImage()`** (Importante)
   - Asegurar que la imagen se muestra correctamente
   - Verificar que la URL generada es correcta

5. **Fase 5 - Implementar lazy loading en desktop** (Crítico para memoria)
   - Habilitar lazy loading también en desktop cuando hay >100 traits
   - Ajustar batch size dinámicamente

6. **Fase 6 - Implementar cleanup de imágenes** (Crítico para memoria)
   - Agregar IntersectionObserver para limpiar imágenes fuera del viewport
   - Implementar virtualización real con cleanup de elementos DOM

7. **Fase 7 - Testing y debugging** (Verificación)
   - Probar selección de traits y verificar que el botón aparece
   - Probar generación de imagen y verificar que se muestra
   - Probar scroll con 1000+ traits y verificar que no hay refresh
   - Monitorear uso de memoria durante scroll prolongado

## Métricas de Éxito

- El botón "Apply Traits" aparece cuando se selecciona un trait y hay un AdrianZERO seleccionado
- La imagen combinada se genera y muestra correctamente cuando se seleccionan traits
- La UI se actualiza inmediatamente cuando se selecciona/deselecciona un trait
- No hay conflictos entre `token-selection-manager` y `sticky-popup-manager` en la manipulación del DOM
- **NUEVO**: No hay refresh automático de página al hacer scroll con 1000+ traits
- **NUEVO**: Uso de memoria se mantiene estable durante scroll prolongado
- **NUEVO**: Solo se renderizan elementos visibles + buffer razonable

## Notas

- El código de `traitlab` original funciona correctamente, así que debemos alinear `traitlabv3` con ese comportamiento
- La clave es que `sticky-popup-manager` debe ser la única fuente de verdad para la UI del popup
- Los eventos de `traits.js` deben propagarse correctamente a `sticky-popup-manager` para actualizaciones reactivas
- El problema de memoria es crítico para wallets grandes (1000+ traits). La virtualización y cleanup de imágenes son esenciales.
- Considerar implementar virtual scrolling library (como `react-window` o `vue-virtual-scroller`) si el problema persiste después de estas mejoras.

