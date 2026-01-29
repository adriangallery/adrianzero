# DOCUMENTACIÓN: FILTROS Y PACKS - TraitLAB

**Fecha**: 2026-01-29
**Versión**: 1.0
**Autor**: Claude Sonnet 4.5

---

## 📋 TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura de Filtros](#arquitectura-de-filtros)
3. [Sistema de Packs](#sistema-de-packs)
4. [Rangos de Token IDs](#rangos-de-token-ids)
5. [Contratos por Pack](#contratos-por-pack)
6. [Cómo Agregar un Nuevo Pack](#cómo-agregar-un-nuevo-pack)
7. [Troubleshooting](#troubleshooting)
8. [Referencias de Código](#referencias-de-código)

---

## RESUMEN EJECUTIVO

TraitLAB utiliza un sistema de filtros distribuido en 3 archivos principales para clasificar tokens ERC1155 en categorías:

- **TRAITS**: Tokens de traits individuales (artwork)
- **FLOPPYS/PACKS**: Tokens que pueden abrirse para revelar contenido
- **SERUMS**: Tokens especiales de transformación

Los packs aparecen en el tab "PACKS" y tienen contratos específicos para abrirlos.

---

## ARQUITECTURA DE FILTROS

### 🏗️ Archivos Involucrados

| Archivo | Responsabilidad | Función Clave |
|---------|----------------|---------------|
| `traitlab/modules/filters.js` | Filtrado principal y clasificación | `filterFloppyTokens()`, `isFloppyToken()` |
| `traitlab/modules/floppy.js` | Gestión de floppys/packs | `isFloppyToken()`, `openFloppy()` |
| `traitlab/modules/zero.js` | Utilidades de tokens | `isFloppyToken()`, `isSerumToken()` |

### 🔍 Flujo de Filtrado

```
Usuario conecta wallet
  ↓
DataManager carga tokens ERC1155 de Alchemy
  ↓
filters.js.filterFloppyTokens() clasifica cada token
  ↓
Verifica: isFloppyById (rango de IDs)
  ↓
SI es floppy → Asigna displayName y targetContract
  ↓
Token aparece en tab PACKS
```

---

## SISTEMA DE PACKS

### 📦 ¿Qué es un Pack?

Un pack es un token ERC1155 que:
1. Está en un **rango específico de IDs** (ej: 10000-10019)
2. Tiene un **contrato asociado** para abrirlo
3. Se muestra en el **tab PACKS**
4. Al abrirse, revela otros tokens (traits, floppys, etc.)

### 🎯 Tipos de Packs por Contrato

| Contrato | Descripción | Packs que lo usan |
|----------|-------------|-------------------|
| `ACTION_PACKS_CONTRACT` | Contrato principal de packs de acción | 10008, 10011, 10012, 10016, 10019, 1123 |
| `OPENPACK_V4_CONTRACT` | Versión 4 del sistema de apertura | 10013, 10014, 10018, 15010 |
| `ACTION_PACK_10007_CONTRACT` | Contrato específico para NEONpack | 10007 |
| `PACK_TOKEN_MINTER_CONTRACT` | Contrato genérico de minteo | 10004, otros floppys |
| `NEW_FLOPPY_PACK_CONTRACT` | Nuevo sistema de floppys | 10003 |
| `ADRIAN_FLOPPY_DISCS_CONTRACT` | Floppys clásicos | 10005, 10009, 10010, 10015 |

### 📍 Configuración en config.js

```javascript
// traitlab/modules/config.js
this.ACTION_PACKS_CONTRACT = "0xa7e2ae50e7f15d220cd3f61728e52d0e6e1b2e36";
this.OPENPACK_V4_CONTRACT = "0x238083148F4FBF4232efe16261e7aa87CE787022";
// ... otros contratos
```

---

## RANGOS DE TOKEN IDS

### 🔢 Rangos Oficiales

| Rango | Tipo | Descripción |
|-------|------|-------------|
| **10000-10019** | Packs/Floppys principales | Incluye la mayoría de packs |
| **15000-15015** | Floppys especiales | Floppys de eventos especiales |
| **1123** | Pack especial | CensorPACK (caso único) |
| **262144-262147** | Serums | Tokens de transformación |

### ⚠️ CRÍTICO: Consistencia de Rangos

Los siguientes 3 archivos **DEBEN** tener los mismos rangos:

#### 1. filters.js - Línea ~50 (isFloppyById)
```javascript
const isFloppyById = (tokenId >= 10000 && tokenId <= 10019) ||
                     (tokenId >= 15000 && tokenId <= 15015) ||
                     tokenId === 1123;
```

#### 2. filters.js - Línea ~189 (isFloppyToken)
```javascript
return (tokenId >= 10000 && tokenId <= 10019) ||
       (tokenId >= 15000 && tokenId <= 15015) ||
       tokenId === 1123;
```

#### 3. floppy.js - Línea ~173 (isFloppyToken)
```javascript
return (tokenId >= 10000 && tokenId <= 10019) ||
       (tokenId >= 15000 && tokenId <= 15015);
```

#### 4. zero.js - Línea ~156 (isFloppyToken)
```javascript
return (tokenId >= 10000 && tokenId <= 10019) ||
       (tokenId >= 15000 && tokenId <= 15015);
```

---

## CONTRATOS POR PACK

### 📋 Lista Completa de Packs

| ID | DisplayName | Contrato | Descripción |
|----|-------------|----------|-------------|
| 1123 | CensorPACK | ACTION_PACKS_CONTRACT | Pack especial de censura |
| 10000 | *(genérico)* | PACK_TOKEN_MINTER_CONTRACT | Pack básico |
| 10001 | *(genérico)* | PACK_TOKEN_MINTER_CONTRACT | Pack básico |
| 10002 | *(genérico)* | PACK_TOKEN_MINTER_CONTRACT | Pack básico |
| 10003 | *(genérico)* | NEW_FLOPPY_PACK_CONTRACT | Nuevo floppy |
| 10004 | GF Floppy | PACK_TOKEN_MINTER_CONTRACT | Golden Floppy básico |
| 10005 | Golden Floppy | ADRIAN_FLOPPY_DISCS_CONTRACT | Floppy dorado |
| 10007 | NEONpack | ACTION_PACK_10007_CONTRACT | Pack de neón |
| 10008 | OPTICALpack | ACTION_PACKS_CONTRACT | Pack óptico |
| 10009 | PUNKSfloppy | ADRIAN_FLOPPY_DISCS_CONTRACT | Floppy de punks |
| 10010 | ComradesUSB | ADRIAN_FLOPPY_DISCS_CONTRACT | USB de camaradas |
| 10011 | PACK10011 | ACTION_PACKS_CONTRACT | Pack 11 |
| 10012 | PACK10012 | ACTION_PACKS_CONTRACT | Pack 12 |
| 10013 | PACK10013 | OPENPACK_V4_CONTRACT | Pack 13 (v4) |
| 10014 | PACK10014 | OPENPACK_V4_CONTRACT | Pack 14 (v4) |
| 10015 | XMAS '25 Floppy | ADRIAN_FLOPPY_DISCS_CONTRACT | Floppy navideño |
| 10016 | PACK10016 | ACTION_PACKS_CONTRACT | Pack 16 |
| 10017 | *(genérico)* | PACK_TOKEN_MINTER_CONTRACT | Pack 17 |
| 10018 | PACK10018 | OPENPACK_V4_CONTRACT | Pack 18 (v4) |
| **10019** | **PACK10019** | **ACTION_PACKS_CONTRACT** | **Pack 19 (nuevo)** |
| 15010 | Back to Work | OPENPACK_V4_CONTRACT | Floppy especial |
| 15014 | *(genérico)* | PACK_TOKEN_MINTER_CONTRACT | Floppy especial |

---

## CÓMO AGREGAR UN NUEVO PACK

### 📝 Checklist Completo

Cuando necesites agregar un nuevo pack (ej: ID 10020):

#### ✅ Paso 1: Actualizar Rangos (4 lugares)

**1.1. filters.js - Línea ~50**
```javascript
// ANTES
const isFloppyById = (tokenId >= 10000 && tokenId <= 10019) ||

// DESPUÉS
const isFloppyById = (tokenId >= 10000 && tokenId <= 10020) ||
```

**1.2. filters.js - Línea ~189**
```javascript
// ANTES
return (tokenId >= 10000 && tokenId <= 10019) ||

// DESPUÉS
return (tokenId >= 10000 && tokenId <= 10020) ||
```

**1.3. floppy.js - Línea ~173**
```javascript
// ANTES
return (tokenId >= 10000 && tokenId <= 10019) ||

// DESPUÉS
return (tokenId >= 10000 && tokenId <= 10020) ||
```

**1.4. zero.js - Línea ~156**
```javascript
// ANTES
return (tokenId >= 10000 && tokenId <= 10019) ||

// DESPUÉS
return (tokenId >= 10000 && tokenId <= 10020) ||
```

#### ✅ Paso 2: Agregar Configuración del Pack

**2.1. filters.js - Después del último pack (línea ~101)**
```javascript
} else if (tokenId === 10019) {
    token.displayName = 'PACK10019';
    token.targetContract = window.TraitLABConfig.ACTION_PACKS_CONTRACT;
} else if (tokenId === 10020) {  // ← NUEVO
    token.displayName = 'PACK10020';
    token.targetContract = window.TraitLABConfig.ACTION_PACKS_CONTRACT;
} else if (tokenId === 1123) {
```

**Elegir el contrato apropiado:**
- `ACTION_PACKS_CONTRACT` - Para packs de acción estándar
- `OPENPACK_V4_CONTRACT` - Para packs con sistema v4
- `PACK_TOKEN_MINTER_CONTRACT` - Para packs genéricos
- O crear un nuevo contrato en config.js

**2.2. floppy.js - Agregar case en getContractForFloppy() (línea ~227)**

⚠️ **CRÍTICO**: Agregar el pack a la función `getContractForFloppy()` es OBLIGATORIO

```javascript
// Encontrar la sección apropiada según el contrato elegido

// Si usas ACTION_PACKS_CONTRACT, agregar después de pack 10016 (línea ~280):
} else if (tokenId === 10019) {
    // PACK10019 - ActionPack contract
    return {
        address: window.TraitLABConfig.ACTION_PACKS_CONTRACT,
        type: 'pack',
        name: 'PACK10019'
    };
} else if (tokenId === 10020) {  // ← NUEVO
    // PACK10020 - ActionPack contract
    return {
        address: window.TraitLABConfig.ACTION_PACKS_CONTRACT,
        type: 'pack',
        name: 'PACK10020'
    };
} else if (tokenId === 1123) {

// Si usas OPENPACK_V4_CONTRACT, agregar al condicional de línea ~229:
if (tokenId === 10000 || tokenId === 10001 || tokenId === 10002 ||
    tokenId === 10003 || tokenId === 10004 || tokenId === 10005 ||
    tokenId === 10009 || tokenId === 10010 || tokenId === 10013 ||
    tokenId === 10014 || tokenId === 10015 || tokenId === 10018 ||
    tokenId === 10020 || tokenId === 15010) {  // ← Agregar 10020 aquí
```

**¿Por qué es crítico?**
- `filters.js` solo asigna `targetContract` para mostrar el pack
- `floppy.js.getContractForFloppy()` determina qué contrato se usa REALMENTE al abrir
- Si falta esta configuración, el pack caerá al caso default (ADRIAN_FLOPPY_DISCS_CONTRACT)
- Resultado: Error "Pack not active" al intentar abrir

**2.3. floppy.js - Agregar validación en openActionPack() (línea ~766)**

Si el pack usa `ACTION_PACKS_CONTRACT`, agregar a la validación:

```javascript
// ANTES
if (!(this.selectedFloppy.tokenId === 10008 || this.selectedFloppy.tokenId === 10011 ||
      this.selectedFloppy.tokenId === 10012 || this.selectedFloppy.tokenId === 10016 ||
      this.selectedFloppy.tokenId === 10019 || this.selectedFloppy.tokenId === 1123 ||
      (this.selectedFloppy.tokenId >= 15008 && this.selectedFloppy.tokenId <= 15015))) {

// DESPUÉS
if (!(this.selectedFloppy.tokenId === 10008 || this.selectedFloppy.tokenId === 10011 ||
      this.selectedFloppy.tokenId === 10012 || this.selectedFloppy.tokenId === 10016 ||
      this.selectedFloppy.tokenId === 10019 || this.selectedFloppy.tokenId === 10020 ||  // ← NUEVO
      this.selectedFloppy.tokenId === 1123 ||
      (this.selectedFloppy.tokenId >= 15008 && this.selectedFloppy.tokenId <= 15015))) {
```

**2.4. floppy.js - Agregar routing en openSelectedPack() (línea ~324)**

⚠️ **CRÍTICO**: Agregar case de routing es OBLIGATORIO (pack 10019 falló por esto)

Si el pack usa `ACTION_PACKS_CONTRACT`, agregar case antes del 1123:

```javascript
// ANTES
} else if (tokenId === 10016) {
    console.log('Redirecting to openActionPack() for PACK10016', tokenId);
    return await this.openActionPack();
} else if (tokenId === 1123) {

// DESPUÉS
} else if (tokenId === 10016) {
    console.log('Redirecting to openActionPack() for PACK10016', tokenId);
    return await this.openActionPack();
} else if (tokenId === 10020) {  // ← NUEVO
    console.log('Redirecting to openActionPack() for PACK10020', tokenId);
    return await this.openActionPack();
} else if (tokenId === 1123) {
```

**¿Por qué es crítico?**
- `openSelectedPack()` decide QUÉ MÉTODO llamar (openPack, openPackV4, openActionPack, etc.)
- Si falta el case, el pack cae al `else` que usa `openPack()` con contrato incorrecto
- Resultado: Transacción enviada a contrato equivocado, error "Pack not active"
- **Ejemplo real**: Pack 10019 fue enviado a PACK_TOKEN_MINTER_CONTRACT en vez de ACTION_PACKS_CONTRACT

#### ✅ Paso 3: Agregar Imagen

**3.1. Ubicación**
```
traitlab/assets/traits/10020.png
```
o
```
traitlab/assets/traits/10020.gif
```

**3.2. Formatos soportados**
- PNG (recomendado)
- GIF (para animaciones)
- SVG (menos común para packs)

#### ✅ Paso 4: Actualizar Comentarios

**4.1. filters.js - Línea 1**
```javascript
/**
 * TRAITLAB - Módulo de Filtros
 * Maneja el filtrado de tokens por tipo (floppy, serum, traits, etc.)
 * Updated: 2026-01-29 - Pack 10020 agregado con ACTION_PACKS_CONTRACT
 */
```

#### ✅ Paso 5: Testing

**5.1. Hard Refresh**
- Ctrl+Shift+R (Windows/Linux)
- Cmd+Shift+R (Mac)

**5.2. Verificar en DevTools Console**
```
💾 Floppy encontrado por ID: 10020  ← Debe aparecer
💾 Floppy tokens encontrados: 22    ← Incrementado
```

**5.3. Verificar en UI**
- El pack aparece en tab PACKS
- Tiene el displayName correcto
- Al hacer click abre el popup
- Botón "Open Pack" visible

**5.4. Verificar Contrato**
- Abrir DevTools → Network
- Click en "Open Pack"
- Verificar que llama al contrato correcto

---

## TROUBLESHOOTING

### 🐛 Problema: "No veo el pack nuevo"

**Síntomas:**
- Pack agregado al código
- Deployment completo
- No aparece en tab PACKS

**Diagnóstico:**
```javascript
// En DevTools Console, verificar:
console.log('Floppy tokens:', window.app.modules.dataManager.cache.adrianLab.floppys);
```

**Posibles Causas:**

1. **❌ Rangos no actualizados**
   - **Verificar**: Los 4 lugares (filters.js x2, floppy.js, zero.js)
   - **Fix**: Actualizar `<= 10018` a `<= 10020`

2. **❌ Caché del navegador**
   - **Verificar**: filters.js?v=XX en Network tab
   - **Fix**: Hard refresh (Ctrl+Shift+R)

3. **❌ Usuario no tiene el token**
   - **Verificar**: En Alchemy API o explorador de blockchain
   - **Fix**: Mintear el token al usuario

4. **❌ Deployment no completó**
   - **Verificar**: `gh run list --workflow=pages.yml`
   - **Fix**: Esperar a que complete (~2 min)

### 🐛 Problema: "El pack se muestra pero no abre"

**Síntomas:**
- Pack visible en UI
- Click en "Open Pack" no hace nada o da error

**Posibles Causas:**

1. **❌ openSelectedPack() no actualizado** ⚠️ CAUSA MÁS COMÚN
   - **Síntomas**: Error "execution reverted: Pack not active", transacción a contrato incorrecto
   - **Verificar**: DevTools Console → error muestra "to":"0x673bE..." (contrato equivocado)
   - **Causa**: Falta case en floppy.js:324 openSelectedPack(), cae a else con openPack()
   - **Fix**: Agregar case explícito para redirigir a openActionPack() (ver Paso 2.4)
   - **Ejemplo real**: Pack 10019 usaba openPack() → PACK_TOKEN_MINTER_CONTRACT incorrecto

2. **❌ getContractForFloppy() no actualizado**
   - **Síntomas**: Error "execution reverted: Pack not active"
   - **Verificar**: DevTools Console → "Using contract from getContractForFloppy: 0x..."
   - **Causa**: Falta case en floppy.js:227 getContractForFloppy()
   - **Fix**: Agregar case explícito para el nuevo pack (ver Paso 2.2)
   - **Ejemplo real**: Pack 10019 caía a default porque no tenía case

2. **❌ Contrato incorrecto en filters.js**
   - **Verificar**: targetContract en filters.js
   - **Fix**: Usar el contrato correcto para ese pack

3. **❌ Contrato no configurado en config.js**
   - **Verificar**: window.TraitLABConfig.XXX_CONTRACT existe
   - **Fix**: Agregar a config.js

4. **❌ Usuario no aprobó el contrato**
   - **Verificar**: allowance en blockchain
   - **Fix**: Usuario debe aprobar primero

### 🐛 Problema: "Aparece en FLOPPYS pero no en PACKS"

**Explicación:** No hay diferencia entre FLOPPYS y PACKS. El tab se llama "PACKS" pero internamente usa `filterFloppyTokens()`.

**No es un bug:** Es el comportamiento esperado.

---

## REFERENCIAS DE CÓDIGO

### 📂 Archivos Clave

```
traitlab/
├── modules/
│   ├── filters.js          ← Clasificación principal
│   ├── floppy.js          ← Gestión de apertura
│   ├── zero.js            ← Utilidades de tokens
│   ├── config.js          ← Direcciones de contratos
│   └── data-manager.js    ← Carga de tokens desde Alchemy
├── assets/
│   └── traits/
│       ├── 10019.png      ← Imágenes de packs
│       └── ...
└── index.html             ← Tab PACKS definido aquí
```

### 🔗 Funciones Relacionadas

| Función | Archivo | Línea | Descripción |
|---------|---------|-------|-------------|
| `filterFloppyTokens()` | filters.js | ~43 | Filtra tokens de tipo floppy/pack |
| `isFloppyToken()` | filters.js | ~186 | Verifica si un token es floppy |
| `isFloppyToken()` | floppy.js | ~173 | Verifica si un token es floppy |
| `isFloppyToken()` | zero.js | ~156 | Verifica si un token es floppy |
| `openFloppy()` | floppy.js | ~50 | Abre un pack usando su contrato |
| **`openSelectedPack()`** | **floppy.js** | **~324** | **⚠️ CRÍTICO: Decide qué método usar (openPack/openPackV4/openActionPack)** |
| **`getContractForFloppy()`** | **floppy.js** | **~227** | **⚠️ CRÍTICO: Determina qué contrato usar para abrir cada pack** |
| `openActionPack()` | floppy.js | ~760 | Abre packs con ACTION_PACKS_CONTRACT |
| `openPack()` | floppy.js | ~540 | Abre packs con PACK_TOKEN_MINTER_CONTRACT (default fallback) |
| `openPackV4()` | floppy.js | ~372 | Abre packs con OPENPACK_V4_CONTRACT |
| `loadFloppyTokensOnDemand()` | data-manager.js | ~287 | Carga floppys bajo demanda |

### 🎨 Sistema de Imágenes

**Rutas de fallback:**
1. Local: `traitlab/assets/traits/{tokenId}.{ext}`
2. Remote: `/components/images/{tokenId}.{ext}`
3. Alchemy: URL de IPFS/HTTP de metadata

**Extensiones soportadas:**
- PNG (preferida)
- GIF (animaciones)
- SVG (vectorial)

---

## HISTORIAL DE CAMBIOS

### 2026-01-29 - Pack 10019 Agregado y Corregido (2 bugs)
- **Commit inicial**: 0466131f1
- **Commit fix #1**: ff86af342 (getContractForFloppy)
- **Commit fix #2**: e536792f3 (openSelectedPack)
- **Cambios**:
  - Actualizado rango 10000-10018 → 10000-10019 en 4 archivos
  - Agregada configuración de PACK10019 con ACTION_PACKS_CONTRACT en filters.js
  - Agregada imagen 10019.png en assets

- **⚠️ BUG #1**: Pack 10019 no abría (error "Pack not active" con contrato incorrecto)
  - **Causa**: Faltaba case en getContractForFloppy() en floppy.js:280-287
  - **Fix**: Agregado case para retornar ACTION_PACKS_CONTRACT

- **⚠️ BUG #2**: Pack 10019 seguía usando contrato incorrecto después de fix #1
  - **Causa**: Faltaba case en openSelectedPack() en floppy.js:324-356
  - **Síntoma**: Transacción enviada a 0x673bE... en vez de ACTION_PACKS_CONTRACT
  - **Fix**: Agregado case para redirigir a openActionPack()

- **LECCIONES CRÍTICAS**:
  1. ✅ Actualizar getContractForFloppy() (determina contrato)
  2. ✅ Actualizar openSelectedPack() (decide método a llamar) ← **MÁS CRÍTICO**
  3. ✅ Actualizar validación en openActionPack()
  4. ✅ Hard refresh no es suficiente si deployment no completó

### Futuros Packs
- **10020**: *(Pendiente)*
- **10021**: *(Pendiente)*
- ...

---

## CONTACTO Y SOPORTE

Para preguntas o problemas:
1. Revisar esta documentación primero
2. Verificar código en archivos mencionados
3. Consultar logs de DevTools Console
4. Verificar deployment en GitHub Actions

---

**Última actualización**: 2026-01-29
**Versión del documento**: 1.0
**Generado por**: Claude Sonnet 4.5
