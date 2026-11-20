(function(g){'use strict';
 const WIDTH=540,HEIGHT=480,F=.64;
 const views={
  front:{key:'gateFront',file:'blue-front.webp',crop:[0,0,1315,1197],anchorX:.50,anchorY:.91},
  right:{key:'gateDiagonalRight',file:'blue-diagonal-right.webp',crop:[0,0,1315,1197],anchorX:.50,anchorY:.83},
  left:{key:'gateDiagonalLeft',file:'blue-diagonal-left.webp',crop:[0,0,1315,1197],anchorX:.50,anchorY:.83},
  side:{key:'gateSide',file:'blue-side.webp',crop:[180,0,1020,1199],anchorX:.49,anchorY:.80}
 };
 function basis(tangent){let [x,y]=tangent;if(x<0){x=-x;y=-y;}const len=Math.hypot(x,y)||1;x/=len;y/=len;return {a:Math.max(.28,Math.abs(x)),b:y*F};}
 function view(p){const b=p.gateBasis||{a:1,b:0},angle=Math.atan2(b.b/F,b.a)*180/Math.PI;const name=Math.abs(angle)>55?'side':angle>17?'right':angle< -17?'left':'front',country=p.countryId||'blue',v={...views[name],name,mirror:name==='side'&&angle<0};if(country!=='blue'&&name==='side'){v.crop=[0,0,1312,1199];v.anchorX=.5;}return v;}
 function metrics(p){const v=view(p),height=HEIGHT*(p.gateWidth||WIDTH)/WIDTH,width=height*v.crop[2]/v.crop[3],anchorX=v.mirror?1-v.anchorX:v.anchorX;return {v,width,height,left:-width*anchorX,top:-height*v.anchorY};}
 function bounds(p){const m=metrics(p);return {left:p.x+m.left,right:p.x+m.left+m.width,top:p.y*F+m.top,bottom:p.y*F+m.top+m.height};}
 function assetFiles(country='blue'){const files=Object.fromEntries(Object.values(views).map(v=>[v.key,'/Soulbeast/assets/country-walk/gates-directions-v2/'+v.file.replace('blue-',country+'-')+'?v=volume-2']));return Object.fromEntries(Object.entries(files).map(([key,path])=>[key,g.CountryRegionMedia?.url(path)||path]));}
 const frames=new WeakMap();
 function frame(images,gate){
  const m=metrics(gate),image=images[m.v.key];if(!image?.naturalWidth)return null;
  let cache=frames.get(image);if(!cache){cache=new Map();frames.set(image,cache);}
  const key=[m.width,m.height,m.v.mirror].join(':');if(cache.has(key))return cache.get(key);
  const canvas=document.createElement('canvas');canvas.width=Math.ceil(m.width);canvas.height=Math.ceil(m.height);const c=canvas.getContext('2d');
  if(m.v.mirror){c.translate(canvas.width,0);c.scale(-1,1);}
  c.drawImage(image,...m.v.crop,0,0,canvas.width,canvas.height);
  const result={image:canvas,left:m.left,top:m.top,width:m.width,height:m.height,view:m.v.name};cache.set(key,result);return result;
 }
 const api={WIDTH,HEIGHT,basis,bounds,frame,view,assetFiles};g.RegionGateGeometry=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
