// Art, animation, icons and visual effects
// Build-time module: shared legacy scope; execution order is in manifest.json.
// @soulbeast-unit 0143-MIST_SIGNATURES

const MIST_SIGNATURES=SoulbeastContent.MIST_SIGNATURES();
// @soulbeast-end 0143-MIST_SIGNATURES
// @soulbeast-unit 0169-ART_BEASTS


const ART_BEASTS=SoulbeastContent.ART_BEASTS();
// @soulbeast-end 0169-ART_BEASTS
// @soulbeast-unit 0170-ART_HEROES

const ART_HEROES=SoulbeastContent.ART_HEROES();
// @soulbeast-end 0170-ART_HEROES
// @soulbeast-unit 0171-ART_FORMS

const ART_FORMS=SoulbeastContent.ART_FORMS();
// @soulbeast-end 0171-ART_FORMS
// @soulbeast-unit 0173-BUILTIN_ART

const BUILTIN_ART=SoulbeastContent.BUILTIN_ART();
// @soulbeast-end 0173-BUILTIN_ART
// @soulbeast-unit 0175-ROUTE_ART

const ROUTE_ART={"beast":"assets/media/83f8e34215dc144f80ff1dd8.webp","bush":"assets/media/9c7b0a15d74efd07abea14ac.webp","mist":"assets/media/bc8a0bd07fad8c6eecf0f0c3.webp","ruins":"assets/media/1768142eb41df7b938b1bfd3.webp","bandit":"assets/media/e60e7f0018468fcc9c450cfe.webp","spring":"assets/media/4c73e62af3bd4cb07fa6ca26.webp","shrine":"assets/media/75cca477ae23c877efa99972.webp","village":"assets/media/52bbcf608e04ac5bac4af240.webp","hospital":"assets/media/bd4e0d837f6c05bd9277216a.webp","stranger":"assets/media/4f8b56bb78be03fd4f3c8986.webp","exit":"assets/media/44ba8d9d1e0fb7a84eb36026.webp","unknown":"assets/media/14b261b589bdaf5ed68b649f.webp","chest":"assets/media/00d6dd41329e230760ded92f.webp","trap":"assets/media/8cc3c50f4f7fc8d6dd9cf8c5.webp","walk":"assets/media/cb6c87986123235089e46935.webp","boss":"assets/media/a8972bf26e3633408aab2c28.webp"};
// @soulbeast-end 0175-ROUTE_ART
// @soulbeast-unit 0176-ITEM_ART

const ITEM_ART={"pot":"assets/media/63c335a73a6a590349a6e6d2.webp","pot2":"assets/media/b86a27ef43252429632bbe57.webp","pot3":"assets/media/b374b749ccb44d0c129b511b.webp","eth":"assets/media/9286c860a849d4d31422a415.webp","eth2":"assets/media/1d68952be456ccc7c5469e1a.webp","rev":"assets/media/28087063529d52b7849048fd.webp","antidote":"assets/media/c3e5a945ec149b0772e06626.webp","burnheal":"assets/media/ef38a1b90c7a0e4af23c9307.webp","thaw":"assets/media/a4293868d890934ee2d749fa.webp","relax":"assets/media/1644cc9a053bf060fa8a7eea.webp","calm":"assets/media/c5588155d4a8e48cfe54b1e1.webp","allcure":"assets/media/2d10790c7af5fbe5e6076e5a.webp","seal1":"assets/media/f1a44ab79c10c68d59fcaa05.webp","seal2":"assets/media/b55b5fa4ec97564da9cd3a5e.webp","seal3":"assets/media/07d709da9d8e22abe5ce05e5.webp","seal4":"assets/media/922cbed1f4ed7682f3b8f46e.webp","seal5":"assets/media/c2647667a4b22f3777ca4303.webp","sword":"assets/media/655fb42212df8f03df3d3ebf.webp","axe":"assets/media/826d0e1462f41334d388073a.webp","bow":"assets/media/652855bf5747aa4574c60931.webp","staff":"assets/media/0d0666f6699d65079f3f4a10.webp","mace":"assets/media/52f4b8d4d172268c351f64a9.webp","gun":"assets/media/19111cacdff328d4d8381562.webp","druid":"assets/media/943170abbb24803600c780ab.webp","dagger":"assets/media/a78b0f5d6512e8726686c3d0.webp","orb":"assets/media/727b4530c22de0e9373d825e.webp","armor":"assets/media/acd6f34b8d73a01789e87c5a.webp","gloves":"assets/media/fce62c39ef78958db59f57f6.webp","boots":"assets/media/9866229d833f95918f8a5195.webp","belt":"assets/media/08e2a9cf05083a6c43d627d6.webp","bracelet":"assets/media/24014e6e58de20bcb23593ec.webp","ring":"assets/media/3c399208357a644db019879c.webp","necklace":"assets/media/2516222f9de92639623108ba.webp","crown":"assets/media/33ba9556f8b80c2feede1d24.webp","chest":"assets/media/37b22ac5cdb395aa00137a62.webp","goldchest":"assets/media/ec0ed7fe7d97319e75020783.webp","whip":"assets/media/9b6b12415ecc15c9ecc6c0a9.webp"};
// @soulbeast-end 0176-ITEM_ART
// @soulbeast-unit 0177-itemIcon

function itemIcon(id,size=44){const it=EQ[id]||CON[id],part=String(id).split('|');let art=ITEM_ART[id],tone='#66728e',badge='';
 if(it?.slot){art=ITEM_ART[it.slot==='weapon'?it.wt:it.slot];tone=it.legend?'#d9b35b':it.el&&EL[it.el]?EL[it.el].c:'#99b2c9';badge=it.legend?'✦':it.lv>1?'L'+it.lv:''}
 if(it?.rareLoot){tone='#c9f5df';badge='✦'}
 if(!art&&part.length===2){art=BUILTIN_ART[part[0]];badge='◆';tone='#acbfce'}
 if(!art)return '';return `<span class="item-art ${it?.legend?'legendary':''}" style="--item-size:${size}px;--item-color:${tone}"><img src="${art}" alt="">${badge?`<small>${badge}</small>`:''}</span>`}
// @soulbeast-end 0177-itemIcon
// @soulbeast-unit 0178-routePicture

function routePicture(type,hidden=false,banner=false){const k=hidden?'unknown':ROUTE_ART[type]?type:'walk';return `<img class="${banner?'route-banner':'route-picture'}" src="${ROUTE_ART[k]}" alt="${hidden?'ทางมืดที่ยังไม่รู้ว่ามีอะไร':EV[type]?.n||'เส้นทางในพงไพร'}">`}
// @soulbeast-end 0178-routePicture
// @soulbeast-unit 0180-playWalk

