# V3.1 licensed assets

Verified 2026-10-26. Photo derivatives remain under their stated photo licenses. These attribution notices do not imply endorsement. Runtime assets are local files, with no CDN dependency.

## Kyoto real panorama
- Runtime `dist/assets/v3.1/kyoto-inari-skyline.webp`: 4096 x 1024, 572036 bytes. Cropped to the upper city/mountain horizon and resized/re-encoded.
- Optional reference `reference/v3.1-assets/kyoto-inari-panorama.webp`: 4096 x 1961, 1492440 bytes. Full photo resized/re-encoded; contains foreground foliage. Not shipped by runtime.
- Original `reference/v3.1-assets/kyoto-inari-panorama-original.jpg`: 4572 x 2189, 5348218 bytes.
- Title: Kyoto Blick vom Schrein Fushimi-Inari-taisha auf Kyoto 2.
- Photographer: Zairon, 2016-09-03.
- Source: https://commons.wikimedia.org/wiki/File:Kyoto_Blick_vom_Schrein_Fushimi-Inari-taisha_auf_Kyoto_2.jpg
- License: CC BY-SA 4.0 https://creativecommons.org/licenses/by-sa/4.0/
- Photo derivatives are offered under CC BY-SA 4.0. The photograph is a finite wide view, not a full 360-degree panorama. Do not imply an exact surrounding photographic reconstruction.

## Real shop facade atlas
- Runtime `dist/assets/v3.1/shop-facade-atlas.webp`: 2048 x 2048, 500996 bytes, 2 x 2 cells of 1024 pixels.
- Cell coordinates in image-space, top-to-bottom: 0 top-left upper wooden windows; 1 top-right upper wooden windows; 2 bottom-left ground-floor grilles and plaster; 3 bottom-right shop entrance, merchandise display and vending machine. Facade crops have perspective correction; no sky or road is part of these tiles. Source strings/signs remain part of the original real business photograph.
- Original `reference/v3.1-assets/nezameya-original.jpg`: 3888 x 2592, 4305387 bytes.
- Title: ねざめ家 清酒 菊正宗 (8785495478).
- Photographer: Richard, enjoy my life!, 2013-03-26.
- Source: https://commons.wikimedia.org/wiki/File:%E3%81%AD%E3%81%96%E3%82%81%E5%AE%B6_%E6%B8%85%E9%85%92_%E8%8F%8A%E6%AD%A3%E5%AE%97_(8785495478).jpg
- Original Flickr source: https://www.flickr.com/photos/ladyous/8785495478/
- License: CC BY-SA 2.0 https://creativecommons.org/licenses/by-sa/2.0/
- This rectified and atlas-packed photo derivative is offered under CC BY-SA 2.0.
- Preparation reproducible with `reference/v3.1-assets/prepare-photo-assets.py` (Pillow and NumPy).

## Reference-only street photo (not presently a runtime texture)
- `reference/v3.1-assets/inari-street-original.jpg`: 5472 x 3648, 5460960 bytes.
- Streets near Fushimi Inari-taisha, May 2017, by Celuici, 2017-05-25.
- Source: https://commons.wikimedia.org/wiki/File:Streets_near_Fushimi_Inari-taisha,_May_2017.jpg
- License CC BY-SA 3.0: https://creativecommons.org/licenses/by-sa/3.0/

## Detailed clothed people
All three are static posed meshes, not rigged or walk-animated. Their human anatomy, clothing, faces and skin come from MakeHuman assets adapted and released by Innerscene under CC0. Preserve that distinction in product descriptions. Clones should share geometry and materials. Good for stall keepers and standing visitors; root translation alone is not a real walking animation.

- `dist/assets/v3.1/mei-vendor.glb`: 994532 bytes, 21095 triangles, 8 meshes, 8 materials, 9 embedded images. Woman with striped blouse/skirt, hands in front.
  - Source: https://www.innerscene.com/tools/library/3d-parts/mei-3d-person-receptionist-d36b82b9
  - Download: https://www.innerscene.com/api/library/mei-3d-person-receptionist-d36b82b9/download
  - Original `reference/v3.1-assets/mei-original.glb`: 16455320 bytes, 117224 triangles.
