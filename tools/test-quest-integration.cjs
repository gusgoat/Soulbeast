const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
require('./town-walk-demo/world-quests-data.js');
const E=require('./town-walk-demo/quest-engine.js'),D=global.WorldQuestData;
// Execute the production receiver, including dungeon iframe, storage refresh and source checks.
const frames=Object.fromEntries(['townMenu','regionMenu','menuFrame'].map(id=>[id,{contentWindow:{}}]));
const listeners=[],p={lv:25,country:'blue',walkId:'qa-only',worldQuests:{accepted:{},completed:{}}};
let raw=JSON.stringify(p),pushes=0,writes=0,refreshes=0;
const ctx={URLSearchParams,Event,location:{origin:'http://local',search:'?city=blue-capital'},
 window:{WalkQuestEngine:E,WorldQuestData:D,WalkQuestEvents:{push(models){pushes++;assert.equal(models.length,1)}},dispatchEvent(){refreshes++}},
 document:{getElementById:id=>frames[id]},sessionStorage:{getItem:()=>raw,setItem:(key,value)=>{raw=value;writes++}},
 localStorage:{setItem(){writes++}},addEventListener:(type,fn)=>{if(type==='message')listeners.push(fn)}};
vm.createContext(ctx);vm.runInContext(read('tools/town-walk-demo/world-quests-ui.js'),ctx);
function send(source,origin='http://local',type='walk-quest-events'){
 const e={source,origin,data:{type,models:[{questId:D.quests[0].id},{questId:'unknown'}]}};
 for(const fn of listeners)fn(e);
}
for(const {contentWindow} of Object.values(frames)){
 const before=pushes;send(contentWindow);assert.equal(pushes,before+1);
 const old=refreshes;send(contentWindow,'http://local','walk-player-saved');assert.equal(refreshes,old+1);
}
const before=[pushes,writes,refreshes];
for(const source of [null,{},frames.menuFrame.contentWindow]){
 send(source,'http://foreign');send(source,'http://foreign','walk-player-saved');
 if(source!==frames.menuFrame.contentWindow){send(source);send(source,'http://local','walk-player-saved')}
}
assert.deepEqual([pushes,writes,refreshes],before);
console.log('PASS town/country/dungeon messages: visual receipt, saved-player refresh, unknown quests, foreign origins and unrelated/null sources');

// Validate actual HTML dependencies rather than only quest-preview load order.
const entries=['tools/town-walk-demo/index.html','tools/hemant-walk-demo/index.html','tools/labyrinth-demo/index.html','tools/town-walk-demo/menu.html'];
const scripts=new Set();let refs=0,inline=0;
for(const entry of entries){
 const html=read(entry),documentURL=new URL(entry,'http://local/Soulbeast/');
 const base=new URL(html.match(/<base\b[^>]*href=["']([^"']+)/)?.[1]||documentURL.href,documentURL);
 const markup=html.replace(/(<script\b[^>]*>)[\s\S]*?<\/script>/g,'$1</script>');
 for(const m of markup.matchAll(/<(script|link)\b[^>]*(?:src|href)=["']([^"']+)["'][^>]*>/g)){
  const url=new URL(m[2],base);if(url.origin!=='http://local')continue;
  assert(url.pathname.startsWith('/Soulbeast/'));const rel=decodeURIComponent(url.pathname.slice('/Soulbeast/'.length));
  assert(fs.existsSync(path.join(root,rel)),entry+' missing '+rel);refs++;
  if(m[1]==='script'&&!/type=["']module/.test(m[0]))scripts.add(rel);
 }
 for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){
  if(/\bsrc=|type=["'](?:module|application\/)/.test(m[1]))continue;
  new vm.Script(m[2],{filename:entry});inline++;
 }
}
for(const script of scripts)new vm.Script(read(script),{filename:script});
for(const launcher of ['tools/town-walk-demo/town.js','tools/hemant-walk-demo/world.js']){
 const src=read(launcher);assert(src.includes('menu.html?v=mobile-onboarding-1'));
 assert(!src.includes('menu.html?v=teleport-open-20261106'));
}
console.log(`PASS four production entry points: ${refs} local references, ${scripts.size} external scripts + ${inline} inline blocks; fresh menu URLs`);
