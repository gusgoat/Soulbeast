const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('runtime/combat.js','utf8');
function unit(name){const marker='function '+name+'(',start=source.indexOf(marker),end=source.indexOf('// @soulbeast-end',start);assert(start>=0&&end>start);return source.slice(start,end);}
let allies=[],enemies=[];
const ctx={Math,baseOf:c=>c==='ninja'?'thief':c,hasPas:()=>false,isWorldBattle:()=>false,pvpOffense:(_,k,v)=>v,sideOf:u=>u.side==='ally'?allies:enemies,FORMS:{},SK:{},S:{P:{}},B:()=>({summonSerial:0}),battleHasRoom:()=>true,battlePlaceUnit:(_,n)=>{allies.push(n);return true;}};
vm.createContext(ctx);vm.runInContext(unit('eff')+'\n'+unit('minimumHitChance')+'\n'+unit('addTemporary'),ctx);
assert.equal(ctx.minimumHitChance({},{}),25);assert.equal(ctx.minimumHitChance({cls:'gladiator'},{cls:'ninja'}),80,'existing class counter remains stronger');
function pet(owner=1){return {side:'ally',owner,kind:'pet',hp:100,st:{hp:100,patk:100,matk:200,pdef:80,eva:10},buffs:[],status:{}};}
const p=pet();allies=[p];assert.equal(ctx.eff(p,'patk'),100);allies.push(pet());assert.equal(ctx.eff(p,'patk'),85);assert.equal(ctx.eff(p,'matk'),170);allies.push(pet());assert.equal(ctx.eff(p,'patk'),70);assert.equal(ctx.eff(p,'matk'),140);assert.equal(ctx.eff(p,'pdef'),80);
allies.push(pet(2),{...pet(),kind:'summon',temporary:true});assert.equal(ctx.eff(p,'patk'),70,'other owner and temporary summon excluded');allies[2].hp=0;assert.equal(ctx.eff(p,'patk'),85,'dead companion excluded');
const hero={...pet(),id:'hero',cls:'ninja',kind:'player',name:'Ninja',skills:['attack'],st:{hp:1000,mp:100,patk:100,eva:100}};allies=[hero];assert(ctx.addTemporary(hero,{summon:'clone',life:3}));const clone=allies[1];assert.equal(clone.st.hp,250);assert.equal(clone.hp,250);assert.equal(clone.st.patk,80);assert.equal(clone.temporary,true);assert.equal(hero.st.hp,1000);
console.log('PASS dodge cap75 with existing counter80; thief cloneHP25 and other stats80; companions1/2/3 attack100/85/70%, per owner/alive only, temporary units excluded.');
const server=fs.readFileSync('server/accounts/engine.ts','utf8'),start=server.indexOf('function eff('),end=server.indexOf('const hitChance=',start);
assert(start>=0&&end>start);vm.runInContext(server.slice(start,end),ctx);
const serverPet=pet();allies=[serverPet];assert.equal(ctx.eff(serverPet,'patk'),100);
allies.push(pet());assert.equal(ctx.eff(serverPet,'patk'),85);assert.equal(ctx.eff(serverPet,'matk'),170);
allies.push(pet());assert.equal(ctx.eff(serverPet,'patk'),70);assert.equal(ctx.eff(serverPet,'matk'),140);
allies.push(pet(2),{...pet(),temporary:true});assert.equal(ctx.eff(serverPet,'patk'),70);
allies[2].hp=0;assert.equal(ctx.eff(serverPet,'patk'),85);assert.equal(ctx.eff(serverPet,'pdef'),80);
console.log('PASS authoritative server companion attack100/85/70%, physical and magic, owner/alive/temporary filters and defense preserved.');
