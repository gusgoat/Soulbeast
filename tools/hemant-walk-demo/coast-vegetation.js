(function(g){'use strict';
 const PALM=[1148,294,238,267],asset='/Soulbeast/assets/island-props/beach-atlas.webp';
 function beach(data,p,margin=0){const c=typeof module!=='undefined'?require('./region-coast.js'):g.RegionCoast;return c.isBeach(data,p.x,p.y,margin);}
 function allow(data,p){return p.kind==='directionSign'||!beach(data,p,Math.max(45,(p.w||0)*.85));}
 function draw(ctx,p,image,x,y,zoom){if(!image?.naturalWidth)return;const w=p.w*zoom,h=w*PALM[3]/PALM[2];ctx.drawImage(image,...PALM,x-w*.12,y-h*.975,w,h);}
 function bounds(p){const h=p.w*PALM[3]/PALM[2];return {left:p.x-p.w*.12-35,right:p.x+p.w*.88+35,top:p.y*.64-h*.975-35,bottom:p.y*.64+35};}
 const api={PALM,asset,beach,allow,draw,bounds};g.CoastVegetation=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
