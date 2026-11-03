(function(g){'use strict';
function create(options={}){let state=null,ticket=0;const catalog=options.catalog||g.RareBeastWalkCatalog;
 async function sync(id){const entry=catalog.find(e=>e.id===id);if(!entry)throw Error('Unknown rare beast: '+id);if(state?.entry.id===id)return state.entry;const seq=++ticket;const art=await new Promise((resolve,reject)=>{const im=new Image();im.onload=async()=>{try{let result=im;if(g.createImageBitmap){result=await g.createImageBitmap(im);im.onload=im.onerror=null;im.src=''}resolve(result)}catch(e){reject(e)}};im.onerror=()=>reject(Error('โหลดท่าเคลื่อนไหวไม่สำเร็จ: '+entry.name));im.src=entry.url});if(seq!==ticket){art.close?.();return null}state?.art?.close?.();state={entry,art};return entry}
 function draw(c,x,y,size,dir,time,moving=true){if(!state)return false;const e=state.entry,d=((Math.round(dir)%8)+8)%8,animated=moving||['fly','float','slither'].includes(e.kind),frame=animated?Math.floor(time/e.cycle*e.frames)%e.frames:0,anchor=e.anchors?.[d]||e.anchor,w=Math.min(256,Math.max(1,size)),lift=animated?Math.sin(time*Math.PI*2/e.cycle)*(e.kind==='walk'?0.6:1.4):Math.sin(time*Math.PI*2/3.6)*.4;
 c.drawImage(state.art,frame*e.cell,d*e.cell,e.cell,e.cell,x-w*anchor[0],y-w*anchor[1]-lift,w,w);return true}
 function release(){ticket++;state?.art?.close?.();state=null}return {sync,draw,release,get current(){return state?.entry||null}};
}
g.RareBossSprites={create};if(typeof module!=='undefined')module.exports=g.RareBossSprites;
})(typeof window!=='undefined'?window:globalThis);
