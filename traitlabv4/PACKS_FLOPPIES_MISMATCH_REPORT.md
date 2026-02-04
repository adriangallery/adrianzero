# Informe: Mismatches en Packs / Floppies (TraitLab V4)

Referencia: lógica y nombres en **traitlabold** ([`traitlabold/modules/pack-config.js`](../traitlabold/modules/pack-config.js), [`traitlabold/modules/floppy.js`](../traitlabold/modules/floppy.js)) vs **traitlabv4** ([`usePacks.ts`](src/features/packs/hooks/usePacks.ts), [`useOpenPack.ts`](src/features/packs/hooks/useOpenPack.ts)).

---

## 1. Resumen ejecutivo

- **Nombres:** Varios floppies/packs muestran en V4 nombres distintos a los de traitlabold (single source of truth en V3).
- **Contratos de apertura:** Hay tokens que V4 envía al contrato equivocado (OPENPACK_V4 vs ACTION_PACKS vs ADRIAN_FLOPPY_DISCS), por lo que **no se pueden abrir** o fallan en链上.
- **Action Packs 15000–15007:** En V4 aparecen como "ActionPACK #1–8" pero la lógica de `useOpenPack` los manda a **ADRIAN_FLOPPY_DISCS**; en traitlabold solo 15008–15015 están en ACTION_PACKS.

---

## 2. Mismatches de nombres (PACK_METADATA en usePacks.ts vs traitlabold)

| tokenId | TraitLab V4 (actual)     | TraitLab old (referencia) | Nota        |
|---------|---------------------------|----------------------------|------------|
| 10000   | GLITCH Floppy             | (sin nombre → "Floppy 10000") | V4 asigna nombre que en V3 es 10003 |
| 10001   | ZeroHour Floppy          | (sin nombre)               | OK si es decisión de producto |
| 10002   | NEON Floppy              | (sin nombre)               | Conflicto: en V3 "NEONpack" es **10007** |
| 10003   | WAR Floppy                | **GLITCH Floppy**          | **Mismatch** |
| 10004   | MUTANT Floppy            | **GF Floppy**              | **Mismatch** |
| 10005   | CYPHER Floppy            | **Golden Floppy**          | **Mismatch** |
| 10006   | OUTRUN Floppy            | (null)                     | Nombre en V4 puede ser correcto; contrato sí está mal (ver abajo) |
| 10007   | Golden Floppy            | **NEONpack**               | **Mismatch** (Golden en V3 es 10005) |
| 10008   | OG Floppy                 | **OPTICALpack**            | **Mismatch** |
| 10009   | ZEROHOUR Floppy #9       | **PUNKSfloppy**            | **Mismatch** |
| 10010   | ZEROHOUR Floppy #10      | **ComradesUSB**            | **Mismatch** |
| 10011   | ZEROHOUR Floppy #11      | PACK10011                  | Diferente convención |
| 10012   | ZEROHOUR Floppy #12      | PACK10012                  | Diferente convención |
| 10013   | ZEROHOUR Floppy #13      | PACK10013                  | Diferente convención |
| 10014   | ZEROHOUR Floppy #14      | PACK10014                  | Diferente convención |
| 10015   | ZEROHOUR Floppy #15      | **XMAS '25 Floppy**        | **Mismatch** |
| 10016   | ZEROHOUR Floppy #16      | PACK10016                  | Diferente convención |
| 10017   | ZEROHOUR Floppy #17      | (no en pack-config; floppy.js tiene imagen) | — |
| 10018   | ZEROHOUR Floppy #18      | PACK10018                  | Diferente convención |
| 10019   | ZEROHOUR Floppy #19      | PACK10019                  | Diferente convención |
| 15010   | ActionPACK #11            | **Back to Work**           | **Mismatch** (15010 en V3 es OPENPACK_V4 con nombre "Back to Work") |
| 1123    | CensorPACK               | CensorPACK                 | OK |

