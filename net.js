/* Turbo Kára · net.js: propojení přes místnost a mobil jako ovladač */
'use strict';
/* ---------- propojení přes místnost (obrazovka + mobily jako ovladače) ---------- */
let room=null,padT=0,padKind='pad'; // 'pad' = dva hráči na mobilech, 'pad1' = jeden hráč na mobilu proti AI
const soloKind=k=>k==='pad1'||k==='freepad1';
const soloNow=()=>appScr==='lobby'?soloKind(padKind):!!G.solo;
const remote=[null,null],seen=new Map(),pongs=[null,null];
function applyActs(peer,p,it,rq,pz,vw){
  const prev=seen.get(peer);
  if(!prev){seen.set(peer,{it:it||0,rq:rq||0,pz:pz||0,vw:vw||0});return;}
  if(vw!==undefined&&vw>(prev.vw||0)&&R3)toggleView(p);
  if(it!==undefined&&it>prev.it&&appScr==='game'&&G.remote&&G.mode==='race'&&!G.paused)G.r[p].want=true;
  if(rq!==undefined&&rq>prev.rq&&(appScr==='lobby'||(appScr==='game'&&G.remote&&(G.mode==='over'||G.paused))))setTimeout(()=>startGame(appScr==='lobby'?padKind:G.kind),0);
  if(pz!==undefined&&pz>prev.pz&&appScr==='game'&&G.remote)setTimeout(togglePause,0);
  seen.set(peer,{it:it===undefined?prev.it:Math.max(prev.it,it),rq:rq===undefined?prev.rq:Math.max(prev.rq,rq),pz:pz===undefined?prev.pz:Math.max(prev.pz,pz),vw:vw===undefined?(prev.vw||0):Math.max(prev.vw||0,vw)});
}
function wireRoom(r){
  r.onPeers(onPeersChange,()=>{room=null;refreshNet();});
  r.on('act',m=>{
    if(m.sameTab||appScr==='ctrl')return;const d=m.data||{};let p=d.p===0?0:d.p===1?1:-1;if(p<0)return;if(soloNow())p=0;
    applyActs(m.peer,p,d.it===undefined?undefined:+d.it||0,undefined,d.pz===undefined?undefined:+d.pz||0,d.vw===undefined?undefined:+d.vw||0);
  });
  r.on('ping',m=>{if(m.sameTab||appScr==='ctrl')return;const d=m.data||{};r.emit('pong',{p:d.p,n:d.n}).catch(()=>{});});
  r.on('pong',m=>{if(appScr!=='ctrl')return;const d=m.data||{};if(d.p===CT.p)gotPong(+d.n);});
}
const ctrlEl=document.getElementById('ctrl');
const CT={p:-1,s:0,b:false,it:0,rq:0,pz:0,vw:0,mc:0,mi:-1,ml:'',lastHit:-1,lastCr:-1,lastOil:-1,lastLd:-1,lastDl:-1,lastMt:-1,off:false,pzm:''};
// vibrace: Android přes navigator.vibrate; iPhone (iOS 18+) ho nemá, tam pomůže ťuknutí přes skrytý přepínač
const VIB_OFF=[45,25,45],VIB_OIL=[140,40,140,40,220],VIB_HIT=[90,50,90,50,160];
const canVibrate=typeof navigator!=='undefined'&&typeof navigator.vibrate==='function';
const hapEl=(()=>{if(canVibrate)return null;try{const l=document.createElement('label'),i=document.createElement('input');i.type='checkbox';i.setAttribute('switch','');
  l.setAttribute('aria-hidden','true');l.style.cssText='position:fixed;left:-200px;top:0;width:1px;height:1px;opacity:0;pointer-events:none';l.appendChild(i);document.body.appendChild(l);return l;}catch(e){return null;}})();
