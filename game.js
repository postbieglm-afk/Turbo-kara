/* Turbo Kára · game.js: závodníci, stav hry, ovládání, AI a fyzika */
'use strict';
/* ---------- závodníci a stav ---------- */
function mkRacer(i,name,color,dk,ai){
  const L0=T.loopL||L,lat=(i?.42:-.42)*HALF,p=trackAt(L0-90,lat);
  return {i,name,color,dk,ai,x:p.x,y:p.y,ang:p.a,vx:0,vy:0,vf:0,steerS:0,idx:p.i,s:L0-90,vmax:0,prog:-90,lapsDone:0,laps:[],best:null,lapStart:0,
    finished:false,place:0,finishT:0,coins:0,coinsTot:0,item:IT_NONE,roll:IT_NONE,rollT:0,boostT:0,shieldT:0,spinT:0,spinDir:1,hitN:0,
    stuck:0,rev:0,crashN:0,oilN:0,offT:0,shk:0,z:0,vz:0,landN:0,hL:0,spinMax:1,spinFrom:0,shieldHit:0,drift:0,driftT:0,driftL:0,dlN:0,mtN:0,hD:0,hM:0,slickT:0,pudCd:0,splat:null,splatT:0,hH:0,hC:0,hO:0,brakeP:0,revHold:0,wrongT:0,off:false,water:false,want:false,banner:null,brake:false,dist:0,lat:0,maxMul:1,aiHold:0,dustT:0,
    cam:{x:p.x,y:p.y,a:p.a,zs:0}};
}
let G,appScr='menu';
function newGame(kind){
  const free=kind.startsWith('free'),two=kind==='two'||kind==='pad'||kind==='free2',demo=kind==='demo';
  const r=[mkRacer(0,two?'HRÁČ 1':demo?'AI':'TY',C.p1,C.p1dk,demo),
           mkRacer(1,two?'HRÁČ 2':'SOUPEŘ',two?C.p2:C.ai,two?C.p2dk:C.aidk,!two)];
  if(free&&!two){r[1].ghost=true;r[1].x=r[1].y=1e7;}
  PK.forEach(p=>{p.on=true;p.t=0;});CONES.forEach(k=>{k.on=true;k.t=0;k.ft=9;});
  return {kind,two,demo,free,fs:{t:0},tip:free?{t:6,title:'VOLNÁ JÍZDA',txt:'Jezdi, kam chceš, a zkoušej. '+(touchMode&&kind!=='freepad1'?'Pauzou se vrátíš do menu.':'R vrátí auto na silnici, Esc je pauza.')}:{t:0},seen:{},
    remote:kind==='pad'||kind==='pad1'||kind==='freepad1',solo:kind==='pad1'||kind==='freepad1',mode:demo?'race':'count',count:free?1.9:3.6,lastBeep:4,t:0,r,oils:[],parts:[],finishN:0,endT:-1,paused:false,
    humans:two?[0,1]:demo?[0]:[0],diffSpd:DIFFS[diff].spd};
}
G=newGame('demo');

function startGame(mode){
  ensureTrack(mode.startsWith('free'));
  audio();lastMode=mode;appScr='game';G=newGame(mode);ov.hidden=true;
  document.body.classList.toggle('split',G.two);engineStart();
}
function fmt(t){if(t==null)return '–';const m=Math.floor(t/60),s=t-m*60;return m+':'+s.toFixed(1).padStart(4,'0');}
function pauseGame(){
  if(appScr!=='game'||G.paused||!(G.mode==='race'||G.mode==='count'))return;
  G.paused=true;for(const k in keys)keys[k]=false;card.className='card';ov.classList.remove('menuov');
  card.innerHTML=`<h1>Pauza</h1><p>Závod stojí. Čas na trati se nepočítá.</p>
    <div class="row"><button class="go" data-resume>POKRAČOVAT</button>${G.free?'<button class="go ghost" data-respawn>NA SILNICI</button>':''}<button class="go ghost" data-mode="${lastMode}">RESTART</button><button class="go ghost" data-menu>MENU</button></div>
    <div class="row mtoggles" style="justify-content:center">${toggles()}</div>
    <p class="hint">${G.remote?'Pauzu jde dát i z mobilu.':'Pauza: klávesa Esc nebo P.'}</p>`;
  bindButtons();ov.hidden=false;
}
function resumeGame(){if(!G.paused)return;G.paused=false;ov.hidden=true;}
function togglePause(){if(G.paused)resumeGame();else pauseGame();}

