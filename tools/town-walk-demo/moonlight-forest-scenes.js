// Presentation only. Original zone-1 IDs, native tokens, rules and rewards stay intact.
const MoonlightForestScenes = (() => {
  const profiles={
    yggdrasil:['รากแห่งคำสัญญา','yggdrasil','gate'],
    moon:['โคมหิ่งห้อยหลงทาง','lantern','shrine'],
    'moon-reflections':['บึงเงาจันทร์สามดวง','reflections','shrine'],
    'moon-leaf-scale':['ตาชั่งใบไม้เงิน','scales','shrine'],
    'moon-wolves':['เสียงหอนวงวน','wolves','shrine'],
    'moon-moth':['ผีเสื้อกินผนึก','moth','shrine'],
    'moon-0':['ขวานที่ทิ้งไว้','axe','sign'],
    'moon-1':['คนที่กลัวแสงตะเกียง','lantern','sign'],
    'moon-2':['เมล็ดพันธุ์ที่ไม่ยอมงอก','seedmap','sign'],
    'moon-3':['เส้นแบ่งบนแผนที่','seedmap','sign'],
    'encounter-1':['ตะเกียงสุดท้ายของคนตัดไม้','lantern','sign'],
    'after-moon':['ทางน้ำรองใต้แสงตะเกียง','waterways','shrine'],
    villager:['ชาวบ้านข้างทาง','camp','sign'],
    boss:['ห้องบอส · ราชาทานุกิ','boss','gate']
  };
  function describe(id='villager'){
    if(id.startsWith('after:'))id='after-moon';
    const [title,kit,landmark]=profiles[id]||profiles.villager;
    return {id,title,kit,landmark,color:'#b9d5de'};
  }
  function selected(zone,door){
    if(door.k==='secret')return describe(zone.secretRun?.location||'yggdrasil');
    if(door.k==='specialEvent')return describe('moon');
    if(door.k.startsWith('riddle'))return describe(zone.riddleRun?.[door.k==='riddleReward'?'reward':'hazard']?.id);
    if(door.k==='taleEvent')return describe('encounter-1');
    if(door.k==='taleFollow')return describe(zone.storyRun?.used?.startsWith('quest:')?zone.storyRun.used.slice(6):zone.storyRun?.selected?.id||'villager');
    return describe();
  }
  function session(zone){
    if(zone.secretSession)return describe(zone.secretSession.id);
    if(zone.specialSession)return describe('moon');
    if(zone.riddleSession)return describe(zone.riddleSession.id);
    if(zone.taleSession)return describe(zone.taleSession.id||zone.taleSession.followId||'villager');
    return null;
  }
  return {describe,selected,session,ids:Object.keys(profiles)};
})();
