const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('runtime/combat.js','utf8'),acorn=require('module').createRequire(require('path').resolve(__dirname,'runtime-build/modules.cjs'))('acorn');let branch;
function visit(n){if(!n||typeof n!=='object')return;if(n.type==='IfStatement'&&n.test.type==='Identifier'&&n.test.name==='crit'&&source.slice(n.start,n.end).includes('hasPas(u,\'deadly\')'))branch=source.slice(n.start,n.end);for(const v of Object.values(n))if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object')visit(v);}
visit(acorn.parse(source,{ecmaVersion:'latest'}));assert(branch);
const ctx={hasPas:u=>u.deadly,isBalancedPvp:()=>ctx.pvp};vm.createContext(ctx);
function result(boss,deadly,crit=true,pvp=false){Object.assign(ctx,{d:100,t:{boss},u:{deadly},crit,pvp});vm.runInContext(branch,ctx);return ctx.d;}
assert.equal(result(true,false),112.5);assert.equal(result(true,true),150);assert.equal(result(false,false),150);assert.equal(result(false,true),200);assert.equal(result(true,true,false),100);assert.equal(result(false,true,true,true),170);assert.equal(result(false,false,true,true),150);
console.log('PASS actual crit branch: boss critical damage x0.75; normal1.5->1.125, deadly2->1.5; noncritical, ordinary enemies and nonboss PVP unchanged.');
