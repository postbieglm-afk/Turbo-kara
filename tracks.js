/* Turbo Kára · tracks.js: tratě: generování okruhu, Tokio a Brno (město, předměty, dominanty) */
'use strict';
/* ---------- mapy: trať, město a předměty (Tokio, Brno) ---------- */
const SIDE=38,WALL=HALF+SIDE; // chodník za krajnicí, za ním zeď domů
let TRK=null,T,N,DS,L,CITY,MINI=[],groundCanvas,groundPat;
const PK=[],PADS=[],JUMPS=[],CONES=[],BARRS=[],ZEBRA=[],AVOID=[];
// trať z řídicích bodů: Catmull-Rom, vzorky po 12 jednotkách, zakřivení, ideální stopa a rychlost pro AI
function genTrack(CP){
  const cr=(a,b,c,d,t)=>{const t2=t*t,t3=t2*t;return .5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3);};
  const m=CP.length,raw=[];
  for(let i=0;i<m;i++){const a=CP[(i-1+m)%m],b=CP[i],c=CP[(i+1)%m],d=CP[(i+2)%m];
    for(let k=0;k<40;k++){const t=k/40;raw.push([cr(a[0],b[0],c[0],d[0],t),cr(a[1],b[1],c[1],d[1],t)]);}}
  const cum=[0];for(let i=1;i<raw.length;i++)cum.push(cum[i-1]+Math.hypot(raw[i][0]-raw[i-1][0],raw[i][1]-raw[i-1][1]));
  const last=raw[raw.length-1],Lr=cum[cum.length-1]+Math.hypot(raw[0][0]-last[0],raw[0][1]-last[1]);
  const N=Math.round(Lr/12),DS=Lr/N;
  const x=new Float32Array(N),y=new Float32Array(N),tx=new Float32Array(N),ty=new Float32Array(N),k=new Float32Array(N),
    k3=new Float32Array(N),rl=new Float32Array(N),vt=new Float32Array(N);
  let j=0;
  for(let i=0;i<N;i++){const s=i*DS;while(j<raw.length-1&&cum[j+1]<s)j++;
    const a=raw[j],b=raw[(j+1)%raw.length],segE=j+1<raw.length?cum[j+1]:Lr,u=(s-cum[j])/Math.max(1e-6,segE-cum[j]);
    x[i]=a[0]+(b[0]-a[0])*u;y[i]=a[1]+(b[1]-a[1])*u;}
  for(let i=0;i<N;i++){const a=(i-1+N)%N,b=(i+1)%N;let dx=x[b]-x[a],dy=y[b]-y[a];const l=Math.hypot(dx,dy)||1;tx[i]=dx/l;ty[i]=dy/l;}
  for(let i=0;i<N;i++){const a=(i-1+N)%N,b=(i+1)%N;k[i]=(tx[a]*ty[b]-ty[a]*tx[b])/(2*DS);}
  const avg=(src,r,i)=>{let s=0;for(let q=-r;q<=r;q++)s+=src[(i+q+N)%N];return s/(2*r+1);};
  for(let i=0;i<N;i++){k3[i]=avg(k,3,i);rl[i]=clamp(avg(k,22,i)*95,-.58,.58)*HALF;}
  for(let i=0;i<N;i++){let mk=0;for(let q=-2;q<=2;q++)mk=Math.max(mk,Math.abs(k3[(i+q+N)%N]));
    const R=0.8/Math.max(mk,1e-5);vt[i]=Math.min(MAX*1.6,TURN*R/(1+TURN*R*0.3/MAX));}
  let minX=1e9,minY=1e9,maxX=-1e9,maxY=-1e9;for(let i=0;i<N;i++){minX=Math.min(minX,x[i]);maxX=Math.max(maxX,x[i]);minY=Math.min(minY,y[i]);maxY=Math.max(maxY,y[i]);}
  const nx=i=>-ty[i],ny=i=>tx[i];
  const center=new Path2D(),edgeL=new Path2D(),edgeR=new Path2D(),curbs=new Path2D();
  for(let i=0;i<=N;i++){const q=i%N,f=i?'lineTo':'moveTo';center[f](x[q],y[q]);
    edgeL[f](x[q]+nx(q)*(HALF-7),y[q]+ny(q)*(HALF-7));edgeR[f](x[q]-nx(q)*(HALF-7),y[q]-ny(q)*(HALF-7));}
  for(const side of [1,-1]){let run=false;
    for(let i=0;i<=N+8;i++){const q=i%N;let tight=false;for(let o=-6;o<=6;o++)if(Math.abs(k3[(q+o+N)%N])>1/400)tight=true;
      const px=x[q]+nx(q)*side*(HALF+4),py=y[q]+ny(q)*side*(HALF+4);
      if(tight){if(!run){curbs.moveTo(px,py);run=true;}else curbs.lineTo(px,py);}else run=false;}}
  return {N,DS,L:N*DS,x,y,tx,ty,k,k3,rl,vt,nx,ny,center,edgeL,edgeR,curbs,minX,minY,maxX,maxY};
}
function trackAt(s,lat){s=((s%L)+L)%L;const i=Math.floor(s/DS)%N;return {x:T.x[i]+T.nx(i)*lat,y:T.y[i]+T.ny(i)*lat,a:Math.atan2(T.ty[i],T.tx[i]),i};}
function coarseDist(px,py){if(T.grid)return gridNear(px,py)[0];let b=1e18;for(let i=0;i<N;i+=3){const dx=px-T.x[i],dy=py-T.y[i],d=dx*dx+dy*dy;if(d<b)b=d;}return Math.sqrt(b);}
function nearIdx(px,py){if(T.grid){const q=gridNear(px,py);if(q[1]>=0)return q[1];}let b=1e18,bi=0;for(let i=0;i<N;i++){const dx=px-T.x[i],dy=py-T.y[i],d=dx*dx+dy*dy;if(d<b){b=d;bi=i;}}return bi;}
const latAt=(i,px,py)=>(px-T.x[i])*T.nx(i)+(py-T.y[i])*T.ny(i);
const bpts=b=>{const c=Math.cos(b.a),s=Math.sin(b.a);b.pts=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].map(([u,v])=>[b.x+c*u*b.w-s*v*b.d,b.y+s*u*b.w+c*v*b.d]);return b;};
const coinRow=(m,lat)=>{for(let k=0;k<6;k++){const p=trackAt(m.s+(k-2.5)*36,lat);PK.push({type:'coin',x:p.x,y:p.y,on:true,t:0,ph:k*.6});}};
const boxRow=m=>{[-.56,0,.56].forEach((o,k)=>{const p=trackAt(m.s,o*HALF);PK.push({type:'box',x:p.x,y:p.y,on:true,t:0,ph:k*2.1});});};

