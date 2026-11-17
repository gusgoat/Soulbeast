import {createActor} from './world-actors.mjs?v=1';

const publishedRoot='https://zycmmtvubzyxduxqpuzl.supabase.co/storage/v1/object/public/soulbeast-game-assets/';
const local=/^(?:localhost|127\.0\.0\.1)$/.test(location.hostname);
const modelRoot=local?new URL('./models/',import.meta.url).href:publishedRoot;
const beasts=Object.freeze({
 cerberus:'เซอร์เบอรัส',crystal_stag:'กวางผลึก',crystalbloom_stag:'กวางผลึกบุปผา',
 frost_lich:'ลิชน้ำแข็ง',golden_kirin:'กิเลนทอง',infernal_hydra:'ไฮดราเพลิง',
 legend2_tricephalos:'ไตรเซฟาลอส',moon_wolf:'หมาป่าจันทรา',solar_lion:'สิงห์สุริยัน',vampire_queen:'ราชินีแวมไพร์',
 wendigo:'เวนดิโก',western_dragon:'มังกรตะวันตก',white_tiger:'เสือขาว'
});
const actors=Object.keys(beasts);
const aliases={
 'crystal-stag':'crystal_stag','golden-kirin':'golden_kirin','infernal-hydra':'infernal_hydra',
 'solar-lion':'solar_lion','white-tiger':'white_tiger','western-dragon':'western_dragon',
 'frost-lich':'frost_lich','vampire-queen':'vampire_queen',
 moonwolf:'moon_wolf',eclipse_wolf:'moon_wolf',qilin:'golden_kirin',baihu:'white_tiger',
 tricephalos:'legend2_tricephalos',pentapyros:'infernal_hydra',
 solar_pentadrake:'infernal_hydra',solar_cryostag:'crystal_stag',solar_sovereign:'solar_lion',
};

export function roster(catalog){
 return [
  ...Object.entries(catalog).flatMap(([cls,entry])=>['female','male'].map(gender=>({
   key:cls+'-'+gender,label:entry.name+' · '+(gender==='female'?'หญิง':'ชาย'),cls,gender,
  }))),
  ...actors.map(key=>({key,beast:true,label:beasts[key]}))
 ];
}

export function loadActor(key,{beast=false,primary=false}={}){
 if(beast)key=aliases[key]||key;
 if(!/^[a-z0-9_-]+$/.test(key)||beast&&!Object.hasOwn(beasts,key))throw new Error('Unknown 3D actor '+key);
 const url=modelRoot+(beast?'beast-':'')+key+'-v1.glb';
 return createActor(url,{beast,primary});
}
