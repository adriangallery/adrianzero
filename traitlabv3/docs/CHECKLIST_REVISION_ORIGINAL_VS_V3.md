# Checklist Exhaustivo: Revisión TraitLAB Original vs v3

## Estructura del Checklist

Este documento organiza la comparación por módulos, funcionalidades, bugs conocidos y optimizaciones. Cada item incluye:
- **Ubicación**: Archivo y líneas específicas
- **Estado**: ✅ Funciona / ⚠️ Parcial / ❌ No funciona / 🔍 No verificado
- **Ejemplo de código**: Referencias al código actual
- **Prioridad**: 🔴 Crítico / 🟡 Importante / 🟢 Mejora

---

## 1. MÓDULO: UI Manager (`modules/ui.js`)

### 1.1 Límite de Traits

**Original** (`traitlab/modules/ui.js` líneas 532-539):
```javascript
const maxTraits = 150;
if (this.currentFilter === 'traits' && tokens.length > maxTraits) {
    traitsToDisplay = tokens.slice(0, maxTraits);
}
```

**v3** (`traitlabv3/modules/ui.js`):
- 🔍 **Estado**: Verificar si existe límite similar
- 🟡 **Prioridad**: Verificar - Problema reportado con 300+ traits en móviles
- **Nota**: NO implementar límite fijo, optimizar carga para manejar 300+ traits
- **Problema**: Fallos en algunos móviles con wallets grandes (300+ traits), desktop funciona bien
- **Objetivo**: Eliminar cualquier límite hardcoded y optimizar para manejar cualquier cantidad

### 1.2 Lazy Loading

**Original**: Solo en móvil con condición `isMobile() && filter === 'traits' && tokens.length > 50`

**v3** (`traitlabv3/modules/ui.js` líneas 613-632):
```javascript
if (tokens.length > 500) {
    this.lazyLoadingState.batchSize = 15;
} else if (tokens.length > 200) {
    this.lazyLoadingState.batchSize = 20;
} else {
    this.lazyLoadingState.batchSize = 25;
}
```

- ✅ **Estado**: Mejorado en v3 con batch size dinámico
- 🔴 **Prioridad**: Crítico - Verificar que funciona correctamente en móviles con 300+ traits
- **Problema específico**: Fallos reportados en algunos móviles con 300+ traits
- **Áreas a revisar**:
  - ¿Lazy loading se activa correctamente en móviles?
  - ¿Batch size es apropiado para móviles con muchos traits?
  - ¿Hay diferencias de comportamiento entre desktop y móvil?

### 1.3 Display Tokens - Parámetros

**Original**: Firma inconsistente entre llamadas

**v3** (`traitlabv3/modules/ui.js` línea ~514):
```javascript
displayTokens(tokens, skipSelectionUpdate = false, hasLoadingWheels = false)
```

- ⚠️ **Estado**: Firma estandarizada pero verificar todas las llamadas
- 🟡 **Prioridad**: Verificar compatibilidad con llamadas existentes

### 1.4 Load More Traits Handler

**Original** (`traitlab/modules/ui.js` línea 370):
```javascript
const newTraits = await dataManager.loadMoreTraits();
```

**v3**: 
- 🔍 **Estado**: Verificar si existe handler similar
- 🟡 **Prioridad**: Opcional - Mejora UX pero no crítico si lazy loading funciona bien

---

## 2. MÓDULO: Data Manager (`modules/data-manager.js`)

### 2.1 Load More Traits

**Original** (`traitlab/modules/data-manager.js` líneas 840-922):
```javascript
async loadMoreTraits() {
    if (!this.paginationState.traits.isBatchMode) {
        return [];
    }
    // ... implementación completa
}
```

**v3** (`traitlabv3/modules/data-manager.js` líneas 1214-1260):
- ✅ **Estado**: Método existe
- 🔍 **Prioridad**: Verificar que funciona correctamente y emite eventos

### 2.2 Pagination State

**Original** (`traitlab/modules/data-manager.js` líneas 22-29):
```javascript
this.paginationState = {
    traits: {
        pageKey: null,
        hasMore: false,
        batchSize: 50,
        isBatchMode: false
    }
};
```

**v3** (`traitlabv3/modules/data-manager.js` líneas 28-36):
- ✅ **Estado**: Estructura similar
- 🔍 **Prioridad**: Verificar que batchSize es configurable y apropiado para móviles

### 2.3 Eventos Emitidos

