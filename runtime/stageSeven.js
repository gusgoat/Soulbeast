// Stage 7: post-demon forest and single-claim secret.
// @soulbeast-unit 1096-stageSeven
const STAGE_SEVEN=8;
const stageSevenPools={entry:['gargoyle','golem','cerberus','obsidian_scarab'],crypt:['wisp','jiangshi','jorogumo','frost_lich','vampire_queen'],hall:['dragon','nue','wendigo','fallen_seraph','abyss_emperor']};
ZN.push({id:8,n:'ป่าทมิฬพันธนาการ · ด่าน 7',d:'เมื่อจอมมารล่มสลาย ประตูหลังบัลลังก์เผยป่าเหล็กดำ เฟอร์รอธและมอร์ทิวาร์ยังคงรวบรวมวิญญาณไว้ในป้อมนิรันดร์ จงปลดพันธนาการที่เหลืออยู่',lv:[55,60],sp:Object.values(stageSevenPools).flat().filter(k=>!SP[k].rare),rare:Object.values(stageSevenPools).flat().filter(k=>SP[k].rare),boss:{sp:'solar_ferroth',lv:60,n:'เฟอร์รอธ และมอร์ทิวาร์'},mini:2,stageSeven:true});
const stageSevenEvents={},stageSeven_tune={heal:.4,physical:.1,purge:false};
SK.audit_repair={n:'ซ่อมเกราะพันธนาการ',t:'buff',tg:'self',bf:{},mp:16,cd:4};SK.audit_warn={n:'เตรียมท่าใหญ่',t:'buff',tg:'self',bf:{},mp:0};
var stageSeven_oldAI=aiChoose,stageSeven_oldAct=act,stageSeven_oldHurt=hurt,stageSeven_oldEff=eff,stageSeven_oldEnd=endUnitTurn;
function stageSeven_inDuo(){return B()?.kind==='boss'&&B().meta===8;}
hurt=function(u,d,c){if(stageSeven_inDuo()&&u.auditShield>0){const used=Math.min(d,u.auditShield);u.auditShield-=used;d-=used;stageSevenEvents.absorbed=(stageSevenEvents.absorbed||0)+used;}return stageSeven_oldHurt(u,d,c);};
endUnitTurn=function(u){const v=stageSeven_oldEnd(u);if(u.auditShieldTurns>0&&--u.auditShieldTurns===0)u.auditShield=0;return v;};
aiChoose=function(u){if(!stageSeven_inDuo()||!u.boss)return stageSeven_oldAI(u);const target=foesOf(u).find(x=>x.hp>0),sig=SP[u.sp].sig;
 if(u.auditPending){if(B().auditUltimateRound===B().round)return ['attack',target];return [sig,target];}
 const ferro=B().enemies.find(x=>x.sp==='solar_ferroth'&&x.hp>0);
 if(u.sp==='solar_mortivar'&&ferro&&!ferro.auditShield&&!cooldownOf(u,'audit_repair')&&u.mp>=16)return ['audit_repair',target,u];
 if(!cooldownOf(u,sig)&&u.mp>=costOf(u,SK[sig]))return ['audit_warn',target,u];
 const skills=u.skills;u.skills=skills.filter(k=>k!==sig);try{return stageSeven_oldAI(u);}finally{u.skills=skills;}
};
act=function(u,id,...args){const duo=stageSeven_inDuo()&&u.boss,ferro=duo?B().enemies.find(x=>x.sp==='solar_ferroth'&&x.hp>0):null;
 const ok=stageSeven_oldAct(u,id,...args);if(ok&&duo){if(id==='audit_repair'&&ferro){ferro.auditShield=Math.round(ferro.st.hp*.08);ferro.auditShieldTurns=2;stageSevenEvents.repairs=(stageSevenEvents.repairs||0)+1;}if(id==='audit_warn'){u.auditPending=true;stageSevenEvents.warnings=(stageSevenEvents.warnings||0)+1;}if(id===SP[u.sp].sig){u.auditPending=false;B().auditUltimateRound=B().round;stageSevenEvents.ultimates=(stageSevenEvents.ultimates||0)+1;}}return ok;};