function playWalk(type,side){Music.step();Sound.fx(type==='bush'?'roots':type==='mist'||type==='stranger'?'mist':(type==='spring'||type==='cleanse')?'water':type==='revival'||type==='shrine'||type==='hospital'?'revive':type==='ruins'?'rune':'',.15);if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;const L=document.getElementById('travelFx'),app=document.getElementById('app');if(!L||!app)return;
 clearTimeout(walkTimer);L.replaceChildren();app.classList.remove('walk-bob','walk-side');void app.offsetWidth;app.classList.add(['beast','bandit'].includes(type)?'walk-side':'walk-bob');
 const add=(cls,i,txt='',color='')=>{const d=document.createElement('span');d.className=cls;d.textContent=txt;d.style.setProperty('--x',(16+(i*19)%70)+'%');d.style.setProperty('--y',(22+(i*13)%53)+'%');d.style.setProperty('--dx',(side?90:-90)+'px');if(color)d.style.setProperty('--c',color);L.appendChild(d)};
 if(type==='bush')for(let i=0;i<9;i++)add('trail-leaf',i);
 else if(type==='mist'||type==='stranger')for(let i=0;i<3;i++)add('trail-fog',i);
 else if(type==='spring'||type==='revival'||type==='cleanse')for(let i=0;i<3;i++)add('trail-water',i);
 else if(type==='shrine'||type==='ruins'||type==='exit')for(let i=0;i<7;i++)add('trail-spark',i,'✧');
 else if(type==='hospital')for(let i=0;i<5;i++)add('trail-spark',i,'✚','#a0edba');
 else if(type==='beast')for(let i=0;i<3;i++)add('trail-spark',i,'🐾','#dec8a1');
 else if(type==='bandit')for(let i=0;i<5;i++)add('trail-spark',i,'✧','#e69d63');
 walkTimer=setTimeout(()=>{L.replaceChildren();app.classList.remove('walk-bob','walk-side')},1050)}
// @soulbeast-end 0180-playWalk
// @soulbeast-unit 0182-ITEM_ART-revivePotion

ITEM_ART.revivePotion='assets/media/4ef37cbbfc655c01d2044bed.webp';
// @soulbeast-end 0182-ITEM_ART-revivePotion
// @soulbeast-unit 0183-BUILTIN_ART-Object

Object.assign(BUILTIN_ART,SoulbeastContent.BUILTIN_ART_additions_1());
// @soulbeast-end 0183-BUILTIN_ART-Object
// @soulbeast-unit 0184-BUILTIN_ART

BUILTIN_ART['naga:1']='assets/media/4e3504b508f596794327e780.webp';
// @soulbeast-end 0184-BUILTIN_ART
// @soulbeast-unit 0196-BUILTIN_ART-Object


Object.assign(BUILTIN_ART,SoulbeastContent.BUILTIN_ART_additions_2());
// @soulbeast-end 0196-BUILTIN_ART-Object
// @soulbeast-unit 0197-atlasFace

// Missing gender means legacy artwork; never infer/migrate an existing character's gender.
const FEMALE_CLASS_ART=new Set(['archer','bard','dirge','mage','enchanter','biochem','druid','grove','archdruid','summoner']);
function classPortraitSource(cls,gender){
 if(!CLS[cls])return '';
 const original=BUILTIN_ART['cls:'+cls]||BUILTIN_ART['cls:'+baseOf(cls)];
 if(!['male','female'].includes(gender))return original;
 return gender===(FEMALE_CLASS_ART.has(cls)?'female':'male')?original:'assets/portraits/'+cls+'-'+gender+'.webp';
}
function portraitGender(key,opts={}){
 if(opts.legacy)return undefined;
 if(['male','female'].includes(opts.gender))return opts.gender;
 if(key?.startsWith('npc:'))return undefined;
 return S.screen==='start'?(S.ui.gender==='female'?'female':'male'):S.P?.gender;
}
function atlasFace(key,form=0,opts={}){if(SP[key]?.mistNew)return mistPortrait(key);
 let artKey=key;
 if(key==='player'||key?.startsWith('cls:')||key?.startsWith('npc:')){const cls=key==='player'?(S.P?.cls||S.ui.cls||'swordsman'):key.slice(4);artKey=BUILTIN_ART['cls:'+cls]?'cls:'+cls:'cls:'+baseOf(cls)}
 const isClass=key==='player'||key?.startsWith('cls:')||key?.startsWith('npc:');const cls=key==='player'?(S.P?.cls||S.ui.cls||'swordsman'):key?.slice(4);
 const src=isClass?classPortraitSource(cls,portraitGender(key,opts)):(BUILTIN_ART[form>0?key+':'+form:artKey]||BUILTIN_ART[artKey]);return src?`<img class="atlas-face" src="${src}" alt="">`:''}
// @soulbeast-end 0197-atlasFace
// @soulbeast-unit 0204-portrait


function unitPortrait(u,size,opts={}){
 const person=u.kind==='player'||u.img==='player';
 if(!person||u.form)return portrait(u.img||u.sp,size,{form:u.evo||0});
 const gender=opts.own?S.P?.gender:u.gender,valid=['male','female'].includes(gender);
 return portrait(opts.own?'player':'cls:'+u.cls,size,{gender,legacy:!valid});
}
function portrait(key,size,opts={}){
 let em='?',ec='#d9b35b',img=IMG[key+':'+(opts.form||0)]||IMG[key];
 if(key==='player'){em=CLS[baseOf(S.P.cls)].em}
 else if(key&&key.startsWith('npc:')){em=CLS[baseOf(key.slice(4))].em;ec='#b8a27a'}
 else if(key&&key.startsWith('form:')){const f=FORMS[key.slice(5)];em=f.em;ec=EL[f.t[0]].c;img=null}
 else if(key&&key.startsWith('cls:')){em=CLS[baseOf(key.slice(4))].em}
 else if(SP[key]){em=SP[key].em;ec=EL[SP[key].t[0]].c}
 return `<div class="pt ${opts.unk?'unk':''}" style="--s:${size}px;--ec:${ec}">${img?`<img src="${img}" alt="">`:(atlasFace(key,opts.form||0,opts)||em)}</div>`}
// @soulbeast-end 0204-portrait
// @soulbeast-unit 0205-elChip

const elChip=e=>elementIcon(e);
// @soulbeast-end 0205-elChip
// @soulbeast-unit 0206-tChips

const tChips=ts=>(ts||[]).map(elChip).join('');
// @soulbeast-end 0206-tChips
// @soulbeast-unit 0207-pasChip

const pasChip=k=>k&&PAS[k]?`<span class="chip pas" title="${esc(PAS[k].d)}">${classAbilityImage(k,26)}${PAS[k].n}</span>`:'';
// @soulbeast-end 0207-pasChip
// @soulbeast-unit 0208-bar

const bar=(v,m,cls='')=>`<div class="bar ${cls} ${!cls&&v/m<.3?'low':''}"><i style="width:${clamp(m?v/m*100:0,0,100)}%"></i></div>`;
// @soulbeast-end 0208-bar
// @soulbeast-unit 0217-VQ-vfx

