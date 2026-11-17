(()=>{
 'use strict';
 const fusionModels={
  solar_cryostag:'crystal-stag',eclipse_wolf:'moonwolf',baihu:'white-tiger',
  legend2_tricephalos:'tricephalos',solar_pentadrake:'infernal-hydra',qilin:'golden-kirin',solar_sovereign:'solar-lion'
 };
 function create(){
  const human=window.sealerSprites.create(),beast=window.sealerSprites.createModel({beast:true});
  let selected=null;
  async function sync(player){
   const next=fusionModels[player?.walkFusion]||null;
   if(next!==selected){
    selected=next;
    beast.release();
    if(next)beast.sync(next);
   }
   return human.sync(player);
  }
  function draw(c,x,y,size,dir,phase,moving,running){
   if(selected&&beast.draw(c,x,y,size*1.35,dir,moving,running))return;
   return human.draw(c,x,y,size,dir,phase,moving,running);
  }
  return {sync,draw,release(){selected=null;beast.release();human.release();}};
 }
 window.RemoteWalkSprite={create};
})();
