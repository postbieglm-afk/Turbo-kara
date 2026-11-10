/* Turbo Kára · web-room.js — spojení mobilu a obrazovky na veřejném webu (bez claude.ai).
   Staví „místnost“ se stejným rozhraním jako na claude.ai (presence/emit/on/onPeers),
   ale povely jdou napřímo mezi zařízeními přes WebRTC (PeerJS) → mnohem nižší odezva;
   když přímé spojení síť nepustí, jdou přes veřejný MQTT server (záloha).
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
  window.claude={webRoom:true,use:function(n){return n==='room'?roomPromise:Promise.resolve(null);}};
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

  // ---- dvě cesty: 1) přímé spojení WebRTC (PeerJS, nejnižší odezva),
  //      2) záloha přes veřejný MQTT server (projde i tam, kde přímé spojení neprojde: iPhone, některé routery, mobilní data) ----
  var ICE={iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}]};
  var MQTT_URL='https://cdn.jsdelivr.net/npm/mqtt@5.10.1/dist/mqtt.min.js';
  var BROKERS=(window.TK_BROKERS||['wss://broker.hivemq.com:8884/mqtt','wss://broker.emqx.io:8084/mqtt']);
  var TOP='tkara1/';
  var mqttP=null;
  function loadMqtt(){if(mqttP)return mqttP;mqttP=new Promise(function(res,rej){
    if(window.mqtt)return res(window.mqtt);var sc=document.createElement('script');sc.src=MQTT_URL;
    sc.onload=function(){window.mqtt?res(window.mqtt):rej(new Error('mqtt'));};sc.onerror=function(){rej(new Error('mqtt load'));};
    document.head.appendChild(sc);});return mqttP;}
  function mconnect(M,url,id,will){var f=M.connect||(M.default&&M.default.connect);
    return f(url,{clientId:id,clean:true,keepalive:20,reconnectPeriod:3000,connectTimeout:8000,will:will});}
  function rid(){return Math.random().toString(36).slice(2,10);}

  var peer;
  if(isHost){
    // ----- OBRAZOVKA: rozbočovač, čeká na připojení mobilů (oběma cestami) -----
    var conns=new Map(); // id -> {send, pres, via, last}
    currentPeers=function(){var out=[];conns.forEach(function(c,id){out.push({peer:id,presence:c.pres,sameTab:false});});return out;};
    function peersFor(exclude){var out=[{peer:'HOST',presence:myPres,sameTab:false}];
      conns.forEach(function(c,id){if(id!==exclude)out.push({peer:id,presence:c.pres,sameTab:false});});return out;}
    function broadcast(){conns.forEach(function(c,id){try{c.send({t:'peers',peers:peersFor(id)});}catch(e){}});firePeers(currentPeers());}
    sendPresence=function(){broadcast();};
    sendEvent=function(t,d){conns.forEach(function(c){try{c.send({t:'ev',topic:t,data:d});}catch(e){}});};
    function addConn(id,send,via){var c=conns.get(id);if(c){c.send=send;c.last=Date.now();}else conns.set(id,{send:send,pres:{},via:via,last:Date.now()});broadcast();}
    function dropConn(id){if(conns.delete(id))broadcast();}
    function onMsg(id,d){var c=conns.get(id);if(!c||!d)return;c.last=Date.now();
      if(d.t==='pres'){c.pres=d.pres||{};broadcast();}
      else if(d.t==='ev'){fire(d.topic,{peer:id,data:d.data,sameTab:false});
        conns.forEach(function(o,oid){if(oid!==id)try{o.send({t:'ev',topic:d.topic,data:d.data});}catch(e){}});}}
    // ovladače přes server, které zmlkly, vyhodíme
    setInterval(function(){var now=Date.now();conns.forEach(function(c,id){if(c.via!=='mqtt')return;
      if(now-c.last>15000)dropConn(id);else try{c.send({t:'hb'});}catch(e){}});},3000);
    var mqttStarted=false;
    function startMqttHost(){
      if(mqttStarted)return;mqttStarted=true;
      loadMqtt().then(function(M){
        BROKERS.forEach(function(url,bi){
          var cl=mconnect(M,url,'tkh'+rid());
          cl.on('connect',function(){cl.subscribe(TOP+code+'/u/+',{qos:0});});
          cl.on('message',function(topic,buf){
            var cid=topic.split('/').pop(),id='m'+bi+'-'+cid,d;try{d=JSON.parse(buf.toString());}catch(e){return;}
            if(d.t==='hello'){addConn(id,function(x){cl.publish(TOP+code+'/d/'+cid,JSON.stringify(x),{qos:0});},'mqtt');return;}
            if(d.t==='bye'){dropConn(id);return;}
            if(!conns.has(id))addConn(id,function(x){cl.publish(TOP+code+'/d/'+cid,JSON.stringify(x),{qos:0});},'mqtt');
            onMsg(id,d);});
          cl.on('error',function(){});
        });
      }).catch(function(){});
    }
    function startHost(){
      peer=new Peer(hid(code),{debug:0,config:ICE});
      peer.on('open',function(){if(!resolved){resolved=true;resolveReady(api);}updateBanner();startMqttHost();});
      peer.on('error',function(e){
        if(e&&e.type==='unavailable-id'){code=genCode();try{peer.destroy();}catch(x){}startHost();return;}
        if(!resolved){resolved=true;resolveReady(api);}
        startMqttHost(); // přímé spojení nejde → aspoň server
      });
      peer.on('connection',function(conn){
        conn.on('open',function(){addConn(conn.peer,function(x){conn.send(x);},'p2p');});
        conn.on('data',function(d){onMsg(conn.peer,d);});
        conn.on('close',function(){dropConn(conn.peer);});
        conn.on('error',function(){dropConn(conn.peer);});
      });
    }
    startHost();
  } else {
    // ----- MOBIL: zkusí přímé spojení; když do pár vteřin nevyjde, přepne na server -----
    var hostPeers=[],mode=null,send=function(){},lastHost=0;
    currentPeers=function(){return hostPeers;};
    sendPresence=function(){send({t:'pres',pres:myPres});};
    sendEvent=function(t,d){send({t:'ev',topic:t,data:d});};
    // stavový pruh na ovladači: vidět, co se děje a proč se to nepřipojilo
    var cb=null,cbT=null;
    function cstat(msg,bad,hideAfter){
      if(!cb){cb=document.createElement('div');
        cb.style.cssText='position:fixed;left:50%;bottom:max(10px,env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:70;max-width:92vw;text-align:center;'
          +"font-family:'Chakra Petch','Barlow Condensed',sans-serif;font-size:14px;color:#eef3f7;background:rgba(9,15,24,.94);border:1px solid rgba(63,216,255,.4);border-radius:4px;padding:8px 14px";
        document.body.appendChild(cb);}
      clearTimeout(cbT);
      if(!msg){cb.style.display='none';return;}
      cb.style.display='block';cb.style.borderColor=bad?'rgba(255,122,108,.7)':'rgba(63,216,255,.4)';
      cb.innerHTML=msg+(bad?' <button id="tkRetry" style="font:inherit;margin-left:8px;cursor:pointer;border:0;border-radius:3px;padding:4px 10px;background:#1fb3e2;color:#04121a">Zkusit znovu</button>'
        +' <button id="tkOther" style="font:inherit;margin-left:4px;cursor:pointer;border:0;border-radius:3px;padding:4px 10px;background:rgba(255,255,255,.12);color:#eef3f7">Jiný kód</button>':'');
      var r=cb.querySelector('#tkRetry');if(r)r.onclick=function(){location.reload();};
      var o=cb.querySelector('#tkOther');if(o)o.onclick=function(){location.href=location.origin+location.pathname;};
      if(hideAfter)cbT=setTimeout(function(){cb.style.display='none';},hideAfter);
    }
    function onData(d){if(!d)return;lastHost=Date.now();
      if(d.t==='peers'){hostPeers=d.peers||[];firePeers(hostPeers);}
      else if(d.t==='ev')fire(d.topic,{peer:'HOST',data:d.data,sameTab:false});}
    function connected(via,sender){
      if(mode)return false;mode=via;send=sender;lastHost=Date.now();
      if(!resolved){resolved=true;resolveReady(api);}
      cstat(via==='p2p'?'Připojeno napřímo':'Připojeno přes server (přímé spojení síť nepustila)',false,2500);
      sendPresence();return true;}
    function lost(){if(!mode)return;hostPeers=[];firePeers([]);if(discCb)discCb();cstat('Spojení s obrazovkou se přerušilo.',true);}
    // hlídání: když obrazovka dlouho mlčí (přes server), ohlas přerušení
    setInterval(function(){if(mode==='mqtt'&&Date.now()-lastHost>12000)lost();},3000);

    var p2pErr='',mqttTried=false;
    function startMqttCtrl(why){
      if(mode||mqttTried)return;mqttTried=true;p2pErr=why||p2pErr;
      cstat('Přímé spojení nevyšlo, zkouším přes server…');
      loadMqtt().then(function(M){
        var cid=rid(),up=TOP+code+'/u/'+cid,down=TOP+code+'/d/'+cid,clients=[],hello=null;
        BROKERS.forEach(function(url){
          var cl=mconnect(M,url,'tkc'+cid+clients.length,{topic:up,payload:'{"t":"bye"}',qos:0,retain:false});clients.push(cl);
          cl.on('connect',function(){cl.subscribe(down,{qos:0},function(){cl.publish(up,'{"t":"hello"}',{qos:0});});});
          cl.on('message',function(topic,buf){var d;try{d=JSON.parse(buf.toString());}catch(e){return;}
            if(!mode){
              if(connected('mqtt',function(x){cl.publish(up,JSON.stringify(x),{qos:0});})){
                clearInterval(hello);
                // ostatní servery už nepotřebujeme
                clients.forEach(function(o){if(o!==cl)try{o.end(true);}catch(e){}});
                setInterval(function(){cl.publish(up,'{"t":"ka"}',{qos:0});},4000);
              }
            }
            if(mode==='mqtt')onData(d);});
          cl.on('error',function(){});
        });
        hello=setInterval(function(){if(mode)return;clients.forEach(function(cl){if(cl.connected)cl.publish(up,'{"t":"hello"}',{qos:0});});},1500);
        setTimeout(function(){if(mode)return;clearInterval(hello);
          cstat('Obrazovka '+code+' nenalezena. Na PC musí být otevřená čekárna (Solo / Multiplayer) s tímto kódem a hra musí být vepředu.'+(p2pErr?' <span style="opacity:.6">('+p2pErr+')</span>':''),true);},15000);
      }).catch(function(){cstat('Nepodařilo se načíst záložní spojení. Zkontroluj internet.'+(p2pErr?' ('+p2pErr+')':''),true);});
    }
    function startCtrl(){
      cstat('Připojuji k obrazovce '+code+'…');
      // když přímé spojení do 6 s nenaběhne, jdi přes server
      setTimeout(function(){if(!mode)startMqttCtrl('přímé spojení neodpovídá');},6000);
      try{peer=new Peer({debug:0,config:ICE});}catch(e){startMqttCtrl('WebRTC nejde');return;}
      peer.on('open',function(){
        var conn=peer.connect(hid(code),{reliable:true});
        conn.on('open',function(){if(!connected('p2p',function(x){if(conn.open)try{conn.send(x);}catch(e){}}))try{conn.close();}catch(e){}});
        conn.on('data',function(d){if(mode==='p2p')onData(d);});
        conn.on('close',function(){if(mode==='p2p')lost();});
        conn.on('error',function(e){if(mode==='p2p')lost();else startMqttCtrl('přímé: '+((e&&(e.type||e.message))||'chyba'));});
      });
      peer.on('error',function(e){if(!mode)startMqttCtrl('přímé: '+((e&&e.type)||'chyba'));});
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

  // ---- zadání kódu na mobilu (jen dokud zařízení není ovladač) ----
  if(isHost){
    var ov=null;
    function promptJoin(){
      if(!ov){
        ov=document.createElement('div');
        ov.style.cssText='position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;'
          +'background:rgba(3,6,11,.92);padding:24px;'
          +"font-family:'Chakra Petch','Barlow Condensed',sans-serif;color:#eef3f7";
        ov.innerHTML='<div style="width:100%;max-width:360px;text-align:center;background:linear-gradient(180deg,rgba(16,26,40,.96),rgba(6,10,17,.98));border:1px solid rgba(63,216,255,.4);border-radius:4px;padding:22px 20px">'
          +'<div style="font-size:13px;letter-spacing:.16em;color:#3fd8ff">MOBIL JAKO VOLANT</div>'
          +'<h2 style="margin:8px 0 4px;font-style:italic;font-size:26px">Zadej kód z obrazovky</h2>'
          +'<p style="margin:0 0 14px;color:#93a6b8;font-size:15px">Na počítači zvol hru s mobilem jako volantem. Nahoře se ukáže čtyřmístný kód.</p>'
          +'<input id="tkCode" inputmode="latin" autocapitalize="characters" autocomplete="off" maxlength="5" placeholder="např. AB12" '
          +'style="width:100%;box-sizing:border-box;text-align:center;text-transform:uppercase;letter-spacing:.3em;font:inherit;font-size:30px;font-weight:700;'
          +'padding:12px;border-radius:4px;border:1px solid #3a5541;background:#0b121c;color:#eef3f7;outline:none">'
          +'<div style="display:flex;gap:10px;margin-top:14px">'
          +'<button id="tkJoin" style="flex:1;font:inherit;font-weight:700;font-style:italic;font-size:20px;cursor:pointer;border:0;border-radius:3px;padding:12px;background:linear-gradient(180deg,#78e8ff,#1fb3e2);color:#04121a">PŘIPOJIT</button>'
          +'<button id="tkCancel" style="font:inherit;font-size:15px;cursor:pointer;border:0;border-radius:3px;padding:12px 16px;background:rgba(255,255,255,.08);color:#eef3f7">Zpět</button>'
          +'</div><p id="tkErr" style="margin:10px 0 0;color:#ff7a6c;font-size:14px;min-height:18px"></p></div>';
        document.body.appendChild(ov);
        var inp=ov.querySelector('#tkCode'),err=ov.querySelector('#tkErr');
        function go(){var v=(inp.value||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,5);
          if(v.length<3){err.textContent='Zadej celý kód z obrazovky.';return;}
          location.href=location.origin+location.pathname+'?p='+v;}
        ov.querySelector('#tkJoin').onclick=go;
        inp.addEventListener('keydown',function(e){if(e.key==='Enter')go();});
        ov.querySelector('#tkCancel').onclick=function(){ov.style.display='none';};
      }
      ov.style.display='flex';var i=ov.querySelector('#tkCode');if(i){i.value='';setTimeout(function(){i.focus();},50);}
    }
    // tlačítko „TENTO TELEFON JE OVLADAČ“ na webu otevře zadání kódu místo původního spojení
    document.addEventListener('click',function(e){
      var t=e.target&&e.target.closest&&e.target.closest('[data-screen="ctrl"]');
      if(t){e.preventDefault();e.stopImmediatePropagation();promptJoin();}
    },true);
  }
})();
