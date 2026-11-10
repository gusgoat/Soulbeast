(function(scope){'use strict';
const palette={
 blue:['#b6cbd4','#e5edf1','#899dab'],
 green:['#526947','#a69870','#8d845e'],
 red:['#744a38','#a4694b','#65504c']
};
// Each existing crossing gets a dedicated deck; the first three also cover future crossings.
const crossings={green:8,blue:7,red:6};
const assetFiles=country=>Object.fromEntries(['road','bridge'].flatMap(kind=>
 Array.from({length:kind==='road'?3:crossings[country]??3},(_,i)=>
  [kind+i,'/Soulbeast/assets/country-walk/paths-v1/'+country+'-'+kind+'-'+i+'.webp'])));

function paint(g,nav,flatten,country,images){
 const [bank,curb,stone]=palette[country]||palette.blue;
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
 const common=new Path2D();
 for(const {a,b} of edges){common.moveTo(a.x,a.y*flatten);common.lineTo(b.x,b.y*flatten);}
 const connected=new Set(nav.nodes.map(p=>p.x+','+p.y));
 const plazas=nav.places.filter(p=>connected.has(p.x+','+p.y));
 function band(width,fill){
  g.lineWidth=width;g.strokeStyle=g.fillStyle=fill;g.stroke(common);g.fill(joins);
  g.beginPath();
  for(const p of plazas){
   g.moveTo(p.x+width*.83,p.y*flatten);
   g.ellipse(p.x,p.y*flatten,width*.83,width*.49,0,0,2*Math.PI);
  }
  g.fill();
 }
 // Stroke the whole network in each pass so overlapping routes have one curb.
 g.save();
 g.lineJoin=g.lineCap='round';
 for(const [width,color] of [[220,bank],[183,curb],[145,stone]]){
  band(width,color);
 }
 const base=images.road0?.naturalWidth&&g.createPattern(images.road0,'repeat');
 if(base){
  base.setTransform(new DOMMatrix().scale(.76));
  g.globalAlpha=.28;band(220,base);
  g.globalAlpha=.46;band(183,base);
  g.globalAlpha=1;band(145,base);
 }
 // Overlay each segment with its own heading and paving. Fade at its ends
 // and sides so the continuous stone beneath remains visible at junctions.
 const tile=document.createElement('canvas'),layer=tile.getContext('2d');
 for(const edge of edges){
  if(merged.has(edge))continue;
  const {a,b}=edge,dx=b.x-a.x,dy=(b.y-a.y)*flatten,len=Math.hypot(dx,dy);
  if(len<115)continue;
  const angle=Math.atan2(dy,dx),hash=Math.abs(Math.imul(Math.round(a.x+b.x),37)^Math.imul(Math.round(a.y+b.y),73));
  const image=images['road'+(len>600?hash%3:hash%2)];
  if(!image?.naturalWidth)continue;
  tile.width=Math.ceil(len/2);tile.height=72;
  const width=tile.width,height=tile.height,fade=Math.min(width*.42,102);
  const pattern=layer.createPattern(image,'repeat');
  pattern.setTransform(new DOMMatrix().translate(-(hash%160),-39).scale(.38));
  layer.fillStyle=pattern;layer.fillRect(0,0,width,height);
  layer.globalCompositeOperation='destination-in';
  const end=layer.createLinearGradient(0,0,width,0);
  for(const [stop,alpha] of [[0,0],[fade/width,.9],[1-fade/width,.9],[1,0]])end.addColorStop(stop,'rgba(0,0,0,'+alpha+')');
  layer.fillStyle=end;layer.fillRect(0,0,width,height);
  const side=layer.createLinearGradient(0,0,0,height);
  for(const [stop,alpha] of [[0,0],[.17,1],[.83,1],[1,0]])side.addColorStop(stop,'rgba(0,0,0,'+alpha+')');
  layer.fillStyle=side;layer.fillRect(0,0,width,height);
  g.save();g.translate(a.x,a.y*flatten);g.rotate(angle);
  g.drawImage(tile,0,-72,len,144);g.restore();
 }
 g.restore();
}
scope.CountryPathArt={assetFiles,paint};
})(window);