var stageSeven_tuneHeal=heal,stageSeven_tuneHurt=hurt,stageSeven_tuneEnd=endUnitTurn,stageSeven_tuneFactor=classCombatFactor;
classCombatFactor=function(u,t,sk){let v=stageSeven_tuneFactor(u,t,sk);if(stageSeven_inDuo()&&u.boss&&u.side==='enemy'&&['solar_ferroth','solar_mortivar'].includes(u.sp)&&t.side==='ally'&&['pet','npcpet','summon','beast'].includes(t.kind))v*=1.5;const type=sk.t==='auto'?u.atkType:sk.t;if(stageSeven_tune.physical&&stageSeven_inDuo()&&t.boss&&type==='p'&&B().enemies.some(x=>x.sp==='solar_ferroth'&&x.hp>0))v*=1-stageSeven_tune.physical;return v;};
endUnitTurn=function(u){const v=stageSeven_tuneEnd(u);if(stageSeven_tune.purge&&stageSeven_inDuo()&&u.sp==='solar_mortivar'&&u.hp>0&&B().round%3===0){for(const t of B().allies.filter(x=>x.hp>0))t.buffs=(t.buffs||[]).filter(b=>!(b.amt>0));}if(stageSeven_tune.decay&&stageSeven_inDuo()&&u.side==='ally'&&u.hp>0&&B().round>=5&&B().enemies.some(x=>x.sp==='solar_mortivar'&&x.hp>0))stageSeven_tuneHurt(u,Math.round(u.st.hp*stageSeven_tune.decay));return v;};
heal=function(u,a){if(stageSeven_inDuo()&&u.side==='ally'&&B().enemies.some(x=>x.sp==='solar_mortivar'&&x.hp>0))a*=stageSeven_tune.heal||1;return stageSeven_tuneHeal(u,a);};
hurt=function(u,d,c){if(stageSeven_inDuo()&&u.boss&&B().enemies.some(x=>x.sp==='solar_ferroth'&&x.hp>0))d*=1-(stageSeven_tune.ward||0);return stageSeven_tuneHurt(u,d,c);};
SK.audit_ferro_devour={n:'กินอสูร',t:'buff',tg:'self',bf:{},mp:6,cd:3};
SK.audit_morti_veil={n:'ม่านวิญญาณบางเบา',t:'buff',tg:'self',bf:{mdef:.05},tn:2,mp:6,cd:3};
function stageSeven_devourTargets(u){return foesOf(u).filter(x=>x.side==='ally'&&x.hp>0&&['pet','npcpet','summon','beast'].includes(x.kind)).sort((a,b)=>a.hp-b.hp||a.id.localeCompare(b.id));}
var stageSeven_minorBaseAI=aiChoose,stageSeven_minorBaseAct=act,stageSeven_devourActBase=actBase;
aiChoose=function(u){
 if(stageSeven_inDuo()&&u.boss&&!u.auditPending){
  const id=u.sp==='solar_ferroth'?'audit_ferro_devour':u.sp==='solar_mortivar'?'audit_morti_veil':null;
  const phase=u.sp==='solar_ferroth'?2:0;
  if(id&&B().round>0&&B().round%3===phase&&!cooldownOf(u,id)&&u.mp>=costOf(u,SK[id])&&(id!=='audit_ferro_devour'||stageSeven_devourTargets(u).length>1))return [id,u,u];
 }
 return stageSeven_minorBaseAI(u);
};
actBase=function(u,id,...args){
 if(id!=='audit_ferro_devour')return stageSeven_devourActBase(u,id,...args);
 if(!stageSeven_inDuo()||!u.boss||u.side!=='enemy'||u.sp!=='solar_ferroth'||u.hp<=0)return false;
 const targets=stageSeven_devourTargets(u);if(targets.length<=1)return false;
 const ok=stageSeven_devourActBase(u,id,...args);if(!ok)return false;
 const target=targets[0];target.hp=0;
 const restored=heal(u,u.st.hp*.1);stageSevenEvents.devoured=(stageSevenEvents.devoured||0)+1;stageSevenEvents.devourHeal=(stageSevenEvents.devourHeal||0)+restored;
 blog(u.name+' กิน '+target.name+' และฟื้น HP '+restored);return true;
};
act=function(u,id,...args){const ok=stageSeven_minorBaseAct(u,id,...args);if(ok&&stageSeven_inDuo()&&u.boss&&['audit_ferro_devour','audit_morti_veil'].includes(id))events[id]=(events[id]||0)+1;return ok;};

