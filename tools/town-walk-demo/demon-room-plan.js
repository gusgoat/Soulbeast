// Presentation only. Never draws gameplay RNG or changes native event selection.
(function(g){
 if(g.DemonCastleRooms)return;
 const names={basement:'ห้องใต้ดิน',prison:'คุก',music:'ห้องแสดงดนตรี',dining:'ห้องอาหาร',lounge:'ห้องนั่งเล่น',armory:'คลังอาวุธ',laboratory:'ห้องทดลองเวทมนตร์',ritual:'ห้องประกอบพิธีกรรม',library:'ห้องสมุด',banquet:'ห้องจัดงานเลี้ยง',treasury:'ห้องสมบัติ',throne:'ท้องพระโรง'};
 const events={pandemonium:'basement',castle:'basement','castle-mirrors':'treasury','castle-chains':'treasury','castle-banquet':'banquet','castle-hounds':'basement','castle-0':'prison','castle-1':'dining','castle-2':'library','castle-3':'prison','encounter-6':'ritual','after-castle':'lounge',villager:'lounge',boss:'throne'};
 const maps={bandit:'armory',stranger:'lounge',shrine:'ritual',spring:'laboratory',revival:'ritual',cleanse:'laboratory',village:'lounge',hospital:'laboratory',bush:'treasury',mist:'music',ruins:'library',exit:'basement'};
 function stepFor(depth,walk){if(walk?.map==='boss')return 10;if(walk?.map==='entrance'&&!depth)return 0;return Math.max(1,Number(depth||0)+(walk?.phase==='pending'?1:0));}
 function roomFor(map,scene,step){if(map==='boss')return 'throne';if(step<4)return null;if(scene?.id&&events[scene.id])return events[scene.id];if(map==='footprints')return ['armory','basement','dining'][Math.abs(step)%3];return maps[map]||'lounge';}
 const api={names,events,stepFor,roomFor,ids:Object.keys(names)};g.DemonCastleRooms=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
