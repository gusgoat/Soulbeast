(function(g){'use strict';
function create(options={}){let state=null,ticket=0;const catalog=options.catalog||g.RareBeastWalkCatalog;const model=g.sealerSprites?.createModel?.({beast:true});
 async function sync(id){const entry=catalog.find(e=>e.id===id);if(!entry)throw Error('Unknown rare beast: '+id);if(state?.entry.id===id)return state.entry;const seq=++ticket;await model?.sync(id);
  if(seq!==ticket)return null;
  if(model?.supported){
   const portrait=new Image();
   if(entry.portrait)portrait.src=entry.portrait;
   state?.art?.close?.();
   state={entry,portrait};
   return entry;
  }
  const art=await new Promise((resolve,reject)=>{const im=new Image();im.onload=async()=>{try{let result=im;if(options.cellLimit&&entry.cell>options.cellLimit&&g.CountryRenderBudget){result=await g.CountryRenderBudget.atlas(im,entry.frames,8,options.cellLimit);}else if(g.createImageBitmap){result=await g.createImageBitmap(im);im.onload=im.onerror=null;im.src=''}resolve(result)}catch(e){reject(e)}};im.onerror=()=>reject(Error('โหลดท่าเคลื่อนไหวไม่สำเร็จ: '+entry.name));im.src=entry.url});if(seq!==ticket){art.close?.();return null}state?.art?.close?.();state={entry,art,cell:options.cellLimit?art.height/8:entry.cell};return entry}
 function draw(c,x,y,size,dir,time,moving=true){if(model?.draw(c,x,y,size,dir,moving,false))return true;if(!state)return false;if(!state.art){const im=state.portrait;if(!im?.complete||!im.naturalWidth)return false;c.drawImage(im,x-size*.3,y-size*.6,size*.6,size*.6);return true;}const e=state.entry,d=((Math.round(dir)%8)+8)%8,animated=moving||['fly','float','slither'].includes(e.kind),frame=animated?Math.floor(time/e.cycle*e.frames)%e.frames:0,anchor=e.anchors?.[d]||e.anchor,w=Math.min(256,Math.max(1,size)),lift=animated?Math.sin(time*Math.PI*2/e.cycle)*(e.kind==='walk'?0.6:1.4):Math.sin(time*Math.PI*2/3.6)*.4;
 const cell=state.cell;c.drawImage(state.art,frame*cell,d*cell,cell,cell,x-w*anchor[0],y-w*anchor[1]-lift,w,w);return true}
 function release(){model?.release();ticket++;state?.art?.close?.();state=null}return {sync,draw,release,get current(){return state?.entry||null}};
}
g.RareBossSprites={create};if(typeof module!=='undefined')module.exports=g.RareBossSprites;
})(typeof window!=='undefined'?window:globalThis);
