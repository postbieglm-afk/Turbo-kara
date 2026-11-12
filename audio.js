/* Turbo Kára · audio.js: zvukové efekty a motor: audio() start, sfx(), engineStart/Update/Stop, vítr, klakson, fxMute(). Hudba je v music.js a music-data.js. */
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
  if(!AC)return;const t=AC.currentTime;if(k==='fx'&&MASTER&&!FXMUTE)MASTER.gain.setTargetAtTime(VOL.fx,t,.03);if(k==='mu'&&MUSIC.playing&&MUSIC.bus)MUSIC.bus.gain.setTargetAtTime(muGain()*(MUSIC.f||1),t,.03);}
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
// efekty hry (motor, nárazy…) se po dojetí ztiší; hudba jde mimo ně
let FXMUTE=false;
function fxMute(on){FXMUTE=on;if(!AC||!MASTER)return;const t=AC.currentTime;MASTER.gain.cancelScheduledValues(t);MASTER.gain.setTargetAtTime(on?0:VOL.fx,t,on?.35:.05);}

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
