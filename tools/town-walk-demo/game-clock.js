(function(root){
 'use strict';

 const realMillisecondsPerGameHour=10*60_000;
 const dayDuration=24*realMillisecondsPerGameHour;
 const encounterPeriods=Object.freeze({
  jackalope:'day', eagle:'day', griffin:'day', harpy:'day', roc:'day',
  mandrake:'day', jade_bull:'day', celestial_deer:'day', kinnaree:'day',
  scarab:'day', salamander:'day', garuda:'day', sun_devourer:'day',
  wisp:'night', nekomata:'night', nue:'night', gargoyle:'night', zombie:'night',
  moon_cat:'night', baku:'night', night_horse:'night', jiangshi:'night',
  banshee:'night', jorogumo:'night', desert_witch:'night', dusk_panther:'night',
  lunar_stag:'night', jade_moon_hare:'night',
 });
 const labels={dawn:'ฟ้าสาง',day:'กลางวัน',dusk:'พลบค่ำ',night:'กลางคืน'};

 function at(now=Date.now()){
  const hour=((now%dayDuration+dayDuration)%dayDuration)/realMillisecondsPerGameHour;
  const minutes=Math.floor(hour*60);
  const text=String(Math.floor(minutes/60)).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0');
  const phase=hour<5||hour>=19?'night':hour<7?'dawn':hour<17?'day':'dusk';
  return {hour,text,phase,encounter:phase==='night'?'night':'day'};
 }
 function period(species){return Object.hasOwn(encounterPeriods,species)?encounterPeriods[species]:'both';}
 function filter(ids,encounter){return ids.filter(id=>period(id)==='both'||period(id)===encounter);}

 const nightAuraBonus=15;
 function applyNightAura(unit){
  if(!unit.nightAura){
   unit.st={...unit.st};
   for(const key of ['patk','matk','pdef','mdef'])unit.st[key]=Math.round(unit.st[key]*(1+nightAuraBonus/100));
   unit.nightAura=true;
  }
  return unit;
 }

 const api=Object.freeze({at,period,filter,dayDuration,applyNightAura,nightAuraBonus});
 root.SoulBeastClock=api;
 if(typeof module!=='undefined')module.exports=api;

 function mount(){
  const clocks=root.document.querySelectorAll('[data-game-clock]');
  if(!clocks.length)return;
  let last='';
  function refresh(){
   const time=at();
   if(last===time.text)return;
   last=time.text;
   for(const node of clocks){
    node.dateTime=time.text;
    node.dataset.phase=time.phase;
    node.textContent=time.text+' · '+labels[time.phase];
   }
  }
  refresh();
  root.setInterval(refresh,1000);
 }
 if(root.document){
  if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
 }
})(typeof window==='undefined'?globalThis:window);