function buzz(p){
  try{if(canVibrate){navigator.vibrate(p);return;}}catch(e){}
  if(!hapEl)return;const n=Array.isArray(p)?Math.ceil(p.length/2):1;
  for(let k=0;k<n;k++)setTimeout(()=>{try{hapEl.click();}catch(e){}},k*(Array.isArray(p)?(p[0]+(p[1]||0)):0));
}
setInterval(()=>{const on=appScr==='ctrl'&&CT.off;ctrlEl.classList.toggle('rumble',on);if(on)buzz(VIB_OFF);},220);
const roomReady=(()=>{
  try{
    if(!window.claude||typeof claude.use!=='function')return Promise.resolve(null);
    return claude.use('room').then(r=>{room=r||null;if(room)wireRoom(room);refreshNet();return room;}).catch(()=>{refreshNet();return null;});
  }catch(e){return Promise.resolve(null);}
})();
function onPeersChange(ch){if(appScr==='ctrl')ctrlPeers(ch.peers);else padPeers(ch.peers);}
function padPeers(peers){
  const now=[null,null],solo=soloNow();
  netCtrl=peers.some(pe=>!pe.sameTab&&pe.presence&&pe.presence.role==='ctrl');
  for(const pe of peers){
    const pr=pe.presence||{};if(pr.role!=='ctrl'||pe.sameTab)continue;
    applyMenu(pe.peer,pr);
    const p=pr.p===0||pr.p===1?(solo?0:pr.p):-1;if(p<0||now[p])continue;now[p]=pe;
    applyActs(pe.peer,p,+pr.it||0,+pr.rq||0,+pr.pz||0,+pr.vw||0);
    if(pr.ping!==undefined&&pongs[p]!==pr.ping){pongs[p]=pr.ping;room.presence({pong:[pongs[0],pongs[1]]}).catch(()=>{});}
  }
  for(let p=0;p<2;p++){const pe=now[p],pr=pe?pe.presence:null;remote[p]=pe?{s:clamp(Math.round(+pr.s||0),-1,1),b:!!pr.b}:null;}
  if(appScr==='lobby')renderLobby();
}
function padBroadcast(now){
  if(!room||now-padT<120)return;
  const live=appScr==='lobby'||(appScr==='game'&&G.remote);
  if(!live&&!(netCtrl&&(appScr==='menu'||appScr==='game')))return;
  padT=now;const st=appScr==='game'?standings():G.r;
  room.presence({role:'pad',solo:soloNow()?1:0,m:appScr==='lobby'?'lobby':appScr==='menu'?'menu':!G.remote?'local':G.paused?'pause':G.mode,mn:menuSnap(),
    pos:G.r.map(r=>st.indexOf(r)+1),lap:G.r.map(r=>Math.min(LAPS,r.lapsDone+1)),laps:LAPS,
    it:G.r.map(r=>r.rollT>0?-1:r.item),co:G.r.map(r=>r.coins),hit:G.r.map(r=>r.hitN),fin:G.r.map(r=>r.finished?1:0),off:G.r.map(r=>r.off&&Math.abs(r.vf)>40&&G.mode==='race'?1:0),cr:G.r.map(r=>r.crashN),oil:G.r.map(r=>r.oilN),ld:G.r.map(r=>r.landN),dl:G.r.map(r=>r.dlN),mt:G.r.map(r=>r.mtN),dr:G.r.map(r=>r.drift?r.driftL+1:0)}).catch(()=>{});
}
function showLobby(){
  appScr='lobby';audio();musicStart();G=newGame('demo');
  const solo=soloKind(padKind);
  const dch=Object.keys(DIFFS).map(k=>`<button class="chip emo${k===diff?' on':''}" data-diff="${k}" title="${DIFFS[k].n}" aria-label="Obtížnost: ${DIFFS[k].n}">${DIFF_EMO[k]}</button>`).join('');
  card.className='card';ov.classList.remove('menuov');
  card.innerHTML=`<h1>${padKind==='freepad1'?'Volná jízda':solo?'Solo':'Multiplayer'} <span>${TRK.name}</span></h1>
    <p>${solo?'Na mobilu otevři tenhle odkaz a ťukni na OVLADAČ.':'Na obou mobilech otevřete tenhle odkaz, ťukněte na OVLADAČ a vyberte hráče.'} Kamarádovi hru nejdřív nasdílej přes menu Sdílet na jeho e-mail.</p>
    <div class="slots"><div class="slot" id="l0"><b style="color:var(--p1)">${solo?'TY':'HRÁČ 1'}</b><span>Čekám na ovladač</span></div>
    ${solo?'':'<div class="slot" id="l1"><b style="color:var(--p2)">HRÁČ 2</b><span>Čekám na ovladač</span></div>'}</div>
    ${padKind==='pad1'?`<div class="chips" role="group" aria-label="Obtížnost soupeře">${dch}</div>`:''}
    <p class="tip" id="lmsg"></p>
    <div class="row"><button class="go two" data-mode="${padKind}" id="lstart">START</button><button class="go ghost" data-menu>MENU</button></div>`;
  bindButtons();ov.hidden=false;renderLobby();
  if(room&&typeof room.peers==='function')padPeers(room.peers());
}
function renderLobby(){
  for(let p=0;p<2;p++){const el=document.getElementById('l'+p);if(!el)continue;
    el.classList.toggle('on',!!remote[p]);const sp=el.querySelector('span');if(sp)sp.textContent=remote[p]?'Ovladač připojen':'Čekám na ovladač';}
  const m=document.getElementById('lmsg'),b=document.getElementById('lstart');if(!m)return;
  if(!room)m.textContent=soloKind(padKind)?'Propojení teď není k dispozici. Hrát jde jen na klávesnici: šipky nebo WASD, předmět mezerník.':'Propojení teď není k dispozici. Hrát jde jen na klávesnici: hráč 1 WASD a F, hráč 2 šipky a Enter.';
  else if(soloKind(padKind))m.textContent=remote[0]?'Ovladač je připojený. Start můžeš dát tady, nebo z mobilu.':'Start jde i bez ovladače. Řídit pak jde na klávesnici.';
  else m.textContent=remote[0]&&remote[1]?'Oba ovladače jsou připojené. Start můžeš dát tady, nebo z mobilu.':'Start jde i bez ovladačů. Hráč bez mobilu pak řídí na klávesnici.';
  const ready=soloKind(padKind)?!!remote[0]:!!(remote[0]&&remote[1]);
  if(b)b.textContent=ready?'START':'START I TAK';
}
function refreshNet(){if(appScr==='lobby')renderLobby();if(appScr==='ctrl')ctrlPeers(room&&room.peers?room.peers():[]);}

