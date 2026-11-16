import {FLAT} from './arena.mjs?v=clear-hedges-1';

const sheets=new Map();
const teams=['sapphire','ruby'];
const frameSize=192;

export function drawInfantry(c,unit,color){
 const key=teams[unit.side]+'-'+unit.pose;
 if(!sheets.has(key)){
  const image=new Image();
  const version=unit.pose==='walk'?'-4frames-v4':'';
  image.src=new URL('./art/infantry/'+key+version+'.webp',import.meta.url).href;
  sheets.set(key,image);
 }
 const sheet=sheets.get(key);
 if(!sheet.complete||!sheet.naturalWidth)return;
 const {x}=unit,y=unit.y*FLAT,size=120;
 c.fillStyle='#0a101965';
 c.beginPath();c.ellipse(x,y,16,6,0,0,Math.PI*2);c.fill();
 c.strokeStyle=color;c.lineWidth=1.25;c.stroke();
 c.drawImage(sheet,unit.frame*frameSize,unit.dir*frameSize,frameSize,frameSize,
  x-size/2,y-size*(176/frameSize),size,size);
 const hp=Math.ceil(unit.hp);
 c.save();
 c.fillStyle='#0b1018';c.fillRect(x-22,y-104,44,5);
 c.fillStyle=color;c.fillRect(x-21,y-103,42*unit.hp/unit.maxHp,3);
 c.textAlign='center';c.font='bold 13px system-ui';
 c.lineWidth=3;c.strokeStyle='#0b1018';c.fillStyle='#fff4df';
 c.strokeText(`${hp}/${unit.maxHp}`,x,y-108);
 c.fillText(`${hp}/${unit.maxHp}`,x,y-108);
 c.restore();
}
