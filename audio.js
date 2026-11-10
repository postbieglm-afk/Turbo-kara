/* Turbo Kára · audio.js: zvuk */
'use strict';
/* ---------- zvuk ---------- */
let AC=null,NOISE=null,MASTER=null,OUT=null,ENG=[];
const VOL={mu:.3,fx:.8};try{const a=localStorage.getItem('tk-vmu'),b=localStorage.getItem('tk-vfx');if(a!==null&&!isNaN(+a))VOL.mu=Math.min(1,Math.max(0,+a));if(b!==null&&!isNaN(+b))VOL.fx=Math.min(1,Math.max(0,+b));}catch(e){}
function audio(){
  try{
    if(!AC){AC=new (window.AudioContext||window.webkitAudioContext)();OUT=AC.createGain();OUT.gain.value=soundOn?1:0;OUT.connect(AC.destination);MASTER=AC.createGain();MASTER.gain.value=VOL.fx;MASTER.connect(OUT);
      NOISE=AC.createBuffer(1,AC.sampleRate*0.4,AC.sampleRate);const d=NOISE.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
    if(AC.state==='suspended')AC.resume();
  }catch(e){AC=null}
}
function setSound(on){soundOn=on;try{localStorage.setItem('tk-sound',on?'1':'0');}catch(e){}if(OUT)OUT.gain.value=on?1:0;}
// 100 % hudby = původní hlasitost, výchozí 30 % je zhruba o 16 dB tišší
const muGain=()=>.5*Math.pow(VOL.mu,1.5);
function setVol(k,v){VOL[k]=Math.min(1,Math.max(0,v));try{localStorage.setItem(k==='mu'?'tk-vmu':'tk-vfx',String(VOL[k]));}catch(e){}
  if(!AC)return;const t=AC.currentTime;if(k==='fx'&&MASTER)MASTER.gain.setTargetAtTime(VOL.fx,t,.03);if(k==='mu'&&MUSIC.playing&&MUSIC.bus)MUSIC.bus.gain.setTargetAtTime(muGain(),t,.03);}
function sfx(type){
  const ac=AC;if(!ac||appScr!=='game')return;const t=ac.currentTime;
  // tón s měkkým náběhem; ‚bell' = sinus + tichá oktáva, zní jako zvonek, ne jako pípák
  const tone=(f1,f2,dur,vol,wave='sine',delay=0,att=.004)=>{const o=ac.createOscillator(),g=ac.createGain(),t0=t+delay;o.type=wave;o.frequency.setValueAtTime(f1,t0);if(f2!==f1)o.frequency.exponentialRampToValueAtTime(f2,t0+dur);
    g.gain.setValueAtTime(0.0001,t0);g.gain.linearRampToValueAtTime(vol,t0+att);g.gain.exponentialRampToValueAtTime(0.0008,t0+dur);o.connect(g).connect(MASTER);o.start(t0);o.stop(t0+dur+.03);};
  const bell=(f,dur,vol,delay=0)=>{tone(f,f,dur,vol,'sine',delay,.003);tone(f*2.01,f*2.01,dur*.5,vol*.25,'sine',delay,.003);tone(f*3.02,f*3.02,dur*.25,vol*.08,'sine',delay,.002);};
  // šum s filtrem; f2 = kam filtr dojede (svist, skřípění)
  const noise=(dur,vol,freq,q=1,type='bandpass',delay=0,f2=0,att=.003)=>{const s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain(),t0=t+delay;s.buffer=NOISE;s.loop=true;f.type=type;
    f.frequency.setValueAtTime(freq,t0);if(f2)f.frequency.exponentialRampToValueAtTime(f2,t0+dur);f.Q.value=q;
    g.gain.setValueAtTime(0.0001,t0);g.gain.linearRampToValueAtTime(vol,t0+att);g.gain.exponentialRampToValueAtTime(0.0008,t0+dur);s.connect(f).connect(g).connect(MASTER);s.start(t0,Math.random()*.3);s.stop(t0+dur+.03);};
  // tupý náraz: krátký pokles basu + kus šumu
  const thud=(f,dur,vol,delay=0)=>{tone(f,f*.45,dur,vol,'sine',delay,.002);noise(dur*.6,vol*.5,f*3,.8,'lowpass',delay);};
  switch(type){
    case 'coin':bell(1568,.22,.07);bell(2093,.35,.06,.055);break;
    case 'box':noise(.35,.05,2500,4,'bandpass',0,6000,.02);bell(880,.2,.035,.03);bell(1320,.25,.03,.09);break;
    case 'item':bell(1175,.18,.06);bell(1568,.3,.05,.07);break;
    case 'boost':noise(.75,.16,500,1.4,'bandpass',0,3800,.03);noise(.5,.09,180,.7,'lowpass',0,0,.02);tone(70,140,.5,.08,'sine',0,.03);break;
    case 'oil':noise(.28,.14,300,2,'bandpass',0,900);thud(160,.16,.14);break;
    case 'spin':noise(.9,.1,1700,6,'bandpass',0,900,.03);noise(.9,.06,2600,8,'bandpass',.05,1400,.04);break;
    case 'shield':tone(220,440,.5,.05,'sine',0,.08);tone(330,660,.5,.035,'triangle',.03,.08);noise(.4,.03,3000,3,'bandpass',0,6000,.05);break;
    case 'pop':noise(.25,.1,3500,1.5,'bandpass',0,1500);bell(660,.25,.04);break;
    case 'bump':thud(110,.2,.28);noise(.12,.12,1100,1.2);noise(.25,.035,3200,12,'bandpass',.01);break;
    case 'tree':thud(85,.28,.34);noise(.18,.16,900,1);noise(.4,.04,2400,14,'bandpass',.015);noise(.3,.03,3900,16,'bandpass',.02);break;
    case 'beep':tone(880,880,.22,.07,'triangle',0,.006);tone(880,880,.22,.035,'sine');break;
    case 'go':tone(1760,1760,.5,.06,'triangle',0,.006);tone(880,880,.5,.05,'sine');break;
    case 'lap':bell(1047,.3,.06);bell(1319,.45,.055,.11);break;
    case 'finish':[523,659,784,1047].forEach((f,i)=>bell(f,.6,.06,i*.13));tone(262,262,1,.05,'triangle',.39,.02);break;
    case 'jump':noise(.45,.1,400,1.2,'bandpass',0,2600,.04);thud(120,.12,.12);break;
    case 'land':thud(70,.3,.4);noise(.2,.1,600,.8,'lowpass');break;
    case 'cone':tone(380,240,.08,.12,'triangle',0,.002);noise(.08,.1,1800,2);thud(150,.1,.1,.01);break;
    case 'hop':thud(140,.1,.12);break;
    case 'dlvl':bell(2350+Math.random()*80,.12,.025);break;
    case 'cluck':[0,.13,.27].forEach((d,k)=>{const f=k<2?640:560;tone(f,f*(k<2?1.45:1.9),k<2?.07:.2,.12,'square',d,.004);tone(f*2.1,f*2.6,k<2?.05:.14,.04,'sine',d,.004);noise(k<2?.05:.12,.05,1800,2,'bandpass',d);});break;
    case 'door':noise(1.1,.12,260,1.5,'bandpass',0,520,.05);for(let k=0;k<9;k++)noise(.04,.05,1400,4,'bandpass',k*.12);break;
    case 'doorclose':thud(90,.25,.25);noise(.2,.08,500,1);break;
    case 'splash':noise(.4,.09,1400,.6,'bandpass',0,600,.02);break;
  }
}
/* ---------- motor: otáčky s řazením, dva zázněje pily + sub, saturace a filtr podle plynu; k tomu pneumatiky a podvozek ---------- */
const GEARS=[0,.16,.33,.52,.74,1.02,9];
function loopNoise(){const b=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;const s=AC.createBufferSource();s.buffer=b;s.loop=true;return s;}
function engineStart(){
  engineStop();if(!AC)return;
  const curve=new Float32Array(512);for(let i=0;i<512;i++){const x=i/256-1;curve[i]=Math.tanh(x*2.4)*.85;}
  ENG=G.r.map(r=>{const full=!r.ai,g=AC.createGain(),lp=AC.createBiquadFilter(),ws=AC.createWaveShaper(),mix=AC.createGain();
    ws.curve=curve;lp.type='lowpass';lp.Q.value=.9;lp.frequency.value=400;g.gain.value=0;mix.gain.value=.55;
    const o=AC.createOscillator(),o2=AC.createOscillator(),sub=AC.createOscillator(),sg=AC.createGain();
    o.type='sawtooth';o2.type='sawtooth';o2.detune.value=14;sub.type='sine';sg.gain.value=full?.9:.6;
    o.connect(mix);o2.connect(mix);sub.connect(sg).connect(mix);mix.connect(ws).connect(lp).connect(g).connect(MASTER);o.start();o2.start();sub.start();
    const e={o,o2,sub,lp,g,rpm:900,gear:1,dip:0,full};
    if(full){// sání: šum laděný s otáčkami; pneumatiky: skřípění; podvozek: dunění mimo silnici
      const n=loopNoise(),nf=AC.createBiquadFilter(),ng=AC.createGain();nf.type='bandpass';nf.Q.value=1.4;ng.gain.value=0;n.connect(nf).connect(ng).connect(MASTER);
      const sk=loopNoise(),sf=AC.createBiquadFilter(),sf2=AC.createBiquadFilter(),skg=AC.createGain();sf.type='bandpass';sf.frequency.value=1500;sf.Q.value=5;sf2.type='peaking';sf2.frequency.value=2600;sf2.Q.value=6;sf2.gain.value=8;skg.gain.value=0;sk.connect(sf).connect(sf2).connect(skg).connect(MASTER);
      const rb=loopNoise(),rf=AC.createBiquadFilter(),rg=AC.createGain();rf.type='lowpass';rf.frequency.value=160;rf.Q.value=1.2;rg.gain.value=0;rb.connect(rf).connect(rg).connect(MASTER);
      n.start();sk.start();rb.start();Object.assign(e,{n,nf,ng,sk,sf,skg,rb,rf,rg});}
    return e;});
  windStart();
}
let WINDS=null;
function windStart(){windStop();if(!AC)return;try{const b=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate),d=b.getChannelData(0);let v=0;for(let i=0;i<d.length;i++){v=v*.985+(Math.random()*2-1)*.15;d[i]=v;}
  const s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();s.buffer=b;s.loop=true;f.type='bandpass';f.frequency.value=420;f.Q.value=.6;g.gain.value=0;s.connect(f).connect(g).connect(MASTER);s.start();WINDS={s,f,g};}catch(e){WINDS=null;}}