/* ---- skill visual effects (queued during battle logic, played after each render) ---- */
const VQ=[],vfx=(k,id,o={})=>{if(S.battle)VQ.push({k,id,...o})};
// @soulbeast-end 0217-VQ-vfx
// @soulbeast-unit 0219-SIGNATURE_VFX

const SIGNATURE_VFX={
 s_demon:['eclipse','✦','#b783ff'],s_phoenix:['phoenix','✧','#ffb347'],s_garuda:['wing','羽','#ffd976'],s_naga:['water','≈','#5fe4d5'],s_dragon:['dragon','龍','#fa9850'],s_nidhogg:['eclipse','✦','#9875dd'],
 s_kappa:['water','◉','#74d4ed'],s_wisp:['spirit','✧','#7cb9ff'],s_mandrake:['roots','❧','#a5db7e'],s_raiju:['storm','ϟ','#ffe987'],s_pixie:['blessing','✧','#f8aad6'],s_kodama:['roots','❧','#9ad19f'],s_kitsune:['fox','✧','#ff906b'],s_tengu:['wing','羽','#dcc0ff'],s_griffin:['claw','✦','#e8c48a'],s_sphinx:['rune','◇','#edd38a'],s_golem:['quake','▰','#c5cecf'],s_scarab:['rune','☀','#ffd573'],s_qilin:['blessing','✧','#ffe1ac'],s_unicorn:['blessing','✧','#eec9ff'],s_pegasus:['wing','ϟ','#aed9ff'],s_erawan:['quake','◉','#ffe4ac'],s_baihu:['claw','爪','#e8f5ff'],s_fenrir:['claw','爪','#9ee0ff'],s_kraken:['water','≈','#967be9'],s_jiangshi:['rune','符','#efd373'],s_neko:['claw','爪','#b0a0ef'],s_kinnaree:['wing','羽','#ffd29e'],s_cyclops:['storm','ϟ','#dab48b'],s_rajasi:['claw','爪','#ffd067']};
// @soulbeast-end 0219-SIGNATURE_VFX
// @soulbeast-unit 0220-skillLook

function skillLook(id){const sk=SK[id]||{};if(SIGNATURE_VFX[id])return SIGNATURE_VFX[id];
 if(/^(bd_|ma_|di_)/.test(id))return ['music','♪','#dcb2ff'];
 if(/^(me_|mt_)/.test(id))return ['coins','◈','#ffe29a'];
 if(/^(gn_|mk_|gs_|bh_|at_|cn_|dm_)/.test(id))return ['shot','✦','#ffcd7c'];
 if(/^(ar_|ra_|sn_|wd_)/.test(id))return ['arrow','➤','#b9e196'];
 if(/^(gl_|pa_|te_|et_)/.test(id))return ['shield','◇','#ffe4a5'];
 if(/^(th_|ro_|as_|nj_|rn_)/.test(id))return ['shadow','✦','#b7a0ef'];
 if(/^(sw_|sa_|ke_|sh_|sb)/.test(id))return ['blade','✦','#d9e9ff'];
 if(sk.t==='form'||/^(dr_|fe_|gv_|sc_|f_)/.test(id))return ['roots','❧','#9dde9d'];
 if(sk.rev||sk.revAll||sk.t==='heal')return ['blessing','✚','#aff1bf'];
 if(/^(su_|sl_|ss_|sp_)/.test(id))return ['rune','◇','#8ce5dc'];
 if(sk.el==='electric')return ['storm','ϟ','#ffe883'];if(sk.el==='ice')return ['ice','❄','#b7f6ff'];
 if(sk.el==='fire')return ['flame','✧','#ffad68'];if(sk.el==='water')return ['water','≈','#91d7ff'];
 if(sk.el==='grass')return ['roots','❧','#a4dd8c'];if(sk.el==='dragon')return ['dragon','龍','#bcb0ff'];
 if(sk.el==='dark'||sk.el==='ghost')return ['spirit','✧','#b9a0ef'];if(sk.el==='ground'||sk.el==='rock')return ['quake','▰','#e5c99d'];
 return ['rune','◇',sk.el&&EL[sk.el]?EL[sk.el].c:'#dfc789']}
// @soulbeast-end 0220-skillLook
// @soulbeast-unit 0221-skillVisualLegacy

function skillVisualLegacy(L,e,x,y){if(!e.skill||e.skill==='attack'||e.skill==='rest')return;
 const [kind,glyph,c]=skillLook(e.skill),cast=e.k==='cast',n=cast?4:7;
 // Deterministic geometry avoids consuming battle random numbers.
 const spawn=(cls,px=x,py=y,text=null,vars={})=>{if(L.childElementCount<180)vSpawn(L,cls,[px,py],c,text,vars)};
 if(cast){spawn('vx-sigil',x,y,glyph);return}
 if(kind==='blade'||kind==='shadow'||kind==='claw'){for(let i=0;i<3;i++)spawn('vx-blade',x+(i-1)*9,y+(i-1)*9,null,{'--angle':(kind==='claw'?60:kind==='shadow'?-65:-30)+i*20+'deg'});return}
 if(kind==='shield'){spawn('vx-shield');spawn('vx-ring');return}
 if(kind==='water'||kind==='eclipse'||kind==='spirit'||kind==='fox'){spawn('vx-vortex');spawn('vx-sigil',x,y,glyph)}
 if(kind==='quake'){spawn('vx-crack',x,y+15);spawn('vx-ring')}
 if(kind==='shot'||kind==='arrow'){for(let i=0;i<3;i++)spawn('vx-lance',x-90,y-25+i*20,null,{'--angle':'0deg','--length':'110px'});return}
 if(kind==='dragon'||kind==='phoenix'||kind==='wing'){spawn('vx-sigil',x,y,glyph);for(let side of [-1,1])spawn('vx-blade',x+side*32,y-8,null,{'--angle':side*40+'deg'})}
 if(kind==='rune'||kind==='blessing'||kind==='roots')spawn('vx-sigil',x,y,glyph);
 for(let i=0;i<n;i++){const angle=i*Math.PI*2/n,dx=Math.cos(angle)*60,dy=Math.sin(angle)*48-(kind==='blessing'||kind==='phoenix'||kind==='music'?45:0);
 spawn('vx-glyph',x+Math.cos(angle)*10,y+Math.sin(angle)*10,kind==='ice'?'❄':kind==='storm'?'ϟ':kind==='music'?(i%2?'♫':'♪'):kind==='coins'?'◈':kind==='roots'?'❧':glyph,{'--dx':dx+'px','--dy':dy+'px','--rot':(i%2?-25:25)+'deg','--glyph-size':kind==='storm'?'38px':'24px'})}}
// @soulbeast-end 0221-skillVisualLegacy
// @soulbeast-unit 0223-vSpawn

