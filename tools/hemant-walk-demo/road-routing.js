(function(scope){'use strict';
// Route every road over the same bank-to-bank crossings before scenery is placed.
function create(data,water){
 const F=.64,S=45,cols=Math.ceil(data.width/S),rows=Math.ceil(data.height*F/S),cache=new Map();
 const point=k=>({x:(k%cols)*S,y:Math.floor(k/cols)*S/F});
 function dry(p){return !water.raw(p.x,p.y,32)||water.onBridge(p.x,p.y)}
 function clear(a,b){const n=Math.ceil(Math.hypot(a.x-b.x,(a.y-b.y)*F)/12);for(let i=0;i<=n;i++)if(!dry({x:a.x+(b.x-a.x)*i/n,y:a.y+(b.y-a.y)*i/n}))return false;return true}
 function valid(k){if(!cache.has(k))cache.set(k,dry(point(k)));return cache.get(k)}
 function snap(p){const x=Math.round(p.x/S),y=Math.round(p.y*F/S);let best=null;for(let r=0;r<5&&!best;r++)for(let dx=-r;dx<=r;dx++)for(let dy=-r;dy<=r;dy++){const k=(y+dy)*cols+x+dx;if(valid(k)&&clear(p,point(k)))best=k}if(best===null)throw Error('No dry road approach');return best}
 function route(a,b){if(clear(a,b))return [a,b];const start=snap(a),goal=snap(b),target=point(goal),open=[],scores=new Map([[start,0]]),prev=new Map();
  const h=k=>{const p=point(k);return Math.hypot(p.x-target.x,(p.y-target.y)*F)};
  function push(v){open.push(v);let i=open.length-1;while(i){const j=(i-1)>>1;if(open[j].f<=v.f)break;open[i]=open[j];i=j}open[i]=v}
  function pop(){const v=open[0],last=open.pop();if(open.length){let i=0;while(i*2+1<open.length){let j=i*2+1;if(j+1<open.length&&open[j+1].f<open[j].f)j++;if(open[j].f>=last.f)break;open[i]=open[j];i=j}open[i]=last}return v}
  push({k:start,g:0,f:h(start)});
  while(open.length){const cur=pop();if(cur.g!==scores.get(cur.k))continue;if(cur.k===goal){const path=[b];for(let k=goal;k!==undefined;k=prev.get(k))path.unshift(point(k));path.unshift(a);const result=[a];for(let i=0;i<path.length-1;){let j=path.length-1;while(j>i+1&&!clear(path[i],path[j]))j--;result.push(path[j]);i=j}return result}
   const x=cur.k%cols,y=Math.floor(cur.k/cols);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){if(x+dx<2||x+dx>=cols-2||y+dy<2||y+dy>=rows-2)continue;const k=(y+dy)*cols+x+dx;if(!valid(k)||!clear(point(cur.k),point(k)))continue;const g=cur.g+S*Math.hypot(dx,dy);if(g>=(scores.get(k)??Infinity))continue;scores.set(k,g);prev.set(k,cur.k);push({k,g,f:g+h(k)})}
  }throw Error('No river crossing route');
 }
 return points=>{points=points.filter((p,i)=>i===0||i===points.length-1||!water.raw(p.x,p.y,80));const result=[points[0]];for(let i=1;i<points.length;i++)result.push(...route(points[i-1],points[i]).slice(1));return result};
}
scope.hemantRoadRouting={create};if(typeof module!=='undefined')module.exports={create};
})(typeof window==='undefined'?globalThis:window);
