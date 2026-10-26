// Local-only real-renderer fixture. Never changes saved accounts or calls online services.
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..');
const build=require('./client-build.cjs').build(root);
const setup=`
window.SHEET_URL='';window.fetch=()=>Promise.reject(Error('Offline fixture'));
save=()=>{};advance=()=>{document.getElementById("qaTrace")?.setAttribute("data-advanced",String(performance.now()));};Sound.fx=()=>{};
const nm=document.createElement('input');nm.id='nm';nm.value='Motion QA';nm.hidden=true;document.body.appendChild(nm);
S={screen:'start',ui:{}};handlers.newgame();nm.remove();delete S.P.tutorial;S.P.cls='summoner';S.P.gender='male';S.P.lv=60;S.P.cleared=1;S.P.hp=pStats().hp;S.P.mp=pStats().mp;
S.zone={id:8,depth:10,log:[],fork:null};S.screen='zone';handlers.boss();delete S.ui.cinema;
S.battle.allies=[playerUnit(),...['dragon','raiju','kappa'].map((sp,i)=>{const u=wildUnit(sp,60,i);u.id='ally'+i;u.side='ally';return u;})];
S.battle.cur='P';S.battle.menu='main';S.ui.battleCommandsHidden=false;render();
const panel=document.createElement('div');panel.id='motionQA';panel.style='position:fixed;top:0;right:0;z-index:9999;background:#102131;padding:3px;font-size:10px';
panel.innerHTML='<select id="qaActor">'+[...S.battle.allies,...S.battle.enemies].map(u=>'<option value="'+u.id+'">'+u.name+'</option>').join('')+'</select><button id="qaRange">Range</button><button id="qaMelee">Melee</button><button id="qaMiss">Miss</button><button id="qaBuff">Buff</button><button id="qaPose">Hold power</button><button id="qaReset">Idle</button><button id="qaReal">Real range</button><button id="qaHeal">Real heal</button><output id="qaTrace" hidden></output>';
document.body.appendChild(panel);
window.motionQA=(kind,source='P',target='e0')=>{trace.length=0;VQ.length=0;VQ.push({k:'cast',id:source,source,skill:kind==='ranged'?'fire_m1':kind==='support'?'audit_warn':'attack',n:'ทดสอบภาพ'}, {k:kind==='miss'?'miss':kind==='support'?'buff':'hit',id:target,source,skill:kind==='ranged'?'fire_m1':kind==='support'?'audit_warn':'attack'});flushVfx();};
const selected=()=>document.getElementById('qaActor').value,target=()=>selected().startsWith('e')?'P':'e0';
const trace=[];setInterval(()=>{trace.push({time:performance.now(),phases:[...document.querySelectorAll('.battle-motion')].map(n=>[n.dataset.motionUnit,n.dataset.motionPhase]),flight:!!document.querySelector('.motion-flight'),away:[...document.querySelectorAll('.motion-away')].map(n=>n.dataset.motionUnit),hp:[...document.querySelectorAll('.battle-meter')].map(n=>n.textContent)});if(trace.length>1000)trace.shift();document.getElementById('qaTrace').textContent=JSON.stringify(trace);},50);
document.getElementById('qaRange').onclick=()=>motionQA('ranged',selected(),target());document.getElementById('qaMelee').onclick=()=>motionQA('melee',selected(),target());document.getElementById('qaMiss').onclick=()=>motionQA('miss',selected(),target());document.getElementById('qaBuff').onclick=()=>motionQA('support',selected(),selected());
document.getElementById('qaPose').onclick=()=>{for(const [n,i]of CharacterMotion.instances)if(n.dataset.motionUnit===selected()){i.set('power');n.querySelector('.um-body').style.animation='none';n.querySelector('.um-power').style.cssText='animation:none;opacity:1;transform:scale(1)';}};
document.getElementById('qaReal').onclick=()=>{const u=uById('P'),t=uById('e0');u.st.acc=99999;act(u,'fire_m1',t);after();};document.getElementById('qaHeal').onclick=()=>{const u=uById('P');u.hp=100;render();act(u,'teamheal',u,u);after();};
document.getElementById('qaReset').onclick=()=>{for(const [n,i]of CharacterMotion.instances){i.set('idle');n.querySelector('.um-body').style.animation='';n.querySelector('.um-power').style.cssText='';}};
`;
fs.writeFileSync(path.join(root,'build/motion-game-preview.html'),build.files['staging-index.html'].replace('<head>','<head><base href="/">').replace('</body>','<script>'+setup+'</script></body>'));
console.log('Built build/motion-game-preview.html');
