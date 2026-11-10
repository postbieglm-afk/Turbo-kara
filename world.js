/* Turbo Kára · world.js: život na mapě, volná jízda a načtení trati */
'use strict';
/* ---------- život na mapě: ideální stopa, louže oleje, chodci, vítr ---------- */
const PUDDLES=[],PEDS=[],FLAGS=[],VEND=[],RAILS=[],CHEV=[];
const WIND={a0:.6,a:.6,s:.6,t:0,parts:[]};
let RL=null,SHOWLINE=true;
try{if(localStorage.getItem('tk-line')==='0')SHOWLINE=false;}catch(e){}
const rlColor=v=>v>=MAX*.96?'#3ddc84':v>=MAX*.78?'#f6d33c':'#ff5a4d';
function genLife(){
  PUDDLES.length=PEDS.length=FLAGS.length=VEND.length=0;WIND.parts.length=0;
  const tokyo=TRK.id!=='brno',R=rng(tokyo?71:77);
  // ideální stopa: vyhlazená stopa AI a doporučená rychlost s brzdnými body před zatáčkami
  const rl=new Float32Array(N),vs=new Float32Array(N);
  for(let i=0;i<N;i++){let s=0;for(let q=-10;q<=10;q++)s+=T.rl[(i+q+N)%N];rl[i]=s/21;vs[i]=Math.min(MAX,T.vt[i]);}
  for(let pass=0;pass<2;pass++)for(let i=N-1;i>=0;i--){const j=(i+1)%N;vs[i]=Math.min(vs[i],Math.sqrt(vs[j]*vs[j]+2*BRAKE*.8*DS));}
  RL={rl,vs};
  // louže oleje: tři na trati, mimo pásy, skokánky, zábrany a otazníky
  const busy=[...PADS,...JUMPS,...BARRS,...PK.filter(p=>p.type==='box'),{x:T.x[0],y:T.y[0]}];
  [.2,.47,.74].forEach((f,n)=>{let s=f*L;for(let k=0;k<40;k++){const p=trackAt(s,0);if(busy.every(b=>Math.hypot(b.x-p.x,b.y-p.y)>190))break;s+=60;}
    const lat=(n%2?.38:-.38)*HALF,p=trackAt(s,lat),blobs=[];for(let k=0;k<3;k++)blobs.push({u:(R()-.5)*28,v:(R()-.5)*18,r:9+R()*9});
    PUDDLES.push({x:p.x,y:p.y,a:p.a+R()*.8,r:27,i:p.i,lat,blobs});AVOID.push({i:p.i,lat,hw:24,len:2});});
  // chodci po chodnících a u přechodů
  const COATS=tokyo?['#283a5c','#d9c8a8','#6b6f75','#1d1f22','#9fc2dc','#f2f0e8','#7a2f3a','#4f6b4a']:['#5a4636','#2f4f6b','#7b2e2e','#3f5d3f','#c9b48c','#2a2a2e','#8a6f4e','#6b7d8a'];
  const SKIN=['#f1d3b6','#e2b896','#c99a74','#a87a56','#f6dcc4'];
  const mk=(o)=>Object.assign({hop:0,push:0,ph:R()*TAU,c:COATS[Math.floor(R()*COATS.length)],sk:SKIN[Math.floor(R()*SKIN.length)],hs:.92+R()*.18,x:0,y:0,a:0},o);
  for(const side of [1,-1])for(let s=40+R()*80;s<L;s+=95+R()*150){const p=trackAt(s,side*(WALL-7));if(coarseDist(p.x,p.y)<WALL-10)continue;
    PEDS.push(mk({s,side,lat0:WALL-7,dir:R()<.5?1:-1,v:13+R()*13,stand:false}));}
  ZEBRA.forEach(zb=>{const i=nearIdx(zb.x,zb.y);for(const side of [1,-1])for(let k=0;k<2;k++)PEDS.push(mk({s:i*DS+(k?-9:9)+(R()-.5)*6,side,lat0:HALF+12+R()*8,dir:1,v:0,stand:true}));});
  // svodidla: v zatáčkách a v mezerách mezi domy, kousek před zdí; v ostrých zatáčkách směrové tabule
  RAILS.length=CHEV.length=0;
  const inPoly=(px,py,P)=>{let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>py)!==(b[1]>py)&&px<(b[0]-a[0])*(py-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
  const covered=(px,py)=>CITY.blds.some(b=>{const dx=px-b.x,dy=py-b.y,rr=b.rad+8;if(dx*dx+dy*dy>rr*rr*(b.w?1:2.2))return false;
    if(b.w===undefined){if(inPoly(px,py,b.pts))return true;for(let i=0;i<b.pts.length;i++){const a=b.pts[i],c=b.pts[(i+1)%b.pts.length],ex=c[0]-a[0],ey=c[1]-a[1],l2=ex*ex+ey*ey||1,t=Math.max(0,Math.min(1,((px-a[0])*ex+(py-a[1])*ey)/l2));if(Math.hypot(px-a[0]-ex*t,py-a[1]-ey*t)<5)return true;}return false;}
    const c=Math.cos(b.a),s=Math.sin(b.a),u=dx*c+dy*s,v=-dx*s+dy*c;return Math.abs(u)<b.w/2+4&&Math.abs(v)<b.d/2+4;});
  const nearZebra=i=>ZEBRA.some(z=>Math.hypot(T.x[i]-z.x,T.y[i]-z.y)<70)||Math.hypot(T.x[i]-T.x[0],T.y[i]-T.y[0])<70;
  for(const side of (tokyo&&!T.free?[1,-1]:[])){const on=new Uint8Array(N);
    for(let i=0;i<N;i++){let tight=false;for(let o=-8;o<=8;o+=2)if(Math.abs(T.k3[(i+o+N)%N])>1/420){tight=true;break;}
      const p=trackAt(i*DS,side*(WALL+12)),q=trackAt(i*DS,side*(WALL-2));
      on[i]=(tight||!covered(p.x,p.y))&&coarseDist(q.x,q.y)>WALL-6&&!nearZebra(i)?1:0;}
    for(let pass=0;pass<2;pass++)for(let i=0;i<N;i++){if(!on[i]&&on[(i-1+N)%N]&&(on[(i+1)%N]||on[(i+2)%N]))on[i]=1;}
    let st=0;while(on[st]&&st<N-1)st++;
    for(let q=0;q<N;){const i=(st+q)%N;if(on[i]){let len=0;while(len<N&&on[(i+len)%N])len++;if(len>=4)RAILS.push({side,i0:i,len});q+=len;}else q++;}
    for(let i=0;i<N;i+=5){const kk=T.k3[i];if(Math.abs(kk)<1/300||Math.sign(kk)===side)continue;if(!on[i])continue;
      const p=trackAt(i*DS,side*(WALL-3)),nx=T.nx(i)*side,ny=T.ny(i)*side;CHEV.push({x:p.x,y:p.y,rot:Math.atan2(-T.tx[i],-T.ty[i]),right:kk>0});}}
  // vlajky nobori u obchodů a automaty na pití (Tokio)
  if(PEDS.length>260){const keep=PEDS.filter((p,k)=>p.stand||k%Math.ceil(PEDS.length/240)===0);PEDS.length=0;PEDS.push(...keep);}
  if(tokyo){CITY.shops.forEach((sh,k)=>{if(k%3||FLAGS.length>=90)return;const rx=Math.sin(sh.rot),ry=Math.cos(sh.rot);FLAGS.push({x:sh.x+rx*6,y:sh.y+ry*6,rot:sh.rot,ph:R()*TAU,tex:Math.floor(R()*4)});});
    for(const side of [1,-1])for(let s=150+R()*200;s<L;s+=260+R()*260){const p=trackAt(s,side*(WALL+1));if(coarseDist(p.x,p.y)<WALL-4)continue;
      VEND.push({x:p.x,y:p.y,a:p.a+(side<0?Math.PI:0),c:Math.floor(R()*3)});}}
  // vítr: okvětní lístky v Tokiu, podzimní listí v Brně
  const PC=tokyo?['#f7c6d6','#f3a9c2','#fbe3ea','#ffffff','#f7c6d6']:['#d17a2b','#c9a03a','#e0b23d','#a65a2a','#88ab45'];
  for(let k=0;k<260;k++)WIND.parts.push({x:T.x[0]+(R()-.5)*1200,y:T.y[0]+(R()-.5)*1200,z:8+R()*90,k:.6+R()*.6,ph:R()*TAU,rot:R()*TAU,spin:(R()-.5)*8,c:PC[k%PC.length],h:k%2});
  WIND.a0=R()*TAU;
}
function updLife(dt){
  WIND.t+=dt;const t=WIND.t;WIND.a=WIND.a0+.5*Math.sin(t*.05);WIND.s=clamp(.55+.3*Math.sin(t*.23)+.18*Math.sin(t*1.3+1),.1,1);
  const wx=Math.cos(WIND.a),wy=Math.sin(WIND.a),wv=40+110*WIND.s;
  for(const p of PEDS){
    if(!p.stand){p.s=((p.s+p.dir*p.v*dt)%L+L)%L;p.ph+=dt*p.v*.3;}else p.ph+=dt*1.2;
    if(p.hop>0)p.hop=Math.max(0,p.hop-dt);p.push=Math.max(0,p.push-dt*4);
    const q=trackAt(p.s,p.side*(p.lat0+p.push));p.x=q.x;p.y=q.y;
    p.a=p.stand?Math.atan2(-T.ny(q.i)*p.side,-T.nx(q.i)*p.side):q.a+(p.dir<0?Math.PI:0);
    for(const r of G.r){const dx=r.x-p.x,dy=r.y-p.y;if(dx*dx+dy*dy<56*56&&Math.abs(r.vf)>60&&p.hop<=0){p.hop=.5;p.push=6;}}}
  const hs=G.humans.map(i=>G.r[i]),RR=650;
  WIND.parts.forEach((q,k)=>{const ref=hs[k%hs.length]||G.r[0];
    q.x+=(wx*q.k*wv+Math.sin(t*2+q.ph)*14)*dt;q.y+=(wy*q.k*wv+Math.cos(t*1.7+q.ph)*14)*dt;q.z+=(-9+Math.sin(t*3+q.ph)*10)*dt;q.rot+=dt*q.spin;
    const dx=q.x-ref.x,dy=q.y-ref.y;if(dx*dx+dy*dy>RR*RR||q.z<1){const a=Math.random()*TAU,d=Math.random()*RR;q.x=ref.x+Math.cos(a)*d;q.y=ref.y+Math.sin(a)*d;q.z=10+Math.random()*90;}});
}
// flek oleje na obrazovce: pár kapek s potůčky, pomalu stékají a mizí
function makeSplat(){const R=Math.random,out=[];const n=5+Math.floor(R()*4);
  for(let k=0;k<n;k++){const pts=[];for(let i=0;i<12;i++)pts.push(.75+R()*.45);
    out.push({x:.08+R()*.84,y:.08+R()*.6,r:.05+R()*.11,pts,drips:[0,1,2].filter(()=>R()<.7).map(()=>({dx:(R()-.5)*1.2,len:.6+R()*1.6,w:.12+R()*.12}))});}
  return out;}
function drawSplat(V,r){
  if(!(r.splatT>0)||!r.splat)return;const a=clamp(r.splatT/1.2,0,1),age=3.6-r.splatT,m=Math.min(V.w,V.h);
  ctx.save();ctx.beginPath();ctx.rect(V.x,V.y,V.w,V.h);ctx.clip();
  for(const b of r.splat){const cx=V.x+b.x*V.w,cy=V.y+b.y*V.h+age*m*.012,rr=b.r*m;
    ctx.globalAlpha=.92*a;ctx.fillStyle='#0b0d0e';ctx.beginPath();
    b.pts.forEach((k,i)=>{const an=i/b.pts.length*TAU,x=cx+Math.cos(an)*rr*k,y=cy+Math.sin(an)*rr*k;ctx[i?'lineTo':'moveTo'](x,y);});ctx.closePath();ctx.fill();
    for(const d of b.drips){const x=cx+d.dx*rr,w=d.w*rr,len=rr*d.len*(1+age*.6);ctx.beginPath();ctx.moveTo(x-w,cy);ctx.lineTo(x-w*.6,cy+len);ctx.arc(x,cy+len,w*.8,Math.PI,0,true);ctx.lineTo(x+w,cy);ctx.fill();}
    const gr=ctx.createRadialGradient(cx-rr*.3,cy-rr*.35,rr*.05,cx,cy,rr);gr.addColorStop(0,'rgba(150,130,235,.45)');gr.addColorStop(.45,'rgba(90,210,190,.22)');gr.addColorStop(1,'rgba(0,0,0,0)');
    ctx.globalAlpha=a;ctx.fillStyle=gr;ctx.beginPath();ctx.arc(cx,cy,rr*.95,0,TAU);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.5)';ctx.beginPath();ctx.ellipse(cx-rr*.35,cy-rr*.4,rr*.16,rr*.07,-.6,0,TAU);ctx.fill();}
  ctx.restore();ctx.globalAlpha=1;
}
// drift: konec driftu, za nabité jiskry mini-turbo
const DRIFT_C=['rgba(235,235,235,.65)','#5cc8f2','#f07a24','#c77dff'];
function endDrift(r,give){
  if(give&&r.driftL>0){r.boostT=Math.max(r.boostT,[0,.7,1.2,1.7][r.driftL]);r.mtN++;if(!r.ai)sfx('boost');}
  r.drift=0;r.driftT=0;r.driftL=0;
}
/* ---------- volná jízda: síť ulic = závodní okruh + mřížka uliček kolem i skrz ---------- */
/* ---------- volná jízda v Tokiu podle Martinova náčrtku: ovál a v něm pravoúhlá síť ulic ---------- */
// souřadnice v pixelech obrázku; S = jednotky hry na pixel, střed obrázku je počátek
const FREE_TK={S:12,cx:557,cy:272.5,
  oval:{y0:148,y1:397,xl:320,xr:780,rl:83,rr:98},
  streets:[[[237,272.5],[878,272.5]],[[360,148],[360,397]],[[472,148],[472,397]],[[578,148],[578,272.5]],[[745,148],[745,397]],
    [[657,272.5],[657,397]],[[522,272.5],[522,397]],[[360,208],[472,208]],[[657,333],[745,333]]],
  plazas:[[365,152,468,208],[476,275,520,392],[660,275,742,333]],
  spawn:[578,272.5],
  pads:[[355,148],[412,272.5],[754,148],[343,397],[741,397]],
  jumps:[[524,148],[505,272.5],[693,272.5],[543,397]],
  coins:[[465,148],[849,199],[745,208],[307,272.5],[636,272.5],[360,324],[472,327],[256,341],[659,397]],
  boxes:[[264,189],[360,184],[578,204],[653,148],[850,343],[475,397]]};
const ftw=(p)=>[(p[0]-FREE_TK.cx)*FREE_TK.S,(p[1]-FREE_TK.cy)*FREE_TK.S];
// polyline oválu a ulic, vzorkovaná po DSn
function freeLayoutPolys(DSn){const F=FREE_TK,o=F.oval,pts=[],step=DSn/F.S,my=(o.y0+o.y1)/2,ry=(o.y1-o.y0)/2;
  const seg=(a,b)=>{const n=Math.max(1,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/step));for(let k=0;k<n;k++)pts.push(ftw([a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n]));};
  const arc=(cx,rx,a0,a1)=>{const len=Math.PI*(rx+ry)/2,n=Math.max(8,Math.round(len/step));for(let k=0;k<n;k++){const a=a0+(a1-a0)*k/n;pts.push(ftw([cx+Math.cos(a)*rx,my+Math.sin(a)*ry]));}};
  seg([o.xl,o.y0],[o.xr,o.y0]);arc(o.xr,o.rr,-Math.PI/2,Math.PI/2);seg([o.xr,o.y1],[o.xl,o.y1]);arc(o.xl,o.rl,Math.PI/2,Math.PI*1.5);
  const polys=[{pts,closed:true}];
  for(const [a,b] of F.streets){const q=[],n=Math.max(2,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/step));for(let k=0;k<=n;k++)q.push(ftw([a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n]));polys.push({pts:q,closed:false});}
  return polys;}
