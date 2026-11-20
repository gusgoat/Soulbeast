(()=>{'use strict';
 const all=CountryRegionMaps.countries,ns='http://www.w3.org/2000/svg';
 const colors={blue:['#b9dce8','#cfe7ee','#8fb5ca','#aecdc9'],green:['#aad19b','#8fb382','#bad4a1','#7fb6a0'],red:['#d9a17c','#c58b77','#e5c18a','#d09c84']};
 const codes=['N','W','E','S'];
 const worldPoint=(data,p)=>({x:(p.x-data.regionOrigin.pad)/data.regionOrigin.scale+data.regionOrigin.left,y:(p.y-data.regionOrigin.topPad)*data.flatten/data.regionOrigin.scale+data.regionOrigin.top});
 const play=(country,region)=>'index.html?country='+country+'&layout=regions-v5&region='+region+'&packlord3d=1&roster=1'+(new URLSearchParams(location.search).get('beastTestAll')==='1'?'&beastTestAll=1&arrival=beasts':'');
 function render(selected){
  if(selected!=='world'&&!all[selected])selected='blue';
  const world=selected==='world',countries=world?Object.keys(all):[selected],atlas=document.querySelector('#atlas'),cards=document.querySelector('#regionCards');atlas.replaceChildren();cards.replaceChildren();
  for(const b of document.querySelectorAll('[data-country]'))b.setAttribute('aria-selected',String(b.dataset.country===selected));
  document.querySelector('#countryTitle').textContent=world?'โลกทั้งสามประเทศ':all[selected].name+' · 4 ภาค';
  document.querySelector('#summary').textContent=world?'ประตูข้ามประเทศหลัก 8 คู่ เชื่อมทุกภาคชายแดนที่ติดกัน':'เมืองหลวง 1 เมือง · เมืองรอง 4 เมือง · หมู่บ้านชายแดน 8 + 8 · โหลดฉากเดินทีละภาค';
  const svg=document.createElementNS(ns,'svg'),allPoints=countries.flatMap(id=>Object.values(all[id].regions).flatMap(d=>d.regionPolygon.map(p=>worldPoint(d,p)))),xs=allPoints.map(p=>p.x),ys=allPoints.map(p=>p.y),left=Math.min(...xs)-30,top=Math.min(...ys)-30;
  svg.setAttribute('viewBox',[left,top,Math.max(...xs)-left+30,Math.max(...ys)-top+30].join(' '));svg.setAttribute('role','img');svg.setAttribute('aria-label',world?'แผนที่โลกและประตูเชื่อม':'แผนที่'+all[selected].name+'แบ่ง 4 ภาค');atlas.append(svg);
  function node(tag,attrs,text){const e=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);if(text)e.textContent=text;svg.append(e);return e;}
  const portals=new Map();
  for(const id of countries)for(const code of codes){const d=all[id].regions[code],points=d.regionPolygon.map(p=>worldPoint(d,p));const poly=node('polygon',{points:points.map(p=>p.x+','+p.y).join(' '),fill:colors[id][codes.indexOf(code)],stroke:'#ead099','stroke-width':world?1.5:2});poly.style.cursor='pointer';poly.onclick=()=>location.href=play(id,code);
   for(const p of [...d.cities,...d.villages,...d.forests,...d.regionPlaces.filter(p=>p.type!=='junction')]){const w=worldPoint(d,p);node('circle',{cx:w.x,cy:w.y,r:p.type==='village'?1.6:3,fill:p.type==='village'?'#536d6d':'#193b48'});if(!world&&p.type!=='village')node('text',{x:w.x,y:w.y-6,'font-size':8,'text-anchor':'middle',fill:'#163446','font-family':'Tahoma'},p.name);if(world&&p.type==='capital')node('text',{x:w.x,y:w.y-12,'font-size':16,'text-anchor':'middle','font-weight':'bold',fill:'#173345','font-family':'Tahoma'},all[id].name);}
   const label=worldPoint(d,d.spawn);node('text',{x:label.x,y:label.y+23,'font-size':world?10:13,'text-anchor':'middle',fill:'#143c4d','font-family':'Tahoma'},d.regionName);
   for(const gate of d.gates){const key=gate.regional?id+':'+gate.id:gate.id;if(!portals.has(key))portals.set(key,[]);portals.get(key).push({gate,p:worldPoint(d,gate)});}
   if(!world){const a=document.createElement('article'),h=document.createElement('h2'),p=document.createElement('p'),link=document.createElement('a');h.textContent=d.regionName;p.textContent=[...d.forests,...d.regionPlaces.filter(p=>p.type!=='junction')].map(p=>p.name).join(' · ');link.href=play(id,code);link.textContent='เริ่มเดิน'+d.regionName;link.dataset.region=code;a.append(h,p,link);cards.append(a);}
  }
  for(const entries of portals.values()){const {gate}=entries[0],x=entries.reduce((s,e)=>s+e.p.x,0)/entries.length,y=entries.reduce((s,e)=>s+e.p.y,0)/entries.length;if(entries.length===2)node('line',{x1:entries[0].p.x,y1:entries[0].p.y,x2:entries[1].p.x,y2:entries[1].p.y,stroke:gate.regional?'#b58c3e':'#975ac6','stroke-width':world?1.5:1,'stroke-dasharray':'3 3'});const marker=node('rect',{x:x-4,y:y-4,width:8,height:8,fill:gate.regional?'#f6ce70':'#b77de5',stroke:'#695473','stroke-width':.7});const title=document.createElementNS(ns,'title');title.textContent=gate.name;marker.append(title);if(!gate.regional&&gate.code)node('text',{x:x+7,y:y-4,'font-size':8,fill:'#512474','font-weight':'bold'},gate.code);}
  history.replaceState(null,'',location.pathname+'?country='+selected);
 }
 for(const button of document.querySelectorAll('[data-country]'))button.onclick=()=>render(button.dataset.country);
 render(new URLSearchParams(location.search).get('country')||'blue');
})();
