// Tower runs, checkpoints and rest choices
// Build-time module: shared legacy scope; execution order is in manifest.json.
// @soulbeast-unit 0911-TOWER_FLOORS

const TOWER_FLOORS=NPC.map((n,i)=>({n,i})).sort((a,b)=>a.n.lv-b.n.lv||a.i-b.i);
// @soulbeast-end 0911-TOWER_FLOORS
// @soulbeast-unit 0912-TOWER_UI

const TOWER_UI={busy:false,error:'',today:'',ready:false,saving:null};
// @soulbeast-end 0912-TOWER_UI
// @soulbeast-unit 0913-towerActive

const towerActive=()=>!!S.P?.towerRun?.active;
// @soulbeast-end 0913-towerActive
// @soulbeast-unit 0914-towerError

function towerError(error){return {'tower daily limit':'เข้าหอคอยได้วันละครั้ง วันนี้ใช้สิทธิ์แล้ว','tower heal first':'รักษาตัวและเตรียมทีมก่อนเข้าหอคอย','tower wrong run':'ข้อมูลรอบหอคอยไม่ตรง กรุณาตรวจสถานะอีกครั้ง','tower wrong floor':'ชั้นหอคอยไม่ตรง กรุณาตรวจสถานะอีกครั้ง','tower locked':'ต้องจบหอคอยหรือแพ้ก่อนออกไปทำกิจกรรมอื่น'}[error]||sheetError({error});}
// @soulbeast-end 0914-towerError
// @soulbeast-unit 0915-towerApply

function towerApply(run,coupons,recovery){const old=S.P.towerRun;S.P.towerBest=run.best||0;S.P.towerRun={...run,checkpoint:old?.id===run.id?old.checkpoint:null};if(Number.isFinite(coupons))GACHA.coupons=coupons;if(recovery&&S.P.towerRecoveryApplied!==recovery.id){if(recovery.cleanse||recovery.id.endsWith(':entry')||recovery.id.endsWith(':exit')){S.P.ailments={};S.P.pets.forEach(p=>p.ailments={});}S.P.hp=recovery.hp;S.P.mp=recovery.mp;for(const v of recovery.pets){const p=petBy(v.uid);if(p){p.hp=v.hp;p.mp=v.mp;}}S.P.towerRecoveryApplied=recovery.id;}if(recovery?.reward&&S.P.towerTreasureApplied!==recovery.reward.id){const w=recovery.reward;S.P.owned.push(w.gear);S.P.gold+=w.gold;S.P.towerTreasureApplied=w.id;toast('หีบสมบัติ: '+EQ[w.gear].n+' · '+fmt(w.gold)+' เหรียญ');}}
// @soulbeast-end 0915-towerApply
// @soulbeast-unit 0916-towerCheckpoint

function towerCheckpoint(){const run=S.P?.towerRun,b=S.battle;if(run&&b?.towerRun===run.id){run.checkpoint=JSON.parse(JSON.stringify(b));}}
// @soulbeast-end 0916-towerCheckpoint
// @soulbeast-unit 0917-towerSaveNow

async function towerSaveNow(){if(TOWER_UI.saving)await TOWER_UI.saving;towerCheckpoint();save();const data=gsData();TOWER_UI.saving=(async()=>{const r=await lbPost({action:'save',data});if(!r.ok)throw Error(r.error||'save failed');S.P.gsAt=r.at;GS.lastJson=data;GS.lastAt=Date.now();return r;})();try{return await TOWER_UI.saving;}finally{TOWER_UI.saving=null;}}
// @soulbeast-end 0917-towerSaveNow
// @soulbeast-unit 0918-towerStatus

