(function(scope){'use strict';
const WIDTH=194;
const sand={
 blue:['#dfd2b7','#e7d8b9','#d1b797','#a99680'],
 green:['#e0c18b','#e9c890','#c4a37b','#a48965'],
 red:['#d7b284','#e2ba88','#ba946d','#957758']
};

function create(data,country,flatten,random,distance,coastProps,port,landmarks){
 const colors=sand[country],count=Math.ceil(Math.PI*(data.rx+data.ry*flatten)/17);
 const samples=Array.from({length:count},(_,i)=>{
  const angle=i*2*Math.PI/count,p=data.coast(angle);
  return {angle,x:p.x,y:p.y*flatten};
 });
 for(const [i,o] of samples.entries()){
  const before=samples[(i+count-1)%count],after=samples[(i+1)%count];
  const dx=after.x-before.x,dy=after.y-before.y,length=Math.hypot(dx,dy);
  o.nx=dy/length;o.ny=-dx/length;
 }
 const shift=(o,offset)=>({x:o.x+o.nx*offset,y:(o.y+o.ny*offset)/flatten});
 const palms=[];
 for(let i=0;i<count;i+=12+Math.floor(random()*8)){
  for(let j=0;j<2;j++){
   const o=samples[(i+j*(5+Math.floor(random()*4)))%count];
   const point=shift(o,-(92+random()*68)),size=151+random()*76;
   const isDry=[-31,0,31].every(dx=>data.isLand(point.x+dx,point.y));
   if(!isDry||data.walkable(point.x,point.y)||distance(port,point)<245||
    landmarks.some(other=>distance(other,point)<135)||
    palms.some(other=>distance(other,point)<110)||
    coastProps.some(other=>distance(other,point)<82))continue;
   palms.push({...point,art:'palm',size,flip:random()<.5});
  }
 }
 function contour(offset,uneven=false){
  const p=new Path2D();
  for(const [i,o] of samples.entries()){
   const variation=uneven?13*Math.sin(o.angle*31)+10*Math.sin(o.angle*19):0;
   const {x,y}=shift(o,offset+variation);
   if(i)p.lineTo(x,y*flatten);
   else p.moveTo(x,y*flatten);
  }
  p.closePath();
  return p;
 }
 const waterline=contour(0);
 const shallows=contour(32);
 const drySand=contour(-76,true),innerSand=contour(-126,true),wetSand=contour(-21);
 // Small deterministic grain and shell fragments are baked with the beach.
 const grains=samples.flatMap(o=>Array.from({length:12},()=>{
  const point=shift(o,-(6+random()*169));
  return {...point,x:point.x+(random()-.5)*16,r:random()*2+.7,tone:random()<.53};
 }));
 function paintWater(c){
  c.save();c.lineJoin='round';
  c.strokeStyle='#61c5c7';
  for(let width=184;width>=56;width-=12){
   c.globalAlpha=.035+.004*(184-width)/12;
   c.lineWidth=width;c.stroke(shallows);
  }
  c.restore();
 }
 function paintSand(c){
  c.save();c.lineJoin='round';
  for(const [path,width,color,alpha] of [
   [innerSand,133,colors[0],.24],[innerSand,112,colors[0],.44],[drySand,201,colors[0],.72],
   [drySand,180,colors[1],.91],[wetSand,63,colors[2],.58],[waterline,28,colors[3],.55]
  ]){
   c.globalAlpha=alpha;c.lineWidth=width;c.strokeStyle=color;c.stroke(path);
  }
  c.globalAlpha=.28;
  for(const tone of [false,true]){
   c.beginPath();
   for(const o of grains)if(o.tone===tone){
    c.moveTo(o.x+o.r,o.y*flatten);
    c.ellipse(o.x,o.y*flatten,o.r,o.r*.56,0,0,2*Math.PI);
   }
   c.fillStyle=tone?'#fff3da':'#8d7052';c.fill();
  }
  c.restore();
 }
 function waves(c,sx,sy,zoom,w,h,time,reduced){
  if(reduced)time=0;
  const visible=samples.map(o=>{
   const x=sx(o.x),y=sy(o.y/flatten);
   return x>-140&&x<w+140&&y>-140&&y<h+140?{o,x,y}:null;
  });
  c.save();
  c.lineCap=c.lineJoin='round';
  for(let row=0;row<3;row++){
   const phase=(row/3+(reduced?.18:time*.27))%1;
   const approach=Math.min(1,phase/.74);
   const retreat=Math.max(0,(phase-.74)/.26);
   const offset=97-119*approach+retreat*retreat*38;
   const foam=Math.sin(Math.PI*phase)**.8;
   const fringe=new Path2D(),crest=new Path2D(),flecks=new Path2D();
   let previous=false,previousFoam=false;
   for(let i=0;i<=count;i++){
    const item=visible[i%count];
    if(!item){previous=previousFoam=false;continue;}
    const {o,x,y}=item,angle=o.angle;
    const ripple=9*Math.sin(angle*29+row*.9)+3*Math.sin(angle*117+row+time*.65);
    const n=(offset+ripple)*zoom,px=x+o.nx*n,py=y+o.ny*n;
    if(previous)fringe.lineTo(px,py);else fringe.moveTo(px,py);
    previous=true;
    const foamy=Math.sin(angle*96+row)+Math.cos(angle*251-row)>-.15||phase>.50&&phase<.79;
    if(foamy){
     if(previousFoam)crest.lineTo(px,py);else crest.moveTo(px,py);
     for(let j=0;j<3;j++){
      const spray=angle*3067+j*17.8+row;
      const drift=zoom*(3+Math.cos(spray)*5+j*4);
      const scatter=zoom*Math.sin(spray)*8;
      const fx=px+o.nx*drift-o.ny*scatter,fy=py+o.ny*drift+o.nx*scatter;
      const size=zoom*(1.1+j*.54+Math.sin(spray)*.48);
      flecks.moveTo(fx+size,fy);
      flecks.ellipse(fx,fy,size,size*.59,0,0,2*Math.PI);
     }
    }
    previousFoam=foamy;
   }
   for(const [line,width,color,opacity] of [
    [fringe,24,'#86d9d0',.16],[fringe,12,'#d2f0e6',.25],
    [crest,3.3,'#f5fff8',.87]
   ]){
    c.lineWidth=width*zoom;c.strokeStyle=color;c.globalAlpha=opacity*foam;c.stroke(line);
   }
   c.fillStyle='#e5faf3';c.globalAlpha=foam*.66;c.fill(flecks);
  }
  c.restore();
 }
 return {width:WIDTH,palms,waterline,paintWater,paintSand,waves};
}
scope.IslandBeach={create};
})(window);
