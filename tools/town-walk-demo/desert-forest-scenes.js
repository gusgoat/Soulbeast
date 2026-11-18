// Zone-3 presentation only: native event IDs and original game rules stay intact.
const DesertForestScenes = (()=>{
  const profiles={
    sahara:['นครใต้ตาชั่งทอง','sahara','gate'],
    desert:['คาราวานใต้ผืนทราย','caravan','sign'],
    'desert-hourglass':['ห้องนาฬิกาทรายกลับหัว','hourglass','shrine'],
    'desert-scales':['ตาชั่งผู้เฝ้าทอง','scales','shrine'],
    'desert-storm':['กำแพงพายุทราย','storm','shrine'],
    'desert-scarab':['ฝูงแมลงกัดผนึก','scarab','shrine'],
    'desert-0':['รอยเท้าที่วนกลับมา','delivery','sign'],
    'desert-1':['ผ้าคลุมใต้ทราย','cloth','sign'],
    'desert-2':['หีบที่ห้ามเปิดกลางแดด','chest','sign'],
    'desert-3':['บัญชีหนี้ของผู้รอดชีวิต','ledger','sign'],
    'encounter-3':['น้ำหนึ่งไหกับขบวนสองฝั่ง','waterways','sign'],
    'after-desert':['ผู้ที่เดินเลยโอเอซิส','waterways','shrine'],
    villager:['ผู้เดินทางกลางทะเลทราย','caravan','sign'],
    boss:['ห้องบอส · สฟิงซ์ผู้เฝ้าสุสาน','boss','gate']
  };
  function describe(id='villager'){
    if(id.startsWith('after:'))id='after-desert';
    const [title,kit,landmark]=profiles[id]||profiles.villager;
    return {id,title,kit,landmark,color:'#e8c994'};
  }
  function selected(zone,door){
    if(door.k==='secret')return describe(zone.secretRun?.location||'sahara');
    if(door.k==='specialEvent')return describe('desert');
    if(door.k.startsWith('riddle'))return describe(zone.riddleRun?.[door.k==='riddleReward'?'reward':'hazard']?.id);
    if(door.k==='taleEvent')return describe('encounter-3');
    if(door.k==='taleFollow')return describe(zone.storyRun?.used?.startsWith('quest:')?zone.storyRun.used.slice(6):zone.storyRun?.selected?.id||'villager');
    return describe();
  }
  function session(zone){
    if(zone.secretSession)return describe(zone.secretSession.id);
    if(zone.specialSession)return describe('desert');
    if(zone.riddleSession)return describe(zone.riddleSession.id);
    if(zone.taleSession)return describe(zone.taleSession.id||zone.taleSession.followId||'villager');
    return null;
  }
  return {describe,selected,session,ids:Object.keys(profiles)};
})();