function windStop(){if(WINDS){try{WINDS.s.stop();WINDS.g.disconnect();}catch(e){}WINDS=null;}}
function engineStop(){ENG.forEach(e=>{try{e.o.stop();e.o2.stop();e.sub.stop();e.g.disconnect();if(e.full){e.n.stop();e.sk.stop();e.rb.stop();e.ng.disconnect();e.skg.disconnect();e.rg.disconnect();}}catch(x){}});ENG=[];windStop();}
/* ---------- hudba v menu: vlastní crunk a hip-hop skladby generované v prohlížeči ---------- */
const MUSIC={on:true,idx:0,playing:false,step:0,next:0,timer:null,bus:null};
try{if(localStorage.getItem('tk-music')==='0')MUSIC.on=false;const v=+localStorage.getItem('tk-song');if(v>=0&&v<4)MUSIC.idx=v;}catch(e){}
const mN=m=>440*Math.pow(2,(m-69)/12);
// skladby: vzory po šestnáctinách (x = úder), noty [krok, midi, délka v krocích]
const SONGS=[
  {name:'GARÁŽ',bpm:100,sw:.1,bars:4,
    kick:['x.....x.x.......','x.....x.x..x....','x.....x.x.......','x.....x.x...x.x.'],clap:'....x.......x...',snare:'....x.......x...',
    hat:['x.x.x.x.x.x.x.x.','x.x.x.x.x.x.x.x.','x.x.x.x.x.x.x.x.','x.x.x.x.x.xxxxxx'],ohat:'..............x.',
    bass:[[[0,28,6],[6,28,2],[8,35,4],[12,33,4]],[[0,28,6],[6,31,2],[8,26,8]]],
    whistle:[[[0,76,3],[3,76,1],[4,79,2],[6,76,2],[8,74,4],[12,71,2],[14,74,2]],[[0,76,3],[3,76,1],[4,79,2],[6,81,2],[8,79,6]],
      [[0,76,3],[3,76,1],[4,79,2],[6,76,2],[8,74,4],[12,71,2],[14,74,2]],[[0,83,2],[2,81,2],[4,79,2],[6,76,2],[8,74,2],[10,76,6]]],
    stab:[[[0,[64,67,71],2]],[],[[0,[62,67,71],2]],[]]},
  {name:'NEON DRIFT',bpm:140,sw:0,bars:4,
    kick:['x.........x.....','x.....x...x..x..'],snare:'........x.......',clap:'........x.......',
    hat:['x.x.x.x.xxx.x.x.','x.x.xxx.x.x.xxxx'],ohat:'......x.........',
    bass:[[[0,33,8],[10,33,3],[13,36,3]],[[0,31,8],[10,28,6]]],
    pluck:[[[0,69,2],[2,72,2],[4,76,2],[6,72,2],[8,74,2],[10,72,2],[12,69,2],[14,67,2]],[[0,69,2],[2,72,2],[4,76,2],[6,79,2],[8,77,2],[10,76,2],[12,74,2],[14,72,2]],
      [[0,69,2],[2,72,2],[4,76,2],[6,72,2],[8,74,2],[10,72,2],[12,69,2],[14,67,2]],[[0,65,2],[2,69,2],[4,72,2],[6,76,2],[8,74,8]]]},
  {name:'BOUNCE',bpm:104,sw:.12,bars:4,
    kick:'x..x..x...x..x..',clap:'....x.......x...',hat:'xxx.xxx.xxx.xxxx',cow:'x..x..x...x.x...',
    sqbass:[[[0,31,2],[3,31,1],[4,43,1],[6,31,2],[8,34,2],[10,36,2],[12,38,2],[14,36,2]],[[0,29,2],[3,29,1],[4,41,1],[6,29,2],[8,33,2],[10,34,2],[12,36,2],[14,34,2]]],
    stab:[[[2,[67,70,74],1],[6,[67,70,74],1],[10,[67,70,74],1],[14,[67,70,74],1]],[[2,[65,69,72],1],[6,[65,69,72],1],[10,[65,69,72],1],[14,[65,69,72],1]]],
    saw:[[],[],[[0,79,2],[2,77,2],[4,74,4],[8,77,2],[10,79,2],[12,82,4]],[[0,81,2],[2,79,2],[4,77,2],[6,74,2],[8,72,8]]]},
  {name:'PODZEMKA',bpm:90,sw:.08,bars:4,
    kick:['x.......x.x.....','x.....x...x.....'],snare:'....x.......x...',clap:'............x...',hat:'x.xxx.x.x.xxx.x.',ohat:'......x.........',
    bass:[[[0,26,7],[8,26,3],[11,29,5]],[[0,24,7],[8,24,3],[11,22,5]]],
    stab:[[[0,[62,65,69],2],[3,[62,65,69],1],[6,[60,64,67],2]],[[0,[58,62,65],2],[3,[58,62,65],1],[6,[57,60,64],4]]],
    whistle:[[],[],[[8,74,2],[10,77,2],[12,81,4]],[[8,79,2],[10,77,2],[12,74,4]]]}];
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
  g.gain.setValueAtTime(0,AC.currentTime);g.gain.linearRampToValueAtTime(muGain(),AC.currentTime+1.2);g.connect(cp).connect(OUT);
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
const MAPSONGS=(()=>{
  // TOKIO · SAKURA: stupnice in (D, Es, G, A, B), koto rozkládá, šakuhači vede melodii
  const kA=[[0,62,2],[2,69,2],[4,74,2],[6,75,2],[8,69,2],[10,74,2],[12,79,2],[14,74,2]],kB=[[0,55,2],[2,62,2],[4,67,2],[6,70,2],[8,62,2],[10,67,2],[12,69,2],[14,67,2]];
  const bA=[[0,38,7],[8,38,7]],bB=[[0,43,7],[8,43,7]];
  const tokyo={name:'SAKURA',bpm:80,sw:0,bars:8,taiko:['x.....x...x.....','x.....x...x..x.x'],rim:'....x.......x...',hat:'..x...x...x...x.',
    koto:[kA,kA,kB,kA,kA,kB,kB,kA],bass:[bA,bA,bB,bA,bA,bB,bB,bA],
    flute:[[[0,81,6],[6,82,2],[8,81,4],[12,79,4]],[[0,75,6],[6,74,2],[8,74,8]],[[0,74,3],[3,75,1],[4,79,4],[8,81,6],[14,79,2]],[[0,82,4],[4,81,4],[8,79,8]],
      [[0,86,6],[6,82,2],[8,81,4],[12,82,2],[14,81,2]],[[0,79,4],[4,75,4],[8,79,8]],[[0,75,2],[2,74,2],[4,70,4],[8,74,4],[12,75,4]],[[0,74,14]]]};
  // BRNO · DECHOVKA: polka v B dur, tuba na dobu, akordy na zadní dobu, trubka melodii
  const CH={B:[[46,41],[58,62,65]],F:[[41,36],[57,60,63]],E:[[39,46],[55,58,63]]},seq='BFBFEBFB'.split('');
  const brno={name:'DECHOVKA',bpm:124,sw:.04,bars:8,kick:'x.......x.......',snare:'....x.......x...',cym:['','','','','','','','x...............'].map(p=>p||'................'),
    tuba:seq.map(c=>[[0,CH[c][0][0],3],[8,CH[c][0][1],3]]),stab:seq.map(c=>[[4,CH[c][1],2],[12,CH[c][1],2]]),
    brass:[[[0,65,2],[2,67,2],[4,69,2],[6,70,2],[8,74,4],[12,70,4]],[[0,72,2],[2,70,2],[4,69,2],[6,67,2],[8,65,8]],[[0,62,2],[2,65,2],[4,70,4],[8,69,2],[10,70,2],[12,72,4]],[[0,74,6],[6,72,2],[8,69,8]],
      [[0,67,2],[2,70,2],[4,75,4],[8,74,2],[10,72,2],[12,70,4]],[[0,74,2],[2,72,2],[4,70,2],[6,69,2],[8,70,4],[12,65,4]],[[0,72,4],[4,69,2],[6,72,2],[8,77,4],[12,75,4]],[[0,74,4],[4,72,2],[6,69,2],[8,70,8]]]};
  return {tokyo,brno};})();
