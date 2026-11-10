/* Turbo Kára · main.js: hlavní smyčka; tenhle soubor se načítá poslední */
'use strict';
let last=performance.now();
function frame(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;
  if(appScr!=='ctrl'){update(dt);render(now/1000);engineUpdate();padBroadcast(now);localHaptics(now);}
  const pb=document.getElementById('pauseBtn'),showPb=appScr==='game'&&!G.paused&&(G.mode==='race'||G.mode==='count');
  if(pb.hidden===showPb)pb.hidden=!showPb;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
