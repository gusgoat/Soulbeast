// Zone-4 presentation only. Native rules, tokens, rewards and combat own the events.
const DragonForestScenes=(()=>{
 const profiles={
  dragongate:['ประตูคำสาบานเหนือเมฆ','gate','gate'],
  dragon:['สะพานกระดิ่งกลางลม','bridge','sign'],
  'dragon-echo':['เสาสะท้อนคำราม','echo','shrine'],
  'dragon-elements':['กุญแจหลอมเกล็ด','forge','shrine'],
  'dragon-avalanche':['เสียงแตกใต้ยอดเขา','avalanche','shrine'],
  'dragon-nest':['รังเงาจับคู่หู','nest','shrine'],
  'dragon-0':['เชือกเส้นสุดท้าย','bridge','sign'],
  'dragon-1':['ควันที่ไม่ใช่ไฟป่า','beacon','sign'],
  'dragon-2':['เกล็ดที่ยังอุ่น','scale-cache','sign'],
  'dragon-3':['คนเฝ้ารังคนสุดท้าย','keeper','sign'],
  'encounter-4':['ไข่บนสะพานแขวน','bridge','sign'],
  'after-dragon':['รังที่ยังไม่สงบ','nest','shrine'],
  villager:['นักเดินทางบนยอดเขา','camp','sign'],
  boss:['ห้องบอส · มังกรเพลิงโบราณ','boss','gate']
 };
 function describe(id='villager'){
  if(id.startsWith('after:'))id='after-dragon';
  const [title,kit,landmark]=profiles[id]||profiles.villager;
  return {id,title,kit,landmark,color:'#c2cad0'};
 }
 function selected(zone,door){
  if(door.k==='secret')return describe(zone.secretRun?.location||'dragongate');
  if(door.k==='specialEvent')return describe('dragon');
  if(door.k.startsWith('riddle'))return describe(zone.riddleRun?.[door.k==='riddleReward'?'reward':'hazard']?.id);
  if(door.k==='taleEvent')return describe('encounter-4');
  if(door.k==='taleFollow')return describe(zone.storyRun?.used?.startsWith('quest:')?zone.storyRun.used.slice(6):zone.storyRun?.selected?.id||'villager');
  return describe();
 }
 function session(zone){
  if(zone.secretSession)return describe(zone.secretSession.id);
  if(zone.specialSession)return describe('dragon');
  if(zone.riddleSession)return describe(zone.riddleSession.id);
  if(zone.taleSession)return describe(zone.taleSession.id||zone.taleSession.followId||'villager');
  return null;
 }
 return {describe,selected,session,ids:Object.keys(profiles)};
})();