async function towerStatus(){if(TOWER_UI.busy)return;TOWER_UI.busy=true;TOWER_UI.error='';render();try{const r=await lbPost({action:'tower_status'});if(!r.ok)throw Error(r.error);towerApply(r.run,r.coupons,r.recovery);TOWER_UI.today=r.today;TOWER_UI.ready=true;if(towerActive())towerResume();else if(S.battle?.towerRun===r.run.id){S.battle=null;S.P.towerRun.checkpoint=null;S.screen=r.run.outcome==='lose'?'hospital':'arena';}}catch(e){TOWER_UI.error=towerError(e.message);}finally{TOWER_UI.busy=false;save();render();}}
// @soulbeast-end 0918-towerStatus
// @soulbeast-unit 0919-towerStartFloor

function towerStartFloor(){const run=S.P.towerRun,entry=TOWER_FLOORS[run.floor-1];if(!run.active||!entry)return;S.battle=null;S.P.party=S.P.party.filter(uid=>run.carried.includes(uid)&&S.P.carried.includes(uid));const n=entry.n,es=[humanUnit(n.n,n.cls,n.lv,0)];n.pets.forEach(([sp,lv],i)=>{const u=wildUnit(sp,lv,i+1);u.name+='ของ'+n.n.split(' ')[0];u.kind='npcpet';es.push(u);});
 // startBattle advances immediately; set the run marker before its first render/timer.
 TOWER_UI.starting={id:run.id,floor:run.floor};try{startBattle(es,'npc',entry.i);}finally{TOWER_UI.starting=null;}towerCheckpoint();save();render();}
// @soulbeast-end 0919-towerStartFloor
// @soulbeast-unit 0920-towerStartBattle

const towerStartBattle=startBattle;
// @soulbeast-end 0920-towerStartBattle
// @soulbeast-unit 0921-startBattle

startBattle=function(...args){if(TOWER_UI.starting){const prior=newRound;newRound=function(){Object.assign(S.battle,{towerRun:TOWER_UI.starting.id,towerFloor:TOWER_UI.starting.floor});return prior();};try{return towerStartBattle(...args);}finally{newRound=prior;}}return towerStartBattle(...args);};
// @soulbeast-end 0921-startBattle
// @soulbeast-unit 0922-towerResumePending

function towerResumePending(){const b=S.battle;if(!b?.towerRun||b.over||b.menu!=='wait')return;const next=b.towerContinuation;const fn=next==='ai'?aiAct:next==='charge'?()=>releaseCharge(uById(b.cur)):advance;battleLater(fn,200);}
// @soulbeast-end 0922-towerResumePending
// @soulbeast-unit 0923-towerResume

function towerResume(){const run=S.P.towerRun;if(!run?.active)return;S.zone=null;if(run.restPending){S.battle=null;S.screen='arena';return;}const cp=run.checkpoint;if(cp?.towerRun===run.id&&cp.towerFloor===run.floor){if(S.battle?.towerRun!==run.id||S.battle.towerFloor!==run.floor){S.battle=JSON.parse(JSON.stringify(cp));S.screen='battle';towerResumePending();}else S.screen='battle';}else towerStartFloor();}
// @soulbeast-end 0923-towerResume
// @soulbeast-unit 0924-towerBattleLater

const towerBattleLater=battleLater;
// @soulbeast-end 0924-towerBattleLater
// @soulbeast-unit 0925-battleLater

battleLater=function(fn,ms){const b=S.battle;if(!b?.towerRun)return towerBattleLater(fn,ms);const serial=(b.towerTimerSerial||0)+1;b.towerTimerSerial=serial;b.towerContinuation=fn===aiAct?'ai':fn===advance?'advance':'charge';return towerBattleLater(()=>{if(b.towerTimerSerial!==serial||b.over)return;b.towerContinuation=null;fn();},ms);};
// @soulbeast-end 0925-battleLater
// @soulbeast-unit 0926-handlers-towerConfirm