/* ---------- ovladač na mobilu ---------- */
const byId=id=>document.getElementById(id);
function showCtrl(){
  appScr='ctrl';audio();musicStop();engineStop();ov.hidden=true;document.body.classList.add('ctrlmode');ctrlEl.hidden=false;
  byId('cPick').hidden=CT.p>=0;byId('cPad').hidden=CT.p<0;byId('cBack').hidden=CT.p>=0;
  ctrlPeers(room&&room.peers?room.peers():[]);ctrlSend();
  roomReady.then(()=>{ctrlSend();ctrlPeers(room&&room.peers?room.peers():[]);});
}
function ctrlSend(){if(!room)return;room.presence({role:'ctrl',p:CT.p,s:CT.s,b:CT.b,it:CT.it,rq:CT.rq,pz:CT.pz,vw:CT.vw,mc:CT.mc,mi:CT.mi,ml:CT.ml}).catch(()=>{});}
let canEmit=true,pingN=0,rtt=null;const pingSent=new Map();
function ctrlAct(){
  ctrlSend();buzz(12);
  if(room&&canEmit&&CT.p>=0)room.emit('act',{p:CT.p,it:CT.it,pz:CT.pz,vw:CT.vw}).catch(e=>{if(e&&e.code==='not_permitted'){canEmit=false;showPing();}});
}
function sendPing(){
  if(appScr!=='ctrl'||!room||CT.p<0)return;
  pingN++;const n=pingN;pingSent.set(n,performance.now());
  if(pingSent.size>8)pingSent.delete(pingSent.keys().next().value);
  room.presence({ping:n}).catch(()=>{});
  if(canEmit)room.emit('ping',{p:CT.p,n}).catch(e=>{if(e&&e.code==='not_permitted'){canEmit=false;showPing();}});
}
function gotPong(n){
  const t=pingSent.get(n);if(t===undefined)return;
  for(const k of [...pingSent.keys()])if(k<=n)pingSent.delete(k);
  const v=performance.now()-t;rtt=rtt===null?v:rtt*.6+v*.4;showPing();
}
function showPing(){
  const el=byId('cPing');if(!el)return;const fast=canEmit?'':' · pomalý režim';
  if(rtt===null){el.textContent=room&&CT.p>=0?'Měřím odezvu…'+fast:'';el.className='c-ping';return;}
  const ms=Math.round(rtt);el.textContent='Odezva '+ms+' ms'+fast;el.className='c-ping '+(ms<120?'good':ms<250?'mid':'bad');
}
setInterval(sendPing,1000);
function pickPlayer(p){
  CT.p=p;CT.lastHit=-1;CT.lastCr=-1;CT.lastOil=-1;CT.lastLd=-1;CT.lastDl=-1;CT.lastMt=-1;byId('cBack').hidden=true;rtt=null;pingSent.clear();ctrlEl.classList.toggle('p2',p===1);
  byId('cWho').textContent='HRÁČ '+(p+1);byId('cPick').hidden=true;byId('cPad').hidden=false;ctrlSend();
  ctrlPeers(room&&room.peers?room.peers():[]);
}
function ctrlPeers(peers){
  if(appScr!=='ctrl')return;
  const pad=peers.find(pe=>pe.presence&&pe.presence.role==='pad');
  const taken=new Set(peers.filter(pe=>!pe.sameTab&&pe.presence&&pe.presence.role==='ctrl').map(pe=>pe.presence.p));
  [0,1].forEach(p=>{byId('cp'+p).textContent='HRÁČ '+(p+1)+(taken.has(p)?' (obsazeno)':'');});
  const st=byId('cStatus'),rd=byId('cReady'),pz=byId('cPause'),info=byId('cInfo');
  if(!room||!peers.find(pe=>pe.presence&&pe.presence.role==='pad'))cMn.hidden=true;
  if(!room){st.textContent=(window.claude&&window.claude.webRoom?'Připojuji k obrazovce…':'Propojení není k dispozici. Jsi přihlášený do Claude a máš hru nasdílenou?');rd.hidden=true;pz.disabled=true;CT.off=false;info.textContent='';return;}
  if(!pad){st.textContent='Hledám obrazovku. Na iPadu nebo notebooku otevři hru a zvol Obrazovka.';rd.hidden=true;pz.disabled=true;CT.off=false;info.textContent='';return;}
  const pr=pad.presence,m=pr.m,solo=!!pr.solo;
  // 1 hráč proti AI: ovladač je vždy hráč 1 (volba hráče se přeskočí)
  byId('cp1').hidden=solo;if(solo)byId('cp0').textContent='ŘÍDIT PROTI AI';
  if(solo&&CT.p!==0){pickPlayer(0);return;}
  if(CT.p>=0&&Array.isArray(pr.pong)&&pr.pong[CT.p]!=null)gotPong(+pr.pong[CT.p]);
  rd.hidden=!(m==='lobby'||m==='over'||m==='pause');rd.textContent=m==='over'?'ODVETA':m==='pause'?'RESTART':'START';rd.classList.toggle('hot',m==='lobby'||m==='over');
  pz.disabled=!(m==='race'||m==='count'||m==='pause');
  if(CT.pzm!==(m==='pause')){CT.pzm=m==='pause';pz.innerHTML=CT.pzm?'<span class="play"></span>':'<i></i><i></i>';pz.setAttribute('aria-label',CT.pzm?'Pokračovat':'Pauza');}
  const mir=ctrlMenu(pr,m,solo);
  st.textContent=m==='menu'?'Menu na obrazovce':m==='local'?'Hra běží na obrazovce bez mobilu':m==='lobby'?'Připojeno, čeká se na start':m==='over'?'Konec závodu':m==='pause'?'Pauza':m==='count'?'Odpočet…':'Jedeš!';
  if(CT.p>=0&&Array.isArray(pr.pos)&&m!=='lobby'){
    const p=CT.p;info.textContent=(pr.fin&&pr.fin[p]?'V cíli · ':'')+(pr.pos[p]||'–')+'. místo · kolo '+((pr.lap||[])[p]||1)+'/'+(pr.laps||LAPS)+' · penízky '+((pr.co||[])[p]||0);
    const it=+((pr.it||[])[p]||0),btn=byId('cItem');
    btn.textContent=it===-1?'…':it>0?IT_NAMES[it]||'PŘEDMĚT':'PŘEDMĚT';btn.classList.toggle('has',it>0);
    const hit=+((pr.hit||[])[p]||0);
    const oil=+((pr.oil||[])[p]||0),oilNew=CT.lastOil>=0&&oil>CT.lastOil;
    if((CT.lastHit>=0&&hit>CT.lastHit)||oilNew){ctrlEl.classList.remove('hit');void ctrlEl.offsetWidth;ctrlEl.classList.add('hit');buzz(oilNew?VIB_OIL:VIB_HIT);}
    CT.lastHit=hit;CT.lastOil=oil;
    const cr=+((pr.cr||[])[p]||0),ld=+((pr.ld||[])[p]||0),bump=(CT.lastCr>=0&&cr>CT.lastCr)||(CT.lastLd>=0&&ld>CT.lastLd);
    if(bump&&!ctrlEl.classList.contains('hit')){buzz(ld>CT.lastLd?[60,30,40]:70);ctrlEl.classList.remove('bump');void ctrlEl.offsetWidth;ctrlEl.classList.add('bump');}
    CT.lastCr=cr;CT.lastLd=ld;
    const dl=+((pr.dl||[])[p]||0),mt=+((pr.mt||[])[p]||0),dr=+((pr.dr||[])[p]||0);
    if(CT.lastMt>=0&&mt>CT.lastMt)buzz([40,20,70]);else if(CT.lastDl>=0&&dl>CT.lastDl)buzz(25);CT.lastDl=dl;CT.lastMt=mt;
    const bb=byId('cBrake');bb.style.borderColor=dr>1?DRIFT_C[dr-1]:'';bb.style.color=dr>1?DRIFT_C[dr-1]:'';
    CT.off=m==='race'&&!!((pr.off||[])[p]);ctrlEl.classList.toggle('rumble',CT.off);
  }else{info.textContent='';CT.off=false;}
}
document.querySelectorAll('[data-pick]').forEach(b=>b.addEventListener('click',()=>pickPlayer(+b.dataset.pick)));
byId('cBack').addEventListener('click',showMenu);
byId('cMenu').addEventListener('click',()=>{CT.off=false;showMenu();});
byId('cReady').addEventListener('click',()=>{CT.rq++;ctrlSend();});
byId('cPause').addEventListener('click',()=>{CT.pz++;ctrlAct();});
const cView=byId('cView');
cView.addEventListener('pointerdown',e=>{e.preventDefault();cView.classList.add('on');CT.vw++;ctrlAct();});
['pointerup','pointercancel','pointerleave'].forEach(t=>cView.addEventListener(t,()=>cView.classList.remove('on')));
const cL=byId('cL'),cR=byId('cR'),dirP={l:new Set(),r:new Set()};
function steerUpdate(){
  const l=dirP.l.size>0,r=dirP.r.size>0;cL.classList.toggle('on',l);cR.classList.toggle('on',r);
  const s=(r?1:0)-(l?1:0);if(s!==CT.s){CT.s=s;ctrlSend();}
}
[[cL,'l'],[cR,'r']].forEach(([el,k])=>{
  el.addEventListener('pointerdown',e=>{e.preventDefault();try{el.setPointerCapture(e.pointerId);}catch(x){}dirP[k].add(e.pointerId);steerUpdate();buzz(8);});
  ['pointerup','pointercancel','lostpointercapture'].forEach(t=>el.addEventListener(t,e=>{dirP[k].delete(e.pointerId);steerUpdate();}));
  el.addEventListener('contextmenu',e=>e.preventDefault());
});
const cItem=byId('cItem'),cBrake=byId('cBrake');
cItem.addEventListener('pointerdown',e=>{e.preventDefault();cItem.classList.add('on');CT.it++;ctrlAct();});
cItem.addEventListener('contextmenu',e=>e.preventDefault());cBrake.addEventListener('contextmenu',e=>e.preventDefault());
['pointerup','pointercancel','pointerleave'].forEach(t=>cItem.addEventListener(t,()=>cItem.classList.remove('on')));
cBrake.addEventListener('pointerdown',e=>{e.preventDefault();try{cBrake.setPointerCapture(e.pointerId);}catch(x){}cBrake.classList.add('on');CT.b=true;ctrlSend();buzz(10);});
['pointerup','pointercancel'].forEach(t=>cBrake.addEventListener(t,()=>{cBrake.classList.remove('on');CT.b=false;ctrlSend();}));
document.getElementById('pauseBtn').addEventListener('click',togglePause);
showMenu();

