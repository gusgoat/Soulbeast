(() => {
 'use strict';
 window.KappaFollower={
  create(start){
   const image=new Image();
   image.src='/Soulbeast/assets/companions/kappa-floating-four-directions-v1.png';
   const body={x:start.x-65,y:start.y+65,kind:'kappaCompanion',direction:0};
   const trail=[{x:start.x,y:start.y}];
   return {
    body,
    update(dt,leader){
     const last=trail[trail.length-1];
     if(Math.hypot(last.x-leader.x,last.y-leader.y)>10)trail.push({x:leader.x,y:leader.y});
     if(Math.hypot(body.x-leader.x,body.y-leader.y)>1000){
      body.x=leader.x-65;body.y=leader.y+65;trail.splice(0,trail.length,{x:leader.x,y:leader.y});
     }
     // Keep enough of the leader's route to follow around corners.
     let remaining=0,stop=trail.length-1;
     for(let i=trail.length-1;i>0;i--){
      remaining+=Math.hypot(trail[i].x-trail[i-1].x,trail[i].y-trail[i-1].y);
      if(remaining>=90){stop=i-1;break;}
      stop=i-1;
     }
     let budget=Math.min(Math.max(dt,0),.05)*Math.min(560,230+Math.hypot(body.x-leader.x,body.y-leader.y));
     while(budget>0&&trail.length){
      const target=trail[0],dx=target.x-body.x,dy=target.y-body.y,distance=Math.hypot(dx,dy);
      if(trail.length===1&&distance<=90)break;
      const available=trail.length===1?distance-90:distance;
      if(available<.5){
       if(stop<=0)break;
       trail.shift();stop--;continue;
      }
      const step=Math.min(available,budget);
      body.x+=dx/distance*step;body.y+=dy/distance*step;budget-=step;
      body.direction=Math.abs(dx)>Math.abs(dy)?(dx<0?2:3):(dy<0?1:0);
      if(step>=available&&stop<=0)break;
     }
    },
    draw(ctx,x,y,scale,time){
     if(!image.naturalWidth)return;
     const size=128*scale,cellX=body.direction%2,cellY=Math.floor(body.direction/2);
     const bob=Math.sin(time*3.5)*5*scale;
     ctx.save();
     ctx.fillStyle='#173a4c30';ctx.beginPath();ctx.ellipse(x,y,15*scale,5*scale,0,0,Math.PI*2);ctx.fill();
     ctx.drawImage(image,cellX*image.naturalWidth/2,cellY*image.naturalHeight/2,image.naturalWidth/2,image.naturalHeight/2,x-size/2,y-size-13*scale+bob,size,size);
     ctx.restore();
    }
   };
  }
 };
})();
