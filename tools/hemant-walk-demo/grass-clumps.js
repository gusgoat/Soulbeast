(function(scope){
 'use strict';
 const WIDTHS=[40,68,54,43,48,76];
 const ROOT='/Soulbeast/assets/country-walk/grass-clumps-v1/';
 const still={x:0,y:0};
 const supports=country=>['green','blue','red'].includes(country);
 const assetFiles=country=>supports(country)?Object.fromEntries(
  WIDTHS.map((_,i)=>['grassClump'+(i+1),ROOT+(country==='green'?'':country+'-')+'grass-'+(i+1)+'.webp'])
 ):{};

 function create(data,nav,terrain,obstacles){
  if(!supports(data.countryId))return [];
  const {flatten,width,height}=data;
  const volcanic=data.countryId==='red';
  const random=scope.LivingEnvironment.rng(842093);
  const clumps=[],buckets=new Map(),cell=56;

  function add(x,y){
   const variant=Math.floor(random()*WIDTHS.length);
   const w=WIDTHS[variant]*(.80+random()*.42);
   if(x<0||y<0||x>width||y>height||terrain.hit(x,y)||terrain.water.raw(x,y,76))return;
   const point={x,y};
   if(nav.nearest(point).distance<153)return;
   const py=y*flatten;
   if(obstacles.some(o=>Math.abs(x-o.x)<o.halfWidth+w*.30+6&&
    py>o.y*flatten-o.back-12&&py<o.y*flatten+o.front+12))return;
   // The widened plazas extend beyond the normal road shoulder.
   if(nav.places.some(o=>nav.distance(point,o)<220))return;
   const col=Math.floor(x/cell),row=Math.floor(py/cell);
   for(let i=col-1;i<=col+1;i++)for(let j=row-1;j<=row+1;j++){
    const neighbors=buckets.get(i+','+j);
    if(neighbors?.some(other=>nav.distance(point,other)<22+(w+other.w)*.105))return;
   }
   const clump={x,y,w,kind:'grassClump',art:'grassClump'+(variant+1)};
   const key=col+','+row;
   if(!buckets.has(key))buckets.set(key,[]);
   buckets.get(key).push(clump);
   clumps.push(clump);
  }

  function patch(x,y,count){
   const direction=random()*Math.PI*2;
   for(let i=0;i<count;i++){
    const radius=i?20+random()*74:0,angle=direction+i*2.399;
    add(x+Math.cos(angle)*radius,y+Math.sin(angle)*radius/flatten);
   }
  }

  for(const [from,to] of nav.edges){
   const a=nav.nodes[from],b=nav.nodes[to],dx=b.x-a.x,dy=(b.y-a.y)*flatten;
   const length=Math.hypot(dx,dy);
   for(let t=100+random()*85;t<length;t+=(volcanic?218:140)+random()*100){
    for(const side of [-1,1]){
     const offset=(184+random()*265)*side;
     patch(a.x+(dx*t-dy*offset)/length,a.y+(dy*t+dx*offset)/length/flatten,3+Math.floor(random()*4));
    }
   }
  }
  for(let i=0;i<(volcanic?90:155);i++)patch(random()*width,random()*height,3+Math.floor(random()*4));
  return clumps;
 }
 function sway(clump,player,displacement,now,flatten){
  const radius=17+clump.w*.30;
  const distance=Math.hypot(clump.x-player.x,(clump.y-player.y)*flatten);
  const contact=displacement!==null&&distance<radius;
  let state=clump.sway;
  if(!contact&&(!state||now-state.at>.20)){
   if(state)clump.sway=null;
   return still;
  }
  if(!state||now-state.at>.20){
   state=clump.sway={x:0,y:0,vx:0,vy:0,at:now-1/60};
  }
  const step=Math.min(.04,Math.max(0,now-state.at));
  state.at=now;
  const pressure=contact ? .22*(1-distance/radius) : 0;
  const targetX=contact?displacement.x*pressure:0;
  const targetY=contact?displacement.y*pressure:0;
  // A damped spring lets the leaves briefly overshoot when the player steps away.
  state.vx+=(185*(targetX-state.x)-13*state.vx)*step;
  state.vy+=(185*(targetY-state.y)-13*state.vy)*step;
  state.x+=state.vx*step;
  state.y+=state.vy*step;
  if(!contact&&Math.hypot(state.x,state.y,state.vx*.06,state.vy*.06)<.001){
   clump.sway=null;
   return still;
  }
  return state;
 }
 function onPaving(layout,x,y,flatten,margin){
   return layout.roads.some(({a,b,width})=>{
    const dx=b.x-a.x,dy=(b.y-a.y)*flatten,x0=x-a.x,y0=(y-a.y)*flatten;
    const t=Math.max(0,Math.min(1,(x0*dx+y0*dy)/(dx*dx+dy*dy||1)));
    return Math.hypot(x0-t*dx,y0-t*dy)<width*.69+margin;
   })||layout.plazas.some(p=>((x-p.x)/(p.rx*1.26+margin))**2+
    (((y-p.y)*flatten)/(p.ry*1.26+margin))**2<1);
 }
 function settlement(layout,width,height,flatten,seed,onLawn,country='green'){
  const random=scope.LivingEnvironment.rng(seed),clumps=[];
  const gap=country==='red'?16:0;
  for(let y=70;y<height*flatten;y+=86+gap)for(let x=68;x<width;x+=88+gap){
   const originX=x+(random()-.5)*53,originY=y+(random()-.5)*52;
   const count=random()<.38?2:1,angle=random()*Math.PI*2;
   for(let i=0;i<count;i++){
    const X=originX+i*Math.cos(angle)*31,Y=(originY+i*Math.sin(angle)*31)/flatten;
    const variant=Math.floor(random()*WIDTHS.length),w=WIDTHS[variant]*(.68+random()*.26);
    if(!onLawn(X,Y)||onPaving(layout,X,Y,flatten,w*.31)||clumps.some(o=>Math.hypot(X-o.x,(Y-o.y)*flatten)<24))continue;
    clumps.push({x:X,y:Y,w,art:'grassClump'+(variant+1),drawType:'grassClump'});
   }
  }
  return clumps;
 }
 function draw(c,image,clump,x,y,zoom,player,displacement,time,flatten,shadows,viewportWidth,viewportHeight){
  if(!image?.naturalWidth)return;
  const w=clump.w*zoom,h=w*image.naturalHeight/image.naturalWidth;
  if(x+w<0||x-w>viewportWidth||y+h*.2<0||y-h>viewportHeight)return;
  const lean=sway(clump,player,displacement,time,flatten);
  c.save();
  // The root is the transform origin, so only foliage moves.
  c.transform(1,0,-lean.x,1-lean.y,x,y);
  (shadows?.sprite(c,x,y)??c).drawImage(image,-w/2,-h*.80,w,h);
  c.restore();
 }
 scope.CountryGrassClumps={assetFiles,create,sway,settlement,draw,onPaving};
})(window);
