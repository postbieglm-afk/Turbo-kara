/* Turbo Kára · menu-art.js: kreslené SVG obrázky v menu: ukázka ovládání (kbSVG, touchUI, kbSolo/kbDuo, phoneSVG/tabletSVG/padSVG), obrázky zařízení devArt() a jezdci obtížností riderSVG()/DIFF_EMO. Jen generátory textu, bez stavu. Načítá se před menu.js. */
'use strict';
/* ---------- ukázka ovládání: nakreslená klávesnice a dotyková obrazovka s odkazovými čarami ---------- */
const FC={horn:'#ff9ad5',gas:'#3ddc84',steer:'#3fd8ff',drift:'#f07a24',item:'#f2c14e',view:'#b48cff',pause:'#c8d3de',reset:'#ff6b8a',p1:'#e5483b',p2:'#2f8fd6'};
// klávesy: [id, popisek, x, y, šířka]
const KB=(()=>{const k=[['esc','Esc',8,8,44]];const row=(s,x,y)=>[...s].forEach((c,i)=>k.push([c.toLowerCase(),c,x+i*41,y,36]));
  k.push(['tab','Tab',8,52,36]);row('QWERTYUIOP',48,52);k.push(['caps','',8,93,48]);row('ASDFGHJKL',60,93);k.push(['enter','Enter',429,93,60]);
  k.push(['shl','Shift',8,134,72]);row('ZXCVBNM',86,134);k.push(['shr','Shift',373,134,116]);
  k.push(['ctl','Ctrl',8,175,52],['alt','Alt',66,175,44],['space','MEZERNÍK',116,175,250],['altr','Alt',372,175,44],['ctr','Ctrl',422,175,67]);
  k.push(['up','↑',546,134,36],['left','←',505,175,36],['down','↓',546,175,36],['right','→',587,175,36]);return k;})();
// odkazová čára: body lomené čáry, pak text (x, y, zarovnání)
const callout=(c,pts,tx,ty,anc,txt)=>`<g class="co" style="--c:${c}"><polyline points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${c}" stroke-width="2"/><circle cx="${pts[0][0]}" cy="${pts[0][1]}" r="3.5" fill="${c}"/><text x="${tx}" y="${ty}" class="cot" text-anchor="${anc}">${txt}</text></g>`;
// act: {id:[barva, pořadí animace, jen náhradní]}
function kbSVG(act,cos,vb){let s='';
  for(const [id,lb,x,y,w] of KB){const a=act[id];
    if(!a){s+=`<rect x="${x}" y="${y}" width="${w}" height="36" rx="5" fill="#111a25" stroke="#223143"/>${lb?`<text x="${x+w/2}" y="${y+22.5}" class="kl dim">${lb}</text>`:''}`;continue;}
    const [c,ord,alt]=a;
    s+=`<g class="kk${alt?' alt':''}" style="--c:${c};--d:${(ord||0)*.45}s"><rect x="${x}" y="${y}" width="${w}" height="36" rx="5" fill="${c}" fill-opacity=".2" stroke="${c}" stroke-width="2"${alt?' stroke-dasharray="4 3"':''}/>
      <rect class="kp" x="${x}" y="${y}" width="${w}" height="36" rx="5" fill="${c}"/><text x="${x+w/2}" y="${y+24.5}" class="kl${w>80?' sm':''}">${lb}</text></g>`;}
  return `<svg class="ckb" viewBox="${vb}" role="img" aria-label="Klávesnice s vyznačenými klávesami">${s}${cos.join('')}</svg>`;}
