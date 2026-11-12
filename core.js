/* Turbo Kára · core.js: základ: konstanty, barvy, velikost plátna, pomocné funkce */
'use strict';
const cv=document.getElementById('cv'),ctx=cv.getContext('2d');
const ov=document.getElementById('ov'),card=document.getElementById('card'),probe=document.getElementById('probe');
const C={grass:'#5f9a42',verge:'#a99a70',road:'#4d5864',line:'#ece8da',curbR:'#d8432f',curbW:'#f4f1e6',sand:'#dcc891',water:'#3f8fb8',waterDk:'#2f749c',
  tree:'#2f6b2a',treeLt:'#418d36',treeHi:'#62ad4b',pine:'#1d4f30',pineLt:'#2c6a40',fg:'#f2f0e3',muted:'#aab9a4',gold:'#f2c14e',goldDk:'#b9862a',
  side:'#b4473e',kerb:'#c9c6bd',boost:'#f07a24',sky:'#5cc8f2',panel:'rgba(12,22,15,.72)',
  p1:'#e5483b',p1dk:'#9e2b22',p2:'#2f8fd6',p2dk:'#1b5a8a',ai:'#9a6bea',aidk:'#5e3fa3'};
const LAPS=3,HALF=80,MAX=430,ACC=330,BRAKE=360,TURN=2.9;
const OFF_DELAY=2,GRAV=900;
let SHAKE=1;try{if(matchMedia('(prefers-reduced-motion:reduce)').matches)SHAKE=.35;}catch(e){}
const COIN_PCT=.002,COIN_MAX=Infinity,coinMul=c=>1+COIN_PCT*Math.min(c,COIN_MAX);
const SHIELD_T=12;
const IT_NONE=0,IT_NITRO=1,IT_OIL=2,IT_SHIELD=3,IT_NAMES=['','NITRO','OLEJ','ŠTÍT'];
const DIFFS={easy:{n:'Snadná',spd:.84},norm:{n:'Normální',spd:.93},hard:{n:'Těžká',spd:1.0}};
let R3=null;
let W=0,H=0,safeT=0,safeB=0,safeL=0,safeR=0,touchMode=false,lastMode='one',soundOn=true,diff='norm';
try{const d=localStorage.getItem('tk-diff');if(d&&DIFFS[d])diff=d;if(localStorage.getItem('tk-sound')==='0')soundOn=false;}catch(e){}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),TAU=Math.PI*2;
const angDiff=(a,b)=>{let d=(a-b)%TAU;if(d>Math.PI)d-=TAU;if(d<-Math.PI)d+=TAU;return d;};
const cssVar=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
let DISP=cssVar('--display'),UIF=cssVar('--ui'),HUDF="'Chakra Petch','Barlow Condensed',sans-serif";
try{document.fonts&&document.fonts.ready.then(()=>{DISP=cssVar('--display');UIF=cssVar('--ui');});}catch(e){}

function resize(){
  const dpr=Math.min(1.5,window.devicePixelRatio||1); // strop 1,5×: na Retině/4K o polovinu méně pixelů, text je pořád ostrý
  W=cv.clientWidth;H=cv.clientHeight;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const cs=getComputedStyle(probe);safeT=parseFloat(cs.paddingTop)||0;safeB=parseFloat(cs.paddingBottom)||0;
  safeL=parseFloat(cs.paddingLeft)||0;safeR=parseFloat(cs.paddingRight)||0;
  if(R3)R3.renderer.setSize(W,H,false);
}
addEventListener('resize',resize);resize();
function setTouch(on){touchMode=on;document.body.classList.toggle('touch',on);}
try{if(matchMedia('(pointer:coarse)').matches)setTouch(true);}catch(e){}

function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

