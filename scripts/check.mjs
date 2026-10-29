import {readdirSync,readFileSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const files=readdirSync('dist').filter(f=>f.endsWith('.js')).map(f=>'dist/'+f).concat('dist/vendor/SMAAPass.js');
for(const file of files){const r=spawnSync(process.execPath,['--check',file],{stdio:'inherit'});if(r.status)process.exit(r.status);}
const html=readFileSync('dist/index.html','utf8');if(!html.includes('src="experience.js"')||!html.includes('V3.1'))throw Error('Wrong release entrypoint');
for(const file of ['dist/district-data.js','dist/foliage-depth.js','dist/vendor/SMAAShader.js','dist/assets/CREDITS.md','伏見稻荷・星旅.html'])if(!existsSync(file))throw Error('Missing artifact: '+file);
console.log(`PASS ${files.length} modules and V3.1 artifact entrypoints`);
