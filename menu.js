/* Turbo Kára · menu.js: menu: stav MS, menuHTML() (domů / zařízení / mapa), menuRender(), bindButtons() (všechna tlačítka data-*), selectTrack(), showMenu(), finish() (konec závodu), karta Autoři. Obrázky jsou v menu-art.js, mapy v menu-maps.js. */
'use strict';
/* ---------- menu ---------- */
// menu: domů (SOLO / MULTIPLAYER + tipy) -> zařízení a ovládání -> mapa -> start
const MS={scr:'home',mode:'one',dev:'local'};
const SV=(p,x)=>`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}${x?'<path class="x" d="M3 3l18 18"/>':''}</svg>`;
const IC={
  info:SV('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>'),
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
// karta autorů: vývojáři a hudba (s uvedením autorů, jak chce licence Uppbeat)
function creditsHTML(){const mus=SONGS.filter(s=>s.url);
  return `<div class="mcr-bg" data-crclose></div><div class="mcr" role="dialog" aria-modal="true" aria-label="Autoři"><button class="mcr-x" data-crclose aria-label="Zavřít">×</button>
    <p class="mk">TURBO KÁRA</p><h2>AUTOŘI</h2>
    <div class="mcr-s"><span>VÝVOJÁŘI</span><b>Martin Postbiegl</b><b>Martin Link</b></div>
    ${mus.length?`<div class="mcr-s"><span>HUDBA</span><em>Music from #Uppbeat (free for Creators!)</em>${mus.map(s=>`<a href="${s.url}" target="_blank" rel="noopener"><b>${s.name}</b> · ${s.by}</a>`).join('')}</div>`:''}</div>`;}
function openCredits(){let w=document.getElementById('mcredits');if(!w){w=document.createElement('div');w.id='mcredits';ov.appendChild(w);}
  w.innerHTML=creditsHTML();w.hidden=false;w.querySelectorAll('[data-crclose]').forEach(e=>e.addEventListener('click',closeCredits));const x=w.querySelector('.mcr-x');if(x)x.focus();}
function closeCredits(){const w=document.getElementById('mcredits');if(w)w.hidden=true;}
addEventListener('keydown',e=>{if(e.code==='Escape'){const w=document.getElementById('mcredits');if(w&&!w.hidden){closeCredits();e.stopPropagation();}}},true);
let CTRL_OPEN=false;
function controlsHTML(){
  const solo=MS.mode==='one'||(MS.mode==='free'&&MS.dev!=='local2'),free=MS.mode==='free';
  if(MS.dev==='pad')return `<ol class="msteps"><li>Na velké obrazovce (notebook, iPad, televize) nech hru otevřenou a dej <b>${solo?'PŘIPOJIT OVLADAČ':'PŘIPOJIT OVLADAČE'}</b>.</li>
    <li>Na ${solo?'mobilu':'každém mobilu'} otevři stejný odkaz a ťukni na <b>TENTO TELEFON JE OVLADAČ</b>.${solo?'':' Kamarád musí mít hru nasdílenou na svůj e-mail.'}</li>
    <li>Mobil drž na šířku jako volant:</li></ol><div class="cviz">${cfig('t','OBRAZOVKA OVLADAČE',padSVG())}</div>`;
  if(solo)return `<div class="cviz">${cfig('k','NA POČÍTAČI',kbSolo(free))}${cfig('t','NA MOBILU A TABLETU',phoneSVG())}</div>`;
  return `<div class="cviz">${cfig('k','NA JEDNÉ KLÁVESNICI',kbDuo(free))}${cfig('t','NA TABLETU',tabletSVG())}</div>`;
}
const FREEDEV=[['local','SÁM','Klávesnice, nebo dotyk na telefonu a tabletu'],['local2','VE DVOU','Oba u jedné klávesnice, nebo každý na své půlce tabletu'],['pad','MOBIL JAKO VOLANT','Hra běží na velké obrazovce, mobil řídí']];
const modeName=()=>MS.mode==='free'?'VOLNÁ JÍZDA':MS.mode==='one'?'SOLO':'MULTIPLAYER';
const devName=()=>MS.mode==='free'?FREEDEV.find(d=>d[0]===MS.dev)[1]:MS.dev==='pad'?(MS.mode==='one'?'MOBIL JAKO VOLANT':'MOBILY JAKO VOLANTY'):(MS.mode==='one'?'NA TOMTO ZAŘÍZENÍ':'JEDEN POČÍTAČ');
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
  <div class="mfoot"><button class="mlink" data-screen="ctrl">${IC.phone}TENTO TELEFON JE OVLADAČ</button><button class="mlink" data-credits aria-haspopup="dialog">${IC.info}AUTOŘI</button></div>`;
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
function menuRender(){mapAmb();card.className='card menu';ov.classList.add('menuov');card.innerHTML=menuHTML();bindButtons();ov.scrollTop=0;}
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
  engineStop();fxMute(false);ensureTrack(false);MS.scr='home';MUSIC.f=1;MUSIC.over='_';menuRender();ov.hidden=false;G=newGame('demo');if(AC&&!MUSIC.playing)musicStart();
}
addEventListener('click',()=>{document.querySelectorAll('.vpop:not([hidden])').forEach(p=>{p.hidden=true;const b=p.previousElementSibling;if(b)b.setAttribute('aria-expanded','false');});});
function bindButtons(){
  card.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>startGame(b.dataset.mode)));
  card.querySelectorAll('[data-screen]').forEach(b=>b.addEventListener('click',()=>{const s=b.dataset.screen;if(s==='ctrl')showCtrl();else{if(s==='pad1')padKind='pad1';showLobby();}}));
  card.querySelectorAll('[data-lk]').forEach(b=>b.addEventListener('click',()=>{padKind=b.dataset.lk;showLobby();}));
  card.querySelectorAll('[data-map]').forEach(b=>b.addEventListener('click',()=>selectTrack(b.dataset.map)));
  card.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>{audio();const g=b.dataset.go;if(g==='map'){MS.scr='map';if(MS.mode==='free'&&TRK.id!=='tokyo'){selectTrack('tokyo');return;}}else{MS.mode=g;MS.scr='setup';if(g!=='free'&&MS.dev==='local2')MS.dev='local';}menuRender();}));
  card.querySelectorAll('[data-credits]').forEach(b=>b.addEventListener('click',openCredits));
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
  G.mode='over';if(!FXMUTE&&!G.free){fxMute(true);const best=Math.min(...G.humans.map(i=>G.r[i].place||99));musicPlay(best===1?'win':'fin',1);}const st=standings();
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
