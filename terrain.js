/* Turbo Kára · terrain.js: reálný terén Brna: výpočet výšek a vertex shader, který zvedá celou scénu */
'use strict';
/* ---------- reálný terén Brna: AWS Terrain Tiles (Terrarium, z14), výšky v m n. m.; mřížka 60×80, krok 6 px ≈ 113 u, 2 znaky = (m-180)*2 v soustavě 36 ---------- */
let TERR=null;
function buildTerrain(){
  const NX=60,NY=80,U=3,A=0.05297890040371567,B=438.90729544032365,D=551.6489169504493,SC=3.02,E0=234;
  const g=new Float32Array(NX*NY);
  for(let j=0;j<NY;j++){const r=BRNO_TERR[j];for(let i=0;i<NX;i++)g[j*NX+i]=parseInt(r.substr(i*2,2),36)/2+180;}
  const step=6/A/U,x0=(203-B)/A,z0=(223-D)/A,nx=(NX-1)*U+1,ny=(NY-1)*U+1,H=new Float32Array(nx*ny);
  const cr=(p0,p1,p2,p3,t)=>p1+.5*t*(p2-p0+t*(2*p0-5*p1+4*p2-p3+t*(3*(p1-p2)+p3-p0)));
  const gv=(i,j)=>g[Math.max(0,Math.min(NY-1,j))*NX+Math.max(0,Math.min(NX-1,i))];
  for(let l=0;l<ny;l++){const j=Math.floor(l/U),tv=(l%U)/U;
    for(let k=0;k<nx;k++){const i=Math.floor(k/U),tu=(k%U)/U;
      const c=[];for(let q=-1;q<=2;q++)c.push(cr(gv(i-1,j+q),gv(i,j+q),gv(i+1,j+q),gv(i+2,j+q),tu));
      let v=cr(c[0],c[1],c[2],c[3],tv);
      const e=Math.min(k,nx-1-k,l,ny-1-l),w=Math.min(1,e/30),ws=w*w*(3-2*w);
      // Špilberk: skutečný kopec je v městské zástavbě skoro schovaný, park uvnitř okruhu proto mírně převýšíme (trať je dál než 840 u, té se to netýká)
      const sr=Math.hypot(x0+k*step+1180,z0+l*step+190),bump=sr<650?150*Math.pow(Math.cos(sr/650*Math.PI/2),2):0;
      H[l*nx+k]=(v-E0)*SC*ws+bump;}}
  let mn=1e9,mx=-1e9;for(let q=0;q<H.length;q++){if(H[q]<mn)mn=H[q];if(H[q]>mx)mx=H[q];}
  const rg=mx-mn||1,tex=new Uint8Array(nx*ny*4);
  for(let q=0;q<H.length;q++){const v=Math.round((H[q]-mn)/rg*65535);tex[q*4]=v>>8;tex[q*4+1]=v&255;tex[q*4+3]=255;}
  const o={x0,z0,inv:1/step,nx,ny,H,mn,rg};
  if(window.THREE){const t=new THREE.DataTexture(tex,nx,ny,THREE.RGBAFormat,THREE.UnsignedByteType);t.minFilter=t.magFilter=THREE.NearestFilter;t.generateMipmaps=false;t.flipY=false;t.needsUpdate=true;
    o.u={tTerr:{value:t},tDim:{value:new THREE.Vector2(nx,ny)},tOrg:{value:new THREE.Vector4(x0,z0,1/step,1/step)},tRng:{value:new THREE.Vector2(mn,rg)}};}
  return o;
}
function hAt(x,z){if(!TERR)return 0;let u=(x-TERR.x0)*TERR.inv,v=(z-TERR.z0)*TERR.inv;const nx=TERR.nx;
  u=u<0?0:u>nx-1.001?nx-1.001:u;v=v<0?0:v>TERR.ny-1.001?TERR.ny-1.001:v;
  const i=u|0,j=v|0,fu=u-i,fv=v-j,H=TERR.H,o=j*nx+i;
  return (H[o]*(1-fu)+H[o+1]*fu)*(1-fv)+(H[o+nx]*(1-fu)+H[o+nx+1]*fu)*fv;}
