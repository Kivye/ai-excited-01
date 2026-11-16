import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

// A deterministic, entirely procedural portrait: THE BIG SQUEEZE.
const W=768,H=768, pixels=new Float32Array(W*H*3);
const clamp=(v:number,a=0,b=1)=>Math.max(a,Math.min(b,v));
let seed=917261;
function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
function noise(x:number,y:number){let n=Math.imul(x+137,374761393)^Math.imul(y+71,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;}
function put(x:number,y:number,c:number[],a=1){x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=W||y>=H)return;let i=(y*W+x)*3;for(let k=0;k<3;k++)pixels[i+k]=pixels[i+k]*(1-a)+c[k]*a;}
function ellipse(cx:number,cy:number,rx:number,ry:number,c:number[],alpha=1,soft=false){for(let y=Math.max(0,Math.floor(cy-ry));y<Math.min(H,cy+ry+1);y++)for(let x=Math.max(0,Math.floor(cx-rx));x<Math.min(W,cx+rx+1);x++){let d=((x-cx)/rx)**2+((y-cy)/ry)**2; if(d<1)put(x,y,c,alpha*(soft?Math.pow(1-d,2):clamp((1-d)*Math.min(rx,ry))));}}
function line(x1:number,y1:number,x2:number,y2:number,width:number,c:number[],a=1){let steps=Math.max(1,Math.ceil(Math.hypot(x2-x1,y2-y1)*1.4));for(let i=0;i<=steps;i++){let t=i/steps;ellipse(x1+(x2-x1)*t,y1+(y2-y1)*t,width,width,c,a);}}
function plush(cx:number,cy:number,rx:number,ry:number,base:number[],angle=0){let co=Math.cos(angle),si=Math.sin(angle);let radius=Math.max(rx,ry)+3;for(let y=Math.max(0,Math.floor(cy-radius));y<Math.min(H,cy+radius);y++)for(let x=Math.max(0,Math.floor(cx-radius));x<Math.min(W,cx+radius);x++){let dx=x-cx,dy=y-cy,u=(dx*co+dy*si)/rx,v=(-dx*si+dy*co)/ry,d=u*u+v*v;let grain=noise(x,y);if(d>1+0.009*(grain-.5))continue;let z=Math.sqrt(Math.max(0,1-d));let light=.48+.48*z+.20*Math.exp(-((u+.34)**2+(v+.49)**2)*5);let fur=(grain-.5)*13+1.8*Math.sin(78*v+8*Math.sin(u*19));let color=base.map((b,k)=>b*light+fur+(k===0?11:14)*Math.exp(-((u+.35)**2+(v+.65)**2)*7));put(x,y,color,clamp((1-d)*100+.5));}
// Fine curved fiber strokes follow each rounded surface.
for(let i=0;i<Math.floor(rx*ry*.18);i++){let u=rand()*2-1,v=rand()*2-1;if(u*u+v*v>.94)continue;let x=cx+u*rx*co-v*ry*si,y=cy+u*rx*si+v*ry*co;let len=1.4+rand()*3;let dx=u*.55+Math.sin(v*5)*.24;line(x,y,x+dx*len,y+len*.65,.37,[230,245,228],.10);}}
for(let y=0;y<H;y++)for(let x=0;x<W;x++){let halo=Math.exp(-(((x-384)/340)**2+((y-320)/335)**2)*2),v=clamp(Math.hypot((x-384)/530,(y-360)/560));put(x,y,[247+8*halo-32*v*v,183+62*halo-47*v*v,112+99*halo-45*v*v]);}
ellipse(384,345,330,320,[255,239,184],.62,true);
const colors=[[15,157,159],[255,113,35],[244,74,111],[255,223,89],[116,117,215]];
for(let i=0;i<95;i++){let x=35+rand()*698,y=35+rand()*620;if(x>90&&x<685&&y>190&&y<650)continue;let a=rand()*6.28,l=4+rand()*8;line(x,y,x+Math.cos(a)*l,y+Math.sin(a)*l,1.7+rand(),colors[i%5],.85);}
function star(x:number,y:number,r:number){ellipse(x,y,r*2,r*2,[255,240,173],.28,true);for(let j=-r;j<=r;j++){let w=Math.max(.5,(1-Math.abs(j)/r)**3*r*.29);line(x-w,y+j,x+w,y+j,.6,[255,255,231],.98);line(x+j,y-w,x+j,y+w,.6,[255,255,231],.98);}}
for(let i=0;i<30;i++){let x=30+rand()*708,y=30+rand()*600;if(x>110&&x<655&&y>220)continue;star(x,y,5+rand()*9);}
for(let i=0;i<5;i++)ellipse(384,674,290-i*25,49-i*6,[95,53,34],.10,true);
const teal=[19,158,160],orange=[255,125,40];
// Feet, ears, and overlapping pear-shaped bodies.
plush(210,637,88,53,teal,-.15);plush(529,637,91,54,orange,.15);
plush(135,252,62,65,teal,-.3);plush(333,224,58,61,teal,.2);
plush(443,225,57,61,orange,-.2);plush(635,253,61,65,orange,.3);
ellipse(135,250,33,36,[18,103,110],.5,true);ellipse(636,251,33,36,[227,71,49],.5,true);
plush(249,478,173,192,teal,-.12);plush(520,478,173,192,orange,.12);
plush(247,357,172,160,teal,-.12);plush(521,357,172,160,orange,.12);
// Broad arms curve across the opposite belly, making the embrace unmistakable.
function arm(points:number[][],base:number[]){
// Rasterize the union once: overlapping brush stamps would leave ribbed seams.
let minX=Math.min(...points.map(p=>p[0]))-37,maxX=Math.max(...points.map(p=>p[0]))+37;
let minY=Math.min(...points.map(p=>p[1]))-37,maxY=Math.max(...points.map(p=>p[1]))+37;
for(let y=Math.floor(minY);y<=maxY;y++)for(let x=Math.floor(minX);x<=maxX;x++){
let best=1e9,nearestY=0;
for(let i=0;i<points.length-1;i++){let [ax,ay]=points[i],[bx,by]=points[i+1];let vx=bx-ax,vy=by-ay,t=clamp(((x-ax)*vx+(y-ay)*vy)/(vx*vx+vy*vy));let qx=ax+t*vx,qy=ay+t*vy,d=Math.hypot(x-qx,y-qy);if(d<best){best=d;nearestY=qy;}}
if(best>35)continue;
let z=Math.sqrt(Math.max(0,1-(best/35)**2));let light=.49+.48*z+.12*clamp((nearestY-y)/35);let grain=(noise(x,y)-.5)*12;
put(x,y,base.map(v=>v*light+grain),clamp(35-best));
}
for(let i=0;i<1900;i++){let j=Math.floor(rand()*(points.length-1)),t=rand(),[ax,ay]=points[j],[bx,by]=points[j+1];let vx=bx-ax,vy=by-ay,len=Math.hypot(vx,vy),off=(rand()-.5)*58;let x=ax+t*vx-vy/len*off,y=ay+t*vy+vx/len*off;line(x,y,x+vx/len*2,y+vy/len*2,.35,[255,239,204],.08);}
}
arm([[112,451],[131,506],[192,543],[267,553],[346,541],[410,510]],orange);
arm([[658,451],[637,505],[582,537],[510,551],[450,539],[376,503]],teal);
plush(408,508,48,36,orange,-.4);plush(376,503,47,36,teal,.4);
function face(cx:number,cy:number){for(let side of [-1,1]){let ex=cx+side*58,ey=cy-16;
ellipse(ex,ey+5,38,48,[17,48,48]);ellipse(ex,ey,34,44,[22,29,38]);ellipse(ex+7,ey+14,24,26,[57,44,47],.7,true);
ellipse(ex-10,ey-15,11,14,[255,255,242]);ellipse(ex+13,ey+10,5,6,[255,244,216]);
for(let k=0;k<3;k++)line(ex+side*(18+k*6),ey-31+k*6,ex+side*(26+k*7),ey-42+k*6,1.8,[34,48,44]);
ellipse(cx+side*91,cy+49,42,26,[255,100,121],.7,true);ellipse(cx+side*91-7,cy+45,22,13,[255,181,161],.35,true);}
ellipse(cx,cy+54,23,25,[72,33,39]);ellipse(cx,cy+65,14,10,[249,124,135]);ellipse(cx-2,cy+42,13,4,[255,238,208]);
ellipse(cx,cy+25,10,7,[52,48,43]);}
face(246,350);face(522,350);
// Tiny stitches on the paws emphasize soft, tactile construction.
for(let i=0;i<3;i++){line(399+i*10,526,402+i*10,532,1,[163,73,32],.4);line(355+i*10,518,359+i*10,525,1,[7,92,96],.45);}
star(384,177,19);star(72,404,13);star(701,411,14);