function vSpawn(L,cls,pos,c,txt,vars={}){if(!L||L.childElementCount>=(window.innerWidth<620?150:240))return;const d=document.createElement('div');d.className='vx '+cls;d.style.setProperty('--c',c);if(pos){d.style.left=pos[0]+'px';d.style.top=pos[1]+'px';}for(const k in vars)d.style.setProperty(k,String(vars[k]));if(txt)d.textContent=txt;L.appendChild(d);const life=Math.min(3400,Math.max(400,Number(vars['--life-ms'])||1100))+(parseFloat(vars['--wait'])||0);setTimeout(()=>d.remove(),life+60);return d;}
// @soulbeast-end 0223-vSpawn
// @soulbeast-unit 0225-skillVisual

function skillVisual(L,e,x,y){spellBurst(L,e,x,y);}
// @soulbeast-end 0225-skillVisual
// @soulbeast-unit 0226-SPELL_UNLOCK

/* Spell spectacle: CSS animation only, never consumes combat randomness. */
const SPELL_UNLOCK={};
// @soulbeast-end 0226-SPELL_UNLOCK
// @soulbeast-unit 0229-SPELL_PALETTE

const SPELL_PALETTE={fire:['inferno','✦','#ff8848','#ffe5a2'],electric:['thunder','ϟ','#8ddfff','#fff0ab'],ice:['glacier','❄','#9deaff','#e8fcff'],water:['tidal','≈','#4ecce8','#d0f7ff'],flying:['cyclone','✧','#99efcf','#e7ffed'],grass:['bloom','❧','#9ddd77','#e6ffac'],ground:['tectonic','◆','#e8b56b','#ffefd0'],rock:['tectonic','◆','#d5bc99','#fff2ce'],steel:['stellar','✦','#b7dcf7','#ffffff'],dark:['void','✧','#b291ff','#efc8ff'],ghost:['void','◈','#8cb5ff','#e4d8ff'],psychic:['astral','◇','#ec9bff','#fff1fb'],dragon:['nova','✦','#d4a5ff','#fff1b8'],fairy:['sanctuary','✧','#ffe5a8','#fffef5'],poison:['venom','✧','#bc8df1','#d9ffab'],bug:['bloom','❧','#cee577','#f6ffd2']};
// @soulbeast-end 0229-SPELL_PALETTE
// @soulbeast-unit 0230-spellLook

function spellLook(id){const sk=SK[id]||{},legacy=skillLook(id);if(sk.t==='heal'||sk.revAll||sk.rev)return ['sanctuary','✚','#b0ffd7','#fff5c7'];if(sk.immune)return ['aegis','◇','#b9e6ff','#fff3c1'];if(sk.summon||sk.t==='form')return ['astral','◇','#c2a5ff','#f6e8ff'];return SPELL_PALETTE[sk.el]||[legacy[0],legacy[1],legacy[2],'#fff1c4'];}
// @soulbeast-end 0230-spellLook
// @soulbeast-unit 0231-spellBurst

function spellBurst(L,e,x,y){if(!e.skill||['attack','rest'].includes(e.skill))return;const sk=SK[e.skill]||{},tier=skillIntensity(e.skill),[kind,glyph,c,accent]=spellLook(e.skill),magic=sk.t==='m'||['heal','buff','form'].includes(sk.t)||sk.summon||!!sk.ct,cast=e.k==='cast',mobile=window.innerWidth<620,scale=mobile?.78:1,size=(86+tier*54)*scale;
 const life=cast?1100:1400+tier*220,spawn=(cls,px=x,py=y,txt=null,vars={})=>vSpawn(L,cls,[px,py],c,txt,{'--a':accent,'--size':size+'px','--life-ms':life,'--dur':life+'ms',...vars});
 if(cast){
  if(tier===0){spawn('vx-sigil',x,y,glyph);return;}
  spawn('sp-circle sp-casting',x,y,null,{'--size':size*.86+'px'});spawn('sp-rune',x,y,glyph,{'--size':size*.65+'px'});
  if(magic){spawn('sp-orbit',x,y,null,{'--size':size*1.05+'px'});for(let i=0;i<(mobile?4:6);i++){const a=i*2.399963;spawn('sp-mote',x+Math.cos(a)*size*.5,y+Math.sin(a)*size*.28,null,{'--dx':-Math.cos(a)*size*.5+'px','--dy':-Math.sin(a)*size*.28+'px','--wait':i*45+'ms'});}}
  return;
 }
 if(tier===0){skillVisualLegacy(L,e,x,y);spawn('sp-ring');return;}
 spawn('phase-bloom');if(tier>=2)spawn('phase-cross');
 spawn('sp-impact');spawn('sp-ring',x,y,null,{'--wait':'90ms'});if(tier>=2)spawn('sp-circle');
 if(!magic){
  const blades=Math.min(5,2+tier);for(let i=0;i<blades;i++)spawn('sp-cut',x+(i-1)*12,y+(i-1)*5,null,{'--angle':(-65+i*31)+'deg','--wait':i*55+'ms'});
  if(tier>=2)spawn('sp-star');
 }else if(kind==='inferno'){
  for(let i=0;i<2+tier;i++)spawn('sp-meteor',x+(i-(1+tier)/2)*size*.3,y-size*.25,null,{'--wait':i*95+'ms','--angle':(28+i*8)+'deg'});
  spawn('sp-fireball');spawn('sp-plume',x,y+size*.12);if(tier>=2)spawn('sp-shock');
 }else if(kind==='thunder'){
  for(let i=0;i<2+tier;i++)spawn('sp-bolt',x+(i-(1+tier)/2)*size*.22,y-size*.22,null,{'--wait':i*85+'ms','--angle':(i%2?-12:12)+'deg'});
  spawn('sp-star');spawn('sp-shock');
 }else if(kind==='glacier'){
  for(let i=0;i<3+tier;i++)spawn('sp-ice',x+(i-(2+tier)/2)*size*.23,y+size*.12,null,{'--wait':i*65+'ms','--angle':((i-(2+tier)/2)*11)+'deg'});
  spawn('sp-snow',x,y,'❄');
 }else if(kind==='tidal'||kind==='cyclone'){
  for(let i=0;i<3;i++)spawn('sp-wave',x,y+(i-1)*size*.15,null,{'--wait':i*110+'ms','--angle':(i*35)+'deg'});
  spawn('sp-column');if(tier>=2)spawn('sp-orbit');
 }else if(kind==='void'){
  spawn('sp-horizon');spawn('sp-accretion');spawn('sp-orbit',x,y,null,{'--size':size*1.25+'px'});spawn('sp-rune',x,y,glyph);if(tier===3)spawn('sp-ray');
 }else if(kind==='sanctuary'||kind==='aegis'){
  spawn('sp-halo');spawn('sp-column');spawn('sp-rune',x,y,glyph);for(let i=0;i<3;i++)spawn('sp-wave',x,y+size*(.35-i*.25),null,{'--wait':i*90+'ms'});
 }else if(kind==='tectonic'){
  for(let i=0;i<3+tier;i++)spawn('sp-stone',x+(i-(2+tier)/2)*size*.23,y+size*.15,null,{'--wait':i*70+'ms','--angle':(i%2?-18:18)+'deg'});spawn('sp-crater');
 }else if(kind==='bloom'||kind==='venom'){
  spawn('sp-halo');for(let i=0;i<3+tier;i++)spawn('sp-vine',x+(i-(2+tier)/2)*size*.24,y+size*.18,null,{'--wait':i*65+'ms','--angle':(i%2?20:-20)+'deg'});
 }else{
  spawn('sp-nova');spawn('sp-ray');spawn('sp-orbit');spawn('sp-rune',x,y,glyph);if(tier>=2)spawn('sp-star');
 }
 const n=Math.round((8+tier*5)*(mobile?.6:1));for(let i=0;i<n;i++){const a=i*2.399963,r=size*(.38+(i%5)*.085);spawn('sp-spark',x,y,kind==='glacier'&&i%3===0?'✧':null,{'--dx':Math.cos(a)*r+'px','--dy':Math.sin(a)*r*.8+'px','--wait':(i%4)*35+'ms','--angle':i*47+'deg'});}
}
// @soulbeast-end 0231-spellBurst
// @soulbeast-unit 0232-spellScene

