(function(g){'use strict';
const directions=['level','rising','falling','steep'];
// Base points and typical post height in each 320px sprite (before screen projection).
const anchors={"green":{"level":[33.77,181.17,286.77,181.17,175.81],"rising":[34.25,227.96,285.75,178.73,177.66],"falling":[33.77,182.78,285.7,231.02,179.56],"steep":[55.43,310.86,241.71,165.14,210.86]},"blue":{"level":[35.74,176.49,281.51,177.04,175.95],"rising":[35.86,216.83,284.69,172.14,176.0],"falling":[35.8,170.74,280.9,219.76,176.8],"steep":[60.44,308.55,278.01,161.59,213.12]},"red":{"level":[31.55,167.32,286.76,167.32,162.82],"rising":[32.81,216.98,283.74,162.88,165.18],"falling":[32.11,167.46,283.87,220.22,164.01],"steep":[52.92,310.66,263.97,141.95,200.47]}};
function create(country){
 const images=Object.fromEntries(directions.map(dir=>{
  const image=new Image();
  image.src='/Soulbeast/assets/country-walk/bridge-rails-v1/'+country+'-'+dir+'.webp';
  return [dir,image];
 }));
 function draw(c,o,sx,sy,z){
  let x=sx(o.a.x),y=sy(o.a.y),X=sx(o.b.x),Y=sy(o.b.y);
  if(x>X){[x,X]=[X,x];[y,Y]=[Y,y];}
  const slope=Math.abs(Y-y)/Math.max(1,X-x);
  const dir=slope<.27?'level':slope>2?'steep':Y<y?'rising':'falling';
  const art=images[dir],base=anchors[country]?.[dir];
  if(!art?.naturalWidth||!base)return false;
  const flip=dir==='steep'&&Y>y;
  if(flip){[x,X]=[X,x];[y,Y]=[Y,y];}
  const dx=X-x,dy=Y-y;
  const [ax,ay,bx,by,post]=base,width=(flip?-1:1)*Math.max(Math.abs(dx),dir==='steep'?22*z:1);
  // Map both feet to the bridge edge and keep the posts vertical in screen space.
  const vertical=40*z/post,horizontal=width/(bx-ax),shear=(dy-vertical*(by-ay))/(bx-ax);
  c.save();c.transform(horizontal,shear,0,vertical,x-(width-dx)/2-horizontal*ax,y-shear*ax-vertical*ay);
  c.drawImage(art,0,0);c.restore();return true;
 }
 return {draw};
}
g.CountryBridgeRails={create};
})(window);
