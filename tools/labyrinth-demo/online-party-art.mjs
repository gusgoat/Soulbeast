// Visual-only adapter: never changes party state or waits for network movement.
const root=new URL('../../',import.meta.url);
export function partyArt(){
 let map,cfg,props=[],environment=[],art={},avatars=new Map(),boss=MineBossSprites.create(),generation=0,waterImage=null,waterPattern=null,shadeCache=null;
 let groundTiles=null;
 const url=p=>p.startsWith(root.pathname)&&root.pathname!=='/'?new URL(p,root).href:new URL(p.replace(/^\//,''),root).href;
 function load(name,path,ticket){const im=new Image();im.onload=()=>{if(ticket===generation)art[name]=im;};im.src=url(path);}
 function setFloor(m,c){map=m;cfg=c;art={};props=[];groundTiles?.release();groundTiles=null;shadeCache=null;const ticket=++generation;
 // The solo scenery planner carves decorative niches. Keep those edits on a visual copy.
 environment=LivingEnvironment.dungeonMap({...m,grid:m.grid.map(row=>row.slice())}).environmentPlan;
 void LivingEnvironment.ready(environment.filter(o=>!o.key.startsWith('native:')).map(o=>o.key));
 boss.release();boss=MineBossSprites.create();void boss.sync(m.bossModel).catch(()=>{});
 const names=['floor','water','rock','ore-cyan','ore-violet','ore-gold','tree','support','cart','waterfall','lantern','stalagmites','supplies','mushrooms','entrance','stairs','grand-chest'];
 let paths=Object.fromEntries(names.map(n=>[n,'assets/dungeon-mine-v1/'+n+'.webp']));
 if(c.theme==='desert')Object.assign(paths,{floor:'assets/dungeon-desert-v1/floor-v1.webp',rock:'assets/dungeon-desert-v1/rock-v1.webp',support:'assets/dungeon-desert-v1/ruin-v1.webp',stalagmites:'assets/dungeon-desert-v1/rock-v1.webp'});
 if(c.theme==='jungle')Object.assign(paths,JungleTheme.assets);
 Object.assign(paths,ExtendedThemes.assets(c.theme),{boss:c.bossArt,door:c.bossDoorArt,well:c.wellArt,shadow:'assets/hemant-walk-preview/shadow-beast-walk-v2.png.webp',bandit:'assets/hemant-walk-preview/forest-bandit-walk-v2.png.webp',chest:'assets/hemant-walk-preview/bandit-treasure-v1.png.webp'});
 for(const [name,path]of Object.entries(paths))if(path)load(name,path,ticket);
 if(c.theme==='jungle')props=JungleTheme.decorate(m);
 else if(['snow','castle','lava'].includes(c.theme))props=ExtendedThemes.decorate(m,c.theme);
 else{for(let y=1;y<m.rows-1;y++)for(let x=1;x<m.cols-1;x++){if(m.grid[y][x]!==0)continue;const h=(x*73856093^y*19349663)>>>0,edge=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>m.grid[y+dy]?.[x+dx]===1);if(!edge||h%4===0)continue;const types=c.theme==='desert'?['rock','rock','support','rock','stalagmites','rock','support','rock','rock']:['rock','ore-cyan','rock','ore-violet','stalagmites','ore-gold','mushrooms','rock','tree'];props.push({...m.center(x,y),name:types[h%types.length]==='tree'&&h%5!==0?'rock':types[h%types.length],size:145+h%85})}
for(const r of m.rooms)for(let x=r.x0;x<=r.x1;x+=2)props.push({...m.center(x,r.y0),y:r.y0*m.cell+30,name:c.theme==='desert'?(x%3?'rock':'support'):x%3?'ore-cyan':'ore-violet',size:140});
for(const c of m.cells){const h=(c.cx*127+c.cy*991)%119;if(h===0)props.push({...c,x:c.x-55,name:'lantern',size:100});if(h===3)props.push({...c,name:'support',size:235});if(h===7)props.push({...c,x:c.x+60,name:c.theme==='desert'?'supplies':'cart',size:92})}
}
for(let i=props.length-1;i>=0;i--){const o=props[i];if(c.theme==='castle'&&['library-10-45','dining-30-43','dining-30-17'].includes(o.group)){props.splice(i,1);continue}if(!m.roomAt(o)&&m.grid[Math.floor(o.y/m.cell)]?.[Math.floor(o.x/m.cell)]===1&&['cart','support','supplies'].includes(o.name))props.splice(i,1)}
 if(c.theme!=='lava')for(const fraction of [.2,.55,.83]){const p=m.river[Math.floor(m.river.length*fraction)];if(p)props.push({...p,name:'waterfall',size:235});}
 }
 function draw(ctx,w,h,focus,position,me,peers,world,local,chests,traps,time){
 if(!map)return;const s=.9,F=map.flatten,C=map.cell,screen=p=>({x:w/2+(p.x-focus.x)*s,y:h/2+(p.y-focus.y)*s*F});
 const visible=p=>{const q=screen(p);return q.x>-190&&q.x<w+190&&q.y>-80&&q.y<h+230;};
 ctx.fillStyle='#111b20';ctx.fillRect(0,0,w,h);
 if(!groundTiles&&art.floor&&art.water){
  const ground=DungeonGround.paint(map,cfg.theme,art);
  groundTiles=CountryRenderBudget.groundTiles(ground,()=>document.createElement('canvas'));
  ground.width=ground.height=1;
 }
 groundTiles?.draw(ctx,{left:focus.x-w/(2*s),right:focus.x+w/(2*s),top:focus.y*F-h/(2*s),bottom:focus.y*F+h/(2*s)},x=>screen({x,y:0}).x,y=>screen({x:0,y}).y,s,F);
 for(const room of map.rooms)if(room.secret||(room.id==='boss'&&world.doorOpen)||(room.id==='treasure'&&world.boss==='defeated')){
  const q=screen(room.gate);if(art.floor)ctx.drawImage(art.floor,q.x-C*s/2,q.y-C*s*F/2,C*s,C*s*F);
 }
 ctx.save();ctx.lineWidth=64*s;ctx.lineJoin='round';ctx.strokeStyle=cfg.theme==='lava'?'#bc4719':'#248a9b';if(art.water){if(waterImage!==art.water){waterImage=art.water;waterPattern=ctx.createPattern(waterImage,'repeat');}waterPattern.setTransform(new DOMMatrix().translate(time*7,time*9).scale(.4));ctx.strokeStyle=waterPattern;}ctx.beginPath();map.river.forEach((p,i)=>{const q=screen(p);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y)});ctx.stroke();ctx.restore();
 const draws=[];
 const label=(p,text)=>{const q=screen(p);ctx.font='12px Tahoma';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#05121e';ctx.strokeText(text,q.x,q.y+15);ctx.fillStyle='#ffe7af';ctx.fillText(text,q.x,q.y+15);};
 function sprite(name,p,size,alpha=1){const im=art[name];if(!im)return;const q=screen(p);ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(im,q.x-size*s/2,q.y-size*s*.94,size*s,size*s);ctx.restore();}
 for(const p of props)if(visible(p))draws.push({y:p.y,run:()=>{
  const q=screen(p),size=p.size*s;
  if(p.name.startsWith('ore')||/lantern|lamp|candles/.test(p.name)){
   const glow=ctx.createRadialGradient(q.x,q.y-size*.35,0,q.x,q.y-size*.35,size*.55);
   glow.addColorStop(0,p.name==='ore-cyan'?'#25c2e24d':p.name==='ore-violet'?'#954be44d':'#ffb54f40');glow.addColorStop(1,'transparent');
   ctx.fillStyle=glow;ctx.fillRect(q.x-size,q.y-size,size*2,size*1.5);
  }
  if(p.name==='lava-pool'&&art.water)LiquidEffects.lavaPool(ctx,q.x,q.y,size,time,art.water);
  else if(p.name==='vines'&&cfg.theme==='jungle')JungleTheme.vines(ctx,q.x,q.y,size,time);
  else sprite(p.name,p,p.size,p.y>position.y&&Math.abs(p.x-position.x)<100&&p.y-position.y<230?.4:1);
  if(p.name==='waterfall'&&art.waterfall)LiquidEffects.waterfall(ctx,q.x,q.y,size,time);
  if(p.name==='castle-well')LiquidEffects.well(ctx,q.x,q.y,size,time,cfg.theme);
 }});
 for(const prop of environment)if(visible(prop))draws.push({y:prop.y,run:()=>{
  const q=screen(prop);
  if(prop.key.startsWith('native:'))sprite(prop.key.slice(7),prop,prop.w);
  else LivingEnvironment.draw(ctx,prop,q.x,q.y,s,time,position);
 }});
 for(const t of traps){
  if(!t.remaining&&!t.burst)continue;
  // screen() already flattens Y, just like nav.distance(). Only camera zoom
  // applies to the blast radius in these projected units.
  const q=screen(t),radius=DungeonTraps.RADIUS*s,color=DungeonTraps.types[t.type]?.color||'#ffb354';
  ctx.save();ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=3;
  ctx.beginPath();ctx.arc(q.x,q.y,radius,0,Math.PI*2);
  ctx.globalAlpha=t.burst ? .35 : .1;ctx.fill();ctx.globalAlpha=1;ctx.stroke();
  ctx.restore();
 }
 for(const e of local.enemies.values())if(visible(e.position))draws.push({y:e.position.y,run:()=>{const im=art[e.kind==='bandit'?'bandit':'shadow'];if(!im)return;const q=screen(e.position),f=e.moving?Math.floor(e.phase||0)%8:0,z=(e.kind==='bandit'?135:115)*s;ctx.save();ctx.translate(q.x,q.y);ctx.scale(e.facing||1,1);ctx.drawImage(im,f%4*256,Math.floor(f/4)*256,256,256,-z/2,-z*.92,z,z);ctx.restore();}});
 const guard=local.boss;
 const bp=guard?.position||world.bossPosition||map.boss;
 const dir=guard?.dir??(world.bossPosition?((world.bossDir||0)+6)%8:0);
 const moving=world.doorOpen&&world.boss==='guarding'&&(guard?.moving??world.bossMoving);
 if(world.boss!=='defeated'&&visible(bp))draws.push({y:bp.y,run:()=>{
  const q=screen(bp);
  if(boss.current)boss.draw(ctx,q.x,q.y,Math.min(cfg.bossSize||260,330)*s,dir,time,!!moving);
  else sprite('boss',bp,125);
  label(bp,cfg.bossName);
 }});
 const gate=map.rooms.find(r=>r.id==='boss').gate;
 if(!world.doorOpen)draws.push({y:gate.y,run:()=>{sprite('door',gate,290);label(gate,'ประตูห้องบอส');}});
 for(const [p,n,z,text]of [[map.exit,'entrance',230,'ทางออก'],[map.stairs,'stairs',300,'ชั้นถัดไป'],[map.mini,'well',cfg.wellSize||330,'บ่อน้ำศักดิ์สิทธิ์']])if(visible(p))draws.push({y:p.y,run:()=>{sprite(n,p,z,n==='stairs'&&world.boss!=='defeated'?.58:1);if(n==='well'&&art.well){const q=screen(p);LiquidEffects.well(ctx,q.x,q.y,z*s,time,cfg.theme);}label(p,text);}});
 for(const c of map.chests)if(visible(c))draws.push({y:c.y,run:()=>{sprite(c.big?'grand-chest':'chest',c,c.big?200:88,chests?.[c.id]?.4:1);if(chests?.[c.id])label(c,'เปิดแล้ว');}});
 function person(p,m){if(m?.exploring===false||!visible(p))return;const key=m?.code||'self';let a=avatars.get(key);if(!a){a=sealerSprites.create();avatars.set(key,a);}void a.sync(m||{cls:'swordsman',gender:'male'}).catch(()=>{});draws.push({y:p.y,run:()=>{const q=screen(p);a.draw(ctx,q.x,q.y,145*s,p.dir||0,p.phase||0,!!p.moving);label({...p,y:p.y-155},m?.name||'ผู้ผนึก');}});}
 for(const p of peers.values())person(p,p.member);person(position,me);
 draws.sort((a,b)=>a.y-b.y);for(const d of draws)d.run();
 if(!shadeCache||shadeCache.w!==w||shadeCache.h!==h){
 const shade=ctx.createRadialGradient(w/2,h*.52,Math.min(w,h)*.2,w/2,h*.5,Math.max(w,h)*.75);
 shade.addColorStop(0,'transparent');shade.addColorStop(1,cfg.theme==='jungle'?'#0c331a55':cfg.theme==='desert'?'#6a351a22':'#020910a3');
 shadeCache={w,h,shade};
 }
 ctx.fillStyle=shadeCache.shade;ctx.fillRect(0,0,w,h);
 ExtendedThemes.weather(ctx,w,h,time,cfg.theme);
 }
 return {setFloor,draw};
}
