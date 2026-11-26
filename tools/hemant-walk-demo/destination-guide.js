(function(scope){
 'use strict';
 const types=['dungeon','colosseum','forest','islandPort','capital','city','village'];
 const labels=['ดันเจี้ยน','โคลอสเซียม','ป่า','ท่าเรือ','เมืองหลวง','เมือง','หมู่บ้าน'];
 const headings=['สถานที่ในภาคปัจจุบัน','สถานที่ในอาณาจักร','สถานที่ในต่างอาณาจักร'];
 const collator=new Intl.Collator('th',{numeric:true});
 const titleOf=p=>p.type==='village'?'หมู่บ้าน'+p.name:p.name;
 const locationOf=d=>d.map.country+' · '+d.map.regionName;

 function create(countries){
  const destinations=new Map();
  for(const [country,entry] of Object.entries(countries)){
   for(const [region,map] of Object.entries(entry.regions)){
    for(const place of [...map.regionPlaces,...map.forests,...map.cities,...map.villages]){
     if(!types.includes(place.type))continue;
     const key=[country,region,place.id].join('/');
     destinations.set(key,{key,country,region,map,place});
    }
   }
  }
  function groups(data){
   const result=[[],[],[]];
   const sorted=[...destinations.values()].sort((a,b)=>
    types.indexOf(a.place.type)-types.indexOf(b.place.type)||
    (a.place.type==='forest'?(a.place.chapter??0)-(b.place.chapter??0):0)||
    collator.compare(titleOf(a.place),titleOf(b.place))||collator.compare(locationOf(a),locationOf(b)));
   for(const d of sorted)result[d.country!==data.countryId?2:d.region!==data.regionId?1:0].push(d);
   return result;
  }
  function gatesTo(data,target){
   const start=data.countryId+'/'+data.regionId,goal=target.country+'/'+target.region;
   const queue=[{map:data,path:[]}],seen=new Set([start]);
   for(let i=0;i<queue.length;i++){
    const {map,path}=queue[i];
    if(map.countryId+'/'+map.regionId===goal)return path;
    for(const gate of map.gates){
     const key=gate.targetCountry+'/'+gate.targetRegion;
     if(seen.has(key)||(target.country===data.countryId&&gate.targetCountry!==data.countryId))continue;
     const next=countries[gate.targetCountry]?.regions[gate.targetRegion];
     if(!next?.gates.some(g=>g.id===gate.id&&g.targetCountry===map.countryId&&g.targetRegion===map.regionId))continue;
     seen.add(key);queue.push({map:next,path:[...path,gate]});
    }
   }
   return null;
  }
  return {groups,gatesTo,lookup:key=>destinations.get(key)};
 }

 function render(root,groups,select,extras){
  const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text)el.textContent=text;return el};
  const tabs=make('div','guide-tabs'),columns=make('div','guide-columns');
  const choose=i=>{
   root.dataset.column=String(i);
   Array.from(tabs.children).forEach((tab,j)=>tab.setAttribute('aria-pressed',String(i===j)));
  };
  groups.forEach((items,i)=>{
   const tab=make('button','guide-tab',headings[i]);tab.onclick=()=>choose(i);tabs.append(tab);
   const col=make('section','guide-column'),heading=make('h3','',headings[i]);
   const list=make('div','guide-list');col.append(heading,list);columns.append(col);
   for(const d of items){
    const p=d.place,row=make('button','guide-place'),sub=labels[types.indexOf(p.type)];
    row.append(make('span','',titleOf(p)),make('small','',sub+' · '+locationOf(d)));
    row.onclick=()=>select(d);list.append(row);
   }
   if(i===0)for(const extra of extras){
    const row=make('button','guide-place',extra.name);row.onclick=extra.open;list.append(row);
   }
  });
  root.replaceChildren(tabs,columns);choose(0);
 }
 const api={create,render,titleOf,locationOf};
 scope.CountryDestinationGuide=api;
 if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
