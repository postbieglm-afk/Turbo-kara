/* Turbo Kára · hud.js: HUD během závodu */
'use strict';
/* ---------- HUD ---------- */
const HUDBG='rgba(9,14,12,.8)',HUDLN='rgba(242,240,227,.18)';
// zkosený panel (rovnoběžník), k = posun horní hrany
function para(x,y,w,h,k,fill,stroke){ctx.beginPath();ctx.moveTo(x+k,y);ctx.lineTo(x+w,y);ctx.lineTo(x+w-k,y+h);ctx.lineTo(x,y+h);ctx.closePath();
  if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.stroke();}}
// stuha pod velkým nápisem: tmavý pruh, který se k okrajům ztrácí, s tenkými svítícími linkami
function ribbon(cx,cy,w,h,accent){w*=1.3;const g=ctx.createLinearGradient(cx-w/2,0,cx+w/2,0);g.addColorStop(0,'rgba(4,8,14,0)');g.addColorStop(.2,'rgba(4,8,14,.72)');g.addColorStop(.8,'rgba(4,8,14,.72)');g.addColorStop(1,'rgba(4,8,14,0)');
  ctx.fillStyle=g;ctx.fillRect(cx-w/2,cy-h/2,w,h);const g2=ctx.createLinearGradient(cx-w/2,0,cx+w/2,0);g2.addColorStop(0,'rgba(0,0,0,0)');g2.addColorStop(.5,accent);g2.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=g2;ctx.fillRect(cx-w/2,cy-h/2,w,2);ctx.fillRect(cx-w/2,cy+h/2-2,w,2);}
function hudBox(x,y,w,h,edge){const c=Math.min(10,h*.18);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w-c,y);ctx.lineTo(x+w,y+c);ctx.lineTo(x+w,y+h);ctx.lineTo(x+c,y+h);ctx.lineTo(x,y+h-c);ctx.closePath();
  const g=ctx.createLinearGradient(x,y,x,y+h);g.addColorStop(0,'rgba(22,36,54,.86)');g.addColorStop(1,'rgba(6,10,16,.72)');ctx.fillStyle=g;ctx.fill();ctx.strokeStyle=edge;ctx.lineWidth=1.5;ctx.stroke();}
