// Full game layout with fake state. No account, save or network access.
const fs=require('fs'),b=require('./client-build.cjs').build(null,{write:false});
const fixture=require('./game-context.cjs')('build/staging-index.html').run('JSON.stringify(S)');
const guard='<script>Object.defineProperty(window,"localStorage",{value:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}}});window.fetch=()=>Promise.reject(Error("Isolated battle layout QA"));</script>';
const setup=`<script>
Tutorial.clear();Sound.fx=()=>{};Sound.cry=()=>{};S=${fixture};delete S.P.tutorial;S.P.lv=60;S.P.name='ผู้ผนึกแสงจันทร์';S.ui.battleCommandsHidden=new URLSearchParams(location.search).get('menu')!=='skills';S.ui.battleDetails=false;S.ui.autoTeam=false;S.ui.autoPet=false;
const z=Number(new URLSearchParams(location.search).get('zone'))||7;S.zone={id:z,depth:3,log:[]};S.screen='battle';
const pet=wildUnit('kodama',12,1);pet.side='ally';pet.id='pet-qa';
S.battle={v:4,kind:z===6?'boss':'wild',meta:z,enemies:[wildUnit(z===6?'demonlord':'jackalope',12,0),wildUnit('kodama',10,1)],allies:[playerUnit(),pet],round:2,queue:['P'],cur:'P',log:['เตรียมเลือกคำสั่งต่อสู้'],target:0,atarget:0,menu:new URLSearchParams(location.search).get('menu')==='skills'?'skill':'main',over:null,used:[],fx:[]};render();
document.addEventListener('click',e=>{if(e.target.closest('[data-a]')){e.preventDefault();e.stopImmediatePropagation();}},true);
</script>`;
fs.writeFileSync('battle-play-preview.html',b.files['staging-index.html'].replace('<html lang="th">','<html lang="th" data-skip-web-intro>').replace('<head>','<head>'+guard).replace('</body>',setup+'</body>'));
console.log('Built isolated full battle layout preview');
