(()=>{'use strict';
if(!sessionStorage.getItem(IslandRules.onlineKey)){
 const player=JSON.parse(sessionStorage.getItem(IslandRules.key)||'null');
 if(IslandPreviewProfile.upgrade(player,WalkVitals.maximum)){
  const raw=JSON.stringify(player);sessionStorage.setItem(IslandRules.key,raw);
  localStorage.setItem('soulbeast-walk-save:'+player.walkId,raw);
 }
}
const $=id=>document.getElementById(id),canvas=$('world'),c=canvas.getContext('2d'),mini=$('minimap').getContext('2d'),data=window.hemantMap,borderGates=window.walkBorderLinks.attach(data,window.walkBorderData,{...window.walkCountries,blue:window.hemantBlueMap}),nav=window.hemantNavigation.create(data),F=data.flatten;
const colosseum=window.WalkColosseum.site(data.countryId);nav.places.push(colosseum);
const dungeonEntrance={id:'seven-floor-dungeon',type:'dungeon',name:'มหาวงกตดันเจี้ยน 7 ชั้น',country:'red',x:1104,y:7704,description:'เหมืองใต้พิภพ · เข้าคนเดียวได้ หรือเลือกเพื่อนออนไลน์ 1 คน เลเวลต่างกันไม่เกิน 10 เพื่อร่วมต่อสู้',levels:[1,60]};if(data.countryId==='red')nav.places.push(dungeonEntrance);
const capital=data.cities[0],origin=[...data.cities,...data.villages].find(s=>s.id===new URLSearchParams(location.search).get('from'))||capital,exitFrom=new URLSearchParams(location.search).get('gate'),spawn=exitFrom==='west'?{x:origin.x-285,y:origin.y+210}:exitFrom==='east'?{x:origin.x+295,y:origin.y+190}:{x:origin.x,y:origin.y+265},p={...spawn,dir:0},cam={...p},keys=new Set(),joy={x:0,y:0,id:null};
let W,H,t=0,last=0,phase=0,moving=false,running=false,overview=new URLSearchParams(location.search).get('view')==='map',near=null,travel=null,menu=false;
const images={};const files={colosseum:'/Soulbeast/assets/country-walk/colosseum-v1.webp',islandPort:'/Soulbeast/assets/island-props/'+data.countryId+'-port.webp',dungeon:'/Soulbeast/assets/dungeon-mine-v1/country-entrance-v1.webp',questNpc:'/Soulbeast/assets/town-walk-preview/npcs-v2.png.webp',flagblue:'/Soulbeast/assets/ui/country-war/flag-blue-v1.webp',flaggreen:'/Soulbeast/assets/ui/country-war/flag-green-v1.webp',flagred:'/Soulbeast/assets/ui/country-war/flag-red-v1.webp',borderGate:'/Soulbeast/assets/country-walk/border-gates/'+data.countryId+'-v1.png.webp',chest:'bandit-treasure-v1.png.webp',water:'river-water-v1.png.webp',bandit:'forest-bandit-walk-v2.png.webp',shadow:'shadow-beast-walk-v2.png.webp',village0:'village-0-v1.webp',village1:'village-1-v1.webp',village2:'village-2-v1.webp',paving:'/Soulbeast/assets/town-walk-preview/paving-v1.png.webp',snow:'snow-v1.png.webp',pine:'pine-v2.png.webp',mountain:'mountain-v2.png.webp',...Object.fromEntries(data.cities.map(s=>['city'+s.art,'city-'+s.art+'-v1.png.webp'])),...Object.fromEntries(data.forests.map(s=>['forest'+s.art,'/Soulbeast/assets/country-walk/forest-landmarks-v1/zone-'+s.zoneId+'.webp']))};
if(data.countryId!=='blue'){const root='/Soulbeast/assets/country-walk/'+data.countryId+'/';Object.assign(files,{snow:data.countryId==='green'?'/Soulbeast/assets/town-walk-preview/grass-v1.png.webp':root+'ground.png.webp',pine:root+'tree.png.webp',mountain:root+'mountain.png.webp',cliff:root+'cliff.png.webp',chest:'/Soulbeast/assets/country-walk/temperate-chest.png.webp'});for(const city of data.cities)files['city'+city.art]=root+(city.type==='capital'?'capital':'city')+'.png.webp';for(const village of data.villages)files['village'+village.art]=root+'village.png.webp'}
for(const kind of ['ruin','statue'])files['prop-'+kind]='/Soulbeast/assets/ui/world-polish-20261103/'+data.countryId+'-'+kind+'.png.webp';
for(const [id,file]of Object.entries(files)){const im=new Image();im.src=file.startsWith('/')?file:'/Soulbeast/assets/hemant-walk-preview/'+file;images[id]=im}
const avatar=window.sealerSprites.create();const syncAvatar=()=>avatar.sync().catch(e=>console.error('Player animation:',e));
const touchDisplay=matchMedia('(pointer: coarse)').matches;
let lastPaint=-Infinity,graphics,paintInterval;
function resize(){
 W=innerWidth;H=innerHeight;
 const pixelLimit=touchDisplay?Math.max(1,Math.sqrt(graphics.pixels/Math.max(1,W*H))):2;
 const dpr=Math.min(devicePixelRatio||1,graphics.scale,pixelLimit);
 canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);
 c.setTransform(canvas.width/Math.max(1,W),0,0,canvas.height/Math.max(1,H),0,0);
}
function applyGraphics(){
 const level=WalkGraphics.read();
 graphics=WalkGraphics.levels[level-1];
 paintInterval=touchDisplay||graphics.frameMs===32?graphics.frameMs:0;
 canvas.dataset.graphicsLevel=String(level);
 resize();
}
addEventListener('resize',resize);
addEventListener('storage',event=>{if(event.key===WalkGraphics.KEY||event.key===null)applyGraphics();});
addEventListener(WalkGraphics.CHANGE,applyGraphics);
applyGraphics();
const zoom=()=>overview?Math.min((W-32)/data.width,(H-245)/(data.height*F)):.72;
const sx=x=>(x-(overview?data.width/2:cam.x))*zoom()+W/2,sy=y=>(y-(overview?data.height/2:cam.y))*F*zoom()+H*(overview?.53:.57);
function ellipse(ctx,x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill()}
let seed=205;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
const terrain=window.hemantTerrain.create(data,nav);nav.setTerrain(terrain);const islandPort=IslandRules.port(data.countryId);nav.places.push(islandPort);const questNpcs=window.walkQuestEnvoy.createAll(data,nav),envoy=questNpcs[0];const npcArt={};for(const n of questNpcs){const im=new Image();im.src=n.portrait;npcArt[n.slug]=im}const arrivalGate=borderGates.find(g=>g.id===new URLSearchParams(location.search).get('arrival'));Object.assign(spawn,arrivalGate?window.walkBorderLinks.arrival(arrivalGate,data):nav.spawnAt(origin,exitFrom||'south'));if(data.countryId==='red'&&new URLSearchParams(location.search).get('arrival')==='dungeon')Object.assign(spawn,{x:1104,y:7804});if(new URLSearchParams(location.search).get('arrival')==='colosseum')Object.assign(spawn,colosseum);const forestArrival=/^forest-(\d+)$/.exec(new URLSearchParams(location.search).get('arrival')||'');if(forestArrival){const forest=data.forests.find(f=>Number(f.zoneId)===Number(forestArrival[1]));if(forest){Object.assign(spawn,forest);}}if(new URLSearchParams(location.search).get('arrival')==='island-port')Object.assign(spawn,islandPort);Object.assign(p,spawn);Object.assign(cam,spawn);const {trees,mountains}=terrain;for(const tree of trees)tree.variant=LivingEnvironment.treeVariant(data.countryId,tree,terrain.water.raw(tree.x,tree.y,420));const roamers=window.hemantRoamers.create(data,nav);const bandits=window.hemantBandits.create(data,nav,terrain);window.walkQuestTargets.populate(data,nav,roamers,bandits,window.townQuests.read(),window.WorldQuestData);const threats=window.hemantEncounters.create(nav,[{kind:"shadow",actors:roamers.actors},{kind:"bandit",actors:bandits.actors}],{leashDistance:()=>WorldPursuit.leash(W,H,zoom(),1),chaseDurationMs:5000});let activeEncounter=null;const treasures=window.hemantTreasures.create(nav,bandits.actors,sessionStorage,window.hemantTreasureCatalog,Math.random,data.countryId);
const ground=document.createElement('canvas');ground.width=data.width/2;ground.height=data.height*F/2;
function makeGround(){const g=ground.getContext('2d');g.scale(.5,.5);const snow=g.createPattern(images.snow,'repeat');snow.setTransform(new DOMMatrix().scale(.45));g.fillStyle=snow;g.fillRect(0,0,data.width,data.height*F);
 LivingEnvironment.patches(g,data.width,data.height,data.countryId,147,200);
 lava.drawGround(g);
 const stone=g.createPattern(images.paving,'repeat');stone.setTransform(new DOMMatrix().scale(.23));g.lineCap='round';g.lineJoin='round';for(const [a,b]of nav.edges){const A=nav.nodes[a],B=nav.nodes[b];for(const [w,col]of [[220,data.countryId==='blue'?'#c3d7e1':data.countryId==='red'?'#81563f':'#56724d'],[183,data.countryId==='blue'?'#e9e8e1':'#baa37d'],[135,data.countryId==='blue'?'#cbd4d6':'#a28e6c']]){g.lineWidth=w;g.strokeStyle=col;g.beginPath();g.moveTo(A.x,A.y*F);g.lineTo(B.x,B.y*F);g.stroke()}g.save();g.globalAlpha=.33;g.strokeStyle=stone;g.lineWidth=135;g.beginPath();g.moveTo(A.x,A.y*F);g.lineTo(B.x,B.y*F);g.stroke();g.restore();}
 terrain.water.drawGround(g,images.water);terrain.water.drawDeck(g);
 for(const s of nav.places){ellipse(g,s.x,s.y*F,190,115,data.countryId==='blue'?'#d4e1e6':data.countryId==='red'?'#9a6648':'#597c4e');ellipse(g,s.x,s.y*F,155,93,data.countryId==='blue'?'#e9eeed':data.countryId==='red'?'#b17d51':'#78905a')}
 for(let i=0;i<2400;i++){const x=rand()*data.width,y=rand()*data.height;ellipse(g,x,y*F,2+rand()*6,1+rand()*3,data.countryId==='blue'?'#86afc314':data.countryId==='red'?'#3b272828':'#dec67728')}
}
function art(im,x,y,width,anchor=.94,alpha=1){const w=width*zoom(),h=w*im.height/im.width;if(x+w<-100||x-w>W+100||y+30<-100||y-h>H+100)return;c.save();c.globalAlpha=alpha;c.drawImage(im,x-w/2,y-h*anchor,w,h);c.restore()}
function label(text,x,y,color='#183b52',large=false){c.save();c.textAlign='center';c.font=(large?'bold ':'')+(overview?(large?11:9):13)+'px Tahoma';c.lineWidth=3;c.strokeStyle='#f2faffdd';c.strokeText(text,x,y);c.fillStyle=color;c.fillText(text,x,y);c.restore()}
function forestLocked(place){
 return place.type==='forest'&&!ForestEntrance.unlocked(place.zoneId,window.townQuests.read());
}
function drawForestLock(x,y,size){
 c.save();c.translate(x,y);c.scale(size,size);
 c.strokeStyle='#251909';c.lineWidth=4.5;c.beginPath();c.arc(0,-4,5.5,Math.PI,0);c.stroke();
 c.strokeStyle='#ffe197';c.lineWidth=2.5;c.stroke();
 c.fillStyle='#edbb56';c.strokeStyle='#33220e';c.lineWidth=1.5;
 c.beginPath();c.roundRect(-8,-4,16,13,3);c.fill();c.stroke();
 c.fillStyle='#533615';c.beginPath();c.arc(0,1,1.6,0,Math.PI*2);c.fill();c.fillRect(-.8,1,1.6,4);
 c.restore();
}
function place(s){
 if(s.type==='islandPort'){
  const x=sx(s.x),y=sy(s.y);if(!overview&&images.islandPort?.naturalWidth)art(images.islandPort,x,y,190);else ellipse(c,x,y,9*zoom(),6*zoom(),'#376e83');
  label('⚓ '+s.name,x,y-15,'#163547',true);return;
 }
 if(s.type==='colosseum'){
  const x=sx(s.x),y=sy(s.y),im=images.colosseum;
  if(im.naturalWidth)art(im,x,y,390,.97);
  label(s.name,x,y+22*zoom(),'#593b0e',true);
  if(!overview&&nav.distance(p,s)<190)label('◇ เข้าสนามประลอง',x,y+24,'#805c19');
  return;
 }
 if(s.type==='dungeon'){art(images.dungeon,sx(s.x),sy(s.y),420);window.townQuests.drawTarget(c,sx(s.x),sy(s.y)-190*zoom(),overview?.65:zoom(),window.townQuests.targetStyle({type:'place',place:s.id,country:data.countryId}));label(s.name,sx(s.x),sy(s.y)+40*zoom(),'#17334f',true);if(nav.distance(p,s)<190)label('◇ เข้าดันเจี้ยน',sx(s.x),sy(s.y)+23,'#805c19');return}if(s.type==='border'){drawBorderGate(s);return}const im=images[(s.type==='forest'?'forest':s.type==='village'?'village':'city')+s.art],width=s.type==='capital'?490:s.type==='city'?375:s.type==='village'?235:310;const locked=forestLocked(s);art(im,sx(s.x),sy(s.y),width,.94,locked?.72:1);if(['capital','city','village'].includes(s.type)){const flag=images['flag'+window.walkWar.owner(s.id)];if(flag?.naturalWidth)c.drawImage(flag,sx(s.x)+width*.25*zoom(),sy(s.y)-width*.65*zoom(),52*zoom(),35*zoom())}const h=width*im.height/im.width;if(locked)drawForestLock(sx(s.x)-width*.28*zoom(),sy(s.y)-h*.69*zoom(),overview?.8:1.25);window.townQuests.drawTarget(c,sx(s.x),sy(s.y)-h*.94*zoom()-(overview?29:36),overview?.65:zoom(),window.townQuests.targetStyle({type:'place',place:s.id,zone:s.zoneId,country:data.countryId}));label((s.type==='forest'?s.chapter+'. ':s.type==='village'?(overview?s.number+'. ':'หมู่บ้าน'):'')+s.name,sx(s.x),sy(s.y)-h*.94*zoom()-10,s.type==='forest'?'#234c57':'#17334f',['capital','city'].includes(s.type));if(overview){ellipse(c,sx(s.x),sy(s.y)+6,3,3,s.type==='forest'?'#53877b':'#c1964e')}else if(nav.distance(p,s)<190){label(locked?'ยังไม่ปลดล็อก':'◇ สำรวจทางเข้า',sx(s.x),sy(s.y)+23,'#805c19')}}
function gateMarker(ctx,x,y,r){ctx.save();ctx.fillStyle='#f5cc59';ctx.strokeStyle='#183546';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y+2*r);ctx.lineTo(x-r,y);ctx.lineTo(x+r,y);ctx.closePath();ctx.fill();ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeRect(x-r*.35,y-r*.45,r*.7,r*.9);ctx.restore()}
function drawBorderGate(s){const x=sx(s.x),y=sy(s.y),q=zoom();if(overview){gateMarker(c,x,y-10,7);label(s.name,Math.max(90,Math.min(W-90,x)),y-24,'#593b0e',true);return}ellipse(c,x,y,175*q,36*q,'#173a4c33');art(images.borderGate,x,y,540,.96);const h=540*images.borderGate.height/images.borderGate.width;label(s.name,x,y-h*.96*q-12,'#694b1d',true);if(nav.distance(p,s)<190)label('เดินผ่านประตูเพื่อข้ามประเทศ',x,y+25,'#805c19')}
function crossBorder(gate){if(menu)return;menu=true;reset();stopTravel();location.href=window.walkBorderLinks.travelURL(gate,location.search)}
const fusion=BeastFusion.create({canOpen:()=>!menu&&!overview&&!$('townDialog').open&&!window.walkAtlas.isOpen(),stop:()=>{reset();stopTravel()},openShop:()=>{reset();menu=true;const frame=document.createElement('iframe');frame.id='regionMenu';frame.title='ร้านคูปอง';frame.src='../town-walk-demo/coupon.html';frame.style='position:fixed;inset:0;width:100%;height:100%;border:0;z-index:10000;background:#122b40';document.body.append(frame)}});
function player(){const x=sx(p.x),y=sy(p.y),q=zoom();ellipse(c,x,y,21*q,7*q,'#173a4c44');if(overview){ellipse(c,x,y,5,5,'#edcb69');c.strokeStyle='#173e59';c.lineWidth=2;c.strokeRect(x-6,y-6,12,12)}else {if(!fusion.draw(c,x,y,q,p.dir,t,moving))avatar.draw(c,x,y,154*q,p.dir,phase,moving,running)}}
function shadowBeast(a){const x=sx(a.x),y=sy(a.y),q=zoom();if(overview){ellipse(c,x,y,2,2,'#32384bd0');return}if(x<-120||x>W+120||y<-30||y>H+160)return;const frame=a.moving?Math.floor(a.phase)%8:0;ellipse(c,x,y,25*q,8*q,'#0a172a44');c.save();c.translate(x,y);c.scale(a.facing,1);c.drawImage(images.shadow,(frame%4)*256,Math.floor(frame/4)*256,256,256,-72*q,-133*q,144*q,144*q);c.restore();window.townQuests.drawTarget(c,x,y-150*q,q,window.townQuests.targetStyle({type:'enemy',kind:'shadow',country:data.countryId,place:questNearbyPlace(a)}));if(nav.distance(p,a)<240)label(a.chasing?'! เงาอสูร':'เงาอสูร',x,y-116*q,a.chasing?'#922d34':'#343751')}
function forestBandit(a){if(overview)return;const x=sx(a.x),y=sy(a.y),q=zoom();if(x<-120||x>W+120||y<-30||y>H+180)return;const frame=a.moving?Math.floor(a.phase)%8:0;ellipse(c,x,y,21*q,7*q,'#182b3644');c.save();c.translate(x,y);c.scale(a.facing,1);c.drawImage(images.bandit,(frame%4)*256,Math.floor(frame/4)*256,256,256,-82*q,-151*q,164*q,164*q);c.restore();window.townQuests.drawTarget(c,x,y-174*q,q,window.townQuests.targetStyle({type:'enemy',kind:'bandit',country:data.countryId,place:questNearbyPlace(a)}));if(nav.distance(p,a)<210)label(a.chasing?'! โจรป่า':'โจรป่า',x,y-138*q,a.chasing?'#922d34':'#703f30')}
function treasureChest(a){const status=treasures.state(a);if(overview){if(status!=='opened')ellipse(c,sx(a.x),sy(a.y),2.5,2.5,'#e4ba4e');return}ellipse(c,sx(a.x),sy(a.y),39*zoom(),13*zoom(),'#19334744');art(images.chest,sx(a.x),sy(a.y),100,.94,status==='opened'?.45:1);window.townQuests.drawTarget(c,sx(a.x),sy(a.y)-112*zoom(),zoom(),window.townQuests.targetStyle({type:'chest',country:data.countryId,place:questNearbyPlace(a),opened:status==='opened'}));if(nav.distance(p,a)<240)label(status==='opened'?'หีบว่าง':status==='ready'?'◇ เปิดหีบสมบัติ':'หีบสมบัติ · โจรเฝ้าอยู่',sx(a.x),sy(a.y)-85*zoom(),status==='ready'?'#92631f':'#4b4850')}
const countryProps=window.CountryProps.create(data,nav,[...questNpcs,...treasures.chests,...bandits.actors,...roamers.actors]);
const livingProps=LivingEnvironment.country(data,nav,terrain,[...questNpcs,...treasures.chests,...bandits.actors,...roamers.actors,...countryProps]);
terrain.addScenery([...livingProps,...countryProps]);
const lava=CountryLava.create(data,nav,terrain);
const sceneryObjects=[...livingProps,...countryProps,...treasures.chests,...mountains,...terrain.water.rails,...trees,...nav.places];for(const tree of trees){tree.kind='tree';tree.key=data.countryId+'-tree-'+(tree.variant||1)}for(const place of nav.places)place.kind='place';for(const a of bandits.actors)a.kind='bandit';for(const a of roamers.actors)a.kind='shadow';p.kind='player';
let sceneryIndex,groundTiles;const drawObjects=[],miniBase=document.createElement('canvas');miniBase.width=miniBase.height=180;const miniDue=CountryRenderBudget.cadence(touchDisplay?.2:.1),diagnosticsDue=CountryRenderBudget.cadence(.25),nearbyPlaces=[...data.cities,...data.villages];
function objectBounds(o){const width=o.kind==='place'?(o.type==='capital'?490:o.type==='city'?375:o.type==='village'?235:o.type==='border'?540:o.type==='dungeon'?420:o.type==='colosseum'?390:310):o.w||100,im=o.kind==='tree'||o.kind==='livingProp'?LivingEnvironment.load(o.key):images[o.art|| (o.kind==='place'?(o.type==='forest'?'forest':o.type==='village'?'village':'city')+o.art:o.border&&data.countryId!=='blue'?'cliff':'mountain')],height=im?.naturalWidth?width*im.naturalHeight/im.naturalWidth:width*2;return {left:o.x-width/2-100,right:o.x+width/2+100,top:o.y*F-height-100,bottom:o.y*F+100}}
function makeMiniBase(){const ctx=miniBase.getContext('2d');ctx.drawImage(ground,0,0,180,180);for(const s of nav.places)WalkMapSymbols.draw(ctx,s.type==='forest'?'forest':s.type==='border'?'gate':['dungeon','colosseum'].includes(s.type)?'dungeon':'house',s.x/data.width*180,s.y/data.height*180,s.type==='village'?8:12,s.type==='forest'?'#89d69c':'#f4d593');for(const n of questNpcs)WalkMapSymbols.draw(ctx,'person',n.x/data.width*180,n.y/data.height*180,10,'#ffe79b')}
const environmentKeys=['ground-'+data.countryId,...(data.countryId==='red'?['ground-lava']:[]),...livingProps.map(o=>o.key),...Array.from({length:5},(_,i)=>data.countryId+'-tree-'+(i+1))];
function draw(){LivingEnvironment.viewport(c,W,H);if(diagnosticsDue(t)){canvas.dataset.propCount=countryProps.length;canvas.dataset.environmentProps=livingProps.length;canvas.dataset.treeVariants=5;canvas.dataset.questNpcCount=questNpcs.length;canvas.dataset.peerCount=window.walkPresence.peers.size;canvas.dataset.country=data.countryId;canvas.dataset.borderCount=borderGates.length;canvas.dataset.arrival=arrivalGate?.id||'';canvas.dataset.weather=data.countryId==='green'?'butterflies':data.countryId==='red'?'ash':'snow';canvas.dataset.chestCount=treasures.chests.length;canvas.dataset.riverCount=terrain.water.rivers.length;canvas.dataset.lakeCount=terrain.water.lakes.length;canvas.dataset.bridgeCount=terrain.water.bridges.length;canvas.dataset.villageCount=data.villages.length;canvas.dataset.destinationCount=nav.places.length;canvas.dataset.returning=threats.entries.filter(e=>e.actor.returning).length;canvas.dataset.chaseLeash=String(WorldPursuit.leash(W,H,zoom(),1));canvas.dataset.chasing=threats.entries.filter(e=>e.actor.chasing).length;canvas.dataset.inBattle=!!activeEncounter;canvas.dataset.banditCount=bandits.actors.length;canvas.dataset.banditsMoving=bandits.actors.filter(a=>a.moving).length;canvas.dataset.banditSample=JSON.stringify(bandits.actors.map(a=>[Math.round(a.x),Math.round(a.y)]));canvas.dataset.shadowCount=roamers.actors.length;canvas.dataset.shadowsMoving=roamers.actors.filter(a=>a.moving).length;canvas.dataset.shadowSample=JSON.stringify(roamers.actors.slice(0,4).map(a=>[Math.round(a.x),Math.round(a.y)]));canvas.dataset.surface=terrain.water.onBridge(p.x,p.y)?'bridge':nav.nearest(p).distance>104?(data.countryId==='green'?'grass':data.countryId==='red'?'red-earth':'snow'):'road';canvas.dataset.x=p.x.toFixed(1);canvas.dataset.y=p.y.toFixed(1);canvas.dataset.location=near?.id||'';canvas.dataset.moving=moving;canvas.dataset.running=running;canvas.dataset.overview=overview;canvas.dataset.destination=travel?.id||'';}document.body.classList.toggle('overview',overview);$('closeOverview').hidden=!overview;c.clearRect(0,0,W,H);c.fillStyle='#8aaaba';c.fillRect(0,0,W,H);groundTiles.draw(c,{left:(overview?data.width/2:cam.x)-W/2/zoom(),right:(overview?data.width/2:cam.x)+W/2/zoom(),top:(overview?data.height/2:cam.y)*F-H*(overview?.53:.57)/zoom(),bottom:(overview?data.height/2:cam.y)*F+H*(overview?.47:.43)/zoom()},sx,sy,zoom(),F);
 if(!overview&&graphics.effects){
  terrain.water.drawFlow(c,sx,sy,zoom(),t,images.water,{width:W,height:H},graphics.effects===1);
  lava.drawPoolHeat(c,sx,sy,zoom(),t,graphics.effects===1,W,H);
 }
 if(travel){c.save();c.strokeStyle='#477fa9';c.lineWidth=overview?2:5;c.setLineDash([5,8]);c.beginPath();c.moveTo(sx(p.x),sy(p.y));for(const o of travel.path)c.lineTo(sx(o.x),sy(o.y));c.stroke();c.restore()}
 const q=zoom(),rect={left:(overview?data.width/2:cam.x)-(W/2+100)/q,right:(overview?data.width/2:cam.x)+(W/2+100)/q,top:(overview?data.height/2:cam.y)*F-(H*(overview?.53:.57)+100)/q,bottom:(overview?data.height/2:cam.y)*F+(H*(overview?.47:.43)+100)/q};sceneryIndex.query(rect,drawObjects);for(const a of bandits.actors)if(!a.cooldown&&sx(a.x)>-150&&sx(a.x)<W+150&&sy(a.y)>-30&&sy(a.y)<H+200)drawObjects.push(a);for(const a of roamers.actors)if(!a.cooldown&&sx(a.x)>-150&&sx(a.x)<W+150&&sy(a.y)>-30&&sy(a.y)<H+200)drawObjects.push(a);drawObjects.push(p);if(!overview)drawObjects.push(...window.walkPresence.objects());drawObjects.sort((a,b)=>a.y-b.y);for(const o of drawObjects){if(o.kind==='livingProp')LivingEnvironment.draw(c,o,sx(o.x),sy(o.y),q,t,p);else if(o.kind==='countryProp')art(images[o.art],sx(o.x),sy(o.y),o.w,.94,Math.abs(p.x-o.x)<100&&p.y<o.y&&o.y-p.y<300?.45:1);else if(o.kind==='chest')treasureChest(o);else if(o.kind==='bridgeRail')terrain.water.drawRail(c,o,sx,sy,q);else if(o.kind==='bandit')forestBandit(o);else if(o.kind==='shadow')shadowBeast(o);else if(o.kind==='place')place(o);else if(o.kind==='player')player();else if(o.kind==='presenceCompanion'||o.kind==='presencePlayer')window.walkPresence.drawObject(c,o,sx,sy,q);else if(o.kind==='tree'){if(!LivingEnvironment.draw(c,o,sx(o.x),sy(o.y),q,t,p))art(images.pine,sx(o.x),sy(o.y),o.w)}else {
  const im=images[o.border&&data.countryId!=='blue'?'cliff':'mountain'];
  const x=sx(o.x),y=sy(o.y);
  art(im,x,y,o.w);
  if(!overview&&graphics.effects&&data.countryId==='red'&&!o.border&&o.kind==='mountain'){
   const width=o.w*q;
   lava.drawVolcanoHeat(c,x,y,width,width*im.height/im.width,t,graphics.effects===1,W,H);
  }
 }}
 canvas.dataset.visibleScenery=drawObjects.length;
 if(overview){label(data.countryId==='blue'?'แนวเทือกเขาเหมันต์':data.countryId==='green'?'ขุนเขาพนาสมุทร':'แนวภูเขาไฟอัคนี',sx(950),sy(650),'#517384');label(data.countryId==='blue'?'ทะเลสาบเหมันต์':data.countryId==='green'?'ทะเลสาบพนาสมุทร':'อ่าวอัคนี',sx(2750),sy(4800),'#517384')}
 if(!overview&&graphics.effects)window.countryWeather.draw(c,W,H,t,data.countryId,graphics.effects===1);
 if(miniDue(t)){mini.clearRect(0,0,180,180);mini.drawImage(miniBase,0,0);const questMarkers=[];
 const markQuest=(a,style)=>{if(style)questMarkers.push({a,style});};
 const target=(a,probe)=>markQuest(a,window.townQuests.targetStyle({...probe,country:data.countryId}));
 for(const a of nav.places)target(a,{type:'place',place:a.id,zone:a.zoneId});
 for(const a of questNpcs)markQuest(a,window.townQuests.markerStyle(a.place.split(':').pop(),a.place));
 for(const [actors,kind] of [[roamers.actors,'shadow'],[bandits.actors,'bandit']]){
  for(const a of actors)if(!a.cooldown)target(a,{type:'enemy',kind,place:questNearbyPlace(a)});
 }
 for(const a of treasures.chests)target(a,{type:'chest',place:questNearbyPlace(a),opened:treasures.state(a)==='opened'});
 for(const style of ['active','tracked'])for(const marker of questMarkers)if(marker.style===style){
  const {x,y}=marker.a;window.townQuests.drawTarget(mini,x/data.width*180,y/data.height*180,.28,style);
 }
 for(const peer of window.walkPresence.peers.values())WalkMapSymbols.draw(mini,'person',peer.x/data.width*180,peer.y/data.height*180,13,'#9ddfff');WalkMapSymbols.draw(mini,'person',p.x/data.width*180,p.y/data.height*180,16,'#75e9ff');ellipse(mini,islandPort.x/data.width*180,islandPort.y/data.height*180,3,3,'#ffe593');window.walkKingdomBoss?.drawMinimap(mini,data.width,data.height);}
}
window.kingdomBossWalkScene={country:data.countryId,overview:()=>overview,canMove:()=>!menu&&!overview&&!window.walkAnnouncementBusy()&&!document.documentElement.hasAttribute('data-event-announcement-open')&&!$('townDialog').open&&!fusion.isOpen&&!window.walkSocial.isOpen&&!window.walkAtlas.isOpen(),openMap:()=>{reset();stopTravel();overview=true;},pause:()=>{menu=true;reset();stopTravel();},resume:()=>{menu=false;reset();syncAvatar();},refresh:syncAvatar};window.walkAnnouncementBusy=()=>overview||!!window.WalkControls?.editing;function reset(){keys.clear();joy.x=joy.y=0;joy.id=null;running=moving=false;$('stick').style.transform='translate(0,0)'}
function stopTravel(){travel=null;$('travel').hidden=true}
function update(dt){if(document.documentElement.hasAttribute('data-event-announcement-open'))return;if(window.WalkControls?.editing||menu||overview||$('townDialog').open||fusion.isOpen||window.walkSocial.isOpen||window.walkAtlas.isOpen())return;const crossing=borderGates.find(g=>nav.distance(p,g)<55);if(crossing){crossBorder(crossing);return}const contact=threats.update(dt,p,{repellent:window.walkRepellentActive?.()});if(contact){openEncounter(contact);return}roamers.update(dt,p);bandits.update(dt,p);let x=joy.x,y=joy.y;if(keys.has('w')||keys.has('arrowup'))y--;if(keys.has('s')||keys.has('arrowdown'))y++;if(keys.has('a')||keys.has('arrowleft'))x--;if(keys.has('d')||keys.has('arrowright'))x++;const manual=Math.hypot(x,y)>.12;if(manual&&travel)stopTravel();let auto=false;
 if(travel){while(travel.path.length&&nav.distance(p,travel.path[0])<7)travel.path.shift();if(!travel.path.length){stopTravel()}else{const goal=travel.path[0];x=goal.x-p.x;y=(goal.y-p.y)*F;auto=true}}
 const len=Math.hypot(x,y),tilt=Math.min(1,Math.hypot(joy.x,joy.y)),keyboard=['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].some(k=>keys.has(k));moving=len>.12;running=moving&&(auto||keys.has('shift')||tilt>(running ? .62 : .72));if(moving){p.dir=(Math.round(-Math.atan2(x,y)/(Math.PI/4))+8)%8;let speed=.68425*(auto?360:keyboard?(running?360:220):220*Math.min(1,tilt/.72)+140*Math.max(0,(tilt-.72)/.28)),step=Math.min(fusion.speed(speed,auto||keyboard?1:tilt/.72)*dt,auto?len:Infinity),nx=p.x+x/len*step,ny=p.y+y/len*step/F;if(nav.walkable(nx,p.y))p.x=nx;if(nav.walkable(p.x,ny))p.y=ny;phase+=dt*(speed/220)*13}
 cam.x+=(p.x-cam.x)*Math.min(1,dt*7);cam.y+=(p.y-cam.y)*Math.min(1,dt*7);near=questNpcs.find(n=>nav.distance(p,n)<125)||treasures.chests.find(s=>nav.distance(p,s)<125)||nav.places.filter(s=>nav.distance(p,s)<190).sort((a,b)=>nav.distance(p,a)-nav.distance(p,b))[0];$('interact').textContent=near?.type==='questNpc'?'◇ สนทนาและรับเควส':near?.kind==='chest'?'◇ เปิดหีบสมบัติ':near?.type==='border'?'◇ ข้ามประเทศ':near?.type==='islandPort'?'⚓ ท่าเรือ':'◇ สำรวจทางเข้า';$('nearby').hidden=!near;$('nearbyName').textContent=near?.name||'';$('interact').disabled=!near;$('area').textContent=near?.name||(data.countryId==='blue'?'ถนนหิมะ':data.countryId==='green'?'เส้นทางพงไพร':'เส้นทางดินแดง')+' · '+data.country;
}
function button(text,action){const b=document.createElement('button');b.textContent=text;b.onclick=action;$('dialogChoices').append(b);return b}
function dialog(title,text){$('islandFerryPreview')?.remove();window.NpcDialogue.clear($('townDialog'));$('townDialog').classList.remove('places-list');reset();$('dialogTitle').textContent=title;$('dialogText').textContent=text;$('dialogChoices').replaceChildren();$('forestEntranceArt')?.remove();if(!$('townDialog').open)$('townDialog').showModal()}
function navigate(s){stopTravel();const path=s.type==='dungeon'?nav.pathBetween(p,s):['islandPort','colosseum'].includes(s.type)?[...nav.route(p,s.anchor),...nav.pathBetween(nav.byId.get(s.anchor),s)]:s.type==='questNpc'?[...nav.route(p,s.anchor),...nav.pathBetween(data.cities.find(c=>c.id===s.anchor),s)]:nav.route(p,s.id);if(!path.length){dialog('ยังหาทางกลับถนนไม่ได้','ลองเดินอ้อมสิ่งกีดขวางออกมาเล็กน้อย แล้วเลือกจุดหมายอีกครั้ง');return}travel={id:s.id,path};overview=false;$('travel').hidden=false;$('travelName').textContent='กำลังเดินไป '+s.name;$('townDialog').close();reset()}
function openCountryMenu(screen,quickItem=''){if(screen==='quests'){reset();stopTravel();window.townQuests.show(true);return}if(!['mail','hero','team','bag','friends','settings','coupon'].includes(screen))return;reset();stopTravel();menu=true;const f=document.createElement('iframe');f.id='regionMenu';f.title=quickItem==='teleportScroll'?'แผนที่เทเลพอร์ต':'เมนูผู้ผนึก';f.src=screen==='coupon'?'../town-walk-demo/coupon.html':'../town-walk-demo/menu.html?v=country-graphics-slider-1&walkScene=country&screen='+screen+'&city='+data.countryId+'-capital'+(quickItem?'&quickItem='+encodeURIComponent(quickItem):'');f.style='position:fixed;inset:0;width:100%;height:100%;border:0;z-index:10000;background:#122b40';document.body.append(f)}
addEventListener('message',e=>{if(e.origin!==location.origin||![$('hudTop')?.contentWindow,$('hudBottom')?.contentWindow].includes(e.source)||e.data?.type!=='walk-menu'||menu)return;openCountryMenu(e.data.screen)});
addEventListener('country-quick-teleport',()=>{if(menu||$('townDialog').open||overview)return;openCountryMenu('bag','teleportScroll')});
function openEncounter(entry){activeEncounter=entry;reset();stopTravel();menu=true;const f=document.createElement('iframe');f.id='regionMenu';f.title=entry.kind==='bandit'?'ต่อสู้กับโจรป่า':'ต่อสู้กับอสูร';f.src='../town-walk-demo/menu.html?v=solar-flight-1&encounter='+entry.kind+'&country='+data.countryId+'&city='+data.countryId+'-capital';f.style='position:fixed;inset:0;width:100%;height:100%;border:0;z-index:10000;background:#122b40';document.body.append(f)}
function openWar(s){if(nav.distance(p,s)>=190)return;const visit=window.walkWar.beginVisit('country-approach',s.id);$('townDialog').close();reset();stopTravel();menu=true;const f=document.createElement('iframe');f.id='regionMenu';f.title='สงครามอาณาจักร';f.src='../town-walk-demo/menu.html?v=island-ferry-map-1&screen=countrywar&city='+data.countryId+'-capital&target='+encodeURIComponent(s.id)+'&visit='+encodeURIComponent(visit);f.style='position:fixed;inset:0;width:100%;height:100%;border:0;z-index:10000;background:#122b40';document.body.append(f)}
function openForest(s){if(forestLocked(s))return;$('townDialog').close();reset();stopTravel();menu=true;const f=document.createElement('iframe');f.id='regionMenu';f.title='ด่าน '+s.name;f.src='../town-walk-demo/menu.html?v=solar-flight-1&screen=wild&zone='+s.zoneId+'&city='+data.countryId+'-capital';f.style='position:fixed;inset:0;width:100%;height:100%;border:0;z-index:10000;background:#122b40';document.body.append(f)}
let ferryCatalog;
function showFerryPreview(country,name){
 const panel=document.createElement('div'),image=document.createElement('img'),details=document.createElement('details');
 const summary=document.createElement('summary'),pools=document.createElement('div');
 panel.id='islandFerryPreview';
 image.src='/Soulbeast/assets/island-props/'+country+'-island-ferry-v1.webp';
 image.alt='ภาพ'+name+'จากมุมสูง';
 image.width=960;image.height=640;
 summary.textContent='อสูรที่พบจากอสูรเงา';
 pools.className='island-ferry-pools';pools.tabIndex=0;
 pools.setAttribute('role','region');pools.setAttribute('aria-label','รายชื่ออสูรที่พบจากอสูรเงา');
 pools.textContent='กำลังโหลดรายชื่ออสูร…';
 details.append(summary,pools);panel.append(image,details);$('dialogChoices').before(panel);
 ferryCatalog??=fetch('../island-demo/ferry-encounters.json?v=1').then(response=>{
  if(!response.ok)throw Error('Ferry encounter catalogue is unavailable');
  return response.json();
 }).catch(error=>{ferryCatalog=null;throw error;});
 ferryCatalog.then(catalog=>{
  const tiers=catalog[country];
  const labels={form1:'อสูรทั่วไป 1 ร่าง',form2:'อสูรทั่วไป 2 ร่าง',form3:'อสูรทั่วไป 3 ร่าง',rare:'อสูรหายาก',legend:'อสูรตำนาน'};
  const intro=document.createElement('p');
  intro.textContent='Lv 45–60 · สุ่ม 1–4 ตัวต่อการต่อสู้ · เปอร์เซ็นต์คิดต่ออสูรหนึ่งตัว';
  pools.replaceChildren(intro);
  summary.textContent+=' · '+Object.values(tiers).reduce((sum,names)=>sum+names.length,0)+' ชนิด';
  for(const [tier,rate] of IslandRules.encounterRates){
   const group=document.createElement('details'),heading=document.createElement('summary'),list=document.createElement('ul');
   group.name='island-ferry-tier';
   heading.textContent=labels[tier]+' · '+rate+'% · '+tiers[tier].length+' ชนิด';
   for(const name of tiers[tier]){
    const item=document.createElement('li');item.textContent=name;list.append(item);
   }
   group.append(heading,list);pools.append(group);
  }
 }).catch(()=>{pools.textContent='โหลดรายชื่ออสูรไม่ได้ ลองปิดแล้วเปิดหน้าต่างท่าเรืออีกครั้ง';});
}
function showPlace(s){
 if(s.type==='islandPort'){
  const I=IslandRules,country=data.countryId,cfg=I.islands[country];
  dialog(s.name,'เรือไป'+cfg.name+' · ขาไป 10,000 เหรียญ · ขากลับฟรี');
  if(nav.distance(p,s)>=190)button('นำทางไปท่าเรือ',()=>navigate(s));
  else{
   showFerryPreview(country,cfg.name);
   const previous=window.townQuests.read()?.islandProgress?.visit?.country;
   const resuming=previous===country;
   if(resuming)$('dialogText').textContent='กลับไป'+cfg.name+'เพื่อเดินทางต่อ · ไม่มีค่าเรือ';
   else if(I.islands[previous])$('dialogText').textContent+=' · ขึ้นเรือจะจบรอบที่ค้างบน'+I.islands[previous].name;
   const embark=button(resuming?'กลับไป'+cfg.name+' · ฟรี':'จ่าย 10,000 เหรียญ · ขึ้นเรือ',async()=>{
    const online=IslandAccount.active();
    embark.disabled=true;
    try{
     let result;
     if(online){
      $('dialogText').textContent='กำลังยืนยันค่าเรือกับเซิร์ฟเวอร์…';
      ({outcome:result}=await IslandAccount.command('island_depart',country,undefined,resuming));
     }else{
      const player=window.townQuests.read();
      result=I.sail(player,country);
      if(result==='depart')window.townQuests.write(player);
     }
     if(result==='depart'||result==='resume'){
      location.href='../island-demo/index.html?country='+country;
     }else $('dialogText').textContent=result==='fare'?'เหรียญไม่พอ ต้องใช้ 10,000 เหรียญ':'ยังเดินทางไม่ได้';
    }catch(error){
     const text=error.code||error.message;
     $('dialogText').textContent=text==='island_fare'?'เหรียญไม่พอ ต้องใช้ 10,000 เหรียญ':
      text==='island_resume_missing'?'รอบเดิมสิ้นสุดแล้ว กรุณาเปิดท่าเรือใหม่เพื่อเลือกเที่ยวเรือ':
      ['login_required','character_not_owned','session_replaced'].includes(text)
       ?'กรุณาเข้าสู่ระบบและเลือกตัวละครอีกครั้ง':'ยังยืนยันการบันทึกค่าเรือไม่ได้ กรุณาลองอีกครั้ง';
    }finally{embark.disabled=false;}
   });
  }
  return;
 }
 if(s.type==='colosseum'){
  dialog(s.name,s.description);
  if(nav.distance(p,s)<190)button('เข้าโคลอสเซียม',()=>location.assign('../colosseum/?country='+data.countryId));
  else button('นำทางไปโคลอสเซียม',()=>navigate(s));
  return;
 }
 if(s.type==='dungeon'){dialog(s.name,s.description);if(nav.distance(p,s)<190)button('เข้าหน้าเตรียมทีมดันเจี้ยน',()=>location.href='../labyrinth-demo/lobby.html');else button('นำทางไปปากถ้ำ',()=>navigate(s));return}const close=nav.distance(p,s)<190;dialog(s.name,s.type==='forest'?'ด่านเนื้อเรื่อง '+s.chapter+' · Lv '+s.levels.join('–')+'\n'+s.description+'\nทางเข้าด่านคงเนื้อเรื่องเดิม · พื้นที่ประเทศ '+data.country+'':s.description);if(s.type==='questNpc')window.NpcDialogue.set($('townDialog'),s.place.split(':').pop(),s.place,s.name);if(s.type==='forest'){window.ForestEntrance.show($('townDialog'),s.zoneId,window.townQuests.read());$('dialogText').textContent+='\nคำเตือน: เมื่อเข้าป่าแล้วจะออกไม่ได้จนกว่าจะชนะบอสหรือพ่ายแพ้'}if(!close)button('นำทางไปที่นี่ · เดินตามถนน',()=>navigate(s));else if(s.type==='questNpc')button('สนทนาและรับเควส',()=>{near=s;interact()});else if(s.type==='capital'||s.type==='city'||s.type==='village'){if(!window.walkWar.canEnter(s.id)){const nation=window.walkWar.playerCountry(),req=window.walkWar.requirement(s.id);$('dialogText').textContent+='\nยังเข้าไม่ได้: ต้องเป็นฐานของประเทศคุณก่อน'+(req.connected===false?'\nยังไม่ติดแนวเขตที่ประเทศเราครอบครอง':'')+(req.required?'\nต้องยึด'+(s.type==='capital'?'เมือง':'หมู่บ้าน')+'ที่เชื่อมอยู่ '+req.held+'/4 (ต้องอย่างน้อย 2/4)':'');button(nation?'โจมตี'+s.name:'เลือกประเทศและดูสงครามอาณาจักร',()=>openWar(s));return}const a=document.createElement('a');a.href=window.townProfiles.entryURL(s.id);a.textContent=s.type==='capital'?'เข้าเมืองหลวง':s.type==='village'?'เข้าหมู่บ้าน'+s.name:'เข้าเมือง'+s.name;$('dialogChoices').append(a)}else if(s.type==='border')button('ผ่านประตูไปประเทศ'+s.targetName,()=>crossBorder(s));else if(s.type==='forest'){if(forestLocked(s))button('ชนะบอสในดินแดนก่อนหน้าเพื่อปลดล็อก',null).disabled=true;else button('เข้าสู่ด่าน '+s.name,()=>openForest(s));}else button('เดินทางต่อ · ดูจุดหมายอื่น',showPlaces)}
function showPlaces(){dialog('เมือง หมู่บ้าน และด่านเนื้อเรื่อง','เมืองหลวง 1 · เมืองรอง 4 · หมู่บ้าน 16 · ทางเข้าป่า '+data.forests.length+' · เลือกจุดหมายเพื่อดูรายละเอียดหรือนำทาง');button('ประตูเชื่อมประเทศ · '+borderGates.length+' จุด',()=>{dialog('ประตูเชื่อมสามอาณาจักร','เดินตามถนนไปยังประตู แล้วเดินผ่านเพื่อข้ามไปอีกประเทศ');for(const gate of borderGates)button(gate.name,()=>showPlace(gate))});$('townDialog').classList.add('places-list');for(const n of questNpcs)button(n.name+' '+window.townQuests.marker(n.place.split(':').pop(),n.place),()=>showPlace(n));for(const s of nav.places){const b=document.createElement('button');b.className='place-row';const title=document.createElement('span'),sub=document.createElement('small');title.textContent=s.type==='forest'?s.chapter+'. '+s.name:s.type==='village'?s.number+'. หมู่บ้าน'+s.name:s.name;sub.textContent=s.type==='capital'?'เมืองหลวง':s.type==='city'?'เมืองรอง':s.type==='village'?'หมู่บ้าน':s.type==='border'?'ประตูเชื่อมประเทศ':s.type==='dungeon'?'ดันเจี้ยน 7 ชั้น':s.type==='colosseum'?'สนามประลอง':s.type==='islandPort'?'เรือไป'+IslandRules.islands[data.countryId].name:'Lv '+s.levels.join('–');b.append(title,sub);b.onclick=()=>showPlace(s);$('dialogChoices').append(b)}}
function questNearbyPlace(position=p){if(position.questPlace)return position.questPlace;let site=null,best=800;for(const candidate of nearbyPlaces){const d=nav.distance(position,candidate);if(d<best){site=candidate;best=d}}return site?.id||null}
function interact(){if(window.walkSocial.talkNear(p))return;if(!near||menu)return;if(near.type==='questNpc'){const n=near,target=n.place.split(':').pop();window.townQuests.emit('talk',{place:n.place,target,country:data.countryId});window.townQuests.show(false,target,n.place);return}if(near.kind==='chest'){const chest=near,status=treasures.state(chest);if(status==='guarded'){dialog('หีบสมบัติโจรป่า','โจรป่ากำลังเฝ้าหีบใบนี้อยู่ · เอาชนะโจรผู้เฝ้าเพื่อเปิดหีบ');return}if(status==='opened'){dialog('หีบสมบัติว่างเปล่า','คุณรับสมบัติจากหีบใบนี้ไปแล้ว');return}dialog('หีบสมบัติโจรป่า','ไอเทมทั่วไป + เงิน 50% · อุปกรณ์ทั่วไป + เงิน 40% · อุปกรณ์คราฟ 10%');button('เปิดหีบและรับสมบัติ',()=>{const result=treasures.claim(chest,p);if(result.ok)window.townQuests.emit('chest',{country:data.countryId,place:chest.owner.questPlace||questNearbyPlace()});dialog(result.ok?'ได้รับสมบัติแล้ว':'ยังเปิดหีบไม่ได้',result.ok?(result.gold?'เหรียญ +'+result.gold+'\n':'')+result.name+' ×'+result.qty+'\nเก็บของรางวัลลงกระเป๋าแล้ว':'หีบนี้รับสมบัติแล้ว หรือคุณอยู่ห่างเกินไป');if(result.ok&&window.WalkQuestEvents){window.WalkQuestEvents.present($('dialogChoices'),[window.WalkQuestEvents.loot(result)]);window.WalkQuestEvents.flush($('dialogChoices'))}for(const id of ['hudTop','hudBottom'])$(id)?.contentWindow.postMessage({type:'walk-hud-refresh'},location.origin)});return}showPlace(near)}$('interact').onclick=interact;$('places').onclick=showPlaces;$('closeDialog').onclick=()=>$('townDialog').close();$('townDialog').addEventListener('close',()=>{if(!$('townDialog').open)$('islandFerryPreview')?.remove();reset();});$('closeOverview').onclick=()=>{overview=false;reset();cam.x=p.x;cam.y=p.y};$('mapToggle').onclick=()=>overview=!overview;$('cancelTravel').onclick=stopTravel;
function joyMove(e){if(e.pointerId!==joy.id)return;const r=$('joystick').getBoundingClientRect(),max=r.width*.33;let x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,len=Math.hypot(x,y);if(len>max){x=x/len*max;y=y/len*max}joy.x=x/max;joy.y=y/max;$('stick').style.transform=`translate(${x}px,${y}px)`;e.preventDefault()}
const stick=$('joystick');stick.onpointerdown=e=>{joy.id=e.pointerId;stick.setPointerCapture(e.pointerId);joyMove(e)};stick.onpointermove=joyMove;for(const ev of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(ev,()=>{joy.x=joy.y=0;joy.id=null;$('stick').style.transform='translate(0,0)'});

addEventListener('keydown',e=>{if($('townDialog').open||menu||window.walkAtlas.isOpen())return;if(e.key==='Escape'&&overview){$('closeOverview').click();return}keys.add(e.key.toLowerCase());if(e.key==='e'&&!e.repeat)interact();if(e.key==='m'&&!e.repeat)overview=!overview;if(e.key.startsWith('Arrow'))e.preventDefault()});addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',reset);addEventListener('soulbeast-announcement-visibility',e=>{if(e.detail?.open){reset();stopTravel();}});document.addEventListener('visibilitychange',()=>{if(document.hidden)reset()});
canvas.onclick=e=>{if(!overview)return;const s=[...nav.places,...questNpcs].map(s=>({s,d:Math.hypot(e.clientX-sx(s.x),e.clientY-sy(s.y)+18)})).sort((a,b)=>a.d-b.d)[0];if(s?.d<34)showPlace(s.s)};
addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==$('regionMenu')?.contentWindow)return;if(e.data?.type==='walk-war-updated'){for(const id of ['hudTop','hudBottom'])$(id)?.contentWindow.postMessage({type:'walk-hud-refresh'},location.origin);return}if(e.data?.type==='country-encounter-result'&&activeEncounter&&['win','lose','flee'].includes(e.data.result)){const result=e.data.result;if(result==='win')window.townQuests.emit('defeat',{kind:activeEncounter.kind,country:data.countryId,place:activeEncounter.actor.questPlace||questNearbyPlace()});if(result==='win'&&activeEncounter.kind==='bandit')treasures.unlock(activeEncounter.actor);threats.resolve(activeEncounter,result);activeEncounter=null;$('regionMenu').remove();menu=false;reset();syncAvatar();for(const id of ['hudTop','hudBottom'])$(id)?.contentWindow.postMessage({type:'walk-hud-refresh'},location.origin);if(result==='lose'){const home=window.walkWar.playerCountry()||data.countryId;location.href=window.townProfiles.entryURL(home+'-capital')+(home==='blue'?'?':'&')+'screen=hospital';}return}if((['town-return','town-open-quests','walk-fusion-open'].includes(e.data?.type)||e.data?.type==='walk-forest-exit'&&!['lose','surrender'].includes(e.data.result))&&!activeEncounter){window.walkWar.endVisit();$('regionMenu').remove();menu=false;reset();syncAvatar();for(const id of ['hudTop','hudBottom'])$(id)?.contentWindow.postMessage({type:'walk-hud-refresh'},location.origin);if(e.data.type==='town-open-quests')window.townQuests.show(true);if(e.data.type==='walk-fusion-open')fusion.show()}});
window.walkAtlas.bind({pause:()=>{reset();stopTravel()},resume:reset,snapshot:()=>({kind:'country',country:data.countryId,x:p.x,y:p.y,liveTargets:[...roamers.actors.filter(a=>!a.cooldown).map((a,i)=>({...a,id:'shadow-'+i,name:'เงาอสูร',probe:{type:'enemy',kind:'shadow',country:data.countryId,place:questNearbyPlace(a)}})),...bandits.actors.filter(a=>!a.cooldown).map((a,i)=>({...a,id:'bandit-'+i,name:'โจรป่า',probe:{type:'enemy',kind:'bandit',country:data.countryId,place:questNearbyPlace(a)}})),...treasures.chests.map(a=>({...a,id:a.id,name:'หีบสมบัติ',probe:{type:'chest',country:data.countryId,place:questNearbyPlace(a),opened:treasures.state(a)==='opened'}}))]})});
const sceneAudio=WalkAudio.create({kind:'country',music:{blue:'countryBlue',green:'countryGreen',red:'countryRed'}[data.countryId],waterSources:[...terrain.water.rivers,...terrain.water.lakes.map(l=>({...l,closed:true}))]});
window.walkSocial.bind({canvas,place:()=>'country:'+data.countryId,canInteract:()=>!menu&&!overview&&!$('townDialog').open&&!fusion.isOpen&&!window.walkAtlas.isOpen(),stop:()=>{reset();stopTravel()},duel:(online=false)=>{reset();stopTravel();menu=true;const frame=document.createElement('iframe');frame.id='regionMenu';frame.title='ประลอง PVP';frame.src='../town-walk-demo/menu.html?v=camp-replay-1&screen=pvp'+(online?'':'&localDuel=1')+'&city='+data.countryId+'-capital';frame.style='position:fixed;inset:0;width:100%;height:100%;border:0;z-index:10000;background:#122b40';document.body.append(frame)},closeMenu:()=>{$('regionMenu')?.remove();menu=false;reset();syncAvatar()}});
addEventListener('pagehide',e=>{if(!e.persisted){groundTiles?.release();avatar.release();canvas.width=canvas.height=1}});
function frame(now){const dt=Math.min((now-last)/1000||0,.04);last=now;t+=dt;update(dt);window.walkKingdomBoss?.tick(p,running);window.walkPresence.tick('country:'+data.countryId,p,moving,running);sceneAudio.tick(dt,{position:p,moving,running,blocked:menu,surface:terrain.water.onBridge(p.x,p.y)?'hall':canvas.dataset.surface==='road'?'stone':data.countryId==='green'?'leaves':'forest'});if(now-lastPaint<paintInterval){requestAnimationFrame(frame);return;}lastPaint=now;draw();window.walkKingdomBoss?.draw(c,sx,sy,zoom(),overview,t);for(const n of questNpcs){const mark=window.townQuests.marker(n.place.split(':').pop(),n.place);if(overview){ellipse(c,sx(n.x),sy(n.y),7,7,'#efcc65');label(n.name+(mark&&mark!=='X'?' '+mark:''),sx(n.x),sy(n.y)-14,'#173747');if(mark==='X')window.townQuests.drawTarget(c,sx(n.x),sy(n.y)-35,.65,window.townQuests.markerStyle(n.place.split(':').pop(),n.place))}else{const q=zoom(),x=sx(n.x),y=sy(n.y),im=npcArt[n.slug],h=160*q,w=im.naturalHeight?h*im.naturalWidth/im.naturalHeight:0;if(im.naturalWidth)c.drawImage(im,x-w/2,y-h,w,h);label(n.name+' '+(mark==='X'?'':mark||'◇'),x,y-170*q,'#173747');if(mark==='X')window.townQuests.drawTarget(c,x,y-198*q,q,window.townQuests.markerStyle(n.place.split(':').pop(),n.place))}}if(!overview){window.walkPresence.drawLabels(c,sx,sy,zoom());window.walkPresence.label(c,sx(p.x),sy(p.y)-154*zoom(),window.walkPresence.player())}requestAnimationFrame(frame)}
Promise.all([LivingEnvironment.ready(environmentKeys),avatar.sync(),...Object.values(images).map(im=>new Promise((res,rej)=>{im.onload=res;im.onerror=rej;if(im.complete&&im.naturalWidth)res()}))]).then(()=>{makeGround();sceneryIndex=CountryRenderBudget.index(sceneryObjects,objectBounds);makeMiniBase();groundTiles=CountryRenderBudget.groundTiles(ground,()=>document.createElement('canvas'));ground.width=ground.height=1;window.WalkLoading.ready();$('loading').remove();requestAnimationFrame(frame)}).catch(()=>window.WalkLoading.fail('โหลดภาพไม่สำเร็จ กรุณาลองใหม่'));
})();