---

## 3. Mismatches de lógica de contrato (apertura)

### 3.1 Tokens que V4 envía al contrato equivocado

| tokenId | usePacks.ts (campo `contract`) | useOpenPack.ts (contrato real usado) | traitlabold (contrato correcto) | Consecuencia |
|---------|--------------------------------|--------------------------------------|----------------------------------|--------------|
| **10006** | OPENPACK_V4 | ADRIAN_FLOPPY_DISCS (fallback) | **ADRIAN_FLOPPY_DISCS** | Metadata dice OPENPACK_V4 pero la apertura sí usa FLOPPY_DISCS; **nombre mostrado puede confundir**. |
| **10008** | OPENPACK_V4 | ACTION_PACKS | **ACTION_PACKS** | V4 metadata dice OPENPACK_V4; la lógica de apertura sí usa ACTION_PACKS. **Inconsistencia solo en metadata**, apertura correcta. |
| **10014** | OPENPACK_V4 | ADRIAN_FLOPPY_DISCS (fallback) | **OPENPACK_V4** | **No se abre correctamente**: V4 no incluye 10014 en `OPENPACK_V4_TOKENS`, va a FLOPPY_DISCS. |
| **10018** | OPENPACK_V4 | ADRIAN_FLOPPY_DISCS (fallback) | **OPENPACK_V4** | **No se abre correctamente**: mismo caso que 10014. |

### 3.2 Lista de tokens por contrato en traitlabold (referencia)

- **OPENPACK_V4:** 10000, 10001, 10002, 10003, 10004, 10005, 10009, 10010, 10013, 10014, 10015, 10018, 15010  
- **ACTION_PACK_10007:** 10007  
- **ACTION_PACKS:** 10008, 10011, 10012, 10016, 10019, 1123  
- **ADRIAN_FLOPPY_DISCS:** 10006  

En traitlabold, **15000–15007** no están en `PACK_CONFIGS`; solo **15008–15015** se abren vía ACTION_PACKS (y 15010 vía OPENPACK_V4).

### 3.3 useOpenPack.ts – listas actuales vs necesarias

**Actual en V4:**

```ts
const OPENPACK_V4_TOKENS = [10000, 10001, 10002, 10003, 10004, 10005, 10009, 10010, 10013, 10015, 15010];
const ACTION_PACK_TOKENS = [10008, 10011, 10012, 1123];
// isActionPackToken: ACTION_PACK_TOKENS + (id >= 15008 && id <= 15015 && id !== 15010)
```

**Faltan en OPENPACK_V4_TOKENS (respecto a traitlabold):**

- **10014** → debe abrir por OPENPACK_V4  
- **10018** → debe abrir por OPENPACK_V4  

**Faltan en ACTION_PACK_TOKENS (respecto a traitlabold):**

- **10016** → ACTION_PACKS en V3, en V4 cae en fallback FLOPPY_DISCS → **no se abre correctamente**  
- **10019** → ACTION_PACKS en V3, en V4 cae en fallback FLOPPY_DISCS → **no se abre correctamente**  

### 3.4 Action Packs 15000–15015

- En **usePacks.ts** todos (15000–15015) tienen `contract: 'ACTION_PACK'` y tipo ACTION_PACK.  
- En **useOpenPack.ts**:
  - **15010** → OPENPACK_V4 (correcto respecto a V3).
  - **15008, 15009, 15011–15015** → ACTION_PACKS (correcto).
  - **15000–15007** → **ninguno** está en `OPENPACK_V4_TOKENS` ni en `isActionPackToken` → van al **fallback ADRIAN_FLOPPY_DISCS**.

En traitlabold, 15000–15007 no están en `PACK_CONFIGS`; solo se abren por UI los 15008–15015 (con 15010 por OPENPACK_V4). Si en链上 15000–15007 se abren por otro contrato (p. ej. ACTION_PACKS u otro), entonces en V4 están mal enrutados y **no se abrirían** correctamente hasta alinear la lógica con el/los contratos reales.

