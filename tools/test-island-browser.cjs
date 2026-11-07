const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.ISLAND_PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.ISLAND_PREVIEW_URL||'http://127.0.0.1:8770';
const base=origin+'/Soulbeast/tools/island-demo',key='soulbeast-walk-preview-player-v1';

async function run(){
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:820},isMobile:true,hasTouch:true});
  page.setDefaultTimeout(10000);
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(key=>{
   if(!location.pathname.endsWith('/island-demo/index.html'))return;
   const staged=sessionStorage.getItem('island-browser-test-reload');
   if(staged){sessionStorage.setItem(key,staged);sessionStorage.removeItem('island-browser-test-reload');}
  },key);
  const root=path.resolve(__dirname,'..');
  const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8',
   '.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg'};
  await page.context().route('**/*',route=>{
   const url=new URL(route.request().url());
   if(url.origin!==origin||!url.pathname.startsWith('/Soulbeast/'))return route.abort();
   const file=path.resolve(root,decodeURIComponent(url.pathname.slice('/Soulbeast/'.length)));
   if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:''});
   return route.fulfill({path:file,contentType:mime[path.extname(file)]||'application/octet-stream'});
  });
  const profile=()=>page.evaluate(key=>JSON.parse(sessionStorage.getItem(key)),key);
  const ferryCatalog=path.join(__dirname,'island-demo','ferry-encounters.json');
  const updatingCatalog=process.argv.includes('--update-ferry-catalog');
  const go=async(country)=>{
   await page.goto(base+'/preview.html',{waitUntil:'domcontentloaded'});
   const name={blue:'เหมันตคีรี',green:'พนาสมุทร',red:'อัคนีบรรพต'}[country];
   await page.getByRole('button',{name:'ไปท่าเรือ'+name}).click();
   await page.getByRole('button',{name:'⚓ ท่าเรือ'}).click({timeout:25000});
   if(!updatingCatalog){
    const panel=page.locator('#islandFerryPreview');
    await page.waitForFunction(()=>document.querySelector('#islandFerryPreview img')?.naturalWidth>0);
    assert.match(await panel.locator('img').getAttribute('src'),new RegExp(country+'-island-ferry-v1'));
    const expected=JSON.parse(fs.readFileSync(ferryCatalog,'utf8'))[country];
    const summary=panel.locator('details > summary').first();
    const total=Object.values(expected).flat().length;
    await summary.getByText(new RegExp(total+' ชนิด')).waitFor();
    await summary.click();
    const tiers=panel.locator('.island-ferry-pools > details');
    for(const [i,names] of Object.values(expected).entries()){
     const tier=tiers.nth(i);
     await tier.locator('summary').click();
     assert.deepEqual(await tier.locator('li').allTextContents(),names);
    }
    if(process.env.ISLAND_QA_SCREENSHOTS)await page.screenshot({path:path.join(process.env.ISLAND_QA_SCREENSHOTS,country+'-ferry-qa.png')});
    await summary.click();
   }
   await page.getByRole('button',{name:/จ่าย 10,000/}).click();
   await page.locator('#world[data-island="'+country+'"][data-traps="20"][data-ruins="3"][data-bandits="8"][data-shadows="20"]').waitFor();
   await page.getByText('เขตปลอดภัย · ท่าเรือ',{exact:true}).waitFor();
   await page.locator('#world[data-scenery="ready"]').waitFor();
   const bossSprite={blue:'solar_cryostag',green:'solar_raijaku',red:'solar_pentadrake'}[country];
   await page.locator('#world[data-boss-sprite="'+bossSprite+'"]').waitFor();
   if(process.env.ISLAND_QA_SCREENSHOTS)await page.screenshot({path:path.join(process.env.ISLAND_QA_SCREENSHOTS,country+'-island-qa.png')});
  };
  const relocate=async(place)=>{
   await page.evaluate(({key,place})=>{
    const p=JSON.parse(sessionStorage.getItem(key)),visit=p.islandProgress.visit;
    const d=IslandRules.map(visit.country);
    for(const enemy of d.actors)visit.cleared[enemy.id]=true;
    if(place==='boss'){
     const boss=d.boss;
     visit.position=d.nodes.find(n=>{
      const distance=IslandRules.distance(n,boss);
      return distance>145&&distance<210&&Array.from({length:20},(_,i)=>(i+1)/20)
       .every(t=>d.walkable(boss.x+(n.x-boss.x)*t,boss.y+(n.y-boss.y)*t));
     });
     if(!visit.position)throw new Error('No visible position for the island boss chase');
    }else visit.position=place==='chest'?d.chest:d.sites[Number(place)];
    sessionStorage.setItem('island-browser-test-reload',JSON.stringify(p));
   },{key,place});
   await page.reload({waitUntil:'domcontentloaded'});
  };
  const confirmWin=async(kind)=>{
   const frame=page.frameLocator('#regionMenu');
   await frame.locator('html[data-island-encounter="'+kind+'"]').waitFor({timeout:12000});
   const units=JSON.parse(await frame.locator('html').getAttribute('data-island-units'));
   await frame.locator('html').evaluate(()=>{
    const battle=window.eval('B()');
    for(const enemy of battle.enemies)enemy.hp=0;
    window.eval("endBattle('win');render()");
   });
   await frame.getByRole('button',{name:'กลับไปเดินบนเกาะ',exact:true}).click();
   await page.locator('#regionMenu').waitFor({state:'detached'});
   return units;
  };
  const extraSpecies=['legend2_yggwarden','baihu','phoenix','kraken'];
  for(const country of ['blue','red']){
   await go(country);
   // Leave the red visit saved when the launcher jumps to a different mainland port.
   if(country==='red')break;
   const paid=(await profile()).gold;
   await page.getByRole('button',{name:/ขึ้นเรือกลับ/}).click();
   await page.getByRole('button',{name:'กลับแผนที่ประเทศ',exact:true}).click();
   await page.waitForURL(/arrival=island-port/);
   assert.equal((await profile()).gold,paid);
   if(country==='blue'){
    const old=await page.evaluate(({key,extraSpecies})=>{
     const p=JSON.parse(sessionStorage.getItem(key));
     p.islandPreviewKit=2;p.hp=123;p.items.teleportScroll=2;
     p.pets=p.pets.filter(pet=>!extraSpecies.includes(pet.sp));
     p.carried=p.carried.filter(uid=>p.pets.some(pet=>pet.uid===uid));
     sessionStorage.setItem(key,JSON.stringify(p));
     return p;
    },{key,extraSpecies});
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(key=>JSON.parse(sessionStorage.getItem(key)).islandPreviewKit===3,key);
    const upgraded=await profile();
    assert.deepEqual(upgraded.party,old.party);
    assert.deepEqual(upgraded.eq,old.eq);
    assert.equal(upgraded.hp,old.hp);
    assert.equal(upgraded.items.teleportScroll,old.items.teleportScroll);
    assert.deepEqual(upgraded.pets.slice(old.pets.length).map(pet=>pet.sp),extraSpecies);
    await page.reload({waitUntil:'domcontentloaded'});
    assert.equal((await profile()).pets.length,upgraded.pets.length);
   }
  }
  await go('green');
  await page.locator('#world[data-boss-sprite="solar_raijaku"]').waitFor();
  const initial=await profile();
  assert.equal(initial.gold,10000);
  assert(extraSpecies.every(sp=>initial.pets.some(pet=>pet.sp===sp&&pet.lv===60&&initial.carried.includes(pet.uid))));
  assert.equal(initial.cls,'sealmaster');
  const migration=await page.evaluate(key=>{
   const old=JSON.parse(sessionStorage.getItem(key));
   delete old.islandPreviewKit;
   old.cls='swordsman';old.eq={weapon:'wp_sword6'};
   const visit=old.islandProgress.visit;
   const changed=IslandPreviewProfile.upgrade(old,WalkVitals.maximum);
   return {changed,level:old.lv,previousGear:old.owned.includes('wp_sword6'),sameVisit:old.islandProgress.visit===visit,
    once:!IslandPreviewProfile.upgrade(old,WalkVitals.maximum)};
  },key);
  assert.deepEqual(migration,{changed:true,level:60,previousGear:true,sameVisit:true,once:true});
  assert.equal(Object.keys(initial.eq).length,9);
  assert(initial.pets.some(p=>initial.party.includes(p.uid)&&p.sp==='legend2_aurorion'&&p.lv===60));
  await page.locator('#hudTop').waitFor();
  await page.locator('#joystick').waitFor();
  await page.getByRole('button',{name:'ผนึกรวมร่าง'}).click();
  await page.getByRole('heading',{name:'ผนึกรวมร่าง',exact:true}).waitFor();
  await page.getByRole('button',{name:'กลับไปเดินต่อ',exact:true}).click();
  await page.getByRole('button',{name:'ผู้เล่นในพื้นที่'}).click();
  await page.getByText('โหมดทดสอบเกาะเล่นคนเดียว',{exact:true}).waitFor();
  await page.getByRole('button',{name:'กลับไปเดินต่อ',exact:true}).click();
  await page.frameLocator('#hudBottom').locator('[data-v="bag"]').click();
  await page.frameLocator('#regionMenu').locator('html').waitFor();
  await page.frameLocator('#regionMenu').locator('[data-a="go"][data-v="town"]').last().click();
  await page.locator('#regionMenu').waitFor({state:'detached'});
  await page.getByRole('button',{name:'ใช้เครื่องหอมไล่อสูร'}).click();
  await page.getByText('เครื่องหอมไล่อสูรไม่มีผลบนเกาะ',{exact:true}).waitFor();
  assert.equal((await profile()).items.beastRepellent,initial.items.beastRepellent);
  const walkKeys=await page.evaluate(()=>{
   const d=IslandRules.map('green'),n=d.nodes[2],s=d.spawn;
   return [Math.abs(n.x-s.x)>12?(n.x>s.x?'d':'a'):null,Math.abs((n.y-s.y)*IslandRules.F)>12?(n.y>s.y?'s':'w'):null].filter(Boolean);
  });
  for(const key of walkKeys)await page.keyboard.down(key);
  await page.waitForFunction(key=>{
   const visit=JSON.parse(sessionStorage.getItem(key)).islandProgress.visit;
   return IslandRules.distance(visit.position,IslandRules.map('green').spawn)>80;
  },key,{timeout:6000});
  for(const key of walkKeys)await page.keyboard.up(key);
  await page.getByRole('button',{name:'ดูแผนที่เกาะ',exact:true}).click();
  await page.getByRole('button',{name:'ปิดแผนที่'}).click();
  for(const [index,roll,label] of [[0,0,'well'],[1,.25,'portal'],[2,.5,'items']]){
   await relocate(index);
   await page.evaluate(roll=>{const explore=IslandRules.explore;IslandRules.explore=(p,c,id)=>explore(p,c,id,()=>roll);},roll);
   await page.locator('#interact').click();
   await page.locator('#dialogChoices').getByRole('button',{name:'สำรวจ',exact:true}).click();
   if(label==='well'){
    const frame=page.frameLocator('#regionMenu');
    await frame.getByRole('heading',{name:'บ่อน้ำวิญญาณ'}).waitFor();
    await frame.getByRole('button',{name:'กลับไปเดินบนเกาะ',exact:true}).click();
   }else if(label==='portal'){
    await page.getByRole('button',{name:'ยอมแพ้ ยอมตาย'}).waitFor();
    await page.getByRole('button',{name:'เปิดประตูบอส'}).click();
    const units=await confirmWin('portal');
    assert.equal(units[0].aura,'forest');
    assert(units[0].lv>=50&&units[0].lv<=60);
   }else{
    await page.getByRole('heading',{name:'กล่องไอเทม'}).waitFor();
    await page.getByRole('button',{name:'เดินต่อ',exact:true}).click();
   }
   assert.equal((await profile()).islandProgress.ruins.green['ruin-'+index],label);
  }
  await relocate('chest');
  await page.locator('#interact').click();
  await page.locator('#dialogChoices').getByRole('button',{name:'เปิดหีบ',exact:true}).click();
  await page.frameLocator('#regionMenu').getByRole('heading',{name:'เปิดหีบสมบัติแล้ว'}).waitFor();
  await page.frameLocator('#regionMenu').getByRole('button',{name:'กลับไปเดินบนเกาะ',exact:true}).click();
  assert((await profile()).islandProgress.visit.cleared.chest);
  await relocate('boss');
  const units=await confirmWin('boss');
  assert.deepEqual(units.map(u=>u.sp),['solar_raijaku','legend2_yggwarden']);
  assert.equal((await profile()).islandProgress.coupons,10);
  assert.equal((await profile()).islandProgress.clears.green,1);
  await page.goto(base+'/preview.html',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'กลับไปเกาะศิลามรกต'}).click();
  await page.locator('#world[data-island="green"]').waitFor();
  await page.evaluate(key=>{
   const p=JSON.parse(sessionStorage.getItem(key)),visit=p.islandProgress.visit;
   visit.position=IslandRules.map('green').spawn;
   sessionStorage.setItem('island-browser-test-reload',JSON.stringify(p));
  },key);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:/ขึ้นเรือกลับ/}).click();
  await page.getByRole('button',{name:'กลับแผนที่ประเทศ',exact:true}).click();
  await page.waitForURL(/arrival=island-port/);
  await page.getByRole('button',{name:'⚓ ท่าเรือ'}).click();
  await page.getByRole('button',{name:/จ่าย 10,000/}).click();
  await page.locator('#world[data-island="green"]').waitFor();
  await relocate('boss');
  const again=page.frameLocator('#regionMenu');
  await again.locator('html[data-island-encounter="boss"]').waitFor();
  const catalogue=await again.locator('html').evaluate(()=>window.eval(`(()=>{
   const cat={species:SP,affinities:walkBeastGroups.groups,classes:Object.keys(CLS).map(id=>({id,tier:tierOf(id),capacity:clsSum(id)}))};
   const forms=IslandRules.countries.every(c=>[0,.3,.5,.7,.95].every((roll,i)=>{
    const r=[0,roll,.49,.5],u=IslandRules.plan(c,{kind:'shadow',lv:53},cat,()=>r.shift())[0];
    const sp=SP[u.sp];return i<3?(sp.ev?.length||0)===i:i===3?sp.rare&&!sp.legendary:sp.legendary;
   }));
   const rewards=Object.values(EQ);
   return {shadowList:IslandRules.shadowCatalog(SP,cat.affinities),forms,loot:[rewards.some(g=>g.special&&!g.craft&&!g.legend&&!g.worldLegend),rewards.some(g=>g.craft&&!g.legend),
    rewards.some(g=>g.legend&&!g.worldLegend),rewards.some(g=>g.worldLegend)],
    sealable:B().enemies.some(e=>sealable(e)),kit:SLOTS.every(([slot])=>EQ[S.P.eq[slot]]?.legend&&EQ[S.P.eq[slot]].slot===slot)
      &&Boolean(SP[S.P.pets.find(p=>S.P.party.includes(p.uid)).sp].legendary),
      extraBeasts:['legend2_yggwarden','baihu','phoenix','kraken'].every((sp,i)=>
       S.P.pets.some(pet=>pet.sp===sp&&pet.lv===60)&&Boolean(SP[sp].rare)&&Boolean(SP[sp].legendary)===(i===0))};
  })()`));
  const {shadowList,...checks}=catalogue;
  if(updatingCatalog)fs.writeFileSync(ferryCatalog,JSON.stringify(shadowList,null,2)+'\n');
  assert.deepEqual(shadowList,JSON.parse(fs.readFileSync(ferryCatalog,'utf8')));
  assert.deepEqual(checks,{forms:true,loot:[true,true,true,true],sealable:false,kit:true,extraBeasts:true});
  const gold=(await profile()).gold;
  await confirmWin('boss');
  const repeated=await profile();
  assert.equal(repeated.gold,gold+10000);
  assert.equal(repeated.items.eternalSeal,initial.items.eternalSeal+1);
  assert.equal(repeated.islandProgress.coupons,10);
  await page.evaluate(key=>{
   const p=JSON.parse(sessionStorage.getItem(key)),visit=p.islandProgress.visit;
   visit.pending={kind:'portal',id:'ruin-9',lv:60};
   sessionStorage.setItem('island-browser-test-reload',JSON.stringify(p));
  },key);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'ยอมแพ้ ยอมตาย'}).click();
  await page.waitForURL(/town-walk-demo\/index\.html.*screen=hospital/);
  assert.equal((await profile()).islandProgress.visit,undefined);
  await go('green');
  await relocate('boss');
  const lost=page.frameLocator('#regionMenu');
  await lost.locator('html[data-island-encounter="boss"]').waitFor();
  await lost.locator('html').evaluate(()=>window.eval("endBattle('lose');render()"));
  await page.waitForURL(/town-walk-demo\/index\.html.*screen=hospital/);
  assert.equal((await profile()).islandProgress.visit,undefined);
  await page.evaluate(key=>{
   const p=JSON.parse(sessionStorage.getItem(key));p.gold=15000;sessionStorage.setItem(key,JSON.stringify(p));
  },key);
  await go('green');
  for(const kind of ['shadow','bandit']){
   const enemy=await page.evaluate(({key,kind})=>{
    const p=JSON.parse(sessionStorage.getItem(key)),visit=p.islandProgress.visit,d=IslandRules.map('green');
    const enemy=d.actors.find(a=>a.kind===kind);
    for(const actor of d.actors)visit.cleared[actor.id]=actor!==enemy;
    const prey=Array.from({length:16},(_,i)=>{
     const angle=i*Math.PI/8;
     return {x:enemy.x+175*Math.cos(angle),y:enemy.y+175*Math.sin(angle)/IslandRules.F};
    }).find(candidate=>Array.from({length:20},(_,i)=>(i+1)/20).every(t=>{
     const x=enemy.x+(candidate.x-enemy.x)*t,y=enemy.y+(candidate.y-enemy.y)*t;
     return d.walkable(x,y)&&!d.isSafe({x,y});
    }));
    if(!prey)throw new Error('No visible position for the '+kind+' chase test');
    visit.position=prey;p.walkEffects={repellentUntil:Date.now()+600000};
    sessionStorage.setItem('island-browser-test-reload',JSON.stringify(p));
    return enemy;
   },{key,kind});
   await page.reload({waitUntil:'domcontentloaded'});
   const units=await confirmWin(kind);
   assert.equal(units[0].lv,enemy.lv);
   if(kind==='bandit')assert(units[0].cls);
   else assert(units.length>=1&&units.length<=4&&units.every(unit=>unit.sp&&unit.lv===enemy.lv));
   assert.equal((await profile()).islandProgress.visit.cleared[enemy.id],true);
  }
  const beforeTeleport=await profile();
  await page.getByRole('button',{name:'ใช้ใบเทเลพอร์ต'}).click();
  const teleport=page.frameLocator('#regionMenu');
  await teleport.getByRole('heading',{name:/เลือกปลายทาง/}).waitFor();
  const destination=teleport.locator('button[data-a="selectTeleport"][data-v="'+beforeTeleport.country+'-capital"]').last();
  try{await destination.click();}
  catch(error){throw new Error('Teleport destinations for '+beforeTeleport.country+': '+await teleport.locator('main').innerText(),{cause:error});}
  await teleport.locator('button[data-a="confirmTeleport"]').click();
  await page.waitForURL(/town-walk-demo\/index\.html/);
  assert.equal((await profile()).items.teleportScroll,beforeTeleport.items.teleportScroll-1);
  assert.equal((await profile()).islandProgress.visit,undefined);
  await page.goto(origin+'/Soulbeast/tools/town-walk-demo/menu.html?screen=countrywar&walkScene=country');
  const warMap=page.locator('.cw-map');
  await warMap.waitFor();
  assert.equal(await warMap.locator('.cw-island-route').count(),3);
  assert.equal(await warMap.locator('.cw-island-pin.port').count(),3);
  assert.equal(await warMap.locator('.cw-island-pin.island').count(),3);
  assert(await warMap.locator('.cw-node').count()>0);
  await warMap.getByRole('button',{name:'เกาะศิลามรกต',exact:true}).press('Enter');
  await page.locator('#cw-island-green[open]').getByText('เดินไปที่ท่าเรือบนแผนที่ประเทศเพื่อขึ้นเรือ').waitFor();
  await warMap.getByRole('button',{name:'ท่าเรืออัคนีบรรพต',exact:true}).click();
  await page.locator('#cw-island-red[open]').waitFor();
  assert(!await page.evaluate(()=>window.eval("countryMapView([], 'selectTeleport', '').includes('cw-island-pin')")));
  assert.deepEqual(errors,[]);
  console.log('PASS mobile: war map islands and ferry pins, all ferry illustrations and encounter lists, three ports and maps, scenery atlases, ferry fare, free return and switching from a saved island visit, ruins, portal combat and surrender, chest, actual encounter pools, boss walk and flight sprites, automatic boss combat, first and repeat reward, equipped preview profile, country HUD, shadow and bandit pursuit with active repellent, 1–4 shadow opponents, and teleport.');
 }finally{await browser.close();}
}
run().catch(error=>{console.error(error);process.exitCode=1;});