function spellScene(L,e){if(skillIntensity(e.skill)!==3)return;const [kind,,c]=spellLook(e.skill);vSpawn(L,'sp-scene',null,c,null,{'--life-ms':1800,'--dur':'1800ms'});if((SK[e.skill]||{}).t==='m')vSpawn(L,'sp-skyseal',[window.innerWidth*.5,Math.min(window.innerHeight*.35,240)],c,'✧',{'--size':Math.min(window.innerWidth*.72,380)+'px','--life-ms':1900,'--dur':'1900ms'});}
// @soulbeast-end 0232-spellScene
// @soulbeast-unit 0234-flushVfx

function flushVfx(){if(!VQ.length)return;const q=VQ.splice(0).slice(-64),L=document.getElementById('vfx'),app=document.getElementById('app');if(!L||!app||!app.querySelector)return;
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;if(reduced){q.filter(e=>e.k==='cast').slice(0,1).forEach(e=>vSpawn(L,'vx-cast',null,e.c||'#d9b35b',e.n));return;}
 const screen=S.screen,seen=new Set(),cinema=new Set();let delay=0,activeSkill=null;for(const item of q){const e={...item};if(e.k==='cast')activeSkill=e.skill;if(e.k==='charge'&&!e.skill){const b=S.screen==='world'?WORLD.room?.battle:S.screen==='pvp'?PVP.room?.battle:S.screen==='camp'?CAMP.room?.battle:S.battle;e.skill=b&&[...b.allies,...b.enemies].find(u=>u.id===e.id)?.charging?.id;}if(!e.skill&&['heal','buff','charge','debuff'].includes(e.k))e.skill=activeSkill;
  const key=e.k==='hit'?e.id+':'+e.skill:e.k+':'+e.id+':'+e.skill,repeat=seen.has(key);seen.add(key);const tier=skillIntensity(e.skill||''),c=e.c||(e.el&&EL[e.el]?EL[e.el].c:'#e6d5ad');
  const play=()=>{if(S.screen!==screen)return;try{
   const el=e.id&&app.querySelector('[data-u="'+String(e.id).replace(/[^\w-]/g,'')+'"]'),r=el?.getBoundingClientRect(),x=r?r.left+r.width/2:window.innerWidth*.5,y=r?r.top+r.height/2:window.innerHeight*.4;
   if(e.k==='cast'){if(!repeat){vSpawn(L,'vx-cast',null,c,e.n);spellBurst(L,e,x,y);}return;}
   if(e.k==='flash')return; // The elemental impact carries the light; avoid repeated full-screen flashes.
   if(!r)return;
   if(['hit','heal','buff'].includes(e.k)){
    if(!repeat){if(tier===3&&!cinema.has(e.skill)){cinema.add(e.skill);spellScene(L,e);}if(e.skill&&!['attack','rest'].includes(e.skill))spellBurst(L,e,x,y);else vSpawn(L,e.k==='hit'?'vx-burst':e.k==='heal'?'vx-ring':'vx-aura',[x,y],c);}
    else {vSpawn(L,'sp-minihit',[x,y],c,null,{'--life-ms':650});}
    if(e.k==='hit'&&!repeat&&tier>=2&&el.classList){el.classList.remove('sp-struck');void el.offsetWidth;el.classList.add('sp-struck');setTimeout(()=>el.classList.remove('sp-struck'),700);}
    if(e.k==='hit'&&e.phys)vSpawn(L,'vx-slash',[x,y],c,null,{'--r':repeat?'28deg':'-35deg'});
    if(e.k==='heal')vParts(L,x,y,'#b8ffce','star',5,45,-1);
   }else if(e.k==='charge'){vSpawn(L,'vx-charge',[x,y],c);spellBurst(L,{...e,k:'cast'},x,y);}
   else if(e.k==='debuff'){if(!signatureEffectBurst(L,e,x,y))vSpawn(L,'sp-orbit',[x,y],c,null,{'--size':'90px','--life-ms':1000,'--dur':'1000ms'});}
   else if(e.k==='miss')vSpawn(L,'vx-ring',[x,y],'#9a97ab');
  }catch(err){}};
  setTimeout(play,Math.min(delay,1000));if(e.k==='hit')delay+=repeat?42:110;else if(e.k==='cast')delay+=tier>=2?240:90;
 }
}
// @soulbeast-end 0234-flushVfx
// @soulbeast-unit 0250-fxAdd

function fxAdd(u,t,c){B().fx.push({id:u.id,t,c})}
// @soulbeast-end 0250-fxAdd
// @soulbeast-unit 0446-ELEMENT_SHAPES

const ELEMENT_SHAPES=SoulbeastContent.ELEMENT_SHAPES();
// @soulbeast-end 0446-ELEMENT_SHAPES
// @soulbeast-unit 0447-elementIcon

function elementIcon(e){if(!EL[e])return '';return `<span class="element-icon" style="--element:${EL[e].c}" title="${esc(EL[e].n)}" role="img" aria-label="ธาตุ${esc(EL[e].n)}"><svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">${ELEMENT_SHAPES[e]}</svg></span>`}
// @soulbeast-end 0447-elementIcon
// @soulbeast-unit 0448-skillElementIcon

function skillElementIcon(u,sk,id){if(!sk)return '';if(!sk.el&&!['p','m','h','auto','status','debuff'].includes(sk.t)&&!sk.enchant)return '';const value=sk.enchant||effectiveElement(u||{},sk);const elements=Array.isArray(value)?value:[value];return '<span class="skill-elements">'+elements.map(elementIcon).join('')+'</span>';}
// @soulbeast-end 0448-skillElementIcon
// @soulbeast-unit 0496-SKILL_ART_ATLAS

