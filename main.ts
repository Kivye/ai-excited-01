import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

// All geometry, light and fur are generated here; no assets or dependencies.
const W = 768, H = 768;
const pixels = Buffer.alloc(W * H * 3);
const clamp = (v: number) => Math.max(0, Math.min(255, v));
function noise(x: number, y: number) {
  let n = Math.imul(x + 313, 374761393) ^ Math.imul(y + 719, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}
function paint(x: number, y: number, c: number[], a = 1) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  for (let k = 0; k < 3; k++) pixels[i+k] = clamp(pixels[i+k] * (1-a) + c[k] * a);
}
for (let y=0;y<H;y++) for(let x=0;x<W;x++) {
  const halo = Math.exp(-(((x-384)/310)**2+((y-315)/330)**2)*1.6);
  const edge = Math.min(1, Math.hypot((x-384)/520,(y-350)/550));
  paint(x,y,[246+9*halo-38*edge**2,177+65*halo-52*edge**2,107+104*halo-43*edge**2]);
}
function ellipse(cx:number,cy:number,rx:number,ry:number,c:number[],opacity=1,fur=false,angle=0) {
  const co=Math.cos(angle),si=Math.sin(angle), r=Math.max(rx,ry)+3;
  for(let y=Math.max(0,Math.floor(cy-r));y<Math.min(H,cy+r);y++)
  for(let x=Math.max(0,Math.floor(cx-r));x<Math.min(W,cx+r);x++) {
    const dx=x-cx,dy=y-cy,u=(dx*co+dy*si)/rx,v=(-dx*si+dy*co)/ry;
    const q=u*u+v*v;
    if(q>1.025)continue;
    const aa=Math.min(1,Math.max(0,(1.015-q)*Math.min(rx,ry)/2));
    let light=1;
    if(fur) light=.66+.29*Math.sqrt(Math.max(0,1-q))+.22*Math.exp(-((u+.35)**2+(v+.48)**2)*4);
    const grain=fur?(noise(x,y)-.5)*13:0;
    // Fine curved fibers follow the rounded surface rather than a flat screen grid.
    const theta=Math.atan2(v,u), radius=Math.sqrt(q);
    const fiber=fur?Math.sin(theta*39+radius*180+noise(x>>1,y>>1)*2)*2.5:0;
    // Revision: tapered short pile catches light in individually curved tufts.
    const strandPhase=radius*145+noise(Math.floor(theta*90),Math.floor(radius*36))*4;
    const tuft=fur?Math.pow(Math.max(0,Math.cos(theta*310+radius*23)),18)
      *Math.pow(Math.max(0,Math.sin(strandPhase)),4)*12*(1-q):0;
    paint(x,y,c.map(n=>n*light+grain+fiber+tuft),aa*opacity);
  }
}
function glow(cx:number,cy:number,rx:number,ry:number,c:number[],a:number) {
  for(let y=Math.max(0,Math.floor(cy-ry*3));y<Math.min(H,cy+ry*3);y++)
  for(let x=Math.max(0,Math.floor(cx-rx*3));x<Math.min(W,cx+rx*3);x++) {
    const q=((x-cx)/rx)**2+((y-cy)/ry)**2;
    if(q<9)paint(x,y,c,a*Math.exp(-q*2));
  }
}
function line(x1:number,y1:number,x2:number,y2:number,r:number,c:number[],a=1) {
 const len=Math.hypot(x2-x1,y2-y1),steps=Math.ceil(len*1.4);
 for(let i=0;i<=steps;i++)ellipse(x1+(x2-x1)*i/steps,y1+(y2-y1)*i/steps,r,r,c,a);
}
let seed=7451;
function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
const teal=[20,160,157],orange=[255,125,38],ink=[29,36,43];
const confetti=[[25,167,171],[255,104,91],[255,215,79],[138,105,195],[255,250,222]];
for(let i=0;i<95;i++) {
 const x=35+rand()*698,y=35+rand()*615;
 const c=confetti[i%confetti.length],a=rand()*6.28;
 line(x,y,x+Math.cos(a)*9,y+Math.sin(a)*9,2+rand()*1.8,c);
}
function star(x:number,y:number,s:number) {
 glow(x,y,s*1.7,s*1.7,[255,250,210],.25);
 for(let j=-Math.ceil(s);j<=s;j++) {
 const thick=Math.max(.65,(1-Math.abs(j)/s)**3*s*.26);
 ellipse(x+j,y,1,thick,[255,255,230],.95);
 ellipse(x,y+j,thick,1,[255,255,230],.95);
 }
}
for(let i=0;i<28;i++)star(36+rand()*696,30+rand()*600,5+rand()*10);
glow(384,659,275,45,[87,41,37],.27);
glow(384,663,213,24,[66,46,42],.27);
// Feet, round ears and substantial bodies form one close silhouette.
ellipse(239,628,86,40,teal,1,true,-.15);
ellipse(532,628,86,40,orange,1,true,.15);
ellipse(137,285,66,71,teal,1,true,-.3);
ellipse(333,254,58,66,teal,1,true,.15);
ellipse(435,254,58,66,orange,1,true,-.15);
ellipse(630,285,66,71,orange,1,true,.3);
ellipse(136,280,37,42,[89,197,180],.85,true);
ellipse(631,280,37,42,[255,180,107],.85,true);
ellipse(258,454,192,207,teal,1,true,-.14);
ellipse(510,454,192,207,orange,1,true,.14);
// Soft head domes lean toward each other.
ellipse(263,353,163,155,teal,1,true,-.16);
ellipse(505,353,163,155,orange,1,true,.16);
function face(cx:number,cy:number,dir:number) {
 for(const dx of [-57,57]) {
  const ex=cx+dx,ey=cy+Math.abs(dx)*.03;
  ellipse(ex,ey+5,41,51,[11,79,76],.25);
  ellipse(ex,ey,37,46,[255,249,224]);
  ellipse(ex+dir*5,ey+3,29,36,ink);
  ellipse(ex+dir*6,ey+12,22,25,[56,60,62]);
  ellipse(ex-9,ey-13,12,14,[255,255,250]);
  ellipse(ex+13,ey+13,5.5,6,[255,255,250]);
  for(let k=0;k<3;k++)line(ex-21+k*18,ey-37,ex-28+k*22,ey-49-(k%2)*3,2.1,ink);
 }
 glow(cx-94,cy+59,36,22,[255,111,129],.68);
 glow(cx+94,cy+59,36,22,[255,111,129],.68);
 ellipse(cx,cy+61,19,23,[80,38,43]);
 ellipse(cx+2,cy+73,12,9,[255,133,143]);
 ellipse(cx-2,cy+44,23,7,cx<384?teal:orange,1,true);
 ellipse(cx,cy+32,8,5,[67,58,51]);
}
face(263,345,1);face(505,345,-1);
// Curved embracing arms: each starts on its own outer shoulder and
// crosses the shared belly, ending in a paw on the other plush.
function arm(points:number[][],color:number[]) {
 for(let i=0;i<points.length-1;i++) {
 const [ax,ay]=points[i],[bx,by]=points[i+1];
 const steps=Math.ceil(Math.hypot(bx-ax,by-ay)/3);
 for(let j=0;j<=steps;j++) {
 const t=j/steps,x=ax+(bx-ax)*t,y=ay+(by-ay)*t;
 ellipse(x,y+7,29,30,[63,64,47],.13);
 ellipse(x,y,27,29,color,1,true);
 }
 }
 const [px,py]=points[points.length-1];
 ellipse(px,py,39,32,color,1,true,-.2);
}
arm([[623,473],[601,510],[561,539],[510,553],[448,552],[389,534],[344,509]],orange);
arm([[144,477],[162,518],[201,554],[257,576],[324,580],[389,568],[446,543]],teal);
// Tiny embroidered paw creases.
line(449,540,457,548,1,[9,108,111],.6);
line(436,548,444,557,1,[9,108,111],.6);
line(335,506,330,514,1,[192,84,32],.6);
star(383,187,22);star(75,412,13);star(693,421,15);

// PNG RGB encoder: filter zero, zlib stream, manual chunks and CRC32.
function crc32(data:Uint8Array) {
 let c=0xffffffff;
 for(const byte of data){c^=byte;for(let b=0;b<8;b++)c=(c>>>1)^((c&1)?0xedb88320:0);}
 return (c^0xffffffff)>>>0;
}
function chunk(type:string,data:Buffer) {
 const name=Buffer.from(type),size=Buffer.alloc(4),crc=Buffer.alloc(4);
 size.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([name,data])));
 return Buffer.concat([size,name,data,crc]);
}
const raw=Buffer.alloc(H*(W*3+1));
for(let y=0;y<H;y++)pixels.copy(raw,y*(W*3+1)+1,y*W*3,(y+1)*W*3);
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(W,0);ihdr.writeUInt32BE(H,4);ihdr[8]=8;ihdr[9]=2;
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
if(png.length>1048576)throw new Error('PNG exceeds 1 MiB');
const output=process.env.MAKEFUN_OUTPUT_DIR||'/output';mkdirSync(output,{recursive:true});
writeFileSync(join(output,'entry.png'),png);
console.log(`Rendered ${W}x${H}: ${png.length} bytes`);
