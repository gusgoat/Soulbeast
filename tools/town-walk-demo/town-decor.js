(function(scope){'use strict';
const objects=[
 {id:'cart',x:260,y:1260,w:150,r:45},
 {id:'clock',x:285,y:760,w:170,r:34,label:'หอนาฬิกาเมือง'},
 {id:'well',x:755,y:1530,w:145,r:36,label:'บ่อน้ำใต้ดิน'},
 ...[[310,420],[1590,820],[680,1700],[1235,1600],[310,1580],[1580,1720]].map(([x,y])=>({id:'bush',x,y,w:100,r:17}))
];
function blocked(x,y){if(((x-1510)/130)**2+((y-1540)*.64/72)**2<1)return true;return objects.some(o=>Math.hypot(x-o.x,(y-o.y)*.64)<o.r)}
let images={};
function setArt(art){images=art}
function ground(g,F,stone){
 const w=350,h=w*images.pond.height/images.pond.width;g.drawImage(images.pond,1510-w/2,1540*F-h/2,w,h);
 g.fillStyle=stone;for(const [x,y,r]of [[285,760,73],[755,1530,55]]){g.beginPath();g.ellipse(x,y*F,r,r*.64,0,0,7);g.fill()}
 g.strokeStyle=stone;g.lineWidth=48;g.beginPath();g.moveTo(490,1260*F);g.lineTo(260,1260*F);g.stroke();
 g.lineWidth=60;g.beginPath();g.moveTo(970,1385*F);g.lineTo(1130,1385*F);g.stroke();
}
function draw(c,o,x,y,z){const art=images[o.id],w=o.w*z,h=w*art.height/art.width;c.save();c.drawImage(art,x-w/2,y-h*.94,w,h);if(o.label){c.textAlign='center';c.font=11*z+'px Tahoma';c.fillStyle='#f5e4aa';c.shadowColor='#102e23';c.shadowBlur=5;c.fillText(o.label,x,y-h*.94-6*z)}c.restore()}
function drawBoard(c,x,y,z,label='ป้ายประกาศรับเควส'){const art=images.notice,w=185*z,h=w*art.height/art.width;c.drawImage(art,x-w/2,y-h*.93,w,h);c.textAlign='center';c.font=12*z+'px Tahoma';c.fillStyle='#f7e1a4';c.fillText(label,x,y-h*.93-8*z)}
function water(c,sx,sy,z,time){const x=sx(1510),y=sy(1540),w=350*z,h=w*images.pond.height/images.pond.width;const v=c.getTransform().a||1;if(x+w<0||x-w>c.canvas.width/v||y+h<0||y-h>c.canvas.height/v)return;c.save();c.translate(x-w/2,y-h/2);c.scale(w,h);c.globalCompositeOperation='screen';c.beginPath();c.ellipse(.5,.55,.25,.18,0,0,7);c.clip();for(let i=0;i<7;i++){const k=(time*.13+i/7)%1;c.strokeStyle='rgba(210,255,255,'+((1-k)*.3)+')';c.lineWidth=.0018;c.beginPath();c.ellipse(.5,.55,.04+k*.28,.02+k*.15,0,0,7);c.stroke()}c.restore()}
const api={objects,blocked,setArt,ground,draw,drawBoard,water};scope.townDecor=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