// Painted atlas: 64 shared motifs selected by each skill's actual effect and element.
const SKILL_ART_ATLAS='assets/skills/skill-atlas.webp';
// @soulbeast-end 0496-SKILL_ART_ATLAS
// @soulbeast-unit 0497-skillArtIndex

function skillArtIndex(id,sk=SK[id],u=null){
 if(!sk)return id==='defend'?58:60;
 if(sk.rev||sk.revAll)return 57;
 if(sk.t==='heal')return sk.cure?35:56;
 if(sk.t==='rest'||id==='rest')return 60;
 if(sk.summon)return sk.summon==='golem'?26:61;
 if(sk.t==='form'||sk.t==='revert')return 62;
 if(sk.steal)return 63;
 if(sk.taunt||sk.immune==='p')return 58;
 if(sk.immune||sk.t==='buff')return 59;
 const physical=['p','auto'].includes(sk.t),area=!!(sk.all||sk.rt),el=sk.el;
 const pairs={fire:[10,8,9],water:[14,12,13],ice:[18,16,17],electric:[22,20,21],ground:[24,24,25],rock:[24,24,25],flying:[30,28,29],grass:[33,32,34],bug:[32,32,33],poison:[38,36,37],dark:[40,42,41],ghost:[44,52,53],psychic:[50,50,51],dragon:[55,54,54],fairy:[48,48,49],steel:[2,0,1],fighting:[0,0,1]};
 if(pairs[el])return pairs[el][area?2:physical?0:1];
 const name=sk.n||'',key=id||'';
 if(/ปืน|กระสุน|ยิงรัว/.test(name)||/^ws_gun|^gn_|^mm_|^gs_/.test(key))return 6;
 if(/ธนู|ลูกศร|ศร|^ar_|^rn_/.test(name+' '+key))return area?4:3;
 if(/ขวาน|คลั่ง/.test(name))return 2;
 if(/หอก/.test(name))return 5;
 if(/มีด|แทงหลัง|ซุ่ม|นินจา/.test(name))return 7;
 if(sk.ls)return 43;
 if(sk.t==='status'||sk.t==='debuff')return 42;
 if(sk.gold||sk.gc)return 63;
 if(id==='attack'&&u?.kind==='pet')return 55;
 return area||sk.hits?1:physical?0:46;
}
// @soulbeast-end 0497-skillArtIndex
// @soulbeast-unit 0498-skillPicture

function skillPicture(u,sk,id){
 if(!sk&&id!=='defend')return '';
 sk=sk||{n:'ตั้งรับ',t:'buff',mp:0};
 const key=id||VSKID.get(sk);if(!key||!/^[a-zA-Z0-9_-]+$/.test(key))return ''; 
 const color=EL[sk.el||'normal']?.c||'#d9b35b';
 const tier=Math.min(3,1+Math.floor((sk.mp||0)/15));
 return `<span class="skill-picture skill-painted" role="img" aria-label="${esc(sk.n)}" style="--skill-color:${color};--skill-image:url('assets/skills/painted-v2/${key}.webp')"><i class="skill-paint skill-individual skill-raster" aria-hidden="true"></i><span class="skill-rank" aria-hidden="true">${'◆'.repeat(tier)}</span></span>`;
}
// @soulbeast-end 0498-skillPicture
// @soulbeast-unit 0499-skillElementIcon


skillElementIcon=function(u,sk,id){return skillPicture(u,sk,id)+skillElementOnly(u,sk,id);};
// @soulbeast-end 0499-skillElementIcon
// @soulbeast-unit 0517-mistPortrait

function mistPortrait(key){
 const i=[...MIST_RARE_DEFS,...MIST_LEGEND_DEFS].findIndex(x=>x[0]===key);if(i<0)return '';
 return `<span class="mist-beast-art" role="img" aria-label="${esc(SP[key].n)}" style="--beast-x:${i%4*100/3}%;--beast-y:${Math.floor(i/4)*100/3}%"></span>`;
}
// @soulbeast-end 0517-mistPortrait
// @soulbeast-unit 0522-SIGNATURE_ART


const SIGNATURE_ART=SoulbeastContent.SIGNATURE_ART();
// @soulbeast-end 0522-SIGNATURE_ART
// @soulbeast-unit 0523-signatureBasePicture

// Exactly one illustrated existing skill per profession; every eligible beast signature.
const signatureBasePicture=skillPicture;
// @soulbeast-end 0523-signatureBasePicture
// @soulbeast-unit 0524-skillPicture

skillPicture=function(u,sk,id){
 const picture=signatureBasePicture(u,sk,id),art=SIGNATURE_ART[id];
 if(!art)return picture;
 return picture.replace('skill-painted','skill-painted signature-picture').replace('role="img"','data-signature-owner="'+esc(art.key)+'" role="img"');
};
// @soulbeast-end 0524-skillPicture
// @soulbeast-unit 0552-WEAPON_ART



const WEAPON_ART=SoulbeastContent.WEAPON_ART();
// @soulbeast-end 0552-WEAPON_ART
// @soulbeast-unit 0554-weaponBaseItemIcon

const weaponBaseItemIcon=itemIcon;
// @soulbeast-end 0554-weaponBaseItemIcon
// @soulbeast-unit 0555-itemIcon

itemIcon=function(id,size=44){
 const art=WEAPON_ART[id];if(!art)return weaponBaseItemIcon(id,size);
 const lang=typeof GAME_LANGUAGE==='undefined'?'th':GAME_LANGUAGE,label=WEAPON_RARITY[art.rarity][lang]||WEAPON_RARITY[art.rarity].th;
 const name=typeof translateGameText==='function'?translateGameText(EQ[id].n,lang,false).trim():EQ[id].n;
 return `<span class="item-art weapon-unique weapon-${art.rarity}" role="img" aria-label="${esc(name+' · '+label)}" title="${esc(name+' · '+label)}" data-weapon-art="${esc(id)}" style="--item-size:${Math.max(28,Number(size)||44)}px;--weapon-x:${art.index%8*100/7}%;--weapon-y:${Math.floor(art.index/8)*100/6}%;--weapon-atlas:url('assets/weapons/${art.kind}.webp')"><i class="weapon-paint" aria-hidden="true"></i><small aria-hidden="true">${art.rarity==='crafted'?'◆':art.rarity==='eclipse'?'✹':'✦'}</small></span>`;
};
// @soulbeast-end 0555-itemIcon
// @soulbeast-unit 0556-weaponRarityLabel

function weaponRarityLabel(it){return WEAPON_RARITY[it?.craft?'crafted':it?.worldLegend?'eclipse':'legendary'][typeof GAME_LANGUAGE==='undefined'?'th':GAME_LANGUAGE]||WEAPON_RARITY.legendary.th;}
// @soulbeast-end 0556-weaponRarityLabel
// @soulbeast-unit 0559-weaponText