---

## 4. Resumen de correcciones recomendadas

### 4.1 Nombres (usePacks.ts PACK_METADATA)

Alinear con traitlabold donde haya conflicto claro (ejemplos):

- 10000: decidir si dejar "GLITCH Floppy" o usar "Floppy 10000" (en V3 no tenía nombre).
- 10002: no usar "NEON Floppy" (reservar "NEON" para 10007).
- 10003 → **GLITCH Floppy**
- 10004 → **GF Floppy**
- 10005 → **Golden Floppy**
- 10007 → **NEONpack**
- 10008 → **OPTICALpack**
- 10009 → **PUNKSfloppy**
- 10010 → **ComradesUSB**
- 10015 → **XMAS '25 Floppy**
- 15010 → **Back to Work** (y mantener tipo/contrato actual de apertura).

El resto (10011–10014, 10016–10019) se pueden dejar como PACK10011, etc., o alinear con la convención que prefieras.

### 4.2 Lógica de apertura (useOpenPack.ts)

1. **Añadir a `OPENPACK_V4_TOKENS`:** 10014, 10018.  
2. **Añadir a `ACTION_PACK_TOKENS` (o equivalente):** 10016, 10019.  
3. **15000–15007:** Confirmar en链上 con qué contrato se abren (ACTION_PACKS u otro). Si es ACTION_PACKS, ampliar `isActionPackToken` para incluir `id >= 15000 && id <= 15007` (y que sigan usando ACTION_PACKS con `openPack` + `canOpenPack` si aplica).

### 4.3 Metadata de contrato (usePacks.ts)

- **10006:** `contract: 'ADRIAN_FLOPPY_DISCS'` (o equivalente) para que coincida con useOpenPack.  
- **10008:** `contract: 'ACTION_PACKS'` para consistencia con la apertura.  
- Mantener 10016 y 10019 con contrato ACTION_PACKS una vez añadidos a la lógica de useOpenPack.

---

## 5. Tabla de referencia rápida (traitlabold)

| tokenId | Nombre (V3)     | Contrato apertura   |
|---------|-----------------|----------------------|
| 10000   | —               | OPENPACK_V4          |
| 10001   | —               | OPENPACK_V4          |
| 10002   | —               | OPENPACK_V4          |
| 10003   | GLITCH Floppy   | OPENPACK_V4          |
| 10004   | GF Floppy       | OPENPACK_V4          |
| 10005   | Golden Floppy   | OPENPACK_V4          |
| 10006   | —               | ADRIAN_FLOPPY_DISCS  |
| 10007   | NEONpack        | ACTION_PACK_10007    |
| 10008   | OPTICALpack     | ACTION_PACKS         |
| 10009   | PUNKSfloppy     | OPENPACK_V4          |
| 10010   | ComradesUSB     | OPENPACK_V4          |
| 10011   | PACK10011       | ACTION_PACKS         |
| 10012   | PACK10012       | ACTION_PACKS         |
| 10013   | PACK10013       | OPENPACK_V4          |
| 10014   | PACK10014       | OPENPACK_V4          |
| 10015   | XMAS '25 Floppy | OPENPACK_V4          |
| 10016   | PACK10016       | ACTION_PACKS         |
| 10018   | PACK10018       | OPENPACK_V4          |
| 10019   | PACK10019       | ACTION_PACKS         |
| 1123    | CensorPACK      | ACTION_PACKS         |
| 15010   | Back to Work    | OPENPACK_V4          |
| 15008–15015 (excepto 15010) | — | ACTION_PACKS |

---

*Informe generado a partir de `traitlabold/modules/pack-config.js`, `traitlabold/modules/floppy.js`, `traitlabv4/src/features/packs/hooks/usePacks.ts` y `traitlabv4/src/features/packs/hooks/useOpenPack.ts`.*