// vibrace při hraní přímo na mobilu (bez mobilu jako ovladače)
let hapT=0;
function localHaptics(now){
  if(!(touchMode&&appScr==='game'&&!G.remote&&!G.paused)){G.r.forEach(r=>{r.hH=r.hitN;r.hC=r.crashN;r.hO=r.oilN;r.hL=r.landN;r.hD=r.dlN;r.hM=r.mtN;});return;}
  for(const r of G.r){if(r.ai)continue;
    if(r.oilN>r.hO)buzz(VIB_OIL);else if(r.hitN>r.hH)buzz(VIB_HIT);else if(r.crashN>r.hC)buzz(70);else if(r.landN>r.hL)buzz([60,30,40]);
    if(r.mtN>r.hM)buzz([40,20,70]);else if(r.dlN>r.hD)buzz(25);
    r.hH=r.hitN;r.hC=r.crashN;r.hO=r.oilN;r.hL=r.landN;r.hD=r.dlN;r.hM=r.mtN;}
  if(now-hapT>220){hapT=now;if(G.mode==='race'&&G.r.some(r=>!r.ai&&!r.finished&&r.off&&Math.abs(r.vf)>40))buzz(VIB_OFF);}
}

/* ---------- menu na mobilu: mobil zrcadlí tlačítka z obrazovky a ťuknutím je mačká ----------
   Obrazovka posílá v presence `mn` (nadpis + seznam tlačítek z otevřeného menu), mobil vrací `mc` (počítadlo ťuknutí),
   `mi` (pořadí tlačítka) a `ml` (jeho popisek). Funguje pro jakékoli menu, není potřeba nic vyjmenovávat. */