function weaponText(th,en,zh){return typeof GAME_LANGUAGE==='undefined'||GAME_LANGUAGE==='th'?th:GAME_LANGUAGE==='zh-CN'?zh:en;}
// @soulbeast-end 0559-weaponText
// @soulbeast-unit 0612-communityBaseItemIcon

const communityBaseItemIcon=itemIcon;
// @soulbeast-end 0612-communityBaseItemIcon
// @soulbeast-unit 0613-itemIcon

itemIcon=function(id,size=44){if(id==='eternalSeal')return `<span class="eternal-seal-art">${communityBaseItemIcon('seal5',size)}<small>∞</small></span>`;return communityBaseItemIcon(id,size);};
// @soulbeast-end 0613-itemIcon
// @soulbeast-unit 0623-releaseArtButton

function releaseArtButton(screen,image,title,sub){return `<button class="release-art-button" data-a="go" data-v="${screen}"><img src="assets/ui/${image}.webp" alt="" loading="lazy"><span><b translate="no">${title}</b><small translate="no">${sub}</small></span></button>`;}
// @soulbeast-end 0623-releaseArtButton
// @soulbeast-unit 0640-beastFrameKind


/* Visual update only; the server remains authoritative for coupons and draw receipts. */
function beastFrameKind(key){const sp=SP[key];return !sp?'':sp.legendary?'legend':sp.rare?'rare':(sp.ev?.length||0)>=2?'three':sp.ev?.length===1?'two':'one';}
// @soulbeast-end 0640-beastFrameKind
// @soulbeast-unit 0642-ornatePortrait

const ornatePortrait=portrait;
// @soulbeast-end 0642-ornatePortrait
// @soulbeast-unit 0643-portrait

portrait=function(key,size,opts={}){const html=ornatePortrait(key,size,opts),kind=beastFrameKind(key);if(!kind)return html;return html.replace('class="pt ',`data-beast-rarity="${kind}" title="${esc(ct(...BEAST_FRAME_LABELS[kind]))}" class="pt beast-frame frame-${kind} `);};
// @soulbeast-end 0643-portrait
// @soulbeast-unit 0644-beastFrameLegend

function beastFrameLegend(){return `<div class="card stack"><h3 translate="no">${ct('สีกรอบรูปอสูร','Beast portrait frames','妖兽头像边框')}</h3><div class="frame-key">${Object.entries(BEAST_FRAME_LABELS).map(([k,n])=>`<span class="frame-key-${k}" translate="no">◆ ${ct(...n)}</span>`).join('')}</div></div>`;}
// @soulbeast-end 0644-beastFrameLegend
// @soulbeast-unit 0645-ELEMENT_PICTURES

const ELEMENT_PICTURES=SoulbeastContent.ELEMENT_PICTURES();
// @soulbeast-end 0645-ELEMENT_PICTURES
// @soulbeast-unit 0889-battlePortraitElements


function battlePortraitElements(html,u){if(html.includes('class="battle-portrait-elements"'))return html;const types=[...new Set(u.types||SP[u.sp]?.t||[])].filter(k=>EL[k]);if(!types.length)return html;return html.replace(/(<span class="battle-face"[^>]*>)/,'$1<span class="battle-portrait-elements">'+types.map(elementIcon).join('')+'</span>');}
// @soulbeast-end 0889-battlePortraitElements
// @soulbeast-unit 0954-ROUTE_ART-treasure


ROUTE_ART.treasure='assets/ui/tower-rest-treasure-v1.webp';
// @soulbeast-end 0954-ROUTE_ART-treasure
// @soulbeast-unit 1016-SIGNATURE_EFFECT_THEMES


// Illustrated signature choreography. Presentation only: no battle RNG, state, or turn timers.
const SIGNATURE_EFFECT_THEMES={venom:'al_acid',fury:'be_frenzy',
 cyclone:'sw_whirl wd_storm sc_tempest s_tengu s_tbird s_nue',slash:'sa_iai ke_thousand th_back as_sonic rn_wander s_griffin s_baihu s_neko s_garuda',volley:'ar_pierce sn_heart gn_execute mk_bullseye gs_infinite bh_bounty',wing:'ra_falcon s_pegasus',thunder:'sb_thunder mg_thunderstorm s_raiju mist_sig_tempest_lynx',meteor:'am_meteor wl_split bs_hammer ms_godhammer s_golem s_yeti s_gargoyle s_erawan mist_sig_obsidian_scarab',
 ward:'sh_army gl_roar sg_barrier et_bastion su_command tm_double bk_order s_lamassu mist_sig_cosmic_tortoise',music:'bd_rally ma_heal di_requiem s_mandrake s_kodama',coin:'me_coinbomb ro_mug mt_plunder ga_transmute',blast:'sbw_doom mc_cannon at_grenade cn_barrage dm_blast',
 leech:'bw_drain ne_soul sl_share s_redcap s_kelpie mist_sig_ember_jackal',curse:'wk_curse en_mind tr_trick sm_bind s_tanuki s_basilisk s_jiangshi mist_sig_prism_owl',transform:'dr_treant fe_saber wg_dragon ad_moon',vines:'gv_rain s_joro mist_sig_bloom_jade_mare',
 fang:'pk_howl s_cerberus s_fenrir mist_sig_dusk_panther mist_sig_eclipse_wolf',nova:'te_judge el_omni sbs_unite sp_storm s_nil s_scarab s_dragon mist_sig_astral_dragon mist_sig_solar_sovereign',phoenix:'ss_rebirth s_phoenix mist_sig_dawn_valkyrie',eclipse:'s_nidhogg mist_sig_primordial_ouroboros mist_sig_void_phoenix',tide:'s_kappa s_naga s_kraken mist_sig_infinite_sea_serpent',fox:'s_wisp s_kitsune',heal:'pa_holy bc_elixir s_pixie s_qilin s_unicorn mist_sig_jade_moon_hare mist_sig_aurora_whale'
};
// @soulbeast-end 1016-SIGNATURE_EFFECT_THEMES
// @soulbeast-unit 1017-SIGNATURE_THEME_BY_ID

const SIGNATURE_THEME_BY_ID={};
// @soulbeast-end 1017-SIGNATURE_THEME_BY_ID
// @soulbeast-unit 1019-signatureEffectProfile

function signatureEffectProfile(id){const art=SIGNATURE_ART[id];if(!art)return null;const sk=SK[id],look=spellLook(id),seed=art.index+(art.kind==='job'?0:67),theme=SIGNATURE_THEME_BY_ID[id]||(sk.t==='heal'?'heal':sk.t==='buff'?'ward':sk.t==='status'?'curse':['p','h'].includes(sk.t)?'slash':sk.el==='water'?'tide':sk.el==='fire'?'blast':'nova');return {id,art,theme,seed,color:look[2],accent:look[3],spokes:3+seed%4,angle:seed*37%180,duration:760+seed%4*65};}
// @soulbeast-end 1019-signatureEffectProfile
// @soulbeast-unit 1020-SIGNATURE_ORIGINS

