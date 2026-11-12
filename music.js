/* Turbo Kára · music.js: přehrávač hudby: MUSIC stav, nástroje MI, playStep/musicTick, musicStart/Stop/Next, musicPlay(), musicSet(), curSong(). Noty jsou v music-data.js. */
'use strict';
/* ---------- hudba v menu: vlastní crunk a hip-hop skladby generované v prohlížeči ---------- */
const MUSIC={on:true,idx:0,playing:false,step:0,next:0,timer:null,bus:null};
try{if(localStorage.getItem('tk-music')==='0')MUSIC.on=false;const v=+localStorage.getItem('tk-song');if(v>=0&&v<4)MUSIC.idx=v;}catch(e){}
const mN=m=>440*Math.pow(2,(m-69)/12);
// nástroje
const MI={
  noise(t,o,dur,vol,type,freq,q){const s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();s.buffer=NOISE;f.type=type;f.frequency.value=freq;f.Q.value=q||1;
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f).connect(g).connect(o);const off=Math.random()*.2;s.start(t,off);s.stop(t+dur+.02);},
  osc(t,o,type,f0,f1,dur,vol,att){const s=AC.createOscillator(),g=AC.createGain();s.type=type;s.frequency.setValueAtTime(f0,t);if(f1&&f1!==f0)s.frequency.exponentialRampToValueAtTime(f1,t+Math.min(dur,.12));
    g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+(att||.005));g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(g).connect(o);s.start(t);s.stop(t+dur+.03);return s;},
  kick(t,o){MI.osc(t,o,'sine',170,42,.45,1);MI.noise(t,o,.02,.25,'lowpass',3000);},
  snare(t,o){MI.noise(t,o,.17,.45,'bandpass',1900,.8);MI.osc(t,o,'triangle',200,120,.09,.28);},
  clap(t,o){for(let k=0;k<3;k++)MI.noise(t+k*.011,o,.03,.4,'bandpass',1500,1.2);MI.noise(t+.03,o,.2,.32,'bandpass',1300,1);},
  hat(t,o,open){MI.noise(t,o,open?.24:.035,open?.13:.16,'highpass',7600,.7);},
  cow(t,o){const f=AC.createBiquadFilter();f.type='bandpass';f.frequency.value=2100;f.Q.value=2;f.connect(o);MI.osc(t,f,'square',545,545,.22,.22);MI.osc(t,f,'square',815,815,.22,.16);},
  bass(t,m,d,o){const s=AC.createOscillator(),w=AC.createWaveShaper(),g=AC.createGain(),c=new Float32Array(256);for(let i=0;i<256;i++){const x=i/128-1;c[i]=Math.tanh(x*2.2);}w.curve=c;
    s.type='sine';s.frequency.setValueAtTime(mN(m)*1.6,t);s.frequency.exponentialRampToValueAtTime(mN(m),t+.05);
    g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.7,t+.01);g.gain.setValueAtTime(.62,t+d*.75);g.gain.exponentialRampToValueAtTime(.001,t+d+.1);s.connect(w).connect(g).connect(o);s.start(t);s.stop(t+d+.15);},
  sqbass(t,m,d,o){const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(900,t);f.frequency.exponentialRampToValueAtTime(260,t+d);f.connect(o);MI.osc(t,f,'square',mN(m),mN(m),d+.05,.3);MI.osc(t,o,'sine',mN(m),mN(m),d+.05,.35);},
  whistle(t,m,d,o){const s=AC.createOscillator(),l=AC.createOscillator(),lg=AC.createGain(),g=AC.createGain();s.type='sine';s.frequency.setValueAtTime(mN(m)*.97,t);s.frequency.linearRampToValueAtTime(mN(m),t+.03);
    l.frequency.value=6.2;lg.gain.value=mN(m)*.012;l.connect(lg).connect(s.frequency);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.16,t+.02);g.gain.setValueAtTime(.14,t+d*.8);g.gain.exponentialRampToValueAtTime(.001,t+d+.06);
    s.connect(g).connect(o);s.start(t);l.start(t);s.stop(t+d+.1);l.stop(t+d+.1);MI.osc(t,o,'triangle',mN(m+12),mN(m+12),d,.025,.02);},
  pluck(t,m,d,o){const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(3800,t);f.frequency.exponentialRampToValueAtTime(500,t+.25);f.connect(o);MI.osc(t,f,'triangle',mN(m),mN(m),.32,.22);MI.osc(t,f,'square',mN(m+12),mN(m+12),.12,.05);},
  saw(t,m,d,o){const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=2300;f.Q.value=3;f.connect(o);for(const dt of [-7,7]){const s=MI.osc(t,f,'sawtooth',mN(m),mN(m),d+.08,.06,.01);s.detune.value=dt;}},
  stab(t,ms,d,o){const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(2600,t);f.frequency.exponentialRampToValueAtTime(700,t+d+.15);f.connect(o);for(const m of ms){const s=MI.osc(t,f,'sawtooth',mN(m),mN(m),d+.12,.055,.004);s.detune.value=(Math.random()-.5)*12;}}};
