// Zone-6 presentation only. Original runtime owns all rules and rewards.
const DemonForestScenes=(()=>{
 const profiles={
  pandemonium:['นครเสียงใต้บัลลังก์','pandemonium','gate'],
  castle:['พัสดุของปีศาจหลงทาง','parcel','sign'],
  'castle-mirrors':['บัญชีเงาในคลังดำ','mirrors','shrine'],
  'castle-chains':['โซ่สามข้อของผู้เฝ้าคลัง','chains','gate'],
  'castle-banquet':['งานเลี้ยงพิษของเงา','banquet','shrine'],
  'castle-hounds':['ห้องล่าไร้เงา','hounds','gate'],
  'castle-0':['ประตูที่มีคนเคาะสองฝั่ง','knocking','sign'],
  'castle-1':['ถุงเสบียงของคนที่ไม่กลับมา','supplies','sign'],
  'castle-2':['พยานที่ไม่มีใครยอมรับ','witness','sign'],
  'castle-3':['รายชื่อหลังประตูเหล็ก','prison','sign'],
  'encounter-6':['ผู้ส่งสารใต้หน้ากาก','messenger','sign'],
  'after-castle':['ผู้รอดชีวิตหลังปราสาท','settlement','shrine'],
  villager:['นักเดินทางในเงาปราสาท','camp','sign'],
  boss:['ห้องบอส · จอมมารผู้ครองรัตติกาล','boss','gate']
 };
 function describe(id='villager'){
  if(id.startsWith('after:'))id='after-castle';
  const [title,kit,landmark]=profiles[id]||profiles.villager;
  return {id,title,kit,landmark,color:'#c8bbc4'};
 }
 function selected(zone,door){
  if(door.k==='secret')return describe(zone.secretRun?.location||'pandemonium');
  if(door.k==='specialEvent')return describe('castle');
  if(door.k.startsWith('riddle'))return describe(zone.riddleRun?.[door.k==='riddleReward'?'reward':'hazard']?.id);
  if(door.k==='taleEvent')return describe('encounter-6');
  if(door.k==='taleFollow')return describe(zone.storyRun?.used?.startsWith('quest:')?zone.storyRun.used.slice(6):zone.storyRun?.selected?.id||'villager');
  return describe();
 }
 function session(zone){
  if(zone.secretSession)return describe(zone.secretSession.id);
  if(zone.specialSession)return describe('castle');
  if(zone.riddleSession)return describe(zone.riddleSession.id);
  if(zone.taleSession)return describe(zone.taleSession.id||zone.taleSession.followId||'villager');
  return null;
 }
 return {describe,selected,session,ids:Object.keys(profiles)};
})();
