import {createActor} from './world-actors.mjs?v=live-siege-20261124';

const publishedRoot='https://zycmmtvubzyxduxqpuzl.supabase.co/storage/v1/object/public/soulbeast-game-assets/';
// Published Blender models live in Storage, including when playing a local copy.
// Local worktrees do not contain the large GLB files.
const modelRoot=publishedRoot;
// Exact repaired Blender sources used for the approved eight-view siege sprites.
const siegeRevisions=Object.freeze({"swordsman-female":"colosseum-models/siege-skin-v2-20261124/swordsman-female-771cd0e7ed52.glb","shogun-female":"colosseum-models/siege-skin-v2-20261124/shogun-female-65d3ffd63b8c.glb","sbwar-female":"colosseum-models/siege-skin-v2-20261124/sbwar-female-50065d3c98a5.glb","bloodwar-female":"colosseum-models/siege-skin-v2-20261124/bloodwar-female-a4cfa9b8e6a6.glb","archer-female":"colosseum-models/siege-skin-v2-20261124/archer-female-c1925861f47a.glb","archer-male":"colosseum-models/siege-skin-v2-20261124/archer-male-811b4b794b1b.glb","dirge-male":"colosseum-models/siege-skin-v2-20261124/dirge-male-65f3afb1b1a8.glb","artillery-female":"colosseum-models/siege-skin-v2-20261124/artillery-female-45a1e3ebff4e.glb","artillery-male":"colosseum-models/siege-skin-v2-20261124/artillery-male-da4c4a6736df.glb"});
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

export function hasActor(key,{beast=false}={}){
 return /^[a-z0-9_-]+$/.test(key)&&(!beast||Object.hasOwn(beasts,aliases[key]||key));
}

export function loadActor(key,{beast=false,primary=false}={}){
 if(beast)key=aliases[key]||key;
 if(!/^[a-z0-9_-]+$/.test(key)||beast&&!Object.hasOwn(beasts,key))throw new Error('Unknown 3D actor '+key);
 const url=modelRoot+(!beast&&siegeRevisions[key]||((beast?'beast-':'')+key+'-v1.glb'));
 return createActor(url,{beast,primary,actorKey:key});
}