// Brno: řídicí body přepsané z Martinovy mapky (pixely obrázku, 42 bodů), měřítko 5, start na Husově ulici směrem na sever

const TRACKS={
  tokyo:{id:'tokyo',name:'Tokio',sub:'Neonové uličky',style:'tokyo',banner:'TOKIO · START',sideC:'#b4473e',
    blurb:'Tři kola neonovými ulicemi Tokia, za volantem z kokpitu. Sbírej penízky, najížděj na oranžové pásy, z modrých otazníků ber předměty, skákej na skokáncích a vyhýbej se kuželům a zábranám.',
    // body přepsané z Martinova náčrtu (pixely obrázku), měřítko 6; start na levé rovince, jede se po směru hodin
    tk:(px,py)=>[(px-383)*6,(py-485)*6],
    cp(){return [[383,485],[383,420],[377,350],[373,280],[374,210],[400,180],[455,172],[492,188],[515,225],[545,258],[600,259],[655,260],[695,275],[718,305],
      [732,350],[745,393],[775,405],[815,420],[832,448],[815,475],[775,492],[730,500],[713,525],[713,568],[740,592],[755,625],[757,680],[738,712],[690,716],
      [630,712],[590,728],[540,758],[475,790],[420,801],[383,792],[372,760],[373,700],[378,620],[383,545]].map(p=>this.tk(p[0],p[1]));},
    ground(){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),R=rng(11);
      g.fillStyle='#8c8f93';g.fillRect(0,0,128,128);
      for(let i=0;i<700;i++){g.fillStyle=R()<.5?'rgba(255,255,255,.07)':'rgba(0,0,0,.08)';g.fillRect(R()*128,R()*128,1.5,1.5);}
      g.strokeStyle='rgba(0,0,0,.14)';g.lineWidth=1;for(let i=0;i<=128;i+=32){g.beginPath();g.moveTo(i,0);g.lineTo(i,128);g.moveTo(0,i);g.lineTo(128,i);g.stroke();}
      return c;},
    city(){
      const R=rng(17),blds=[],lamps=[],signs=[],shops=[];
      const CRN=[[-.5,-.5],[.5,-.5],[-.5,.5],[.5,.5],[0,0],[0,-.5],[0,.5],[-.5,0],[.5,0]];
      const fits=(cx,cy,a,w,d,m)=>{const c=Math.cos(a),s=Math.sin(a);for(const [u,v] of CRN){const px=cx+c*u*w-s*v*d,py=cy+s*u*w+c*v*d;if(coarseDist(px,py)<WALL+m)return false;}return true;};
      const clash=(cx,cy,rad)=>blds.some(b=>{const dx=b.x-cx,dy=b.y-cy,q=(b.rad+rad)*.7;return dx*dx+dy*dy<q*q;});
      const PAL=['#dcd7ca','#c9ccd1','#e8e3d8','#b9bfc6','#d8cbb5','#aeb7bf','#ecebe4','#c6b9a8','#d9d0c4','#9fa9b3'];
      // přední řada domů podél ulice, s neony a štíty obchodů
      for(const side of [1,-1]){let s=0;
        while(s<L){const w=44+R()*62,d=60+R()*70,h=(48+R()*140)*(R()<.22?1.9:1);
          const p=trackAt(s+w/2,0),i=p.i,nx=T.nx(i)*side,ny=T.ny(i)*side,off=WALL+3+d/2,cx=p.x+nx*off,cy=p.y+ny*off,rad=Math.hypot(w,d)/2;
          if(fits(cx,cy,p.a,w,d,2)&&!clash(cx,cy,rad)){
            blds.push(bpts({x:cx,y:cy,a:p.a,w,d,h,rad,c:PAL[Math.floor(R()*PAL.length)]}));
            const fx=Math.cos(p.a),fy=Math.sin(p.a);
            if(h>62&&R()<.8){const sh=32+R()*Math.min(70,h-46),y0=Math.min(h-sh/2-4,24+sh/2+R()*Math.max(0,h-sh-40)),u=(R()<.5?-1:1)*(w/2-5);
              const bx=cx+fx*u-nx*(d/2+7),by=cy+fy*u-ny*(d/2+7);
              signs.push({x:bx,y:by,y0,h:sh,w:12,rot:Math.atan2(-fx,-fy),tex:Math.floor(R()*8)});}
            if(R()<.85)shops.push({x:cx-nx*(d/2+.8),y:cy-ny*(d/2+.8),y0:17,w:w*.84,h:9,rot:Math.atan2(-nx,-ny),tex:Math.floor(R()*6)});
            s+=w+2+R()*6;}
          else s+=14;}}
      // bloky domů dál od ulice (panorama)
      const bx0=T.minX-1100,by0=T.minY-1100,bw=T.maxX-T.minX+2200,bh=T.maxY-T.minY+2200;
      for(let k=0;k<3000&&blds.length<950;k++){const w=70+R()*130,d=70+R()*130,h=(70+R()*230)*(R()<.18?2.2:1),cx=bx0+R()*bw,cy=by0+R()*bh,rad=Math.hypot(w,d)/2;
        if(fits(cx,cy,0,w,d,40)&&!clash(cx,cy,rad))blds.push(bpts({x:cx,y:cy,a:0,w,d,h,rad,c:PAL[Math.floor(R()*PAL.length)]}));}
      // lampy u zdí, rameno nad chodník; některé s červeným lampionem
      for(const side of [1,-1])for(let s=60;s<L;s+=165){const p=trackAt(s,side*(WALL-4));if(coarseDist(p.x,p.y)<WALL-8)continue;
        const nx=T.nx(p.i)*side,ny=T.ny(p.i)*side;lamps.push({x:p.x,y:p.y,hx:p.x-nx*16,hy:p.y-ny*16,a:p.a,lan:R()<.45});}
      return {blds,lamps,signs,shops,trees:[],lm:null};
    },
    items(){
      const at=(px,py)=>{const [wx,wy]=this.tk(px,py),i=nearIdx(wx,wy);return {i,s:i*DS,lat:latAt(i,wx,wy)};};
      // žlutě: mince, řada 6 kusů
      [[382,385],[680,265],[640,716]].forEach(([px,py])=>{const m=at(px,py);coinRow(m,clamp(m.lat,-.35*HALF,.35*HALF));});
      // modře: tři otazníky napříč ulicí
      [[375,327],[722,313],[580,737]].forEach(([px,py])=>boxRow(at(px,py)));
      // oranžově: zrychlovací pásy
      [[558,260],[715,717],[375,720]].forEach(([px,py])=>{const m=at(px,py),p=trackAt(m.s,0);PADS.push({x:p.x,y:p.y,a:p.a});});
      // skokánky: za pásem na levé rovince (doskok před cílem) a na horní rovince (doskok do mincí)
      [[378,615],[598,259]].forEach(([px,py])=>{const m=at(px,py),p=trackAt(m.s,0);JUMPS.push({x:p.x,y:p.y,a:p.a,i:p.i,hl:28,hw:50});});
      // zábrany silničářů přes půlku ulice, kužely před nimi
      [[757,648,1],[452,172,-1]].forEach(([px,py,sd])=>{const m=at(px,py),lat=sd*.5*HALF,p=trackAt(m.s,lat);
        const b={x:p.x,y:p.y,a:p.a,hl:52,hw:17,h:24,i:p.i,lat};BARRS.push(b);AVOID.push({i:p.i,lat,hw:b.hw,len:Math.ceil(b.hl/DS)});
        [-80,-118].forEach(o=>{const q=trackAt(m.s+o,lat+(o<-100?-sd*14:0));CONES.push({x:q.x,y:q.y,x0:q.x,y0:q.y,on:true,t:0,i:q.i,lat:latAt(q.i,q.x,q.y)});});});
      // slalom z kuželů na spodní diagonále
      {const m=at(508,775);for(let k=0;k<5;k++){const lat=(k%2?.4:-.4)*HALF,q=trackAt(m.s+k*64,lat);CONES.push({x:q.x,y:q.y,x0:q.x,y0:q.y,on:true,t:0,i:q.i,lat});}}
      CONES.forEach(c=>AVOID.push({i:c.i,lat:c.lat,hw:7,len:1,cone:c}));
      // přechody pro chodce
      [[374,240],[757,598]].forEach(([px,py])=>{const m=at(px,py),p=trackAt(m.s,0);ZEBRA.push({x:p.x,y:p.y,a:p.a});});
    }
  },
  brno:{id:'brno',name:'Brno',sub:'Husova a Špilberk',style:'brno',banner:'BRNO · START',sideC:'#b3ada1',
    blurb:'Tři kola centrem Brna pod Špilberkem: Husova, Veveří, Úvoz a Pekařská. Sbírej penízky, najížděj na oranžové pásy a z modrých otazníků ber předměty. V dálce poznáš Petrov, Kapucíny a Červený kostel. Domy mají skutečné půdorysy podle dat © přispěvatelé OpenStreetMap. Terén podle výškových dat AWS Terrain Tiles (EU-DEM, SRTM) – trať stoupá a klesá jako ve skutečnosti.',
    tk:brnoW,
    cp(){return BRNO_PX.map(p=>brnoW(p[0],p[1]));},
    // dominanty (pozice v pixelech mapky -> svět)
    lmark(){const w=brnoW;const sp=w(892,1200),pe=w(1237,1428),ka=w(1335,1405),de=w(1117,1416),ck=w(1050,982);
      return {sp:{x:sp[0],y:sp[1]},pe:{x:pe[0],y:pe[1]},ka:{x:ka[0],y:ka[1]},de:{x:de[0],y:de[1]},ck:{x:ck[0],y:ck[1]}};},
    ground(){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),R=rng(13);
      g.fillStyle='#9c968b';g.fillRect(0,0,128,128);
      for(let y=0;y<128;y+=8)for(let x=((y/8)%2)*4;x<128;x+=8){const v=150+R()*50|0;g.fillStyle=`rgb(${v},${v-4},${v-12})`;g.fillRect(x+.5,y+.5,7,7);}
      g.strokeStyle='rgba(40,36,30,.25)';g.lineWidth=1;for(let i=0;i<=128;i+=8){g.beginPath();g.moveTo(i,0);g.lineTo(i,128);g.moveTo(0,i);g.lineTo(128,i);g.stroke();}
      return c;},
    city(){
      const R=rng(23),blds=[],lamps=[],signs=[],shops=[],trees=[],lm=this.lmark();
      // dominanty mají vlastní model; kolem nich skutečné domy vynecháme
      const KEEP=[{x:lm.sp.x,y:lm.sp.y,r:600},{x:lm.pe.x,y:lm.pe.y,r:330},{x:lm.ka.x,y:lm.ka.y,r:90},{x:lm.de.x,y:lm.de.y,r:190},{x:lm.ck.x,y:lm.ck.y,r:80}];
      const inKeep=(x,y)=>KEEP.some(k=>{const dx=k.x-x,dy=k.y-y;return dx*dx+dy*dy<k.r*k.r;});
      const PAL=['#ecd9a8','#e8c9a0','#efe3c2','#d9b99a','#cfdcc5','#c3d3e0','#ead0cf','#f0e8d8','#dcc9b0','#e4d3a0','#e9bfa8','#d6dbb8'];
      const ROOF=['#b4502f','#a8472c','#c4623a','#9a4a32','#7e4030','#666b70','#b85c36'];
      const MIN=WALL+14,fixed=[],moved=[];
      for(const o of BRNO_OSM){
        let pts=[];for(let i=0;i<o[4].length;i+=2)pts.push([o[0]+o[4][i],o[1]+o[4][i+1]]);
        let cx=0,cy=0;pts.forEach(p=>{cx+=p[0];cy+=p[1];});cx/=pts.length;cy/=pts.length;
        if(inKeep(cx,cy))continue;
        // skutečné domy stojí blíž k ulici než zdi hry: odsuň je od vozovky
        let sx=0,sy=0;
        for(let it=0;it<6;it++){
          let worst=1e9,wq=null;
          for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/40));
            for(let k=0;k<n;k++){const q=[a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n],d=coarseDist(q[0],q[1]);if(d<worst){worst=d;wq=q;}}}
          if(worst>=MIN)break;
          const ni=nearIdx(wq[0],wq[1]),vx=wq[0]-T.x[ni],vy=wq[1]-T.y[ni],vl=Math.hypot(vx,vy)||1,push=MIN-worst+3,dx=vx/vl*push,dy=vy/vl*push;
          pts=pts.map(p=>[p[0]+dx,p[1]+dy]);sx+=dx;sy+=dy;cx+=dx;cy+=dy;
        }
        const sh=Math.hypot(sx,sy);if(sh>300)continue;
        let rad=0;pts.forEach(p=>{rad+=Math.hypot(p[0]-cx,p[1]-cy);});rad/=pts.length;
        const lv=o[2],h=28*lv+12+(R()-.5)*4;
        const b={x:cx,y:cy,pts,rad,lv,h,c:PAL[Math.floor(R()*PAL.length)],rc:ROOF[Math.floor(R()*ROOF.length)]};
        (sh>4?moved:fixed).push(b);
      }
      fixed.forEach(b=>blds.push(b));
      moved.forEach(b=>{if(!blds.some(q=>{const dx=q.x-b.x,dy=q.y-b.y,m=(q.rad+b.rad)*.75;return dx*dx+dy*dy<m*m;}))blds.push(b);});
      // cedule a výlohy na fasádách přivrácených k ulici
      for(const b of blds){
        let best=null,bd=1e9;
        for(let i=0;i<b.pts.length;i++){const a=b.pts[i],c=b.pts[(i+1)%b.pts.length],len=Math.hypot(c[0]-a[0],c[1]-a[1]);if(len<38)continue;
          const mx=(a[0]+c[0])/2,my=(a[1]+c[1])/2,d=coarseDist(mx,my);if(d<bd){bd=d;best={a,c,len,mx,my};}}
        if(!best||bd>MIN+45)continue;
        const ni=nearIdx(best.mx,best.my);let ux=T.x[ni]-best.mx,uy=T.y[ni]-best.my;const ul=Math.hypot(ux,uy)||1;ux/=ul;uy/=ul;
        if((b.x-best.mx)*ux+(b.y-best.my)*uy>0)continue;
        const fx=(best.c[0]-best.a[0])/best.len,fy=(best.c[1]-best.a[1])/best.len;
        if(R()<.45)shops.push({x:best.mx+ux*.8,y:best.my+uy*.8,y0:19,w:Math.min(best.len*.7,70),h:9,rot:Math.atan2(ux,uy),tex:Math.floor(R()*6)});
        if(R()<.3&&b.lv>1){const sh=30+R()*40,y0=Math.min(b.h-sh/2-4,26+sh/2+R()*40),u=(R()<.5?-1:1)*(best.len/2-5);
          signs.push({x:best.mx+fx*u+ux*7,y:best.my+fy*u+uy*7,y0,h:sh,w:12,rot:Math.atan2(-fx,-fy),tex:Math.floor(R()*8)});}
      }
      // lampy u zdí
      for(const side of [1,-1])for(let s=70;s<L;s+=150){const p=trackAt(s,side*(WALL-4));if(coarseDist(p.x,p.y)<WALL-8)continue;
        const nx=T.nx(p.i)*side,ny=T.ny(p.i)*side;lamps.push({x:p.x,y:p.y,hx:p.x-nx*14,hy:p.y-ny*14,a:p.a,lan:false});}
      // stromy na Špilberku, Petrově a v Denisových sadech
      const scatter=(cx,cy,n,r0,r1,sz)=>{for(let k=0;k<n;k++){const a=R()*TAU,r=r0+R()*(r1-r0);trees.push({x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r,r:sz*(.8+R()*.5),h:sz*2.2,c:Math.floor(R()*5),y0:0,park:true});}};
      scatter(lm.sp.x,lm.sp.y,230,150,570,22);scatter(lm.pe.x,lm.pe.y,60,130,300,20);scatter(lm.de.x,lm.de.y,22,40,150,15);
      return {blds,lamps,signs,shops,trees,lm};
    },

    items(){
      const at=(px,py)=>{const [wx,wy]=brnoW(px,py),i=nearIdx(wx,wy);return {i,s:i*DS,lat:latAt(i,wx,wy)};};
      // žlutě: mince
      [[932,654],[659,759],[702,1160]].forEach(([px,py])=>{const m=at(px,py);coinRow(m,clamp(m.lat,-.35*HALF,.35*HALF));});
      // oranžově: zrychlovací pásy
      [[665,636],[1072,844],[692,1078],[1118,1147],[782,1350]].forEach(([px,py])=>{const m=at(px,py),p=trackAt(m.s,0);PADS.push({x:p.x,y:p.y,a:p.a});});
      // modré otazníky nebyly v náčrtu: tři řady na dlouhých úsecích
      [[1109,990],[808,478],[670,980]].forEach(([px,py])=>boxRow(at(px,py)));
      // přechody pro chodce
      [[1118,1090],[669,700]].forEach(([px,py])=>{const m=at(px,py),p=trackAt(m.s,0);ZEBRA.push({x:p.x,y:p.y,a:p.a});});
    }
  }
};
