(function(g){'use strict';
function create(data,nav,excluded=[]){let seed=19034+({blue:1,green:2,red:3}[data.countryId]||0);const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296},props=[];for(let tries=0;props.length<18&&tries<12000;tries++){const point={x:650+random()*(data.width-1300),y:900+random()*(data.height-1500)},road=nav.nearest(point).distance;if(road<200||road>310||!nav.walkable(point.x,point.y)||nav.places.some(p=>nav.distance(p,point)<700)||excluded.some(p=>nav.distance(p,point)<230)||props.some(p=>nav.distance(p,point)<520))continue;const type=props.length%2?'statue':'ruin';props.push({...point,kind:'countryProp',art:'prop-'+type,w:type==='ruin'?210:160})}return props}
function placement(data,nav,terrain,lava){
 const {flatten}=data,{water}=terrain;
 const bridges=water.bridges.map(bridge=>{
  const dx=(bridge.b.x-bridge.a.x)/bridge.length;
  const dy=(bridge.b.y-bridge.a.y)*flatten/bridge.length;
  const axes=[[1,0],[0,1],[dx,dy],[-dy,dx]];
  // Include raised decking and rails above the projected ground footprint.
  return {bridge,axes:axes.map(([x,y])=>{
   const base=Math.abs(x*dx+y*dy)*(bridge.length/2+16)+Math.abs(y*dx-x*dy)*(bridge.width/2+12);
   return {x,y,min:-base-Math.max(0,y)*66,max:base+Math.max(0,-y)*66};
  })};
 });
 function overBridge(prop,back,front){
  const halfHeight=(back+front)/2;
  return bridges.some(({bridge,axes})=>{
   const x=prop.x-bridge.x,y=(prop.y-bridge.y)*flatten+(front-back)/2;
   return axes.every(axis=>{
    const center=x*axis.x+y*axis.y;
    const span=Math.abs(axis.x)*prop.w/2+Math.abs(axis.y)*halfHeight;
    return center+span>axis.min&&center-span<axis.max;
   });
  });
 }
 function blocked(prop){
  const back=prop.w*(prop.art==='prop-statue'?1.06:prop.key?.endsWith('-arcane')?.91:.67);
  // Reserve the shore for rocks and leave room for roofs that extend toward water.
  return water.raw(prop.x,prop.y,prop.w*.53+32)||
   water.raw(prop.x,prop.y-back*.72/flatten,prop.w*.42+17)||
   overBridge(prop,back,prop.w*.10)||lava.crowdsPool(prop,back);
 }
 function relocate(props,excluded){
  const settled=props.filter(prop=>!blocked(prop)),placed=new Map(settled.map(prop=>[prop,prop]));
  for(const prop of props){
   if(placed.has(prop))continue;
   const roadMargin=prop.kind==='countryProp'?180:150;
   const spacing=prop.kind==='countryProp'?190:105;
   search:for(let radius=32;radius<=800;radius+=32){
    const count=Math.max(16,Math.ceil(Math.PI*2*radius/28));
    for(let i=0;i<count;i++){
     const angle=i*Math.PI*2/count;
     const next={...prop,x:prop.x+radius*Math.cos(angle),y:prop.y+radius*Math.sin(angle)/flatten};
     if(blocked(next)||!nav.walkable(next.x,next.y)||nav.nearest(next).distance<roadMargin||
      nav.places.some(o=>nav.distance(o,next)<(o.type==='capital'?420:300))||
      excluded.some(o=>nav.distance(o,next)<130)||settled.some(o=>nav.distance(o,next)<spacing))continue;
     placed.set(prop,next);
     settled.push(next);
     break search;
    }
   }
  }
  return props.map(prop=>placed.get(prop)).filter(Boolean);
 }
 return {overBridge,blocked,relocate};
}
const api={create,placement};g.CountryProps=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