// předměty z náčrtku; náměstí bez domů
function freeLayoutItems(){const F=FREE_TK,at=p=>{const [x,y]=ftw(p),[,i]=gridNear(x,y);return {i,x:T.x[i],y:T.y[i],a:Math.atan2(T.ty[i],T.tx[i])};};
  for(const p of F.pads){const q=at(p);PADS.push({x:q.x,y:q.y,a:q.a});}
  for(const p of F.jumps){const q=at(p);JUMPS.push({x:q.x,y:q.y,a:q.a,i:q.i,hl:28,hw:50});}
  for(const p of F.coins){const q=at(p),c=Math.cos(q.a),s=Math.sin(q.a);for(let k=0;k<5;k++){const u=(k-2)*38;PK.push({type:'coin',x:q.x+c*u,y:q.y+s*u,on:true,t:0,ph:k*.6});}}
  for(const p of F.boxes){const q=at(p),c=Math.cos(q.a),s=Math.sin(q.a);[-.56,0,.56].forEach((o,k)=>PK.push({type:'box',x:q.x-s*o*HALF,y:q.y+c*o*HALF,on:true,t:0,ph:k*2.1}));}
  for(const r of F.plazas){const [x0,y0]=ftw([r[0],r[1]]),[x1,y1]=ftw([r[2],r[3]]),cx=(x0+x1)/2,cy=(y0+y1)/2,hx=(x1-x0)/2,hy=(y1-y0)/2,m=70;
    const inR=(x,y,mm)=>Math.abs(x-cx)<hx+mm&&Math.abs(y-cy)<hy+mm;
    CITY.blds=CITY.blds.filter(b=>!inR(b.x,b.y,Math.max(b.w||0,b.d||0)*.5+m));CITY.signs=CITY.signs.filter(o=>!inR(o.x,o.y,m));CITY.shops=CITY.shops.filter(o=>!inR(o.x,o.y,m));
    const rr=Math.min(hx,hy)*.55;for(let k=0;k<8;k++){const a=k/8*TAU;PK.push({type:'coin',x:cx+Math.cos(a)*rr,y:cy+Math.sin(a)*rr,on:true,t:0,ph:k*.5});}
    const wide=hx>=hy;[-1,0,1].forEach((o,k)=>PK.push({type:'box',x:cx+(wide?o*48:0),y:cy+(wide?0:o*48),on:true,t:0,ph:k*2.1}));}
  const [sx,sy]=ftw(F.spawn),[,si]=gridNear(sx,sy);T.spawnS=si*DS;placeGarage();}