var stageSeven_helperlessContext=null,stageSeven_helperlessEffBase=eff,stageSeven_helperlessHitBase=hitOne,stageSeven_helperlessScoreBase=combatSkillScore;
function stageSeven_withHelperlessContext(u,sk,fn){const prev=stageSeven_helperlessContext;stageSeven_helperlessContext={u,sk};try{return fn();}finally{stageSeven_helperlessContext=prev;}}
function stageSeven_helperlessMdefApplies(t){const c=stageSeven_helperlessContext;if(!c||!stageSeven_inDuo()||!t.boss||t.side!=='enemy'||!['solar_ferroth','solar_mortivar'].includes(t.sp))return false;const u=c.u,sk=c.sk,type=sk.t==='auto'?u.atkType:sk.t;return u.kind==='player'&&u.side==='ally'&&!u.temporary&&sk!==SK.attack&&sk._pvpId!=='attack'&&['m','h'].includes(type);}
eff=function(u,k){const v=stageSeven_helperlessEffBase(u,k);return k==='mdef'&&stageSeven_helperlessMdefApplies(u)?v*.8:v;};
hitOne=function(u,sk,...args){return stageSeven_withHelperlessContext(u,sk,()=>stageSeven_helperlessHitBase(u,sk,...args));};
combatSkillScore=function(u,id,...args){return stageSeven_withHelperlessContext(u,pvpSkill(id)||{},()=>stageSeven_helperlessScoreBase(u,id,...args));};

const stageSevenBoss=handlers.boss;handlers.boss=function(...args){if(S.zone?.id!==8)return stageSevenBoss(...args);if(S.P.hp<=0||S.battle||S.zone.depth<ZDEPTH)return;const es=['solar_ferroth','solar_mortivar'].map((sp,i)=>{const u=wildUnit(sp,60,i,SP[sp].n);u.noseal=true;u.r=0;return u;});for(const sp of ['legend2_myriapod','legend2_tricephalos']){const u=wildUnit(sp,40,es.length);u.bossHelper=true;u.noseal=true;u.r=0;es.push(u);}zlog('เผชิญหน้าเฟอร์รอธและมอร์ทิวาร์ พร้อมสมุนสองตน');startBattle(es,'boss',8);save();render();};
const stageSevenGroup=wildGroup;wildGroup=function(z,ns){if(z.id!==8)return stageSevenGroup(z,ns);const depth=S.zone?.depth||1,key=depth<=3?'entry':depth<=6?'crypt':'hall',pool=stageSevenPools[key],n=key==='entry'?2:key==='crypt'?3:R(3,4);return Array.from({length:n},(_,i)=>wildUnit(pick(pool),R(55,60),i));};
const stageSevenWildUnit=wildUnit;wildUnit=function(sp,lv,i,boss){if(S.zone?.id===8&&!boss&&!SP[sp]?.legendary&&!SP[sp]?.solar)lv=clamp(lv,55,60);return stageSevenWildUnit(sp,lv,i,boss);};
const stageSevenLegendDrop=legendDrop;legendDrop=function(z){return stageSevenLegendDrop(z===8?6:z);};
const stageSevenZone=handlers.zone,stageSevenDoZone=handlers.dozone;for(const [key,fn]of [['zone',stageSevenZone],['dozone',stageSevenDoZone]])handlers[key]=function(v){if(Number(v)===8&&!(S.P.cleared>0)){toast('ต้องชนะจอมมารก่อนจึงจะเข้าด่าน 7 ได้');return;}return fn(v);};
const stageSevenForestPassed=forestPassed;forestPassed=function(z){return z.id===8?(S.P.forestClears?.[8]||0)>0:stageSevenForestPassed(z);};
const stageSevenDetail=forestDetail;forestDetail=function(z){if(z.id!==8)return stageSevenDetail(z);const old=S.P.zoneMax;if(S.P.cleared>0)S.P.zoneMax=Math.max(8,old);try{return stageSevenDetail(z);}finally{S.P.zoneMax=old;}};
const stageSevenArt=zoneArt;zoneArt=function(id,small=false){return id===8?'<figure class="scene-art"><img src="assets/ui/stage7/forest.png" alt="ป่าทมิฬพันธนาการ" style="width:100%;border-radius:14px" width="1536" height="1024"></figure>':stageSevenArt(id,small);};
const stageSevenLatestArt=latestForestArt;latestForestArt=function(){return S.P?.lastForestId===8?'assets/ui/stage7/forest.png':stageSevenLatestArt();};
const stageSevenZoneView=vZone;vZone=function(){let html=stageSevenZoneView();if(S.zone?.id===8)html=html.replace('assets/ui/boss-gates/gate-8.webp','assets/ui/stage7/gate.png').replace(' · ผนึกแล้วออร่าหาย',' · บอสและสมุนผนึกไม่ได้');return html;};