// obrazovka hry s dotykovými tlačítky; vrací kresbu a polohy tlačítek
function touchUI(ox,oy,w,h,acc,tag){const u=Math.min(w,h)*.3,m=8,sw=u,sh=u*1.05,I=u*.95,bw=u*.82,bh=u*.62,r=v=>v.toFixed(1);
  const L={x:m,y:h-m-sh,w:sw,h:sh},R={x:m+sw+6,y:h-m-sh,w:sw,h:sh},IT={x:w-m-I,y:h-m-I,w:I,h:I},B={x:w-m-I-8-bw,y:h-m-bh,w:bw,h:bh},mm={x:w-m-u*.55,y:m+u*.5,r:u*.42},VW={x:w-m-u*1.1,y:m+u*1.02,w:u*1.1,h:u*.3};
  const btn=(b,c,lb,cls,fs)=>`<g class="tb ${cls}" style="--c:${c}"><rect x="${r(ox+b.x)}" y="${r(oy+b.y)}" width="${r(b.w)}" height="${r(b.h)}" rx="${r(u*.12)}" fill="${c}" fill-opacity=".16" stroke="${c}" stroke-width="1.8"/>
    <circle class="tap" cx="${r(ox+b.x+b.w/2)}" cy="${r(oy+b.y+b.h/2)}" r="${r(Math.min(b.w,b.h)*.42)}" fill="${c}"/><text x="${r(ox+b.x+b.w/2)}" y="${r(oy+b.y+b.h/2+fs*.36)}" class="tl" style="font-size:${r(fs)}px">${lb}</text></g>`;
  const cx=ox+w/2,top=oy+h*.2,P={x:w/2-u*.22,y:m,w:u*.44,h:u*.38},car={x:w/2,y:h*.72};
  const s=`<g><rect x="${ox}" y="${oy}" width="${w}" height="${h}" rx="8" fill="#1a2532"/>
    <polygon points="${r(cx-w*.17)},${oy+h} ${r(cx+w*.17)},${oy+h} ${r(cx+w*.05)},${r(top)} ${r(cx-w*.05)},${r(top)}" fill="#384452"/>
    <polygon points="${r(cx-w*.17)},${oy+h} ${r(cx-w*.155)},${oy+h} ${r(cx-w*.047)},${r(top)} ${r(cx-w*.05)},${r(top)}" fill="#d8432f"/><polygon points="${r(cx+w*.17)},${oy+h} ${r(cx+w*.155)},${oy+h} ${r(cx+w*.047)},${r(top)} ${r(cx+w*.05)},${r(top)}" fill="#d8432f"/>
    ${[0,1,2].map(k=>{const y0=top+(oy+h-top)*(.15+k*.3);return `<rect x="${r(cx-1.2-k*.5)}" y="${r(y0)}" width="${r(2.4+k)}" height="${r(h*.06+k*h*.02)}" fill="#ece8da" opacity=".7"/>`;}).join('')}
    <g transform="translate(${r(ox+car.x)},${r(oy+car.y)})"><rect x="${r(-u*.17)}" y="${r(-u*.3)}" width="${r(u*.34)}" height="${r(u*.56)}" rx="${r(u*.07)}" fill="${acc}"/><rect x="${r(-u*.12)}" y="${r(-u*.14)}" width="${r(u*.24)}" height="${r(u*.14)}" rx="2" fill="#0b121c" opacity=".7"/></g>
    <circle cx="${r(ox+mm.x)}" cy="${r(oy+mm.y)}" r="${r(mm.r)}" fill="#0b121c" stroke="#2a3a4e"/><path d="M${r(ox+mm.x-mm.r*.5)} ${r(oy+mm.y+mm.r*.4)} Q ${r(ox+mm.x)} ${r(oy+mm.y-mm.r*.9)} ${r(ox+mm.x+mm.r*.5)} ${r(oy+mm.y+mm.r*.4)}" fill="none" stroke="#3fd8ff" stroke-width="2"/>
    <g><rect x="${r(ox+P.x)}" y="${r(oy+P.y)}" width="${r(P.w)}" height="${r(P.h)}" rx="3" fill="#0b121c" stroke="${FC.pause}" stroke-width="1.4"/><rect x="${r(cx-u*.09)}" y="${r(oy+m+u*.1)}" width="${r(u*.06)}" height="${r(u*.18)}" fill="${FC.pause}"/><rect x="${r(cx+u*.03)}" y="${r(oy+m+u*.1)}" width="${r(u*.06)}" height="${r(u*.18)}" fill="${FC.pause}"/></g>
    ${tag?`<text x="${ox+m+2}" y="${r(oy+m+u*.3)}" class="tl" style="font-size:${r(u*.3)}px;fill:${acc};text-anchor:start">${tag}</text>`:''}
    ${btn(L,FC.steer,'L','t1',u*.38)}${btn(R,FC.steer,'R','t2',u*.38)}${btn(B,FC.drift,'DRIFT','t3',u*.2)}${btn(IT,FC.item,'PŘEDMĚT','t4',u*.15)}${btn(VW,FC.view,'POHLED','',u*.15)}</g>`;
  const A=b=>({x:ox+b.x,y:oy+b.y,w:b.w,h:b.h,cx:ox+b.x+b.w/2,cy:oy+b.y+b.h/2,b:oy+b.y+b.h,r:ox+b.x+b.w,t:oy+b.y});
  return {s,L:A(L),R:A(R),B:A(B),I:A(IT),V:A(VW),P:A(P),car:{x:ox+car.x,y:oy+car.y-u*.3}};}