// kuřecí garáž (easter egg) v bloku pod pravým náměstím, vrata do ulice vpravo
let GARAGE=null;
function placeGarage(){const g={x:1968,y:1110,w:320,d:230,t:16,open:0,openT:0,hint:0,egg:{x:1938,y:1110,on:true,t:0}};GARAGE=g;
  const inR=(x,y,m)=>x>g.x-g.w/2-m&&x<2260+m&&Math.abs(y-g.y)<g.d/2+m;
  CITY.blds=CITY.blds.filter(b=>!inR(b.x,b.y,Math.max(b.w||0,b.d||0)*.5+30));CITY.signs=CITY.signs.filter(o=>!inR(o.x,o.y,30));CITY.shops=CITY.shops.filter(o=>!inR(o.x,o.y,30));
  CITY.lamps=CITY.lamps.filter(o=>!inR(o.x,o.y,10));
  const W=(x,y,w,d)=>({x,y,a:0,w,d,h:70,rad:Math.hypot(w,d)/2});
  const door=W(g.x+g.w/2-4,g.y,g.t,g.d-g.t);door.door=true;CITY.gwalls=[W(g.x,g.y-g.d/2,g.w,g.t),W(g.x,g.y+g.d/2,g.w,g.t),W(g.x-g.w/2,g.y,g.t,g.d),door];}