- `dist/assets/v3.1/jordan-visitor.glb`: 1078532 bytes, 20723 triangles, 8 meshes, 8 materials, 9 embedded images. Athletic woman with sports top/leggings/shoes, hands on hips.
  - Source: https://www.innerscene.com/tools/library/3d-parts/jordan-3d-person-athlete-a0770454
  - Download: https://www.innerscene.com/api/library/jordan-3d-person-athlete-a0770454/download
  - Original `reference/v3.1-assets/jordan-original.glb`: 16159404 bytes.
- `dist/assets/v3.1/amara-visitor.glb`: 994192 bytes, 21096 triangles, 8 meshes, 8 materials, 9 embedded images. Woman in striped blouse and skirt, relaxed standing pose.
  - Source: https://www.innerscene.com/tools/library/3d-parts/amara-3d-person-standing-office-2a16c294
  - Download: https://www.innerscene.com/api/library/amara-3d-person-standing-office-2a16c294/download
  - Original `reference/v3.1-assets/amara-original.glb`: 17419096 bytes.

- License for all three: CC0 1.0 https://creativecommons.org/publicdomain/zero/1.0/ . No attribution legally required; courtesy attribution Innerscene / MakeHuman.
- Optimization: official meshoptimizer/gltfpack 1.3, `-si 0.18 -se 0.006 -tl 1024 -tw -kn -km`, limits image dimension to 1024, WebP encodes images and reduces geometry to ~18% with bounded error. Outputs use KHR_mesh_quantization and EXT_texture_webp; no meshopt or Draco decoder required. Reports are stored alongside originals.
- Tool source / MIT license: https://github.com/zeux/meshoptimizer (release https://github.com/zeux/meshoptimizer/releases/tag/v1.3).
- Loader: `dist/vendor/GLTFLoader.js`, copied from existing installed Three.js 0.180.0, import path adjusted to local BufferGeometryUtils.js. MIT license already retained at `dist/vendor/THREE-LICENSE.txt`.

## Deer and crow
- `dist/assets/v3.1/deer.glb`: 1007564 bytes, 2096 triangles. Rigged and animated: Walk, Idle, Eating, Gallop and others. No required extensions.
  - Author Quaternius. License CC0 1.0 https://creativecommons.org/publicdomain/zero/1.0/
  - Source https://poly.pizza/m/T6Cs7tmMHJ
  - Download https://static.poly.pizza/4b6c2a41-43c7-404c-ae37-e8c4645ff93b.glb
  - Complete animal shape, stylized low-poly model; avoid claiming photogrammetric deer realism.
- `dist/assets/v3.1/crow.glb`: 41136 bytes, 386 triangles. Static black flying bird/crow shape. No required extensions.
  - Author Poly by Google. Title Bird.
  - License CC BY 3.0 https://creativecommons.org/licenses/by/3.0/
  - Source https://poly.pizza/m/8Ph79kHbt9s
  - Download https://static.poly.pizza/990167ef-5943-4198-9da5-e6b2ff2bcd69.glb
  - Unmodified downloaded geometry; if animated by root transform, credit changes as animated placement.

## Japanese instrumental music
Use HTMLAudioElement with preload=none and only one active track, avoiding full PCM decoding of all tracks. Stream on explicit audio enable; pause on document hidden. Do not autoplay before user interaction.

- `dist/assets/v3.1/hot-springs-town.mp3`: 1920869 bytes, 2:40.03.
  - Hot Springs Town by Kistol. CC0 1.0 https://creativecommons.org/publicdomain/zero/1.0/
  - Source https://opengameart.org/content/hot-springs-town
  - Download https://opengameart.org/sites/default/files/hot_spring_town.mp3
