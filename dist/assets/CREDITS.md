# 地理資料、素材與生成紀錄

## 地理資料

© [OpenStreetMap contributors](https://www.openstreetmap.org/copyright)，資料取得日 2026-10-25。

`map-data.js` 中 buildings、paths、water、gates、pois、routes 的 OSM 衍生資料依 [Open Database License 1.0](https://opendatacommons.org/licenses/odbl/1-0/) 提供；可從可讀的 JavaScript 模組直接取得座標資料。座標以緯度 34.967108、經度 135.7728 為原點，公尺近似投影，x 向東、z 向南。參考擷取範圍為緯度 34.963–34.974、經度 135.768–135.788。POI 名稱與位置另對照官方境內圖；路線使用圖節點的最短路徑，到訪點選門前公共節點。製備腳本為 `scripts/prepare-map.py`。

高程：出典：[地理院タイル（國土地理院）](https://maps.gsi.go.jp/development/ichiran.html)，DEM5A PNG，z=15，x=28741–28743、y=12982–12983，2026-10-25 取得。依 [國土地理院內容利用規約](https://www.gsi.go.jp/kikakuchousei/kikakuchousei40182.html) 標示出處。作品將來源取樣到 4m 場景網格，不代表來源解析度提升為 4m；高度減去 39.8m 場景基準。這不是完整精密測繪。

建築參考：[官方境內圖](https://inari.jp/en/map/)、[樓門](https://inari.jp/en/map/spot_02/)、[本殿](https://inari.jp/en/map/spot_03/)、[山內圖](https://inari.jp/trip/map01/)。網站照片僅在本機參考比對，沒有隨作品散布，也未將照片當作建築貼圖。

使用者風格參考影片：https://youtube.com/shorts/FizmnlAdR8Q 。

## PBR 表面

[Poly Haven](https://polyhaven.com/license)：CC0。使用 japanese_stone_wall、japanese_cedar_bark、japanese_cedar_planks、forest_floor 的 albedo、OpenGL normal、roughness 貼圖。來源檔案 URL 見 `polyhaven-sources.json`；圖片經縮放及 JPEG 壓縮。色彩貼圖採 sRGB，法線與粗糙度維持線性數值。

## 模型程式與 GitHub 技能

- [Three.js](https://github.com/mrdoob/three.js)，0.180，MIT；授權見 `vendor/THREE-LICENSE.txt`。
- [dgreenheck/ez-tree](https://github.com/dgreenheck/ez-tree)，npm `@dgreenheck/ez-tree` 1.1.0，MIT；樹幹、枝葉幾何與 pine／oak 透明葉片。授權見 `vendor/EZ-TREE-LICENSE.txt`。作品以自己的杉木 PBR 表面替代套件樹皮，建立遠近兩組幾何。
- [CloudAI-X/threejs-skills](https://github.com/CloudAI-X/threejs-skills)，MIT，commit `0e181866f095b5f06d005133876e926515390d95`。本次讀取並應用 geometry、materials、lighting、loaders、postprocessing、performance 技能，未將技能指令當作可執行遠端程式。詳見 `vendor/GITHUB-SKILLS.txt`。

神社、鳥居、角色及細部使用本作品程式建模。授權清楚的森林生成器與 PBR 素材改善幾何和表面，但不代表取得了伏見稻荷整座實景掃描模型。

## AI 生成紋理

工具路徑：內建 `image_gen`，未使用 CLI／API fallback。最終圖片複製進專案，不依賴 Codex 圖片目錄執行。衍生高度圖是從成品亮度製作的近似凹凸遮罩，不是實測高度。

1. 檜皮：`assets/roof-cypress-color.jpg`、`assets/roof-cypress-height.png`。
   最終 prompt 規格：seamless square PBR albedo texture of traditional Japanese shrine hinoki cypress bark roofing; densely layered very thin horizontal bark strips; warm dark chestnut brown, fine natural fiber variation, weathered subtle detail; flat even lighting, orthographic top view; no roof beams, no ridge, no thatch, no perspective, no cast shadows, no text.
   原始生成檔：`C:/Users/shang/.codex/generated_images/01a17255-fe08-7503-a2d1-c137dfcc74e5/exec-546ec760-50e6-41ac-a210-5cb8d09083fa.png`。

2. 石鋪：`assets/granite-paving-color.jpg`、`assets/granite-paving-height.png`。
   最終 prompt 規格：seamless square neutral gray Japanese shrine granite paving albedo; rectangular stone slabs in staggered rows, fine realistic mineral grain, subtle stone-to-stone tonal variation and narrow dark joints; flat even lighting, orthographic top view; no perspective, no objects, no vegetation, no cast shadows, no text.
   原始生成檔：`C:/Users/shang/.codex/generated_images/01a17255-fe08-7503-a2d1-c137dfcc74e5/exec-21917f5e-9e07-4af9-9e0a-59dde709454b.png`。

紋理與凹凸不能取代真實檜皮或石材掃描；畫面應按作品實際渲染效果判斷。

## V2.1 程式資產

`flora.js` 以 Canvas 路徑生成五瓣櫻花、掌狀鋸齒楓葉與單瓣花瓣貼圖，使用本地 EZ-Tree 分枝幾何、實例化與遠近兩級細節。這些貼圖沒有另外下載圖片，也不是實景攝影。

`foxes.js` 以本作品幾何建立 8 隻狐狸：橘棕毛、白口鼻／胸毛／尾尖、尖耳與黑腳，身體、尾巴、四腳分開動畫，依公開參道巡遊並使用同一地面／碰撞系統。狐狸與季節植栽為藝術情境。

## V2.2 抗鋸齒

`vendor/FXAAShader.js` 來自 Three.js r180 官方套件，MIT，來源保留在檔頭與 THREE-LICENSE.txt。作品將官方 FXAA 函式整合進最後輸出 pass，保留單次色調映射／色彩空間轉換；HDR 目標採 MSAA。花葉材質使用 alpha-to-coverage，不使用時間性雜訊濾波。

## V2.3 SMAA

新增 Three.js r180 官方 `SMAAPass.js`、`SMAAShader.js`、`Pass.js`，同屬 MIT，授權見 `vendor/THREE-LICENSE.txt`。SMAA 來源與原始演算法參考保留在程式檔頭；lookup PNG 為官方 pass 中內嵌的資料。此版本將邊緣與權重中間目標改為 8-bit 以降低頻寬；主色彩維持線性 HDR，最後才做色調映射與輸出轉換。

## V3.0 建築與周邊擴充 / 2026-10-26

- 車站、周邊道路、鐵路、水道及町屋建築輪廓：沿用本作品保留的 OpenStreetMap 2026-10-25 快照，ODbL，© OpenStreetMap contributors。`scripts/prepare-district.mjs` 重建 `district-data.js`。JR 稻荷站與京阪伏見稻荷站分立；站點節點是站區位置，遊玩位置選公共道路出口。
- 樓門／本殿形制參考：[文化廳樓門資料](https://online.bunka.go.jp/heritages/detail/232051)、[京都市本殿與向拜說明](https://ja.kyoto.travel/tourism/single01.php?category_id=7&tourism_id=448)、[神社官方 VR](https://inari.jp/vr/)。本殿長前伸流造與現代內拜殿唐破風分立。原官方照片及 3DGS 僅作參考，沒有直接嵌入、擷取或散布其模型。
- 石狐持物參考：[月桂冠伏見稻荷介紹](https://www.gekkeikan.co.jp/enjoy/bunko/inari-momoyama/fushimiinari.html)。面向樓門左狐鑰匙、右狐寶珠。
- 交通與商店街參考：[京都市交通](https://ja.kyoto.travel/feature/traffic/access.php?id=8)、[神社官方周邊圖](https://inari.jp/trip/map02/)、[商店會地圖](https://inari-kyoto.com/map)。商店名稱／招牌、攤販、商品、茶屋家具與點心為本作品程式重建，非每一商戶現場立面與菜單的逐項還原；非店家官方遊戲或訂餐服務。
- 四辻與視野：[神社官方荒神峰說明](https://inari.jp/zh-tw/map/spot_17/)、[商店會山路](https://inari-kyoto.com/modelcourse/route01)。茶屋以仁志むら亭周邊情境參考重建，非精確測繪店面。
- `landscape.js` 的京都盆地、10,400 個遠景建築及西山輪廓為程式美術遠景，朝西／西南布置，不是逐棟京都城市資料。天空保留 Three.js Sky 的散射模型，加入程式雲層、晴／雲／雨／霧的光線與能見度。天氣為手動情境，不是即時天氣資料。
- 招牌共用 Canvas atlas，點心、木牌、御神籤等由本作品幾何建立；未增加無授權外部模型或照片貼圖。
