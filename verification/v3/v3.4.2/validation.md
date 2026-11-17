# V3.4.2 Music and planted borders

Four new complete tracks, seven total. New runtime MP3 files total 9,425,431 bytes. They are loaded only after explicit playback; no MP3 requests occurred before audio enable in the verified hosted-form build. A single HTMLAudioElement is used; there is no pre-decoding of the whole playlist into PCM. Track changes fade out/in. All seven songs reached playable state and advancing currentTime. Subjective warmth/style was selected from creator descriptions and genre, not a completed human listening panel.

New assets: Sunset Plains and Yoiyami Core Theme - Deep Blue Ambient Piano by Yoiyami, peaceful town by haruta (CC0); Yuki by AstralTempest (OGA-BY3.0). Source URLs, full attribution, encoding/loudness changes and license text are shipped in dist/assets/v3.1/CREDITS.md. New tracks normalized for gentle playback, and old-track playback gains are balanced against measured integrated loudness. See music-sources.json and music-loudness.json.

Garden: 1439 new plant clumps, including 302 potted plants. Four species classes: grass, fern, shrub, seasonal flowers. Allocation: {'station': 339, 'precinct': 750, 'mountain': 350}. Four instanced plant groups plus two pot/soil groups, a single authored 512x512 RGBA atlas (about1.33MiB with mipmaps before driver overhead), distance/frustum culling updated every450ms. No new textures/models downloaded for plants. Paving triangle checks, route clearance and building footprints reject unsuitable roots. Zero path or rendered-pavement root intrusions in QA. Plants are decorative and do not add movement colliders.

Same Intel UHD, bundled Chromium,1920x1080 DPR1, reduced motion, auto preset. Each view6s settle+5s actual render intervals. Only one browser benchmark at a time; music muted in these frame-rate samples. V3.4.1 baseline compared with finalV3.4.2:

| Place | Before FPS | After FPS | After calls |
|---|---:|---:|---:|
| gate | 25.3 | 25.3 | 644 |
| torii | 45.2 | 44.9 | 223 |
| yotsu | 43.0 | 43.1 | 230 |

Cold ready: 7.32s -> 7.37s on localhost. This is one run per version and not an internet-load prediction or statistical proof of identical performance. New initial encoded resources: 21,933,339 bytes. Audio streaming requests and later background assets are excluded from this initial boundary.

Offline HTML is about37.16MB, larger than V3.4.1 because it embeds the additional full music tracks; it does not receive the same on-demand network-size benefit as the hosted build. No totalRAM/VRAM reduction percentage is claimed. Native iPad hardware and a subjective listening review remain untested.

Final checks: all seven distinct currentSrc files were confirmed after fade transitions, not only the playlist index. Standalone HTML plays embedded new music with seven entries and zero external requests, exports2560px photos, traverses and switches seasons. Washing rig regression: left/right hands, cupping, ladle rinse, cancellation, travel reset and simulated mobile passed. NoJS/WebGL errors observed.