handlers.towerConfirm=function(){if(TOWER_UI.busy||towerActive()||!TOWER_UI.ready)return;S.ui.confirm={msg:'เข้าหอคอยประลองยุทธ? ต้องเริ่มชั้น 1 และสู้ต่อเนื่องจนจบหรือตาย ออกไปใช้ยา รักษาตัว หรือเปลี่ยนอสูรจากค่ายไม่ได้ ใช้สกิลฮีลและพักฟื้นได้ มีจุดพักทุก 5 ชั้น ฟื้น HP/MP ทั้งหมดฟรีก่อนเข้าและเมื่อจบ แพ้ไม่เสีย EXP หรือเงิน · วันละครั้ง (รีเซ็ตเที่ยงคืนเวลาไทย)',act:'towerEnter'};render();};
// @soulbeast-end 0926-handlers-towerConfirm
// @soulbeast-unit 0927-handlers-towerEnter

handlers.towerEnter=async function(){if(TOWER_UI.busy)return;S.ui.confirm=null;TOWER_UI.busy=true;TOWER_UI.error='';render();try{if(S.zone||S.battle)throw Error('finish other battle');await towerSaveNow();const r=await lbPost({action:'tower_enter'});if(!r.ok)throw Error(r.error);towerApply(r.run,r.coupons,r.recovery);TOWER_UI.today=r.today||r.run.day;towerStartFloor();await towerSaveNow();}catch(e){TOWER_UI.error=towerError(e.message);}finally{TOWER_UI.busy=false;render();}};
// @soulbeast-end 0927-handlers-towerEnter
// @soulbeast-unit 0928-handlers-towerRefresh

handlers.towerRefresh=towerStatus;
// @soulbeast-end 0928-handlers-towerRefresh
// @soulbeast-unit 0930-handlers-towerNext

handlers.towerNext=async function(){const b=S.battle,run=S.P.towerRun;if(TOWER_UI.busy||!b?.over||b.towerRun!==run?.id)return;TOWER_UI.busy=true;TOWER_UI.error='';render();try{await towerSaveNow();const r=await lbPost({action:'tower_result',run:run.id,floor:b.towerFloor,outcome:b.over.res==='win'?'win':'lose'});if(!r.ok)throw Error(r.error);towerApply(r.run,r.coupons,r.recovery);if(r.run.active){towerResume();await towerSaveNow();}else{S.battle=null;S.screen=r.run.outcome==='lose'?'hospital':'town';S.P.towerRun.checkpoint=null;await towerSaveNow();lbSubmit(true);}}catch(e){TOWER_UI.error=towerError(e.message);}finally{TOWER_UI.busy=false;save();render();}};
// @soulbeast-end 0930-handlers-towerNext
// @soulbeast-unit 0931-towerEndBattle

const towerEndBattle=endBattle;
// @soulbeast-end 0931-towerEndBattle
// @soulbeast-unit 0932-towerRecordResult

async function towerRecordResult(b){if(TOWER_UI.busy||S.battle!==b||!b.over||b.towerResultSaved)return;TOWER_UI.busy=true;TOWER_UI.error='';render();try{await towerSaveNow();const r=await lbPost({action:'tower_result',run:b.towerRun,floor:b.towerFloor,outcome:b.over.res==='win'?'win':'lose'});if(!r.ok)throw Error(r.error);towerApply(r.run,r.coupons,r.recovery);b.towerResultSaved=true;if(r.run.lastCouponFloor===b.towerFloor&&r.run.lastCouponReward===2&&!b.towerCouponNotice){b.towerCouponNotice=true;b.over.lines.push('คูปองผ่านชั้นครั้งแรก +2 ใบ');}await towerSaveNow();if(!S.P.lbOff)lbSubmit(true);}catch(e){TOWER_UI.error=towerError(e.message);}finally{TOWER_UI.busy=false;render();}}
// @soulbeast-end 0932-towerRecordResult
// @soulbeast-unit 0934-towerBattleAction

const towerBattleAction=battleAction;
// @soulbeast-end 0934-towerBattleAction
// @soulbeast-unit 0935-battleAction