**Original** (`traitlab/modules/data-manager.js` línea ~907):
```javascript
this.emit('adrianLabMoreTraitsLoaded', {
    newTraits,
    hasMore: this.paginationState.traits.hasMore,
    nextPageKey: this.paginationState.traits.pageKey
});
```

**v3** (`traitlabv3/modules/data-manager.js` línea ~1257):
- 🔍 **Estado**: Verificar que emite el mismo evento
- 🔴 **Prioridad**: Crítico - Necesario para UI updates

### 2.4 Display Tokens Immediately

**Original**: Método puede existir o no

**v3** (`traitlabv3/modules/data-manager.js`):
- ⚠️ **Estado**: Marcado como deprecated según docs
- 🟡 **Prioridad**: Verificar si se usa y eliminar si no

---

## 3. MÓDULO: Sticky Popup Manager (`modules/sticky-popup-manager.js`)

### 3.1 Listeners de Traits Events

**Original**: Verificar cómo escucha eventos de traits

**v3** (`traitlabv3/modules/sticky-popup-manager.js` líneas 201-248):
```javascript
window.app.modules.traits.on('traitSelected', (data) => {
    // ... handler
});
window.app.modules.traits.on('traitsSelectionUpdated', (data) => {
    // ... handler
});
```

- ✅ **Estado**: Listeners configurados (recientemente mejorado)
- 🔍 **Prioridad**: Verificar que se configuran en el momento correcto

### 3.2 Show Traits Actions Only

**Original** (`traitlab/modules/sticky-popup-manager.js` líneas 491-499):
```javascript
if (this.currentFilter === 'traits') {
    if (this.selectedERC1155.length > 0) {
        this.showTraitsActionsOnly();
        this.generateCombinedImage();
    }
}
```

**v3** (`traitlabv3/modules/sticky-popup-manager.js` líneas 589-609):
```javascript
if (this.currentFilter === 'traits') {
    if (this.selectedERC721 && this.selectedERC1155.length > 0) {
        this.showTraitsActionsOnly();
        this.generateCombinedImage();
    }
}
```

- ✅ **Estado**: Lógica mejorada (verifica también selectedERC721)
- 🔍 **Prioridad**: Verificar que funciona en todos los casos

### 3.3 Generate Combined Image

**Original**: Verificar implementación

**v3** (`traitlabv3/modules/sticky-popup-manager.js`):
- 🔍 **Estado**: Método existe pero verificar que funciona
- 🔴 **Prioridad**: Crítico - Usuario reportó que no aparece imagen

### 3.4 Update Selection State

**Original** (`traitlab/modules/sticky-popup-manager.js` líneas 440-464):
```javascript
updateSelectionState(selectionData) {
    this.selectedERC721 = selectionData.selectedERC721 || null;
    this.selectedERC1155 = selectionData.selectedERC1155 || [];
    // ...
    this.updateUI();
}
```

**v3** (`traitlabv3/modules/sticky-popup-manager.js` líneas 520-562):
```javascript
updateSelectionState(selectionData) {
    // ... código similar pero con obtención desde traits module
    if (window.app?.modules?.traits && window.app.modules.traits.getSelectedTraits) {
        const traitsFromModule = window.app.modules.traits.getSelectedTraits();
        // ...
    }
}
```

- ✅ **Estado**: Mejorado para obtener desde traits module
- 🔍 **Prioridad**: Verificar que siempre obtiene el estado correcto

---

## 4. MÓDULO: Traits Manager (`modules/traits.js`)

### 4.1 Emisión de Eventos

**Original** (`traitlab/modules/traits.js` líneas 99, 120, 135, 149):
```javascript
this.emit('traitSelected', { token, category: null });
this.emit('traitsSelectionUpdated', { 
    selectedTraits: this.selectedERC1155,
    selectedTraitsByCategory: Array.from(this.selectedTraitsByCategory.entries())
});
```

**v3** (`traitlabv3/modules/traits.js` líneas 99, 120, 149):
- ✅ **Estado**: Eventos similares, recientemente mejorado con `hasSelection`
- 🔍 **Prioridad**: Verificar que todos los listeners están configurados

### 4.2 Get Selected Traits

**Original**: Verificar método

**v3** (`traitlabv3/modules/traits.js`):
- 🔍 **Estado**: Verificar que método existe y retorna correctamente
- 🔴 **Prioridad**: Crítico - Usado por sticky-popup-manager

---

## 5. MÓDULO: Token Selection Manager (`modules/token-selection-manager.js`)

### 5.1 Update Selection Info

