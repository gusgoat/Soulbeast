"""Apply team PvP to a copy of the currently deployed account engine."""
import sys
from pathlib import Path

target = Path(sys.argv[1])
raw = target.read_bytes().decode("utf-8")
newline = "\r\n" if "\r\n" in raw else "\n"
source = raw.replace("\r\n", "\n")


def replace(old, new):
    global source
    if source.count(old) != 1:
        raise ValueError(f"Account engine integration point changed: {old[:95]}")
    source = source.replace(old, new, 1)


body = Path(__file__).with_name("room.js").read_text(encoding="utf-8").strip()
if "function pvpJoinTeam_(" not in source:
    replace("function pvpDispatch_(d){try{", body + "\n\nfunction pvpDispatch_(d){try{")
    replace(
        "const a=r.battle.allies[0],b=r.battle.enemies[0];if(a.hp<=0||b.hp<=0){pvpFinish_(r,a.hp<=0&&b.hp<=0?-1:a.hp<=0?1:0,",
        """const defeated=units=>r.mode==='2v2'
  ? !units.some(u=>u.kind==='player'&&!u.temporary&&u.hp>0)
  : units[0].hp<=0;
 const a=defeated(r.battle.allies),b=defeated(r.battle.enemies);
 if(a||b){pvpFinish_(r,a&&b?-1:a?1:0,""",
    )
    replace(
        "if(found)pvpFail_('already in room');const profile=activityPvpTeam_(auth.P,d.action==='pvp_create'?0:1,d.pets),token=pvpToken_();",
        """if(found)pvpFail_('already in room');
  const creating=d.action==='pvp_create',token=pvpToken_();
  if(creating&&d.mode!=null&&!['1v1','2v2'].includes(d.mode))pvpFail_('bad pvp mode');
  const opened=creating?null:pvpRead_(String(d.room||'').toUpperCase());
  if(opened?.r.mode==='2v2'){
   const {r,row}=opened;
   if(pvpExpire_(r)){pvpWrite_(r,row);pvpFail_('room expired')}
   return pvpJoinTeam_(r,row,auth,token,d);
  }
  const profile=activityPvpTeam_(auth.P,creating?0:1,d.pets);""",
    )
    replace("const r={id,ruleVersion:2,status:'waiting'", "const r={id,mode:d.mode==='2v2'?'2v2':'1v1',ruleVersion:2,status:'waiting'")
    replace("gold:profile.gold,ready:false}],battle:{allies:profile.team", "gold:profile.gold,side:0,ready:false}],battle:{allies:profile.team")
    replace("battle:{allies:profile.team,enemies:[],round:0,turns:0", "battle:{teamPvp:d.mode==='2v2',allies:profile.team,enemies:[],round:0,turns:0")
    replace("return b.kind==='world'&&u.side==='ally'?list.filter", "return (b.teamPvp||b.kind==='world'&&u.side==='ally')?list.filter")
    replace("battleSlotGroup(u,b).filter(x=>x.hp>0).length<4",
            "battleSlotGroup(u,b).filter(x=>x.hp>0||b.teamPvp&&x.kind==='player'&&!x.temporary).length<4")
    replace("if(group.filter(x=>x.hp>0).length>=4)return false;",
            "if(!battleHasRoom(u,b))return false;")
    replace("const old=group.find(x=>x.hp<=0);",
            "const old=group.find(x=>x.hp<=0&&(!b.teamPvp||x.kind!=='player'||x.temporary));")
    replace("const hero=sideOf(u).find(x=>x.kind==='player');if(hero&&['sealmaster','spiritlord']",
            "const hero=sideOf(u).find(x=>x.kind==='player'&&(!B()?.teamPvp||x.owner===u.owner));if(hero&&['sealmaster','spiritlord']")
    replace("const {r,row}=pvpRead_(String(d.room||'').toUpperCase());if(pvpExpire_(r))", "const {r,row}=opened;if(pvpExpire_(r))")
    replace("room:{wagers:stakeView_(r),id:r.id,status:r.status", "room:{mode:r.mode||'1v1',side:pvpSide_(r,seat),wagers:r.mode==='2v2'?null:stakeView_(r),id:r.id,status:r.status")
    replace("ready:!!p.ready&&p.wagerConfirmed===stakeRead_(r.id).rev,auto:!!p.auto", "side:p.side??r.players.indexOf(p),ready:!!p.ready&&(r.mode==='2v2'||p.wagerConfirmed===stakeRead_(r.id).rev),auto:!!p.auto")
    replace("if(r.status==='finished')stakeSettle_(r);", "if(r.status==='finished'&&r.mode!=='2v2')stakeSettle_(r);")
    replace("if(d.action==='pvp_wager'){stakeOffer_", "if(d.action==='pvp_wager'){if(r.mode==='2v2')pvpFail_('pvp no wagers');stakeOffer_")
    replace("r.status==='active'&&r.players.length===2?1-seat:-1", "r.status==='active'?1-pvpSide_(r,seat):-1")
    replace("const wagerRev=stakeSyncReady_(r);if(Number(d.wagerRev||0)!==wagerRev)pvpFail_('stake changed');r.players[seat].wagerConfirmed=wagerRev;",
            "if(r.mode!=='2v2'){const wagerRev=stakeSyncReady_(r);if(Number(d.wagerRev||0)!==wagerRev)pvpFail_('stake changed');r.players[seat].wagerConfirmed=wagerRev;}")
    replace("friend.owner!==seat||(friend.hp<=0&&!sk.rev&&!sk.revAll)", "friend.side!==u.side||(friend.hp<=0&&!sk.rev&&!sk.revAll)")
    replace("!target||target.owner===seat||target.hp<=0", "!target||target.side===u.side||target.hp<=0")
    replace("stakeSettle_(r);communityClosePvpInvite_(r);", "if(r.mode!=='2v2'){stakeSettle_(r);communityClosePvpInvite_(r);}")
    replace("const enemies=[...(seat===0?r.battle.enemies:r.battle.allies),...(r.battle.retiredUnits||[]).filter(u=>u.side===(seat===0?'enemy':'ally'))];",
            "const side=pvpSide_(r,seat);const enemies=[...(side===0?r.battle.enemies:r.battle.allies),...(r.battle.retiredUnits||[]).filter(u=>u.side===(side===0?'enemy':'ally'))];")
if "if(d.action==='pvp_team')" not in source:
    start = source.index("// Team matches share the duel engine.")
    end = source.index("function pvpDispatch_(d){try{", start)
    source = source[:start] + body + "\n\n" + source[end:]
    replace("side:pvpSide_(r,seat),wagers:", "side:pvpSide_(r,seat),teamRevision:r.teamRevision||0,teamSwap:r.teamSwap||null,wagers:")
    replace(" if(d.action==='pvp_wager'){", " if(d.action==='pvp_team'){pvpChangeTeam_(r,seat,d);pvpWrite_(r,row);return pvpView_(r,seat)}\n if(d.action==='pvp_wager'){")
    replace("if(d.action==='pvp_ready'){if(r.mode!=='2v2')", "if(d.action==='pvp_ready'){if(r.mode==='2v2'&&(d.teamRevision??0)!==(r.teamRevision||0))pvpFail_('pvp teams changed');if(r.mode!=='2v2')")
    replace("if(r.players.every(p=>p.ready)){r.status='active';r.expires=Date.now()+PVP_ROOM_MS;",
            "if(r.players.every(p=>p.ready)){delete r.teamSwap;r.status='active';r.expires=Date.now()+PVP_ROOM_MS;")
target.write_bytes(source.replace("\n", newline).encode("utf-8"))
