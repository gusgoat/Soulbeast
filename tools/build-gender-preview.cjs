const fs=require('fs'),b=require('./client-build.cjs').build(null,{write:false});
const guard='<script>Object.defineProperty(window,"localStorage",{value:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}}});window.fetch=()=>Promise.reject(Error("Isolated gender QA: no accounts or saves"));</script>';
const setup=`<script>
const genderParams=new URLSearchParams(location.search);
S={screen:'start',ui:{gender:'male',introSeen:true},P:null,zone:null,battle:null};Tutorial.clear();
if(genderParams.get('demo')==='create'){render();}
else{const family=BASES.includes(genderParams.get('family'))?genderParams.get('family'):'swordsman';
render=()=>{document.getElementById('app').innerHTML='<main style="padding:16px;overflow:auto"><h1>ภาพอาชีพชาย / หญิง</h1><p>หน้าทดสอบแยกเซฟและบัญชีจริง · ภาพเดิมของตัวละครเก่ายังคงใช้ตามเดิม</p><nav>'+BASES.map(k=>'<a style="display:inline-block;padding:10px" href="?family='+k+'">'+CLS[k].n+'</a>').join('')+'</nav><a href="?demo=create">ทดสอบสร้างตัวละคร</a><section style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:16px 0">'+Object.keys(CLS).filter(k=>baseOf(k)===family).map(k=>'<article class="card" style="padding:8px"><b>'+CLS[k].n+'</b><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">'+['male','female'].map(g=>'<figure style="margin:0"><img width="256" height="256" style="display:block;width:100%;height:auto;border-radius:8px" src="'+classPortraitSource(k,g)+'" alt="'+CLS[k].n+' '+(g==='male'?'ชาย':'หญิง')+'"><figcaption>'+(g==='male'?'ชาย':'หญิง')+'</figcaption></figure>').join('')+'</div></article>').join('')+'</section></main>';};render();}
</script>`;
fs.writeFileSync('gender-preview.html',b.files['staging-index.html'].replace('<head>','<head>'+guard).replace('</body>',setup+'</body>'));
console.log('Built isolated 63-class gender gallery and real creation-flow preview');
