const assert=require('node:assert/strict'),fs=require('fs');
const fit=JSON.parse(fs.readFileSync('content/battle-card-art-fit.json','utf8'));assert.equal(Object.keys(fit).length,326);
for(const [id,f]of Object.entries(fit)){for(const k of ['width','left','top'])assert(Number.isFinite(f[k]),id);const [x0,y0,x1,y1]=f.bounds;assert(f.left+f.width*x0>=-.02,id+' left');assert(f.left+f.width*x1<=65.05,id+' right');assert(f.top+f.width*y0>=2,id+' headroom');}
for(const file of ['build/live-index.html','build/staging-index.html']){
 const {run:r}=require('./game-context.cjs')(file),actors=JSON.parse(r('JSON.stringify(MOTION_ACTORS)')),before=r('JSON.stringify(S)'),source=r('JSON.stringify(MOTION_ACTORS)');
 r('Math.random=()=>{throw Error("Card layout consumed combat RNG")};');
 for(const a of actors){const u={id:'card-test',name:'ชื่อยาวสำหรับทดสอบการ์ด',lv:60,hp:100,mp:60,st:{hp:100,mp:60},types:['normal'],status:{poison:2,burn:2},pas:[],buffs:[],owner:0,side:'ally',...(a.kind==='player'?{kind:'player',cls:a.cls,gender:a.gender,img:'player'}:a.kind==='transform'?{kind:'player',cls:'druid',form:a.id,img:'player'}:{kind:'beast',sp:a.species||a.id,img:a.species||a.id,evo:a.form||0,...(a.id==='demonlord'?{immortalWorld:true}:{})})};
 const html=r(`compactOnlineCard(${JSON.stringify(u)},'world',{me:0,battle:{cur:'card-test'}},true)`);assert(html.includes('data-battle-card="full"'),a.id);assert(html.includes('data-motion-actor="'+a.id+'"'),a.id);assert(html.includes('battle-effect-strip'),a.id);
 }
 assert.equal(r('JSON.stringify(S)'),before);assert.equal(r('JSON.stringify(MOTION_ACTORS)'),source,'Keep original artwork and emission anchors');
 const html=r(`statusBattleCard('<button class="battle-vital"><span class="battle-face">'+portrait('demonlord',28)+'</span></button>',{sp:'demonlord',types:['dark'],status:{},buffs:[],pas:[]})`);assert(html.includes('demon-black-aura'));assert.equal((html.match(/--mote:/g)||[]).length,12);
 console.log('PASS '+file+': 326 beast/player/transform/boss cards, original art+anchors, fit bounds, status decoration and black boss aura; no RNG/save changes');
}
