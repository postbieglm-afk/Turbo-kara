/* Turbo Kára · draw2d.js: 2D kreslení světa (záloha bez WebGL) */
'use strict';
/* ---------- kreslení světa ---------- */
function rrect(x,y,w,h,r){ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,w,h,r):ctx.rect(x,y,w,h);}
let VROT=0;
function drawTree(t,shadow){
  if(shadow){ctx.fillStyle='rgba(18,40,14,.28)';ctx.beginPath();ctx.ellipse(t.x+t.r*.35,t.y+t.r*.45,t.r*1.02,t.r*.92,0,0,TAU);ctx.fill();return;}
  if(t.pine){const pts=8;
    for(const [sc,col] of [[1,C.pine],[.68,C.pineLt],[.35,'#3f8550']]){ctx.fillStyle=col;ctx.beginPath();
      for(let i=0;i<=pts*2;i++){const a=t.rot+i/(pts*2)*TAU,rr=(i%2?.55:1)*t.r*sc;ctx[i?'lineTo':'moveTo'](t.x+Math.cos(a)*rr,t.y+Math.sin(a)*rr);}ctx.fill();}
  }else{
    ctx.fillStyle=C.tree;ctx.beginPath();ctx.arc(t.x,t.y,t.r,0,TAU);ctx.fill();
    ctx.fillStyle=C.treeLt;ctx.beginPath();ctx.arc(t.x-t.r*.2,t.y-t.r*.22,t.r*.7,0,TAU);ctx.fill();
    ctx.fillStyle=C.treeHi;ctx.beginPath();ctx.arc(t.x-t.r*.35,t.y-t.r*.38,t.r*.3,0,TAU);ctx.fill();
  }
}
const mainCtx=ctx;
function drawItemIcon(it,x,y,s,alpha=1,g=null){
  const ctx=g||mainCtx;
  ctx.save();ctx.translate(x,y);ctx.globalAlpha=alpha;
  if(it===IT_NITRO){ctx.fillStyle=C.boost;ctx.beginPath();ctx.moveTo(0,-s);ctx.quadraticCurveTo(s*.85,-s*.1,s*.5,s*.6);ctx.quadraticCurveTo(0,s*1.05,-s*.5,s*.6);ctx.quadraticCurveTo(-s*.85,-s*.1,0,-s);ctx.fill();
    ctx.fillStyle='#ffd166';ctx.beginPath();ctx.moveTo(0,-s*.25);ctx.quadraticCurveTo(s*.45,s*.25,s*.25,s*.6);ctx.quadraticCurveTo(0,s*.8,-s*.25,s*.6);ctx.quadraticCurveTo(-s*.45,s*.25,0,-s*.25);ctx.fill();}
  if(it===IT_OIL){ctx.fillStyle='#16181a';ctx.beginPath();ctx.moveTo(0,-s);ctx.bezierCurveTo(s*.7,-s*.1,s*.8,s*.9,0,s*.9);ctx.bezierCurveTo(-s*.8,s*.9,-s*.7,-s*.1,0,-s);ctx.fill();
    ctx.strokeStyle='rgba(242,240,227,.7)';ctx.lineWidth=1.5;ctx.stroke();
    ctx.fillStyle='rgba(160,200,255,.6)';ctx.beginPath();ctx.ellipse(-s*.22,s*.25,s*.13,s*.25,-.3,0,TAU);ctx.fill();}
  if(it===IT_SHIELD){ctx.strokeStyle=C.sky;ctx.lineWidth=s*.22;ctx.beginPath();ctx.arc(0,0,s*.75,0,TAU);ctx.stroke();
    ctx.fillStyle='rgba(92,200,242,.3)';ctx.beginPath();ctx.arc(0,0,s*.75,0,TAU);ctx.fill();}
  ctx.restore();
}
function drawCar(r,t){
  const zs=1+r.z/70;
  ctx.save();ctx.translate(r.x+4+r.z*.45,r.y+6+r.z*.45);ctx.rotate(r.ang);ctx.fillStyle='rgba(10,25,10,.32)';rrect(-21,-12,42,24,8);ctx.fill();ctx.restore();
  ctx.save();ctx.translate(r.x,r.y);ctx.rotate(r.ang+(r.drift?r.drift*.34:0));ctx.scale(zs,zs);
  if(r.chicken){const st=Math.sin(t*(6+Math.min(1,Math.abs(r.vf)/260)*16))*5*Math.min(1,Math.abs(r.vf)/260);
    ctx.fillStyle='#f5b324';ctx.fillRect(-2+st,-8,6,3);ctx.fillRect(-2-st,5,6,3);
    ctx.fillStyle='#fbfaf4';ctx.beginPath();ctx.ellipse(-2,0,17,12,0,0,TAU);ctx.fill();ctx.beginPath();ctx.ellipse(-19,0,6,8,0,0,TAU);ctx.fill();
    ctx.fillStyle='#e9e6da';ctx.beginPath();ctx.ellipse(-3,-11,10,4,0,0,TAU);ctx.ellipse(-3,11,10,4,0,0,TAU);ctx.fill();
    ctx.fillStyle='#fbfaf4';ctx.beginPath();ctx.arc(14,0,8,0,TAU);ctx.fill();ctx.fillStyle='#e2302a';ctx.beginPath();ctx.ellipse(13,0,6,2.4,0,0,TAU);ctx.fill();
    ctx.fillStyle='#f5b324';ctx.beginPath();ctx.moveTo(21,-2.5);ctx.lineTo(27,0);ctx.lineTo(21,2.5);ctx.fill();ctx.fillStyle='#111';ctx.fillRect(16,-4.5,2,2);ctx.fillRect(16,2.5,2,2);
    ctx.restore();return;}
  if(r.boostT>0){const fl=16+Math.random()*12;ctx.fillStyle='#f07a24';ctx.beginPath();ctx.moveTo(-21,-6);ctx.lineTo(-21-fl,0);ctx.lineTo(-21,6);ctx.fill();
    ctx.fillStyle='#ffe08a';ctx.beginPath();ctx.moveTo(-21,-3);ctx.lineTo(-21-fl*.55,0);ctx.lineTo(-21,3);ctx.fill();}
  ctx.fillStyle='#17191b';[[-16,-13],[-16,8],[8,-13],[8,8]].forEach(([x,y])=>{rrect(x,y,10,5,1.5);ctx.fill();});
  ctx.fillStyle=r.color;ctx.beginPath();ctx.moveTo(-19,-10);ctx.lineTo(13,-10);ctx.quadraticCurveTo(21,-9,21,-4);ctx.lineTo(21,4);ctx.quadraticCurveTo(21,9,13,10);ctx.lineTo(-19,10);ctx.quadraticCurveTo(-21,10,-21,7);ctx.lineTo(-21,-7);ctx.quadraticCurveTo(-21,-10,-19,-10);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.85)';ctx.fillRect(-21,-1.6,42,3.2);
  ctx.fillStyle=r.dk;ctx.fillRect(-23,-11,4,22);
  ctx.fillStyle='#1d2b34';ctx.beginPath();ctx.moveTo(3,-8);ctx.lineTo(11,-6.5);ctx.lineTo(11,6.5);ctx.lineTo(3,8);ctx.fill();
  ctx.fillStyle=r.color;rrect(-8,-7.5,11,15,2);ctx.fill();ctx.fillStyle='rgba(255,255,255,.18)';rrect(-7,-6.5,9,13,2);ctx.fill();
  ctx.fillStyle='#1d2b34';ctx.fillRect(-13,-7,4,14);
  ctx.fillStyle='#fff6c9';ctx.fillRect(19,-8.5,2,4);ctx.fillRect(19,4.5,2,4);
  ctx.fillStyle=r.brake?'#ff3b30':'#8a1f18';ctx.fillRect(-21,-9,2,4);ctx.fillRect(-21,5,2,4);
  if(r.shieldT>0){const a=.45+.25*Math.sin(t*10)+r.shieldHit;ctx.strokeStyle=`rgba(92,200,242,${r.shieldT<1.5&&Math.sin(t*25)>0?0.15:a+.3})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,28,0,TAU);ctx.stroke();
    ctx.fillStyle=`rgba(92,200,242,${a*.35})`;ctx.fill();}
  ctx.restore();
}
function drawWorld(V,r,t){
  const cam=r.cam,z=clamp(Math.min(V.w,V.h)/600,.5,1.05)*(1-.13*cam.zs);
  const cx=V.x+V.w/2,cy=V.y+V.h*(V.h<V.w*.8?.72:.64),rot=-Math.PI/2-cam.a;VROT=rot;
  let R=0;for(const [px,py] of [[V.x,V.y],[V.x+V.w,V.y],[V.x,V.y+V.h],[V.x+V.w,V.y+V.h]])R=Math.max(R,Math.hypot(px-cx,py-cy));R=R/z+40;
  const vis=(x,y,m=0)=>{const dx=x-cam.x,dy=y-cam.y,q=R+m;return dx*dx+dy*dy<q*q;};
  ctx.save();ctx.beginPath();ctx.rect(V.x,V.y,V.w,V.h);ctx.clip();
  {const A=G.demo?0:r.shk*SHAKE*7;ctx.translate(cx+Math.sin(t*53)*A,cy+Math.sin(t*61+1.3)*A);}
  ctx.scale(z,z);ctx.rotate(rot);ctx.translate(-cam.x,-cam.y);
  ctx.fillStyle=groundPat;ctx.fillRect(cam.x-R,cam.y-R,R*2,R*2);
  // chodník, obrubník, silnice
  ctx.lineJoin='round';ctx.lineCap='round';
  ctx.strokeStyle=TRK.id==='brno'?'#b3ada1':C.side;ctx.lineWidth=WALL*2;ctx.stroke(T.center);
  ctx.strokeStyle=C.kerb;ctx.lineWidth=HALF*2+8;ctx.stroke(T.center);
  ctx.strokeStyle=C.road;ctx.lineWidth=HALF*2;ctx.stroke(T.center);
  ctx.strokeStyle='rgba(240,238,230,.92)';ctx.lineWidth=3;ctx.stroke(T.edgeL);ctx.stroke(T.edgeR);
  ctx.setLineDash([30,34]);ctx.strokeStyle='rgba(240,238,230,.35)';ctx.stroke(T.center);ctx.setLineDash([]);
  // přechody a kosočtverce před nimi
  for(const zb of ZEBRA){if(!vis(zb.x,zb.y,HALF))continue;ctx.save();ctx.translate(zb.x,zb.y);ctx.rotate(zb.a);ctx.fillStyle='rgba(244,242,236,.9)';
    for(let k=-HALF+8;k<HALF-8;k+=22)ctx.fillRect(-14,k,28,12);
    ctx.strokeStyle='rgba(244,242,236,.85)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-150,0);ctx.lineTo(-130,-10);ctx.lineTo(-110,0);ctx.lineTo(-130,10);ctx.closePath();ctx.stroke();ctx.restore();}
  // start a cíl
  {const a=Math.atan2(T.ty[0],T.tx[0]);ctx.save();ctx.translate(T.x[0],T.y[0]);ctx.rotate(a);
    for(let row=0;row<2;row++)for(let c=0;c<Math.ceil(HALF*2/12);c++){ctx.fillStyle=(row+c)%2?'#16181a':'#f4f1e6';ctx.fillRect(row*10-10,-HALF+c*12,10,Math.min(12,HALF*2-c*12));}
    ctx.strokeStyle='rgba(244,241,230,.75)';ctx.lineWidth=3;
    for(const lat of [-.42,.42]){const x=-90,y=lat*HALF;ctx.beginPath();ctx.moveTo(x+24,y-14);ctx.lineTo(x-18,y-14);ctx.moveTo(x+24,y+14);ctx.lineTo(x-18,y+14);ctx.moveTo(x+24,y-14);ctx.lineTo(x+24,y+14);ctx.stroke();}
    ctx.restore();}
  // ideální stopa: šipky obarvené podle doporučené rychlosti
  if(SHOWLINE&&RL&&!T.free){ctx.lineWidth=4;ctx.lineCap='round';ctx.lineJoin='round';ctx.globalAlpha=.75;
    for(let i=0;i<N;i+=4){const o=RL.rl[i],x=T.x[i]+T.nx(i)*o,y=T.y[i]+T.ny(i)*o;if(!vis(x,y,10))continue;const c=T.tx[i],s2=T.ty[i];
      ctx.strokeStyle=rlColor(RL.vs[i]);ctx.beginPath();ctx.moveTo(x-c*7+(-s2)*7,y-s2*7+c*7);ctx.lineTo(x+c*5,y+s2*5);ctx.lineTo(x-c*7-(-s2)*7,y-s2*7-c*7);ctx.stroke();}
    ctx.globalAlpha=1;}
  // louže oleje
  for(const p of PUDDLES){if(!vis(p.x,p.y,50))continue;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a);ctx.fillStyle='#0e1012';
    ctx.beginPath();ctx.ellipse(0,0,p.r,p.r*.72,0,0,TAU);ctx.fill();p.blobs.forEach(b=>{ctx.beginPath();ctx.ellipse(b.u,b.v,b.r,b.r*.8,0,0,TAU);ctx.fill();});
    ctx.fillStyle='rgba(150,130,235,.3)';ctx.beginPath();ctx.ellipse(-6,-4,12,5,.4,0,TAU);ctx.fill();ctx.fillStyle='rgba(90,210,190,.22)';ctx.beginPath();ctx.ellipse(6,4,10,4,.4,0,TAU);ctx.fill();ctx.restore();}
  // tréninkové zóny: nápis na zemi, kruh driftové arény
  for(const z of ZONES){const lx=z.lx||z.x,ly=z.ly||z.y;if(!vis(lx,ly,300))continue;
    if(z.ring){ctx.strokeStyle='rgba(244,242,236,.85)';ctx.lineWidth=5;ctx.setLineDash([22,16]);ctx.beginPath();ctx.arc(z.x,z.y,z.ring,0,TAU);ctx.stroke();ctx.setLineDash([]);}
    ctx.save();if(z.lx){ctx.translate(lx,ly);ctx.rotate(z.la+Math.PI/2);}else ctx.translate(z.x,z.y-(z.ring?z.ring+40:150));
    ctx.fillStyle='rgba(61,220,132,.85)';ctx.font=`italic 700 ${z.lx?26:40}px ${HUDF}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(z.label,0,0);ctx.restore();}
  // zrychlovací pásy
  for(const pd of PADS){if(!vis(pd.x,pd.y,40))continue;ctx.save();ctx.translate(pd.x,pd.y);ctx.rotate(pd.a);
    ctx.fillStyle=C.boost;rrect(-30,-36,60,72,8);ctx.fill();
    for(let i=0;i<3;i++){const ph=((t*2.2+i/3)%1);ctx.fillStyle=`rgba(255,240,200,${.35+.6*(1-ph)})`;const x=-22+i*16;
      ctx.beginPath();ctx.moveTo(x,-22);ctx.lineTo(x+12,0);ctx.lineTo(x,22);ctx.lineTo(x+6,22);ctx.lineTo(x+18,0);ctx.lineTo(x+6,-22);ctx.fill();}
    ctx.restore();}
  // skokánky
  for(const j of JUMPS){if(!vis(j.x,j.y,60))continue;ctx.save();ctx.translate(j.x,j.y);ctx.rotate(j.a);
    ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(-j.hl+6,-j.hw+6,j.hl*2,j.hw*2);
    const gr=ctx.createLinearGradient(-j.hl,0,j.hl,0);gr.addColorStop(0,'#b88d1c');gr.addColorStop(1,'#f6d33c');ctx.fillStyle=gr;ctx.fillRect(-j.hl,-j.hw,j.hl*2,j.hw*2);
    ctx.fillStyle='#1b1b1b';for(let k=-j.hw+6;k<j.hw-10;k+=26){ctx.beginPath();ctx.moveTo(-12,k);ctx.lineTo(6,k+10);ctx.lineTo(-12,k+20);ctx.lineTo(-4,k+20);ctx.lineTo(14,k+10);ctx.lineTo(-4,k);ctx.fill();}
    ctx.fillStyle='#2a2d30';ctx.fillRect(j.hl-4,-j.hw,4,j.hw*2);ctx.restore();}
  // olej
  for(const o of G.oils){if(!vis(o.x,o.y,30))continue;ctx.save();ctx.translate(o.x,o.y);ctx.rotate(o.a);ctx.globalAlpha=Math.min(1,o.t);
    ctx.fillStyle='#121416';ctx.beginPath();ctx.ellipse(0,0,22,15,0,0,TAU);ctx.fill();ctx.beginPath();ctx.ellipse(12,8,9,7,0,0,TAU);ctx.fill();ctx.beginPath();ctx.ellipse(-13,-7,8,6,0,0,TAU);ctx.fill();
    ctx.fillStyle='rgba(140,120,220,.35)';ctx.beginPath();ctx.ellipse(-4,-3,9,4,.4,0,TAU);ctx.fill();ctx.fillStyle='rgba(120,220,200,.25)';ctx.beginPath();ctx.ellipse(3,3,7,3,.4,0,TAU);ctx.fill();
    ctx.restore();}
  // penízky a otazníky
  for(const p of PK){if(!p.on||!vis(p.x,p.y,30))continue;
    if(p.type==='coin'){const sx=Math.max(.2,Math.abs(Math.cos(t*3+p.ph)));ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-VROT);ctx.scale(sx,1);
      ctx.fillStyle='rgba(0,0,0,.2)';ctx.beginPath();ctx.arc(3,4,10,0,TAU);ctx.fill();
      ctx.fillStyle=C.goldDk;ctx.beginPath();ctx.arc(0,0,10,0,TAU);ctx.fill();ctx.fillStyle=C.gold;ctx.beginPath();ctx.arc(0,0,7.5,0,TAU);ctx.fill();
      ctx.fillStyle='#fff3c4';ctx.fillRect(-1.2,-4.5,2.4,9);ctx.restore();}
    else{const bob=Math.sin(t*3+p.ph)*2;ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle='rgba(0,0,0,.22)';ctx.beginPath();ctx.ellipse(4,6,14,12,0,0,TAU);ctx.fill();
      ctx.rotate(t*1.3+p.ph);ctx.fillStyle='rgba(92,200,242,.92)';rrect(-14,-14,28,28,6);ctx.fill();ctx.strokeStyle='#eafaff';ctx.lineWidth=2.5;ctx.stroke();
      ctx.rotate(-(t*1.3+p.ph)-VROT);ctx.fillStyle='#ffffff';ctx.font=`400 22px ${DISP}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('?',0,1+bob*.3);ctx.restore();}}
  // zábrany a kužely
  for(const b of BARRS){if(!vis(b.x,b.y,80))continue;ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.a);
    ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(-b.hl+5,-b.hw+6,b.hl*2,b.hw*2);
    ctx.fillStyle='#f4f1e6';ctx.fillRect(-b.hl,-b.hw,b.hl*2,b.hw*2);ctx.fillStyle='#e8601c';
    for(let k=-b.hl;k<b.hl;k+=20){ctx.beginPath();ctx.moveTo(k,-b.hw);ctx.lineTo(k+10,-b.hw);ctx.lineTo(Math.min(b.hl,k+10+b.hw),b.hw);ctx.lineTo(Math.min(b.hl,k+b.hw),b.hw);ctx.fill();}
    ctx.fillStyle=Math.sin(t*8)>0?'#ffd84a':'#7a5a10';ctx.beginPath();ctx.arc(-b.hl+6,0,4,0,TAU);ctx.arc(b.hl-6,0,4,0,TAU);ctx.fill();ctx.restore();}
  for(const k of CONES){const fl=!k.on&&k.ft<.7;if(!(k.on||fl))continue;const x=fl?k.x0+k.fvx*k.ft:k.x,y=fl?k.y0+k.fvy*k.ft:k.y;if(!vis(x,y,20))continue;
    const s=fl?1+Math.sin(k.ft/.7*Math.PI)*.6:1;ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.arc(x+3,y+4,8*s,0,TAU);ctx.fill();
    ctx.fillStyle='#ef6a1d';ctx.beginPath();ctx.arc(x,y,8*s,0,TAU);ctx.fill();ctx.strokeStyle='#f4f1e6';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(x,y,4.5*s,0,TAU);ctx.stroke();}
  // částice, auta, jiskry
  for(const p of G.parts){if(p.k!=='dust'||!vis(p.x,p.y))continue;ctx.globalAlpha=Math.max(0,p.l/p.m);ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,p.s*(1.6-p.l/p.m),0,TAU);ctx.fill();}
  ctx.globalAlpha=1;
  if(GARAGE&&T.free&&vis(GARAGE.x,GARAGE.y,260)){const q=GARAGE;ctx.fillStyle='#2a2e33';ctx.fillRect(q.x-q.w/2,q.y-q.d/2,q.w,q.d);
    ctx.fillStyle='#9aa3ad';for(const wl of CITY.gwalls)ctx.fillRect(wl.x-wl.w/2,wl.y-wl.d/2,wl.w,wl.d);
    for(let k=0;k<10;k++){ctx.fillStyle=k%2?'#1a1d21':'#f2c14e';ctx.fillRect(q.x+q.w/2-8,q.y-q.d/2+k*q.d/10,8,q.d/10);}
    if(q.egg.on){const bob=1+Math.sin(t*3)*.06;ctx.fillStyle='rgba(255,211,110,.25)';ctx.beginPath();ctx.arc(q.egg.x,q.egg.y,30*bob,0,TAU);ctx.fill();ctx.fillStyle='#f2c14e';ctx.beginPath();ctx.ellipse(q.egg.x,q.egg.y,10*bob,13*bob,0,0,TAU);ctx.fill();ctx.fillStyle='rgba(255,255,255,.7)';ctx.beginPath();ctx.ellipse(q.egg.x-3,q.egg.y-4,2.5,4,0,0,TAU);ctx.fill();}
    if(q.open<1){const th=8+18*(1-q.open);ctx.fillStyle='#b8bfc7';ctx.fillRect(q.x+q.w/2-th,q.y-q.d/2+8,th,q.d-16);ctx.fillStyle='#8a929b';for(let k=1;k<6;k++)ctx.fillRect(q.x+q.w/2-th,q.y-q.d/2+8+k*(q.d-16)/6,th,2);}
    ctx.save();ctx.translate(q.x-20,q.y);ctx.rotate(Math.PI/2);ctx.fillStyle='rgba(255,208,230,.85)';ctx.font=`italic 700 34px ${HUDF}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('GARÁŽ',0,0);ctx.restore();}
  [...G.r].sort((a,b)=>a===r?1:b===r?-1:0).forEach(c=>{if(vis(c.x,c.y,40))drawCar(c,t);});
  for(const p of G.parts){if(p.k!=='spark'||!vis(p.x,p.y))continue;ctx.globalAlpha=Math.max(0,p.l/p.m);ctx.fillStyle=p.c;ctx.fillRect(p.x-p.s/2,p.y-p.s/2,p.s,p.s);}
  ctx.globalAlpha=1;
  // svodidla a směrové tabule
  ctx.lineCap='butt';
  for(const rl of RAILS){ctx.beginPath();for(let q=0;q<=rl.len;q++){const i=(rl.i0+q)%N,lat=rl.side*(WALL-2),x=T.x[i]+T.nx(i)*lat,y=T.y[i]+T.ny(i)*lat;ctx[q?'lineTo':'moveTo'](x,y);}
    ctx.strokeStyle='rgba(20,24,28,.55)';ctx.lineWidth=7;ctx.stroke();ctx.strokeStyle='#c7cdd3';ctx.lineWidth=4;ctx.stroke();}
  for(const c of CHEV){if(!vis(c.x,c.y,20))continue;ctx.fillStyle='#d8262c';ctx.fillRect(c.x-5,c.y-5,10,10);}
  // chodci
  for(const p of PEDS){if(!vis(p.x,p.y,10))continue;const k=1+(p.hop>0?Math.sin(p.hop/.5*Math.PI)*.5:0);
    ctx.fillStyle='rgba(0,0,0,.2)';ctx.beginPath();ctx.arc(p.x+2,p.y+3,5,0,TAU);ctx.fill();
    ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,4.6*k,0,TAU);ctx.fill();ctx.fillStyle='#2a2522';ctx.beginPath();ctx.arc(p.x,p.y,2.4*k,0,TAU);ctx.fill();}
  // lampy a domy (střechy shora, stín podle výšky)
  ctx.fillStyle='#3a3f45';for(const l of CITY.lamps){if(!vis(l.hx,l.hy,10))continue;ctx.beginPath();ctx.arc(l.hx,l.hy,l.lan?5:3.5,0,TAU);ctx.fill();}
  const bv=CITY.blds.filter(b=>vis(b.x,b.y,b.rad+30));
  ctx.fillStyle='rgba(20,24,30,.28)';
  for(const b of bv){const o=8+b.h*.05;ctx.beginPath();b.pts.forEach(([x,y],i)=>ctx[i?'lineTo':'moveTo'](x+o,y+o));ctx.fill();}
  for(const b of bv){ctx.fillStyle=b.c;ctx.beginPath();b.pts.forEach(([x,y],i)=>ctx[i?'lineTo':'moveTo'](x,y));ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(40,44,50,.45)';ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle='rgba(40,44,50,.18)';ctx.beginPath();ctx.arc(b.x,b.y,(b.w?Math.min(b.w,b.d):b.rad*.7)*.14,0,TAU);ctx.fill();}
  // lístky ve větru
  for(const q of WIND.parts){if(!vis(q.x,q.y,10))continue;ctx.save();ctx.translate(q.x+q.z*.3,q.y+q.z*.3);ctx.rotate(q.rot);ctx.fillStyle=q.c;ctx.fillRect(-2.4,-1.3,4.8,2.6);ctx.restore();}
  ctx.restore();
  const P={cx,cy,z,rot,cam};P.proj=(x,y)=>{const q=w2s(P,x,y);return [q[0],q[1]-30*z];};return P;
}
function w2s(P,x,y){const dx=x-P.cam.x,dy=y-P.cam.y,c=Math.cos(P.rot),s=Math.sin(P.rot);return [P.cx+(dx*c-dy*s)*P.z,P.cy+(dx*s+dy*c)*P.z];}

