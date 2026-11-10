/* Turbo Kára · menu.js: menu */
'use strict';
/* ---------- menu ---------- */
// menu: domů (SOLO / MULTIPLAYER + tipy) -> zařízení a ovládání -> mapa -> start
const MS={scr:'home',mode:'one',dev:'local'};
const SV=(p,x)=>`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}${x?'<path class="x" d="M3 3l18 18"/>':''}</svg>`;
const IC={
  music:SV('<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',1),
  sound:SV('<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',1),
  line:SV('<path d="M4 20c3-7 6-3 8-9s5-6 8-7"/><path d="M15 4h5v5"/>',1),
  vol:SV('<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>'),
  back:SV('<path d="M13 5l-7 7 7 7M20 5l-7 7 7 7"/>'),
  next:SV('<path d="M9 5l7 7-7 7"/>'),
  solo:SV('<circle cx="12" cy="10" r="6"/><path d="M6 10h12M9 16l-1 5M15 16l1 5"/>'),
  multi:SV('<circle cx="8" cy="9" r="4"/><circle cx="16" cy="9" r="4"/><path d="M2 21c1-4 4-6 6-6s5 2 6 6M10 21c1-4 4-6 6-6s5 2 6 6"/>'),
  drift:SV('<path d="M4 18c4 0 6-3 8-6s4-6 8-6"/><path d="M4 13l2 2M7 10l2 2M10 7l2 2"/>'),
  shield:SV('<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/>'),
  oil:SV('<path d="M12 3c3 5 6 8 6 11a6 6 0 0 1-12 0c0-3 3-6 6-11z"/>'),
  jump:SV('<path d="M3 19h10l8-8"/><path d="M14 6c2-1 4-1 6 0"/><path d="M3 19l7-5"/>'),
  boost:SV('<path d="M5 6l6 6-6 6M12 6l6 6-6 6"/>'),
  coin:SV('<circle cx="12" cy="12" r="8"/><path d="M12 8v8"/>'),
  route:SV('<path d="M6 19l3-3M10 15l3-3M14 11l3-3"/><path d="M14 5h5v5"/>'),
  curb:SV('<path d="M3 17h18M5 17v-4M10 17v-4M15 17v-4M20 17v-4M3 13h18"/>'),
  phone:SV('<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>'),
  free:SV('<path d="M3 7h18M3 17h18M7 3v18M17 3v18"/><circle cx="12" cy="12" r="2.5"/>')};
const TIPS=[
  ['drift','DRIFT','Drž DRIFT a zatáčej. Jiskry modré, oranžové a fialové: čím déle driftuješ, tím delší turbo po puštění.'],
  ['shield','ŠTÍT','12 sekund ochrany před olejem, kužely i nárazy. Po zdi s ním jen sklouzneš.'],
  ['oil','OLEJ','Louže na trati i olej od soupeře tě otočí dokola. Skončíš čelem po trati, ale na skle zůstane flek.'],
  ['jump','SKOKÁNKY','Žlutočerné rampy auto vystřelí a zrychlí. Ve vzduchu se nezatáčí.'],
  ['boost','PÁSY','Oranžové pásy na začátku rovinek dají krátké turbo.'],
  ['coin','PENÍZKY','Každý přidá 0,2 % k nejvyšší rychlosti. Při smyku dva ztratíš.'],
  ['route','STOPA','Šipky ukazují ideální stopu. Zelená plný plyn, žlutá ubrat, červená brzdit.'],
  ['curb','CHODNÍK','Na chodníku zpomalíš až po dvou sekundách. Do zdí a svodidel nenaraž.']];
// tipy: vždy jen jeden, po pár vteřinách se plynule vystřídá další
let TIPI=0;try{TIPI=(+localStorage.getItem('tk-tip')||0)%TIPS.length;}catch(e){}
const TIP_MS=7000;
const tipHTML=i=>{const [ic,t,d]=TIPS[i];return `<div class="mtip in">${IC[ic]}<b>${t}</b><span>${d}</span><i class="mtbar" style="animation-duration:${TIP_MS}ms"></i><em class="mtn">${i+1}/${TIPS.length}</em></div>`;};
setInterval(()=>{const box=document.querySelector('[data-tips]');if(!box||ov.hidden)return;const old=box.firstElementChild;if(old)old.classList.add('out');
  setTimeout(()=>{TIPI=(TIPI+1)%TIPS.length;try{localStorage.setItem('tk-tip',String(TIPI));}catch(e){}if(document.body.contains(box))box.innerHTML=tipHTML(TIPI);},380);},TIP_MS);
