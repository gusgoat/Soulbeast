// Startup and host lifecycle
// Build-time module: shared legacy scope; execution order is in manifest.json.
// @soulbeast-unit 0491-boot

function boot(data){if(data&&data.S){S=data.S;try{const t=localStorage.getItem(SAVEIMG);if(t)IMG=JSON.parse(t)||{}}catch(e){}}else load();
 S.ui=S.ui||{};S.ui.confirm=null;migrate();
 if(S.battle&&S.battle.v!==4){S.battle=null;S.screen=S.zone?'zone':'town'}
 if(S.zone&&(S.zone.depth==null||(S.zone.fork&&typeof S.zone.fork[0]==='string'))){S.zone.depth=S.zone.depth||0;S.zone.log=S.zone.log||[];S.zone.ev=null;newFork()}
 if(S.zone&&!S.zone.fork&&!S.zone.ev&&S.zone.depth<ZDEPTH&&!S.battle)newFork();
 const resume=()=>{render();cloudInit();if(S.screen==='world')wbCall(WORLD.roomId?'wb_poll':'wb_status');if(S.screen==='pvp')pvpSchedule();
 const b=S.battle;if(b&&!b.over){const u=b.cur&&uById(b.cur);if(!u||u.side==='enemy'||b.menu==='wait'){if(u&&u.side==='ally'&&!teamAutoUnit(u)){b.menu='main';render()}else battleLater(u?aiAct:advance,600)}}};
 if(!WEB_INTRO.open(resume,!!data?.accountEntry,!!data?.accountEntry))resume();}
// @soulbeast-end 0491-boot
// @soulbeast-unit 1076-ExpressionStatement


window.claude?.hot?.snapshot?.(()=>({S}));
// @soulbeast-end 1076-ExpressionStatement
// @soulbeast-unit 1077-ExpressionStatement

window.claude?.hot?.ready?window.claude.hot.ready(boot):boot(window.claude?.hot?.data??{});
// @soulbeast-end 1077-ExpressionStatement
