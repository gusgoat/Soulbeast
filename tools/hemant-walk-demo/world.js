(()=>{'use strict';
const packlordPreview=window.SoulbeastPacklordPreview;
if(!packlordPreview&&!sessionStorage.getItem(IslandRules.onlineKey)){
 const player=JSON.parse(sessionStorage.getItem(IslandRules.key)||'null');
 if(IslandPreviewProfile.upgrade(player,WalkVitals.maximum)){
  const raw=JSON.stringify(player);sessionStorage.setItem(IslandRules.key,raw);
  localStorage.setItem('soulbeast-walk-save:'+player.walkId,raw);
 }
}
const $=id=>document.getElementById(id),canvas=$('world'),surface=canvas.getContext('2d'),mini=$('minimap').getContext('2d'),data=window.hemantMap,borderGates=window.walkBorderLinks.attach(data,window.walkBorderData,{...window.walkCountries,blue:window.hemantBlueMap}),nav=window.hemantNavigation.create(data),F=data.flatten;
const colosseum=data.regionLayout?data.regionPlaces.find(p=>p.type==='colosseum'):window.WalkColosseum.site(data.countryId);if(colosseum&&!data.regionLayout)nav.places.push(colosseum);
const dungeonEntrance={id:'seven-floor-dungeon',type:'dungeon',name:'มหาวงกตดันเจี้ยน 7 ชั้น',country:'red',x:1104,y:7704,description:'เหมืองใต้พิภพ · เข้าคนเดียวได้ หรือเลือกเพื่อนออนไลน์ 1 คน เลเวลต่างกันไม่เกิน 10 เพื่อร่วมต่อสู้',levels:[1,60]};if(data.countryId==='red'&&!data.regionLayout)nav.places.push(dungeonEntrance);
const capital=data.cities[0],origin=[...data.cities,...data.villages].find(s=>s.id===new URLSearchParams(location.search).get('from'))||capital,exitFrom=new URLSearchParams(location.search).get('gate'),spawn=exitFrom==='west'?{x:origin.x-285,y:origin.y+210}:exitFrom==='east'?{x:origin.x+295,y:origin.y+190}:{x:origin.x,y:origin.y+265},p={...spawn,dir:0,bridgeDeck:null},cam={...p},keys=new Set(),joy={x:0,y:0,id:null};
let W,H,t=0,last=0,phase=0,moving=false,running=false,overview=new URLSearchParams(location.search).get('view')==='map',near=null,travel=null,menu=false;
const images={};const files={colosseum:'/Soulbeast/assets/country-walk/colosseum-v1.webp',islandPort:'/Soulbeast/assets/island-props/'+data.countryId+'-port.webp',dungeon:'/Soulbeast/assets/dungeon-mine-v1/country-entrance-v1.webp',questNpc:'/Soulbeast/assets/town-walk-preview/npcs-v2.png.webp',flagblue:'/Soulbeast/assets/ui/country-war/flag-blue-v1.webp',flaggreen:'/Soulbeast/assets/ui/country-war/flag-green-v1.webp',flagred:'/Soulbeast/assets/ui/country-war/flag-red-v1.webp',borderGate:'/Soulbeast/assets/country-walk/border-gates/'+data.countryId+'-v1.png.webp',chest:'bandit-treasure-v1.png.webp',water:'river-water-v1.png.webp',village0:'village-0-v1.webp',village1:'village-1-v1.webp',village2:'village-2-v1.webp',snow:'snow-v1.png.webp',pine:'pine-v2.png.webp',mountain:'mountain-v2.png.webp',...Object.fromEntries(data.cities.map(s=>['city'+s.art,'city-'+s.art+'-v1.png.webp'])),...Object.fromEntries(data.forests.map(s=>['forest'+s.art,'/Soulbeast/assets/country-walk/forest-landmarks-v2/zone-'+s.zoneId+'.webp']))};
if(data.countryId!=='blue'){const root='/Soulbeast/assets/country-walk/'+data.countryId+'/';Object.assign(files,{snow:data.countryId==='green'?'/Soulbeast/assets/town-walk-preview/grass-v1.png.webp':root+'ground.png.webp',pine:root+'tree.png.webp',mountain:root+'mountain.png.webp',cliff:root+'cliff.png.webp',chest:'/Soulbeast/assets/country-walk/temperate-chest.png.webp'});for(const city of data.cities)files['city'+city.art]=root+(city.type==='capital'?'capital':'city')+'.png.webp';for(const village of data.villages)files['village'+village.art]=root+'village.png.webp'}
Object.assign(files,CountryPathArt.assetFiles(data.countryId),CountryEdgeRocks.assetFiles(data.countryId),CountryGrassClumps.assetFiles(data.countryId),CountryMeadowDetails.assetFiles(data.countryId));
if(data.countryId==='red')Object.assign(files,CountryLava.art);
for(const kind of ['ruin','statue'])files['prop-'+kind]='/Soulbeast/assets/ui/world-polish-20261103/'+data.countryId+'-'+kind+'.png.webp';

if(data.regionLayout){delete files.borderGate;files.beachPalmAtlas=CoastVegetation.asset;Object.assign(files,RegionGateGeometry.assetFiles(data.countryId));}
for(const [id,file]of Object.entries(files)){const im=new Image();if(/^https?:/.test(file))im.crossOrigin='anonymous';im.src=file.startsWith('/')||/^https?:/.test(file)?file:'/Soulbeast/assets/hemant-walk-preview/'+file;images[id]=im}
let c=surface;
const groundShadows=WalkGroundShadows.create(.75),spriteContext=(x,y)=>overview?c:groundShadows.sprite(c,x,y);
const avatar=window.sealerSprites.create({preloadDirections:true,allow3d:!packlordPreview});const syncAvatar=()=>avatar.sync(packlordPreview?.avatar).catch(e=>console.error('Player animation:',e));
if(packlordPreview)addEventListener('walk-preview-avatar',syncAvatar);
const touchDisplay=matchMedia('(pointer: coarse)').matches;
let graphics,shouldPaint,grassDisplacement=null;
function resize(){
 W=innerWidth;H=innerHeight;
 const pixelLimit=touchDisplay?Math.max(1,Math.sqrt(graphics.pixels/Math.max(1,W*H))):2;
 const dpr=Math.min(devicePixelRatio||1,graphics.scale,pixelLimit);
 canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);
 surface.setTransform(canvas.width/Math.max(1,W),0,0,canvas.height/Math.max(1,H),0,0);
 groundShadows.resize(canvas.width,canvas.height,W,H);
}
function applyGraphics(){
 const level=WalkGraphics.read();
 graphics=WalkGraphics.levels[level-1];
 const fps=graphics.fps||(graphics.frameMs===32?30:touchDisplay?60:0);
 shouldPaint=CountryRenderBudget.paintCadence(fps?1000/fps:0);
 canvas.dataset.graphicsLevel=String(level);
 resize();
}
addEventListener('resize',resize);
addEventListener('storage',event=>{if(event.key===WalkGraphics.KEY||event.key===null)applyGraphics();});
addEventListener(WalkGraphics.CHANGE,applyGraphics);
applyGraphics();
const zoom=()=>overview?Math.min((W-32)/data.width,(H-(data.regionLayout&&W>H?120:245))/(data.height*F)):.72;
const sx=x=>(x-(overview?data.width/2:cam.x))*zoom()+W/2,sy=y=>(y-(overview?data.height/2:cam.y))*F*zoom()+H*(overview?.53:.57);
function ellipse(ctx,x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill()}
let seed=205;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
const terrain=window.hemantTerrain.create(data,nav);nav.setTerrain(terrain);const islandPort=data.regionLayout?data.regionPlaces.find(p=>p.type==='islandPort'):IslandRules.port(data.countryId);if(islandPort&&!data.regionLayout)nav.places.push(islandPort);const questNpcs=window.walkQuestEnvoy.createAll(data,nav),envoy=questNpcs[0];const npcArt={};for(const n of questNpcs){const im=new Image();im.src=n.portrait;npcArt[n.slug]=im}const arrivalGate=borderGates.find(g=>g.id===new URLSearchParams(location.search).get('arrival'));Object.assign(spawn,arrivalGate?window.walkBorderLinks.arrival(arrivalGate,data):nav.spawnAt(origin,exitFrom||'south'));if(data.countryId==='red'&&new URLSearchParams(location.search).get('arrival')==='dungeon'){const entrance=data.regionLayout?data.regionPlaces.find(p=>p.type==='dungeon'):{x:1104,y:7804};if(entrance)Object.assign(spawn,entrance);}if(colosseum&&new URLSearchParams(location.search).get('arrival')==='colosseum')Object.assign(spawn,colosseum);const forestArrival=/^forest-(\d+)$/.exec(new URLSearchParams(location.search).get('arrival')||'');if(forestArrival){const forest=data.forests.find(f=>Number(f.zoneId)===Number(forestArrival[1]));if(forest){Object.assign(spawn,forest);}}if(islandPort&&new URLSearchParams(location.search).get('arrival')==='island-port')Object.assign(spawn,islandPort);if(data.waterTraversal==='wade'){const target=new URLSearchParams(location.search).get('arrival');if(target==='river'){for(const f of [.18,.82,.3,.7,.05]){const point=terrain.water.pointAt(terrain.water.rivers[0],f);if(!terrain.water.onBridge(point.x,point.y)&&nav.playerWalkable(point.x,point.y)){Object.assign(spawn,point);break;}}}else if(target==='lake')Object.assign(spawn,terrain.water.lakes[0].center);else if(target==='sea'){const entries=RegionCoast.segments(data).flatMap(e=>[.5,.25,.75].map(f=>({x:e.a.x+(e.b.x-e.a.x)*f+e.nx*80,y:e.a.y+(e.b.y-e.a.y)*f+e.ny*80/F})));const point=entries.find(p=>terrain.water.seaSampleAt(p.x,p.y)&&nav.playerWalkable(p.x,p.y));if(point)Object.assign(spawn,point);}}
Object.assign(p,spawn);Object.assign(cam,spawn);const {trees,mountains}=terrain;if(data.regionLayout){canvas.dataset.region=data.regionId;canvas.dataset.regionLayout=data.regionLayout;}if(packlordPreview){
 const nearbyTree=!data.regionLayout&&trees.filter(tree=>tree.w>=130&&[-110,110].every(dx=>nav.walkable(tree.x+dx,tree.y-80)))
  .reduce((best,tree)=>!best||nav.distance(spawn,tree)<nav.distance(spawn,best)?tree:best,null);
 if(nearbyTree){
  Object.assign(p,{x:nearbyTree.x-110,y:nearbyTree.y-80});
  Object.assign(cam,p);
  canvas.dataset.previewTree=[nearbyTree.x,nearbyTree.y].join(',');
 }
 packlordPreview.load();
}
const allBeastsPreview=!!packlordPreview&&new URLSearchParams(location.search).get('beastTestAll')==='1';
function livingEncounterPlayer(){const player=window.townQuests.read();return allBeastsPreview?{...player,lv:60,cleared:1,forestClears:{7:1,1:1,2:1,3:1,4:1,5:1,6:1,8:1}}:player;}
function stageBeastPreview(){if(!allBeastsPreview)return;const actors=roamers.actors.filter(a=>a.beastHabitat==='land'),center=actors[0];if(!center)return;const candidates=[{x:center.x,y:center.y}];for(const radius of [200,280,360])for(let i=0;i<16;i++){const angle=i*Math.PI/8,p={x:center.x+Math.cos(angle)*radius,y:center.y+Math.sin(angle)*radius/F};if(roamers.allowed(p.x,p.y)&&actors.slice(3).every(a=>nav.distance(a,p)>180)&&candidates.every(a=>nav.distance(a,p)>180))candidates.push(p);}for(let i=0;i<Math.min(3,candidates.length,actors.length);i++){Object.assign(actors[i],candidates[i]);actors[i].home={...candidates[i]};actors[i].goal=null;actors[i].wait=i*.3;actors[i].livingPose={...candidates[i],heading:0};}canvas.dataset.beastTestAll='true';canvas.dataset.beastPreviewStaged=Math.min(3,candidates.length,actors.length);}
for(const tree of trees)tree.variant=LivingEnvironment.treeVariant(data.countryId,tree,terrain.water.raw(tree.x,tree.y,420));const roamers=data.regionLayout?window.hemantRoamers.createRegional(data,nav):window.hemantRoamers.create(data,nav);const bandits=window.hemantBandits.create(data,nav,terrain);const waterBeasts=CountryWaterBeasts.create(data,nav,terrain,{enabled:LivingBeasts.canPlan({scene:'country',country:data.countryId,player:livingEncounterPlayer(),habitat:'water'}),river:LivingBeasts.canPlan({scene:'country',country:data.countryId,player:livingEncounterPlayer(),habitat:'water',waterType:'river'}),sea:LivingBeasts.canPlan({scene:'country',country:data.countryId,player:livingEncounterPlayer(),habitat:'water',waterType:'sea'})});window.walkQuestTargets.populate(data,nav,roamers,bandits,window.townQuests.read(),window.WorldQuestData);const threats=window.hemantEncounters.create(nav,[{kind:"shadow",actors:roamers.actors},{kind:"bandit",actors:bandits.actors},{kind:"water",actors:waterBeasts.actors,nav:waterBeasts.nav}],{canChase:(entry,point)=>entry.kind==='water'?(livingBeasts.ready(entry.actor)&&waterBeasts.eligible(entry.actor,point)):(entry.kind!=='shadow'||livingBeasts.ready(entry.actor))&&(entry.actor.beastHabitat!=='beach'||RegionCoast.isBeach(data,point.x,point.y))&&!WaterInteraction.state(data,terrain.water,point),leashDistance:()=>WorldPursuit.leash(W,H,zoom(),1),chaseDurationMs:5000});let activeEncounter=null;LivingBeasts.assign(roamers.actors,{scene:"country",country:data.countryId,player:livingEncounterPlayer(),diverse:allBeastsPreview});const beachOptions={scene:'country',country:data.countryId,player:livingEncounterPlayer(),habitat:'beach'};if(data.regionLayout&&LivingBeasts.canPlan(beachOptions)){const beach=BeastHabitats.beachPoint(data,nav,terrain,roamers.allowed),actor=roamers.actors.at(-1);if(beach&&actor){delete actor.beastModelId;delete actor.encounterPlan;Object.assign(actor,beach,{home:{...beach},goal:null});LivingBeasts.ensure(actor,beachOptions);actor.habitatAllowed=(x,y)=>RegionCoast.isBeach(data,x,y,-80)&&nav.walkable(x,y);actor.navigation={...nav,walkable:actor.habitatAllowed};}}for(const actor of waterBeasts.actors){delete actor.beastModelId;delete actor.encounterPlan;LivingBeasts.ensure(actor,{scene:'country',country:data.countryId,player:livingEncounterPlayer(),habitat:'water',waterType:actor.bodyType});}CountryBanditActors.assign(bandits.actors,{player:livingEncounterPlayer(),country:data.countryId});const banditSprites=CountryBanditActors.create(bandits.actors);window.countryBandits={actors:bandits.actors,renderer:banditSprites};stageBeastPreview();const livingBeasts=LivingBeasts.create();void livingBeasts.preload(roamers.actors.slice().sort((a,b)=>nav.distance(p,a)-nav.distance(p,b)).slice(0,3));window.countryLivingBeasts={actors:roamers.actors,waterActors:waterBeasts.actors,renderer:livingBeasts};if(packlordPreview&&['beasts','bandit'].includes(new URLSearchParams(location.search).get('arrival'))){const a=new URLSearchParams(location.search).get('arrival')==='bandit'?bandits.actors[0]:roamers.actors[0],point=[180,230,120,280].flatMap(r=>Array.from({length:32},(_,i)=>({x:a.x+Math.cos(i*Math.PI/16)*r,y:a.y+Math.sin(i*Math.PI/16)*r/F}))).find(p=>nav.playerWalkable(p.x,p.y));if(point){Object.assign(p,point);Object.assign(cam,point);}}const treasures=window.hemantTreasures.create(nav,bandits.actors,sessionStorage,window.hemantTreasureCatalog,Math.random,data.countryId);
const archedBridges=CountryArchedBridges.create(data.countryId,terrain.water.bridges,F);
const walkY=(x,y)=>sy(y)-(overview||(x===p.x&&y===p.y&&p.bridgeDeck===null)?0:archedBridges.height(x,y)*zoom());
const coast=RegionCoast.create(data);
const ground=document.createElement('canvas');ground.width=data.width/2;ground.height=data.height*F/2;
function makeGround(){const g=ground.getContext('2d');g.scale(.5,.5);const snow=g.createPattern(images.snow,'repeat');snow.setTransform(new DOMMatrix().scale(.45));g.fillStyle=snow;g.fillRect(0,0,data.width,data.height*F);
 LivingEnvironment.patches(g,data.width,data.height,data.countryId,147,200);
 lava.drawGround(g,images);
 CountryPathArt.paint(g,nav,F,data.countryId,images);
 terrain.water.drawGround(g,images.water);

 for(let i=0;i<2400;i++){const x=rand()*data.width,y=rand()*data.height;ellipse(g,x,y*F,2+rand()*6,1+rand()*3,data.countryId==='blue'?'#86afc314':data.countryId==='red'?'#3b272828':'#dec67728')}
 window.CountryRegions?.decorateGround(g,data,images);
}
function art(im,x,y,width,anchor=.94,alpha=1){if(!im?.naturalWidth)return;const w=width*zoom(),h=w*im.height/im.width;if(x+w<-100||x-w>W+100||y+30<-100||y-h>H+100)return;c.save();c.globalAlpha=alpha;spriteContext(x,y).drawImage(im,x-w/2,y-h*anchor,w,h);c.restore()}
function label(text,x,y,color='#183b52',large=false){text=window.SoulbeastLocale?.text(text)??text;c.save();c.textAlign='center';c.font=(large?'bold ':'')+(overview?(large?11:9):13)+'px Tahoma';c.lineWidth=3;c.strokeStyle='#f2faffdd';c.strokeText(text,x,y);c.fillStyle=color;c.fillText(text,x,y);c.restore()}
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
function placeImage(s){return images[(s.type==='forest'?'forest':s.type==='village'?'village':'city')+s.art]}
function placeWidth(s){return s.type==='capital'?490:s.type==='city'?375:s.type==='village'?235:310}
function drawLandmarkWater(lines,x,y,width,height){
 if(!lines||overview||!graphics.effects||x+width/2<0||x-width/2>W||y+height*.06<0||y-height*.94>H)return;
 LandmarkWater.draw(c,lines,x-width/2,y-height*.94,width,height,t,graphics.effects===1);
}
function place(s){
 if(s.type==='junction')return;
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
 if(s.type==='dungeon'){art(images.dungeon,sx(s.x),sy(s.y),420);window.townQuests.drawTarget(c,sx(s.x),sy(s.y)-190*zoom(),overview?.65:zoom(),window.townQuests.targetStyle({type:'place',place:s.id,country:data.countryId}));label(s.name,sx(s.x),sy(s.y)+40*zoom(),'#17334f',true);if(nav.distance(p,s)<190)label('◇ เข้าดันเจี้ยน',sx(s.x),sy(s.y)+23,'#805c19');return}if(s.type==='border'){drawBorderGate(s);return}const im=placeImage(s),width=placeWidth(s);const locked=forestLocked(s);art(im,sx(s.x),sy(s.y),width,.94,locked?.72:1);drawLandmarkWater(LandmarkWater.place(s),sx(s.x),sy(s.y),width*zoom(),width*zoom()*im.height/im.width);if(['capital','city','village'].includes(s.type)){const flag=images['flag'+window.walkWar.owner(s.id)];if(flag?.naturalWidth)spriteContext(sx(s.x),sy(s.y)).drawImage(flag,sx(s.x)+width*.25*zoom(),sy(s.y)-width*.65*zoom(),52*zoom(),35*zoom())}const h=width*im.height/im.width;if(locked)drawForestLock(sx(s.x)-width*.28*zoom(),sy(s.y)-h*.69*zoom(),overview?.8:1.25);window.townQuests.drawTarget(c,sx(s.x),sy(s.y)-h*.94*zoom()-(overview?29:36),overview?.65:zoom(),window.townQuests.targetStyle({type:'place',place:s.id,zone:s.zoneId,country:data.countryId}));label((s.type==='forest'?s.chapter+'. ':s.type==='village'?(overview?s.number+'. ':'หมู่บ้าน'):'')+s.name,sx(s.x),sy(s.y)-h*.94*zoom()-10,s.type==='forest'?'#234c57':'#17334f',['capital','city'].includes(s.type));if(overview){ellipse(c,sx(s.x),sy(s.y)+6,3,3,s.type==='forest'?'#53877b':'#c1964e')}else if(nav.distance(p,s)<190){label(locked?'ยังไม่ปลดล็อก':'◇ สำรวจทางเข้า',sx(s.x),sy(s.y)+23,'#805c19')}}
function gateMarker(ctx,x,y,r){ctx.save();ctx.fillStyle='#f5cc59';ctx.strokeStyle='#183546';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y+2*r);ctx.lineTo(x-r,y);ctx.lineTo(x+r,y);ctx.closePath();ctx.fill();ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeRect(x-r*.35,y-r*.45,r*.7,r*.9);ctx.restore()}
let trackedGate=null;
function drawBorderGate(s){const x=sx(s.x),y=sy(s.y),q=zoom(),tracked=s===trackedGate;if(data.regionLayout){c.save();c.strokeStyle=s.regional?'#edbb42':'#b35ee4';c.lineWidth=overview?3:5;c.beginPath();c.ellipse(x,y,overview?8:70*q,overview?5:38*q,0,0,Math.PI*2);c.stroke();c.restore();}if(overview){gateMarker(c,x,y-10,7);label(s.name,Math.max(90,Math.min(W-90,x)),y-24,'#593b0e',true);if(tracked)window.townQuests.drawTarget(c,x,y-50,.85,'tracked');return}let top;if(data.regionLayout){const frame=RegionGateGeometry.frame(images,s);if(!frame)return;spriteContext(x,y).drawImage(frame.image,x+frame.left*q,y+frame.top*q,frame.width*q,frame.height*q);top=y+frame.top*q;}else{art(images.borderGate,x,y,540,.96);top=y-540*images.borderGate.height/images.borderGate.width*.96*q;}label(s.name,x,top-12,'#694b1d',true);if(tracked)window.townQuests.drawTarget(c,x,top-40,q,'tracked');if(nav.distance(p,s)<190)label(s.regional?'เดินผ่านประตูเพื่อเปลี่ยนภาค':'เดินผ่านประตูเพื่อข้ามประเทศ',x,y+25,'#805c19')}
function crossBorder(gate){if(menu)return;menu=true;reset();stopTravel();location.href=window.walkBorderLinks.travelURL(gate,location.search)}
const fusion=BeastFusion.create({canOpen:()=>!menu&&!overview&&!$('townDialog').open&&!window.walkAtlas.isOpen(),stop:()=>{reset();stopTravel()},openShop:()=>{reset();menu=true;const frame=document.createElement('iframe');frame.id='regionMenu';frame.title='ร้านคูปอง';frame.src='../town-walk-demo/coupon.html?v=referral-1';frame.style='position:fixed;inset:0;width:100%;height:100%;border:0;z-index:10000;background:#122b40';document.body.append(frame)}});
function questNpcSprite(n,q){
 const im=npcArt[n.slug];
 if(!im.naturalWidth)return;
 const x=sx(n.x),y=walkY(n.x,n.y),h=160*q,w=h*im.naturalWidth/im.naturalHeight;
 if(x+w/2<0||x-w/2>W||y<0||y-h>H)return;
 WalkIdleArt.drawNpc(spriteContext(x,y),im,null,x-w/2,y-h,w,h,t,n);
}
function player(){const x=sx(p.x),y=walkY(p.x,p.y),q=zoom();if(overview){ellipse(c,x,y,5,5,'#edcb69');c.strokeStyle='#173e59';c.lineWidth=2;c.strokeRect(x-6,y-6,12,12);return;}
 const water=WaterInteraction.state(data,terrain.water,p),modelReady=packlordPreview?!!packlordPreview.motion:avatar.renderer==='3d',portraitReady=avatar.current?.portrait?.naturalWidth>0,bodyHeight=154*q*(modelReady?1:portraitReady?.54:.24),drawY=y+WaterInteraction.sink(water,bodyHeight),sprite=water?c:spriteContext(x,y),direction=p.spriteDir??p.dir;
 if(water){WaterInteraction.ripple(c,x,y,q,t,moving);c.save();WaterInteraction.clipAbove(c,x,y,q);}
 const draw3d=packlordPreview?.draw(sprite,x,drawY,154*q,direction,moving,running&&!water,t);
 if(!packlordPreview&&sealerSprites.use3d)canvas.dataset.avatarRenderer=avatar.renderer;
 if(packlordPreview){canvas.dataset.avatarRenderer=draw3d?'3d':'sprite';canvas.dataset.avatarMotion=draw3d?packlordPreview.motion:'';canvas.dataset.avatarAngle=draw3d?packlordPreview.angle.toFixed(3):'';}
 if(!draw3d&&(packlordPreview||!fusion.draw(sprite,x,drawY,q,p.dir,t,moving,direction)))avatar.draw(sprite,x,drawY,154*q,direction,phase,moving,running&&!water);
 if(water){c.restore();WaterInteraction.ripple(c,x,y,q,t,moving,true);}
}
function waterBeast(a){if(a.cooldown>0)return;const x=sx(a.x),y=sy(a.y),q=zoom();if(overview){ellipse(c,x,y,2.8,2.8,'#5de1eb');return;}if(x<-140||x>W+140||y<-30||y>H+180)return;WaterInteraction.ripple(c,x,y,q,t,a.moving);c.save();WaterInteraction.clipAbove(c,x,y,q);livingBeasts.draw(c,a,x,y+18*q,154*q,performance.now()/1000);c.restore();WaterInteraction.ripple(c,x,y,q,t,a.moving,true);if(nav.distance(p,a)<270)label(a.beastName,x,y-105*q,'#145667');}
function drawLivingShadow(a){const x=sx(a.x),y=walkY(a.x,a.y),q=zoom();if(overview){ellipse(c,x,y,2,2,'#d5bf8d');return;}if(x<-140||x>W+140||y<-40||y>H+180)return;livingBeasts.draw(spriteContext(x,y),a,x,y,154*q,performance.now()/1000);window.townQuests.drawTarget(c,x,y-150*q,q,window.townQuests.targetStyle({type:'enemy',kind:'shadow',country:data.countryId,place:questNearbyPlace(a)}));if(nav.distance(p,a)<240)label((a.chasing?'! ':'')+a.beastName,x,y-138*q,a.chasing?'#922d34':'#343751');}
function shadowBeast(a){drawLivingShadow(a);}
function forestBandit(a){if(overview)return;const x=sx(a.x),y=walkY(a.x,a.y),q=zoom();if(x<-120||x>W+120||y<-30||y>H+180)return;banditSprites.draw(spriteContext(x,y),a,x,y,154*q);window.townQuests.drawTarget(c,x,y-174*q,q,window.townQuests.targetStyle({type:'enemy',kind:'bandit',country:data.countryId,place:questNearbyPlace(a)}));if(nav.distance(p,a)<210)label((a.chasing?'! ':'')+'โจรป่า · '+sealerSpriteCatalog[a.banditClass].name,x,y-138*q,a.chasing?'#922d34':'#703f30')}
function treasureChest(a){const status=treasures.state(a);if(overview){if(status!=='opened')ellipse(c,sx(a.x),sy(a.y),2.5,2.5,'#e4ba4e');return}art(images.chest,sx(a.x),sy(a.y),100,.94,status==='opened'?.45:1);window.townQuests.drawTarget(c,sx(a.x),sy(a.y)-112*zoom(),zoom(),window.townQuests.targetStyle({type:'chest',country:data.countryId,place:questNearbyPlace(a),opened:status==='opened'}));if(nav.distance(p,a)<240)label(status==='opened'?'หีบว่าง':status==='ready'?'◇ เปิดหีบสมบัติ':'หีบสมบัติ · โจรเฝ้าอยู่',sx(a.x),sy(a.y)-85*zoom(),status==='ready'?'#92631f':'#4b4850')}
const sceneryExclusions=[...terrain.water.accessPoints,...questNpcs,...treasures.chests,...bandits.actors,...roamers.actors];
const initialCountryProps=CountryProps.create(data,nav,sceneryExclusions);
const initialLivingProps=LivingEnvironment.country(data,nav,terrain,[...sceneryExclusions,...initialCountryProps]).filter(p=>CoastVegetation.allow(data,p));
const clearProvisionalScenery=data.countryId==='red'?terrain.addScenery([...initialLivingProps,...initialCountryProps]):null;
const lava=CountryLava.create(data,nav,terrain);
clearProvisionalScenery?.();
const propPlacement=CountryProps.placement(data,nav,terrain,lava);
terrain.removeTrees(tree=>lava.crowdsPool(tree)||propPlacement.overBridge(tree,tree.w*(tree.shrub?.84:1.06),tree.w*.18));
const placedProps=propPlacement.relocate([...initialCountryProps,...initialLivingProps],sceneryExclusions);
const countryProps=placedProps.filter(prop=>prop.kind==='countryProp');
const livingProps=placedProps.filter(prop=>prop.kind==='livingProp'&&CoastVegetation.allow(data,prop));
terrain.addScenery([...countryProps,...livingProps]);
const daylight=CountryDaylight.create(data.countryId),bridgeRails=CountryBridgeRails.create(data.countryId);
const nightEffects=CountryNight.create(data,terrain.water.raw);
const roadLamps=CountryRoadLamps.create(data,nav,terrain,[...livingProps,...countryProps,...questNpcs,...treasures.chests,...trees,...lava.pools.map(o=>({...o,clearance:o.radius+36}))]);
function shoreFootprint({x,y},halfWidth,back,front){
 return {x,y,halfWidth,back,front};
}
const shoreObstacles=[
 ...terrain.water.accessPoints.map(o=>shoreFootprint(o,90,80,80)),
 ...roadLamps.poles.map(o=>shoreFootprint(o,26,22,8)),
 ...trees.map(o=>shoreFootprint(o,o.w*.18,o.w*.13,o.w*.06)),
 ...[...livingProps,...countryProps].map(o=>shoreFootprint(o,o.w*.34,o.w*.24,o.w*.10)),
 ...treasures.chests.map(o=>shoreFootprint(o,36,29,12)),
 ...questNpcs.map(o=>shoreFootprint(o,18,20,8)),
 ...nav.places.map(o=>{
  const width=({islandPort:190,colosseum:390,dungeon:420,border:540})[o.type]??placeWidth(o);
  return shoreFootprint(o,width*.38,width*.22,width*.08);
 })
];
const edgeRocks=CountryEdgeRocks.create(data,nav,terrain,shoreObstacles);
const countryTreeArt=variant=>'country-tree:'+data.countryId+'-tree-'+variant;
const plantingObstacles=[...shoreObstacles,
 ...lava.pools.map(pool=>shoreFootprint(pool,pool.radius+16,pool.radius+16,pool.radius+16)),
 ...lava.cracks.map(crack=>shoreFootprint(crack,crack.length*.53,crack.length*.34,crack.length*.34))];