// PNG encoder: RGB scanlines, adaptive Sub filter, handmade CRC32 and chunks.
const table=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;table[n]=c>>>0;}
function crc(b:Buffer){let c=0xffffffff;for(const v of b)c=table[(c^v)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
function chunk(type:string,data:Buffer){let t=Buffer.from(type),body=Buffer.concat([t,data]),out=Buffer.alloc(data.length+12);out.writeUInt32BE(data.length);body.copy(out,4);out.writeUInt32BE(crc(body),out.length-4);return out;}
const raw=Buffer.alloc(H*(W*3+1));for(let y=0;y<H;y++){let row=y*(W*3+1);raw[row]=1;let prev=[0,0,0];for(let x=0;x<W;x++)for(let k=0;k<3;k++){let v=Math.round(clamp(pixels[(y*W+x)*3+k],0,255));raw[row+1+x*3+k]=(v-prev[k]+256)&255;prev[k]=v;}}
let ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(W);ihdr.writeUInt32BE(H,4);ihdr[8]=8;ihdr[9]=2;
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
if(png.length>1048576)throw Error(`PNG exceeds limit: ${png.length}`);
const dir=process.env.MAKEFUN_OUTPUT_DIR||'/output';mkdirSync(dir,{recursive:true});writeFileSync(join(dir,'entry.png'),png);console.log(`768x768 PNG: ${png.length} bytes`);