const devFrame=(w,h)=>`<rect x="1" y="1" width="${w-2}" height="${h-2}" rx="22" fill="#0a1018" stroke="#2c3d52" stroke-width="2"/>`;
const svgBox=(vb,lbl,inner)=>`<svg class="cdev" viewBox="${vb}" role="img" aria-label="${lbl}">${inner}</svg>`;
// popisky dotykových tlačítek pod a vedle zařízení
function touchCallouts(z,H,W){const yb=H+26,ty=H+46;return [
  callout(FC.steer,[[z.L.cx,z.L.b],[z.L.cx,H+8],[40,yb]],40,ty,'middle','DOLEVA'),
  callout(FC.steer,[[z.R.cx,z.R.b],[z.R.cx,H+8],[150,yb]],150,ty,'middle','DOPRAVA'),
  callout(FC.drift,[[z.B.cx,z.B.b],[z.B.cx,yb]],z.B.cx,ty,'middle','DRIFT'),
  callout(FC.item,[[z.I.r,z.I.cy],[W+28,z.I.cy]],W+34,z.I.cy+7,'start','PŘEDMĚT'),
  callout(FC.view,[[z.V.r,z.V.cy],[W+28,z.V.cy]],W+34,z.V.cy+7,'start','POHLED')];}
function phoneSVG(){const W=420,H=210,z=touchUI(26,12,368,186,FC.p1);
  return svgBox(`-30 -46 ${W+190} ${H+110}`,'Telefon na šířku s tlačítky na obrazovce',devFrame(W,H)+z.s+'<circle cx="13" cy="105" r="3" fill="#2c3d52"/>'+touchCallouts(z,H,W).join('')+
    callout(FC.pause,[[z.P.cx,z.P.t],[z.P.cx,-18]],z.P.cx,-26,'middle','PAUZA')+callout(FC.gas,[[z.car.x-8,z.car.y],[70,-18]],70,-26,'middle','PLYN JEDE SÁM')+callout(FC.horn,[[310,60],[450,-18]],528,-26,'end','PODRŽ = TROUBENÍ'));}
function tabletSVG(){const W=420,H=296,a=touchUI(24,18,372,128,FC.p1,'HRÁČ 1'),z=touchUI(24,150,372,128,FC.p2,'HRÁČ 2');
  return svgBox(`-30 -46 ${W+190} ${H+110}`,'Tablet: hráč 1 nahoře, hráč 2 dole',devFrame(W,H)+a.s+z.s+touchCallouts(z,H,W).join('')+
    callout(FC.pause,[[a.P.cx,a.P.t],[a.P.cx,-18]],a.P.cx,-26,'middle','PAUZA')+callout(FC.gas,[[a.car.x-8,a.car.y],[70,-18]],70,-26,'middle','PLYN JEDE SÁM')+callout(FC.horn,[[310,60],[450,-18]],528,-26,'end','PODRŽ = TROUBENÍ'));}
