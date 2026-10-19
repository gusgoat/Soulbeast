// Beast growth, skills, forms and discovery
// Build-time module: shared legacy scope; execution order is in manifest.json.
// @soulbeast-unit 0118-chain


/* ---- classes ---- */
function chain(k){const a=[];while(k){a.unshift(k);k=CLS[k].p}return a}
// @soulbeast-end 0118-chain
// @soulbeast-unit 0136-formFor


/* ---- beasts ---- */
function formFor(k,lv){const e=SP[k].ev||[];let f=0;e.forEach((x,i)=>{if(lv>=x[0])f=i+1});return f}
// @soulbeast-end 0136-formFor
// @soulbeast-unit 0137-formName

const formName=(k,f)=>f?SP[k].ev[f-1][1]:SP[k].n;
// @soulbeast-end 0137-formName
// @soulbeast-unit 0140-calcPet

function calcPet(p,wild=1){const sp=SP[p.sp],fm=FM[p.form||0],s={};
 K.forEach((k,i)=>{const b=i<9?sp.b[i]:5,f=(k==='acc'||k==='crit'||k==='eva')?1:fm;s[k]=(b+grow(k,b)*(p.lv-1)*wild)*f+((p.pts&&p.pts[k])||0)*PER[k]});return rnd(s)}
// @soulbeast-end 0140-calcPet
// @soulbeast-unit 0148-petSkills


function petSkills(p){const s=SP[p.sp],a=['attack',...s.sk.filter((_,i)=>p.lv>=SKLV[i])];if(sigLearned(p))a.push(s.sig);return a}
// @soulbeast-end 0148-petSkills
// @soulbeast-unit 0414-markFormSeen


/* Discovery is per species AND form. Existing saves have no historical form log. */
function markFormSeen(sp,form=0){if(!S.P||!SP[sp])return;const P=S.P,max=(SP[sp].ev||[]).length,f=Math.max(0,Math.min(max,Math.floor(form)||0));P.seen=P.seen||{};P.seen[sp]=1;P.seenForms=P.seenForms||{};const a=Array.isArray(P.seenForms[sp])?P.seenForms[sp]:[];if(!a.includes(f))a.push(f);P.seenForms[sp]=a.sort((x,y)=>x-y)}
// @soulbeast-end 0414-markFormSeen
// @soulbeast-unit 0415-initDiscovery

function initDiscovery(){const P=S.P;if(!P)return;if(!P.seenForms||typeof P.seenForms!=='object'||Array.isArray(P.seenForms))P.seenForms={};if(!P.discoveryVersion){for(const sp of Object.keys(P.seen||{}))if(P.seen[sp])markFormSeen(sp,0);P.discoveryVersion=1}for(const p of P.pets||[])markFormSeen(p.sp,p.form||0)}
// @soulbeast-end 0415-initDiscovery
// @soulbeast-unit 0416-observeUnits

function observeUnits(units){for(const u of units||[])if(u.sp)markFormSeen(u.sp,u.evo||0)}
// @soulbeast-end 0416-observeUnits
// @soulbeast-unit 0417-dexForms

function dexForms(sp){const known=S.P.seenForms?.[sp]||[],forms=[{f:0,n:SP[sp].n},...(SP[sp].ev||[]).map((e,i)=>({f:i+1,n:e[1]}))];return `<div class="dex-forms">${forms.map(({f,n})=>`<div class="dex-form">${portrait(sp,64,{form:f})}<b>${esc(n)}</b><small>${f?'ร่างพัฒนา '+f:'ร่างพื้นฐาน'} · ${known.includes(f)?'เคยพบ':'ยังไม่เคยพบ'}</small></div>`).join('')}</div>`}
// @soulbeast-end 0417-dexForms
// @soulbeast-unit 0431-beastLocations

function beastLocations(k){return ZN.flatMap(z=>{const tags=[];if(z.sp.includes(k))tags.push('ทั่วไป Lv '+z.lv.join('–'));if(z.rare.includes(k))tags.push('หายาก Lv '+z.lv.join('–'));if((z.bosses||[z.boss]).some(b=>b.sp===k))tags.push('บอส Lv '+z.boss.lv);return tags.length?[z.n+' · '+tags.join(' / ')]:[]})}
// @soulbeast-end 0431-beastLocations
// @soulbeast-unit 0512-mistLegendsUnlocked

const mistLegendsUnlocked=(P=S.P)=>!!P&&Number(P.cleared)>0;
// @soulbeast-end 0512-mistLegendsUnlocked
// @soulbeast-unit 0513-beastRarity

const beastRarity=q=>q.legendary?'legendary':q.rare?'rare':'normal';
// @soulbeast-end 0513-beastRarity
// @soulbeast-unit 0515-mistRarePool

function mistRarePool(zd){return [...zd.rare,...MIST_RARE_DEFS.filter(x=>x[4]===zd.id).map(x=>x[0])];}
// @soulbeast-end 0515-mistRarePool
// @soulbeast-unit 0518-mistLocations

function mistLocations(k){const q=SP[k];if(q.legendary)return ['ม่านหมอกในป่าหลักทุกแห่ง · หลังชนะบอสจอมมารเท่านั้น · Lv 45–52'];if(q.mistNew){const z=ZN.find(z=>z.id===q.mistZone);return [z.n+' · ม่านหมอกเท่านั้น · Lv '+z.lv[1]+'–'+(z.lv[1]+2)];}return beastLocations(k);}
// @soulbeast-end 0518-mistLocations
