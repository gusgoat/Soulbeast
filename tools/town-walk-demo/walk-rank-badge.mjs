import {shieldFor,shieldUrl} from '../colosseum/ranking.mjs?v=shields-2';
const images=new Map();
export function drawWalkRank(c,x,bottom,score=0,size=27){
 const shield=shieldFor(Number.isFinite(score)?score:0);
 if(!images.has(shield.id))images.set(shield.id,Object.assign(new Image(),{src:shieldUrl(shield)}));
 const image=images.get(shield.id);
 if(image.naturalWidth)c.drawImage(image,x-size/2,bottom-size/2,size,size);
}
