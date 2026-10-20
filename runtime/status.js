// Ailments, buffs, cures and status handbook
// Build-time module: shared legacy scope; execution order is in manifest.json.
// @soulbeast-unit 0011-STS


/* ================= STATUSES & PASSIVES ================= */
const STS=SoulbeastContent.STS();
// @soulbeast-end 0011-STS
// @soulbeast-unit 0012-IMM

const IMM=SoulbeastContent.IMM();
// @soulbeast-end 0012-IMM
// @soulbeast-unit 0038-CURES

const CURES=SoulbeastContent.CURES();
// @soulbeast-end 0038-CURES
// @soulbeast-unit 0259-applyStatus

function applyStatus(t,k,ch){if(t.hp<=0||t.status[k])return;if(IMM[k]&&t.types.some(x=>IMM[k].includes(x)))return;
 if(t.pas.some(p=>PAS[p]&&PAS[p].imm&&PAS[p].imm.includes(k)))return;
 if((k==='freeze'||k==='sleep')&&(t.status.freeze||t.status.sleep))return;
 if(Math.random()<ch){t.status[k]=STS[k].d();ExtraAudio.play(k==='poison'?'poison':'status');blog(`${t.name} ${STS[k].n}!`);fxAdd(t,STS[k].n,'mp')}}
// @soulbeast-end 0259-applyStatus
// @soulbeast-unit 0376-miniStatus

function miniStatus(){const P=S.P,s=pStats();return `<div class="card mini">
 <div class="row">${portrait('player',36)}<div class="grow"><div class="row"><b class="grow"><span data-user-content>${esc(P.name)}</span></b><span class="num sub">${P.hp}/${s.hp}</span></div>${bar(P.hp,s.hp)}</div></div>
 ${party().map(p=>{const q=calcPet(p);return `<div class="row">${portrait(p.sp,30,{form:p.form||0})}<div class="grow"><div class="row"><span class="grow" style="font-size:13px">${petName(p)}</span><span class="num sub">${p.hp<=0?'หมดสติ':p.hp+'/'+q.hp}</span></div>${bar(Math.max(0,p.hp),q.hp)}</div></div>`}).join('')}</div>`}
// @soulbeast-end 0376-miniStatus
// @soulbeast-unit 0890-statusBattleCard