**Original** (`traitlab/modules/token-selection-manager.js` líneas 290-307):
```javascript
updateSelectionInfo() {
    // ...
    this.stickyPopupManager.updateSelectionState(selectionData);
}
```

**v3** (`traitlabv3/modules/token-selection-manager.js` líneas 290-321):
- ✅ **Estado**: Similar pero con obtención de traits desde module
- 🔍 **Prioridad**: Verificar que no hay manipulación directa del DOM

### 5.2 Manipulación Directa del DOM

**Original**: Verificar si hay manipulación directa

**v3** (`traitlabv3/docs/PLAN_REVISION_POPUP_Y_MEMORIA.md` líneas 86-98):
- ⚠️ **Estado**: Documentado como problema potencial
- 🔴 **Prioridad**: Verificar y eliminar si existe

---

## 6. MÓDULO: Zero Manager (`modules/zero.js`)

### 6.1 Load Tokens con Paginación

**Original** (`traitlab/modules/zero.js` líneas 280-371):
```javascript
async loadTokens(userAddress, contractAddress, filter = null, skipIndividualMetadata = false, limit = null, startPageKey = null) {
    const MAX_TOKENS = limit || 10000;
    // ... implementación con paginación
}
```

**v3** (`traitlabv3/modules/zero.js` líneas 280-371):
- ✅ **Estado**: Implementación similar
- 🔍 **Prioridad**: Verificar que retorna formato correcto para batch mode

### 6.2 Referencia a Token Selection Manager

**Original**: Verificar nombre

**v3** (`traitlabv3/docs/implementacion/PROBLEMAS_DETECTADOS.md` líneas 202-224):
- ⚠️ **Estado**: Documentado como problema (nombre incorrecto)
- 🟡 **Prioridad**: Verificar si está corregido

---

## 7. PROBLEMAS DE MEMORIA Y OPTIMIZACIÓN

### 7.1 Lazy Loading Solo en Móvil

**Original**: Solo en móvil

**v3** (`traitlabv3/docs/PLAN_REVISION_POPUP_Y_MEMORIA.md` líneas 18-19):
- ⚠️ **Estado**: Documentado como problema
- 🔴 **Prioridad**: Crítico - Verificar comportamiento en móviles con 300+ traits
- **Problema específico**: Fallos en algunos móviles con wallets grandes (300+ traits)
- **Desktop**: Funciona bien, no hay problemas reportados
- **Móvil**: Fallos reportados con 300+ traits

### 7.2 Virtualización Real

**Original**: Verificar si existe

**v3** (`traitlabv3/docs/PLAN_REVISION_POPUP_Y_MEMORIA.md` líneas 20-26):
- ❌ **Estado**: No implementado
- 🔴 **Prioridad**: Crítico - Necesario para wallets grandes en móviles
- **Problema**: Todos los elementos DOM permanecen en el DOM, incluso fuera del viewport
- **Impacto**: Con 300+ traits en móvil, esto causa problemas de memoria

### 7.3 Cleanup de Imágenes

**Original**: Verificar si existe

**v3** (`traitlabv3/docs/PLAN_REVISION_POPUP_Y_MEMORIA.md` líneas 123-175):
- ❌ **Estado**: Propuesto pero no implementado
- 🔴 **Prioridad**: Crítico - Memory leak con muchas imágenes en móviles
- **Problema**: Las imágenes se cargan y permanecen en memoria sin limpieza
- **Impacto**: Especialmente crítico en móviles con 300+ traits

### 7.4 Diferencias Desktop vs Móvil

**Problema Reportado**: Desktop funciona bien con cualquier cantidad de traits, pero algunos móviles fallan con 300+ traits.

**Áreas a investigar**:
- ¿Lazy loading se comporta diferente en móvil vs desktop?
- ¿Hay límites de memoria diferentes?
- ¿Batch size es apropiado para móviles?
- ¿IntersectionObserver funciona igual en móviles?
- ¿Hay cleanup de elementos DOM en móviles?

---

## 8. FUNCIONALIDADES FALTANTES / OPTIMIZACIONES NECESARIAS

### 8.1 Optimización para 300+ Traits en Móviles

**Problema Reportado**: Fallos en algunos móviles con wallets que tienen 300+ traits. Desktop funciona bien.

**Original**: 150 traits máximo (límite hardcoded que limita funcionalidad)

