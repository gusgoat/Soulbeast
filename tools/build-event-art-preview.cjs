// Isolated gallery rendered by the actual game panel builders, for visual QA.
const fs=require('fs'),b=require('./client-build.cjs').build(null,{write:false});
const guard='<script>Object.defineProperty(window,"localStorage",{value:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}}});window.fetch=()=>Promise.reject(Error("Isolated art QA"));</script>';
const setup=`<script>
// Panel builders need zone metadata only: do not create a character/tutorial.
Tutorial.clear();
const params=new URLSearchParams(location.search),z=Number(params.get('zone'))||7,kind=params.get('kind')||'tales';S.zone={id:z,depth:3,log:[]};
let cards='';const card=(label,art)=>'<article><p>'+label+'</p>'+art+'</article>';
if(kind==='tales')for(let r=0;r<6;r++)for(let c=0;c<3;c++)cards+=card('Row '+r+' / '+c,WorldTales.panel(z,r,c,'Story '+r+'/'+c));
if(kind==='secrets'){const d=SECRET_DATA.locations.find(d=>d.zone===z);for(let i=0;i<9;i++)cards+=card('Secret '+i,Secret.panel(d,i,'Panel '+i));}
if(kind==='events'){const d={id:WorldTales.zoneKey(z)};for(let i=0;i<3;i++)cards+=card('Event '+i,ForestSpecial.panel(d,i,'Panel '+i));}
if(kind==='riddles'){for(const id of ['training-thorns','dragon-echo','castle-mirrors','false-boss-lightning'])for(let i=0;i<4;i++)cards+=card(id+' / '+i,ForestRiddle.panel(id,i,'Panel '+i));}
render=()=>{document.getElementById('app').innerHTML='<main style="padding:16px;max-width:1000px;margin:auto"><h1>Event art QA</h1><p>Isolated preview · no saves or network</p><nav>'+[7,1,2,3,4,5,6].map(n=>'<a style="margin:8px" href="?zone='+n+'&kind='+kind+'">Zone '+n+'</a>').join('')+'</nav><nav>'+['tales','secrets','events','riddles'].map(k=>'<a style="margin:8px" href="?zone='+z+'&kind='+k+'">'+k+'</a>').join('')+'</nav><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px">'+cards+'</div></main>';};render();
</script>`;
fs.writeFileSync('event-art-preview.html',b.files['staging-index.html'].replace('<head>','<head>'+guard).replace('</body>',setup+'</body>'));
console.log('Built isolated event art gallery');