// garáž je zavřená; zatroubíš před vraty a otevře se, uvnitř leží zlaté vejce, které tě promění v kuře (a znovu zpátky)
function garageCheck(g){if(!GARAGE||!T.free)return;const q=GARAGE,dx0=q.x+q.w/2,dt=DT,hw=typeof hornWant==='function'?hornWant():[];let inside=false;
  for(const hi of g.humans){const r=g.r[hi],dd=Math.hypot(r.x-dx0,r.y-q.y),inG=Math.abs(r.y-q.y)<q.d/2&&r.x>q.x-q.w/2&&r.x<dx0;if(inG)inside=true;
    if(dd<420&&r.x>dx0-10&&hw[hi]){if(q.openT<=0){sfx('door');g.tip={t:4,title:'GARÁŽ SE OTEVÍRÁ',txt:'Uvnitř něco svítí…'};}q.openT=15;}
    else if(dd<380&&r.x>dx0&&q.open<.1&&q.hint<=0){q.hint=20;g.tip={t:5,title:'ZAVŘENÁ GARÁŽ',txt:touchMode&&!g.remote?'Zkus zatroubit: podrž prst na obrazovce.':'Zkus zatroubit: '+(g.two?'Q nebo pravý Shift':'klávesa H')+'.'};}
    const e=q.egg;if(e.on&&Math.hypot(r.x-e.x,r.y-e.y)<34&&r.z<20){e.on=false;e.t=5;r.chicken=!r.chicken;sfx('cluck');r.shk=Math.max(r.shk,.5);
      for(let i=0;i<24;i++){const a=Math.random()*TAU,v=60+Math.random()*150;addPart(r.x,r.y,Math.cos(a)*v,Math.sin(a)*v,.6+Math.random()*.5,i%3?'#fbfaf4':'#f2c14e',3,'spark');}
      g.tip=r.chicken?{t:5,title:'ZLATÉ VEJCE',txt:'Jsi kuře! Až se vejce znovu objeví, vezmi ho a budeš zase auto.'}:{t:4,title:'ZPÁTKY V AUTĚ',txt:'Kuře zůstalo v garáži.'};}}
  if(!q.egg.on){q.egg.t-=dt;if(q.egg.t<=0)q.egg.on=true;}
  if(q.hint>0)q.hint-=dt;if(inside)q.openT=Math.max(q.openT,3);if(q.openT>0)q.openT-=dt;
  const tgt=q.openT>0?1:0,was=q.open;q.open=clamp(q.open+(tgt?1:-1)*dt*.9,0,1);if(was>0&&q.open===0&&!tgt)sfx('doorclose');}

