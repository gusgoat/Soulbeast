// Presentation only: reuse the solo dungeon mixer without network requests.
export function partyAudio(create=options=>window.WalkAudio.create(options)){
 let floor=null,map=null,previousDoor,wasChasing=false;
 const options={kind:'dungeon',music:'mine',surface:'stone',waterSources:()=>{
  if(!floor||!map)return [];
  const sources=floor.theme==='lava'?[]:[{points:map.river,width:64}];
  if(floor.rest)sources.push({...map.mini,radius:150});
  if(floor.theme!=='lava')for(const fraction of [.2,.55,.83]){
   const point=map.river[Math.floor(map.river.length*fraction)];if(point)sources.push({...point,radius:70});
  }
  return sources;
 }};
 const mixer=create(options);
 function setFloor(config,maze){
  floor=config;map=maze;previousDoor=undefined;wasChasing=false;
  options.music=config.floor===6?'deepMine':config.theme;
  options.surface=config.theme==='castle'?'hall':config.theme==='jungle'?'leaves':['snow','desert'].includes(config.theme)?'forest':'stone';
 }
 function tick(dt,{position,moving,blocked,ready,world,nav}){
  if(!floor||!map||!position)return;
  if(previousDoor===false&&world.doorOpen)mixer.boss('door',floor.bossModel);
  previousDoor=!!world.doorOpen;
  const chasing=!!(ready&&!blocked&&world.doorOpen&&world.boss==='guarding'&&nav&&nav.distance(position,map.boss)<850);
  if(chasing&&!wasChasing)mixer.boss('chase',floor.bossModel);
  wasChasing=chasing;
  mixer.tick(dt,{position,moving:!!moving,running:false,blocked:!ready||!!blocked,chasing});
 }
 return {setFloor,tick,dispose:()=>mixer.dispose()};
}
