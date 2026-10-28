// Shared map rules only. No browser-provided membership, ownership or health is trusted here.
export function countryWarTopology(data){
 const countries=new Map(data.countries.map(c=>[c.id,c])),nodes=new Map(data.nodes.map(n=>[n.id,n])),neighbors=new Map(data.nodes.map(n=>[n.id,new Set()]));
 if(countries.size!==3||nodes.size!==63)throw Error('invalid_country_war_map');
 for(const e of data.edges){if(!nodes.has(e.a)||!nodes.has(e.b)||e.a===e.b||neighbors.get(e.a).has(e.b))throw Error('invalid_country_war_route');neighbors.get(e.a).add(e.b);neighbors.get(e.b).add(e.a);}
 for(const c of countries.values()){
  const group=[...nodes.values()].filter(n=>n.country===c.id),capital=nodes.get(c.capitalId);
  if(group.filter(n=>n.type==='capital').length!==1||group.filter(n=>n.type==='city').length!==4||group.filter(n=>n.type==='village').length!==16||capital?.country!==c.id||capital?.type!=='capital')throw Error('invalid_country_war_country');
 }
 for(const n of nodes.values()){
  if(!countries.has(n.country)||!['capital','city','village'].includes(n.type))throw Error('invalid_country_war_location');
  const adjacent=[...neighbors.get(n.id)].map(id=>nodes.get(id));
  if(n.type==='capital'&&(n.capacity!==null||n.capturable||adjacent.length!==4||adjacent.some(x=>x.type!=='city'||x.country!==n.country)))throw Error('invalid_country_war_capital');
  if(n.type==='city'&&(n.capacity!==16||!n.capturable||adjacent.length!==5||adjacent.filter(x=>x.type==='village'&&x.country===n.country).length!==4||adjacent.filter(x=>x.type==='capital'&&x.country===n.country).length!==1))throw Error('invalid_country_war_city');
  if(n.type==='village'&&(n.capacity!==4||!n.capturable||adjacent.length!==2||adjacent.filter(x=>x.type==='city'&&x.country===n.country).length!==1||adjacent.filter(x=>x.type==='village'&&x.country!==n.country).length!==1))throw Error('invalid_country_war_village');
 }
 const ownerOf=(state,id)=>state.locations?.[id]?.owner||nodes.get(id)?.country;
 const owner=(state,id)=>{const n=nodes.get(id);return n?.type==='capital'?n.country:ownerOf(state,id);};
 const residents=(state,id)=>Object.values(state.members||{}).filter(m=>m.location===id);
 return {
  adjacent:(a,b)=>neighbors.get(a)?.has(b)===true,
  capacity:id=>nodes.get(id)?.capacity,
  canCapture:id=>nodes.get(id)?.capturable===true,
  hasRoom(state,id,count=1){if(!nodes.has(id)||!Number.isSafeInteger(count)||count<0)return false;const cap=nodes.get(id).capacity;return cap===null||residents(state,id).length+count<=cap;},
  // Reveal only owned bases and their direct neighbors. Never serialize the full state to the client.
  view(state,viewer){
   if(!countries.has(viewer.country))throw Error('country_required');
   const owned=new Set([...nodes.keys()].filter(id=>owner(state,id)===viewer.country)),visible=new Set(owned);
   for(const id of owned)for(const next of neighbors.get(id))visible.add(next);
   return {country:viewer.country,locations:[...visible].map(id=>{
    const n=nodes.get(id),own=owned.has(id),people=residents(state,id);
    return {id,name:n.placeName,type:n.type,terrain:n.terrain,owner:owner(state,id),capacity:n.capacity,capturable:n.capturable,count:people.length,...(own?{members:people.filter(m=>m.country===viewer.country).map(m=>({code:m.code,name:m.name}))}:{})};
   }),edges:data.edges.filter(e=>visible.has(e.a)&&visible.has(e.b)).map(e=>({a:e.a,b:e.b}))};
  },
  monthlyRanks(state){
   const scores=Object.fromEntries([...countries.keys()].map(id=>[id,{country:id,score:0,villages:0,capitals:0}]));
   for(const n of nodes.values()){const p=scores[owner(state,n.id)];if(n.type==='village'){p.score++;p.villages++;}if(n.type==='capital'){p.score+=4;p.capitals++;}}
   const rows=Object.values(scores);return rows.map(p=>({...p,rank:1+rows.filter(q=>q.score>p.score).length})).sort((a,b)=>a.rank-b.rank||a.country.localeCompare(b.country));
  },
  dailyPools(state){
   const pools=Object.fromEntries([...countries.keys()].map(id=>[id,{gold:0,couponEighths:0,villages:0,cities:0}]));
   for(const n of nodes.values()){const p=pools[owner(state,n.id)];if(!p)throw Error('invalid_country_war_owner');p.gold+=n.type==='city'?100:n.type==='village'?10:0;if(n.type==='city')p.cities++;if(n.type==='village')p.villages++;}
   return pools;
  },
  weeklyPools(state){
   const pools=Object.fromEntries([...countries.keys()].map(id=>[id,{gold:0,couponEighths:0,villages:0,cities:0}]));
   for(const n of nodes.values()){const p=pools[owner(state,n.id)];if(!p)throw Error('invalid_country_war_owner');p.gold+=n.weeklyGold;p.couponEighths+=n.weeklyCouponEighths;if(n.type==='city')p.cities++;if(n.type==='village')p.villages++;}
   return pools;
  }
 };
}