/* ---------- ovládání: klávesnice ---------- */
const keys={};
const GAME_KEYS=new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyW','KeyA','KeyS','KeyD','KeyF','Enter','NumpadEnter','ShiftLeft','ShiftRight','KeyL']);
addEventListener('keydown',e=>{
  if(appScr==='ctrl')return;
  if(e.code==='Escape'||e.code==='KeyP'){if(appScr==='game'){togglePause();e.preventDefault();}return;}
  if(appScr!=='game'||G.paused)return;
  if(GAME_KEYS.has(e.code))e.preventDefault();
  if(e.repeat){keys[e.code]=true;return;}
  keys[e.code]=true;
  if(e.code==='KeyC'&&R3){G.humans.forEach(i=>toggleView(i));}
  if(e.code==='KeyR'&&G.free){G.humans.forEach(i=>respawn(G.r[i]));}
  if(G.mode==='race'){
    if(G.two){if(e.code==='KeyF')G.r[0].want=true;if(e.code==='Enter'||e.code==='NumpadEnter'||e.code==='KeyL')G.r[1].want=true;}
    else if(['Space','ShiftLeft','ShiftRight','KeyF','Enter','NumpadEnter'].includes(e.code))G.r[0].want=true;
  }
});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseGame();});

/* ---------- ovládání: dotyk na plátně ---------- */
const ptrs=new Map(),touchState=[{l:0,r:0,b:0},{l:0,r:0,b:0}];
function viewports(){
  if(!G.two||appScr!=='game')return [{x:0,y:0,w:W,h:H}];
  // dva hráči vždy nad sebou: každý má celou šířku, tedy široký výhled do stran
  const h=H/2;return [{x:0,y:0,w:W,h:h-2},{x:0,y:h+2,w:W,h:H-h-2}];
}
function inset(V){return {l:V.x<1?safeL:0,r:V.x+V.w>W-1?safeR:0,t:V.y<1?safeT:0,b:V.y+V.h>H-1?safeB:0};}
function zones(V){
  const s=inset(V),u=clamp(Math.min(V.w,V.h)*.19,58,96),m=14,lx=V.x+m+s.l;
  // šipky na zatáčení jsou velké, aby se trefily palcem naslepo
  const sw=clamp(Math.min(V.w*.27,u*1.6),76,150),sh=clamp(Math.min(V.h*.3,u*1.4),80,150),bot=V.y+V.h-m-s.b-sh;
  const I={x:V.x+V.w-m-s.r-u*1.12,y:V.y+V.h-m-s.b-u*1.12,w:u*1.12,h:u*1.12};
  const narrow=lx+sw*2+12+u*1.1+24>I.x;
  const B=narrow?{x:I.x+(I.w-u*.95)/2,y:I.y-12-u*.75,w:u*.95,h:u*.75}:{x:I.x-12-u*.95,y:I.y+I.h-u*.82,w:u*.95,h:u*.82};
  const ms=clamp(Math.min(V.w,V.h)*.3,96,190);
  return {u,L:{x:lx,y:bot,w:sw,h:sh},R:{x:lx+sw+12,y:bot,w:sw,h:sh},I,B,
    V:R3?{x:V.x+V.w-14-s.r-ms,y:V.y+12+s.t+ms+8,w:ms,h:36}:{x:-9999,y:-9999,w:0,h:0}};
}
const inR=(z,x,y)=>x>=z.x&&x<=z.x+z.w&&y>=z.y&&y<=z.y+z.h;
function zoneAt(x,y){
  const vs=viewports();for(let vi=0;vi<vs.length;vi++){const V=vs[vi];if(x<V.x||x>V.x+V.w||y<V.y||y>V.y+V.h)continue;
    const z=zones(V);for(const k of ['L','R','I','B','V'])if(inR(z[k],x,y))return {vi,k};
    // tolerance: lower half of the screen side counts as steering
    if(y>V.y+V.h*.55){if(x<z.R.x+z.R.w+20)return {vi,k:x<z.R.x-5?'L':'R'};}
    return {vi,k:null};}
  return null;
}
function touchActive(){return touchMode&&appScr==='game'&&!G.remote&&(G.mode==='race'||G.mode==='count')&&!G.paused;}
cv.addEventListener('pointerdown',e=>{
  if(e.pointerType==='touch'&&!touchMode)setTouch(true);
  if(!touchActive())return;
  const z=zoneAt(e.clientX,e.clientY);if(!z)return;
  try{cv.setPointerCapture(e.pointerId);}catch(x){}
  ptrs.set(e.pointerId,{vi:z.vi,k:z.k,fixed:z.k==='I'||z.k==='B'||z.k==='V'});
  if(z.k==='I'&&G.mode==='race'){const r=G.r[G.humans[z.vi]];if(r)r.want=true;}
  if(z.k==='V')toggleView(G.humans[z.vi]);
  e.preventDefault();
});
cv.addEventListener('pointermove',e=>{
  const p=ptrs.get(e.pointerId);if(!p||p.fixed)return;
  const z=zoneAt(e.clientX,e.clientY);if(z&&z.vi===p.vi&&(z.k==='L'||z.k==='R'))p.k=z.k;
});
const ptrEnd=e=>{ptrs.delete(e.pointerId);};
cv.addEventListener('pointerup',ptrEnd);cv.addEventListener('pointercancel',ptrEnd);
function readTouch(){
  touchState.forEach(t=>{t.l=t.r=t.b=0;});
  if(!touchActive()){ptrs.clear();return;}
  for(const p of ptrs.values()){const t=touchState[p.vi];if(!t)continue;if(p.k==='L')t.l=1;if(p.k==='R')t.r=1;if(p.k==='B')t.b=1;}
}

