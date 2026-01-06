SVG Mini-Game (Cigarette)

Quick start:
1) Put all files in the same folder.
2) Open index.html.

If your browser blocks loading local SVG files, run a local server:
- Python:  python -m http.server
- Then open: http://localhost:8000

Controls:
- Click cigarette area: Light/Extinguish
- Hold click (or hold on mobile): Puff
- Space: Puff (also lights if OFF)
- R: Reset

Background:
- Use the Background selector in the HUD.
- Your choice is saved in localStorage.

Edit hotspot:
- index.html -> .hitbox { left/top/width/height } in CSS (percentages).


V2 Notes:
- Tap/click the cigarette to Light/Extinguish.
- Hold to Puff (also Space).
- Added OFF + lighting frames and 8-frame smoke loop.