// mobil jako volant: obrazovka ovladače
function padSVG(){const b=(x,y,w,h,c,lb,cls,fs=16)=>`<g class="tb ${cls}" style="--c:${c}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${c}" fill-opacity=".14" stroke="${c}" stroke-width="2"/><circle class="tap" cx="${x+w/2}" cy="${y+h/2}" r="${Math.min(w,h)*.4}" fill="${c}"/><text x="${x+w/2}" y="${y+h/2+fs*.36}" class="tl" style="font-size:${fs}px">${lb}</text></g>`;
  return svgBox('-130 -46 690 316','Mobil jako volant: obrazovka ovladače',devFrame(420,210)+`<rect x="26" y="12" width="368" height="186" rx="8" fill="#101a24"/>
    <text x="38" y="30" class="tl" style="font-size:10px;fill:${FC.p1};text-anchor:start">HRÁČ 1</text>
    ${b(36,38,128,104,FC.steer,'L','t1',30)}
    <g><rect x="176" y="48" width="68" height="40" rx="10" fill="#0b121c" stroke="${FC.pause}" stroke-width="1.6"/><rect x="202" y="58" width="5" height="20" fill="${FC.pause}"/><rect x="213" y="58" width="5" height="20" fill="${FC.pause}"/></g>
    <rect x="176" y="96" width="68" height="34" rx="8" fill="#0b121c" stroke="#3a4a5e"/><text x="210" y="117" class="tl" style="font-size:11px;fill:#9fb1c3">MENU</text>
    ${b(256,38,128,104,FC.steer,'P','t2',30)}${b(36,150,128,40,FC.item,'PŘEDMĚT','t4',13)}${b(176,150,68,40,FC.view,'POHLED','',11)}${b(256,150,128,40,FC.drift,'DRIFT','t3',13)}
    <circle cx="13" cy="105" r="3" fill="#2c3d52"/>`+
    callout(FC.steer,[[36,90],[-14,90]],-20,97,'end','DOLEVA')+callout(FC.steer,[[384,90],[434,90]],440,97,'start','DOPRAVA')+
    callout(FC.item,[[100,190],[100,236]],100,256,'middle','PŘEDMĚT')+callout(FC.view,[[210,190],[210,236]],210,256,'middle','POHLED')+callout(FC.drift,[[320,190],[320,236]],320,256,'middle','DRIFT')+
    callout(FC.pause,[[210,48],[210,-18]],210,-26,'middle','PAUZA')+`<text x="-120" y="-20" class="cot" text-anchor="start" style="fill:${FC.gas}">PLYN JEDE SÁM</text>`);}
const cfig=(cls,title,svg)=>`<figure class="cfig ${cls}"><figcaption>${title}</figcaption><div class="cscroll">${svg}</div></figure>`;
// klávesnice: popisky u kláves
function kbSolo(free){const act={up:[FC.gas,0],w:[FC.gas,0,1],left:[FC.steer,1],right:[FC.steer,1.6],a:[FC.steer,1,1],d:[FC.steer,1.6,1],down:[FC.drift,2.4],s:[FC.drift,2.4,1],space:[FC.item,3.2],c:[FC.view,4],esc:[FC.pause,4.6],h:[FC.horn,5]};
  const co=[callout(FC.gas,[[564,134],[564,-6]],564,-14,'middle','PLYN'),callout(FC.steer,[[523,211],[523,222],[472,240]],472,260,'middle','DOLEVA'),
    callout(FC.drift,[[564,211],[564,240]],564,260,'middle','DRIFT'),callout(FC.steer,[[605,211],[605,222],[664,240]],664,260,'middle','DOPRAVA'),
    callout(FC.item,[[241,211],[241,240]],241,260,'middle','PŘEDMĚT'),callout(FC.view,[[186,134],[186,131.5],[-6,131.5]],-12,138,'end','POHLED'),
    callout(FC.pause,[[30,8],[30,-6]],30,-14,'middle','PAUZA'),callout(FC.horn,[[291.5,93],[291.5,8],[320,-6]],320,-14,'middle','TROUBENÍ'),
    `<text x="8" y="236" class="cot sm" text-anchor="start" style="fill:#7f93a8">NEBO WASD</text>`];
  if(free){act.r=[FC.reset,5.2];co.push(callout(FC.reset,[[189,52],[189,-6]],189,-14,'middle','NA SILNICI'));}
  return kbSVG(act,co,'-130 -46 880 320');}
