"""Install the island travel changes onto a downloaded account function."""
import sys
from pathlib import Path

target = Path(sys.argv[1])
raw = target.read_bytes().decode("utf-8")
newline = "\r\n" if "\r\n" in raw else "\n"
source = raw.replace("\r\n", "\n")
body = Path(__file__).with_name("engine-body.js").read_text(encoding="utf-8-sig").strip()
start, end = "/* ISLAND_TRAVEL_ENGINE_START */", "/* ISLAND_TRAVEL_ENGINE_END */"
if start in source:
    lo, hi = source.index(start), source.index(end) + len(end)
    source = source[:lo] + body + source[hi:]
else:
    engine_end = "/* KINGDOM_BOSS_ENGINE_END */"
    dispatch = "return {dispatch(packet){if(/^kingdom_boss_"
    revision = "if(packet?.action==='save'&&ownRow()){"
    if any(source.count(anchor) != 1 for anchor in (engine_end, dispatch, revision)):
        raise ValueError("Account engine integration points have changed")
    source = source.replace(engine_end, engine_end + "\n" + body, 1)
    source = source.replace(
        dispatch,
        "return {dispatch(packet){if(/^island_(depart|exit|boss_reward)$/.test(packet?.action||''))return islandTravel_(packet);if(/^kingdom_boss_",
        1,
    )
    source = source.replace(
        revision,
        "if((packet?.action==='save'||/^island_(depart|exit|boss_reward)$/.test(packet?.action||''))&&ownRow()){",
        1,
    )
target.write_bytes(source.replace("\n", newline).encode("utf-8"))
