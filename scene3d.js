/* Turbo Kára · scene3d.js: sestavení 3D scény: VIEW/toggleView() pohled, disposeScene(), build3D() (nebe, silnice, domy, cedule, lampy, stromy, dominanty Brna, chodci, auta, kokpit, částice, garáž); na konci se scéna hned postaví. Geometrie domů je ve scene-geo.js, vykreslování ve scene-render.js. */
'use strict';
/* ---------- 3D svět (three.js); když WebGL nejde, hra kreslí 2D pohled shora ---------- */
const VIEW=['fp','fp'];
try{const v=localStorage.getItem('tk-view');if(v==='chase'||v==='fp'){VIEW[0]=VIEW[1]=v;}}catch(e){}
function toggleView(i){VIEW[i]=VIEW[i]==='fp'?'chase':'fp';try{localStorage.setItem('tk-view',VIEW[i]);}catch(e){}}
const gl=document.getElementById('gl');
function disposeScene(R){if(R.gar){const g0=R.gar.S;R.gar=null;disposeScene({S:g0});}R.S.traverse(o=>{if(o.geometry)o.geometry.dispose();const ms=Array.isArray(o.material)?o.material:o.material?[o.material]:[];ms.forEach(m=>{if(m.map)m.map.dispose();m.dispose();});});}
function build3D(reuse){
  if(!window.THREE)return null;
  let renderer=reuse&&reuse.renderer;
  if(!renderer){
    try{renderer=new THREE.WebGLRenderer({canvas:gl,antialias:!touchMode,powerPreference:'high-performance'});if(!renderer.getContext())return null;}catch(e){return null;}
    DYN.cap=Math.min(window.devicePixelRatio||1,1.5);DYN.pr=Math.min(DYN.pr||DYN.cap,DYN.cap);renderer.setPixelRatio(DYN.pr);renderer.setSize(W,H,false);
  }
  // atmosféra: Tokio v noci (neony, lampy), Brno při západu slunce
  const NIGHT=TRK.id!=='brno';
  const ENV=NIGHT?{bg:'#0a1022',fog:['#0c1328',560,4000],sky:['#03060f','#1f2f5e'],hemi:[0x93aae6,0x1f2330,.66],sun:[0xb2c4ff,.32,[-.5,1,-.3]],win:1,glow:1,cloud:0x2a3454}
    :{bg:'#e9b48c',fog:['#d9a37f',800,4600],sky:['#4a6aa6','#f7b37a'],hemi:[0xffdcb8,0x5a4a44,.72],sun:[0xffb26b,.95,[-1,.42,-.25]],win:.4,glow:.4,cloud:0xf3c9a8};
  const S=new THREE.Scene();S.background=new THREE.Color(ENV.bg);S.fog=new THREE.Fog(ENV.fog[0],ENV.fog[1],ENV.fog[2]);
  S.add(new THREE.HemisphereLight(ENV.hemi[0],ENV.hemi[1],ENV.hemi[2]));
  const sun=new THREE.DirectionalLight(ENV.sun[0],ENV.sun[1]);sun.position.set(...ENV.sun[2]);S.add(sun);
  const aniso=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  const tex=(w,h,draw,rep)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');draw(g,w,h);
    const t=new THREE.CanvasTexture(c);if(rep)t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=aniso;t.redraw=()=>{draw(g,w,h);t.needsUpdate=true;};return t;};
  const up=new THREE.Vector3(0,1,0),m4=new THREE.Matrix4(),qt=new THREE.Quaternion(),sc=new THREE.Vector3(),ps=new THREE.Vector3(),cc=new THREE.Color();
  const cx0=(T.minX+T.maxX)/2,cz0=(T.minY+T.maxY)/2;
  // obloha
  const skyG=new THREE.SphereGeometry(5600,24,12),sp=skyG.attributes.position,cols=[],top=new THREE.Color(ENV.sky[0]),hor=new THREE.Color(ENV.sky[1]);
  for(let i=0;i<sp.count;i++){const k=clamp(sp.getY(i)/5600,0,1);const c=hor.clone().lerp(top,Math.pow(k,.55));cols.push(c.r,c.g,c.b);}
  skyG.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));
  const sky=new THREE.Mesh(skyG,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false,depthWrite:false}));sky.renderOrder=-1;S.add(sky);
  if(NIGHT){const R=rng(91),sp2=[];for(let i=0;i<700;i++){const a=R()*TAU,e=.08+R()*1.35,r0=5200;sp2.push(Math.cos(a)*Math.cos(e)*r0,Math.sin(e)*r0,Math.sin(a)*Math.cos(e)*r0);}
    const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(sp2,3));sky.add(new THREE.Points(sg,new THREE.PointsMaterial({color:0xdfe8ff,size:1.6,sizeAttenuation:false,fog:false,transparent:true,opacity:.8,depthWrite:false})));}
  sky.traverse(o=>{if(o.material)o.material.userData.noTerr=true;});
  const shG=new THREE.CircleGeometry(1,14);shG.rotateX(-Math.PI/2);
  const ADD=THREE.AdditiveBlending;
  const glowT=tex(64,64,(g,w,h)=>{const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.25,'rgba(255,255,255,.5)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);});
  // svítící okna: z fasády se vyberou jen rozsvícená okna a použijí se jako emisní mapa
  const emiFrom=t=>{try{const c0=t.image,c=document.createElement('canvas');c.width=c0.width;c.height=c0.height;const g=c.getContext('2d');g.drawImage(c0,0,0);
    const d=g.getImageData(0,0,c.width,c.height),p=d.data;for(let i=0;i<p.length;i+=4){if(!(p[i]>225&&p[i+1]>200&&p[i+2]<195)){p[i]=p[i+1]=p[i+2]=0;}}g.putImageData(d,0,0);
    const e=new THREE.CanvasTexture(c);e.wrapS=t.wrapS;e.wrapT=t.wrapT;e.repeat.copy(t.repeat);return e;}catch(e){return null;}};
  const clouds=[];let lanterns=null;
  // dlažba mezi domy
  const grT=tex(128,128,g=>g.drawImage(groundCanvas,0,0),true);grT.repeat.set(16000/160,16000/160);
  let ground;if(TERR){const gg=new THREE.PlaneGeometry(16000,16000,160,160);gg.rotateX(-Math.PI/2);{const pp=gg.attributes.position,cl=new Float32Array(pp.count*3),LK=CITY.lm,parks=[[LK.sp,560,330],[LK.pe,300,170],[LK.de,190,100]];
    for(let i=0;i<pp.count;i++){const x=pp.getX(i)+cx0,z=pp.getZ(i)+cz0;let w=0;for(const [p,r1,r0] of parks){const q=clamp((r1-Math.hypot(x-p.x,z-p.y))/(r1-r0),0,1);w=Math.max(w,q*q*(3-2*q));}
      cl[i*3]=1-.38*w;cl[i*3+1]=1-.16*w;cl[i*3+2]=1-.5*w;}
    gg.setAttribute('color',new THREE.BufferAttribute(cl,3));}
    const gm=new THREE.MeshLambertMaterial({map:grT,vertexColors:true});gm.userData.terrN=true;ground=new THREE.Mesh(gg,gm);ground.position.set(cx0,-1,cz0);}
  else{ground=new THREE.Mesh(new THREE.PlaneGeometry(16000,16000),new THREE.MeshLambertMaterial({map:grT}));ground.rotation.x=-Math.PI/2;ground.position.set(cx0,0,cz0);}
  S.add(ground);
  // ulice jako pás podél středové čáry
  const strip=(o1,o2,y,vScale,filter,K)=>{K=K||1;const pos=[],uv=[],idx=[];let n=0;
    for(let i=0;i<N;i++){if(filter&&!filter(i))continue;const j=T.nxt?T.nxt[i]:(i+1)%N;if(j<0)continue;
      for(let k=0;k<K;k++){const ua=k/K,ub=(k+1)/K,oa=o1+(o2-o1)*ua,ob=o1+(o2-o1)*ub;
      [[i,oa,ua,i],[i,ob,ub,i],[j,oa,ua,i+1],[j,ob,ub,i+1]].forEach(([q,o,u,vv])=>{pos.push(T.x[q]+T.nx(q)*o,y,T.y[q]+T.ny(q)*o);uv.push(u,vv*DS/vScale);});
      idx.push(n,n+2,n+1,n+1,n+2,n+3);n+=4;}}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;};
  const asphT=tex(128,256,(g,w,h)=>{g.fillStyle='#4d5864';g.fillRect(0,0,w,h);const R=rng(5);
    for(let i=0;i<1100;i++){g.fillStyle=R()<.5?'rgba(255,255,255,.06)':'rgba(0,0,0,.09)';g.fillRect(R()*w,R()*h,1.5,1.5);}
    g.fillStyle='rgba(0,0,0,.07)';g.fillRect(w*.28,0,w*.44,h);
    g.fillStyle='#f0eee6';g.fillRect(5,0,3,h);g.fillRect(w-8,0,3,h);g.fillStyle='rgba(240,238,230,.45)';g.fillRect(w/2-1.5,0,3,h*.46);},true);
  const sideT=tex(64,64,(g,w,h)=>{g.fillStyle=TRK.sideC;g.fillRect(0,0,w,h);g.strokeStyle='rgba(60,10,8,.35)';g.lineWidth=2;
    for(let i=0;i<=64;i+=16){g.beginPath();g.moveTo(i,0);g.lineTo(i,64);g.moveTo(0,i);g.lineTo(64,i);g.stroke();}
    const R=rng(8);for(let i=0;i<120;i++){g.fillStyle=R()<.5?'rgba(255,255,255,.06)':'rgba(0,0,0,.08)';g.fillRect(R()*w,R()*h,2,2);}},true);
  const DS2=THREE.DoubleSide,sideM=new THREE.MeshLambertMaterial({map:sideT,side:DS2}),kerbM=new THREE.MeshLambertMaterial({color:0xc9c6bd,side:DS2});
  if(TERR){sideM.userData.terrN=kerbM.userData.terrN=true;}
  const s0=T.sw?i=>!T.sw[0][i]:null,s1=T.sw?i=>!T.sw[1][i]:null;
  S.add(new THREE.Mesh(strip(WALL,HALF+5,2.2,SIDE,s0,TERR?2:1),sideM));S.add(new THREE.Mesh(strip(-HALF-5,-WALL,2.2,SIDE,s1,TERR?2:1),sideM));
  S.add(new THREE.Mesh(strip(HALF+5,HALF-1,2.4,64,s0),kerbM));S.add(new THREE.Mesh(strip(-HALF+1,-HALF-5,2.4,64,s1),kerbM));
  const asphM=new THREE.MeshPhongMaterial({map:asphT,side:DS2,shininess:28,specular:NIGHT?0x2a3a52:0x3a3228});if(TERR)asphM.userData.terrN=true;
  if(T.jn){S.add(new THREE.Mesh(strip(HALF,-HALF,TERR?.4:1.1,64,i=>!T.jn[i],TERR?8:1),asphM));
    const plainT=tex(32,32,(g,w,h)=>{g.fillStyle='#4d5864';g.fillRect(0,0,w,h);const R=rng(6);for(let i=0;i<90;i++){g.fillStyle=R()<.5?'rgba(255,255,255,.06)':'rgba(0,0,0,.09)';g.fillRect(R()*w,R()*h,1.5,1.5);}},true);
    const pM=new THREE.MeshPhongMaterial({map:plainT,side:DS2,shininess:28,specular:NIGHT?0x2a3a52:0x3a3228,polygonOffset:true,polygonOffsetFactor:-1});if(TERR)pM.userData.terrN=true;
    S.add(new THREE.Mesh(strip(HALF,-HALF,TERR?.46:1.16,64,i=>!!T.jn[i],TERR?8:1),pM));}
  else S.add(new THREE.Mesh(strip(HALF,-HALF,TERR?.4:1.1,64,null,TERR?8:1),asphM));
  // přechody pro chodce a kosočtverce
  const zebT=tex(64,256,(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle='rgba(244,242,236,.95)';for(let y=6;y<h;y+=28)g.fillRect(0,y,w,14);});
  const zebM=new THREE.MeshLambertMaterial({map:zebT,transparent:true}),zebG=new THREE.PlaneGeometry(30,HALF*2-12,1,8);zebG.rotateX(-Math.PI/2);
  const diaT=tex(64,64,(g,w,h)=>{g.clearRect(0,0,w,h);g.strokeStyle='rgba(244,242,236,.95)';g.lineWidth=6;g.beginPath();g.moveTo(4,32);g.lineTo(32,14);g.lineTo(60,32);g.lineTo(32,50);g.closePath();g.stroke();});
  const diaM=new THREE.MeshLambertMaterial({map:diaT,transparent:true}),diaG=new THREE.PlaneGeometry(44,30);diaG.rotateX(-Math.PI/2);
  ZEBRA.forEach(zb=>{const m=new THREE.Mesh(zebG,zebM);m.position.set(zb.x,1.3,zb.y);m.rotation.y=-zb.a;S.add(m);
    const c=Math.cos(zb.a),s=Math.sin(zb.a),d=new THREE.Mesh(diaG,diaM);d.position.set(zb.x-c*130,1.3,zb.y-s*130);d.rotation.y=-zb.a;S.add(d);});
  // start a cíl
  const a0=Math.atan2(T.ty[0],T.tx[0]);
  const chk=tex(16,128,(g,w,h)=>{for(let r=0;r<2;r++)for(let c=0;c<16;c++){g.fillStyle=(r+c)%2?'#16181a':'#f4f1e6';g.fillRect(r*8,c*8,8,8);}});chk.magFilter=THREE.NearestFilter;
  const line=new THREE.Mesh(new THREE.PlaneGeometry(20,HALF*2,1,8),new THREE.MeshLambertMaterial({map:chk}));line.geometry.rotateX(-Math.PI/2);
  line.position.set(T.x[0],1.3,T.y[0]);line.rotation.y=-a0;S.add(line);
  const banT=tex(512,64,(g,w,h)=>{g.fillStyle='#16181a';g.fillRect(0,0,w,h);for(let i=0;i<8;i++)for(let r=0;r<2;r++){g.fillStyle=(i+r)%2?'#f4f1e6':'#16181a';g.fillRect(i*8,r*32,8,32);g.fillRect(w-64+i*8,r*32,8,32);}
    g.fillStyle=C.gold;g.font=`400 44px ${DISP}`;g.textAlign='center';g.textBaseline='middle';g.fillText(TRK.banner,w/2,h/2+2);});
  const gantry=new THREE.Group();gantry.position.set(T.x[0],0,T.y[0]);gantry.rotation.y=-a0;
  const postM=new THREE.MeshLambertMaterial({color:0x2b2f33}),banSide=new THREE.MeshLambertMaterial({map:banT});
  for(const z of [-HALF-26,HALF+26]){const p=new THREE.Mesh(new THREE.BoxGeometry(6,78,6),postM);p.position.set(0,39,z);gantry.add(p);}
  const ban=new THREE.Mesh(new THREE.BoxGeometry(5,18,HALF*2+64),[banSide,banSide,postM,postM,postM,postM]);ban.position.y=70;gantry.add(ban);S.add(gantry);
  // zrychlovací pásy
  const padT=tex(128,96,(g,w,h)=>{g.fillStyle=C.boost;g.fillRect(0,0,w,h);g.fillStyle='#ffe9c4';
    for(let i=0;i<2;i++){const x=i*64+12;g.beginPath();g.moveTo(x,10);g.lineTo(x+30,h/2);g.lineTo(x,h-10);g.lineTo(x+16,h-10);g.lineTo(x+46,h/2);g.lineTo(x+16,10);g.fill();}},true);
  const padM=new THREE.MeshBasicMaterial({map:padT});const padG=new THREE.PlaneGeometry(60,72,4,4);padG.rotateX(-Math.PI/2);
  PADS.forEach(pd=>{const m=new THREE.Mesh(padG,padM);m.position.set(pd.x,1.35,pd.y);m.rotation.y=-pd.a;S.add(m);});
  // skokánky: šikmá deska a podpěra
  const jmpT=tex(64,128,(g,w,h)=>{g.fillStyle='#f6d33c';g.fillRect(0,0,w,h);g.fillStyle='#1b1b1b';
    for(let y=-32;y<h;y+=32){g.beginPath();g.moveTo(0,y);g.lineTo(w/2,y+18);g.lineTo(w,y);g.lineTo(w,y+12);g.lineTo(w/2,y+30);g.lineTo(0,y+12);g.fill();}},true);
  const jmpM=new THREE.MeshLambertMaterial({map:jmpT}),jmpSide=new THREE.MeshLambertMaterial({color:0x2a2d30});
  JUMPS.forEach(j=>{const g=new THREE.Group();g.position.set(j.x,1.2,j.y);g.rotation.y=-j.a;const H=16,len=Math.hypot(j.hl*2,H);
    const deck=new THREE.Mesh(new THREE.BoxGeometry(len,2,j.hw*2),[jmpSide,jmpSide,jmpM,jmpSide,jmpSide,jmpSide]);deck.rotation.z=Math.atan2(H,j.hl*2);deck.position.set(0,H/2,0);g.add(deck);
    const back=new THREE.Mesh(new THREE.BoxGeometry(3,H,j.hw*2),jmpSide);back.position.set(j.hl-1.5,H/2,0);g.add(back);S.add(g);});
  // zábrany silničářů s blikačkami a tabulí
  const barT=tex(128,32,(g,w,h)=>{g.fillStyle='#f4f1e6';g.fillRect(0,0,w,h);g.fillStyle='#e8601c';for(let x=-32;x<w;x+=32){g.beginPath();g.moveTo(x,h);g.lineTo(x+16,0);g.lineTo(x+32,0);g.lineTo(x+16,h);g.fill();}},true);
  const barM=new THREE.MeshLambertMaterial({map:barT}),liteM=new THREE.MeshBasicMaterial({color:0xffd84a}),barLights=[];
  const kojiT=tex(128,64,(g,w,h)=>{g.fillStyle='#f6d33c';g.fillRect(0,0,w,h);g.strokeStyle='#1b1b1b';g.lineWidth=5;g.strokeRect(3,3,w-6,h-6);
    g.fillStyle='#1b1b1b';g.font='700 34px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('工事中',w/2,h/2+2);});
  const kojiM=new THREE.MeshBasicMaterial({map:kojiT,side:DS2});
  BARRS.forEach(b=>{const g=new THREE.Group();g.position.set(b.x,1.2,b.y);g.rotation.y=-b.a;
    const body=new THREE.Mesh(new THREE.BoxGeometry(b.hl*2,b.h-4,b.hw*2),barM);body.position.y=(b.h-4)/2;g.add(body);
    for(const u of [-b.hl+6,b.hl-6]){const l=new THREE.Mesh(new THREE.SphereGeometry(3.4,10,8),liteM);l.position.set(u,b.h+1,0);g.add(l);barLights.push(l);}
    const sg=new THREE.Mesh(new THREE.PlaneGeometry(36,18),kojiM);sg.position.set(-b.hl+20,b.h+12,0);sg.rotation.y=-Math.PI/2;g.add(sg);
    const pole=new THREE.Mesh(new THREE.BoxGeometry(1.5,12,1.5),postM);pole.position.set(-b.hl+20,b.h+2,0);g.add(pole);S.add(g);});
  // kužely
  const coneT=tex(8,64,(g,w,h)=>{g.fillStyle='#ef6a1d';g.fillRect(0,0,w,h);g.fillStyle='#f4f1e6';g.fillRect(0,h*.3,w,h*.18);g.fillRect(0,h*.62,w,h*.1);});
  const coneG=new THREE.ConeGeometry(6,20,12);coneG.translate(0,10,0);const coneM=new THREE.MeshLambertMaterial({map:coneT});
  const coneBaseG=new THREE.BoxGeometry(14,2,14);coneBaseG.translate(0,1,0);const coneBaseM=new THREE.MeshLambertMaterial({color:0x2a2d30});
  const cones=CONES.map(c=>{const g=new THREE.Group();g.add(new THREE.Mesh(coneG,coneM));g.add(new THREE.Mesh(coneBaseG,coneBaseM));g.position.set(c.x,1.2,c.y);S.add(g);return g;});
  // penízky a otazníky
  const coinG=new THREE.CylinderGeometry(9,9,2.6,22);coinG.rotateX(Math.PI/2);
  const coinM=new THREE.MeshPhongMaterial({color:0xf2c14e,emissive:0x4a3000,shininess:90,specular:0xfff2c0});
  const qT=tex(64,64,(g,w,h)=>{g.fillStyle='#5cc8f2';g.fillRect(0,0,w,h);g.strokeStyle='#eafaff';g.lineWidth=6;g.strokeRect(3,3,w-6,h-6);
    g.fillStyle='#ffffff';g.font=`400 46px ${DISP}`;g.textAlign='center';g.textBaseline='middle';g.fillText('?',w/2,h/2+3);});
  const boxM=new THREE.MeshPhongMaterial({map:qT,transparent:true,opacity:.9,emissive:0x0a3550,shininess:60});const boxG=new THREE.BoxGeometry(24,24,24);
  const pkM=PK.map(p=>{const m=new THREE.Mesh(p.type==='coin'?coinG:boxG,p.type==='coin'?coinM:boxM);m.position.set(p.x,p.type==='coin'?14:20,p.y);S.add(m);return m;});
  // olej
  const oilG=new THREE.CircleGeometry(1,20);oilG.rotateX(-Math.PI/2);
  const oilM=new THREE.MeshPhongMaterial({color:0x121416,shininess:120,specular:0x9a8fd8});
  const oils=[];for(let i=0;i<8;i++){const m=new THREE.Mesh(oilG,oilM);m.visible=false;S.add(m);oils.push(m);}
  // domy: tři výškové třídy, okna na fasádě, plochá střecha
  const facadeT=(rows,seed)=>tex(64,rows*16,(g,w,h)=>{const R=rng(seed);g.fillStyle='#f2f1ec';g.fillRect(0,0,w,h);
    for(let r=0;r<rows;r++)for(let c=0;c<4;c++){const lit=R()<.22;g.fillStyle=lit?'#f7e6a8':R()<.5?'#5d6d7c':'#73879a';g.fillRect(4+c*15,r*16+4,10,9);}
    g.fillStyle='rgba(0,0,0,.12)';g.fillRect(0,h-16,w,16);});
  const facadeB=(rows,seed)=>tex(128,rows*44,(g,w,h)=>{const R=rng(seed);g.fillStyle='#f4f1e8';g.fillRect(0,0,w,h);
    for(let r=0;r<rows;r++){const y0=r*44;
      if(r===rows-1){g.fillStyle='#d9d4c6';g.fillRect(0,y0,w,44);
        for(let c=0;c<4;c++){const x=6+c*31;g.fillStyle='#2f3a44';g.fillRect(x,y0+10,22,30);if(R()<.55){g.fillStyle='rgba(255,236,170,.6)';g.fillRect(x+2,y0+12,18,10);}}
        g.fillStyle='#b9b3a3';g.fillRect(0,y0,w,4);}
      else{for(let c=0;c<4;c++){const x=6+c*31;g.fillStyle='#fffdf6';g.fillRect(x,y0+9,22,30);
          g.fillStyle=R()<.2?'#f1dc9a':R()<.5?'#4b5d6e':'#62768a';g.fillRect(x+3,y0+12,16,24);
          g.fillStyle='#fffdf6';g.fillRect(x+10,y0+12,2,24);g.fillRect(x+3,y0+22,16,2);
          g.fillStyle='rgba(0,0,0,.18)';g.fillRect(x-1,y0+39,24,3);
          if(r===1&&R()<.6){g.fillStyle='rgba(180,170,150,.8)';g.fillRect(x-2,y0+3,26,4);}}
        g.fillStyle='rgba(0,0,0,.10)';g.fillRect(0,y0+42,w,2);}}
    g.fillStyle='rgba(0,0,0,.14)';g.fillRect(0,0,w,3);});
  const facade=TRK.id==='brno'?facadeB:facadeT;
  const roofM=new THREE.MeshLambertMaterial({color:0x8d9399});
  const bG=new THREE.BoxGeometry(1,1,1);bG.translate(0,.5,0);
  (TRK.id==='brno'?[]:[[0,110,3,41],[110,230,7,42],[230,1e9,15,43]]).forEach(([h0,h1,rows,seed])=>{const list=CITY.blds.filter(b=>b.h>=h0&&b.h<h1);if(!list.length)return;
    const ft=facade(rows,seed),em=emiFrom(ft),fm=new THREE.MeshLambertMaterial(em?{map:ft,emissive:new THREE.Color(ENV.win,ENV.win*.9,ENV.win*.7),emissiveMap:em}:{map:ft}),im=new THREE.InstancedMesh(bG,[fm,fm,roofM,roofM,fm,fm],list.length);
    list.forEach((b,i)=>{ps.set(b.x,0,b.y);qt.setFromAxisAngle(up,-b.a);sc.set(b.w,b.h,b.d);m4.compose(ps,qt,sc);im.setMatrixAt(i,m4);im.setColorAt(i,cc.set(b.c));});S.add(im);});
  if(TRK.id==='brno'){const fb=facadeB(8,45),og=osmGeo(CITY.blds,fb),em=emiFrom(fb);if(em){og.walls.material.emissiveMap=em;og.walls.material.emissive=new THREE.Color(ENV.win,ENV.win*.85,ENV.win*.6);}S.add(og.walls);S.add(og.roofs);}
  // neonové cedule: svislé trčí do ulice, vodorovné nad obchody
  const VS=[['寿司','#d8262c','#fff'],['ラーメン','#fff','#d8262c'],['居酒屋','#f6d33c','#1b1b1b'],['カラオケ','#1d5fb5','#fff'],['焼肉','#1a1a1a','#ff4fa3'],['薬','#2e9a4b','#fff'],['串焼','#fff','#1b1b1b'],['喫茶','#e86a1e','#fff']];
  const HS=[['うどん・そば','#fff','#c4202a'],['ゲーム','#1a1a1a','#59e0ff'],['パン屋','#f6d33c','#1b1b1b'],['本・BOOKS','#1d5fb5','#fff'],['24時間','#d8262c','#fff'],['花屋','#2e9a4b','#fff']];
  const signT=(txt,bg,fg,vert)=>tex(vert?64:256,vert?256:48,(g,w,h)=>{g.fillStyle=bg;g.fillRect(0,0,w,h);g.strokeStyle=fg;g.globalAlpha=.6;g.lineWidth=4;g.strokeRect(4,4,w-8,h-8);g.globalAlpha=1;
    g.fillStyle=fg;g.textAlign='center';g.textBaseline='middle';
    if(vert){const ch=[...txt],fs=Math.min(48,(h-24)/ch.length);g.font=`700 ${fs}px sans-serif`;ch.forEach((c,i)=>g.fillText(c,w/2,12+fs*(i+.5)+(h-24-fs*ch.length)/2));}
    else{g.font='700 30px sans-serif';g.fillText(txt,w/2,h/2+2);}});
  const plG=new THREE.PlaneGeometry(1,1);
  const placeSigns=(list,defs,vert)=>defs.forEach((d,ti)=>{const mine=list.filter(s=>s.tex===ti);if(!mine.length)return;
    const im=new THREE.InstancedMesh(plG,new THREE.MeshBasicMaterial({map:signT(d[0],d[1],d[2],vert),side:DS2}),mine.length);
    mine.forEach((s,i)=>{ps.set(s.x,s.y0,s.y);qt.setFromAxisAngle(up,s.rot);sc.set(s.w,s.h,1);m4.compose(ps,qt,sc);im.setMatrixAt(i,m4);});S.add(im);
    if(ENV.glow>.3){const gc=/^#f(ff|fffff)$/i.test(d[1])?d[2]:d[1],gi=new THREE.InstancedMesh(plG,new THREE.MeshBasicMaterial({map:glowT,color:new THREE.Color(gc),transparent:true,opacity:.55*ENV.glow,blending:ADD,depthWrite:false,side:DS2}),mine.length);
      mine.forEach((s,i)=>{ps.set(s.x,s.y0,s.y);qt.setFromAxisAngle(up,s.rot);sc.set(s.w*(vert?3.4:1.5),s.h*(vert?1.7:3.6),1);m4.compose(ps,qt,sc);gi.setMatrixAt(i,m4);});gi.renderOrder=2;S.add(gi);}});
  if(TRK.id==='brno'){
    placeSigns(CITY.signs,[['HOTEL','#7a1f2b','#f6e7c1'],['LÉKÁRNA','#2e9a4b','#fff'],['PIVO','#f6d33c','#1b1b1b'],['KAVÁRNA','#5b3a29','#f6e7c1'],['OPTIKA','#1d5fb5','#fff'],['BISTRO','#fff','#b3261e'],['ZLATO','#1a1a1a','#e6c15a'],['HOSPODA','#2f5d3a','#f6e7c1']],true);
    placeSigns(CITY.shops,[['POTRAVINY','#fff','#b3261e'],['PEKÁRNA','#f6d33c','#5b3a29'],['KNIHY','#2b3a55','#f6e7c1'],['CUKRÁRNA','#f3c6d2','#7a1f2b'],['KVĚTINY','#2e9a4b','#fff'],['RESTAURACE','#1a1a1a','#f6e7c1']],false);
  }else{placeSigns(CITY.signs,VS,true);placeSigns(CITY.shops,HS,false);}
  // lampy a lampiony
  {const Lm=CITY.lamps,lanL=Lm.filter(l=>l.lan);
    const postG=new THREE.CylinderGeometry(1.1,1.5,50,6);postG.translate(0,25,0);
    const posts=new THREE.InstancedMesh(postG,new THREE.MeshLambertMaterial({color:0x3a3f45}),Lm.length);
    const armG=new THREE.BoxGeometry(1,1.4,1.4);const arms=new THREE.InstancedMesh(armG,new THREE.MeshLambertMaterial({color:0x3a3f45}),Lm.length);
    const headG=new THREE.SphereGeometry(3.6,10,8);const heads=new THREE.InstancedMesh(headG,new THREE.MeshBasicMaterial({color:0xfff8e0}),Lm.length);
    Lm.forEach((l,i)=>{qt.set(0,0,0,1);ps.set(l.x,0,l.y);sc.set(1,1,1);m4.compose(ps,qt,sc);posts.setMatrixAt(i,m4);
      const dx=l.hx-l.x,dy=l.hy-l.y,len=Math.hypot(dx,dy);qt.setFromAxisAngle(up,-Math.atan2(dy,dx));ps.set((l.x+l.hx)/2,50,(l.y+l.hy)/2);sc.set(len,1,1);m4.compose(ps,qt,sc);arms.setMatrixAt(i,m4);
      qt.set(0,0,0,1);ps.set(l.hx,47,l.hy);sc.set(1,1,1);m4.compose(ps,qt,sc);heads.setMatrixAt(i,m4);});
    S.add(posts);S.add(arms);S.add(heads);
    {const pg=new THREE.PlaneGeometry(1,1);pg.rotateX(-Math.PI/2);const pools=new THREE.InstancedMesh(pg,new THREE.MeshBasicMaterial({map:glowT,color:0xffc27a,transparent:true,opacity:.5*ENV.glow,blending:ADD,depthWrite:false}),Lm.length);
      Lm.forEach((l,i)=>{qt.set(0,0,0,1);ps.set(l.hx,2.7,l.hy);sc.set(120,1,120);m4.compose(ps,qt,sc);pools.setMatrixAt(i,m4);});pools.renderOrder=1;S.add(pools);
      const hm=new THREE.SpriteMaterial({map:glowT,color:0xffe0ad,transparent:true,opacity:.95*ENV.glow,blending:ADD,depthWrite:false});
      Lm.forEach(l=>{const sp=new THREE.Sprite(hm);sp.position.set(l.hx,46,l.hy);sp.scale.set(36,36,1);S.add(sp);});}
    if(lanL.length){const lan=new THREE.InstancedMesh(new THREE.SphereGeometry(1,12,10),new THREE.MeshBasicMaterial({color:0xd8262c}),lanL.length);
      lanL.forEach((l,i)=>{qt.set(0,0,0,1);ps.set(l.x+(l.hx-l.x)*.45,34,l.y+(l.hy-l.y)*.45);sc.set(4,5.6,4);m4.compose(ps,qt,sc);lan.setMatrixAt(i,m4);});S.add(lan);lanterns={im:lan,list:lanL};}}
  // panorama na obzoru: mrakodrapy a červenobílá věž
  if(TRK.id!=='brno'){const R=rng(31),skyC=['#9aa7b4','#8796a5','#aab6c2','#b7c0c9'];
    const sk=new THREE.InstancedMesh(bG,new THREE.MeshLambertMaterial({map:facade(20,44)}),90);
    const hx3=Math.max(3300,(T.maxX-T.minX)/2+1500),hz3=Math.max(3300,(T.maxY-T.minY)/2+1500);
    for(let i=0;i<90;i++){const a=i/90*TAU+R()*.05,dd=R()*900,w=120+R()*200;ps.set(cx0+Math.cos(a)*(hx3+dd),0,cz0+Math.sin(a)*(hz3+dd));qt.setFromAxisAngle(up,R()*TAU);
      sc.set(w,300+R()*700,w*(.7+R()*.5));m4.compose(ps,qt,sc);sk.setMatrixAt(i,m4);sk.setColorAt(i,cc.set(skyC[Math.floor(R()*4)]));}S.add(sk);
    const towT=tex(16,128,(g,w,h)=>{for(let i=0;i<8;i++){g.fillStyle=i%2?'#f4f1e6':'#e0482c';g.fillRect(0,i*16,w,16);}});
    const tow=new THREE.Group();tow.position.set(cx0-Math.max(2900,(T.maxX-T.minX)/2+1100),0,cz0-Math.max(2300,(T.maxY-T.minY)/2+1100));
    const t1=new THREE.Mesh(new THREE.CylinderGeometry(18,130,560,4,1,true),new THREE.MeshLambertMaterial({map:towT,side:DS2}));t1.position.y=280;tow.add(t1);
    const deck=new THREE.Mesh(new THREE.BoxGeometry(110,24,110),new THREE.MeshLambertMaterial({color:0xf4f1e6}));deck.position.y=300;tow.add(deck);
    const t2=new THREE.Mesh(new THREE.CylinderGeometry(3,18,240,4,1,true),new THREE.MeshLambertMaterial({map:towT,side:DS2}));t2.position.y=680;tow.add(t2);S.add(tow);
    const cg=new THREE.IcosahedronGeometry(1,1),cm=new THREE.MeshBasicMaterial({color:ENV.cloud});
    for(let i=0;i<16;i++){const x=cx0+(R()-.5)*6000,z=cz0+(R()-.5)*6000,y=900+R()*260;for(let k=0;k<4;k++){const m=new THREE.Mesh(cg,cm);m.position.set(x+(k-1.5)*70+R()*30,y+R()*20,z+R()*50);m.scale.set(70+R()*60,24+R()*14,50+R()*40);S.add(m);clouds.push(m);}}}
  // Brno: kopec se Špilberkem, Petrov, Kapucíni, kolonáda, Červený kostel, stromy a obzor
  if(TRK.id==='brno'){
    const LM=CITY.lm,prism=prismGeo();
    const MM=(c,o)=>new THREE.MeshLambertMaterial(Object.assign({color:c,side:DS2},o||{}));
    const addBox=(par,w,h,d,mat,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);par.add(m);return m;};
    const addRoof=(par,w,h,d,mat,x,y,z,ry)=>{const m=new THREE.Mesh(prism,mat);m.scale.set(w,h,d);m.position.set(x,y,z);m.rotation.y=ry||0;par.add(m);return m;};
    const addCyl=(par,rb,rt,h,seg,mat,x,y,z)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),mat);m.position.set(x,y,z);par.add(m);return m;};
    const addCone=(par,r,h,seg,mat,x,y,z,ry)=>{const m=new THREE.Mesh(new THREE.ConeGeometry(r,h,seg),mat);m.position.set(x,y,z);m.rotation.y=ry||0;par.add(m);return m;};
    // kopce (Špilberk, Petrov) dělá reálný terén, viz terrain.js
    // stromy: ulice, Špilberk, Petrov, Denisovy sady (podzimní zeleň)
    {const TC=['#6f9f47','#88ab45','#c9a03a','#d17a2b','#5d8f4a'].map(s=>new THREE.Color(s)),trs=CITY.trees;
      const trunkG=new THREE.CylinderGeometry(1,1.3,1,6);trunkG.translate(0,.5,0);const crownG=new THREE.IcosahedronGeometry(1,1);
      const i1=new THREE.InstancedMesh(trunkG,new THREE.MeshLambertMaterial({color:0x5b4636}),trs.length),i2=new THREE.InstancedMesh(crownG,new THREE.MeshLambertMaterial({color:0xffffff}),trs.length);
      trs.forEach((t,i)=>{const th=t.h*.55;qt.set(0,0,0,1);ps.set(t.x,t.y0,t.y);sc.set(2.2,th,2.2);m4.compose(ps,qt,sc);i1.setMatrixAt(i,m4);
        ps.set(t.x,t.y0+th+t.r*.55,t.y);sc.set(t.r,t.r*(t.park?1.25:.95),t.r);m4.compose(ps,qt,sc);i2.setMatrixAt(i,m4);i2.setColorAt(i,TC[t.c]);});
      S.add(i1);S.add(i2);}
    // textury: kámen s okny a červené cihly
    const stoneT=tex(64,128,(g,w,h)=>{g.fillStyle='#d9d0bc';g.fillRect(0,0,w,h);const R=rng(61);
      for(let i=0;i<260;i++){g.fillStyle=R()<.5?'rgba(255,255,255,.08)':'rgba(0,0,0,.07)';g.fillRect(R()*w,R()*h,2,2);}
      for(let r=0;r<3;r++)for(let c=0;c<2;c++){const x=9+c*29,y=r*42;g.fillStyle='#3a4450';g.beginPath();g.moveTo(x,y+36);g.lineTo(x,y+16);g.quadraticCurveTo(x+7,y+3,x+14,y+16);g.lineTo(x+14,y+36);g.fill();
        g.strokeStyle='rgba(255,255,255,.55)';g.lineWidth=1.5;g.stroke();}});
    const brickT=tex(64,128,(g,w,h)=>{g.fillStyle='#a5432e';g.fillRect(0,0,w,h);const R=rng(67);
      for(let y=0;y<h;y+=4){g.fillStyle='rgba(60,20,10,.28)';g.fillRect(0,y,w,1);for(let x=(y/4%2)*6;x<w;x+=12){g.fillRect(x,y,1,4);}}
      for(let i=0;i<200;i++){g.fillStyle=R()<.5?'rgba(255,200,170,.07)':'rgba(0,0,0,.08)';g.fillRect(R()*w,R()*h,3,2);}
      for(let r=0;r<3;r++)for(let c=0;c<2;c++){const x=9+c*29,y=r*42;g.fillStyle='#e8dfc8';g.fillRect(x-2,y+13,18,25);
        g.fillStyle='#262b36';g.beginPath();g.moveTo(x,y+36);g.lineTo(x,y+19);g.lineTo(x+7,y+9);g.lineTo(x+14,y+19);g.lineTo(x+14,y+36);g.fill();}});
    const stoneM=new THREE.MeshLambertMaterial({map:stoneT,side:DS2}),brickM=new THREE.MeshLambertMaterial({map:brickT,side:DS2});
    // ŠPILBERK: hradby, bašty, palác a věž na vrcholu kopce
    {const g=new THREE.Group();g.position.set(LM.sp.x,TERR?-6:296,LM.sp.y);g.scale.set(1.3,1.3,1.3);S.add(g);
      const wall=MM('#e6dfcf'),dark=MM('#bdb29b'),red=MM('#8a4a33'),green=MM('#6d8c7a'),W=120,D=88;
      addBox(g,2*W,32,8,wall,0,16,-D);addBox(g,2*W,32,8,wall,0,16,D);addBox(g,8,32,2*D,wall,-W,16,0);addBox(g,8,32,2*D,wall,W,16,0);
      [[-W,-D],[W,-D],[-W,D],[W,D]].forEach(([x,z])=>{addCyl(g,28,24,46,8,dark,x,23,z);addCone(g,27,18,8,green,x,55,z);});
      addBox(g,170,56,62,wall,0,28,6);addRoof(g,178,40,70,red,0,56,6);
      addBox(g,60,48,110,wall,-70,24,0);addRoof(g,64,34,116,red,-70,48,0,Math.PI/2);
      addBox(g,30,128,30,wall,42,64,-8);addBox(g,36,10,36,dark,42,126,-8);addCone(g,26,72,4,green,42,167,-8,Math.PI/4);}
    // PETROV: katedrála sv. Petra a Pavla, dvě věže na západě
    {const g=new THREE.Group();g.position.set(LM.pe.x,TERR?-8:118,LM.pe.y);S.add(g);const copper=MM('#587a69'),spire=MM('#476556');
      addBox(g,380,118,128,stoneM,0,59,0);addRoof(g,390,62,136,copper,0,118,0);
      addBox(g,128,118,250,stoneM,40,59,0);addRoof(g,258,62,136,copper,40,118,0,Math.PI/2);
      addCyl(g,64,64,118,10,stoneM,205,59,0);addCone(g,70,54,10,copper,205,145,0);
      [-40,40].forEach(z=>{addBox(g,54,300,54,stoneM,-178,150,z);addBox(g,60,8,60,MM('#bfb7a3'),-178,298,z);addCone(g,40,190,4,spire,-178,397,z,Math.PI/4);});}
    // KAPUCÍNSKÝ KLÁŠTER a kostel na Kapucínském náměstí
    {const g=new THREE.Group();g.position.set(LM.ka.x,0,LM.ka.y);S.add(g);const och=MM('#e2c58b'),roof=MM('#9a4a32');
      addBox(g,250,70,92,och,0,35,0);addRoof(g,258,36,100,roof,0,70,0);
      addBox(g,96,92,128,MM('#eadcb7'),-130,46,-10);addRoof(g,100,60,134,roof,-130,92,-10,Math.PI/2);
      addBox(g,26,120,26,och,-96,60,52);addCone(g,19,56,4,MM('#5f6f66'),-96,148,52,Math.PI/4);addBox(g,3,16,3,MM('#c9a43c'),-96,184,52);}
    // DENISOVY SADY: kolonáda na terase
    {const g=new THREE.Group();g.position.set(LM.de.x,0,LM.de.y);g.rotation.y=-.35;S.add(g);const wh=MM('#f1eee4');
      addBox(g,290,10,70,MM('#cdc6b6'),0,5,0);addBox(g,270,6,56,MM('#d9d3c5'),0,13,0);
      for(let i=0;i<13;i++)addCyl(g,4.6,4.2,48,10,wh,-120+i*20,40,-14);
      addBox(g,276,10,22,wh,0,69,-14);addBox(g,284,5,28,MM('#d4cfc2'),0,76,-14);}
    // ČERVENÝ KOSTEL na Komenského náměstí
    {const g=new THREE.Group();g.position.set(LM.ck.x,0,LM.ck.y);S.add(g);
      addBox(g,300,110,108,brickM,0,55,0);addRoof(g,310,66,116,MM('#4b3d3a'),0,110,0);
      addBox(g,108,100,200,brickM,20,50,0);addRoof(g,208,50,116,MM('#4b3d3a'),20,100,0,Math.PI/2);
      addBox(g,56,290,56,brickM,-158,145,0);addBox(g,64,8,64,MM('#e8dfc8'),-158,284,0);addCone(g,42,180,8,MM('#6a2f25'),-158,378,0);}
    // obzor: zelené kopce kolem města a nízká zástavba v dálce
    {const R=rng(37),hc=['#86a681','#7c9c78','#93ad88','#8aa58a'];
      for(let i=0;i<16;i++){const a=i/16*TAU+R()*.25,d=3900+R()*1400,m=new THREE.Mesh(new THREE.SphereGeometry(1,16,8),new THREE.MeshLambertMaterial({color:hc[i%4]}));
        m.position.set(cx0+Math.cos(a)*d,-20,cz0+Math.sin(a)*d);m.scale.set(800+R()*900,170+R()*230,600+R()*700);S.add(m);}
      const far=new THREE.InstancedMesh(bG,new THREE.MeshLambertMaterial({map:facade(5,51)}),70);
      for(let i=0;i<70;i++){const a=R()*TAU,d=2900+R()*900,w=140+R()*160;ps.set(cx0+Math.cos(a)*d,0,cz0+Math.sin(a)*d);qt.setFromAxisAngle(up,R()*TAU);
        sc.set(w,150+R()*160,w*(.7+R()*.5));m4.compose(ps,qt,sc);far.setMatrixAt(i,m4);far.setColorAt(i,cc.set(['#e4d6b0','#d8c4a4','#cfd6c0','#c9d2dc'][i%4]));}
      S.add(far);}
  }
  // ideální stopa: šipky, barva podle doporučené rychlosti (zelená plný plyn, žlutá ubrat, červená brzdit)
  const lineT=tex(64,64,(g,w,h)=>{g.clearRect(0,0,w,h);g.strokeStyle='#fff';g.lineWidth=10;g.lineCap='round';g.lineJoin='round';g.beginPath();g.moveTo(12,48);g.lineTo(32,18);g.lineTo(52,48);g.stroke();},true);
  let rline=null;
  if(!T.free){const pos=[],uv=[],col=[],idx=[],c1=new THREE.Color();let n=0;
    for(let i=0;i<N;i++){const j=(i+1)%N;
      for(const [q,u,vv] of [[i,0,i],[i,1,i],[j,0,i+1],[j,1,i+1]]){const o=RL.rl[q]+(u?7:-7);pos.push(T.x[q]+T.nx(q)*o,1.24,T.y[q]+T.ny(q)*o);uv.push(u,vv*DS/46);c1.set(rlColor(RL.vs[q]));col.push(c1.r,c1.g,c1.b);}
      idx.push(n,n+2,n+1,n+1,n+2,n+3);n+=4;}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);
    rline=new THREE.Mesh(g,new THREE.MeshBasicMaterial({map:lineT,vertexColors:true,transparent:true,opacity:.8,depthWrite:false,side:DS2}));rline.renderOrder=2;S.add(rline);}
  // louže oleje na trati
  {const pm=new THREE.MeshPhongMaterial({color:0x0e1012,shininess:140,specular:0xa898e8}),pg=new THREE.CircleGeometry(1,24);pg.rotateX(-Math.PI/2);
    PUDDLES.forEach(p=>{const g=new THREE.Group();g.position.set(p.x,1.32,p.y);g.rotation.y=-p.a;
      const m=new THREE.Mesh(pg,pm);m.scale.set(p.r,1,p.r*.72);g.add(m);p.blobs.forEach(b=>{const k=new THREE.Mesh(pg,pm);k.scale.set(b.r,1,b.r*.8);k.position.set(b.u,.02,b.v);g.add(k);});S.add(g);});}
  // svodidla: pozinkovaná pásnice na sloupcích, v ostrých zatáčkách červené tabule se šipkami
  if(RAILS.length){const railT=tex(8,32,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#eef1f4');gr.addColorStop(.3,'#a9b2ba');gr.addColorStop(.5,'#e3e7ea');gr.addColorStop(.7,'#9aa3ab');gr.addColorStop(1,'#d6dbe0');g.fillStyle=gr;g.fillRect(0,0,w,h);});
    const pos=[],uv=[],idx=[];let n=0,posts=[];
    RAILS.forEach(rl=>{for(let q=0;q<rl.len;q++){const i=(rl.i0+q)%N,j=(i+1)%N,lat=rl.side*(WALL-2);
      for(const [m,y,v] of [[i,8.5,0],[i,15,1],[j,8.5,0],[j,15,1]]){pos.push(T.x[m]+T.nx(m)*lat,y,T.y[m]+T.ny(m)*lat);uv.push(q+(m===j?1:0),v);}
      idx.push(n,n+2,n+1,n+1,n+2,n+3);n+=4;if(q%3===0)posts.push([T.x[i]+T.nx(i)*(lat+rl.side*1.5),T.y[i]+T.ny(i)*(lat+rl.side*1.5)]);}});
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
    S.add(new THREE.Mesh(g,new THREE.MeshPhongMaterial({map:railT,side:DS2,shininess:60,specular:0x99a3ad})));
    const pG=new THREE.BoxGeometry(2.4,15,2.4);pG.translate(0,7.5,0);const pim=new THREE.InstancedMesh(pG,new THREE.MeshLambertMaterial({color:0x6d757d}),posts.length);
    posts.forEach(([x,y],i)=>{qt.set(0,0,0,1);ps.set(x,1.2,y);sc.set(1,1,1);m4.compose(ps,qt,sc);pim.setMatrixAt(i,m4);});S.add(pim);}
  if(CHEV.length){const mkT=right=>tex(96,64,(g,w,h)=>{g.fillStyle='#d8262c';g.fillRect(0,0,w,h);g.fillStyle='#fff';const d=right?1:-1;
      for(let k=0;k<3;k++){const x=w/2+(k-1)*26*d;g.beginPath();g.moveTo(x-9*d,10);g.lineTo(x+9*d,h/2);g.lineTo(x-9*d,h-10);g.lineTo(x-1*d,h-10);g.lineTo(x+17*d,h/2);g.lineTo(x-1*d,10);g.fill();}});
    const cm=[mkT(false),mkT(true)].map(t=>new THREE.MeshBasicMaterial({map:t,side:DS2})),cg=new THREE.PlaneGeometry(20,13),pg2=new THREE.BoxGeometry(1.4,22,1.4);pg2.translate(0,11,0);
    CHEV.forEach(c=>{const b=new THREE.Mesh(cg,cm[c.right?1:0]);b.position.set(c.x,26,c.y);b.rotation.y=c.rot;S.add(b);const p=new THREE.Mesh(pg2,postM);p.position.set(c.x,1.2,c.y);S.add(p);});}
  // tréninkové zóny: nápis na zemi a kruh driftové arény
  ZONES.forEach(z=>{const lt=tex(512,96,(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle='rgba(61,220,132,.9)';g.font=`italic 700 64px ${HUDF}`;g.textAlign='center';g.textBaseline='middle';g.fillText(z.label,w/2,h/2+4);});
    const lg=new THREE.PlaneGeometry(z.lx?150:260,z.lx?28:48);lg.rotateX(-Math.PI/2);const m=new THREE.Mesh(lg,new THREE.MeshBasicMaterial({map:lt,transparent:true,depthWrite:false}));
    const lx=z.lx||z.x,ly=z.ly||z.y-(z.ring?z.ring+40:150);m.position.set(lx,2.8,ly);m.rotation.y=z.lx?-(z.la+Math.PI/2):0;m.renderOrder=3;S.add(m);
    if(z.ring){const rg=new THREE.RingGeometry(z.ring-3,z.ring+3,72);rg.rotateX(-Math.PI/2);const ring=new THREE.Mesh(rg,new THREE.MeshBasicMaterial({color:0xf4f2ec,transparent:true,opacity:.8,depthWrite:false,side:DS2}));ring.position.set(z.x,2.7,z.y);S.add(ring);}});
  // chodci: nohy, kabát a hlava (instancovaně, animuje render3D)
  let peds=null;
  if(PEDS.length){const n=PEDS.length;
    const legG=new THREE.BoxGeometry(2.2,8,2.2);legG.translate(0,-4,0);
    const bodyG=new THREE.CylinderGeometry(2.6,3.3,11,8);bodyG.translate(0,5.5,0);
    const headG=new THREE.SphereGeometry(2.5,10,8);
    const legM=new THREE.MeshLambertMaterial({color:0x2a2d33});
    const legL=new THREE.InstancedMesh(legG,legM,n),legR=new THREE.InstancedMesh(legG,legM,n);
    const body=new THREE.InstancedMesh(bodyG,new THREE.MeshLambertMaterial({color:0xffffff}),n),head=new THREE.InstancedMesh(headG,new THREE.MeshLambertMaterial({color:0xffffff}),n);
    PEDS.forEach((p,i)=>{body.setColorAt(i,cc.set(p.c));head.setColorAt(i,cc.set(p.sk));});
    [legL,legR,body,head].forEach(m=>{m.frustumCulled=false;S.add(m);});peds={legL,legR,body,head};}
  // vlajky nobori, automaty a dráty nad ulicí (Tokio)
  const flags=[];
  if(FLAGS.length){const FT=[['大売出し','#d8262c','#fff'],['営業中','#1d5fb5','#fff'],['ラーメン','#f6d33c','#d8262c'],['新発売','#fff','#d8262c']].map(([t,bg,fg])=>tex(32,128,(g,w,h)=>{
      g.fillStyle=bg;g.fillRect(0,0,w,h);g.fillStyle=fg;g.fillRect(0,0,w,6);const ch=[...t],fs=Math.min(24,(h-20)/ch.length);g.font=`700 ${fs}px sans-serif`;g.textAlign='center';g.textBaseline='middle';
      ch.forEach((c,i)=>g.fillText(c,w/2,14+fs*(i+.5)));}));
    const poleG=new THREE.CylinderGeometry(.5,.5,40,5);poleG.translate(0,20,0);const clothG=new THREE.PlaneGeometry(9,28);clothG.translate(4.5,-14,0);
    const FM=FT.map(t=>new THREE.MeshLambertMaterial({map:t,side:DS2}));
    FLAGS.forEach(f=>{const g=new THREE.Group();g.position.set(f.x,2.2,f.y);g.add(new THREE.Mesh(poleG,postM));
      const cl=new THREE.Mesh(clothG,FM[f.tex]);cl.position.y=38;g.add(cl);S.add(g);flags.push({g,cl,f});});}
  if(VEND.length){const front=['#e8e6df','#d8262c','#1d5fb5'].map((bc,ci)=>tex(64,128,(g,w,h)=>{g.fillStyle=bc;g.fillRect(0,0,w,h);g.fillStyle='#f6f8fa';g.fillRect(5,8,w-10,62);
      const BC=['#d8262c','#2e9a4b','#f6d33c','#1d5fb5','#e86a1e','#7a3fbf'];for(let r=0;r<3;r++)for(let c=0;c<5;c++){g.fillStyle=BC[(r*5+c+ci)%6];g.fillRect(8+c*10.5,12+r*20,7,14);g.fillStyle='rgba(255,255,255,.6)';g.fillRect(9+c*10.5,13+r*20,2,10);}
      g.fillStyle='#1b1d20';g.fillRect(8,84,w-16,16);g.fillStyle='#59e0ff';g.fillRect(w-20,76,10,4);}));
    const vG=new THREE.BoxGeometry(14,30,10);vG.translate(0,15,0);
    front.forEach((ft,ci)=>{const list=VEND.filter(v=>v.c===ci);if(!list.length)return;const sideM=new THREE.MeshLambertMaterial({color:['#e8e6df','#c4202a','#1a4f9a'][ci]});
      const im=new THREE.InstancedMesh(vG,[sideM,sideM,sideM,sideM,sideM,new THREE.MeshBasicMaterial({map:ft})],list.length);
      list.forEach((v,i)=>{ps.set(v.x,2.2,v.y);qt.setFromAxisAngle(up,-v.a);sc.set(1,1,1);m4.compose(ps,qt,sc);im.setMatrixAt(i,m4);});S.add(im);});}
  if(TRK.id!=='brno'&&CITY.lamps.length){const pts=[];
    for(const side of [1,-1]){const L2=CITY.lamps.filter(l=>Math.sign(latAt(nearIdx(l.x,l.y),l.x,l.y))===side);
      for(let k=0;k+1<L2.length;k++){const a=L2[k],b=L2[k+1];if(Math.hypot(a.x-b.x,a.y-b.y)>230)continue;const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
        pts.push(a.x,52,a.y,mx,45,my,mx,45,my,b.x,52,b.y,a.x,48,a.y,mx,40,my,mx,40,my,b.x,48,b.y);}}
    const cg=new THREE.BufferGeometry();cg.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));S.add(new THREE.LineSegments(cg,new THREE.LineBasicMaterial({color:0x2a2d33})));}
  // okvětní lístky a listí ve větru
  const NP=WIND.parts.length,petPos=new Float32Array(NP*3),petCol=new Float32Array(NP*3),petG=new THREE.BufferGeometry();
  WIND.parts.forEach((q,i)=>{const c=new THREE.Color(q.c);petCol[i*3]=c.r;petCol[i*3+1]=c.g;petCol[i*3+2]=c.b;});
  petG.setAttribute('position',new THREE.BufferAttribute(petPos,3));petG.setAttribute('color',new THREE.BufferAttribute(petCol,3));
  const petals=new THREE.Points(petG,new THREE.PointsMaterial({size:3.4,vertexColors:true,transparent:true,opacity:.95,depthWrite:false}));petals.frustumCulled=false;S.add(petals);
  // auta
  const mkCar=()=>{const g=new THREE.Group();
    const bodyM=new THREE.MeshPhongMaterial({color:0xff0000,shininess:120,specular:0x9a9a9a}),dkM=new THREE.MeshPhongMaterial({color:0x880000,shininess:30});
    const glass=new THREE.MeshPhongMaterial({color:0x1d2b34,shininess:100,specular:0x8899aa}),tire=new THREE.MeshLambertMaterial({color:0x17191b}),white=new THREE.MeshLambertMaterial({color:0xf2f0e3});
    const box=(w,h,d,m,x,y,z)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);b.position.set(x,y,z);g.add(b);return b;};
    box(42,7,22,bodyM,0,8,0);box(10,3.5,20,bodyM,19,6,0);box(42.4,.6,4,white,0,11.7,0);
    box(19,7,18,glass,-3,15,0);box(13,1.4,16.4,bodyM,-4,19,0);box(4,1.6,25,dkM,-20,16.5,0);box(2,5,2,dkM,-20,13,-8);box(2,5,2,dkM,-20,13,8);
    const wg=new THREE.CylinderGeometry(5,5,4.5,14);wg.rotateX(Math.PI/2);const wheels=[];
    [[13,11.5],[13,-11.5],[-13,11.5],[-13,-11.5]].forEach(([x,z])=>{const w=new THREE.Mesh(wg,tire);w.position.set(x,5,z);g.add(w);wheels.push(w);});
    const hl=new THREE.MeshBasicMaterial({color:0xfff6c9});box(1,2.5,5,hl,21.3,8.5,-7);box(1,2.5,5,hl,21.3,8.5,7);
    const brake=new THREE.MeshBasicMaterial({color:0x7a1a14});box(1,2.5,5,brake,-21.3,9.5,-7);box(1,2.5,5,brake,-21.3,9.5,7);
    const shadow=new THREE.Mesh(shG,new THREE.MeshBasicMaterial({color:0x0a1a08,transparent:true,opacity:.35,depthWrite:false}));shadow.position.set(3,.3,4);shadow.scale.set(26,1,15);g.add(shadow);
    const fg=new THREE.ConeGeometry(4.5,20,8);fg.rotateZ(Math.PI/2);fg.translate(-10,0,0);
    const flame=new THREE.Mesh(fg,new THREE.MeshBasicMaterial({color:0xff9a30,transparent:true,opacity:.9}));flame.position.set(-21,9,0);g.add(flame);
    const shield=new THREE.Mesh(new THREE.SphereGeometry(31,18,12),new THREE.MeshBasicMaterial({color:0x5cc8f2,transparent:true,opacity:.28,depthWrite:false,side:THREE.DoubleSide}));shield.position.y=10;g.add(shield);
    const hm2=new THREE.SpriteMaterial({map:glowT,color:0xfff3d0,transparent:true,opacity:.9,blending:ADD,depthWrite:false});
    [-7,7].forEach(z=>{const sp=new THREE.Sprite(hm2);sp.position.set(24,8.5,z);sp.scale.set(15,15,1);g.add(sp);});
    const tailM=new THREE.SpriteMaterial({map:glowT,color:0xff3b30,transparent:true,opacity:.6,blending:ADD,depthWrite:false});
    [-7,7].forEach(z=>{const sp=new THREE.Sprite(tailM);sp.position.set(-23.5,9.5,z);sp.scale.set(11,11,1);g.add(sp);});
    const pg=new THREE.PlaneGeometry(1,1);pg.rotateX(-Math.PI/2);const beam=new THREE.Mesh(pg,new THREE.MeshBasicMaterial({map:glowT,color:0xfff0c8,transparent:true,opacity:.42*ENV.glow,blending:ADD,depthWrite:false}));
    beam.position.set(78,.3,0);beam.scale.set(120,1,70);g.add(beam);
    // kuře z kuřecí garáže
    const parts=g.children.filter(o=>o!==flame&&o!==shield&&o!==shadow),ck=new THREE.Group();ck.visible=false;g.add(ck);
    const featM=new THREE.MeshLambertMaterial({color:0xfbfaf4}),redM=new THREE.MeshLambertMaterial({color:0xe2302a}),yelM=new THREE.MeshLambertMaterial({color:0xf5b324}),blkM=new THREE.MeshBasicMaterial({color:0x111111});
    const sph=(r,m,x,y,z,sx,sy,sz,par)=>{const s=new THREE.Mesh(new THREE.SphereGeometry(r,14,10),m);s.position.set(x,y,z);s.scale.set(sx||1,sy||1,sz||1);(par||ck).add(s);return s;};
    sph(11,featM,0,19,0,1.5,1.05,1.1);sph(6,featM,-15,25,0,1,1.3,.9);
    const head=new THREE.Group();head.position.set(14,31,0);ck.add(head);sph(7.5,featM,0,0,0,1,1,1,head);
    [[-1,0],[1.6,-.4],[4,0]].forEach(([dx,dz],k)=>sph(2.6,redM,dx-1,7.5+(k===1?1:0),0,1,1,.6,head));
    const bk=new THREE.Mesh(new THREE.ConeGeometry(2.6,7,8),yelM);bk.rotation.z=-Math.PI/2;bk.position.set(9.5,-.5,0);head.add(bk);
    sph(2,redM,6.5,-5,0,.8,1.4,.7,head);[-3.6,3.6].forEach(z=>sph(1.2,blkM,4.8,2,z,1,1,1,head));
    const wings=[-1,1].map(sd=>{const w=new THREE.Group();w.position.set(-1,22,sd*13);ck.add(w);sph(8,featM,-2,-2,0,1.3,.8,.35,w);return w;});
    const legs=[-1,1].map(sd=>{const l=new THREE.Group();l.position.set(2,10,sd*5);ck.add(l);const c=new THREE.Mesh(new THREE.CylinderGeometry(1,1,10,6),yelM);c.position.y=-5;l.add(c);
      const f=new THREE.Mesh(new THREE.BoxGeometry(7,1.2,4),yelM);f.position.set(2,-10,0);l.add(f);return l;});
    return {g,bodyM,dkM,wheels,brake,flame,shield,tailM,col:'',parts,ck,head,wings,legs};};
  const cars=[0,1].map(()=>{const c=mkCar();S.add(c.g);return c;});
  // kamery a kokpity
  const cams=[0,1].map(()=>{const cam=new THREE.PerspectiveCamera(70,1,1,6800);S.add(cam);
    const ck=new THREE.Group();cam.add(ck);
    const hoodM=new THREE.MeshLambertMaterial({color:0xffffff});
    const hood=new THREE.Mesh(new THREE.BoxGeometry(24,2,26),hoodM);hood.position.set(0,-7,-29);ck.add(hood);
    const st=new THREE.Mesh(new THREE.BoxGeometry(3.6,.3,26),new THREE.MeshLambertMaterial({color:0xd9d6c8}));st.position.set(0,-5.9,-29);ck.add(st);
    const dash=new THREE.Mesh(new THREE.BoxGeometry(80,8,1),new THREE.MeshLambertMaterial({color:0x262b30}));dash.position.set(0,-7.6,-10);ck.add(dash);
    const trimM=new THREE.MeshBasicMaterial({color:0xffffff});const trim=new THREE.Mesh(new THREE.BoxGeometry(80,.3,.2),trimM);trim.position.set(0,-3.6,-10.4);ck.add(trim);
    const wheel=new THREE.Group();wheel.position.set(0,-5,-8.6);
    const wm=new THREE.MeshPhongMaterial({color:0x1c1f22,shininess:40});
    wheel.add(new THREE.Mesh(new THREE.TorusGeometry(2.2,.32,8,30),wm));
    const sp1=new THREE.Mesh(new THREE.BoxGeometry(4.2,.4,.3),wm);wheel.add(sp1);const sp2=new THREE.Mesh(new THREE.BoxGeometry(.4,2.2,.3),wm);sp2.position.y=-1.1;wheel.add(sp2);
    const markM=new THREE.MeshBasicMaterial({color:0xffffff});const mark=new THREE.Mesh(new THREE.BoxGeometry(.6,.6,.45),markM);mark.position.y=2.2;wheel.add(mark);
    ck.add(wheel);
    const dc=document.createElement('canvas');dc.width=200;dc.height=140;const dg=dc.getContext('2d'),dispT=new THREE.CanvasTexture(dc);
    const featM=new THREE.MeshLambertMaterial({color:0xfbfaf4}),feat2=new THREE.MeshLambertMaterial({color:0xe9e5d8}),bkM=new THREE.MeshLambertMaterial({color:0xf5b324}),cbM=new THREE.MeshLambertMaterial({color:0xe2302a});
    const chk=new THREE.Group();chk.visible=false;ck.add(chk);
    for(let k=0;k<13;k++){const f=new THREE.Mesh(new THREE.SphereGeometry(3.2,10,8),k%2?feat2:featM);const u=(k-6)/6;f.position.set(u*15,-8.2+Math.abs(u)*2.2+(k%3)*.4,-11+Math.abs(u)*1.5);f.scale.set(1.6,1,1.2);chk.add(f);}
    for(let k=0;k<7;k++){const f=new THREE.Mesh(new THREE.ConeGeometry(1.4,5,6),featM);f.position.set((k-3)*4.2,-4.6,-11.6);f.rotation.z=(k-3)*.12;chk.add(f);}
    const bk=new THREE.Mesh(new THREE.ConeGeometry(1.6,5,10),bkM);bk.rotation.x=-Math.PI/2;bk.position.set(0,-4.8,-15);chk.add(bk);
    const wl=[-1,1].map(sd=>{const w=new THREE.Group();w.position.set(sd*12,-6,-9);const wm2=new THREE.Mesh(new THREE.SphereGeometry(4,10,8),featM);wm2.scale.set(.6,1.4,1.8);w.add(wm2);chk.add(w);return w;});
    const cockpit=[hood,st,dash,trim,wheel];
    const disp=new THREE.Mesh(new THREE.PlaneGeometry(1.43,1),new THREE.MeshBasicMaterial({map:dispT,transparent:true,depthTest:false,depthWrite:false,fog:false}));disp.renderOrder=10;ck.add(disp);ck.traverse(o=>{if(o.material)o.material.userData.noTerr=true;});
    return {cam,ck,hoodM,markM,trimM,wheel,col:'',dc,dg,dispT,disp,dkey:'',chk,wl,cockpit};});
  // částice
  const PMAX=430,pPos=new Float32Array(PMAX*3),pCol=new Float32Array(PMAX*3),pg=new THREE.BufferGeometry();
  pg.setAttribute('position',new THREE.BufferAttribute(pPos,3));pg.setAttribute('color',new THREE.BufferAttribute(pCol,3));
  const parts=new THREE.Points(pg,new THREE.PointsMaterial({size:6,vertexColors:true,transparent:true,opacity:.85,depthWrite:false}));parts.frustumCulled=false;S.add(parts);
  cullPrep(S,[peds&&peds.legL,peds&&peds.legR,peds&&peds.body,peds&&peds.head,lanterns&&lanterns.im].filter(Boolean));
  // kuřecí garáž: tři zdi, střecha, svítící strop a neonový nápis nad vraty
  let garDoor=null,garEgg=null;
  if(GARAGE&&T.free){const q=GARAGE,wm=new THREE.MeshLambertMaterial({color:0x9aa3ad}),rm=new THREE.MeshLambertMaterial({color:0x3a414a});
    const bx=(w,h,d,m,x,y,z)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);b.position.set(x,y,z);S.add(b);return b;};
    for(const wl of CITY.gwalls)bx(wl.w,70,wl.d,wm,wl.x,35,wl.y);
    bx(q.w+10,8,q.d+16,rm,q.x,74,q.y);
    const stripT=tex(64,16,(g,w,h)=>{for(let i=0;i<8;i++){g.fillStyle=i%2?'#1a1d21':'#f2c14e';g.beginPath();g.moveTo(i*8,0);g.lineTo(i*8+8,0);g.lineTo(i*8,h);g.lineTo(i*8-8,h);g.fill();}},true);
    bx(6,14,q.d,new THREE.MeshLambertMaterial({map:stripT}),q.x+q.w/2,63,q.y);
    const doorT=tex(64,64,(g,w,h)=>{g.fillStyle='#b8bfc7';g.fillRect(0,0,w,h);g.fillStyle='#8a929b';for(let y=0;y<h;y+=8)g.fillRect(0,y,w,2);},true);
    const door=new THREE.Mesh(new THREE.BoxGeometry(4,1,q.d-q.t),new THREE.MeshLambertMaterial({map:doorT}));door.position.set(q.x+q.w/2-4,35,q.y);door.scale.y=70;S.add(door);garDoor=door;
    const egg=new THREE.Group();egg.position.set(q.egg.x,0,q.egg.y);const em=new THREE.Mesh(new THREE.SphereGeometry(8,18,14),new THREE.MeshPhongMaterial({color:0xf2c14e,emissive:0x8a5a00,shininess:120,specular:0xffffff}));
    em.scale.set(1,1.3,1);em.position.y=16;egg.add(em);const eg=new THREE.Sprite(new THREE.SpriteMaterial({map:glowT,color:0xffd36e,transparent:true,opacity:.8,blending:ADD,depthWrite:false}));eg.position.y=16;eg.scale.set(60,60,1);egg.add(eg);S.add(egg);garEgg=egg;
    const lit=new THREE.Mesh(new THREE.PlaneGeometry(q.w-40,30),new THREE.MeshBasicMaterial({color:0xfff2c4}));lit.rotation.x=Math.PI/2;lit.position.set(q.x,69.5,q.y);S.add(lit);
    const fl=new THREE.Mesh(new THREE.PlaneGeometry(q.w-10,q.d-10),new THREE.MeshLambertMaterial({color:0x2a2e33}));fl.rotation.x=-Math.PI/2;fl.position.set(q.x,1.6,q.y);S.add(fl);
    const sT=tex(256,64,(g,w,h)=>{g.fillStyle='#120c1c';g.fillRect(0,0,w,h);g.font='italic 700 40px "Chakra Petch",sans-serif';g.textAlign='center';g.textBaseline='middle';g.shadowColor='#ff4fa0';g.shadowBlur=14;g.fillStyle='#ffd0e6';g.fillText('🐔 GARÁŽ',w/2,h/2+2);});
    const sg=new THREE.Mesh(new THREE.PlaneGeometry(150,38),new THREE.MeshBasicMaterial({map:sT}));sg.position.set(q.x+q.w/2+5,98,q.y);sg.rotation.y=Math.PI/2;S.add(sg);
    const sgb=new THREE.Mesh(new THREE.BoxGeometry(4,38,150),rm);sgb.position.set(q.x+q.w/2+2,98,q.y);S.add(sgb);}
  const gar=(()=>{const GS=new THREE.Scene();GS.background=new THREE.Color('#06080c');GS.fog=new THREE.Fog('#06080c',320,1000);
    GS.add(new THREE.HemisphereLight(0x9fb6d8,0x0a0c10,.55));
    const key=new THREE.SpotLight(0xffffff,1.7,900,.5,.55,1);key.position.set(60,240,150);GS.add(key);GS.add(key.target);
    const rim=new THREE.DirectionalLight(0x3fd8ff,.8);rim.position.set(-1,.5,-1);GS.add(rim);const fill=new THREE.DirectionalLight(0xffc9a0,.35);fill.position.set(1,.3,.8);GS.add(fill);
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(2400,2400),new THREE.MeshPhongMaterial({color:0x0b0e13,shininess:110,specular:0x2c3644}));floor.rotation.x=-Math.PI/2;GS.add(floor);
    const lineM=new THREE.MeshBasicMaterial({color:0x3fd8ff,transparent:true,opacity:.35});for(const z of [-80,80]){const l=new THREE.Mesh(new THREE.BoxGeometry(1100,.3,1.2),lineM);l.position.set(0,.2,z);GS.add(l);}
    const tt=new THREE.Mesh(new THREE.CylinderGeometry(52,54,2,64),new THREE.MeshPhongMaterial({color:0x151a22,shininess:70}));tt.position.y=1;GS.add(tt);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(53,.7,8,96),new THREE.MeshBasicMaterial({color:0x3fd8ff}));ring.rotation.x=Math.PI/2;ring.position.y=2.1;GS.add(ring);
    const gpl=new THREE.PlaneGeometry(1,1);gpl.rotateX(-Math.PI/2);const gr=new THREE.Mesh(gpl,new THREE.MeshBasicMaterial({map:glowT,color:0x3fd8ff,transparent:true,opacity:.3,blending:ADD,depthWrite:false}));gr.scale.set(170,1,170);gr.position.y=.4;GS.add(gr);
    const wallM=new THREE.MeshLambertMaterial({color:0x10151d}),stripM=new THREE.MeshBasicMaterial({color:0xe8f6ff}),cyM=new THREE.MeshBasicMaterial({color:0x3fd8ff});
    const wall=new THREE.Mesh(new THREE.BoxGeometry(1600,340,6),wallM);wall.position.set(0,170,-320);GS.add(wall);
    for(let k=0;k<6;k++){const st=new THREE.Mesh(new THREE.BoxGeometry(150,3,2),stripM);st.position.set(-600+k*240,200,-316);GS.add(st);const s2=st.clone();s2.position.y=130;GS.add(s2);}
    for(const x of [-380,380]){const col=new THREE.Mesh(new THREE.BoxGeometry(24,340,24),wallM);col.position.set(x,170,-210);GS.add(col);const cl=new THREE.Mesh(new THREE.BoxGeometry(2,280,2),cyM);cl.position.set(x+13,160,-197);GS.add(cl);}
    for(let k=-1;k<=1;k++){const p=new THREE.Mesh(new THREE.BoxGeometry(170,2,36),stripM);p.position.set(k*210,270,-40);GS.add(p);}
    const c=mkCar();c.bodyM.color.set(C.p1);c.dkM.color.set(C.p1dk);c.g.position.y=2;c.flame.visible=false;c.shield.visible=false;GS.add(c.g);
    return {S:GS,cam:new THREE.PerspectiveCamera(32,1,1,3000),car:c};})();
  gar.S.traverse(o=>{if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{m.userData.noTerr=true;});});
  return {garDoor,garEgg,renderer,S,sky,cars,cams,gar,pkM,oils,padT,cones,barLights,rline,peds,flags,lanterns,petals,petPos,petG,clouds,parts,pPos,pCol,pg,qT,banT,v3:new THREE.Vector3(),PMAX};
}
try{R3=build3D();}catch(e){R3=null;}
try{document.fonts&&document.fonts.ready.then(()=>{if(R3){R3.qT.redraw();R3.banT.redraw();}});}catch(e){}
