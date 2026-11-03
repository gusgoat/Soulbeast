/* Inserted inside the original game's bootstrap lexical scope by build-town-menu.cjs. */
const previewEncounter=params.get('encounter'),previewKey='soulbeast-walk-preview-player-v1';
try{const stored=JSON.parse(sessionStorage.getItem(previewKey)||'null');if(stored&&Number.isFinite(stored.lv)&&stored.lv>=1&&stored.pets&&stored.cls&&CLS[stored.cls])S.P=stored}catch{}
save=()=>{try{sessionStorage.setItem(previewKey,JSON.stringify(S.P))}catch{}};
/* WALK_GAMEPLAY */
const cityProfile=window.townProfiles?.get(params.get('city'));
if(cityProfile&&(!cityProfile.capital||cityProfile.country)){
 const cityShop=vShop,cityHospital=vHospital,cityForge=vForge;
 vShop=()=>cityShop().replaceAll('ตลาดช่างตีเหล็ก · เตรียมอุปกรณ์ก่อนออกผจญภัย',cityProfile.shop).replace('<h2>ร้านค้า</h2>','<h2>'+esc(cityProfile.shop)+'</h2>');
 vHospital=()=>cityHospital().replaceAll('โรงพยาบาลวิหารขาว',cityProfile.hospital).replaceAll('วิหารขาว',cityProfile.hospital);
 vForge=()=>cityForge().replaceAll('โรงหลอมเทพอสูร',cityProfile.forge);
 const cityRender=render;render=function(...args){const out=cityRender(...args);const where=document.querySelector('.who small');if(where)where.textContent='Lv '+S.P.lv+' · '+cityProfile.name;return out};
}
let encounterSent=false;
function finishPreviewEncounter(){const result=B()?.over?.res;if(!result||encounterSent)return;encounterSent=true;save();parent.postMessage({type:'country-encounter-result',result},location.origin)}
function applyDungeonBossAura(unit){if(unit.dungeonBoss)return unit;unit.dungeonBoss=true;unit.boss=true;unit.bossAura=true;unit.bossAuraVersion='dungeon-v1';for(const k of ['patk','matk'])unit.st[k]=Math.round(unit.st[k]*1.8);for(const k of ['hp','pdef','mdef'])unit.st[k]=Math.round(unit.st[k]*2.2);unit.st.spd=Math.round(unit.st.spd*1.25);unit.hp=unit.st.hp;unit.mp=unit.st.mp;return unit}
/* DUNGEON_PARTY */
const dungeonFloor=window.MineFloors?.byId(params.get('dungeon'))||(params.get('dungeon')==='mine-floor-1'?{floor:1,rest:true,name:'เหมืองสายแร่',boss:'wendigo',bossName:'เวนดิโกหิวโหย',bossLevel:15,bossForm:1,helper:'demon_knight',helperName:'อัศวินปีศาจ',helperLevel:10,mini:'cyclops',miniName:'ผู้เฝ้าสายแร่',miniLevel:0}:null);
const mineBoss=!!dungeonFloor&&(previewEncounter==='mine-boss'||previewEncounter==='mine-mini'&&!dungeonFloor.rest);
if(['shadow','bandit'].includes(previewEncounter)||mineBoss){
 S.zone=null;
 const catalog={zones:ZN,species:SP,classes:Object.keys(CLS).map(id=>({id,tier:tierOf(id),capacity:Math.min(3,clsSum(id))}))};
 const plan=mineBoss?(previewEncounter==='mine-boss'?{kind:'wild',zoneId:1,zoneIds:[1],units:[{type:'boss',sp:dungeonFloor.boss,lv:dungeonFloor.bossLevel},...Array.from({length:3},()=>({type:'helper',sp:dungeonFloor.helper,lv:dungeonFloor.helperLevel}))]}:{kind:'wild',zoneId:1,zoneIds:[1],units:[{type:'wild',sp:dungeonFloor.mini,lv:dungeonFloor.miniLevel||Math.max(5,S.P.lv+2)}]}):dungeonFloor?window.DungeonEncounterRules.plan(S.P,previewEncounter,catalog,dungeonFloor,Math.random):window.hemantEncounterRules.plan(S.P,previewEncounter,catalog,Math.random,dungeonFloor?.encounterCountry||(dungeonFloor?.floor===2?'red':params.get('country')||cityProfile?.country||null));
 if(dungeonFloor?.floor===2||dungeonFloor?.battleZone){plan.zoneId=dungeonFloor.battleZone||3;plan.zoneIds=[plan.zoneId]}
 const enemies=plan.units.map((u,i)=>{if(u.type==='human')return humanUnit(pick(BANDITS),u.cls,u.lv,i);const unit=wildUnit(u.sp,u.lv,i);if(dungeonFloor&&previewEncounter==='shadow')applyDungeonShadowAura(unit);if(mineBoss){unit.mineGuardian=true;if(previewEncounter==='mine-mini')unit.name=dungeonFloor.miniName;if(u.type==='helper'&&dungeonFloor.helperForm!=null){const form={sp:u.sp,lv:u.lv,form:dungeonFloor.helperForm,pts:{}};unit.evo=form.form;unit.st=calcPet(form,1.1);unit.hp=unit.st.hp;unit.mp=unit.st.mp;unit.skills=petSkills(form);unit.atkType=unit.st.patk>=unit.st.matk?'p':'m'}if(u.type==='boss'||previewEncounter==='mine-mini'){if(dungeonFloor.floor===3&&u.type==='boss'){const form={sp:u.sp,lv:u.lv,form:dungeonFloor.bossForm,pts:{}};unit.st=calcPet(form,1.1);unit.hp=unit.st.hp;unit.mp=unit.st.mp;unit.skills=petSkills(form);unit.atkType=unit.st.patk>=unit.st.matk?'p':'m'}applyDungeonBossAura(unit);if(u.type==='boss'){unit.evo=dungeonFloor.bossForm;unit.name=dungeonFloor.bossName}}if(u.type==='helper'){unit.bossHelper=true;unit.dungeonMinion=true;unit.name=dungeonFloor.helperName}}if(u.type==='pet'){unit.kind='npcpet';unit.name+='ของโจร'}return unit});
 if(previewEncounter==='mine-boss'&&mineBoss){const mineBattleView=vBattle;vBattle=function(...args){return '<section class="card" style="border-color:#80dfff;box-shadow:0 0 20px #60d8ff33"><b>'+dungeonFloor.bossName+' · ออร่าบอส</b><br><small>ออร่าดันเจี้ยน: โจมตี +80% · HP/ป้องกัน +120% · เร็ว +25% · ผนึกไม่ได้<br>สมุน'+dungeonFloor.helperName+' Lv '+dungeonFloor.helperLevel+' จำนวน 3 ตัว</small></section>'+mineBattleView(...args)}}
 if(dungeonFloor?.battleScene){const sceneResolve=BattleScenery.resolve;BattleScenery.resolve=function(b,...args){const result=sceneResolve.call(this,b,...args);return {...result,key:dungeonFloor.battleScene,art:dungeonFloor.battleArt,label:dungeonFloor.name}}}
 startBattle(enemies,plan.kind,plan.zoneId);render();
 document.documentElement.dataset.encounterKind=previewEncounter;
 document.documentElement.dataset.encounterZone=plan.zoneId;
 document.documentElement.dataset.encounterPool=plan.zoneIds.join(',');
 document.documentElement.dataset.encounterUnits=JSON.stringify(plan.units);
 document.documentElement.dataset.playerLevel=S.P.lv;
 const baseEnd=endBattle;endBattle=function(...args){const out=baseEnd(...args);if(B()?.over){save();back.disabled=false;back.textContent=B().over.res==='lose'?'ไปโรงพยาบาลในเมืองหลวง':(dungeonFloor?'กลับ'+dungeonFloor.name:'กลับแผนที่ประเทศ')}return out};
 back.disabled=true;back.textContent='กำลังต่อสู้';back.onclick=finishPreviewEncounter;
 document.addEventListener('click',e=>{if(e.target.closest('[data-a="bt"][data-v="done"]')&&B()?.over){e.preventDefault();e.stopImmediatePropagation();finishPreviewEncounter()}},true);
}else{
 if(screen==='chat'){
  vFriends=()=>'<section class="stack"><h2>แชทโลก</h2><p class="sub">สนทนากับผู้ผนึกทั่วอาณาจักร</p><section class="card stack" role="log" aria-label="ข้อความแชทโลก"><p>ยังไม่เชื่อมต่อแชทโลกในฉากทดลอง</p><small>เมื่อเชื่อมระบบออนไลน์ จะแสดงข้อความจากผู้เล่นที่นี่</small></section><label>ข้อความ<input placeholder="ข้อความถึงผู้ผนึกทั่วโลก" disabled></label><button class="btn" disabled>ส่งข้อความ</button></section>';
  S.screen='friends';
 }
 if(screen==='replay'){
  handlers.storyScene=value=>{const [id,phase]=String(value).split(':'),z=ZN.find(z=>z.id===Number(id)),after=phase==='after';if(z&&(after?forestPassed(z):forestUnlocked(z.id)))openCinema(z.id,after,'story')};
  vStory=()=>S.ui.cinema?cinemaView():'<section class="stack"><h2>รับชมคลิปเนื้อเรื่องย้อนหลัง</h2><p>เลือกคลิปก่อนเข้าด่านหรือหลังชนะบอส ตามความคืบหน้าของผู้ผนึก</p>'+FOREST_ORDER.map(id=>{const z=ZN.find(z=>z.id===id);return '<article class="card stack"><h3>'+esc(z.n)+'</h3>'+[false,true].map(after=>{const open=after?forestPassed(z):forestUnlocked(id),phase=after?'after':'before',title=after?'หลังชนะบอส':'ก่อนเข้าด่าน';return '<button class="story-cover story-teaser" data-a="storyScene" data-v="'+id+':'+(after?'after':'')+'" '+(open?'':'disabled')+'><img src="assets/video/forest-story/zone-'+id+'-'+phase+'.webp" alt=""><span>'+title+(open?' · รับชมคลิป':' · ยังไม่ปลดล็อก')+'</span></button>'}).join('')+'</article>'}).join('')+'</section>';
  S.screen='story';
 }
 if(['story','replay'].includes(screen)){
  const storyView=vStory;
  vStory=()=>{const html=storyView(),button='<button class="btn" data-a="go" data-v="town">กลับฉากเดิน</button>';return /<h2[^>]*>.*?<\/h2>/.test(html)?html.replace(/(<h2[^>]*>.*?<\/h2>)/,'$1'+button):button+html};
  back.textContent='กลับฉากเดิน';
 }
 // Re-render with the shared preview player, preserving progress across forest trips and hospital visits.
 render();
 const baseEnd=endBattle;endBattle=function(...args){const out=baseEnd(...args);save();return out};
 back.onclick=()=>{save();parent.postMessage({type:'town-return'},location.origin)};
}
save();
