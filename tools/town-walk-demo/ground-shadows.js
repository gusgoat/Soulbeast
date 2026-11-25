(function(scope){
 'use strict';
 // Sunlight from the lower left. Ground depth uses the same flattening as the map.
 const REACH=.56, DEPTH=.52, LAMP_RANGE=180, COLOR='#17233a';

 function create(maskResolution=1){
  const layer=document.createElement('canvas'), actors=document.createElement('canvas');
  const mask=layer.getContext('2d'), foreground=actors.getContext('2d');
  let scaleX=1,scaleY=1,dprX=1,dprY=1,flatten=1,night=0,range=0;
  const lights=[];

  function resize(width,height,w,h){
   actors.width=width;actors.height=height;
   layer.width=Math.max(1,Math.ceil(w*maskResolution));layer.height=Math.max(1,Math.ceil(h*maskResolution));
   scaleX=layer.width/Math.max(1,w);scaleY=layer.height/Math.max(1,h);
   dprX=width/Math.max(1,w);dprY=height/Math.max(1,h);
   foreground.setTransform(dprX,0,0,dprY,0,0);
  }
  function begin(groundFlatten,nightAmount,poles,sx,sy,zoom){
   flatten=groundFlatten;night=nightAmount;range=LAMP_RANGE*zoom;
   lights.length=0;
   if(night>.15)for(const pole of poles){
    const x=sx(pole.x),y=sy(pole.y);
    if(x>=-range&&x<=layer.width/scaleX+range&&y>=-range&&y<=layer.height/scaleY+range)lights.push({x,y});
   }
   mask.resetTransform();
   mask.clearRect(0,0,layer.width,layer.height);
   foreground.save();
   foreground.resetTransform();
   foreground.clearRect(0,0,actors.width,actors.height);
   foreground.restore();
   return foreground;
  }
  function lightAt(groundX,groundY){
   let nearest=null,closest=range*range;
   for(const light of lights){
    const dx=groundX-light.x,dy=groundY-light.y,distance=dx*dx+dy*dy;
    if(distance<closest){nearest=light;closest=distance;}
   }
   if(nearest&&closest>1){
    const dx=groundX-nearest.x,dy=(groundY-nearest.y)/flatten;
    const length=Math.hypot(dx,dy),directionX=dx/length,directionY=dy/length;
    return {reach:REACH*directionX,drop:REACH*directionY*flatten,alpha:1,
     widthX:Math.abs(directionY),widthY:-Math.sign(directionY||1)*directionX*flatten};
   }
   return {reach:REACH,drop:-DEPTH*flatten,alpha:nearest?1:1-.38*night,widthX:1,widthY:0};
  }
  function cast(ctx,groundX,groundY,slope,...imageArgs){
   const light=lightAt(groundX,groundY);
   const {reach,drop}=light,widthX=slope?1:light.widthX,widthY=slope?0:light.widthY;
   const {a,b,c,d,e,f}=ctx.getTransform();
   // For a sloping rail, the baseline follows the bridge edge.
   const heightX=slope*a/dprX-b/dprY,heightY=slope*c/dprX-d/dprY;
   const heightAtOrigin=groundY+slope*(e/dprX-groundX)-f/dprY;
   mask.setTransform(
    scaleX*(widthX*a/dprX+reach*heightX),scaleY*(widthY*a/dprX+b/dprY+(1+drop)*heightX),
    scaleX*(widthX*c/dprX+reach*heightY),scaleY*(widthY*c/dprX+d/dprY+(1+drop)*heightY),
    scaleX*(groundX+widthX*(e/dprX-groundX)+reach*heightAtOrigin),
    scaleY*(widthY*(e/dprX-groundX)+f/dprY+(1+drop)*heightAtOrigin)
   );
   mask.globalAlpha=ctx.globalAlpha*light.alpha;
   mask.drawImage(...imageArgs);
  }
  function castGeometry(groundX,groundY,faces,zoom){
   const {reach,drop,alpha}=lightAt(groundX,groundY),path=new Path2D();
   for(const face of faces){
    const points=face.map(([x,y,height])=>[(x+height*reach)*zoom,(y+height*drop)*zoom]);
    let winding=0;
    for(let i=0;i<points.length;i++){
     const [x,y]=points[i],[nextX,nextY]=points[(i+1)%points.length];
     winding+=x*nextY-y*nextX;
    }
    if(winding<0)points.reverse();
    path.moveTo(groundX+points[0][0],groundY+points[0][1]);
    for(const [x,y] of points.slice(1))path.lineTo(groundX+x,groundY+y);
    path.closePath();
   }
   mask.setTransform(scaleX,0,0,scaleY,0,0);
   mask.globalAlpha=alpha;
   mask.fillStyle=COLOR;
   mask.fill(path);
  }
  function sprite(ctx,x,y){
   return {drawImage(...args){
    cast(ctx,x,y,0,...args);
    ctx.drawImage(...args);
   }};
  }
  function paintMask(ctx){
   // Tint once so overlapping silhouettes have the same density as a single one.
   mask.resetTransform();
   mask.globalAlpha=1;
   mask.globalCompositeOperation='source-in';
   mask.fillStyle=COLOR;
   mask.fillRect(0,0,layer.width,layer.height);
   mask.globalCompositeOperation='source-over';
   ctx.save();
   ctx.resetTransform();
   ctx.globalAlpha=.42-.10*night;
   ctx.drawImage(layer,0,0,actors.width,actors.height);
   ctx.restore();
   mask.clearRect(0,0,layer.width,layer.height);
  }
  function finish(ctx){
   paintMask(ctx);
   ctx.save();
   ctx.resetTransform();
   ctx.drawImage(actors,0,0);
   ctx.restore();
  }
  function release(){layer.width=layer.height=actors.width=actors.height=1;}
  return {resize,begin,cast,castGeometry,sprite,paintMask,finish,release};
 }
 scope.WalkGroundShadows={create};
})(window);
