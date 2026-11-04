(function(scope){
'use strict';
function paint(data,theme,art){
 const F=data.flatten,C=data.cell,desert=theme==='desert',jungle=theme==='jungle',extended=['snow','castle','lava'].includes(theme);
const scale=.5,ground=document.createElement('canvas');ground.width=Math.ceil(data.width*scale);ground.height=Math.ceil(data.height*F*scale);const gc=ground.getContext('2d');gc.scale(scale,scale);gc.fillStyle=jungle?'#244d2c':desert?'#b28b52':'#11171d';gc.fillRect(0,0,data.width,data.height*F);const floorPattern=gc.createPattern(art.floor,'repeat');floorPattern.setTransform(new DOMMatrix().scale(.55));gc.fillStyle=floorPattern;
if(theme==='snow')gc.fillRect(0,0,data.width,data.height*F);
for(let y=0;y<data.rows;y++)for(let x=0;x<data.cols;x++)if(theme!=='snow'&&data.grid[y][x]===1){gc.fillRect(x*C,y*C*F,C,C*F);gc.fillStyle='#7797a414';gc.fillRect(x*C+6,y*C*F+6,C-12,C*F-12);gc.fillStyle=floorPattern}
for(let y=0;y<data.rows;y++)for(let x=0;x<data.cols;x++)if(data.grid[y][x]===0||data.grid[y][x]===2){if(extended){ExtendedThemes.paintWall(gc,data,x,y,theme,art.floor);continue}if(jungle){JungleTheme.paintWall(gc,data,x,y);continue}const h=(x*7937+y*1531)%29,px=x*C,py=y*C*F,cw=C,ch=C*F;gc.fillStyle=floorPattern;gc.fillRect(px,py,cw,ch);gc.fillStyle=desert?'#49312c':'#0a1521c9';gc.fillRect(px,py,cw,ch);
 // Angular facets form continuous rock ridges instead of rectangular masonry blocks.
 for(let j=0;j<4;j++){const fx=px+(j%2)*cw/2,fy=py+Math.floor(j/2)*ch/2,z=(h+j*7)%21;gc.beginPath();gc.moveTo(fx-12,fy+11+z/2);gc.lineTo(fx+cw*.32,fy-8);gc.lineTo(fx+cw*.57,fy+ch*.19);gc.lineTo(fx+cw*.48,fy+ch*.61);gc.lineTo(fx+8,fy+ch*.49);gc.closePath();gc.fillStyle=(desert?['#66453c','#795047','#8d6351','#51372f']:['#35424c80','#27364190','#47505b55','#1c2b3680'])[(j+h)%4];gc.fill();gc.strokeStyle=desert?'#ba896c66':'#83909a17';gc.lineWidth=2;gc.stroke()}
 if(data.grid[y+1]?.[x]===1){gc.fillStyle=desert?'#251b19c9':'#03090cb0';gc.beginPath();gc.moveTo(px-2,py+ch-17);gc.lineTo(px+cw*.3,py+ch-9);gc.lineTo(px+cw*.7,py+ch-20);gc.lineTo(px+cw+3,py+ch-11);gc.lineTo(px+cw+7,py+ch+17);gc.lineTo(px+cw*.6,py+ch+25);gc.lineTo(px-3,py+ch+14);gc.closePath();gc.fill();gc.strokeStyle=desert?'#c18b6880':'#7b87974a';gc.lineWidth=5;gc.beginPath();gc.moveTo(px,py+ch-18);gc.lineTo(px+cw*.35,py+ch-9);gc.lineTo(px+cw*.7,py+ch-20);gc.lineTo(px+cw,py+ch-11);gc.stroke()}}

gc.strokeStyle=jungle?'#214535':'#040a0e';gc.lineJoin='round';gc.lineCap='round';gc.lineWidth=jungle?94:110;gc.beginPath();data.river.forEach((p,i)=>i?gc.lineTo(p.x,p.y*F):gc.moveTo(p.x,p.y*F));gc.stroke();const waterPattern=gc.createPattern(art.water,'repeat');waterPattern.setTransform(new DOMMatrix().scale(.6));gc.strokeStyle=waterPattern;gc.lineWidth=64;gc.stroke();
 return ground;
}
scope.DungeonGround={paint};
})(window);
