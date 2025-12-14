# Setup de Supabase para TraitLABv3

## Descripción

Este documento describe cómo configurar Supabase para el sistema de cache de TraitLABv3, que permite optimizar la carga de datos de wallet y tokens globales.

## Estructura de Base de Datos

### Tabla: `wallet_data`

Almacena datos específicos por wallet (tokens, nombres personalizados).

```sql
CREATE TABLE wallet_data (
    id SERIAL PRIMARY KEY,
    wallet_address TEXT NOT NULL UNIQUE,
    adrianzero_tokens JSONB DEFAULT '[]',
    adrianlab_tokens JSONB DEFAULT '[]',
    custom_names JSONB DEFAULT '{}',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_wallet_data_address ON wallet_data(wallet_address);
CREATE INDEX idx_wallet_data_updated ON wallet_data(last_updated);
```

### Tabla: `global_token_data`

Almacena datos globales compartidos de tokens (nombres, metadata, imágenes).

```sql
CREATE TABLE global_token_data (
    id SERIAL PRIMARY KEY,
    token_id INTEGER NOT NULL,
    contract_type TEXT NOT NULL, -- 'adrianzero' | 'adrianlab'
    name TEXT,
    metadata JSONB,
    image_url TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(token_id, contract_type)
);

CREATE INDEX idx_global_token_data_token ON global_token_data(token_id, contract_type);
CREATE INDEX idx_global_token_data_updated ON global_token_data(last_updated);
```

### Tabla: `wallet_token_mapping`

Relación entre wallets y tokens (para sincronización eficiente).

```sql
CREATE TABLE wallet_token_mapping (
    id SERIAL PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    token_id INTEGER NOT NULL,
    contract_type TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    last_synced TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(wallet_address, token_id, contract_type)
);

CREATE INDEX idx_wallet_token_mapping_wallet ON wallet_token_mapping(wallet_address);
CREATE INDEX idx_wallet_token_mapping_token ON wallet_token_mapping(token_id, contract_type);
```

## Configuración de RLS (Row Level Security)

### Habilitar RLS

```sql
ALTER TABLE wallet_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_token_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_token_mapping ENABLE ROW LEVEL SECURITY;
```

### Políticas para `wallet_data`

```sql
-- Lectura: usuarios pueden leer sus propios datos
CREATE POLICY "Users can read their own wallet data" ON wallet_data
    FOR SELECT USING (true); -- Permitir lectura pública (puede ajustarse según necesidades)

-- Escritura: usuarios pueden actualizar sus propios datos
CREATE POLICY "Users can update their own wallet data" ON wallet_data
    FOR UPDATE USING (true); -- Permitir actualización pública (puede ajustarse según necesidades)

-- Inserción: usuarios pueden insertar sus propios datos
CREATE POLICY "Users can insert their own wallet data" ON wallet_data
    FOR INSERT WITH CHECK (true); -- Permitir inserción pública (puede ajustarse según necesidades)
```

### Políticas para `global_token_data`

```sql
-- Lectura pública
CREATE POLICY "Public read access to global token data" ON global_token_data
    FOR SELECT USING (true);

-- Escritura autenticada (requiere service_role)
CREATE POLICY "Authenticated write access to global token data" ON global_token_data
    FOR ALL USING (auth.role() = 'service_role');
```

### Políticas para `wallet_token_mapping`

```sql
-- Lectura pública
CREATE POLICY "Public read access to wallet token mappings" ON wallet_token_mapping
    FOR SELECT USING (true);

-- Escritura pública (usuarios pueden gestionar sus propios mappings)
CREATE POLICY "Users can manage their own token mappings" ON wallet_token_mapping
    FOR ALL USING (true); -- Permitir gestión pública (puede ajustarse según necesidades)
```

## Configuración en el Código

### Variables de Entorno

Configurar en el servidor o en el código:

```javascript
// En config-keys.js o como variables de entorno
window.SUPABASE_URL = 'https://tu-proyecto.supabase.co';
window.SUPABASE_ANON_KEY = 'tu-anon-key';
```

### Alternativa: Configuración en app.config

```javascript
// En config.js
window.app.config = {
    supabase: {
        url: 'https://tu-proyecto.supabase.co',
        anonKey: 'tu-anon-key'
    }
};
```

## Flujo de Datos

### 1. Carga Inicial

1. Usuario conecta wallet
2. Sistema intenta cargar desde Supabase cache
3. Si existe y es reciente (<24h), usar cache
4. Si no existe o está desactualizado, cargar desde blockchain
5. Actualizar Supabase en background

### 2. Actualización en Background

- Después de cargar desde blockchain, actualizar Supabase
- No bloquea la UI
- Se ejecuta de forma asíncrona

### 3. Sincronización

- Los datos de wallet se sincronizan con datos globales
- Si un token tiene nombre personalizado en `wallet_data`, se usa ese
- Si no, se usa el nombre de `global_token_data`

## Ventajas

1. **Carga más rápida**: Los datos se cargan desde cache local (Supabase) en lugar de blockchain
2. **Menos llamadas a blockchain**: Reduce el número de llamadas a contratos
3. **Datos compartidos**: Los datos globales benefician a todos los usuarios
4. **Actualización en background**: No bloquea la UI durante actualizaciones

## Consideraciones de Seguridad

- Las políticas RLS pueden ajustarse según necesidades de seguridad
- Para producción, considerar autenticación más estricta
- Los datos de wallet son públicos por diseño (puede ajustarse)

## Troubleshooting

### Error: "Supabase client not loaded"

- Verificar que el script `supabase-cache.js` está cargado
- Verificar que la URL y anon key están configuradas correctamente

### Error: "RLS policy violation"

- Verificar que las políticas RLS están creadas correctamente
- Verificar que los permisos son adecuados

### Datos no se actualizan

- Verificar que `last_updated` se actualiza correctamente
- Verificar que la función `isDataRecent()` funciona correctamente

