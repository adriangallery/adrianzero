SVG Mini-Game (Cigarette) — OpenSea-friendly single file

What changed vs v1:
- All frames are embedded inline (no external .svg files).
- Transparent pixels were stripped to keep the file compact.
- Added "consumption": the cigarette shrinks as HP goes down.

Controls:
- Click cigarette area: Light / Extinguish
- Hold click (or hold on mobile): Puff
- Space: Puff (also lights if OFF)
- R: Reset

OpenSea notes:
- Use this file as your animation_url target (served as Content-Type: text/html).
- Avoid relative assets; OpenSea may mirror the HTML and break sibling file paths.
- Keep your metadata 'image' as a static preview (PNG/SVG) for thumbnails.
