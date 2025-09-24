# Configuración de GitHub API para Builder Battle

## Problema
Vercel no permite escribir archivos persistentes en el sistema de archivos. Para solucionar esto, hemos implementado el uso de la GitHub API para actualizar el archivo `data.json` directamente en el repositorio.

## Configuración Requerida

### 1. Crear un Personal Access Token de GitHub

1. Ve a GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Haz clic en "Generate new token (classic)"
3. Dale un nombre descriptivo como "Builder Battle API"
4. Selecciona los siguientes permisos:
   - `repo` (Full control of private repositories)
   - `public_repo` (Access public repositories)
5. Copia el token generado

### 2. Configurar en Vercel

1. Ve a tu proyecto en Vercel Dashboard
2. Ve a Settings → Environment Variables
3. Añade una nueva variable:
   - **Name**: `GITHUB_TOKEN`
   - **Value**: [tu token de GitHub]
   - **Environment**: Production, Preview, Development

### 3. Verificar la configuración

Una vez configurado, la API debería poder:
- ✅ Añadir participantes
- ✅ Registrar votos
- ✅ Eliminar participantes
- ✅ Dibujar ganadores
- ✅ Resetear datos

## Estructura del archivo data.json

El archivo se actualiza automáticamente con la siguiente estructura:

```json
{
  "participants": [
    {
      "id": 1,
      "name": "Builder Name",
      "image": "data:image/svg+xml;base64,...",
      "xProfile": "@username",
      "votes": 0
    }
  ],
  "votes": {
    "0x...": 1
  },
  "voters": ["0x..."],
  "winners": [],
  "lastUpdated": "2024-01-01T00:00:00.000Z"
}
```

## Troubleshooting

### Error: "GITHUB_TOKEN environment variable not set"
- Verifica que hayas configurado la variable de entorno en Vercel
- Asegúrate de que el token tenga los permisos correctos

### Error: "GitHub API error: 401 Unauthorized"
- Verifica que el token sea válido y no haya expirado
- Asegúrate de que el token tenga permisos de escritura en el repositorio

### Error: "GitHub API error: 404 Not Found"
- Verifica que el repositorio y la ruta del archivo sean correctos
- Asegúrate de que el archivo `data.json` exista en el repositorio