- `dist/assets/v3.1/kawarayu.mp3`: 3512782 bytes, 4:52.70. Converted from original OGG for iOS compatibility.
  - Kawarayu by Yubatake / OpenGameArt.org. CC BY 4.0 https://creativecommons.org/licenses/by/4.0/
  - Source https://opengameart.org/content/kawarayu
  - Download https://opengameart.org/sites/default/files/Kawarayu.ogg
  - Shamisen-led enka/folk ballad, 80 BPM, 4:52. Author asks to mention username and OpenGameArt.
- `dist/assets/v3.1/arukas-bloom.mp3`: 3808520 bytes, 4:28.25.
  - Arukas Bloom by TAD / Tadon. CC BY 4.0 https://creativecommons.org/licenses/by/4.0/
  - Source https://opengameart.org/content/arukas-bloom
  - Download https://opengameart.org/sites/default/files/arukas_bloom_0.mp3
  - Requested artist attribution URL: https://www.youtube.com/c/Tadon
- Runtime music is re-encoded to 96 kbps stereo MP3, 44.1 kHz, with libmp3lame / FFmpeg 7.1. No music is cut; originals are retained as `reference/v3.1-assets/hot-springs-town-original.mp3`, `arukas-bloom-original.mp3`, and `kawarayu-original.ogg`. Total runtime music: 9242171 bytes (9.24 MB); original audio total 18519056 bytes, a 50.1% download-size reduction. The MP3 derivatives retain their respective CC0 or CC BY 4.0 licenses. Music is instrumental, not commercial Japanese pop recordings. Audio decoded to completion without errors; see `music-validation.json`.

## Optional product photo references
Not yet used by runtime. Both photographs by Kykk wiki under CC0 1.0.
- `reference/v3.1-assets/kitsune-senbei-original.jpg`: actual fox-shaped senbei.
  - https://commons.wikimedia.org/wiki/File:Kitsune_senbei.jpg
- `reference/v3.1-assets/suzume-yakitori-original.jpg`: actual roast sparrow skewers (not generic chicken yakitori).
  - https://commons.wikimedia.org/wiki/File:Suzume_yakitori.jpg


## High-quality GPU texture derivatives
- Added KTX2 derivatives for 16 existing PBR maps, two real photo textures, and three baked human atlases. All preserve source pixel dimensions.
- Basis Universal 1.16.3 UASTC level 3, no RDO, full high-quality mip chain, lossless Zstandard container compression. Normal/roughness/height maps use linear handling; albedo/photos/human colors use sRGB.
- These are lossy high-quality GPU block-compressed derivatives, not mathematically lossless images. Attribution and licenses of the original images continue to apply to each derivative, including the photo CC BY-SA licenses above. Source originals remain in reference or alongside retained runtime originals.
- The three baked human atlases (mei-atlas.ktx2, jordan-atlas.ktx2, amara-atlas.ktx2) are CC0 derivatives of their respective Innerscene / MakeHuman images. Original baked PNG atlases are retained in reference/v3.1-assets.
- Conversion reports, source-to-output manifest and detailed loader guidance: reference/v3.1-assets/ktx-report.json, dist/assets/ktx-manifest.json, reference/v3.1-assets/KTX2-USAGE.md.


## Final runtime corrections
- 19 KTX2 maps are enabled by runtime manifest. The two granite maps (1024x683 color, 512x342 height) are intentionally excluded because BC7 texture upload on the tested GPU rejected non-four-aligned base dimensions. Their original JPG/PNG remain the runtime source; no resize or padding was applied. Their KTX2 files remain reference outputs only.
- Final human atlases were regenerated with original alpha masks and material vertex colors, with names corrected to match their GLB models. The latest mei/jordan/amara KTX2 files preserve full alpha (source alpha range 0..255) and are encoded without Y flipping. No -no_alpha flag is used for these three textures. All 12 mip levels report alpha present. Source PNG files were moved to reference/v3.1-assets and removed from runtime dist to avoid embedding unused PNG payloads.

Deployment repair, 2026-10-26: mei-atlas.ktx2 includes 40 bytes of inari_release KTX2 metadata; all compressed mip payloads are unchanged (1228548 -> 1228588 bytes). This changes storage identity only, not image pixels or licensing.
