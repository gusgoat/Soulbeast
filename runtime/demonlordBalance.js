// Final forest encounter only; never mutate species, player classes or online rules.
// @soulbeast-unit 1082-demonlordBalance
const DEMONLORD_BALANCE={version:1,boss:{hp:.75,patk:.85,matk:.85,pdef:.9,mdef:.9},general:{hp:.5,patk:.45,matk:.45,pdef:.7,mdef:.7,spd:.9},helper:{hp:.8,patk:.7,matk:.7}};
function scaleDemonEncounterUnit(u,scale){u.st={...u.st};for(const [key,factor]of Object.entries(scale))u.st[key]=Math.max(1,Math.round(u.st[key]*factor));u.hp=u.st.hp;u.mp=Math.min(u.mp,u.st.mp);u.demonBalanceVersion=DEMONLORD_BALANCE.version;}
function prepareDemonEncounter(enemies,kind,meta){if(kind!=='boss'||Number(meta)!==6)return false;const boss=enemies.find(u=>u.sp==='demonlord'&&u.boss&&!u.immortalWorld);if(!boss||boss.demonBalanceVersion)return false;scaleDemonEncounterUnit(boss,DEMONLORD_BALANCE.boss);for(const u of enemies.filter(u=>u.kind==='human'&&u.side==='enemy')){scaleDemonEncounterUnit(u,DEMONLORD_BALANCE.general);u.skills=[...new Set(['attack',...u.skills.filter(id=>SK[id]&&['p','m','h','auto'].includes(SK[id].t)&&!SK[id].summon&&!SK[id].mile&&(SK[id].pw||100)<=140).slice(-3)])];}return true;}
const demonBalanceStartPrevious=startBattle;
startBattle=function(enemies,kind,meta,...args){const changed=prepareDemonEncounter(enemies,kind,meta),out=demonBalanceStartPrevious(enemies,kind,meta,...args);if(changed&&S.battle){blog('แสงศิลาผนึกกดพลังแม่ทัพ: เน้นท่าโจมตี ไม่ใช้การฮีลและอัญเชิญซ้อน');blog('จอมมารยังใช้ทุกสกิล และเรียกอสูรตำนาน Lv 40 ได้หนึ่งตัว');}return out;};
const demonBalanceSummonPrevious=bossSummonLegends;
bossSummonLegends=function(u,count){const out=demonBalanceSummonPrevious(u,count),b=B();if(out&&u.demonBalanceVersion&&u.sp==='demonlord'&&!u.immortalWorld&&b?.kind==='boss'&&Number(b.meta)===6){for(const pet of b.enemies.filter(x=>x.bossHelper&&x.summonedBy===u.id&&!x.demonBalanceVersion))scaleDemonEncounterUnit(pet,DEMONLORD_BALANCE.helper);}return out;};
const demonBalanceZonePrevious=vZone;
vZone=function(){const html=demonBalanceZonePrevious(),z=S.zone&&ZN[S.zone.id-1],boss=z&&(forestPassed(z)?S.zone.boss||z.boss:z.boss);if(!isBossDoorScene()||z?.id!==6||boss?.sp!=='demonlord')return html;return html.replace(/ออร่าบอส:[^<]*/,'ศึกสุดท้าย: แม่ทัพสุ่ม 2 คนเน้นท่าโจมตี · จอมมารใช้ทุกสกิลและเรียกอสูรตำนาน Lv 40 ได้ 1 ตัว · ผนึกจอมมารไม่ได้');};
// @soulbeast-end 1082-demonlordBalance
