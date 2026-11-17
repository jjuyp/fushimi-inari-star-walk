# V3.5.1 continuous background

The supplied screenshot was reproduced at overview yaw2.8. The140-degree photo arc previously faded on its vertical edges into a different sky colour. It now closes around360degrees with matching seam positions/UVs and mirrored photographic extension. A continuous perimeter skirt begins at the actual DEM edge, descends into the basin and fades at its outer edge. Background visibility no longer abruptly switches off at low station elevation.

No new large image or model was added. The same preview/full Kyoto photograph is reused, with386 backdrop vertices and a2313-vertex decorative skirt using existing forest textures. The skirt adds one draw call and does not modify walking elevations or collision bodies. Extension directions are illustrative mirrored scenery, not actual360-degree Kyoto photography or a surveyed new map.

Browser comparison includes the two old photo endpoints, a full directional sweep, clear/cloudy/rain/mist, dusk/night/day, Yotsutsuji, station height,390px portrait and direct-file offline rendering. Geometry/UV closure is checked alongside actual screenshots and console errors. Local, offline and published reports distinguish their execution environment; simulated Chromium mobile is not physical iPad/Safari validation. No new FPS or totalRAM/VRAM reduction claim is made.

The published site passed the same sweep/weather/station/mobile checks after deployment propagation. The first immediate check received an older module while the HTML was already current; follow-up requests confirmed revision3.5.1 and the360-degree geometry on the public URL. Final public screenshots match the corrected offline view. No JavaScript/WebGL errors were recorded in the final run.
