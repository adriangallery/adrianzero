# Plan de Implementación: Carga de Texturas en Lotes de 100

## Objetivo
Implementar un sistema simple de carga progresiva de texturas en lotes de 100, cargando el siguiente lote cuando termine el anterior.

## Estado Actual (Commit 9bf58a9 - Funcional)
- El archivo `show/tunnel.js` funciona correctamente
- Carga texturas de forma lazy cuando se necesitan
- No tiene sistema de carga por lotes

## Cambios Necesarios

### Paso 1: Agregar Variables en el Constructor
**Ubicación**: Línea ~32, después de `this.selectedSprite = null;`

**Código a agregar**:
```javascript
this.batchIndex = 0; // Índice del lote actual (0, 100, 200, ...)
this.batchSize = 100; // Tamaño del lote (100 texturas)
this.isLoadingBatch = false; // Flag para evitar cargas simultáneas
```

**Verificación**: 
- Las variables deben estar dentro del constructor
- Deben estar antes de `this.init();`
- No deben romper la sintaxis existente

### Paso 2: Agregar Función loadTextureBatch()
**Ubicación**: Después de `createParticles()`, antes de `createPlaceholderTexture()`
**Línea aproximada**: Después de la línea 366 (después de `console.log` de partículas creadas)

**Código completo de la función**:
```javascript
/**
 * Load a batch of 100 textures progressively
 */
async loadTextureBatch() {
    // Prevenir cargas simultáneas
    if (this.isLoadingBatch || this.batchIndex >= this.assets.length) {
        return;
    }
    
    this.isLoadingBatch = true;
    const startIndex = this.batchIndex;
    const endIndex = Math.min(this.batchIndex + this.batchSize, this.assets.length);
    
    console.log(`📦 Loading batch ${Math.floor(this.batchIndex / this.batchSize) + 1}: textures ${startIndex + 1}-${endIndex} of ${this.assets.length}`);
    
    // Crear array de promesas para este lote
    const promises = [];
    for (let i = startIndex; i < endIndex; i++) {
        const asset = this.assets[i];
        if (asset && asset.url && !this.textureCache.has(asset.url) && !this.loadingTextures.has(asset.url)) {
            promises.push(
                this.loadTexture(asset.url).catch(() => {
                    // Silently fail, will retry if needed
                })
            );
        }
    }
    
    // Esperar a que termine el lote
    await Promise.all(promises);
    
    // Actualizar índice y flag
    this.batchIndex = endIndex;
    this.isLoadingBatch = false;
    
    // Mostrar progreso
    const loaded = this.textureCache.size;
    const total = this.assets.length;
    console.log(`✅ Batch complete: ${loaded}/${total} textures loaded (${Math.round(loaded / total * 100)}%)`);
    
    // Cargar siguiente lote si hay más
    if (this.batchIndex < this.assets.length) {
        setTimeout(() => {
            this.loadTextureBatch();
        }, 100);
    } else {
        console.log(`🎉 All ${total} textures loaded!`);
    }
}
```

**Verificación**:
- La función debe ser `async`
- Debe estar correctamente indentada (4 espacios)
- Debe estar dentro de la clase `InfiniteTunnel`
- No debe tener errores de sintaxis

### Paso 3: Llamar a loadTextureBatch() después de crear partículas
**Ubicación**: Al final de `createParticles()`, después del `console.log` de partículas creadas
**Línea aproximada**: Después de la línea 366

**Código a agregar**:
```javascript
// Start loading first batch of textures
this.loadTextureBatch();
```

**Verificación**:
- Debe estar después del `console.log` de partículas
- Debe estar antes del cierre de la función `createParticles()`
- No debe romper la estructura existente

## Orden de Implementación

1. **Paso 1**: Agregar variables en constructor
   - Verificar que no haya errores de sintaxis
   - Verificar que las variables estén correctamente definidas

2. **Paso 2**: Agregar función loadTextureBatch()
   - Verificar sintaxis completa
   - Verificar que esté correctamente indentada
   - Verificar que use las variables del Paso 1

3. **Paso 3**: Llamar a la función
   - Verificar que se llame después de crear partículas
   - Verificar que no rompa el flujo existente

## Verificaciones Finales

1. **Sintaxis**: Ejecutar `read_lints` en `show/tunnel.js`
2. **Estructura**: Verificar que todas las llaves estén balanceadas
3. **Funcionalidad**: Verificar que el código compile sin errores
4. **Lógica**: Verificar que la función se llame correctamente

## Prevención de Errores

1. **No modificar código existente** que funcione
2. **Solo agregar código nuevo**, no reemplazar
3. **Verificar sintaxis** después de cada cambio
4. **Probar incrementalmente** cada paso antes de continuar
5. **Mantener indentación** consistente (4 espacios)

## Archivos a Modificar

- `show/tunnel.js`: Único archivo a modificar

## Notas Importantes

- El sistema actual de lazy loading sigue funcionando
- La carga por lotes es adicional y no interfiere
- Los sprites seguirán cargando sus texturas cuando se necesiten
- La carga por lotes es en segundo plano para mejorar el rendimiento
