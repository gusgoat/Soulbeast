// Derive presentation from the game's catalog, so future actors do not need hand-picked element colors.
module.exports=function motionIdentity(actor,catalog){
 const player=actor.kind==='player',weapon=player?require('./unit-motion-class-weapon.cjs')(catalog.classes,actor.cls):null;
 const transformed=actor.kind==='transform',sealer=player||transformed;
 if(player&&actor.poseAssets?.melee&&(!weapon||actor.meleeWeapon!==weapon))throw Error('Melee art must match class weapon: '+actor.id+' / '+weapon);
 const species=actor.species||actor.id;
 const types=player?[]:(transformed?catalog.forms?.[actor.id]?.t:catalog.beasts[species]?.t)||['normal'];
 const colors=sealer?['#fff5df','#eac56b']:[...new Set(types.map(t=>catalog.elements[t]?.c).filter(Boolean))];
 if(!colors.length)colors.push(catalog.elements.normal.c);
 const beast=catalog.beasts[species],lastForm=beast?.ev?.length||0;
 const finalForm=(Number(actor.form)||0)===lastForm;
 const particles=sealer||!!(beast&&species!=='demonlord'&&finalForm&&(beast.rare||beast.legendary||beast.solar||lastForm===2));
 const particleReason=player?'ผู้ผนึก':transformed?'ผู้ผนึกในร่างแปลง':!beast?'ไม่มีข้อมูลอสูร':species==='demonlord'?'ไม่อยู่ในกลุ่มที่กำหนด':!finalForm?'ยังไม่ใช่ร่างสุดท้าย':particles?'ระดับและร่างที่กำหนด':'อสูรทั่วไป 1–2 ร่าง';
 return {weapon,types,colors,particles,particleReason,lastForm};
};
