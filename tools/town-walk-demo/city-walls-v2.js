(function(scope){'use strict';
const items=[];
function run(axis,fixed,start,end,period){for(let a=start;a<end;a+=period){const len=Math.min(period,end-a);items.push({x:axis==='h'?a:fixed,y:axis==='h'?fixed:a,axis,len,period,drawType:'wall'})}}
run('h',230,130,2320,400);run('h',1820,130,855,400);run('h',1820,1085,2320,400);
for(const x of [130,2320]){run('v',x,230,930,550);run('v',x,1150,1820,550)}
let images;
function setArt(art){images=art}
function draw(c,o,x,y,z){if(!images)return;const im=o.axis==='h'?images.wallh:images.wallv;c.save();c.translate(x,y);if(o.axis==='h'){
 const fraction=o.len/o.period;c.drawImage(im,0,0,im.width*fraction,im.height,0,-100*z,(o.len+1.2)*z,100*z);
}else{
 const fraction=o.len/o.period;if(o.x>950)c.scale(-1,1);c.drawImage(im,0,0,im.width,im.height*fraction,-24*z,-35*z,48*z,(o.len*.64+1.2)*z);
}c.restore()}
const api={items,draw,setArt};scope.cityWalls=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
