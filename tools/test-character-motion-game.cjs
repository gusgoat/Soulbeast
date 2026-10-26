const assert=require('assert/strict'),fs=require('fs'),g=require('./game-context.cjs')('build/staging-index.html'),r=g.run;
const actors=require('./unit-motion-manifests.cjs')().flatMap(m=>m.actors);require('./validate-motion-anchors.cjs')(actors);
assert.equal(actors.length,325);const before=r('JSON.stringify(S)');
r('for(const a of MOTION_ACTORS){CharacterMotion.styles(a);CharacterMotion.attrs(a);CharacterMotion.layers(a);}');
for(const a of actors){const u=a.kind==='player'?{cls:a.cls,gender:a.gender,kind:'player',img:'player'}:a.kind==='transform'?{form:a.id}:{sp:a.species||a.id,evo:a.form||0};assert.equal(r('CharacterMotion.resolve('+JSON.stringify(u)+').id'),a.id);}
assert.equal(r('JSON.stringify(S)'),before);
for(const sp of ['solar_ferroth','solar_mortivar','legend2_myriapod','legend2_tricephalos'])assert(r(`!!CharacterMotion.resolve(wildUnit('${sp}',60,0))`));
for(const mode of ['pvp','world','camp','guildwar'])assert(r(`(()=>{const u=wildUnit('demonlord',60,0);return compactOnlineCard(u,'${mode}',{me:0,battle:{cur:u.id}},false).includes('data-motion-actor="demonlord"')})()`));
assert.equal(r('CharacterMotion.mode("attack",{cls:"archer",atkType:"m"})'),'melee');
for(const id of ['audit_warn','audit_repair','rest'])assert.equal(r(`CharacterMotion.mode('${id}',{})`),'support');
for(const e of [{k:'miss'},{k:'buff'},{k:'hit',blocked:true},{k:'hit',immune:true},{k:'hit',motionLanded:false}])assert.equal(r('CharacterMotion.landed('+JSON.stringify(e)+')'),false);
assert.equal(r('CharacterMotion.landed({k:"hit"})'),true);
g.ctx.rectA={getBoundingClientRect:()=>({left:0,top:0,width:50,height:50})};g.ctx.rectB={getBoundingClientRect:()=>({left:200,top:200,width:80,height:80})};
const p=JSON.parse(r('JSON.stringify(CharacterMotion.contact(rectA,rectB))'));assert(Math.hypot(240-(25+p.x),240-(25+p.y))>=68-1e-6);
const state=r('JSON.stringify(S)');r('Math.random=()=>{throw Error("Presentation must not consume combat RNG")};');r('CharacterMotion.decorate(statusBattleCard(\'<button class="battle-vital"><span class="battle-face">\'+unitPortrait(playerUnit(),28)+\'</span></button>\',playerUnit()),playerUnit())');assert.equal(r('JSON.stringify(S)'),state);
const equipment=JSON.parse(r('JSON.stringify(Object.entries(EQ).filter(([id,x])=>x.slot).map(([id,x])=>({id,legend:!!x.legend,eclipse:!!x.worldLegend,html:itemIcon(id,44)})))'));
for(const e of equipment){assert.equal(e.html.includes('equipment-aura'),e.legend||e.eclipse,e.id);assert.equal(e.html.includes('equipment-motes'),e.eclipse,e.id);assert(!e.html.includes('um-body'));}
// Preserve the exact latest content/server/rules; integration touches only the visual layer.
console.log('PASS 325 identities and anchor hashes, stage7 roster, attack routing, shield/miss reactions, edge contact, no RNG/save changes, '+equipment.length+' equipment renderers');