function genNet(trk){
  const loop=genTrack(trk.cp()),DSn=loop.DS,M=420,SP=660;
  const bx0=loop.minX-M,bx1=loop.maxX+M,by0=loop.minY-M,by1=loop.maxY+M;
  // v Brně se uličky vyhnou Špilberku, Petrovu a Denisovým sadům
  const KP=trk.id==='brno'?(()=>{const lm=trk.lmark();return [[lm.sp,560],[lm.pe,330],[lm.de,170]];})():[];
  const LC=160,LG=new Map();
  for(let i=0;i<loop.N;i++){const key=Math.floor(loop.x[i]/LC)+','+Math.floor(loop.y[i]/LC);let a=LG.get(key);if(!a)LG.set(key,a=[]);a.push(i);}
  const loopNear=(x,y)=>{let b=1e18,bi=-1;const cx=Math.floor(x/LC),cy=Math.floor(y/LC);
    for(let a=-2;a<=2;a++)for(let c=-2;c<=2;c++){const arr=LG.get((cx+a)+','+(cy+c));if(arr)for(const i of arr){const dx=x-loop.x[i],dy=y-loop.y[i],d=dx*dx+dy*dy;if(d<b){b=d;bi=i;}}}
    return [bi<0?999:Math.sqrt(b),bi];};
  const LAY=trk.id==='tokyo';
  const polys=LAY?freeLayoutPolys(DSn):[{pts:[],closed:true}];if(!LAY)for(let i=0;i<loop.N;i++)polys[0].pts.push([loop.x[i],loop.y[i]]);
  // přímá ulička; vynechá úseky souběžné s okruhem (aby se silnice nepřekrývaly) a dominanty
  const addLine=(x0,y0,x1,y1)=>{const len=Math.hypot(x1-x0,y1-y0),n=Math.floor(len/DSn),ux=(x1-x0)/len,uy=(y1-y0)/len;let run=[];
    const flush=()=>{if(run.length>=18)polys.push({pts:run,closed:false});run=[];};
    for(let k=0;k<=n;k++){const x=x0+ux*k*DSn,y=y0+uy*k*DSn;let ok=!KP.some(([p,r])=>Math.hypot(x-p.x,y-p.y)<r);
      if(ok){const [d,bi]=loopNear(x,y);if(bi>=0&&d<2*WALL+40&&Math.abs(ux*loop.tx[bi]+uy*loop.ty[bi])>.6)ok=false;}
      if(ok)run.push([x,y]);else flush();}
    flush();};
  const nxc=Math.max(2,Math.round((bx1-bx0)/SP)),nyc=Math.max(2,Math.round((by1-by0)/SP));
  if(!LAY){for(let k=0;k<=nxc;k++){const x=bx0+(bx1-bx0)*k/nxc;addLine(x,by0,x,by1);}
  for(let k=0;k<=nyc;k++){const y=by0+(by1-by0)*k/nyc;addLine(bx0,y,bx1,y);}}
  const blocks=[];for(let a=0;a<nxc;a++)for(let b=0;b<nyc;b++){const xa=bx0+(bx1-bx0)*a/nxc,xb=bx0+(bx1-bx0)*(a+1)/nxc,ya=by0+(by1-by0)*b/nyc,yb=by0+(by1-by0)*(b+1)/nyc,cx=(xa+xb)/2,cy=(ya+yb)/2;
    blocks.push({cx,cy,hx:(xb-xa)/2-WALL,hy:(yb-ya)/2-WALL,loopD:loopNear(cx,cy)[0]});}
  // spojit do polí jako u okruhu
  let NN=0;polys.forEach(p=>NN+=p.pts.length);
  const x=new Float32Array(NN),y=new Float32Array(NN),tx=new Float32Array(NN),ty=new Float32Array(NN),k=new Float32Array(NN),k3=new Float32Array(NN),
    rl=new Float32Array(NN),vt=new Float32Array(NN).fill(MAX*1.6),pid=new Int16Array(NN),nxt=new Int32Array(NN),jn=new Uint8Array(NN),sw=[new Uint8Array(NN),new Uint8Array(NN)];
  let o=0;
  polys.forEach((p,pi)=>{const n=p.pts.length;p.o=o;p.n=n;
    for(let q=0;q<n;q++){x[o+q]=p.pts[q][0];y[o+q]=p.pts[q][1];pid[o+q]=pi;nxt[o+q]=q<n-1?o+q+1:(p.closed?o:-1);}
    for(let q=0;q<n;q++){let a=q-1,b=q+1;if(p.closed){a=(a+n)%n;b%=n;}else{a=Math.max(0,a);b=Math.min(n-1,b);}
      const dx=p.pts[b][0]-p.pts[a][0],dy=p.pts[b][1]-p.pts[a][1],l=Math.hypot(dx,dy)||1;tx[o+q]=dx/l;ty[o+q]=dy/l;}
    o+=n;});
  polys.forEach(p=>{for(let q=0;q<p.n;q++){let a=q-1,b=q+1;if(p.closed){a=(a+p.n)%p.n;b%=p.n;}else if(a<0||b>=p.n)continue;
      k[p.o+q]=(tx[p.o+a]*ty[p.o+b]-ty[p.o+a]*tx[p.o+b])/(2*DSn);}
    for(let q=0;q<p.n;q++){let s=0,c=0;for(let w=-3;w<=3;w++){let qq=q+w;if(p.closed)qq=(qq+p.n)%p.n;else if(qq<0||qq>=p.n)continue;s+=k[p.o+qq];c++;}k3[p.o+q]=s/c;}});
  // rychlé hledání nejbližšího bodu sítě
  const GC=120,grid=new Map();
  for(let i=0;i<NN;i++){const key=Math.floor(x[i]/GC)+','+Math.floor(y[i]/GC);let a=grid.get(key);if(!a)grid.set(key,a=[]);a.push(i);}
  const nearOther=(px,py,skip)=>{let b=1e18,bi=-1;const cx=Math.floor(px/GC),cy=Math.floor(py/GC);
    for(let a=-2;a<=2;a++)for(let c=-2;c<=2;c++){const arr=grid.get((cx+a)+','+(cy+c));if(arr)for(const i of arr){if(pid[i]===skip)continue;const dx=px-x[i],dy=py-y[i],d=dx*dx+dy*dy;if(d<b){b=d;bi=i;}}}
    return bi<0?999:Math.sqrt(b);};
  const nxf=i=>-ty[i],nyf=i=>tx[i];
  // křižovatky (silnice bez čar) a chodníky, které by ležely na jiné silnici
  for(let i=0;i<NN;i++){if(nearOther(x[i],y[i],pid[i])<HALF+16)jn[i]=1;
    for(const [si,sd] of [[0,1],[1,-1]]){const px=x[i]+nxf(i)*sd*(HALF+20),py=y[i]+nyf(i)*sd*(HALF+20);if(nearOther(px,py,pid[i])<HALF+10)sw[si][i]=1;}}
  const center=new Path2D(),edgeL=new Path2D(),edgeR=new Path2D();
  polys.forEach(p=>{for(let q=0;q<p.n;q++){const i=p.o+q;center[q?'lineTo':'moveTo'](x[i],y[i]);}if(p.closed)center.closePath();
    for(const [P2,sd] of [[edgeL,1],[edgeR,-1]]){let pen=false;for(let q=0;q<=(p.closed?p.n:p.n-1);q++){const i=p.o+(q%p.n),ex=x[i]+nxf(i)*sd*(HALF-7),ey=y[i]+nyf(i)*sd*(HALF-7);
      if(jn[i]){pen=false;continue;}if(!pen){P2.moveTo(ex,ey);pen=true;}else P2.lineTo(ex,ey);}}});
  let minX=1e9,minY=1e9,maxX=-1e9,maxY=-1e9;for(let i=0;i<NN;i++){minX=Math.min(minX,x[i]);maxX=Math.max(maxX,x[i]);minY=Math.min(minY,y[i]);maxY=Math.max(maxY,y[i]);}
  return {N:NN,DS:DSn,L:NN*DSn,x,y,tx,ty,k,k3,rl,vt,nx:nxf,ny:nyf,center,edgeL,edgeR,curbs:new Path2D(),minX,minY,maxX,maxY,
    free:true,blocks,pid,nxt,jn,sw,grid,GC,polys:polys.map(p=>({o:p.o,n:p.n,closed:p.closed})),loopN:polys[0].n,loopL:polys[0].n*DSn};
}
// nejbližší bod sítě přes mřížku (jen volná jízda); [vzdálenost, index]
function gridNear(px,py){const g=T.grid,GC=T.GC;let b=1e18,bi=-1;const cx=Math.floor(px/GC),cy=Math.floor(py/GC);
  for(let a=-2;a<=2;a++)for(let c=-2;c<=2;c++){const arr=g.get((cx+a)+','+(cy+c));if(arr)for(const i of arr){const dx=px-T.x[i],dy=py-T.y[i],d=dx*dx+dy*dy;if(d<b){b=d;bi=i;}}}
  return [bi<0?999:Math.sqrt(b),bi];}
