// Zone-5 presentation only. Original runtime owns all rules and rewards.
const HeavenForestScenes=(()=>{
 const profiles={
  valhalla:['มหาวิหารเสียงสะท้อน','valhalla','gate'],
  heaven:['สวนดาวที่ร่วงหล่น','garden','shrine'],
  'heaven-stars':['วิหารดาวที่หายไป','stars','shrine'],
  'heaven-oath':['ประตูสัตย์ของวีรชน','oath','gate'],
  'heaven-lightning':['ฟ้าผ่าบันไดสวรรค์','storm','shrine'],
  'heaven-soulwind':['สายลมพรากพันธสัญญา','wind','shrine'],
  'heaven-0':['ชื่อบนแผ่นเกราะ','armor','sign'],
  'heaven-1':['เสียงจากเบื้องล่าง','rescue','sign'],
  'heaven-2':['ตะเกียงที่ต้องนำกลับ','lantern','sign'],
  'heaven-3':['ผู้รับเวรคนใหม่','watchpost','sign'],
  'encounter-5':['ระฆังที่ยังเรียกคนตาย','bell','sign'],
  'after-heaven':['ผู้มีชีวิตรับเวร','watchpost','shrine'],
  villager:['นักเดินทางท่ามกลางซากสวรรค์','camp','sign'],
  boss:['ห้องบอส · นีดฮ็อกผู้กัดกินรากโลก','boss','gate']
 };
 function describe(id='villager'){
  if(id.startsWith('after:'))id='after-heaven';
  const [title,kit,landmark]=profiles[id]||profiles.villager;
  return {id,title,kit,landmark,color:'#e6dbc4'};
 }
 function selected(zone,door){
  if(door.k==='secret')return describe(zone.secretRun?.location||'valhalla');
  if(door.k==='specialEvent')return describe('heaven');
  if(door.k.startsWith('riddle'))return describe(zone.riddleRun?.[door.k==='riddleReward'?'reward':'hazard']?.id);
  if(door.k==='taleEvent')return describe('encounter-5');
  if(door.k==='taleFollow')return describe(zone.storyRun?.used?.startsWith('quest:')?zone.storyRun.used.slice(6):zone.storyRun?.selected?.id||'villager');
  return describe();
 }
 function session(zone){
  if(zone.secretSession)return describe(zone.secretSession.id);
  if(zone.specialSession)return describe('heaven');
  if(zone.riddleSession)return describe(zone.riddleSession.id);
  if(zone.taleSession)return describe(zone.taleSession.id||zone.taleSession.followId||'villager');
  return null;
 }
 return {describe,selected,session,ids:Object.keys(profiles)};
})();