battleAction=function(value){if(S.battle?.towerRun){const k=String(value).split(':')[0];if(k==='done')return handlers.towerNext();if(k==='swap'&&!S.P.towerRun.carried.includes(Number(value.split(':')[1])))return toast('เรียกได้เฉพาะอสูรที่พกเข้าหอคอย');if(k==='item'||k==='seal'||k==='flee'||value==='menu:item'||value==='menu:seal')return toast('หอคอยห้ามใช้ไอเท็ม ผนึก และหนี ใช้สกิลฮีลหรือพักฟื้นได้');}return towerBattleAction(value);};
// @soulbeast-end 0935-battleAction
// @soulbeast-unit 0936-towerGo

const towerGo=go;
// @soulbeast-end 0936-towerGo
// @soulbeast-unit 0937-go

go=function(screen){if(towerActive()&&!['battle','settings'].includes(screen)){toast('ออกจากหอคอยไม่ได้จนกว่าจะเคลียร์หอคอยหรือตาย');towerResume();render();return;}if(screen==='arena'){if(S.zone||S.battle)return towerGo(screen);S.screen='arena';render();towerStatus();return;}return towerGo(screen);};
// @soulbeast-end 0937-go
// @soulbeast-unit 0939-towerPackLocked

const towerPackLocked=packLocked;
// @soulbeast-end 0939-towerPackLocked
// @soulbeast-unit 0940-packLocked
packLocked=function(){return towerActive()||towerPackLocked();};
// @soulbeast-end 0940-packLocked
// @soulbeast-unit 0943-towerSave

const towerSave=save;
// @soulbeast-end 0943-towerSave
// @soulbeast-unit 0944-save
save=function(){towerCheckpoint();return towerSave();};
// @soulbeast-end 0944-save
// @soulbeast-unit 0946-LBTAB-tower

LBTAB.tower={n:'หอคอยประลองยุทธ',v:r=>fmt(r.towerBest||0)+' ชั้น',k:r=>r.towerBest||0};
// @soulbeast-end 0946-LBTAB-tower
// @soulbeast-unit 0947-towerBattleView

const towerBattleView=vBattle;
// @soulbeast-end 0947-towerBattleView
// @soulbeast-unit 0948-vBattle

vBattle=function(){let html=towerBattleView(),b=S.battle;if(!b?.towerRun)return html;html='<div class="tower-floor">หอคอยประลองยุทธ · ชั้น '+b.towerFloor+'/'+TOWER_FLOORS.length+'</div>'+html;html=html.replace(/<button\b[^>]*data-v="menu:(?:item|seal)"[^>]*>[\s\S]*?<\/button>/g,'');if(b.over)html=html.replace('data-v="done">ไปต่อ','data-v="done" '+(TOWER_UI.busy?'disabled':'')+'>'+(TOWER_UI.busy?'กำลังบันทึก…':b.over.res==='lose'?'จบการท้าทาย':b.towerFloor===TOWER_FLOORS.length?'เคลียร์หอคอย · กลับเมือง':b.towerFloor%5===0?'ไปจุดพัก':'ขึ้นชั้นถัดไป'));if(TOWER_UI.error)html+='<div class="card" role="alert">'+esc(TOWER_UI.error)+' · กดไปต่อเพื่อลองบันทึกอีกครั้ง</div>';return html;};
// @soulbeast-end 0948-vBattle
// @soulbeast-unit 0949-towerRender

const towerRender=render;
// @soulbeast-end 0949-towerRender
// @soulbeast-unit 0950-render

render=function(){if(towerActive()&&S.screen!=='settings'&&(S.screen!=='battle'||!S.battle?.towerRun)&&!TOWER_UI.starting)towerResume();towerRender();if(S.battle?.towerRun)save();if(towerActive()&&!TOWER_UI.ready&&!TOWER_UI.bootChecked){TOWER_UI.bootChecked=true;setTimeout(towerStatus,0);}};
// @soulbeast-end 0950-render
// @soulbeast-unit 0952-towerRestView


