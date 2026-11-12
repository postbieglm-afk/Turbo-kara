/* Turbo Kára · menu-maps.js: mapy v menu: pozadí výběru mapy mapBgSVG()/mapAmb(), náhledy tratí trackSVG() a volné jízdy freeSVG(). Načítá se před menu.js. */
'use strict';
const freeSvg={};
function freeSVG(id){if(freeSvg[id])return freeSvg[id];const N0=genNet(TRACKS[id]),w=N0.maxX-N0.minX,h=N0.maxY-N0.minY,sc=86/Math.max(w,h),ox=(100-w*sc)/2,oy=(100-h*sc)/2;
  const pl=N0.polys.map(p=>{const pts=[];for(let q=0;q<p.n;q+=6){const i=p.o+q;pts.push((ox+(N0.x[i]-N0.minX)*sc).toFixed(1)+','+(oy+(N0.y[i]-N0.minY)*sc).toFixed(1));}
    return p.closed?`<polygon points="${pts.join(' ')}" fill="none" stroke="#3fd8ff" stroke-width="2.6" stroke-linejoin="round"/>`:`<polyline points="${pts.join(' ')}" fill="none" stroke="#f2f0e3" stroke-width="1.8" stroke-linecap="round" opacity=".7"/>`;});
  return freeSvg[id]=`<svg viewBox="0 0 100 100" aria-hidden="true">${pl.join('')}</svg>`;}
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
const trackSvgCache={};
function trackSVG(id){
  if(trackSvgCache[id])return trackSvgCache[id];
  const T=previewTrack(id),N=T.N;
  const w=T.maxX-T.minX,h=T.maxY-T.minY,sc=86/Math.max(w,h),ox=(100-w*sc)/2,oy=(100-h*sc)/2,pts=[];
  for(let i=0;i<N;i+=6)pts.push((ox+(T.x[i]-T.minX)*sc).toFixed(1)+','+(oy+(T.y[i]-T.minY)*sc).toFixed(1));
  const sx=ox+(T.x[0]-T.minX)*sc,sy=oy+(T.y[0]-T.minY)*sc;
  return trackSvgCache[id]=`<svg viewBox="0 0 100 100" aria-hidden="true"><polygon points="${pts.join(' ')}" fill="none" stroke="#f2f0e3" stroke-width="3.2" stroke-linejoin="round"/><line x1="${sx-5}" y1="${sy}" x2="${sx+5}" y2="${sy}" stroke="#e5483b" stroke-width="3"/></svg>`;
}