// předměty pro trénink: střídají se mince, pásy, otazníky, skokánky, slalom a zábrany po celé síti
function freeItems(){
  const R=rng(TRK.id==='brno'?303:301),step=Math.round(400/DS);
  const busy=i=>{for(let q=-9;q<=9;q++){const j=i+q;if(j<0||j>=N||T.pid[j]!==T.pid[i]||T.jn[j])return true;}return false;};
  const straight=i=>{for(let q=-8;q<=8;q++)if(Math.abs(T.k3[i+q]||0)>1/1500)return false;return true;};
  const KINDS=['coin','pad','box','jump','coin','cone','pad','jump','box','barrier','coin','jump'];let kk=0;
  for(let i=12;i<N-12;){if(busy(i)){i++;continue;}const kind=KINDS[kk%KINDS.length];if((kind==='jump'||kind==='cone')&&!straight(i)){kk++;i+=4;continue;}kk++;i+=step;
    const s=i*DS;
    if(kind==='coin')coinRow({s},(R()-.5)*.6*HALF);
    else if(kind==='box')boxRow({s});
    else if(kind==='pad'){const p=trackAt(s,0);PADS.push({x:p.x,y:p.y,a:p.a});}
    else if(kind==='jump'){const p=trackAt(s,0);JUMPS.push({x:p.x,y:p.y,a:p.a,i:p.i,hl:28,hw:50});}
    else if(kind==='cone'){for(let c=0;c<5;c++){const lat=(c%2?.4:-.4)*HALF,q=trackAt(s+(c-2)*64,lat);CONES.push({x:q.x,y:q.y,x0:q.x,y0:q.y,on:true,t:0,i:q.i,lat});}}
    else if(kind==='barrier'){const sd=R()<.5?1:-1,lat=sd*.5*HALF,p=trackAt(s,lat);BARRS.push({x:p.x,y:p.y,a:p.a,hl:52,hw:17,h:24,i:p.i,lat});}}
}
/* ---------- volná jízda v Tokiu: tréninkové zóny a otevřený prostor (zastaví jen domy) ---------- */
const ZONES=[];let BGRID=null;
const FREEOPEN=()=>T&&T.free&&TRK.id!=='brno';
function freeZones(){
  ZONES.length=0;const R=rng(404);
  // okruh má stejné rozložení jako závod: pásy, skokánky, mince, otazníky, zábrany a slalom
  {const g=T.grid,n0=N,l0=L;T.grid=null;N=T.loopN;L=T.loopL;try{TRK.items();}finally{T.grid=g;N=n0;L=l0;}}
  // dvě náměstí v blocích daleko od okruhu: domy pryč, místo nich skokanský park a driftová aréna
  const cand=T.blocks.filter(b=>b.loopD>=999&&b.hx>150&&b.hy>150);
  const pick=[];if(cand.length){const mx=(T.minX+T.maxX)/2,my=(T.minY+T.maxY)/2;cand.sort((a,b)=>Math.hypot(a.cx-mx,a.cy-my)-Math.hypot(b.cx-mx,b.cy-my));pick.push(cand[0]);
    let best=null,bd=-1;for(const c of cand){const d=Math.hypot(c.cx-pick[0].cx,c.cy-pick[0].cy);if(d>bd&&d<2400){bd=d;best=c;}}if(best&&best!==pick[0])pick.push(best);}
  const inRect=(x,y,b,m)=>Math.abs(x-b.cx)<b.hx+m&&Math.abs(y-b.cy)<b.hy+m;
  for(const b of pick){CITY.blds=CITY.blds.filter(o=>!inRect(o.x,o.y,b,Math.max(o.w||0,o.d||0)*.45));
    CITY.signs=CITY.signs.filter(o=>!inRect(o.x,o.y,b,8));CITY.shops=CITY.shops.filter(o=>!inRect(o.x,o.y,b,8));}
  if(pick[0]){const b=pick[0],cx=b.cx,cy=b.cy,hx=Math.min(b.hx,b.hy)-20;
    // dvě rampy proti sobě, před každou pás, za každou penízky na místě doskoku
    for(const [dy,dir] of [[-75,1],[75,-1]]){const a=dir>0?0:Math.PI,x0=cx-dir*hx*.8;
      PADS.push({x:x0+dir*30,y:cy+dy,a});JUMPS.push({x:cx-dir*40,y:cy+dy,a,i:nearIdx(cx,cy),hl:28,hw:50});
      for(let k=0;k<4;k++)PK.push({type:'coin',x:cx+dir*(70+k*36),y:cy+dy,on:true,t:0,ph:k*.6});}
    for(let k=0;k<3;k++)PK.push({type:'box',x:cx-50+k*50,y:cy,on:true,t:0,ph:k*2.1});
    ZONES.push({id:'jump',x:cx,y:cy,r:hx+30,label:'SKOKANSKÝ PARK',name:'SKOKANSKÝ PARK',txt:'Najeď na pás, pak rovně na rampu. Ve vzduchu nezatáčej, penízky jsou na místě doskoku.'});}
  if(pick[1]){const b=pick[1],cx=b.cx,cy=b.cy,rr=Math.min(b.hx,b.hy)*.62;
    for(let k=0;k<14;k++){const a=k/14*TAU,x=cx+Math.cos(a)*rr*.62,y=cy+Math.sin(a)*rr*.62;CONES.push({x,y,x0:x,y0:y,on:true,t:0,i:0,lat:0});}
    for(let k=0;k<10;k++){const a=k/10*TAU+.3;PK.push({type:'coin',x:cx+Math.cos(a)*rr*1.15,y:cy+Math.sin(a)*rr*1.15,on:true,t:0,ph:k*.5});}
    PADS.push({x:cx+rr*1.15,y:cy-rr*.95,a:Math.PI/2});
    ZONES.push({id:'drift',x:cx,y:cy,r:rr*1.5,ring:rr*.9,label:'DRIFTOVÁ ARÉNA',name:'DRIFTOVÁ ARÉNA',txt:'Krouž kolem kuželů a drž DRIFT. Čím déle driftuješ, tím silnější turbo. Penízky leží na vnější stopě.'});}
  // rovné úseky uliček mezi křižovatkami: nejdelší dostanou tréninkové dráhy
  const runs=[];
  for(const p of T.polys){if(p.closed)continue;let st=-1;for(let q=0;q<=p.n;q++){const i=p.o+q,on=q<p.n&&!T.jn[i];
    if(on&&st<0)st=q;if(!on&&st>=0){if(q-st>=30)runs.push({i0:p.o+st+3,len:q-st-6});st=-1;}}}
  const far=r=>pick.every(b=>!inRect(T.x[r.i0+(r.len>>1)],T.y[r.i0+(r.len>>1)],b,160));
  const rs=runs.filter(far).sort((a,b)=>b.len-a.len);
  const at=(r,f,lat)=>trackAt((r.i0+Math.round(r.len*f))*DS,lat||0);
  const zone=(r,id,label,txt)=>{const p=at(r,.5);ZONES.push({id,x:p.x,y:p.y,r:r.len*DS*.55,label,name:label,txt,lx:at(r,.04).x,ly:at(r,.04).y,la:at(r,.04).a});};
  if(rs[0]){const r=rs[0],n=Math.max(4,Math.floor(r.len/6)-1);
    for(let c=0;c<n;c++){const f=.12+.76*c/(n-1),lat=(c%2?.4:-.4)*HALF,q=at(r,f,lat);CONES.push({x:q.x,y:q.y,x0:q.x,y0:q.y,on:true,t:0,i:q.i,lat});const m=at(r,f,-lat);PK.push({type:'coin',x:m.x,y:m.y,on:true,t:0,ph:c*.6});}
    zone(r,'slalom','SLALOM','Kličkuj mezi kužely. Penízek je vždycky na druhé straně kuželu.');}
  if(rs[1]){const r=rs[1];[.15,.42].forEach(f=>{const p=at(r,f);PADS.push({x:p.x,y:p.y,a:p.a});});const j=at(r,.72);JUMPS.push({x:j.x,y:j.y,a:j.a,i:j.i,hl:28,hw:50});
    coinRow({s:(r.i0+Math.round(r.len*.92))*DS},0);zone(r,'speed','RYCHLOSTNÍ ROVINKA','Dva pásy za sebou a skokánek na konci. Jak rychle to stihneš?');}
  if(rs[2]){const r=rs[2];boxRow({s:(r.i0+Math.round(r.len*.1))*DS});
    [[.5,1],[.72,-1]].forEach(([f,sd])=>{const lat=sd*.5*HALF,p=at(r,f,lat);BARRS.push({x:p.x,y:p.y,a:p.a,hl:52,hw:17,h:24,i:p.i,lat});});
    r.pud=[.32,.86];zone(r,'shield','ŠTÍT A PŘEKÁŽKY','Na začátku si vezmi otazník. Se štítem projedeš louží i kolem zábran bez úhony.');T.shieldRun=r;}
  // ostatní uličky: řady penízků a sem tam otazník, ať se dá kam jezdit
  rs.slice(3,18).forEach((r,k)=>{if(k%4===3)boxRow({s:(r.i0+(r.len>>1))*DS});else coinRow({s:(r.i0+(r.len>>1))*DS},(k%3-1)*.3*HALF);});
}
// louže pro zónu se štítem (genLife je předtím vymaže)
function freeZonesPost(){const r=T.shieldRun;if(!r)return;
  for(const f of r.pud){const p=trackAt((r.i0+Math.round(r.len*f))*DS,0);PUDDLES.push({x:p.x,y:p.y,a:p.a,r:27,i:p.i,lat:0,blobs:[{u:-12,v:6,r:12},{u:14,v:-5,r:10},{u:4,v:10,r:9}]});}}