function bankGet(){try{return +localStorage.getItem('tk-bank')||0;}catch(e){return 0;}}
function bestGet(id){try{const v=+localStorage.getItem('tk-best-'+id);return v>0?v:null;}catch(e){return null;}}
const volRow=(k,lbl)=>`<label class="vrow"><span>${lbl}</span><input type="range" min="0" max="100" step="1" value="${Math.round(VOL[k]*100)}" data-v="${k}" aria-label="Hlasitost: ${lbl}"><b>${Math.round(VOL[k]*100)} %</b></label>`;
const toggles=()=>`<span class="vwrap"><button class="itog on" data-vol aria-label="Hlasitost" aria-expanded="false" title="Hlasitost">${IC.vol}</button><div class="vpop" hidden>${volRow('mu','HUDBA')}${volRow('fx','EFEKTY')}</div></span><button class="itog${soundOn?' on':''}" data-sound aria-label="Zvuk" aria-pressed="${soundOn}" title="Zvuk">${IC.sound}</button><button class="itog${SHOWLINE?' on':''}" data-line aria-label="Ideální stopa" aria-pressed="${SHOWLINE}" title="Ideální stopa">${IC.line}</button>`;
const topBar=back=>`<div class="mtop">${back?`<button class="mback" data-back aria-label="Zpět">${IC.back}</button><div class="mlogo">TURBO <b>KÁRA</b></div>`:''}
  <div class="mstats"><span class="mstat" title="Penízky ze všech závodů"><i class="mcoin"></i>${bankGet().toLocaleString('cs-CZ')}</span></div><div class="mtoggles"><button class="mtrk" data-mnext title="Další skladba" aria-label="Další skladba">♪ <span>${curSong().name}</span> ›</button><button class="itog${MUSIC.on?' on':''}" data-music aria-label="Hudba v menu" aria-pressed="${MUSIC.on}" title="Hudba v menu">${IC.music}</button>${toggles()}</div></div>`;
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
let CTRL_OPEN=false;
function controlsHTML(){
  const solo=MS.mode==='one'||(MS.mode==='free'&&MS.dev!=='local2'),free=MS.mode==='free';
  if(MS.dev==='pad')return `<ol class="msteps"><li>Na velké obrazovce (notebook, iPad, televize) nech hru otevřenou a dej <b>${solo?'PŘIPOJIT OVLADAČ':'PŘIPOJIT OVLADAČE'}</b>.</li>
    <li>Na ${solo?'mobilu':'každém mobilu'} otevři stejný odkaz a ťukni na <b>TENTO TELEFON JE OVLADAČ</b>.${solo?'':' Kamarád musí mít hru nasdílenou na svůj e-mail.'}</li>
    <li>Mobil drž na šířku jako volant:</li></ol><div class="cviz">${cfig('t','OBRAZOVKA OVLADAČE',padSVG())}</div>`;
  if(solo)return `<div class="cviz">${cfig('k','NA POČÍTAČI',kbSolo(free))}${cfig('t','NA MOBILU A TABLETU',phoneSVG())}</div>`;
  return `<div class="cviz">${cfig('k','NA JEDNÉ KLÁVESNICI',kbDuo(free))}${cfig('t','NA TABLETU',tabletSVG())}</div>`;
}
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
const FREEDEV=[['local','SÁM','Klávesnice, nebo dotyk na telefonu a tabletu'],['local2','VE DVOU','Oba u jedné klávesnice, nebo každý na své půlce tabletu'],['pad','MOBIL JAKO VOLANT','Hra běží na velké obrazovce, mobil řídí']];
const modeName=()=>MS.mode==='free'?'VOLNÁ JÍZDA':MS.mode==='one'?'SOLO':'MULTIPLAYER';
const devName=()=>MS.mode==='free'?FREEDEV.find(d=>d[0]===MS.dev)[1]:MS.dev==='pad'?(MS.mode==='one'?'MOBIL JAKO VOLANT':'MOBILY JAKO VOLANTY'):(MS.mode==='one'?'NA TOMTO ZAŘÍZENÍ':'JEDEN POČÍTAČ');
const freeSvg={};
function freeSVG(id){if(freeSvg[id])return freeSvg[id];const N0=genNet(TRACKS[id]),w=N0.maxX-N0.minX,h=N0.maxY-N0.minY,sc=86/Math.max(w,h),ox=(100-w*sc)/2,oy=(100-h*sc)/2;
  const pl=N0.polys.map(p=>{const pts=[];for(let q=0;q<p.n;q+=6){const i=p.o+q;pts.push((ox+(N0.x[i]-N0.minX)*sc).toFixed(1)+','+(oy+(N0.y[i]-N0.minY)*sc).toFixed(1));}
    return p.closed?`<polygon points="${pts.join(' ')}" fill="none" stroke="#3fd8ff" stroke-width="2.6" stroke-linejoin="round"/>`:`<polyline points="${pts.join(' ')}" fill="none" stroke="#f2f0e3" stroke-width="1.8" stroke-linecap="round" opacity=".7"/>`;});
  return freeSvg[id]=`<svg viewBox="0 0 100 100" aria-hidden="true">${pl.join('')}</svg>`;}
