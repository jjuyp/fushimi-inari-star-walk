const shapes={
 camera:'<rect x="5" y="10" width="30" height="23" rx="5" fill="#c99470"/><path d="M12 10l3-5h10l3 5" fill="#f3d8ab"/><circle cx="20" cy="21" r="8" fill="#65818b" stroke="#fff0cb"/><circle cx="18" cy="19" r="3" fill="#bed7d9" stroke="none"/><circle cx="30" cy="14" r="1" fill="#f6e6bf"/>',
 map:'<path d="M4 9l10-4 12 4 10-4v26l-10 4-12-4-10 4zM14 5v26m12-22v26" fill="#c6d2ad"/><path d="M8 22q8-14 12-3t12-3" stroke="#b44d35" stroke-width="2.5"/>',
 book:'<path d="M6 6q7-3 14 1 7-4 14-1v28q-7-3-14 0-7-3-14 0zM20 7v27" fill="#fff4da"/><path d="M11 13h5m-5 5h5m9-5h5m-5 5h5M11 24h5" stroke="#8b5d39"/><path d="M27 5v16l3-3 3 3V5" fill="#ad4935" stroke="#ad4935"/>',
 settings:'<path d="M16 5h8l1 5 4 2 5-2 4 7-4 4v4l4 3-4 7-5-2-4 2-1 5h-8l-1-5-4-2-5 2-4-7 4-3v-4l-4-4 4-7 5 2 4-2z" transform="translate(2,-2) scale(.9)"/><circle cx="20" cy="20" r="7"/>',
 bag:'<path d="M13 10q-3-9 7-5 10-4 7 5l-2 3q11 6 10 18-15 7-30 0-1-12 10-18zM12 13h16"/><path d="M17 19l3 5 3-5m-3 5v5"/>',
 torii:'<path d="M3 7q17 4 34 0v4H3zM5 17h30v4H5z" fill="#bd5d3e" stroke="#9c492e"/><path d="M10 11l-1 25m21-25 1 25" stroke="#ad4a32" stroke-width="3.5"/><path d="M18 12h5v5h-5z" fill="#b99952"/>',
 sun:'<circle cx="20" cy="20" r="8" fill="#e6b65c" stroke="#b17a32"/><path d="M20 2v5m0 26v5M2 20h5m26 0h5M7 7l4 4m18 18 4 4M7 33l4-4m18-18 4-4" stroke="#b5853b"/>',
 weather:'<path d="M11 29q-10-2-6-10 3-5 8-3 1-13 13-10 8 2 7 11 9 2 4 10-2 3-7 2z" fill="#d4ded9" stroke="#64818a"/><path d="M12 33l-2 4m11-4-2 4m11-4-2 4" stroke="#7b9eaa"/>',
 music:'<path d="M15 30V8l18-4v22M15 13l18-4"/><ellipse cx="10" cy="31" rx="6" ry="4"/><ellipse cx="28" cy="27" rx="6" ry="4"/>',
 quality:'<path d="M20 3l15 17-15 17L5 20z" fill="#92b6b4" stroke="#577b7e"/><path d="M20 10v20M11 20h18" stroke="#fff2cf"/>',
 full:'<path d="M5 15V5h10m10 0h10v10m0 10v10H25m-10 0H5V25"/>',
 help:'<path d="M12 13q0-10 9-9 12 0 10 11-1 5-8 7-3 1-3 6"/><circle cx="20" cy="35" r="1"/>',
 season:'<path d="M20 7q5-10 9-3 2 4-2 10 10-2 10 5 0 6-10 6 7 7 1 11-5 4-10-5-6 9-11 3-4-5 4-11-11-2-8-8 2-6 12-2z"/><circle cx="20" cy="20" r="5"/>',
 spring:'<path d="M20 7q6-10 10-2 2 4-3 10 11-1 10 6-1 5-10 5 6 8 0 11-5 3-9-6-7 8-11 2-3-5 5-10-11-3-7-9 3-5 12 0z" fill="#eeb3ae"/><circle cx="20" cy="21" r="4" fill="#e3ae4f"/>',
 summer:'<path d="M20 36V17M20 26Q-2 26 5 7q21 2 15 19M20 22Q18 1 36 4q3 18-16 18" fill="#8aa263"/>',
 autumn:'<path d="M20 37V19M20 29L5 25l7-3L3 13l11 3-1-12 7 10 6-12 1 13 10-5-6 12 7 3-16 7z" fill="#d58544"/>',
 winter:'<path d="M20 3v34M5 11l30 18M5 29l30-18M15 6l5 5 5-5m-10 28 5-5 5 5M5 16l7-1-1-7m24 17-7 1 1 7M5 24l7 1-1 7m24-16-7-1 1-7" stroke="#729bac"/>',
 star:'<path d="M20 3l5 11 12 2-9 9 2 12-10-6-11 6 2-12-9-9 13-2z" fill="#f3cd71"/>',
 fox:'<path d="M5 4l13 9 4 0L35 4l1 18-9 12-7 4-7-4L4 22z" fill="#d7924e"/><path d="M5 22l13 4 2 9 2-9 13-4-8 12-7 4-7-4z" fill="#fff2d4"/><path d="M12 20l4 2m8 0 4-2m-10 8h4"/>',
 layout:'<rect x="4" y="4" width="32" height="32" rx="4"/><path d="M4 14h32M17 14v22M23 21h7m-7 7h7M9 22h3m-3 7h3"/>'
};
export function icon(name){return '<svg class="hud-icon" viewBox="0 0 40 40" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">'+(shapes[name]||shapes.torii)+'</svg>'}
export function sprig(){const petal='<path d="M0 0C-9-3-12-12-6-17L0-14 6-17C12-12 9-3 0 0"/>';const flower=(x,y,s)=>'<g transform="translate('+x+' '+y+') scale('+s+')">'+[0,72,144,216,288].map((a,i)=>'<g transform="rotate('+a+')" fill="'+(i%2?'#f0c2be':'#fbe1d1')+'" stroke="#cc9190" stroke-width=".8">'+petal+'</g>').join('')+'<circle r="3.2" fill="#d3a458"/>'+Array.from({length:7},(_,i)=>{const a=i/7*Math.PI*2;return'<path d="M0 0l'+(Math.cos(a)*6)+' '+(Math.sin(a)*6)+'" stroke="#b98c40" stroke-width=".7"/><circle cx="'+(Math.cos(a)*6)+'" cy="'+(Math.sin(a)*6)+'" r="1.1" fill="#c89442"/>'}).join('')+'</g>';return '<svg class="hud-sprig" viewBox="0 0 160 100" aria-hidden="true"><path d="M8 90Q65 77 142 10M68 66l-5-26M105 40l25 6" fill="none" stroke="#8d7250" stroke-width="2"/><path d="M34 80q-10-24-24-13 4 14 24 13M83 57q1-24 16-20 5 15-16 20M119 33q22-14 26 0-12 10-26 0" fill="#a7ac77" stroke="#7d9063" stroke-width="1"/>'+flower(48,71,1.15)+flower(92,42,.9)+flower(126,18,.7)+'<path d="M140 70q15-9 12 2-6 7-12-2M61 14q8-15 11-4-2 9-11 4" fill="#edc3b5"/></svg>'}
export function knot(){return '<svg class="hud-knot" viewBox="0 0 70 85" aria-hidden="true" fill="none" stroke-linecap="round"><g stroke="#f7dda0" stroke-width="7"><path d="M35 28C4 1 2 36 35 28 62 1 68 37 35 28 4 56 4 20 35 28 65 56 67 21 35 28M33 33l-7 44m12-44 8 42"/></g><g stroke="#af4431" stroke-width="4"><path d="M35 28C4 1 2 36 35 28 62 1 68 37 35 28 4 56 4 20 35 28 65 56 67 21 35 28M33 33l-7 44m12-44 8 42"/></g><circle cx="35" cy="28" r="5" fill="#d69e48" stroke="#fff0ba" stroke-width="2"/></svg>'}
