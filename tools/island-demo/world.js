(async function(){'use strict';
const I=window.IslandRules,$=id=>document.getElementById(id),params=new URLSearchParams(location.search);
const country=params.get('country'),cfg=I.islands[country],root='/Soulbeast/';
const read=()=>JSON.parse(sessionStorage.getItem(I.key)||'null');
function show(title,message,actions,art){
 $('dialogTitle').textContent=title;
 window.NpcDialogue?.clear($('townDialog'));
 $('dialogText').textContent=message;$('dialogBody').replaceChildren();
 if(art){const img=document.createElement('img');img.src=root+art;img.alt='';$('dialogBody').append(img);}
 $('dialogChoices').replaceChildren();
 for(const [label,action] of actions){
  const button=document.createElement('button');button.textContent=label;button.onclick=action;$('dialogChoices').append(button);
 }
 if(!$('townDialog').open)$('townDialog').showModal();
}
const close=()=>$('townDialog').close();
const mainland=()=>location.assign('../hemant-walk-demo/index.html?country='+encodeURIComponent(cfg?country:'blue')+'&arrival=island-port');
let player=read();
const online=IslandAccount.active();
if(!cfg||!player||(online&&!IslandAccount.hasVisit(player,country))||!I.state(player,country).visit){
 for(const hud of document.querySelectorAll('.walk-hud'))hud.hidden=true;
 show('ท่าเรือสามอาณาจักร','กรุณาใช้ท่าเรือบนแผนที่ประเทศเพื่อเดินทางเข้าเกาะ', [['กลับแผนที่ประเทศ',mainland]]);
 return;
}
if(!online&&IslandPreviewProfile.upgrade(player,WalkVitals.maximum)){
 const raw=JSON.stringify(player);sessionStorage.setItem(I.key,raw);
 localStorage.setItem('soulbeast-walk-save:'+player.walkId,raw);
}
const data=I.map(country),F=I.F,canvas=$('world'),surface=canvas.getContext('2d');
let ctx=surface;
const patrols=IslandPatrols.create({
 ...data,actors:[...data.actors,{...data.boss,id:'boss',kind:'boss',lv:60}],
},cfg.seed);
const boss=patrols.actors.find(a=>a.kind==='boss');LivingBeasts.assign(patrols.actors.filter(a=>a.kind==='shadow'),{scene:'island',country,player});BeastHabitats.islandActors(patrols.actors,data,country,player);const livingBeasts=LivingBeasts.create();void livingBeasts.preload(patrols.actors.filter(a=>a.kind==='shadow').slice(0,3));window.islandLivingBeasts={actors:patrols.actors.filter(a=>a.kind==='shadow'),renderer:livingBeasts};
const mini=$('mini').getContext('2d'),avatar=sealerSprites.create({preloadDirections:true}),keys=new Set(),joy={x:0,y:0,id:null};
const visit=()=>I.state(player,country).visit;
const saved=visit().position;
const p={...(saved&&data.walkable(saved.x,saved.y)?saved:data.spawn),dir:saved?.dir||0};
const cam={...p},companion=CompanionFollowers.create();
const nav={walkable:data.walkable,distance:I.distance};
const trapState=visit().traps;
const traps=DungeonTraps.create(data,nav,trapState,{seed:cfg.seed,count:I.trapCount,spacing:370});
const colors={
 blue:{sea:'#12415d',deep:'#071d35',ground:'#a5bcc4',floor:'assets/hemant-walk-preview/snow-v1.png.webp'},
 green:{sea:'#12616c',deep:'#082e43',ground:'#4c7440',floor:'assets/town-walk-preview/grass-v1.png.webp'},
 red:{sea:'#224758',deep:'#091f32',ground:'#714831',floor:'assets/country-walk/red/ground.png.webp'},
}[country];
const asset=Object.fromEntries(Object.entries({
 floor:colors.floor,
 wreck:'assets/island-props/'+country+'-wreck.webp',
 chest:'assets/hemant-walk-preview/bandit-treasure-v1.png.webp',
 bandit:'assets/hemant-walk-preview/forest-bandit-walk-v2.png.webp',

 port:'assets/island-props/'+country+'-port.webp',
 boss:country==='green'?'assets/beasts/solar/solar_raijaku.webp':
  'assets/beasts/motion/'+cfg.boss.replace('_','-')+'-idle-v1.webp',
}).map(([key,src])=>{const img=new Image();img.src=root+src;return [key,img];}));
const atlas={},loadImage=url=>new Promise((resolve,reject)=>{
 const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('Cannot load '+url));img.src=url;
});
const atlasReady=fetch('island-props.json?v=1').then(res=>res.json()).then(async ({beach})=>{
 const image=await loadImage(root+'assets/island-props/beach-atlas.webp');
 for(const [id,bounds] of Object.entries(beach))atlas[id]={image,bounds};
}).catch(console.error);
const shore=Array.from({length:81},(_,i)=>data.coast(i*Math.PI/40));
const music=WalkAudio.create({kind:'country',music:{blue:'countryBlue',green:'countryGreen',red:'countryRed'}[country],surface:'leaves',waterSources:[{points:shore,width:85}]});
async function loadBossSprite(){
 let entry;
 if(country==='green'){
  const response=await fetch('raijaku-flight.json');
  const flight=await response.json();
  entry={...flight,url:root+'assets/island-bosses/'+flight.file};
 }else{
  const model=BeastFusionSprites[country==='blue'?'crystal-stag':'infernal-hydra'];
  entry={...model,id:cfg.boss,name:cfg.bossName,kind:'walk',url:model.base+'/'+model.file};
 }
 const sprite=RareBossSprites.create({catalog:[entry],cellLimit:256});
 await sprite.sync(entry.id);
 bossSprite=sprite;
 canvas.dataset.bossSprite=entry.id;
}
let bossSprite=null;
void loadBossSprite().catch(console.error);
void avatar.sync(player).catch(console.error);
const random=I.seeded(cfg.seed+91);
const coastProps=[];
for(const [index,angle] of [.42,.91,1.42,1.85,2.29,2.85,3.4,3.87,4.38,4.88,5.47].entries()){
 if(index%4!==1)continue;
 const bearing=angle+cfg.angle,point=data.coast(bearing,1.008);
 if(I.distance(point,data.spawn)<420)continue;
 coastProps.push({...point,art:'wreck',size:230});
}
for(let i=0;i<12;i++){
 const bearing=cfg.angle-.25+i*.074;
 const foot=data.coast(bearing,.973-(i%3)*.006);
 coastProps.push({...foot,art:i%4===0?'star':'shell',variant:i%4===0?i/4+1:i%5+1,size:21+random()*20});
}
const landmark=data.coast(cfg.angle+.30,.982);
if(!data.walkable(landmark.x,landmark.y))coastProps.push({...data.coast(cfg.angle+.30,.956),art:'statue',size:112});
const fishSchools=[-.15,.36,1.45,2.35,3.5,4.42,5.65].map((angle,index)=>({angle:angle+cfg.angle,offset:index*.9}));
const portArt={...data.coast(cfg.angle,.988),depthY:data.spawn.y-16,art:'port',size:240,name:cfg.port};
const beach=IslandBeach.create(data,country,F,I.seeded(cfg.seed+174),I.distance,coastProps,portArt,data.sites);
const {artFiles,layout,props,lamps,lava}=IslandLandscape.create(data,country,F,random,I.distance,[...coastProps,...beach.palms],portArt,beach.width);
const staticScenery=CountryRenderBudget.index([...props,...beach.palms,...coastProps,portArt,
 ...data.sites.map(o=>({...o,art:'ruin',size:190}))
],o=>({left:o.x-o.size,right:o.x+o.size,top:o.y*F-o.size*2,bottom:o.y*F+o.size*.2}));
const visibleScenery=[];
const landscapeArt=Object.fromEntries(Object.entries(artFiles).map(([key,src])=>{
 const im=new Image();
 im.src=src;
 return [key,im];
}));
const shadowLayer=WalkGroundShadows.create();
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
let width=0,height=0,dpr=1,last=performance.now(),clock=0,phase=0,writeAt=0,miniAt=0;
let moving=false,running=false,near=null,frame=null,kind='',noticeTimer=null,portalOpen=false;
let grassDisplacement=null;
const coupon=()=>online?openFrame(null,'coupon'):show('คูปองเกาะ','คูปองในเซฟเกาะ '+I.state(player).coupons+' ใบ',[['กลับ',close]]);
const fusion=BeastFusion.create({
 canOpen:()=>!frame&&!saveContinuation&&!$('townDialog').open&&!DungeonFeedback.isOpen&&!window.WalkControls?.editing,
 stop:reset,openShop:coupon,onChange:fresh=>{player=fresh;persist();},
});
const peers=document.createElement('button');
peers.className='peer-list-button';peers.setAttribute('aria-label','ผู้เล่นในพื้นที่');peers.textContent='♟';
peers.onclick=()=>{reset();show('ผู้เล่นในพื้นที่เดียวกัน','โหมดทดสอบเกาะเล่นคนเดียว',[['กลับไปเดินต่อ',close]]);};
document.querySelector('.tools').append(peers);
const cooldown=new Map(),ground=document.createElement('canvas'),gc=ground.getContext('2d');
const groundScale=matchMedia('(pointer: coarse)').matches?.31:.38,zoom=.82;
ground.width=Math.ceil(data.width*groundScale);ground.height=Math.ceil(data.height*F*groundScale);
function renderGround(){
 gc.setTransform(groundScale,0,0,groundScale,0,0);
 gc.clearRect(0,0,data.width,data.height*F);
 const sea=gc.createRadialGradient(data.center.x,data.center.y*F,data.rx*.45,data.center.x,data.center.y*F,data.rx*1.4);
 sea.addColorStop(0,colors.sea);sea.addColorStop(1,colors.deep);
 gc.fillStyle=sea;gc.fillRect(0,0,data.width,data.height*F);
 beach.paintWater(gc);
 gc.save();gc.clip(beach.waterline);
 gc.fillStyle=colors.ground;gc.fillRect(0,0,data.width,data.height*F);
 if(asset.floor.naturalWidth){
  const texture=gc.createPattern(asset.floor,'repeat');
  texture.setTransform(new DOMMatrix().scale(.45));
  gc.fillStyle=texture;gc.fillRect(0,0,data.width,data.height*F);
 }
 lava.drawGround(gc,landscapeArt);
 CountryPathArt.paintSettlement(gc,layout,F,landscapeArt,country);
 beach.paintSand(gc);
 gc.restore();
}
renderGround();
const waitForImage=im=>new Promise(resolve=>{
 if(im.complete)resolve();
 else {im.onload=resolve;im.onerror=resolve;}
});
Promise.all([atlasReady,...[asset.floor,...Object.values(landscapeArt)].map(waitForImage),
 LivingEnvironment.ready(Array.from({length:5},(_,i)=>'country-tree:'+country+'-tree-'+(i+1)))
]).then(()=>{
 renderGround();
 canvas.dataset.scenery='ready';
});
function resize(){
 dpr=Math.min(2,devicePixelRatio||1);width=innerWidth;height=innerHeight;
 canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
 shadowLayer.resize(canvas.width,canvas.height,width,height);
}
addEventListener('resize',resize);resize();
const sx=x=>width/2+(x-cam.x)*zoom,sy=y=>height*.54+(y-cam.y)*F*zoom;
function stamp(img,x,y,size,anchor=1){
 if(!img?.naturalWidth)return false;
 const h=size*img.naturalHeight/img.naturalWidth;
 shadowLayer.sprite(ctx,x,y).drawImage(img,x-size/2,y-h*anchor,size,h);
 return true;
}
function stampProp(o,x,y){
 const variant=o.variant||1;
 const size=o.size*zoom;
 if(o.art==='tree')return stamp(LivingEnvironment.load('country-tree:'+country+'-tree-'+variant),x,y,size,.89);
 if(o.art==='rock')return stamp(landscapeArt['edgeRock'+variant],x,y,size,.5);
 if(o.art==='shrub')return stamp(landscapeArt['shrub'+variant],x,y,size,.84);
 if(o.key)return stamp(landscapeArt[o.key],x,y,size,o.art==='wildflower'?.78:.91);
 const mainland=landscapeArt[o.art];
 if(mainland)return stamp(mainland,x,y,size,.94);
 const frame=['shell','star'].includes(o.art)?o.art+'-'+variant:o.art;
 const sprite=atlas[frame];
 if(sprite){
  const [left,top,w,h]=sprite.bounds,drawHeight=size*h/w;
  const palm=o.art==='palm';
  ctx.save();
  ctx.translate(x,y);
  if(o.flip)ctx.scale(-1,1);
  shadowLayer.sprite(ctx,x,y).drawImage(sprite.image,left,top,w,h,-size*(palm?.12:.5),
   -drawHeight*(palm?.975:1),size,drawHeight);
  ctx.restore();
 }else if(asset[o.art])stamp(asset[o.art],x,y,size);
}
function label(text,x,y){
 text=window.SoulbeastLocale?.text(text)??text;
 ctx.font='600 13px Tahoma';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#0a1726';
 ctx.strokeText(text,x,y);ctx.fillStyle='#fff3d0';ctx.fillText(text,x,y);
}
function dot(c,x,y,r,color){
 c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=color;c.fill();
}
function drawFish(){
 const time=reduceMotion.matches?0:clock;
 for(const school of fishSchools){
  const a=school.angle+Math.sin(time*.29+school.offset)*.042;
  for(let i=0;i<4;i++){
   const step=a+i*.012,fish=data.coast(step,1.035+(i%2)*.007+.004*Math.sin(time*.62+i));
   const x=sx(fish.x),y=sy(fish.y);
   if(x<-18||x>width+18||y<-18||y>height+18)continue;
   const direction=Math.cos(time*.29+school.offset)>=0?1:-1;
   const ahead=data.coast(step+.012*direction,1.04);
   ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(sy(ahead.y)-y,sx(ahead.x)-x));
   ctx.fillStyle='rgba(134,221,224,.48)';ctx.beginPath();
   ctx.ellipse(0,0,5-i*.35,2.15,0,0,Math.PI*2);ctx.fill();
   ctx.beginPath();ctx.moveTo(-3,0);ctx.lineTo(-7,-2+Math.sin(time*8+i));ctx.lineTo(-7,2+Math.sin(time*8+i));ctx.closePath();ctx.fill();
   ctx.restore();
  }
 }
}
const daylight=CountryDaylight.create(country);
function draw(){
 const light=CountryDaylight.at(Date.now()),lit=light.night>.005;
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle=colors.deep;ctx.fillRect(0,0,width,height);
 ctx.drawImage(ground,sx(0),sy(0),data.width*zoom,data.height*F*zoom);
 drawFish();
 beach.waves(ctx,sx,sy,zoom,width,height,clock,reduceMotion.matches);
 lava.drawGroundHeat(ctx,sx,sy,zoom,clock,reduceMotion.matches,width,height,landscapeArt);
 const visibleLamps=lamps.poles.filter(o=>sx(o.x)>-210&&sx(o.x)<width+210&&sy(o.y)>-100&&sy(o.y)<height+195);
 if(lit)for(const o of visibleLamps)lamps.drawGround(ctx,o,sx,sy,zoom,clock,1,light.night);
 staticScenery.query({left:cam.x-width/(2*zoom),right:cam.x+width/(2*zoom),
  top:cam.y*F-height*.54/zoom,bottom:cam.y*F+height*.46/zoom},visibleScenery);
 const objects=[
  ...visibleScenery,
  ...visibleLamps.map(o=>({...o,art:'lamp'})),
  ...(!visit().cleared.chest?[{...data.chest,art:'chest',size:75}]:[]),
  ...patrols.actors.filter(a=>!visit().cleared[a.id]).map(a=>({...a,art:a.kind})),
  ...(companion.key&&companion.body?[{...companion.body,art:'companion'}]:[]),
  {...p,art:'player'},
 ].sort((a,b)=>(a.depthY??a.y)-(b.depthY??b.y));
 ctx=shadowLayer.begin(F,light.night,visibleLamps,sx,sy,zoom);
 for(const o of objects){
  const x=sx(o.x),y=sy(o.y);
  if(x<-200||x>width+200||y<-25||y>height+250)continue;
  if(o.art==='lamp'){lamps.draw(ctx,o,x,y,zoom,clock,lit?1:0,light.night,shadowLayer);continue;}
  if(o.art==='grass'){
   CountryGrassClumps.draw(ctx,landscapeArt[o.key],o,x,y,zoom,p,grassDisplacement,clock,F,shadowLayer,width,height);
   continue;
  }
  if(o.art==='companion'){companion.draw(ctx,sx,sy,zoom,shadowLayer);continue;}
  if(o.art==='player'){
   const sprite=shadowLayer.sprite(ctx,x,y);
   if(!fusion.draw(sprite,x,y,1,p.dir,clock,moving,p.spriteDir??p.dir))avatar.draw(sprite,x,y,134,p.spriteDir??p.dir,phase,moving,running);
   continue;
  }
  if(o.art==='boss'){
   const size=country==='red'?242:216;
   const drawn=bossSprite?.draw(ctx,x,y,size,o.dir,clock,o.moving)||stamp(asset.boss,x,y,164);
   if(drawn)label((o.mode==='chase'?'! ':'')+'♛ '+cfg.bossName+' · Lv 60',x,y-145);
   continue;
  }
  if(o.art==='shadow'){livingBeasts.draw(ctx,o,x,y,150,performance.now()/1000);if(I.distance(p,o)<240)label((o.mode==='chase'?'! ':'')+o.beastName+' · Lv '+o.lv,x,y-130);continue;}if(o.art==='bandit'){
   const im=asset[o.art],frame=o.moving?Math.floor(o.phase)%8:0,cell=im.naturalWidth/4;
   if(cell){
    ctx.fillStyle='#32384b50';ctx.beginPath();ctx.ellipse(x,y-3,25,7,0,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.translate(x,y);ctx.scale(o.facing,1);
    ctx.drawImage(im,(frame%4)*cell,Math.floor(frame/4)*cell,cell,cell,-53,-96,106,106);ctx.restore();
   }
   const name=o.art==='shadow'?'อสูรเงา':'โจรป่า';
   if(I.distance(p,o)<240)label((o.mode==='chase'?'! ':'')+name+' · Lv '+o.lv,x,y-93);
  }else{
   stampProp(o,x,y);
   if(o.name&&I.distance(p,o)<350)label(o.name,x,y+18);
  }
 }
 ctx=surface;
 shadowLayer.finish(ctx);
 traps.draw(ctx,o=>({x:sx(o.x),y:sy(o.y)}),F);
 daylight.draw(ctx,width,height,light,lit?veil=>{
  for(const o of visibleLamps)lamps.openLight(veil,o,sx,sy,zoom,clock);
  for(const {x,y,rx,ry,power} of lava.nightLights([],sx,sy,zoom,width,height,landscapeArt,1)){
   veil.save();
   veil.translate(x,y);
   veil.scale(rx,ry);
   const glow=veil.createRadialGradient(0,0,0,0,0,1);
   glow.addColorStop(0,'rgba(255,255,255,'+power+')');
   glow.addColorStop(1,'rgba(255,255,255,0)');
   veil.fillStyle=glow;
   veil.fillRect(-1,-1,2,2);
   veil.restore();
  }
 }:undefined);
}
function drawMap(c){
 const w=c.canvas.width,h=c.canvas.height,ratio=Math.min(w/data.width,h/(data.height*F));
 const ox=(w-data.width*ratio)/2,oy=(h-data.height*F*ratio)/2;
 const px=x=>ox+x*ratio,py=y=>oy+y*F*ratio;
 c.fillStyle=colors.deep;c.fillRect(0,0,w,h);
 c.drawImage(ground,ox,oy,data.width*ratio,data.height*F*ratio);
 for(const site of data.sites)dot(c,px(site.x),py(site.y),3,I.state(player,country).ruins[site.id]?'#aab2ac':'#ffdb74');
 dot(c,px(boss.x),py(boss.y),4,'#ff756f');
 dot(c,px(data.spawn.x),py(data.spawn.y),4,'#81e5ad');
 dot(c,px(p.x),py(p.y),4,'#fff');
}
function reset(){keys.clear();joy.x=joy.y=0;joy.id=null;$('stick').style.transform='';moving=running=false;}
let publishedPlayer=sessionStorage.getItem(I.key);
function syncPlayer(){
 const raw=sessionStorage.getItem(I.key);
 if(raw===publishedPlayer||!raw)return;
 const fresh=JSON.parse(raw);
 if(fresh.code!==player.code)return;
 player=fresh;publishedPlayer=raw;
 const storedTraps=visit()?.traps;
 if(storedTraps&&storedTraps!==trapState)trapState.revealed=storedTraps.revealed||{};
}
function persist(savePosition=true){
 const current=visit();
 if(current){
  if(savePosition)current.position={x:p.x,y:p.y,dir:p.dir};
  current.traps=trapState;
 }
 const raw=JSON.stringify(player);
 sessionStorage.setItem(I.key,raw);publishedPlayer=raw;
 if(player.walkId)localStorage.setItem('soulbeast-walk-save:'+player.walkId,raw);
}
function status(message){
 const box=$('notice');box.textContent=message;box.hidden=false;
 clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>{box.hidden=true;},3200);
}
let needsSave=false,savingProgress=false,retrySaveAt=0;
let saveContinuation=null,saving=false;
function queueSave(){
 if(online)needsSave=true;
}
async function saveProgress(){
 if(!needsSave||savingProgress||saveContinuation||frame||clock<retrySaveAt)return;
 needsSave=false;savingProgress=true;
 try{
  await IslandAccount.checkpoint({background:true});
  retrySaveAt=0;
 }catch{
  if(!retrySaveAt)status('บันทึกยังไม่สำเร็จ ระบบจะลองอีกครั้ง');
  retrySaveAt=clock+8;needsSave=true;
 }finally{savingProgress=false;}
}
function saveThen(next,action,{quiet=false}={}){
 if(!online){next();return;}
 saveContinuation={next,action,quiet,visitId:visit()?.id};
 void confirmSave();
}
async function confirmSave(){
 if(saving||!saveContinuation)return;
 const save=saveContinuation;
 const {next,action,quiet,visitId}=save;
 saving=true;reset();
 if(!quiet||save.failed)show('บันทึกการเดินทาง','กำลังบันทึกความคืบหน้าของตัวละคร…',[]);
 let result;
 try{
  if(action)result=await IslandAccount.command(action,country,visitId);
  else await IslandAccount.checkpoint();
  syncPlayer();
  needsSave=false;retrySaveAt=0;
 }catch(error){
  const code=error.code||error.message;
  const message=['login_required','character_not_owned','session_replaced'].includes(code)
   ?'กรุณาเข้าสู่ระบบและเลือกตัวละครอีกครั้ง':'ยังยืนยันการบันทึกไม่ได้ กรุณาลองอีกครั้ง';
  save.failed=true;
  show('บันทึกการเดินทาง',message,[['ลองบันทึกอีกครั้ง',confirmSave]]);
  return;
 }finally{saving=false;}
 saveContinuation=null;
 if(!quiet||save.failed)close();
 next(result);
}
function exitIsland(next,defeated=false){
 const maxHp=WalkVitals.maximum(player).hp;
 if(online){
  if(defeated)player.hp=Math.max(1,Math.round(maxHp*.3));
 }else I.leave(player,country,defeated,maxHp);
 persist(false);
 saveThen(next,'island_exit',{quiet:defeated});
}
function goHome(defeated){
 exitIsland(()=>{
  if(!defeated)return mainland();
  const url=new URL(townProfiles.entryURL((I.islands[player.country]?player.country:country)+'-capital'),location.href);
  url.searchParams.set('screen','hospital');location.assign(url);
 },defeated);
}
function openFrame(id,screen='bag',quickItem){
 if(frame||saveContinuation)return;
 reset();persist();
 const mount=()=>{
  if($('townDialog').open)close();
  frame=document.createElement('iframe');frame.id='regionMenu';frame.title=id?'เหตุการณ์บนเกาะ':'กระเป๋าผู้ผนึก';
  const query=new URLSearchParams({city:country+'-capital',v:'quest-editorial-2',walkScene:'island',screen:id?'town':screen});
  if(quickItem)query.set('quickItem',quickItem);
  if(id){query.set('island',country);query.set('islandEncounter',id);const actor=patrols.actors.find(a=>a.id===id&&a.kind==='shadow');if(actor)query.set('beastPlan',LivingBeasts.remember(actor,{scene:'island',country}));}
  frame.src=screen==='coupon'?'../town-walk-demo/coupon.html':'../town-walk-demo/menu.html?'+query;
  kind=id||'menu';document.body.append(frame);
 };
 if(id==='boss')saveThen(mount,null,{quiet:true});else mount();
}
function openPortal(pending){
 portalOpen=true;reset();
 show('ประตูบอสปริศนา · Lv '+pending.lv,'กับดักวาร์ปพาคุณมาถึงประตูต้องห้าม ชนะอสูรตำนานแล้วจึงกลับไปเดินต่อบนเกาะได้',[
  ['เปิดประตูบอส',()=>{portalOpen=false;openFrame(pending.id);}],
  ['ยอมแพ้ ยอมตาย',()=>goHome(true)],
 ],'assets/ui/boss-gates/gate-'+cfg.gate+'.webp');
}
function activate(o){
 if(frame||saveContinuation)return;
 syncPlayer();
 if(o.id==='port'){
  show(cfg.port,'ขากลับแผ่นดินไม่เสียค่าเดินทาง',[['กลับแผนที่ประเทศ',()=>goHome(false)],['เดินต่อ',close]]);
 }else if(o.id.startsWith('ruin-')){
  if(I.state(player,country).ruins[o.id]){status('สำรวจเมืองร้างแห่งนี้แล้ว');return;}
  show(o.name,'สำรวจได้ครั้งเดียวต่อผู้ผนึก',[['สำรวจ',()=>{
   const result=I.explore(player,country,o.id);
   if(result==='items'){
    const loot=I.items(player);persist();
    queueSave();show('กล่องไอเทม',loot.map(([id,n])=>(DungeonRewardArt[id]?.name||id)+' ×'+n).join(' · '),[['เดินต่อ',close]]);
   }else if(result){persist();if(result==='portal')openPortal(visit().pending);else openFrame(o.id);}
  }],['กลับ',close]]);
 }else if(o.id==='chest'){
  show(o.name,'อุปกรณ์หายาก 40% · คราฟ 30% · ตำนาน 20% · ตำนานสุริยคราส 10%',[
   ['เปิดหีบ',()=>{if(I.begin(player,country,o.id,'chest',60))openFrame(o.id);}],['กลับ',close]]);
 }
}
function resumeAfterBattle(result){
 persist();void avatar.sync(player).catch(console.error);refreshHud();
 if(result?.outcome==='first'&&!result.already)status('ได้รับคูปอง 10 ใบเข้าบัญชี');
 if(result?.outcome==='repeat'&&!result.already)status('ได้รับ 10,000 เหรียญ และผนึกนิรันดร์ 1 ชิ้น');
}
function refreshHud(){
 for(const id of ['hudTop','hudBottom'])$(id).contentWindow?.postMessage({type:'walk-hud-refresh'},location.origin);
}
addEventListener('message',e=>{
 if(e.origin!==location.origin)return;
 const message=e.data;
 if(['hudTop','hudBottom'].some(id=>e.source===$(id).contentWindow)){
  if(message?.type!=='walk-menu'||frame||saveContinuation||$('townDialog').open)return;
  const screen=message.screen;
  if(screen==='quests'){reset();$('dialogBody').replaceChildren();window.townQuests.show(true);}
  else if(screen==='coupon')coupon();
  else if(['mail','hero','team','bag','friends','settings'].includes(screen))openFrame(null,screen);
  return;
 }
 if(e.source!==frame?.contentWindow)return;
 if(message?.type==='island-encounter-result'&&message.country===country&&message.id===kind){
  const fresh=read();
  if(!fresh||fresh.code!==player.code)return;
  const record=I.state(fresh,country).visit?.last;
  if(record?.id!==kind||record.result!==message.result)return;
  frame.remove();frame=null;syncPlayer();reset();cooldown.set(kind,clock+4);
  if(record.result==='lose')goHome(true);
  else if(kind==='boss'&&record.result==='win')saveThen(resumeAfterBattle,'island_boss_reward',{quiet:true});
  else{resumeAfterBattle();queueSave();}
 }else if(kind==='menu'&&message?.type==='town-return'){
  frame.remove();frame=null;syncPlayer();reset();resumeAfterBattle();queueSave();
 }else if(kind==='menu'&&message?.type==='walk-teleport'&&Object.hasOwn(townProfiles.profiles,message.destination)){
  frame.remove();frame=null;syncPlayer();
  exitIsland(()=>location.assign(townProfiles.entryURL(message.destination)));
 }
});
function update(dt){
 if(frame||$('townDialog').open||fusion.isOpen||DungeonFeedback.isOpen||window.WalkControls?.editing||
    (saveContinuation&&saveContinuation.action!=='island_boss_reward'))return;
 if(!saveContinuation)syncPlayer();
 if(!visit())return;
 let x=joy.x,y=joy.y;
 if(keys.has('a')||keys.has('arrowleft'))x--;
 if(keys.has('d')||keys.has('arrowright'))x++;
 if(keys.has('w')||keys.has('arrowup'))y--;
 if(keys.has('s')||keys.has('arrowdown'))y++;
 const magnitude=Math.hypot(x,y);
 moving=magnitude>.12;running=moving&&(keys.has('shift')||joy.id!=null&&magnitude>.74);
 if(moving){
  p.spriteDir=sealerSprites.heading(x,y);p.dir=(Math.round(-Math.atan2(x,y)/(Math.PI/4))+8)%8;
  const effort=Math.min(1,magnitude);
  const step=fusion.speed((running?246:151)*effort,effort)*dt;
  const nx=p.x+x/magnitude*step,ny=p.y+y/magnitude*step/F;
  if(data.walkable(nx,p.y))p.x=nx;
  if(data.walkable(p.x,ny))p.y=ny;
  phase+=dt*(running?12:8);
 }
 cam.x+=(p.x-cam.x)*Math.min(1,dt*10);cam.y+=(p.y-cam.y)*Math.min(1,dt*10);
 if(saveContinuation)return;
 const safe=data.isSafe(p);
 const events=traps.update(dt,[{id:'player',position:p,alive:!safe&&player.hp>0}]);
 for(const event of events){
  if(event.kind==='armed')status('กับดัก'+DungeonTraps.types[event.trap.type].name+' · ออกจากวงภายใน 2 วินาที');
  else if(event.hit.includes('player')){
   const damage=DungeonTraps.apply(event.trap.type,player,WalkVitals.maximum(player).hp);
   persist();reset();queueSave();
   if(player.hp<=0){goHome(true);return;}
   void DungeonFeedback.trap(event.trap.type,damage?'-'+damage+' HP':'');
   return;
  }
 }
 const available=a=>!visit().cleared[a.id]&&(cooldown.get(a.id)||0)<=clock;
 const contact=patrols.update(dt,p,available);
 if(contact&&(contact.kind!=='shadow'||livingBeasts.ready(contact))&&I.begin(player,country,contact.id,contact.kind,contact.lv)){if(contact.kind==='shadow')visit().pending.plan=contact.encounterPlan.units.map(u=>({...u}));openFrame(contact.id);return;}
 const sites=[{...data.spawn,id:'port',name:cfg.port},...data.sites,
  ...(!visit().cleared.chest?[data.chest]:[])];
 near=sites.filter(o=>I.distance(p,o)<112).sort((a,b)=>I.distance(p,a)-I.distance(p,b))[0];
 $('interact').disabled=!near;
 $('interact').querySelector('small').textContent=near?.id==='port'?'ขึ้นเรือกลับ':near?.id==='chest'?'เปิดหีบ':'สำรวจ';
 $('area').textContent=safe?'เขตปลอดภัย · ท่าเรือ':I.distance(p,data.center)<235?'เขตบอส · ใจกลางเกาะ':'เขตอสูรเงา · Lv 45–60';
 if(clock>=writeAt){writeAt=clock+1;persist();}
}
function tick(now){
 const dt=Math.min(.05,(now-last)/1000);last=now;clock+=dt;
 if(visit()){
  const x=p.x,y=p.y;
  update(dt);
  const dx=p.x-x,dy=(p.y-y)*F,length=Math.hypot(dx,dy);
  grassDisplacement=length>.02?{x:dx/length,y:dy/length}:null;
  if(visit()){
   companion.sync(CompanionFollowers.first(player));companion.update(dt,p);
   if(companion.key)canvas.dataset.companion=companion.key;else delete canvas.dataset.companion;
   draw();
  }
  if(needsSave)void saveProgress();
  if(clock>=miniAt&&visit()){
   miniAt=clock+.15;drawMap(mini);
  }
  music.tick(dt,{position:p,moving,running,blocked:!!frame||$('townDialog').open||fusion.isOpen});
 }
 requestAnimationFrame(tick);
}
$('townDialog').addEventListener('cancel',event=>{if(portalOpen||saveContinuation)event.preventDefault();});
$('townDialog').addEventListener('close',reset);
$('interact').onclick=()=>{if(near)activate(near);};
addEventListener('country-quick-teleport',()=>{
 if(!frame&&!$('townDialog').open)openFrame(null,'bag','teleportScroll');
});
$('places').onclick=()=>!saveContinuation&&show(cfg.name,'สถานที่บนเกาะ · เดินเข้าใกล้จุดเพื่อสำรวจ',[
 [cfg.port,()=>$('map').click()],...data.sites.map(site=>[site.name,()=>$('map').click()]),
 [cfg.bossName,()=>$('map').click()],['ปิด',close],
]);
$('map').onclick=()=>{
 if(saveContinuation)return;
 reset();show(cfg.name,'สีเขียว: ท่าเรือ · สีทอง: เมืองร้าง · สีแดง: บอส · สีขาว: คุณ',[['ปิดแผนที่',close]]);
 const map=document.createElement('canvas');map.width=410;map.height=370;map.style.width='100%';
 $('dialogBody').prepend(map);drawMap(map.getContext('2d'));
};
$('mapToggle').onclick=()=>$('map').click();
addEventListener('keydown',e=>{
 if(frame||$('townDialog').open||fusion.isOpen||DungeonFeedback.isOpen||window.WalkControls?.editing)return;
 const key=e.key.toLowerCase();
 if(['w','a','s','d','shift','arrowup','arrowdown','arrowleft','arrowright'].includes(key)){e.preventDefault();keys.add(key);}
 if(key==='e'&&!e.repeat&&near)activate(near);
 if(key==='m'&&!e.repeat)$('map').click();
});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
addEventListener('blur',reset);
const stick=$('joystick');
function steer(e){
 if(joy.id!==e.pointerId)return;
 const box=stick.getBoundingClientRect(),dx=e.clientX-box.left-box.width/2,dy=e.clientY-box.top-box.height/2;
 const max=box.width*.33,scale=Math.max(max,Math.hypot(dx,dy));
 joy.x=dx/scale;joy.y=dy/scale;$('stick').style.transform='translate('+joy.x*max+'px,'+joy.y*max+'px)';
}
stick.onpointerdown=e=>{joy.id=e.pointerId;stick.setPointerCapture(e.pointerId);steer(e);};
stick.onpointermove=steer;
for(const type of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(type,()=>{joy.x=joy.y=0;joy.id=null;$('stick').style.transform='';});
addEventListener('pagehide',event=>{
 if(!frame&&!saveContinuation){syncPlayer();if(visit())persist();}
 if(!event.persisted)companion.release();
 if(!event.persisted)shadowLayer.release();
});
$('title').textContent=cfg.name;document.title='Soulbeast · '+cfg.name;
canvas.dataset.island=country;canvas.dataset.shadows=I.shadowCount;canvas.dataset.bandits=I.banditCount;
canvas.dataset.ruins=data.sites.length;canvas.dataset.traps=traps.list.length;
if(visit().last?.result==='lose')goHome(true);
else if(visit().pending){if(visit().pending.kind==='portal')openPortal(visit().pending);else openFrame(visit().pending.id);}
else if(online&&visit().cleared.boss&&!player.islandAccount?.active?.reward)saveThen(resumeAfterBattle,'island_boss_reward',{quiet:true});
refreshHud();requestAnimationFrame(tick);
})().catch(error=>{console.error(error);const notice=document.getElementById('notice');notice.textContent='เปิดแผนที่เกาะไม่สำเร็จ กรุณาลองโหลดใหม่';notice.hidden=false;});
