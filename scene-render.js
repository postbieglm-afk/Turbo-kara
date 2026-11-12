/* Turbo Kára · scene-render.js: vykreslení 3D scény za běhu: DYN/dynRes() automatické rozlišení, vfov(), drawDash() přístrojová deska kokpitu, render3D() snímek (kamery, auta, chodci, částice), proj3D() souřadnice do obrazovky. Načítá se před scene3d.js, protože DYN je potřeba při sestavení scény. */
'use strict';
/* ---------- automatické rozlišení: když hra nestíhá, sníží se hustota pixelů, když je rezerva, zase se zvedne ----------
   Strop je 1,5× (ostré i na Retině/4K), minimum 0,6×. Měří se průměrné snímky za vteřinu vůči obnovovací frekvenci monitoru. */
const DYN={cap:1,pr:0,min:.6,hz:60,ok:0,bad:0,lim:9,n:0,t0:0};
function dynRes(now){
  requestAnimationFrame(dynRes);
  if(!R3||!R3.renderer||document.hidden||appScr==='ctrl'){DYN.t0=0;return;}
  if(!DYN.t0){DYN.t0=now;DYN.n=0;return;}
  DYN.n++;const el=now-DYN.t0;if(el<1000)return;
  const fps=DYN.n*1000/el;DYN.t0=now;DYN.n=0;
  if(fps>DYN.hz*1.1)DYN.hz=Math.min(240,Math.round(fps)); // monitor s vyšší frekvencí
  const busy=appScr==='game'||!ov.hidden;if(!busy)return;
  let pr=DYN.pr;
  if(fps<DYN.hz*.8){DYN.ok=0;if(++DYN.bad>=2){DYN.bad=0;DYN.lim=Math.min(DYN.lim,pr);pr=Math.max(DYN.min,+(pr-.15).toFixed(2));}}
  else if(fps>DYN.hz*.95){DYN.bad=0;if(++DYN.ok>=8&&pr<DYN.cap&&pr+.1<=DYN.lim+.001){DYN.ok=0;pr=Math.min(DYN.cap,+(pr+.1).toFixed(2));}
    if(DYN.ok>=30){DYN.ok=0;DYN.lim=DYN.cap;}} // po půl minutě v klidu zkus i dřív problematickou úroveň
  else{DYN.bad=0;DYN.ok=0;}
  if(pr!==DYN.pr){DYN.pr=pr;R3.renderer.setPixelRatio(pr);R3.renderer.setSize(W,H,false);}
}
requestAnimationFrame(dynRes);
// three.js má svislý zorný úhel; tady držíme vodorovný, aby bylo vidět do stran i na široké půlce obrazovky
const vfov=(hDeg,asp,lo,hi)=>clamp(2*Math.atan(Math.tan(hDeg*Math.PI/360)/Math.max(.2,asp))*180/Math.PI,lo,hi);
function drawDash(C3,r,t){
  const g=C3.dg,w=C3.dc.width,h=C3.dc.height;g.clearRect(0,0,w,h);
  g.beginPath();g.roundRect?g.roundRect(4,4,w-8,h-8,18):g.rect(4,4,w-8,h-8);g.fillStyle='rgba(12,18,22,.9)';g.fill();
  g.lineWidth=6;g.strokeStyle=r.item?r.color:'rgba(242,240,227,.35)';g.stroke();
  const it=r.rollT>0?1+Math.floor(t*14)%3:r.item;if(it)drawItemIcon(it,w/2,h*.42,h*.27,r.rollT>0?.75:1,g);
  g.fillStyle=r.item?'#f2f0e3':'rgba(242,240,227,.55)';g.font=`700 ${Math.round(h*.2)}px ${UIF}`;g.textAlign='center';g.textBaseline='middle';
  g.fillText(r.rollT>0?'…':r.item?IT_NAMES[r.item]:'PŘEDMĚT',w/2,h*.83);C3.dispT.needsUpdate=true;
}
function render3D(t,vs){
  const R=R3,ren=R.renderer;
  G.r.forEach((r,i)=>{const m=R.cars[i];m.g.position.set(r.x,1.2+r.z,r.y);m.g.rotation.set(0,-(r.ang+(r.drift?r.drift*.34:0)),r.z>0?clamp(r.vz/900,-.32,.32):0);
    if(m.col!==r.color){m.col=r.color;m.bodyM.color.set(r.color);m.dkM.color.set(r.dk);}
    m.brake.color.setHex(r.brake?0xff3b30:0x7a1a14);if(m.tailM)m.tailM.opacity=r.brake?1:.55;
    m.wheels[0].rotation.y=m.wheels[1].rotation.y=-r.steerS*.45;
    m.flame.visible=r.boostT>0;if(m.flame.visible)m.flame.scale.set(.7+Math.random()*.6,1,1);
    if(m.ck){const ch=!!r.chicken;if(m.chk!==ch){m.chk=ch;m.parts.forEach(o=>o.visible=!ch);m.ck.visible=ch;}
      if(ch){const sp=Math.min(1,Math.abs(r.vf)/260),ph=t*(5+sp*16);m.legs[0].rotation.z=Math.sin(ph)*.8*sp;m.legs[1].rotation.z=-Math.sin(ph)*.8*sp;
        const fl=r.z>0||r.boostT>0?Math.sin(t*30)*.9:Math.sin(ph)*.15;m.wings[0].rotation.x=-fl;m.wings[1].rotation.x=fl;m.head.position.y=31+Math.abs(Math.sin(ph))*2.5*sp;m.head.position.x=14+Math.sin(ph)*1.5*sp;}}
    m.shield.visible=r.shieldT>0&&!(r.shieldT<1.5&&Math.sin(t*25)>0);
    if(m.shield.visible){m.shield.material.opacity=.26+.08*Math.sin(t*6)+r.shieldHit*1.2;const k2=1+r.shieldHit*.5;m.shield.scale.set(k2,k2,k2);}});
  PK.forEach((p,i)=>{const m=R.pkM[i];m.visible=p.on;if(!p.on)return;
    if(p.type==='coin')m.rotation.y=t*3+p.ph;else{m.rotation.set(t*.7+p.ph,t*1.3+p.ph,0);m.position.y=20+Math.sin(t*3+p.ph)*3;}});
  R.padT.offset.x=-((t*1.6)%1);
  if(R.garDoor&&GARAGE){const o=GARAGE.open,h=Math.max(.5,70*(1-o));R.garDoor.scale.y=h;R.garDoor.position.y=70-h/2;R.garEgg.visible=GARAGE.egg.on;R.garEgg.rotation.y=t*2;R.garEgg.position.y=Math.sin(t*3)*3;}
  R.barLights.forEach((l,i)=>{l.visible=Math.sin(t*8+i*Math.PI)>0;});
  CONES.forEach((k,i)=>{const m=R.cones[i],fl=!k.on&&k.ft<.7;m.visible=k.on||fl;if(!m.visible)return;
    if(fl){const q=k.ft/.7;m.position.set(k.x0+k.fvx*k.ft,1.2+Math.sin(q*Math.PI)*34,k.y0+k.fvy*k.ft);m.rotation.set(q*7,0,q*5);}
    else{m.position.set(k.x,1.2,k.y);m.rotation.set(0,0,0);}});
  R.oils.forEach((m,i)=>{const o=G.oils[i];m.visible=!!o;if(o){m.position.set(o.x,1.4,o.y);m.rotation.y=o.a;m.scale.set(22,1,15);}});
  // život: stopa, chodci, vlajky, lampiony, lístky, mraky
  if(R.rline)R.rline.visible=SHOWLINE;
  {const up=R.v3up||(R.v3up=new THREE.Vector3(0,1,0)),zax=R.zax||(R.zax=new THREE.Vector3(0,0,1)),q1=R.q1||(R.q1=new THREE.Quaternion()),q2=R.q2||(R.q2=new THREE.Quaternion()),
      m4=R.m4||(R.m4=new THREE.Matrix4()),ps=R.ps||(R.ps=new THREE.Vector3()),one=R.one||(R.one=new THREE.Vector3(1,1,1)),hsc=R.hsc||(R.hsc=new THREE.Vector3());
    if(R.peds){const P=R.peds;PEDS.forEach((p,i)=>{const y0=2.2+(p.hop>0?Math.sin(p.hop/.5*Math.PI)*7:0),sw=p.stand?0:Math.sin(p.ph)*.55;
      q1.setFromAxisAngle(up,-p.a);hsc.set(1,p.hs,1);
      q2.setFromAxisAngle(zax,sw);q2.premultiply(q1);ps.set(p.x,y0+8*p.hs,p.y);m4.compose(ps,q2,hsc);P.legL.setMatrixAt(i,m4);
      q2.setFromAxisAngle(zax,-sw);q2.premultiply(q1);m4.compose(ps,q2,hsc);P.legR.setMatrixAt(i,m4);
      ps.set(p.x,y0+7.5*p.hs+Math.abs(sw)*.6,p.y);m4.compose(ps,q1,hsc);P.body.setMatrixAt(i,m4);
      ps.set(p.x,y0+21*p.hs+Math.abs(sw)*.6,p.y);m4.compose(ps,q1,one);P.head.setMatrixAt(i,m4);});
      [P.legL,P.legR,P.body,P.head].forEach(m=>{m.instanceMatrix.needsUpdate=true;});}
    const ws=WIND.s,wa=WIND.a;
    R.flags.forEach(({g,cl,f},k)=>{const flap=Math.sin(t*4.5+f.ph)*.35*ws+Math.sin(t*9+f.ph*2)*.08;g.rotation.y=-wa+flap;cl.rotation.x=Math.sin(t*3+f.ph)*.06*ws;});
    if(R.lanterns){const {im,list}=R.lanterns,wx=Math.cos(wa),wz=Math.sin(wa);list.forEach((l,i)=>{const sw=Math.sin(t*2.2+i*1.7)*(.6+1.6*ws);
      ps.set(l.x+(l.hx-l.x)*.45+wx*sw,34-Math.abs(sw)*.15,l.y+(l.hy-l.y)*.45+wz*sw);q1.setFromAxisAngle(zax,sw*.05);hsc.set(4,5.6,4);m4.compose(ps,q1,hsc);im.setMatrixAt(i,m4);});im.instanceMatrix.needsUpdate=true;}
    WIND.parts.forEach((q,i)=>{R.petPos[i*3]=q.x;R.petPos[i*3+1]=q.z;R.petPos[i*3+2]=q.y;});R.petG.attributes.position.needsUpdate=true;
    if(R.clouds.length){const dx=Math.cos(wa)*DT*(6+14*ws),dz=Math.sin(wa)*DT*(6+14*ws),cx0=(T.minX+T.maxX)/2,cz0=(T.minY+T.maxY)/2;
      R.clouds.forEach(m=>{m.position.x+=dx;m.position.z+=dz;if(m.position.x-cx0>3200)m.position.x-=6400;if(m.position.x-cx0<-3200)m.position.x+=6400;if(m.position.z-cz0>3200)m.position.z-=6400;if(m.position.z-cz0<-3200)m.position.z+=6400;});}}
  let n=0;for(const p of G.parts){if(n>=R.PMAX)break;const c=col3(p.c),k=Math.max(0,p.l/p.m);
    R.pPos[n*3]=p.x;R.pPos[n*3+1]=p.k==='spark'?8+(1-k)*6:3+(1-k)*8;R.pPos[n*3+2]=p.y;R.pCol[n*3]=c.r;R.pCol[n*3+1]=c.g;R.pCol[n*3+2]=c.b;n++;}
  R.pg.setDrawRange(0,n);R.pg.attributes.position.needsUpdate=true;R.pg.attributes.color.needsUpdate=true;
  ren.setScissorTest(true);
  R.cams.forEach(c=>{c.ck.visible=false;});
  vs.forEach((V,vi)=>{
    const r=G.r[G.humans[vi]],C3=R.cams[vi],cam=C3.cam,fp=VIEW[r.i]==='fp'&&!G.demo&&appScr==='game';
    const zs=r.cam.zs,boost=r.boostT>0?1:0;
    // třesení: svislé a boční cuknutí kamery + malé naklonění
    const A=G.demo?0:r.shk*SHAKE,sy=Math.sin(t*53)*A*1.6,sl=Math.sin(t*61+1.3)*A*1.3,sr=Math.sin(t*39+.7)*A*.022;
    if(fp){const a=r.ang+(r.drift?r.drift*.1:0),fx=Math.cos(a),fz=Math.sin(a),lx=-fz*sl,lz=fx*sl;
      cam.fov=vfov(104+zs*8+boost*7,V.w/Math.max(1,V.h),40,82);{const cx_=r.x-fx*2+lx,cz_=r.y-fz*2+lz;cam.position.set(cx_,14.5+sy+r.z+hAt(cx_,cz_),cz_);}cam.lookAt(r.x+fx*120+lx,hAt(r.x+fx*120+lx,r.y+fz*120+lz)+11+sy+r.z+(r.z>0?r.vz*.05:0)-(r.vf>40?r.brakeP*3.5:0),r.y+fz*120+lz);cam.rotateZ(-r.steerS*.035*Math.min(1,Math.abs(r.vf)/200)+sr);
      C3.ck.visible=true;if(C3.col!==r.color){C3.col=r.color;C3.hoodM.color.set(r.dk);C3.markM.color.set(r.color);C3.trimM.color.set(r.color);}
      C3.wheel.rotation.set(-.25,0,-r.steerS*1.7);
      {const ch=!!r.chicken;if(C3.isCh!==ch){C3.isCh=ch;C3.cockpit.forEach(o=>o.visible=!ch);C3.chk.visible=ch;}
        if(ch){const sp=Math.min(1,Math.abs(r.vf)/260),fl=r.z>0||r.boostT>0?Math.sin(t*28)*.8:Math.sin(t*(5+sp*14))*.18*sp;C3.wl[0].rotation.z=fl;C3.wl[1].rotation.z=-fl;C3.chk.position.y=Math.abs(Math.sin(t*(5+sp*14)))*.5*sp;C3.chk.rotation.z=-r.steerS*.08;}}
      // displej: drží se vpravo dole v zorném poli při jakémkoli poměru stran
      {const asp=V.w/Math.max(1,V.h),d=10.3,th=Math.tan(cam.fov*Math.PI/360)*d,hh=th*.42,x=Math.min(th*asp*.5,th*asp-hh*.95);
        C3.disp.position.set(x,-th*.52,-d);C3.disp.scale.set(hh,hh,1);C3.disp.rotation.set(-.12,-.18,0);
        const key=r.item+'|'+(r.rollT>0?Math.floor(t*14)%3:'-')+'|'+r.color;if(C3.dkey!==key){C3.dkey=key;drawDash(C3,r,t);}}}
    else{const a=r.cam.a,fx=Math.cos(a),fz=Math.sin(a);cam.fov=vfov(96+zs*10+boost*6,V.w/Math.max(1,V.h),38,76);
      const lx=-fz*sl*2.2,lz=fx*sl*2.2;{const cx_=r.x-fx*78+lx,cz_=r.y-fz*78+lz;cam.position.set(cx_,34+sy*2+r.z*.6+hAt(cx_,cz_),cz_);}cam.lookAt(r.x+fx*55+lx*.5,hAt(r.x+fx*55+lx*.5,r.y+fz*55+lz*.5)+9+sy+r.z*.8,r.y+fz*55+lz*.5);cam.rotateZ(sr);}
    cam.aspect=V.w/Math.max(1,V.h);cam.updateProjectionMatrix();
    G.r.forEach((c,i)=>{R.cars[i].g.visible=!(fp&&c===r)&&!c.ghost;});
    R.sky.position.copy(cam.position);
    const y=H-V.y-V.h;ren.setViewport(V.x,y,V.w,V.h);ren.setScissor(V.x,y,V.w,V.h);
    ren.render(R.S,cam);
    C3.ck.visible=false;
  });
}
function proj3D(vi,V){const cam=R3.cams[vi].cam,v=R3.v3;
  return (x,y)=>{v.set(x,32,y).project(cam);if(v.z>1||v.z<-1)return null;return [V.x+(v.x+1)/2*V.w,V.y+(1-v.y)/2*V.h];};}