function statusBattleCard(html,u){html=battleEffectIcons(battlePortraitElements(html,u),u);const statuses=Object.keys(u.status||{}).filter(k=>STS[k]&&u.status[k]);if(!statuses.length)return html;const colors=statuses.map(k=>STS[k].c),label=statuses.map(k=>STS[k].n).join(' · ');return html.replace(/<button\b[^>]*>/,tag=>{tag=tag.replace('class="','class="has-battle-status '+(colors.length>1?'multi-battle-status ':'')).replace(/style="/, 'style="--status-main:'+colors[0]+';--status-gradient:linear-gradient(120deg,'+colors.join(',')+');');if(!tag.includes('style="'))tag=tag.replace('<button','<button style="--status-main:'+colors[0]+';--status-gradient:linear-gradient(120deg,'+colors.join(',')+');"');if(tag.includes('title="'))tag=tag.replace('title="','title="'+esc(label)+' · ');else tag=tag.replace('<button','<button title="'+esc(label)+'"');return tag.replace('<button','<button data-status="'+statuses.join(' ')+'"');});}
// @soulbeast-end 0890-statusBattleCard
// @soulbeast-unit 0891-statusUnitCard

const statusUnitCard=ucard;
// @soulbeast-end 0891-statusUnitCard
// @soulbeast-unit 0892-ucard
ucard=function(u,i){return statusBattleCard(statusUnitCard(u,i),u);};
// @soulbeast-end 0892-ucard
// @soulbeast-unit 0960-PERSISTENT_AILMENTS


// Durable ailments belong to player saves; online match snapshots remain independent.
const PERSISTENT_AILMENTS=['poison','burn','confuse','para','static','freeze','chill'];
// @soulbeast-end 0960-PERSISTENT_AILMENTS
// @soulbeast-unit 0961-persistentBattleUnit

function persistentBattleUnit(u){return !!S.battle&&!['pvp','world','camp','guildwar'].includes(S.battle.kind)&&u.side==='ally'&&['player','pet'].includes(u.kind);}
// @soulbeast-end 0961-persistentBattleUnit
// @soulbeast-unit 0962-retainedBattleAilments

function retainedBattleAilments(u){return persistentBattleUnit(u)?Object.fromEntries(PERSISTENT_AILMENTS.filter(k=>u.status?.[k]).map(k=>[k,u.status[k]])):{};}
// @soulbeast-end 0962-retainedBattleAilments
// @soulbeast-unit 0963-storedAilments

function storedAilments(o){return Object.fromEntries(PERSISTENT_AILMENTS.filter(k=>o.ailments?.[k]).map(k=>[k,Math.max(2,Number(o.ailments[k])||2)]));}
// @soulbeast-end 0963-storedAilments
// @soulbeast-unit 0964-forestPlayerUnit

const forestPlayerUnit=playerUnit;
// @soulbeast-end 0964-forestPlayerUnit
// @soulbeast-unit 0965-playerUnit
playerUnit=function(){const u=forestPlayerUnit();u.status={...u.status,...storedAilments(S.P)};return u;};
// @soulbeast-end 0965-playerUnit
// @soulbeast-unit 0966-forestPetUnit

const forestPetUnit=petUnit;
// @soulbeast-end 0966-forestPetUnit
// @soulbeast-unit 0967-petUnit
petUnit=function(p){const u=forestPetUnit(p);u.status={...u.status,...storedAilments(p)};return u;};
// @soulbeast-end 0967-petUnit
// @soulbeast-unit 0972-forestFullHeal

const forestFullHeal=fullHeal;
// @soulbeast-end 0972-forestFullHeal
// @soulbeast-unit 0973-fullHeal
fullHeal=function(){forestFullHeal();S.P.ailments={};(S.zone?carriedPets():S.P.pets).forEach(p=>p.ailments={});};
// @soulbeast-end 0973-fullHeal
// @soulbeast-unit 0974-forestAllFull

const forestAllFull=allFull;
// @soulbeast-end 0974-forestAllFull
// @soulbeast-unit 0975-allFull
allFull=function(){return forestAllFull()&&![S.P,...(S.zone?carriedPets():S.P.pets)].some(o=>Object.keys(storedAilments(o)).length);};
// @soulbeast-end 0975-allFull
// @soulbeast-unit 0976-forestUse

const forestUse=handlers.use;
// @soulbeast-end 0976-forestUse
// @soulbeast-unit 1000-bagAilmentInfo


function bagAilmentInfo(o,who){const states=Object.keys(storedAilments(o));if(!states.length)return '';const cures=Object.entries(CON).filter(([,it])=>it.cure?.some(k=>states.includes(k)));return '<section class="bag-ailments" aria-label="สถานะที่ติดค้าง"><b>สถานะที่ติดค้าง</b>'+states.map(k=>'<div class="bag-ailment-row"><span class="battle-effect-icon">'+battleEffectImage(k,STS[k].n)+'</span><div><strong>'+esc(STS[k].n)+'</strong><small>รักษาด้วย '+cures.filter(([,it])=>it.cure.includes(k)).map(([,it])=>esc(it.n)).join(' / ')+'</small></div></div>').join('')+'<div class="row wrap bag-cure-actions">'+cures.map(([id,it])=>'<button class="btn sm" data-a="use" data-v="'+id+':'+who+'" '+(!(S.P.items[id]>0)||statsLocked()||towerActive()?'disabled':'')+'>ใช้'+esc(it.n)+' · มี '+fmt(S.P.items[id]||0)+'</button>').join('')+'</div></section>';}
// @soulbeast-end 1000-bagAilmentInfo
// @soulbeast-unit 1013-cleanseAllAilments

function cleanseAllAilments(){let n=0;for(const o of [S.P,...S.P.pets]){if(Object.keys(o.ailments||{}).length)n++;o.ailments={};if(o.hp>0){const st=o===S.P?pStats():calcPet(o);o.hp=Math.min(st.hp,o.hp+Math.round(st.hp*.1));o.mp=Math.min(st.mp,o.mp+Math.round(st.mp*.1));}}return n;}
// @soulbeast-end 1013-cleanseAllAilments
