(()=>{'use strict';
const walls=[];
// Openings: west/east roads at y=1030; southern forest road at x=970.
for(let x=130;x<1770;x+=80){walls.push({x,y:230,axis:'h'});if(x+40<855||x+40>1085)walls.push({x,y:1820,axis:'h'})}
for(let y=230;y<1820;y+=80)if(y+40<930||y+40>1150){walls.push({x:130,y,axis:'v'});walls.push({x:1770,y,axis:'v'})}
const towers=[{x:130,y:230},{x:1770,y:230},{x:130,y:1820},{x:1770,y:1820}];
function draw(c,o,x,y,z){c.save();c.translate(x,y);c.scale(z,z);let w=o.axis==='v'?27:82,d=o.axis==='v'?52:17,h=o.tower?96:58;if(o.tower){w=53;d=26}
c.fillStyle='#183c3266';c.beginPath();c.ellipse(7,7,w*.7,12,0,0,7);c.fill();
c.fillStyle='#788b80';c.fillRect(-w/2,-h,w,h);c.fillStyle='#506b61';c.beginPath();c.moveTo(w/2,-h);c.lineTo(w/2+15,-h-d);c.lineTo(w/2+15,-d);c.lineTo(w/2,0);c.fill();
c.fillStyle='#a6b2a0';c.beginPath();c.moveTo(-w/2,-h);c.lineTo(-w/2+15,-h-d);c.lineTo(w/2+15,-h-d);c.lineTo(w/2,-h);c.fill();
c.strokeStyle='#526b5b';c.lineWidth=1;for(let row=0;row<3;row++){c.beginPath();c.moveTo(-w/2,-h+14+row*17);c.lineTo(w/2,-h+14+row*17);c.stroke();for(let col=0;col<3;col++)c.strokeRect(-w/2+col*w/3+(row%2?7:0),-h+row*17,w/3,17)}
for(let i=0;i<(o.tower?4:3);i++){const a=-w/2+i*w/(o.tower?4:3);c.fillStyle='#98aa94';c.fillRect(a,-h-13,Math.max(7,w/6),15);c.fillStyle='#536e61';c.fillRect(a+Math.max(7,w/6),-h-10,3,12)}
if(o.tower){c.fillStyle='#2b4a41';c.fillRect(-4,-64,8,27);c.strokeStyle='#c4b079';c.lineWidth=2;c.beginPath();c.moveTo(0,-h-14);c.lineTo(0,-h-50);c.stroke();c.fillStyle='#ac7e48';c.beginPath();c.moveTo(1,-h-50);c.lineTo(28,-h-44);c.lineTo(1,-h-32);c.fill()}
c.restore()}
window.cityWalls={items:[...walls.map(o=>({...o,drawType:'wall'})),...towers.map(o=>({...o,tower:true,drawType:'wall'}))],draw};
})();
