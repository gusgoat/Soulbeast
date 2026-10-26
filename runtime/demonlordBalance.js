// Final forest encounter only; never mutate species, player classes or online rules.
// @soulbeast-unit 1082-demonlordBalance
const DEMONLORD_BALANCE={version:1,boss:{hp:.75,patk:.85,matk:.85,pdef:.9,mdef:.9},bossAttackBonus:1.15,general:{hp:.5,patk:.45,matk:.45,pdef:.7,mdef:.7,spd:.9},helper:{hp:.8,patk:.7,matk:.7}};
function scaleDemonEncounterUnit(u,scale){u.st={...u.st};for(const [key,factor]of Object.entries(scale))u.st[key]=Math.max(1,Math.round(u.st[key]*factor));u.hp=u.st.hp;u.mp=Math.min(u.mp,u.st.mp);u.demonBalanceVersion=DEMONLORD_BALANCE.version;}
function prepareDemonEncounter(enemies,kind,meta){if(kind!=='boss'||Number(meta)!==6)return false;const boss=enemies.find(u=>u.sp==='demonlord'&&u.boss&&!u.immortalWorld);if(!boss||boss.demonBalanceVersion)return false;scaleDemonEncounterUnit(boss,DEMONLORD_BALANCE.boss);for(const key of ['patk','matk'])boss.st[key]=Math.max(1,Math.round(boss.st[key]*DEMONLORD_BALANCE.bossAttackBonus));for(const u of enemies.filter(u=>u.kind==='human'&&u.side==='enemy')){scaleDemonEncounterUnit(u,DEMONLORD_BALANCE.general);u.skills=[...new Set(['attack',...u.skills.filter(id=>SK[id]&&['p','m','h','auto'].includes(SK[id].t)&&!SK[id].summon&&!SK[id].mile&&(SK[id].pw||100)<=140).slice(-3)])];}return true;}
const demonBalanceStartPrevious=startBattle;
startBattle=function(enemies,kind,meta,...args){const changed=prepareDemonEncounter(enemies,kind,meta),out=demonBalanceStartPrevious(enemies,kind,meta,...args);if(changed&&S.battle){blog('แสงศิลาผนึกกดพลังแม่ทัพ: เน้นท่าโจมตี ไม่ใช้การฮีลและอัญเชิญซ้อน');blog('จอมมารยังใช้ทุกสกิล และเรียกอสูรตำนาน Lv 40 ได้หนึ่งตัว');}return out;};
const demonBalanceSummonPrevious=bossSummonLegends;
bossSummonLegends=function(u,count){const out=demonBalanceSummonPrevious(u,count),b=B();if(out&&u.demonBalanceVersion&&u.sp==='demonlord'&&!u.immortalWorld&&b?.kind==='boss'&&Number(b.meta)===6){for(const pet of b.enemies.filter(x=>x.bossHelper&&x.summonedBy===u.id&&!x.demonBalanceVersion))scaleDemonEncounterUnit(pet,DEMONLORD_BALANCE.helper);}return out;};
const demonBalanceZonePrevious=vZone;
vZone=function(){const html=demonBalanceZonePrevious(),z=S.zone&&ZN[S.zone.id-1],boss=z&&(forestPassed(z)?S.zone.boss||z.boss:z.boss);if(!isBossDoorScene()||z?.id!==6||boss?.sp!=='demonlord')return html;return html.replace(/ออร่าบอส:[^<]*/,'ศึกสุดท้าย: แม่ทัพสุ่ม 2 คนเน้นท่าโจมตี · จอมมารใช้ทุกสกิลและเรียกอสูรตำนาน Lv 40 ได้ 1 ตัว · ผนึกจอมมารไม่ได้');};
// Encounter-specific strength on top of the existing aura. Never mutate species or pets.
const STAGE_BOSS_STRENGTH={1:{sp:'tanuki',factor:1.5,attackBonus:1.15,attackExtra:1.2,defenseBonus:1.2,attackLatest:1.1,defenseLatest:1.2},2:{sp:'kitsune',factor:1.5,attackBonus:1.15,attackExtra:1.1,defenseBonus:1.3,defenseLatest:1.2},3:{sp:'sphinx',factor:1.5,attackBonus:1.15,attackExtra:1.1,defenseBonus:1.3,defenseExtra:1.2,attackLatest:1.1,defenseLatest:1.2},4:{sp:'dragon',factor:1.25,hpOnly:true,attackBonus:1.15,defenseBonus:1.2},5:{factor:1.5,attackBonus:1.15,defenseBonus:1.3,attackLatest:1.2,defenseLatest:1.1}};
function prepareStageBossStrength(enemies,kind,meta){
 const rule=STAGE_BOSS_STRENGTH[Number(meta)];if(kind!=='boss'||!rule)return false;
 const bosses=enemies.filter(x=>x.boss&&x.side==='enemy'&&!x.immortalWorld&&!x.bossHelper&&!x.temporary&&(!rule.sp||x.sp===rule.sp)&&!x.stageBossStrengthVersion);
 if(!bosses.length)return false;
 for(const u of bosses){
 u.st={...u.st};for(const key of (rule.hpOnly?['hp']:['hp','patk','matk','pdef','mdef']))u.st[key]=Math.max(1,Math.round(u.st[key]*rule.factor));
 for(const key of ['patk','matk'])u.st[key]=Math.max(1,Math.round(u.st[key]*(rule.attackBonus||1)));
 for(const key of ['pdef','mdef'])u.st[key]=Math.max(1,Math.round(u.st[key]*(rule.defenseBonus||1)));
 for(const key of ['patk','matk'])u.st[key]=Math.max(1,Math.round(u.st[key]*(rule.attackExtra||1)));
 for(const key of ['pdef','mdef'])u.st[key]=Math.max(1,Math.round(u.st[key]*(rule.defenseExtra||1)));
 for(const key of ['patk','matk'])u.st[key]=Math.max(1,Math.round(u.st[key]*(rule.attackLatest||1)));
 for(const key of ['pdef','mdef'])u.st[key]=Math.max(1,Math.round(u.st[key]*(rule.defenseLatest||1)));
 u.hp=u.st.hp;u.stageBossStrengthVersion=1;u.stageBossStrengthFactor=rule.factor;
 }return true;
}
const stageBossStrengthStart=startBattle;startBattle=function(enemies,kind,meta,...args){prepareStageBossStrength(enemies,kind,meta);return stageBossStrengthStart(enemies,kind,meta,...args);};
const stageBossStrengthZone=vZone;vZone=function(){const html=stageBossStrengthZone(),z=S.zone&&ZN[S.zone.id-1],rule=z&&STAGE_BOSS_STRENGTH[z.id],boss=z&&(forestPassed(z)?S.zone.boss||z.boss:z.boss);if(!isBossDoorScene()||!rule||rule.sp&&boss?.sp!==rule.sp)return html;const hp=rule.factor,atk=(rule.hpOnly?1:rule.factor)*(rule.attackBonus||1)*(rule.attackExtra||1)*(rule.attackLatest||1),def=(rule.hpOnly?1:rule.factor)*(rule.defenseBonus||1)*(rule.defenseExtra||1)*(rule.defenseLatest||1),pct=f=>Math.round((f-1)*1000)/10;return html.replace('· ผนึกแล้วออร่าหาย</small>','· ผนึกแล้วออร่าหาย</small><small class="sub">พลังเฉพาะบอส: HP +'+pct(hp)+'% · โจมตี +'+pct(atk)+'% · ป้องกัน +'+pct(def)+'% เพิ่มจากออร่า'+(z.id===5&&boss?.sp==='nidhogg'?' · นีดฮ็อก 2 ตัว':'')+'</small>');};

// @soulbeast-end 1082-demonlordBalance
