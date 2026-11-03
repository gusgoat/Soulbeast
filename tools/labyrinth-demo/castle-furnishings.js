(function(scope){'use strict';
// Furnish selected wall alcoves and the two public halls. The maze itself stays intact.
function decorate(d){const C=d.cell,F=d.flatten,out=[],occupied=[],alcoves=[];
 const distance=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*F);
 const add=(name,x,y,size,group)=>out.push({name:'castle-'+name,x,y,size,group});
 const reserved=(x,y)=>d.rooms.some(r=>x>=r.ring[0]-1&&x<=r.ring[2]+1&&y>=r.ring[1]-1&&y<=r.ring[3]+1);
 for(let y=2;y<d.rows-2;y++)for(let x=2;x<d.cols-2;x++)if(!reserved(x,y)&&[-1,0,1].every(dx=>d.grid[y][x+dx]===0&&d.grid[y+1][x+dx]===1))alcoves.push({x:(x+.5)*C,y:(y+1)*C-12});
 const zones=[['library',10,45],['dining',30,43],['gallery',10,32],['music',29,31],['library',12,20],['dining',30,17],['gallery',21,40],['guards',25,10]];
 const halls={'library-10-45':[18.2,52.8],'library-12-20':[16.8,2.3],'dining-30-43':[18.2,55],'dining-30-17':[16.8,6.5],'music-29-31':[22.6,54]};
 for(const [kind,cx,cy]of zones){const id=kind+'-'+cx+'-'+cy,hall=halls[id],aim=d.center(cx,cy),p=hall?{x:hall[0]*C,y:hall[1]*C}:alcoves.filter(p=>occupied.every(q=>distance(p,q)>950)).sort((a,b)=>distance(a,aim)-distance(b,aim))[0];if(!p)continue;occupied.push(p);const {x,y}=p;
  if(kind==='library'){add('shelf',x-125,y,125,id);add('shelf',x+125,y,125,id);add('table',x,y+70,140,id);add('chair',x,y+125,70,id)}
  else if(kind==='dining'){add('table',x,y-22,205,id);add('chair',x-145,y+15,85,id);add('chair',x+145,y+15,85,id);add('candles',x+230,y-10,68,id)}
  else if(kind==='music'){add('piano',x,y,230,id);add('candles',x-205,y,90,id);add('portrait',x+205,y,115,id)}
  else if(kind==='gallery'){add('portrait',x-180,y,125,id);add('portrait',x+180,y,125,id);add('lamp',x,y,105,id)}
  else {add('armor-statue',x-180,y,155,id);add('armor-statue',x+180,y,155,id);add('portrait',x,y,115,id)}
 }
 // Matching pairs frame the entrance and royal hall; the centre stays clear for movement/combat.
 for(const [x,name]of [[19,'armor-statue'],[22,'armor-statue']])add(name,x*C,51.4*C,145,'entrance');
 for(const x of [17.4,23.6])add('lamp',x*C,54.8*C,115,'entrance');
 for(const x of [18.4,22.6]){add('vampire-statue',x*C,6.6*C,175,'royal-hall');add('candles',x*C,1.5*C,95,'royal-hall')}
 occupied.push(...out.filter(p=>p.group==='entrance'||p.group==='royal-hall'));
 // Sparse wall lamps mark long corridors, rather than one ornament on every wall cell.
 for(let y=3;y<d.rows-3;y++)for(let x=2;x<d.cols-2;x++){if(reserved(x,y)||d.grid[y][x]!==0||d.grid[y+1][x]!==1)continue;const p={x:(x+.5)*C,y:(y+1)*C-12};if(occupied.some(q=>distance(p,q)<1100))continue;add('lamp',p.x,p.y,105,'corridor');occupied.push(p)}
 // The only fountain is the interactive sacred well in its dedicated secret chamber.
 return out;
}
const api={decorate};scope.CastleFurnishings=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
