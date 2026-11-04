(()=>{'use strict';
const models={solar_cryostag:'crystal-stag',eclipse_wolf:'moonwolf',baihu:'white-tiger',legend2_tricephalos:'tricephalos',solar_pentadrake:'infernal-hydra',qilin:'golden-kirin',solar_sovereign:'solar-lion'};
const catalogURL=new URL('../hemant-walk-demo/fusion-sprites.js',document.currentScript.src).href;
let catalog;const cache=new Map();
async function bitmap(url,cols,rows){const response=await fetch(url);if(!response.ok)throw Error('fusion_sprite_load');return createImageBitmap(await response.blob(),{resizeWidth:cols*160,resizeHeight:rows*160});}
function acquire(model){let entry=cache.get(model);if(!entry){entry={refs:0};cache.set(model,entry);entry.promise=(async()=>{catalog??=import(catalogURL);await catalog;const meta=window.BeastFusionSprites[model];const images=await Promise.allSettled([bitmap(meta.base+'/'+meta.file,meta.frames,8),bitmap(meta.base+'/idle-atlas.webp',4,2)]);if(images.some(x=>x.status==='rejected')){for(const x of images)if(x.status==='fulfilled')x.value.close();throw Error('fusion_sprite_load');}return {...meta,walk:images[0].value,idle:images[1].value};})();}entry.refs++;return entry;}
function drop(model,entry){if(!entry)return;if(--entry.refs===0){if(cache.get(model)===entry)cache.delete(model);entry.promise.then(v=>{v.walk.close();v.idle.close();}).catch(()=>{});}}
function create(){const human=window.sealerSprites.create();let model=null,entry=null,loaded=null,ticket=0,retryAt=0;
async function sync(player){const next=models[player?.walkFusion]||null;if(!next)await human.sync(player);if(next===model&&(loaded||entry||performance.now()<retryAt))return;releaseBeast();model=next;if(!model)return;const current=++ticket,held=entry=acquire(model);try{const v=await held.promise;if(ticket===current)loaded=v;}catch(error){if(ticket===current){drop(model,entry);entry=null;retryAt=performance.now()+10000;}throw error;}}
function releaseBeast(){ticket++;drop(model,entry);entry=null;loaded=null;model=null;}
function draw(c,x,y,size,dir,phase,moving,running){if(!loaded)return human.draw(c,x,y,size,dir,phase,moving,running);const v=loaded,time=performance.now()/1000,frame=moving?Math.floor(time*2.5/v.cycle*v.frames)%v.frames:dir%4,row=moving?dir:Math.floor(dir/4),anchor=v.anchors[dir]||[.5,.75],width=(model==='infernal-hydra'?245:model==='tricephalos'?225:205)*size/156,height=width*(moving?1:1+(1-Math.cos(time*Math.PI*2/3.6))*.004);c.drawImage(moving?v.walk:v.idle,frame*160,row*160,160,160,x-width*anchor[0],y-height*anchor[1],width,height);}
return {sync,draw,release(){releaseBeast();human.release();}};}
window.RemoteWalkSprite={create};
})();