/* ---------- řízení: člověk a AI ---------- */
function humanControl(r){
  const vi=G.humans.indexOf(r.i),k=keys;let l,rt,u,d;
  if(G.two){if(r.i===0){l=k.KeyA;rt=k.KeyD;u=k.KeyW;d=k.KeyS;}else{l=k.ArrowLeft;rt=k.ArrowRight;u=k.ArrowUp;d=k.ArrowDown;}}
  else{l=k.KeyA||k.ArrowLeft;rt=k.KeyD||k.ArrowRight;u=k.KeyW||k.ArrowUp;d=k.KeyS||k.ArrowDown;}
  const ts=touchState[vi]||{};l=l||ts.l;rt=rt||ts.r;d=d||ts.b;
  const rm=G.remote?remote[r.i]:null;
  let steer=(rt?1:0)-(l?1:0);
  if(rm){if(!steer)steer=rm.s;d=d||rm.b;}
  const auto=(touchMode&&!G.remote)||!!rm;
  const item=r.want;r.want=false;
  // tlačítko DRIFT: se zatáčením drift, bez zatáčení (nebo pomalu) brzda a couvání
  const brake=!!d&&!r.drift&&(Math.abs(steer)<.3||Math.abs(r.vf)<90);
  return {steer,gas:!!(u||auto),brake,drift:!!d,item};
}
function aiControl(r,slow){
  const opp=G.r[1-r.i];
  if(r.spinT<=0&&!r.finished&&G.mode==='race'){if(Math.abs(r.vf)<28)r.stuck+=DT;else r.stuck=0;if(r.stuck>1.1){r.rev=.9;r.stuck=0;}}
  const ahead=d=>(r.idx+Math.round(d/DS))%N;
  let off=T.rl[ahead(140)];
  // sbírání: otazník, když nemá předmět, jinak penízky
  if(!r.demoLazy){let best=null,bd=1e9;
    for(const p of PK){if(!p.on)continue;if(p.type==='box'&&(r.item||r.rollT>0))continue;if(p.type==='coin'&&r.coins>=COIN_MAX)continue;
      const dx=p.x-r.x,dy=p.y-r.y,along=dx*Math.cos(r.ang)+dy*Math.sin(r.ang);if(along<30||along>300)continue;
      const lat=(p.x-T.x[r.idx])*T.nx(r.idx)+(p.y-T.y[r.idx])*T.ny(r.idx);const cost=along+Math.abs(lat-r.lat)*1.6-(p.type==='box'?80:0);
      if(Math.abs(lat-r.lat)<HALF*1.1&&cost<bd){bd=cost;best=lat;}}
    if(best!==null)off=off*.25+best*.75;}
  // překážky před autem: objeď je tou stranou, kde je víc místa
  for(const o of AVOID){if(o.cone&&!o.cone.on)continue;const dd=((o.i-r.idx+N)%N)*DS;if(dd>330)continue;
    const need=o.hw+24;if(Math.abs(off-o.lat)<need){const a=o.lat+need,b=o.lat-need,okA=a<HALF-14,okB=b>-HALF+14;
      off=okA&&okB?(Math.abs(a-off)<Math.abs(b-off)?a:b):okA?a:b;}}
  if(r.dist>HALF+30)off=0;
  const look=55+Math.max(0,r.vf)*.42,ti=ahead(look),tx=T.x[ti]+T.nx(ti)*off,ty=T.y[ti]+T.ny(ti)*off;
  const da=angDiff(Math.atan2(ty-r.y,tx-r.x),r.ang);
  let steer=clamp(da*2.7,-1,1);
  if(r.rev>0){r.rev-=DT;return {steer:-steer,gas:false,brake:true,item:false};}
  const stopD=Math.max(0,r.vf)**2/(2*BRAKE*.9)+Math.max(0,r.vf)*.3+50;let vmin=1e9;
  for(let q=0,n=Math.ceil(stopD/DS);q<=n;q++)vmin=Math.min(vmin,T.vt[(r.idx+q)%N]);
  const mul=r.maxMul*coinMul(r.coins)*slow;
  const target=Math.min(vmin*mul*(r.offT>OFF_DELAY?.85:1),MAX*mul*(r.boostT>0?1.42:1));
  let item=false;
  if(r.item&&!G.demo){r.aiHold+=DT;
    if(r.item===IT_NITRO){let mk=0;for(let q=0;q<35;q++)mk=Math.max(mk,Math.abs(T.k3[ahead(q*DS)]));if(mk<1/650||r.aiHold>9)item=true;}
    if(r.item===IT_OIL){const gap=r.prog-opp.prog;if((gap>40&&gap<380)||r.aiHold>10)item=true;}
    if(r.item===IT_SHIELD&&(r.aiHold>2.5||G.oils.some(o=>o.owner!==r.i&&Math.hypot(o.x-r.x,o.y-r.y)<260)))item=true;
    if(item)r.aiHold=0;}
  else if(r.item&&G.demo){r.aiHold+=DT;if(r.aiHold>3){item=true;r.aiHold=0;}}
  return {steer,gas:r.vf<target,brake:r.vf>target+14,item};
}