function kbDuo(free){const P1=FC.p1,P2=FC.p2,act={w:[P1,0],a:[P1,1],d:[P1,1.5],s:[P1,2.2],f:[P1,3],up:[P2,0.2],left:[P2,1.2],right:[P2,1.7],down:[P2,2.4],enter:[P2,3.2],c:[FC.view,4],esc:[FC.pause,4.6]};
  const co=[callout(P1,[[107,52],[107,-6]],107,-14,'middle','PLYN'),callout(P1,[[60,111],[-6,111]],-12,118,'end','DOLEVA'),
    callout(P1,[[160,93],[160,90.5],[-6,90.5]],-12,94,'end','DOPRAVA'),callout(P1,[[124.5,129],[124.5,172.5],[-6,172.5]],-12,180,'end','DRIFT'),
    callout(P1,[[209.5,93],[209.5,26],[420,26]],426,33,'start','PŘEDMĚT'),
    callout(P2,[[564,134],[564,-6]],564,-14,'middle','PLYN'),callout(P2,[[523,211],[523,222],[472,240]],472,260,'middle','DOLEVA'),
    callout(P2,[[564,211],[564,240]],564,260,'middle','DRIFT'),callout(P2,[[605,211],[605,222],[664,240]],664,260,'middle','DOPRAVA'),
    callout(P2,[[489,111],[640,111]],646,118,'start','PŘEDMĚT'),callout(FC.view,[[186,170],[186,240]],186,260,'middle','POHLED'),
    callout(FC.pause,[[30,8],[30,-6]],30,-14,'middle','PAUZA'),
    `<text x="330" y="262" class="cot sm" text-anchor="middle" style="fill:${FC.horn}">TROUBENÍ: Q · PRAVÝ SHIFT</text>`,
    `<text x="-12" y="232" class="cot" text-anchor="end" style="fill:${P1}">HRÁČ 1</text><text x="760" y="196" class="cot" text-anchor="end" style="fill:${P2}">HRÁČ 2</text>`];
  if(free){act.r=[FC.reset,5.2];co.push(callout(FC.reset,[[189,52],[189,-6]],189,-14,'middle','NA SILNICI'));}
  return kbSVG(act,co,'-130 -46 900 320');}
/* ---------- obrázky u volby, jak se bude hrát: počítač, telefon, televize ---------- */
const DV='#d6dfe9',DVD='#0d141d';
const miniRoad=(x,y,w,h,split)=>{const one=(yy,hh,c)=>`<rect x="${x}" y="${yy}" width="${w}" height="${hh}" fill="#1a2532"/><polygon points="${x+w*.36},${yy+hh} ${x+w*.64},${yy+hh} ${x+w*.54},${yy+hh*.2} ${x+w*.46},${yy+hh*.2}" fill="#3a4654"/><rect x="${x+w/2-2.5}" y="${yy+hh*.62}" width="5" height="${Math.max(5,hh*.22)}" rx="1.5" fill="${c}"/>`;
  return split?one(y,h/2-1,FC.p1)+one(y+h/2+1,h/2-1,FC.p2):one(y,h,FC.p1);};
