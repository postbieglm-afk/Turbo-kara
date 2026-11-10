/* Turbo Kára · audio.js: zvuk */
'use strict';
/* ---------- zvuk ---------- */
let AC=null,NOISE=null,MASTER=null,ENG=[];
function audio(){
  try{
    if(!AC){AC=new (window.AudioContext||window.webkitAudioContext)();MASTER=AC.createGain();MASTER.gain.value=soundOn?1:0;MASTER.connect(AC.destination);
      NOISE=AC.createBuffer(1,AC.sampleRate*0.4,AC.sampleRate);const d=NOISE.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
    if(AC.state==='suspended')AC.resume();
  }catch(e){AC=null}
}
function setSound(on){soundOn=on;try{localStorage.setItem('tk-sound',on?'1':'0');}catch(e){}if(MASTER)MASTER.gain.value=on?1:0;}
function sfx(type){
  const ac=AC;if(!ac)return;const t=ac.currentTime;
  const tone=(f1,f2,dur,vol,wave='sine',delay=0)=>{const o=ac.createOscillator(),g=ac.createGain();o.type=wave;o.frequency.setValueAtTime(f1,t+delay);o.frequency.exponentialRampToValueAtTime(f2,t+delay+dur);
    g.gain.setValueAtTime(0.0001,t);g.gain.setValueAtTime(vol,t+delay);g.gain.exponentialRampToValueAtTime(0.001,t+delay+dur);o.connect(g).connect(MASTER);o.start(t);o.stop(t+delay+dur+.02);};
  const noise=(dur,vol,freq,q=1,type='bandpass')=>{const s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();s.buffer=NOISE;f.type=type;f.frequency.value=freq;f.Q.value=q;
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);s.connect(f).connect(g).connect(MASTER);s.start(t);s.stop(t+dur);};
  if(type==='coin'){tone(988,988,.06,.12,'square');tone(1319,1319,.16,.1,'square',.06);}
  if(type==='box'){tone(520,1040,.18,.1,'triangle');tone(780,1560,.18,.07,'triangle',.08);}
  if(type==='item'){tone(660,660,.08,.1,'square');tone(880,880,.12,.08,'square',.08);}
  if(type==='boost'){noise(.5,.25,900,.6);tone(180,520,.45,.12,'sawtooth');}
  if(type==='oil'){noise(.25,.25,400,1.2);tone(220,90,.2,.12,'sine');}
  if(type==='spin'){noise(.7,.18,1800,2);tone(700,180,.6,.08,'triangle');}
  if(type==='shield'){tone(400,900,.3,.1,'sine');tone(600,1200,.3,.06,'sine',.05);}
  if(type==='pop'){tone(900,300,.15,.1,'square');noise(.12,.2,2500);}
  if(type==='bump'){tone(140,60,.12,.35);noise(.08,.25,700);}
  if(type==='tree'){tone(110,50,.18,.4);noise(.15,.3,500);}
  if(type==='beep'){tone(660,660,.18,.14,'square');}
  if(type==='go'){tone(1320,1320,.45,.16,'square');}
  if(type==='lap'){tone(784,784,.1,.1,'square');tone(1047,1047,.2,.1,'square',.1);}
  if(type==='finish'){[523,659,784,1047].forEach((f,i)=>tone(f,f,.22,.1,'square',i*.12));}
  if(type==='jump'){tone(260,780,.28,.12,'triangle');noise(.2,.12,1400,.7);}
  if(type==='land'){tone(130,50,.16,.38);noise(.14,.3,450);}
  if(type==='cone'){tone(520,240,.09,.12,'square');noise(.1,.22,2200);}
  if(type==='hop'){tone(300,520,.09,.08,'triangle');}
  if(type==='dlvl'){tone(900,1350,.12,.08,'square');}
  if(type==='splash'){noise(.3,.12,1200,.5);}
}
function engineStart(){
  engineStop();if(!AC)return;
  ENG=G.r.map(()=>{const o=AC.createOscillator(),o2=AC.createOscillator(),f=AC.createBiquadFilter(),g=AC.createGain();
    o.type='sawtooth';o2.type='square';f.type='lowpass';f.frequency.value=650;g.gain.value=0;o.connect(f);o2.connect(f);f.connect(g).connect(MASTER);o.start();o2.start();return {o,o2,f,g};});
  windStart();
}
let WINDS=null;
function windStart(){windStop();if(!AC)return;try{const b=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate),d=b.getChannelData(0);let v=0;for(let i=0;i<d.length;i++){v=v*.985+(Math.random()*2-1)*.15;d[i]=v;}
  const s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();s.buffer=b;s.loop=true;f.type='bandpass';f.frequency.value=420;f.Q.value=.6;g.gain.value=0;s.connect(f).connect(g).connect(MASTER);s.start();WINDS={s,f,g};}catch(e){WINDS=null;}}
function windStop(){if(WINDS){try{WINDS.s.stop();WINDS.g.disconnect();}catch(e){}WINDS=null;}}
function engineStop(){ENG.forEach(e=>{try{e.o.stop();e.o2.stop();e.g.disconnect();}catch(x){}});ENG=[];windStop();}
function engineUpdate(){
  if(!AC||!ENG.length)return;const t=AC.currentTime,live=appScr==='game'&&!G.paused&&G.mode!=='over';
  const ref=G.r.find(r=>!r.ai)||G.r[0];
  G.r.forEach((r,i)=>{const e=ENG[i];if(!e)return;const sp=clamp(Math.abs(r.vf)/MAX,0,1.5);
    const f=46+sp*125+(r.boostT>0?28:0)+(r.off?-8:0);
    e.o.frequency.setTargetAtTime(f,t,.06);e.o2.frequency.setTargetAtTime(f*.5,t,.06);e.f.frequency.setTargetAtTime(450+sp*700,t,.1);
    let vol=0;if(live){if(r.ai){const d=Math.hypot(r.x-ref.x,r.y-ref.y);vol=0.022*clamp(1-d/700,0,1)*(.6+sp);}else vol=(G.two?.022:.03)*(.55+sp);}
    e.g.gain.setTargetAtTime(vol,t,.08);});
  if(WINDS){WINDS.g.gain.setTargetAtTime(live?.05+.09*WIND.s:0,t,.4);WINDS.f.frequency.setTargetAtTime(300+380*WIND.s,t,.5);}
}