/* ---------- fyzika ---------- */
let DT=1/60;
function locate(r){
  if(T.grid){let [d,best]=gridNear(r.x,r.y);if(best<0){let bd=1e18;for(let i=0;i<N;i++){const dx=r.x-T.x[i],dy=r.y-T.y[i],q=dx*dx+dy*dy;if(q<bd){bd=q;best=i;}}}
    r.idx=best;const dx=r.x-T.x[best],dy=r.y-T.y[best];r.lat=dx*T.nx(best)+dy*T.ny(best);r.dist=Math.hypot(dx,dy);return best*DS;}
  let best=r.idx,bd=1e18;
  for(let j=-25;j<=45;j++){const i=(r.idx+j+N)%N,dx=r.x-T.x[i],dy=r.y-T.y[i],d=dx*dx+dy*dy;if(d<bd){bd=d;best=i;}}
  if(bd>240*240){for(let i=0;i<N;i++){const dx=r.x-T.x[i],dy=r.y-T.y[i],d=dx*dx+dy*dy;if(d<bd){bd=d;best=i;}}}
  r.idx=best;const dx=r.x-T.x[best],dy=r.y-T.y[best];
  r.lat=dx*T.nx(best)+dy*T.ny(best);r.dist=Math.abs(r.lat);
  return ((best*DS+dx*T.tx[best]+dy*T.ty[best])%L+L)%L;
}
function addPart(x,y,vx,vy,life,c,s,k){if(G.parts.length>420)G.parts.shift();G.parts.push({x,y,vx,vy,l:life,m:life,c,s,k});}
function rollItem(r){
  const lead=standings()[0]===r&&!G.demo;const p=Math.random();
  return lead?(p<.3?IT_NITRO:p<.68?IT_OIL:IT_SHIELD):(p<.6?IT_NITRO:p<.8?IT_OIL:IT_SHIELD);
}
function useItem(r){
  if(!r.item||r.spinT>0)return;const it=r.item;r.item=IT_NONE;
  if(it===IT_NITRO){r.boostT=Math.max(r.boostT,2.3);sfx('boost');}
  if(it===IT_OIL){const c=Math.cos(r.ang),s=Math.sin(r.ang);if(G.oils.length>7)G.oils.shift();
    G.oils.push({x:r.x-c*36,y:r.y-s*36,t:25,owner:r.i,imm:1.2,a:Math.random()*TAU});sfx('oil');}
  if(it===IT_SHIELD){r.shieldT=SHIELD_T;sfx('shield');}
}
// smyk: štít ho celý pohltí (a zůstává); jinak auto udělá otočku a skončí vždy čelem po směru trati
function spinOut(r,dur=1.05,coins=true){
  if(r.shieldT>0){r.shieldHit=.35;sfx('pop');return false;}
  endDrift(r,false);
  r.spinT=dur;r.spinMax=dur;r.spinFrom=r.ang;r.spinDir=Math.random()<.5?-1:1;if(coins)r.coins=Math.max(0,r.coins-2);r.hitN++;sfx('spin');return true;
}
function step(r,c){
  const dt=DT,spin=r.spinT>0,air=r.z>0;
  r.steerS+=clamp(c.steer-r.steerS,-dt*7,dt*7);
  // drift jako v Mario Kartu: poskok, smyk do zatáčky, jiskry se nabíjejí, pustíš = mini-turbo
  if(r.drift){if(!c.drift||spin||r.vf<80||Math.hypot(r.vx,r.vy)<110)endDrift(r,!spin&&r.vf>=80);}
  else if(c.drift&&!air&&!spin&&r.vf>150&&Math.abs(c.steer)>.3){r.drift=Math.sign(c.steer);r.driftT=0;r.driftL=0;r.vz=75;r.z=.5;if(!r.ai)sfx('hop');}
  const drifting=!!r.drift,sp0=Math.hypot(r.vx,r.vy);
  if(r.slickT>0)r.slickT-=dt;if(r.pudCd>0)r.pudCd-=dt;if(r.splatT>0)r.splatT-=dt;
  if(c.brake&&r.spinT<=0)r.brakeP=Math.min(1,r.brakeP+dt*1.8);else{r.brakeP=Math.max(0,r.brakeP-dt*5);r.revHold=0;}
  // zatáčení
  if(spin){const tA=Math.atan2(T.ty[r.idx],T.tx[r.idx]),q=clamp(1-(r.spinT-dt)/r.spinMax,0,1),e=q<.5?2*q*q:1-Math.pow(2-2*q,2)/2;
    r.ang=r.spinFrom+(r.spinDir*TAU+angDiff(tA,r.spinFrom))*e;}
  else if(drifting){const s=clamp(c.steer*r.drift,-1,1);r.ang+=r.drift*TURN*(.55+.45*s)*Math.min(1,Math.hypot(r.vx,r.vy)/220)*dt;}
  else if(!air){const sp=Math.abs(r.vf);r.ang+=r.steerS*TURN*Math.min(1,sp/80)*(1-.3*Math.min(1,sp/MAX))*dt*(r.vf>=0?1:-1);}
  const fx=Math.cos(r.ang),fy=Math.sin(r.ang);
  let vf=r.vx*fx+r.vy*fy,vl=-r.vx*fy+r.vy*fx;
  let top=MAX*coinMul(r.coins)*r.maxMul;
  if(r.boostT>0)top*=1.42;
  // mimo trať se zpomaluje až po 2 s, pak mírně (náběh 0,4 s)
  const offK=clamp((r.offT-OFF_DELAY)/.4,0,1);
  top*=1-.15*offK;
  if(r.water)top*=.32;
  let slp=0;if(TERR&&!air){slp=(hAt(r.x+fx*22,r.y+fy*22)-hAt(r.x-fx*22,r.y-fy*22))/44;top*=1-Math.max(-.14,Math.min(.14,slp))*.9;}
  if(air){/* ve vzduchu: plyn ani brzda nezabírají */}
  else if(spin)vf-=vf*1.5*dt;
  else if(c.brake){
    // brzda nabíhá postupně: lehce hned, naplno asi po půl vteřině a půl; couvání až po zastavení a chvíli držení
    if(vf>12){vf=Math.max(0,vf-(100+260*r.brakeP)*dt);r.revHold=0;}
    else{r.revHold+=dt;if(r.revHold>.35)vf=Math.max(-MAX*.3,vf-170*dt);else vf=Math.max(Math.min(vf,0),vf-200*dt);}}
  else if(c.gas){if(vf<0)vf+=400*dt;else if(vf<top){vf=Math.min(top,vf+ACC*(r.boostT>0?2.3:1)*(1-.5*vf/top)*dt);}}
  else vf-=Math.sign(vf)*Math.min(Math.abs(vf),130*dt);
  if(slp&&!spin)vf-=slp*430*dt;
  if(vf>top&&!air)vf=Math.max(top,vf-(r.water?750:offK>0?330:260)*dt);
  const grip=drifting?7:air?.4:spin?1.2:r.slickT>0?1.6:offK>0?9-2*offK:(r.brakeP>.6&&vf>220?6.5:9);
  vl*=Math.exp(-grip*dt);
  // ve smyku auto neztrácí rychlost, jen klouže bokem
  if(drifting){const k=Math.hypot(vf,vl);if(k>1){const tgt=Math.max(k,sp0*(1-.06*dt));vf*=tgt/k;vl*=tgt/k;}}
  r.vx=fx*vf-fy*vl;r.vy=fy*vf+fx*vl;r.vf=vf;r.brake=c.brake&&vf>20;
  if(drifting){const s=clamp(c.steer*r.drift,-1,1);r.driftT+=dt*(1+.6*Math.max(0,s));
    const lv=r.driftT>2.6?3:r.driftT>1.6?2:r.driftT>.75?1:0;if(lv>r.driftL){r.driftL=lv;r.dlN++;if(!r.ai)sfx('dlvl');}
    if(r.z<=0)for(const sd of [-1,1])if(Math.random()<.8){const bx=r.x-fx*17+(-fy)*sd*10,by=r.y-fy*17+fx*sd*10;
      addPart(bx,by,-fx*60+(Math.random()-.5)*90,-fy*60+(Math.random()-.5)*90,.3,DRIFT_C[r.driftL],r.driftL?3.2:5,r.driftL?'spark':'dust');}}
  r.x+=r.vx*dt;r.y+=r.vy*dt;
  // skok: výška a doskok
  if(r.z>0||r.vz>0){r.vz-=GRAV*dt;r.z+=r.vz*dt;
    if(r.z<=0){r.z=0;if(r.vz<-120){r.shk=Math.max(r.shk,.6+Math.min(.9,-r.vz/450));r.landN++;if(!r.ai)sfx('land');
      for(let i=0;i<8;i++)addPart(r.x+(Math.random()-.5)*30,r.y+(Math.random()-.5)*30,(Math.random()-.5)*120,(Math.random()-.5)*120,.5,'rgba(220,220,220,.6)',6,'dust');}r.vz=0;}}
  if(c.item)useItem(r);
  // časovače
  r.boostT=Math.max(0,r.boostT-dt);r.shieldT=Math.max(0,r.shieldT-dt);r.shieldHit=Math.max(0,r.shieldHit-dt);
  if(r.spinT>0){r.spinT=Math.max(0,r.spinT-dt);
    // konec otočky: čelem po trati, rychlost do směru jízdy
    if(r.spinT<=0){const tA=Math.atan2(T.ty[r.idx],T.tx[r.idx]),v=Math.max(70,Math.hypot(r.vx,r.vy));r.ang=tA;r.vx=Math.cos(tA)*v;r.vy=Math.sin(tA)*v;r.cam.a=r.cam.a+angDiff(tA,r.cam.a)*.5;}}
  if(r.rollT>0){r.rollT-=dt;if(r.rollT<=0){r.item=r.roll;r.aiHold=0;if(!r.ai)sfx('item');}}
  // poloha na trati, kola
  const s=locate(r);let d=s-r.s;if(d>L/2)d-=L;if(d<-L/2)d+=L;r.s=s;r.prog+=d;
  r.off=r.dist>HALF+5&&(!FREEOPEN()||r.dist<WALL+4);r.water=inLake(r.x,r.y,-10);r.offT=r.off?r.offT+dt:0;
  // třesení obrazovky: doznívá, mimo trať drnčí podle rychlosti
  r.shk*=Math.exp(-5*dt);
  if(r.off&&!air&&Math.abs(vf)>40)r.shk=Math.max(r.shk,.3+.4*Math.min(1,Math.abs(vf)/MAX));
  if(r.water&&Math.random()<.4)addPart(r.x+(Math.random()-.5)*20,r.y+(Math.random()-.5)*20,(Math.random()-.5)*60,(Math.random()-.5)*60,.5,'rgba(220,240,255,.8)',3,'dust');
  if(r.off&&!air&&Math.abs(vf)>60&&Math.random()<.35)addPart(r.x-fx*16,r.y-fy*16,(Math.random()-.5)*50-fx*40,(Math.random()-.5)*50-fy*40,.5,'rgba(200,190,180,.45)',5,'dust');
  if(spin&&Math.random()<.6)addPart(r.x,r.y,(Math.random()-.5)*80,(Math.random()-.5)*80,.6,'rgba(230,230,230,.5)',7,'dust');
  if(r.boostT>0&&Math.random()<.7)addPart(r.x-fx*24,r.y-fy*24,-fx*90+(Math.random()-.5)*40,-fy*90+(Math.random()-.5)*40,.35,Math.random()<.5?'#ffd166':'#f07a24',3.5,'spark');
  // opačný směr
  if(!G.demo&&!G.free&&G.mode==='race'&&!r.finished&&(r.vx*T.tx[r.idx]+r.vy*T.ty[r.idx])<-40&&r.dist<HALF+80)r.wrongT+=dt;else r.wrongT=0;
  if(G.demo||G.free||G.mode!=='race')return;
  const done=Math.floor(r.prog/L);
  if(done>r.lapsDone&&!r.finished){
    r.lapsDone=done;const lt=G.t-r.lapStart;r.laps.push(lt);r.best=r.best===null?lt:Math.min(r.best,lt);r.lapStart=G.t;
    if(done>=LAPS){r.finished=true;r.finishT=G.t;r.place=++G.finishN;if(!r.ai){sfx('finish');}
      r.banner={text:'CÍL',sub:r.place+'. místo · '+fmt(r.finishT),t:3,max:3,col:r.place===1?C.gold:C.fg};}
    else{if(!r.ai)sfx('lap');r.banner={text:done===LAPS-1?'POSLEDNÍ KOLO':'KOLO '+(done+1)+'/'+LAPS,sub:'Kolo za '+fmt(lt)+(lt===r.best&&done>1?' · nejlepší':''),t:2,max:2,col:done===LAPS-1?C.gold:C.fg};}
  }
}
function collide(){
  // sběr
  for(const r of G.r){if(r.ghost)continue;
    for(const p of PK){if(!p.on||r.z>22)continue;const dx=p.x-r.x,dy=p.y-r.y,rr=p.type==='coin'?24:28;if(dx*dx+dy*dy>rr*rr)continue;
      p.on=false;p.t=p.type==='coin'?7:4;
      if(p.type==='coin'){r.coinsTot++;r.coins=Math.min(COIN_MAX,r.coins+1);if(!r.ai)sfx('coin');for(let i=0;i<8;i++){const a=i/8*TAU;addPart(p.x,p.y,Math.cos(a)*90,Math.sin(a)*90,.45,C.gold,3,'spark');}}
      else{for(let i=0;i<12;i++){const a=i/12*TAU;addPart(p.x,p.y,Math.cos(a)*120,Math.sin(a)*120,.5,i%2?C.sky:'#ffffff',3.5,'spark');}
        if(!r.item&&r.rollT<=0){r.roll=rollItem(r);r.rollT=.75;if(!r.ai)sfx('box');}}}
    for(const pd of PADS){const dx=r.x-pd.x,dy=r.y-pd.y,c=Math.cos(pd.a),s=Math.sin(pd.a),al=dx*c+dy*s,lt=-dx*s+dy*c;
      if(Math.abs(al)<30&&Math.abs(lt)<38&&r.spinT<=0&&r.z<2){if(r.boostT<.5&&!r.ai)sfx('boost');r.boostT=Math.max(r.boostT,1.0);}}
    for(let i=G.oils.length-1;i>=0;i--){const o=G.oils[i];if((o.owner===r.i&&o.imm>0)||r.z>5)continue;if(Math.hypot(o.x-r.x,o.y-r.y)<24){G.oils.splice(i,1);r.oilN++;r.shk=Math.max(r.shk,1.7);if(r.shieldT<=0&&!r.ai){r.splat=makeSplat();r.splatT=3.6;}spinOut(r);}}
    // louže oleje na trati: smyk, cuknutí a flek na obrazovce
    for(const p of PUDDLES){if(r.z>5||r.pudCd>0)continue;const dx=r.x-p.x,dy=r.y-p.y;if(dx*dx+dy*dy>p.r*p.r)continue;
      r.pudCd=1.4;if(!spinOut(r,.8,false))continue;r.vx*=.93;r.vy*=.93;r.oilN++;r.shk=Math.max(r.shk,1.1);if(!r.ai){r.splat=makeSplat();r.splatT=3.6;sfx('oil');}
      for(let i=0;i<8;i++)addPart(p.x,p.y,(Math.random()-.5)*120,(Math.random()-.5)*120,.5,'rgba(20,22,24,.8)',5,'dust');}
    // skokánky
    for(const j of JUMPS){const dx=r.x-j.x,dy=r.y-j.y,c=Math.cos(j.a),s=Math.sin(j.a),al=dx*c+dy*s,lt=-dx*s+dy*c;
      if(al>-6&&al<j.hl&&Math.abs(lt)<j.hw&&r.z<=0&&r.vf>90){r.vz=Math.min(285,r.vf*.5);r.z=.5;if(!r.ai){sfx('jump');if(r.boostT<.5)sfx('boost');}r.boostT=Math.max(r.boostT,1.0);}}
    // kužely: odletí, auto trochu zpomalí
    for(const k of CONES){if(!k.on||r.z>14)continue;const dx=k.x-r.x,dy=k.y-r.y;if(dx*dx+dy*dy>19*19)continue;
      k.on=false;k.t=6;k.ft=0;k.fvx=r.vx*.8+(Math.random()-.5)*140;k.fvy=r.vy*.8+(Math.random()-.5)*140;
      if(r.shieldT>0){r.shieldHit=.35;}else{r.vx*=.86;r.vy*=.86;r.shk=Math.max(r.shk,.55);r.crashN++;}if(!r.ai)sfx('cone');
      for(let i=0;i<6;i++)addPart(k.x,k.y,(Math.random()-.5)*140,(Math.random()-.5)*140,.4,'#ef6a1d',3,'spark');}
    // zábrany: pevný kvádr (dá se přeskočit jen vysokým skokem)
    for(const b of BARRS){if(r.z>b.h)continue;const dx=r.x-b.x,dy=r.y-b.y,c=Math.cos(b.a),s=Math.sin(b.a),u=dx*c+dy*s,v=-dx*s+dy*c;
      const ex=u-clamp(u,-b.hl,b.hl),ey=v-clamp(v,-b.hw,b.hw);let d=Math.hypot(ex,ey),nu,nv;if(d>=13)continue;
      if(d>.01){nu=ex/d;nv=ey/d;}else{const pu=b.hl-Math.abs(u),pv=b.hw-Math.abs(v);if(pu<pv){nu=Math.sign(u)||1;nv=0;d=-pu;}else{nu=0;nv=Math.sign(v)||1;d=-pv;}}
      const nx=nu*c-nv*s,ny=nu*s+nv*c,push=13-d;r.x+=nx*push;r.y+=ny*push;const vn=r.vx*nx+r.vy*ny;
      if(vn<0){if(r.shieldT>0){r.vx-=vn*nx;r.vy-=vn*ny;r.shieldHit=.35;}
        else{r.vx-=1.5*vn*nx;r.vy-=1.5*vn*ny;r.vx*=.6;r.vy*=.6;if(vn<-110){r.crashN++;r.shk=Math.max(r.shk,1.2);if(!r.ai)sfx('tree');}}}}
    // zdi domů za chodníkem
    if(FREEOPEN())hitBuildings(r);
    else{const WL=WALL-13;if(r.dist>WL){const k=Math.sign(r.lat)||1,dd=r.dist||1,nx=T.free?(r.x-T.x[r.idx])/dd:T.nx(r.idx)*k,ny=T.free?(r.y-T.y[r.idx])/dd:T.ny(r.idx)*k,pen=r.dist-WL;
      r.x-=nx*pen;r.y-=ny*pen;r.lat=k*WL;r.dist=WL;const vn=r.vx*nx+r.vy*ny;
      if(vn>0&&r.shieldT>0){r.vx-=vn*nx;r.vy-=vn*ny;if(vn>60){r.shieldHit=.35;for(let i=0;i<3;i++)addPart(r.x+nx*14,r.y+ny*14,(Math.random()-.5)*90,(Math.random()-.5)*90,.3,C.sky,3,'spark');}}
      else if(vn>0){r.vx-=1.4*vn*nx;r.vy-=1.4*vn*ny;if(vn>40){r.vx*=.9;r.vy*=.9;}
        if(vn>110){r.crashN++;if(r.drift)endDrift(r,false);r.shk=Math.max(r.shk,Math.min(1.4,vn/260));if(!r.ai)sfx('tree');for(let i=0;i<5;i++)addPart(r.x+nx*12,r.y+ny*12,(Math.random()-.5)*120,(Math.random()-.5)*120,.3,'#fff3c4',2.5,'spark');}}}}
  }
  // auta mezi sebou
  const a=G.r[0],b=G.r[1],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),min=30;
  if(d<min&&d>0.01){const nx=dx/d,ny=dy/d,push=(min-d)/2;a.x-=nx*push;a.y-=ny*push;b.x+=nx*push;b.y+=ny*push;
    const rel=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
    if(rel<0){const imp=-rel;
      // téměř nepružný ráz: auta se od sebe neodrazí, spíš se "slepí" a vyrovnají rychlost podél nárazu
      const j=1.1*imp/2;a.vx-=j*nx;a.vy-=j*ny;b.vx+=j*nx;b.vy+=j*ny;
      // ztráta energie: oba zpomalí (od lehkého šťouchnutí ~8 %, při silném nárazu až ~30 %)
      const loss=Math.min(.3,Math.min(1,imp/25)*.08+imp*.0009),keep=1-loss;
      if(a.shieldT<=0){a.vx*=keep;a.vy*=keep;}if(b.shieldT<=0){b.vx*=keep;b.vy*=keep;}
      // mírné vychýlení: náraz z boku otočí příď od druhého auta (max. ~7°, při čelním nárazu skoro nic)
      const kick=Math.min(1,imp/300)*.14;
      const ca=Math.cos(a.ang)*ny-Math.sin(a.ang)*nx,cb=-(Math.cos(b.ang)*ny-Math.sin(b.ang)*nx);
      a.ang-=kick*clamp(ca*2,-1,1);b.ang-=kick*clamp(cb*2,-1,1);
      if(rel<-120){sfx('bump');a.crashN++;b.crashN++;a.shk=Math.max(a.shk,.9);b.shk=Math.max(b.shk,.9);for(let i=0;i<6;i++)addPart((a.x+b.x)/2,(a.y+b.y)/2,(Math.random()-.5)*160,(Math.random()-.5)*160,.3,'#fff3c4',2.5,'spark');}
      if(a.shieldT>0&&b.shieldT<=0&&rel<-80)spinOut(b);else if(b.shieldT>0&&a.shieldT<=0&&rel<-80)spinOut(a);}}
}
function update(dt){
  DT=dt;
  if(G.paused)return;
  readTouch();
  const g=G;updLife(dt);if(g.free)freeCoach(dt);
  if(g.mode==='count'){
    g.count-=dt;const c=Math.ceil(g.count);
    if(c<g.lastBeep&&c>=1&&c<=3){g.lastBeep=c;sfx('beep');}
    if(g.count<=0){g.mode='race';g.t=0;g.r.forEach(r=>r.lapStart=0);sfx('go');g.goT=1;}
  }
  if(g.goT>0)g.goT-=dt;
  const racing=g.mode==='race'||g.mode==='over';
  if(racing){
    g.t+=dt;
    // gumička pro AI
    g.r.forEach(r=>{if(r.ai&&!g.demo){const opp=g.r[1-r.i],gap=opp.prog-r.prog;r.maxMul=g.diffSpd*clamp(1+gap/7000,.9,1.07);}
      else if(r.ai)r.maxMul=.86+r.i*.03;else r.maxMul=1;});
    for(const r of g.r){
      if(r.ghost)continue;let c;
      if(r.ai||g.mode==='over')c=aiControl(r,g.mode==='over'?.7:1);
      else if(r.finished){c=aiControl(r,.6);c.item=false;r.want=false;}
      else c=humanControl(r);
      step(r,c);
    }
    collide();
    PK.forEach(p=>{if(!p.on){p.t-=dt;if(p.t<=0)p.on=true;}});
    CONES.forEach(k=>{if(!k.on){k.t-=dt;k.ft+=dt;if(k.t<=0){k.on=true;k.x=k.x0;k.y=k.y0;}}});
    g.oils.forEach(o=>{o.t-=dt;o.imm-=dt;});g.oils=g.oils.filter(o=>o.t>0);
    if(g.mode==='race'&&!g.demo){
      const hum=g.r.filter(r=>!r.ai);
      if(hum.length&&hum.every(r=>r.finished)){if(g.endT<0||g.endT>2.6)g.endT=2.6;}
      else if(g.two&&hum.some(r=>r.finished)&&g.endT<0)g.endT=15;
      if(g.endT>=0){g.endT-=dt;if(g.endT<=0)finish();}
    }
  }
  g.r.forEach(r=>{if(r.banner){r.banner.t-=dt;if(r.banner.t<=0)r.banner=null;}
    const cm=r.cam;cm.a+=angDiff(r.ang,cm.a)*Math.min(1,dt*(r.spinT>0?1.1:3.4));cm.x=r.x;cm.y=r.y;
    cm.zs+=(clamp(Math.abs(r.vf)/MAX,0,1.4)-cm.zs)*Math.min(1,dt*1.6);});
  for(const p of g.parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.94;p.vy*=.94;p.l-=dt;}
  g.parts=g.parts.filter(p=>p.l>0);
}

