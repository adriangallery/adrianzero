# PixelLab MCP Configuration

Este repositorio incluye soporte para PixelLab AI, una herramienta de generación de pixel art mediante MCP (Model Context Protocol).

## Configuración en Cursor

Para habilitar PixelLab AI en Cursor, sigue estos pasos:

### Pasos de Instalación:

1. **Abrir configuración de Cursor**
   - Presiona `⌘+,` (Mac) o `Ctrl+,` (Windows/Linux)
   - O ve a: Cursor → Settings

2. **Buscar configuración MCP**
   - En la barra de búsqueda, escribe: `MCP`

3. **Agregar servidor MCP personalizado**
   - Haz clic en el botón **"Add Custom MCP"**

4. **Agregar la configuración**
   - Copia y pega la siguiente configuración:

```json
{
  "mcpServers": {
    "pixellab": {
      "url": "https://api.pixellab.ai/mcp",
      "transport": "http",
      "headers": {
        "Authorization": "Bearer 8411a69d-5e8c-4146-b2a9-c1cf10b674f4"
      }
    }
  }
}
```

5. **Reiniciar Cursor**
   - Cierra y vuelve a abrir Cursor para aplicar los cambios

## Uso

Una vez configurado, podrás usar PixelLab AI para:
- Generar sprites de pixel art
- Crear assets para juegos
- Editar imágenes en estilo pixel art
- Convertir imágenes a pixel art

## Nota de Seguridad

⚠️ **Importante**: El token de autorización está incluido en este archivo de configuración. Si compartes este repositorio públicamente, considera:
- Usar variables de entorno para el token
- O regenerar el token después de compartir el repositorio

## Archivo de Referencia

La configuración completa está disponible en: `.cursor/mcp-pixellab-config.json`
