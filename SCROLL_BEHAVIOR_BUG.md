# Scroll Behavior Bug - Investigación

**Fecha:** 2026-02-03
**Status:** En investigación - Pendiente de confirmación

## Descripción del Problema

Diferencia en comportamiento de scroll entre categoría ALL y otras categorías (ej: Background) en AdrianZeroModule.

### Comportamiento Reportado

**Categoría ALL:**
- Preview y traits tienen **scroll independiente**
- El preview permanece visible mientras scrolleas los traits
- ✅ Comportamiento deseado

**Otras categorías (ej: Background):**
- Scroll es **conjunto** (preview + traits al unísono)
- El preview **desaparece** cuando haces scroll hacia abajo
- ❌ Comportamiento no deseado

**Elementos que SÍ mantienen sticky:**
- Menú principal
- Selector de categorías

## Estructura del Código Actual

### AdrianZeroModule.tsx - Jerarquía de Contenedores

```
Línea 212: <div className="flex flex-col h-full">  ← PRINCIPAL (h-full, NO overflow)
  │
  ├─ Header (214-239)
  │
  └─ Línea 316: <div className="flex-1 flex flex-col ...">  ← Trait Selection (flex-1, NO overflow)
       │
       ├─ Preview Panel (339-430) - Colapsable, FIJO, NO overflow
       │
       ├─ Category Tabs (433-440) - STICKY (sticky top-0)
       │
       └─ Línea 443: <div className="flex-1 overflow-y-auto">  ← Grid (SCROLL INDEPENDIENTE)
            └─ TraitGrid component
```

### Código Relevante

**Línea 443 - Traits Grid (actual):**
```jsx
<div className="flex-1 overflow-y-auto pb-4">
  <TraitGrid
    traits={displayTraits}
    selectedTraitIds={selectedTraitIds}
    onTraitSelect={handleTraitSelect}
    emptyMessage={...}
  />
</div>
```

**Línea 433 - Category Tabs (sticky):**
```jsx
<div className="sticky top-0 z-10 bg-background -mx-4 px-4 pb-2">
  <TraitCategories ... />
</div>
```

**Línea 339 - Preview Panel:**
```jsx
{selectedTraits.length > 0 && (
  <div className="mb-2 border border-border rounded-lg overflow-hidden bg-card">
    {/* Preview Header - clickable to toggle */}
    <button onClick={() => setIsTraitPreviewExpanded(!isTraitPreviewExpanded)} ...>
      ...
    </button>

    {/* Preview Content - Collapsible */}
    {isTraitPreviewExpanded && (
      <div className="p-2 pt-0">
        {/* Preview Image + Selected Traits Pills + Action Buttons */}
      </div>
    )}
  </div>
)}
```

## Hipótesis

### ¿Por qué comportamiento diferente entre ALL y otras categorías?

**Posibilidad 1: Cantidad de traits**
- **ALL**: Muchos traits → Grid llena espacio → `overflow-y-auto` se activa → Scroll independiente
- **Background**: Pocos traits → Grid NO llena espacio → No hay overflow en el grid → Scroll del body/ventana

**Posibilidad 2: Contenedor padre sin overflow**
- El contenedor en línea 316 (`flex-1 flex flex-col`) NO tiene overflow definido
- Si el contenido total es pequeño, no hay scroll en el grid
- El scroll sería del body/ventana principal, afectando TODO (incluyendo preview)

## Preguntas Pendientes para el Usuario

1. **En Background, cuando el preview desaparece:**
   - ¿Es porque scrolleas la **ventana/página completa** (scroll del body)?
   - ¿O scrolleas dentro del **área de traits** y el preview se va?

2. **En ALL:**
   - ¿Puedes hacer scroll en los traits SIN que el preview se mueva?
   - ¿El preview se queda fijo mientras scrolleas los traits?

3. **Objetivo deseado:**
   - ¿Que SIEMPRE el preview desaparezca al hacer scroll (scroll conjunto)?
   - ¿O que SIEMPRE el preview se quede fijo (scroll independiente)?

## Archivos Relacionados

- `/traitlabv4/src/features/adrianzero/components/AdrianZeroModule.tsx` (líneas 212-464)
- `/traitlabv4/src/features/traits/components/TraitsModule.tsx` (similar estructura)

## Posibles Soluciones (Pendiente de confirmar)

### Opción A: Scroll independiente para TODAS las categorías
Asegurar que el grid siempre tenga altura mínima para activar overflow:
```jsx
<div className="flex-1 overflow-y-auto pb-4 min-h-0">
  <TraitGrid ... />
</div>
```

### Opción B: Scroll conjunto para TODAS las categorías
Mover el `overflow-y-auto` al contenedor padre:
```jsx
<div className="flex-1 flex flex-col overflow-y-auto border-t border-border pt-4 mt-2">
  {/* Preview Panel */}
  {/* Category Tabs - sticky */}
  {/* Traits Grid - SIN overflow propio */}
  <div className="flex-1 pb-4">
    <TraitGrid ... />
  </div>
</div>
```

## Próximos Pasos

1. ✅ Documentar el bug
2. ⏳ Confirmar comportamiento exacto con el usuario
3. ⏳ Verificar en navegador el comportamiento real
4. ⏳ Implementar solución según objetivo deseado
5. ⏳ Probar en diferentes tamaños de pantalla y categorías

---

**Notas adicionales:**
- El mismo patrón se repite en `TraitsModule.tsx`
- Ambos módulos usan la misma estructura de layout
- La solución debe aplicarse consistentemente en ambos módulos