const stageSevenSecret={id:'ironreliquary',zone:8,name:'คลังสุริยคราสใต้รากเหล็ก',thai:'สมบัติที่โจรป่าช่วงชิง',chance:.03,optionalEnding:true,retryUntilClaim:true,music:'bgDemonCastleMusic',speaker:'โจรป่าเฝ้าคลัง',enemy:'baihu',gold:0,rewardItems:{},intro:'ช่องแสงสีทองลอดรากเหล็กดำ คุณพบคลังโบราณที่โจรป่ายึดครอง ภายในเก็บอุปกรณ์สุริยคราสและผนึกอสูรตำนานไว้ แต่ตราคลังยอมให้ปลดได้เพียงหนึ่งคำสัญญา',guard:'โจรป่า Lv55 พร้อมอสูรหายากไป๋หู่ Lv55 หนึ่งตัวขวางทาง ต้องชนะทั้งคู่ก่อนจึงจะเลือกของรางวัลได้',decision:'เลือกเพียงหนึ่งอย่าง เมื่อรับแล้ว คลังแห่งนี้จะไม่ปรากฏต่อตัวละครนี้อีก',evidence:'คุณปลดคลังใต้รากเหล็กและรับสมบัติเพียงหนึ่งคำสัญญา',visual:{intro:'ทางลับใต้รากเหล็ก',encounter:'โจรป่าและอสูรคู่หู',decision:'เลือกระหว่างอุปกรณ์กับอสูรตำนาน'},events:{intro:{next:'encounter'},encounter:{next:'decision'},decision:{next:'finished'}},choices:[{id:'gear',name:'รับอุปกรณ์ตำนานสุริยคราส 1 ชิ้น',detail:'สุ่มจากอุปกรณ์สุริยคราสเดิม อาวุธต้องตรงสายอาชีพ',requireVictory:true,effects:[{type:'stageSevenGear'}],outcome:'แสงสุริยคราสหลอมเป็นอุปกรณ์หนึ่งชิ้น ผนึกอีกฝั่งดับลงอย่างสงบ'},{id:'pet',name:'รับอสูรในตำนาน 1 ตัว',detail:'สุ่มอสูรตำนานปกติ Lv60 ไม่รวมตำนานสุริยคราส',requireVictory:true,effects:[{type:'stageSevenPet'}],outcome:'อสูรตำนานยอมรับคำสัญญาของคุณ คลังปิดลงหลังมอบสหายหนึ่งตัว'}]};
SECRET_DATA.locations.push(stageSevenSecret);
const stageSevenDiscover=Secret.canDiscover,stageSevenChance=Secret.chance;Secret.canDiscover=function(d){return d.id==='ironreliquary'?!this.state().locations[d.id]?.completed&&!this.state().claims[d.id+':decision']:stageSevenDiscover.call(this,d);};Secret.chance=function(d){return d.id==='ironreliquary'?.03:stageSevenChance.call(this,d);};
const stageSevenSecretAdvance=Secret.advance;Secret.advance=function(){if(this.location()?.id==='ironreliquary'&&this.session().event==='encounter')return;return stageSevenSecretAdvance.call(this);};
const stageSevenSecretEffects=Secret.effects;Secret.effects=function(list){if(!list.some(e=>['stageSevenGear','stageSevenPet'].includes(e.type)))return stageSevenSecretEffects.call(this,list);if(this.location()?.id!=='ironreliquary'||!this.session()?.battleWon)throw Error('Win required');const out=[];for(const e of list){if(e.type==='stageSevenGear'){const pool=Object.keys(EQ).filter(k=>EQ[k].worldLegend&&(EQ[k].slot!=='weapon'||EQ[k].wt===clsWeapon(S.P.cls)));if(!pool.length)throw Error('Missing eclipse gear');const id=pick(pool);S.P.owned.push(id);S.P.legend||={};S.P.legend[id]=1;out.push('ได้รับ '+EQ[id].n+' จำนวน 1 ชิ้น');}else if(e.type==='stageSevenPet'){normalizePack();const pool=Object.keys(SP).filter(k=>SP[k].legendary&&!SP[k].solar&&!SP[k].noseal);const sp=pick(pool),pet=mkPet(sp,60);S.P.pets.push(pet);const carry=S.P.carried.length<carryLimit();if(carry)S.P.carried.push(pet.uid);S.P.seen[sp]=1;S.P.caught[sp]=1;markFormSeen(sp,pet.form||0);out.push('ได้รับ '+SP[sp].n+' Lv60 จำนวน 1 ตัว'+(carry?' · อยู่ในกระเป๋า':' · ส่งไปค่ายแล้ว'));}else out.push(...stageSevenSecretEffects.call(this,[e]));}return out;};
const stageSevenSecretFight=Secret.fight;Secret.fight=function(token){if(this.location()?.id!=='ironreliquary')return stageSevenSecretFight.call(this,token);if(this.busy||!this.valid(token)||this.session().event!=='encounter'||S.P.hp<=0)return;const q=this.session();q.event='combat';q.revision++;q.battleReturn='encounter';this.checkpoint();const bandit=humanUnit('โจรป่าเฝ้าคลัง','masterthief',55,0),pet=wildUnit('baihu',55,1);pet.kind='npcpet';pet.noseal=true;startBattle([bandit,pet],'secret',8);S.battle.secretId='ironreliquary';save();render();};
const stageSevenSecretPanel=Secret.panel;Secret.panel=function(d,index,label,cls=''){if(d.id!=='ironreliquary')return stageSevenSecretPanel.call(this,d,index,label,cls);return '<figure class="secret-panel '+cls+'" role="img" aria-label="'+esc(label)+'" style="'+this.artStyle('assets/ui/secrets/ironreliquary-story-v1.webp',Math.floor(index/3),index%3,3,3)+';--story-atlas:url(assets/ui/stage7/story.png)"><figcaption>'+esc(label)+'</figcaption></figure>';};
const stageSevenSecretArrival=Secret.arrival;Secret.arrival=function(){return stageSevenSecretArrival.call(this).replaceAll('assets/ui/secrets/ironreliquary-v1.webp','assets/ui/stage7/secret.png');};
const stageSevenSecretArt=Secret.art;Secret.art=function(d){return stageSevenSecretArt.call(this,d).replaceAll('assets/ui/secrets/ironreliquary-v1.webp','assets/ui/stage7/secret.png');};
const stageSevenSecretView=Secret.view;Secret.view=function(){if(this.location()?.id!=='ironreliquary'||this.session()?.arrival)return stageSevenSecretView.call(this);const d=this.location(),q=this.session(),token=this.token();if(q.event!=='encounter')return stageSevenSecretView.call(this);return '<section class="stack secret-location"><h2>'+d.name+'</h2><div id="secretEvent" class="card stack">'+this.panel(d,2,d.visual.encounter)+'<p>'+d.guard+'</p>'+this.imageButton(d,2,'ต่อสู้กับโจรป่า','secretFight',token)+'</div>'+this.status()+('<button class="btn" data-a="secretLeave" data-v="'+esc(token)+'">ออกจากสถานที่ลับ · ยังมีโอกาสพบรอบหน้า</button>')+'</section>';};
const stageSevenSecretBook=Secret.book;Secret.book=function(){return stageSevenSecretBook.call(this).replace('ออกจากสถานที่ก่อนทำเหตุการณ์จบแล้ว สถานที่นี้จะไม่สุ่มพบซ้ำ','ออกจากสถานที่ก่อนทำเหตุการณ์จบแล้ว สถานที่ทั่วไปไม่สุ่มซ้ำ; คลังสุริยคราสจะยังสุ่มพบได้จนกว่าจะรับรางวัล');};


