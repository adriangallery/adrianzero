# Configuración de Supabase para Builder Battle

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

### Tabla 1: participants
```sql
CREATE TABLE participants (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  image TEXT NOT NULL,
  x_profile TEXT DEFAULT '',
  votes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabla 2: votes
```sql
CREATE TABLE votes (
  id SERIAL PRIMARY KEY,
  voter_address TEXT NOT NULL,
  participant_id INTEGER REFERENCES participants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabla 3: winners
```sql
CREATE TABLE winners (
  id SERIAL PRIMARY KEY,
  participant_id INTEGER REFERENCES participants(id),
  participant_name TEXT NOT NULL,
  participant_image TEXT NOT NULL,
  participant_x_profile TEXT DEFAULT '',
  total_participants INTEGER NOT NULL,
  total_votes INTEGER NOT NULL,
  drawn_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🎯 Paso 4: Insertar Datos Iniciales

```sql
INSERT INTO participants (id, name, image, x_profile, votes) VALUES
(1, 'Builder Alpha', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmY2YjM1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkFscGhhPC90ZXh0Pjwvc3ZnPg==', '@builderalpha', 0),
(2, 'Builder Beta', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMDBmZjg4Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkJldGE8L3RleHQ+PC9zdmc+', '@builderbeta', 0);
```

## 🎯 Paso 5: Configurar en Vercel

1. Ve a Vercel Dashboard → tu proyecto → Settings → Environment Variables
2. Añade estas variables:
   - **Name**: `SUPABASE_URL` **Value**: [tu Project URL]
   - **Name**: `SUPABASE_ANON_KEY` **Value**: [tu anon public key]
3. Marca todas las opciones: Production, Preview, Development
4. Haz clic en "Save"

## 🎯 Paso 6: Desplegar

1. Haz commit de los cambios:
   ```bash
   git add .
   git commit -m "Add Supabase integration"
   git push
   ```

2. Vercel desplegará automáticamente

## ✅ Verificar que Funciona

1. Ve a tu aplicación en Vercel
2. Abre Developer Tools (F12) → Console
3. Intenta añadir un participante
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
