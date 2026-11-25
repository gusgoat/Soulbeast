(function(g){'use strict';
const fieldScale = {
 "qilin": {sprite: 1.1564, model: 1.0696},
 "unicorn": {sprite: 1.1402, model: 0.8818},
 "pegasus": {sprite: 1.1577, model: 0.8818},
 "erawan": {sprite: 1.3743, model: 1.0885},
 "baihu": {sprite: 1.3338, model: 1.3153},
 "lamassu": {sprite: 1.1162, model: 0.8818},
 "fenrir": {sprite: 1.2426, model: 0.9465},
 "kraken": {sprite: 1.1616, model: 0.9257},
 "phoenix": {sprite: 1.1804, model: 0.8818},
 "garuda": {sprite: 1.1051, model: 0.8709},
 "lunar_stag": {sprite: 1.0998, model: 0.8764},
 "thorn_queen": {sprite: 1.1162, model: 0.8764},
 "mist_serpent": {sprite: 1.1065, model: 0.8764},
 "crow_emperor": {sprite: 1.1066, model: 0.8818},
 "sand_colossus": {sprite: 1.3747, model: 1.0955},
 "scorpion_pharaoh": {sprite: 1.1079, model: 0.8764},
 "storm_wyvern": {sprite: 1.2206, model: 0.9465},
 "frost_lich": {sprite: 1.1828, model: 1.1094},
 "fallen_seraph": {sprite: 1.0957, model: 0.8764},
 "sun_devourer": {sprite: 1.1245, model: 0.8818},
 "vampire_queen": {sprite: 1.2062, model: 1.0844},
 "abyss_emperor": {sprite: 1.0984, model: 0.8764},
 "jade_moon_hare": {sprite: 1.1025, model: 0.8764},
 "tempest_lynx": {sprite: 1.136, model: 0.8764},
 "bloom_jade_mare": {sprite: 1.1398, model: 0.8983},
 "obsidian_scarab": {sprite: 1.2025, model: 0.9465},
 "aurora_whale": {sprite: 1.2554, model: 0.9465},
 "ember_jackal": {sprite: 1.1445, model: 0.8818},
 "prism_owl": {sprite: 0.8425, model: 0.6245},
 "dusk_panther": {sprite: 1.0196, model: 0.8045},
 "crystal-stag": {sprite: 1.2256, model: 1.1585},
 "infernal-hydra": {sprite: 1.4703, model: 1.4582},
 "solar_raijaku": {sprite: 1.3115, model: 1},
};
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
 function draw(c,x,y,size,dir,time,moving=true,field=false){const scale=field&&fieldScale[state?.entry.id];if(model?.draw(c,x,y,size*(scale?.model??1),dir,moving,false))return true;if(!state)return false;if(!state.art){const im=state.portrait;if(!im?.complete||!im.naturalWidth)return false;c.drawImage(im,x-size*.3,y-size*.6,size*.6,size*.6);return true;}const e=state.entry,d=((Math.round(dir)%8)+8)%8,animated=moving||['fly','float','slither'].includes(e.kind),frame=animated?Math.floor(time/e.cycle*e.frames)%e.frames:0,anchor=e.anchors?.[d]||e.anchor,w=scale?size*scale.sprite:Math.min(256,Math.max(1,size)),lift=animated?Math.sin(time*Math.PI*2/e.cycle)*(e.kind==='walk'?0.6:1.4):Math.sin(time*Math.PI*2/3.6)*.4;
 const cell=state.cell;c.drawImage(state.art,frame*cell,d*cell,cell,cell,x-w*anchor[0],y-w*anchor[1]-lift,w,w);return true}
 function release(){model?.release();ticket++;state?.art?.close?.();state=null}return {sync,draw,release,get current(){return state?.entry||null}};
}
g.RareBossSprites={create};if(typeof module!=='undefined')module.exports=g.RareBossSprites;
})(typeof window!=='undefined'?window:globalThis);
