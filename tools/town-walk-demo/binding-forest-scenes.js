// Zone 8 presentation. All encounter selection, costs and rewards remain native.
const BindingForestScenes=(()=>{
 const profiles={
  ironreliquary:['คลังสุริยคราสใต้รากเหล็ก','reliquary','gate'],
  'iron-wagon':['รถช่างใต้รากเหล็ก','wagon','sign'],
  'iron-bells':['ระฆังสามเสียง','bells','shrine'],
  'iron-chains':['โซ่ตราสุริยัน','chains','gate'],
  'iron-fog':['หมอกที่หนักกว่าอากาศ','fog','sign'],
  'iron-hounds':['ฝูงล่าประกายไฟ','hounds','gate'],
  'iron-bridge':['สะพานที่ยังมีคนรอ','bridge','sign'],
  'iron-roots':['เสียงใต้รากพันธนาการ','roots','sign'],
  'iron-bell':['ระฆังที่ลืมเสียงตนเอง','bells','sign'],
  'iron-memories':['ชื่อที่ไม่ควรถูกหลอม','memories','sign'],
  'encounter-8':['หัวใจเตาที่ไม่ยอมดับ','forge','shrine'],
  'after-iron':['ผู้รอดชีวิตใต้รากเหล็ก','settlement','sign'],
  villager:['นักเดินทางในป่าเหล็กดำ','camp','sign'],
  boss:['ห้องบอส · เฟอร์รอธและมอร์ทิวาร์','boss','gate']
 };
 function describe(id='villager'){if(id.startsWith('after:'))id='after-iron';const [title,kit,landmark]=profiles[id]||profiles.villager;return {id,title,kit,landmark,color:'#b7c9be'};}
 function selected(zone,door){if(door.k==='secret')return describe(zone.secretRun?.location||'ironreliquary');if(door.k==='specialEvent')return describe('iron-wagon');if(door.k.startsWith('riddle'))return describe(zone.riddleRun?.[door.k==='riddleReward'?'reward':'hazard']?.id);if(door.k==='taleEvent')return describe('encounter-8');if(door.k==='taleFollow')return describe(zone.storyRun?.used?.startsWith('quest:')?zone.storyRun.used.slice(6):zone.storyRun?.selected?.id||'villager');return describe();}
 function session(zone){if(zone.secretSession)return describe(zone.secretSession.id);if(zone.specialSession)return describe('iron-wagon');if(zone.riddleSession)return describe(zone.riddleSession.id);if(zone.taleSession)return describe(zone.taleSession.id||zone.taleSession.followId||'villager');return null;}
 return {describe,selected,session,ids:Object.keys(profiles)};
})();
