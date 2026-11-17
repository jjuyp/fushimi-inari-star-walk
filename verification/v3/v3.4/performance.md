# V3.4.0 Integrated GPU validation

GPU: ANGLE (Intel, Intel(R) UHD Graphics (0x00009A68) Direct3D11 vs_5_0 ps_5_0, D3D11)

Bundled Chromium, Windows, headless, forced low-power GPU, 1920x1080 DPR1, reduced motion. Same fixed viewpoints. Each 6s settles + 5s samples actual SceneRenderer.render intervals, excluding RAF callbacks. No concurrent browser benchmarks. Baseline is V3.3.0 clear; new is V3.4.0 auto. Scene content and camera match; automatic resolution and far LOD differ intentionally.

| View | V3.3 FPS | V3.4 FPS | New render ratio | New calls |
|---|---:|---:|---:|---:|
| gate | 12.2 | 25.3 | 0.55 | 640 |
| torii | 17.9 | 45.6 | 0.55 | 219 |
| yotsu | 16.5 | 43.7 | 0.55 | 228 |

Initial localhost encoded resources: 25,747,335 -> 21,914,534 bytes (14.9% less). Cold-to-ready single-run time: 8.34s -> 7.29s. These are local-server runs, not a prediction for public internet downloads. The full skyline and nearby actors load after this initial boundary.

Offline file: 26,207,672 -> 24,636,104 bytes (6.0% smaller). Gzip is lossless. Most music/photos were already compressed, limiting additional savings. Full ZIP sizes include source and QA and are not page download sizes.

GPU/RAM: no system RAM or actual VRAM reduction percentage was measured. The auto mode removes MSAA scene attachments on Intel and lowers target pixel count; geometry dormancy and compressed GPU texture paths remain in use. Auto still uses half-float HDR to avoid clipped highlights. It does not prove a 30-40% total memory reduction. Some world geometry is still created at startup.

Tests: monotonic loader through 100%, actual 26 queued nearby tasks completed, three human models and four deer preloaded, 4096px skyline substituted, 390px no overflow; full pilgrimage actions and persistence passed; mouse/tablet upward camera and clearance passed; file URL standalone with zero external network requests, 2560px export, reduced motion passed. No JavaScript/WebGL errors observed. Native iPad behavior and every consumer Intel GPU were not tested.

A leaf depth-prepass experiment reduced FPS to about21/37/39 and was not enabled in the released auto preset. Static display batching retained geometry/materials and reduced gate calls from794 to622 in its isolated comparison; final per-tree LOD and prefetch changed counts slightly. No new independent visual score was commissioned; V3.3's art review remains historical evidence only.