**v3**:
- 🔍 **Estado**: Verificar si hay límites hardcoded y eliminarlos
- 🔴 **Prioridad**: Crítico - Optimizar para 300+ traits sin límites
- **Objetivo**: NO implementar límites, optimizar carga para manejar cualquier cantidad
- **Áreas a revisar**:
  - Lazy loading: ¿Funciona correctamente en móviles con 300+ traits?
  - Memory management: ¿Limpia imágenes fuera del viewport?
  - Virtualización: ¿Remueve elementos DOM fuera del viewport?
  - Batch size: ¿Es apropiado para móviles con muchos traits?
  - IntersectionObserver: ¿Configurado correctamente para móviles?
  - Cleanup de observers: ¿Se limpian correctamente?
  - Diferencias móvil vs desktop: ¿Por qué desktop funciona y móvil no?

### 8.2 Botón "Load More" Manual (Opcional)

**Original**: Verificar si existe

**v3**:
- ❌ **Estado**: No implementado
- 🟡 **Prioridad**: Opcional - Mejora UX pero no crítico si lazy loading funciona bien
- **Nota**: Solo implementar si lazy loading no es suficiente

### 8.3 Paginación Manual de Traits (Opcional)

**Original**: Verificar implementación

**v3**:
- ❌ **Estado**: No implementado
- 🟡 **Prioridad**: Opcional - Mejora UX pero no crítico si lazy loading funciona bien
- **Nota**: Solo implementar si lazy loading no es suficiente

---

## 9. OPTIMIZACIONES NECESARIAS

### 9.1 Batch Size Dinámico

**Original**: Fijo en 50

**v3** (`traitlabv3/modules/ui.js` líneas 625-632):
- ✅ **Estado**: Implementado dinámicamente
- 🔍 **Prioridad**: Verificar que es apropiado para móviles con 300+ traits
- **Pregunta**: ¿El batch size dinámico funciona bien en móviles?

### 9.2 Cleanup de Observers

**Original**: Verificar

**v3** (`traitlabv3/docs/PLAN_REVISION_POPUP_Y_MEMORIA.md` líneas 252-270):
- ⚠️ **Estado**: Documentado pero verificar implementación
- 🔴 **Prioridad**: Crítico para móviles - Evitar memory leaks

### 9.3 Logs de Debug

**Original**: Verificar cantidad

**v3** (`traitlabv3/modules/zero.js` líneas 767-862):
```javascript
console.log('🔍 DEBUG ZeroManager.activateToken: Llamado');
// ... muchos logs de debug
```

- ⚠️ **Estado**: Demasiados logs de debug
- 🟢 **Prioridad**: Limpiar para producción

### 9.4 Optimización Específica para Móviles

**Problema**: Desktop funciona bien, móviles fallan con 300+ traits.

**Optimizaciones a considerar**:
- Batch size más pequeño en móviles
- Cleanup más agresivo en móviles
- Virtualización más estricta en móviles
- Lazy loading más agresivo en móviles
- Limitar elementos DOM visibles simultáneamente en móviles

---

## 10. BUGS CONOCIDOS

### 10.1 Botón Apply Traits No Aparece

**Documentado en**: `traitlabv3/docs/PLAN_REVISION_POPUP_Y_MEMORIA.md` líneas 5-6

**Estado**: ⚠️ Parcialmente corregido (listeners mejorados recientemente)
**Prioridad**: 🔴 Crítico

### 10.2 Imagen Combinada No Aparece

**Documentado en**: `traitlabv3/docs/PLAN_REVISION_POPUP_Y_MEMORIA.md` líneas 8-9

**Estado**: 🔍 No verificado
**Prioridad**: 🔴 Crítico

### 10.3 Fallos en Móviles con 300+ Traits

**Problema Reportado**: Algunos móviles fallan con wallets que tienen 300+ traits. Desktop funciona bien.

**Estado**: ❌ No resuelto
**Prioridad**: 🔴 Crítico
**Áreas a investigar**:
- Memory leaks
- Falta de virtualización
- Falta de cleanup de imágenes
- Batch size inapropiado para móviles
- Diferencias en IntersectionObserver

### 10.4 Refresh Automático con 1000+ Traits

**Documentado en**: `traitlabv3/docs/PLAN_REVISION_POPUP_Y_MEMORIA.md` líneas 11-12

**Estado**: ❌ No resuelto
**Prioridad**: 🔴 Crítico (aunque menos común que 300+)

---

## 11. COMPARACIÓN DE ESTRUCTURA DE ARCHIVOS

### 11.1 Archivos en Original vs v3

