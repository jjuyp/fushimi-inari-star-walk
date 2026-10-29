import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import path from 'node:path';
let esbuild;try{esbuild=await import('esbuild')}catch{esbuild=await import('../tidepool-jelly/node_modules/esbuild/lib/main.js')}
const result=await esbuild.build({entryPoints:['dist/experience.js'],bundle:true,write:false,format:'iife',minify:true,target:'es2022',alias:{three:path.resolve('dist/vendor/three.module.js')},legalComments:'inline'});
const mime={jpg:'image/jpeg',png:'image/png',webp:'image/webp',glb:'model/gltf-binary',mp3:'audio/mpeg'};
function entries(folder,prefix=''){return readdirSync(folder,{withFileTypes:true}).flatMap(e=>e.isDirectory()?entries(path.join(folder,e.name),prefix+e.name+'/'):[{name:prefix+e.name,file:path.join(folder,e.name)}]);}
const assets=Object.fromEntries(entries('dist/assets').filter(e=>mime[e.name.split('.').pop()]).map(e=>[e.name,'data:'+mime[e.name.split('.').pop()]+';base64,'+readFileSync(e.file).toString('base64')]));
const code='globalThis.INARI_ASSETS='+JSON.stringify(assets)+';\n'+result.outputFiles[0].text;
const html=readFileSync('dist/index.html','utf8').replace('<link rel="stylesheet" href="style.css">',()=>'<style>'+readFileSync('dist/style.css','utf8')+'</style>').replace(/<script type="importmap">[\s\S]*?<\/script>/,'').replace('<script type="module" src="experience.js"></script>',()=>'<script>'+code.replaceAll('</script','<\\/script')+'</script>');
const offline=html.replace('href="assets/v3.1/CREDITS.md"','href="data:text/plain;charset=utf-8;base64,'+readFileSync('dist/assets/v3.1/CREDITS.md').toString('base64')+'"');writeFileSync('伏見稻荷・星旅.html',offline);console.log('Created offline HTML: '+Buffer.byteLength(html)+' bytes');
