// Presentation only: IDs come from the existing secret, riddle and tale plans.
// Scenery is deterministic and never consumes the encounter RNG.
const TrainingForestScenes = (() => {
  const profiles = {
    firstpact: ["ลานสัญญาแรก", "pact", "shrine", "#f1ce83"],
    training: ["สหายน้อยข้างเกวียน", "wagon", "sign", "#e6bd80"],
    "training-bells": ["ศาลาระฆังนับก้าว", "bells", "shrine", "#e8d688"],
    "training-footprints": ["ประตูรอยเท้าคู่หู", "footprints", "gate", "#9cdbce"],
    "training-thorns": ["เถาวัลย์หิวแสง", "vines", "shrine", "#b9d98e"],
    "training-poison": ["หมอกเห็ดสลับสี", "mushrooms", "shrine", "#c3ade8"],
    "training-0": ["กระดิ่งในพุ่มไม้", "bells", "chest", "#f2d496"],
    "training-1": ["ยาที่ตกอยู่บนทางแยก", "medicine", "sign", "#8bd8ba"],
    "training-2": ["จดหมายที่เด็กไม่กล้าส่ง", "letter", "sign", "#edca9c"],
    "training-3": ["บ้านสำหรับผู้ที่กลับไปไม่ได้", "home", "gate", "#b7dab1"],
    "encounter-7": ["เสียงเรียกจากตะกร้า", "basket", "sign", "#dfbe86"],
    "after-training": ["วันที่ต้องปล่อยมือ", "pact", "shrine", "#c0d9e0"],
    villager: ["ชาวบ้านข้างทาง", "camp", "sign", "#e4c18a"],
    boss: ["ห้องบอส · หัวหน้าฝูงแจ็กคาโลป", "arena", "gate", "#eac17e"]
  };
  function describe(id = "villager") {
    if (id.startsWith("after:")) id = "after-training";
    const [title, motif, landmark, color] = profiles[id] || profiles.villager;
    return {id, title, motif, landmark, color};
  }
  function selected(zone, door) {
    if (door.k === "secret") return describe(zone.secretRun?.location || "firstpact");
    if (door.k === "specialEvent") return describe("training");
    if (door.k.startsWith("riddle")) return describe(zone.riddleRun?.[door.k === "riddleReward" ? "reward" : "hazard"]?.id);
    if (door.k === "taleEvent") return describe("encounter-7");
    if (door.k === "taleFollow") return describe(zone.storyRun?.used?.startsWith("quest:") ? zone.storyRun.used.slice(6) : zone.storyRun?.selected?.id || "villager");
    return describe("villager");
  }
  function session(zone) {
    if (zone.secretSession) return describe(zone.secretSession.id);
    if (zone.specialSession) return describe("training");
    if (zone.riddleSession) return describe(zone.riddleSession.id);
    if (zone.taleSession) return describe(zone.taleSession.id || zone.taleSession.followId || "villager");
    return null;
  }
  return {describe, selected, session, ids: Object.keys(profiles)};
})();