**Original**:
- `modules/app-initializer.js`
- `modules/config.js`
- `modules/crafting.js`
- `modules/customise.js`
- `modules/data-manager.js`
- `modules/display-manager.js`
- `modules/filters.js`
- `modules/floppy.js`
- `modules/gallery-manager.js`
- `modules/lambo.js`
- `modules/serums.js`
- `modules/sticky-popup-manager.js`
- `modules/token-selection-manager.js`
- `modules/traits.js`
- `modules/ui-templates.js`
- `modules/ui.js`
- `modules/utils/image-loader.js`
- `modules/wallet.js`
- `modules/zero.js`

**v3**:
- Todos los anteriores +
- `modules/supabase-cache.js` (nuevo, no usado aún)

**Estado**: ✅ Estructura similar
**Prioridad**: 🟢 Verificación

---

## 12. CHECKLIST DE VERIFICACIÓN POR MÓDULO

### Módulo UI
- [ ] Límite de traits: ¿Existe? ¿Cuál es el valor? (OBJETIVO: Eliminar límites)
- [ ] Lazy loading: ¿Funciona en desktop? ¿Funciona en móviles con 300+ traits?
- [ ] Optimización móvil: ¿Hay diferencias entre desktop y móvil?
- [ ] Batch size: ¿Es apropiado para móviles con 300+ traits?
- [ ] Load More handler: ¿Existe? (Opcional para UX)
- [ ] Botón Load More: ¿Existe en UI? (Opcional para UX)
- [ ] Parámetros displayTokens: ¿Consistentes?
- [ ] Memory management: ¿Limpia imágenes fuera del viewport en móviles?
- [ ] Virtualización: ¿Remueve elementos DOM fuera del viewport en móviles?

### Módulo Data Manager
- [ ] loadMoreTraits: ¿Funciona correctamente?
- [ ] Eventos emitidos: ¿Todos los necesarios?
- [ ] Pagination state: ¿Se mantiene correctamente?
- [ ] Batch size: ¿Es 50? ¿Debería ser configurable para móviles?

### Módulo Sticky Popup Manager
- [ ] Listeners de traits: ¿Configurados correctamente?
- [ ] Show traits actions: ¿Aparece botón?
- [ ] Generate combined image: ¿Funciona?
- [ ] Update selection state: ¿Obtiene estado correcto?

### Módulo Traits
- [ ] Eventos emitidos: ¿Todos los listeners configurados?
- [ ] Get selected traits: ¿Retorna correctamente?
- [ ] Category management: ¿Funciona?

### Módulo Token Selection Manager
- [ ] Update selection info: ¿Delega correctamente?
- [ ] Manipulación DOM: ¿Hay manipulación directa?

### Módulo Zero
- [ ] Load tokens paginación: ¿Retorna formato correcto?
- [ ] Referencias a módulos: ¿Nombres correctos?

---

## 13. PRIORIZACIÓN DE FIXES

### Fase 1: Críticos (Bloquean funcionalidad)
1. Botón Apply Traits no aparece
2. Imagen combinada no aparece
3. **Optimización para 300+ traits en móviles** (fallos reportados)
4. Refresh automático con 1000+ traits
5. Paginación manual (botón Load More) - opcional, para mejorar UX

### Fase 2: Importantes (Afectan UX y rendimiento)
1. Lazy loading en móviles con 300+ traits
2. Cleanup de imágenes (especialmente en móviles)
3. Virtualización real (especialmente en móviles)
4. Cleanup de observers
5. Diferencias móvil vs desktop - investigar por qué desktop funciona y móvil no

### Fase 3: Mejoras (Optimización)
1. Limpiar logs de debug
2. Estandarizar nombres de módulos
3. Documentar dependencias
4. Eliminar código muerto
5. Batch size dinámico optimizado para móviles

---

## 14. REFERENCIAS DE CÓDIGO ESPECÍFICAS

### Para Verificar Optimización de Traits (NO límites)
- `traitlab/modules/ui.js` líneas 532-539 - Verificar límite hardcoded
- `traitlabv3/modules/ui.js` - Buscar `maxTraits`, `150`, `200`, `300` o límites similares
- `traitlabv3/modules/ui.js` - Verificar lazy loading en móviles vs desktop
- `traitlabv3/modules/ui.js` - Verificar cleanup de imágenes en móviles
- `traitlabv3/modules/ui.js` - Verificar virtualización de elementos DOM

### Para Verificar Load More
- `traitlab/modules/ui.js` línea 370
- `traitlab/modules/data-manager.js` líneas 840-922
- `traitlabv3/modules/data-manager.js` líneas 1214-1260