const curSong=()=>MUSIC.over&&MAPSONGS[MUSIC.over]?MAPSONGS[MUSIC.over]:SONGS[MUSIC.idx];
function musicSet(over){over=over||null;if(MUSIC.over===over)return;MUSIC.over=over;
  if(MUSIC.playing){musicStop(.35);clearTimeout(MUSIC.swT);MUSIC.swT=setTimeout(()=>{if(inMenu())musicStart();},400);}}
const inMenu=()=>appScr==='menu'||appScr==='lobby';
['pointerdown','keydown'].forEach(ev=>addEventListener(ev,()=>{if(inMenu()&&MUSIC.on){audio();musicStart();}},{passive:true}));

// klakson: dva tóny (G a H) přes zkreslení a pásmovou propust; kuře místo toho kdáká
const HORNS=[null,null];
function hornUpdate(){if(!AC||typeof hornWant!=='function')return;const want=hornWant(),t=AC.currentTime;
  for(let i=0;i<2;i++){const r=G.r[i],on=!!want[i],h=HORNS[i];
    if(on&&!h){if(r&&r.chicken){sfx('cluck');HORNS[i]={ck:true,next:t+.55};continue;}
      const g=AC.createGain(),bp=AC.createBiquadFilter(),ws=AC.createWaveShaper(),c=new Float32Array(256);for(let k=0;k<256;k++){const x=k/128-1;c[k]=Math.tanh(x*3);}ws.curve=c;
      bp.type='bandpass';bp.frequency.value=1100;bp.Q.value=.8;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(G.two?.1:.13,t+.02);
      const os=[392,494].map(f=>{const o=AC.createOscillator();o.type='sawtooth';o.frequency.value=f;o.connect(ws);o.start(t);return o;});ws.connect(bp).connect(g).connect(MASTER);HORNS[i]={os,g};}
    else if(on&&h&&h.ck){if(t>h.next){sfx('cluck');h.next=t+.55;}}
    else if(!on&&h){if(!h.ck){h.g.gain.cancelScheduledValues(t);h.g.gain.setValueAtTime(h.g.gain.value,t);h.g.gain.linearRampToValueAtTime(0,t+.06);h.os.forEach(o=>o.stop(t+.08));}HORNS[i]=null;}}}
