(function(g){'use strict';
 function state(data,water,p){if(data.waterTraversal!=='wade')return null;if(p.bridgeDeck)return null;return water.sampleAt(p.x,p.y,p.bridgeDeck===null);}
 const speedFactor=sample=>sample?0.5:1;
 const sink=(sample,height)=>sample?height*.46*sample.depth:0;
 function clipAbove(ctx,x,y,zoom){ctx.beginPath();ctx.moveTo(-100000,-100000);ctx.lineTo(100000,-100000);ctx.lineTo(100000,y+2*zoom);ctx.lineTo(-100000,y+2*zoom);ctx.closePath();ctx.clip();}
 function ripple(ctx,x,y,zoom,time,moving,front=false){
  ctx.save();if(front){ctx.beginPath();ctx.rect(x-70*zoom,y-2*zoom,140*zoom,40*zoom);ctx.clip();}
  for(let i=0;i<(moving?3:2);i++){const phase=(time*(moving?.85:.24)+i/3)%1,rx=(13+phase*28)*zoom,ry=(4+phase*8)*zoom;ctx.beginPath();ctx.ellipse(x,y+zoom,rx,ry,0,0,Math.PI*2);ctx.strokeStyle='rgba(207,247,255,'+(Math.sin(Math.PI*phase)*(moving?.58:.25))+')';ctx.lineWidth=(front?1.9:1.1)*zoom;ctx.stroke();}
  ctx.restore();
 }
 const api={state,speedFactor,sink,clipAbove,ripple};g.WaterInteraction=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
