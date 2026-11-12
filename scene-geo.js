/* Turbo Kára · scene-geo.js: geometrie domů a barvy pro 3D scénu: col3() barva z CSS, prismGeo() sedlová střecha, osmGeo() domy Brna z OpenStreetMap (po čtvercích). Načítá se před scene3d.js. */
'use strict';
const colCache=new Map();
function col3(s){let c=colCache.get(s);if(c)return c;c=new THREE.Color();const m=/rgba?\(([^)]+)\)/.exec(s);
  if(m){const p=m[1].split(',').map(Number);c.setRGB(p[0]/255,p[1]/255,p[2]/255);}else c.set(s);colCache.set(s,c);return c;}
function prismGeo(){const g=new THREE.BufferGeometry();
  const A=[-.5,0,-.5],B=[.5,0,-.5],C=[.5,0,.5],D=[-.5,0,.5],R1=[-.5,1,0],R2=[.5,1,0],tri=(a,b,c)=>[...a,...b,...c];
  g.setAttribute('position',new THREE.Float32BufferAttribute([...tri(A,R2,B),...tri(A,R1,R2),...tri(C,R1,D),...tri(C,R2,R1),...tri(A,D,R1),...tri(B,R2,C)],3));g.computeVertexNormals();return g;}
// skutečné půdorysy -> jedna sloučená geometrie: stěny s okny (textura) a střechy (sedlová u obdélníků, jinak plochá)
function osmGeo(blds,tx){
  tx.wrapS=THREE.RepeatWrapping;
  const col=new THREE.Color(),CELLS=new Map();
  const pushC=(arr,c,n)=>{for(let i=0;i<n;i++)arr.push(c.r,c.g,c.b);};
  // domy se skládají po čtvercích (CULL_CELL), aby se kreslily jen ty v záběru
  const cellOf=b=>{const k=Math.floor(b.x/CULL_CELL)+','+Math.floor(b.y/CULL_CELL);let c=CELLS.get(k);if(!c)CELLS.set(k,c={wp:[],wu:[],wc:[],rp:[],rcl:[]});return c;};
  for(const b of blds){
    const {wp,wu,wc,rp,rcl}=cellOf(b);
    const P=b.pts,n=P.length,h=b.h,vT=Math.min(b.lv,8)/8;
    col.set(b.c);const wc0=col.clone();col.set(b.rc);const rc0=col.clone();
    for(let i=0;i<n;i++){const a=P[i],c=P[(i+1)%n],len=Math.hypot(c[0]-a[0],c[1]-a[1]);if(len<1)continue;const nr=Math.max(1,Math.round(len/80));
      wp.push(a[0],-9,a[1],c[0],-9,c[1],c[0],h,c[1],a[0],-9,a[1],c[0],h,c[1],a[0],h,a[1]);
      wu.push(0,0,nr,0,nr,vT,0,0,nr,vT,0,vT);pushC(wc,wc0,6);}
    const R=(x,y,z)=>rp.push(x,y,z);
    if(n===4&&b.lv<=7){
      const l01=Math.hypot(P[1][0]-P[0][0],P[1][1]-P[0][1]),l12=Math.hypot(P[2][0]-P[1][0],P[2][1]-P[1][1]),sh=Math.min(l01,l12),rh=Math.max(14,Math.min(40,sh*.28));
      let a=P[0],c=P[1],d=P[2],e=P[3];if(l01<l12){a=P[1];c=P[2];d=P[3];e=P[0];}
      // a-c je dlouhá strana, c-d krátká; hřeben spojuje středy krátkých stran
      const m1=[(c[0]+d[0])/2,(c[1]+d[1])/2],m2=[(e[0]+a[0])/2,(e[1]+a[1])/2];
      R(a[0],h,a[1]);R(c[0],h,c[1]);R(m1[0],h+rh,m1[1]);R(a[0],h,a[1]);R(m1[0],h+rh,m1[1]);R(m2[0],h+rh,m2[1]);
      R(d[0],h,d[1]);R(e[0],h,e[1]);R(m2[0],h+rh,m2[1]);R(d[0],h,d[1]);R(m2[0],h+rh,m2[1]);R(m1[0],h+rh,m1[1]);
      pushC(rcl,rc0,12);
      R(c[0],h,c[1]);R(d[0],h,d[1]);R(m1[0],h+rh,m1[1]);R(e[0],h,e[1]);R(a[0],h,a[1]);R(m2[0],h+rh,m2[1]);pushC(rcl,wc0,6);
    }else{
      let tri=[];try{tri=THREE.ShapeUtils.triangulateShape(P.map(p=>new THREE.Vector2(p[0],p[1])),[]);}catch(e){}
      if(!tri.length)for(let i=1;i<n-1;i++)tri.push([0,i,i+1]);
      for(const t of tri)for(const k of t)R(P[k][0],h+1,P[k][1]);
      pushC(rcl,rc0.clone().multiplyScalar(.8),tri.length*3);
    }
  }
  const mk=(pos,uv,cl,mat)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));if(uv)g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
    g.setAttribute('color',new THREE.Float32BufferAttribute(cl,3));g.computeVertexNormals();g.computeBoundingSphere();const m=new THREE.Mesh(g,mat);m.frustumCulled=false;return m;};
  const DS=THREE.DoubleSide,wM=new THREE.MeshLambertMaterial({map:tx,vertexColors:true,side:DS}),rM=new THREE.MeshLambertMaterial({vertexColors:true,side:DS});
  const walls=new THREE.Group(),roofs=new THREE.Group();walls.material=wM;roofs.material=rM;
  const cull=m=>{m.frustumCulled=true;const sp=m.geometry.boundingSphere.clone();if(TERR)terrSphere(sp);m.userData.bs=sp;return m;};
  CELLS.forEach(c=>{if(c.wp.length)walls.add(cull(mk(c.wp,c.wu,c.wc,wM)));if(c.rp.length)roofs.add(cull(mk(c.rp,null,c.rcl,rM)));});
  return {walls,roofs};
}