// mřížka domů pro srážky
function buildBGrid(){BGRID=new Map();const C2=220;CITY.blds.concat(CITY.gwalls||[]).forEach(b=>{const r=b.rad+16,x0=Math.floor((b.x-r)/C2),x1=Math.floor((b.x+r)/C2),y0=Math.floor((b.y-r)/C2),y1=Math.floor((b.y+r)/C2);
  for(let a=x0;a<=x1;a++)for(let c=y0;c<=y1;c++){const k=a+','+c;let arr=BGRID.get(k);if(!arr)BGRID.set(k,arr=[]);arr.push(b);}});}
// srážka s domy (kruh auta proti otočenému obdélníku domu)
function hitBuildings(r){const arr=BGRID&&BGRID.get(Math.floor(r.x/220)+','+Math.floor(r.y/220));if(!arr)return;
  for(const b of arr){if(b.door&&GARAGE&&GARAGE.open>.75)continue;const dx=r.x-b.x,dy=r.y-b.y,c=Math.cos(b.a),s=Math.sin(b.a),u=dx*c+dy*s,v=-dx*s+dy*c,hl=b.w/2,hw=b.d/2;
    const ex=u-clamp(u,-hl,hl),ey=v-clamp(v,-hw,hw);let d=Math.hypot(ex,ey),nu,nv;if(d>=14)continue;
    if(d>.01){nu=ex/d;nv=ey/d;}else{const pu=hl-Math.abs(u),pv=hw-Math.abs(v);if(pu<pv){nu=Math.sign(u)||1;nv=0;d=-pu;}else{nu=0;nv=Math.sign(v)||1;d=-pv;}}
    const nx=nu*c-nv*s,ny=nu*s+nv*c;r.x+=nx*(14-d);r.y+=ny*(14-d);const vn=r.vx*nx+r.vy*ny;if(vn>=0)continue;
    if(r.shieldT>0){r.vx-=vn*nx;r.vy-=vn*ny;if(vn<-60)r.shieldHit=.35;continue;}
    r.vx-=1.4*vn*nx;r.vy-=1.4*vn*ny;if(vn<-40){r.vx*=.9;r.vy*=.9;}
    if(vn<-110){r.crashN++;if(r.drift)endDrift(r,false);r.shk=Math.max(r.shk,Math.min(1.4,-vn/260));if(!r.ai)sfx('tree');for(let i=0;i<5;i++)addPart(r.x-nx*12,r.y-ny*12,(Math.random()-.5)*120,(Math.random()-.5)*120,.3,'#fff3c4',2.5,'spark');}}
  // okraj světa: daleko za městem jemně zpět
  const m=900;if(r.x<T.minX-m||r.x>T.maxX+m||r.y<T.minY-m||r.y>T.maxY+m){const cx=clamp(r.x,T.minX-m,T.maxX+m),cy=clamp(r.y,T.minY-m,T.maxY+m);r.vx+=(cx-r.x)*4*DT;r.vy+=(cy-r.y)*4*DT;r.vx*=.97;r.vy*=.97;}}
