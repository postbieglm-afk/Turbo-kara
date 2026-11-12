# Turbo Kára

Pouliční závody na tři kola v Tokiu a v Brně. Webová hra (HTML + JavaScript, 3D přes three.js).

**Hrát:** https://postbieglm-afk.github.io/Turbo-kara/

## Soubory
- `index.html` – kostra stránky a pořadí skriptů (pořadí neměnit, skripty sdílejí jeden globální prostor)
- `style.css` – vzhled
- `core.js`, `game.js`, `world.js`, `tracks.js`, `terrain.js`, `draw2d.js`, `hud.js`, `net.js`, `web-room.js`, `main.js` – logika
- `audio.js` (zvukové efekty a motor), `music.js` a `music-data.js` (hudba a její noty) – zvuk
- `menu.js`, `menu-art.js`, `menu-maps.js` – menu (obrázky ovládání a mapy jsou zvlášť)
- `scene3d.js`, `scene-geo.js`, `scene-render.js` – 3D scéna (sestavení, geometrie domů, vykreslení)
- `brno-data.js` – data Brna

## Zdroje dat
- Půdorysy budov v Brně: © přispěvatelé OpenStreetMap, licence ODbL (https://www.openstreetmap.org/copyright)
- Výšky terénu: AWS Terrain Tiles / Mapzen (EU-DEM, SRTM)
- 3D knihovna: three.js (licence MIT)

Vývojová verze vzniká v Claude artifactu, sem se nahrávají otestované verze.
