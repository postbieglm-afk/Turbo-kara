/* Turbo Kára · menu.js: menu */
'use strict';
/* ---------- menu ---------- */
// menu: domů (SOLO / MULTIPLAYER + tipy) -> zařízení a ovládání -> mapa -> start
const MS={scr:'home',mode:'one',dev:'local'};
const SV=(p,x)=>`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}${x?'<path class="x" d="M3 3l18 18"/>':''}</svg>`;
const IC={
  sound:SV('<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',1),
  line:SV('<path d="M4 20c3-7 6-3 8-9s5-6 8-7"/><path d="M15 4h5v5"/>',1),
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
function bankGet(){try{return +localStorage.getItem('tk-bank')||0;}catch(e){return 0;}}
function bestGet(id){try{const v=+localStorage.getItem('tk-best-'+id);return v>0?v:null;}catch(e){return null;}}
const toggles=()=>`<button class="itog${soundOn?' on':''}" data-sound aria-label="Zvuk" aria-pressed="${soundOn}" title="Zvuk">${IC.sound}</button><button class="itog${SHOWLINE?' on':''}" data-line aria-label="Ideální stopa" aria-pressed="${SHOWLINE}" title="Ideální stopa">${IC.line}</button>`;
const topBar=back=>`<div class="mtop">${back?`<button class="mback" data-back aria-label="Zpět">${IC.back}</button><div class="mlogo">TURBO <b>KÁRA</b></div>`:''}
  <div class="mstats"><span class="mstat" title="Penízky ze všech závodů"><i class="mcoin"></i>${bankGet().toLocaleString('cs-CZ')}</span></div><div class="mtoggles">${toggles()}</div></div>`;
function controlsHTML(){
  const solo=MS.mode==='one'||(MS.mode==='free'&&MS.dev!=='local2'),k=s=>`<span class="kbd">${s}</span>`;
  if(MS.dev==='pad')return `<ol class="msteps"><li>Na velké obrazovce (notebook, iPad, televize) nech hru otevřenou a dej <b>${solo?'PŘIPOJIT OVLADAČ':'PŘIPOJIT OVLADAČE'}</b>.</li>
    <li>Na ${solo?'mobilu':'každém mobilu'} otevři stejný odkaz a ťukni na <b>TENTO TELEFON JE OVLADAČ</b>.${solo?'':' Kamarád musí mít hru nasdílenou na svůj e-mail.'}</li>
    <li>Mobil drž na šířku jako volant: vlevo <b>L</b> a <b>P</b> zatáčí, vpravo <b>PŘEDMĚT</b>, <b>DRIFT</b> a <b>POHLED</b>. Plyn jede sám.</li></ol>`;
  if(solo)return `<div class="keys pc-only"><b>${k('↑')}</b><span>plyn</span><b>${k('←')} ${k('→')}</b><span>zatáčení (jde i WASD)</span><b>${k('↓')}</b><span>se zatáčením drift, bez něj brzda a couvání</span><b>${k('mezerník')}</b><span>použít předmět</span><b>${k('C')}</b><span>kokpit, nebo kamera za autem</span><b>${k('Esc')}</b><span>pauza</span></div>
    <div class="keys touch-only"><b>Vlevo</b><span>šipky na zatáčení</span><b>Vpravo</b><span>PŘEDMĚT a DRIFT (se zatáčením)</span><b>Plyn</b><span>jede sám</span><b>Pohled</b><span>tlačítko pod mapou</span></div>`;
  return `<div class="keys pc-only"><b class="p1">HRÁČ 1</b><span>${k('W')} plyn, ${k('A')} ${k('D')} zatáčení, ${k('S')} drift, ${k('F')} předmět</span><b class="p2">HRÁČ 2</b><span>${k('↑')} plyn, ${k('←')} ${k('→')} zatáčení, ${k('↓')} drift, ${k('Enter')} předmět</span><b>${k('C')}</b><span>pohled pro oba</span></div>
    <div class="keys touch-only"><b>Tablet</b><span>na šířku, hráč 1 nahoře, hráč 2 dole</span><b>Ve své půlce</b><span>vlevo zatáčení, vpravo PŘEDMĚT a DRIFT</span></div>`;
}
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
  <div class="mhero"><h1 class="mtitle">TURBO <span>KÁRA</span></h1><p class="msub">Pouliční závody na tři kola. Driftuj, sbírej penízky a předjeď soupeře v Tokiu i v Brně.</p></div>
  <div class="mtiles">
    <button class="mtile" data-go="one"><span class="mt-k">1 HRÁČ</span><b>SOLO</b><span class="mt-d">Závod proti AI</span>${IC.solo}</button>
    <button class="mtile alt" data-go="two"><span class="mt-k">2 HRÁČI</span><b>MULTIPLAYER</b><span class="mt-d">Jeden počítač, nebo mobily jako volanty</span>${IC.multi}</button>
    <button class="mtile free" data-go="free"><span class="mt-k">TRÉNINK</span><b>VOLNÁ JÍZDA</b><span class="mt-d">Spousta uliček bez soupeře a bez kol. Vyzkoušej drift, skoky a předměty.</span>${IC.free}</button>
  </div>
  <section class="msect" aria-label="Tipy"><h3>TIPY</h3><div class="mtips">${TIPS.map(([ic,t,d])=>`<div class="mtip">${IC[ic]}<b>${t}</b><span>${d}</span></div>`).join('')}</div></section>
  <div class="mfoot"><button class="mlink" data-screen="ctrl">${IC.phone}TENTO TELEFON JE OVLADAČ</button></div>`;
  if(MS.scr==='setup'&&free)return `${topBar(true)}
  <div class="mhead"><span class="mk">TRÉNINK</span><h2>VOLNÁ JÍZDA</h2></div>
  <p class="mblurb">Město plné uliček bez soupeře a bez kol. Po ulicích jsou rozmístěné skokánky, zrychlovací pásy, otazníky s předměty, penízky, slalomy z kuželů, zábrany a louže oleje. Když se potkáš s něčím novým, objeví se krátká rada.</p>
  <div class="mopts three" role="radiogroup" aria-label="Kdo jede">${FREEDEV.map(([k,b,t])=>`<button class="mopt${MS.dev===k?' on':''}" role="radio" aria-checked="${MS.dev===k}" data-dev="${k}"><b>${b}</b><span>${t}</span></button>`).join('')}</div>
  <section class="mctrl"><h3>OVLÁDÁNÍ</h3>${controlsHTML()}${MS.dev==='pad'?'':`<div class="keys pc-only" style="margin-top:8px"><b><span class="kbd">R</span></b><span>vrátit auto na silnici</span></div>`}</section>
  <div class="mact"><button class="mbtn" data-go="map">VYBRAT MAPU ${IC.next}</button>${MS.dev==='pad'?`<button class="mlink" data-screen="ctrl">${IC.phone}TENTO TELEFON JE OVLADAČ</button>`:''}</div>`;
  if(MS.scr==='setup'){const chips=Object.keys(DIFFS).map(k=>`<button class="chip${k===diff?' on':''}" data-diff="${k}">${DIFFS[k].n.toUpperCase()}</button>`).join('');
    return `${topBar(true)}
  <div class="mhead"><span class="mk">${solo?'1 HRÁČ':'2 HRÁČI'}</span><h2>${solo?'SOLO':'MULTIPLAYER'}</h2></div>
  <div class="mopts" role="radiogroup" aria-label="Kde se hraje">
    <button class="mopt${MS.dev==='local'?' on':''}" role="radio" aria-checked="${MS.dev==='local'}" data-dev="local"><b>${solo?'NA TOMTO ZAŘÍZENÍ':'JEDEN POČÍTAČ'}</b><span>${solo?'Klávesnice, nebo dotyk na telefonu a tabletu':'Oba u jedné klávesnice, nebo každý na své půlce tabletu'}</span></button>
    <button class="mopt${MS.dev==='pad'?' on':''}" role="radio" aria-checked="${MS.dev==='pad'}" data-dev="pad"><b>${solo?'MOBIL JAKO VOLANT':'MOBILY JAKO VOLANTY'}</b><span>Hra běží na velké obrazovce, ${solo?'mobil řídí':'každý řídí svým mobilem'}</span></button>
  </div>
  <section class="mctrl"><h3>OVLÁDÁNÍ</h3>${controlsHTML()}</section>
  ${solo?`<div class="mrow"><span class="mlab">SOUPEŘ</span><div class="chips" role="group" aria-label="Obtížnost soupeře">${chips}</div></div>`:''}
  <div class="mact"><button class="mbtn" data-go="map">VYBRAT MAPU ${IC.next}</button>${MS.dev==='pad'?`<button class="mlink" data-screen="ctrl">${IC.phone}TENTO TELEFON JE OVLADAČ</button>`:''}</div>`;}
  // výběr mapy
  const km=id=>(previewTrack(id).L/10000).toFixed(1).replace('.',',');
  return `${topBar(true)}
  <div class="mhead"><span class="mk">${modeName()} · ${devName()}</span><h2>VYBER MAPU</h2></div>
  <div class="mmaps" role="radiogroup" aria-label="Mapa">
    ${Object.values(TRACKS).map(m=>{const b=bestGet(m.id);return `<button class="mmap${m.id===TRK.id?' on':''}" role="radio" aria-checked="${m.id===TRK.id}" data-map="${m.id}"><span class="mm-art ${m.id}">${free?freeSVG(m.id):trackSVG(m.id)}</span><span class="mm-txt"><b>${m.name}</b><span>${m.sub}</span><span class="mm-meta">${free?'okruh a '+(freeSVG(m.id).match(/polyline/g)||[]).length+' uliček':km(m.id)+' km · '+LAPS+' kola'+(b?' · nej kolo '+fmt(b):'')}</span></span></button>`;}).join('')}
    <div class="mmap soon" aria-disabled="true"><span class="mm-art"><span class="lock">?</span></span><span class="mm-txt"><b>MAPA 3</b><span>Již brzy</span></span></div>
  </div>
  <p class="mblurb">${free?'Závodní okruh je zvýrazněný, ostatní čáry jsou uličky pro trénink. Start je na startovní čáře okruhu.':TRK.blurb}</p>
  <div class="mact"><button class="mbtn" data-start>${MS.dev==='pad'?(solo?'PŘIPOJIT OVLADAČ':'PŘIPOJIT OVLADAČE'):free?'VYJET':'START'} ${IC.next}</button></div>`;
}
function menuRender(){card.className='card menu';ov.classList.add('menuov');card.innerHTML=menuHTML();bindButtons();ov.scrollTop=0;}
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
  engineStop();ensureTrack(false);MS.scr='home';menuRender();ov.hidden=false;G=newGame('demo');
}
function bindButtons(){
  card.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>startGame(b.dataset.mode)));
  card.querySelectorAll('[data-screen]').forEach(b=>b.addEventListener('click',()=>{const s=b.dataset.screen;if(s==='ctrl')showCtrl();else{if(s==='pad1')padKind='pad1';showLobby();}}));
  card.querySelectorAll('[data-lk]').forEach(b=>b.addEventListener('click',()=>{padKind=b.dataset.lk;showLobby();}));
  card.querySelectorAll('[data-map]').forEach(b=>b.addEventListener('click',()=>selectTrack(b.dataset.map)));
  card.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>{audio();const g=b.dataset.go;if(g==='map')MS.scr='map';else{MS.mode=g;MS.scr='setup';if(g!=='free'&&MS.dev==='local2')MS.dev='local';}menuRender();}));
  card.querySelectorAll('[data-dev]').forEach(b=>b.addEventListener('click',()=>{MS.dev=b.dataset.dev;menuRender();}));
  card.querySelectorAll('[data-back]').forEach(b=>b.addEventListener('click',()=>{MS.scr=MS.scr==='map'?'setup':'home';menuRender();}));
  card.querySelectorAll('[data-start]').forEach(b=>b.addEventListener('click',()=>{const fr=MS.mode==='free';
    if(MS.dev==='pad'){padKind=fr?'freepad1':MS.mode==='one'?'pad1':'pad';showLobby();}else startGame(fr?(MS.dev==='local2'?'free2':'free1'):MS.mode);}));
  card.querySelectorAll('[data-diff]').forEach(b=>b.addEventListener('click',()=>{diff=b.dataset.diff;try{localStorage.setItem('tk-diff',diff);}catch(e){}
    card.querySelectorAll('[data-diff]').forEach(x=>x.classList.toggle('on',x.dataset.diff===diff));}));
  card.querySelectorAll('[data-sound]').forEach(b=>b.addEventListener('click',()=>{audio();setSound(!soundOn);b.classList.toggle('on',soundOn);b.setAttribute('aria-pressed',soundOn);}));
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