function menuHTML(){
  const solo=MS.mode==='one'||(MS.mode==='free'&&MS.dev!=='local2'),free=MS.mode==='free';
  if(MS.scr==='home')return `${topBar(false)}
  <div class="mhero"><h1 class="mtitle">TURBO <span>KÁRA</span></h1></div>
  <div class="mtiles">
    <button class="mtile" data-go="one"><b>SOLO</b>${IC.solo}</button>
    <button class="mtile alt" data-go="two"><b>MULTIPLAYER</b>${IC.multi}</button>
    <button class="mtile free" data-go="free"><b>VOLNÁ JÍZDA</b>${IC.free}</button>
  </div>
  <section class="msect" aria-label="Tip"><h3>TIP</h3><div class="mtipone" data-tips aria-live="polite">${tipHTML(TIPI)}</div></section>
  <div class="mfoot"><button class="mlink" data-screen="ctrl">${IC.phone}TENTO TELEFON JE OVLADAČ</button></div>
  <p class="mdevs"><span>VÝVOJÁŘI</span>Martin Postbiegl a Martin Link</p>`;
  if(MS.scr==='setup'&&free)return `${topBar(true)}
  <div class="mhead"><span class="mk">TRÉNINK</span><h2>VOLNÁ JÍZDA</h2></div>
  <p class="mblurb">Ovál a v něm síť ulic. Na silnicích jsou skokánky, zrychlovací pásy a penízky, na třech náměstích předměty. Zastaví tě jen domy.</p>
  <div class="mopts three" role="radiogroup" aria-label="Kdo jede">${FREEDEV.map(([k,b,t])=>`<button class="mopt${MS.dev===k?' on':''}" role="radio" aria-checked="${MS.dev===k}" data-dev="${k}" title="${t}"><b>${b}</b><span class="mopt-art">${devArt(k,k==='local2')}</span><span class="sr">${t}</span></button>`).join('')}</div>
  <details class="mctrl mfold"${CTRL_OPEN?' open':''}><summary><h3>OVLÁDÁNÍ</h3><span class="mfold-i" aria-hidden="true"></span></summary><div class="mfold-b">${controlsHTML()}</div></details>
  <div class="mact"><button class="mbtn" data-go="map">VYBRAT MAPU ${IC.next}</button>${MS.dev==='pad'?`<button class="mlink" data-screen="ctrl">${IC.phone}TENTO TELEFON JE OVLADAČ</button>`:''}</div>`;
  if(MS.scr==='setup'){const chips=Object.keys(DIFFS).map(k=>`<button class="chip emo${k===diff?' on':''}" data-diff="${k}" title="${DIFFS[k].n}" aria-label="Obtížnost: ${DIFFS[k].n}">${DIFF_EMO[k]}</button>`).join('');
    return `${topBar(true)}
  <div class="mhead"><span class="mk">${solo?'1 HRÁČ':'2 HRÁČI'}</span><h2>${solo?'SOLO':'MULTIPLAYER'}</h2></div>
  <div class="mopts" role="radiogroup" aria-label="Kde se hraje">
    <button class="mopt${MS.dev==='local'?' on':''}" role="radio" aria-checked="${MS.dev==='local'}" data-dev="local"><b>${solo?'NA TOMTO ZAŘÍZENÍ':'JEDEN POČÍTAČ'}</b><span class="mopt-art">${devArt('local',!solo)}</span><span class="sr">${solo?'Klávesnice, nebo dotyk na telefonu a tabletu':'Oba u jedné klávesnice, nebo každý na své půlce tabletu'}</span></button>
    <button class="mopt${MS.dev==='pad'?' on':''}" role="radio" aria-checked="${MS.dev==='pad'}" data-dev="pad"><b>${solo?'MOBIL JAKO VOLANT':'MOBILY JAKO VOLANTY'}</b><span class="mopt-art">${devArt('pad',!solo)}</span><span class="sr">Hra běží na velké obrazovce, ${solo?'mobil řídí':'každý řídí svým mobilem'}</span></button>
  </div>
  <details class="mctrl mfold"${CTRL_OPEN?' open':''}><summary><h3>OVLÁDÁNÍ</h3><span class="mfold-i" aria-hidden="true"></span></summary><div class="mfold-b">${controlsHTML()}</div></details>
  ${solo?`<div class="mrow"><span class="mlab">SOUPEŘ</span><div class="chips" role="group" aria-label="Obtížnost soupeře">${chips}</div></div>`:''}
  <div class="mact"><button class="mbtn" data-go="map">VYBRAT MAPU ${IC.next}</button>${MS.dev==='pad'?`<button class="mlink" data-screen="ctrl">${IC.phone}TENTO TELEFON JE OVLADAČ</button>`:''}</div>`;}
  // výběr mapy
  const km=id=>(previewTrack(id).L/10000).toFixed(1).replace('.',',');
  return `${topBar(true)}
  <div class="mhead"><span class="mk">${modeName()} · ${devName()}</span><h2>VYBER MAPU</h2></div>
  <div class="mmaps" role="radiogroup" aria-label="Mapa">
    ${Object.values(TRACKS).filter(m=>!free||m.id==='tokyo').map(m=>{const b=bestGet(m.id);return `<button class="mmap${m.id===TRK.id?' on':''}" role="radio" aria-checked="${m.id===TRK.id}" data-map="${m.id}"><span class="mm-art ${m.id}">${free?freeSVG(m.id):trackSVG(m.id)}</span><span class="mm-txt"><b>${m.name}</b><span>${m.sub}</span><span class="mm-meta">${free?'okruh a '+(freeSVG(m.id).match(/polyline/g)||[]).length+' uliček':km(m.id)+' km · '+LAPS+' kola'+(b?' · nej kolo '+fmt(b):'')}</span></span></button>`;}).join('')}
    <div class="mmap soon" aria-disabled="true"><span class="mm-art"><span class="lock">?</span></span><span class="mm-txt"><b>MAPA 3</b><span>Již brzy</span></span></div>
  </div>
  <div class="mact"><button class="mbtn" data-start>${MS.dev==='pad'?(solo?'PŘIPOJIT OVLADAČ':'PŘIPOJIT OVLADAČE'):free?'VYJET':'START'} ${IC.next}</button></div>`;
}
/* ---------- pozadí při výběru mapy: Tokio v noci, Brno při západu slunce ---------- */
function mapBgSVG(id){const R0=rng(id==='tokyo'?77:33),r=()=>R0();let s='';
  if(id==='tokyo'){
    s+=`<defs><linearGradient id="tks" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07061a"/><stop offset=".5" stop-color="#241038"/><stop offset=".8" stop-color="#8e1f55"/><stop offset="1" stop-color="#ff6a5c"/></linearGradient>
      <linearGradient id="tksun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd27a"/><stop offset=".55" stop-color="#ff5a6e"/><stop offset="1" stop-color="#d8246a"/></linearGradient><clipPath id="tksc"><circle cx="1180" cy="600" r="220"/></clipPath></defs>
      <rect width="1600" height="900" fill="url(#tks)"/>`;
    for(let i=0;i<90;i++)s+=`<circle cx="${(r()*1600).toFixed(0)}" cy="${(r()*430).toFixed(0)}" r="${(r()*1.6+.4).toFixed(1)}" fill="#fff" opacity="${(r()*.6+.2).toFixed(2)}"/>`;
    s+=`<g clip-path="url(#tksc)"><circle cx="1180" cy="600" r="220" fill="url(#tksun)"/>${[0,1,2,3,4,5].map(k=>`<rect x="940" y="${600+k*30+k*k*2}" width="480" height="${4+k*2.2}" fill="#8e1f55"/>`).join('')}</g>
      <polygon points="700,760 1030,470 1060,486 1090,468 1120,484 1460,760" fill="#3a1650"/><polygon points="985,510 1030,470 1060,486 1090,468 1120,484 1160,515 1120,530 1090,512 1060,532 1030,514" fill="#f6d6ea" opacity=".85"/>`;
    // Tokijská věž
    const tx=420,ty=300,tb=760;s+=`<g stroke="#ff3d55" stroke-width="5" fill="none" opacity=".95"><path d="M${tx-110} ${tb} Q ${tx-30} ${ty+220} ${tx-6} ${ty}"/><path d="M${tx+110} ${tb} Q ${tx+30} ${ty+220} ${tx+6} ${ty}"/>
      ${[0,1,2,3,4,5,6,7].map(k=>{const y=ty+40+k*55,w=8+Math.pow((y-ty)/(tb-ty),1.6)*100;return `<path d="M${tx-w} ${y} L${tx+w} ${y+28} M${tx+w} ${y} L${tx-w} ${y+28}" stroke-width="2.5" opacity=".7"/>`;}).join('')}</g>
      <rect x="${tx-48}" y="${ty+300}" width="96" height="22" fill="#ff3d55"/><rect x="${tx-26}" y="${ty+140}" width="52" height="14" fill="#ff3d55"/><rect x="${tx-3}" y="${ty-90}" width="6" height="100" fill="#ff8a96"/><circle cx="${tx}" cy="${ty-92}" r="5" fill="#fff"/>`;
    // mrakodrapy s okny
    let x=-20;while(x<1620){const w=50+r()*90,h=120+r()*(x>700&&x<1100?150:330),y=900-h;s+=`<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="#110a22"/>`;
      const cols=['#ff5fa2','#3fd8ff','#ffd36e'];for(let wy=y+14;wy<880;wy+=18)for(let wx=x+8;wx<x+w-8;wx+=14)if(r()<.28)s+=`<rect x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="6" height="8" fill="${cols[(r()*3)|0]}" opacity="${(r()*.5+.35).toFixed(2)}"/>`;
      if(r()<.3)s+=`<rect x="${(x+w*.2).toFixed(0)}" y="${(y-26).toFixed(0)}" width="${(w*.6).toFixed(0)}" height="18" rx="3" fill="${['#ff2e88','#28c8ff'][(r()*2)|0]}" opacity=".85"/>`;
      x+=w+4+r()*10;}
    s+=`<g class="mbg-pet">${Array.from({length:18},(_,i)=>`<ellipse cx="${(r()*1600).toFixed(0)}" cy="-20" rx="6" ry="3.5" fill="#ffb7d5" style="--dx:${(r()*200-120).toFixed(0)}px;--dur:${(8+r()*8).toFixed(1)}s;--del:${(-r()*14).toFixed(1)}s"/>`).join('')}</g>`;}
  else{
    s+=`<defs><linearGradient id="brs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1830"/><stop offset=".45" stop-color="#244472"/><stop offset=".78" stop-color="#c47a52"/><stop offset="1" stop-color="#f4bd73"/></linearGradient></defs>
      <rect width="1600" height="900" fill="url(#brs)"/><circle cx="820" cy="700" r="120" fill="#ffd49a" opacity=".55"/>
      <g class="mbg-cl">${[0,1,2,3].map(k=>`<ellipse cx="${200+k*420}" cy="${160+k*40%120}" rx="${180+k*30}" ry="26" fill="#e9c6b0" opacity=".16"/>`).join('')}</g>
      <path d="M-20 900 L-20 600 Q 160 470 380 455 Q 600 450 760 610 L 820 900 Z" fill="#16243a"/>
      <path d="M900 900 L 960 640 Q 1100 520 1240 525 Q 1420 535 1620 660 L1620 900 Z" fill="#14213a"/>`;
    // Špilberk: hradby se zuby, věž s vlajkou
    s+=`<g fill="#0e1828"><rect x="250" y="400" width="280" height="62"/>${Array.from({length:14},(_,i)=>`<rect x="${250+i*20}" y="390" width="11" height="12"/>`).join('')}
      <rect x="350" y="318" width="64" height="90"/><polygon points="342,320 382,282 422,320"/><rect x="380" y="232" width="3" height="52" fill="#c9d2de"/></g>
      <rect x="383" y="232" width="34" height="11" fill="#f4f4f4"/><rect x="383" y="243" width="34" height="11" fill="#d7141a"/><polygon points="383,232 383,254 399,243" fill="#11457e"/>
      ${[0,1,2,3,4].map(k=>`<rect x="${272+k*52}" y="424" width="8" height="12" fill="#ffcf7a" opacity=".7"/>`).join('')}`;
    // Petrov: katedrála se dvěma věžemi
    s+=`<g fill="#0d1626"><rect x="1120" y="440" width="190" height="90"/><polygon points="1110,440 1215,392 1320,440"/>
      <rect x="1140" y="330" width="34" height="115"/><polygon points="1134,332 1157,196 1180,332"/><rect x="1196" y="330" width="34" height="115"/><polygon points="1190,332 1213,196 1236,332"/></g>
      <rect x="1155" y="190" width="4" height="10" fill="#d8c27a"/><rect x="1211" y="190" width="4" height="10" fill="#d8c27a"/>
      <circle cx="1185" cy="470" r="12" fill="#ffcf7a" opacity=".55"/>`;
    // střechy starého města
    let x=-30;while(x<1630){const w=60+r()*80,h=90+r()*90,y=900-h,roof=20+r()*40;s+=`<polygon points="${x.toFixed(0)},${y.toFixed(0)} ${(x+w/2).toFixed(0)},${(y-roof).toFixed(0)} ${(x+w).toFixed(0)},${y.toFixed(0)} ${(x+w).toFixed(0)},900 ${x.toFixed(0)},900" fill="#0a1220"/>
      <polygon points="${x.toFixed(0)},${y.toFixed(0)} ${(x+w/2).toFixed(0)},${(y-roof).toFixed(0)} ${(x+w).toFixed(0)},${y.toFixed(0)}" fill="#5a2a22" opacity=".55"/>`;
      for(let wy=y+18;wy<880;wy+=26)for(let wx=x+10;wx<x+w-12;wx+=20)if(r()<.3)s+=`<rect x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="8" height="11" fill="#ffcf7a" opacity="${(r()*.4+.4).toFixed(2)}"/>`;
      x+=w+r()*6;}}
  return `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice">${s}</svg>`;}