// terén se aplikuje ve vertex shaderu na celou scénu: každý vrchol se zvedne o výšku terénu pod sebou
function hookTerrain(){
  const P=THREE.Material.prototype;if(P.__terr)return;P.__terr=1;
  const ob=P.onBeforeCompile,ck=P.customProgramCacheKey;
  const DECL=`uniform highp sampler2D tTerr;uniform vec2 tDim;uniform vec4 tOrg;uniform vec2 tRng;
float tdec(vec2 p){vec4 c=texture2D(tTerr,(p+.5)/tDim);return (c.r*65280.+c.g*255.)/65535.;}
float terrH(vec2 xz){vec2 p=clamp((xz-tOrg.xy)*tOrg.zw,vec2(0.),tDim-1.001);vec2 i=floor(p),f=p-i;
float a=tdec(i),b=tdec(i+vec2(1.,0.)),c=tdec(i+vec2(0.,1.)),d=tdec(i+vec2(1.,1.));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y)*tRng.y+tRng.x;}
`;
  P.onBeforeCompile=function(sh,rd){
    if(ob)ob.call(this,sh,rd);
    if(!TERR||!TERR.u||this.userData.noTerr||sh.vertexShader.indexOf('#include <project_vertex>')<0)return;
    Object.assign(sh.uniforms,TERR.u);
    let v=sh.vertexShader.replace('#include <common>','#include <common>\n'+DECL).replace('#include <project_vertex>',`
vec4 mvPosition=vec4(transformed,1.0);
#ifdef USE_INSTANCING
mvPosition=instanceMatrix*mvPosition;
#endif
vec4 tw=modelMatrix*mvPosition;tw.y+=terrH(tw.xz);
mvPosition=viewMatrix*tw;
gl_Position=projectionMatrix*mvPosition;`);
    if(this.userData.terrN)v=v.replace('#include <beginnormal_vertex>',`vec3 objectNormal=vec3(0.,1.,0.);
{vec4 tp0=modelMatrix*vec4(position,1.0);float te=30.;float thx=terrH(tp0.xz+vec2(te,0.))-terrH(tp0.xz-vec2(te,0.));float thz=terrH(tp0.xz+vec2(0.,te))-terrH(tp0.xz-vec2(0.,te));objectNormal=normalize(vec3(-thx,2.*te,-thz));}`);
    sh.vertexShader=v;};
  P.customProgramCacheKey=function(){return (ck?ck.call(this):'')+(TERR&&!this.userData.noTerr?(this.userData.terrN?'TN':'T'):'');};
}
if(window.THREE)hookTerrain();
/* ---------- ořezávání mimo záběr (frustum culling), které počítá s terénem ----------
   Terén zvedá vrcholy až ve vertex shaderu, takže three.js neví, kde objekt doopravdy je. Tady to doplníme:
   koule objektu se posune na výšku terénu pod ní a trochu zvětší (svahy do 40 %). Velké celky (domy, stromy, lampy)
   se rozdělí na čtverce CULL_CELL×CULL_CELL, aby se kreslily jen ty v záběru. */
const CULL_CELL=1600;
const noTerrOf=o=>{const m=o.material;if(!m)return true;return Array.isArray(m)?m.some(x=>x.userData.noTerr):!!m.userData.noTerr;};
function terrSphere(sp){if(TERR){sp.center.y+=hAt(sp.center.x,sp.center.z);sp.radius+=sp.radius*.4+12;}return sp;}
function hookCulling(){
  const F=THREE.Frustum.prototype;if(F.__tc)return;F.__tc=1;const sp=new THREE.Sphere();
  F.intersectsObject=function(o){
    const ud=o.userData;
    if(ud.bs)sp.copy(ud.bs);
    else{const g=o.geometry;if(!g)return true;if(g.boundingSphere===null)g.computeBoundingSphere();
      sp.copy(g.boundingSphere).applyMatrix4(o.matrixWorld);if(TERR&&!noTerrOf(o))terrSphere(sp);}
    return this.intersectsSphere(sp);};
}
if(window.THREE)hookCulling();
// koule pro skupinu vrcholů/instancí ve světových souřadnicích (už i s terénem)
function sphereFromBox(b,o){const sp=new THREE.Sphere();b.getBoundingSphere(sp);if(!noTerrOf(o))terrSphere(sp);return sp;}
// rozdělí statický InstancedMesh na čtverce; vrátí skupinu, nebo null, když to nemá smysl
function chunkInst(im){
  const n=im.count,a=im.instanceMatrix.array,ic=im.instanceColor,g=im.geometry;if(n<16)return null;
  if(g.boundingSphere===null)g.computeBoundingSphere();
  const gs=g.boundingSphere,B=new Map();
  for(let i=0;i<n;i++){const k=Math.floor(a[i*16+12]/CULL_CELL)+','+Math.floor(a[i*16+14]/CULL_CELL);let l=B.get(k);if(!l)B.set(k,l=[]);l.push(i);}
  if(B.size<2)return null;
  const grp=new THREE.Group(),m=new THREE.Matrix4(),c=new THREE.Vector3(),box=new THREE.Box3(),v=new THREE.Vector3();
  B.forEach(ids=>{const cm=new THREE.InstancedMesh(g,im.material,ids.length);box.makeEmpty();
    ids.forEach((i,j)=>{for(let q=0;q<16;q++)cm.instanceMatrix.array[j*16+q]=a[i*16+q];
      if(ic){if(!cm.instanceColor)cm.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(ids.length*3),3);for(let q=0;q<3;q++)cm.instanceColor.array[j*3+q]=ic.array[i*3+q];}
      m.fromArray(a,i*16);c.copy(gs.center).applyMatrix4(m);const r=gs.radius*m.getMaxScaleOnAxis();
      box.expandByPoint(v.set(c.x-r,c.y-r,c.z-r));box.expandByPoint(v.set(c.x+r,c.y+r,c.z+r));});
    cm.userData.bs=sphereFromBox(box,im);cm.frustumCulled=true;cm.renderOrder=im.renderOrder;cm.visible=im.visible;grp.add(cm);});
  return grp;
}
// po postavení scény: rozdělí velké statické InstancedMeshe (pohyblivé chodce a lampiony vynechá)
function cullPrep(S,skip){
  const list=S.children.filter(o=>o.isInstancedMesh&&!skip.includes(o));
  list.forEach(im=>{const grp=chunkInst(im);if(grp){S.remove(im);S.add(grp);}});
}
const brnoW=(px,py)=>[(px-1128)*5,(py-1238)*5];
