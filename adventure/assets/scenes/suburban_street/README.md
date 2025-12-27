# Escena: Suburban Street

Esta es una escena de ejemplo. Para que funcione completamente, necesitas:

1. **background.png** - Imagen de fondo panorámica (2400x1350px recomendado)
2. **walkmask.png** - Máscara de colores (mismo tamaño que background)
   - Azul (#0000FF) = Walkable
   - Amarillo (#FFFF00) = Hotspots
   - Magenta (#FF00FF) = Triggers
   - Otros colores = Bloqueado

## Crear máscaras

Puedes crear las máscaras en cualquier editor de imágenes:
- Usa colores sólidos
- Asegúrate de que las regiones de hotspots/triggers estén bien definidas
- El tamaño debe coincidir con el background

## Hotspots definidos

- `hs_mailbox` - Buzón (amarillo en la máscara)

## Triggers definidos

- `tr_to_frontdoor` - Transición a la puerta principal (magenta en la máscara)