const offBridge=plant=>!propPlacement.overBridge(plant,plant.w*.65,plant.w*.12);
const grassClumps=CountryGrassClumps.create(data,nav,terrain,plantingObstacles).filter(offBridge).filter(p=>CoastVegetation.allow(data,p));
const meadowDetails=CountryMeadowDetails.create(data,nav,terrain,grassClumps,plantingObstacles).filter(offBridge).filter(p=>CoastVegetation.allow(data,p));
const sceneryObjects=[...meadowDetails,...grassClumps,...edgeRocks,...roadLamps.poles,...livingProps,...countryProps,...treasures.chests,...mountains,...terrain.water.rails,...trees,...nav.places];for(const tree of trees){if(tree.beachPalm){tree.kind='beachPalm';tree.art='beachPalmAtlas';}else if(tree.shrub){tree.kind='shrub';tree.art='shrub'+tree.shrub;}else{tree.kind='tree';tree.key=countryTreeArt(tree.variant||1);tree.anchor=.89;}}for(const place of nav.places)place.kind='place';for(const a of bandits.actors)a.kind='bandit';for(const a of roamers.actors)a.kind='shadow';p.kind='player';
let sceneryIndex,groundTiles;const drawObjects=[],miniBase=document.createElement('canvas');miniBase.width=miniBase.height=data.regionLayout?360:180;const miniDue=CountryRenderBudget.cadence(touchDisplay?.2:.1),diagnosticsDue=CountryRenderBudget.cadence(.25),nearbyPlaces=[...data.cities,...data.villages];
function objectBounds(o){if(o.kind==='beachPalm')return CoastVegetation.bounds(o);if(data.regionLayout&&o.kind==="place"&&o.type==="border"){const b=RegionGateGeometry.bounds(o);return {left:b.left-100,right:b.right+100,top:b.top-100,bottom:b.bottom+100};}if(o.kind==='roadLamp')return roadLamps.bounds(o);const width=o.kind==='place'?(o.type==='capital'?490:o.type==='city'?375:o.type==='village'?235:o.type==='border'?540:o.type==='dungeon'?420:o.type==='colosseum'?390:310):o.w||100,im=o.kind==='tree'||o.kind==='livingProp'?LivingEnvironment.load(o.key):images[o.art|| (o.kind==='place'?(o.type==='forest'?'forest':o.type==='village'?'village':'city')+o.art:o.border&&data.countryId!=='blue'?'cliff':'mountain')],height=im?.naturalWidth?width*im.naturalHeight/im.naturalWidth:width*2;return {left:o.x-width/2-100,right:o.x+width/2+100,top:o.y*F-height-100,bottom:o.y*F+100}}
function makeMiniBase(){const ctx=miniBase.getContext('2d'),miniZoom=data.regionLayout?2:1;ctx.setTransform(miniBase.width/180,0,0,miniBase.height/180,0,0);ctx.drawImage(ground,0,0,180,180);ctx.strokeStyle='#a78b68';ctx.lineWidth=1.5/miniZoom;for(const bridge of terrain.water.bridges){ctx.beginPath();ctx.moveTo(bridge.a.x/data.width*180,bridge.a.y/data.height*180);ctx.lineTo(bridge.b.x/data.width*180,bridge.b.y/data.height*180);ctx.stroke();}for(const s of nav.places.filter(s=>s.type!=='junction'))WalkMapSymbols.draw(ctx,s.type==='forest'?'forest':s.type==='border'?'gate':['dungeon','colosseum'].includes(s.type)?'dungeon':'house',s.x/data.width*180,s.y/data.height*180,(s.type==='village'?8:12)/miniZoom,s.type==='forest'?'#89d69c':'#f4d593');for(const n of questNpcs)WalkMapSymbols.draw(ctx,'person',n.x/data.width*180,n.y/data.height*180,10/miniZoom,'#ffe79b')}
function drawGrassClump(clump,zoom,shadows){
  CountryGrassClumps.draw(c,images[clump.art],clump,sx(clump.x),sy(clump.y),zoom,p,grassDisplacement,t,F,shadows,W,H);
 }
 function drawShoreRocks(objects,shadows,zoom,hasBridgeShadow){
  const rocks=[];
  for(const rock of objects){
   if(rock.kind!=='edgeRock')continue;
   const image=images[rock.art];
   if(!image?.naturalWidth)continue;
   const x=sx(rock.x),y=sy(rock.y),width=rock.w*zoom,height=width*image.naturalHeight/image.naturalWidth;
   if(x+width/2<0||x-width/2>W||y+height/2<0||y-height/2>H)continue;
   rocks.push({image,x,y,width,height});
  }
  if(!rocks.length&&!hasBridgeShadow)return;
  rocks.sort((a,b)=>a.y-b.y);
  for(const {image,x,y,width,height} of rocks)shadows.cast(c,x,y,0,image,x-width/2,y-height/2,width,height);
  shadows.paintMask(c);
  for(const {image,x,y,width,height} of rocks)c.drawImage(image,x-width/2,y-height/2,width,height);
 }
 const environmentKeys=['ground-'+data.countryId,...(data.countryId==='red'?['ground-lava']:[]),...livingProps.map(o=>o.key),...Array.from({length:5},(_,i)=>countryTreeArt(i+1))];
