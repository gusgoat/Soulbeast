/* Runs in the original battle scope, after loading the walking character. */
forestAutoLocked=()=>S.P.lv<10;
function walkLoadBattlePrefs(){const q=S.P.walkBattlePrefs||{};S.ui.autoTeam=S.P.lv>=10&&!!q.autoTeam;S.ui.autoPet=S.P.lv>=10&&!!q.autoPet;BattleSpeed.value=q.speed===2?2:1;BattleSpeed.pending=null}
function walkStoreBattlePrefs(){S.P.walkBattlePrefs={autoTeam:S.P.lv>=10&&!!S.ui.autoTeam,autoPet:S.P.lv>=10&&!!S.ui.autoPet,speed:(BattleSpeed.pending||BattleSpeed.value)===2?2:1};save()}
walkLoadBattlePrefs();
const walkStartBattle=startBattle;startBattle=function(...args){walkLoadBattlePrefs();return walkStartBattle(...args)};
const walkTeamAuto=handlers.teamAuto;handlers.teamAuto=function(...args){if(S.P.lv<10)return toast('ต่อสู้อัตโนมัติปลดล็อกเลเวล 10');const r=walkTeamAuto(...args);walkStoreBattlePrefs();return r};
const walkSpeed=handlers.battleSpeed;handlers.battleSpeed=function(...args){const r=walkSpeed(...args);walkStoreBattlePrefs();return r};
// Reuse the skill target cards, validity styling and cancel control for seals.
const walkTargetValid=BattleSkillTarget.valid,walkTargetBanner=BattleSkillTarget.banner,walkTargetConfirm=BattleSkillTarget.confirm;
BattleSkillTarget.valid=function(u,side){const p=this.current();return p?.sealItem?side==='enemy'&&sealable(u):walkTargetValid.call(this,u,side)};
BattleSkillTarget.banner=function(){const p=this.current();return p?.sealItem?'<div class="battle-target-prompt" role="status"><div><b>'+esc(CON[p.sealItem].n)+'</b><span>แตะการ์ดอสูรที่ต้องการผนึก · ยังไม่ใช้ผนึกจนกว่าจะเลือกเป้าหมาย</span></div><button class="btn sm" data-a="battleTargetCancel">ยกเลิก</button></div>':walkTargetBanner.call(this)};
let walkSealConfirmed=false;
BattleSkillTarget.confirm=function(side,value){const p=this.current();if(!p?.sealItem)return walkTargetConfirm.call(this,side,value);const c=this.context(),target=c?.b.enemies[Number(value)];if(!this.valid(target,side))return true;this.pending=null;c.b.target=Number(value);walkSealConfirmed=true;try{battleAction('seal:'+p.sealItem)}finally{walkSealConfirmed=false}return true};
const walkBattleAction=battleAction;battleAction=function(v){const b=B(),[action,item]=String(v).split(':');if(action==='auto'){if(S.P.lv<10)return toast('ต่อสู้อัตโนมัติปลดล็อกเลเวล 10');const r=walkBattleAction(v);walkStoreBattlePrefs();return r}if(action==='seal'&&!walkSealConfirmed){const c=BattleSkillTarget.context();if(!c||c.u.kind!=='player'||!CON[item]?.seal||!(S.P.items[item]>0)||!b.enemies.some(sealable))return;BattleSkillTarget.pending={...c,sealItem:item,side:'enemy'};BattleCommandFocus.pending='arena';render();return}return walkBattleAction(v)};
const walkBattleView=vBattle;vBattle=function(){const item=CON.teleportScroll;let h;try{delete CON.teleportScroll;h=walkBattleView()}finally{if(item)CON.teleportScroll=item}if(B()?.enemies.some(sealable))h=h.replace(/(data-v="seal:[^"]*"\s*)disabled/g,'$1');if(S.P.lv<10&&!B()?.over)h+='<small class="sub" data-auto-unlock>ต่อสู้อัตโนมัติปลดล็อกเลเวล 10</small>';return h};