let netCtrl=false,mnEls=[],mnLab=[];const menuSeen=new Map();
const MN_SKIP='[data-screen="ctrl"],[data-vol],.vpop,.vpop *,summary,[disabled],[aria-disabled="true"]';
function mnLabel(el){const t=el.getAttribute('title')||el.getAttribute('aria-label')||'';if(t&&(el.matches('.chip,.mback')||el.querySelector('svg')&&!el.querySelector('b')&&el.textContent.trim().length<4))return t.slice(0,40);
  const b=el.querySelector('b');let l=(b?b.textContent:el.textContent).replace(/\s+/g,' ').trim();if(l.length<3&&t)l=t;return l.slice(0,40);}
function menuSnap(){
  mnEls=[];mnLab=[];if(ov.hidden)return null;
  const bt=[];
  card.querySelectorAll('button,summary').forEach(el=>{
    if(el.matches(MN_SKIP)||!el.getClientRects().length)return;
    const l=mnLabel(el);if(!l)return;
    const on=el.classList.contains('on')||el.getAttribute('aria-checked')==='true'||el.getAttribute('aria-pressed')==='true';
    const big=el.matches('.mtile,.mmap,.mbtn,.go,.mopt'),tool=!!el.closest('.mtop')&&!el.matches('[data-back]');
    mnEls.push(el);mnLab.push(l);bt.push([l,(on?1:0)|(big?2:0)|(tool?4:0)]);});
  const mk=card.querySelector('.mk'),h=card.querySelector('h1,h2');
  return {k:mk?mk.textContent.replace(/\s+/g,' ').trim():'',h:h?h.textContent.replace(/\s+/g,' ').trim():'',b:bt};
}
function applyMenu(peer,pr){
  const mc=+pr.mc||0,seen=menuSeen.get(peer);
  if(seen===undefined||mc<=seen){menuSeen.set(peer,Math.max(mc,seen||0));return;}
  menuSeen.set(peer,mc);if(ov.hidden)return;
  menuSnap();let el=mnEls[+pr.mi];
  if(!el||mnLab[+pr.mi]!==pr.ml){const k=mnLab.indexOf(pr.ml);el=k>=0?mnEls[k]:null;}
  if(el)setTimeout(()=>{try{el.click();}catch(e){}padT=0;},0);
}
const cMn=document.createElement('div');cMn.className='c-mn';cMn.hidden=true;ctrlEl.appendChild(cMn);let cMnKey='';
const escH=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function ctrlMenu(pr,m,solo){
  const mn=pr.mn,pickFirst=m==='lobby'&&!solo&&CT.p<0;
  const show=!!(mn&&mn.b&&mn.b.length)&&(m==='menu'||m==='local'||m==='over'||m==='pause'||(m==='lobby'&&!pickFirst));
  cMn.hidden=!show;
  if(show){byId('cPick').hidden=true;byId('cPad').hidden=true;
    const key=JSON.stringify(mn);if(key!==cMnKey){cMnKey=key;
      cMn.innerHTML=`<div class="c-mn-h">${mn.k?`<span>${escH(mn.k)}</span>`:''}<h2>${escH(mn.h||'Menu')}</h2></div>
        <div class="c-mn-b">${mn.b.map((b,i)=>b[1]&4?'':`<button class="c-mn-i${b[1]&1?' on':''}${b[1]&2?' big':''}" data-mi="${i}">${escH(b[0])}</button>`).join('')}</div>
        <div class="c-mn-t">${mn.b.map((b,i)=>b[1]&4?`<button class="c-mn-i sm${b[1]&1?' on':''}" data-mi="${i}">${escH(b[0])}</button>`:'').join('')}</div>`;}}
  else{byId('cPick').hidden=CT.p>=0;byId('cPad').hidden=CT.p<0;}
  return show;
}
cMn.addEventListener('click',e=>{const b=e.target.closest('[data-mi]');if(!b)return;
  const i=+b.dataset.mi;CT.mc++;CT.mi=i;CT.ml=b.textContent;buzz(10);b.classList.add('tap');setTimeout(()=>b.classList.remove('tap'),180);ctrlSend();});
