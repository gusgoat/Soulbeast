(function(scope){'use strict';
const F=.64;
function attach(data,canonical,countries){
 if(data.gates)return data.gates;
 const country=data.countryId||'blue',all={...countries,[country]:data},names=Object.fromEntries(canonical.countries.map(c=>[c.id,c.name]));
 const waterAPI=typeof module!=='undefined'?require('./waterways.js'):scope.hemantWaterways,water=waterAPI.create(data,{nodes:[],edges:[]});
 data.gates=[];
 for(const link of canonical.links){
  const localId=[link.a,link.b].find(id=>id.startsWith(country+'-'));if(!localId)continue;
  const remoteId=link.a===localId?link.b:link.a,targetCountry=remoteId.split('-')[0],v=data.villages.find(v=>v.id===localId),remote=all[targetCountry]?.villages.find(v=>v.id===remoteId);
  if(!v||!remote)throw Error('Missing border village '+link.id);
  const side=({blue:{green:'east',red:'south'},green:{blue:'west',red:'west'},red:{blue:'north',green:'east'}})[country][targetCountry];let point;
  const sameSide=data.gates.filter(g=>g.side===side);
  for(const offset of [0,350,-350,700,-700,1050,-1050]){
   const p=side==='west'||side==='east'?{x:side==='west'?560:data.width-560,y:Math.max(1250,Math.min(data.height-1000,v.y+offset))}:{x:Math.max(1100,Math.min(data.width-1100,v.x+offset)),y:side==='north'?850:data.height-450};
   if(water.raw(p.x,p.y,150)||sameSide.some(g=>Math.hypot(g.x-p.x,(g.y-p.y)*F)<1000))continue;point=p;break;
  }
  if(!point)throw Error('No dry gate location '+link.id);
  const number=data.gates.length+1;
  const gate={id:link.id,type:'border',...point,side,number,name:'ประตู '+number+' · '+names[targetCountry],localId,targetId:remoteId,targetCountry,targetName:names[targetCountry],description:'ชายแดน'+data.country+' ↔ '+names[targetCountry]+' · เส้นทางหมู่บ้าน'+v.name+' ↔ หมู่บ้าน'+remote.name};
  data.gates.push(gate);data.roads.push({a:v.id,b:gate.id,via:[]});
 }
 return data.gates;
}
function arrival(gate,data){const v=data.villages.find(v=>v.id===gate.localId),dx=v.x-gate.x,dy=(v.y-gate.y)*F,len=Math.hypot(dx,dy);return {x:gate.x+dx/len*160,y:gate.y+dy/len*160/F};}
function travelURL(gate,search=''){const q=new URLSearchParams(search);q.set('country',gate.targetCountry);q.set('from',gate.targetId);q.set('arrival',gate.id);q.delete('gate');q.delete('view');return 'index.html?'+q.toString();}
const api={attach,arrival,travelURL};scope.walkBorderLinks=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
