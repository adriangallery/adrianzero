-- Builder Battle - Supabase Setup
-- Ejecutar estos comandos en el SQL Editor de Supabase

-- 1. Crear tabla participants si no existe
CREATE TABLE IF NOT EXISTS participants (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    image TEXT NOT NULL,
    x_profile TEXT DEFAULT '',
    votes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Crear tabla votes si no existe
CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    voter_address TEXT NOT NULL,
    participant_id INTEGER REFERENCES participants(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Habilitar RLS
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- 4. Políticas para participants
-- Permitir lectura pública
CREATE POLICY "Allow public read access to participants" ON participants
    FOR SELECT USING (true);

-- Permitir inserción/actualización (para admins)
CREATE POLICY "Allow insert participants" ON participants
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update participants" ON participants
    FOR UPDATE USING (true);

CREATE POLICY "Allow delete participants" ON participants
    FOR DELETE USING (true);

-- 5. Políticas para votes
-- Permitir lectura pública
CREATE POLICY "Allow public read access to votes" ON votes
    FOR SELECT USING (true);

-- Permitir inserción de votos
CREATE POLICY "Allow vote insertion" ON votes
    FOR INSERT WITH CHECK (true);

-- Permitir eliminación de votos (para limpiar)
CREATE POLICY "Allow vote deletion" ON votes
    FOR DELETE USING (true);

-- 6. Configurar CORS (en Dashboard > Settings > API)
-- Añadir estos dominios a "Site URL" y "Additional redirect URLs":
-- https://adriangallery.github.io
-- https://adriangallery.github.io/adrianzero-1/bb/

-- 7. Insertar datos de prueba (opcional)
INSERT INTO participants (name, image, x_profile, votes) VALUES
('PinkGUY', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', '@adriancerda', 0),
('HeadacheGUY', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', '@adriancerda', 0)
ON CONFLICT DO NOTHING;
