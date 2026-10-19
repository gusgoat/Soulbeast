'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {build}=require('./client-build.cjs'),runtime=require('./runtime-build/modules.cjs'),root=path.resolve(__dirname,'..');
const current=build(null,{write:false}),again=build(null,{write:false});assert.deepEqual(current,again,'Build must be deterministic');
for(const [name,file]of [['live','index.html'],['staging','refactor-staging.html']]){
 assert.equal(current.files[name+'-index.html'],fs.readFileSync(path.join(root,file),'utf8'),'Published shell must remain exact');
 for(const asset of current.assets[name])assert.equal(current.files[asset],fs.readFileSync(path.join(root,asset),'utf8'),asset+' must remain byte-identical');
}
const mock=change=>({write:false,readFile:file=>change(file,fs.readFileSync(file,'utf8'))});
const edited=build(null,mock((f,s)=>f.endsWith(path.join('runtime','core.js'))?s.replace('MAXLV=60','MAXLV=61'):s));
assert.notDeepEqual(edited.assets.live,current.assets.live,'Canonical runtime edits must change output hash');
assert(Object.values(edited.files).some(x=>x.includes('MAXLV=61')));
assert.throws(()=>build(null,mock((f,s)=>f.endsWith('shell.html')?s.replace('<!-- SOULBEAST_SCRIPTS -->',''):s)),/exactly one/);
assert.throws(()=>build(null,mock((f,s)=>f.endsWith(path.join('content','elements.js'))?s.replace('EL:()=>','LOST_EL:()=>'):s)),/coverage/);
assert.throws(()=>build(null,mock((f,s)=>f.endsWith(path.join('runtime','core.js'))?s+'\nfunction unregisteredFeature(){}':s)),/outside runtime unit/);
assert.throws(()=>runtime.compile({environment:'production-typo'}),/Unknown runtime environment/);
assert.throws(()=>build(null,mock((f,s)=>f.endsWith('build.json')?s.replace('"elements"','"../private"'):s)),/configuration/);
console.log('PASS canonical build: exact live/test assets, deterministic, source edits used, content coverage, missing shell, stray code, unsafe paths and invalid environments rejected');
