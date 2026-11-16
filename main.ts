import fs from 'node:fs';
import zlib from 'node:zlib';

const W=768,H=768; const pix=Buffer.alloc(W*H*4);
const clamp=(v:number)=>Math.max(0,Math.min(255,Math.round(v)));
function set(x:number,y:number,c:number[]){if(x<0||y<0||x>=W||y>=H)return;const i=(y*W+x)*4;pix[i]=c[0];pix[i+1]=c[1];pix[i+2]=c[2];pix[i+3]=255;}
function ellipse(cx:number,cy:number,rx:number,ry:number,c:number[],stroke?:number[]){for(let y=Math.floor(cy-ry-2);y<=cy+ry+2;y++)for(let x=Math.floor(cx-rx-2);x<=cx+rx+2;x++){const d=((x-cx)/rx)**2+((y-cy)/ry)**2;if(d<=1)set(x,y,c);else if(stroke&&d<=1.04)set(x,y,stroke);}}
function circle(cx:number,cy:number,r:number,c:number[]){ellipse(cx,cy,r,r,c)}
function line(x0:number,y0:number,x1:number,y1:number,w:number,c:number[]){const n=Math.ceil(Math.hypot(x1-x0,y1-y0));for(let i=0;i<=n;i++){const t=i/n;circle(x0+(x1-x0)*t,y0+(y1-y0)*t,w,c)}}
for(let y=0;y<H;y++)for(let x=0;x<W;x++){const dx=x-384,dy=y-360,d=Math.hypot(dx,dy)/540;const t=y/H;const v=Math.max(0,1-d*.52);set(x,y,[clamp((255*(1-t)+255*t)*v),clamp((226*(1-t)+174*t)*v),clamp((177*(1-t)+105*t)*v)])}
// confetti and sparkles
const conf=[[80,110,22,220,55,190,255],[150,70,240,80,70,210,255],[650,90,255,100,45,170,255],[700,190,35,190,75,190,230],[90,310,245,75,65,180,220],[690,360,255,90,45,190,220],[120,610,30,180,80,180,230],[650,620,250,90,50,180,230],[270,90,255,150,40,180,220],[500,70,35,180,70,180,220]];
for(const [x,y,r,g,b,a] of conf as number[]){line(x-12,y+10,x+12,y-10,5,[r,g,b]);}
for(const [x,y] of [[110,180],[650,260],[240,150],[550,135],[80,480],[700,500],[210,650],[575,650]]){line(x-16,y,x+16,y,3,[255,255,235]);line(x,y-16,x,y+16,3,[255,255,235]);circle(x,y,5,[255,245,170]);}
// grounding shadow
ellipse(384,685,285,34,[104,62,57]); ellipse(384,677,245,22,[139,83,68]);
// bodies, huge and overlapping
ellipse(300,425,220,245,[11,105,105],[4,55,60]); ellipse(485,425,220,245,[245,104,28],[160,55,25]);
// Rounded plush lighting, with deterministic fine fibers rather than flat fills.
for(const [cx,base] of [[300,[9,111,110]],[485,[251,111,27]]] as [number,number[]][]){
 for(let y=185;y<670;y++)for(let x=Math.max(0,cx-220);x<Math.min(W,cx+220);x++){
  const dx=(x-cx)/220,dy=(y-425)/245,d=dx*dx+dy*dy;
  if(d<1 && !(cx===300 && ((x-485)/220)**2+dy*dy<1)){
   const light=0.62+0.42*Math.sqrt(1-d)+0.10*(-dx-dy);
   const fiber=3*Math.sin(x*2.3+y*1.7)+2*Math.sin(x*.9-y*3.1);
   set(x,y,base.map(v=>clamp(v*light+fiber)));
  }
 }
}
// soft fur tufts
for(let i=0;i<640;i++){
 const a=i*Math.PI*2/640;
 for(const [cx,color] of [[300,[22,132,128]],[485,[255,141,43]]] as [number,number[]][]){
  const x=cx+217*Math.cos(a),y=425+242*Math.sin(a);
  if(cx===300 && ((x-485)/220)**2+((y-425)/245)**2<1)continue;
  line(x,y,x+(3+3*Math.sin(i*5))*Math.cos(a),y+(3+3*Math.sin(i*5))*Math.sin(a),1,color);
 }
}
// embracing arms crossing clearly
line(170,440,300,510,42,[7,82,84]); line(598,440,485,510,42,[205,67,22]); line(178,454,315,535,24,[20,137,130]); line(590,454,470,535,24,[255,137,42]);
// faces
for(const [cx,cy] of [[245,355],[455,355]]){ellipse(cx,cy,70,82,[255,220,174]);}
// eyes
for(const [cx,cy] of [[222,340],[272,340],[432,340],[482,340]]){circle(cx,cy,25,[20,28,35]);circle(cx-7,cy-8,9,[255,255,255]);circle(cx+8,cy+10,4,[150,235,255]);}
// cheeks
for(const [cx,cy] of [[203,395],[291,395],[413,395],[501,395]]) ellipse(cx,cy,21,12,[255,105,115]);
// smiles
line(230,412,245,420,3,[80,35,45]);line(245,420,260,412,3,[80,35,45]);line(440,412,455,420,3,[80,35,45]);line(455,420,470,412,3,[80,35,45]);
// belly highlights and heart sparkle
ellipse(275,545,92,70,[18,125,123]); ellipse(510,545,92,70,[255,132,40]);
// Front arms curl around the opposite friend, with dark seams and round paws.
function hug(points:number[][],color:number[],shadow:number[]){
 for(let i=1;i<points.length;i++)line(points[i-1][0],points[i-1][1],points[i][0],points[i][1],33,shadow);
 for(let i=1;i<points.length;i++)line(points[i-1][0],points[i-1][1]-5,points[i][0],points[i][1]-5,25,color);
}
hug([[171,467],[190,516],[242,553],[314,571],[394,569],[458,540]],[22,145,136],[3,65,70]);
hug([[605,469],[584,511],[548,533],[509,537],[470,525],[433,500]],[255,151,49],[172,65,23]);
ellipse(458,535,36,28,[28,156,144]);ellipse(430,494,33,29,[255,162,57]);
for(const [x,y] of [[450,540],[462,533],[424,499],[437,493]])line(x,y,x+2,y+10,1,[107,87,53]);
circle(384,520,18,[255,244,208]); line(366,520,384,538,4,[255,244,208]); line(402,520,384,538,4,[255,244,208]);
function chunk(type:string,data:Buffer){const h=Buffer.alloc(8);h.writeUInt32BE(data.length,0);h.write(type,4);const crc=crc32(Buffer.concat([Buffer.from(type),data]));const c=Buffer.alloc(4);c.writeUInt32BE(crc,0);return Buffer.concat([h,data,c]);}
function crc32(b:Buffer){let c=0xffffffff;for(const v of b){c^=v;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (c^0xffffffff)>>>0;}
const raw=Buffer.alloc((W*4+1)*H);for(let y=0;y<H;y++){raw[y*(W*4+1)]=0;pix.copy(raw,y*(W*4+1)+1,y*W*4,(y+1)*W*4)}
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',Buffer.from([0,0,3,0,0,0,3,0,8,6,0,0,0])),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
const dir=process.env.MAKEFUN_OUTPUT_DIR||'/output';fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(dir+'/entry.png',png);
