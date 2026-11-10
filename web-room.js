/* Turbo Kára · web-room.js — spojení mobilu a obrazovky na veřejném webu (bez claude.ai).
   Staví „místnost“ se stejným rozhraním jako na claude.ai (presence/emit/on/onPeers),
   ale povely jdou napřímo mezi zařízeními přes WebRTC (PeerJS) → mnohem nižší odezva.
   Na claude.ai se NEAKTIVUJE: tam už window.claude existuje a použije se původní spojení.
   Načítá se PŘED net.js. Hvězdicová topologie: obrazovka = rozbočovač, mobily se k ní připojí. */
'use strict';
(function(){
  if(window.claude&&typeof window.claude.use==='function')return; // claude.ai → nech původní místnost
  if(typeof Peer==='undefined'){window.claude={use:n=>Promise.resolve(null)};return;} // PeerJS se nenačetl → jen klávesnice

  var params=new URLSearchParams(location.search);
  var join=(params.get('p')||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,5);
  var isHost=!join;
  var ALPH='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  function genCode(){var o='';for(var i=0;i<4;i++)o+=ALPH[Math.floor(Math.random()*ALPH.length)];return o;}
  var code=isHost?genCode():join;
  var hid=function(c){return 'tkara-'+c;};

  var peersCb=null,discCb=null,onH={},myPres={},resolved=false,resolveReady;
  var roomPromise=new Promise(function(r){resolveReady=r;});
  window.claude={use:function(n){return n==='room'?roomPromise:Promise.resolve(null);}};
  function fire(t,m){var h=onH[t];if(h){try{h(m);}catch(e){}}}
  function firePeers(list){if(peersCb){try{peersCb({peers:list});}catch(e){}}}

  var api={
    onPeers:function(cb,dc){peersCb=cb;discCb=dc;},
    on:function(t,h){onH[t]=h;},
    presence:function(patch){Object.assign(myPres,patch);sendPresence();return Promise.resolve();},
    emit:function(t,d){sendEvent(t,d);return Promise.resolve();},
    peers:function(){return currentPeers();}
  };
  var sendPresence=function(){},sendEvent=function(){},currentPeers=function(){return [];};

  var peer;
  if(isHost){
    // ----- OBRAZOVKA: rozbočovač, čeká na připojení mobilů -----
    var conns=new Map();
    currentPeers=function(){var out=[];conns.forEach(function(c,id){out.push({peer:id,presence:c.pres,sameTab:false});});return out;};
    function peersFor(exclude){var out=[{peer:'HOST',presence:myPres,sameTab:false}];
      conns.forEach(function(c,id){if(id!==exclude)out.push({peer:id,presence:c.pres,sameTab:false});});return out;}
    function broadcast(){conns.forEach(function(c,id){try{c.conn.send({t:'peers',peers:peersFor(id)});}catch(e){}});firePeers(currentPeers());}
    sendPresence=function(){broadcast();};
    sendEvent=function(t,d){conns.forEach(function(c){try{c.conn.send({t:'ev',topic:t,data:d});}catch(e){}});};
    function startHost(){
      peer=new Peer(hid(code),{debug:0});
      peer.on('open',function(){if(!resolved){resolved=true;resolveReady(api);}updateBanner();});
      peer.on('error',function(e){
        if(e&&e.type==='unavailable-id'){code=genCode();try{peer.destroy();}catch(x){}startHost();return;}
        if(!resolved){resolved=true;resolveReady(e&&e.type==='browser-incompatible'?null:api);}
      });
      peer.on('connection',function(conn){
        conn.on('open',function(){conns.set(conn.peer,{conn:conn,pres:{}});broadcast();});
        conn.on('data',function(d){var c=conns.get(conn.peer);if(!c)return;
          if(d.t==='pres'){c.pres=d.pres||{};broadcast();}
          else if(d.t==='ev'){fire(d.topic,{peer:conn.peer,data:d.data,sameTab:false});
            conns.forEach(function(o,id){if(id!==conn.peer)try{o.conn.send({t:'ev',topic:d.topic,data:d.data});}catch(e){}});}
        });
        conn.on('close',function(){conns.delete(conn.peer);broadcast();});
        conn.on('error',function(){conns.delete(conn.peer);broadcast();});
      });
    }
    startHost();
  } else {
    // ----- MOBIL: připojí se k obrazovce podle kódu z odkazu -----
    var hostPeers=[],conn=null;
    currentPeers=function(){return hostPeers;};
    sendPresence=function(){if(conn&&conn.open)try{conn.send({t:'pres',pres:myPres});}catch(e){}};
    sendEvent=function(t,d){if(conn&&conn.open)try{conn.send({t:'ev',topic:t,data:d});}catch(e){}};
    function startCtrl(){
      peer=new Peer({debug:0});
      peer.on('open',function(){conn=peer.connect(hid(code),{reliable:true});
        conn.on('open',function(){if(!resolved){resolved=true;resolveReady(api);}sendPresence();});
        conn.on('data',function(d){if(d.t==='peers'){hostPeers=d.peers||[];firePeers(hostPeers);}
          else if(d.t==='ev')fire(d.topic,{peer:'HOST',data:d.data,sameTab:false});});
        conn.on('close',function(){hostPeers=[];firePeers([]);if(discCb)discCb();});
        conn.on('error',function(){});
      });
      peer.on('error',function(e){if(!resolved){resolved=true;resolveReady(api);}}); // ponech ovladač, zkoušej dál
    }
    startCtrl();
    // po načtení hry přepni rovnou do režimu ovladače
    addEventListener('load',function(){setTimeout(function(){try{if(typeof showCtrl==='function')showCtrl();}catch(e){}},50);});
  }

  // ---- pruh s kódem na obrazovce (jen host, jen v čekárně) ----
  var bn=null;
  function updateBanner(){
    if(!isHost)return;
    var inLobby=(typeof appScr!=='undefined'&&appScr==='lobby');
    if(!inLobby){if(bn)bn.style.display='none';return;}
    if(!bn){
      bn=document.createElement('div');
      bn.style.cssText='position:fixed;left:50%;top:max(10px,env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:50;'
        +'background:rgba(9,15,24,.94);border:1px solid rgba(63,216,255,.4);border-radius:4px;padding:10px 16px;text-align:center;'
        +"font-family:'Chakra Petch','Barlow Condensed',sans-serif;color:#eef3f7;box-shadow:0 10px 40px rgba(0,0,0,.5);max-width:92vw";
      document.body.appendChild(bn);
    }
    bn.style.display='block';
    var url=location.origin+location.pathname+'?p='+code;
    bn.innerHTML='<div style="font-size:12px;letter-spacing:.14em;color:#93a6b8">MOBIL JAKO VOLANT</div>'
      +'<div style="font-size:13px;color:#93a6b8;margin-top:4px">Na mobilu otevři <b style="color:#eef3f7">'+location.host+location.pathname+'</b></div>'
      +'<div style="font-size:13px;color:#93a6b8">a zadej kód, nebo otevři přímý odkaz:</div>'
      +'<div style="font-size:34px;font-weight:700;font-style:italic;letter-spacing:.12em;color:#3fd8ff;margin:4px 0">'+code+'</div>'
      +'<button id="tkCopy" style="font:inherit;font-size:13px;cursor:pointer;border:0;border-radius:3px;padding:6px 14px;background:#1fb3e2;color:#04121a">Zkopírovat odkaz</button>';
    var cp=bn.querySelector('#tkCopy');
    if(cp)cp.onclick=function(){try{navigator.clipboard.writeText(url);cp.textContent='Zkopírováno';setTimeout(function(){cp.textContent='Zkopírovat odkaz';},1500);}catch(e){}};
  }
  setInterval(updateBanner,400);
})();
