// Offline QA with the same production portrait, motion controller and battlefield.
const fs=require('fs');require('./build-projectile-effects-preview.cjs');
let html=fs.readFileSync('build/projectile-effects-preview.html','utf8');
html=html.replace("S.P.cls='stormcaller';", "S.P.cls='sniper';S.P.name='เทพธนู';S.P.gender=new URLSearchParams(location.search).get('gender')==='female'?'female':'male';");
html=html.replace("const samples=[", "const samples=['ms_mage20','wk_curse','ne_soul','f_moonbeam','ms_mage60','solar_mortivar_s5','ws_staff4','sn_heart','s_naga','s_dragon','solar_raijaku_s5','ms_druid50',");
html=html.replace('document.body.prepend(toolbar);',`document.body.prepend(toolbar);
const archerTools=document.createElement('section');archerTools.className='projectile-toolbar';archerTools.innerHTML='<div><button class="btn sm" id="archerMale">เทพธนูชาย</button><button class="btn sm" id="archerFemale">เทพธนูหญิง</button></div><div>'+['idle','hit','windup','power','threat','melee'].map(p=>'<button class="btn sm" data-archer-pose="'+p+'">'+p+'</button>').join('')+'</div><div style="justify-content:center"><img src="assets/portraits/divine-archer-male-v2.webp" alt="เทพธนูชาย ธนูยาว" width="96" height="96"><img src="assets/portraits/divine-archer-female-v2.webp" alt="เทพธนูหญิง ธนูยาว" width="96" height="96"></div>';toolbar.after(archerTools);
function archerSex(gender){S.P.gender=gender;S.battle.allies[0].gender=gender;render();CharacterMotion.sync();}
document.getElementById('archerMale').onclick=()=>archerSex('male');document.getElementById('archerFemale').onclick=()=>archerSex('female');
for(const b of archerTools.querySelectorAll('[data-archer-pose]'))b.onclick=()=>{BattleEffects.clear();CharacterMotion.sync();const phase=b.dataset.archerPose;for(const [n,i]of CharacterMotion.instances)if(n.dataset.motionUnit==='P'){n.style.setProperty('--um-elapsed',phase==='windup'?'-550ms':'-250ms');i.set(phase);i.pause(phase!=='idle');}};
`);
fs.writeFileSync('build/divine-archer-preview.html',html);console.log('Built Divine Archer portrait, complete motion including threat and twelve-element offline preview');
