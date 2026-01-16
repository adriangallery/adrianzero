# AdrianZERO Infinite Tunnel

Un túnel 3D infinito interactivo que muestra traits y drops de AdrianZERO de forma inmersiva.

## Características

- **Túnel 3D Infinito**: Geometría de túnel que se extiende infinitamente usando three.js
- **Display de Traits**: Texturas de traits/drops aplicadas en las paredes del túnel
- **Partículas**: Sistema de partículas para efectos visuales
- **Controles Interactivos**: 
  - Navegación con mouse (OrbitControls)
  - Ajuste de velocidad con botones o scroll
  - Pausa/Play
  - Reset
- **Animaciones Suaves**: GSAP para transiciones fluidas
- **Iluminación Dinámica**: Efectos de luz que responden a la velocidad

## Tecnologías

- **Three.js**: Renderizado 3D
- **GSAP**: Animaciones suaves
- **OrbitControls**: Controles de cámara

## Uso

Simplemente abre `index.html` en un navegador moderno. El túnel se cargará automáticamente con los traits desde el repositorio de AdrianLAB.

## Controles

- **Mouse**: Arrastra para mirar alrededor
- **Scroll**: Ajusta la velocidad del túnel
- **Botones**: 
  - ⏸/▶: Pausar/Reanudar
  - +/−: Aumentar/Disminuir velocidad
  - ↻: Resetear posición

## Configuración

Edita `config.js` para ajustar:
- Parámetros del túnel (radio, segmentos, velocidad)
- Configuración de cámara
- Iluminación
- Rendimiento

## Rendimiento

El sistema está optimizado con:
- Cache de texturas
- Reutilización de segmentos del túnel
- Preload de assets
- Límite de pixel ratio para dispositivos móviles
