// Visual-only adapter: never changes party state or waits for network movement.
const root=new URL('../../',import.meta.url);
export function partyArt(){
 let map,cfg,props=[],art={},avatars=new Map(),boss=MineBossSprites.create(),generation=0,waterImage=null,waterPattern=null;
 const url=p=>p.startsWith(root.pathname)&&root.pathname!=='/'?new URL(p,root).href:new URL(p.replace(/^\//,''),root).href;
 function load(name,path,ticket){const im=new Image();im.onload=()=>{if(ticket===generation)art[name]=im;};im.src=url(path);}
 function setFloor(m,c){map=m;cfg=c;art={};props=[];const ticket=++generation;boss.release();boss=MineBossSprites.create();void boss.sync(m.bossModel).catch(()=>{});
 const names=['floor','water','rock','ore-cyan','ore-violet','ore-gold','tree','support','cart','waterfall','lantern','stalagmites','supplies','mushrooms','entrance','stairs','grand-chest'];
 let paths=Object.fromEntries(names.map(n=>[n,'assets/dungeon-mine-v1/'+n+'.webp']));
 if(c.theme==='desert')Object.assign(paths,{floor:'assets/dungeon-desert-v1/floor-v1.webp',rock:'assets/dungeon-desert-v1/rock-v1.webp',support:'assets/dungeon-desert-v1/ruin-v1.webp',stalagmites:'assets/dungeon-desert-v1/rock-v1.webp'});
 if(c.theme==='jungle')Object.assign(paths,JungleTheme.assets);
 Object.assign(paths,ExtendedThemes.assets(c.theme),{boss:c.bossArt,door:c.bossDoorScene,well:c.wellArt,shadow:'assets/hemant-walk-preview/shadow-beast-walk-v2.png.webp',bandit:'assets/hemant-walk-preview/forest-bandit-walk-v2.png.webp',chest:'assets/hemant-walk-preview/bandit-treasure-v1.png.webp'});
 for(const [name,path]of Object.entries(paths))if(path)load(name,path,ticket);
 if(c.theme==='jungle')props=JungleTheme.decorate(m);
 else if(['snow','castle','lava'].includes(c.theme))props=ExtendedThemes.decorate(m,c.theme);
 else for(let y=1;y<m.rows-1;y++)for(let x=1;x<m.cols-1;x++){
 if(m.grid[y][x]||![[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>m.grid[y+b]?.[x+a]))continue;
 const h=(x*73856093^y*19349663)>>>0;if(h%4===0)continue;
 const types=c.theme==='desert'?['rock','support','rock','stalagmites']:['rock','ore-cyan','ore-violet','ore-gold','mushrooms','stalagmites'];
 props.push({...m.center(x,y),name:types[h%types.length],size:145+h%85});}
 if(c.theme!=='lava')for(const fraction of [.2,.55,.83]){const p=m.river[Math.floor(m.river.length*fraction)];if(p)props.push({...p,name:'waterfall',size:235});}
 }
 function draw(ctx,w,h,focus,position,me,peers,world,local,chests,traps,time){
 if(!map)return;const s=.9,F=map.flatten,C=map.cell,screen=p=>({x:w/2+(p.x-focus.x)*s,y:h/2+(p.y-focus.y)*s*F});
 const visible=p=>{const q=screen(p);return q.x>-190&&q.x<w+190&&q.y>-80&&q.y<h+230;};
 const rx=Math.ceil(w/s/C/2)+1,ry=Math.ceil(h/s/F/C/2)+1,cx=Math.floor(focus.x/C),cy=Math.floor(focus.y/C);
 const floor=art.floor;ctx.fillStyle='#111b20';ctx.fillRect(0,0,w,h);
 for(let y=Math.max(0,cy-ry);y<=Math.min(map.rows-1,cy+ry);y++)for(let x=Math.max(0,cx-rx);x<=Math.min(map.cols-1,cx+rx);x++){
 const q=screen({x:x*C,y:y*C});if(floor)ctx.drawImage(floor,q.x,q.y,C*s+1,C*s*F+1);
 if(!map.grid[y][x]){ctx.fillStyle=cfg.theme==='jungle'?'#123a2499':cfg.theme==='snow'?'#25485d88':'#100d19b0';ctx.fillRect(q.x,q.y,C*s+1,C*s*F+1);}}
 ctx.save();ctx.lineWidth=64*s;ctx.lineJoin='round';ctx.strokeStyle=cfg.theme==='lava'?'#bc4719':'#248a9b';if(art.water){if(waterImage!==art.water){waterImage=art.water;waterPattern=ctx.createPattern(waterImage,'repeat');}waterPattern.setTransform(new DOMMatrix().translate(time*7,time*9).scale(.4));ctx.strokeStyle=waterPattern;}ctx.beginPath();map.river.forEach((p,i)=>{const q=screen(p);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y)});ctx.stroke();ctx.restore();
 const draws=[];
 const label=(p,text)=>{const q=screen(p);ctx.font='12px Tahoma';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#05121e';ctx.strokeText(text,q.x,q.y+15);ctx.fillStyle='#ffe7af';ctx.fillText(text,q.x,q.y+15);};
 function sprite(name,p,size,alpha=1){const im=art[name];if(!im)return;const q=screen(p);ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(im,q.x-size*s/2,q.y-size*s*.94,size*s,size*s);ctx.restore();}
 for(const p of props)if(visible(p))draws.push({y:p.y,run:()=>sprite(p.name,p,p.size,p.y>position.y&&Math.abs(p.x-position.x)<100&&p.y-position.y<230?.4:1)});
 for(const t of traps){if(!t.remaining&&!t.burst)continue;const q=screen(t);ctx.strokeStyle=({blast:'#ffb354',poison:'#73ee6d',fire:'#ff5d37',electric:'#db82ff',ice:'#7bdfff'})[t.type];ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(q.x,q.y,174,174*F,0,0,Math.PI*2);ctx.stroke();}
 for(const e of local.enemies.values())if(visible(e.position))draws.push({y:e.position.y,run:()=>{const im=art[e.kind==='bandit'?'bandit':'shadow'];if(!im)return;const q=screen(e.position),f=Math.floor(time*8)%8,z=(e.kind==='bandit'?135:115)*s;ctx.drawImage(im,f%4*256,Math.floor(f/4)*256,256,256,q.x-z/2,q.y-z*.92,z,z);}});
 const bp=local.boss||world.bossPosition||map.boss;
 if(world.boss!=='defeated'&&visible(bp))draws.push({y:bp.y,run:()=>{const q=screen(bp);if(boss.current)boss.draw(ctx,q.x,q.y,Math.min(cfg.bossSize||260,330)*s,2,time,!!world.doorOpen);else sprite('boss',bp,250);label(bp,cfg.bossName);}});
 const gate=map.rooms.find(r=>r.id==='boss').gate;
 if(!world.doorOpen)draws.push({y:gate.y,run:()=>{sprite('door',gate,290);label(gate,'ประตูห้องบอส');}});
 for(const [p,n,z,text]of [[map.exit,'entrance',230,'ทางออก'],[map.stairs,'stairs',300,'ชั้นถัดไป'],[map.mini,'well',330,'บ่อน้ำศักดิ์สิทธิ์']])if(visible(p))draws.push({y:p.y,run:()=>{sprite(n,p,z);label(p,text);}});
 for(const c of map.chests)if(visible(c))draws.push({y:c.y,run:()=>{sprite(c.big?'grand-chest':'chest',c,c.big?200:88,chests?.[c.id]?.4:1);if(chests?.[c.id])label(c,'เปิดแล้ว');}});
 function person(p,m){if(m?.exploring===false||!visible(p))return;const key=m?.code||'self';let a=avatars.get(key);if(!a){a=sealerSprites.create();avatars.set(key,a);}void a.sync(m||{cls:'swordsman',gender:'male'}).catch(()=>{});draws.push({y:p.y,run:()=>{const q=screen(p);a.draw(ctx,q.x,q.y,145*s,p.dir||0,p.phase||0,!!p.moving);label({...p,y:p.y-155},m?.name||'ผู้ผนึก');}});}
 for(const p of peers.values())person(p,p.member);person(position,me);
 draws.sort((a,b)=>a.y-b.y);for(const d of draws)d.run();
 ExtendedThemes.weather(ctx,w,h,time,cfg.theme);
 }
 return {setFloor,draw};
}
