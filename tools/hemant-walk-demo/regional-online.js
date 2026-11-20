(function(g){'use strict';
 function create(data,legacy,nav,maps=g.CountryRegionMaps){let cachedKey='',cached=null;const flat=data.flatten||.64,distance=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*flat);
  function projection(event){if(!data.regionLayout)return {here:true,dx:0,dy:0,region:null};const home=event?.home||event?.position;if(!home||event.country!==data.countryId)return null;const key=[event.id,home.x,home.y].join(':');if(key===cachedKey)return cached;cachedKey=key;const regions=maps.countries[data.countryId].regions,all=Object.entries(regions).flatMap(([region,d])=>[...d.cities,...d.villages,...d.forests,...d.regionPlaces].map(p=>({region,p}))),original=[...legacy.cities,...legacy.villages,...legacy.forests].filter(p=>all.some(a=>a.p.id===p.id)).sort((a,b)=>distance(a,home)-distance(b,home)),anchor=all.find(a=>a.p.id===original[0]?.id)||all[0];if(anchor.region!==data.regionId)return cached={here:false,region:anchor.region};
   let point;for(const radius of [420,560,700,900,1100]){for(let i=0;i<32;i++){const angle=i*Math.PI/16,p={x:anchor.p.x+Math.cos(angle)*radius,y:anchor.p.y+Math.sin(angle)*radius/flat};if(!nav.walkable(p.x,p.y)||!nav.clear(p,nav.nearest(p).foot)||nav.places.some(a=>a.type!=='junction'&&distance(a,p)<260))continue;if(Array.from({length:8},(_,i)=>({x:p.x+Math.cos(i*Math.PI/4)*130,y:p.y+Math.sin(i*Math.PI/4)*130/flat})).every(a=>nav.clear(p,a))){point=p;break;}}if(point)break;}
   point||=nav.spawnAt(anchor.p);return cached={here:true,region:anchor.region,dx:point.x-home.x,dy:point.y-home.y,home:point};
  }
  return {projection,containsBoss:e=>!!projection(e)?.here,toServer:(p,e)=>{const a=projection(e);return a?.here?{...p,x:p.x-a.dx,y:p.y-a.dy}:p;},fromServer:(p,e)=>{const a=projection(e);return a?.here?{...p,x:p.x+a.dx,y:p.y+a.dy}:p;}};
 }
 const api={create};g.RegionalOnlineCoordinates=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