const pat=(p,bar)=>Array.isArray(p)?p[bar%p.length]:p;
function playStep(S,step,t,spb){const bar=Math.floor(step/16),k=step%16,o=MUSIC.bus;
  for(const [key,fn] of [['kick','kick'],['snare','snare'],['clap','clap'],['cow','cow'],['taiko','taiko'],['rim','rim'],['cym','cym']]){const p=S[key];if(p&&pat(p,bar)[k]==='x')MI[fn](t,o);}
  if(S.hat&&pat(S.hat,bar)[k]==='x')MI.hat(t,o,false);if(S.ohat&&pat(S.ohat,bar)[k]==='x')MI.hat(t,o,true);
  for(const key of ['bass','sqbass','whistle','pluck','saw','koto','flute','brass','tuba']){const p=S[key];if(!p)continue;for(const [st,m,len] of pat(p,bar))if(st===k)MI[key](t,m,len*spb,o);}
  if(S.stab)for(const [st,ms,len] of pat(S.stab,bar))if(st===k)MI.stab(t,ms,len*spb,o);}
function musicTick(){if(!AC||!MUSIC.playing)return;const S=curSong(),spb=60/S.bpm/4,now=AC.currentTime;
  if(MUSIC.next<now-.25)MUSIC.next=now+.05;
  while(MUSIC.next<now+.2){playStep(S,MUSIC.step,MUSIC.next,spb);MUSIC.next+=spb*(MUSIC.step%2?1-S.sw:1+S.sw);MUSIC.step=(MUSIC.step+1)%(S.bars*16);}}
function musicStart(){if(!AC||!MUSIC.on||MUSIC.playing)return;try{
  const g=AC.createGain(),cp=AC.createDynamicsCompressor();cp.threshold.value=-14;cp.ratio.value=4;cp.attack.value=.004;cp.release.value=.2;
  g.gain.setValueAtTime(0,AC.currentTime);g.gain.linearRampToValueAtTime(muGain()*(MUSIC.f||1),AC.currentTime+1.2);g.connect(cp).connect(OUT);
  MUSIC.bus=g;MUSIC.playing=true;MUSIC.step=0;MUSIC.next=AC.currentTime+.08;MUSIC.timer=setInterval(musicTick,25);musicTick();}catch(e){MUSIC.playing=false;}}
function musicStop(fade=.6){if(!MUSIC.playing)return;MUSIC.playing=false;clearInterval(MUSIC.timer);const g=MUSIC.bus;if(!g||!AC)return;
  try{const t=AC.currentTime;g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(g.gain.value,t);g.gain.linearRampToValueAtTime(0,t+fade);setTimeout(()=>{try{g.disconnect();}catch(e){}},fade*1000+400);}catch(e){}}
