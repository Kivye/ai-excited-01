import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

// Galaxy Jellyfish: deterministic, entirely procedural light painting.
const W=768,H=768, pixels=new Float32Array(W*H*3);
let seed=173981;
function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
function hash(x,y){let n=Math.imul(x,374761393)+Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;}
function noise(x,y){let a=Math.floor(x),b=Math.floor(y),u=x-a,v=y-b;u=u*u*(3-2*u);v=v*v*(3-2*v);return (hash(a,b)*(1-u)+hash(a+1,b)*u)*(1-v)+(hash(a,b+1)*(1-u)+hash(a+1,b+1)*u)*v;}
function fbm(x,y){return noise(x,y)*.55+noise(x*2.07,y*2.07)*.27+noise(x*4.13,y*4.13)*.12+noise(x*8.3,y*8.3)*.06;}
function put(x,y,c,a=1){x=x|0;y=y|0;if(x<0||y<0||x>=W||y>=H)return;let i=(y*W+x)*3;for(let k=0;k<3;k++)pixels[i+k]=pixels[i+k]*(1-a)+c[k]*a;}
function add(x,y,c,a=1){x=x|0;y=y|0;if(x<0||y<0||x>=W||y>=H)return;let i=(y*W+x)*3;for(let k=0;k<3;k++)pixels[i+k]+=c[k]*a;}
function dot(x,y,r,c,alpha=1){for(let yy=Math.max(0,Math.floor(y-r*3));yy<Math.min(H,y+r*3+1);yy++)for(let xx=Math.max(0,Math.floor(x-r*3));xx<Math.min(W,x+r*3+1);xx++){let d=((xx-x)**2+(yy-y)**2)/(r*r);if(d<9)add(xx,yy,c,Math.exp(-d*1.8)*alpha);}}
function line(x1,y1,x2,y2,r,c,a=1){let n=Math.ceil(Math.hypot(x2-x1,y2-y1)*1.1);for(let j=0;j<=n;j++)dot(x1+(x2-x1)*j/n,y1+(y2-y1)*j/n,r,c,a*.65);}
function poly(points,c){let min=Math.max(0,Math.floor(Math.min(...points.map(p=>p[1])))),max=Math.min(H-1,Math.ceil(Math.max(...points.map(p=>p[1]))));for(let y=min;y<=max;y++){let xs=[];for(let i=0;i<points.length;i++){let a=points[i],b=points[(i+1)%points.length];if((a[1]>y)!=(b[1]>y))xs.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]));}xs.sort((a,b)=>a-b);for(let k=0;k<xs.length;k+=2)for(let x=Math.ceil(xs[k]);x<xs[k+1];x++)put(x,y,c);}}
const horizon=548;
for(let y=0;y<H;y++)for(let x=0;x<W;x++){
 let n=fbm(x/110,y/100),mist=Math.exp(-(((y-537)/34)**2))*Math.exp(-(((x-400)/340)**2)),sea=y>=horizon;
 let c=sea?[3+7*n,11+12*n,22+17*n]:[5+12*(1-y/H)+10*n,6+9*n,19+23*(1-y/H)+17*n];
 if(sea){let wave=Math.sin(y*.25+noise(x/90,y/13)*8);c=c.map((v,k)=>v+wave*(k===2?3:1.4));}
 put(x,y,c.map((v,k)=>v+mist*[14,29,36][k]));
}
for(let i=0;i<1050;i++){let x=rand()*W,y=rand()*535;dot(x,y,rand()<.04?1.1:.48,[100,133,191],.25+rand()*.65);}
// A small, sharp crescent.
for(let y=65;y<105;y++)for(let x=638;x<678;x++){if((x-657)**2+(y-85)**2<15**2&&(x-664)**2+(y-79)**2>14**2)put(x,y,[212,219,199]);}
dot(655,85,13,[30,48,65],.13);
// The vast bell is a domed volume, with a gently scalloped lower lip.
function bottom(x){return 337+23*Math.sqrt(Math.max(0,1-((x-384)/275)**2))+5*Math.cos((x-384)/24);}
function inside(x,y){return ((x-384)/275)**2+((y-310)/211)**2<1&&y<bottom(x);}
for(let y=90;y<385;y++)for(let x=105;x<663;x++)if(inside(x,y)){
 let dx=(x-384)/275,dy=(y-265)/190,r=Math.hypot(dx,dy),angle=Math.atan2(dy,dx),swirl=angle+5.6*r;
 let cloud=fbm(x/68+Math.cos(swirl)*2.2,y/68+Math.sin(swirl)*2.2),fil= Math.pow(Math.max(0,Math.sin(swirl*2+cloud*7)),3);
 let blue=(Math.sin(swirl+cloud*4)+1)/2,core=Math.exp(-((x-365)**2/11000+(y-239)**2/5000));
 let c=[22+cloud*54+fil*42+core*62,16+cloud*28+blue*cloud*78+core*52,57+cloud*91+fil*40+core*87];
 let edge=Math.sqrt(Math.max(0,1-dx*dx));let rim=Math.exp(-(((y-(310-211*edge))/4.4)**2));
 c=c.map((v,k)=>v+rim*[149,88,74][k]);put(x,y,c);
}
for(let i=0;i<3600;i++){let x=110+rand()*548,y=100+rand()*270;if(inside(x,y)){let bright=rand();dot(x,y,bright>.985?1.2:.38+rand()*.32,[180+rand()*55,163+rand()*70,202+rand()*53],.25+bright*.65);if(bright>.996){line(x-4,y,x+4,y,.38,[130,166,180]);line(x,y-4,x,y+4,.38,[130,166,180]);}}}
// Fine radial meridians make the translucent bell legible.
for(let j=0;j<11;j++){let theta=(j/10-.5)*Math.PI;let prev;for(let t=0;t<=1;t+=.012){let x=384+Math.sin(theta)*275*Math.sin(t*Math.PI/2),y=104+251*t; if(inside(x,y)){if(prev)line(prev[0],prev[1],x,y,.6,[59,82,117],.08);prev=[x,y];}}}
for(let x=111;x<658;x+=1){let y=bottom(x);if(inside(x,y-1)){dot(x,y,4.6,[99,40,42],.25);dot(x,y,1.2,[236,150,103],.7);}}
// Layered streaming tentacles and their broken water reflections.
for(let j=0;j<19;j++){
 let start=151+j*25.5,sy=bottom(start)-3,end=553+rand()*45,phase=rand()*6.28,amp=12+rand()*29,drift=(start-384)*.13;
 let pts=[];for(let t=0;t<=1.001;t+=.008){let x=start+Math.sin(t*7+phase)*amp*Math.sin(t*Math.PI*.8)+drift*t,y=sy+(end-sy)*t;pts.push([x,y,t]);}
 for(let pass=0;pass<3;pass++)for(let k=1;k<pts.length;k++){let [x,y,t]=pts[k],p=pts[k-1],c=[45+180*t,189-25*t,194-112*t],r=(pass===0?7:pass===1?2.5:.75)*(1-t*.7);line(p[0],p[1],x,y,r,c,pass===0?.025:pass===1?.13:.85);}
 let last=pts[pts.length-1];dot(last[0],last[1],8,[50,130,120],.2);
 for(let k=0;k<25;k++){let yy=last[1]+rand()*(746-last[1]),spread=3+(yy-550)*.14,xx=last[0]+(rand()-.5)*spread;line(xx,yy,xx+2+rand()*9,yy,.5+rand()*.6,[80+rand()*70,116+rand()*50,91],.15+rand()*.32);}
}
// Ocean crests: broken horizontal brush marks.
for(let i=0;i<2200;i++){let y=552+rand()*216,x=rand()*768,len=3+rand()*(8+(y-548)*.11);let lit=Math.exp(-(((x-400)/240)**2));line(x,y,x+len,y-.3,.45,[9+lit*14,20+lit*23,30+lit*25],.3);}
// Tiny coast, lighthouse, and a single sweeping lamp beam.
for(let y=508;y<568;y++)for(let x=0;x<238;x++){let ax=(x-91)/145,ay=(y-522)/(10+x*.07);if(x>91&&Math.abs(ay)<1) add(x,y,[79,86,60],.12*(1-ax)*(1-Math.abs(ay)));}
poly([[0,558],[33,545],[63,548],[92,538],[119,554],[145,568],[0,578]],[3,7,12]);
poly([[76,546],[80,510],[89,510],[94,549]],[3,6,10]);poly([[77,512],[77,505],[92,505],[92,512]],[5,9,13]);poly([[75,505],[85,498],[95,505]],[3,6,10]);
line(80,509,89,509,.8,[250,202,108]);dot(85,509,3,[194,138,57],.5);
poly([[185,597],[236,597],[226,607],[196,607]],[2,5,9]);line(210,597,210,566,.7,[1,4,8]);line(210,569,231,591,.55,[3,6,10]);poly([[211,572],[211,592],[229,592]],[4,8,13]);dot(202,592,2,[2,4,7]);
// Film grain and a dark vignette tie the painting together.
const raw=Buffer.alloc((W*3+1)*H);
for(let y=0;y<H;y++){let row=y*(W*3+1);raw[row]=0;for(let x=0;x<W;x++){let v=1-.37*Math.pow(Math.min(1,Math.hypot((x-384)/510,(y-360)/560)),1.8),grain=(rand()-.5)*3.2;for(let k=0;k<3;k++)raw[row+1+x*3+k]=Math.max(0,Math.min(255,pixels[(y*W+x)*3+k]*v+grain));}}
function crc32(b){let c=0xffffffff;for(let v of b){c^=v;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
function chunk(type,data){let t=Buffer.from(type),b=Buffer.alloc(data.length+12);b.writeUInt32BE(data.length);t.copy(b,4);data.copy(b,8);b.writeUInt32BE(crc32(Buffer.concat([t,data])),8+data.length);return b;}
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(W);ihdr.writeUInt32BE(H,4);ihdr[8]=8;ihdr[9]=2;
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
if(png.length>1048576)throw Error(`PNG too large: ${png.length}`);
const out=process.env.MAKEFUN_OUTPUT_DIR||'/output';mkdirSync(out,{recursive:true});writeFileSync(join(out,'entry.png'),png);console.log(`${join(out,'entry.png')}: ${W}x${H}, ${png.length} bytes`);