### Para Verificar Listeners de Traits
- `traitlabv3/modules/sticky-popup-manager.js` líneas 201-248
- `traitlabv3/modules/traits.js` líneas 99, 120, 149

### Para Verificar Problemas de Memoria en Móviles
- `traitlabv3/docs/PLAN_REVISION_POPUP_Y_MEMORIA.md` - Documento completo
- `traitlabv3/modules/ui.js` - Lazy loading implementation
- `traitlabv3/modules/ui.js` - Verificar diferencias móvil vs desktop

---

## 15. METODOLOGÍA DE REVISIÓN

### Paso 1: Comparación Módulo por Módulo
1. Abrir archivo original y v3 lado a lado
2. Comparar métodos principales
3. Identificar diferencias
4. Verificar funcionalidades faltantes
5. **Especial atención**: Diferencias de comportamiento móvil vs desktop

### Paso 2: Testing Funcional
1. Probar cada funcionalidad en original
2. Probar misma funcionalidad en v3
3. **Probar específicamente en móviles con 300+ traits**
4. Documentar diferencias de comportamiento
5. Identificar regresiones
6. **Comparar comportamiento desktop vs móvil**

### Paso 3: Análisis de Código
1. Buscar TODOs, FIXMEs, BUGs
2. Revisar logs de debug
3. Identificar código duplicado
4. Identificar código muerto
5. **Buscar límites hardcoded (150, 200, 300)**
6. **Buscar diferencias en código móvil vs desktop**

### Paso 4: Documentación
1. Crear lista de bugs encontrados
2. Crear lista de funcionalidades faltantes
3. Crear lista de optimizaciones
4. **Documentar problemas específicos de móviles**
5. Priorizar fixes

---

## 16. HERRAMIENTAS DE REVISIÓN

### Comandos Útiles
```bash
# Buscar diferencias en métodos específicos
grep -r "loadMoreTraits" traitlab/ traitlabv3/

# Buscar límites de traits (para eliminarlos)
grep -r "150\|200\|300\|maxTraits\|limit.*traits" traitlab/ traitlabv3/

# Buscar diferencias móvil vs desktop
grep -r "isMobile\|mobile\|desktop" traitlabv3/modules/ui.js

# Comparar tamaños de archivos
wc -l traitlab/modules/*.js traitlabv3/modules/*.js

# Buscar problemas conocidos
grep -r "TODO\|FIXME\|BUG" traitlabv3/
```

### Archivos de Referencia
- `traitlabv3/docs/PLAN_REVISION_POPUP_Y_MEMORIA.md` - Problemas conocidos
- `traitlabv3/docs/implementacion/PROBLEMAS_DETECTADOS.md` - Bugs detectados
- `traitlabv3/docs/implementacion/RESUMEN_IMPLEMENTACION.md` - Cambios realizados

---

## 17. ÁREAS ESPECÍFICAS DE INVESTIGACIÓN

### 17.1 Por Qué Desktop Funciona y Móvil No

**Hipótesis a investigar**:
1. ¿Lazy loading se activa diferente en móvil?
2. ¿Hay límites de memoria diferentes?
3. ¿Batch size es apropiado para móviles?
4. ¿IntersectionObserver funciona igual?
5. ¿Hay cleanup de elementos DOM?
6. ¿Las imágenes se limpian correctamente?

### 17.2 Optimizaciones Específicas para Móviles

**A considerar**:
- Batch size más pequeño en móviles
- Cleanup más agresivo en móviles
- Virtualización más estricta en móviles
- Lazy loading más agresivo en móviles
- Limitar elementos DOM visibles simultáneamente

### 17.3 Eliminación de Límites

**Objetivo**: NO implementar límites, optimizar para manejar cualquier cantidad.

**Límites a buscar y eliminar**:
- `maxTraits = 150`
- `maxTraits = 200`
- Cualquier `slice(0, N)` que limite traits
- Cualquier condición que limite cantidad de traits mostrados

---

## PRÓXIMOS PASOS

1. **Ejecutar checklist completo** módulo por módulo
2. **Enfocarse en problemas móviles con 300+ traits**
3. **Comparar comportamiento desktop vs móvil**
4. **Documentar cada diferencia** encontrada
5. **Identificar límites hardcoded** y eliminarlos
6. **Priorizar fixes** según impacto (especialmente móviles)
7. **Crear plan de implementación** para fixes globales
8. **Testing exhaustivo** en móviles con 300+ traits después de cada fix

