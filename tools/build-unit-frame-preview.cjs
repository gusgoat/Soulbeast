const fs=require('fs'),b=require('./client-build.cjs').build(null,{write:false});
const fixture=require('./game-context.cjs')('build/staging-index.html').run('JSON.stringify(S)');
const guard='<script>Object.defineProperty(window,"localStorage",{value:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}}});window.fetch=()=>Promise.reject(Error("Isolated card-frame preview"));</script>';
const setup=`<script>
Tutorial.clear();render=()=>{};Sound.fx=()=>{};Sound.cry=()=>{};S=${fixture};delete S.P.tutorial;S.P.name='ผู้ผนึกแสงจันทร์';S.P.lv=60;S.zone={id:7,depth:2};
const params=new URLSearchParams(location.search),view=params.get('view')||'battle';
const roles=['swordsman','archmage','spiritlord','archdruid','ninja','paladin','sniper','assassin','gunsaint','merchant','mastersmith','alchemist','maestro'];
function hero(cls){S.P.cls=cls;const st=pStats();S.P.hp=st.hp;S.P.mp=st.mp;return playerUnit();}
function battle(own,enemies){S.battle={v:4,kind:'wild',meta:7,enemies,allies:own,round:2,queue:[],cur:own[0].id,log:[],target:0,atarget:0,menu:'main',over:null,used:[],fx:[]};return S.battle;}
function extract(html,selector){const el=document.createElement('div');el.innerHTML=html;return el.querySelector(selector).outerHTML;}
function article(title,html){return '<article><h2>'+title+'</h2>'+html+'</article>';}
let cards='';
if(view==='roles')for(const cls of roles){hero(cls);cards+=article(CLS[cls].n,extract(vHero(),'[data-unit-frame]'));}
if(view==='beasts')for(const sp of ['kappa','naga','dragon','kodama','raiju','yeti','wisp','sphinx','demonlord']){const p={...S.P.pets[0],sp,lv:60,form:0};cards+=article(SP[sp].n,extract(vPet(p),'[data-unit-frame]'));}
if(view==='hero'){hero(params.get('class')||'ninja');cards=vHero();}
if(view==='bag'){hero('swordsman');cards=bagVitals();}
if(view==='battle'){const u=hero(params.get('class')||'swordsman'),pet=wildUnit('naga',60,2);pet.side='ally';pet.id='pet-2';const foes=[wildUnit('demonlord',60,0),wildUnit('dragon',60,1)];battle([u,pet],foes);cards=article('กรอบตัวละครและอสูรในสนาม',extract(vBattle(),'.battle-vitals'));}
if(view==='world'){const own=Array.from({length:24},(_,i)=>{const u=i%2?wildUnit('naga',60,i):hero(roles[(i/2)%roles.length|0]);u.id='ally-'+i;u.owner=i;u.side='ally';return u;});const boss=wildUnit('demonlord',60,0);boss.immortalWorld=true;boss.id='worldboss';boss.st.mp=1000000;boss.mp=1000000;const b=battle(own,[boss]);cards='<div class="world-frame-qa online-combat-screen">'+compactOnlineBattle('world',{battle:b,status:'finished',players:[],me:0,winner:0})+'</div>';}
document.getElementById('app').innerHTML='<main class="unit-preview"><header><small>SOULBEAST · ลายกรอบตัวละคร</small><h1>ตราแห่งผู้ผนึกและอสูร</h1><nav>'+[['battle','สนามต่อสู้'],['roles','สายอาชีพ'],['beasts','ธาตุและเผ่าพันธุ์'],['hero','หน้าตัวละคร'],['bag','กระเป๋า'],['world','บอสโลก · ทีมใหญ่']].map(([key,n])=>'<a '+(key===view?'aria-current="page"':'')+' href="?view='+key+'">'+n+'</a>').join('')+'</nav></header><div class="unit-preview-content '+(['roles','beasts'].includes(view)?'unit-preview-grid':'')+'">'+cards+'</div></main>';
document.addEventListener('click',e=>{if(e.target.closest('[data-a]')){e.preventDefault();e.stopImmediatePropagation();}},true);
</script>`;
const style='<style>body{margin:0}#app{height:auto;min-height:100dvh;max-width:1100px}.unit-preview{padding:24px 16px 40px;overflow:visible}.unit-preview h1{color:#efd599;font-size:25px;margin:8px 0 16px}.unit-preview h2{font-size:16px}.unit-preview header>small{font-size:10px;letter-spacing:.12em}.unit-preview nav{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:24px}.unit-preview nav a{color:#b9cbd3;background:#152737;padding:6px 9px;border:1px solid #4a5863;border-radius:6px;font-size:11px;text-decoration:none}.unit-preview nav a[aria-current]{color:#ffe0a0;border-color:#d0ae6a}.unit-preview-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,310px),1fr));gap:24px}.unit-preview article{min-width:0}.unit-preview .battle-vitals{position:relative;top:auto}.unit-preview .world-frame-qa{height:620px;padding:0}.unit-preview .bag-vitals{display:grid;gap:16px}</style>';
fs.writeFileSync('unit-frames-preview.html',b.files['staging-index.html'].replace('<html lang="th">','<html lang="th" data-skip-web-intro>').replace('<head>','<head>'+guard+style).replace('</body>',setup+'</body>'));
console.log('Built isolated card-frame preview using actual combat/hero/bag/pet builders; no accounts, saves or network');
