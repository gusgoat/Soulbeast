// @soulbeast-unit 1093-accountManagement
const AccountManagement={
 credits(){return '<footer class="card stack creator-credits" translate="no"><b>SoulBeast Created by GusTheGoat</b><span>ติดต่อ Line official: @soulbeast</span><span>Line openchat: SoulBeast Game</span><span>Page Facebook: SoulbBeast Game official</span></footer>';},
 clean(){IMG={};if(S.P)delete S.P.profile;for(const u of [...(S.battle?.allies||[]),...(S.battle?.enemies||[])]){if(u.skills)u.skills=u.skills.filter(id=>SK[id]);if(['electric','ground'].includes(u.enchant)){delete u.enchant;delete u.enchantTurns;}}}
};
const accountManagementMigrate=migrate;
migrate=function(...args){const out=accountManagementMigrate(...args);AccountManagement.clean();return out;};
const accountManagementSettings=vSettings;
vSettings=function(){return accountManagementSettings().replace('<button class="btn danger" data-a="reset">เริ่มเกมใหม่</button>','<button class="btn" data-a="reset">เริ่มเกมใหม่</button><button class="btn" data-a="accountCharacters">กลับหน้าเลือกตัวละคร</button>')+AccountManagement.credits();};
handlers.img=()=>{};handlers.delimg=()=>{};saveImg=()=>{};
handlers.reset=()=>{save();location.assign('./accounts-staging.html?create=1');};
handlers.doreset=handlers.reset;
handlers.accountCharacters=()=>{save();location.assign('./accounts-staging.html');};
// @soulbeast-end 1093-accountManagement
