# Plan de Acción - Ajustes Showcase

## Estado Actual (Commit: 29bbc5dd5)
- ✅ Selección aleatoria real para elementos especiales (1 en 30)
- ✅ Scroll infinito vertical funcionando
- ✅ Elementos 3D con animación swing suave
- ❌ Scroll horizontal limitado (~10 items de ancho)
- ❌ Elementos 3D abren modal (no deberían)

## Problemas a Resolver

### 1. Scroll Horizontal Infinito

**Problema**: El scroll horizontal solo permite ~10 items de ancho antes de detenerse.

**Causas posibles**:
- Grid CSS usa `1fr` que limita expansión horizontal
- Carga inicial solo 50 items (puede no ser suficiente para scroll horizontal)
- Sentinel derecho no detecta correctamente el scroll horizontal
- Grid no tiene `width: max-content` o similar

**Solución propuesta**:
1. Cambiar CSS del grid de `1fr` a tamaño fijo (`200px`) para permitir expansión
2. Calcular items iniciales basado en viewport para habilitar scroll horizontal desde inicio
3. Mejorar posicionamiento del sentinel derecho para detectar scroll horizontal
4. Asegurar que el grid tenga `width: max-content` para expansión horizontal

**Archivos a modificar**:
- `showcase/showcase.css` (línea ~184): `grid-template-columns`
- `showcase/showcase.js` (línea ~637): `renderInitialGrid()` - calcular items iniciales
- `showcase/showcase.js` (línea ~729): `createScrollSentinels()` - mejorar sentinel derecho

### 2. Elementos 3D No Deben Abrir Modal

**Problema**: Al hacer click en elementos 3D, se abre el modal con información.

**Solución propuesta**:
1. Eliminar click handler para elementos 3D
2. Cambiar cursor a `default` para indicar que no son clickeables
3. Opcional: Agregar indicador visual de que no son interactivos

**Archivos a modificar**:
- `showcase/showcase.js` (línea ~921): Click handler - condicionar solo para no-3D

## Plan de Implementación

### Fase 1: Scroll Horizontal Infinito

1. **Modificar CSS del grid** (`showcase/showcase.css`)
   - Cambiar `grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))` 
   - A: `grid-template-columns: repeat(auto-fill, minmax(200px, 200px))`
   - Verificar que `width: max-content` esté presente

2. **Mejorar carga inicial** (`showcase/showcase.js` - `renderInitialGrid()`)
   - Calcular items por fila basado en viewport width
   - Cargar suficientes items: `(itemsPerRow + 5 columnas extra) * 3 filas mínimo`
   - Asegurar que haya scroll horizontal desde el inicio

3. **Mejorar sentinel derecho** (`showcase/showcase.js` - `createScrollSentinels()`)
   - Calcular posición correcta del sentinel basado en items por fila
   - Posicionar al final de la última fila
   - Asegurar que cubra todas las filas para mejor detección

### Fase 2: Deshabilitar Modal en Elementos 3D

1. **Modificar click handler** (`showcase/showcase.js` - `createGridItemElement()`)
   - Condicionar: solo agregar event listener si `!is3dModel`
   - Cambiar `cursor: pointer` a `cursor: default` para elementos 3D

## Testing

Después de cada fase:
- [ ] Verificar scroll horizontal infinito funciona
- [ ] Verificar scroll vertical sigue funcionando
- [ ] Verificar elementos 3D no abren modal
- [ ] Verificar elementos regulares y floppy siguen abriendo modal
- [ ] Verificar selección aleatoria sigue funcionando (1 en 30)

## Notas

- Mantener compatibilidad con funcionalidad existente
- No romper scroll vertical
- No afectar selección aleatoria de elementos especiales
- Mantener animaciones y efectos visuales

