import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const code=await readFile(new URL('../assets/forest-walk/trail-exit.js',import.meta.url),'utf8');
const {reachedTrailEnd}=await import('data:text/javascript,'+encodeURIComponent(code));
for(const [end,approach]of [[[-34.3,37.8],[-24.15,30.1]],[[35.7,39.55],[26.95,31.15]]]){
 const tx=end[0]-approach[0],tz=end[1]-approach[1],len=Math.hypot(tx,tz),ux=tx/len,uz=tz/len;
 const hit=(along,across)=>reachedTrailEnd(end[0]+ux*along-uz*across,end[1]+uz*along+ux*across,end,approach,9);
 for(let angle=0;angle<360;angle++)assert(hit(Math.cos(angle*Math.PI/180)*8.99,Math.sin(angle*Math.PI/180)*8.99),'end clearing edge');
 for(const across of [-8.99,-7,0,7,8.99])for(const along of [0,3,9,18])assert(hit(along,across),'missed outer trail or overshoot');
 assert(!hit(-10,0),'left map before reaching terminal area');assert(!hit(4,10),'outside terminal width');
 assert(!reachedTrailEnd(0,-1.75,end,approach,9),'junction triggers exit');
}
console.log('PASS both full terminal clearings, both edges, overshoot and approach/junction boundaries');
