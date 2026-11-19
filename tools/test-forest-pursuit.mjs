import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const url=process.env.SOULBEAST_TEST_ORIGIN;
const source=url?await (await fetch(url+'/Soulbeast/assets/forest-walk/forest-25d.js?release=desert-speed-17')).text():await readFile(new URL('../assets/forest-walk/forest-25d.js',import.meta.url),'utf8');
const start=source.indexOf('  function chase(dt) {'),end=source.indexOf('  const viewCenter =');
assert(start>=0&&end>start,'missing live chase implementation');
const shadow=vm.runInNewContext(source.match(/const SHADOW_CHASE_SPEED = ([^;]+);/)[1]);
function run(humanPursuit,{near=false,blocked=false}={}){
 let contacts=0;
 const c={humanPursuit,SHADOW_CHASE_SPEED:shadow,FLATTEN:.64,battle:false,pursuers:[{x:0,z:near?1:70,flank:0,wait:0,phase:0,facing:1}],player:{x:0,z:0,moving:true,running:true},axes:[1,1],keys:new Set(['ArrowUp']),walkable:()=>!blocked,onContact:()=>contacts++};
 vm.createContext(c);vm.runInContext(source.slice(start,end),c);
 const before=c.pursuers[0].z;for(let frame=0;frame<60;frame++)c.chase(1/60);
 return {distance:(before-c.pursuers[0].z)*.64,contacts,battle:c.battle,keys:c.keys.size};
}
for(const [name,human,expected]of [['bandit',true,8.3*1.7],['traveler',true,8.3*1.7],['shadow',false,6.8*1.7]]){
 const actual=run(human);assert(Math.abs(actual.distance-expected)<1e-8,name+' speed');assert.equal(actual.contacts,0);
 assert.equal(run(human,{blocked:true}).distance,0,'ignored obstacles');
 const contact=run(human,{near:true});assert.equal(contact.contacts,1);assert.equal(contact.battle,true);assert.equal(contact.keys,0);
 console.log('PASS '+name+': '+actual.distance.toFixed(2)+' world units/sec, original obstacle/contact behavior');
}
const player=vm.runInNewContext(source.match(/const RUN_SPEED = ([^;]+);/)[1]);assert.equal(player,9.75,'player speed changed');
console.log('PASS 1.7x pursuit in the shared renderer; player running pace unchanged'+(url?' on production':''));