BUILTIN_SCENES[9]='assets/ui/stage7/forest.png';
const stageSevenWildView=vWild;vWild=function(){const old=S.P.zoneMax;if(S.P.cleared>0)S.P.zoneMax=Math.max(8,old);try{return stageSevenWildView();}finally{S.P.zoneMax=old;}};
const stageSevenMist=mistEncounter;mistEncounter=function(z,roll,P=S.P){if(z.id!==8)return stageSevenMist(z,roll,P);if(roll>=.33)return null;const u=wildUnit(pick(z.rare),R(55,60),0);u.rare=true;return u;};
const stageSevenFrames=storyFrames;storyFrames=function(chapter,after=false){if(chapter!==8)return stageSevenFrames(chapter,after);return (after?[{title:'พันธนาการที่แตกสลาย',text:'เฟอร์รอธและมอร์ทิวาร์พ่ายแพ้ เสียงวิญญาณลอดผ่านรากเหล็กสู่แสงเช้า คุณกับสหายกลับเมืองพร้อมคำสัญญาว่าจะไม่ให้ผู้ใดครอบครองเสียงเหล่านี้อีก'}]:[{title:'ด่าน 7 · ป่าทมิฬพันธนาการ',text:ZN[7].d},{title:'สองผู้ครองป้อมนิรันดร์',text:'เฟอร์รอธ จักรพรรดิปีศาจเหล็กทมิฬ และมอร์ทิวาร์ จอมเวทอันเดดนิรันดร์ รออยู่หลังประตู สมุนตำนานสองตัวเฝ้าเคียงข้าง ทั้งหมดไม่อาจผนึกในการต่อสู้นี้'}]).map((f,i)=>({...f,art:9,music:'hauntMusic',sceneKey:'8-'+(after?'after':'before')+'-'+i}));};
CINEMA_ART['8-before-0']='assets/ui/stage7/forest.png';CINEMA_ART['8-before-1']='assets/ui/stage7/gate.png';CINEMA_ART['8-after-0']='assets/ui/stage7/forest.png';