// stolní počítač: monitor na stojanu, klávesnice a myš
function pcArt(x,y,two,tv){const w=tv?118:100,h=tv?68:62;let s=`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${DV}"/>${miniRoad(x+6,y+6,w-12,h-12,two)}
  <rect x="${x+w/2-7}" y="${y+h}" width="14" height="${tv?6:9}" fill="${DV}"/><polygon points="${x+w/2-22},${y+h+(tv?12:16)} ${x+w/2+22},${y+h+(tv?12:16)} ${x+w/2+17},${y+h+(tv?6:9)} ${x+w/2-17},${y+h+(tv?6:9)}" fill="${DV}"/>`;
  if(tv)return s;
  const ky=y+h+21;s+=`<polygon points="${x-6},${ky+22} ${x+w-14},${ky+22} ${x+w-20},${ky} ${x},${ky}" fill="${DV}"/>`;
  for(let r0=0;r0<3;r0++)for(let k=0;k<10;k++){const kx=x+2+k*8.2-r0*1.6+(r0===2&&k>3?0:0),kw=r0===2&&k>=3&&k<=6?0:6;if(!kw)continue;
    let c=DVD;if(!two){if(r0===2&&k>=8)c=FC.steer;if(r0===1&&k===9)c=FC.gas;}else{if(k<3&&r0>0)c=FC.p1;if(k>=8&&r0>0)c=FC.p2;}
    s+=`<rect x="${kx.toFixed(1)}" y="${ky+3+r0*6.2}" width="${kw}" height="4" rx=".8" fill="${c}"/>`;}
  s+=`<rect x="${x+24-3.2}" y="${ky+15.4}" width="32" height="4" rx=".8" fill="${DVD}"/>`;
  s+=`<ellipse cx="${x+w+2}" cy="${ky+10}" rx="8" ry="6" fill="${DV}"/><path d="M${x+w+2} ${ky+4} v5" stroke="${DVD}" stroke-width="1.6"/>`;return s;}
// telefon na šířku: reproduktor a domovské tlačítko jako na obrázku, na displeji hra nebo ovladač
function phoneArt(x,y,w,h,col,split,ctrl){const btn=(bx,by,bw,bh,c)=>`<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="2" fill="${c}" fill-opacity=".35" stroke="${c}" stroke-width="1.2"/>`;
  const sx=x+11,sy=y+4,sw=w-22,sh=h-8;
  const inner=ctrl?`<rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" fill="#101a24"/>${btn(sx+3,sy+3,sw*.36,sh*.56,FC.steer)}${btn(sx+sw-3-sw*.36,sy+3,sw*.36,sh*.56,FC.steer)}${btn(sx+3,sy+sh-3-sh*.26,sw*.36,sh*.26,FC.item)}${btn(sx+sw-3-sw*.36,sy+sh-3-sh*.26,sw*.36,sh*.26,FC.drift)}`
    :miniRoad(sx,sy,sw,sh,split)+(split?[0,1].map(k=>{const yy=sy+k*sh/2;return btn(sx+3,yy+sh/2-10,7,7,FC.steer)+btn(sx+12,yy+sh/2-10,7,7,FC.steer)+btn(sx+sw-10,yy+sh/2-10,7,7,FC.item);}).join('')
    :btn(sx+3,sy+sh-14,9,11,FC.steer)+btn(sx+14,sy+sh-14,9,11,FC.steer)+btn(sx+sw-12,sy+sh-14,9,11,FC.item)+btn(sx+sw-23,sy+sh-11,9,8,FC.drift));
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" fill="${DV}"/>${col?`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" fill="none" stroke="${col}" stroke-width="2.5"/>`:''}${inner}
    <rect x="${x+4}" y="${y+h/2-7}" width="3" height="14" rx="1.5" fill="${DVD}"/><circle cx="${x+w-5.5}" cy="${y+h/2}" r="3.2" fill="${DVD}"/>`;}
