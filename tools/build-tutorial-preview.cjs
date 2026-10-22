const fs=require('fs'),b=require('./client-build.cjs').build(null,{write:false});
const guard='<script>Object.defineProperty(window,"localStorage",{value:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}}});window.fetch=()=>Promise.reject(Error("Isolated tutorial preview"));</script>';
const setup=`<script>
var previewName=document.createElement('input');previewName.id='nm';previewName.value='ผู้ทดสอบบทสอน';previewName.hidden=true;document.body.appendChild(previewName);handlers.newgame();previewName.remove();
S.ui={};S.P.code='TUTORIALPREVIEW';const demo=new URLSearchParams(location.search).get('demo');
if(demo==='battle'){Tutorial.state().active=null;S.zone={id:7,depth:1,log:[]};startBattle([wildUnit(ZN[6].sp[0],3,0)],'wild',7);}
else if(demo==='raid'){S.P.lv=11;Tutorial.state().done={stats:true,tower:true};Tutorial.state().active='raid';gsSave=async()=>{};campCall=async(a,x)=>({ok:a==='camp_register'});Tutorial.openRaid();}
else if(demo==='world'||demo==='guildwar'){S.P.lv=demo==='world'?26:30;Tutorial.state().done={stats:true,tower:true,raid:true,guild:true,promotion:true,world:demo!=='world'};Tutorial.state().active=demo;}
render();</script>`;
fs.writeFileSync('tutorial-preview.html',b.files['staging-index.html'].replace('<head>','<head>'+guard).replace('</body>',setup+'</body>'));
console.log('Built isolated visual tutorial preview (no saves or account requests)');
