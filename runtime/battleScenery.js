// Battlefield presentation only. Never persist scene choices in player or battle state.
// @soulbeast-unit 1091-battleScenery
const BattleScenery={
 themes:{
  forest:{mark:'❧',label:'พงไพรแสงจันทร์',scene:2},
  mist:{mark:'☾',label:'หุบเขาหมอกเซียน',scene:3},
  desert:{mark:'◇',label:'สุสานใต้ผืนทราย',scene:4},
  volcano:{mark:'♜',label:'สนามมังกรเพลิง',scene:5},
  ruins:{mark:'✧',label:'ซากสวรรค์',scene:6},
  fortress:{mark:'♜',label:'ป้อมปราการทมิฬ',scene:7},
  boss:{mark:'♜',label:'ห้องผู้พิทักษ์',scene:2},
  arena:{mark:'⚔',label:'ลานประลองผนึก',scene:1},
  throne:{mark:'♛',label:'บัลลังก์จอมมาร',scene:7},
  world:{mark:'✺',label:'สมรภูมิสุริยคราส',scene:7}
 },
 resolve(b={},mode=''){
  const zone=Number(b.meta)||Number(S.zone?.id)||7;
  let key=mode==='world'?'world':mode==='pvp'||b.kind==='npc'||b.towerRun?'arena':mode==='camp'||mode==='guildwar'?'fortress':b.kind==='boss'?(zone===6?'throne':zone===4?'volcano':'boss'):({1:'forest',2:'mist',3:'desert',4:'volcano',5:'ruins',6:'fortress',7:'forest'}[zone]||'forest');
  const theme=this.themes[key];
  const art=key==='boss'?'assets/ui/boss-gates/gate-'+Math.max(1,Math.min(7,zone))+'.webp':BUILTIN_SCENES[theme.scene];
  const label=mode==='camp'?'ค่ายกลางสมรภูมิ':mode==='guildwar'?'สมรภูมิสงครามกิล':b.towerRun?'หอคอยประลอง · ชั้น '+Math.max(1,Number(b.towerFloor)||1):key==='boss'?'ห้องบอส · '+(ZN[zone-1]?.n||'ผู้พิทักษ์'):key==='forest'?(ZN[zone-1]?.n||theme.label):theme.label;
  return {key,art,label,mark:theme.mark};
 },
 attributes(b,mode=''){
  const t=this.resolve(b,mode);
  return ' data-battle-scene="'+t.key+'" style="--battle-art:url(\''+t.art+'\')"';
 },
 decoration(b,mode=''){
  const t=this.resolve(b,mode);
  return '<div class="battle-scenery-title"><span aria-hidden="true">'+t.mark+'</span><small>'+esc(t.label)+'</small><span aria-hidden="true">'+t.mark+'</span></div><span class="battle-scenery-corner corner-nw" aria-hidden="true"></span><span class="battle-scenery-corner corner-ne" aria-hidden="true"></span><span class="battle-scenery-corner corner-sw" aria-hidden="true"></span><span class="battle-scenery-corner corner-se" aria-hidden="true"></span>';
 }
};
// @soulbeast-end 1091-battleScenery
