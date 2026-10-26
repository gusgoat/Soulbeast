const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),acorn=require('module').createRequire(require('path').resolve(__dirname,'runtime-build/modules.cjs'))('acorn');
const source=fs.readFileSync('runtime/ui.js','utf8');let handler;
function visit(node){if(!node||typeof node!=='object')return;if(node.type==='Property'&&node.key.name==='boss'&&node.value.type==='ArrowFunctionExpression'&&source.slice(node.value.start,node.value.end).includes('const base=ZN'))handler=source.slice(node.value.start,node.value.end);for(const v of Object.values(node))if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object')visit(v);}
visit(acorn.parse(source,{ecmaVersion:'latest'}));assert(handler);
let encounter;
const ctx={S:{zone:{id:5}},ZN:Array.from({length:5},(_,i)=>({id:i+1,sp:['ifrit'],lv:[33,46],mini:2,boss:{sp:i===4?'nidhogg':'tanuki',lv:50,n:'Boss'}})),forestPassed:()=>false,zlog:()=>{},wildUnit:(sp,lv,i,name)=>({id:'e'+i,side:'enemy',sp,lv,name,boss:!!name}),pick:a=>a[0],startBattle:(enemies,kind,meta)=>{encounter={enemies,kind,meta};},save:()=>{},render:()=>{}};
vm.createContext(ctx);vm.runInContext('var invokeBoss='+handler,ctx);vm.runInContext('invokeBoss()',ctx);
assert.equal(encounter.enemies.filter(u=>u.boss&&u.sp==='nidhogg').length,2);assert.equal(encounter.enemies.filter(u=>!u.boss).length,2);assert.equal(new Set(encounter.enemies.map(u=>u.id)).size,4,'no boss/minion ID collision');assert.equal(encounter.meta,5);
ctx.ZN[4].boss.sp='other';vm.runInContext('invokeBoss()',ctx);assert.equal(encounter.enemies.filter(u=>u.boss).length,1,'other bosses in stage5 are not duplicated');
ctx.S.zone.id=1;vm.runInContext('invokeBoss()',ctx);assert.equal(encounter.enemies.filter(u=>u.boss).length,1,'other stages retain one boss');
console.log('PASS actual encounter handler: two Lv50 Nidhogg plus two original minions, unique IDs, other species/stages unchanged.');
