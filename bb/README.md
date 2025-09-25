# Builder Battle - Static Version

Esta es la versión estática de Builder Battle que usa GitHub Pages + Supabase.

## 🚀 Configuración Requerida

### 1. Supabase Configuration

Necesitas configurar las siguientes variables en `config.js`:

```javascript
const SUPABASE_CONFIG = {
    url: 'YOUR_SUPABASE_URL', // Tu URL de Supabase
    anonKey: 'YOUR_SUPABASE_ANON_KEY' // Tu clave anónima de Supabase
};

const ADMIN_ADDRESS = '0x1234567890123456789012345678901234567890'; // Tu dirección admin
```

### 2. GitHub Pages Setup

1. **Habilitar GitHub Pages**:
   - Ve a Settings > Pages en tu repositorio
   - Selecciona "Deploy from a branch"
   - Selecciona la rama `main` y carpeta `/bb`

2. **URL del proyecto**:
   - La URL será: `https://adriangallery.github.io/adrianzero-1/bb/`

### 3. Supabase Database

Asegúrate de que tu base de datos Supabase tenga las siguientes tablas:

#### Tabla `participants`:
```sql
CREATE TABLE participants (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    image TEXT NOT NULL,
    x_profile TEXT DEFAULT '',
    votes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Tabla `votes`:
```sql
CREATE TABLE votes (
    id SERIAL PRIMARY KEY,
    voter_address TEXT NOT NULL,
    participant_id INTEGER REFERENCES participants(id),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Supabase RLS (Row Level Security)

Configura las políticas de seguridad:

```sql
-- Permitir lectura pública de participantes
CREATE POLICY "Allow public read access to participants" ON participants
    FOR SELECT USING (true);

-- Permitir inserción/actualización de participantes (solo para admins)
CREATE POLICY "Allow admin to manage participants" ON participants
    FOR ALL USING (true);

-- Permitir lectura pública de votos
CREATE POLICY "Allow public read access to votes" ON votes
    FOR SELECT USING (true);

-- Permitir inserción de votos
CREATE POLICY "Allow vote insertion" ON votes
    FOR INSERT WITH CHECK (true);

-- Permitir eliminación de votos (para limpiar)
CREATE POLICY "Allow vote deletion" ON votes
    FOR DELETE USING (true);
```

### 5. CORS Configuration

En Supabase Dashboard > Settings > API:
- Añade `https://adriangallery.github.io` a los dominios permitidos

## 🔧 Funcionalidades

- ✅ **Votación**: Los usuarios pueden votar por participantes
- ✅ **Administración**: Los admins pueden añadir/eliminar participantes
- ✅ **Persistencia**: Todo se guarda en Supabase
- ✅ **Compartir**: Páginas individuales para cada participante
- ✅ **Meta tags**: Optimizado para redes sociales

## 📁 Estructura de Archivos

```
bb/
├── index.html              # Página principal
├── app-static.js           # Lógica de la aplicación
├── config.js              # Configuración de Supabase
├── generate-pages.js      # Script para generar páginas de participantes
└── README.md              # Este archivo
```

## 🚀 Deployment

1. Configura las variables en `config.js`
2. Sube los archivos a GitHub
3. Habilita GitHub Pages
4. ¡Listo! Tu aplicación estará disponible en GitHub Pages

## 🔄 Migración desde Vercel

Esta versión elimina:
- ❌ API endpoints de Vercel
- ❌ Dependencias de Node.js
- ❌ Lógica de backend compleja

Y reemplaza con:
- ✅ Supabase Client directo
- ✅ Páginas estáticas
- ✅ JavaScript puro en el frontend