function musicNext(){if(MUSIC.over){MUSIC.over=null;if(MUSIC.playing){musicStop(.25);setTimeout(musicStart,280);}return;}MUSIC.idx=(MUSIC.idx+1)%SONGS.length;try{localStorage.setItem('tk-song',String(MUSIC.idx));}catch(e){}if(MUSIC.playing){musicStop(.25);setTimeout(musicStart,280);}}
/* ---------- hudba k mapám: Tokio (japonská stupnice, koto, flétna, taiko) a Brno (dechovka) ---------- */
Object.assign(MI,{
  koto(t,m,d,o){const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(5200,t);f.frequency.exponentialRampToValueAtTime(900,t+.5);f.connect(o);
    MI.osc(t,f,'triangle',mN(m)*1.01,mN(m),.9,.2,.002);MI.osc(t,f,'sawtooth',mN(m),mN(m),.18,.05,.002);MI.osc(t,o,'sine',mN(m+12),mN(m+12),.35,.04,.002);},
  flute(t,m,d,o){const s=AC.createOscillator(),l=AC.createOscillator(),lg=AC.createGain(),g=AC.createGain(),f=mN(m);s.type='sine';s.frequency.setValueAtTime(f*.985,t);s.frequency.linearRampToValueAtTime(f,t+.09);
    l.frequency.value=5.2;lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(f*.011,t+Math.min(.5,d*.6));l.connect(lg).connect(s.frequency);
    g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.13,t+.07);g.gain.setValueAtTime(.12,t+Math.max(.08,d*.85));g.gain.exponentialRampToValueAtTime(.001,t+d+.12);s.connect(g).connect(o);s.start(t);l.start(t);s.stop(t+d+.15);l.stop(t+d+.15);
    MI.noise(t,o,Math.min(.3,d),.035,'bandpass',f*2,2);MI.osc(t,o,'triangle',f*2,f*2,d,.012,.06);},
  taiko(t,o){MI.osc(t,o,'sine',120,52,.55,.9,.002);MI.noise(t,o,.08,.25,'lowpass',900);},
  rim(t,o){MI.noise(t,o,.04,.3,'bandpass',2400,6);MI.osc(t,o,'square',1100,900,.03,.05);},
  brass(t,m,d,o){const f=AC.createBiquadFilter();f.type='lowpass';f.Q.value=2;f.frequency.setValueAtTime(500,t);f.frequency.linearRampToValueAtTime(2600,t+.06);f.frequency.exponentialRampToValueAtTime(1500,t+d);f.connect(o);
    for(const dt of [-6,6]){const s=MI.osc(t,f,'sawtooth',mN(m),mN(m),d+.06,.07,.02);s.detune.value=dt;}MI.osc(t,o,'square',mN(m),mN(m),d,.02,.02);},
  tuba(t,m,d,o){const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(700,t);f.frequency.exponentialRampToValueAtTime(320,t+d);f.connect(o);MI.osc(t,f,'sawtooth',mN(m),mN(m),d+.05,.22,.015);MI.osc(t,o,'sine',mN(m),mN(m),d+.05,.3,.01);},
  cym(t,o){MI.noise(t,o,.6,.08,'highpass',6500,.6);}});
function musicPlay(over,f){MUSIC.over=over||null;MUSIC.f=f||1;clearTimeout(MUSIC.swT);if(MUSIC.playing)musicStop(.3);MUSIC.swT=setTimeout(()=>{if(MUSIC.on&&appScr!=='ctrl')musicStart();},MUSIC.playing?350:40);}

const curSong=()=>MUSIC.over&&MAPSONGS[MUSIC.over]?MAPSONGS[MUSIC.over]:SONGS[MUSIC.idx];
function musicSet(over){over=over||null;if(MUSIC.over===over&&(MUSIC.f||1)===1)return;MUSIC.over=over;MUSIC.f=1;
  if(MUSIC.playing){musicStop(.35);clearTimeout(MUSIC.swT);MUSIC.swT=setTimeout(()=>{if(inMenu())musicStart();},400);}}
const inMenu=()=>appScr==='menu'||appScr==='lobby';
['pointerdown','keydown'].forEach(ev=>addEventListener(ev,()=>{if(inMenu()&&MUSIC.on){audio();musicStart();}},{passive:true}));