function skewBar(x,y,w,h){if(w<=.5)return;const k=h*.9;ctx.beginPath();ctx.moveTo(x+k,y);ctx.lineTo(x+w+k,y);ctx.lineTo(x+w,y+h);ctx.lineTo(x,y+h);ctx.closePath();ctx.fill();}
// kruhový radar: trať se otáčí, auto míří nahoru
function drawRadar(cx,cy,R,me){
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,R,0,TAU);const g=ctx.createRadialGradient(cx,cy,R*.2,cx,cy,R);g.addColorStop(0,'rgba(10,18,28,.62)');g.addColorStop(1,'rgba(4,8,14,.82)');ctx.fillStyle=g;ctx.fill();ctx.clip();
  const k=R/760;ctx.translate(cx,cy);ctx.rotate(-me.ang-Math.PI/2);ctx.scale(k,k);ctx.translate(-me.x,-me.y);
  ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();MINIS.forEach(m=>{m.pts.forEach(([px,py],i)=>ctx[i?'lineTo':'moveTo'](px,py));if(m.closed)ctx.closePath();});
  ctx.strokeStyle='rgba(63,216,255,.22)';ctx.lineWidth=HALF*3;ctx.stroke();ctx.strokeStyle='rgba(226,238,246,.9)';ctx.lineWidth=HALF*.9;ctx.stroke();
  ctx.strokeStyle='#f2c14e';ctx.lineWidth=HALF*.9;ctx.beginPath();ctx.moveTo(T.x[0]-T.nx(0)*HALF*1.4,T.y[0]-T.ny(0)*HALF*1.4);ctx.lineTo(T.x[0]+T.nx(0)*HALF*1.4,T.y[0]+T.ny(0)*HALF*1.4);ctx.stroke();
  for(const z of ZONES){ctx.strokeStyle='#3ddc84';ctx.lineWidth=26;ctx.beginPath();ctx.arc(z.x,z.y,90,0,TAU);ctx.stroke();ctx.fillStyle='rgba(61,220,132,.35)';ctx.fill();}
  for(const o of G.r){if(o===me||o.ghost)continue;ctx.fillStyle=o.color;ctx.beginPath();ctx.arc(o.x,o.y,42,0,TAU);ctx.fill();ctx.strokeStyle='#04080e';ctx.lineWidth=12;ctx.stroke();}
  ctx.restore();
  ctx.strokeStyle='rgba(63,216,255,.55)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,R,0,TAU);ctx.stroke();
  ctx.strokeStyle='rgba(63,216,255,.9)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,R,-Math.PI*.62,-Math.PI*.38);ctx.stroke();
  ctx.fillStyle='#3fd8ff';ctx.shadowColor='#3fd8ff';ctx.shadowBlur=8;ctx.beginPath();ctx.moveTo(cx,cy-9);ctx.lineTo(cx+6.5,cy+7);ctx.lineTo(cx,cy+3.5);ctx.lineTo(cx-6.5,cy+7);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
}
function txt(s,x,y,font,col,align='left',base='alphabetic',stroke=true){
  ctx.font=font;ctx.textAlign=align;ctx.textBaseline=base;
  if(stroke){ctx.lineWidth=4;ctx.strokeStyle='rgba(8,16,10,.75)';ctx.lineJoin='round';ctx.strokeText(s,x,y);}
  ctx.fillStyle=col;ctx.fillText(s,x,y);
}
function drawMinimap(x,y,size,me){
  const pad=10,w=T.maxX-T.minX,h=T.maxY-T.minY,sc=(size-pad*2)/Math.max(w,h),ox=x+pad+(size-pad*2-w*sc)/2,oy=y+pad+(size-pad*2-h*sc)/2;
  ctx.fillStyle=HUDBG;rrect(x,y,size,size,6);ctx.fill();ctx.strokeStyle=HUDLN;ctx.lineWidth=1.5;ctx.stroke();
  {const q=5;for(let r=0;r<2;r++)for(let c=0;c<4;c++){ctx.fillStyle=(r+c)%2?'#f2f0e3':'#16181a';ctx.fillRect(x+size-8-(c+1)*q,y+6+r*q,q,q);}}
  ctx.fillStyle='rgba(63,143,184,.75)';LAKES.forEach(l=>{ctx.beginPath();ctx.arc(ox+(l.x-T.minX)*sc,oy+(l.y-T.minY)*sc,l.r*sc,0,TAU);ctx.fill();});
  ctx.beginPath();MINI.forEach(([px,py],i)=>ctx[i?'lineTo':'moveTo'](ox+(px-T.minX)*sc,oy+(py-T.minY)*sc));ctx.closePath();
  ctx.strokeStyle='rgba(242,240,227,.25)';ctx.lineWidth=7;ctx.lineJoin='round';ctx.stroke();ctx.strokeStyle='#d9d6c8';ctx.lineWidth=3;ctx.stroke();
  const sx=ox+(T.x[0]-T.minX)*sc,sy=oy+(T.y[0]-T.minY)*sc;ctx.strokeStyle='#16181a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(sx-T.nx(0)*7,sy-T.ny(0)*7);ctx.lineTo(sx+T.nx(0)*7,sy+T.ny(0)*7);ctx.stroke();
  ctx.strokeStyle='#f4f1e6';ctx.lineWidth=1.5;ctx.stroke();
  [...G.r].sort((a,b)=>a===me?1:b===me?-1:0).forEach(c=>{const px=ox+(c.x-T.minX)*sc,py=oy+(c.y-T.minY)*sc,rad=c===me?6:4.5;
    ctx.fillStyle=c.color;ctx.beginPath();ctx.arc(px,py,rad,0,TAU);ctx.fill();ctx.strokeStyle=c===me?'#ffffff':'rgba(8,16,10,.8)';ctx.lineWidth=2;ctx.stroke();});
}
function drawButton(z,label,on,col,round){
  ctx.save();ctx.globalAlpha=on?.95:.7;ctx.fillStyle=on?col:HUDBG;
  if(round){ctx.beginPath();ctx.arc(z.x+z.w/2,z.y+z.h/2,z.w/2,0,TAU);}else rrect(z.x,z.y,z.w,z.h,8);
  ctx.fill();ctx.strokeStyle='rgba(63,216,255,.5)';ctx.lineWidth=2;ctx.stroke();ctx.restore();
  if(label==='L'||label==='R'){const cx=z.x+z.w/2,cy=z.y+z.h/2,s=z.h*.22,d=label==='L'?-1:1;ctx.fillStyle=C.fg;ctx.beginPath();ctx.moveTo(cx+d*s*1.2,cy);ctx.lineTo(cx-d*s*.8,cy-s*1.2);ctx.lineTo(cx-d*s*.8,cy+s*1.2);ctx.fill();}
  else if(label)txt(label,z.x+z.w/2,z.y+z.h/2+1,`700 ${Math.round(clamp(z.h*.26,14,22))}px ${UIF}`,C.fg,'center','middle',false);
}
function drawHUD(V,r,P,t,vi){
  const s=inset(V),sc=clamp(Math.min(V.w,V.h)/620,.72,1.15),x0=V.x+14+s.l,y0=V.y+12+s.t,xr=V.x+V.w-14-s.r;
  const st=standings(),pos=st.indexOf(r)+1;
  if(G.demo)return;
  if(R3){const g=ctx.createRadialGradient(V.x+V.w/2,V.y+V.h*.5,Math.min(V.w,V.h)*.38,V.x+V.w/2,V.y+V.h*.5,Math.hypot(V.w,V.h)*.62);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,`rgba(0,4,12,${.45+(r.boostT>0?.18:0)})`);ctx.fillStyle=g;ctx.fillRect(V.x,V.y,V.w,V.h);}
  drawSplat(V,r);
  // HUD jako v moderních závodních hrách: vlevo nahoře předmět, vpravo nahoře pořadí a kola, vlevo dole kruhová mapa, vpravo dole tachometr
  const tUI=touchActive(),yb=V.y+V.h-14-s.b,CYc='#3fd8ff',WHc='#eef3f7',MUc='rgba(200,216,230,.66)',HF=HUDF;
  const lap=Math.min(LAPS,r.lapsDone+1),rt=G.mode==='count'?0:r.finished?r.finishT:G.t;
  // předmět, penízky, štít
  {const is=Math.round(58*sc);hudBox(x0,y0,is,is,r.item?r.color:'rgba(63,216,255,.35)');
    if(r.rollT>0)drawItemIcon(1+Math.floor(t*14)%3,x0+is/2,y0+is/2,is*.3,.75);else if(r.item)drawItemIcon(r.item,x0+is/2,y0+is/2,is*.32);
    else txt('PŘEDMĚT',x0+is/2,y0+is/2,`600 ${Math.round(10*sc)}px ${HF}`,'rgba(200,216,230,.4)','center','middle',false);
    const hint=touchMode&&!G.remote?'':G.remote&&remote[r.i]?'na mobilu':G.two?(r.i?'Enter':'F'):'mezerník';
    if(r.item)txt(IT_NAMES[r.item]+(hint?'  '+hint.toUpperCase():''),x0+2,y0+is+(r.shieldT>0?28:15)*sc,`italic 700 ${Math.round(13*sc)}px ${HF}`,r.color,'left','alphabetic',false);
    if(tUI){const ky=y0+is+((r.item?40:30)+(r.shieldT>0?13:0))*sc;txt(String(Math.round(Math.abs(r.vf)*.45)),x0,ky,`italic 700 ${Math.round(26*sc)}px ${HF}`,r.boostT>0?'#ff9d3a':WHc,'left','alphabetic',false);
      ctx.font=`italic 700 ${Math.round(26*sc)}px ${HF}`;const kw=ctx.measureText(String(Math.round(Math.abs(r.vf)*.45))).width;txt('KM/H',x0+kw+5*sc,ky,`700 ${Math.round(10*sc)}px ${HF}`,MUc,'left','alphabetic',false);
      if(r.drift)txt('DRIFT'+(r.driftL?' ×'+r.driftL:''),x0,ky+16*sc,`italic 700 ${Math.round(13*sc)}px ${HF}`,DRIFT_C[r.driftL]==='rgba(235,235,235,.65)'?WHc:DRIFT_C[r.driftL],'left','alphabetic',false);}
    const cx=x0+is+8*sc,cyy=y0+4*sc;
    {const g=ctx.createRadialGradient(cx+8*sc,cyy+10*sc,1,cx+9*sc,cyy+11*sc,9*sc);g.addColorStop(0,'#ffe08a');g.addColorStop(.6,'#e0a52a');g.addColorStop(1,'#9b6a17');ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx+9*sc,cyy+11*sc,8.5*sc,0,TAU);ctx.fill();}
    txt(String(r.coins),cx+22*sc,cyy+19*sc,`italic 700 ${Math.round(22*sc)}px ${HF}`,WHc,'left','alphabetic',false);
    if(r.coins)txt('+'+(r.coins*COIN_PCT*100).toFixed(1).replace('.',',').replace(/,0$/,'')+' % RYCHLOST',cx+2*sc,cyy+36*sc,`600 ${Math.round(11*sc)}px ${HF}`,C.gold,'left','alphabetic',false);
    if(r.shieldT>0){const bx=cx+38*sc,bw=84*sc,by=y0+is+3*sc;txt('ŠTÍT',cx+2*sc,by+7*sc,`700 ${Math.round(11*sc)}px ${HF}`,C.sky,'left','alphabetic',false);
      ctx.fillStyle='rgba(92,200,242,.18)';skewBar(bx,by,bw,6*sc);ctx.fillStyle=r.shieldT<1.5&&Math.sin(t*25)>0?'rgba(92,200,242,.45)':C.sky;skewBar(bx,by,bw*clamp(r.shieldT/SHIELD_T,0,1),6*sc);}}
  // minimapa: kruhová, otáčí se podle směru jízdy
  const ms=Math.round(clamp(Math.min(V.w,V.h)*(tUI?.24:.27),84,176));
  {const mcx=tUI?xr-ms/2:x0+ms/2,mcy=tUI?y0+ms/2:yb-ms/2;drawRadar(mcx,mcy,ms/2,r);}
  // volná jízda: čas, skoky, turba z driftu, max rychlost, penízky + rada trenéra
  if(G.free){const rx=xr,w=Math.round(170*sc);let y=tUI?y0+ms+10*sc:y0;
    {const rows=5,bh=(52+rows*21)*sc,g=ctx.createLinearGradient(rx-w-40*sc,0,rx+14,0);g.addColorStop(0,'rgba(4,8,14,0)');g.addColorStop(.35,'rgba(4,8,14,.55)');g.addColorStop(1,'rgba(4,8,14,.72)');ctx.fillStyle=g;ctx.fillRect(rx-w-40*sc,y-6*sc,w+40*sc+14,bh);}
    txt('VOLNÁ JÍZDA',rx,y+12*sc,`700 ${Math.round(12*sc)}px ${HF}`,'#3ddc84','right','alphabetic',false);
    txt(fmt(G.fs.t),rx,y+42*sc,`italic 700 ${Math.round(28*sc)}px ${HF}`,WHc,'right','alphabetic',false);
    y+=50*sc;ctx.fillStyle='rgba(61,220,132,.55)';ctx.fillRect(rx-w,y,w,1.5);y+=4*sc;
    [['SKOKY',r.landN],['TURBO Z DRIFTU',r.mtN],['MAX RYCHLOST',Math.round(r.vmax||0)+' km/h'],['PENÍZKY',r.coinsTot],['NÁRAZY',r.crashN]].forEach(([l,v],k)=>{const ry=y+k*21*sc+15*sc;
      txt(l,rx-w,ry,`700 ${Math.round(11*sc)}px ${HF}`,MUc,'left','alphabetic',false);txt(String(v),rx,ry,`italic 700 ${Math.round(15*sc)}px ${HF}`,WHc,'right','alphabetic',false);});
    if(G.tip.t>0){const a=Math.min(1,G.tip.t*2,(5.5-G.tip.t)*4),tw=Math.min(V.w*.86,560*sc),ty=V.y+V.h*(tUI?.62:.72);ctx.globalAlpha=Math.max(0,a);
      ctx.font=`600 ${Math.round(14*sc)}px ${HF}`;const lines=[''];for(const wd of G.tip.txt.split(' ')){const t2=(lines[lines.length-1]+' '+wd).trim();if(ctx.measureText(t2).width>tw*.84&&lines[lines.length-1])lines.push(wd);else lines[lines.length-1]=t2;}
      const two2=lines.length>1;ribbon(V.x+V.w/2,ty,tw,(two2?76:58)*sc,'#3ddc84');
      txt(G.tip.title,V.x+V.w/2,ty-(two2?18:8)*sc,`italic 700 ${Math.round(17*sc)}px ${HF}`,'#3ddc84','center','middle',false);
      lines.slice(0,2).forEach((ln,q)=>txt(ln,V.x+V.w/2,ty+(two2?4+q*17:13)*sc,`600 ${Math.round(14*sc)}px ${HF}`,WHc,'center','middle',false));ctx.globalAlpha=1;}}
  // pořadí, kolo, čas, tabulka
  else{const rx=xr,w=Math.round(170*sc);let y=tUI?y0+ms+10*sc:y0;
    {const bh=(86+st.length*22)*sc,g=ctx.createLinearGradient(rx-w-40*sc,0,rx+14,0);g.addColorStop(0,'rgba(4,8,14,0)');g.addColorStop(.35,'rgba(4,8,14,.55)');g.addColorStop(1,'rgba(4,8,14,.72)');ctx.fillStyle=g;ctx.fillRect(rx-w-40*sc,y-6*sc,w+40*sc+14,bh+10*sc);}
    txt('POZICE',rx-w,y+11*sc,`700 ${Math.round(11*sc)}px ${HF}`,MUc,'left','alphabetic',false);
    txt('KOLO',rx,y+11*sc,`700 ${Math.round(11*sc)}px ${HF}`,MUc,'right','alphabetic',false);
    txt(String(pos),rx-w,y+48*sc,`italic 700 ${Math.round(42*sc)}px ${HF}`,pos===1?C.gold:WHc,'left','alphabetic',false);
    ctx.font=`italic 700 ${Math.round(42*sc)}px ${HF}`;const pw=ctx.measureText(String(pos)).width;
    txt('/'+G.r.length,rx-w+pw+4*sc,y+48*sc,`italic 700 ${Math.round(18*sc)}px ${HF}`,MUc,'left','alphabetic',false);
    txt(lap+'/'+LAPS,rx,y+48*sc,`italic 700 ${Math.round(34*sc)}px ${HF}`,lap===LAPS?C.gold:WHc,'right','alphabetic',false);
    y+=56*sc;ctx.fillStyle='rgba(63,216,255,.55)';ctx.fillRect(rx-w,y,w,1.5);
    txt(fmt(rt),rx,y+22*sc,`italic 700 ${Math.round(20*sc)}px ${HF}`,WHc,'right','alphabetic',false);
    txt('ČAS',rx-w,y+20*sc,`700 ${Math.round(11*sc)}px ${HF}`,MUc,'left','alphabetic',false);
    y+=30*sc;
    st.forEach((o,k)=>{const me=o===r,ry=y+k*22*sc;
      const g=ctx.createLinearGradient(rx-w,0,rx,0);g.addColorStop(0,me?'rgba(63,216,255,.32)':'rgba(9,15,24,.0)');g.addColorStop(1,me?'rgba(63,216,255,.05)':'rgba(9,15,24,.55)');ctx.fillStyle=g;ctx.fillRect(rx-w,ry,w,20*sc);
      if(me){ctx.fillStyle=CYc;ctx.fillRect(rx-w,ry,3,20*sc);}
      txt(String(k+1),rx-w+10*sc,ry+15*sc,`italic 700 ${Math.round(14*sc)}px ${HF}`,me?CYc:MUc,'left','alphabetic',false);
      txt(o.name,rx-8*sc,ry+15*sc,`italic 700 ${Math.round(14*sc)}px ${HF}`,me?WHc:o.color,'right','alphabetic',false);});}
  // tachometr
  if(!tUI){const kmh=Math.round(Math.abs(r.vf)*.45),top=MAX*1.42,f=clamp(Math.abs(r.vf)/top,0,1),R0=Math.round((tUI?44:68)*sc),
      dcx=tUI?V.x+V.w/2:xr-R0-6*sc,dcy=tUI?yb-R0*.85:yb-R0*.9,a0=Math.PI*.75,a1=Math.PI*2.25,col=r.drift&&r.driftL?DRIFT_C[r.driftL]:r.boostT>0?'#ff9d3a':CYc;
    ctx.save();
    {const g=ctx.createRadialGradient(dcx,dcy,R0*.2,dcx,dcy,R0*1.15);g.addColorStop(0,'rgba(6,10,16,.62)');g.addColorStop(1,'rgba(6,10,16,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(dcx,dcy,R0*1.15,0,TAU);ctx.fill();}
    ctx.lineCap='butt';ctx.strokeStyle='rgba(238,243,247,.14)';ctx.lineWidth=7*sc;ctx.beginPath();ctx.arc(dcx,dcy,R0,a0,a1);ctx.stroke();
    ctx.strokeStyle=col;ctx.shadowColor=col;ctx.shadowBlur=10;ctx.beginPath();ctx.arc(dcx,dcy,R0,a0,a0+(a1-a0)*f);ctx.stroke();ctx.shadowBlur=0;
    for(let k=0;k<=8;k++){const a=a0+(a1-a0)*k/8,c=Math.cos(a),sn=Math.sin(a);ctx.strokeStyle=k>=7?'#ff5a4d':'rgba(238,243,247,.7)';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(dcx+c*(R0-11*sc),dcy+sn*(R0-11*sc));ctx.lineTo(dcx+c*(R0-5*sc),dcy+sn*(R0-5*sc));ctx.stroke();
      if(!tUI)txt(String(k),dcx+c*(R0-20*sc),dcy+sn*(R0-20*sc),`600 ${Math.round(10*sc)}px ${HF}`,k>=7?'#ff5a4d':MUc,'center','middle',false);}
    ctx.restore();
    txt(String(kmh),dcx+(tUI?0:-4*sc),dcy+(tUI?4:8)*sc,`italic 700 ${Math.round((tUI?24:38)*sc)}px ${HF}`,WHc,'center','middle',false);
    txt('KM/H',dcx,dcy+(tUI?20:32)*sc,`700 ${Math.round(10*sc)}px ${HF}`,MUc,'center','middle',false);
    const gear=r.vf<-5?'R':String(clamp(1+Math.floor(f*6.2),1,6));
    if(!tUI)txt(gear,dcx,dcy-24*sc,`italic 700 ${Math.round(15*sc)}px ${HF}`,CYc,'center','middle',false);
    // pruhy: turbo a nabití driftu (jako nitro v NFS)
    if(!tUI){const bx=dcx-R0-150*sc,bw=128*sc;let by=dcy+R0*.35;
      const boostF=clamp(r.boostT/2.3,0,1),drF=r.drift?(r.driftL>=3?1:clamp((r.driftT-[0,.75,1.6][r.driftL])/[.75,.85,1][r.driftL],0,1)):0;
      [[boostF,'#ff9d3a','TURBO'],[drF,r.drift?DRIFT_C[Math.min(3,r.driftL+1)]:CYc,r.drift?'DRIFT '+(r.driftL?'×'+r.driftL:''):'DRIFT']].forEach(([v,c,l],q)=>{const yy=by+q*16*sc;
        ctx.fillStyle='rgba(238,243,247,.12)';skewBar(bx,yy,bw,7*sc,-1);ctx.fillStyle=c;skewBar(bx+bw*(1-v),yy,bw*v,7*sc,-1);
        txt(l,bx-6*sc,yy+7*sc,`700 ${Math.round(10*sc)}px ${HF}`,v>0?c:MUc,'right','alphabetic',false);});}}
  const fp=R3&&VIEW[r.i]==='fp';
  if(R3&&!tUI&&!(G.remote&&remote[r.i]))txt('C  '+(fp?'POHLED ZA AUTEM':'POHLED Z KOKPITU'),V.x+V.w/2,yb-2,`700 ${Math.round(11*sc)}px ${HF}`,'rgba(200,216,230,.45)','center','alphabetic',false);
  if(fp&&r.boostT>0){ctx.save();ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=2;const ccx=V.x+V.w/2,ccy=V.y+V.h*.45;
    for(let i=0;i<16;i++){const a=Math.random()*TAU,r0=Math.min(V.w,V.h)*(.38+Math.random()*.1),l=40+Math.random()*80;
      ctx.beginPath();ctx.moveTo(ccx+Math.cos(a)*r0,ccy+Math.sin(a)*r0);ctx.lineTo(ccx+Math.cos(a)*(r0+l),ccy+Math.sin(a)*(r0+l));ctx.stroke();}ctx.restore();}
  if(fp&&G.mode==='race')for(const o of G.r){if(o===r)continue;const dx=o.x-r.x,dy=o.y-r.y,d=Math.hypot(dx,dy),al=dx*Math.cos(r.ang)+dy*Math.sin(r.ang);
    if(al<-12&&d<300){const side=(-dx*Math.sin(r.ang)+dy*Math.cos(r.ang))>0?1:-1,bx=V.x+V.w/2+side*V.w*.18,by=V.y+V.h*.6;ctx.globalAlpha=clamp(1.4-d/300,.3,1);
      ctx.fillStyle=o.color;ctx.beginPath();ctx.moveTo(bx-14,by-8);ctx.lineTo(bx+14,by-8);ctx.lineTo(bx,by+10);ctx.fill();
      txt(o.name+' za tebou',bx,by+30*sc,`700 ${Math.round(16*sc)}px ${UIF}`,o.color,'center');ctx.globalAlpha=1;}}
  // jmenovka soupeře
  for(const o of G.r){if(o===r||o.ghost)continue;const pp=P.proj(o.x,o.y);if(!pp)continue;const [ox,oy]=pp;if(ox<V.x||ox>V.x+V.w||oy<V.y||oy>V.y+V.h)continue;if(ox>xr-ms-40&&oy<y0+ms+50)continue;
    txt(o.name,ox,oy-6,`700 ${Math.round(15*sc)}px ${UIF}`,o.color,'center');}
  // nápisy uprostřed
  const mx=V.x+V.w/2,my=V.y+V.h*.36;
  if(G.mode==='count'){const c=Math.ceil(G.count);if(c<=3&&c>=1){const f=G.count-Math.floor(G.count);ribbon(mx,my,170*sc,104*sc,c===1?C.gold:C.p1);txt(String(c),mx,my,`italic 700 ${Math.round(110*sc*(0.85+f*.3))}px ${HUDF}`,c===1?C.gold:C.fg,'center','middle');}
    else{ribbon(mx,my,330*sc,64*sc,C.fg);txt('PŘIPRAVIT',mx,my,`italic 700 ${Math.round(54*sc)}px ${HUDF}`,C.fg,'center','middle');}}
  else if(G.goT>0){ribbon(mx,my,380*sc,96*sc,C.gold);txt('START!',mx,my,`italic 700 ${Math.round(96*sc)}px ${HUDF}`,C.gold,'center','middle');}
  else if(r.banner){const b=r.banner,a=Math.min(1,b.t*3,(b.max-b.t)*6);ctx.globalAlpha=Math.max(0,a);ctx.font=`italic 700 ${Math.round(58*sc)}px ${HUDF}`;
    ribbon(mx,my+(b.sub?16*sc:0),Math.max(300*sc,ctx.measureText(b.text).width+120*sc),(b.sub?104:70)*sc,b.col||C.fg);
    txt(b.text,mx,my,`italic 700 ${Math.round(58*sc)}px ${HUDF}`,b.col||C.fg,'center','middle');
    if(b.sub)txt(b.sub,mx,my+44*sc,`700 ${Math.round(22*sc)}px ${UIF}`,C.fg,'center','middle');ctx.globalAlpha=1;}
  else if(r.wrongT>.8){if(Math.sin(t*8)>-.3){ribbon(mx,my,420*sc,64*sc,C.p1);txt('OPAČNÝ SMĚR',mx,my,`italic 700 ${Math.round(48*sc)}px ${HUDF}`,C.p1,'center','middle');}}
  if(r.finished&&!r.banner&&G.mode==='race'){ribbon(mx,my+18*sc,400*sc,104*sc,r.place===1?C.gold:C.fg);txt(r.place+'. místo',mx,my,`italic 700 ${Math.round(48*sc)}px ${HUDF}`,r.place===1?C.gold:C.fg,'center','middle');
    txt(G.endT>2.7?'Do konce závodu zbývá '+Math.ceil(G.endT)+' s':'Čekám na ostatní…',mx,my+40*sc,`700 ${Math.round(20*sc)}px ${UIF}`,C.fg,'center','middle');}
  else if(!r.finished&&G.two&&G.endT>2.7&&G.mode==='race')txt('Soupeř je v cíli. Zbývá '+Math.ceil(G.endT)+' s',mx,V.y+V.h-(touchMode?150:40)*sc-s.b,`700 ${Math.round(22*sc)}px ${UIF}`,C.gold,'center','middle');
  // dotyková tlačítka
  if(touchActive()){const z=zones(V),ts=touchState[vi]||{};
    if(R3){drawButton(z.V,'POHLED',false,r.color);}
    drawButton(z.L,'L',ts.l,r.color);drawButton(z.R,'R',ts.r,r.color);drawButton(z.B,'DRIFT',ts.b||!!r.drift,r.drift?DRIFT_C[r.driftL].replace('rgba(235,235,235,.65)','#d9d6c8'):'#d9d6c8');
    drawButton(z.I,'',false,r.item?r.color:'rgba(12,22,15,.55)',true);
    if(r.item)drawItemIcon(r.item,z.I.x+z.I.w/2,z.I.y+z.I.h/2,z.I.w*.26);else txt('PŘEDMĚT',z.I.x+z.I.w/2,z.I.y+z.I.h/2,`700 ${Math.round(z.u*.18)}px ${UIF}`,C.muted,'center','middle',false);}
}
function renderGarage(t){const gar=R3.gar,ren=R3.renderer,c=gar.car;ctx.clearRect(0,0,W,H);
  c.g.rotation.y=t*.32;const asp=W/Math.max(1,H),wide=asp>1.15,cam=gar.cam;cam.aspect=asp;cam.fov=wide?30:46;
  const d=wide?175:240;cam.position.set(Math.cos(.85)*d,wide?42:60,Math.sin(.85)*d);cam.lookAt(wide?-40:0,wide?10:-26,wide?20:0);cam.updateProjectionMatrix();
  ren.setScissorTest(false);ren.setViewport(0,0,W,H);ren.render(gar.S,cam);}
function render(t){
  if(R3&&R3.gar&&(appScr==='menu'||appScr==='lobby')&&!ov.hidden){try{renderGarage(t);return;}catch(e){}}
  const vs=viewports();
  if(R3){ctx.clearRect(0,0,W,H);render3D(t,vs);vs.forEach((V,vi)=>drawHUD(V,G.r[G.humans[vi]],{proj:proj3D(vi,V)},t,vi));}
  else{ctx.fillStyle='#0b140e';ctx.fillRect(0,0,W,H);
    vs.forEach((V,vi)=>{const r=G.r[G.humans[vi]];const P=drawWorld(V,r,t);drawHUD(V,r,P,t,vi);});}
  if(vs.length>1){ctx.fillStyle='#0b140e';ctx.fillRect(0,H/2-2,W,4);}
}