let MINIS=[];
function ensureTrack(free){const id=free?'tokyo':TRK.id;if(!!(T&&T.free)===!!free&&TRK.id===id)return;loadTrack(id,free);
  if(R3){try{disposeScene(R3);R3=build3D(R3);if(R3){R3.qT.redraw();R3.banT.redraw();}}catch(e){R3=null;}}}
function respawn(r){const i=nearIdx(r.x,r.y),a=Math.atan2(T.ty[i],T.tx[i]);r.x=T.x[i];r.y=T.y[i];r.ang=a;r.vx=r.vy=r.vf=0;r.z=r.vz=0;r.spinT=0;r.drift=0;r.offT=0;r.cam.a=a;r.idx=i;}
// trenér: krátké rady, když se jezdec poprvé potká s mechanikou
function coach(key,title,txt){const g=G;if(g.seen[key]||g.tip.t>1.2)return;g.seen[key]=1;g.tip={t:5.5,title,txt};}
function freeCoach(dt){const g=G;g.fs.t+=dt;if(g.tip.t>0)g.tip.t-=dt;if(g.mode!=='race')return;garageCheck(g);const tch=touchMode&&!g.remote;
  for(const hi of g.humans){const r=g.r[hi];r.vmax=Math.max(r.vmax||0,Math.abs(r.vf)*.45);r.inZ=r.inZ||{};
    for(const z of ZONES){const d=Math.hypot(r.x-z.x,r.y-z.y);if(d<z.r&&!r.inZ[z.id]){r.inZ[z.id]=1;g.tip={t:5,title:z.name,txt:z.txt};g.seen['z'+z.id]=1;}else if(d>z.r*1.3)r.inZ[z.id]=0;}
    const ahead=(arr,d)=>arr.some(o=>{const dx=o.x-r.x,dy=o.y-r.y;return dx*dx+dy*dy<d*d&&dx*Math.cos(r.ang)+dy*Math.sin(r.ang)>0;});
    if(r.driftL>=1)coach('drift2','DRIFT','Drž dál a zatáčej: modré, oranžové, fialové jiskry. Pusť a dostaneš turbo.');
    else if(ahead(JUMPS,340))coach('jump','SKOKÁNEK','Najeď rovně a v rychlosti. Ve vzduchu nezatáčíš, skokánek navíc zrychlí.');
    else if(ahead(PADS,280))coach('pad','ZRYCHLOVACÍ PÁS','Přejeď oranžový pás a dostaneš krátké turbo.');
    else if(ahead(PK.filter(p=>p.type==='box'&&p.on),280))coach('box','OTAZNÍK','Projeď otazníkem a dostaneš nitro, olej, nebo štít.');
    else if(r.item)coach('use','PŘEDMĚT',tch?'Ťukni na PŘEDMĚT vpravo dole.':g.remote?'Ťukni na PŘEDMĚT na mobilu.':g.two?'Hráč 1 klávesou F, hráč 2 klávesou Enter.':'Použij ho mezerníkem.');
    else if(ahead(CONES.filter(k=>k.on),300))coach('cone','SLALOM','Projeď mezi kužely bez dotyku. Každý kužel tě zpomalí.');
    else if(ahead(PUDDLES,320))coach('oil','LOUŽE OLEJE','Otočí tě dokola. Se štítem projedeš bez úhony.');
    else if(ahead(BARRS,320))coach('bar','ZÁBRANA','Objeď ji. Se štítem po ní jen sklouzneš.');
    else if(g.fs.t>9)coach('drift1','ZKUS DRIFT',(tch||g.remote?'Drž DRIFT':g.two?'Drž S (hráč 2 šipku dolů)':'Drž šipku dolů')+' a v rychlosti zatáčej.');}}
function loadTrack(id,free){
  TRK=TRACKS[id]||TRACKS.tokyo;TERR=TRK.id==='brno'?buildTerrain():null;
  T=free?genNet(TRK):genTrack(TRK.cp());N=T.N;DS=T.DS;L=T.L;
  PK.length=PADS.length=JUMPS.length=CONES.length=BARRS.length=ZEBRA.length=AVOID.length=0;
  ZONES.length=0;BGRID=null;GARAGE=null;
  CITY=TRK.city();if(free&&TRK.id==='tokyo')freeLayoutItems();else if(free&&TRK.id!=='brno')freeZones();else if(free)freeItems();else TRK.items();genLife();
  if(free&&TRK.id!=='brno'){freeZonesPost();buildBGrid();}
  groundCanvas=TRK.ground();groundPat=ctx.createPattern(groundCanvas,'repeat');
  MINI=[];for(let i=0;i<(T.loopN||N);i+=4)MINI.push([T.x[i],T.y[i]]);
  MINIS=T.free?T.polys.map(p=>{const pts=[];for(let q=0;q<p.n;q+=4)pts.push([T.x[p.o+q],T.y[p.o+q]]);if(!p.closed)pts.push([T.x[p.o+p.n-1],T.y[p.o+p.n-1]]);return {pts,closed:p.closed};}):[{pts:MINI,closed:true}];
  return TRK;
}
const prevT={};
function previewTrack(id){return TRK&&id===TRK.id&&!T.free?T:(prevT[id]||(prevT[id]=genTrack(TRACKS[id].cp())));}
{let id='tokyo';try{const v=localStorage.getItem('tk-track');if(v&&TRACKS[v])id=v;}catch(e){}loadTrack(id);}