function towerRestView(){const choice=(type,title,description)=>'<button class="door tower-rest-choice" data-a="towerRest" data-v="'+type+'" '+(TOWER_UI.busy?'disabled':'')+'>'+routePicture(type,false)+'<b>'+title+'</b><small>'+description+'</small><span class="chip">เลือก'+title+'</span></button>';return '<div class="stack"><h2>จุดพัก · หลังชั้น '+S.P.towerRun.restPending+'</h2><p>เลือกได้หนึ่งอย่าง ก่อนขึ้นชั้น '+S.P.towerRun.floor+'</p>'+towerRestVitals()+'<div class="grid2 tower-rest-grid">'+choice('revival','บ่อชุบชีวิต','อสูรที่พกและหมดสติฟื้น HP เต็มและ MP ครึ่งหนึ่ง หากไม่มีผู้หมดสติ ฟื้น HP 50% ให้ผู้ที่มีสัดส่วน HP ต่ำที่สุดหนึ่งตัว')+choice('spring','ลำธารใส','ฟื้น HP และ MP 35% ให้ผู้เล่นและอสูรที่พกซึ่งยังมีสติ')+choice('cleanse','บ่อชำระล้าง','ล้างสถานะผิดปกติทั้งหมดให้ผู้ผนึกและอสูรทุกตัว รวมในค่าย ฟรี พร้อมฟื้น HP/MP 10% ให้ผู้ที่ยังมีสติ')+choice('treasure','หีบสมบัติ','อุปกรณ์ที่ไม่ใช่ตำนาน 1 ชิ้น และเงิน '+fmt(150+S.P.towerRun.restPending*30)+' เหรียญ · ไม่ฟื้นพลังหรือล้างสถานะ')+'</div>'+(TOWER_UI.error?'<p role="alert">'+esc(TOWER_UI.error)+'</p>':'')+'</div>';}
// @soulbeast-end 0952-towerRestView
// @soulbeast-unit 0953-handlers-towerRest

handlers.towerRest=async function(choice){const run=S.P.towerRun;if(TOWER_UI.busy||!run?.restPending||!['spring','revival','cleanse','treasure'].includes(choice))return;TOWER_UI.busy=true;TOWER_UI.error='';render();try{await towerSaveNow();const r=await lbPost({action:'tower_rest',run:run.id,choice});if(!r.ok)throw Error(r.error);towerApply(r.run,r.coupons,r.recovery);towerStartFloor();await towerSaveNow();}catch(e){TOWER_UI.error=towerError(e.message);}finally{TOWER_UI.busy=false;render();}};
// @soulbeast-end 0953-handlers-towerRest
// @soulbeast-unit 0955-towerRestVitals

function towerRestVitals(){return '<section class="tower-rest-roster"><h3>ผู้ผนึกและอสูรที่พก · พลังปัจจุบัน</h3><div class="tower-rest-units">'+bagHealTargets().map(t=>{const states=Object.keys(storedAilments(t.o));return '<article class="card tower-rest-unit"><div class="row">'+portrait(t.key==='P'?'player':t.o.sp,36,{form:t.o.form||0})+'<b>'+esc(t.name)+' <small>Lv '+t.o.lv+'</small></b></div><small>HP '+fmt(t.o.hp)+'/'+fmt(t.st.hp)+(t.o.hp<=0?' · หมดสติ':'')+'</small>'+bar(t.o.hp,t.st.hp)+'<small>MP '+fmt(t.o.mp)+'/'+fmt(t.st.mp)+'</small>'+bar(t.o.mp,t.st.mp,'mp')+'<div class="row wrap">'+states.map(k=>'<span class="battle-effect-icon" title="'+esc(STS[k].n)+'">'+battleEffectImage(k,STS[k].n)+'</span>').join('')+'</div><small>'+(states.length?states.map(k=>STS[k].n).join(' · '):'ไม่มีสถานะผิดปกติ')+'</small></article>';}).join('')+'</div></section>';}
// @soulbeast-end 0955-towerRestVitals