const stageSevenStoryView=vStory;vStory=function(){const html=stageSevenStoryView();if(!S.P?.cleared||S.ui.cinema||S.ui.secretBook)return html;return html+'<button class="story-cover" data-a="chapterPlay" data-v="8"><img src="assets/ui/stage7/forest.png" alt=""><span>ด่าน 7 · ป่าทมิฬพันธนาการ</span></button>';};
const stageSevenSecretFinish=Secret.finishBattle;Secret.finishBattle=function(result){const special=B()?.secretId==='ironreliquary';const out=stageSevenSecretFinish.call(this,result);if(special&&B()?.over){B().over.title=result==='win'?'ชนะโจรป่าเฝ้าคลัง':'ยังไม่ได้รับสมบัติ';B().over.lines=result==='win'?['ประตูคลังเปิดแล้ว เลือกรางวัลได้เพียงหนึ่งทาง','อุปกรณ์ตำนานสุริยคราส 1 ชิ้น หรืออสูรตำนาน 1 ตัว']:['ยังไม่ได้รับรางวัล สามารถกลับมาลองใหม่ได้','หากออกจากด่าน จะมีโอกาสพบสถานที่ลับ 3% ในการเข้าด่านรอบใหม่'];save();}return out;};
const STAGE_SEVEN_SKILL_ART={audit_repair:0,audit_warn:1,audit_ferro_devour:2,audit_morti_veil:3};
const stageSevenSkillPicture=skillPicture;skillPicture=function(u,sk,id){if(Object.hasOwn(STAGE_SEVEN_SKILL_ART,id))return '<span class="skill-painted skill-raster" role="img" aria-label="'+esc(sk.n)+'" style="background-image:url(assets/ui/stage7/story.png);background-size:300% 300%;background-position:'+(STAGE_SEVEN_SKILL_ART[id]%3*50)+'% '+(Math.floor(STAGE_SEVEN_SKILL_ART[id]/3)*50)+'%"></span>';return stageSevenSkillPicture(u,sk,id);};
// @soulbeast-end 1096-stageSeven
