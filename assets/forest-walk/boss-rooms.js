import {BOSS_ROOM_FRAMES} from './boss-room-frames.js?v=all-boss-rooms-2';
import {BOSS_STATUE_FRAMES} from './boss-statue-frames.js?v=boss-statues-1';
import {forestSceneAssetURL} from './storage-assets.js?v=desert-release-1';
export const BOSS_ROOM_THEMES=Object.freeze([
  {theme:'training',zone:7,name:'ป่าฝึกหัด',boss:'หัวหน้าฝูงแจ็กคาโลป',level:5,walking:true,color:'#283c27',motif:'ไม้เก่า หิน และตราเขากวาง'},
  {theme:'moonlight',zone:1,name:'ป่าแสงจันทร์',boss:'ราชาทานุกิ',level:9,walking:true,color:'#182d40',motif:'รากไม้ หินเก่า และตราจันทร์'},
  {theme:'mist',zone:2,name:'หุบเขาหมอกเซียน',boss:'จิ้งจอกพันปี',level:17,walking:false,color:'#283c3b',motif:'ศาลเจ้าไม้แดง หยก และกระดิ่ง'},
  {theme:'desert',zone:3,name:'ทะเลทรายสุสานทอง',boss:'สฟิงซ์ผู้เฝ้าสุสาน',level:25,walking:true,color:'#4a3c2a',motif:'หินทราย ทองเก่า และลวดลายสุสาน'},
  {theme:'dragon',zone:4,name:'ยอดเขามังกรหลับ',boss:'มังกรเพลิงโบราณ',level:37,walking:true,color:'#302b30',motif:'หินบะซอลต์ โลหะเก่า และเกล็ดมังกร'},
  {theme:'heaven',zone:5,name:'แดนสวรรค์ล่มสลาย',boss:'นีดฮ็อกผู้กัดกินรากโลก',level:50,walking:true,color:'#363243',motif:'หินสีงาช้าง ทองหม่น และรากโลก'},
  {theme:'demon',zone:6,name:'ปราสาทจอมมาร',boss:'จอมมารผู้ครองรัตติกาล',level:60,walking:true,color:'#281f2b',motif:'หินทมิฬ เหล็กแดงดำ และตรามงกุฎปีก'},
  {theme:'binding',zone:8,name:'ป่าทมิฬพันธนาการ',boss:'เฟอร์รอธ และมอร์ทิวาร์',level:60,walking:false,color:'#24322d',motif:'ป้อมเหล็กดำ รากไม้ตาย โซ่พันธนาการ และตรากุญแจวิญญาณ'}
]);
const images=new Map();
export function bossRoomParts(theme,art){
  const frames=BOSS_ROOM_FRAMES[theme];if(!frames)throw Error('Unknown boss-room theme: '+theme);
  const x=1.05,z=-11.9,parts=[];
  function add(cell,dx,dz,width,extra={}){
    const source=frames[cell],part={kind:'training-prop',art,source,x:x+dx,z:z+dz,width,pivot:1,layered:true,bossRoom:true,...extra};
    if(part.height)part.width=part.height*source[2]/source[3];parts.push(part);return part;
  }
  add(0,0,-1.8,24,{ground:true,pivot:.5});
  add(1,0,3,18);
  add(2,-8,1,0,{height:14,radius:2.3});
  add(3,8,1,0,{height:14,radius:2.3});
  add(4,0,1.5,18.5,{elevation:4.2});
  add(5,0,2.8,0,{height:11.5,radius:3.2,closedDoor:true});
  // Fill the facade between the central door and outer piers without blocking
  // the existing 4.4-world-unit boss contact on the approach steps.
  for(const side of [-1,1])parts.push({kind:'training-prop',art,x:x+side*5.6,z:z+2.8,radius:2.4,renderHidden:true,bossRoom:true});
  for(const [index,side] of [-1,1].entries()){
    const source=BOSS_STATUE_FRAMES[theme][index],width=Math.min(6.3,8.8*source[2]/source[3]);
    parts.push({kind:'training-prop',art:'boss-statues-'+theme,source,x:x+side*9.9,z:z-4,width,pivot:1,radius:1.6,layered:true,bossRoom:true,bossStatue:side<0?'left':'right'});
  }
  return parts;
}
export async function bossRoomScenery(theme){
  const art='boss-room-'+theme,statues='boss-statues-'+theme;
  const load=(key,folder)=>{
    if(!images.has(key))images.set(key,new Promise((resolve,reject)=>{
      const im=new Image();im.crossOrigin='anonymous';im.onload=()=>resolve(im);im.onerror=()=>{images.delete(key);reject(Error('Boss room PNG failed: '+key));};
      im.src=forestSceneAssetURL(folder,theme);
    }));
    return images.get(key);
  };
  const [roomImage,statueImage]=await Promise.all([load(art,'boss-rooms'),load(statues,'boss-statues')]);
  return {tiles:{[art]:roomImage,[statues]:statueImage},props:bossRoomParts(theme,art)};
}
