# Configuración de Supabase para Trait Gallery

## 🎯 Paso 1: Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Haz clic en "Start your project"
3. Conecta con GitHub
4. Selecciona **"Supabase Free Plan"**
5. Región: **"Washington, D.C., USA (East)"**
6. Public Environment Variables Prefix: **`VITE_PUBLIC_`**
7. Haz clic en **"Create Database"**

## 🎯 Paso 2: Obtener Credenciales

Una vez creado el proyecto, ve a **Settings → API** y copia:
- **Project URL** (SUPABASE_URL)
- **anon public** key (SUPABASE_ANON_KEY)

## 🎯 Paso 3: Crear las Tablas

Ve a **SQL Editor** en Supabase y ejecuta estos comandos:

### Tabla 1: nft_metadata
```sql
CREATE TABLE nft_metadata (
  id SERIAL PRIMARY KEY,
  token_id INTEGER NOT NULL,
  contract_address TEXT NOT NULL,
  name TEXT,
  description TEXT,
  image_url TEXT,
  image_base64 TEXT,
  attributes JSONB,
  categories TEXT[],
  rarity_score DECIMAL,
  supply INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(token_id, contract_address)
);
```

### Tabla 2: trait_categories
```sql
CREATE TABLE trait_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#00ffff',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabla 3: admin_logs
```sql
CREATE TABLE admin_logs (
  id SERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  details JSONB,
  admin_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabla 4: sync_status
```sql
CREATE TABLE sync_status (
  id SERIAL PRIMARY KEY,
  contract_address TEXT NOT NULL UNIQUE,
  last_sync TIMESTAMP WITH TIME ZONE,
  total_tokens INTEGER DEFAULT 0,
  sync_status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🎯 Paso 4: Insertar Categorías Iniciales

```sql
INSERT INTO trait_categories (name, display_name, description, color) VALUES
('background', 'Background', 'Background traits and environments', '#00ffff'),
('character', 'Character', 'Base character traits', '#ff0088'),
('accessories', 'Accessories', 'Hats, glasses, and other accessories', '#00ff00'),
('clothing', 'Clothing', 'Shirts, jackets, and clothing items', '#ffff00'),
('special', 'Special', 'Rare and special traits', '#ff8800'),
('glitch', 'Glitch', 'Glitch effects and anomalies', '#ff00ff');
```

## 🎯 Paso 5: Configurar en Vercel

1. Ve a Vercel Dashboard → tu proyecto → Settings → Environment Variables
2. Añade estas variables:
   - **Name**: `SUPABASE_URL` **Value**: [tu Project URL]
   - **Name**: `SUPABASE_ANON_KEY` **Value**: [tu anon public key]
   - **Name**: `ALCHEMY_API_KEY` **Value**: [tu Alchemy API key]
3. Marca todas las opciones: Production, Preview, Development
4. Haz clic en "Save"

## 🎯 Paso 6: Configurar RLS (Row Level Security)

```sql
-- Habilitar RLS
ALTER TABLE nft_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE trait_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_status ENABLE ROW LEVEL SECURITY;

-- Políticas para lectura pública
CREATE POLICY "Public read access" ON nft_metadata FOR SELECT USING (true);
CREATE POLICY "Public read access" ON trait_categories FOR SELECT USING (true);

-- Políticas para admin (requiere autenticación)
CREATE POLICY "Admin write access" ON nft_metadata FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin write access" ON trait_categories FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin write access" ON admin_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin write access" ON sync_status FOR ALL USING (auth.role() = 'service_role');
```

## ✅ Verificar que Funciona

1. Ve a tu aplicación en Vercel
2. Abre Developer Tools (F12) → Console
3. Intenta cargar la galería
4. Si no hay errores, ¡funciona!

## 🐛 Troubleshooting

### Error: "Missing Supabase environment variables"
- Verifica que hayas configurado las variables en Vercel
- Asegúrate de haber redesplegado después de añadir las variables

### Error: "relation does not exist"
- Verifica que hayas creado las tablas en Supabase
- Asegúrate de que los nombres de las tablas sean exactos

### Error: "permission denied"
- Verifica que las tablas tengan los permisos correctos
- Ve a Authentication → Policies en Supabase y habilita RLS si es necesario
