// Battlefield presentation only. Never persist scene choices in player or battle state.
// @soulbeast-unit 1091-battleScenery
const BattleScenery={
 themes:{
  training:{mark:'❧',label:'ลานป่าฝึกหัด'},
  forest:{mark:'❧',label:'พงไพรแสงจันทร์'},
  mist:{mark:'☾',label:'หุบเขาหมอกเซียน'},
  desert:{mark:'◇',label:'สุสานใต้ผืนทราย'},
  volcano:{mark:'♜',label:'สนามมังกรเพลิง'},
  ruins:{mark:'✧',label:'ซากสวรรค์'},
  fortress:{mark:'♜',label:'ป้อมปราการทมิฬ'},
  boss:{mark:'♜',label:'ห้องผู้พิทักษ์'},
  arena:{mark:'⚔',label:'ลานประลองผนึก'},
  throne:{mark:'♛',label:'บัลลังก์จอมมาร'},
  world:{mark:'✺',label:'สมรภูมิสุริยคราส'}
 },
 resolve(b={},mode=''){
  const zone=Number(b.meta)||Number(S.zone?.id)||7;
  let key=mode==='world'?'world':mode==='pvp'||b.kind==='npc'||b.towerRun?'arena':mode==='camp'||mode==='guildwar'?'fortress':b.kind==='boss'?(zone===7?'training':zone===6?'throne':zone===4?'volcano':'boss'):({1:'forest',2:'mist',3:'desert',4:'volcano',5:'ruins',6:'fortress',7:'training'}[zone]||'forest');
  const theme=this.themes[key];
  const art='assets/ui/battle-scenes/'+key+'-v2.webp';
  const label=mode==='camp'?'ค่ายกลางสมรภูมิ':mode==='guildwar'?'สมรภูมิสงครามกิล':b.towerRun?'หอคอยประลอง · ชั้น '+Math.max(1,Number(b.towerFloor)||1):key==='boss'?'ห้องบอส · '+(ZN[zone-1]?.n||'ผู้พิทักษ์'):key==='forest'?(ZN[zone-1]?.n||theme.label):theme.label;
  return {key,art,label,mark:theme.mark};
 },
 attributes(b,mode=''){
  const t=this.resolve(b,mode);
  return ' data-battle-scene="'+t.key+'" style="--battle-art:url(\''+t.art+'\')"';
 },
 decoration(){
  // Leave the battlefield header area free for combat cards.
  return '';
 }
};
// @soulbeast-end 1091-battleScenery