const SIGNATURE_ORIGINS=new Map();
// @soulbeast-end 1020-SIGNATURE_ORIGINS
// @soulbeast-unit 1021-signatureEffectBurst

function signatureEffectBurst(L,e,x,y){const p=signatureEffectProfile(e.skill);if(!p)return false;if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return true;const cast=e.k==='cast',mobile=window.innerWidth<620,size=Math.min(mobile?118:168,Math.max(76,(mobile?82:112)+skillIntensity(e.skill)*12)),budget=mobile?12:16;let used=0;
 const origin=SIGNATURE_ORIGINS.get(e.skill),source=origin&&origin.screen===S.screen&&Date.now()-origin.at<1800?origin:{x,y:y-size*.75};
 if(cast)SIGNATURE_ORIGINS.set(e.skill,{x,y,screen:S.screen,at:Date.now()});
 const spawn=(shape,dx=0,dy=0,wait=0,vars={})=>{if(used++>=budget)return;return vSpawn(L,'sig-fx sig-'+shape,[x+dx,y+dy],p.color,null,{'--a':p.accent,'--size':size+'px','--duration':p.duration+'ms','--life-ms':p.duration,'--wait':wait+'ms','--theta':p.angle+'deg','--sx':source.x-x+'px','--sy':source.y-y+'px','--dx':'0px','--dy':'0px',...vars});};
 const crest=spawn('crest',0,0,0,{'--size':(cast?size*.48:size*.6)+'px','--atlas':"url('assets/skills/signatures-"+p.art.kind+".webp')",'--ax':p.art.index%8*100/7+'%','--ay':Math.floor(p.art.index/8)*100/7+'%'});if(crest){crest.dataset.skill=e.skill;crest.dataset.signatureTheme=p.theme;}
 if(cast){spawn('seal',0,0,0,{'--theta':p.angle+'deg'});if(SK[e.skill].t==='heal'||SK[e.skill].t==='buff')spawn('halo');else spawn('orbit');return true;}
 const ray=(shape,i,n,spread=1)=>{const a=(i/n*Math.PI*2+p.angle*Math.PI/180),r=size*.43*spread;spawn(shape,Math.cos(a)*r,Math.sin(a)*r*.65,i*42,{'--theta':a*180/Math.PI+'deg','--dx':Math.cos(a)*size*.3+'px','--dy':Math.sin(a)*size*.3+'px'});};
 switch(p.theme){
 case 'venom':for(let i=0;i<4;i++)spawn('soul',(i-1.5)*15,-20,i*60,{'--dx':(i-1.5)*10+'px','--dy':'45px'});spawn('shock');break;
 case 'fury':spawn('orbit');for(let i=0;i<4;i++)ray('flame',i,4);spawn('cut');break;
 case 'slash':for(let i=0;i<Math.min(6,SK[e.skill].hits||p.spokes);i++)spawn('cut',(i-2)*7,(i-2)*5,i*65,{'--theta':p.angle+i*29+'deg'});break;
 case 'volley':for(let i=0;i<Math.min(6,SK[e.skill].hits||p.spokes);i++)spawn('arrow',(i-2)*5,(i-2)*6,i*65,{'--theta':Math.atan2(y-source.y,x-source.x)*180/Math.PI+'deg'});spawn('target');break;
 case 'thunder':for(let i=0;i<p.spokes;i++)spawn('bolt',(i-(p.spokes-1)/2)*size*.17,-size*.14,i*55);spawn('shock');break;
 case 'meteor':for(let i=0;i<p.spokes;i++)spawn('comet',(i-(p.spokes-1)/2)*size*.2,0,i*65);spawn('crack');break;
 case 'cyclone':for(let i=0;i<3;i++)spawn('wave',0,(i-1)*size*.18,i*85,{'--theta':p.angle+i*55+'deg'});spawn('cut');break;
 case 'wing':case 'phoenix':for(const side of [-1,1])spawn('wing',side*size*.18,0,0,{'--side':side});spawn('halo');if(p.theme==='phoenix')for(let i=0;i<3;i++)ray('petal',i,3);break;
 case 'tide':for(let i=0;i<3;i++)spawn('wave',0,(i-1)*size*.15,i*95,{'--theta':i*23+'deg'});if(e.skill==='s_kraken'||e.skill==='mist_sig_infinite_sea_serpent')for(let i=0;i<3;i++)ray('vine',i,3);break;
 case 'ward':spawn('shield');spawn('seal');for(let i=0;i<3;i++)ray('petal',i,3);break;
 case 'music':for(let i=0;i<p.spokes;i++)ray('note',i,p.spokes);spawn('wave',0,0,0,{'--theta':'0deg'});break;
 case 'coin':for(let i=0;i<p.spokes+1;i++)ray('coin',i,p.spokes+1);if(SK[e.skill].all)spawn('shock');break;
 case 'leech':for(let i=0;i<4;i++)spawn('soul',0,(i-1.5)*9,i*80,{'--dx':source.x-x+'px','--dy':source.y-y+'px'});spawn('fang');break;
 case 'curse':spawn('eye');spawn('seal');for(let i=0;i<3;i++)ray('chain',i,3);break;
 case 'vines':for(let i=0;i<p.spokes;i++)ray(e.skill==='s_joro'?'web':'vine',i,p.spokes);spawn('halo');break;
 case 'fang':for(const side of [-1,1])spawn('fang',side*size*.17,0,side>0?80:0,{'--side':side});for(let i=0;i<3;i++)spawn('cut',(i-1)*9,0,i*55,{'--theta':'65deg'});break;
 case 'transform':spawn('orbit');spawn('halo');for(let i=0;i<p.spokes;i++)ray('petal',i,p.spokes);break;
 case 'eclipse':spawn('eclipse');spawn('orbit');for(let i=0;i<3;i++)ray('soul',i,3);break;
 case 'fox':for(let i=0;i<p.spokes;i++)ray('flame',i,p.spokes);spawn('seal');break;
 case 'heal':spawn('halo');for(let i=0;i<p.spokes;i++)ray('petal',i,p.spokes);break;
 case 'blast':for(let i=0;i<3;i++)spawn('comet',(i-1)*size*.2,0,i*70);spawn('shock');break;
 default:spawn('seal');spawn('shock');for(let i=0;i<p.spokes;i++)ray('star',i,p.spokes);
 }return true;
}
// @soulbeast-end 1021-signatureEffectBurst
// @soulbeast-unit 1022-originalSignatureSpellBurst

const originalSignatureSpellBurst=spellBurst;
// @soulbeast-end 1022-originalSignatureSpellBurst
// @soulbeast-unit 1023-spellBurst
spellBurst=function(L,e,x,y){try{if(signatureEffectBurst(L,e,x,y))return;}catch(error){console.warn('Skipped signature effect',error);}return originalSignatureSpellBurst(L,e,x,y);};
// @soulbeast-end 1023-spellBurst