let MAPBG=null;
function mapAmb(){const on=appScr==='menu'&&MS.scr==='map',id=on?TRK.id:'';
  if(!MAPBG){MAPBG=document.createElement('div');MAPBG.id='mapbg';MAPBG.setAttribute('aria-hidden','true');ov.insertBefore(MAPBG,card);}
  if(id&&MAPBG.dataset.id!==id){MAPBG.innerHTML=mapBgSVG(id);MAPBG.dataset.id=id;}
  MAPBG.classList.toggle('on',!!id);if(appScr==='menu')musicSet(id||null);}
function menuRender(){mapAmb();card.className='card menu';ov.classList.add('menuov');card.innerHTML=menuHTML();bindButtons();ov.scrollTop=0;}
const trackSvgCache={};
function trackSVG(id){
  if(trackSvgCache[id])return trackSvgCache[id];
  const T=previewTrack(id),N=T.N;
  const w=T.maxX-T.minX,h=T.maxY-T.minY,sc=86/Math.max(w,h),ox=(100-w*sc)/2,oy=(100-h*sc)/2,pts=[];
  for(let i=0;i<N;i+=6)pts.push((ox+(T.x[i]-T.minX)*sc).toFixed(1)+','+(oy+(T.y[i]-T.minY)*sc).toFixed(1));
  const sx=ox+(T.x[0]-T.minX)*sc,sy=oy+(T.y[0]-T.minY)*sc;
  return trackSvgCache[id]=`<svg viewBox="0 0 100 100" aria-hidden="true"><polygon points="${pts.join(' ')}" fill="none" stroke="#f2f0e3" stroke-width="3.2" stroke-linejoin="round"/><line x1="${sx-5}" y1="${sy}" x2="${sx+5}" y2="${sy}" stroke="#e5483b" stroke-width="3"/></svg>`;
}
function selectTrack(id){
  if(!TRACKS[id]||TRK.id===id)return;
  loadTrack(id);try{localStorage.setItem('tk-track',id);}catch(e){}
  if(R3){try{disposeScene(R3);R3=build3D(R3);if(R3){R3.qT.redraw();R3.banT.redraw();}}catch(e){R3=null;}}
  G=newGame('demo');
  if(appScr==='lobby')showLobby();else if(appScr==='menu')menuRender();
}
function showMenu(){
  appScr='menu';document.body.classList.remove('ctrlmode','split');ctrlEl.hidden=true;CT.p=-1;
  if(room)room.presence({role:null}).catch(()=>{});
  engineStop();ensureTrack(false);MS.scr='home';menuRender();ov.hidden=false;G=newGame('demo');if(AC)musicStart();
}
addEventListener('click',()=>{document.querySelectorAll('.vpop:not([hidden])').forEach(p=>{p.hidden=true;const b=p.previousElementSibling;if(b)b.setAttribute('aria-expanded','false');});});
function bindButtons(){
  card.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>startGame(b.dataset.mode)));
  card.querySelectorAll('[data-screen]').forEach(b=>b.addEventListener('click',()=>{const s=b.dataset.screen;if(s==='ctrl')showCtrl();else{if(s==='pad1')padKind='pad1';showLobby();}}));
  card.querySelectorAll('[data-lk]').forEach(b=>b.addEventListener('click',()=>{padKind=b.dataset.lk;showLobby();}));
  card.querySelectorAll('[data-map]').forEach(b=>b.addEventListener('click',()=>selectTrack(b.dataset.map)));
  card.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>{audio();const g=b.dataset.go;if(g==='map'){MS.scr='map';if(MS.mode==='free'&&TRK.id!=='tokyo'){selectTrack('tokyo');return;}}else{MS.mode=g;MS.scr='setup';if(g!=='free'&&MS.dev==='local2')MS.dev='local';}menuRender();}));
  card.querySelectorAll('details.mfold').forEach(d=>d.addEventListener('toggle',()=>{CTRL_OPEN=d.open;}));
  card.querySelectorAll('[data-dev]').forEach(b=>b.addEventListener('click',()=>{MS.dev=b.dataset.dev;menuRender();}));
  card.querySelectorAll('[data-back]').forEach(b=>b.addEventListener('click',()=>{MS.scr=MS.scr==='map'?'setup':'home';menuRender();}));
  card.querySelectorAll('[data-start]').forEach(b=>b.addEventListener('click',()=>{const fr=MS.mode==='free';
    if(MS.dev==='pad'){padKind=fr?'freepad1':MS.mode==='one'?'pad1':'pad';showLobby();}else startGame(fr?(MS.dev==='local2'?'free2':'free1'):MS.mode);}));
  card.querySelectorAll('[data-diff]').forEach(b=>b.addEventListener('click',()=>{diff=b.dataset.diff;try{localStorage.setItem('tk-diff',diff);}catch(e){}
    card.querySelectorAll('[data-diff]').forEach(x=>x.classList.toggle('on',x.dataset.diff===diff));}));
  card.querySelectorAll('[data-vol]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();const p=b.nextElementSibling;p.hidden=!p.hidden;b.setAttribute('aria-expanded',!p.hidden);}));
  card.querySelectorAll('.vpop').forEach(p=>{['pointerdown','click'].forEach(ev=>p.addEventListener(ev,e=>e.stopPropagation()));});
  card.querySelectorAll('[data-v]').forEach(inp=>{inp.addEventListener('input',()=>{audio();const k=inp.dataset.v;setVol(k,inp.value/100);inp.nextElementSibling.textContent=inp.value+' %';
      if(k==='mu'&&inMenu()&&MUSIC.on)musicStart();});
    inp.addEventListener('keydown',e=>e.stopPropagation());});
  card.querySelectorAll('[data-sound]').forEach(b=>b.addEventListener('click',()=>{audio();setSound(!soundOn);b.classList.toggle('on',soundOn);b.setAttribute('aria-pressed',soundOn);}));
  card.querySelectorAll('[data-music]').forEach(b=>b.addEventListener('click',()=>{MUSIC.on=!MUSIC.on;try{localStorage.setItem('tk-music',MUSIC.on?'1':'0');}catch(e){}
    audio();if(MUSIC.on)musicStart();else musicStop();b.classList.toggle('on',MUSIC.on);b.setAttribute('aria-pressed',MUSIC.on);}));
  card.querySelectorAll('[data-mnext]').forEach(b=>b.addEventListener('click',()=>{audio();if(!MUSIC.on){MUSIC.on=true;try{localStorage.setItem('tk-music','1');}catch(e){}card.querySelectorAll('[data-music]').forEach(x=>{x.classList.add('on');x.setAttribute('aria-pressed',true);});musicNext();musicStart();}else musicNext();
    const sp=b.querySelector('span');if(sp)sp.textContent=curSong().name;}));
  card.querySelectorAll('[data-line]').forEach(b=>b.addEventListener('click',()=>{SHOWLINE=!SHOWLINE;try{localStorage.setItem('tk-line',SHOWLINE?'1':'0');}catch(e){}
    b.classList.toggle('on',SHOWLINE);b.setAttribute('aria-pressed',SHOWLINE);}));
  const m=card.querySelector('[data-menu]');if(m)m.addEventListener('click',showMenu);
  const rs=card.querySelector('[data-resume]');if(rs)rs.addEventListener('click',resumeGame);
  const rp=card.querySelector('[data-respawn]');if(rp)rp.addEventListener('click',()=>{G.humans.forEach(i=>respawn(G.r[i]));resumeGame();});
}
function standings(){
  return [...G.r].sort((a,b)=>{if(a.finished&&b.finished)return a.place-b.place;if(a.finished)return -1;if(b.finished)return 1;return b.prog-a.prog;});
}
function finish(){
  G.mode='over';const st=standings();
  try{if(!G.demo){let bank=bankGet();G.r.forEach(r=>{if(!r.ai){bank+=r.coinsTot;if(r.best){const b=bestGet(TRK.id);if(!b||r.best<b)localStorage.setItem('tk-best-'+TRK.id,r.best.toFixed(2));}}});localStorage.setItem('tk-bank',String(bank));}}catch(e){}
  st.forEach((r,n)=>{if(!r.finished)r.place=n+1;});
  let title;const w=st[0];
  if(G.two)title=`Vyhrává <span style="color:${w.color}">${w.name.toLowerCase()}</span>`;
  else title=w.i===0?'Vítězství<span>!</span>':'Druhé místo';
  const sub=G.two?(st[1].finished?'Rozdíl v cíli '+(st[1].finishT-st[0].finishT).toFixed(2)+' s':'Druhý jezdec nedojel do časového limitu')
    :w.i===0?(st[1].finished?'Soupeř dojel o '+(st[1].finishT-st[0].finishT).toFixed(2)+' s později':'Soupeř byl ještě na trati'):'Soupeř byl v cíli o '+(G.r[0].finishT-G.r[1].finishT).toFixed(2)+' s dřív';
  const rows=st.map((r,n)=>`<strong>${n+1}.</strong><span class="who" style="color:${r.color}">${r.name}</span><strong>${r.finished?fmt(r.finishT):'nedojel'}</strong><strong>${fmt(r.best)}</strong><strong>${r.coinsTot}</strong>`).join('');
  setTimeout(()=>{
    if(appScr!=='game'||G.mode!=='over')return;
    card.className='card';ov.classList.remove('menuov');
    card.innerHTML=`<h1>${title}</h1><p>${sub}</p>
      <div class="res"><span class="h"></span><span class="h"></span><span class="h">ČAS</span><span class="h">NEJ KOLO</span><span class="h">PENÍZKY</span>${rows}</div>
      <div class="row"><button class="go" data-mode="${lastMode}">ODVETA</button><button class="go ghost" data-menu>MENU</button></div>
      ${G.remote?'<p class="hint">Odvetu jde spustit i z mobilu.</p>':''}`;
    bindButtons();ov.hidden=false;
  },400);
}

