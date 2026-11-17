(function(scope){'use strict';
const palette={
 blue:['#a7bdc8','#c6d5dc','#899dab'],
 green:['#665d45','#92805f','#8d7d60'],
 red:['#63453a','#775044','#513630']
};
const vergeBands={
 blue:[[253,.10],[238,.13],[221,.22],[204,.37],[182,.61],[157,.93]],
 green:[[236,.075],[224,.11],[213,.19],[200,.32],[182,.56],[157,.93]],
 red:[[260,.09],[246,.12],[229,.17],[208,.30],[184,.57],[157,.93]]
};
// Each existing crossing gets a dedicated deck; the first three also cover future crossings.
const crossings={green:8,blue:7,red:6};
const assetFiles=country=>Object.fromEntries(['road','bridge'].flatMap(kind=>
 Array.from({length:kind==='road'?3:crossings[country]??3},(_,i)=>
  [kind+i,'/Soulbeast/assets/country-walk/'+(kind==='road'?'paving-v2':'paths-v1')+'/'+country+'-'+kind+'-'+i+'.webp'+(kind==='road'?'?v=map-camera-1':'')])));

function vergeRelief(x,y){
 return 8*Math.sin(x*.057+y*.072)+5*Math.sin(x*.143-y*.117)+3*Math.sin(x*.227+y*.19);
}

function vergeLayers(g,images,band,textureScale,country){
 const [bank,curb,stone]=palette[country];
 const colors=[bank,bank,bank,curb,curb,stone];
 for(const [index,[width,alpha]] of vergeBands[country].entries()){
  g.globalAlpha=alpha;
  band(width,colors[index]);
 }
 const pattern=images.road0?.naturalWidth&&g.createPattern(images.road0,'repeat');
 if(pattern){
  pattern.setTransform(new DOMMatrix().scale(textureScale));
  for(const [width,alpha] of [[212,.10],[194,.27],[169,.56],[145,1]]){
   g.globalAlpha=alpha;
   band(width,pattern);
  }
 }
 g.globalAlpha=1;
}

function sampleShoulder(a,b,flatten){
 const dx=b.x-a.x,dy=(b.y-a.y)*flatten,length=Math.hypot(dx,dy);
 if(!length)return null;
 const count=Math.ceil(length/10);
 const samples=Array.from({length:count+1},(_,i)=>({
  x:a.x+dx*i/count,y:a.y*flatten+dy*i/count
 }));
 return {nx:-dy/length,ny:dx/length,samples};
}

function traceShoulder(path,{nx,ny,samples},radius,reliefScale){
 for(const side of [-1,1]){
  for(let i=0;i<samples.length;i++){
   const {x,y}=samples[side<0?i:samples.length-1-i];
   const outerX=x+nx*radius*side,outerY=y+ny*radius*side;
   const edge=radius+reliefScale*vergeRelief(outerX,outerY);
   const px=x+nx*edge*side,py=y+ny*edge*side;
   if(side<0&&i===0)path.moveTo(px,py);
   else path.lineTo(px,py);
  }
 }
 path.closePath();
}

function paintSettlement(g,layout,flatten,images,country='green'){
 const roads=layout.roads.map(road=>({...road,shoulder:sampleShoulder(road.a,road.b,flatten)}))
  .filter(road=>road.shoulder);
 g.save();
 vergeLayers(g,images,(width,fill)=>{
  const area=new Path2D();
  for(const {a,b,shoulder,width:roadWidth} of roads){
   const scale=roadWidth/183,radius=width*.5*scale;
   traceShoulder(area,shoulder,radius,scale);
   for(const point of [a,b]){
    const y=point.y*flatten;
    area.moveTo(point.x+radius-3,y);
    area.ellipse(point.x,y,radius-3,radius-3,0,0,2*Math.PI);
   }
  }
  for(const plaza of layout.plazas){
   const rx=plaza.rx*width/183,ry=plaza.ry*width/183,y=plaza.y*flatten;
   area.moveTo(plaza.x+rx,y);
   area.ellipse(plaza.x,y,rx,ry,0,0,2*Math.PI);
  }
  g.fillStyle=fill;
  g.fill(area);
 },.58,country);
 g.restore();
}

function paint(g,nav,flatten,country,images){
 const edges=nav.edges.map(([a,b])=>({a:nav.nodes[a],b:nav.nodes[b]}));
 const joins=new Path2D(),merged=new Set();
 // Join nearby parallel stretches only for the part where both centerlines
 // run together. Keep the ends apart where they split towards other places.
 for(const [i,edge] of edges.entries()){
  const {a,b}=edge,dx=b.x-a.x,dy=(b.y-a.y)*flatten,len=Math.hypot(dx,dy),u=dx/len,v=dy/len;
  if(len<160)continue;
  for(const other of edges.slice(i+1)){
   const ax=other.a.x-a.x,ay=(other.a.y-a.y)*flatten,bx=other.b.x-a.x,by=(other.b.y-a.y)*flatten;
   const length=Math.hypot(bx-ax,by-ay),along=(bx-ax)*u+(by-ay)*v;
   if(Math.abs(along)<length*.966||length<160)continue;
   const a0=ax*u+ay*v,b0=bx*u+by*v,na=ay*u-ax*v,nb=by*u-bx*v;
   let start=Math.max(0,Math.min(a0,b0)),end=Math.min(len,Math.max(a0,b0));
   const slope=(nb-na)/along;
   if(Math.abs(slope)<.001){if(Math.abs(na)>218)continue;}
   else{
    const min=a0+(-218-na)/slope,max=a0+(218-na)/slope;
    start=Math.max(start,Math.min(min,max));end=Math.min(end,Math.max(min,max));
   }
   if(end-start<158)continue;
   const gap=t=>na+(t-a0)*slope;
   if(Math.max(Math.abs(gap(start)),Math.abs(gap(end)))<36)continue;
   const xy=(t,n)=>[a.x+u*t-v*n,a.y*flatten+v*t+u*n];
   joins.moveTo(...xy(start,0));joins.lineTo(...xy(end,0));joins.lineTo(...xy(end,gap(end)));joins.lineTo(...xy(start,gap(start)));joins.closePath();
   merged.add(edge);merged.add(other);
  }
 }
 const connected=new Set(nav.nodes.map(p=>p.x+','+p.y));
 const plazas=nav.places.filter(p=>connected.has(p.x+','+p.y));
 const shoulders=edges.map(({a,b})=>sampleShoulder(a,b,flatten)).filter(Boolean);
 function traceShoulders(path,radius){
  for(const shoulder of shoulders)traceShoulder(path,shoulder,radius,1);
  for(const point of nav.nodes){
   const y=point.y*flatten;
   path.moveTo(point.x+radius-6,y);
   path.ellipse(point.x,y,radius-6,radius-6,0,0,Math.PI*2);
  }
 }
 function band(width,fill){
  g.fillStyle=fill;
  const area=new Path2D();
  traceShoulders(area,width/2);
  for(const p of plazas){
   area.moveTo(p.x+width*.83,p.y*flatten);
   area.ellipse(p.x,p.y*flatten,width*.83,width*.49,0,0,2*Math.PI);
  }
  g.fill(area);
  g.fill(joins);
 }
 // Build the verge outward over the grass, then pack the dirt toward the paving.
 g.save();
 g.lineJoin=g.lineCap='round';
 vergeLayers(g,images,band,.75,country in vergeBands?country:'blue');
 g.globalAlpha=1;
 // Blend distinct paving along each stretch. Keep the pattern aligned with the
 // map so baked highlights and shadows always face the same direction.
 const tile=document.createElement('canvas'),layer=tile.getContext('2d');
 for(const edge of edges){
  if(merged.has(edge))continue;
  const {a,b}=edge,dx=b.x-a.x,dy=(b.y-a.y)*flatten,len=Math.hypot(dx,dy);
  if(len<115)continue;
  const angle=Math.atan2(dy,dx),hash=Math.abs(Math.imul(Math.round(a.x+b.x),37)^Math.imul(Math.round(a.y+b.y),73));
  const variant=hash%3;
  const image=images['road'+variant];
  if(!image?.naturalWidth)continue;
  tile.width=Math.ceil(len/2);tile.height=72;
  const width=tile.width,height=tile.height,fade=Math.min(width*.42,102);
  const pattern=layer.createPattern(image,'repeat');
  const worldFromTile=new DOMMatrix().translate(a.x,a.y*flatten)
   .rotate(angle*180/Math.PI).translate(0,-72).scale(len/width,2);
  pattern.setTransform(worldFromTile.inverse().scale(.75));
  layer.fillStyle=pattern;layer.fillRect(0,0,width,height);
  layer.globalCompositeOperation='destination-in';
  const end=layer.createLinearGradient(0,0,width,0);
  for(const [stop,alpha] of [[0,0],[fade/width,1],[1-fade/width,1],[1,0]])end.addColorStop(stop,'rgba(0,0,0,'+alpha+')');
  layer.fillStyle=end;layer.fillRect(0,0,width,height);
  const side=layer.createLinearGradient(0,0,0,height);
  for(const [stop,alpha] of [[0,0],[.17,1],[.83,1],[1,0]])side.addColorStop(stop,'rgba(0,0,0,'+alpha+')');
  layer.fillStyle=side;layer.fillRect(0,0,width,height);
  g.save();g.translate(a.x,a.y*flatten);g.rotate(angle);
  g.drawImage(tile,0,-72,len,144);g.restore();
 }
 g.restore();
}
scope.CountryPathArt={assetFiles,paint,paintSettlement};
})(window);