function engineUpdate(){hornUpdate();
  if(!AC||!ENG.length)return;const t=AC.currentTime,live=appScr==='game'&&!G.paused&&G.mode!=='over';
  const ref=G.r.find(r=>!r.ai)||G.r[0],now=performance.now()/1000,dt=Math.min(.1,now-(engineUpdate.t||now));engineUpdate.t=now;
  G.r.forEach((r,i)=>{const e=ENG[i];if(!e)return;const sp=clamp(Math.abs(r.vf)/(MAX*1.15),0,1.3),thr=r.thr&&r.spinT<=0?1:0,air=r.z>0;
    // převodovka: řadí nahoru i dolů podle rychlosti, při přeřazení krátce poklesne plyn
    let gi=1;while(gi<GEARS.length-1&&sp>GEARS[gi])gi++;
    if(gi!==e.gear){if(gi>e.gear)e.dip=.14;e.gear=gi;}
    const lo=GEARS[gi-1],hi=GEARS[gi],u=clamp((sp-lo)/(hi-lo),0,1);
    let target=gi===1?900+u*5600:2900+u*4100;
    if(air&&thr)target=Math.max(target,6800);else if(!thr)target=Math.max(900,target*.92);
    if(r.boostT>0)target+=500;if(r.off&&!air&&sp>.1)target+=Math.sin(now*31+i)*120;
    e.rpm+=(target-e.rpm)*clamp(dt*(target>e.rpm?7:4),0,1);if(e.dip>0)e.dip-=dt;
    const rn=clamp((e.rpm-900)/6300,0,1),f=e.rpm/30,load=thr?(e.dip>0?.35:1):.25;
    e.o.frequency.setTargetAtTime(f,t,.03);e.o2.frequency.setTargetAtTime(f,t,.03);e.sub.frequency.setTargetAtTime(f*.5,t,.03);
    e.lp.frequency.setTargetAtTime(220+f*(2.2+2.8*load)+(r.boostT>0?600:0),t,.05);
    let vol=0;
    if(live){if(r.ai){const d=Math.hypot(r.x-ref.x,r.y-ref.y);vol=.03*clamp(1-d/650,0,1)*(.5+.5*rn);}
      else vol=(G.two?.034:.05)*(.42+.33*load+.25*rn);}
    e.g.gain.setTargetAtTime(vol,t,.05);
    if(e.full){const k=live?1:0,c=Math.cos(r.ang),s=Math.sin(r.ang),slip=Math.abs(-r.vx*s+r.vy*c);
      e.nf.frequency.setTargetAtTime(f*3.2,t,.05);e.ng.gain.setTargetAtTime(k*(G.two?.6:1)*.012*load*(.3+rn),t,.06);
      // pneumatiky: drift, smyk do strany a roztočení; ve vzduchu ticho
      const sq=air?0:Math.max(r.drift?.55+.25*Math.min(1,r.driftT/2):0,clamp((slip-70)/260,0,1),r.spinT>0?.8:0);
      e.skg.gain.setTargetAtTime(k*(G.two?.6:1)*.05*sq*clamp(Math.hypot(r.vx,r.vy)/200,0,1),t,.05);e.sf.frequency.setTargetAtTime(1250+500*sq+Math.sin(now*9+i)*90,t,.05);
      // dunění podvozku: hlavně mimo silnici, slabě i na asfaltu
      e.rg.gain.setTargetAtTime(k*(G.two?.6:1)*(air?0:(r.off?.16:.025))*clamp(sp*1.4,0,1),t,.08);e.rf.frequency.setTargetAtTime(r.off?220:120,t,.1);}});
  if(WINDS){WINDS.g.gain.setTargetAtTime(live?.03+.06*WIND.s+.05*clamp(Math.abs(ref.vf)/MAX,0,1.3):0,t,.4);WINDS.f.frequency.setTargetAtTime(300+380*WIND.s+300*clamp(Math.abs(ref.vf)/MAX,0,1),t,.5);}
}