const waves=(x,y,c)=>[8,15].map(r=>`<path d="M${x} ${y-r} a${r} ${r} 0 0 1 ${r} ${r}" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/>`).join('');
function devArt(kind,two){let s='';
  if(kind==='local'&&!two)s=pcArt(14,6,false)+`<text x="150" y="58" class="dor">nebo</text>`+phoneArt(170,32,66,38,'',false);
  else if(kind==='local'||kind==='local2')s=pcArt(14,6,true)+`<text x="150" y="58" class="dor">nebo</text>`+phoneArt(170,26,66,50,'',true);
  else if(kind==='pad'&&!two)s=pcArt(10,10,false,true)+waves(142,44,FC.steer)+phoneArt(164,38,70,40,FC.p1,false,true);
  else s=pcArt(6,10,true,true)+waves(134,36,FC.steer)+phoneArt(156,8,66,38,FC.p1,false,true)+phoneArt(170,54,66,38,FC.p2,false,true);
  return `<svg viewBox="0 0 240 104" aria-hidden="true">${s}</svg>`;}
/* ---------- obtížnost: jezdci v helmě s výrazem podle smajlíků 🥱 😤 💀 ---------- */
function riderSVG(k){
  const col={easy:'#3ddc84',norm:'#f07a24',hard:'#e5483b'}[k],dk={easy:'#1f7a4a',norm:'#9a4510',hard:'#7a1d16'}[k],skin=k==='hard'?'#eae4d6':'#f2c58e';
  let face='';
  if(k==='easy')face=`<path d="M19 27 q3 2.4 6 0 M33 27 q3 2.4 6 0" stroke="#3a2a1c" stroke-width="2" fill="none" stroke-linecap="round"/>
    <ellipse cx="29" cy="35.5" rx="4.2" ry="5" fill="#5a2018"/><ellipse cx="29" cy="37.5" rx="2.6" ry="2" fill="#e0706a"/>
    <text x="45" y="16" font-size="8" font-weight="700" fill="#cfe9ff" font-family="sans-serif">z</text><text x="50" y="10" font-size="6" font-weight="700" fill="#cfe9ff" font-family="sans-serif">z</text>`;
  else if(k==='norm')face=`<path d="M17 23 l8 3 M41 23 l-8 3" stroke="#3a2a1c" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="22.5" cy="28" r="2.2" fill="#3a2a1c"/><circle cx="35.5" cy="28" r="2.2" fill="#3a2a1c"/>
    <path d="M23 38.5 q6 -3.5 12 0" stroke="#3a2a1c" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <g fill="#f4f6f8"><circle cx="16" cy="37" r="3.2"/><circle cx="12" cy="39" r="2.4"/><circle cx="42" cy="37" r="3.2"/><circle cx="46" cy="39" r="2.4"/></g>`;
  else face=`<ellipse cx="22.5" cy="28" rx="4" ry="4.6" fill="#1a1410"/><ellipse cx="35.5" cy="28" rx="4" ry="4.6" fill="#1a1410"/>
    <path d="M29 31.5 l-2 4 h4 z" fill="#1a1410"/><rect x="22" y="37" width="14" height="5" rx="1.5" fill="#1a1410"/>
    <path d="M25.5 37 v5 M29 37 v5 M32.5 37 v5" stroke="${skin}" stroke-width="1.3"/>`;
  return `<svg viewBox="0 0 58 52" aria-hidden="true"><path d="M29 3 C 12 3 4 14 4 28 C 4 38 8 46 13 49 L 45 49 C 50 46 54 38 54 28 C 54 14 46 3 29 3 Z" fill="${col}"/>
    <path d="M10 44 L48 44 L46 49 L12 49 Z" fill="${dk}"/><path d="M27 3.2 h4 v14 h-4 z" fill="#fff" opacity=".85"/>
    <rect x="11" y="17" width="36" height="28" rx="11" fill="#0d141d"/><rect x="13" y="19" width="32" height="24" rx="9.5" fill="${skin}"/>${face}
    <path d="M13 22 q4 -3 10 -3" stroke="#fff" stroke-width="1.6" fill="none" opacity=".5" stroke-linecap="round"/></svg>`;}
const DIFF_EMO={easy:riderSVG('easy'),norm:riderSVG('norm'),hard:riderSVG('hard')};