let staticSceneryReported=false;
function draw(light){LivingEnvironment.viewport(c,W,H);if(diagnosticsDue(t)){if(!staticSceneryReported){canvas.dataset.propCount=countryProps.length;canvas.dataset.roadLampCount=roadLamps.poles.length;canvas.dataset.bridgeLampCount=roadLamps.poles.filter(o=>o.bridgeId).length;canvas.dataset.environmentProps=livingProps.length;canvas.dataset.treeVariants=5;canvas.dataset.beachPalmCount=trees.filter(o=>o.beachPalm).length;canvas.dataset.nonPalmBeachPlants=trees.filter(o=>!o.beachPalm&&CoastVegetation.beach(data,o,o.w*.25)).length+livingProps.filter(o=>!CoastVegetation.allow(data,o)).length+grassClumps.filter(o=>!CoastVegetation.allow(data,o)).length+meadowDetails.filter(o=>!CoastVegetation.allow(data,o)).length;canvas.dataset.treeCount=trees.length;canvas.dataset.mountainCount=mountains.length;canvas.dataset.edgeRockCount=edgeRocks.length;canvas.dataset.treeWidth=data.treeWidth?.join(',')||'';canvas.dataset.backdropMountains=String(RegionBackdrop.plan(data).length);canvas.dataset.backdropTheme=data.countryId;canvas.dataset.backdropCached='true';canvas.dataset.groundPixels=String(Math.ceil(data.width/2)*Math.ceil(data.height*F/2));canvas.dataset.questNpcCount=questNpcs.length;staticSceneryReported=true;}canvas.dataset.dayPhase=light.phase;canvas.dataset.peerCount=window.walkPresence.peers.size;canvas.dataset.country=data.countryId;canvas.dataset.borderCount=borderGates.length;canvas.dataset.arrival=arrivalGate?.id||'';canvas.dataset.weather=data.countryId==='green'?(window.countryWeather.butterfliesActive(light)?'butterflies':'none'):data.countryId==='red'?'ash':'snow';canvas.dataset.chestCount=treasures.chests.length;canvas.dataset.riverCount=terrain.water.rivers.length;canvas.dataset.lakeCount=terrain.water.lakes.length;canvas.dataset.bridgeCount=terrain.water.bridges.length;canvas.dataset.villageCount=data.villages.length;canvas.dataset.destinationCount=nav.places.length;canvas.dataset.returning=threats.entries.filter(e=>e.actor.returning).length;canvas.dataset.chaseLeash=String(WorldPursuit.leash(W,H,zoom(),1));canvas.dataset.chasing=threats.entries.filter(e=>e.actor.chasing).length;canvas.dataset.inBattle=!!activeEncounter;const waterState=WaterInteraction.state(data,terrain.water,p);canvas.dataset.waterDepth=(waterState?.depth||0).toFixed(3);canvas.dataset.bridgeLayer=p.bridgeDeck?'deck':terrain.water.underBridge(p)?'underpass':'ground';canvas.dataset.shrubSpeedFactor=terrain.shrubSpeedFactor(p.x,p.y);canvas.dataset.waterSpeedFactor=WaterInteraction.speedFactor(waterState);canvas.dataset.waterBody=waterState?.type||'';canvas.dataset.waterBeastCount=waterBeasts.actors.length;canvas.dataset.riverWidth=terrain.water.rivers[0]?.width||0;canvas.dataset.lakeAreaScale=data.lakeAreaScale||1;canvas.dataset.banditCount=bandits.actors.length;canvas.dataset.banditMinRoad=Math.min(...bandits.actors.map(a=>nav.nearest(a).distance));canvas.dataset.banditAggro=bandits.actors[0]?.aggroRadius||400;canvas.dataset.mountainWaterEffects=0;canvas.dataset.mountainArt=files.mountain;canvas.dataset.banditsMoving=bandits.actors.filter(a=>a.moving).length;canvas.dataset.banditSample=JSON.stringify(bandits.actors.map(a=>[Math.round(a.x),Math.round(a.y)]));canvas.dataset.shadowCount=roamers.actors.length;canvas.dataset.shadowsMoving=roamers.actors.filter(a=>a.moving).length;canvas.dataset.shadowSample=JSON.stringify(roamers.actors.slice(0,4).map(a=>[Math.round(a.x),Math.round(a.y)]));canvas.dataset.surface=waterState?'water':terrain.water.onBridge(p.x,p.y)?'bridge':nav.nearest(p).distance>104?(data.countryId==='green'?'grass':data.countryId==='red'?'red-earth':'snow'):'road';canvas.dataset.x=p.x.toFixed(1);canvas.dataset.y=p.y.toFixed(1);canvas.dataset.location=near?.id||'';canvas.dataset.moving=moving;canvas.dataset.running=running;canvas.dataset.overview=overview;canvas.dataset.destination=travel?.id||'';}document.body.classList.toggle('overview',overview);$('closeOverview').hidden=!overview;c.clearRect(0,0,W,H);c.fillStyle=coast.active?RegionCoast.SEA:'#8aaaba';c.fillRect(0,0,W,H);if(data.regionLayout)RegionBackdrop.paintViewport(c,data,images,sx,sy,zoom(),W,H);groundTiles.draw(c,{left:(overview?data.width/2:cam.x)-W/2/zoom(),right:(overview?data.width/2:cam.x)+W/2/zoom(),top:(overview?data.height/2:cam.y)*F-H*(overview?.53:.57)/zoom(),bottom:(overview?data.height/2:cam.y)*F+H*(overview?.47:.43)/zoom()},sx,sy,zoom(),F);
 canvas.dataset.oceanExtensionBands=String(coast.paintExtension(c,sx,sy,zoom(),W,H));
 canvas.dataset.seaWaveFronts=String(coast.draw(c,sx,sy,zoom(),t,{width:W,height:H,effects:graphics.effects,overview}));
 if(!overview&&graphics.effects){
  terrain.water.drawFlow(c,sx,sy,zoom(),t,images.water,{width:W,height:H,nightEffects:light.night>.005},graphics.effects===1,archedBridges.hasModel);
  lava.drawGroundHeat(c,sx,sy,zoom(),t,graphics.effects===1,W,H,images);
 }
 const q=zoom(),rect={left:(overview?data.width/2:cam.x)-(W/2+100)/q,right:(overview?data.width/2:cam.x)+(W/2+100)/q,top:(overview?data.height/2:cam.y)*F-(H*(overview?.53:.57)+100)/q,bottom:(overview?data.height/2:cam.y)*F+(H*(overview?.47:.43)+100)/q};sceneryIndex.query(rect,drawObjects);
 const shadows=overview?null:groundShadows;
 const foreground=shadows?.begin(F,light.night,roadLamps.poles,sx,sy,q);
 if(shadows){
  const bridgeShadow=archedBridges.castShadows(shadows,sx,sy,q,W,H);
  drawShoreRocks(drawObjects,shadows,q,bridgeShadow);
 }
 c.save();
 c.translate(sx(0),sy(0));c.scale(q,q);
 terrain.water.drawDeck(c,images,archedBridges.hasModel,b=>overview||terrain.water.underBridge(p)?.id!==b.id);
 c.restore();
 const underpass=overview?null:terrain.water.underBridge(p),bridgeOpacity=b=>underpass?.id===b.id ? .28 : 1;
 const bridgeRailsVisible=archedBridges.drawDecks(c,sx,sy,q,W,H,overview,bridgeOpacity,p.y);
 if(underpass&&!archedBridges.hasModel(underpass))bridgeRailsVisible.push({kind:'underpassDeck',crossing:underpass,x:underpass.x,y:p.y+.1});
 if(travel){c.save();c.strokeStyle='#477fa9';c.lineWidth=overview?2:5;c.setLineDash([5,8]);c.beginPath();c.moveTo(sx(p.x),sy(p.y));for(const o of travel.path)c.lineTo(sx(o.x),sy(o.y));c.stroke();c.restore()}
 drawObjects.push(...bridgeRailsVisible);if(!overview&&graphics.effects)for(const o of drawObjects)if(o.kind==='roadLamp')roadLamps.drawGround(c,o,sx,sy,q,t,graphics.effects,light.night);for(const a of bandits.actors)if(!a.cooldown&&sx(a.x)>-150&&sx(a.x)<W+150&&sy(a.y)>-30&&sy(a.y)<H+200)drawObjects.push(a);for(const a of roamers.actors)if(!a.cooldown&&sx(a.x)>-150&&sx(a.x)<W+150&&sy(a.y)>-30&&sy(a.y)<H+200)drawObjects.push(a);drawObjects.push(...waterBeasts.actors.filter(a=>a.cooldown<=0||!a.cooldown));drawObjects.push(p);if(!overview)drawObjects.push(...questNpcs,...window.walkPresence.objects());drawObjects.sort((a,b)=>a.y-b.y);
 if(foreground){c=foreground;LivingEnvironment.viewport(c,W,H);}
 for(const o of drawObjects){if(o.kind==='edgeRock')continue;if(o.kind==='roadLamp'){if(!overview)roadLamps.draw(c,o,sx(o.x),sy(o.y),q,t,graphics.effects,light.night,shadows);}else if(o.kind==='livingProp')LivingEnvironment.draw(c,o,sx(o.x),sy(o.y),q,t,p,shadows);else if(o.kind==='grassClump'){if(!overview)drawGrassClump(o,q,shadows);}else if(o.kind==='wildflower'||o.kind==='shrub'||o.kind==='directionSign'){if(!overview)art(images[o.art],sx(o.x),sy(o.y),o.w,o.kind==='wildflower'?.78:o.kind==='shrub'?.84:.91);}else if(o.kind==='countryProp')art(images[o.art],sx(o.x),sy(o.y),o.w,.94,Math.abs(p.x-o.x)<100&&p.y<o.y&&o.y-p.y<300?.45:1);else if(o.kind==='chest')treasureChest(o);else if(o.kind==='archedBridgeRail'){c.save();c.globalAlpha=o.alpha??1;c.drawImage(o.rail,o.left,o.top,o.w,o.h);c.restore();}else if(o.kind==='underpassDeck'){c.save();c.globalAlpha=.28;c.translate(sx(0),sy(0));c.scale(q,q);terrain.water.drawDeck(c,images,()=>false,b=>b===o.crossing);c.restore();}else if(o.kind==='bridgeRail'){c.save();c.globalAlpha=bridgeOpacity(o.crossing);if(!overview&&!bridgeRails.draw(c,o,sx,sy,q,shadows))terrain.water.drawRail(c,o,sx,sy,q);c.restore();}else if(o.kind==='waterBeast')waterBeast(o);else if(o.kind==='bandit')forestBandit(o);else if(o.kind==='shadow')shadowBeast(o);else if(o.kind==='place')place(o);else if(o.type==='questNpc')questNpcSprite(o,q);else if(o.kind==='player')player();else if(o.kind==='presenceCompanion'||o.kind==='presencePlayer')window.walkPresence.drawObject(c,o,sx,y=>walkY(o.x,y),q,shadows);else if(o.kind==='beachPalm'){if(!overview)CoastVegetation.draw(spriteContext(sx(o.x),sy(o.y)),o,images.beachPalmAtlas,sx(o.x),sy(o.y),q);}else if(o.kind==='tree'){if(!LivingEnvironment.draw(c,o,sx(o.x),sy(o.y),q,t,p,shadows))art(images.pine,sx(o.x),sy(o.y),o.w)}else {
  const im=images[o.border&&data.countryId!=='blue'?'cliff':'mountain'];
  const x=sx(o.x),y=sy(o.y);
  art(im,x,y,o.w);

  if(!overview&&graphics.effects&&data.countryId==='red'&&!o.border&&o.kind==='mountain'){
   const width=o.w*q;
   lava.drawVolcanoHeat(c,x,y,width,width*im.height/im.width,t,graphics.effects===1,W,H,o);
  }
 }}
 window.walkKingdomBoss?.draw(c,sx,(y,x)=>walkY(x,y),zoom(),overview,t,shadows);
 if(shadows){
  c=surface;
  shadows.finish(c);
 }
 canvas.dataset.visibleScenery=drawObjects.length;
 if(overview&&!data.regionLayout){label(data.countryId==='blue'?'แนวเทือกเขาเหมันต์':data.countryId==='green'?'ขุนเขาพนาสมุทร':'แนวภูเขาไฟอัคนี',sx(950),sy(650),'#517384');label(data.countryId==='blue'?'ทะเลสาบเหมันต์':data.countryId==='green'?'ทะเลสาบพนาสมุทร':'อ่าวอัคนี',sx(2750),sy(4800),'#517384')}
 if(!overview&&graphics.effects)window.countryWeather.draw(c,W,H,t,data.countryId,graphics.effects===1,light);
 if(miniDue(t)){const miniView=CountryRegions.minimapView(data,p);canvas.dataset.minimapZoom=String(miniView.zoom);mini.clearRect(0,0,180,180);mini.save();mini.translate(-miniView.left*miniView.zoom,-miniView.top*miniView.zoom);mini.scale(miniView.zoom,miniView.zoom);mini.drawImage(miniBase,0,0,180,180);const questMarkers=[];
 const markQuest=(a,style)=>{if(style)questMarkers.push({a,style});};
 const target=(a,probe)=>markQuest(a,window.townQuests.targetStyle({...probe,country:data.countryId}));
 if(trackedGate)markQuest(trackedGate,'tracked');
 for(const a of nav.places)target(a,{type:'place',place:a.id,zone:a.zoneId});
 for(const a of questNpcs)markQuest(a,window.townQuests.markerStyle(a.place.split(':').pop(),a.place));
 for(const [actors,kind] of [[roamers.actors,'shadow'],[bandits.actors,'bandit']]){
  for(const a of actors)if(!a.cooldown)target(a,{type:'enemy',kind,place:questNearbyPlace(a)});
 }
 for(const a of treasures.chests)target(a,{type:'chest',place:questNearbyPlace(a),opened:treasures.state(a)==='opened'});
 for(const style of ['active','tracked'])for(const marker of questMarkers)if(marker.style===style){
  const {x,y}=marker.a;window.townQuests.drawTarget(mini,x/data.width*180,y/data.height*180,.28/miniView.zoom,style);
 }
 for(const peer of window.walkPresence.peers.values())WalkMapSymbols.draw(mini,'person',peer.x/data.width*180,peer.y/data.height*180,13/miniView.zoom,'#9ddfff');WalkMapSymbols.draw(mini,'person',p.x/data.width*180,p.y/data.height*180,16/miniView.zoom,'#75e9ff');if(islandPort)ellipse(mini,islandPort.x/data.width*180,islandPort.y/data.height*180,3/miniView.zoom,3/miniView.zoom,'#ffe593');window.walkKingdomBoss?.drawMinimap(mini,data.width,data.height);mini.restore();}
}
const bossCoordinates=RegionalOnlineCoordinates.create(data,({...window.walkCountries,blue:window.hemantBlueMap})[data.countryId],nav);window.kingdomBossWalkScene={...bossCoordinates,country:data.countryId,overview:()=>overview,canMove:()=>!menu&&!overview&&!window.walkAnnouncementBusy()&&!document.documentElement.hasAttribute('data-event-announcement-open')&&!$('townDialog').open&&!fusion.isOpen&&!window.walkSocial.isOpen&&!window.walkAtlas.isOpen(),openMap:()=>{reset();stopTravel();overview=true;},pause:()=>{menu=true;reset();stopTravel();},resume:()=>{menu=false;reset();syncAvatar();},refresh:syncAvatar};window.walkAnnouncementBusy=()=>WalkTutorial.active()||overview||!!window.WalkControls?.editing;function reset(){keys.clear();joy.x=joy.y=0;joy.id=null;running=moving=false;$('stick').style.transform='translate(0,0)'}
function stopTravel(){travel=null;$('travel').hidden=true}
const showShadowLesson=WalkTutorial.watchShadowSight({
 actors:()=>roamers.actors,
 visible:actor=>!actor.cooldown&&sx(actor.x)>=0&&sx(actor.x)<W&&sy(actor.y)-50*zoom()>=0&&sy(actor.y)-50*zoom()<H,
 read:window.townQuests.read,
 stop:()=>{reset();stopTravel()},
});
let nextBanditLessonCheck=0;
function showVisibleBanditLesson(){
 const now=performance.now();
 if(now<nextBanditLessonCheck)return false;
 nextBanditLessonCheck=now+350;
 const visible=bandits.actors.some(actor=>{
  if(actor.cooldown||data.regionLayout&&nav.distance(p,actor)>(actor.aggroRadius||180))return false;
  const x=sx(actor.x),y=sy(actor.y)-50*zoom();
  return x>=0&&x<W&&y>=0&&y<H;
 });
 if(!visible||!WalkTutorial.onBanditSight(window.townQuests.read()))return false;
 nextBanditLessonCheck=now+15000;
 reset();
 stopTravel();
 return true;
}
function update(dt){if(WalkTutorial.active()||document.documentElement.hasAttribute('data-event-announcement-open'))return;if(window.WalkControls?.editing||menu||overview||$('townDialog').open||fusion.isOpen||window.walkSocial.isOpen||window.walkAtlas.isOpen())return;if(data.regionLayout){const regionalCrossing=borderGates.find(g=>nav.distance(p,g)<55);if(regionalCrossing){crossBorder(regionalCrossing);return}}waterBeasts.update(dt);if(!packlordPreview){const crossing=borderGates.find(g=>nav.distance(p,g)<55);if(crossing){crossBorder(crossing);return}if(showVisibleBanditLesson()||showShadowLesson())return;const contact=threats.update(dt,p,{repellent:window.walkRepellentActive?.()});if(contact){openEncounter(contact);return}}roamers.update(dt,p);bandits.update(dt,p);let x=joy.x,y=joy.y;if(keys.has('w')||keys.has('arrowup'))y--;if(keys.has('s')||keys.has('arrowdown'))y++;if(keys.has('a')||keys.has('arrowleft'))x--;if(keys.has('d')||keys.has('arrowright'))x++;const manual=Math.hypot(x,y)>.12;if(manual&&travel)stopTravel();let auto=false;
 if(travel){while(travel.path.length&&nav.distance(p,travel.path[0])<7)travel.path.shift();if(!travel.path.length){stopTravel()}else{const goal=travel.path[0];x=goal.x-p.x;y=(goal.y-p.y)*F;auto=true}}
 const len=Math.hypot(x,y),tilt=Math.min(1,Math.hypot(joy.x,joy.y)),keyboard=['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].some(k=>keys.has(k));moving=len>.12;running=moving&&(auto||keys.has('shift')||tilt>(running ? .62 : .72));if(moving){p.spriteDir=sealerSprites.heading(x,y);p.dir=(Math.round(-Math.atan2(x,y)/(Math.PI/4))+8)%8;const surfaceSpeed=Math.min(WaterInteraction.speedFactor(WaterInteraction.state(data,terrain.water,p)),terrain.shrubSpeedFactor(p.x,p.y));let speed=.68425*(auto?360:keyboard?(running?360:220):220*Math.min(1,tilt/.72)+140*Math.max(0,(tilt-.72)/.28)),step=Math.min((packlordPreview?speed:fusion.speed(speed,auto||keyboard?1:tilt/.72))*surfaceSpeed*dt,auto?len:Infinity),nx=p.x+x/len*step,ny=p.y+y/len*step/F;nav.playerMove(p,{x:nx,y:p.y});nav.playerMove(p,{x:p.x,y:ny});phase+=dt*(speed/220)*surfaceSpeed*13}
 const cameraBlend=1-Math.exp(-dt*7);cam.x+=(p.x-cam.x)*cameraBlend;cam.y+=(p.y-cam.y)*cameraBlend;const previousNear=near;near=questNpcs.find(n=>nav.distance(p,n)<125)||treasures.chests.find(s=>nav.distance(p,s)<125)||nav.places.filter(s=>s.type!=='junction'&&nav.distance(p,s)<190).sort((a,b)=>nav.distance(p,a)-nav.distance(p,b))[0];if(near?.type==='questNpc'&&near!==previousNear)WalkIdleArt.greetNpc(near,t);const prompt=near?.type==='questNpc'?'◇ สนทนาและรับเควส':near?.kind==='chest'?'◇ เปิดหีบสมบัติ':near?.type==='border'?(near.regional?'◇ เดินทางข้ามภาค':'◇ ข้ามประเทศ'):near?.type==='islandPort'?'⚓ ท่าเรือ':'◇ สำรวจทางเข้า';
 const locationName=near?.name||'';
 const area=locationName||(data.countryId==='blue'?'ถนนหิมะ':data.countryId==='green'?'เส้นทางพงไพร':'เส้นทางดินแดง')+' · '+data.country;
 if($('interact').textContent!==prompt)$('interact').textContent=prompt;
 if($('nearby').hidden!==!near)$('nearby').hidden=!near;
 if($('nearbyName').textContent!==locationName)$('nearbyName').textContent=locationName;
 if($('interact').disabled!==!near)$('interact').disabled=!near;
 if($('area').textContent!==area)$('area').textContent=area;
}
function button(text,action){const b=document.createElement('button');b.textContent=text;b.onclick=action;$('dialogChoices').append(b);return b}
function dialog(title,text){$('islandFerryPreview')?.remove();window.NpcDialogue.clear($('townDialog'));$('townDialog').classList.remove('places-list');reset();$('dialogTitle').textContent=title;$('dialogText').textContent=text;$('dialogChoices').replaceChildren();$('forestEntranceArt')?.remove();if(!$('townDialog').open)$('townDialog').showModal()}
function navigate(s){stopTravel();const path=data.regionLayout&&nav.byId.has(s.id)?nav.playerRoute(p,s.id):s.type==='dungeon'?nav.pathBetween(p,s):['islandPort','colosseum'].includes(s.type)?[...nav.route(p,s.anchor),...nav.pathBetween(nav.byId.get(s.anchor),s)]:s.type==='questNpc'?[...nav.route(p,s.anchor),...nav.pathBetween(data.cities.find(c=>c.id===s.anchor),s)]:nav.route(p,s.id);if(!path.length){dialog('ยังหาทางกลับถนนไม่ได้','ลองเดินอ้อมสิ่งกีดขวางออกมาเล็กน้อย แล้วเลือกจุดหมายอีกครั้ง');return}travel={id:s.id,path};overview=false;$('travel').hidden=false;$('travelName').textContent='กำลังเดินไป '+s.name;$('townDialog').close();reset()}
function openCountryMenu(screen,quickItem=''){if(screen==='quests'){reset();stopTravel();window.townQuests.show(true);return}if(!['mail','hero','team','bag','friends','settings','coupon'].includes(screen))return;reset();stopTravel();menu=true;const f=document.createElement('iframe');f.id='regionMenu';f.title=quickItem==='teleportScroll'?'แผนที่เทเลพอร์ต':'เมนูผู้ผนึก';f.src=screen==='coupon'?'../town-walk-demo/coupon.html?v=referral-1':'../town-walk-demo/menu.html?v=beasts-3d-six-20261121&walkScene=country&screen='+screen+'&city='+data.countryId+'-capital'+(quickItem?'&quickItem='+encodeURIComponent(quickItem):'');f.style='position:fixed;inset:0;width:100%;height:100%;border:0;z-index:10000;background:#122b40';document.body.append(f)}
addEventListener('message',e=>{if(e.origin!==location.origin||![$('hudTop')?.contentWindow,$('hudBottom')?.contentWindow].includes(e.source)||e.data?.type!=='walk-menu'||menu)return;openCountryMenu(e.data.screen)});
addEventListener('country-quick-teleport',()=>{if(menu||$('townDialog').open||overview)return;openCountryMenu('bag','teleportScroll')});
function openEncounter(entry){activeEncounter=entry;reset();stopTravel();menu=true;const f=document.createElement('iframe');f.id='regionMenu';f.title=entry.kind==='bandit'?'ต่อสู้กับโจรป่า':entry.kind==='water'?'ต่อสู้กับอสูรน้ำ':'ต่อสู้กับอสูร';f.src='../town-walk-demo/menu.html?v=country-result-return-1&encounter='+(entry.kind==='water'?'shadow':entry.kind)+(entry.kind==='water'?'&habitat=water':'')+'&beastPlan='+encodeURIComponent(['shadow','water'].includes(entry.kind)?LivingBeasts.remember(entry.actor,{scene:'country',country:data.countryId}):'')+'&banditPlan='+encodeURIComponent(entry.kind==='bandit'?CountryBanditActors.remember(entry.actor,{country:data.countryId}):'')+'&encounterAt='+Date.now()+'&country='+data.countryId+'&city='+data.countryId+'-capital';f.style='position:fixed;inset:0;width:100%;height:100%;border:0;z-index:10000;background:#122b40';document.body.append(f)}
function openWar(s){if(nav.distance(p,s)>=190)return;const visit=window.walkWar.beginVisit('country-approach',s.id);$('townDialog').close();reset();stopTravel();menu=true;const f=document.createElement('iframe');f.id='regionMenu';f.allow='autoplay';f.title='สงครามอาณาจักร';f.src='../town-walk-demo/menu.html?v=beasts-3d-six-20261121&screen=countrywar&city='+data.countryId+'-capital&target='+encodeURIComponent(s.id)+'&visit='+encodeURIComponent(visit);f.style='position:fixed;inset:0;width:100%;height:100%;border:0;z-index:10000;background:#122b40';const audio=WalkAudio.settings();const enter=()=>{f.src+='&warIntroPlayed=1';document.body.append(f)};if(window.SoulbeastCinematics?.playCountryWar({muted:!audio.enabled,volume:audio.volume,onFinish:enter}))return;document.body.append(f)}
function openForest(s){if(forestLocked(s))return;$('townDialog').close();reset();stopTravel();menu=true;const f=document.createElement('iframe');f.id='regionMenu';f.allow='autoplay';f.title='ด่าน '+s.name;f.src='../town-walk-demo/menu.html?v=beasts-3d-six-20261121&screen=wild&zone='+s.zoneId+'&city='+data.countryId+'-capital';f.style='position:fixed;inset:0;width:100%;height:100%;border:0;z-index:10000;background:#122b40';document.body.append(f)}
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
 if(s.type==='border'&&data.regionLayout){dialog(s.name,s.description);if(nav.distance(p,s)<190)button(s.regional?'เดินทางข้ามภาค':'ข้ามประเทศ',()=>crossBorder(s));else button('นำทางไปประตู',()=>navigate(s));return;}
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
 if(s.type==='dungeon'){dialog(s.name,s.description);if(nav.distance(p,s)<190)button('เข้าหน้าเตรียมทีมดันเจี้ยน',()=>location.href='../labyrinth-demo/lobby.html');else button('นำทางไปปากถ้ำ',()=>navigate(s));return}const close=nav.distance(p,s)<190;dialog(s.name,s.type==='forest'?'ด่านเนื้อเรื่อง '+s.chapter+' · Lv '+s.levels.join('–')+'\n'+s.description+'\nทางเข้าด่านคงเนื้อเรื่องเดิม · พื้นที่ประเทศ '+data.country+'':s.description);if(s.type==='questNpc')window.NpcDialogue.set($('townDialog'),s.place.split(':').pop(),s.place,s.name);if(s.type==='forest'){
 const entry=close?(forestLocked(s)?button('ชนะบอสในดินแดนก่อนหน้าเพื่อปลดล็อก',null):button('เข้าสู่ด่าน '+s.name,()=>openForest(s))):null;
 if(entry&&!entry.onclick)entry.disabled=true;
 window.ForestEntrance.show($('townDialog'),s.zoneId,window.townQuests.read(),entry);
 $('dialogText').textContent+='\nคำเตือน: เมื่อเข้าป่าแล้วจะออกไม่ได้จนกว่าจะชนะบอสหรือพ่ายแพ้';
 if(!close)button('นำทางไปที่นี่ · เดินตามถนน',()=>navigate(s));
 return;
}if(!close)button('นำทางไปที่นี่ · เดินตามถนน',()=>navigate(s));else if(s.type==='questNpc')button('สนทนาและรับเควส',()=>{near=s;interact()});else if(s.type==='capital'||s.type==='city'||s.type==='village'){if(!window.walkWar.canEnter(s.id)){const nation=window.walkWar.playerCountry(),req=window.walkWar.requirement(s.id);$('dialogText').textContent+='\nยังเข้าไม่ได้: ต้องเป็นฐานของประเทศคุณก่อน'+(req.connected===false?'\nยังไม่ติดแนวเขตที่ประเทศเราครอบครอง':'')+(req.required?'\nต้องยึด'+(s.type==='capital'?'เมือง':'หมู่บ้าน')+'ที่เชื่อมอยู่ '+req.held+'/4 (ต้องอย่างน้อย 2/4)':'');button(nation?'โจมตี'+s.name:'เลือกประเทศและดูสงครามอาณาจักร',()=>openWar(s));return}const a=document.createElement('a');a.href=window.townProfiles.entryURL(s.id);a.textContent=s.type==='capital'?'เข้าเมืองหลวง':s.type==='village'?'เข้าหมู่บ้าน'+s.name:'เข้าเมือง'+s.name;$('dialogChoices').append(a)}else if(s.type==='border')button('ผ่านประตูไปประเทศ'+s.targetName,()=>crossBorder(s));else button('เดินทางต่อ · ดูจุดหมายอื่น',showPlaces)}
function showPlaces(){dialog(data.regionLayout?data.country+' · '+data.regionName:'เมือง หมู่บ้าน และด่านเนื้อเรื่อง',data.regionLayout?'เมือง '+data.cities.length+' · หมู่บ้าน '+data.villages.length+' · สถานที่สำคัญ '+(data.forests.length+data.regionPlaces.filter(p=>p.type!=='junction').length)+' · เลือกจุดหมายเพื่อนำทาง':'เมืองหลวง 1 · เมืองรอง 4 · หมู่บ้าน 16 · ทางเข้าป่า '+data.forests.length+' · เลือกจุดหมายเพื่อดูรายละเอียดหรือนำทาง');button((data.regionLayout?'ประตูเชื่อมภาค / ประเทศ · ':'ประตูเชื่อมประเทศ · ')+borderGates.length+' จุด',()=>{dialog('ประตูเชื่อมสามอาณาจักร','เดินตามถนนไปยังประตู แล้วเดินผ่านเพื่อข้ามไปอีกประเทศ');for(const gate of borderGates)button(gate.name,()=>showPlace(gate))});$('townDialog').classList.add('places-list');for(const n of questNpcs)button(n.name+' '+window.townQuests.marker(n.place.split(':').pop(),n.place),()=>showPlace(n));for(const s of nav.places.filter(p=>p.type!=='junction')){const b=document.createElement('button');b.className='place-row';const title=document.createElement('span'),sub=document.createElement('small');title.textContent=s.type==='forest'?s.chapter+'. '+s.name:s.type==='village'?s.number+'. หมู่บ้าน'+s.name:s.name;sub.textContent=s.type==='capital'?'เมืองหลวง':s.type==='city'?'เมืองรอง':s.type==='village'?'หมู่บ้าน':s.type==='border'?'ประตูเชื่อมประเทศ':s.type==='dungeon'?'ดันเจี้ยน 7 ชั้น':s.type==='colosseum'?'สนามประลอง':s.type==='islandPort'?'เรือไป'+IslandRules.islands[data.countryId].name:'Lv '+s.levels.join('–');b.append(title,sub);b.onclick=()=>showPlace(s);$('dialogChoices').append(b)}}
function questNearbyPlace(position=p){if(position.questPlace)return position.questPlace;let site=null,best=800;for(const candidate of nearbyPlaces){const d=nav.distance(position,candidate);if(d<best){site=candidate;best=d}}return site?.id||null}
function interact(){if(packlordPreview)return;if(window.walkSocial.talkNear(p))return;if(!near||menu)return;if(near.type==='questNpc'){const n=near,target=n.place.split(':').pop();window.townQuests.emit('talk',{place:n.place,target,country:data.countryId});window.townQuests.show(false,target,n.place);return}if(near.kind==='chest'){const chest=near,status=treasures.state(chest);if(status==='guarded'){dialog('หีบสมบัติโจรป่า','โจรป่ากำลังเฝ้าหีบใบนี้อยู่ · เอาชนะโจรผู้เฝ้าเพื่อเปิดหีบ');return}if(status==='opened'){dialog('หีบสมบัติว่างเปล่า','คุณรับสมบัติจากหีบใบนี้ไปแล้ว');return}dialog('หีบสมบัติโจรป่า','ไอเทมทั่วไป + เงิน 50% · อุปกรณ์ทั่วไป + เงิน 40% · อุปกรณ์คราฟ 10%');button('เปิดหีบและรับสมบัติ',()=>{const result=treasures.claim(chest,p);if(result.ok)window.townQuests.emit('chest',{country:data.countryId,place:chest.owner.questChestPlace||chest.owner.questPlace||questNearbyPlace()});dialog(result.ok?'ได้รับสมบัติแล้ว':'ยังเปิดหีบไม่ได้',result.ok?(result.gold?'เหรียญ +'+result.gold+'\n':'')+result.name+' ×'+result.qty+'\nเก็บของรางวัลลงกระเป๋าแล้ว':'หีบนี้รับสมบัติแล้ว หรือคุณอยู่ห่างเกินไป');if(result.ok&&window.WalkQuestEvents){window.WalkQuestEvents.present($('dialogChoices'),[window.WalkQuestEvents.loot(result)]);window.WalkQuestEvents.flush($('dialogChoices'))}for(const id of ['hudTop','hudBottom'])$(id)?.contentWindow.postMessage({type:'walk-hud-refresh'},location.origin)});return}showPlace(near)}$('interact').onclick=interact;$('places').onclick=showPlaces;$('closeDialog').onclick=()=>$('townDialog').close();$('townDialog').addEventListener('close',()=>{if(!$('townDialog').open)$('islandFerryPreview')?.remove();reset();});$('closeOverview').onclick=()=>{overview=false;reset();cam.x=p.x;cam.y=p.y};$('mapToggle').onclick=()=>overview=!overview;$('cancelTravel').onclick=stopTravel;
function joyMove(e){if(e.pointerId!==joy.id)return;const r=$('joystick').getBoundingClientRect(),max=r.width*.33;let x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,len=Math.hypot(x,y);if(len>max){x=x/len*max;y=y/len*max}joy.x=x/max;joy.y=y/max;$('stick').style.transform=`translate(${x}px,${y}px)`;e.preventDefault()}
const stick=$('joystick');stick.onpointerdown=e=>{joy.id=e.pointerId;stick.setPointerCapture(e.pointerId);joyMove(e)};stick.onpointermove=joyMove;for(const ev of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(ev,()=>{joy.x=joy.y=0;joy.id=null;$('stick').style.transform='translate(0,0)'});

addEventListener('keydown',e=>{if(WalkTutorial.active()||$('townDialog').open||menu||window.walkAtlas.isOpen())return;if(e.key==='Escape'&&overview){$('closeOverview').click();return}keys.add(e.key.toLowerCase());if(e.key==='e'&&!e.repeat)interact();if(e.key==='m'&&!e.repeat)overview=!overview;if(e.key.startsWith('Arrow'))e.preventDefault()});addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',reset);addEventListener('soulbeast-announcement-visibility',e=>{if(e.detail?.open){reset();stopTravel();}});document.addEventListener('visibilitychange',()=>{if(document.hidden)reset()});
canvas.onclick=e=>{if(!overview)return;const s=[...nav.places.filter(s=>s.type!=='junction'),...questNpcs].map(s=>({s,d:Math.hypot(e.clientX-sx(s.x),e.clientY-sy(s.y)+18)})).sort((a,b)=>a.d-b.d)[0];if(s?.d<34)showPlace(s.s)};
addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==$('regionMenu')?.contentWindow)return;if(e.data?.type==='walk-war-updated'){for(const id of ['hudTop','hudBottom'])$(id)?.contentWindow.postMessage({type:'walk-hud-refresh'},location.origin);return}if(e.data?.type==='country-encounter-result'&&activeEncounter&&['win','lose','flee'].includes(e.data.result)){const result=e.data.result;if(result==='win')for(const place of new Set(activeEncounter.actor.questPlaces?.length?activeEncounter.actor.questPlaces:[activeEncounter.actor.questPlace||questNearbyPlace()]))window.townQuests.emit('defeat',{kind:activeEncounter.kind,country:data.countryId,place});if(result==='win'&&activeEncounter.kind==='bandit')treasures.unlock(activeEncounter.actor);threats.resolve(activeEncounter,result);activeEncounter=null;$('regionMenu').remove();menu=false;reset();syncAvatar();for(const id of ['hudTop','hudBottom'])$(id)?.contentWindow.postMessage({type:'walk-hud-refresh'},location.origin);if(result==='lose'){const home=window.walkWar.playerCountry()||data.countryId;location.href=window.townProfiles.entryURL(home+'-capital')+(home==='blue'?'?':'&')+'screen=hospital';}return}if((['town-return','town-open-quests','walk-fusion-open'].includes(e.data?.type)||e.data?.type==='walk-forest-exit'&&!['lose','surrender'].includes(e.data.result))&&!activeEncounter){window.walkWar.endVisit();$('regionMenu').remove();menu=false;reset();syncAvatar();for(const id of ['hudTop','hudBottom'])$(id)?.contentWindow.postMessage({type:'walk-hud-refresh'},location.origin);if(e.data.type==='town-open-quests')window.townQuests.show(true);if(e.data.type==='walk-fusion-open')fusion.show();if(e.data.type==='walk-forest-exit'&&['win','exit'].includes(e.data.result))WalkTutorial.onHospitalArrival(window.townQuests.read())}});
window.walkAtlas.bind({pause:()=>{reset();stopTravel()},resume:reset,snapshot:()=>({kind:'country',country:data.countryId,region:data.regionId,x:p.x,y:p.y,liveTargets:[...roamers.actors.filter(a=>!a.cooldown).map((a,i)=>({...a,id:'shadow-'+i,name:a.beastName||'อสูร',probe:{type:'enemy',kind:'shadow',country:data.countryId,place:questNearbyPlace(a)}})),...bandits.actors.filter(a=>!a.cooldown).map((a,i)=>({...a,id:'bandit-'+i,name:'โจรป่า',probe:{type:'enemy',kind:'bandit',country:data.countryId,place:questNearbyPlace(a)}})),...treasures.chests.map(a=>({...a,id:a.id,name:'หีบสมบัติ',probe:{type:'chest',country:data.countryId,place:questNearbyPlace(a),opened:treasures.state(a)==='opened'}}))]})});
const waterSources=[...terrain.water.rivers,...terrain.water.lakes.map(l=>({...l,closed:true}))];
if(data.regionLayout)waterSources.push(...RegionCoast.contextSegments(data).map(({a,b})=>({points:[a,b]})));
function addLandmarkWaterSources(){
 for(const site of nav.places){
  const lines=LandmarkWater.place(site);
  if(!lines)continue;
  const image=placeImage(site),width=placeWidth(site);
  waterSources.push(...LandmarkWater.sources(site,lines,width,width*image.height/image.width));
 }
}
if(packlordPreview&&new URLSearchParams(location.search).get('audio')==='1'){try{const prefs=WalkAudio.settings();localStorage.setItem('sealbeast_audio_v1',JSON.stringify({...prefs,enabled:true,volume:prefs.volume||.35,effectsVolume:prefs.effectsVolume||1}));}catch{}}
const sceneAudio=WalkAudio.create({kind:'country',beastSources:()=>[...roamers.actors,...waterBeasts.actors],music:{blue:'countryBlue',green:'countryGreen',red:'countryRedOverworld'}[data.countryId],waterSources,waterSrc:walkAudioCatalog.countryWater.ambience,steps:{water:walkAudioCatalog.countryWater.steps}});
if(!packlordPreview)window.walkSocial.bind({canvas,place:()=>'country:'+data.countryId+(data.regionLayout?':'+data.regionId:''),canInteract:()=>!menu&&!overview&&!$('townDialog').open&&!fusion.isOpen&&!window.walkAtlas.isOpen(),stop:()=>{reset();stopTravel()},duel:(online=false)=>{reset();stopTravel();menu=true;const frame=document.createElement('iframe');frame.id='regionMenu';frame.title='ประลอง PVP';frame.src='../town-walk-demo/menu.html?v=beasts-3d-six-20261121&screen=pvp'+(online?'':'&localDuel=1')+'&city='+data.countryId+'-capital';frame.style='position:fixed;inset:0;width:100%;height:100%;border:0;z-index:10000;background:#122b40';document.body.append(frame)},closeMenu:()=>{$('regionMenu')?.remove();menu=false;reset();syncAvatar()}});
addEventListener('pagehide',e=>{if(!e.persisted){groundTiles?.release();groundShadows.release();avatar.release();packlordPreview?.release();canvas.width=canvas.height=1}});
function frame(now){const dt=Math.min((now-last)/1000||0,.04);last=now;t+=dt;const previousX=p.x,previousY=p.y;update(dt);
 const stepX=p.x-previousX,stepY=(p.y-previousY)*F,stepLength=Math.hypot(stepX,stepY);
 grassDisplacement=stepLength>.02?{x:stepX/stepLength,y:stepY/stepLength}:null;
 window.walkKingdomBoss?.tick(p,running);window.walkPresence.tick('country:'+data.countryId+(data.regionLayout?':'+data.regionId:''),p,moving,running);sceneAudio.tick(dt,{position:p,moving,running,beastsBlocked:menu||overview||$('townDialog').open||window.walkAtlas.isOpen()||!!activeEncounter||!!window.WalkControls?.editing,blocked:menu,waterPreview:ForestEntrance.waterAudible($('townDialog')),surface:WaterInteraction.state(data,terrain.water,p)?'water':terrain.water.onBridge(p.x,p.y)?'hall':canvas.dataset.surface==='road'?'stone':data.countryId==='green'?'leaves':'forest'});if($('regionMenu')||!shouldPaint(now)){requestAnimationFrame(frame);return;}const light=CountryDaylight.at(Date.now());trackedGate=WalkQuestEngine.trackedBorder(window.townQuests.destination(),data.countryId,borderGates,p,nav.distance);canvas.dataset.questBorder=trackedGate?.id||'';draw(light);
 if(!overview){
  const q=zoom(),effects=graphics.effects;
  const showNight=effects>0&&light.night>.005;
  const lights=showNight?lava.nightLights(drawObjects,sx,sy,q,W,H,images,effects):[];
  daylight.draw(c,W,H,light,effects?mask=>{
   if(showNight)nightEffects.open(mask,W,H,light.night,t,lights);
   for(const o of drawObjects)if(o.kind==='roadLamp')roadLamps.openLight(mask,o,sx,sy,q,t);
  }:null);
  if(showNight)nightEffects.draw(c,{w:W,h:H,cam,sx,sy,zoom:q},light.night,t,effects,lights);
 }
 for(const n of questNpcs){const mark=window.townQuests.marker(n.place.split(':').pop(),n.place);if(overview){ellipse(c,sx(n.x),sy(n.y),7,7,'#efcc65');label(n.name+(mark&&mark!=='X'?' '+mark:''),sx(n.x),sy(n.y)-14,'#173747');if(mark==='X')window.townQuests.drawTarget(c,sx(n.x),sy(n.y)-35,.65,window.townQuests.markerStyle(n.place.split(':').pop(),n.place))}else{const q=zoom(),x=sx(n.x),y=walkY(n.x,n.y);label(n.name+' '+(mark==='X'?'':mark||'◇'),x,y-170*q,'#173747');if(mark==='X')window.townQuests.drawTarget(c,x,y-198*q,q,window.townQuests.markerStyle(n.place.split(':').pop(),n.place))}}if(!overview){window.walkPresence.drawLabels(c,sx,(y,x)=>walkY(x,y),zoom());window.walkPresence.label(c,sx(p.x),walkY(p.x,p.y)-154*zoom(),window.walkPresence.player())}requestAnimationFrame(frame)}
