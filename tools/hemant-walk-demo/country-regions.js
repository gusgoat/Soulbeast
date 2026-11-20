(function(g){'use strict';
 const F=.64,names={N:'ภาคเหนือ',W:'ภาคตะวันตก',E:'ภาคตะวันออก',S:'ภาคใต้'};
 function inside(x,y,polygon){let yes=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;}
 function select(source,search){
  const q=new URLSearchParams(search);if(q.get('layout')==='legacy')return source;
  const maps=g.CountryRegionMaps.countries?.[source.countryId]?.regions;if(!maps)return source;
  const from=q.get('from'),arrival=q.get('arrival');
  let code=q.get('region');
  if(!maps[code])code=Object.keys(maps).find(k=>[...maps[k].cities,...maps[k].villages,...maps[k].forests,...maps[k].regionPlaces].some(p=>p.id===from||p.id===arrival||(['colosseum','dungeon'].includes(arrival)&&p.type===arrival)))||Object.keys(maps).find(k=>maps[k].gates.some(p=>p.id===arrival))||'W';
  return JSON.parse(JSON.stringify(maps[code]));
 }
 function travelURL(gate,search){
  const q=new URLSearchParams(search);q.delete('view');q.delete('gate');q.delete('from');
  q.set('country',gate.targetCountry);
  if(gate.regional||g.CountryRegionMaps.countries?.[gate.targetCountry]){q.set('layout','regions-v5');q.set('region',gate.targetRegion);q.set('arrival',gate.id);}
  else{q.delete('layout');q.delete('region');q.set('from',gate.targetId);q.set('arrival',gate.legacyArrival);}
  return 'index.html?'+q;
 }
 function arrival(gate){return {x:gate.x+gate.inward.x*180,y:gate.y+gate.inward.y*180};}
 function path(ctx,polygon){ctx.beginPath();polygon.forEach((p,i)=>i?ctx.lineTo(p.x,p.y*F):ctx.moveTo(p.x,p.y*F));ctx.closePath();}
 function decorateGround(ctx,data,images){
  if(!data.regionLayout)return;
  const {width,height,regionPolygon:polygon,mainlandPolygon:mainland}=data;
  // Mask only this region's ground; the active canvas and spatial index stay local.
  ctx.save();ctx.globalAlpha=1;ctx.fillStyle='#fff';ctx.globalCompositeOperation='destination-in';path(ctx,polygon);ctx.fill();ctx.restore();
  const coast=typeof module!=='undefined'?require('./region-coast.js'):g.RegionCoast;
  const backdrop=typeof module!=='undefined'?require('./region-backdrop.js'):g.RegionBackdrop;
  backdrop.paintLand(ctx,data,images);
  ctx.save();ctx.globalCompositeOperation='destination-over';ctx.fillStyle=coast.SEA;ctx.fillRect(0,0,width,height*F);ctx.restore();
  backdrop.paintMountains(ctx,data,images);
  coast.paintOcean(ctx,data);
  coast.paintBeach(ctx,data);
  ctx.save();path(ctx,polygon);ctx.clip();
  const coastal=coast.segments(data);ctx.beginPath();for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length];if(coastal.some(e=>e.a===a&&e.b===b))continue;const dx=b.x-a.x,dy=(b.y-a.y)*.64,len=Math.hypot(dx,dy),start=coast.isBeach(data,a.x,a.y)?Math.min(.45,coast.BEACH_WIDTH/len):0,end=coast.isBeach(data,b.x,b.y)?Math.max(.55,1-coast.BEACH_WIDTH/len):1;ctx.moveTo(a.x+dx*start,a.y*.64+dy*start);ctx.lineTo(a.x+dx*end,a.y*.64+dy*end);}
  ctx.lineWidth=9;ctx.strokeStyle='#d8b866bb';ctx.stroke();ctx.restore();
 }
 function mount(data){
  if(!data.regionLayout)return;
  document.documentElement.dataset.countryRegion=data.regionId;
  const title=document.querySelector('.location h1');title.textContent=data.country+' · '+data.regionName;
  document.querySelector('.location p').textContent='โหลดทีละภาค · '+data.gates.filter(p=>p.regional).length+' ประตูภาค · '+data.gates.filter(p=>!p.regional).length+' ประตูข้ามประเทศ';
  if(!g.SoulbeastPacklordPreview)return;
  const style=document.createElement('style');style.textContent='.region-preview-nav{position:fixed;left:12px;top:110px;z-index:55;display:flex;gap:5px;flex-wrap:wrap;max-width:min(92vw,470px)}.region-preview-nav a{color:#f6e3a4;background:#173447e8;border:1px solid #bca26a;border-radius:7px;padding:7px 10px;text-decoration:none;font:12px Tahoma}.region-preview-nav a[aria-current]{background:#71582d}.region-preview-note{position:fixed;left:12px;bottom:7px;z-index:55;color:#f6e3a4;background:#173447dd;padding:5px;border-radius:5px;font:11px Tahoma;pointer-events:none}@media(max-height:500px){.region-preview-nav{top:55px;left:160px;max-width:60vw}}';document.head.append(style);
  const nav=document.createElement('nav');nav.className='region-preview-nav';nav.ariaLabel='เลือกภาคสำหรับทดลอง';
  for(const [id,name]of Object.entries(names)){const q=new URLSearchParams(location.search);q.set('region',id);q.delete('arrival');q.delete('from');const a=document.createElement('a');a.href='index.html?'+q;a.textContent=name;if(id===data.regionId)a.setAttribute('aria-current','page');nav.append(a);}document.body.append(nav);
  const note=document.createElement('small');note.className='region-preview-note';note.textContent='ทดลอง'+data.country+' 4 ภาค · ทอง: ระหว่างภาค · ม่วง: ข้ามประเทศ'+(window.SoulbeastPacklordPreview&&new URLSearchParams(location.search).get('beastTestAll')==='1'?' · จำลองปลดล็อกอสูรครบทุกป่า':'');document.body.append(note);
  for(const [id,text,target]of [['regionMap','แผนที่ภาค','mapToggle'],['regionPlaces','สถานที่ / ประตู','places']]){const a=document.createElement('a');a.id=id;a.href='#';a.textContent=text;a.onclick=e=>{e.preventDefault();document.getElementById(target).click();};nav.append(a);}
  const country=document.createElement('a');country.href='regions-preview.html?country='+data.countryId+(new URLSearchParams(location.search).get('beastTestAll')==='1'?'&beastTestAll=1':'');country.textContent='ดูทั้งประเทศ';nav.append(country);
 }
 function minimapView(data,player){const zoom=data.regionLayout?2:1,size=180/zoom,left=Math.max(0,Math.min(180-size,player.x/data.width*180-size/2)),top=Math.max(0,Math.min(180-size,player.y/data.height*180-size/2));return {zoom,left,top,size,point:(x,y)=>({x:(x/data.width*180-left)*zoom,y:(y/data.height*180-top)*zoom})};}
 const api={inside,select,travelURL,arrival,decorateGround,mount,minimapView};g.CountryRegions=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