Promise.all([archedBridges.ready,LivingEnvironment.ready(environmentKeys),avatar.sync(packlordPreview?.avatar),...Object.entries(images).map(([key,im])=>new Promise((res,rej)=>{const optional=/^(road|bridge|edgeRock|grassClump|wildflower|shrub)\d+$/.test(key)||key==='directionSign';im.onload=res;im.onerror=optional?res:rej;if(im.complete&&(im.naturalWidth||optional))res()}))]).then(()=>{addLandmarkWaterSources();makeGround();sceneryIndex=CountryRenderBudget.index(sceneryObjects.filter(o=>o.kind!=='bridgeRail'||!archedBridges.hasModel(o.crossing)),objectBounds);makeMiniBase();groundTiles=CountryRenderBudget.groundTiles(ground,()=>document.createElement('canvas'));ground.width=ground.height=1;window.WalkLoading.ready();$('loading').remove();const arrivalQuery=new URLSearchParams(location.search);const capitalDeparture=arrivalQuery.has('gate')&&arrivalQuery.get('from')===data.countryId+'-capital';if(/^forest-\d+$/.test(arrivalQuery.get('arrival')||''))WalkTutorial.onHospitalArrival(window.townQuests.read());if(!packlordPreview)WalkTutorial.mount({observesNight:true,capitalDeparture,read:window.townQuests.read,blocked:()=>menu||overview||moving||running||!!window.WalkControls?.editing||window.walkAtlas.isOpen()||!!activeEncounter,stop:reset});requestAnimationFrame(frame)}).catch(()=>window.WalkLoading.fail('โหลดภาพไม่สำเร็จ กรุณาลองใหม่'));
})();

