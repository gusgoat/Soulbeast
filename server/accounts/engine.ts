// @ts-nocheck
// Soulbeast Supabase API. Version 10 migration engine with tested 2026-10-17 balance update.
import {withSupabase} from 'jsr:@supabase/server@^1';
import {sha256} from 'npm:@noble/hashes@1.8.0/sha256';
// Request-local workbook compatibility layer. All persistence is in PostgreSQL.
function createWorkbook(input = {}) {
 const tables = structuredClone(input), before = JSON.stringify(tables), handles = new Map();
 function sheet(name, create = false) {
  if (!Object.hasOwn(tables, name)) { if (!create) return null; tables[name] = []; }
  if (handles.has(name)) return handles.get(name);
  const rows = tables[name], sh = {
   appendRow(row) { rows.push(row.slice()); return sh; },
   setFrozenRows() { return sh; }, getLastRow() { return rows.length; },
   deleteRow(index) { rows.splice(index - 1, 1); return sh; },
   getDataRange() { return { getValues: () => structuredClone(rows) }; },
   getRange(r,c,n=1,m=1) { const range = {
    getValues: () => Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>rows[r-1+i]?.[c-1+j]??'')),
    getValue: () => rows[r-1]?.[c-1]??'',
    setFontWeight() { return range; },
    setValues(values) { values.forEach((row,i)=>{rows[r-1+i]??=[];row.forEach((v,j)=>rows[r-1+i][c-1+j]=v);}); return range; },
   };return range; }
  }; handles.set(name,sh);return sh;
 }
 return {
  SpreadsheetApp: {getActiveSpreadsheet:()=>({getSheetByName:n=>sheet(n),insertSheet:n=>sheet(n,true)})},
  tables,
  changes() { const out={};for(const [name,rows] of Object.entries(tables))if(JSON.stringify(rows)!==JSON.stringify(input[name]))out[name]=rows;return out; },
  unchanged: () => before===JSON.stringify(tables),
 };
}

function createUtilities(hashBytes, randomUUID) {
 const encoder=new TextEncoder(),decoder=new TextDecoder();
 return {
  DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},getUuid:randomUUID,
  computeDigest:(_,text)=>Array.from(hashBytes(String(text))),
  base64Encode(value) { const bytes=typeof value==='string'?encoder.encode(value):new Uint8Array(value);let raw='';for(let i=0;i<bytes.length;i+=8192)raw+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(raw); },
  base64Decode(value) { return Uint8Array.from(atob(value),c=>c.charCodeAt(0)); },
  newBlob(value) { return {getDataAsString:()=>decoder.decode(typeof value==='string'?encoder.encode(value):new Uint8Array(value))}; },
 };
}

function createEngine(workbook, Utilities) {
const SpreadsheetApp=workbook.SpreadsheetApp;
const ContentService={MimeType:{JSON:'json'},createTextOutput:t=>({setMimeType(){return {getContent:()=>t};}})};
let held=false;const LockService={getScriptLock:()=>({tryLock(){held=true;return true},hasLock:()=>held,releaseLock(){held=false;}})};
/**
 * "ตำนานผนึกอสูร" — กระดานคะแนน + เซฟเกม บน Google Sheet
 * ติดตั้ง: Extensions → Apps Script → วางโค้ดนี้ทั้งหมดทับของเดิม → บันทึก
 * อัปเดตโดยไม่เปลี่ยน URL: Deploy → Manage deployments → ไอคอนดินสอ → Version: New version → Deploy
 * (ติดตั้งครั้งแรก: Deploy → New deployment → Web app · Execute as: Me · Who has access: Anyone)
 */
const LB_SHEET = 'Leaderboard';
const LB_HEAD = ['id', 'ชื่อตัวละคร', 'classKey', 'อาชีพ', 'เลเวล', 'EXP', 'ด่านไกลสุด (เลข)', 'ด่านไกลสุด',
                 'อสูรที่ค้นพบ', 'อสูรที่จับได้', 'ของในตำนาน', 'ปราบจอมมาร (ครั้ง)', 'อัปเดตล่าสุด', 'คะแนนสะสม', 'รูปโปรไฟล์', 'gender'];
const SV_SHEET = 'Saves';
const SV_HEAD = ['รหัสผู้เล่น', 'PIN (เข้ารหัส)', 'ชื่อตัวละคร', 'อาชีพ', 'เลเวล', 'บันทึกล่าสุด', 'data1', 'data2', 'data3', 'data4', 'data5'];
const CHUNK = 45000;   // เซลล์หนึ่งรับได้ 50,000 ตัวอักษร
const MAX_CHUNKS = 5;
const API_VERSION = 3;

function sheet_(name, head) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(head);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, head.length).setFontWeight('bold');
  }

  return sh;
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(Object.assign({ apiVersion: API_VERSION, genderVersion: 1, mistVersion: 1, communityVersion: 1, rarityVersion: 1, onlineVersion: 1 }, obj))).setMimeType(ContentService.MimeType.JSON);
}
function text_(v, max) {                       // กันสูตร: ขึ้นต้นด้วย = + - @ จะเติม ' ข้างหน้า
  let s = String(v == null ? '' : v).slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}
function num_(v, max) { return Math.max(0, Math.min(max, Math.floor(Number(v) || 0))); }
function findRow_(sh, key) {
  const last = sh.getLastRow();
  if (last < 2) return -1;
  const keys = sh.getRange(2, 1, last - 1, 1).getValues().map(r => String(r[0]));
  const i = keys.indexOf(key);
  return i < 0 ? -1 : i + 2;
}
function hash_(code, pin) {
  if (!pin) return '';
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, code + ':' + pin);
  return bytes.map(b => ('0' + (b & 255).toString(16)).slice(-2)).join('');
}

/** อ่านกระดานคะแนน (ไม่ส่ง id เต็มออกไป) */
function doGet() { onlineResetIO_();
  const values = sheet_(LB_SHEET, LB_HEAD).getDataRange().getValues();
  values.shift();
  const rows = values.filter(r => {if(!r[0])return false;try{communityLeaderboardAllowed_(r[0]);return true;}catch(e){return false;}}).map(r => ({
    pid: String(r[0]).slice(-6), name: String(r[1]).replace(/^'/, ''), cls: r[2], clsName: r[3],
    level: Number(r[4]) || 0, exp: Number(r[5]) || 0, zone: Number(r[6]) || 0, zoneName: r[7],
    seen: Number(r[8]) || 0, caught: Number(r[9]) || 0, legend: Number(r[10]) || 0, clears: Number(r[11]) || 0,
    updated: r[12],score:Number(r[13])||0,profile:profileImage_(r[14]),gender:['male','female'].includes(r[15])?r[15]:undefined
  }));
  return json_({ ok: true, rows, pvpVersion: 1, pvpRules: {turnSeconds:0,maxTurns:60,items:false} });
}

function doPost(e) { onlineResetIO_();
  const lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(10000)) return json_({ok:false,error:'busy'});
    const d = JSON.parse(e && e.postData && e.postData.contents || '{}');
    if (!d || typeof d !== 'object' || Array.isArray(d)) return json_({ok:false,error:'bad data'});
    if(String(d.action||'').startsWith('guild_'))return json_(guildDispatch_(d));if(d.code)communityAllowed_(code_(d.code));if(d.id)communityAllowed_(code_(d.id));
    if(typeof d.action==='string'&&(d.action.indexOf('gacha_')===0))return json_(communityGacha_(d));
    if(typeof d.action==='string'&&(d.action.indexOf('friend_')===0||d.action==='social_sync'))return json_(communitySocial_(d));
    if (typeof d.action === 'string' && d.action.indexOf('wb_') === 0) return json_(wbDispatch_(d));
    if (typeof d.action === 'string' && d.action.indexOf('camp_') === 0) return json_(campDispatch_(d));
    if (typeof d.action === 'string' && d.action.indexOf('pvp_') === 0) return json_(pvpDispatch_(d));
    if (d.action === 'save') return saveGame_(d);
    if (d.action === 'load') return loadGame_(d);
    if (d.action && d.action !== 'delete' && d.action !== 'leaderboard') return json_({ok:false,error:'bad action'});
    return leaderboard_(d);
  } catch (err) {
    return json_({ ok: false, error: err.message||String(err) });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

/* ---------- กระดานคะแนน ---------- */
function leaderboard_(d) {
  const id = String(d.id || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 40);
  if (id.length < 16) return json_({ ok: false, error: 'bad id' });
  const sh = sheet_(LB_SHEET, LB_HEAD), r = findRow_(sh, id);
  if (d.action === 'delete') { if (r > 0) sh.deleteRow(r); return json_({ ok: true }); }
  const row = [id, text_(d.name || 'ผู้ผนึก', 20), text_(d.cls, 20), text_(d.clsName, 30),
    num_(d.lv, 60), num_(d.exp, 1e9), num_(d.zone, 6), text_(d.zoneName, 40),
    num_(d.seen, 500), num_(d.caught, 500), num_(d.legend, 100), num_(d.clear, 1e6), new Date(),num_(d.score,1e12),profileImage_(d.profile),['male','female'].includes(d.gender)?d.gender:''];
  if (r > 0) sh.getRange(r, 1, 1, row.length).setValues([row]); else sh.appendRow(row);
  return json_({ ok: true });
}

/* ---------- เซฟเกม ---------- */
function code_(c) { return String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }

function saveGameBase_(d) {
  const code = code_(d.code), pin = String(d.pin || '').slice(0, 12);
  if (code.length < 12 || code.length > 16) return json_({ ok: false, error: 'bad code' });
  const data = String(d.data || '');
  if (!data || data.length > CHUNK * MAX_CHUNKS) return json_({ ok: false, error: 'too big' });
  const sh = sheet_(SV_SHEET, SV_HEAD), r = findRow_(sh, code);
  let stored = '';
  if (r > 0) {
    stored = String(sh.getRange(r, 2).getValue() || '');
    if (stored && stored !== hash_(code, pin)) return json_({ ok: false, error: 'pin' });
  }
  const newHash = d.newPin != null ? hash_(code, String(d.newPin).slice(0, 12)) : (stored || hash_(code, pin));
  // Keep the existing columns; prefixed base64 makes every new chunk literal text.
  let parsed;
  try { parsed = JSON.parse(data); } catch (err) { return json_({ok:false,error:'bad data'}); }
  if (!parsed || !parsed.P || typeof parsed.P !== 'object' || Array.isArray(parsed.P)) return json_({ok:false,error:'bad data'});
  if (d.newPin != null && d.newPin !== '' && !/^[0-9A-Za-z]{4,12}$/.test(String(d.newPin))) return json_({ok:false,error:'bad pin'});
  // PIN hash stays in its existing column; never store a plaintext PIN inside game data.
  delete parsed.P.cpin;
  const encoded = Utilities.base64Encode(JSON.stringify(parsed), Utilities.Charset.UTF_8);
  const size = CHUNK - 5;
  if (encoded.length > size * MAX_CHUNKS) return json_({ok:false,error:'too big'});
  const chunks = [];
  for (let i = 0; i < MAX_CHUNKS; i++) chunks.push('SB64:' + encoded.slice(i * size, (i + 1) * size));
  const now = new Date();
  const row = [code, newHash, text_(d.name, 20), text_(d.clsName, 30), num_(d.lv, 60), now].concat(chunks);
  if (r > 0) sh.getRange(r, 1, 1, row.length).setValues([row]); else sh.appendRow(row);
  return json_({ ok: true, at: now.getTime(), pin: !!newHash });
}

function loadGameBase_(d) {
  const code = code_(d.code), pin = String(d.pin || '').slice(0, 12);
  const sh = sheet_(SV_SHEET, SV_HEAD), r = findRow_(sh, code);
  if (r < 0) return json_({ ok: false, error: 'notfound' });
  const v = sh.getRange(r, 1, 1, SV_HEAD.length).getValues()[0];
  if (v[1] && String(v[1]) !== hash_(code, pin)) return json_({ ok: false, error: 'pin' });
  const chunks = v.slice(6).map(x => String(x || ''));
  let data = chunks.join('');
  if (chunks[0].indexOf('SB64:') === 0) {
    if (!chunks.every(x => x.indexOf('SB64:') === 0)) return json_({ok:false,error:'bad data'});
    data = Utilities.newBlob(Utilities.base64Decode(chunks.map(x => x.slice(5)).join(''))).getDataAsString('UTF-8');
  }
  return json_({ ok: true, data, at: new Date(v[5]).getTime(), pin: !!v[1] });
}


/* PVP rules copied from the supplied game; run only on room snapshots. */
let S=null;
const B=()=>S.battle;
const Sound={fx(){},skill(){},cry(){}};
function vfx(k,id,o={}){const b=B();if(b&&b.effects.length<40)b.effects.push({k,id,...o})}
function steal(u,t){blog('PVP เป็นการประลอง ไม่ขโมยทรัพย์สินจริง')}

/* ================= CORE STATS ================= */
const K=['hp','mp','patk','matk','pdef','mdef','acc','eva','spd','crit'];
const LBL={hp:'พลังชีวิต (HP)',mp:'พลังเวทย์ (MP)',patk:'โจมตีกายภาพ',matk:'โจมตีเวทย์',pdef:'ป้องกันกายภาพ',mdef:'ป้องกันเวทย์',acc:'ความแม่นยำ',eva:'การหลบหลีก',spd:'ความเร็ว',crit:'โอกาสคริติคอล %'};
const SH={hp:'HP',mp:'MP',patk:'ตีกาย',matk:'ตีเวทย์',pdef:'กันกาย',mdef:'กันเวทย์',acc:'แม่นยำ',eva:'หลบ',spd:'เร็ว',crit:'คริ'};
const PER={hp:8,mp:5,patk:1.5,matk:1.5,pdef:1.5,mdef:1.5,acc:2,eva:1.5,spd:1,crit:.5};
const PB=[60,30,8,8,5,5,90,8,10,5], PG=[6,3,1,1,1,1,1,.8,.6,.1];
const MAXLV=60, FM=[1,1.2,1.4], SKLV=[1,5,11,18], SIGLV=12;
const grow=(k,b)=>({hp:b*.2,mp:b*.12,acc:1.1,eva:.5+b*.03,spd:b*.08,crit:.1})[k] ?? b*.17;

/* ================= ELEMENTS ================= */
const EL={normal:{n:'ปกติ',c:'#b3b28a'},fire:{n:'ไฟ',c:'#ee8130'},water:{n:'น้ำ',c:'#6f9cf3'},grass:{n:'พืช',c:'#7ac74c'},electric:{n:'ไฟฟ้า',c:'#f7d02c'},ice:{n:'น้ำแข็ง',c:'#96d9d6'},
 fighting:{n:'ต่อสู้',c:'#e0564e'},poison:{n:'พิษ',c:'#c060be'},ground:{n:'ดิน',c:'#e2bf65'},flying:{n:'ลม',c:'#a98ff3'},psychic:{n:'จิต',c:'#f95587'},bug:{n:'แมลง',c:'#a6b91a'},
 rock:{n:'หิน',c:'#c4ad4a'},ghost:{n:'ผี',c:'#9a7cc4'},dragon:{n:'มังกร',c:'#8a62ff'},dark:{n:'มืด',c:'#a08470'},steel:{n:'เหล็ก',c:'#b7b7ce'},fairy:{n:'เทพ',c:'#e58fbc'}};
const TC={
 normal:{rock:.5,ghost:.25,steel:.5},
 fire:{fire:.5,water:.5,grass:2,ice:2,bug:2,rock:.5,dragon:.5,steel:2},
 water:{fire:2,water:.5,grass:.5,ground:2,rock:2,dragon:.5},
 grass:{fire:.5,water:2,grass:.5,poison:.5,ground:2,flying:.5,bug:.5,rock:2,dragon:.5,steel:.5},
 electric:{water:2,grass:.5,electric:.5,ground:.25,flying:2,dragon:.5},
 ice:{fire:.5,water:.5,grass:2,ice:.5,ground:2,flying:2,dragon:2,steel:.5},
 fighting:{normal:2,ice:2,poison:.5,flying:.5,psychic:.5,bug:.5,rock:2,ghost:.25,dark:2,steel:2,fairy:.5},
 poison:{grass:2,poison:.5,ground:.5,rock:.5,ghost:.5,steel:.25,fairy:2},
 ground:{fire:2,grass:.5,electric:2,poison:2,flying:.25,bug:.5,rock:2,steel:2},
 flying:{grass:2,electric:.5,fighting:2,bug:2,rock:.5,steel:.5},
 psychic:{fighting:2,poison:2,psychic:.5,dark:.25,steel:.5},
 bug:{fire:.5,grass:2,fighting:.5,poison:.5,flying:.5,psychic:2,ghost:.5,dark:2,steel:.5,fairy:.5},
 rock:{fire:2,ice:2,fighting:.5,ground:.5,flying:2,bug:2,steel:.5},
 ghost:{normal:.25,psychic:2,ghost:2,dark:.5},
 dragon:{dragon:2,steel:.5,fairy:.25},
 dark:{fighting:.5,psychic:2,ghost:2,dark:.5,fairy:.5},
 steel:{fire:.5,water:.5,electric:.5,ice:2,rock:2,steel:.5,fairy:2},
 fairy:{fire:.5,fighting:2,poison:.5,dragon:2,dark:2,steel:.5},
};
const typeMult=(el,types)=>Array.isArray(el)?el.reduce((m,e)=>m*typeMult(e,types),1):!el||!types?1:types.reduce((m,t)=>m*((TC[el]&&TC[el][t])??1),1);

/* ================= STATUSES & PASSIVES ================= */
const STS={
 burn:{n:'ติดไฟ',c:'#ee8130',d:()=>3,info:'เสีย HP 6% ทุกตา'},
 poison:{n:'ติดพิษ',c:'#c060be',d:()=>4,info:'เสีย HP 8% ทุกตา'},
 freeze:{n:'แช่แข็ง',c:'#96d9d6',d:()=>R(2,3),info:'ขยับไม่ได้ แต่ป้องกันเพิ่ม 50% (โดนธาตุไฟจะละลาย)'},
 chill:{n:'เยือกแข็ง',c:'#9ec9e6',d:()=>3,info:'ความเร็วลด 40%'},
 love:{n:'หลงรัก',c:'#f08ab0',d:()=>3,info:'45% เหม่อลอยไม่ยอมโจมตี'},
 sleep:{n:'นอนหลับ',c:'#9a9fd0',d:()=>R(3,5),info:'ข้ามตาจนกว่าจะโดนโจมตีหรือครบ 3–5 ตา'},
 confuse:{n:'มึนงง',c:'#d9b35b',d:()=>3,info:'35% ทำร้ายตัวเองแทนการโจมตี'},
 static:{n:'ไฟฟ้าสถิต',c:'#f7d02c',d:()=>3,info:'ความเร็วลด 30% แม่นยำลด 10%'},
 charm:{n:'มนต์สะกด',c:'#c77ae0',d:()=>2,info:'45% หันไปโจมตีพวกเดียวกัน'},
 para:{n:'อัมพาต',c:'#e2c044',d:()=>4,info:'25% ขยับไม่ได้ในตานั้น'},
};
const IMM={burn:['fire'],freeze:['ice'],chill:['ice'],poison:['poison','steel'],static:['electric'],para:['electric']};
const PAS={
 imm_poison:{n:'ภูมิต้านพิษ',d:'ไม่ติดพิษ',imm:['poison']},
 imm_burn:{n:'กายทนไฟ',d:'ไม่ติดไฟ',imm:['burn']},
 imm_freeze:{n:'เลือดอุ่น',d:'ไม่ติดแช่แข็งและเยือกแข็ง',imm:['freeze','chill']},
 imm_para:{n:'กล้ามเนื้อยืดหยุ่น',d:'ไม่ติดอัมพาตและไฟฟ้าสถิต',imm:['para','static']},
 imm_sleep:{n:'ไม่หลับใหล',d:'ไม่ติดนอนหลับ',imm:['sleep']},
 imm_mind:{n:'จิตแน่วแน่',d:'ไม่ติดมึนงง มนต์สะกด หลงรัก',imm:['confuse','charm','love']},
 rainbow:{n:'บริสุทธิ์ศักดิ์สิทธิ์',d:'ไม่ติดสถานะผิดปกติใด ๆ',imm:Object.keys(STS)},
 nocrit:{n:'เกราะแกร่ง',d:'ไม่โดนคริติคอล'},
 rage:{n:'โทสะ',d:'พลังโจมตี +30% เมื่อ HP ต่ำกว่า 50%'},
 regen:{n:'ฟื้นฟูตนเอง',d:'ฟื้น HP 6% ทุกตา'},
 mpregen:{n:'สมาธิไหลเวียน',d:'ฟื้น MP 8% ทุกตา'},
 thick:{n:'ไขมันหนา',d:'รับดาเมจธาตุไฟและน้ำแข็งครึ่งเดียว'},
 levitate:{n:'ลอยตัว',d:'ลดดาเมจธาตุดิน 75%'},
 sturdy:{n:'อึดทน',d:'ถ้า HP เต็ม จะรอดจากการโจมตีที่ถึงตายด้วย HP 1'},
 swift:{n:'ฝีเท้าไว',d:'ความเร็ว +20%'},
 keen:{n:'สายตาคม',d:'โอกาสคริติคอล +10%'},
 eagle:{n:'ตาเหยี่ยว',d:'ความแม่นยำ +15%'},
 elusive:{n:'พลิ้วไหว',d:'การหลบหลีก +25%'},
 thorns:{n:'ผิวหนาม',d:'สะท้อนดาเมจกายภาพ 15%'},
 thorns2:{n:'ท่าสวนกลับ',d:'สะท้อนดาเมจกายภาพ 40%'},
 poisonTouch:{n:'สัมผัสพิษ',d:'โจมตีกายภาพ 25% ทำให้ติดพิษ'},
 poisonTouch2:{n:'คมพิษร้าย',d:'โจมตีกายภาพ 50% ทำให้ติดพิษ'},
 flameBody:{n:'กายเพลิง',d:'ผู้โจมตีกายภาพ 25% ติดไฟ'},
 staticbody:{n:'ประจุไฟฟ้า',d:'ผู้โจมตีกายภาพ 25% ติดอัมพาต'},
 intimidate:{n:'ข่มขวัญ',d:'เริ่มต่อสู้ ศัตรูทุกตัวโจมตีกายภาพ -20% 3 ตา'},
 lifesteal:{n:'ดูดเลือด',d:'ฟื้น HP 15% ของดาเมจที่ทำได้'},
 adapt:{n:'สายเลือดบริสุทธิ์',d:'ท่าธาตุเดียวกับตัวเองแรงขึ้น 50% แทน 25%'},
 pierce:{n:'ทะลวงเกราะ',d:'เมินป้องกันเป้าหมาย 25%'},
 lucky:{n:'โชคลาภ',d:'ได้เงินจากการต่อสู้ +25%'},
 healer:{n:'ผู้เยียวยา',d:'สกิลรักษาแรงขึ้น 30%'},
 rebirth:{n:'ฟื้นคืนชีพ',d:'ล้มครั้งแรกในการต่อสู้ จะฟื้นด้วย HP 40%'},
 multihit:{n:'หลายเศียร',d:'30% โจมตีซ้ำอีกครั้งด้วยพลังครึ่งหนึ่ง'},
 guardian:{n:'ผู้พิทักษ์',d:'ฝ่ายเดียวกันรับดาเมจลดลง 10%'},
 deadly:{n:'จุดตาย',d:'คริติคอลแรง ×2 แทน ×1.5'},
 sealer:{n:'มือผนึก',d:'โอกาสผนึกอสูรสำเร็จ ×1.5'},
 omni:{n:'หลอมรวมธาตุ',d:'ทุกธาตุได้โบนัสธาตุเดียวกัน'},
};

/* ================= SKILLS ================= */
/* t: p physical | m magic | h hybrid | auto | heal | buff | debuff | status | form | revert | rest
   tg (heal/buff): self | ally | team. all: hits every enemy. hits: repeat. rt: random target per hit.
   st:{status:chance} bf:{stat:amount} tn: turns. ls lifesteal, pi pierce, cb crit bonus, gc gold cost ×Lv,
   steal, gold, self (self-damage %), taunt, rev/revAll, cure, pas (temporary passive) */
const SK={
 attack:{n:'โจมตีปกติ',t:'auto',pw:100},
 rest:{n:'พักฟื้น',t:'rest'},
 revert:{n:'คืนร่างมนุษย์',t:'revert'},
 heal_self:{n:'ฟื้นฟูตนเอง',t:'heal',tg:'self',pw:35,mp:6},
 teamheal:{n:'ร่ายรำเยียวยา',t:'heal',tg:'team',pw:22,mp:9},
};
/* element skill families: [p1, p2, m1, m2, aoe, utility] */
const ELN={
 normal:['พุ่งชน','ทุบสุดแรง','คลื่นเสียง','ลำแสงพลัง','กระแทกรอบทิศ','คำรามข่มขวัญ'],
 fire:['หมัดเพลิง','กรงเล็บเพลิง','ประกายไฟ','ลมหายใจเพลิง','ทะเลเพลิง','เปลวไฟสาป'],
 water:['หางน้ำฟาด','กีบวารี','ลำน้ำพุ่ง','ปืนใหญ่วารี','คลื่นยักษ์','ม่านหมอกน้ำ'],
 grass:['ใบมีดพฤกษา','ค้อนไม้ยักษ์','เมล็ดดูดพลัง','ลำแสงสุริยะ','พายุใบไม้','ผงสปอร์นิทรา'],
 electric:['เขี้ยวอัสนี','พุ่งสายฟ้า','ประจุไฟฟ้า','สายฟ้าฟาด','พายุอสนี','คลื่นไฟฟ้าสถิต'],
 ice:['เขี้ยวน้ำแข็ง','หมัดน้ำแข็ง','ลมเยือกแข็ง','ลำแสงน้ำแข็ง','พายุหิมะ','ลมหนาวเหน็บ'],
 fighting:['ฝ่ามือกระแทก','หมัดทลายภูผา','คลื่นปราณ','ลูกพลังออร่า','เตะกวาด','รวมลมปราณ'],
 poison:['กัดพิษ','เหล็กไนพิษ','กรดพิษ','ระเบิดโคลนพิษ','หมอกพิษ','ผงพิษ'],
 ground:['ขุดดินจู่โจม','ค้อนแผ่นดิน','โคลนสาด','พลังแผ่นดิน','แผ่นดินไหว','ทรายเข้าตา'],
 flying:['จิก','โฉบจู่โจม','ลมกรรโชก','พายุอากาศ','ใบมีดวายุ','ลมส่งท้าย'],
 psychic:['โขกจิต','ใบมีดจิต','ลำแสงจิต','คลื่นจิตทำลาย','ระเบิดจิต','ภาพลวงตา'],
 bug:['กัดแมลง','เขาด้วงแทง','เสียงหึ่ง','ลำแสงแมลง','ฝูงแมลงรุม','ใยรัด'],
 rock:['ขว้างศิลา','หินแหลมทะลวง','อัญมณีส่องแสง','ศิลาพลังโบราณ','หินถล่ม','เกราะศิลา'],
 ghost:['เลียผี','หมัดเงา','ไฟผี','ลูกบอลเงา','พายุวิญญาณ','มนต์สะกดวิญญาณ'],
 dragon:['กรงเล็บมังกร','หางมังกรฟาด','ลมหายใจมังกร','อุกกาบาตมังกร','พิโรธมังกร','ร่ายรำมังกร'],
 dark:['กัดกระชาก','เขี้ยวรัตติกาล','คลื่นมืด','เงามืดกลืนกิน','อสูรราตรี','เสียงกระซิบมืด'],
 steel:['กรงเล็บเหล็ก','โขกหัวเหล็ก','ลำแสงกระจก','ปืนใหญ่ลำแสงเหล็ก','ระเบิดเหล็ก','ร่างเหล็กไหล'],
 fairy:['จูบนางฟ้า','ค้อนภูต','ลมภูต','พลังจันทรา','แสงพร่างพราว','เสน่ห์ภูต'],
};
const PHYS_AOE=new Set(['normal','fighting','ground','rock','bug','steel','flying','dark']);
const ELST={fire:['burn',.2],electric:['para',.2],ice:['freeze',.1],poison:['poison',.3],psychic:['confuse',.15],fairy:['love',.15],ghost:['charm',.1]};
const UTIL={
 normal:{t:'debuff',all:1,bf:{patk:-.3},tn:3,mp:5},
 fire:{t:'status',st:{burn:.85},mp:6},
 water:{t:'buff',tg:'team',bf:{eva:.4},tn:3,mp:6},
 grass:{t:'status',st:{sleep:.6},mp:7},
 electric:{t:'status',all:1,st:{static:.6},mp:7},
 ice:{t:'status',all:1,st:{chill:.6},mp:7},
 fighting:{t:'buff',tg:'self',bf:{patk:.4,pdef:.3},tn:3,mp:5},
 poison:{t:'status',st:{poison:.9},mp:5},
 ground:{t:'debuff',bf:{acc:-.35},tn:3,mp:5},
 flying:{t:'buff',tg:'team',bf:{spd:.4},tn:3,mp:6},
 psychic:{t:'status',st:{confuse:.7},mp:6},
 bug:{t:'debuff',all:1,bf:{spd:-.4},tn:3,mp:6},
 rock:{t:'buff',tg:'self',bf:{pdef:.7,mdef:.3},tn:3,mp:5},
 ghost:{t:'status',st:{charm:.55},mp:7},
 dragon:{t:'buff',tg:'self',bf:{patk:.4,spd:.4},tn:3,mp:7},
 dark:{t:'debuff',bf:{pdef:-.3,mdef:-.3},tn:3,mp:5},
 steel:{t:'buff',tg:'self',bf:{pdef:1,spd:-.2},tn:3,mp:6},
 fairy:{t:'status',st:{love:.65},mp:6},
};
for(const el in ELN){const N=ELN[el],es=ELST[el],add=(k,o,sc=1)=>{if(es)o.st={[es[0]]:+(es[1]*sc).toFixed(2)};if(el==='grass')o.ls=.25;SK[`${el}_${k}`]=o};
 add('p1',{n:N[0],t:'p',pw:120,el,mp:3});add('p2',{n:N[1],t:'p',pw:175,el,mp:9});
 add('m1',{n:N[2],t:'m',pw:125,el,mp:4});add('m2',{n:N[3],t:'m',pw:180,el,mp:10});
 add('aoe',{n:N[4],t:PHYS_AOE.has(el)?'p':'m',pw:125,el,mp:10,all:1},.6);
 SK[el+'_st']={n:N[5],el,...UTIL[el]}}

Object.assign(SK,{
/* ---- swordsman line ---- */
sw_bash:{n:'ฟันกระแทก',t:'p',pw:150,el:'normal',mp:3,st:{para:.12}},
sw_magnum:{n:'ดาบระเบิดเพลิง',t:'p',pw:120,el:'fire',mp:6,all:1},
sw_endure:{n:'ปลุกพลังนักดาบ',t:'buff',tg:'self',bf:{patk:.5,pdef:.2},tn:3,mp:5},
sw_twin:{n:'ฟันสองจังหวะ',t:'p',pw:90,hits:2,el:'normal',mp:6},
sw_break:{n:'ฟันทลายเกราะ',t:'p',pw:150,el:'fighting',mp:7,bf:{pdef:-.3},tn:3},
sw_whirl:{n:'ดาบวายุหมุน',t:'p',pw:150,el:'flying',mp:9,all:1},
sa_iai:{n:'อิไอกิริ',t:'p',pw:260,el:'normal',mp:12,cb:30},
sa_zanshin:{n:'ซันชิน',t:'buff',tg:'self',bf:{crit:1,acc:.2,patk:.3},tn:3,mp:8},
ke_thousand:{n:'พันคมดาบ',t:'p',pw:85,hits:5,rt:1,el:'steel',mp:16},
sh_army:{n:'บัญชาทัพซามูไร',t:'buff',tg:'team',bf:{patk:.4,pdef:.3,spd:.15},tn:3,mp:14},
sb_thunder:{n:'ดาบเวทอัสนี',t:'h',pw:180,el:'electric',mp:9,st:{para:.25}},
sb_frost:{n:'ดาบเวทเหมันต์',t:'h',pw:140,el:'ice',mp:12,all:1,st:{chill:.3}},
sbs_unite:{n:'ผสานวิญญาณอสูร',t:'buff',tg:'team',bf:{patk:.4,matk:.4,crit:.5},tn:3,mp:15},
sbw_doom:{n:'ดาบเวทหายนะ',t:'h',pw:190,el:'fire',mp:18,all:1,st:{burn:.3}},
/* ---- gladiator line ---- */
gl_shield:{n:'กระแทกโล่',t:'p',pw:130,el:'fighting',mp:3,st:{para:.25}},
gl_taunt:{n:'ยั่วยุ',t:'buff',tg:'self',bf:{pdef:.3},tn:3,mp:4,taunt:3},
gl_wall:{n:'กำแพงเหล็ก',t:'buff',tg:'self',bf:{pdef:.8,mdef:.5},tn:3,mp:6},
gl_quake:{n:'ทุบพื้นดิน',t:'p',pw:125,el:'ground',mp:8,all:1},
gl_counter:{n:'ท่าสวนกลับ',t:'buff',tg:'self',bf:{pdef:.2},pas:'thorns2',tn:3,mp:7},
gl_roar:{n:'เสียงคำรามนักสู้',t:'buff',tg:'team',bf:{patk:.3,pdef:.25},tn:3,mp:10},
pa_holy:{n:'แสงศักดิ์สิทธิ์ปกป้อง',t:'heal',tg:'team',pw:20,bf:{mdef:.3},tn:3,mp:12},
pa_hammer:{n:'ค้อนศักดิ์สิทธิ์',t:'h',pw:200,el:'fairy',mp:11},
te_judge:{n:'แสงพิพากษา',t:'h',pw:185,el:'fairy',mp:18,all:1},
et_bastion:{n:'ปราการนิรันดร์',t:'heal',tg:'self',pw:35,cure:1,bf:{pdef:1,mdef:.6},tn:3,taunt:3,mp:16},
be_frenzy:{n:'บ้าคลั่ง',t:'buff',tg:'self',bf:{patk:.8,spd:.2,pdef:-.3},tn:3,mp:7},
be_storm:{n:'ขวานพายุคลั่ง',t:'p',pw:165,el:'fighting',mp:12,all:1},
wl_split:{n:'ขวานแยกปฐพี',t:'p',pw:215,el:'ground',mp:18,all:1},
bw_drain:{n:'ฟันสูบโลหิต',t:'p',pw:230,el:'dark',mp:14,ls:.5},
/* ---- archer line ---- */
ar_double:{n:'ยิงสองดอก',t:'p',pw:75,hits:2,el:'normal',mp:3},
ar_fire:{n:'ศรเพลิง',t:'p',pw:140,el:'fire',mp:5,st:{burn:.25}},
ar_hawk:{n:'สายตาเหยี่ยว',t:'buff',tg:'self',bf:{acc:.3,crit:1},tn:3,mp:5},
ar_rain:{n:'ฝนธนู',t:'p',pw:115,el:'normal',mp:9,all:1},
ar_ice:{n:'ศรเยือกแข็ง',t:'p',pw:150,el:'ice',mp:8,st:{freeze:.25}},
ar_pierce:{n:'ศรทะลวงเกราะ',t:'p',pw:200,el:'steel',mp:11,pi:.4},
ra_falcon:{n:'เหยี่ยวคู่ใจ',t:'p',pw:175,el:'flying',mp:9,acc:100},
ra_trap:{n:'กับดักเถาวัลย์',t:'status',el:'grass',mp:10,all:1,bf:{spd:-.4},tn:3,st:{sleep:.25}},
sn_heart:{n:'ศรเจาะหัวใจ',t:'p',pw:320,el:'normal',mp:18,cb:50},
wd_storm:{n:'พายุศรพงไพร',t:'p',pw:175,el:'grass',mp:16,all:1},
bd_rally:{n:'เพลงปลุกใจ',t:'buff',tg:'team',bf:{patk:.3,matk:.3},tn:3,mp:9},
bd_lullaby:{n:'เพลงกล่อมนิทรา',t:'status',el:'normal',mp:12,all:1,st:{sleep:.45}},
ma_heal:{n:'บทเพลงสวรรค์',t:'heal',tg:'team',pw:35,cure:1,mp:18},
di_requiem:{n:'บทเพลงอาลัย',t:'m',pw:175,el:'ghost',mp:17,all:1,st:{confuse:.3}},
/* ---- mage line ---- */
mg_fire:{n:'ลูกไฟ',t:'m',pw:135,el:'fire',mp:4,st:{burn:.15}},
mg_ice:{n:'หอกน้ำแข็ง',t:'m',pw:135,el:'ice',mp:4,st:{freeze:.1}},
mg_bolt:{n:'สายฟ้า',t:'m',pw:135,el:'electric',mp:4,st:{para:.15}},
mg_rock:{n:'ศิลาร่วง',t:'m',pw:150,el:'rock',mp:6},
mg_firestorm:{n:'พายุเพลิง',t:'m',pw:125,el:'fire',mp:10,all:1,st:{burn:.15}},
mg_blizzard:{n:'พายุหิมะ',t:'m',pw:125,el:'ice',mp:10,all:1,st:{chill:.3}},
mg_thunderstorm:{n:'พายุอสนี',t:'m',pw:135,el:'electric',mp:12,all:1,st:{para:.15}},
sg_barrier:{n:'ม่านเวทคุ้มกัน',t:'buff',tg:'team',bf:{mdef:.4,pdef:.3},tn:3,mp:10},
sg_holy:{n:'แสงศักดิ์สิทธิ์',t:'m',pw:200,el:'fairy',mp:11},
am_meteor:{n:'อุกกาบาตถล่ม',t:'m',pw:200,el:'rock',mp:22,all:1,st:{burn:.2}},
el_omni:{n:'หลอมรวมธาตุ',t:'buff',tg:'self',bf:{matk:.4},pas:'omni',tn:3,mp:14},
wk_curse:{n:'คำสาปมรณะ',t:'m',pw:195,el:'dark',mp:10},
wk_plague:{n:'คำสาปโรคระบาด',t:'status',el:'poison',mp:13,all:1,st:{poison:.6},bf:{mdef:-.2},tn:3},
ne_spirit:{n:'อัญเชิญวิญญาณ',t:'summon',summon:'enemySpirit',el:'ghost',mp:30,cd:4,life:4,d:'เรียกวิญญาณอสูรศัตรูที่ตายในศึกนี้มาเป็นพวก 4 เทิร์น ด้วย HP/MP 50% ไม่รวมบอสและอสูรอัญเชิญ ใช้ศพแต่ละตัวได้ครั้งเดียว และต้องมีที่ว่างในทีม'},
ne_soul:{n:'ดูดวิญญาณ',t:'m',pw:210,el:'ghost',mp:16,ls:.4},
en_mind:{n:'ควบคุมจิตหมู่',t:'status',el:'psychic',mp:18,all:1,st:{charm:.4,confuse:.35}},
/* ---- merchant line ---- */
me_mammon:{n:'ทุ่มเงิน',t:'p',pw:210,el:'normal',mp:2,gc:4},
me_cart:{n:'รถเข็นถล่ม',t:'p',pw:120,el:'normal',mp:7,all:1},
me_potion:{n:'โยนยาสมุนไพร',t:'heal',tg:'ally',pw:30,cure:1,mp:6},
me_shout:{n:'ตะโกนเรียกขวัญ',t:'buff',tg:'team',bf:{patk:.25,spd:.1},tn:3,mp:6},
me_coinbomb:{n:'ระเบิดเหรียญ',t:'p',pw:175,el:'steel',mp:6,all:1,gc:8},
me_insure:{n:'ประกันภัยหมู่',t:'buff',tg:'team',bf:{pdef:.3,mdef:.3},tn:3,mp:9},
bs_hammer:{n:'ค้อนสะเทือนพสุธา',t:'p',pw:100,el:'ground',mp:10,all:1,st:{para:.45}},
bs_sharpen:{n:'ลับคมอาวุธ',t:'buff',tg:'team',bf:{patk:.35,crit:.6},tn:3,mp:10},
ms_godhammer:{n:'ค้อนเทพทลาย',t:'p',pw:270,el:'steel',mp:18},
mc_cannon:{n:'ปืนใหญ่ไอน้ำ',t:'p',pw:190,el:'steel',mp:18,all:1},
al_acid:{n:'ขวดกรด',t:'m',pw:155,el:'poison',mp:8,bf:{pdef:-.3},tn:3,st:{poison:.3}},
al_brew:{n:'ปรุงยาฉุกเฉิน',t:'heal',tg:'team',pw:28,mp:12},
bc_elixir:{n:'ยาอายุวัฒนะ',t:'heal',tg:'team',pw:45,cure:1,mp:20},
ga_transmute:{n:'แปรธาตุเป็นทอง',t:'m',pw:200,el:'steel',mp:14,gold:1},
/* ---- gunner line ---- */
gn_rapid:{n:'ยิงรัว',t:'p',pw:55,hits:3,el:'normal',mp:3},
gn_fire:{n:'กระสุนเพลิง',t:'p',pw:140,el:'fire',mp:5,st:{burn:.3}},
gn_aim:{n:'เล็งหัว',t:'buff',tg:'self',bf:{acc:.4,crit:1.2},tn:3,mp:5},
gn_spread:{n:'ยิงกระจาย',t:'p',pw:110,el:'normal',mp:9,all:1},
gn_shock:{n:'กระสุนช็อต',t:'p',pw:150,el:'electric',mp:8,st:{para:.3}},
gn_execute:{n:'ยิงปลิดชีพ',t:'p',pw:235,el:'normal',mp:12,cb:20},
mk_bullseye:{n:'ยิงตาวัว',t:'p',pw:270,el:'normal',mp:13,cb:40,acc:20},
mk_ap:{n:'กระสุนเจาะเกราะ',t:'p',pw:190,el:'steel',mp:11,pi:.5},
gs_infinite:{n:'กระสุนนิรันดร์',t:'p',pw:75,hits:6,rt:1,el:'steel',mp:20},
bh_bounty:{n:'ล่าค่าหัว',t:'p',pw:240,el:'dark',mp:15,gold:1},
at_grenade:{n:'ระเบิดมือ',t:'p',pw:150,el:'fire',mp:10,all:1,st:{burn:.2}},
at_flash:{n:'ระเบิดแสง',t:'debuff',el:'normal',mp:9,all:1,bf:{acc:-.35},tn:3,st:{confuse:.2}},
cn_barrage:{n:'ปืนใหญ่ระดมยิง',t:'p',pw:215,el:'steel',mp:20,all:1},
dm_blast:{n:'ระเบิดทลายฟ้า',t:'p',pw:270,el:'fire',mp:20,all:1,self:.15,st:{burn:.3}},
/* ---- druid line ---- */
dr_wolf:{n:'แปลงร่างหมาป่า',t:'form',form:'wolf',mp:6},
dr_leaf:{n:'ใบไม้สมานแผล',t:'heal',tg:'ally',pw:35,mp:6},
dr_bear:{n:'แปลงร่างหมี',t:'form',form:'bear',mp:6},
dr_thorn:{n:'หนามพิษพงไพร',t:'m',pw:130,el:'poison',mp:8,all:1,st:{poison:.3}},
dr_hawk:{n:'แปลงร่างเหยี่ยว',t:'form',form:'hawk',mp:7},
dr_treant:{n:'แปลงร่างพฤกษา',t:'form',form:'treant',mp:8},
fe_saber:{n:'แปลงร่างเสือเขี้ยวดาบ',t:'form',form:'saber',mp:10},
fe_instinct:{n:'สัญชาตญาณป่า',t:'heal',tg:'self',pw:25,bf:{patk:.3,crit:.5},tn:3,mp:9},
wg_dragon:{n:'แปลงร่างมังกรพงไพร',t:'form',form:'gdragon',mp:16},
pk_howl:{n:'หอนนำฝูง',t:'buff',tg:'team',bf:{patk:.4,spd:.3},tn:3,mp:12},
gv_rain:{n:'ฝนชโลมพฤกษา',t:'heal',tg:'team',pw:30,mp:12},
gv_storm:{n:'พายุพงไพร',t:'m',pw:165,el:'grass',mp:13,all:1,ls:.2},
ad_moon:{n:'แปลงร่างวิญญาณจันทรา',t:'form',form:'moon',mp:16},
sc_tempest:{n:'พายุอสนีโกลาหล',t:'m',pw:205,el:'electric',mp:20,all:1,st:{para:.3}},
f_wolfbite:{n:'กัดฉีก',t:'p',pw:150,el:'dark',mp:3,cb:15},
f_howl:{n:'หอนเรียกฝูง',t:'buff',tg:'team',bf:{patk:.3},tn:3,mp:6},
f_maul:{n:'ตบหนัก',t:'p',pw:165,el:'ground',mp:5,st:{para:.2}},
f_bearroar:{n:'คำรามหมีป่า',t:'debuff',el:'normal',mp:7,all:1,bf:{patk:-.3},tn:3},
f_hibernate:{n:'จำศีลฟื้นพลัง',t:'heal',tg:'self',pw:35,mp:8},
f_hawkeye:{n:'ตาเหยี่ยวเวหา',t:'buff',tg:'self',bf:{acc:.3,crit:1},tn:3,mp:5},
f_roots:{n:'รากพันธนาการ',t:'status',el:'grass',mp:10,all:1,bf:{spd:-.4},tn:3,st:{sleep:.2}},
f_bloom:{n:'บุปผาฟื้นฟู',t:'heal',tg:'team',pw:30,mp:12},
f_saberpounce:{n:'ตะปบสังหาร',t:'p',pw:240,el:'normal',mp:10,cb:25},
f_saberleap:{n:'กระโจนขย้ำ',t:'p',pw:150,el:'fighting',mp:12,all:1},
f_dragonbreath:{n:'ลมหายใจมังกรพงไพร',t:'m',pw:200,el:'dragon',mp:16,all:1},
f_dragonroar:{n:'คำรามมังกร',t:'buff',tg:'team',bf:{patk:.4,matk:.4},tn:3,mp:12},
f_moonbeam:{n:'ลำแสงจันทราพิโรธ',t:'m',pw:190,el:'fairy',mp:16,all:1,st:{love:.2}},
f_moonbless:{n:'พรแห่งจันทรา',t:'heal',tg:'team',pw:35,cure:1,mp:16},
/* ---- thief line ---- */
th_double:{n:'แทงคู่',t:'p',pw:70,hits:2,el:'normal',mp:2},
th_venom:{n:'แทงพิษ',t:'p',pw:120,el:'poison',mp:4,st:{poison:.5}},
th_hide:{n:'ซ่อนตัว',t:'buff',tg:'self',bf:{eva:1.2,crit:.5},tn:2,mp:5},
th_steal:{n:'ฉกชิง',t:'p',pw:110,el:'dark',mp:5,steal:1},
th_back:{n:'แทงข้างหลัง',t:'p',pw:220,el:'dark',mp:10,cb:30},
th_smoke:{n:'ระเบิดควัน',t:'debuff',el:'normal',mp:9,all:1,bf:{acc:-.3},tn:3},
ro_mug:{n:'ปล้นกลางศึก',t:'p',pw:170,el:'dark',mp:9,steal:1},
ro_dirty:{n:'เตะสกปรก',t:'p',pw:140,el:'fighting',mp:9,st:{confuse:.45}},
mt_plunder:{n:'ปล้นสะดม',t:'p',pw:130,el:'dark',mp:16,all:1,steal:1},
tr_trick:{n:'กลลวงพันหน้า',t:'status',el:'psychic',mp:14,st:{charm:.6,love:.5}},
as_sonic:{n:'ฟันกากบาทสายฟ้า',t:'p',pw:65,hits:4,el:'dark',mp:11},
as_venomblade:{n:'เคลือบพิษร้าย',t:'buff',tg:'self',bf:{patk:.3},pas:'poisonTouch2',tn:4,mp:8},
nj_shuriken:{n:'ดาวกระจายเงา',t:'p',pw:130,el:'dark',mp:14,all:1},
nj_clone:{n:'คาถาแยกร่าง',t:'buff',tg:'self',bf:{eva:1.5,spd:.3},tn:3,mp:12},
rn_wander:{n:'ดาบพเนจร',t:'p',pw:280,el:'steel',mp:16,cb:40},
rn_masterless:{n:'ไร้นาย',t:'buff',tg:'self',bf:{patk:.6,crit:1,eva:-.3},tn:3,mp:10},
/* ---- summoner line ---- */
su_empower:{n:'ปลุกพลังอสูร',t:'buff',tg:'ally',bf:{patk:.4,matk:.4},tn:3,mp:4},
su_mend:{n:'รักษาอสูร',t:'heal',tg:'ally',pw:35,mp:5},
su_ward:{n:'เกราะผนึก',t:'buff',tg:'team',bf:{pdef:.3,mdef:.3},tn:3,mp:8},
su_link:{n:'สายใยวิญญาณ',t:'buff',tg:'team',bf:{spd:.3,acc:.15},tn:3,mp:8},
su_command:{n:'สั่งจู่โจม',t:'buff',tg:'team',bf:{patk:.3,matk:.3,crit:.6},tn:3,mp:12},
su_revive:{n:'คืนชีพอสูร',t:'heal',tg:'ally',pw:40,rev:1,mp:14},
tm_double:{n:'ผนึกพลังคู่',t:'buff',tg:'ally',bf:{patk:.7,matk:.7,spd:.2},tn:3,mp:10},
tm_instinct:{n:'ปลุกสัญชาตญาณ',t:'buff',tg:'team',bf:{crit:1,acc:.2},tn:3,mp:10},
bk_order:{n:'คำสั่งราชันย์',t:'buff',tg:'team',bf:{patk:.5,matk:.5,spd:.2},tn:3,mp:18},
sm_bind:{n:'ตรึงวิญญาณ',t:'status',el:'ghost',mp:12,st:{para:.8}},
sl_share:{n:'แบ่งปันชีวิต',t:'heal',tg:'team',pw:30,mp:12},
sl_spirit:{n:'เสริมจิตวิญญาณ',t:'buff',tg:'team',bf:{mdef:.4,matk:.3},tn:3,mp:10},
ss_rebirth:{n:'วัฏจักรวิญญาณ',t:'heal',tg:'team',pw:35,cure:1,revAll:1,mp:24},
sp_storm:{n:'พายุภูติ',t:'m',pw:190,el:'fairy',mp:18,all:1},
/* ---- beast signature skills ---- */
s_kappa:{n:'ซูโม่ธารา',t:'p',pw:220,el:'fighting',mp:12,st:{para:.3}},
s_wisp:{n:'เพลิงวิญญาณมรณะ',t:'m',pw:220,el:'ghost',mp:13,st:{burn:.4}},
s_mandrake:{n:'กรีดร้องสังหาร',t:'m',pw:165,el:'grass',mp:15,all:1,st:{sleep:.3}},
s_tanuki:{n:'พันหน้าลวงตา',t:'status',el:'psychic',mp:14,all:1,st:{confuse:.5,love:.3}},
s_raiju:{n:'อัสนีเทพอสูร',t:'m',pw:235,el:'electric',mp:14,st:{para:.3}},
s_pixie:{n:'วงแหวนภูต',t:'heal',tg:'team',pw:40,cure:1,mp:16},
s_redcap:{n:'หมวกโลหิต',t:'p',pw:220,el:'dark',mp:12,ls:.5},
s_kodama:{n:'เสียงสะท้อนพงไพร',t:'heal',tg:'team',pw:30,bf:{mdef:.3},tn:3,mp:14},
s_griffin:{n:'กรงเล็บราชันย์เวหา',t:'p',pw:230,el:'flying',mp:13,cb:20},
s_kitsune:{n:'ไฟจิ้งจอกเก้าหาง',t:'m',pw:185,el:'fire',mp:18,all:1,st:{burn:.3,confuse:.2}},
s_tengu:{n:'พัดใบตองพายุ',t:'m',pw:175,el:'flying',mp:16,all:1,st:{confuse:.2}},
s_nil:{n:'ทะยานนิลมังกร',t:'p',pw:240,el:'dragon',mp:14},
s_kelpie:{n:'ลากลงทะเลสาบ',t:'p',pw:230,el:'water',mp:14,ls:.3},
s_nue:{n:'เมฆาทมิฬอสนี',t:'m',pw:180,el:'electric',mp:17,all:1,st:{para:.25}},
s_joro:{n:'ใยไหมมรณะ',t:'status',el:'bug',mp:14,all:1,bf:{spd:-.5},tn:3,st:{poison:.5}},
s_basilisk:{n:'เนตรศิลามรณะ',t:'m',pw:200,el:'rock',mp:16,st:{para:.5}},
s_cerberus:{n:'กัดสามเศียร',t:'p',pw:95,hits:3,el:'dark',mp:14,st:{burn:.15}},
s_yeti:{n:'หิมะถล่มทลาย',t:'p',pw:190,el:'ice',mp:18,all:1,st:{freeze:.15}},
s_golem:{n:'หมัดอาดามันไทต์',t:'p',pw:260,el:'steel',mp:16},
s_scarab:{n:'กลิ้งตะวัน',t:'p',pw:240,el:'bug',mp:15,st:{burn:.3}},
s_dragon:{n:'ลมหายใจราชันย์มังกร',t:'m',pw:210,el:'fire',mp:22,all:1,st:{burn:.3}},
s_naga:{n:'นาคราชพ่นพิษน้ำ',t:'m',pw:205,el:'water',mp:20,all:1,st:{poison:.3}},
s_tbird:{n:'ฟ้าผ่าพันสาย',t:'m',pw:200,el:'electric',mp:20,all:1,st:{para:.3}},
s_gargoyle:{n:'ปีกศิลาถล่ม',t:'p',pw:250,el:'rock',mp:16},
s_jiangshi:{n:'กระโดดผีดิบ',t:'p',pw:240,el:'ghost',mp:15,st:{para:.35}},
s_qilin:{n:'พรกิเลน',t:'heal',tg:'team',pw:40,cure:1,bf:{patk:.2,matk:.2},tn:3,mp:18},
s_unicorn:{n:'เขาบริสุทธิ์',t:'p',pw:230,el:'fairy',mp:14,ls:.3},
s_pegasus:{n:'ควบสายฟ้าซุส',t:'p',pw:200,el:'electric',mp:18,all:1,st:{para:.2}},
s_erawan:{n:'งาเอราวัณสามสิบสามเศียร',t:'p',pw:200,el:'fairy',mp:20,all:1},
s_baihu:{n:'กรงเล็บพยัคฆ์ขาว',t:'p',pw:255,el:'steel',mp:16,cb:25},
s_lamassu:{n:'ปราการลามัสซู',t:'buff',tg:'team',bf:{pdef:.5,mdef:.5},tn:3,mp:16},
s_fenrir:{n:'กลืนตะวัน',t:'p',pw:270,el:'dark',mp:20},
s_kraken:{n:'หนวดยักษ์รัดเรือ',t:'p',pw:90,hits:4,rt:1,el:'water',mp:18,st:{para:.15}},
s_phoenix:{n:'เปลวไฟคืนชีพ',t:'heal',tg:'team',pw:45,cure:1,revAll:1,mp:24},
s_garuda:{n:'กรงเล็บพญาครุฑ',t:'p',pw:260,el:'flying',mp:18,cb:20},
});

/* ================= DRUID FORMS ================= */
const FORMS={
 wolf:{n:'ร่างหมาป่า',em:'🐺',t:['dark'],m:{patk:1.5,spd:1.3,crit:1.5,matk:.5},sk:['f_wolfbite','f_howl','dark_p2']},
 bear:{n:'ร่างหมี',em:'🐻',t:['ground'],m:{pdef:1.7,mdef:1.3,patk:1.3,spd:.75},sk:['f_maul','f_bearroar','f_hibernate']},
 hawk:{n:'ร่างเหยี่ยว',em:'🦅',t:['flying'],m:{eva:1.8,spd:1.5,acc:1.2,patk:1.2},sk:['flying_p2','flying_aoe','f_hawkeye']},
 treant:{n:'ร่างพฤกษา',em:'🌳',t:['grass'],m:{matk:1.4,mdef:1.5,pdef:1.2,spd:.8},sk:['f_roots','grass_m2','f_bloom']},
 saber:{n:'ร่างเสือเขี้ยวดาบ',em:'🐅',t:['normal','fighting'],m:{patk:1.9,crit:2,spd:1.3},sk:['f_saberpounce','f_saberleap','fighting_p2']},
 gdragon:{n:'ร่างมังกรพงไพร',em:'🐲',t:['dragon','grass'],m:{patk:1.6,matk:1.6,pdef:1.4,mdef:1.4,spd:1.1},sk:['f_dragonbreath','dragon_p2','f_dragonroar']},
 moon:{n:'ร่างวิญญาณจันทรา',em:'🌙',t:['fairy','psychic'],m:{matk:1.8,mdef:1.5,eva:1.3},sk:['f_moonbeam','f_moonbless','psychic_m2']},
};

/* ================= CLASSES ================= */
const CLS={
swordsman:{n:'นักดาบ',w:'sword',em:'🤺',m:{hp:1.15,mp:.7,patk:1.2,matk:.6,pdef:1.1,mdef:.9,crit:1.2},pas:[],sk:[[1,'sw_bash'],[4,'sw_magnum'],[8,'sw_endure'],[12,'sw_twin'],[17,'sw_break'],[22,'sw_whirl']],
 d:'สมดุลทั้งโจมตีและป้องกัน',pro:'HP และโจมตีกายภาพดี ใช้ง่าย มีสกิลหมู่',con:'เวทย์ต่ำ ไม่มีสกิลรักษา'},
 samurai:{n:'ซามูไร',p:'swordsman',m:{patk:1.1,crit:1.4,spd:1.1},pas:['keen'],sk:[[25,'sa_iai'],[32,'sa_zanshin']],d:'ดาบเดียวชี้ขาด คริติคอลรุนแรง'},
  kensei:{n:'เคนเซย์',p:'samurai',m:{patk:1.1,acc:1.1},pas:['deadly'],sk:[[40,'ke_thousand']],d:'ปรมาจารย์ดาบ ฟันรัว 5 ครั้ง คริติคอลแรง ×2'},
  shogun:{n:'โชกุน',p:'samurai',m:{hp:1.15,pdef:1.1},pas:['intimidate'],sk:[[40,'sh_army']],d:'แม่ทัพซามูไร บัฟทั้งทีม ข่มขวัญศัตรู'},
 spellblade:{n:'ดาบเวทย์',p:'swordsman',m:{matk:1.7,mp:1.5},pas:['mpregen'],sk:[[25,'sb_thunder'],[32,'sb_frost']],d:'ผสานเวทย์เข้ากับคมดาบ โจมตีแบบผสมกายภาพและเวทย์'},
  sbsummon:{n:'ดาบเวทย์อัญเชิญ',p:'spellblade',m:{matk:1.1},pas:['guardian'],sum:2,sk:[[40,'sbs_unite']],d:'นำอสูรออกสู้ได้ 2 ตัว ผสานพลังกับอสูร'},
  sbwar:{n:'ดาบเวทย์สงคราม',p:'spellblade',m:{hp:1.2,patk:1.375,matk:1.54},pas:['pierce'],sk:[[40,'sbw_doom']],d:'ดาบเวทย์ทำลายล้างหมู่ เมินเกราะ'},
gladiator:{n:'กลาดิเอเตอร์',w:'axe',em:'🛡️',m:{hp:1.4,mp:.6,patk:1.05,matk:.5,pdef:1.4,mdef:1.2,eva:.6,spd:.85,crit:.8},pas:['nocrit'],sk:[[1,'gl_shield'],[4,'gl_taunt'],[8,'gl_wall'],[12,'gl_quake'],[17,'gl_counter'],[22,'gl_roar']],
 d:'ปราการแนวหน้า ยั่วยุให้ศัตรูโจมตีตัวเอง',pro:'HP และป้องกันสูงสุด ไม่โดนคริติคอล ปกป้องอสูรได้',con:'ช้า หลบหลีกต่ำ ดาเมจไม่สูง'},
 paladin:{n:'พาลาดิน',p:'gladiator',m:{mdef:1.15,matk:1.6},pas:['guardian'],sk:[[25,'pa_holy'],[25,'pa_hammer']],d:'อัศวินศักดิ์สิทธิ์ ป้องกันและรักษาทีม'},
  templar:{n:'เทมพลาร์',p:'paladin',m:{matk:1.15},pas:['imm_mind'],sk:[[40,'te_judge']],d:'แสงพิพากษาโจมตีหมู่ จิตไม่หวั่นไหว'},
  eternal:{n:'ผู้พิทักษ์นิรันดร์',p:'paladin',m:{hp:1.2,pdef:1.15},pas:['regen'],sk:[[40,'et_bastion']],d:'ปราการที่ไม่มีวันล้ม'},
 berserker:{n:'เบอร์เซิร์กเกอร์',p:'gladiator',m:{patk:1.25,pdef:.9},pas:['rage'],sk:[[25,'be_frenzy'],[32,'be_storm']],d:'ยิ่งเจ็บยิ่งแรง แลกป้องกันเป็นพลังโจมตี'},
  warlord:{n:'ราชันย์สนามรบ',p:'berserker',m:{hp:1.1},pas:['intimidate'],sk:[[40,'wl_split']],d:'ขวานแยกปฐพีถล่มศัตรูทั้งหมด'},
  bloodwar:{n:'นักรบโลหิต',p:'berserker',m:{patk:1.1},pas:['lifesteal'],sk:[[40,'bw_drain']],d:'ดูดเลือดศัตรูมาเป็นพลังชีวิต'},
archer:{n:'นักธนู',w:'bow',em:'🏹',m:{hp:.9,mp:.8,patk:1.15,matk:.7,pdef:.85,mdef:.9,acc:1.3,eva:1.2,spd:1.15,crit:1.5},pas:['eagle'],sk:[[1,'ar_double'],[4,'ar_fire'],[8,'ar_hawk'],[12,'ar_rain'],[17,'ar_ice'],[22,'ar_pierce']],
 d:'ยิงไกล แม่นยำ คริติคอลสูง',pro:'แม่นยำและเร็ว มีทั้งสกิลเดี่ยวและหมู่ ธนูติดสถานะ',con:'HP และป้องกันต่ำ'},
 ranger:{n:'พรานป่า',p:'archer',m:{patk:1.1,acc:1.1},pas:['keen'],sk:[[25,'ra_falcon'],[32,'ra_trap']],d:'นายพรานกับเหยี่ยวคู่ใจ วางกับดัก'},
  sniper:{n:'สไนเปอร์',p:'ranger',m:{patk:1.1,crit:1.2},pas:['deadly'],sk:[[40,'sn_heart']],d:'ยิงนัดเดียวจอดสนิท'},
  wildlord:{n:'นายพรานพงไพร',p:'ranger',m:{spd:1.1},pas:['swift'],sum:2,sk:[[40,'wd_storm']],d:'นำอสูรออกล่าได้ 2 ตัว'},
 bard:{n:'นักกวี',p:'archer',m:{matk:1.5,mp:1.3},pas:['swift'],sk:[[25,'bd_rally'],[32,'bd_lullaby']],d:'ร้องเพลงเสริมพลังทีมและกล่อมศัตรู'},
  maestro:{n:'คีตกวีสวรรค์',p:'bard',m:{mdef:1.1},pas:['healer'],sk:[[40,'ma_heal']],d:'บทเพลงเยียวยาทั้งทีม'},
  dirge:{n:'นักดนตรีมรณะ',p:'bard',m:{matk:1.15},pas:['imm_mind'],sk:[[40,'di_requiem']],d:'บทเพลงแห่งความตายโจมตีหมู่'},
mage:{n:'นักเวทย์',w:'staff',em:'🧙',m:{hp:.8,mp:1.5,patk:.5,matk:1.35,pdef:.75,mdef:1.2,eva:.9,spd:.95},pas:['mpregen'],sk:[[1,'mg_fire'],[3,'mg_ice'],[6,'mg_bolt'],[10,'mg_rock'],[14,'mg_firestorm'],[18,'mg_blizzard'],[22,'mg_thunderstorm']],
 d:'เวทย์ธาตุ ไฟ น้ำแข็ง สายฟ้า หิน',pro:'โจมตีเวทย์และ MP สูงสุด สกิลหมู่เยอะ เลือกธาตุแพ้ทางได้',con:'HP และป้องกันกายภาพต่ำมาก'},
 sage:{n:'ปราชญ์',p:'mage',m:{mdef:1.15,mp:1.1},pas:['healer'],sk:[[25,'sg_barrier'],[32,'sg_holy']],d:'เวทย์ศักดิ์สิทธิ์และเวทป้องกัน'},
  archmage:{n:'อาร์คเมจ',p:'sage',m:{matk:1.15},pas:['adapt'],sk:[[40,'am_meteor']],d:'เรียกอุกกาบาตถล่มศัตรูทั้งหมด'},
  elementalist:{n:'จอมเวทธาตุ',p:'sage',m:{matk:1.1,mp:1.1},pas:['pierce'],sk:[[40,'el_omni']],d:'หลอมรวมทุกธาตุ ทุกเวทย์ได้โบนัสธาตุ'},
 warlock:{n:'พ่อมดมืด',p:'mage',m:{matk:1.15},pas:['lifesteal'],sk:[[25,'wk_curse'],[32,'wk_plague']],d:'คำสาปและเวทมืด'},
  necro:{n:'เนโครแมนเซอร์',p:'warlock',m:{hp:1.15},pas:['regen'],sk:[[40,'ne_soul'],[45,'ne_spirit']],d:'ดูดวิญญาณและอัญเชิญอสูรศัตรูที่ตายมาเป็นพวก'},
  enchanter:{n:'จอมมนตร์สะกด',p:'warlock',m:{spd:1.1},pas:['imm_mind'],sk:[[40,'en_mind']],d:'ควบคุมจิตศัตรูทั้งกลุ่ม'},
merchant:{n:'พ่อค้า',w:'mace',em:'💰',m:{hp:1.1,mp:.8,matk:.7,pdef:1.05,mdef:.95,spd:.95},pas:['lucky'],merch:1,sk:[[1,'me_mammon'],[4,'me_cart'],[8,'me_potion'],[12,'me_shout'],[17,'me_coinbomb'],[22,'me_insure']],
 d:'ใช้เงินเป็นอาวุธ ซื้อถูก ขายแพง',pro:'ได้เงินจากการต่อสู้ +25% ร้านลด 15% ขายชิ้นส่วน +20%',con:'ค่าสถานะกลาง ๆ บางสกิลต้องจ่ายเงิน'},
 blacksmith:{n:'ช่างตีเหล็ก',p:'merchant',m:{patk:1.2},pas:['pierce'],sk:[[25,'bs_hammer'],[32,'bs_sharpen']],d:'ค้อนหนัก ลับคมอาวุธให้ทีม'},
  mastersmith:{n:'ช่างเทพตีอาวุธ',p:'blacksmith',m:{patk:1.1},pas:['deadly'],sk:[[40,'ms_godhammer']],d:'ค้อนเทพทุบทำลายเป้าหมายเดียว'},
  mechanic:{n:'วิศวกรจักรกล',p:'blacksmith',m:{pdef:1.2,hp:1.1},pas:['thorns'],sk:[[40,'mc_cannon']],d:'ปืนใหญ่ไอน้ำยิงหมู่'},
 alchemist:{n:'นักเล่นแร่แปรธาตุ',p:'merchant',m:{matk:1.5,mp:1.2},pas:['imm_poison'],sk:[[25,'al_acid'],[32,'al_brew']],d:'ขวดกรดและยาวิเศษ'},
  biochem:{n:'นักชีวเคมี',p:'alchemist',m:{mdef:1.1},pas:['healer'],sk:[[40,'bc_elixir']],d:'ยาอายุวัฒนะรักษาทั้งทีม'},
  goldalch:{n:'นักแปรธาตุทองคำ',p:'alchemist',m:{matk:1.1},pas:['lucky'],sk:[[40,'ga_transmute']],d:'แปรศัตรูเป็นทองคำ เงินไหลมาเทมา'},
gunner:{n:'มือปืน',w:'gun',em:'🔫',m:{hp:.9,mp:.8,patk:1.2,matk:.6,pdef:.85,mdef:.85,acc:1.35,crit:1.8,spd:1.05},pas:['eagle'],sk:[[1,'gn_rapid'],[4,'gn_fire'],[8,'gn_aim'],[12,'gn_spread'],[17,'gn_shock'],[22,'gn_execute']],
 d:'ยิงรัว คริติคอลแรง',pro:'แม่นยำและคริติคอลสูงมาก ยิงหลายนัดต่อตา',con:'HP และป้องกันต่ำ'},
 marksman:{n:'มือปืนแม่นยำ',p:'gunner',m:{acc:1.1,crit:1.2},pas:['keen'],sk:[[25,'mk_bullseye'],[32,'mk_ap']],d:'ยิงเจาะจุดตาย'},
  gunsaint:{n:'เทพปืน',p:'marksman',m:{patk:1.1},pas:['deadly'],sk:[[40,'gs_infinite']],d:'กระสุนนิรันดร์ 6 นัด'},
  bounty:{n:'นักล่าค่าหัว',p:'marksman',m:{spd:1.1},pas:['lucky'],sk:[[40,'bh_bounty']],d:'ล่าค่าหัว ได้เงินทุกนัด'},
 artillery:{n:'พลปืนใหญ่',p:'gunner',m:{patk:1.1,hp:1.15},pas:['sturdy'],sk:[[25,'at_grenade'],[32,'at_flash']],d:'ระเบิดหมู่ กดดันทั้งกลุ่ม'},
  cannoneer:{n:'นายพลปืนใหญ่',p:'artillery',m:{patk:1.1},pas:['pierce'],sk:[[40,'cn_barrage']],d:'ปืนใหญ่ระดมยิงศัตรูทั้งหมด'},
  demolisher:{n:'ช่างระเบิด',p:'artillery',m:{patk:1.15},pas:['imm_burn'],sk:[[40,'dm_blast']],d:'ระเบิดรุนแรงที่สุด แต่เจ็บตัวเอง'},
druid:{n:'ดรูอิด',w:'staff',em:'🌿',m:{hp:1.05,mp:1.2,matk:1.1,mdef:1.1,pdef:.95},pas:['regen'],sk:[[1,'dr_wolf'],[3,'dr_leaf'],[7,'dr_bear'],[11,'dr_thorn'],[15,'dr_hawk'],[20,'dr_treant']],
 d:'แปลงร่างเป็นสัตว์ป่า แต่ละร่างมีสกิลของตัวเอง',pro:'ปรับตัวได้ทุกสถานการณ์ ฟื้น HP เองทุกตา',con:'เสียตาตอนแปลงร่าง ร่างคนค่าสถานะกลาง ๆ'},
 feral:{n:'ราชันย์สัตว์ป่า',p:'druid',m:{patk:1.2},pas:['rage'],sk:[[25,'fe_saber'],[32,'fe_instinct']],d:'ร่างเสือเขี้ยวดาบ เน้นบุกหนัก'},
  wildgod:{n:'เทพอสูรพงไพร',p:'feral',m:{patk:1.1,matk:1.1},pas:['adapt'],sk:[[40,'wg_dragon']],d:'แปลงร่างเป็นมังกรพงไพร'},
  packlord:{n:'จ้าวแห่งฝูง',p:'feral',m:{spd:1.1},pas:['swift'],sum:2,sk:[[40,'pk_howl']],d:'นำอสูรออกสู้ได้ 2 ตัว นำฝูงบุก'},
 grove:{n:'ผู้พิทักษ์พงไพร',p:'druid',m:{matk:1.2},pas:['healer'],sk:[[25,'gv_rain'],[32,'gv_storm']],d:'เวทพฤกษา รักษาและโจมตีหมู่'},
  archdruid:{n:'อาร์คดรูอิด',p:'grove',m:{matk:1.1},pas:['mpregen'],sk:[[40,'ad_moon']],d:'แปลงร่างเป็นวิญญาณจันทรา'},
  stormcaller:{n:'ผู้เรียกพายุ',p:'grove',m:{matk:1.15},pas:['imm_para'],sk:[[40,'sc_tempest']],d:'พายุอสนีโกลาหลถล่มทั้งสนาม'},
thief:{n:'โจร',w:'dagger',em:'🥷',m:{hp:.72,mp:.8,patk:1.1,matk:.6,pdef:.8,mdef:.85,acc:1.1,eva:1.8,spd:1.35,crit:3},pas:['elusive'],sk:[[1,'th_double'],[4,'th_venom'],[8,'th_hide'],[12,'th_steal'],[17,'th_back'],[22,'th_smoke']],
 d:'โจมตีรวดเร็ว หลบหลีกสูง คริติคอลบ่อย',pro:'เร็วที่สุด หลบหลีกและคริติคอลสูงมาก ขโมยของได้',con:'HP ต่ำมาก สกิลหมู่น้อย'},
 rogue:{n:'อันธพาล',p:'thief',m:{hp:1.1,patk:1.1},pas:['lucky'],sk:[[25,'ro_mug'],[32,'ro_dirty']],d:'ปล้นกลางศึก เล่นสกปรก'},
  masterthief:{n:'จอมโจร',p:'rogue',m:{spd:1.1},pas:['lucky'],sk:[[40,'mt_plunder']],d:'ปล้นสะดมศัตรูทั้งกลุ่ม'},
  trickster:{n:'นักต้มตุ๋น',p:'rogue',m:{eva:1.15},pas:['imm_mind'],sk:[[40,'tr_trick']],d:'กลลวงสะกดศัตรู'},
 assassin:{n:'นักฆ่า',p:'thief',m:{patk:1.15,crit:1.3},pas:['deadly'],sk:[[25,'as_sonic'],[32,'as_venomblade']],d:'ฟันรัวสังหาร คริติคอลแรง ×2'},
  ninja:{n:'นินจา',p:'assassin',m:{spd:1.1,eva:1.1},pas:['swift'],sk:[[40,'nj_shuriken'],[46,'nj_clone']],d:'ดาวกระจายและคาถาแยกร่าง'},
  ronin:{n:'โรนิน',p:'assassin',m:{patk:1.15},pas:['keen'],sk:[[40,'rn_wander'],[46,'rn_masterless']],d:'ซามูไรไร้นาย ดาบพเนจรฟันเดียวตาย'},
summoner:{n:'นักอัญเชิญ',w:'whip',em:'🔔',m:{hp:.9,mp:1.4,patk:.6,matk:1.1,pdef:.85,mdef:1.1},pas:[],sum:2,sk:[[1,'su_empower'],[4,'su_mend'],[8,'su_ward'],[12,'su_link'],[17,'su_command'],[22,'su_revive']],
 d:'นำอสูรออกสู้ 2 ตัวพร้อมกัน เน้นเสริมพลังอสูร',pro:'อสูรออกสู้หลายตัว บัฟและรักษาอสูรเก่ง',con:'ตัวเองโจมตีอ่อน HP ต่ำ'},
 tamer:{n:'ผู้ฝึกอสูร',p:'summoner',m:{matk:1.1},pas:['swift'],sk:[[25,'tm_double'],[32,'tm_instinct']],d:'ปลุกพลังอสูรขั้นสูง'},
  beastking:{n:'ราชันย์อสูร',p:'tamer',m:{hp:1.1},pas:['intimidate'],sum:3,sk:[[40,'bk_order']],d:'นำอสูรออกสู้ได้ 3 ตัว'},
  sealmaster:{n:'ปรมาจารย์ผนึก',p:'tamer',m:{mp:1.1},pas:['sealer'],sum:2,sk:[[40,'sm_bind']],d:'ผนึกอสูรสำเร็จง่ายขึ้น 50%'},
 soullink:{n:'ผู้เชื่อมวิญญาณ',p:'summoner',m:{mdef:1.15},pas:['healer'],sk:[[25,'sl_share'],[32,'sl_spirit']],d:'เชื่อมวิญญาณกับอสูร แบ่งปันชีวิต'},
  soulsage:{n:'ปราชญ์วิญญาณ',p:'soullink',m:{mp:1.1},pas:['regen'],sum:3,sk:[[40,'ss_rebirth']],d:'อสูร 3 ตัว ชุบชีวิตทั้งทีมได้'},
  spiritlord:{n:'เจ้าแห่งภูติ',p:'soullink',m:{matk:1.2},pas:['mpregen'],sum:2,sk:[[40,'sp_storm']],d:'พายุภูติโจมตีหมู่'},
};
const BASES=Object.keys(CLS).filter(k=>!CLS[k].p);

/* ================= WEAPONS & GEAR ================= */
const WT={sword:{n:'ดาบ',t:'p'},axe:{n:'ขวาน',t:'p'},bow:{n:'ธนู',t:'p'},staff:{n:'คทา',t:'m'},mace:{n:'ค้อน',t:'p'},gun:{n:'ปืน',t:'p'},dagger:{n:'มีดสั้น',t:'p'},whip:{n:'แส้',t:'m'}};
const WN={
 sword:[['ดาบฝึกหัด'],['ดาบเหล็กกล้า','fire','ฟันเพลิง'],['ดาบวารีจันทรา','water','ฟันกระแสน้ำ'],['ดาบอสนีบาต','electric','ฟันพายุสายฟ้า'],['ดาบมังกรเพลิง','dragon','ฟันมังกรผงาด'],['ดาบเทพครุฑ','flying','ปีกครุฑผ่าฟ้า']],
 axe:[['ขวานฝึกหัด'],['ขวานศิลา','rock','ทุบศิลา'],['ขวานเหล็กกล้า','steel','ผ่าเหล็กกล้า'],['ขวานแผ่นดิน','ground','ขวานแยกแผ่นดิน'],['ขวานราชันย์อสูร','dark','ขวานทมิฬ'],['ขวานไททัน','fighting','ทลายไททัน']],
 bow:[['ธนูไม้ฝึกหัด'],['ธนูลมพัด','flying','ศรลมกรด'],['ธนูหิมะ','ice','ศรน้ำแข็ง'],['ธนูพฤกษา','grass','ฝนศรพฤกษา'],['ธนูตะวัน','fire','ศรสุริยัน'],['ธนูจันทราเทพ','fairy','ศรจันทราพร่างพราย']],
 staff:[['ไม้เท้าฝึกหัด'],['คทาเปลวไฟ','fire','ระเบิดเปลวไฟ'],['คทาน้ำแข็ง','ice','หอกหิมะ'],['คทาอสนี','electric','พายุอสนีบาต'],['คทาจิตวิญญาณ','psychic','คลื่นจิตทำลาย'],['คทาอเวจี','dark','ห้วงอเวจี']],
 mace:[['กระบองฝึกหัด'],['กระบองเหล็ก','steel','ทุบเหล็ก'],['ค้อนหิน','rock','ค้อนหินผา'],['ค้อนทองคำ','normal','ค้อนทองคำถล่ม'],['ค้อนพายุ','electric','ค้อนสายฟ้า'],['ค้อนเทพธนบดี','fairy','ค้อนแห่งความมั่งคั่ง']],
 gun:[['ปืนพกฝึกหัด'],['ปืนพกเหล็ก','steel','กระสุนเหล็ก'],['ปืนเพลิง','fire','กระสุนระเบิดเพลิง'],['ปืนลูกซอง','normal','ลูกปรายกระจาย'],['ปืนอสนี','electric','กระสุนสายฟ้า'],['ปืนใหญ่มังกร','dragon','กระสุนมังกร']],
 dagger:[['มีดสั้นฝึกหัด'],['มีดพิษ','poison','เชือดพิษ'],['มีดเงา','dark','เชือดเงา'],['มีดลม','flying','พายุใบมีด'],['มีดผี','ghost','แทงวิญญาณ'],['มีดนาคราช','water','เขี้ยวนาคราช']],
 whip:[['แส้ฝึกหัด'],['แส้เถาวัลย์','grass','แส้เถาวัลย์รัด'],['แส้ไฟ','fire','แส้เพลิง'],['แส้ภูต','fairy','แส้พรภูต'],['แส้วิญญาณ','ghost','แส้กระชากวิญญาณ'],['แส้มังกร','dragon','แส้มังกรคำราม']],
};
const WF=[4,10,17,27,40,56],WLV=[1,6,13,21,30,40],WPR=[40,300,900,2400,6000,15000],WPW=[0,140,160,135,205,185],WMP=[0,5,7,9,11,14];
function wStats(type,t){const f=WF[t],o=({sword:{patk:f,acc:t*2},axe:{patk:f*1.1,pdef:t*3},bow:{patk:f*.95,acc:t*3,crit:t},staff:{matk:f,mp:t*8},mace:{patk:f,hp:t*15},gun:{patk:f,acc:t*3,crit:t},dagger:{patk:f*.85,crit:t*1.5,spd:t},whip:{matk:f*.85,mp:t*8,spd:t}})[type];
 const s={};for(const k in o){const v=Math.round(o[k]);if(v)s[k]=v}return s}
const EQ={};
for(const type in WN)WN[type].forEach(([n,el,skn],t)=>{const id=`wp_${type}${t}`;EQ[id]={n,slot:'weapon',wt:type,t:WT[type].t,lv:WLV[t],price:WPR[t],st:wStats(type,t),el:el||null,tier:t};
 if(t>0){const ws='ws_'+type+t,es=ELST[el];SK[ws]={n:skn,t:WT[type].t,pw:WPW[t],el,mp:WMP[t],...(t===3||t===5?{all:1}:{}),...(es?{st:{[es[0]]:+(es[1]*1.5).toFixed(2)}}:{})};EQ[id].ws=ws}});
const SLOTS=[['weapon','อาวุธ'],['armor','เกราะ'],['gloves','ถุงมือ'],['boots','รองเท้า'],['belt','เข็มขัด'],['bracelet','กำไล'],['ring','แหวน'],['necklace','สร้อยคอ'],['crown','มงกุฎ']];
const SLOTN=Object.fromEntries(SLOTS);
const SLOTBASE={armor:{pdef:4,mdef:2,hp:15},gloves:{patk:2,acc:3},boots:{spd:2,eva:2},belt:{hp:14,pdef:2},bracelet:{matk:2,mdef:2},ring:{patk:1,matk:1,acc:2,eva:1},necklace:{mp:10,mdef:3},crown:{matk:2,mp:8,mdef:2}};
const TIERS=[['ฝึกหัด',1,1,50],['เหล็กกล้า',6,2.4,260],['เงินจันทร์',13,4.5,1000],['เกล็ดมังกร',21,7.5,3500],['อาดามันไทต์',30,11,8000]];
for(const sl in SLOTBASE)TIERS.forEach(([tn,lv,m,pr],ti)=>{const st={};for(const k in SLOTBASE[sl])st[k]=Math.max(1,Math.round(SLOTBASE[sl][k]*m));EQ[sl+'_'+ti]={n:SLOTN[sl]+tn,slot:sl,lv,price:pr,st,tier:ti}});
/* special gear: passives and item skills */
const SG={
 ring_antidote:{n:'แหวนต้านพิษ',slot:'ring',lv:4,price:350,st:{mdef:2},pas:'imm_poison'},
 brace_luck:{n:'กำไลโชคลาภ',slot:'bracelet',lv:5,price:600,st:{eva:2},pas:'lucky'},
 ring_fire:{n:'แหวนลูกไฟ',slot:'ring',lv:5,price:500,st:{matk:3},sk:'fire_m1'},
 belt_alert:{n:'เข็มขัดตื่นตัว',slot:'belt',lv:7,price:500,st:{hp:20},pas:'imm_sleep'},
 ring_heal:{n:'แหวนเยียวยา',slot:'ring',lv:8,price:800,st:{mp:10},sk:'teamheal'},
 boots_wind:{n:'รองเท้าลมกรด',slot:'boots',lv:8,price:900,st:{spd:4,eva:3},pas:'swift'},
 neck_calm:{n:'สร้อยจิตสงบ',slot:'necklace',lv:9,price:700,st:{mdef:4},pas:'imm_mind'},
 neck_sun:{n:'สร้อยตะวันอุ่น',slot:'necklace',lv:10,price:800,st:{mdef:4,hp:20},pas:'imm_freeze'},
 brace_static:{n:'กำไลอสนี',slot:'bracelet',lv:10,price:900,st:{matk:3},pas:'imm_para',sk:'electric_m1'},
 crown_eagle:{n:'มงกุฎตาเหยี่ยว',slot:'crown',lv:11,price:1000,st:{acc:10},pas:'eagle'},
 belt_rock:{n:'เข็มขัดหินผา',slot:'belt',lv:12,price:1200,st:{hp:40,pdef:4},pas:'sturdy'},
 brace_thorn:{n:'กำไลหนาม',slot:'bracelet',lv:12,price:1100,st:{pdef:5},pas:'thorns'},
 crown_sage:{n:'มงกุฎปราชญ์',slot:'crown',lv:14,price:1600,st:{matk:5,mp:20},pas:'mpregen'},
 ring_wind:{n:'แหวนสายลม',slot:'ring',lv:15,price:1500,st:{spd:3},sk:'flying_st'},
 armor_berserk:{n:'เกราะคลั่ง',slot:'armor',lv:15,price:1900,st:{patk:6,hp:40,pdef:8},pas:'rage'},
 glove_assassin:{n:'ถุงมือนักฆ่า',slot:'gloves',lv:16,price:1800,st:{patk:6,crit:3},pas:'keen'},
 boots_float:{n:'รองเท้าลอยฟ้า',slot:'boots',lv:18,price:2400,st:{eva:6,spd:3},pas:'levitate'},
 ring_blood:{n:'แหวนโลหิต',slot:'ring',lv:20,price:3000,st:{patk:4,matk:4},pas:'lifesteal'},
 glove_guard:{n:'ถุงมือผู้พิทักษ์',slot:'gloves',lv:20,price:2800,st:{pdef:8,mdef:4},pas:'guardian'},
 neck_storm:{n:'สร้อยเทพพายุ',slot:'necklace',lv:22,price:3600,st:{matk:8,mp:20},sk:'electric_aoe'},
 armor_dragon:{n:'เกราะเกล็ดมังกร',slot:'armor',lv:24,price:5200,st:{pdef:28,mdef:16,hp:80},pas:'thick'},
 crown_pierce:{n:'มงกุฎทะลวง',slot:'crown',lv:26,price:6000,st:{patk:8,matk:8},pas:'pierce'},
 neck_phoenix:{n:'สร้อยขนฟีนิกซ์',slot:'necklace',lv:30,price:9000,st:{hp:60,mdef:10},pas:'rebirth'},
 armor_saint:{n:'เกราะศักดิ์สิทธิ์',slot:'armor',lv:32,price:14000,st:{pdef:40,mdef:40,hp:120},pas:'rainbow'},
 ring_deadly:{n:'แหวนจุดตาย',slot:'ring',lv:34,price:12000,st:{crit:5,acc:8},pas:'deadly'},
};
for(const k in SG)EQ[k]={...SG[k],special:1};

const CON={
 petExp1:{n:'ผลึกเติบโตอสูร',price:300,petExp:500},petExp2:{n:'ผลึกเติบโตอสูรชั้นสูง',price:1300,petExp:2500},petExp3:{n:'ผลึกเติบโตอสูรโบราณ',price:4500,petExp:10000},pot:{n:'ยาฟื้นพลัง',d:'ฟื้น HP 60',price:20,hp:60},
 pot2:{n:'ยาฟื้นพลังชั้นสูง',d:'ฟื้น HP 250',price:90,hp:250,lv:10},
 pot3:{n:'ยาฟื้นพลังเต็มขวด',d:'ฟื้น HP 700',price:300,hp:700,lv:25},
 eth:{n:'น้ำมนต์เวท',d:'ฟื้น MP 30',price:30,mp:30},
 eth2:{n:'น้ำมนต์เวทชั้นสูง',d:'ฟื้น MP 120',price:150,mp:120,lv:20},
 revivePotion:{n:'ยาชุบชีวิตแห่งแสง',d:'ไอเท็มหายากจากหีบ ชุบอสูรที่หมดสติ 1 ตัว ฟื้น HP เต็ม',price:0,rev:1,rareLoot:true},
 rev:{n:'ธูปเรียกวิญญาณ',d:'ปลุกอสูรที่หมดสติ ฟื้น HP ครึ่งหนึ่ง',price:120,rev:.5},
 antidote:{n:'ยาแก้พิษ',d:'รักษาติดพิษ',price:15,cure:['poison']},
 burnheal:{n:'ขี้ผึ้งดับร้อน',d:'รักษาติดไฟ',price:15,cure:['burn']},
 thaw:{n:'น้ำมันอุ่นกาย',d:'รักษาแช่แข็งและเยือกแข็ง',price:15,cure:['freeze','chill']},
 relax:{n:'ยาคลายเส้น',d:'รักษาอัมพาตและไฟฟ้าสถิต',price:15,cure:['para','static']},
 calm:{n:'ธูปสงบจิต',d:'รักษานอนหลับ มึนงง หลงรัก มนต์สะกด',price:25,cure:['sleep','confuse','love','charm']},
 allcure:{n:'โอสถครอบจักรวาล',d:'รักษาทุกสถานะ',price:70,lv:8,cure:Object.keys(STS)},
 seal1:{n:'ผนึกกระดาษ',d:'พลังผนึก ×1.0',price:30,seal:1},
 seal2:{n:'ผนึกหยก',d:'พลังผนึก ×1.7',price:120,seal:1.7,lv:6},
 seal3:{n:'ผนึกทองคำ',d:'พลังผนึก ×2.6',price:420,seal:2.6,lv:13},
 seal4:{n:'ผนึกจักรพรรดิ',d:'พลังผนึก ×4.0',price:1300,seal:4,lv:21},
 seal5:{n:'ผนึกสวรรค์',d:'พลังผนึก ×6.0',price:3500,seal:6,lv:32},
};
const CURES=['antidote','burnheal','thaw','relax','calm'];
const SEALS=['seal1','seal2','seal3','seal4','seal5'];

/* ================= BEASTS (50) ================= */
/* b: [hp,mp,patk,matk,pdef,mdef,acc,eva,spd]; ev: evolution forms [lv,name]; sig: signature skill */
const SP={
/* zone 1 */
kappa:{n:'คัปปะ',o:'ญี่ปุ่น',t:['water','fighting'],em:'🐢',r:1,b:[46,20,9,6,8,6,90,6,8],sk:['water_p1','fighting_p1','rock_st','water_aoe'],pas:'sturdy',ev:[[14,'คัปปะนักรบ'],[30,'ราชาคัปปะ']],sig:'s_kappa',parts:[['จานน้ำบนหัวคัปปะ',16],['กระดองคัปปะ',24]]},
wisp:{n:'วิลโอเดอะวิสป์',o:'อังกฤษ',t:['fire','ghost'],em:'👻',r:1,b:[36,30,5,10,4,7,92,10,11],sk:['fire_m1','ghost_p1','ghost_st','fire_aoe'],pas:'levitate',ev:[[14,'วิสป์เพลิงผี'],[30,'โคมวิญญาณมรณะ']],sig:'s_wisp',parts:[['แก่นเปลวไฟวิญญาณ',20],['ฝุ่นแสงภูต',14]]},
mandrake:{n:'แมนเดรก',o:'ยุโรป',t:['grass','poison'],em:'🌱',r:1,b:[46,26,7,9,7,7,90,6,7],sk:['grass_m1','poison_st','grass_st','grass_aoe'],pas:'imm_poison',ev:[[14,'แมนเดรกกรีดร้อง'],[30,'ราชินีแมนเดรก']],sig:'s_mandrake',parts:[['รากแมนเดรก',18],['ใบแมนเดรก',12]]},
jackalope:{n:'แจ็กคาโลป',o:'อเมริกา',t:['normal','flying'],em:'🐇',r:1,b:[38,22,9,5,5,5,92,12,13],sk:['normal_p1','flying_p1','flying_st','normal_p2'],pas:'swift',parts:[['เขากวางแจ็กคาโลป',18],['ขนนุ่มกระต่ายเขา',12]]},
tanuki:{n:'บาเคดานุกิ',o:'ญี่ปุ่น',t:['normal','psychic'],em:'🦝',r:1.2,b:[50,22,8,7,8,6,88,6,7],sk:['normal_p1','psychic_st','heal_self','psychic_m2'],pas:'lucky',ev:[[14,'ทานุกิแปลงกาย'],[30,'ทานุกิพันหน้า']],sig:'s_tanuki',parts:[['ใบไม้แปลงกาย',12],['หางพองทานุกิ',20]]},
raiju:{n:'ไรจู',o:'ญี่ปุ่น',t:['electric'],em:'⚡',r:1.3,b:[40,26,9,11,5,6,92,11,14],sk:['electric_p1','electric_m1','electric_st','electric_aoe'],pas:'staticbody',ev:[[14,'ไรจูอัสนี'],[30,'เทพอสูรสายฟ้า']],sig:'s_raiju',parts:[['ขนสายฟ้าไรจู',22],['เขี้ยวอัสนี',26]]},
pixie:{n:'พิกซี่',o:'อังกฤษ',t:['fairy'],em:'🧚',r:1.3,b:[34,34,4,11,5,9,94,14,13],sk:['fairy_m1','fairy_st','teamheal','fairy_m2'],pas:'elusive',ev:[[14,'พิกซี่ดอกไม้'],[30,'ราชินีภูตไททาเนีย']],sig:'s_pixie',parts:[['ผงภูตพิกซี่',20],['ปีกใสพิกซี่',26]]},
kodama:{n:'โคดามะ',o:'ญี่ปุ่น',t:['grass'],em:'🌳',r:1.1,b:[54,24,6,8,9,8,88,5,6],sk:['grass_p1','heal_self','grass_st','grass_m2'],pas:'regen',ev:[[14,'โคดามะพันปี'],[30,'วิญญาณต้นไม้ศักดิ์สิทธิ์']],sig:'s_kodama',parts:[['เปลือกไม้วิญญาณ',15],['ยางไม้ศักดิ์สิทธิ์',22]]},
redcap:{n:'เรดแคป',o:'สกอตแลนด์',t:['dark','fighting'],em:'👹',r:1.2,b:[42,18,11,4,6,4,90,8,11],sk:['dark_p1','fighting_p1','dark_st','dark_p2'],pas:'rage',ev:[[14,'เรดแคปเลือดเย็น'],[30,'ราชันย์เรดแคป']],sig:'s_redcap',parts:[['หมวกแดงเปื้อนเลือด',20],['ขวานเล็กสนิมเขรอะ',16]]},
/* zone 2 */
kitsune:{n:'จิ้งจอกสามหาง',o:'จีน · ญี่ปุ่น',t:['fire','psychic'],em:'🦊',r:2,b:[44,32,7,12,6,9,94,12,13],sk:['fire_m1','psychic_st','fire_m2','psychic_m2'],pas:'mpregen',ev:[[22,'จิ้งจอกหกหาง'],[38,'จิ้งจอกเก้าหาง']],sig:'s_kitsune',parts:[['หางจิ้งจอกเงิน',60],['ไข่มุกจิ้งจอก',95]]},
tengu:{n:'เทงงุ',o:'ญี่ปุ่น',t:['flying','fighting'],em:'👺',r:1.8,b:[44,26,12,7,7,7,94,10,14],sk:['flying_p1','fighting_st','flying_p2','fighting_p2'],pas:'eagle',ev:[[22,'คาราสึเทงงุ'],[38,'ไดเทงงุ']],sig:'s_tengu',parts:[['ขนปีกเทงงุ',45],['พัดใบตองเทงงุ',40]]},
griffin:{n:'กริฟฟิน',o:'กรีก',t:['flying','normal'],em:'🦅',r:2,b:[54,20,13,5,9,6,92,8,12],sk:['flying_p1','normal_st','flying_p2','normal_aoe'],pas:'intimidate',ev:[[22,'กริฟฟินศึก'],[38,'ราชันย์กริฟฟิน']],sig:'s_griffin',parts:[['ขนปีกกริฟฟิน',55],['กรงเล็บกริฟฟิน',50]]},
nilmangkorn:{n:'ม้านิลมังกร',o:'ไทย',t:['water','dragon'],em:'🐎',r:2.2,b:[56,26,12,9,9,8,92,8,12],sk:['water_p1','dragon_st','water_p2','dragon_p2'],pas:'swift',ev:[[22,'ม้านิลมังกรศึก'],[38,'ม้านิลมังกรทรงเครื่อง']],sig:'s_nil',parts:[['เกล็ดนิลมังกร',70],['แผงคอม้านิล',55]]},
jorogumo:{n:'โจโรกุโมะ',o:'ญี่ปุ่น',t:['bug','poison'],em:'🕷️',r:2,b:[48,30,11,10,8,8,94,10,12],sk:['bug_p1','bug_st','poison_p2','poison_aoe'],pas:'poisonTouch',ev:[[22,'โจโรกุโมะสาว'],[38,'ราชินีแมงมุมโจโร']],sig:'s_joro',parts:[['ใยไหมทองคำ',55],['เขี้ยวพิษแมงมุม',60]]},
baku:{n:'บาคุ',o:'ญี่ปุ่น · จีน',t:['psychic','normal'],em:'🐽',r:1.8,b:[62,30,7,11,10,11,88,5,7],sk:['psychic_m1','heal_self','psychic_st','psychic_aoe'],pas:'imm_sleep',parts:[['งวงกินฝัน',50],['ขนลายบาคุ',40]]},
harpy:{n:'ฮาร์ปี้',o:'กรีก',t:['flying','dark'],em:'🦜',r:1.8,b:[40,24,11,8,6,6,94,15,15],sk:['flying_p1','dark_p1','flying_st','flying_aoe'],pas:'elusive',parts:[['ขนนกฮาร์ปี้',45],['กรงเล็บฮาร์ปี้',45]]},
kelpie:{n:'เคลปี้',o:'สกอตแลนด์',t:['water','ghost'],em:'🐴',r:2,b:[52,28,10,10,8,8,92,9,12],sk:['water_p1','ghost_st','water_aoe','ghost_m2'],pas:'lifesteal',ev:[[22,'เคลปี้หลอน'],[38,'ม้าวิญญาณทะเลสาบ']],sig:'s_kelpie',parts:[['สาหร่ายแผงคอ',45],['บังเหียนวิญญาณ',70]]},
nue:{n:'นุเอะ',o:'ญี่ปุ่น',t:['dark','electric'],em:'🐒',r:2,b:[50,28,11,11,8,8,92,10,12],sk:['electric_p1','dark_p1','electric_st','dark_m2'],pas:'staticbody',ev:[[22,'นุเอะทมิฬ'],[38,'นุเอะราชาเมฆา']],sig:'s_nue',parts:[['หางงูนุเอะ',55],['ขนลิงนุเอะ',45]]},
/* zone 3 */
sphinx:{n:'สฟิงซ์',o:'อียิปต์',t:['ground','psychic'],em:'🦁',r:3,b:[64,34,12,13,12,12,94,8,10],sk:['ground_p1','psychic_st','psychic_m2','ground_aoe'],pas:'imm_mind',parts:[['กรงเล็บสฟิงซ์',110],['แผงคอทองคำ',140]]},
basilisk:{n:'บาซิลิสก์',o:'ยุโรป',t:['poison','dark'],em:'🦎',r:3,b:[52,30,13,10,10,9,95,12,13],sk:['poison_p1','poison_st','dark_p2','poison_aoe'],pas:'poisonTouch',ev:[[30,'บาซิลิสก์ศิลา'],[44,'ราชันย์อสรพิษ']],sig:'s_basilisk',parts:[['เขี้ยวพิษบาซิลิสก์',120],['ดวงตาศิลา',160]]},
cerberus:{n:'สุนัขนรก',o:'กรีก',t:['dark','fire'],em:'🐕',r:3,b:[62,24,15,8,11,8,92,7,11],sk:['dark_p1','fire_p1','normal_st','fire_p2'],pas:'intimidate',ev:[[30,'ออร์ธรอส'],[44,'เคอร์เบอรัส']],sig:'s_cerberus',parts:[['เขี้ยวสุนัขนรก',130],['ปลอกคอนรก',100]]},
manticore:{n:'แมนติคอร์',o:'เปอร์เซีย',t:['ground','poison'],em:'🦂',r:3,b:[60,26,14,10,11,9,93,9,11],sk:['ground_p1','poison_p2','fighting_st','ground_p2'],pas:'thorns',parts:[['เหล็กไนแมนติคอร์',140],['แผงคอแมนติคอร์',90]]},
yeti:{n:'เยติ',o:'หิมาลัย',t:['ice','fighting'],em:'🦍',r:3,b:[70,22,15,8,12,9,90,6,9],sk:['ice_p1','fighting_p1','ice_st','ice_aoe'],pas:'thick',ev:[[30,'เยติภูเขา'],[44,'ราชาเยติ']],sig:'s_yeti',parts:[['ขนเยติ',100],['กรงเล็บน้ำแข็ง',120]]},
golem:{n:'โกเลม',o:'ยิว · ยุโรปตะวันออก',t:['rock','steel'],em:'🗿',r:3,b:[80,16,15,6,18,10,88,3,6],sk:['rock_p1','rock_st','steel_p2','rock_aoe'],pas:'nocrit',ev:[[30,'โกเลมเหล็กกล้า'],[44,'โกเลมอาดามันไทต์']],sig:'s_golem',parts:[['แกนหินโกเลม',150],['ศิลาจารึกชีวิต',190]]},
minotaur:{n:'มิโนทอร์',o:'กรีก',t:['fighting','normal'],em:'🐂',r:3,b:[72,20,17,6,12,8,90,6,10],sk:['normal_p1','fighting_p2','fighting_st','ground_aoe'],pas:'rage',parts:[['เขามิโนทอร์',130],['ขวานสำริดหัก',100]]},
mummy:{n:'มัมมี่',o:'อียิปต์',t:['ghost','ground'],em:'🧟',r:2.6,b:[64,30,11,12,12,13,88,4,6],sk:['ghost_p1','ground_st','ghost_m2','poison_st'],pas:'regen',parts:[['ผ้าพันศพโบราณ',90],['เครื่องรางสุสาน',130]]},
scarab:{n:'สคารับ',o:'อียิปต์',t:['bug','ground'],em:'🪲',r:2.8,b:[58,26,13,9,14,10,92,8,10],sk:['bug_p1','ground_p1','rock_st','bug_aoe'],pas:'imm_burn',ev:[[30,'สคารับทองคำ'],[44,'เคปรีเทพสุริยา']],sig:'s_scarab',parts:[['กระดองสคารับ',110],['อำพันสุริยา',150]]},
/* zone 4 */
dragon:{n:'ลูกมังกร',o:'ยุโรป',t:['fire','dragon'],em:'🐉',r:4,b:[78,36,16,16,14,13,94,8,11],sk:['dragon_p1','fire_m1','dragon_st','fire_m2'],pas:'intimidate',ev:[[34,'มังกรหนุ่ม'],[48,'มังกรตะวันตก']],sig:'s_dragon',parts:[['เกล็ดมังกร',300],['หัวใจมังกร',520]]},
naga:{n:'งูนาค',o:'ไทย · ลาว',t:['water','dragon'],em:'🐍',r:4,b:[74,40,13,17,12,15,94,9,11],sk:['water_m1','dragon_m1','teamheal','water_aoe'],pas:'regen',ev:[[34,'นาคราช'],[48,'พญานาค']],sig:'s_naga',parts:[['เกล็ดพญานาค',280],['ลูกแก้วนาคา',460]]},
hydra:{n:'ไฮดรา',o:'กรีก',t:['poison','dragon'],em:'🐊',r:3.8,b:[90,30,15,12,13,11,90,5,8],sk:['poison_p1','dragon_p1','heal_self','poison_aoe'],pas:'multihit',parts:[['หัวไฮดรา',260],['เลือดพิษไฮดรา',400]]},
thunderbird:{n:'ธันเดอร์เบิร์ด',o:'ชนพื้นเมืองอเมริกา',t:['electric','flying'],em:'⛈️',r:3.6,b:[64,34,13,15,10,11,94,11,15],sk:['flying_p1','electric_m1','flying_st','electric_aoe'],pas:'imm_para',ev:[[34,'ธันเดอร์เบิร์ดพายุ'],[48,'นกอัสนีจ้าวพายุ']],sig:'s_tbird',parts:[['ขนนกอัสนี',240],['หินฟ้าผ่า',360]]},
gargoyle:{n:'การ์กอยล์',o:'ฝรั่งเศส',t:['rock','flying'],em:'🦇',r:3.4,b:[70,22,15,8,17,11,90,6,9],sk:['rock_p1','flying_p1','rock_st','rock_p2'],pas:'sturdy',ev:[[34,'การ์กอยล์ศิลา'],[48,'การ์กอยล์ปีศาจ']],sig:'s_gargoyle',parts:[['ปีกหินการ์กอยล์',220],['ดวงตาทับทิม',330]]},
jiangshi:{n:'เจียงซือ',o:'จีน',t:['ghost','fighting'],em:'🧛',r:3.4,b:[72,24,16,8,12,10,90,5,8],sk:['ghost_p1','fighting_p1','ghost_st','fighting_p2'],pas:'imm_sleep',ev:[[34,'เจียงซือร้อยปี'],[48,'ราชันย์เจียงซือ']],sig:'s_jiangshi',parts:[['ยันต์เหลืองแปะหน้า',200],['ชุดขุนนางชิง',300]]},
banshee:{n:'แบนชี',o:'ไอร์แลนด์',t:['ghost','fairy'],em:'💀',r:3.6,b:[56,40,8,17,9,14,94,13,13],sk:['ghost_m1','fairy_st','ghost_aoe','fairy_m2'],pas:'levitate',parts:[['หยดน้ำตาแบนชี',250],['หวีเงินแบนชี',340]]},
/* zone 5 */
behemoth:{n:'เบฮีมอธ',o:'ตะวันออกกลาง',t:['ground','steel'],em:'🦏',r:4.5,b:[110,24,20,8,20,12,90,4,7],sk:['ground_p2','steel_p1','ground_aoe','rock_st'],pas:'nocrit',parts:[['เขาเบฮีมอธ',480],['หนังเหล็กเบฮีมอธ',600]]},
ifrit:{n:'อิฟริต',o:'อาหรับ',t:['fire','dark'],em:'😈',r:4.5,b:[78,44,15,20,12,14,94,9,13],sk:['fire_m2','dark_m1','fire_st','fire_aoe'],pas:'flameBody',parts:[['ตะเกียงอิฟริต',500],['แก่นเปลวไฟนรก',620]]},
nidhogg:{n:'นีดฮ็อก',o:'นอร์ส',t:['dragon','dark'],em:'🐲',r:5,b:[96,36,19,16,15,13,94,8,11],sk:['dragon_p2','dark_p2','dark_st','dragon_aoe'],pas:'lifesteal',parts:[['เขี้ยวนีดฮ็อก',560],['รากต้นอิกดราซิล',700]]},
jormungandr:{n:'โยรมุนกันด์',o:'นอร์ส',t:['poison','water'],em:'🌊',r:5,b:[104,34,17,15,16,14,92,6,9],sk:['poison_p2','water_p2','poison_st','water_aoe'],pas:'regen',parts:[['เกล็ดอสรพิษโลก',540],['พิษกลืนโลก',680]]},
chimera:{n:'คิเมร่า',o:'กรีก',t:['fire','poison'],em:'🐐',r:4.5,b:[84,32,17,15,13,12,93,9,12],sk:['fire_p2','poison_p1','normal_st','fire_aoe'],pas:'multihit',parts:[['หัวแพะคิเมร่า',460],['หางงูคิเมร่า',520]]},
ammit:{n:'อัมมิต',o:'อียิปต์',t:['dark','ground'],em:'🦛',r:4.5,b:[92,26,19,10,15,12,92,7,10],sk:['dark_p2','ground_p2','dark_st','ground_aoe'],pas:'rage',parts:[['เขี้ยวผู้กลืนวิญญาณ',500],['เกล็ดอัมมิต',560]]},
/* rare (mist only) */
qilin:{n:'กิเลน',o:'จีน',t:['fairy','fire'],em:'🦌',r:3.5,rare:1,b:[60,36,10,13,11,13,94,9,11],sk:['fairy_m1','fire_m1','teamheal','fairy_m2'],pas:'rainbow',sig:'s_qilin',parts:[['เขากิเลน',150],['เกล็ดกิเลน',120]]},
unicorn:{n:'ยูนิคอร์น',o:'ยุโรป',t:['fairy','psychic'],em:'🦄',r:3.5,rare:1,b:[58,36,11,13,9,12,94,11,13],sk:['fairy_p1','psychic_m1','heal_self','fairy_p2'],pas:'imm_mind',sig:'s_unicorn',parts:[['เขายูนิคอร์น',180],['แผงคอสีรุ้ง',120]]},
pegasus:{n:'เพกาซัส',o:'กรีก',t:['flying','electric'],em:'✨',r:3.8,rare:1,b:[62,30,14,12,10,10,96,13,16],sk:['flying_p1','electric_p1','flying_st','electric_m2'],pas:'swift',sig:'s_pegasus',parts:[['ขนปีกเพกาซัส',220],['เกือกม้าสายฟ้า',260]]},
erawan:{n:'ช้างเอราวัณ',o:'ไทย · อินเดีย',t:['fairy','normal'],em:'🐘',r:4,rare:1,b:[110,30,15,12,15,15,90,4,8],sk:['normal_p2','fairy_m1','normal_st','fairy_aoe'],pas:'guardian',sig:'s_erawan',parts:[['งาเอราวัณ',300],['เครื่องทรงช้างเผือก',360]]},
baihu:{n:'เสือขาวไป๋หู่',o:'จีน',t:['steel','fighting'],em:'🐅',r:4,rare:1,b:[72,24,19,8,14,10,95,11,15],sk:['steel_p1','fighting_p1','steel_st','fighting_p2'],pas:'keen',sig:'s_baihu',parts:[['เขี้ยวพยัคฆ์ขาว',380],['หนังลายเงิน',420]]},
lamassu:{n:'ลามัสซู',o:'อัสซีเรีย',t:['rock','fairy'],em:'🦬',r:4.5,rare:1,b:[96,30,14,13,18,16,90,5,8],sk:['rock_p1','fairy_m1','rock_st','rock_aoe'],pas:'guardian',sig:'s_lamassu',parts:[['ปีกศิลาลามัสซู',420],['มงกุฎเขาวัว',480]]},
fenrir:{n:'เฟนเรียร์',o:'นอร์ส',t:['dark','ice'],em:'🐺',r:4.5,rare:1,b:[80,30,20,12,13,11,95,11,16],sk:['dark_p2','ice_p1','normal_st','ice_aoe'],pas:'pierce',sig:'s_fenrir',parts:[['ขนเฟนเรียร์',520],['โซ่ไกลพนีร์ที่ขาด',640]]},
kraken:{n:'คราเคน',o:'นอร์ส',t:['water','dark'],em:'🦑',r:4.5,rare:1,b:[110,36,17,15,14,14,90,5,8],sk:['water_p2','dark_p1','water_st','water_aoe'],pas:'thick',sig:'s_kraken',parts:[['หนวดคราเคน',500],['หมึกดำทะเลลึก',600]]},
phoenix:{n:'ฟีนิกซ์',o:'กรีก · อียิปต์',t:['fire','flying'],em:'🔥',r:5,rare:1,b:[72,44,11,20,12,16,95,12,15],sk:['fire_m2','flying_p1','heal_self','fire_aoe'],pas:'rebirth',sig:'s_phoenix',parts:[['ขนนกฟีนิกซ์',700],['น้ำตาฟีนิกซ์',900]]},
garuda:{n:'พญาครุฑ',o:'ไทย · อินเดีย',t:['flying','fairy'],em:'👑',r:5,rare:1,b:[82,32,21,12,14,12,96,11,17],sk:['flying_p2','fairy_p1','flying_st','fairy_p2'],pas:'adapt',sig:'s_garuda',parts:[['ขนครุฑทองคำ',680],['กรงเล็บครุฑ',820]]},
};
const STARTERS=['mandrake','wisp','kappa'];
const MAXPETS=80;

const ZN=[
 {id:1,n:'ป่าแสงจันทร์',d:'ป่าโปร่งริมลำธาร อสูรตัวเล็กชอบซ่อนในพุ่มหญ้า',lv:[1,7],sp:['kappa','wisp','mandrake','jackalope','tanuki','raiju','pixie','kodama','redcap'],rare:['qilin','unicorn'],boss:{sp:'tanuki',lv:9,n:'ราชาทานุกิ'},mini:0},
 {id:2,n:'หุบเขาหมอกเซียน',d:'หมอกหนาปกคลุมศาลเจ้าร้าง ได้ยินเสียงกระดิ่งตลอดเวลา',lv:[7,15],sp:['kitsune','tengu','griffin','nilmangkorn','jorogumo','baku','harpy','kelpie','nue'],rare:['pegasus','erawan'],boss:{sp:'kitsune',lv:17,n:'จิ้งจอกพันปี'},mini:1},
 {id:3,n:'ทะเลทรายสุสานทอง',d:'ซากวิหารใต้ผืนทราย ผู้เฝ้าประตูยังไม่เคยหลับ',lv:[14,23],sp:['sphinx','basilisk','cerberus','manticore','yeti','golem','minotaur','mummy','scarab'],rare:['baihu','lamassu'],boss:{sp:'sphinx',lv:25,n:'สฟิงซ์ผู้เฝ้าสุสาน'},mini:1},
 {id:4,n:'ยอดเขามังกรหลับ',d:'ยอดเขาเหนือเมฆ ที่อยู่ของอสูรระดับตำนาน',lv:[23,34],sp:['dragon','naga','hydra','thunderbird','gargoyle','jiangshi','banshee'],rare:['fenrir','kraken'],boss:{sp:'dragon',lv:37,n:'มังกรเพลิงโบราณ'},mini:2},
 {id:5,n:'แดนสวรรค์ล่มสลาย',d:'ซากอาณาจักรเทพที่ร่วงจากฟากฟ้า อสูรวันสิ้นโลกเดินเพ่นพ่าน',lv:[33,46],sp:['behemoth','ifrit','nidhogg','jormungandr','chimera','ammit'],rare:['phoenix','garuda'],boss:{sp:'nidhogg',lv:50,n:'นีดฮ็อกผู้กัดกินรากโลก'},mini:2},
];
const NPC=[
 {n:'ต้นกล้า เด็กฝึกผนึก',lv:3,cls:'swordsman',pets:[['jackalope',3]],gold:60},
 {n:'ปาริฉัตร นักล่าแห่งป่าจันทร์',lv:6,cls:'archer',pets:[['raiju',7]],gold:150},
 {n:'หลินเฟย นักพรตเต๋า',lv:10,cls:'mage',pets:[['baku',10]],gold:400},
 {n:'แกเร็ธ อัศวินเกราะเงิน',lv:14,cls:'gladiator',pets:[['griffin',15]],gold:800},
 {n:'จันทร์เพ็ญ ผู้พิทักษ์ลุ่มน้ำ',lv:18,cls:'summoner',pets:[['nilmangkorn',18],['kelpie',17]],gold:1400},
 {n:'เนเฟอร์ ฟาโรห์ร่างเงา',lv:24,cls:'thief',pets:[['scarab',24],['mummy',23]],gold:2500},
 {n:'มอร์แกนา จอมขมังเวทย์',lv:30,cls:'warlock',pets:[['hydra',30]],gold:4500},
 {n:'ธาราเทพ ปรมาจารย์ผนึก',lv:38,cls:'tamer',pets:[['dragon',38],['naga',37]],gold:9000},
 {n:'คาเงะโทระ โชกุนเงา',lv:44,cls:'shogun',pets:[['jiangshi',44],['gargoyle',43]],gold:16000},
 {n:'ราชันย์ไร้นาม',lv:50,cls:'archmage',pets:[['nidhogg',50],['ifrit',48]],gold:32000},
];

NPC.push(
 {n:'มณี พ่อค้าผนึกเร่',lv:8,cls:'merchant',pets:[['nekomata',8]],gold:230},
 {n:'ไพริน ผู้ฟังเสียงป่า',lv:12,cls:'druid',pets:[['kodama',12]],gold:600},
 {n:'เรเวน มือปืนจันทร์แดง',lv:20,cls:'gunner',pets:[['raiju',20]],gold:1800},
 {n:'สุริยัน อัศวินแห่งรุ่งอรุณ',lv:28,cls:'paladin',pets:[['unicorn',28]],gold:3500},
 {n:'อัญชัน นักฆ่าม่านหมอก',lv:35,cls:'assassin',pets:[['nue',35]],gold:7000},
 {n:'ฮายาเตะ เคนเซย์ไร้พ่าย',lv:42,cls:'kensei',pets:[['tengu',42]],gold:13000},
 {n:'อรัญ นายพรานราชันย์',lv:48,cls:'wildlord',pets:[['griffin',48],['thunderbird',48]],gold:24000},
 {n:'อัคนี ผู้บัญชาการปืนศักดิ์สิทธิ์',lv:54,cls:'gunsaint',pets:[['phoenix',54],['ifrit',52]],gold:45000},
 {n:'จันทรา จอมเวทสุริยุปราคา',lv:57,cls:'archmage',pets:[['naga',57],['fenrir',55]],gold:58000},
 {n:'อัครา แชมป์จันทร์แดง',lv:60,cls:'shogun',pets:[['dragon',60],['garuda',60]],gold:80000}
);

/* ================= v5 ADDITIONS ================= */
Object.assign(PAS,{
 counter:{n:'สวนกลับเงา',d:'25% โจมตีสวนกลับเมื่อโดนโจมตีกายภาพ'},
 echo:{n:'เสียงสะท้อนเวท',d:'20% ใช้สกิลโจมตีซ้ำอีกครั้งฟรี'},
 mpsave:{n:'ประหยัดพลัง',d:'ใช้ MP น้อยลง 30%'},
 toxin:{n:'พิษร้ายแรง',d:'โอกาสทำให้ติดสถานะ ×1.5'},
 laststand:{n:'ฮึดสู้',d:'HP ต่ำกว่า 30% ป้องกันทั้งหมด +50%'},
 firstblood:{n:'จู่โจมก่อน',d:'ตาแรกของการต่อสู้ ความเร็ว ×2'},
 manadrain:{n:'ดูดมานา',d:'ฟื้น MP 8% ของดาเมจที่ทำได้'},
 aoeboost:{n:'ผู้ทำลายล้าง',d:'สกิลหมู่แรง 90% ต่อตัว แทน 75%'},
});
Object.assign(SK,{
 focus_p:{n:'รวบรวมพลัง',t:'buff',tg:'self',charge:2,mp:4},
 heavy_stance:{n:'ตั้งท่าหนัก',t:'buff',tg:'self',bf:{spd:-.5,pdef:.4,mdef:.2},tn:2,charge:1.6,mp:4},
 sw_quick:{n:'ก้าวพริบตา',t:'buff',tg:'self',bf:{spd:.5,eva:.3},tn:3,mp:4},
 sw_charge:{n:'ฟันจันทราผ่าฟ้า',t:'p',pw:340,el:'normal',mp:12,ct:1},
 gl_crush:{n:'กระแทกปลดอาวุธ',t:'p',pw:115,el:'fighting',mp:5,bf:{patk:-.3,matk:-.3},tn:3},
 gl_stance:{n:'ตั้งท่าหนักแน่น',t:'buff',tg:'self',bf:{spd:-.5,pdef:.6,mdef:.4},tn:2,charge:1.8,mp:6},
 ar_pin:{n:'ศรตรึงเงา',t:'p',pw:110,el:'dark',mp:4,bf:{spd:-.4},tn:3},
 ar_charge:{n:'ง้างศรเต็มแรง',t:'p',pw:350,el:'normal',mp:12,ct:1,cb:20},
 mg_slow:{n:'เวทถ่วงเวลา',t:'debuff',el:'psychic',mp:8,all:1,bf:{spd:-.35},tn:3},
 mg_chant:{n:'ร่ายเวทยาว',t:'buff',tg:'self',charge:2.2,bf:{mdef:.2},tn:2,mp:6},
 me_bribe:{n:'ติดสินบน',t:'debuff',el:'normal',mp:3,all:1,bf:{patk:-.25,matk:-.25},tn:3,gc:2},
 me_bigdeal:{n:'ทุ่มสุดตัว',t:'p',pw:380,el:'steel',mp:10,ct:1,gc:6},
 gn_leg:{n:'ยิงขา',t:'p',pw:110,el:'normal',mp:4,bf:{spd:-.45},tn:3},
 gn_snipe:{n:'เล็งยิงระยะไกล',t:'p',pw:350,el:'steel',mp:12,ct:1,cb:30},
 dr_wind:{n:'สายลมพงไพร',t:'buff',tg:'team',bf:{spd:.3},tn:3,mp:7},
 dr_chant:{n:'ร่ายพลังพงไพร',t:'buff',tg:'self',charge:2,mp:5},
 th_cripple:{n:'เฉือนเอ็นข้อเท้า',t:'p',pw:100,el:'dark',mp:4,bf:{spd:-.4},tn:3},
 th_ambush:{n:'ซุ่มรอจังหวะ',t:'buff',tg:'self',bf:{eva:1},tn:2,charge:2.2,mp:6},
 su_weaken:{n:'แส้สาปอ่อนแรง',t:'debuff',el:'ghost',mp:6,bf:{patk:-.3,pdef:-.3},tn:3},
 su_focus:{n:'รวมพลังวิญญาณ',t:'buff',tg:'team',charge:1.5,mp:12},
 s_neko:{n:'กรงเล็บวิญญาณแมว',t:'p',pw:80,hits:3,el:'ghost',mp:12,st:{charm:.15}},
 s_amabie:{n:'คำพยากรณ์ปัดเป่าโรค',t:'heal',tg:'team',pw:35,cure:1,bf:{mdef:.3},tn:3,mp:15},
 s_kinnaree:{n:'ร่ายรำหิมพานต์',t:'buff',tg:'team',bf:{spd:.4,matk:.3,patk:.3},tn:3,mp:16},
 s_salam:{n:'ลาวาปะทุ',t:'m',pw:300,el:'fire',mp:16,ct:1,all:1,st:{burn:.4}},
 s_cyclops:{n:'ค้อนสายฟ้าซุส',t:'p',pw:380,el:'electric',mp:16,ct:1,st:{para:.4}},
 s_wendigo:{n:'ความหิวนิรันดร์',t:'p',pw:240,el:'ice',mp:15,ls:.5,bf:{spd:-.3},tn:3},
 s_bunyip:{n:'ดึงลงบึงลึก',t:'p',pw:230,el:'water',mp:16,bf:{spd:-.5},tn:3,st:{para:.3}},
 s_wyvern:{n:'ดิ่งพสุธาพายุ',t:'p',pw:390,el:'flying',mp:18,ct:1,cb:20},
 s_roc:{n:'พายุปีกยักษ์',t:'p',pw:210,el:'flying',mp:20,all:1,bf:{spd:-.3},tn:3},
 s_rajasi:{n:'คำรามราชสีห์',t:'debuff',el:'normal',mp:16,all:1,bf:{patk:-.35,pdef:-.3,spd:-.2},tn:3},
});
const ADDSK={swordsman:[[6,'sw_quick'],[15,'sw_charge']],gladiator:[[6,'gl_crush'],[15,'gl_stance']],archer:[[6,'ar_pin'],[15,'ar_charge']],mage:[[8,'mg_slow'],[12,'mg_chant']],
 merchant:[[6,'me_bribe'],[15,'me_bigdeal']],gunner:[[6,'gn_leg'],[15,'gn_snipe']],druid:[[9,'dr_wind'],[13,'dr_chant']],thief:[[6,'th_cripple'],[15,'th_ambush']],summoner:[[6,'su_weaken'],[15,'su_focus']]};
for(const k in ADDSK){CLS[k].sk.push(...ADDSK[k]);CLS[k].sk.sort((a,b)=>a[0]-b[0])}
SP.minotaur.sk[2]='heavy_stance';SP.golem.sk[1]='heavy_stance';SP.behemoth.sk[3]='heavy_stance';SP.dragon.sk[2]='focus_p';SP.redcap.sk[2]='focus_p';
Object.assign(SP,{
nekomata:{n:'บาเกเนโกะ',o:'ญี่ปุ่น',t:['normal','ghost'],em:'🐈',r:1.2,b:[40,26,10,8,5,6,92,13,14],sk:['normal_p1','ghost_st','focus_p','ghost_p2'],pas:'elusive',ev:[[16,'เนโกะมาตะ']],sig:'s_neko',parts:[['หางแฉกแมวปีศาจ',22],['กระดิ่งแมวผี',18]]},
amabie:{n:'อามาบิเอะ',o:'ญี่ปุ่น',t:['water','psychic'],em:'🐟',r:1.3,b:[44,32,5,11,6,10,92,8,9],sk:['water_m1','psychic_m1','teamheal','psychic_m2'],pas:'healer',ev:[[16,'อามาบิเอะผู้พยากรณ์']],sig:'s_amabie',parts:[['เกล็ดอามาบิเอะ',20],['ผมยาวสาหร่าย',24]]},
kinnaree:{n:'กินรี',o:'ไทย',t:['fairy','flying'],em:'🦢',r:2,b:[46,34,8,13,7,10,94,13,14],sk:['flying_p1','fairy_m1','fairy_st','fairy_m2'],pas:'swift',ev:[[24,'กินรีราชินีหิมพานต์']],sig:'s_kinnaree',parts:[['ขนหางกินรี',60],['กำไลทองกินรี',85]]},
salamander:{n:'ซาลาแมนเดอร์',o:'ยุโรป',t:['fire','rock'],em:'🦎',r:2,b:[52,26,11,12,11,8,92,7,10],sk:['fire_p1','rock_st','heavy_stance','fire_p2'],pas:'imm_burn',ev:[[24,'จ้าวซาลาแมนเดอร์']],sig:'s_salam',parts:[['หางเพลิงซาลาแมนเดอร์',65],['หนังทนไฟ',70]]},
cyclops:{n:'ไซคลอปส์',o:'กรีก',t:['rock','electric'],em:'👁️',r:2.8,b:[76,22,16,9,14,9,86,4,7],sk:['rock_p1','electric_p1','focus_p','rock_p2'],pas:'laststand',ev:[[32,'ไซคลอปส์ช่างอสนี']],sig:'s_cyclops',parts:[['ดวงตาเดียวไซคลอปส์',140],['ค้อนอสนีบาต',160]]},
wendigo:{n:'เวนดิโก',o:'ชนพื้นเมืองอเมริกา',t:['ice','ghost'],em:'🥶',r:2.8,b:[60,30,14,12,10,10,93,10,13],sk:['ice_p1','ghost_p1','ice_st','ice_p2'],pas:'lifesteal',ev:[[32,'เวนดิโกหิวโหย']],sig:'s_wendigo',parts:[['เขากวางน้ำแข็ง',130],['หัวใจน้ำแข็ง',160]]},
bunyip:{n:'บันยิป',o:'ออสเตรเลีย',t:['water','ground'],em:'🦭',r:3.4,b:[88,26,15,11,14,12,90,5,7],sk:['water_p1','ground_p1','heavy_stance','ground_aoe'],pas:'thick',ev:[[38,'บันยิปแห่งบึงมรณะ']],sig:'s_bunyip',parts:[['ขนบึงบันยิป',220],['เขี้ยวบันยิป',260]]},
wyvern:{n:'ไวเวิร์น',o:'ยุโรป',t:['dragon','flying'],em:'🦖',r:3.6,b:[72,30,17,12,12,10,94,10,15],sk:['flying_p1','dragon_p1','dragon_st','dragon_p2'],pas:'swift',ev:[[38,'ไวเวิร์นพายุ']],sig:'s_wyvern',parts:[['ปีกหนังไวเวิร์น',240],['หางพิษไวเวิร์น',280]]},
roc:{n:'นกรุค',o:'อาหรับ',t:['flying','normal'],em:'🦚',r:4.5,b:[94,30,19,10,14,11,94,9,14],sk:['flying_p2','normal_p2','flying_st','flying_aoe'],pas:'firstblood',ev:[[44,'นกรุคราชาเวหา']],sig:'s_roc',parts:[['ขนนกรุคยักษ์',480],['ไข่นกรุค',560]]},
rajasi:{n:'ราชสีห์',o:'ไทย',t:['fighting','fire'],em:'🐯',r:4.5,b:[90,28,20,10,15,12,93,8,13],sk:['fighting_p2','fire_p1','normal_st','focus_p'],pas:'intimidate',ev:[[44,'ราชสีห์ทองหิมพานต์']],sig:'s_rajasi',parts:[['แผงคอราชสีห์',500],['เขี้ยวราชสีห์',540]]},
});
[['nekomata','amabie'],['kinnaree','salamander'],['cyclops','wendigo'],['bunyip','wyvern'],['roc','rajasi']].forEach((a,i)=>ZN[i].sp.push(...a));

/* ---- legendary gear: one per equipment slot per zone ---- */
const LGLV=[6,12,19,27,36];
const LGW=[['จันทร์เสี้ยวราตรี','fairy','แสงจันทร์เสี้ยว',{pw:180,st:{love:.25}},'mpsave'],
 ['จิ้งจอกเพลิง','fire','อัคคีจิ้งจอกวิญญาณ',{pw:200,st:{burn:.35}},'echo'],
 ['ฟาโรห์','ground','พิพากษาแห่งดูอัต',{pw:225,st:{para:.25}},'pierce'],
 ['มังกรโบราณ','dragon','ลมหายใจมังกรผู้หลับใหล',{pw:200,all:1,st:{burn:.2}},'adapt'],
 ['แห่งวันสิ้นโลก','dark','แร็กนาร็อก',{pw:220,all:1},'deadly']];
const LGA=[
 {armor:['เสื้อเปลือกไม้โคดามะ','regen'],gloves:['ถุงมือหางทานุกิ','lucky','th_steal'],boots:['รองเท้าขนแจ็กคาโลป','firstblood'],belt:['เข็มขัดกระดองคัปปะ','sturdy'],bracelet:['กำไลเปลวไฟวิสป์','flameBody'],ring:['แหวนรากแมนเดรก','toxin'],necklace:['สร้อยปีกพิกซี่','elusive','teamheal'],crown:['มงกุฎขนไรจู','staticbody','electric_aoe']},
 {armor:['เสื้อขนนกเทงงุ','elusive'],gloves:['ถุงมือกรงเล็บกริฟฟิน','keen'],boots:['รองเท้ากีบนิลมังกร','swift','flying_st'],belt:['เข็มขัดใยทองโจโร','poisonTouch'],bracelet:['กำไลกินฝันบาคุ','manadrain'],ring:['แหวนบังเหียนเคลปี้','lifesteal'],necklace:['สร้อยระฆังศาลเจ้า','imm_mind','psychic_st'],crown:['มงกุฎเมฆนุเอะ','counter']},
 {armor:['ผ้าพันศพนิรันดร์','laststand'],gloves:['ถุงมือขนเยติ','imm_freeze','ice_p2'],boots:['รองเท้าเดินผืนทราย','levitate'],belt:['เข็มขัดแกนโกเลม','nocrit'],bracelet:['กำไลสคารับสุริยะ','imm_burn','fire_aoe'],ring:['แหวนเนตรบาซิลิสก์','toxin','poison_st'],necklace:['สร้อยปริศนาสฟิงซ์','mpsave','psychic_st'],crown:['มงกุฎเขามิโนทอร์','rage','fighting_st']},
 {armor:['เกราะเกล็ดพญานาค','regen'],gloves:['ถุงมือหัวไฮดรา','multihit'],boots:['รองเท้าธันเดอร์เบิร์ด','firstblood'],belt:['เข็มขัดศิลาการ์กอยล์','thorns'],bracelet:['กำไลยันต์เจียงซือ','imm_para','ghost_st'],ring:['แหวนน้ำตาแบนชี','echo'],necklace:['สร้อยลูกแก้วนาคา','healer','water_aoe'],crown:['มงกุฎเขามังกร','aoeboost']},
 {armor:['เกราะหนังเบฮีมอธ','guardian'],gloves:['ถุงมือเพลิงอิฟริต','flameBody','fire_m2'],boots:['รองเท้าปีกนกรุค','swift','flying_aoe'],belt:['เข็มขัดเกล็ดโยรมุนกันด์','regen'],bracelet:['กำไลโซ่ไกลพนีร์','pierce'],ring:['แหวนหัวใจคิเมร่า','multihit'],necklace:['สร้อยตาชั่งอัมมิต','lifesteal','dark_st'],crown:['มงกุฎเทพผู้ล่วงลับ','mpsave','el_omni']},
];
LGA.forEach((set,i)=>{const z=i+1;
 for(const sl in set){const [n,pas,sk]=set[sl],st={};for(const k in SLOTBASE[sl])st[k]=Math.max(2,Math.round(SLOTBASE[sl][k]*TIERS[i][2]*1.6));
  EQ[`lg${z}_${sl}`]={n,slot:sl,lv:LGLV[i],price:3000*z,st,pas,...(sk?{sk}:{}),legend:z}}
 const [wn,el,skn,def,pas]=LGW[i];
 for(const type in WT){const st=wStats(type,z);for(const k in st)st[k]=Math.round(st[k]*1.2);const ws=`lgs${z}_${type}`;
  SK[ws]={n:skn,t:WT[type].t,el,mp:10+i*2,...def};EQ[`lg${z}_weapon_${type}`]={n:WT[type].n+wn,slot:'weapon',wt:type,t:WT[type].t,lv:LGLV[i],price:4000*z,st,el,ws,pas,legend:z}}});


/* ================= v6 ADDITIONS ================= */
TIERS.push(['ทมิฬ',40,15,15000]);
for(const sl in SLOTBASE){const [tn,lv,m,pr]=TIERS[5],st={};for(const k in SLOTBASE[sl])st[k]=Math.max(1,Math.round(SLOTBASE[sl][k]*m));EQ[sl+'_5']={n:SLOTN[sl]+tn,slot:sl,lv,price:pr,st,tier:5}}
WF.push(74);
/* final zone */
SP.demonlord={n:'จอมมาร',o:'ปราสาทจอมมาร',t:['dark','fire'],em:'👿',r:99,noseal:1,b:[150,60,19,19,18,18,96,10,13],sk:['dark_p2','fire_m2','dark_aoe','fire_aoe'],pas:'rebirth',sig:'s_demon',parts:[['เขาจอมมาร',3000],['หัวใจรัตติกาล',5000]]};
SK.s_demon={n:'วันพิพากษาแห่งจอมมาร',t:'m',pw:200,el:'dark',all:1,mp:24,st:{burn:.3,charm:.2}};
ZN.push({id:6,n:'ปราสาทจอมมาร',d:'ป้อมปราการทมิฬบนยอดเหว ทุกห้องมีปีศาจเฝ้า จอมมารรออยู่บนบัลลังก์ชั้นบนสุด',lv:[40,50],sp:['cerberus','basilisk','jiangshi','gargoyle','banshee','ifrit','nidhogg','ammit','wendigo'],rare:['fenrir','phoenix'],boss:{sp:'demonlord',lv:60,n:'จอมมารผู้ครองรัตติกาล'},mini:0,final:1});
LGLV.push(44);
LGW.push(['จอมมาร','dark','ทมิฬาวสาน',{pw:240,all:1,st:{charm:.15}},'lifesteal']);
LGA.push({armor:['เกราะแม่ทัพปีศาจ','laststand'],gloves:['ถุงมือกรงเล็บปีศาจ','deadly'],boots:['รองเท้าเงามรณะ','firstblood'],belt:['เข็มขัดโซ่นรก','sturdy'],bracelet:['กำไลวิญญาณทาส','manadrain'],ring:['แหวนสัญญาปีศาจ','aoeboost'],necklace:['สร้อยหัวใจจอมมาร','rebirth'],crown:['มงกุฎจอมมาร','rainbow','dark_aoe']});
(()=>{const i=5,z=6,set=LGA[i];
 for(const sl in set){const [n,pas,sk]=set[sl],st={};for(const k in SLOTBASE[sl])st[k]=Math.max(2,Math.round(SLOTBASE[sl][k]*TIERS[i][2]*1.6));EQ[`lg${z}_${sl}`]={n,slot:sl,lv:LGLV[i],price:3000*z,st,pas,...(sk?{sk}:{}),legend:z}}
 const [wn,el,skn,def,pas]=LGW[i];
 for(const type in WT){const st=wStats(type,z);for(const k in st)st[k]=Math.round(st[k]*1.2);const ws=`lgs${z}_${type}`;SK[ws]={n:skn,t:WT[type].t,el,mp:20,...def};EQ[`lg${z}_weapon_${type}`]={n:WT[type].n+wn,slot:'weapon',wt:type,t:WT[type].t,lv:LGLV[i],price:4000*z,st,el,ws,pas,legend:z}}})();

/* special milestone skills at Lv 10/20/30/40/50/60 for each class line */
const MILE={
 swordsman:{10:{n:'ดาบคู่พายุ',t:'p',pw:85,hits:3,el:'flying',mp:8},20:{n:'ใจดาบไม่หวั่น',t:'heal',tg:'self',pw:20,cure:1,bf:{patk:.4,pdef:.4},tn:3,mp:10},30:{n:'ฟันทะลวงฟ้า',t:'p',pw:260,el:'normal',pi:.3,mp:14},
  40:{n:'ร้อยดาบสะท้านภพ',t:'p',pw:175,el:'steel',all:1,mp:18},50:{n:'จิตวิญญาณนักดาบ',t:'buff',tg:'team',bf:{patk:.5,crit:.5},tn:3,mp:18},60:{n:'ดาบพิฆาตเทพ',t:'p',pw:480,el:'normal',ct:1,cb:30,mp:28}},
 gladiator:{10:{n:'โล่สะท้อน',t:'buff',tg:'self',bf:{pdef:.5},pas:'thorns2',tn:3,mp:8},20:{n:'ทุบแผ่นดินแยก',t:'p',pw:150,el:'ground',all:1,st:{para:.2},mp:12},30:{n:'ป้อมปราการเหล็ก',t:'buff',tg:'team',bf:{pdef:.4,mdef:.3},tn:3,taunt:3,mp:14},
  40:{n:'ขวานสังหาร',t:'p',pw:280,el:'fighting',cb:20,mp:16},50:{n:'ไม่มีวันล้ม',t:'heal',tg:'self',pw:50,cure:1,mp:20},60:{n:'พิโรธแห่งกลาดิเอเตอร์',t:'p',pw:310,el:'fighting',all:1,ct:1,mp:28}},
 archer:{10:{n:'ศรพิษสามดอก',t:'p',pw:70,hits:3,el:'poison',st:{poison:.2},mp:8},20:{n:'ฝนศรเพลิง',t:'p',pw:140,el:'fire',all:1,st:{burn:.2},mp:12},30:{n:'ตาเทพเหยี่ยว',t:'buff',tg:'team',bf:{acc:.3,crit:.6},tn:3,mp:14},
  40:{n:'ศรสายฟ้าฟาด',t:'p',pw:220,el:'electric',st:{para:.2},mp:16,cd:3},50:{n:'ศรนับพัน',t:'p',pw:70,hits:4,rt:1,el:'normal',mp:20,cd:3},60:{n:'ศรสวรรค์ทะลุมิติ',t:'p',pw:480,el:'fairy',ct:1,pi:.5,mp:28}},
 mage:{10:{n:'ลูกไฟสามลูก',t:'m',pw:70,hits:3,rt:1,el:'fire',st:{burn:.1},mp:8},20:{n:'หมอกน้ำแข็งพิฆาต',t:'m',pw:200,el:'ice',st:{freeze:.25},mp:12},30:{n:'ม่านมานา',t:'buff',tg:'self',bf:{mdef:.6},pas:'mpsave',tn:3,mp:10},
  40:{n:'เมเทออร์เพลิง',t:'m',pw:200,el:'fire',all:1,st:{burn:.25},mp:20},50:{n:'มหาสายฟ้าพิโรธ',t:'m',pw:300,el:'electric',st:{para:.4},mp:22},60:{n:'มหาเวทวันสิ้นโลก',t:'m',pw:330,el:'dragon',all:1,ct:1,mp:34}},
 merchant:{10:{n:'โยนถุงทอง',t:'p',pw:150,el:'steel',all:1,gc:3,mp:4},20:{n:'บริการพิเศษ',t:'heal',tg:'team',pw:25,mp:12},30:{n:'ค้อนทองคำ',t:'p',pw:260,el:'steel',gold:1,mp:14},
  40:{n:'จ้างทหารรับจ้าง',t:'buff',tg:'team',bf:{patk:.4,pdef:.3},tn:3,gc:10,mp:10},50:{n:'ระเบิดคลังสมบัติ',t:'p',pw:240,el:'steel',all:1,gc:12,mp:14},60:{n:'ทุ่มทั้งอาณาจักร',t:'p',pw:600,el:'steel',ct:1,gc:20,mp:20}},
 gunner:{10:{n:'กระสุนน้ำแข็ง',t:'p',pw:150,el:'ice',st:{freeze:.2},mp:7},20:{n:'ยิงกวาด',t:'p',pw:130,el:'normal',all:1,mp:12},30:{n:'กระสุนพิษ',t:'p',pw:190,el:'poison',st:{poison:.5},mp:12},
  40:{n:'ระดมยิง',t:'p',pw:60,hits:6,rt:1,el:'steel',mp:18},50:{n:'โหมดแม่นปืน',t:'buff',tg:'self',bf:{acc:.5,crit:1.5,patk:.3},tn:3,mp:14},60:{n:'กระสุนมหาประลัย',t:'p',pw:500,el:'fire',ct:1,cb:40,mp:28}},
 druid:{10:{n:'แสงตะวันรักษา',t:'heal',tg:'ally',pw:45,mp:9},20:{n:'เถาวัลย์พันธนาการ',t:'status',el:'grass',all:1,bf:{spd:-.4},tn:3,st:{para:.3},mp:14},30:{n:'พายุใบมีด',t:'m',pw:170,el:'grass',all:1,ls:.2,mp:16},
  40:{n:'วิญญาณพงไพร',t:'buff',tg:'team',bf:{patk:.3,matk:.3},pas:'regen',tn:3,mp:16},50:{n:'แผ่นดินไหวพงไพร',t:'m',pw:240,el:'ground',all:1,mp:22},60:{n:'คืนชีพพงไพร',t:'heal',tg:'team',pw:50,cure:1,revAll:1,mp:30}},
 thief:{10:{n:'มีดเงาสามคม',t:'p',pw:70,hits:3,el:'dark',mp:7},20:{n:'จู่โจมไร้เงา',t:'p',pw:220,el:'dark',acc:100,cb:20,mp:12},30:{n:'ยาพิษร้ายแรง',t:'status',el:'poison',bf:{pdef:-.3},tn:3,st:{poison:.9},mp:10},
  40:{n:'พันมีดมรณะ',t:'p',pw:60,hits:6,el:'steel',mp:18},50:{n:'ฆาตกรรมเงียบ',t:'p',pw:320,el:'dark',cb:50,mp:20},60:{n:'เงามรณะสังหาร',t:'p',pw:520,el:'dark',ct:1,cb:50,mp:28}},
 summoner:{10:{n:'พลังผนึกเชื่อมใจ',t:'buff',tg:'team',bf:{spd:.2,acc:.2,crit:.3},tn:3,mp:9},20:{n:'ปลุกสัญชาตญาณดิบ',t:'buff',tg:'ally',bf:{patk:.6,matk:.6},tn:3,mp:10},30:{n:'ม่านวิญญาณ',t:'buff',tg:'team',bf:{pdef:.4,mdef:.4},pas:'guardian',tn:3,mp:16},
  40:{n:'ฟื้นฟูวิญญาณ',t:'heal',tg:'team',pw:40,cure:1,revAll:1,mp:24},50:{n:'พลังผนึกจักรพรรดิ',t:'buff',tg:'team',bf:{patk:.5,matk:.5,spd:.3},tn:3,mp:22},60:{n:'อัญเชิญเทพอสูร',t:'m',pw:320,el:'fairy',all:1,ct:1,mp:32}},
};
for(const b in MILE)for(const lv in MILE[b]){const id=`ms_${b}${lv}`;SK[id]={...MILE[b][lv],mile:1};CLS[b].sk.push([+lv,id])}
for(const b in MILE)CLS[b].sk.sort((a,c)=>a[0]-c[0]);

/* crafting: one recipe per beast, built from its materials */
const CRAFT={},CSL=['weapon','armor','gloves','boots','belt','bracelet','ring','necklace','crown'];
const zoneOfSp=k=>{let i=ZN.findIndex(z=>z.sp.includes(k));if(i<0)i=ZN.findIndex(z=>z.rare.includes(k));return Math.max(0,i)};
Object.keys(SP).filter(k=>!SP[k].noseal).forEach((k,idx)=>{const s=SP[k],zi=zoneOfSp(k),sl=CSL[idx%9],fn=s.ev?s.ev[s.ev.length-1][1]:s.n,mul=1.35*(s.rare?1.12:1),skl=s.sig||s.sk[3];
 const mats=[[k+'|0',s.rare?2:3+zi],[k+'|1',s.rare?1:2+Math.floor(zi/2)]],gold=Math.round(150*(zi+1)**2*(s.rare?2:1)),lv=[5,11,18,26,35,44][zi];
 CRAFT[k]={sl,mats,gold,lv,zi};
 if(sl==='weapon'){for(const type in WT){const st=wStats(type,Math.min(6,zi+1));for(const x in st)st[x]=Math.round(st[x]*1.1*(s.rare?1.1:1));EQ[`cf_${k}_${type}`]={n:WT[type].n+fn,slot:'weapon',wt:type,t:WT[type].t,lv,price:gold,st,el:s.t[0],ws:skl,pas:s.pas,craft:k}}}
 else{const st={};for(const x in SLOTBASE[sl])st[x]=Math.max(2,Math.round(SLOTBASE[sl][x]*TIERS[zi][2]*mul));EQ[`cf_${k}`]={n:SLOTN[sl]+fn,slot:sl,lv,price:gold,st,pas:s.pas,sk:skl,craft:k}}});

/* ================= v8: training forest ================= */
ZN.push({id:7,n:'ป่าฝึกหัด',d:'ป่าเล็กหลังเมือง อสูรตัวเล็กไม่ดุร้าย เหมาะสำหรับผู้ผนึกมือใหม่ฝึกต่อสู้และเก็บเลเวล',lv:[1,4],sp:['kappa','wisp','mandrake','jackalope','tanuki','pixie','kodama'],rare:['qilin','unicorn'],boss:{sp:'jackalope',lv:5,n:'หัวหน้าฝูงแจ็กคาโลป'},mini:0,train:1});


const R=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const fmt=n=>Math.round(n).toLocaleString('th-TH');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const need=l=>Math.floor(18*Math.pow(l,1.6)*(1+Math.max(0,l-20)*.03));
const expFor=l=>Math.floor(8*Math.pow(l,1.35)+6);
function rnd(s){for(const k in s)s[k]=Math.round(s[k]);return s}
function wsel(obj){const t=Object.values(obj).reduce((a,b)=>a+b,0);let r=Math.random()*t;for(const k in obj){r-=obj[k];if(r<0)return k}return Object.keys(obj)[0]}

/* ---- classes ---- */
function chain(k){const a=[];while(k){a.unshift(k);k=CLS[k].p}return a}
const tierOf=k=>chain(k).length-1;
const baseOf=k=>chain(k)[0];
const childrenOf=k=>Object.keys(CLS).filter(c=>CLS[c].p===k);
const clsMult=(k,s)=>chain(k).reduce((m,c)=>m*(CLS[c].m[s]||1),1);
const clsSkills=(k,lv)=>chain(k).flatMap(c=>CLS[c].sk.filter(([l])=>lv>=l).map(x=>x[1]));
const clsSkillsAt=(k,lv)=>chain(k).flatMap(c=>CLS[c].sk.filter(([l])=>lv===l).map(x=>x[1]));
const clsPas=k=>chain(k).flatMap(c=>CLS[c].pas);
const clsSum=k=>Math.max(1,...chain(k).map(c=>CLS[c].sum||1));
const clsWeapon=k=>CLS[baseOf(k)].w;
const isMerchant=()=>S.P&&baseOf(S.P.cls)==='merchant';
const priceOf=it=>Math.round(it.price*(isMerchant()?.85:1));
const partPrice=v=>Math.round(v*(isMerchant()?1.2:1));
function canPromote(P){const t=tierOf(P.cls);return (t===0&&P.lv>=25)||(t===1&&P.lv>=40)}

/* ---- humans ---- */
function humanStats(cls,lv,pts,eq){const s={};K.forEach((k,i)=>s[k]=(PB[i]+PG[i]*(lv-1))*clsMult(cls,k)+((pts&&pts[k])||0)*PER[k]*(1+focusBonus(cls,k)));
 for(const sl in eq){const it=EQ[eq[sl]];if(it)for(const k in it.st)s[k]+=Math.round(it.st[k]*(it.slot==='weapon'&&it.wt!==clsWeapon(cls)?.8:1))}return rnd(s)}
function humanSkills(cls,lv,eq){const a=['attack',...clsSkills(cls,lv)];for(const sl in eq){const it=EQ[eq[sl]];if(!it)continue;if(it.ws)a.push(it.ws);if(it.sk)a.push(it.sk)}return [...new Set(a)]}
function humanPas(cls,eq,lv=S?.P?.lv||0){PAS.gunnerBossBounty={n:'ล่าค่าหัว',d:'ปลดล็อก Lv55: ผู้ผนึกสายมือปืนโจมตีบอสทุกตัว รวมบอสโลก แรงขึ้น 60% (×1.6) ไม่เพิ่มดาเมจคู่หู'};const a=[...clsPas(cls)];if(baseOf(cls)==='gunner'&&lv>=55)a.push('gunnerBossBounty');for(const sl in eq){const it=EQ[eq[sl]];if(it&&it.pas)a.push(it.pas)}return a}
const pStats=()=>worldPowerStats(S.P,humanStats(S.P.cls,S.P.lv,S.P.pts,S.P.eq));

/* ---- beasts ---- */
function formFor(k,lv){const e=SP[k].ev||[];let f=0;e.forEach((x,i)=>{if(lv>=x[0])f=i+1});return f}
const formName=(k,f)=>f?SP[k].ev[f-1][1]:SP[k].n;
const petName=p=>formName(p.sp,p.form||0);
const sigLearned=p=>{const s=SP[p.sp];if(!s.sig)return false;return s.rare?p.lv>=(s.signatureLevel||SIGLV):s.ev?(p.form||0)>=s.ev.length:false};
function calcPet(p,wild=1){const sp=SP[p.sp],fm=FM[p.form||0],s={};
 K.forEach((k,i)=>{const b=i<9?sp.b[i]:5,f=(k==='acc'||k==='crit'||k==='eva')?1:fm;s[k]=(b+grow(k,b)*(p.lv-1)*wild)*f+((p.pts&&p.pts[k])||0)*PER[k]});return rnd(s)}
function petSkills(p){const s=SP[p.sp],a=['attack',...s.sk.filter((_,i)=>p.lv>=(s.skillLevels||SKLV)[i])];if(sigLearned(p))a.push(s.sig);return a}
const petBy=uid=>S.P.pets.find(p=>p.uid===uid);
const party=()=>S.P.party.map(petBy).filter(Boolean);
function fixParty(){const P=S.P,n=clsSum(P.cls);P.party=[...new Set(P.party.filter(u=>petBy(u)))].slice(0,n);if(!P.party.length&&P.pets[0])P.party=[P.pets[0].uid]}
function mkPet(sp,lv,form){const p={uid:S.P.uid++,sp,lv,form:form??formFor(sp,lv),exp:0,pts:{},free:(lv-1)*3};const s=calcPet(p);p.hp=s.hp;p.mp=s.mp;return p}

function gainExp(o,amt,isP){const lines=[];o.exp+=amt;
 while(o.lv<MAXLV&&o.exp>=need(o.lv)){const before=isP?pStats():calcPet(o);o.exp-=need(o.lv);o.lv++;o.free=(o.free||0)+(isP?5:3);
  if(!isP){const nf=formFor(o.sp,o.lv);if(nf>(o.form||0)){o.form=nf;lines.push(`✦ ${SP[o.sp].n} พัฒนาร่างเป็น ${formName(o.sp,nf)}!`);if(nf===SP[o.sp].ev.length&&SP[o.sp].sig)lines.push(`${formName(o.sp,nf)} เรียนรู้สกิลเฉพาะตัว ${SK[SP[o.sp].sig].n}`)}}
  const after=isP?pStats():calcPet(o);o.hp+=after.hp-before.hp;o.mp+=after.mp-before.mp;
  lines.push(`${isP?o.name:petName(o)} เลเวลอัปเป็น Lv ${o.lv}!`);
  if(isP){clsSkillsAt(o.cls,o.lv).forEach(id=>lines.push(`เรียนรู้สกิล ${SK[id].n}`));if(canPromote(o)&&(o.lv===25||o.lv===40))lines.push('★ เลื่อนอาชีพได้แล้ว! ไปที่หน้าตัวละคร')}
  else{const i=(SP[o.sp].skillLevels||SKLV).indexOf(o.lv);if(i>0&&SP[o.sp].sk[i])lines.push(`${petName(o)} เรียนรู้ ${SK[SP[o.sp].sk[i]].n}`);if(SP[o.sp].rare&&o.lv===(SP[o.sp].signatureLevel||SIGLV))lines.push(`${petName(o)} เรียนรู้สกิลเฉพาะตัว ${SK[SP[o.sp].sig].n}`)}}
 if(o.lv>=MAXLV)o.exp=0;
 return lines}
function loseExp(o,frac){const l=Math.floor(need(o.lv)*frac),lost=Math.min(o.exp,l);o.exp-=lost;return lost}

/* Expansion data: additive IDs keep all existing saves and arena indices valid. */
const JOB_FOCUS={swordsman:['patk','acc'],gladiator:['pdef','mdef'],archer:['patk','acc'],mage:['matk','mp'],merchant:['hp','patk'],gunner:['patk','crit'],druid:['hp','matk'],thief:['spd','crit'],summoner:['mp','mdef']};
function focusFor(cls){const own=CLS[cls].focus;if(own)return own;const keys=Object.keys(CLS[cls].m).filter(k=>!['hp','mp','eva'].includes(k)).sort((a,b)=>(CLS[cls].m[b]||1)-(CLS[cls].m[a]||1));return tierOf(cls)>0&&keys.length>=2?keys.slice(0,2):JOB_FOCUS[baseOf(cls)]}
function focusBonus(cls,k){return focusFor(cls).includes(k)?[.10,.20,.30][Math.min(2,tierOf(cls))]:0}
Object.assign(SK,{
 guard_taunt:{n:'คำท้าผู้พิทักษ์',t:'buff',tg:'self',taunt:3,bf:{pdef:.25,mdef:.25},tn:3,mp:6,cd:3},
 guard_physical:{n:'ปราการกายาไร้พ่าย',t:'buff',tg:'self',immune:'p',tn:1,mp:12,cd:1},
 guard_magic:{n:'ม่านเวทไร้พ่าย',t:'buff',tg:'self',immune:'m',tn:1,mp:12,cd:1},
 firestorm_dot:{n:'พายุไฟผลาญวิญญาณ',t:'m',pw:100,el:'fire',all:1,mp:15,cd:3,dot:{n:'พายุไฟ',turns:3,rate:.12,el:'fire'}},
 whirlpool_dot:{n:'วังน้ำวน',t:'m',pw:100,el:'water',all:1,mp:14,cd:3,dot:{n:'วังน้ำวน',turns:4,rate:.11,el:'water'}},
 constrict_dot:{n:'บีบรัดมรณะ',t:'p',pw:130,el:'normal',mp:10,cd:2,dot:{n:'บีบรัด',turns:3,rate:.14,el:'normal'}},
 bow_true:{n:'ศรเจาะวิญญาณ',t:'p',pw:190,el:'normal',trueD:1,acc:100,mp:16,cd:2},
 gun_true:{n:'กระสุนพิพากษา',t:'p',pw:210,el:'steel',trueD:1,acc:100,mp:18,cd:3},
 hire_merc:{n:'จ้างทหารรับจ้าง',t:'summon',summon:'merc',mp:0,pctGold:.10,cd:5,life:3},
 shadow_clone:{n:'แยกร่างเงา',t:'summon',summon:'clone',mp:16,cd:3,life:3},
 summon_golem:{n:'อัญเชิญโกเลมพิทักษ์',t:'summon',summon:'golem',mp:18,cd:5,life:3}
});
for(const [el,info] of Object.entries(EL)){
 if(!SK[el+'_p1'])SK[el+'_p1']={n:'จู่โจม'+info.n,t:'p',el,pw:110,mp:4};
 if(!SK[el+'_p2'])SK[el+'_p2']={n:'พิฆาต'+info.n,t:'p',el,pw:185,mp:10,cd:1};
 if(!SK[el+'_m1'])SK[el+'_m1']={n:'เวท'+info.n,t:'m',el,pw:115,mp:5};
 if(!SK[el+'_m2'])SK[el+'_m2']={n:'มหาเวท'+info.n,t:'m',el,pw:190,mp:11,cd:1};
 if(['fire','water','flying'].includes(el))SK['enchant_'+el]={n:'ประทับดาบธาตุ'+info.n,t:'buff',tg:'self',enchant:el,tn:3,mp:7,cd:1};
}
CLS.gladiator.sk.push([10,'guard_physical'],[14,'guard_magic']);
CLS.swordsman.sk.push(...['fire','water','flying'].map(el=>[8,'enchant_'+el]));
CLS.archer.sk.push([18,'bow_true']);CLS.gunner.sk.push([18,'gun_true']);
CLS.mage.sk.push([4,'water_m1'],[7,'ground_m1'],[9,'flying_m1'],[20,'firestorm_dot'],[22,'whirlpool_dot']);
CLS.merchant.sk.push([10,'hire_merc']);CLS.thief.sk.push([10,'shadow_clone']);CLS.summoner.sk.push([10,'summon_golem']);
for(const sk of Object.values(SK)){
 if(['p','m','h','auto'].includes(sk.t)){
  if(sk!==SK.attack&&!sk.el)sk.el='normal';
  if(sk.all){sk.basePower=sk.pw||100;sk.pw=Math.min(sk.pw||100,160);sk.areaScale=.65;}
  if(!sk.cd&&((sk.pw||0)>=300||sk.ct||sk.revAll))sk.cd=3;
  else if(!sk.cd&&((sk.pw||0)>=220||(sk.hits||0)>=4))sk.cd=2;
 }
 if(sk.revAll&&!sk.cd)sk.cd=3;
}
const NEW_BEASTS=[["moon_tortoise", "เต่าศิลาจันทร์", "rock", "moonstone tortoise guardian with crescent rune shell", 1], ["iron_armadillo", "อาร์มาดิลโลเหล็ก", "steel", "armadillo knight with overlapping iron plates", 1], ["moss_treant", "ทรีแอนต์มอส", "grass", "ancient moss-covered treant sentinel", 1], ["coral_crab", "ปูปะการังพิทักษ์", "water", "giant coral crab with tower-shaped shell", 2], ["obsidian_rhino", "แรดออบซิเดียน", "ground", "black obsidian rhinoceros with volcanic armor", 3], ["glacier_bear", "หมีธารน้ำแข็ง", "ice", "polar bear with massive glacier armor", 4], ["thunder_gorilla", "กอริลลาอัสนี", "electric", "silverback gorilla with thunderstone gauntlets", 4], ["bastion_golem", "โกเลมป้อมปราการ", "rock", "walking fortress golem with shield arms", 3], ["jade_bull", "กระทิงหยกสวรรค์", "fairy", "jade green divine bull with golden armor", 5], ["abyss_turtle", "เต่าอเวจี", "dark", "abyssal sea turtle with black spiked shell", 6], ["lunar_stag", "กวางราชันย์จันทร์", "fairy", "moon stag with luminous branching antlers", 1], ["thorn_queen", "ราชินีหนาม", "grass", "regal briar queen plant monster", 1], ["mist_serpent", "อสรพิษม่านหมอก", "water", "eastern mist serpent with luminous pearls", 2], ["crow_emperor", "จักรพรรดิอีกา", "flying", "crowned raven emperor with black wing mantle", 2], ["sand_colossus", "ยักษ์ทรายสุริยะ", "ground", "sand colossus with pharaoh mask and solar core", 3], ["scorpion_pharaoh", "ฟาโรห์แมงป่อง", "poison", "golden scorpion pharaoh with jeweled pincers", 3], ["storm_wyvern", "ไวเวิร์นพายุคลั่ง", "electric", "storm wyvern crowned with forked lightning", 4], ["frost_lich", "ลิชน้ำแข็งนิรันดร์", "ice", "ice lich sorcerer with floating frozen crown", 4], ["fallen_seraph", "เซราฟปีกหัก", "fairy", "fallen six-wing seraph with cracked golden halo", 5], ["sun_devourer", "อสูรกลืนตะวัน", "fire", "enormous solar lion devouring a flaming sun", 5], ["vampire_queen", "ราชินีแวมไพร์", "dark", "vampire queen with black crimson dress and bat wings", 6], ["abyss_emperor", "จักรพรรดิอเวจี", "ghost", "abyss emperor with spectral crown and tentacle mantle", 6], ["goblin", "ก็อบลิน", "dark", "mischievous green goblin with curved dagger", 1], ["silver_fox", "จิ้งจอกเงิน", "ice", "silver fox with icy blue eyes", 1], ["moon_cat", "แมวจันทร์", "psychic", "moon cat floating with psychic crescent aura", 1], ["eagle", "อินทรีเวหา", "flying", "golden eagle spreading magnificent wings", 2], ["mermaid", "เงือกแก้ว", "water", "mermaid with sapphire scales and flowing hair", 2], ["crocodile", "จระเข้เกล็ดเหล็ก", "steel", "crocodile with steel scales and ancient markings", 2], ["night_horse", "อาชารัตติกาล", "ghost", "spectral black horse with violet flaming mane", 3], ["desert_witch", "แม่มดทราย", "psychic", "desert witch with crescent staff and sand magic", 3], ["mummy_king", "ราชามัมมี่", "ghost", "mummy king with weathered gold death mask", 3], ["ice_wolf", "หมาป่าน้ำแข็ง", "ice", "ice wolf howling with crystalline fur", 4], ["fire_imp", "อิมป์เพลิง", "fire", "small mischievous crimson fire imp", 4], ["stone_lion", "สิงห์ศิลา", "rock", "animated guardian lion statue with jade eyes", 4], ["celestial_deer", "กวางดารา", "fairy", "celestial deer with star-filled coat", 5], ["storm_drake", "เดรคเมฆา", "dragon", "cloud drake with blue lightning whiskers", 5], ["demon_knight", "อัศวินปีศาจ", "fighting", "demon knight in obsidian armor with red spear", 6], ["zombie", "ซอมบี้เฝ้าสุสาน", "poison", "undead grave guardian in tattered armor", 6], ["void_mantis", "ตั๊กแตนตำข้าวมิติ", "bug", "void mantis with iridescent dimensional scythe arms", 6]];
NEW_BEASTS.forEach(([key,n,el,subject,zone],i)=>{
 const tank=i<10;const boss=i>=10&&i<22;
 SP[key]={n,o:'ตำนานผู้พิทักษ์',t:[el],em:tank?'🛡️':'✦',r:tank?1.8:boss?3.2:1.6,b:tank?[90,35,5,5,22,22,88,3,5]:[52+zone*4,30,11+zone,10+zone,9+zone,9+zone,92,8,10],sk:tank?['guard_taunt',el+'_p1','guard_physical','guard_magic']:[el+'_p1',el+'_m1',el+'_p2',el+'_m2'],pas:tank?'sturdy':'keen',parts:[[n+'แก่นพลัง',30*zone],[n+'เศษวิญญาณ',40*zone]]};
 if(['mist_serpent','crocodile','abyss_emperor'].includes(key))SP[key].sk[2]='constrict_dot';
 const z=ZN[zone-1];if(z){if(boss)z.rare.push(key);else z.sp.push(key)}
});
ZN[0].lv=[4,9];
ZN.forEach(z=>{const candidates=NEW_BEASTS.filter((x,i)=>i>=10&&i<22&&x[4]===z.id);z.bosses=[z.boss,...candidates.map(x=>({sp:x[0],lv:z.boss.lv,n:x[1]}))];while(z.bosses.length<3){const sp=z.sp[z.bosses.length%z.sp.length];z.bosses.push({sp,lv:z.boss.lv,n:'ราชันย์'+SP[sp].n})}});
CON.godSeal={n:'ผนึกของพระเจ้า',d:'จับอสูรที่จับได้สำเร็จ 100% ต้องกำจัดเจ้าของเดิมก่อน',seal:Infinity,perfect:1,price:0,rareLoot:1};
for(const cls of Object.keys(CLS))if(!NPC.some(n=>n.cls===cls)){const tier=CLS[cls].p?(CLS[CLS[cls].p].p?2:1):0,lv=tier===0?18:tier===1?32:55;NPC.push({n:'ผู้ท้าชิง '+CLS[cls].n,cls,lv,pets:[[Object.keys(SP)[NPC.length%Object.keys(SP).length],lv]],gold:Math.round(lv*lv*12)})}
/* Per-unit cooldown: cd=1 blocks the next personal turn. */
function cooldownOf(u,id){return Math.max(0,(u.cooldowns||{})[id]||0)}
function endUnitTurn(u){if(!u||u.hp<=0)return;for(const d of (u.dots||[])){const m=typeMult(d.el,u.types);if(m>0)hurt(u,Math.max(1,Math.round(u.st.hp*d.rate*m)));d.turns--;blog(u.name+' ได้รับผล '+d.n)}u.dots=(u.dots||[]).filter(d=>d.turns>0);}
function beginUnitTurn(u){u.freeFormUsed=false;u.freeFormPending=false;u.cooldowns=u.cooldowns||{};for(const k in u.cooldowns)u.cooldowns[k]=Math.max(0,u.cooldowns[k]-1);if(u.enchantTurns>0&&!--u.enchantTurns)delete u.enchant;if(u.immuneTurns>0&&!--u.immuneTurns)delete u.immune;if(u.summonLife!=null&&!--u.summonLife){u.hp=0;blog(u.name+' หมดเวลาอัญเชิญ');return true}return false}
// An enchanted attack keeps its own non-neutral element and adds the sword element.
// Neutral is replaced; repeated elements never stack. Support skills are unaffected.
function effectiveElement(u,sk){
 const base=sk===SK.attack?(u.stab||[])[0]||'normal':sk.el||'normal';
 if(!u.enchant||!['p','m','h','auto'].includes(sk.t))return base;
 const elements=[...new Set([base,u.enchant])].filter(el=>el!=='normal');
 return elements.length>1?elements:elements[0]||base;
}
function attackHasElement(u,sk,el){const value=effectiveElement(u,sk);return Array.isArray(value)?value.includes(el):value===el;}
function attackMultiplier(u,sk,t){return typeMult(effectiveElement(u,sk),t.types)*(attackHasElement(u,sk,'ground')&&hasPas(t,'levitate')?.25:1);}
// Four positions per sealer (world raid) or side. Dead positions are reused.
function battleSlotGroup(u,b=B()){if(!b)return [];const list=u.side==='ally'?b.allies:b.enemies;return b.kind==='world'&&u.side==='ally'?list.filter(x=>x.owner===u.owner):list;}
function battleHasRoom(u,b=B()){return !!b&&battleSlotGroup(u,b).filter(x=>x.hp>0).length<4;}
function battlePlaceUnit(u,n){
 const b=B(),list=sideOf(u),group=battleSlotGroup(u);if(group.filter(x=>x.hp>0).length>=4)return false;
 const old=group.find(x=>x.hp<=0);if(old){
  if(!old.temporary)(b.retiredUnits??=[]).push(old);
  // Persist a defeated pet before its visible slot is reused.
  const p=old.side==='ally'&&old.kind==='pet'&&S.P?.pets?.find(p=>p.uid===old.uid);
  if(p){p.hp=old.hp;p.mp=old.mp;p.ailments=Object.fromEntries(['poison','burn','confuse','para','static','freeze','chill'].filter(k=>old.status?.[k]).map(k=>[k,Math.max(2,old.status[k])]));}
  b.queue=(b.queue||[]).filter(id=>String(id).replace(/\*$/,'')!==old.id);
  list[list.indexOf(old)]=n;
 }else list.push(n);
 (b.queue??=[]).push(n.id);return true;
}
function spiritCorpse(u){return [...foesOf(u),...(B()?.retiredUnits||[]).filter(x=>x.side!==u.side)].find(x=>x.hp<=0&&x.sp&&SP[x.sp]&&!x.boss&&!x.temporary&&!x.spiritClaimed&&!x.bossHelper);}
function addTemporary(u,sk){if(!battleHasRoom(u))return false;let n;
 if(sk.summon==='clone'){n=JSON.parse(JSON.stringify(u));n.st=Object.fromEntries(Object.entries(u.st).map(([k,v])=>[k,Math.max(k==='hp'?1:0,Math.round(v*(k==='hp'?.5:.8)))]));n.hp=n.st.hp;n.mp=n.st.mp;n.skills=n.skills.slice();n.name='ร่างแยก '+u.name;n.shadowOwner=u.id;}
 else if(sk.summon==='enemySpirit'){const corpse=spiritCorpse(u);if(!corpse)return false;n=JSON.parse(JSON.stringify(corpse));n.name='วิญญาณ '+corpse.name;n.hp=Math.max(1,Math.round(n.st.hp*.5));n.mp=Math.round(n.st.mp*.5);n.skills=n.skills.filter(id=>!SK[id]?.summon);n.spiritSource=corpse.id;}
 else if(sk.summon==='golem'){n=wildUnit('bastion_golem',u.lv,0);n.name='โกเลมอัญเชิญ';n.taunt=3;n.skills=['attack','guard_taunt'];}
 else{const P=u.kind==='player'||u.owner!=null?S.P:u;if(!Number.isFinite(P.gold))P.gold=u.lv*30;const cost=Math.floor(Math.max(0,P.gold)*.10);if(cost<1)return false;P.gold-=cost;const jobs=Object.keys(CLS).filter(c=>baseOf(c)!=='merchant'&&tierOf(c)<=Math.max(0,tierOf(u.cls)-1));const lv=Math.max(1,Math.floor(u.lv*.85));const eligible=jobs.filter(c=>tierOf(c)===0||lv>=(tierOf(c)===1?25:40));n=humanUnit('ทหารรับจ้าง',pick(eligible),lv,0);n.skills=n.skills.filter(id=>!SK[id].summon);}
 n.id=u.id+'_summon_'+(B().summonSerial=(B().summonSerial||0)+1);n.side=u.side;n.owner=u.owner;n.kind='summon';n.temporary=true;n.summonLife=sk.life+1;n.cooldowns={};n.buffs=[];n.status={};n.dots=[];n.immune=null;n.enchant=null;delete n.uid;const placed=battlePlaceUnit(u,n);if(placed&&n.spiritSource){const corpse=[...foesOf(u),...(B().retiredUnits||[])].find(x=>x.id===n.spiritSource);if(corpse)corpse.spiritClaimed=true;}return placed;
}

function scoreValue(e){return Math.round(Math.max(1,e.lv||1)*(['human','player'].includes(e.kind)?15:e.boss?30:e.rare?20:8))}


function unit(o){return {buffs:[],status:{},pas:[],stab:[],types:[],taunt:0,...o}}
function playerUnit(){const P=S.P,s=pStats(),w=EQ[P.eq.weapon];
 return unit({id:'P',side:'ally',kind:'player',name:P.name,lv:P.lv,st:s,hp:Math.min(P.hp,s.hp),mp:Math.min(P.mp,s.mp),skills:humanSkills(P.cls,P.lv,P.eq),pas:humanPas(P.cls,P.eq,P.lv),stab:w&&w.el?[w.el]:[],atkType:w?w.t:'p',img:'player',cls:P.cls,gender:['male','female'].includes(P.gender)?P.gender:undefined})}
function petUnit(p){const s=calcPet(p);return unit({id:'pet'+p.uid,uid:p.uid,side:'ally',kind:'pet',sp:p.sp,evo:p.form||0,name:petName(p),types:SP[p.sp].t.slice(),stab:SP[p.sp].t,lv:p.lv,st:s,hp:Math.min(p.hp,s.hp),mp:Math.min(p.mp,s.mp),skills:petSkills(p),pas:[SP[p.sp].pas],atkType:s.patk>=s.matk?'p':'m',img:p.sp})}
function wildUnit(sp,lv,i,boss){const t={sp,lv,form:formFor(sp,lv),pts:{}},s=calcPet(t,1.1);
 if(boss){s.hp=Math.round(s.hp*2);['patk','matk','pdef','mdef'].forEach(k=>s[k]=Math.round(s[k]*1.15))}
 return unit({id:'e'+i,side:'enemy',kind:'beast',sp,evo:t.form,name:boss||petName(t),types:SP[sp].t.slice(),stab:SP[sp].t,lv,st:s,hp:s.hp,mp:s.mp,skills:petSkills(t),pas:[SP[sp].pas],atkType:s.patk>=s.matk?'p':'m',boss:!!boss,r:SP[sp].r*(boss?2.5:1),img:sp})}
function npcEq(cls,lv){const t=WLV.reduce((a,l,i)=>lv>=l?i:a,0),g=TIERS.reduce((a,x,i)=>lv>=x[1]?i:a,0);return {weapon:`wp_${clsWeapon(cls)}${t}`,armor:'armor_'+g,gloves:'gloves_'+g,boots:'boots_'+g}}
function humanUnit(name,cls,lv,i){const eq=npcEq(cls,lv),focus=clsMult(cls,'patk')>=clsMult(cls,'matk')?'patk':'matk',pts={},n=5*(lv-1);
 Object.entries({[focus]:.35,hp:.25,pdef:.1,mdef:.1,spd:.1,acc:.1}).forEach(([k,v])=>pts[k]=n*v);
 const s=humanStats(cls,lv,pts,eq);s.hp=Math.round(s.hp*1.3);const w=EQ[eq.weapon];
 return unit({id:'e'+i,side:'enemy',kind:'human',name,cls,lv,st:s,hp:s.hp,mp:s.mp,skills:humanSkills(cls,lv,eq).filter(k=>!['form','revert'].includes(SK[k].t)&&!SK[k].gc),pas:humanPas(cls,eq,lv),stab:w&&w.el?[w.el]:[],atkType:w.t,img:'npc:'+cls})}

function blog(t){const b=B();b.log.push(t);if(b.log.length>60)b.log.shift()}
const allU=()=>[...B().allies,...B().enemies];
const uById=id=>allU().find(u=>u.id===id);
const sideOf=u=>u.side==='ally'?B().allies:B().enemies;
const foesOf=u=>u.side==='ally'?B().enemies:B().allies;
const hasPas=(u,k)=>u.pas.includes(k)||u.buffs.some(b=>b.pas===k);
function eff(u,k){const a=u.buffs.reduce((s,b)=>b.st===k?s+b.amt:s,0);let v=u.st[k]*(1+Math.max(-.6,a));
 if(u.form){const f=FORMS[u.form].m[k];if(f)v*=f}
 const s=u.status;if(s.freeze&&(k==='pdef'||k==='mdef'))v*=1.5;if(k==='spd'){if(s.chill)v*=.6;if(s.static)v*=.7}if(k==='acc'&&s.static)v*=.9;
 if(k==='spd'&&hasPas(u,'swift'))v*=1.2;if(k==='eva'&&hasPas(u,'elusive'))v*=1.25;if(k==='acc'&&hasPas(u,'eagle'))v*=1.15;if(k==='crit'&&hasPas(u,'keen'))v+=10;
 if((k==='patk'||k==='matk')&&hasPas(u,'rage')&&u.hp<u.st.hp/2)v*=1.3;
 if((k==='pdef'||k==='mdef')&&hasPas(u,'laststand')&&u.hp<u.st.hp*.3)v*=1.5;
 if(['patk','matk'].includes(k)&&['pet','npcpet'].includes(u.kind)&&!u.temporary){const count=sideOf(u).filter(x=>['pet','npcpet'].includes(x.kind)&&!x.temporary&&x.hp>0&&x.owner===u.owner).length;v*=Math.max(0,1-.15*Math.max(0,count-1));}
 if(k==='acc'&&u.boss)v+=15;
 if(isWorldBattle()&&u.immortalWorld&&['patk','matk'].includes(k))v*=Math.pow(1.05,Math.max(0,(B().bossTurns||1)-1));return Math.max(k==='crit'?0:1,pvpOffense(u,k,v))}
const hitChance=(u,t,sk)=>clamp(eff(u,'acc')-eff(t,'eva')+15+((sk&&sk.acc)||0),minimumHitChance(u,t),100);
function fxAdd(u,t,c){B().fx.push({id:u.id,t,c})}
const costOf=(u,sk)=>sk.mp?Math.round(sk.mp*(hasPas(u,'mpsave')?.7:1)):0;
// Once per battle; only an owner's living permanent companion can pay the cost.
function trySummonerSoulRevive(u){
 if(!u.cls||baseOf(u.cls)!=='summoner'||!['player','human'].includes(u.kind)||u.temporary||u.summonerSoulRevived||!B())return false;
 const pet=sideOf(u).filter(p=>['pet','npcpet'].includes(p.kind)&&!p.temporary&&p.owner===u.owner&&p.hp>0).reduce((a,p)=>!a||p.hp<a.hp?p:a,null);
 if(!pet)return false;
 u.summonerSoulRevived=true;pet.hp=0;pet.reborn=1;
 u.hp=Math.max(1,Math.round(u.st.hp*.3));
 u.status=typeof retainedBattleAilments==='function'?retainedBattleAilments(u):{};
 blog(pet.name+' สละพลังชีวิตให้ '+u.name+' ฟื้นคืนชีพด้วย HP 30% (1 ครั้งต่อการต่อสู้)');
 fxAdd(pet,'สละชีวิต','bad');fxAdd(u,'คืนชีพ 30%','good');vfx('heal',u.id);return true;
}
function hurt(u,d,c='bad'){if(isWorldBattle()&&u.immortalWorld){const b=B(),damage=Math.max(0,Math.min(1e12,Math.round(Number(d)||0)));b.damageTotal=(b.damageTotal||0)+damage;const owner=b.wbDamageOwner;if(Number.isInteger(owner)&&owner>=0)b.damageBy[owner]=(b.damageBy[owner]||0)+damage;u.hp=u.st.hp;fxAdd(u,'-'+damage,c);return;}const wasAlive=u.hp>0;u.hp=Math.max(0,u.hp-d);fxAdd(u,'-'+d,c);
 if(u.hp<=0){if(hasPas(u,'rebirth')&&!u.reborn){u.reborn=1;u.hp=Math.round(u.st.hp*.4);u.status={};blog(`${u.name} ลุกขึ้นจากเถ้าถ่าน! ฟื้นคืนชีพ`);fxAdd(u,'คืนชีพ','good')}else if(wasAlive&&trySummonerSoulRevive(u)){/* revived before settlement */}else{blog(`${u.name} ล้มลง`);if(wasAlive)Sound.cry(u.sp,true)}}}
function heal(u,a){const v=Math.min(u.st.hp-u.hp,Math.round(a));if(v>0){u.hp+=v;fxAdd(u,'+'+v,'good')}return v}
function turnStartBase(u){const s=u.status;
 u.buffs.forEach(x=>x.tn--);u.buffs=u.buffs.filter(x=>x.tn>0);if(u.taunt>0&&!isWorldBattle())u.taunt--;
 if(hasPas(u,'regen')&&u.hp<u.st.hp)heal(u,u.st.hp*(isBalancedPvp()?.035:.06));
 if(hasPas(u,'mpregen'))u.mp=Math.min(u.st.mp,u.mp+Math.round(u.st.mp*.08));
 for(const k of ['burn','poison'])if(s[k]){const d=Math.max(1,Math.round(u.st.hp*(k==='burn'?.06:.08)));blog(`${u.name} ${k==='burn'?'โดนไฟเผา':'โดนพิษกัดกร่อน'} เสีย ${d} HP`);hurt(u,d);if(u.hp<=0)return true}
 if(s.freeze){s.freeze--;if(s.freeze<=0){delete s.freeze;blog(`น้ำแข็งที่ห่อหุ้ม ${u.name} ละลายแล้ว`)}else{blog(`${u.name} ถูกแช่แข็ง ขยับไม่ได้`);return true}}
 if(s.sleep){s.sleep--;if(s.sleep<=0){delete s.sleep;blog(`${u.name} ตื่นขึ้นแล้ว`)}else{blog(`${u.name} หลับปุ๋ย...`);fxAdd(u,'Zzz','muted');return true}}
 let skip=null;
 if(s.para&&Math.random()<.25)skip=`${u.name} เป็นอัมพาต ขยับตัวไม่ได้`;
 else if(s.love&&Math.random()<.45)skip=`${u.name} หลงรักจนเหม่อลอย ไม่ยอมโจมตี`;
 else if(s.confuse&&Math.random()<.35){const d=Math.max(1,Math.round(u.st.hp*.06));skip=`${u.name} มึนงง ทำร้ายตัวเอง ${d} HP`;hurt(u,d)}
 for(const k of ['burn','poison','chill','static','love','confuse','charm','para'])if(s[k]){s[k]--;if(s[k]<=0){delete s[k];blog(`${u.name} หายจากอาการ${STS[k].n}`)}}
 if(skip){blog(skip);return true}return false}
function applyStatus(t,k,ch){if(t.hp<=0||t.status[k])return;if(IMM[k]&&t.types.some(x=>IMM[k].includes(x)))return;
 if(t.pas.some(p=>PAS[p]&&PAS[p].imm&&PAS[p].imm.includes(k)))return;
 if((k==='freeze'||k==='sleep')&&(t.status.freeze||t.status.sleep))return;
 if(Math.random()<ch){t.status[k]=STS[k].d();blog(`${t.name} ${STS[k].n}!`);fxAdd(t,STS[k].n,'mp')}}
function addBuffs(x,sk){if(sk.bf)for(const k in sk.bf)x.buffs.push({st:k,amt:sk.bf[k],tn:(sk.tn||3)+1});if(sk.pas)x.buffs.push({pas:sk.pas,tn:(sk.tn||3)+1})}
function actBase(u,id,tgt,atgt,free){const sk=pvpSkill(id),b=B(),cost=costOf(u,sk);
 if(!free){if(cost&&u.mp<cost){blog(`MP ไม่พอสำหรับ ${sk.n}`);return false}
  if(sk.gc&&u.kind==='player'){const c=sk.gc*u.lv;if(S.P.gold<c){blog('เงินไม่พอ');return false}S.P.gold-=c;blog(`จ่าย ${fmt(c)} เหรียญ`)}
  u.mp-=cost;
  if(sk.ct){u.charging={id,tid:tgt?tgt.id:null};blog(`${u.name} รวบรวมพลังเตรียมใช้ ${sk.n}!`);fxAdd(u,'ชาร์จ','mp');vfx('charge',u.id);Sound.fx('charge');return true}}
 Sound.skill(id,u);
 if(id!=='attack'&&id!=='rest')vfx('cast',u.id,{skill:id,n:sk.n,el:sk.el,c:sk.t==='heal'?'#7fd08a':!sk.el?'#d9b35b':null});
 const mates=sideOf(u);
 if(sk.t==='rest'){const m=Math.round(u.st.mp*.3);u.mp=Math.min(u.st.mp,u.mp+m);blog(`${u.name} ตั้งสมาธิ ฟื้น MP ${m}`);fxAdd(u,'+'+m+' MP','mp');return true}
 if(sk.t==='form'){const f=FORMS[sk.form];if(!u.baseSkills)u.baseSkills=u.skills;u.form=sk.form;u.types=u.defenseTypes?u.defenseTypes.slice():f.t.slice();u.skills=[...new Set([...f.sk,...(u.cls&&baseOf(u.cls)==='druid'?(u.baseSkills||[]).filter(id=>SK[id]):[]),'revert'])];u.img='form:'+sk.form;blog(`${u.name} แปลงเป็น${f.n}!`);fxAdd(u,f.n,'good');return true}
 if(sk.t==='revert'){u.form=null;u.types=u.defenseTypes?u.defenseTypes.slice():[];u.skills=u.baseSkills||u.skills;u.img=u.kind==='player'?'player':u.img;blog(`${u.name} คืนร่างมนุษย์`);return true}
 if(sk.t==='heal'||sk.t==='buff'){
  let list=sk.tg==='team'?mates.filter(x=>x.hp>0||((sk.revAll)&&x.kind!=='player')):sk.tg==='self'?[u]:[atgt&&(atgt.hp>0||sk.rev)&&mates.includes(atgt)?atgt:u];
  const hm=(hasPas(u,'healer')?1.3:1)*((['pet','npcpet','summon'].includes(u.kind)||u.kind==='beast'&&u.side==='ally') ? .7 : ['player','human'].includes(u.kind)&&u.cls&&['druid','summoner'].includes(baseOf(u.cls))&&!(['pvp','raid','camp','guildwar','tower','world'].includes(B()?.kind)||B()?.towerRun) ? .7 : 1);
  list.forEach(x=>{if(sk.t==='heal'){if(x.hp<=0){if(sk.rev||sk.revAll){x.hp=Math.round(x.st.hp*sk.pw/100);x.status={};blog(`${x.name} ฟื้นคืนชีพ!`);fxAdd(x,'คืนชีพ','good')}return}
   heal(x,(x.st.hp*sk.pw/100+eff(u,'matk')*.5)*hm);if(sk.cure)x.status={};vfx('heal',x.id)}
   if(sk.t==='buff')vfx('buff',x.id,{c:sk.charge?'#6f9cf0':'#d9b35b'});
   addBuffs(x,sk);if(sk.charge){x.charge=sk.charge;fxAdd(x,'×'+sk.charge,'mp')}});
  if(sk.taunt)u.taunt=sk.taunt;
  blog(`${u.name} ใช้ ${sk.n}${sk.tg==='team'?' ให้ทั้งทีม':list[0]!==u?` ให้ ${list[0].name}`:''}`);return true}
 let side=foesOf(u);
 if(u.status.charm&&Math.random()<.45){side=mates;tgt=pick(mates.filter(x=>x.hp>0));blog(`${u.name} ถูกมนต์สะกด หันไปโจมตี ${tgt.name}!`)}
 const alive=side.filter(x=>x.hp>0&&(sk.all||!class10Invisible(x)));if(!alive.length)return true;
 if(!tgt||tgt.hp<=0||!side.includes(tgt))tgt=alive[0];
 blog(`${u.name} ใช้ ${sk.n}${sk.all?'':sk.rt?'':` ใส่ ${tgt.name}`}`);
 if(sk.all&&['p','m','h'].includes(sk.t))vfx('flash',null,{el:sk.el});
 if(sk.all)alive.forEach(t=>u.hp>0&&hitOne(u,sk,t,areaDamageScale(sk,alive.length),alive.length));
 else{for(let i=0;i<(sk.hits||1);i++){const al=side.filter(x=>x.hp>0&&!class10Invisible(x));if(!al.length||u.hp<=0)break;const t=sk.rt?pick(al):tgt.hp>0?tgt:al[0];hitOne(u,sk,t,1)}
  if(hasPas(u,'multihit')&&['p','m','h','auto'].includes(sk.t)&&Math.random()<.3&&tgt.hp>0){blog(`${u.name} โจมตีซ้ำด้วยเศียรอื่น!`);hitOne(u,sk,tgt,.5)}}
 if(sk.self&&u.hp>0)hurt(u,Math.round(u.st.hp*sk.self));
 const dmgSk=['p','m','h','auto'].includes(sk.t);if(dmgSk&&u.charge)u.charge=0;
 if(!free&&dmgSk&&sk.t!=='auto'&&u.hp>0&&hasPas(u,'echo')&&Math.random()<.2&&foesOf(u).some(x=>x.hp>0)){blog(`เสียงสะท้อนเวท! ${u.name} ใช้ ${sk.n} ซ้ำ`);act(u,id,tgt&&tgt.hp>0?tgt:null,atgt,true)}
 return true}

function turnStart(u){if(beginUnitTurn(u))return true;const skip=turnStartBase(u);if(skip)endUnitTurn(u);return skip}
function act(u,id,tgt,atgt,free){const sk=pvpSkill(id);if(!sk)return false;if(!free&&cooldownOf(u,id)>0){blog(sk.n+' กำลังคูลดาวน์');return false}if(!free&&costOf(u,sk)>u.mp)return false;
 if(!sk.all&&!sk.rt&&['p','m','h','auto','status','debuff'].includes(sk.t)){const forced=foesOf(u).find(x=>x.hp>0&&x.taunt>0&&!class10Invisible(x));if(forced)tgt=forced}
 let ok;const outer=!B().acting;B().acting=(B().acting||0)+1;
 try{if(sk.summon){ok=addTemporary(u,sk);if(ok){u.mp-=costOf(u,sk);blog(u.name+' ใช้ '+sk.n);Sound.fx('charge');vfx('buff',u.id)}}else{ok=actBase(u,id,tgt,atgt,free);if(ok&&sk.immune){u.immune=sk.immune;u.immuneTurns=2}if(ok&&sk.enchant){u.enchant=sk.enchant;u.enchantTurns=4}}}
 finally{B().acting--}
 if(ok&&!free&&sk.cd){u.cooldowns=u.cooldowns||{};u.cooldowns[id]=sk.cd===1?2:sk.cd}if(ok&&outer&&!u.freeFormPending)endUnitTurn(u);return ok}

// PVP balance v3: transient battle rules only; persistent saves are unchanged.
/* World event shared rules — additive save fields, no changes to original skill tables. */
const WORLD_LEGENDS=[];
const WORLD_WEAPONS=[['sword','ดาบสุริยคราส','dark','pierce'],['axe','ขวานพิพากษาดารา','fire','rage'],['bow','ธนูฉีกฟ้าราตรี','flying','eagle'],['staff','คทาปฐมจักรวาล','psychic','mpsave'],['mace','ค้อนปราการนิรันดร์','steel','guardian'],['gun','ปืนดาวดับสูญ','electric','keen'],['dagger','มีดเขี้ยวอนันต์','ghost','elusive'],['whip','แส้พันธสัญญาเทพ','fairy','healer']];
for(const [wt,n,el,pas] of WORLD_WEAPONS){const id='wl_'+wt;WORLD_LEGENDS.push(id);EQ[id]={n,slot:'weapon',wt,t:WT[wt].t,lv:50,price:120000,st:Object.fromEntries(Object.entries(wStats(wt,5)).map(([k,v])=>[k,Math.round(v*1.45)])),el,pas,ws:'ws_'+wt+'5',tier:6,legend:1,worldLegend:1};}
const WORLD_ARMOR=[["armor","เกราะจักรพรรดิอเวจี","laststand"],["gloves","ถุงมือผู้ท้าทายเทพ","pierce"],["boots","รองเท้าก้าวข้ามดวงดาว","swift"],["belt","เข็มขัดแก่นชีวิตอนันต์","regen"],["bracelet","กำไลเวทปฐมกาล","mpsave"],["ring","แหวนพันธสัญญาโลก","keen"],["necklace","สร้อยหัวใจสุริยคราส","guardian"],["crown","มงกุฎผู้พิชิตนิรันดร์","healer"],["armor","เกราะมหาจักรพรรดิคราส","guardian","ec2_armor"],["gloves","ถุงมือบัญญัติดารา","pierce","ec2_gloves"],["boots","รองเท้าย่างก้าวสุญญตา","swift","ec2_boots"],["belt","เข็มขัดชีพจรเอกภพ","regen","ec2_belt"],["bracelet","กำไลคุมวงโคจร","mpsave","ec2_bracelet"],["ring","แหวนปฐมบทนิรันดร์","keen","ec2_ring"],["necklace","สร้อยบัลลังก์สุริยคราส","healer","ec2_necklace"],["crown","มงกุฎเหนือเทพดารา","laststand","ec2_crown"]];
for(const [slot,n,pas,extraId] of WORLD_ARMOR){const id=extraId||'wl_'+slot;WORLD_LEGENDS.push(id);EQ[id]={n,slot,lv:50,price:100000,st:Object.fromEntries(Object.entries(EQ[slot+'_4'].st).map(([k,v])=>[k,extraId?Math.ceil(Math.max(v,...Object.values(EQ).filter(e=>e.slot===slot&&e.legend&&!e.worldLegend).map(e=>e.st[k]||0))*1.2):Math.round(v*1.4)])),pas,tier:6,legend:1,worldLegend:1,...(extraId?{art:'assets/equipment/eclipse-v2/'+id+'.webp'}:{})};}
Object.assign(SK,{wb_guard:{n:'ตั้งรับ',t:'buff',tg:'self',bf:{pdef:.5,mdef:.5},tn:1,mp:0},wb_claw:{n:'กรงเล็บสุริยคราส',t:'p',pw:240,el:'dark',mp:0},wb_flame:{n:'เปลวเพลิงดับดารา',t:'m',pw:240,el:'fire',mp:0},wb_lance:{n:'หอกห้วงอเวจี',t:'h',pw:240,el:'dragon',mp:0},wb_storm:{n:'มหาพายุอเวจี',t:'m',pw:170,el:'dark',all:1,areaScale:.65,mp:0}});
function isWorldBattle(){return !!(S&&S.battle&&S.battle.kind==='world')}
function worldPowerStats(P,s){const b=Math.min(20,Math.floor(Math.max(0,Number(P.worldPower)||0)/20));s.hp+=b*10;s.patk+=b;s.matk+=b;return s;}
function worldApply(P,a){if(!a)return;const prev=P.worldApplied||{},delta=k=>(Number(a[k])||0)-(Number(prev[k])||0);P.gold=(Number(P.gold)||0)+delta('gold');P.score=(Number(P.score)||0)+delta('score');
 let xp=Math.max(0,delta('xp'));P.exp=(Number(P.exp)||0)+xp;while(P.lv<MAXLV&&P.exp>=need(P.lv)){P.exp-=need(P.lv);P.lv++;P.free=(P.free||0)+5;}if(P.lv>=MAXLV)P.exp=0;
 P.worldPower=Number(a.power)||0;P.items=P.items||{};P.owned=P.owned||[];
 for(const [id,n] of Object.entries(a.loot||{})){const add=Math.max(0,n-Number((prev.loot||{})[id]||0));if(EQ[id]&&EQ[id].worldLegend){for(let i=0;i<add;i++)P.owned.push(id);if(add){P.legend=P.legend||{};P.legend[id]=1;}}else if(CON[id])P.items[id]=(P.items[id]||0)+add;}
 P.worldApplied=JSON.parse(JSON.stringify(a));
}
function worldReward(score,roll,choice){const tier=score>=4000?4:score>=2000?3:score>=1000?2:score>=500?1:0,chance=[0,.005,.01,.05,.10][tier],loot={};if(score>=25)loot.eth=1;if(score>=100)loot.revivePotion=1;if(score>=250)loot.eth=3;if(roll<chance)loot[WORLD_LEGENDS[Math.min(WORLD_LEGENDS.length-1,Math.floor(choice*WORLD_LEGENDS.length))]]=1;return {gold:score*20,score,xp:score*25,power:Math.floor(score/10),loot,tier,chance};}

function pvpOffense(u,k,v){
 if(!isBalancedPvp()||!['patk','matk'].includes(k))return v;
 if(u.kind==='player'){
  if(['gladiator','paladin'].includes(u.cls))v+=(u.st.pdef+u.st.mdef)*.25;
  if(u.cls==='paladin')v=Math.max(v,u.st[k==='patk'?'matk':'patk']*.9);
  if(u.cls==='sage'&&k==='matk')v*=1.25;
  if((u.cls==='gunner'||u.cls==='marksman')&&k==='patk')v*=1.15;
  if(u.cls==='wildgod'&&u.form)v*=1.05;
  // Retain a bounded benefit for legacy critical/speed allocations without moving saved points.
  if(baseOf(u.cls)==='thief'){const legacy=Math.min(1,Math.max(0,u.st.spd/Math.max(u.st.patk,u.st.matk)-.8));v*=1+legacy*(Math.min(.25,Math.max(0,u.st.crit-65)*.004)+.15);}
 }else if(u.kind==='pet'){
  const hero=sideOf(u).find(x=>x.kind==='player');if(hero&&['sealmaster','spiritlord'].includes(hero.cls))v*=1.25;
 }
 return v;
}
function pvpDamageFactor(u,t){if(!isBalancedPvp())return 1;let f=1;
 if(u.kind==='player'&&baseOf(u.cls)==='gladiator'&&!['gladiator','paladin'].includes(u.cls))f*=1.2;
 if(t.kind==='player'&&['sealmaster','spiritlord'].includes(t.cls)&&sideOf(t).some(x=>x.kind==='pet'&&x.hp>0))f*=.6;
 if(t.kind==='player'&&t.cls==='wildgod')f*=.85;
 return f;
}

function isBalancedPvp(){return !!(S&&S.battle&&S.battle.kind==='pvp')}
function pvpSkill(id,inPvp=isBalancedPvp(),mode=null){const sk=SK[id];if(sk&&(mode==='world'||isWorldBattle()))return sk.taunt?{...sk,taunt:1,cd:Math.max(3,sk.cd||0),_pvpId:id}:sk;if(!sk||!inPvp)return sk;let changes=null;
 const tune={ms_thief20:{pw:180,cb:10,cd:3},ms_thief40:{pw:35,cd:3},as_sonic:{pw:50,cd:3},rn_wander:{pw:230,cb:15,cd:3},nj_clone:{bf:{eva:.7,spd:.2}}};
 if(tune[id])changes=tune[id];
 if(id==='dr_leaf'||id==='ms_druid10')changes={cd:2};
 if(sk.all&&sk.t==='m')changes={...changes,pw:sk.basePower||sk.pw,areaScale:.65};
 return changes?{...sk,...changes,_pvpId:id}:sk;
}

function hitOne(u,sk,t,scale,areaCount=0){
 const dmgT=['p','m','h','auto'].includes(sk.t);
 const attackEl=effectiveElement(u,sk);const m=attackMultiplier(u,sk,t);
 if(m===0){blog(`ไม่มีผลต่อ ${t.name}`);fxAdd(t,'×0','muted');vfx('miss',t.id);return}
 if(!sk.acc||sk.acc<100)if(Math.random()*100>hitChance(u,t,sk)){blog(`${t.name} หลบได้`);fxAdd(t,'พลาด','muted');vfx('miss',t.id);return}
 const tx=hasPas(u,'toxin')?1.5:1;
 if(!dmgT){if(class10BlockHit(u,sk,t,false))return;vfx('debuff',t.id,{el:sk.el,c:sk.el?null:'#a07ad8'});addBuffs(t,{bf:sk.bf,tn:sk.tn});if(sk.bf)fxAdd(t,'↓','bad');if(sk.st)for(const k in sk.st)applyStatus(t,k,sk.st[k]*tx);return}
 const type=sk.t==='auto'?u.atkType:sk.t;if((type==='p'&&t.immune==='p')||(type==='m'&&t.immune==='m')){blog(t.name+' ป้องกันสมบูรณ์');vfx('buff',t.id);return}if(class10BlockHit(u,sk,t,true))return;if(type==='h'&&t.immune)scale*=.5;let atk,def;
 if(type==='h'){atk=(eff(u,'patk')+eff(u,'matk'))/2;def=(eff(t,'pdef')+eff(t,'mdef'))/2}else{atk=eff(u,type==='p'?'patk':'matk');def=eff(t,type==='p'?'pdef':'mdef')}
 if(sk.trueD)def=0;def*=1-Math.min(.8,(sk.pi||0)+(hasPas(u,'pierce')?.25:0)+frontlinePierce(u,t));
 const stab=sk.el&&(hasPas(u,'omni')||u.stab.includes(sk.el)||u.types.includes(sk.el)||u.form&&FORMS[u.form].t.includes(sk.el))?(hasPas(u,'adapt')?1.5:1.25):1;
 let d=1.4*atk*(sk.pw/100)*atk/(atk+def)*m*stab*scale*(u.charge||1)*(.9+Math.random()*.2);
 d*=pvpDamageFactor(u,t)*classCombatFactor(u,t,sk);
 if(hasPas(t,'thick')&&(attackHasElement(u,sk,'fire')||attackHasElement(u,sk,'ice')))d*=.5;
 if(sideOf(t).some(x=>x.hp>0&&hasPas(x,'guardian')))d*=.9;
 const crit=classRefreshStealthCrit(u)||(!hasPas(t,'nocrit')&&!rogueCritBlocked(u,t)&&Math.random()*100<(isBalancedPvp()?Math.min(65,eff(u,'crit')+(sk.cb||0)):eff(u,'crit')+(sk.cb||0)));if(crit)d*=hasPas(u,'deadly')?(isBalancedPvp()?1.7:2):1.5;
 d*=hasPas(t,'counter50')?.5:hasPas(t,'reflect50')?.8:1;d*=classDefenseDamageFactor(u,t);d=Math.max(1,Math.round(d));if(classDefenseAbsorb(u,sk,t,d))return;
 if(hasPas(t,'sturdy')&&t.hp===t.st.hp&&d>=t.hp&&t.hp>1){d=t.hp-1;blog(`${t.name} อึดทนไว้ได้!`)}
 blog(`→ ${t.name} ${d} ดาเมจ${crit?' คริติคอล!':''}${m>1?' ได้ผลดีมาก':m<1?' ไม่ค่อยได้ผล':''}`);
 vfx('hit',t.id,{skill:VSKID.get(sk)||sk._pvpId,el:sk.el,phys:type!=='m',crit});
 if(isWorldBattle()&&t.immortalWorld)B().wbDamageOwner=u.owner;hurt(t,d);if(sk.dot&&t.hp>0){t.dots=t.dots||[];t.dots=t.dots.filter(x=>x.n!==sk.dot.n);t.dots.push({...sk.dot,rate:sk.dot.rate*(sk.all?areaTotalBudget(areaCount)/Math.max(1,areaCount):1)})}
 const ls=(sk.ls||0)+(hasPas(u,'lifesteal')?.15:0);if(ls&&u.hp>0)heal(u,d*ls);
 if(hasPas(u,'manadrain'))u.mp=Math.min(u.st.mp,u.mp+Math.round(d*.08));
 if(sk.steal)steal(u,t);
 if(sk.gold&&u.kind==='player'){const g=u.lv*8;S.P.gold+=g;blog(`ได้ ${g} เหรียญ`)}
 reflectShieldDamage(u,t,d);if((type==='p'||type==='h')&&u.hp>0){const tf=(hasPas(t,'counter50')||hasPas(t,'reflect50'))?0:hasPas(t,'thorns2')?.4:hasPas(t,'thorns')?.25:0;if(tf){const r=Math.max(1,Math.round(d*tf));blog(`${u.name} โดนสะท้อน ${r}`);if(isWorldBattle()&&u.immortalWorld)B().wbDamageOwner=t.owner;hurt(u,r)}
  if(hasPas(t,'flameBody')&&Math.random()<.25)applyStatus(u,'burn',1);if(hasPas(t,'staticbody')&&Math.random()<.25)applyStatus(u,'para',1);
  const pt=hasPas(u,'poisonTouch2')?.5:hasPas(u,'poisonTouch')?.25:0;if(pt)applyStatus(t,'poison',pt*tx);
  if(t.hp>0&&u.hp>0&&hasPas(t,'counter')&&!t._ctr&&Math.random()<.25){t._ctr=1;blog(`${t.name} สวนกลับ!`);hitOne(t,SK.attack,u,1);t._ctr=0}}
 if(t.hp<=0)return;
 if(t.status.sleep){delete t.status.sleep;blog(`${t.name} สะดุ้งตื่น!`)}
 if(t.status.freeze&&attackHasElement(u,sk,'fire')){delete t.status.freeze;blog(`ไฟละลายน้ำแข็งของ ${t.name}`)}
 if(sk.bf)addBuffs(t,{bf:sk.bf,tn:sk.tn});
 if(sk.st)for(const k in sk.st)applyStatus(t,k,sk.st[k]*(sk.all?areaTotalBudget(areaCount)/Math.max(1,areaCount):scale<1?.7:1)*tx)}

/* Mist expansion: additive species/skills; no changes to existing pets or saves. */
const MIST_RARE_DEFS=[
 ['jade_moon_hare','กระต่ายหยกจันทรา',['fairy','ice'],'jackalope',1,'imm_mind','จันทรา','จีน'],
 ['tempest_lynx','ลิงซ์อัสนี',['electric','flying'],'raiju',2,'swift','อัสนี','ป่าพายุ'],
 ['bloom_jade_mare','อาชาบุปผาหยก',['grass','fairy'],'kelpie',2,'regen','บุปผา','หุบเขาหยก'],
 ['obsidian_scarab','ด้วงราชันออบซิเดียน',['rock','bug'],'scarab',3,'nocrit','ออบซิเดียน','สุสานโบราณ'],
 ['aurora_whale','วาฬน้อยแสงเหนือ',['water','psychic'],'mermaid',4,'mpsave','แสงเหนือ','ทะเลเมฆา'],
 ['ember_jackal','หมาไนเถ้าเพลิง',['fire','dark'],'ifrit',4,'flameBody','เถ้าเพลิง','ทะเลเพลิง'],
 ['prism_owl','นกฮูกปริซึม',['psychic','flying'],'moon_cat',5,'eagle','ปริซึม','นครดารา'],
 ['dusk_panther','เสือดาวหมอกทมิฬ',['dark','ghost'],'wendigo',6,'elusive','หมอกทมิฬ','ชายแดนรัตติกาล']
];
const MIST_LEGEND_DEFS=[["primordial_ouroboros","อุโรโบรอสปฐมกาล",["dragon","dark"],"jade_moon_hare","pierce","ปฐมกาล"],["dawn_valkyrie","วาลคิรีรุ่งอรุณ",["fairy","fighting"],"tempest_lynx","healer","รุ่งอรุณ"],["astral_dragon","มังกรดารานภา",["dragon","psychic"],"bloom_jade_mare","adapt","ดารานภา"],["cosmic_tortoise","เต่าจักรวาล",["rock","water"],"obsidian_scarab","guardian","จักรวาล"],["solar_sovereign","พญาราชสีห์สุริยะ",["fire","fairy"],"aurora_whale","rebirth","สุริยะ"],["infinite_sea_serpent","อสรพิษอนันตวารี",["water","ice"],"ember_jackal","thick","อนันตวารี"],["void_phoenix","วิหคสุญญตา",["ghost","flying"],"prism_owl","manadrain","สุญญตา"],["eclipse_wolf","หมาป่าคราสนิรันดร์",["dark","ice"],"dusk_panther","deadly","คราสนิรันดร์"],["legend2_aegis_dragon","อาเอจิส มังกรปราการดารา",["dragon","steel"],"obsidian_scarab","guardian","อาเอจิส",{"art":"assets/beasts/eclipse-v2/legend2_aegis_dragon.webp","sk":["dragon_p2","steel_m2","aegis_challenge","dragon_aoe"]}],["legend2_tricephalos","ไตรเซฟาลอส มังกรสามเศียร",["dragon","fire"],"tempest_lynx","multihit","ไตรเซฟาลอส",{"art":"assets/beasts/eclipse-v2/legend2_tricephalos.webp","sk":["dragon_p2","fire_m2","tricephal_breath","dragon_aoe"]}],["legend2_aurorion","ออโรริออน มังกรแสงเหนือ",["dragon","ice"],"aurora_whale","thick","ออโรริออน",{"art":"assets/beasts/eclipse-v2/legend2_aurorion.webp","sk":["dragon_p2","ice_m2","aurora_spear","dragon_aoe"]}],["legend2_abyssarch","แอสโมราธ จอมปีศาจสุญญตา",["dark","fire"],"ember_jackal","lifesteal","แอสโมราธ",{"art":"assets/beasts/eclipse-v2/legend2_abyssarch.webp","sk":["dark_p2","fire_m2","abyss_rend","dark_aoe"]}],["legend2_selestia","เซเลสเทีย เทพีมหาสุริยคราส",["fairy","psychic"],"jade_moon_hare","healer","เซเลสเทีย",{"art":"assets/beasts/eclipse-v2/legend2_selestia.webp","sk":["fairy_p2","psychic_m2","selestia_blessing","fairy_aoe"]}],["legend2_aerelion","แอเรลิออน จอมเวทเอลฟ์ปีกดารา",["psychic","flying"],"prism_owl","mpsave","แอเรลิออน",{"art":"assets/beasts/eclipse-v2/legend2_aerelion.webp","sk":["psychic_p2","flying_m2","aerelion_rune","psychic_aoe"]}],["legend2_myriapod","มหาตะขาบโยมินกันต์",["poison","ground"],"dusk_panther","toxin","โยมินกันต์",{"art":"assets/beasts/eclipse-v2/legend2_myriapod.webp","sk":["poison_p2","ground_m2","myriapod_venom","poison_aoe"]}],["legend2_yggwarden","อิกดราซิล ผู้พิทักษ์รากจักรวาล",["grass","rock"],"bloom_jade_mare","sturdy","อิกดราซิล",{"art":"assets/beasts/eclipse-v2/legend2_yggwarden.webp","sk":["grass_p2","rock_m2","ygg_rootguard","grass_aoe"]}]];
const MIST_SIGNATURES={"jade_moon_hare":{"n":"พรจันทร์หยก","t":"heal","pw":35,"tg":"team","cure":1,"mp":18,"cd":3},"tempest_lynx":{"n":"อัสนีไล่ล่า","t":"m","pw":165,"el":"electric","all":1,"st":{"para":0.15},"mp":20,"cd":3},"bloom_jade_mare":{"n":"สวนบุปผาพิทักษ์","t":"buff","tg":"team","bf":{"pdef":0.3,"mdef":0.3},"tn":3,"mp":16,"cd":3},"obsidian_scarab":{"n":"เขี้ยวศิลาเจาะเกราะ","t":"p","pw":190,"el":"rock","pi":0.35,"mp":16,"cd":2},"aurora_whale":{"n":"ธารแสงเหนือ","t":"heal","pw":35,"tg":"team","cure":1,"mp":20,"cd":3},"ember_jackal":{"n":"เขี้ยวเถ้ากินวิญญาณ","t":"p","pw":180,"el":"fire","ls":0.2,"st":{"burn":0.35},"mp":18,"cd":2},"prism_owl":{"n":"เนตรปริซึมลวงจิต","t":"m","pw":185,"el":"psychic","st":{"confuse":0.4},"mp":18,"cd":2},"dusk_panther":{"n":"ตะปบเงาสามภพ","t":"p","pw":70,"hits":3,"el":"dark","cb":15,"mp":20,"cd":3},"primordial_ouroboros":{"n":"วงแหวนกลืนกาล","t":"h","pw":260,"el":"dark","all":1,"pi":0.4,"mp":32,"cd":4},"dawn_valkyrie":{"n":"รุ่งอรุณคืนชีพ","t":"heal","pw":45,"tg":"team","revAll":1,"cure":1,"mp":32,"cd":5},"astral_dragon":{"n":"มหาฝนดาวมังกร","t":"m","pw":240,"el":"dragon","all":1,"st":{"confuse":0.2},"mp":30,"cd":4},"cosmic_tortoise":{"n":"ปราการจักรวาล","t":"buff","tg":"team","bf":{"pdef":0.55,"mdef":0.55},"tn":3,"mp":28,"cd":4},"solar_sovereign":{"n":"สุริยพิพากษา","t":"m","pw":270,"el":"fire","all":1,"st":{"burn":0.5},"mp":34,"cd":4},"infinite_sea_serpent":{"n":"คลื่นเยือกแข็งอนันต์","t":"p","pw":100,"hits":3,"el":"water","st":{"freeze":0.25},"mp":32,"cd":4},"void_phoenix":{"n":"พายุวิญญาณสูญ","t":"m","pw":250,"el":"ghost","all":1,"ls":0.25,"mp":32,"cd":4},"eclipse_wolf":{"n":"เขี้ยวคราสดับตะวัน","t":"p","pw":280,"el":"dark","pi":0.5,"ls":0.3,"mp":30,"cd":3},"legend2_aegis_dragon":{"n":"ปราการจักรวาล","t":"buff","tg":"team","bf":{"pdef":0.35,"mdef":0.35},"tn":3,"mp":22,"cd":4},"legend2_tricephalos":{"n":"พิพากษาสามเศียร","t":"m","el":"fire","pw":250,"all":1,"mp":27,"cd":4},"legend2_aurorion":{"n":"เหมันต์เหนือดวงดาว","t":"m","el":"dragon","pw":250,"all":1,"st":{"freeze":0.2},"mp":27,"cd":4},"legend2_abyssarch":{"n":"ราชโองการอเวจี","t":"m","el":"fire","pw":280,"all":1,"mp":29,"cd":4},"legend2_selestia":{"n":"รุ่งอรุณคืนวิญญาณ","t":"heal","tg":"team","pw":45,"revAll":1,"cure":1,"mp":34,"cd":5},"legend2_aerelion":{"n":"มหาเวทสลายวงโคจร","t":"m","el":"psychic","pw":260,"all":1,"pi":0.2,"mp":28,"cd":4},"legend2_myriapod":{"n":"พันขาแยกพิภพ","t":"h","el":"ground","pw":250,"all":1,"st":{"poison":0.35},"mp":27,"cd":4},"legend2_yggwarden":{"n":"คำสัตย์แห่งต้นไม้โลก","t":"heal","tg":"team","pw":35,"cure":1,"bf":{"pdef":0.2,"mdef":0.2},"tn":3,"mp":28,"cd":4}};
MIST_RARE_DEFS.forEach(([key,n,t,ref,zone,pas,part,o])=>{
 SP[key]={n,o,t,em:'✧',r:4.8,rare:1,mistNew:1,mistZone:zone,b:SP[ref].b.slice(),sk:[t[0]+'_p1',t[1]+'_m1',t[0]+'_st',t[0]+'_m2'],pas,sig:'mist_sig_'+key,parts:[['แก่น'+part,400+zone*80],['ผนึกเศษ'+part,500+zone*90]]};
 SK['mist_sig_'+key]=MIST_SIGNATURES[key];
});
MIST_LEGEND_DEFS.forEach(([key,n,t,ref,pas,part,extra])=>{
 SP[key]={n,o:'ตำนานหลังจอมมาร',t,em:'✦',r:7.2,rare:1,legendary:1,mistNew:1,rarePair:ref,b:SP[ref].b.slice(),sk:[t[0]+'_p2',t[1]+'_m2',t[0]+'_st',t[0]+'_aoe'],pas,sig:'mist_sig_'+key,parts:[['แก่นตำนาน'+part,1500],['เศษผนึก'+part,1900]],...extra};
 SK['mist_sig_'+key]=MIST_SIGNATURES[key];
});
Object.assign(SK,{"aegis_challenge":{"n":"คำรามท้าดารา","t":"buff","tg":"self","bf":{"pdef":0.4,"mdef":0.4},"taunt":3,"tn":3,"mp":14,"cd":3},"tricephal_breath":{"n":"ลมหายใจสามมหาภัย","t":"h","el":"dragon","pw":70,"hits":3,"mp":20,"cd":2},"aurora_spear":{"n":"หอกน้ำแข็งออโรรา","t":"m","el":"ice","pw":170,"st":{"freeze":0.25},"mp":15,"cd":2},"abyss_rend":{"n":"กรงเล็บฉีกสุญญตา","t":"p","el":"dark","pw":180,"ls":0.3,"mp":17,"cd":2},"selestia_blessing":{"n":"พรเทพีมหาคราส","t":"heal","tg":"team","pw":30,"cure":1,"mp":20,"cd":3},"aerelion_rune":{"n":"อัขระปีกดารา","t":"buff","tg":"self","bf":{"matk":0.4,"spd":0.2},"tn":3,"mp":16,"cd":3},"myriapod_venom":{"n":"เขี้ยวพิษกลืนโลก","t":"p","el":"poison","pw":85,"hits":2,"st":{"poison":0.6},"mp":18,"cd":2},"ygg_rootguard":{"n":"รากไม้พิทักษ์ดารา","t":"buff","tg":"self","bf":{"pdef":0.45,"mdef":0.35},"taunt":3,"tn":3,"mp":13,"cd":3}});

const mistBaseCalcPet=calcPet;
calcPet=function(p,wild=1){
 const sp=SP[p.sp];
 if(sp.legendary){const s=calcPet({...p,sp:sp.rarePair,form:0},wild);for(const k of K)s[k]=Math.round(s[k]*1.2);return s;}
 const s=mistBaseCalcPet(p,wild);if(sp.mistNew)for(const k of K)s[k]=Math.round(s[k]*1.2);return s;
};

const VSKID=new Map(Object.entries(SK).map(([id,sk])=>[sk,id]));

/* ---------- PVP rooms: no writes to the player's RPG save during matches ---------- */
const PVP_ROOM='PVPRooms', PVP_HEAD=['room','status','updated','expires','data1','data2','data3','data4','data5'];
const PVP_CMD='PVPCommands', PVP_CMD_HEAD=['request','room','revision','seat','actor','skill','target','friend','time'];
const PVP_TURN_MS=30000, PVP_MAX_TURNS=60, PVP_ROOM_MS=30*60*1000;
function pvpFail_(message){throw new Error(message)}
function pvpOwn_(table,key){return Object.prototype.hasOwnProperty.call(table,key)}
function pvpId_(){return Utilities.getUuid().replace(/-/g,'').toUpperCase()}
function pvpToken_(){return pvpId_()+pvpId_()}
function pvpSaveAuth_(d){const result=loadGame_({code:d.code,pin:d.pin});const obj=JSON.parse(result.getContent());if(!obj.ok)pvpFail_(obj.error);const data=JSON.parse(obj.data);if(!data.P)pvpFail_('bad save');return {code:code_(d.code),P:data.P}}
function pvpPts_(pts,limit){const out={};let total=0;for(const k of K){const v=Number((pts||{})[k]||0);if(!Number.isInteger(v)||v<0)pvpFail_('bad points');out[k]=v;total+=v}if(total>limit)pvpFail_('bad points');return out}
function pvpTeam_(raw,seat,mode){
 const worldParty=['world','raid','guildwar'].includes(mode)?[...(raw.party||[])]:null;carryNormalize_(raw);if(worldParty)raw.party=worldParty;const lv=Number(raw.lv),cls=String(raw.cls||'');if(!Number.isInteger(lv)||lv<1||lv>60||!pvpOwn_(CLS,cls))pvpFail_('bad character');if((tierOf(cls)===1&&lv<25)||(tierOf(cls)===2&&lv<40))pvpFail_('bad class');
 const eq={};for(const [slot] of SLOTS){const id=raw.eq&&raw.eq[slot];if(!id)continue;if(!pvpOwn_(EQ,id)||EQ[id].slot!==slot||EQ[id].lv>lv)pvpFail_('bad equipment');eq[slot]=id}if(!eq.weapon)pvpFail_('bad weapon');
 const p={worldPower:num_(raw.worldPower,1e9),name:String(raw.name||'ผู้ผนึก').slice(0,20),cls,lv,pts:pvpPts_(raw.pts,5*(lv-1)),eq,pets:[],party:[],gold:num_(raw.gold,1e9)};
 const saved=Array.isArray(raw.pets)?raw.pets:[],ids=Array.isArray(raw.party)?[...new Set(raw.party)]:[];if(ids.length>(['world','raid','guildwar'].includes(mode)?(baseOf(cls)==='summoner'?3:1):Math.min(3,clsSum(cls))))pvpFail_('too many pets');
 for(const uid of ids){if(!raw.carried.includes(uid))pvpFail_('pet at camp');const pet=saved.find(x=>x.uid===uid);if(!pet||!pvpOwn_(SP,pet.sp)||SP[pet.sp].noseal)pvpFail_('bad pet');if(SP[pet.sp].legendary&&!(Number(raw.cleared)>0)&&raw.gachaLegendPets?.[pet.uid]!==pet.sp)pvpFail_('legend locked');const pl=Number(pet.lv);if(!Number.isInteger(pl)||pl<1||pl>60)pvpFail_('bad pet level');p.pets.push({uid,sp:pet.sp,lv:pl,form:formFor(pet.sp,pl),pts:pvpPts_(pet.pts,3*(pl-1)),hp:1,mp:1})}
 S={P:p,battle:null};p.hp=pStats().hp;p.mp=pStats().mp;const hero=playerUnit();hero.id='p'+seat;hero.owner=seat;hero.side=seat?'enemy':'ally';
 const team=[hero];p.pets.forEach((pet,i)=>{const stats=calcPet(pet);pet.hp=stats.hp;pet.mp=stats.mp;const u=petUnit(pet);u.id='p'+seat+'pet'+i;u.owner=seat;u.side=seat?'enemy':'ally';team.push(u)});return {team,name:p.name,cls,lv,gold:p.gold}
}
function pvpNormalize_(r){if(!Number.isInteger(r.battle.turns)){const commands=sheet_(PVP_CMD,PVP_CMD_HEAD).getDataRange().getValues();r.battle.turns=Math.max((r.receipts||[]).length,commands.filter(x=>x[1]===r.id).length)}if(!r.ruleVersion){if(r.status==='active')r.deadline=Math.min(r.deadline,Number(r.updated)+PVP_TURN_MS);r.ruleVersion=2}return r}
function pvpRead_(id){if(!/^[A-F0-9]{8}$/.test(String(id)))pvpFail_('bad room');const sh=sheet_(PVP_ROOM,PVP_HEAD),row=findRow_(sh,id);if(row<0)pvpFail_('room not found');const v=sh.getRange(row,1,1,PVP_HEAD.length).getValues()[0],encoded=v.slice(4).map(x=>String(x||'').replace(/^PV1:/,'')).join('');const r=JSON.parse(Utilities.newBlob(Utilities.base64Decode(encoded)).getDataAsString('UTF-8'));pvpNormalize_(r);return {sh,row,r}}
function pvpWrite_(r,row){r.updated=Date.now();const encoded=Utilities.base64Encode(JSON.stringify(r),Utilities.Charset.UTF_8);if(encoded.length>(CHUNK-4)*5)pvpFail_('room too big');const chunks=Array.from({length:5},(_,i)=>'PV1:'+encoded.slice(i*(CHUNK-4),(i+1)*(CHUNK-4)));const vals=[r.id,r.status,r.updated,r.expires,...chunks],sh=sheet_(PVP_ROOM,PVP_HEAD);if(row)sh.getRange(row,1,1,vals.length).setValues([vals]);else sh.appendRow(vals)}
function pvpFindActive_(code){const sh=sheet_(PVP_ROOM,PVP_HEAD),last=sh.getLastRow();if(last<2)return null;const rows=sh.getRange(2,1,last-1,PVP_HEAD.length).getValues();for(let i=rows.length-1;i>=0;i--){const v=rows[i];if(!['waiting','lobby','active'].includes(v[1])||Number(v[3])<Date.now())continue;const r=JSON.parse(Utilities.newBlob(Utilities.base64Decode(v.slice(4).map(x=>String(x).replace(/^PV1:/,'')).join(''))).getDataAsString('UTF-8'));if(!r.raid&&r.players.some(p=>p.code===code))return {r,row:i+2}}return null}
function pvpFinish_(r,winner,reason){r.status='finished';r.winner=winner;r.reason=reason;r.deadline=0;r.rev++;r.battle.log.push(reason);r.battle.log=r.battle.log.slice(-60);campScore_(r);if(!r.raid){pvpWrite_(r,findRow_(sheet_(PVP_ROOM,PVP_HEAD),r.id));stakeSettle_(r);}}
function pvpCheckEnd_(r){const a=r.battle.allies[0],b=r.battle.enemies[0];if(a.hp<=0||b.hp<=0){pvpFinish_(r,a.hp<=0&&b.hp<=0?-1:a.hp<=0?1:0,'การประลองจบลง');return true}return false}

function pvpAutoChoice_(u){const mates=sideOf(u).filter(x=>x.hp>0),foes=foesOf(u).filter(x=>x.hp>0),target=foes.find(x=>x.taunt>0)||foes[Math.floor(Math.random()*foes.length)],friend=mates.slice().sort((a,b)=>a.hp/a.st.hp-b.hp/b.st.hp)[0]||u;
 const legal=[...new Set([...u.skills,'rest'])].filter(id=>SK[id]&&!cooldownOf(u,id)&&costOf(u,SK[id])<=u.mp&&(!SK[id].gc||S.P.gold>=SK[id].gc*u.lv));
 let id=legal.find(id=>SK[id].t==='heal'&&(SK[id].tg==='self'?u.hp/u.st.hp<.4:friend.hp/friend.st.hp<.4));if(!id&&u.mp<u.st.mp*.15)id='rest';if(!id)id=legal.find(id=>SK[id].taunt&&!u.taunt);
 if(!id){const pool=legal.filter(id=>['p','m','h','auto'].includes(SK[id].t));const scored=pool.map(id=>{const sk=SK[id],ty=sk.t==='auto'?u.atkType:sk.t,atk=ty==='m'?eff(u,'matk'):ty==='h'?(eff(u,'patk')+eff(u,'matk'))/2:eff(u,'patk');return {id,score:combatSkillScore(u,id,target,foes)}}).sort((a,b)=>b.score-a.score);const top=scored.filter(x=>x.score>0&&x.score>=scored[0].score*.7).slice(0,3);id=top.length?top[Math.floor(Math.random()*top.length)].id:'defend';}
 return {id,target,friend:SK[id]?.tg==='self'?u:friend};}
function pvpAutoStep_(r,timeout=false){if(r.status!=='active'||r.raid)return false;const b=r.battle;S={P:{gold:0},battle:b};const u=uById(b.cur);if(!u||(!timeout&&!r.players[u.owner].auto))return false;S.P.gold=r.players[u.owner].gold;b.fx=[];b.effects=[];let move=pvpAutoChoice_(u);
 if(move.id==='defend'||!act(u,move.id,move.target,move.friend)){move.id='defend';u.buffs.push({st:'pdef',amt:.5,tn:1},{st:'mdef',amt:.5,tn:1});vfx('buff',u.id,{c:'#d9b35b'});}
 blog((timeout?'⌛ หมดเวลา เลือกท่าอัตโนมัติ: ':'⚙ ออโต้: ')+u.name);r.players[u.owner].gold=S.P.gold;r.rev++;r.last={actor:u.id,skill:move.id,seat:u.owner,automatic:true,timeout};if(!takeFreeForm(u)&&!pvpCompleteTurn_(r))pvpNext_(r);return true;}

function pvpExpire_(r){pvpNormalize_(r);if(!['waiting','lobby','active'].includes(r.status))return false;if(r.status==='active'&&r.battle.turns>=PVP_MAX_TURNS){if(!pvpCheckEnd_(r))pvpFinish_(r,-1,'เสมอ: ครบ 60 เทิร์นแล้วยังไม่มีผู้ชนะ');return true}if(Date.now()>r.expires){pvpFinish_(r,-1,'ห้องหมดอายุ');return true}return false}
function pvpCompleteTurn_(r){r.battle.turns=(r.battle.turns||0)+1;if(pvpCheckEnd_(r))return true;if(r.battle.turns>=(r.raid?100:PVP_MAX_TURNS)){pvpFinish_(r,-1,'เสมอ: ครบ 60 เทิร์นแล้วยังไม่มีผู้ชนะ');return true}return false}
function pvpNext_(r){const b=r.battle;if(!r.raid)b.kind='pvp';S={P:{gold:0},battle:b};for(let step=0;step<200;step++){
 if(pvpCheckEnd_(r))return;
 if(!b.queue.length){b.round++;const speed=u=>eff(u,'spd')*(b.round===1&&hasPas(u,'firstblood')?2:1),ord=allU().filter(u=>u.hp>0).map(u=>[u,speed(u)*(.97+Math.random()*.06)]).sort((a,c)=>class10OpeningOrder(a[0],c[0],b)||c[1]-a[1]);const extras=[];for(const [u] of ord){b.queue.push(u.id);const opp=foesOf(u).filter(x=>x.hp>0);if(opp.length&&speed(u)>=2*Math.max(...opp.map(speed))){if(r.raid)b.queue.push(u.id+'*');else if(b.round>1&&b.round%2===0)extras.push(u.id+'*')}}b.queue.push(...extras);if(!r.raid&&b.round===1){for(const side of [b.allies,b.enemies]){const guard=side.find(x=>x.hp>0&&x.kind!=='player'&&(x.skills||[]).some(id=>SK[id]&&SK[id].taunt));if(guard){guard.taunt=Math.max(guard.taunt||0,2);blog(guard.name+' ตั้งรับคุ้มกันเปิดการประลอง')}}}}
 const q=b.queue.shift(),extra=q.endsWith('*'),u=uById(q.replace('*',''));if(!u||u.hp<=0)continue;
 if(!extra&&turnStart(u)){if(pvpCompleteTurn_(r))return;continue}if(extra&&(u.status.freeze||u.status.sleep)){if(pvpCompleteTurn_(r))return;continue}
 b.cur=u.id;b.extra=extra;S.P={gold:r.players[u.owner].gold};
 if(u.charging){const charge=u.charging;u.charging=null;u.pendingStealthChargeCrit=!!charge.stealthCrit;const target=uById(charge.tid);blog(u.name+' ปลดปล่อยพลัง');act(u,charge.id,target&&target.hp>0?target:null,null,true);r.players[u.owner].gold=S.P.gold;if(pvpCompleteTurn_(r))return;continue}
 r.turnTimerVersion=1;r.deadline=r.raid?r.expires:Math.min(r.expires,Date.now()+PVP_TURN_MS);return
 }pvpFinish_(r,-1,'การประลองสิ้นสุดจากขีดจำกัดการคำนวณ')}
function pvpView_(r,seat){return {ok:true,account:campAccount_(r.players[seat].code),pvpVersion:1,balanceVersion:4,room:{wagers:stakeView_(r),id:r.id,status:r.status,turnLimit:PVP_MAX_TURNS,turnSeconds:30,rev:r.rev,expires:r.expires,deadline:r.deadline,serverTime:Date.now(),me:seat,winner:r.winner,reason:r.reason||'',players:r.players.map(p=>({name:p.name,cls:p.cls,lv:p.lv,ready:!!p.ready&&p.wagerConfirmed===stakeRead_(r.id).rev,auto:!!p.auto})),gold:r.players[seat].gold,last:r.last||null,battle:r.battle}}}
function pvpDispatch_(d){try{
 if(['pvp_create','pvp_join','pvp_resume'].includes(d.action)){
  const auth=pvpSaveAuth_(d);let found=pvpFindActive_(auth.code);
  if(d.action==='pvp_resume'||(d.action==='pvp_create'&&found)){if(!found)pvpFail_('no active room');const {r,row}=found,seat=r.players.findIndex(p=>p.code===auth.code),token=pvpToken_();r.players[seat].tokenHash=hash_(r.id,token);if(pvpExpire_(r)){}pvpWrite_(r,row);return {...pvpView_(r,seat),token}}
  if(found)pvpFail_('already in room');const profile=pvpTeam_(auth.P,d.action==='pvp_create'?0:1),token=pvpToken_();
  if(d.action==='pvp_create'){const id=pvpId_().slice(0,8);if(findRow_(sheet_(PVP_ROOM,PVP_HEAD),id)>0)pvpFail_('try again');const r={id,ruleVersion:2,status:'waiting',rev:1,expires:Date.now()+10*60000,deadline:0,winner:null,players:[{code:auth.code,tokenHash:hash_(id,token),name:profile.name,cls:profile.cls,lv:profile.lv,gold:profile.gold,ready:false}],battle:{allies:profile.team,enemies:[],round:0,turns:0,queue:[],cur:null,log:['สร้างห้องแล้ว รอผู้ท้าประลอง'],fx:[],effects:[]},receipts:[]};pvpWrite_(r);return {...pvpView_(r,0),token}}
  const {r,row}=pvpRead_(String(d.room||'').toUpperCase());if(pvpExpire_(r)){pvpWrite_(r,row);pvpFail_('room expired')}if(r.raid||r.status!=='waiting'||r.players.length!==1)pvpFail_('room full');if(r.players[0].code===auth.code)pvpFail_('same player');r.players.push({code:auth.code,tokenHash:hash_(r.id,token),name:profile.name,cls:profile.cls,lv:profile.lv,gold:profile.gold,ready:false});r.battle.enemies=profile.team;r.status='lobby';r.expires=Date.now()+5*60000;r.rev++;r.battle.log.push(profile.name+' เข้าร่วม รอทั้งสองฝ่ายยืนยัน');pvpWrite_(r,row);return {...pvpView_(r,1),token}
 }
 const {r,row}=pvpRead_(String(d.room||'').toUpperCase()),token=String(d.token||'');if(!/^[A-F0-9]{64}$/.test(token))pvpFail_('unauthorized');const seat=r.players.findIndex(p=>p.tokenHash===hash_(r.id,token));if(seat<0||r.raid)pvpFail_('unauthorized');communityAllowed_(r.players[seat].code);
 if(pvpExpire_(r)){pvpWrite_(r,row);return pvpView_(r,seat)}
 if(r.status==='finished')stakeSettle_(r);
 if(d.action==='pvp_wager'){stakeOffer_(r,seat,d);pvpWrite_(r,row);return pvpView_(r,seat)}
 if(d.action==='pvp_auto'){if(typeof d.enabled!=='boolean')pvpFail_('bad action');r.players[seat].auto=d.enabled;r.rev++;pvpWrite_(r,row);return pvpView_(r,seat)}
 if(d.action==='pvp_poll'){if(pvpAutoStep_(r))pvpWrite_(r,row);return pvpView_(r,seat);}
 if(d.action==='pvp_leave'){if(['waiting','lobby','active'].includes(r.status)){pvpFinish_(r,r.status==='active'&&r.players.length===2?1-seat:-1,'ผู้เล่นออกจากห้องหรือยอมแพ้');pvpWrite_(r,row)}return pvpView_(r,seat)}
 if(d.action==='pvp_ready'){const wagerRev=stakeSyncReady_(r);if(Number(d.wagerRev||0)!==wagerRev)pvpFail_('stake changed');r.players[seat].wagerConfirmed=wagerRev;if(r.players[seat].ready)return pvpView_(r,seat);if(r.status!=='lobby')pvpFail_('not lobby');r.players[seat].ready=true;r.rev++;if(r.players.every(p=>p.ready)){r.status='active';r.expires=Date.now()+PVP_ROOM_MS;r.battle.effects=[];S={P:{gold:0},battle:r.battle};for(const u of allU())if(hasPas(u,'intimidate')){foesOf(u).forEach(f=>f.buffs.push({st:'patk',amt:-.2,tn:4}));blog(u.name+' ข่มขวัญฝ่ายตรงข้าม')}pvpNext_(r)}pvpWrite_(r,row);return pvpView_(r,seat)}
 if(d.action!=='pvp_move')pvpFail_('bad action');const request=String(d.request||'');if(!/^[A-Za-z0-9_-]{16,80}$/.test(request))pvpFail_('bad request');if(r.receipts.some(x=>x.request===request&&x.seat===seat))return pvpView_(r,seat);if(r.status!=='active')pvpFail_('not active');if(d.item!=null||d.useItem!=null)pvpFail_('items not allowed');if(Number(d.rev)!==r.rev)pvpFail_('stale turn');
 S={P:{gold:r.players[seat].gold},battle:r.battle};const u=uById(r.battle.cur);if(!u||u.owner!==seat)pvpFail_('not your turn');
 const id=String(d.skill||''),target=uById(String(d.target||'')),friend=uById(String(d.friend||''));r.battle.fx=[];r.battle.effects=[];
 if(id==='defend'){u.buffs.push({st:'pdef',amt:.5,tn:1},{st:'mdef',amt:.5,tn:1});blog(u.name+' ตั้งรับ เพิ่มป้องกัน 50% จนถึงเทิร์นถัดไป');vfx('buff',u.id,{c:'#d9b35b'})}
 else{if(!pvpOwn_(SK,id)||(!u.skills.includes(id)&&id!=='rest'))pvpFail_('illegal skill');const sk=SK[id];if(costOf(u,sk)>u.mp)pvpFail_('not enough mp');if(sk.gc&&S.P.gold<sk.gc*u.lv)pvpFail_('not enough gold');if(friend&&['heal','buff'].includes(sk.t)&&(friend.owner!==seat||(friend.hp<=0&&!sk.rev&&!sk.revAll)))pvpFail_('bad friend');const attack=['p','m','h','auto','status','debuff'].includes(sk.t);if(attack&&(!target||target.owner===seat||target.hp<=0))pvpFail_('bad target');let aim=target;if(attack&&!sk.all&&!sk.rt){const forced=foesOf(u).find(x=>x.hp>0&&x.taunt>0&&!class10Invisible(x));if(forced)aim=forced}if(!act(u,id,aim,friend))pvpFail_('invalid move')}
 r.players[seat].gold=S.P.gold;r.rev++;r.receipts.push({request,seat,actor:u.id,skill:id,target:target?.id||'',friend:friend?.id||'',at:Date.now()});r.receipts=r.receipts.slice(-20);r.last={actor:u.id,skill:id,seat};if(!takeFreeForm(u)&&!pvpCompleteTurn_(r))pvpNext_(r);pvpWrite_(r,row);
 // Room receipt is committed first; retries never apply a move twice.
 try{sheet_(PVP_CMD,PVP_CMD_HEAD).appendRow([r.id+'-'+request,r.id,r.rev,seat,u.id,id,text_(d.target,40),text_(d.friend,40),new Date()])}catch(e){}
 return pvpView_(r,seat)
 }catch(e){return {ok:false,error:e.message||String(e),pvpVersion:1}}}

function profileImage_(v){return ''}
function saveGame_(d){try{campFlush_();const old=JSON.parse(loadGameBase_(d).getContent());if(!old.ok&&old.error!=='notfound')return json_(old);const parsed=JSON.parse(d.data||'{}');if(!parsed.P)return json_({ok:false,error:'bad data'});const code=code_(d.code),c=campState_(code);if(old.ok&&!c.name){c.name=JSON.parse(old.data).P.name;campWrite_(c)}campAdjust_(parsed.P,c);worldApply(parsed.P,wbAccount_(code));stakeApply(parsed.P,stakeEvents_(code));carryNormalize_(parsed.P);parsed.P.profile=profileImage_(parsed.P.profile);const result=JSON.parse(saveGameBase_({...d,data:JSON.stringify(parsed),name:parsed.P.name}).getContent());return json_({...result,account:campAccount_(code)})}catch(e){return json_({ok:false,error:e.message||String(e)})}}
function loadGame_(d){const result=JSON.parse(loadGameBase_(d).getContent());if(!result.ok)return json_(result);campFlush_();const data=JSON.parse(result.data);campAdjust_(data.P,campState_(code_(d.code)));worldApply(data.P,wbAccount_(code_(d.code)));stakeApply(data.P,stakeEvents_(code_(d.code)));carryNormalize_(data.P);return json_({...result,data:JSON.stringify(data),account:campAccount_(code_(d.code))})}
/* Asynchronous camps: server runs every command; client never submits a victory. */
const CAMP_HEAD=['code','state'],CAMP_TRANS_HEAD=['id','from','to','gold','state'];
function campState_(code){const sh=sheet_('Camps',CAMP_HEAD),row=findRow_(sh,code);if(row>0)return JSON.parse(String(sh.getRange(row,2).getValue()));return {code,publicId:pvpId_().slice(0,16),delta:0,scoreDelta:0,pet:null,date:'',used:0,renameAt:0,receipts:[]}}
function campWrite_(c){const sh=sheet_('Camps',CAMP_HEAD),row=findRow_(sh,c.code),v=[c.code,JSON.stringify(c)];if(row>0)sh.getRange(row,1,1,2).setValues([v]);else sh.appendRow(v)}
function campDate_(){return new Date(Date.now()+7*3600000).toISOString().slice(0,10)}
function campRaw_(code){const sh=sheet_(SV_SHEET,SV_HEAD),row=findRow_(sh,code);if(row<0)pvpFail_('notfound');const v=sh.getRange(row,1,1,SV_HEAD.length).getValues()[0],chunks=v.slice(6).map(String);return JSON.parse(chunks[0].indexOf('SB64:')===0?Utilities.newBlob(Utilities.base64Decode(chunks.map(x=>x.slice(5)).join(''))).getDataAsString('UTF-8'):chunks.join(''))}
function campAdjust_(P,c){P.gold=(Number(P.gold)||0)+(c.delta-(Number(P.campApplied)||0));P.campApplied=c.delta;P.score=(Number(P.score)||0)+(c.scoreDelta-(Number(P.campScoreApplied)||0));P.campScoreApplied=c.scoreDelta;if(c.name)P.name=c.name;P.renameAt=c.renameAt||0;return P}
function campAccount_(code){const c=campState_(code);return {delta:c.delta,scoreDelta:c.scoreDelta,name:c.name||'',renameAt:c.renameAt||0,world:wbAccount_(code),stakes:stakeEvents_(code)}}
function campFlush_(){const sh=sheet_('CampTransfers',CAMP_TRANS_HEAD),values=sh.getDataRange().getValues();for(let i=1;i<values.length;i++){const [id,from,to,gold,state]=values[i];if(state==='done'||!id)continue;for(const [code,sign] of [[from,-1],[to,1]]){const c=campState_(code);if(!c.receipts.includes(id)){c.delta+=Number(gold)*sign;c.receipts.push(id);campWrite_(c)}}sh.getRange(i+1,5).setValues([['done']])}}
function campSettle_(r){if(!r.raid||r.status!=='finished')return;const sh=sheet_('CampTransfers',CAMP_TRANS_HEAD),id='raid-'+r.id;if(findRow_(sh,id)<0&&r.winner!==-1){const from=r.players[1-r.winner].code,to=r.players[r.winner].code,P=campAdjust_(campRaw_(from).P,campState_(from)),amount=Math.floor(Math.max(0,P.gold)*.20);sh.appendRow([id,from,to,amount,'pending'])}campFlush_();}
function campScore_(r){if(r.status!=='finished')return;for(let seat=0;seat<r.players.length;seat++){const c=campState_(r.players[seat].code),id='score-'+r.id+'-'+seat;if(c.receipts.includes(id))continue;const enemies=[...(seat===0?r.battle.enemies:r.battle.allies),...(r.battle.retiredUnits||[]).filter(u=>u.side===(seat===0?'enemy':'ally'))];c.scoreDelta+=enemies.filter(u=>u.hp<=0&&!u.temporary).reduce((n,u)=>n+scoreValue(u),0);c.receipts.push(id);campWrite_(c)}}
function campTeam_(raw,pet,seat){const p=JSON.parse(JSON.stringify(raw));if(!p.pets.some(x=>x.uid===pet))pvpFail_('choose one pet');p.party=[pet];p.carried=[pet];return pvpTeam_(p,seat)}
function campView_(r){campSettle_(r);campScore_(r);return {...pvpView_(r,0),camp:true,account:campAccount_(r.players[0].code)}}
function campAI_(r){for(let i=0;i<120&&r.status==='active';i++){const u=[...r.battle.allies,...r.battle.enemies].find(x=>x.id===r.battle.cur);if(!u)return;S={P:{gold:r.players[u.owner].gold},battle:r.battle};const foes=foesOf(u).filter(x=>x.hp>0),mates=sideOf(u).filter(x=>x.hp>0);let id='attack',target=foes.find(x=>x.taunt>0)||foes[0],friend=mates.slice().sort((a,b)=>a.hp/a.st.hp-b.hp/b.st.hp)[0];const legal=u.skills.filter(k=>SK[k]&&!cooldownOf(u,k)&&costOf(u,SK[k])<=u.mp&&!SK[k].summon);const healSkill=legal.find(k=>SK[k].t==='heal');const taunt=legal.find(k=>SK[k].taunt);if(friend&&friend.hp<friend.st.hp*.45&&healSkill)id=healSkill;else if(chooseAutoForm(u))id=chooseAutoForm(u);else if(class10AutoDefense(u))id=class10AutoDefense(u);else if(chooseAutoSummon(u))id=chooseAutoSummon(u);else if(taunt&&!u.taunt)id=taunt;else{const damage=legal.filter(k=>['p','m','h','auto'].includes(SK[k].t));damage.sort((a,b)=>combatSkillScore(u,b,target,foes)-combatSkillScore(u,a,target,foes));id=damage[0]||'attack'}const visibleMove=class10AutoMove(u,{id,target,friend});if(!act(u,visibleMove.id,visibleMove.target,visibleMove.friend))act(u,'rest',null,u);r.players[u.owner].gold=S.P.gold;r.rev++;if(!takeFreeForm(u)&&!pvpCompleteTurn_(r))pvpNext_(r)}if(r.status==='active'&&uById(r.battle.cur)?.owner===1)pvpFinish_(r,-1,'ขีดจำกัดการต่อสู้')}
function campDispatch_(d){try{campFlush_();const auth=pvpSaveAuth_(d),code=auth.code,P=auth.P,c=campState_(code);campAdjust_(P,c);if(P.lv<10&&d.action!=='camp_profile')pvpFail_('camp level 10');
 if(d.action==='camp_register'){const ids=campInputPets_(P,d.pets??d.pet);c.pets=ids;c.pet=ids[0];campWrite_(c);return {ok:true,account:campAccount_(code)}}
 if(d.action==='camp_profile'){if(d.name!=null){const name=String(d.name).trim().slice(0,20);if(!name)pvpFail_('bad name');if(c.renameAt&&Date.now()-c.renameAt<7*86400000)pvpFail_('rename weekly');c.name=name;c.renameAt=Date.now()}campWrite_(c);return {ok:true,account:campAccount_(code)}}
 if(d.action==='camp_list'){const today=campDate_();const values=sheet_('Camps',CAMP_HEAD).getDataRange().getValues().slice(1),camps=[];for(const v of values){const other=JSON.parse(v[1]);if(other.code===code||other.pet==null)continue;try{const target=campAdjust_(campRaw_(other.code).P,other);carryNormalize_(target);if(target.lv>=10&&campDefenseIds_(target,other).length)camps.push({id:other.publicId,cls:target.cls,level:target.lv,gold:target.gold})}catch(e){}}return {ok:true,camps,pet:c.pet,pets:campDefenseIds_(P,c),used:c.date===today?c.used:0,date:today,account:campAccount_(code)}}
 if(d.action==='camp_begin'){const request=String(d.request||'');if(!/^[A-Za-z0-9_-]{16,80}$/.test(request))pvpFail_('bad request');if(c.active){try{const old=pvpRead_(c.active);if(old.r.raid&&old.r.players[0].code===code){if(old.r.request===request||old.r.status==='active')return {...campView_(old.r),token:old.r.campToken}}}catch(e){}}
 requireDefense_(P,code);const rows=sheet_('Camps',CAMP_HEAD).getDataRange().getValues().slice(1),v=rows.find(x=>JSON.parse(x[1]).publicId===String(d.target)),other=v&&JSON.parse(v[1]);if(!other||other.code===code||other.pet==null)pvpFail_('bad camp');const target=campAdjust_(campRaw_(other.code).P,other),attackIds=campInputPets_(P,d.pets??d.pet),defenseIds=campDefenseIds_(target,other);if(!defenseIds.length)pvpFail_('bad camp');const a=campTeam_(P,attackIds,0),b=campTeam_(target,defenseIds,1),today=campDate_();if(c.date!==today){c.date=today;c.used=0}if(c.used>=3)pvpFail_('camp daily limit');const id=pvpId_().slice(0,8),token=pvpToken_(),r={id,raid:true,request,campToken:token,ruleVersion:2,status:'active',rev:1,expires:Date.now()+30*60000,deadline:0,winner:null,players:[{code,tokenHash:hash_(id,token),name:a.name,cls:a.cls,lv:a.lv,gold:a.gold},{code:other.code,name:b.name,cls:b.cls,lv:b.lv,gold:b.gold}],battle:{kind:'raid',allies:a.team,enemies:b.team,round:0,turns:0,queue:[],cur:null,log:['เริ่มจู่โจมค่าย'],fx:[],effects:[]},receipts:[]};pvpWrite_(r);c.used++;c.active=id;campWrite_(c);pvpNext_(r);campAI_(r);pvpWrite_(r,findRow_(sheet_(PVP_ROOM,PVP_HEAD),id));return {...campView_(r),token};}
 const {r,row}=pvpRead_(String(d.room||''));if(!r.raid||r.players[0].code!==code||r.campToken!==d.token)pvpFail_('unauthorized');if(r.status==='active'&&Date.now()>r.expires)pvpFinish_(r,1,'หมดเวลาจู่โจม');
 if(d.action==='camp_move'&&r.status==='active')pvpFail_('automatic only');
 if(false){const request=String(d.request||'');if(!/^[A-Za-z0-9_-]{16,80}$/.test(request))pvpFail_('bad request');if(!r.receipts.some(x=>x.request===request)){if(Number(d.rev)!==r.rev)pvpFail_('stale turn');if(d.item!=null||d.seal!=null||d.swap!=null)pvpFail_('items not allowed');S={P:{gold:r.players[0].gold},battle:r.battle};const u=uById(r.battle.cur),sk=SK[d.skill];if(!u||u.owner!==0||!sk||(!u.skills.includes(d.skill)&&d.skill!=='rest')||sk.summon)pvpFail_('illegal skill');const target=uById(String(d.target||'')),friend=uById(String(d.friend||''));if(target&&target.owner===0)pvpFail_('bad target');if(friend&&friend.owner!==0)pvpFail_('bad friend');if(!act(u,d.skill,target,friend))pvpFail_('invalid move');r.players[0].gold=S.P.gold;r.receipts.push({request,seat:0});r.rev++;if(!pvpCompleteTurn_(r))pvpNext_(r);campAI_(r)}}
 else if(d.action==='camp_leave'&&r.status==='active')pvpFinish_(r,1,'ผู้จู่โจมยอมแพ้');else if(!['camp_poll','camp_move'].includes(d.action))pvpFail_('bad action');pvpWrite_(r,row);return campView_(r);
 }catch(e){return {ok:false,error:e.message||String(e)}}}

function carryNormalize_(P){const pets=Array.isArray(P.pets)?P.pets:[],valid=new Set(pets.map(p=>p.uid)),cls=CLS[P.cls]?P.cls:'swordsman',cap=baseOf(cls)==='summoner'?8:5;const party=Array.isArray(P.party)?P.party:[];P.carried=[...new Set((Array.isArray(P.carried)?[...party.filter(id=>P.carried.includes(id)),...P.carried]:[...party,...pets.map(p=>p.uid)]).filter(id=>valid.has(id)))].slice(0,cap);P.party=[...new Set(party.filter(id=>P.carried.includes(id)))].slice(0,clsSum(cls));P.packVersion=1;return P}

/* World boss: authoritative rooms, immutable weekly tickets and reward ledger. */
const WB_ROOMS='WorldRooms',WB_HEAD=['room','status','updated','expires','data1','data2','data3','data4','data5'];
const WB_ENTRY_HEAD=['key','code','room','week'],WB_REWARD_HEAD=['key','code','room','reward'];
function wbWeek_(){const d=new Date(Date.now()+7*3600000);d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));return d.toISOString().slice(0,10);}
function wbAccount_(code){wbFlush_();const a={gold:0,score:0,xp:0,power:0,loot:{}};for(const row of sheet_('WorldRewards',WB_REWARD_HEAD).getDataRange().getValues().slice(1)){if(row[1]!==code)continue;const r=JSON.parse(row[3]);for(const k of ['gold','score','xp','power'])a[k]+=Number(r[k])||0;for(const [id,n] of Object.entries(r.loot||{}))a.loot[id]=(a.loot[id]||0)+n;}return a;}
function wbUsed_(code){return sheet_('WorldEntries',WB_ENTRY_HEAD).getDataRange().getValues().slice(1).filter(x=>x[1]===code&&x[3]===wbWeek_()).length;}
function wbDecode_(row){return JSON.parse(Utilities.newBlob(Utilities.base64Decode(row.slice(4).map(x=>String(x||'').replace(/^WB1:/,'')).join(''))).getDataAsString('UTF-8'));}
function wbRead_(id){if(!/^[A-F0-9]{8}$/.test(String(id)))pvpFail_('room not found');const sh=sheet_(WB_ROOMS,WB_HEAD),row=findRow_(sh,id);if(row<0)pvpFail_('room not found');return wbDecode_(sh.getRange(row,1,1,9).getValues()[0]);}
function wbWrite_(r){r.updated=Date.now();const data=Utilities.base64Encode(JSON.stringify(r),Utilities.Charset.UTF_8);if(data.length>(CHUNK-4)*5)pvpFail_('room too big');const vals=[r.id,r.status==='finished'&&!r.settled?'reward_pending':r.status,r.updated,r.expires,...Array.from({length:5},(_,i)=>'WB1:'+data.slice(i*(CHUNK-4),(i+1)*(CHUNK-4)))],sh=sheet_(WB_ROOMS,WB_HEAD),row=findRow_(sh,r.id);if(row>0)sh.getRange(row,1,1,9).setValues([vals]);else sh.appendRow(vals);}
function wbExisting_(code){for(const row of sheet_(WB_ROOMS,WB_HEAD).getDataRange().getValues().slice(1).reverse()){if(!['lobby','starting','active'].includes(row[1]))continue;const r=wbDecode_(row);if(r.status==='lobby'&&Date.now()>r.expires){r.status='cancelled';wbWrite_(r);continue;}if(r.players.some(p=>p.code===code))return r;}return null;}
function wbTeam_(raw,seat,pets){const ids=Array.isArray(pets)?pets.map(Number):[],max=baseOf(raw.cls)==='summoner'?3:1;if(!ids.length||ids.length>max||new Set(ids).size!==ids.length)pvpFail_('world pets');const p=JSON.parse(JSON.stringify(raw));carryNormalize_(p);if(ids.some(id=>!p.carried.includes(id)))pvpFail_('pet at camp');p.party=ids;const team=pvpTeam_(p,seat,'world').team;team.forEach(u=>{u.side='ally';u.skills.push('wb_guard');});return team;}
function wbPlayer_(auth,seat,pets){return {code:auth.code,name:String(auth.P.name||'ผู้ผนึก').slice(0,20),cls:auth.P.cls,lv:auth.P.lv,ready:false,forfeit:false,team:wbTeam_(auth.P,seat,pets),gold:10000};}
function wbBoss_(){const u=wildUnit('demonlord',60,0,'อาซารอธ · จักรพรรดิสุริยคราส');u.id='worldboss';u.owner=-1;u.immortalWorld=true;u.pas=[];u.skills=['wb_claw','wb_flame','wb_lance','wb_storm'];u.st.hp=u.hp=1000000000;u.st.mp=u.mp=1000000;return u;}
function wbStart_(r){if(r.status!=='starting'){if(r.status!=='lobby'||r.players.length<1||r.players.length>4||r.players.some(p=>!p.ready))pvpFail_('world ready');for(const p of r.players)if(wbUsed_(p.code)>=3)pvpFail_('world weekly limit');r.status='starting';r.startedWeek=wbWeek_();wbWrite_(r);}
 const sh=sheet_('WorldEntries',WB_ENTRY_HEAD);for(const p of r.players){const key=r.id+'-'+p.code;if(findRow_(sh,key)<0)sh.appendRow([key,p.code,r.id,r.startedWeek]);}
 r.battle={kind:'world',allies:r.players.flatMap(p=>p.team),enemies:[wbBoss_()],round:0,turns:0,bossTurns:0,queue:[],cur:null,damageTotal:0,damageBy:{},log:['เริ่มท้าทายอาซารอธ · บอสอมตะ'],fx:[],effects:[]};r.players.forEach(p=>delete p.team);r.status='active';r.rev++;r.deadline=0;wbNext_(r,Date.now());wbWrite_(r);}
function wbFinish_(r){if(r.status!=='active')return;r.status='finished';r.deadline=0;r.rev++;const score=Math.floor(r.battle.damageTotal/r.players.length/25);r.sharedScore=score;r.rewards=r.players.map(p=>p.forfeit?{gold:0,score:0,xp:0,power:0,loot:{},tier:0,chance:0}:balancePartyReward(r,score,Math.random(),Math.random()));blog('ทุกคนหมดสติ · จบการท้าทาย คะแนนต่อคน '+score);wbWrite_(r);wbSettle_(r);}
function wbFlush_(){for(const row of sheet_(WB_ROOMS,WB_HEAD).getDataRange().getValues().slice(1)){if(row[1]==='reward_pending')wbSettle_(wbDecode_(row));}}
function wbSettle_(r){if(r.status!=='finished'||!r.rewards||r.settled)return;const sh=sheet_('WorldRewards',WB_REWARD_HEAD);r.players.forEach((p,i)=>{const key=r.id+'-'+p.code;if(findRow_(sh,key)<0)sh.appendRow([key,p.code,r.id,JSON.stringify(r.rewards[i])]);});r.settled=true;wbWrite_(r);}
function wbBossTurn_(r){const b=r.battle;b.fx=[];b.effects=[];const u=b.enemies[0];b.bossTurns++;u.status={};u.dots=[];u.buffs=u.buffs.filter(x=>!x.st||x.amt>=0);u.hp=u.st.hp;u.mp=u.st.mp;const single=b.allies.some(x=>x.hp>0&&!class10Invisible(x))&&Math.random()<.75,id=single?['wb_claw','wb_flame','wb_lance'][Math.floor(Math.random()*3)]:'wb_storm',alive=b.allies.filter(x=>x.hp>0&&(!single||!class10Invisible(x))),taunt=alive.find(x=>x.taunt>0),target=taunt||alive[Math.floor(Math.random()*alive.length)];if(!target)return;blog('อาซารอธ · ตาที่ '+b.bossTurns+' · พลังโจมตี ×'+Math.pow(1.05,b.bossTurns-1).toFixed(2));act(u,id,target,u);for(const x of b.allies)x.taunt=0;b.turns++;}
function wbNext_(r,now){const b=r.battle;S={P:{gold:0},battle:b};for(let guard=0;guard<100;guard++){
 if(!b.allies.some(x=>x.hp>0)){wbFinish_(r);return;}
 if(!b.queue.length){b.round++;b.queue=[...b.allies.filter(x=>x.hp>0),...b.enemies.filter(x=>x.hp>0)].map(u=>[u.id,eff(u,'spd')*(.97+Math.random()*.06)]).sort((a,c)=>class10OpeningOrder(uById(a[0]),uById(c[0]),b)||c[1]-a[1]).map(x=>x[0]);}
 const u=uById(b.queue.shift());if(!u||u.hp<=0)continue;b.cur=u.id;b.extra=false;
 if(u.immortalWorld){wbBossTurn_(r);continue;} if(u.side==='enemy'){if(!turnStart(u)){const move=pvpAutoChoice_(u);act(u,move.id,move.target,move.friend);}b.turns++;replayFrame_(r);continue;}
 if(turnStart(u)){b.turns++;continue;}
 S.P.gold=r.players[u.owner].gold;
 if(u.charging){const c=u.charging;u.charging=null;const target=uById(c.tid);act(u,c.id,target&&target.hp>0?target:b.enemies[0],null,true);b.turns++;continue;}
 r.deadline=now+15000;return;
 }pvpFail_('world turn processing');}
function wbLegal_(u,id){return !!(SK[id]&&(u.skills.includes(id)||id==='rest'||id==='defend')&&!SK[id].summon&&!SK[id].seal&&!cooldownOf(u,id)&&costOf(u,SK[id])<=u.mp&&(!SK[id].gc||S.P.gold>=SK[id].gc*u.lv));}
function wbAuto_(u){const mates=sideOf(u).filter(x=>x.hp>0),friend=mates.slice().sort((a,b)=>a.hp/a.st.hp-b.hp/b.st.hp)[0],legal=[...new Set([...u.skills,'rest','defend'])].filter(id=>wbLegal_(u,id));let id=legal.find(id=>SK[id].t==='heal'&&(SK[id].tg==='self'?u.hp<u.st.hp*.4:friend&&friend.hp<friend.st.hp*.4)&&(!SK[id].rev||SK[id].pw));if(!id&&u.mp<u.st.mp*.15)id='rest';if(!id&&u.kind==='pet')id=legal.find(id=>SK[id].taunt&&!u.taunt);if(!id){const target=worldAttackTarget(B()),rate=id=>{const sk=SK[id],ty=sk.t==='auto'?u.atkType:sk.t,atk=ty==='m'?eff(u,'matk'):ty==='h'?(eff(u,'matk')+eff(u,'patk'))/2:eff(u,'patk'),def=sk.trueD?0:ty==='m'?eff(target,'mdef'):ty==='h'?(eff(target,'mdef')+eff(target,'pdef'))/2:eff(target,'pdef');return atk*atk/(atk+def)*(sk.pw||100)*(sk.hits||1)*typeMult(effectiveElement(u,sk),target.types)*(sk.all?.65:1)*(sk.ct?.55:1);},damage=legal.filter(id=>['p','m','h','auto'].includes(SK[id].t)).map(id=>({id,value:rate(id)})).sort((a,b)=>b.value-a.value),options=damage.filter(x=>x.value>0&&x.value>=damage[0].value*.7).slice(0,3);id=options.length?options[Math.floor(Math.random()*options.length)].id:'wb_guard';}return {id,friend:SK[id]?.tg==='self'?u.id:friend?friend.id:u.id};}
function wbMove_(r,id,friend,automatic){const b=r.battle;b.fx=[];b.effects=[];const acting=b.allies.find(x=>x.id===b.cur);if(!acting)pvpFail_('not your turn');S={P:{gold:r.players[acting.owner].gold},battle:b};const u=uById(b.cur);if(!u||u.owner<0)pvpFail_('not your turn');if(!wbLegal_(u,id))pvpFail_('illegal skill');const ally=uById(friend)||u;if(ally.side!=='ally')pvpFail_('bad target');if(!act(u,id,worldAttackTarget(b),ally))pvpFail_('illegal skill');if(takeFreeForm(u)){r.players[u.owner].gold=S.P.gold;r.rev++;return;}r.players[u.owner].gold=S.P.gold;b.turns++;r.rev++;blog((automatic?'⌛ อัตโนมัติ: ':'')+u.name+' จบตา');b.log=b.log.slice(-60);wbNext_(r,automatic?r.deadline:Date.now());}
function wbAdvance_(r,allowAuto=true){if(r.battle)S={P:{gold:0},battle:r.battle};if(r.status==='starting'){wbStart_(r);return;}for(let i=0;i<8&&r.status==='active'&&Date.now()>=r.deadline;i++){S={P:{gold:r.players[uById(r.battle.cur).owner].gold},battle:r.battle};const move=wbAuto_(uById(r.battle.cur));wbMove_(r,move.id,move.friend,true);}if(allowAuto&&r.status==='active'){const u=uById(r.battle.cur);if(u&&r.players[u.owner]?.auto){S={P:{gold:r.players[u.owner].gold},battle:r.battle};const move=wbAuto_(u);wbMove_(r,move.id,move.friend,false);}}if(r.status==='finished')wbSettle_(r);}
function wbView_(r,code){const seat=r.players.findIndex(p=>p.code===code);if(seat<0)pvpFail_('unauthorized');return {ok:true,worldVersion:1,worldAccount:wbAccount_(code),used:wbUsed_(code),week:wbWeek_(),room:{id:r.id,status:r.status,rev:r.rev,me:seat,host:r.host,serverTime:Date.now(),deadline:r.deadline,players:r.players.map(p=>({name:p.name,cls:p.cls,lv:p.lv,ready:p.ready,forfeit:p.forfeit,auto:!!p.auto})),battle:r.battle||null,sharedScore:r.sharedScore||0,reward:r.rewards&&r.rewards[seat]||null}};}
function wbDispatch_(d){try{const auth=pvpSaveAuth_(d),code=auth.code;if(d.item!=null||d.useItem!=null||d.seal!=null||d.swap!=null)pvpFail_('items not allowed');
 if(d.action==='wb_status'){const old=wbExisting_(code);return old?(onlineRefreshWorld_(old),wbView_(old,code)):{ok:true,worldVersion:1,used:wbUsed_(code),week:wbWeek_(),worldAccount:wbAccount_(code)};}
 if(d.action==='wb_create'||d.action==='wb_join'){
  const old=wbExisting_(code);if(old)return wbView_(old,code);if(wbUsed_(code)>=3)pvpFail_('world weekly limit');
  let r;if(d.action==='wb_create'){let id=pvpId_().slice(0,8);if(findRow_(sheet_(WB_ROOMS,WB_HEAD),id)>0)pvpFail_('try again');r={id,status:'lobby',host:0,rev:1,expires:Date.now()+20*60000,players:[],receipts:[]};}else{r=wbRead_(String(d.room||'').toUpperCase());if(r.status!=='lobby'||Date.now()>r.expires)pvpFail_('not lobby');if(r.players.length>=4)pvpFail_('room full');}
  r.players.push(wbPlayer_(auth,r.players.length,d.pets));r.players.forEach(p=>p.ready=false);r.rev++;wbWrite_(r);return wbView_(r,code);
 }
 const r=wbRead_(String(d.room||'').toUpperCase()),seat=r.players.findIndex(p=>p.code===code);if(seat<0)pvpFail_('unauthorized');
 if(d.action==='wb_move'||(d.action==='wb_auto'&&d.enabled===false))pvpFail_('automatic only');
 if(d.action==='wb_move'&&r.receipts.some(x=>x===d.request))return wbView_(r,code);
 if(d.action==='wb_poll'&&r.status==='lobby'&&Date.now()<=r.expires)return wbView_(r,code);wbAdvance_(r,d.action==='wb_poll');wbWrite_(r);
 if(d.action==='wb_auto'){if(typeof d.enabled!=='boolean')pvpFail_('bad action');r.players[seat].auto=d.enabled;r.rev++;}
 else if(d.action==='wb_ready'){if(r.status!=='lobby')pvpFail_('not lobby');r.players[seat].ready=true;r.rev++;}
 else if(d.action==='wb_start'){if(seat!==r.host)pvpFail_('unauthorized');if(r.status==='lobby'||r.status==='starting')wbStart_(r);else if(r.status!=='active'&&r.status!=='finished')pvpFail_('not active');}
 else if(d.action==='wb_move'){
  if(r.status!=='active')return (wbWrite_(r),wbView_(r,code));if(Number(d.rev)!==r.rev||Date.now()>=r.deadline)return (wbWrite_(r),wbView_(r,code));if(uById(r.battle.cur).owner!==seat)pvpFail_('not your turn');if(!/^[A-Za-z0-9-]{12,80}$/.test(String(d.request||'')))pvpFail_('bad request');wbMove_(r,String(d.skill),String(d.friend||''),false);r.receipts.push(String(d.request));
 }
 else if(d.action==='wb_leave'){
  if(r.status==='lobby'){r.players.splice(seat,1);r.players.forEach((p,i)=>{p.ready=false;p.team.forEach((u,j)=>{u.owner=i;u.id='p'+i+(j?'pet'+(j-1):'');});});r.host=0;r.rev++;if(!r.players.length)r.status='cancelled';wbWrite_(r);return {ok:true,left:true,worldAccount:wbAccount_(code),used:wbUsed_(code)};}
  if(r.status==='active'){r.players[seat].forfeit=true;r.battle.allies.filter(u=>u.owner===seat).forEach(u=>u.hp=0);S={P:{gold:0},battle:r.battle};if(!r.battle.allies.some(u=>u.hp>0))wbFinish_(r);else if(uById(r.battle.cur)?.owner===seat)wbNext_(r,Date.now());r.rev++;}
 }
 else if(d.action!=='wb_poll')pvpFail_('bad action');wbWrite_(r);if(r.status==='finished')wbSettle_(r);return wbView_(r,code);
 }catch(e){return {ok:false,error:e.message||String(e),worldVersion:1};}}

/* Optional PvP stakes: one atomic ledger row per room, immutable inventory events. */
const STAKE_HEAD=['room','ledger'];
function stakeRead_(id){const sh=sheet_('PvpWagers',STAKE_HEAD),row=findRow_(sh,id);return row<0?{id,rev:0,offers:[null,null],events:[],requests:[],settled:false}:JSON.parse(sh.getRange(row,2).getValues()[0][0]);}
function stakeWrite_(x){const data=JSON.stringify(x);if(data.length>44000)pvpFail_('stake history full');const sh=sheet_('PvpWagers',STAKE_HEAD),row=findRow_(sh,x.id);if(row<0)sh.appendRow([x.id,data]);else sh.getRange(row,1,1,2).setValues([[x.id,data]]);}
function stakeSettle_(r){if(r.raid||r.status!=='finished')return;const x=stakeRead_(r.id);if(x.settled)return;for(let i=0;i<2;i++){const offer=x.offers[i];if(!offer)continue;const to=r.winner===0||r.winner===1?r.winner:i,asset=JSON.parse(JSON.stringify(offer));if(asset.type==='pet'&&to!==i)asset.pet.uid=Number(''+Date.now().toString().slice(-10)+i);x.events.push({id:r.id+'-settle-'+i,code:r.players[to].code,sign:1,asset});}x.settled=true;x.result={winner:r.winner,reason:r.reason};stakeWrite_(x);}
function stakeEvents_(code){const out=[];for(const row of sheet_('PvpWagers',STAKE_HEAD).getDataRange().getValues().slice(1)){let x=JSON.parse(row[1]);if(!x.settled){const sh=sheet_(PVP_ROOM,PVP_HEAD),n=findRow_(sh,x.id);if(n>0){const {r}=pvpRead_(x.id);if(r.status!=='finished'&&Date.now()>r.expires)pvpFinish_(r,-1,'ห้องหมดอายุ · คืนของเดิมพัน');if(r.status==='finished'){stakeSettle_(r);x=stakeRead_(x.id);}}}out.push(...x.events.filter(e=>e.code===code));}return out;}
function stakeApply(P,events){P.stakeApplied=Array.isArray(P.stakeApplied)?P.stakeApplied:[];P.items=P.items||{};P.owned=P.owned||[];P.pets=P.pets||[];for(const e of events||[]){if(P.stakeApplied.includes(e.id))continue;const a=e.asset;if(a.type==='gold')P.gold=(Number(P.gold)||0)+e.sign*a.qty;else if(a.type==='item')P.items[a.key]=Math.max(0,(P.items[a.key]||0)+e.sign*a.qty);else if(a.type==='gear'){if(e.sign<0){const i=P.owned.indexOf(a.key);if(i>=0)P.owned.splice(i,1)}else P.owned.push(a.key)}else if(a.type==='pet'){if(e.sign<0){P.pets=P.pets.filter(p=>p.uid!==a.pet.uid);P.party=(P.party||[]).filter(id=>id!==a.pet.uid);P.carried=(P.carried||[]).filter(id=>id!==a.pet.uid)}else{const pet=JSON.parse(JSON.stringify(a.pet));if(P.pets.some(p=>p.uid===pet.uid))pet.uid=Number(''+Date.now().toString().slice(-10)+'9');P.pets.push(pet);P.seen=P.seen||{};P.caught=P.caught||{};P.seen[pet.sp]=1;P.caught[pet.sp]=1;}}P.stakeApplied.push(e.id)}return P;}
function stakeOffer_(r,seat,d){if(r.status!=='lobby')pvpFail_('not lobby');if(typeof d.request!=='string'||!/^[A-Za-z0-9_-]{16,80}$/.test(d.request))pvpFail_('bad request');const x=stakeRead_(r.id);if(x.requests.includes(d.request))return;if(x.settled||x.rev>=60)pvpFail_('stake history full');if(Number(d.wagerRev)!==x.rev)pvpFail_('stake changed');const code=r.players[seat].code,P=campRaw_(code).P;campAdjust_(P,campState_(code));worldApply(P,wbAccount_(code));stakeApply(P,stakeEvents_(code));
 // Refund the previous escrow in this candidate before validating a replacement.
 const previous=x.offers[seat],refund=previous?{id:r.id+'-refund-'+(x.rev+1),code,sign:1,asset:previous}:null;if(refund)stakeApply(P,[refund]);
 const t=String(d.type||'none');let asset=null;if(t==='gold'){const qty=Number(d.qty);if(!Number.isInteger(qty)||qty<1||qty>Math.max(0,P.gold))pvpFail_('stake unavailable');asset={type:t,qty,label:qty+' เหรียญ'};}else if(t==='item'){const key=String(d.key||''),qty=Number(d.qty);if(!pvpOwn_(CON,key)||!Number.isInteger(qty)||qty<1||qty>(P.items[key]||0))pvpFail_('stake unavailable');asset={type:t,key,qty,label:CON[key].n+' ×'+qty};}else if(t==='gear'){const key=String(d.key||'');if(!pvpOwn_(EQ,key)||!P.owned.includes(key))pvpFail_('stake unavailable');asset={type:t,key,qty:1,label:EQ[key].n};}else if(t==='pet'){const uid=Number(d.key),pet=P.pets.find(p=>p.uid===uid),camp=campState_(code);if(!pet||(P.carried||[]).includes(uid)||camp.pet===uid||!SP[pet.sp]||SP[pet.sp].noseal)pvpFail_('stake pet must rest');asset={type:t,pet:JSON.parse(JSON.stringify(pet)),qty:1,label:formName(pet.sp,pet.form||0)+' Lv '+pet.lv};}else if(t!=='none')pvpFail_('bad stake');
 if(asset&&x.offers[1-seat]&&!wagersMatch(asset,x.offers[1-seat]))pvpFail_('stake rarity mismatch');const next=JSON.parse(JSON.stringify(x));next.rev++;next.requests.push(d.request);if(refund)next.events.push(refund);if(asset)next.events.push({id:r.id+'-escrow-'+next.rev+'-'+seat,code,sign:-1,asset});next.offers[seat]=asset;stakeWrite_(next);r.players.forEach(p=>{p.ready=false;p.wagerConfirmed=-1});r.rev++;}
function stakeView_(r){const x=stakeRead_(r.id);return {rev:x.rev,settled:x.settled,offers:x.offers.map(a=>a?{type:a.type,label:a.label,qty:a.qty,key:a.key||'',pet:a.pet?{sp:a.pet.sp,lv:a.pet.lv,form:a.pet.form||0}:null}:null),result:x.result||null};}
function stakeSyncReady_(r){const v=stakeRead_(r.id).rev;for(const p of r.players)if(p.wagerConfirmed!==v)p.ready=false;return v;}


function replayInit_(r){if(!r.replay){r.replay={initial:JSON.parse(JSON.stringify(r.battle)),frames:[]};r._replayUnits={};}replayFrame_(r);}
function replayFrame_(r){if(!r.replay)return;const b=r.battle,units=[...b.allies,...b.enemies],changed=[];r._replayUnits=r._replayUnits||{};for(const u of units){const v=[u.hp,u.mp,u.status,u.taunt||0];const key=JSON.stringify(v);if(r._replayUnits[u.id]!==key){changed.push([u.id,...JSON.parse(key)]);r._replayUnits[u.id]=key;}}r.replay.frames.push({cur:b.cur,round:b.round,turns:b.turns,bossTurns:b.bossTurns,damageTotal:b.damageTotal,damageBy:b.damageBy?JSON.parse(JSON.stringify(b.damageBy)):null,units:changed,log:b.log.slice(-3),effects:JSON.parse(JSON.stringify((b.effects||[]).slice(-8)))});}
const replayCampNext_=pvpNext_;pvpNext_=function(r){replayCampNext_(r);if(r.raid)replayFrame_(r);};
const replayCampAI_=campAI_;campAI_=function(r){if(r.status==='active')replayInit_(r);replayCampAI_(r);replayFrame_(r);delete r._replayUnits;};
const replayCampView_=campView_;campView_=function(r){if(r.status==='active'){campAI_(r);pvpWrite_(r,findRow_(sheet_(PVP_ROOM,PVP_HEAD),r.id));}const res=replayCampView_(r);res.room.replay=r.replay;return res;};
wbAdvance_=function(r){if(r.status==='starting'){wbStart_(r);return;}if(r.status==='active'){replayInit_(r);for(let i=0;i<1500&&r.status==='active';i++){S={P:{gold:0},battle:r.battle};const u=uById(r.battle.cur);if(!u)break;S.P.gold=r.players[u.owner].gold;const move=wbAuto_(u);wbMove_(r,move.id,move.friend,false);replayFrame_(r);}delete r._replayUnits;}if(r.status==='finished')wbSettle_(r);};
const replayWbStart_=wbStart_;wbStart_=function(r){replayWbStart_(r);if(r.status==='active')wbAdvance_(r);};
const replayWbView_=wbView_;wbView_=function(r,code){const res=replayWbView_(r,code);res.room.replay=r.replay;res.room.autoOnly=true;return res;};

// If both duelists choose auto, compute once and play the signed-in server result locally.
const replayPvpStep_=pvpAutoStep_;pvpAutoStep_=function(r,timeout=false){if(!r.raid&&r.status==='active'&&r.players.length===2&&r.players.every(p=>p.auto)){replayInit_(r);for(let i=0;i<35&&r.status==='active';i++){if(!replayPvpStep_(r,false))break;replayFrame_(r);}delete r._replayUnits;return true;}return replayPvpStep_(r,timeout);};
const replayPvpView_=pvpView_;pvpView_=function(r,seat){const res=replayPvpView_(r,seat);res.room.replay=r.replay;return res;};

const GACHA_RATES=[["item",2000],["premium",1000],["beast",1990],["gear",2000],["craft",1500],["legendGear",950],["eclipseGear",50],["rare",400],["legendBeast",30],["solarBeast",10],["eternal",70]];
CON.eternalSeal={n:'ผนึกนิรันดร์',d:'ผนึกสำเร็จ100%กับอสูรที่จับได้ ไม่ใช้กับบอสที่ผนึกไม่ได้หรือในPVP',price:0,seal:Infinity,rareLoot:true};
function gachaCategory(roll,rarePity,legendPity){if(legendPity>=99)return roll<.5?'eclipseGear':'legendBeast';if(rarePity>=9)return roll<30/430?'legendBeast':'rare';let at=0;for(const [key,weight]of GACHA_RATES){at+=weight;if(roll*10000<at)return key;}return 'eternal';}
function gachaPools(){const items=Object.keys(CON).filter(k=>!CON[k].rareLoot&&CON[k].price>=100),gear=Object.keys(EQ);return {item:items.filter(k=>CON[k].price<1000),premium:items.filter(k=>CON[k].price>=1000),beast:Object.keys(SP).filter(k=>!SP[k].noseal&&!SP[k].rare&&!SP[k].legendary),gear:gear.filter(k=>!EQ[k].legend&&!EQ[k].craft&&!EQ[k].special),craft:gear.filter(k=>EQ[k].craft),legendGear:gear.filter(k=>EQ[k].legend&&!EQ[k].worldLegend),eclipseGear:gear.filter(k=>EQ[k].worldLegend),rare:Object.keys(SP).filter(k=>SP[k].rare&&!SP[k].legendary&&!SP[k].solar&&!SP[k].noseal),legendBeast:Object.keys(SP).filter(k=>SP[k].legendary&&!SP[k].noseal),solarBeast:Object.keys(SP).filter(k=>SP[k].solar&&!SP[k].noseal),eternal:['eternalSeal']};}
function gachaGrant(P,rewards){P.items=P.items||{};P.owned=P.owned||[];P.pets=P.pets||[];P.gachaLegendPets=P.gachaLegendPets||{};for(const r of rewards){if(r.type==='item')P.items[r.key]=(P.items[r.key]||0)+1;else if(r.type==='gear'){P.owned.push(r.key);if(EQ[r.key].legend){P.legend=P.legend||{};P.legend[r.key]=1;}}else{const pet=JSON.parse(JSON.stringify(r.pet));if(P.pets.some(p=>p.uid===pet.uid))throw Error('pet uid collision');P.pets.push(pet);P.seen=P.seen||{};P.caught=P.caught||{};P.seen[pet.sp]=1;P.caught[pet.sp]=1;if(SP[pet.sp].legendary)P.gachaLegendPets[pet.uid]=pet.sp;}}return P;}

/* Coupons are server-owned. Only spreadsheet editors may edit balances or bans. */
const COMMUNITY_COUPONS=['code','name','coupons','totalDraws','rarePity','legendPity','updated','banned','reason','revision','creditCursor','bossClears','leaderboardId'];
const COMMUNITY_DIRECTORY=['publicId','code','name','level','class','avatar','lastSave','gender'];
const COMMUNITY_LEDGER=['request','code','data','status'];
const COMMUNITY_CREDITS=['key','code','amount','source','created'];
const COMMUNITY_FRIENDS=['key','owner','friend','created'];
const COMMUNITY_INVITES=['id','from','to','status','created','expires','data'];
function communityCoupon_(code,P){const sh=sheet_('Coupons',COMMUNITY_COUPONS),row=findRow_(sh,code);if(row>0){const a=sh.getRange(row,1,1,13).getValues()[0];return {code,name:String(a[1]||''),coupons:num_(a[2],1e9),totalDraws:num_(a[3],1e9),rarePity:num_(a[4],9),legendPity:num_(a[5],99),updated:a[6],banned:a[7]===true||/^(true|1|yes|banned)$/i.test(String(a[7])),reason:String(a[8]||''),revision:num_(a[9],1e9),creditCursor:num_(a[10],1e9),bossClears:num_(a[11],1e9),leaderboardId:String(a[12]||'')};}const c={code,name:P?.name||'',coupons:0,totalDraws:0,rarePity:0,legendPity:0,banned:false,reason:'',revision:0,creditCursor:0,bossClears:num_(P?.cleared,1e9),leaderboardId:String(P?.pid||'')};communityWriteCoupon_(c);return c;}
function communityWriteCoupon_(c){const sh=sheet_('Coupons',COMMUNITY_COUPONS),row=findRow_(sh,c.code),v=[c.code,text_(c.name,20),c.coupons,c.totalDraws,c.rarePity,c.legendPity,Date.now(),c.banned,c.reason,c.revision,c.creditCursor,c.bossClears,c.leaderboardId||''];if(row>0)sh.getRange(row,1,1,v.length).setValues([v]);else sh.appendRow(v);}
function communityAllowed_(code){if(!code)return;const sh=sheet_('Coupons',COMMUNITY_COUPONS),row=findRow_(sh,code);if(row>0){const v=sh.getRange(row,8).getValue();if(v===true||/^(true|1|yes|banned)$/i.test(String(v)))pvpFail_('account banned');}}
function communityDirectory_(code,P){const sh=sheet_('PlayerDirectory',COMMUNITY_DIRECTORY),rows=sh.getDataRange().getValues().slice(1),i=rows.findIndex(r=>r[1]===code),id=i<0?pvpId_().slice(0,16):rows[i][0],v=[id,code,text_(P.name,20),num_(P.lv,60),CLS[P.cls]?P.cls:'swordsman',profileImage_(P.profile),Date.now(),['male','female'].includes(P.gender)?P.gender:''];if(i<0)sh.appendRow(v);else sh.getRange(i+2,1,1,v.length).setValues([v]);return id;}
function communityProfiles_(){const now=Date.now();return sheet_('PlayerDirectory',COMMUNITY_DIRECTORY).getDataRange().getValues().slice(1).filter(r=>r[0]).map(r=>({id:String(r[0]),code:String(r[1]),name:String(r[2]).replace(/^'/,''),lv:Number(r[3])||1,cls:String(r[4]),avatar:profileImage_(r[5]),gender:['male','female'].includes(r[7])?r[7]:undefined,lastSave:Number(r[6])||0,online:now-Number(r[6])<300000})).map(p=>{try{communityAllowed_(p.code);return p;}catch(e){return {...p,online:false,banned:true};}});}
function communityPublic_(p){if(!p)return null;const {code,...pub}=p;return pub;}
function communityCredit_(code,key,source,amount){const sh=sheet_('CouponCredits',COMMUNITY_CREDITS);if(findRow_(sh,key)<0)sh.appendRow([key,code,amount,source,Date.now()]);}

function demonRewardCategory(roll){if(roll<.30)return 'seal';if(roll<.42)return 'legendGear';if(roll<.52)return 'coupon';if(roll<.65)return 'rare';return 'growth';}
function demonRewardFor_(code,clear){const category=demonRewardCategory(Math.random());if(category==='coupon')return {clear,category,coupon:1,rewards:[]};if(category==='seal')return {clear,category,coupon:0,rewards:[{type:'item',category:'eternal',key:'godSeal'}]};if(category==='growth')return {clear,category,coupon:0,rewards:Array.from({length:5},()=>({type:'item',category:'premium',key:'petExp3'}))};const pools=gachaPools(),pool=pools[category],key=pool[Math.floor(Math.random()*pool.length)];if(!key)pvpFail_('empty demon reward pool');if(category==='legendGear')return {clear,category,coupon:0,rewards:[{type:'gear',category,key}]};const pet={uid:Number(''+Date.now().toString().slice(-9)+String(clear).padStart(6,'0').slice(-6)),sp:key,lv:1,form:0,exp:0,pts:{},free:0,hp:1,mp:1},st=calcPet(pet);pet.hp=st.hp;pet.mp=st.mp;return {clear,category,coupon:0,rewards:[{type:'pet',category,key,pet}]};}

function stageSevenSyncRewards_(code,P){const repeats=Math.max(0,num_(P.forestClears?.[8],1e9)-1),last=num_(P.stageSevenRewardRevision,1e9);if(repeats-last>100)pvpFail_('stage7 clear count jump');let changed=false;for(let n=last+1;n<=repeats;n++){const receipt={...demonRewardFor_(code,n),stage:7,battleClear:n+1};for(const r of receipt.rewards)if(r.pet)r.pet.uid=Number(String(Date.now()).slice(-8)+'7'+String(n).padStart(6,'0'));gachaGrant(P,receipt.rewards);P.stageSevenRewardRevision=n;P.stageSevenRewardHistory=[...(P.stageSevenRewardHistory||[]),receipt].slice(-100);communityCredit_(code,'stage7-'+code+'-'+n,'stage7',receipt.coupon);changed=true;}return changed;}
function communitySyncCredits_(code){let c=communityCoupon_(code);const onlineBefore=JSON.stringify({...c,updated:undefined});const raw=campRaw_(code),P=raw.P,clears=num_(P.cleared,1e9);let bossChanged=false;if(clears-c.bossClears>100)pvpFail_('clear count jump');for(let n=c.bossClears+1;n<=clears;n++){const receipt=demonRewardFor_(code,n);gachaGrant(P,receipt.rewards);P.demonRewardRevision=n;P.demonRewardHistory=[...(P.demonRewardHistory||[]),receipt].slice(-100);communityCredit_(code,'boss-'+code+'-'+n,'demonlord',receipt.coupon);bossChanged=true;}if(stageSevenSyncRewards_(code,P))bossChanged=true;if(bossChanged)communityRawWrite_(code,raw);c.bossClears=Math.max(c.bossClears,clears);for(const row of sheet_('WorldRewards',WB_REWARD_HEAD).getDataRange().getValues().slice(1)){if(row[1]===code){const reward=JSON.parse(row[3]);if(reward.coupon!=null)communityCredit_(code,'world-'+row[0],'world',reward.coupon);}}const credits=sheet_('CouponCredits',COMMUNITY_CREDITS).getDataRange().getValues();for(let i=c.creditCursor+1;i<credits.length;i++)if(credits[i][1]===code)c.coupons+=num_(credits[i][2],1);c.creditCursor=Math.max(c.creditCursor,credits.length-1);c.name=P.name;c.leaderboardId=String(P.pid||c.leaderboardId||'');if(JSON.stringify({...c,updated:undefined})!==onlineBefore)communityWriteCoupon_(c);return c;}
function communityRawWrite_(code,data){const sh=sheet_(SV_SHEET,SV_HEAD),row=findRow_(sh,code);if(row<0)pvpFail_('notfound');const size=CHUNK-5,encoded=Utilities.base64Encode(JSON.stringify(data),Utilities.Charset.UTF_8);if(encoded.length>size*5)pvpFail_('too big');sh.getRange(row,3,1,9).setValues([[text_(data.P.name,20),text_(CLS[data.P.cls]?.n||'',30),num_(data.P.lv,60),new Date(),...Array.from({length:5},(_,i)=>'SB64:'+encoded.slice(i*size,(i+1)*size))]]);}
function communityFlush_(code){const sh=sheet_('GachaTransactions',COMMUNITY_LEDGER),rows=sh.getDataRange().getValues();for(let i=1;i<rows.length;i++){if(rows[i][1]!==code||rows[i][3]==='done')continue;const tx=JSON.parse(rows[i][2]),raw=campRaw_(code),c=communityCoupon_(code);if(num_(raw.P.gachaRevision,1e9)<tx.revision){if(num_(raw.P.gachaRevision,1e9)!==tx.revision-1)pvpFail_('gacha recovery');gachaGrant(raw.P,tx.rewards);raw.P.gachaRevision=tx.revision;communityRawWrite_(code,raw);}if(c.revision<tx.revision){c.coupons=Math.max(0,c.coupons-tx.count);c.totalDraws=tx.totalDraws;c.rarePity=tx.rarePity;c.legendPity=tx.legendPity;c.revision=tx.revision;communityWriteCoupon_(c);}sh.getRange(i+1,4).setValues([['done']]);}}
function communityGacha_(d){communityAllowed_(code_(d.code));const auth=pvpSaveAuth_(d),code=auth.code;communityFlush_(code);const sh=sheet_('GachaTransactions',COMMUNITY_LEDGER);if(d.action==='gacha_draw'){const request=String(d.request||'');if(!/^[A-Za-z0-9_-]{16,80}$/.test(request))pvpFail_('bad request');const old=findRow_(sh,request);if(old>0&&sh.getRange(old,2).getValue()!==code)pvpFail_('bad request');if(old>0){const tx=JSON.parse(sh.getRange(old,3).getValue());return communityGachaView_(code,tx.rewards);}if(d.gachaRulesVersion!==3)pvpFail_('gacha update required');const count=Number(d.count);if(![1,10].includes(count))pvpFail_('bad count');if(pvpFindActive_(code)||wbExisting_(code))pvpFail_('finish other battle');const c=communitySyncCredits_(code);if(c.coupons<count)pvpFail_('not enough coupons');const pools=gachaPools(),rewards=[];let rp=Math.min(9,c.rarePity),lp=gachaCombinedPity_(code),sp=gachaSolarPity_(code);for(let i=0;i<count;i++){const category=gachaCategory(Math.random(),rp,lp),pool=pools[category];if(!pool.length)pvpFail_('empty pool');const key=balanceGachaKey(category,pool),r={category,key,type:['beast','rare','legendBeast','solarBeast'].includes(category)?'pet':['gear','craft','legendGear','eclipseGear'].includes(category)?'gear':'item'};if(r.type==='pet'){const uid=Number(''+Date.now().toString().slice(-9)+String(c.totalDraws+i+1).padStart(6,'0').slice(-6)),pet={uid,sp:key,lv:1,form:0,exp:0,pts:{},free:0,hp:1,mp:1};const st=calcPet(pet);pet.hp=st.hp;pet.mp=st.mp;r.pet=pet;}rewards.push(r);const high=category==='legendBeast'||category==='eclipseGear';rp=['rare','legendBeast','eclipseGear','solarBeast'].includes(category)?0:Math.min(9,rp+1);lp=high?0:lp+1;sp=category==='solarBeast'?0:sp+1;if(sp>=300){rewards.push(gachaSolarBonus_(pools.solarBeast,c.totalDraws+i+1));sp=0;rp=0;}}const tx={revision:c.revision+1,count,totalDraws:c.totalDraws+count,rarePity:rp,legendPity:lp,gachaPityVersion:3,solarPity:sp,solarPityVersion:1,rewards};const json=JSON.stringify(tx);if(json.length>44000)pvpFail_('too big');const candidate=campRaw_(code);gachaGrant(candidate.P,rewards);candidate.P.gachaRevision=tx.revision;if(Utilities.base64Encode(JSON.stringify(candidate),Utilities.Charset.UTF_8).length>(CHUNK-5)*5)pvpFail_('save inventory full');sh.appendRow([request,code,json,'pending']);communityFlush_(code);return communityGachaView_(code,rewards);}return communityGachaView_(code,[]);}
function communityLoadInternal_(code){communityAllowed_(code);const raw=campRaw_(code);campAdjust_(raw.P,campState_(code));worldApply(raw.P,wbAccount_(code));stakeApply(raw.P,stakeEvents_(code));return raw;}
function communityGachaView_(code,rewards){const c=communitySyncCredits_(code);return {ok:true,communityVersion:1,rarityVersion:1,coupons:c.coupons,totalDraws:c.totalDraws,rarePity:c.rarePity,legendPity:c.legendPity,rewards,data:JSON.stringify(communityLoadInternal_(code))};}
function communityFriendRows_(code){return sheet_('Friends',COMMUNITY_FRIENDS).getDataRange().getValues().slice(1).filter(r=>r[1]===code);}
function communityInviteRows_(){return sheet_('FriendChallenges',COMMUNITY_INVITES).getDataRange().getValues();}
function communitySocial_(d){const auth=pvpSaveAuth_(d),code=auth.code,profiles=communityProfiles_(),me=profiles.find(p=>p.code===code);if(!me)pvpFail_('save first');const target=profiles.find(p=>p.id===String(d.target));const sh=sheet_('Friends',COMMUNITY_FRIENDS),friendRows=communityFriendRows_(code),friends=friendRows.map(r=>profiles.find(p=>p.code===r[2])).filter(Boolean);if(d.action==='friend_add'){if(!target||target.banned||target.code===code)pvpFail_('bad friend');if(!friends.some(p=>p.code===target.code)){if(friendRows.length>=30)pvpFail_('friends full');sh.appendRow([code+'-'+target.id,code,target.code,Date.now()]);}}
 else if(d.action==='friend_remove'){if(!target)pvpFail_('bad friend');const row=findRow_(sh,code+'-'+target.id);if(row>0)sh.deleteRow(row);const invites=sheet_('FriendChallenges',COMMUNITY_INVITES),pending=invites.getDataRange().getValues();for(let i=1;i<pending.length;i++)if(pending[i][3]==='pending'&&((pending[i][1]===code&&pending[i][2]===target.code)||(pending[i][2]===code&&pending[i][1]===target.code)))invites.getRange(i+1,4).setValues([['cancelled']]);}
 else if(d.action==='friend_challenge'){if(!target||!friends.some(p=>p.id===target.id))pvpFail_('friend required');if(!me.online||!target.online)pvpFail_('friend offline');if(pvpFindActive_(code)||pvpFindActive_(target.code)||wbExisting_(code)||wbExisting_(target.code))pvpFail_('finish other battle');const rows=communityInviteRows_(),now=Date.now();if(rows.slice(1).some(r=>r[1]===code&&now-Number(r[4])<30000))pvpFail_('challenge cooldown');if(rows.slice(1).some(r=>r[3]==='pending'&&Number(r[5])>now&&(r[2]===target.code||r[1]===code)))pvpFail_('challenge pending');sheet_('FriendChallenges',COMMUNITY_INVITES).appendRow([pvpId_(),code,target.code,'pending',now,now+60000,'{}']);}
 else if(['friend_accept','friend_decline'].includes(d.action)){const invites=sheet_('FriendChallenges',COMMUNITY_INVITES),row=findRow_(invites,String(d.invite||''));if(row<0)pvpFail_('challenge expired');const v=invites.getRange(row,1,1,7).getValues()[0];if(v[2]!==code)pvpFail_('unauthorized');if(v[3]==='accepted'&&d.action==='friend_accept')return communitySocialView_(code);if(v[3]!=='pending'||Number(v[5])<Date.now())pvpFail_('challenge expired');if(d.action==='friend_decline')invites.getRange(row,4).setValues([['declined']]);else{const from=profiles.find(p=>p.code===v[1]);if(!from?.online||!me.online)pvpFail_('friend offline');const room=communityFriendRoom_(v[1],code,v[0]);invites.getRange(row,4,1,4).setValues([['accepted',v[4],v[5],JSON.stringify(room)]]);}}
 else if(d.action==='friend_ack'){const invites=sheet_('FriendChallenges',COMMUNITY_INVITES),row=findRow_(invites,String(d.invite||''));if(row>0){const v=invites.getRange(row,1,1,7).getValues()[0];if(v[1]!==code&&v[2]!==code)pvpFail_('unauthorized');const x=JSON.parse(v[6]||'{}');x.ack=x.ack||[];if(!x.ack.includes(code))x.ack.push(code);invites.getRange(row,7).setValues([[JSON.stringify(x)]]);}}
 else if(d.action!=='social_sync')pvpFail_('bad action');return communitySocialView_(code);}
function communitySocialView_(code){const profiles=communityProfiles_(),now=Date.now(),friends=communityFriendRows_(code).map(r=>profiles.find(p=>p.code===r[2])).filter(Boolean),rows=communityInviteRows_().slice(1),pending=rows.find(r=>r[2]===code&&r[3]==='pending'&&Number(r[5])>now),accepted=rows.slice().reverse().find(r=>[r[1],r[2]].includes(code)&&r[3]==='accepted'&&now-Number(r[4])<600000&&!JSON.parse(r[6]||'{}').ack?.includes(code));let match=null;if(accepted){const x=JSON.parse(accepted[6]);const {r}=pvpRead_(x.room);const seat=r.players.findIndex(p=>p.code===code);if(seat>=0&&['lobby','active'].includes(r.status))match={invite:accepted[0],...pvpView_(r,seat),token:x.tokens[seat]};}return {ok:true,communityVersion:1,serverTime:now,me:communityPublic_(profiles.find(p=>p.code===code)),friends:friends.map(communityPublic_),online:profiles.filter(p=>p.online&&p.code!==code).map(communityPublic_),incoming:pending?{id:pending[0],expires:Number(pending[5]),from:communityPublic_(profiles.find(p=>p.code===pending[1]))}:null,match};}
function communityFriendRoom_(a,b,invite){const ar=pvpFindActive_(a),br=pvpFindActive_(b);if(ar&&br&&ar.r.id===br.r.id&&ar.r.friendInvite===invite)return {room:ar.r.id,tokens:ar.r.friendTokens,ack:[]};for(const code of [a,b]){communityAllowed_(code);if(pvpFindActive_(code)||wbExisting_(code))pvpFail_('finish other battle');}const profiles=[a,b].map((code,i)=>pvpTeam_(communityLoadInternal_(code).P,i)),id=pvpId_().slice(0,8),tokens=[pvpToken_(),pvpToken_()],r={id,friendInvite:invite,friendTokens:tokens,ruleVersion:2,status:'lobby',rev:1,expires:Date.now()+5*60000,deadline:0,winner:null,players:profiles.map((p,i)=>({code:[a,b][i],tokenHash:hash_(id,tokens[i]),name:p.name,cls:p.cls,lv:p.lv,gold:p.gold,ready:false})),battle:{kind:'pvp',allies:profiles[0].team,enemies:profiles[1].team,round:0,turns:0,queue:[],cur:null,log:['ยอมรับคำท้าจากเพื่อนแล้ว'],fx:[],effects:[]},receipts:[]};pvpWrite_(r);return {room:id,tokens,ack:[]};}
const communitySaveBase=saveGame_;
saveGame_=function(d){try{const code=code_(d.code);communityAllowed_(code);const old=JSON.parse(loadGameBase_(d).getContent());if(!old.ok&&old.error!=='notfound')return json_(old);const before=old.ok?JSON.parse(old.data).P:null;communityCoupon_(code,before);if(old.ok)communityFlush_(code);const parsed=JSON.parse(d.data||'{}');if(!parsed.P)return json_({ok:false,error:'bad data'});const latest=old.ok?campRaw_(code).P:null;if(!latest){const initial=communityCoupon_(code);initial.bossClears=num_(parsed.P.cleared,1e9);communityWriteCoupon_(initial);}if(latest&&num_(parsed.P.demonRewardRevision,1e9)!==num_(latest.demonRewardRevision,1e9))return json_({ok:false,error:'save_conflict'});if(latest&&num_(parsed.P.cleared,1e9)>num_(latest.cleared,1e9)&&parsed.P.rewardRulesVersion!==2)return json_({ok:false,error:'game update required'});if(latest&&num_(parsed.P.stageSevenRewardRevision,1e9)!==num_(latest.stageSevenRewardRevision,1e9))return json_({ok:false,error:'save_conflict'});if(latest&&num_(parsed.P.forestClears?.[8],1e9)<num_(latest.forestClears?.[8],1e9))return json_({ok:false,error:'save_conflict'});parsed.P.stageSevenRewardHistory=latest?.stageSevenRewardHistory||[];if(latest?.stageSevenFirstReward)parsed.P.stageSevenFirstReward=latest.stageSevenFirstReward;parsed.P.demonRewardHistory=latest?.demonRewardHistory||[];if(latest&&num_(parsed.P.gachaRevision,1e9)!==num_(latest.gachaRevision,1e9))return json_({ok:false,error:'gacha stale'});parsed.P.gachaLegendPets=latest?.gachaLegendPets||{};if(latest&&num_(parsed.P.cleared,1e9)-num_(latest.cleared,1e9)>100)return json_({ok:false,error:'clear count jump'});const result=JSON.parse(communitySaveBase({...d,data:JSON.stringify(parsed)}).getContent());if(result.ok){const c=communitySyncCredits_(code);communityDirectory_(code,campRaw_(code).P);result.coupons=c.coupons;result.bossRewards=(campRaw_(code).P.demonRewardHistory||[]).filter(r=>r.clear>num_(parsed.P.demonRewardRevision,1e9));result.stageSevenRewards=(campRaw_(code).P.stageSevenRewardHistory||[]).filter(r=>r.clear>num_(parsed.P.stageSevenRewardRevision,1e9));result.communityVersion=1;}return json_(result);}catch(e){return json_({ok:false,error:e.message||String(e)});}};
const communityLoadBase=loadGame_;
loadGame_=function(d){try{communityAllowed_(code_(d.code));const auth=JSON.parse(loadGameBase_(d).getContent());if(!auth.ok)return json_(auth);communityCoupon_(code_(d.code),JSON.parse(auth.data).P);communityFlush_(code_(d.code));const res=JSON.parse(communityLoadBase(d).getContent());const c=communitySyncCredits_(code_(d.code));if(res.ok){const data=campRaw_(code_(d.code));if(res.account?.name)data.P.name=res.account.name;data.P.renameAt=res.account?.renameAt||data.P.renameAt||0;res.data=JSON.stringify(data);}return json_({...res,coupons:c.coupons,communityVersion:1});}catch(e){return json_({ok:false,error:e.message||String(e)});}};
const communityWorldReward=worldReward;
worldReward=function(score,roll,choice){const r=communityWorldReward(score,roll,choice);r.coupon=score>=500&&Math.random()<.5?1:0;return r;};
function onOpen(){SpreadsheetApp.getUi().createMenu('Soulbeast Admin').addItem('สร้างตารางคูปองและเพื่อน','adminSetupCommunity').addItem('แบนไอดีผู้เล่น','adminBlockPlayer').addItem('ลบเซฟและอันดับของไอดีที่แบน','adminDeletePlayer').addToUi();}
function adminSetupCommunity(){for(const [name,head]of [['Coupons',COMMUNITY_COUPONS],['PlayerDirectory',COMMUNITY_DIRECTORY],['CouponCredits',COMMUNITY_CREDITS],['GachaTransactions',COMMUNITY_LEDGER],['Friends',COMMUNITY_FRIENDS],['FriendChallenges',COMMUNITY_INVITES]])sheet_(name,head);}
function adminBlockPlayer(){const ui=SpreadsheetApp.getUi(),answer=ui.prompt('แบนผู้เล่น','ใส่รหัสผู้เล่นเต็ม12–16ตัวจากSaves (ไม่ใช่PIN)',ui.ButtonSet.OK_CANCEL);if(answer.getSelectedButton()!==ui.Button.OK)return;const code=code_(answer.getResponseText());if(code.length<12||code.length>16){ui.alert('รหัสไม่ถูกต้อง');return;}const lock=LockService.getScriptLock();lock.waitLock(20000);try{const P=campRaw_(code).P,c=communityCoupon_(code,P);c.banned=true;c.reason='Admin suspended';c.leaderboardId=String(P.pid||c.leaderboardId||'');communityWriteCoupon_(c);ui.alert('แบนแล้ว: '+P.name+' ('+code+')');}finally{lock.releaseLock();}}
function adminDeletePlayer(){const ui=SpreadsheetApp.getUi(),answer=ui.prompt('ลบเซฟผู้เล่นที่แบน','สำรองGoogle Sheetก่อน ใส่รหัสเต็มจากCoupons ระบบเก็บรายการแบนและประวัติธุรกรรมไว้',ui.ButtonSet.OK_CANCEL);if(answer.getSelectedButton()!==ui.Button.OK)return;const code=code_(answer.getResponseText()),c=communityCoupon_(code);if(!c.banned){ui.alert('ต้องแบนไอดีนี้ก่อน');return;}if(ui.alert('ยืนยันลบเซฟและอันดับ',c.name+' ('+code+') จะกู้คืนได้จากสำเนาชีตเท่านั้น',ui.ButtonSet.YES_NO)!==ui.Button.YES)return;const lock=LockService.getScriptLock();lock.waitLock(20000);try{for(const [name,head,key]of [[SV_SHEET,SV_HEAD,code],[LB_SHEET,LB_HEAD,c.leaderboardId]]){if(!key)continue;const sh=sheet_(name,head),row=findRow_(sh,key);if(row>0)sh.deleteRow(row);}const profiles=sheet_('PlayerDirectory',COMMUNITY_DIRECTORY),rows=profiles.getDataRange().getValues();for(let i=rows.length-1;i>=1;i--)if(rows[i][1]===code)profiles.deleteRow(i+1);const friends=sheet_('Friends',COMMUNITY_FRIENDS),edges=friends.getDataRange().getValues();for(let i=edges.length-1;i>=1;i--)if(edges[i][1]===code||edges[i][2]===code)friends.deleteRow(i+1);const invites=sheet_('FriendChallenges',COMMUNITY_INVITES),pending=invites.getDataRange().getValues();for(let i=1;i<pending.length;i++)if(pending[i][3]==='pending'&&(pending[i][1]===code||pending[i][2]===code))invites.getRange(i+1,4).setValues([['cancelled']]);ui.alert('ลบเซฟและอันดับแล้ว โดยคงรายการแบนไว้');}finally{lock.releaseLock();}}

function communityLeaderboardAllowed_(id){for(const row of sheet_('Coupons',COMMUNITY_COUPONS).getDataRange().getValues().slice(1))if(String(row[12]||'')===String(id))communityAllowed_(String(row[0]));}
const communityLeaderboardBase=leaderboard_;
leaderboard_=function(d){try{const auth=pvpSaveAuth_(d);if(!auth.P.pid||String(d.id)!==String(auth.P.pid))pvpFail_('bad id');return communityLeaderboardBase({...d,gender:auth.P.gender});}catch(e){return json_({ok:false,error:e.message||String(e)});}};


/* Zone encounter lists are the source of truth for forest rare species.
   Shared verbatim by browser and Apps Script: no stat/skill/save migration. */
const RARITY_CORRECTED_IDS=[];
for(const id of new Set(ZN.flatMap(zone=>zone.rare||[]))){
 const beast=SP[id];
 if(beast&&!beast.legendary&&!beast.rare){beast.rare=1;RARITY_CORRECTED_IDS.push(id);}
}


function onlineRefreshWorld_(r){if(['starting','active'].includes(r.status)){wbAdvance_(r);wbWrite_(r);}}
/* Per-execution I/O cache. Never reused across requests or players. */
let ONLINE_IO;
function onlineResetIO_(){ONLINE_IO={sheets:new Map(),ss:null};}
onlineResetIO_();
const onlineNativeSheet_=sheet_;
sheet_=function(name,head){
 if(ONLINE_IO.sheets.has(name))return ONLINE_IO.sheets.get(name);
 const raw=onlineNativeSheet_(name,head);let data=null,last=null;const ranges=new Map();
 const copy=v=>v.map(row=>row.slice()),invalidate=()=>{data=null;last=null;ranges.clear();};
 const values=()=>{if(!data){data=raw.getDataRange().getValues();last=data.length;}return copy(data);};
 const wrapRange=(args)=>{let native;const range=()=>native||(native=raw.getRange(...args));const key=args.join(':');return {
  getValues(){if(data){const [r,c,n=1,m=1]=args;return Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>data[r-1+i]?.[c-1+j]??''));}if(!ranges.has(key))ranges.set(key,range().getValues());return copy(ranges.get(key));},
  getValue(){return this.getValues()[0][0];},setValues(v){invalidate();range().setValues(v);return this;},setFontWeight(v){range().setFontWeight(v);return this;}
 };};
 const wrapped={getLastRow(){return last==null?(last=raw.getLastRow()):last;},getDataRange(){return {getValues:values};},getRange(...args){return wrapRange(args);},appendRow(row){invalidate();raw.appendRow(row);return this;},deleteRow(row){invalidate();raw.deleteRow(row);return this;},setFrozenRows(n){raw.setFrozenRows(n);return this;}};
 ONLINE_IO.sheets.set(name,wrapped);return wrapped;
};
/* Coalesce replay deltas only when storage is near its existing 5-cell cap.
   Battle outcome, participants, rewards and ledger IDs are never discarded. */
function onlineRoomEncode_(r){return Utilities.base64Encode(JSON.stringify(r,(key,value)=>key==='_replayUnits'?undefined:value),Utilities.Charset.UTF_8);}
function onlineCompactReplay_(r){const frames=r.replay?.frames;if(!frames||frames.length<2)return false;const out=[];for(let i=0;i<frames.length;i+=2){const group=frames.slice(i,i+2),last=group[group.length-1],units=new Map();for(const frame of group)for(const unit of frame.units||[])units.set(unit[0],unit);out.push({...last,spawns:group.flatMap(x=>x.spawns||[]),units:[...units.values()],log:group.flatMap(x=>x.log||[]).slice(-3),effects:group.flatMap(x=>x.effects||[]).slice(-8)});}r.replay.frames=out;r.replay.compacted=true;return true;}
wbWrite_=function(r){r.updated=Date.now();let data=onlineRoomEncode_(r);while(data.length>(CHUNK-4)*5&&onlineCompactReplay_(r))data=onlineRoomEncode_(r);if(data.length>(CHUNK-4)*5)pvpFail_('room too big');const vals=[r.id,r.status==='finished'&&!r.settled?'reward_pending':r.status,r.updated,r.expires,...Array.from({length:5},(_,i)=>'WB1:'+data.slice(i*(CHUNK-4),(i+1)*(CHUNK-4)))],sh=sheet_(WB_ROOMS,WB_HEAD),row=findRow_(sh,r.id);if(row>0)sh.getRange(row,1,1,9).setValues([vals]);else sh.appendRow(vals);};
const onlineWorldDispatch_=wbDispatch_;
wbDispatch_=function(d){
 if(d.action!=='wb_leave')return onlineWorldDispatch_(d);
 try{const auth=pvpSaveAuth_(d),code=auth.code;let r;try{r=wbRead_(String(d.room||'').toUpperCase());}catch(e){if(e.message!=='room not found')throw e;return {ok:true,left:true,worldVersion:1,used:wbUsed_(code),worldAccount:wbAccount_(code)};}
 const seat=r.players.findIndex(p=>p.code===code);
 if(seat<0||r.status==='cancelled')return {ok:true,left:true,worldVersion:1,used:wbUsed_(code),worldAccount:wbAccount_(code)};
 if(r.status==='lobby'){
  r.players.splice(seat,1);r.players.forEach((p,i)=>{p.ready=false;(p.team||[]).forEach((u,j)=>{u.owner=i;u.id='p'+i+(j?'pet'+(j-1):'');});});r.host=0;r.rev++;if(!r.players.length)r.status='cancelled';wbWrite_(r);
  return {ok:true,left:true,worldVersion:1,used:wbUsed_(code),worldAccount:wbAccount_(code)};
 }
 const result=onlineWorldDispatch_(d);return result.ok?{...result,left:true,room:undefined}:result;
 }catch(e){return {ok:false,error:e.message||String(e),worldVersion:1};}
};

// Balance rules shared by browser and authoritative battle engine.
SP.demonlord.noseal=1;
// The final boss has a signature despite having no evolution tree.
const demonPetSkillsBase=petSkills;
petSkills=function(p){const skills=demonPetSkillsBase(p);if(p.sp==='demonlord')for(const id of [...SP.demonlord.sk,SP.demonlord.sig,'boss_legend_call'])if(SK[id]&&!skills.includes(id))skills.push(id);return skills;};

function isEclipseReward(reward){return reward?.type==='gear'&&!!EQ[reward.key]?.worldLegend;}
function balanceGachaKey(category,pool){if(!pool.length)throw Error('empty gacha pool');return pool[Math.floor(Math.random()*pool.length)];}
function wagerClass(a){if(!a)return 'none';if(a.type==='gold')return 'gold';if(a.type==='pet'){const q=SP[a.pet?.sp];return 'pet:'+(q?.solar?'solar':q?.legendary?'legendary':q?.rare?'rare':'normal');}if(a.type==='gear'){const q=EQ[a.key];return 'gear:'+(q?.worldLegend?'eclipse':q?.legend?'legendary':q?.craft?'crafted':'normal');}if(a.type==='item'){const q=CON[a.key];return 'item:'+(q?.rareLoot?'rare':q?.price>=1000?'premium':'normal');}return 'invalid';}
function wagersMatch(a,b){return (!a&&!b)||!!(a&&b&&wagerClass(a)===wagerClass(b));}

SK.boss_legend_call={n:'พันธสัญญาอสูรตำนาน',t:'summon',mp:0,summon:'legendary',life:999};
function bossSummonDue(u){u.legendTurn=(u.legendTurn||0)+1;const alive=B().enemies.some(x=>x.bossHelper&&x.hp>0);if(alive){u.legendDeadAt=null;return false;}if(!u.legendSummoned)return true;if(u.legendDeadAt==null)u.legendDeadAt=u.legendTurn;return u.legendTurn-u.legendDeadAt>=2;}
function bossSummonLegends(u,count){const b=B(),pool=Object.keys(SP).filter(k=>SP[k].legendary&&!SP[k].noseal);if(!battleHasRoom(u))return false;const chosen=pool.slice();let placed=0;for(let i=0;i<count&&battleHasRoom(u);i++){const sp=chosen.splice(Math.floor(Math.random()*chosen.length),1)[0],n=wildUnit(sp,40,0);n.id=u.id+'_legend_'+(u.legendBatch=(u.legendBatch||0)+1);n.side=u.side;n.owner=u.owner;n.temporary=true;n.bossHelper=true;n.summonedBy=u.id;n.r=99;n.skills=n.skills.filter(id=>!SK[id]?.summon);if(battlePlaceUnit(u,n))placed++;}u.legendSummoned=true;u.legendDeadAt=null;blog(u.name+' ใช้ '+SK.boss_legend_call.n+' เรียกอสูรตำนาน Lv 40 จำนวน '+placed+' ตัว');b.effects=b.effects||[];b.effects.push({k:'cast',uid:u.id,skill:'boss_legend_call'});if(typeof Sound!=='undefined')Sound.fx('charge');return true;}
const balanceBossAct=act;act=function(u,id,t,a,free){const b=B(),prior=b?.balanceDamageActor;if(b&&isWorldBattle())b.balanceDamageActor={side:u.side,owner:u.owner};try{if(id==='boss_legend_call')return bossSummonLegends(u,u.immortalWorld?2:1);return balanceBossAct(u,id,t,a,free);}finally{if(b)b.balanceDamageActor=prior;}};
function worldAttackTarget(b){return b.enemies.find(x=>x.bossHelper&&x.hp>0)||b.enemies[0];}

const balanceHurt=hurt;hurt=function(u,d,c='bad'){const beforeHp=u.hp;balanceHurt(u,d,c);if(isWorldBattle()&&u.bossHelper&&B().balanceDamageActor?.side==='ally'){const b=B(),damage=Math.max(0,beforeHp-u.hp);b.damageTotal=(b.damageTotal||0)+damage;const owner=b.balanceDamageActor.owner;if(Number.isInteger(owner)&&owner>=0)b.damageBy[owner]=(b.damageBy[owner]||0)+damage;}if(u.bossHelper&&u.hp<=0&&!B().enemies.some(x=>x.bossHelper&&x.hp>0)){const boss=B().enemies.find(x=>x.id===u.summonedBy);if(boss)boss.legendDeadAt=boss.legendTurn||0;}};


const balanceWorldBoss=wbBoss_;wbBoss_=function(){const u=balanceWorldBoss();u.st.patk=Math.max(1,Math.round(u.st.patk*.5));u.st.matk=Math.max(1,Math.round(u.st.matk*.5));u.skills.push('boss_legend_call');return u;};
const balanceWorldBossTurn=wbBossTurn_;wbBossTurn_=function(r){const u=r.battle.enemies[0];if(bossSummonDue(u)){r.battle.bossTurns++;act(u,'boss_legend_call',u,u);r.battle.turns++;replayFrame_(r);return;}balanceWorldBossTurn(r);};
// World Boss has no minimum-level entry gate; equipment and damage determine rewards.
const balanceWorldReward=worldReward;worldReward=function(score,roll,choice){const r=balanceWorldReward(score,roll,choice);const chance=score>=4000?.10:score>=2000?.05:score>=1000?.01:score>=500?.005:0;for(const id of Object.keys(r.loot))if(EQ[id]?.worldLegend)delete r.loot[id];r.chance=chance;if(roll<chance)r.loot[WORLD_LEGENDS[Math.min(WORLD_LEGENDS.length-1,Math.floor(choice*WORLD_LEGENDS.length))]]=1;if(score>=25)r.loot.eth=score>=500?3:1;if(score>=100)r.loot.revivePotion=1;r.gold=score*20;r.score=score;r.xp=score*25;r.power=Math.floor(score/10);return r;};
function balancePartyReward(r,score,roll,choice){const v=worldReward(score,roll,choice),eligible=r.players.filter(p=>!p.forfeit&&p.lv>=45).length>=3;if(!eligible){for(const id of Object.keys(v.loot))if(EQ[id]?.worldLegend)delete v.loot[id];v.chance=0;v.legendaryLocked=true;}return v;}
const balanceStakeReady=stakeSyncReady_;stakeSyncReady_=function(r){const x=stakeRead_(r.id);if(!wagersMatch(x.offers[0],x.offers[1]))pvpFail_('stake rarity mismatch');return balanceStakeReady(r);};
const balanceReplayFrame=replayFrame_;replayFrame_=function(r){balanceReplayFrame(r);if(!r.replay?.frames?.length)return;const f=r.replay.frames[r.replay.frames.length-1],known=r._balanceKnown||(r._balanceKnown=Object.fromEntries([...r.replay.initial.allies,...r.replay.initial.enemies].map(u=>[u.id,true])));f.spawns=[];for(const u of [...r.battle.allies,...r.battle.enemies])if(!known[u.id]){f.spawns.push(JSON.parse(JSON.stringify(u)));known[u.id]=true;}f.enemyIds=r.battle.enemies.map(u=>u.id);f.allyIds=r.battle.allies.map(u=>u.id);};

// Shared reward application supports ordinary legendary and crafted guild prizes.
const guildWorldApplyBase=worldApply;
worldApply=function(P,a){const previous=P.worldApplied?.loot||{};guildWorldApplyBase(P,a);for(const [id,n] of Object.entries(a?.loot||{})){if(!EQ[id]||EQ[id].worldLegend)continue;const add=Math.max(0,Number(n)-Number(previous[id]||0));P.owned=P.owned||[];for(let i=0;i<add;i++)P.owned.push(id);if(add&&EQ[id].legend){P.legend=P.legend||{};P.legend[id]=1;}}};

// Guild state is committed atomically with saves, coupons and combat ledgers.
const GUILD_RULES={createCost:10,maxMembers:20,win:30,loss:10,draw:5,onlineMs:300000,minRewardDays:7,levelBasis:"lifetime",levelThresholds:[0,1000,5000,15000,40000],campWin:20,campLoss:5,warWin:100,warDefeatLoss:50,rewardGold:[10000,8000,6500,5500,4500,3500,3000,2500,2000,1500]};
const GUILD_HEAD=['id','json'];
function guildRead_(id,fallback=null){const s=sheet_('GuildState',GUILD_HEAD),r=findRow_(s,id);return r<0?fallback:JSON.parse(s.getRange(r,2).getValue());}
function guildWrite_(id,v){const s=sheet_('GuildState',GUILD_HEAD),r=findRow_(s,id),row=[id,JSON.stringify(v)];if(r<0)s.appendRow(row);else s.getRange(r,1,1,2).setValues([row]);return v;}
function guildRows_(prefix){return sheet_('GuildState',GUILD_HEAD).getDataRange().getValues().slice(1).filter(r=>String(r[0]).startsWith(prefix)).map(r=>JSON.parse(r[1]));}
function guildMonth_(now=Date.now()){return new Date(now+25200000).toISOString().slice(0,7);}
function guildBoundary_(month){return Date.parse(month+'-01T00:00:00+07:00');}
function guildNextMonth_(month){const d=new Date(month+'-01T00:00:00Z');d.setUTCMonth(d.getUTCMonth()+1);return d.toISOString().slice(0,7);}
function guildMember_(code){return guildRead_('m:'+code,{code,guildId:'',total:0,monthPoints:0,joinedAt:0,guildContribution:0});}
function guildPublicId_(code){return hash_(code,'guild-member').slice(0,24);}
function guildRank_(){return guildRows_('g:').filter(g=>!g.deleted&&g.members.length).sort((a,b)=>b.score-a.score||a.createdAt-b.createdAt||a.id.localeCompare(b.id));}
function guildClean_(){const alive=new Set(sheet_('Saves',SV_HEAD).getDataRange().getValues().slice(1).map(r=>r[0]));for(const g of guildRows_('g:')){if(g.deleted)continue;const members=g.members.filter(c=>alive.has(c));if(members.length===g.members.length)continue;g.members=members;if(!members.includes(g.leader))g.leader=members[0]||'';if(!members.length)g.deleted=true;guildWrite_('g:'+g.id,g);}}
function guildV1Tick_(){guildClean_();const now=Date.now(),current=guildMonth_(now),meta=guildRead_('meta',{month:current});while(meta.month<current){const next=guildNextMonth_(meta.month),end=guildBoundary_(next);if(!guildRead_('s:'+meta.month)){const ranked=guildRank_().filter(g=>g.score>0),results=[];ranked.forEach((g,i)=>{if(i>=10)return;const eligible=g.members.filter(code=>{const m=guildMember_(code);return m.guildId===g.id&&m.joinedAt<=end-GUILD_RULES.minRewardDays*86400000&&m.monthPoints>0;});const pool=Object.keys(CON).filter(k=>i<3?(CON[k].rareLoot&&!CON[k].seal):!CON[k].rareLoot&&CON[k].price>=100&&CON[k].price<=5000);results.push({id:g.id,name:g.name,rank:i+1,score:g.score,eligible:eligible.length});for(const code of eligible){const key=pool[Math.floor(Math.random()*pool.length)]||'pot';guildWrite_('r:'+meta.month+':'+code,{id:meta.month+':'+code,month:meta.month,guildId:g.id,guildName:g.name,rank:i+1,code,gold:GUILD_RULES.rewardGold[i],loot:{[key]:1},claimed:false});}});guildWrite_('s:'+meta.month,{month:meta.month,endedAt:end,ranking:results});for(const g of guildRows_('g:')){if(g.deleted)continue;g.score=Math.floor(g.score/2);guildWrite_('g:'+g.id,g);}for(const m of guildRows_('m:')){m.monthPoints=0;guildWrite_('m:'+m.code,m);}}meta.month=next;guildWrite_('meta',meta);}guildWrite_('meta',meta);}
function guildOnline_(code){const a=guildRead_('o:'+code),p=communityProfiles_().find(p=>p.code===code);return !!((a&&Date.now()-a.at<GUILD_RULES.onlineMs)||(p?.online&&!p.banned));}
function guildPulse_(code){const previous=guildRead_('o:'+code);if(!previous||Date.now()-previous.at>=60000)guildWrite_('o:'+code,{at:Date.now()});}
function guildV1Credit_(code,id,points){if(!Number.isSafeInteger(points)||points<=0||guildRead_('e:'+id))return;guildTick_();const m=guildMember_(code);m.total+=points;const g=m.guildId&&guildRead_('g:'+m.guildId);let guildPoints=0;if(g&&!g.deleted&&g.members.includes(code)&&guildOnline_(code)){g.score+=points;m.monthPoints+=points;guildPoints=points;guildWrite_('g:'+g.id,g);}guildWrite_('m:'+code,m);guildWrite_('e:'+id,{id,code,points,guildPoints,guildId:guildPoints?g.id:'',at:Date.now()});}
function guildName_(name){name=String(name||'').trim().normalize('NFKC');if(name.length<2||name.length>24||/[<>\x00-\x1f]/.test(name))pvpFail_('guild bad name');if(guildRows_('g:').some(g=>g.name.toLocaleLowerCase()===name.toLocaleLowerCase()))pvpFail_('guild name exists');return name;}
function guildAvatar_(avatar){if(avatar)pvpFail_('image upload disabled');return '';}
function guildV1View_(code){const me=guildMember_(code),g=me.guildId&&guildRead_('g:'+me.guildId),profiles=communityProfiles_(),names=c=>profiles.find(p=>p.code===c);const publicGuild=g=>({id:g.id,name:g.name,avatar:'',score:g.score,count:g.members.length,leader:names(g.leader)?.name||'หัวหน้ากิล',createdAt:g.createdAt});return {ok:true,guildVersion:1,rules:GUILD_RULES,activity:me.total,monthPoints:me.monthPoints,month:guildMonth_(),guild:g&&!g.deleted?{...publicGuild(g),isLeader:g.leader===code,canRename:g.renameMonth!==guildMonth_(),canSetImage:g.leader===code&&!g.avatar,members:g.members.map(c=>{const p=names(c),m=guildMember_(c);return {id:guildPublicId_(c),name:p?.name||'ผู้เล่น',lv:p?.lv||1,cls:p?.cls||'',avatar:p?.avatar||'',leader:g.leader===c,me:c===code,online:guildOnline_(c),points:m.monthPoints};})}:null,leaderboard:guildRank_().slice(0,100).map((g,i)=>({...publicGuild(g),rank:i+1})),rewards:guildRows_('r:').filter(r=>r.code===code).map(({code,...r})=>r),previous:guildRows_('s:').slice(-1)[0]||null,coupons:communityCoupon_(code).coupons,account:campAccount_(code)};}
function guildV1Dispatch_(d){const auth=pvpSaveAuth_(d),code=auth.code;communityAllowed_(code);guildTick_();guildPulse_(code);const m=guildMember_(code),g=m.guildId&&guildRead_('g:'+m.guildId);const leader=()=>{if(!g||g.deleted||g.leader!==code)pvpFail_('guild leader required');};const target=()=>g.members.find(c=>guildPublicId_(c)===d.target);
if(d.action==='guild_create'){if(g&&!g.deleted)pvpFail_('guild already member');const name=guildName_(d.name),avatar=guildAvatar_(d.avatar);communityFlush_(code);const c=communitySyncCredits_(code);if(c.coupons<GUILD_RULES.createCost)pvpFail_('not enough coupons');c.coupons-=GUILD_RULES.createCost;communityWriteCoupon_(c);const id=pvpId_();guildWrite_('g:'+id,{id,name,avatar,leader:code,members:[code],score:0,createdAt:Date.now(),renameMonth:guildMonth_(),deleted:false});m.guildId=id;m.joinedAt=Date.now();m.monthPoints=0;guildWrite_('m:'+code,m);}
else if(d.action==='guild_join'){if(g&&!g.deleted)pvpFail_('guild already member');const dest=guildRead_('g:'+String(d.guildId||''));if(!dest||dest.deleted)pvpFail_('guild not found');if(dest.members.length>=GUILD_RULES.maxMembers)pvpFail_('guild full');dest.members.push(code);m.guildId=dest.id;m.joinedAt=Date.now();m.monthPoints=0;guildWrite_('g:'+dest.id,dest);guildWrite_('m:'+code,m);}
else if(d.action==='guild_rename'){leader();if(g.renameMonth===guildMonth_())pvpFail_('guild rename cooldown');g.name=guildName_(d.name);g.renameMonth=guildMonth_();guildWrite_('g:'+g.id,g);}
else if(d.action==='guild_image'){leader();if(g.avatar)pvpFail_('guild image locked');g.avatar=guildAvatar_(d.avatar);if(!g.avatar)pvpFail_('guild bad image');guildWrite_('g:'+g.id,g);}
else if(d.action==='guild_transfer'){leader();const c=target();if(!c||c===code)pvpFail_('guild bad member');g.leader=c;guildWrite_('g:'+g.id,g);}
else if(d.action==='guild_leave'||d.action==='guild_kick'){if(!g||g.deleted)pvpFail_('guild not found');let c=code;if(d.action==='guild_kick'){leader();c=target();if(!c||c===code)pvpFail_('guild bad member');}else if(g.leader===code&&g.members.length>1)pvpFail_('guild transfer first');g.members=g.members.filter(x=>x!==c);if(!g.members.length)g.deleted=true;const left=guildMember_(c);left.guildId='';left.monthPoints=0;guildWrite_('m:'+c,left);guildWrite_('g:'+g.id,g);}
else if(d.action==='guild_claim'){const reward=guildRead_('r:'+String(d.reward||''));if(!reward||reward.code!==code)pvpFail_('guild reward unavailable');if(!reward.claimed){const id='guild-'+reward.id,sh=sheet_('WorldRewards',WB_REWARD_HEAD);if(findRow_(sh,id)<0)sh.appendRow([id,code,'guild','{}']);const row=findRow_(sh,id);sh.getRange(row,4).setValues([[JSON.stringify({gold:reward.gold,score:0,xp:0,power:0,loot:reward.loot})]]);reward.claimed=true;guildWrite_('r:'+reward.id,reward);}}
else if(d.action!=='guild_sync')pvpFail_('bad action');return guildView_(code);}
const guildPvpFinishBase=pvpFinish_;pvpFinish_=function(r,winner,reason){if(r.guildWar){r.status='finished';r.winner=winner;r.reason=reason;r.deadline=0;r.rev++;r.battle.log.push(reason);return;}const active=r.status==='active';guildPvpFinishBase(r,winner,reason);if(active&&!r.raid&&r.players.length===2&&(reason==='การประลองจบลง'||reason.startsWith('เสมอ:'))){const x=guildMember_(r.players[0].code),y=guildMember_(r.players[1].code),cross=!!x.guildId&&!!y.guildId&&x.guildId!==y.guildId;for(let i=0;i<2;i++)guildCredit_(r.players[i].code,'pvp:'+r.id+':'+i,winner<0?GUILD_RULES.draw:winner===i?GUILD_RULES.win:GUILD_RULES.loss,{guildEligible:cross});}};
const guildWorldFinishBase=wbFinish_;wbFinish_=function(r){const active=r.status==='active';guildWorldFinishBase(r);if(active&&r.status==='finished')r.players.forEach((p,i)=>{if(!p.forfeit)guildCredit_(p.code,'world:'+r.id+':'+i,Math.max(0,Math.floor(r.sharedScore||0)));});};
const guildPvpDispatchBase=pvpDispatch_;pvpDispatch_=function(d){if(['pvp_create','pvp_join','pvp_resume'].includes(d.action)){const auth=pvpSaveAuth_(d);guildPulse_(auth.code);}else{const {r}=pvpRead_(String(d.room||'').toUpperCase()),seat=r.players.find(p=>p.tokenHash===hash_(r.id,String(d.token||'')));if(seat&&!r.raid){communityAllowed_(seat.code);guildPulse_(seat.code);}}return guildPvpDispatchBase(d);};
const guildWorldDispatchBase=wbDispatch_;wbDispatch_=function(d){const auth=pvpSaveAuth_(d);guildPulse_(auth.code);return guildWorldDispatchBase(d);};

function guildLevel_(g){const points=GUILD_RULES.levelBasis==='current'?g.score:(g.totalPoints??g.score);return Math.min(5,1+GUILD_RULES.levelThresholds.slice(1).filter(n=>points>=n).length);}
function guildSaturday_(now=Date.now()){const d=new Date(now+25200000);return d.getUTCDay()===6;}
function guildWarPeriod_(now=Date.now()){const d=new Date(now+25200000);d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+1)%7));return d.toISOString().slice(0,10);}
function guildReward_(rank,points){const factor=.5+Math.min(2,points/1000),gold=Math.round(GUILD_RULES.rewardGold[rank-1]*factor),chance=([.3,.25,.2,.15,.1,.08,.07,.06,.05,.04][rank-1]||0)*(.5+Math.min(1,points/1000));const legendary=Math.random()<chance,pool=Object.keys(EQ).filter(k=>legendary?(EQ[k].legend&&!EQ[k].worldLegend):!!EQ[k].craft),gear=pool[Math.floor(Math.random()*pool.length)],items=Object.keys(CON).filter(k=>!CON[k].seal&&(CON[k].rareLoot||CON[k].price>=100&&CON[k].price<=5000)),item=items[Math.floor(Math.random()*items.length)],loot={};if(gear)loot[gear]=1;if(item)loot[item]=1+Math.min(3,Math.floor(points/1000));return {gold,loot,personalPoints:points,gearKind:legendary?'legendary':'crafted'};}
function guildTick_(){guildClean_();const current=guildMonth_(),meta=guildRead_('meta',{month:current});while(meta.month<current){const next=guildNextMonth_(meta.month),end=guildBoundary_(next);if(!guildRead_('s:'+meta.month)){const results=[];guildRank_().filter(g=>g.score>0).slice(0,10).forEach((g,i)=>{const eligible=g.members.filter(code=>{const m=guildMember_(code);return m.guildId===g.id&&m.joinedAt<=end-GUILD_RULES.minRewardDays*86400000&&m.monthPoints>0;});results.push({id:g.id,name:g.name,rank:i+1,score:g.score,eligible:eligible.length});for(const code of eligible){const prize=guildReward_(i+1,guildMember_(code).monthPoints);guildWrite_('r:'+meta.month+':'+code,{id:meta.month+':'+code,month:meta.month,guildId:g.id,guildName:g.name,rank:i+1,code,...prize,claimed:false});}});guildWrite_('s:'+meta.month,{month:meta.month,endedAt:end,ranking:results});for(const g of guildRows_('g:')){if(g.deleted)continue;g.totalPoints=g.totalPoints??g.score;g.score=Math.floor(g.score/2);guildWrite_('g:'+g.id,g);}for(const m of guildRows_('m:')){m.monthPoints=0;guildWrite_('m:'+m.code,m);}}meta.month=next;guildWrite_('meta',meta);}guildWrite_('meta',meta);}
function guildCredit_(code,id,points,options={}){if(!Number.isSafeInteger(points)||points<=0||guildRead_('e:'+id))return;guildTick_();const m=guildMember_(code);m.total+=points;const g=m.guildId&&guildRead_('g:'+m.guildId);let guildPoints=0;if(options.guildEligible!==false&&g&&!g.deleted&&g.members.includes(code)&&(options.forceGuild||guildOnline_(code))){g.totalPoints=(g.totalPoints??g.score)+points;g.score+=points;m.monthPoints+=points;m.guildContribution=(m.guildContribution||0)+points;guildPoints=points;guildWrite_('g:'+g.id,g);}guildWrite_('m:'+code,m);guildWrite_('e:'+id,{id,code,points,guildPoints,guildId:guildPoints?g.id:'',at:Date.now()});}
function guildProfile_(code,profiles=communityProfiles_()){const p=profiles.find(p=>p.code===code),presence=guildRead_('o:'+code);return {id:guildPublicId_(code),name:p?.name||'ผู้เล่น',lv:p?.lv||1,cls:p?.cls||'',avatar:p?.avatar||'',gender:p?.gender,lastOnline:Math.max(p?.lastSave||0,presence?.at||0),online:guildOnline_(code)};}
function guildPublic_(g,profiles){const leader=guildProfile_(g.leader,profiles);return {id:g.id,name:g.name,flag:SP[g.flag]?g.flag:'fenrir',score:g.score,warScore:g.warScore||0,level:guildLevel_(g),count:g.members.length,leader:leader.name,leaderClass:leader.cls,leaderLevel:leader.lv,createdAt:g.createdAt};}
function guildView_(code,query='',page=0){const me=guildMember_(code),g=me.guildId&&guildRead_('g:'+me.guildId),profiles=communityProfiles_(),ranked=guildRank_(),apps=guildRows_('a:'),period=guildWarPeriod_(),queryText=String(query).slice(0,24).toLocaleLowerCase();page=Math.max(0,Math.min(100000,Math.floor(Number(page)||0)));const all=ranked.map((g,i)=>({...guildPublic_(g,profiles),rank:i+1,applied:apps.some(a=>a.code===code&&a.guildId===g.id&&a.status==='pending')}));const view=g&&!g.deleted&&g.members.includes(code)?{...guildPublic_(g,profiles),isLeader:g.leader===code,members:g.members.map(c=>({...guildProfile_(c,profiles),leader:g.leader===c,me:c===code,points:guildMember_(c).monthPoints,totalPoints:guildMember_(c).guildContribution||0})),applicants:g.leader===code?apps.filter(a=>a.guildId===g.id&&a.status==='pending').map(a=>({...guildProfile_(a.code,profiles),appliedAt:a.at})):[]}:null;return {ok:true,guildVersion:2,rules:GUILD_RULES,activity:me.total,monthPoints:me.monthPoints,month:guildMonth_(),guild:view,leaderboard:all.filter((g,i)=>i<20||g.id===view?.id),guilds:all.filter(g=>!queryText||g.name.toLocaleLowerCase().includes(queryText)).slice(page*20,(page+1)*20),page,totalPages:Math.max(1,Math.ceil(all.filter(g=>!queryText||g.name.toLocaleLowerCase().includes(queryText)).length/20)),totalGuilds:all.length,warLeaderboard:all.slice().sort((a,b)=>b.warScore-a.warScore||a.rank-b.rank).map((g,i)=>({id:g.id,name:g.name,level:g.level,score:g.score,warScore:g.warScore,rank:i+1})).filter(g=>g.rank<=20||g.id===view?.id),war:{open:guildSaturday_(),period,used:!!guildRead_('w:'+period+':'+code),targets:view?all.filter(t=>t.id!==g.id&&Math.abs(t.level-guildLevel_(g))<=1).map(({id,name,level,score,warScore})=>({id,name,level,score,warScore})):[],last:guildRead_('w:'+period+':'+code)?.publicResult||null},rewards:guildRows_('r:').filter(r=>r.code===code).map(({code,...r})=>r),previous:guildRows_('s:').slice(-1)[0]||null,coupons:communityCoupon_(code).coupons,account:campAccount_(code)};}
function guildDispatch_(d){const auth=pvpSaveAuth_(d),code=auth.code;communityAllowed_(code);guildTick_();guildPulse_(code);const m=guildMember_(code),g=m.guildId&&guildRead_('g:'+m.guildId),inGuild=g&&!g.deleted&&g.members.includes(code);const requireLeader=()=>{if(!inGuild||g.leader!==code)pvpFail_('guild leader required');};if(d.action==='guild_create'){if(inGuild)pvpFail_('guild already member');const name=guildName_(d.name),flag=String(d.flag||'');if(!SP[flag])pvpFail_('guild bad flag');communityFlush_(code);const c=communitySyncCredits_(code);if(c.coupons<GUILD_RULES.createCost)pvpFail_('not enough coupons');c.coupons-=GUILD_RULES.createCost;communityWriteCoupon_(c);const id=pvpId_();guildWrite_('g:'+id,{id,name,flag,leader:code,members:[code],score:0,totalPoints:0,warScore:0,createdAt:Date.now(),deleted:false});m.guildId=id;m.joinedAt=Date.now();m.monthPoints=0;m.guildContribution=0;guildWrite_('m:'+code,m);}
else if(d.action==='guild_apply'){if(inGuild)pvpFail_('guild already member');const target=guildRead_('g:'+String(d.guildId||''));if(!target||target.deleted)pvpFail_('guild not found');if(target.members.length>=20)pvpFail_('guild full');const id='a:'+target.id+':'+code,old=guildRead_(id);if(!old||old.status!=='pending')guildWrite_(id,{guildId:target.id,code,status:'pending',at:Date.now()});}
else if(['guild_accept','guild_reject'].includes(d.action)){requireLeader();const applicant=guildRows_('a:').find(a=>a.guildId===g.id&&a.status==='pending'&&guildPublicId_(a.code)===d.target);if(!applicant)pvpFail_('guild application missing');const member=guildMember_(applicant.code);if(d.action==='guild_accept'){communityAllowed_(applicant.code);const current=member.guildId&&guildRead_('g:'+member.guildId);if(current&&!current.deleted&&current.members.includes(applicant.code))pvpFail_('guild already member');if(g.members.length>=20)pvpFail_('guild full');g.members.push(applicant.code);member.guildId=g.id;member.joinedAt=Date.now();member.monthPoints=0;member.guildContribution=0;guildWrite_('m:'+member.code,member);guildWrite_('g:'+g.id,g);for(const a of guildRows_('a:').filter(a=>a.code===member.code&&a.status==='pending')){a.status=a.guildId===g.id?'accepted':'cancelled';guildWrite_('a:'+a.guildId+':'+a.code,a);}}else{applicant.status='rejected';guildWrite_('a:'+g.id+':'+applicant.code,applicant);}}
else if(d.action==='guild_withdraw'){const id='a:'+String(d.guildId)+':'+code,a=guildRead_(id);if(a&&a.status==='pending'){a.status='cancelled';guildWrite_(id,a);}}
else if(['guild_rename','guild_image','guild_join'].includes(d.action))pvpFail_('guild immutable rules');
else if(d.action==='guild_defense'){if(!inGuild)pvpFail_('guild required');const ids=campInputPets_(auth.P,d.pets),defense=campState_(code);defense.pets=ids;defense.pet=ids[0];campWrite_(defense);}
else if(d.action==='guild_war_attack')return guildWarAttack_(auth,d);
else if(d.action==='guild_sync')return guildView_(code,d.search,d.page);
else return guildV1Dispatch_(d);return guildView_(code,d.search,d.page);}
function guildWarAttack_(auth,d){const code=auth.code,period=guildWarPeriod_(),key='w:'+period+':'+code;if(!guildSaturday_())pvpFail_('guild war saturday');const old=guildRead_(key);if(old)return {...guildView_(code),warResult:old.publicResult,warRoom:old.room};const m=guildMember_(code),mine=m.guildId&&guildRead_('g:'+m.guildId),enemy=guildRead_('g:'+String(d.guildId||''));if(!mine||mine.deleted||!mine.members.includes(code))pvpFail_('guild required');requireDefense_(auth.P,code);if(!enemy||enemy.deleted||enemy.id===mine.id)pvpFail_('guild war bad target');if(Math.abs(guildLevel_(mine)-guildLevel_(enemy))>1)pvpFail_('guild war level');if(pvpFindActive_(code)||wbExisting_(code))pvpFail_('finish other battle');const defenders=enemy.members.filter(c=>{try{communityAllowed_(c);const raw=campRaw_(c).P;return !!raw&&campDefenseIds_(raw,campState_(c)).length>0;}catch{return false;}});if(!defenders.length)pvpFail_('guild war empty');const defender=defenders[Math.floor(Math.random()*defenders.length)],raw=campRaw_(defender).P,a=guildCombatTeam_(auth.P,0),b=campTeam_(raw,requireDefense_(raw,defender),1),id='GW'+pvpId_().replace(/-/g,'').slice(0,12),r={id,guildWar:true,raid:true,status:'active',rev:1,expires:Date.now()+1800000,deadline:0,winner:null,players:[{code,name:a.name,cls:a.cls,lv:a.lv,gold:a.gold},{code:defender,name:b.name,cls:b.cls,lv:b.lv,gold:b.gold}],battle:{kind:'raid',allies:a.team,enemies:b.team,round:0,turns:0,queue:[],cur:null,log:['สงครามกิล · สุ่มคู่ต่อสู้แล้ว'],fx:[],effects:[]}};S={P:{gold:0},battle:r.battle};replayInit_(r);pvpNext_(r);campAI_(r);if(r.status!=='finished')pvpFinish_(r,-1,'เสมอ: ครบขีดจำกัดสงครามกิล');const won=r.winner===0,defended=r.winner===1,winner=won?code:defended?defender:null;let loss=0;if(winner){guildCredit_(winner,'guildwar:'+id,GUILD_RULES.warWin,{forceGuild:true});const winning=guildRead_('g:'+(won?mine.id:enemy.id));winning.warScore=(winning.warScore||0)+GUILD_RULES.warWin;guildWrite_('g:'+winning.id,winning);if(won){const losing=guildRead_('g:'+enemy.id);loss=Math.min(losing.score,GUILD_RULES.warDefeatLoss);losing.score-=loss;guildWrite_('g:'+losing.id,losing);}}const publicResult={id,period,win:won,draw:r.winner<0,opponentName:b.name,opponentClass:b.cls,opponentLevel:b.lv,guildPoints:won?GUILD_RULES.warWin:0,warPoints:won?GUILD_RULES.warWin:0,defenderLost:loss};const room={id,status:'finished',winner:r.winner,me:0,reason:r.reason,players:r.players.map(({name,cls,lv})=>({name,cls,lv})),battle:r.battle,replay:r.replay,turnLimit:100,guildWar:true};guildWrite_(key,{code,period,guildId:mine.id,target:enemy.id,publicResult,room});return {...guildView_(code),warResult:publicResult,warRoom:room};}
const guildCampSettleBase=campSettle_;campSettle_=function(r){if(r.guildWar)return;guildCampSettleBase(r);if(!r.raid||r.status!=='finished'||r.players.length!==2)return;const a=guildMember_(r.players[0].code),b=guildMember_(r.players[1].code),cross=!a.guildId||!b.guildId||a.guildId!==b.guildId;if(r.winner>=0){guildCredit_(r.players[0].code,'camp:'+r.id+':0',r.winner===0?GUILD_RULES.campWin:GUILD_RULES.campLoss,{guildEligible:cross});}};

function isEclipseWeapon_(reward){return reward?.type==='gear'&&!!EQ[reward.key]?.worldLegend&&EQ[reward.key].slot==='weapon';}

function gachaSolarPity_(code){const rows=sheet_('GachaTransactions',COMMUNITY_LEDGER).getDataRange().getValues().slice(1).filter(r=>r[1]===code&&r[3]==='done').map(r=>JSON.parse(r[2])).filter(tx=>tx.gachaPityVersion>=3).sort((a,b)=>a.revision-b.revision);let pity=0;for(const tx of rows){if(Number.isInteger(tx.solarPity)&&tx.solarPity>=0&&tx.solarPity<300)pity=tx.solarPity;else for(const reward of (tx.rewards||[]).filter(r=>!r.guaranteedSolar).slice(0,tx.count||0))pity=reward.category==='solarBeast'?0:Math.min(299,pity+1);}return pity;}
function gachaSolarBonus_(pool,draw){const key=balanceGachaKey('solarBeast',pool),uid=1000000000000000+Number(''+Date.now().toString().slice(-9)+String(draw).padStart(6,'0').slice(-6)),pet={uid,sp:key,lv:1,form:0,exp:0,pts:{},free:0,hp:1,mp:1},st=calcPet(pet);pet.hp=st.hp;pet.mp=st.mp;return {category:'solarBeast',key,type:'pet',pet,guaranteedSolar:true};}

function gachaCombinedPity_(code){const rows=sheet_('GachaTransactions',COMMUNITY_LEDGER).getDataRange().getValues().slice(1).filter(r=>r[1]===code&&r[3]==='done').map(r=>JSON.parse(r[2])).sort((a,b)=>a.revision-b.revision);let pity=0;for(const tx of rows){if(tx.gachaPityVersion>=2&&Number.isInteger(tx.legendPity)&&tx.legendPity>=0&&tx.legendPity<100){pity=tx.legendPity;continue;}for(const reward of (tx.rewards||[]).filter(r=>!r.guaranteedEclipse).slice(0,tx.count||10))pity=reward.category==='legendBeast'||isEclipseReward(reward)?0:Math.min(99,pity+1);}return pity;}
const gachaEclipseViewBase=communityGachaView_;communityGachaView_=function(code,rewards){const result=gachaEclipseViewBase(code,rewards);result.legendPity=gachaCombinedPity_(code);result.gachaRulesVersion=3;result.solarPity=gachaSolarPity_(code);result.solarGuarantee=300;result.sharedGuarantee=100;return result;};

// Combat selections never change the persisted travelling party.
function raidPetLimit_(raw){return baseOf(raw.cls)==='summoner'?3:1;}
function campInputPets_(raw,input){carryNormalize_(raw);const ids=Array.isArray(input)?input:[Number(input)];if(!ids.length||ids.length>raidPetLimit_(raw)||new Set(ids).size!==ids.length||ids.some(id=>!Number.isInteger(id)||!raw.carried.includes(id)))pvpFail_('camp pets selection');return ids;}
function campDefenseIds_(raw,c){carryNormalize_(raw);return [...new Set(Array.isArray(c.pets)?c.pets:[c.pet])].filter(id=>raw.carried.includes(id)).slice(0,raidPetLimit_(raw));}
function guildCombatTeam_(raw,seat){const p=JSON.parse(JSON.stringify(raw));carryNormalize_(p);p.party=[...new Set([...p.party,...p.carried])].slice(0,raidPetLimit_(p));return pvpTeam_(p,seat,'guildwar');}
campTeam_=function(raw,input,seat){const p=JSON.parse(JSON.stringify(raw)),ids=campInputPets_(p,input);p.party=ids;p.carried=ids;return pvpTeam_(p,seat,'raid');};

// One carried-beast defense registration protects both camp and guild war.
function requireDefense_(raw,code){const ids=campDefenseIds_(raw,campState_(code));if(!ids.length)pvpFail_('defense required');return ids;}
const registeredGuildView=guildView_;guildView_=function(code,query,page){const view=registeredGuildView(code,query,page);let pets=[];try{pets=campDefenseIds_(campRaw_(code).P,campState_(code));}catch(e){}view.defense={ready:pets.length>0,pets};return view;};

// Only the server decides when a manual turn expires. Existing room ledgers remain intact.
const timedPvpExpireBase=pvpExpire_;
pvpExpire_=function(r){if(timedPvpExpireBase(r))return true;if(r.raid||r.status!=='active')return false;
 if(r.turnTimerVersion!==1){r.turnTimerVersion=1;r.deadline=Math.min(r.expires,Date.now()+PVP_TURN_MS);r.rev++;return true;}
 if(Date.now()<r.deadline)return false;
 const actor=[...r.battle.allies,...r.battle.enemies].find(u=>u.id===r.battle.cur),player=actor&&r.players[actor.owner];
 if(!player||player.auto)return false;
 player.auto=true;r.battle.log.push('⌛ ไม่เลือกคำสั่งครบ 30 วินาที เปิดออโต้ให้ '+player.name);
 return pvpAutoStep_(r,true);
};

function towerTreasureGear_(id,P){const it=EQ[id];return !!it&&!it.legend&&!it.worldLegend&&(it.lv||1)<=Math.max(5,P.lv)&&(it.slot!=='weapon'||it.wt===clsWeapon(P.cls));}
// Tower attempts share the existing transactional, private GuildState ledger.
const TOWER_ORDER=NPC.map((n,i)=>({i,lv:n.lv})).sort((a,b)=>a.lv-b.lv||a.i-b.i).map(n=>n.i);
function towerDay_(){return new Date(Date.now()+25200000).toISOString().slice(0,10);}
function towerRecord_(code){return guildRead_('tw:'+code,{best:0,active:false,day:''});}
function towerPublic_(t){return {id:t.id||'',day:t.day||'',active:!!t.active,floor:t.floor||1,cleared:t.cleared||0,best:t.best||0,total:TOWER_ORDER.length,outcome:t.outcome||'',carried:t.carried||[],restPending:t.restPending||0,lastCouponFloor:t.lastCouponFloor||0,lastCouponReward:t.lastCouponReward||0};}
function towerRecover_(code,t,mode){const raw=campRaw_(code),P=raw.P,old=S;S={P};try{let reward=null;const st=pStats(),pets=P.pets||[],carried=pets.filter(p=>(t.carried||[]).includes(p.uid));
 if(mode==='all'){P.ailments={};pets.forEach(p=>p.ailments={});P.hp=st.hp;P.mp=st.mp;for(const p of pets){const q=calcPet(p);p.hp=q.hp;p.mp=q.mp;}}
 else if(mode==='treasure'){const pool=Object.keys(EQ).filter(k=>towerTreasureGear_(k,P));reward={id:t.id+':treasure:'+t.restPending,gear:pool[R(0,pool.length-1)],gold:150+t.restPending*30};P.owned=P.owned||[];P.owned.push(reward.gear);P.gold+=reward.gold;P.towerTreasureApplied=reward.id;}
 else if(mode==='cleanse'){for(const o of [P,...pets]){o.ailments={};if(o.hp>0){const q=o===P?st:calcPet(o);o.hp=Math.min(q.hp,o.hp+Math.round(q.hp*.1));o.mp=Math.min(q.mp,o.mp+Math.round(q.mp*.1));}}}
 else if(mode==='spring'){P.hp=Math.min(st.hp,P.hp+Math.round(st.hp*.35));P.mp=Math.min(st.mp,P.mp+Math.round(st.mp*.35));for(const p of carried)if(p.hp>0){const q=calcPet(p);p.hp=Math.min(q.hp,p.hp+Math.round(q.hp*.35));p.mp=Math.min(q.mp,p.mp+Math.round(q.mp*.35));}}
 else{const down=carried.filter(p=>p.hp<=0);if(down.length){for(const p of down){const q=calcPet(p);p.hp=q.hp;p.mp=Math.round(q.mp*.5);}}else{const candidates=[{o:P,s:st},...carried.map(p=>({o:p,s:calcPet(p)}))].filter(x=>x.o.hp>0&&x.o.hp<x.s.hp).sort((a,b)=>a.o.hp/a.s.hp-b.o.hp/b.s.hp),x=candidates[0];if(x)x.o.hp=Math.min(x.s.hp,x.o.hp+Math.round(x.s.hp*.5));}}
 const id=t.id+':'+(mode==='all'?(t.active?'entry':'exit'):'rest:'+t.restPending);const recovery={id,reward,cleanse:mode==='cleanse',hp:P.hp,mp:P.mp,pets:pets.map(p=>({uid:p.uid,hp:p.hp,mp:p.mp}))};P.towerRecoveryApplied=id;communityRawWrite_(code,raw);t.recovery=recovery;return recovery;
 }finally{S=old;}}
function towerDispatch_(d){const {code,P}=pvpSaveAuth_(d);communityAllowed_(code);let t=towerRecord_(code);
 if(d.action==='tower_enter'){
  if(t.active)return {ok:true,run:towerPublic_(t),coupons:communityCoupon_(code).coupons,recovery:t.recovery||null,today:towerDay_()};
  if(t.day===towerDay_())pvpFail_('tower daily limit');
  if(pvpFindActive_(code)||wbExisting_(code))pvpFail_('finish other battle');
  t={id:pvpId_(),day:towerDay_(),active:true,floor:1,cleared:0,best:t.best||0,couponFloor:t.couponFloor??t.best??0,pid:P.pid||'',carried:[...(P.carried||[])],outcome:'',restPending:0};towerRecover_(code,t,'all');guildWrite_('tw:'+code,t);
 }else if(d.action==='tower_result'){
  if(!t.id||t.id!==String(d.run))pvpFail_('tower wrong run');
  const floor=Number(d.floor);if(!Number.isInteger(floor)||floor<1||floor>TOWER_ORDER.length)pvpFail_('tower wrong floor');
  if(floor<=t.cleared||!t.active)return {ok:true,run:towerPublic_(t),coupons:communityCoupon_(code).coupons,recovery:t.recovery||null,today:towerDay_()};
  if(t.restPending)pvpFail_('tower rest required');
  if(floor!==t.floor||!['win','lose'].includes(d.outcome))pvpFail_('tower wrong floor');
  if(d.outcome==='win'){t.lastCouponFloor=floor;t.lastCouponReward=0;if(floor>(t.couponFloor??t.best??0)){const c=communitySyncCredits_(code);c.coupons+=2;communityWriteCoupon_(c);t.couponFloor=floor;t.lastCouponReward=2;}t.cleared=floor;t.best=Math.max(t.best||0,floor);t.floor=floor+1;if(floor===TOWER_ORDER.length){t.active=false;t.outcome='clear';}else if(floor%5===0)t.restPending=floor;}
  else{t.active=false;t.outcome='lose';}
  if(!t.active)towerRecover_(code,t,'all');guildWrite_('tw:'+code,t);
 }else if(d.action==='tower_surrender'){
  if(!t.id||t.id!==String(d.run))pvpFail_('tower wrong run');
  if(t.active){t.active=false;t.outcome='surrender';t.restPending=0;towerRecover_(code,t,'all');guildWrite_('tw:'+code,t);}
 }else if(d.action==='tower_rest'){
  if(t.id!==String(d.run)||!['spring','revival','cleanse','treasure'].includes(d.choice))pvpFail_('tower wrong run');
  if(t.restPending){towerRecover_(code,t,d.choice);t.restPending=0;guildWrite_('tw:'+code,t);}
  else if(!t.recovery?.id?.includes(':rest:'))pvpFail_('tower no rest');
 }else if(d.action!=='tower_status')pvpFail_('bad action');
 return {ok:true,run:towerPublic_(t),today:towerDay_(),coupons:communityCoupon_(code).coupons,recovery:t.recovery||null};
}
const towerDoPost=doPost;
doPost=function(e){let d;try{d=JSON.parse(e.postData.contents);}catch{return towerDoPost(e);}
 try{if(String(d.action||'').startsWith('tower_'))return json_(towerDispatch_(d));
  if(d.code&&towerRecord_(code_(d.code)).active&&(/^(pvp_create|pvp_join|wb_create|wb_join|camp_begin|gacha_draw|guild_war_attack|friend_challenge|friend_accept)$/.test(d.action)))return json_({ok:false,error:'tower locked'});
 }catch(error){return json_({ok:false,error:error.message||String(error)});}return towerDoPost(e);
};
const towerSaveGame=saveGame_;
saveGame_=function(d){try{const t=towerRecord_(code_(d.code)),data=JSON.parse(d.data||'{}');if(data.P){data.P.towerBest=t.best||0;d={...d,data:JSON.stringify(data)};}return towerSaveGame(d);}catch(error){return json_({ok:false,error:error.message||String(error)});}};
const towerLoadGame=loadGame_;
loadGame_=function(d){const result=JSON.parse(towerLoadGame(d).getContent());if(result.ok){const data=JSON.parse(result.data),t=towerRecord_(code_(d.code));data.P.towerBest=t.best||0;result.data=JSON.stringify(data);result.tower=towerPublic_(t);}return json_(result);};
const towerDoGet=doGet;
doGet=function(){const result=JSON.parse(towerDoGet().getContent()),ranks=new Map(guildRows_('tw:').filter(t=>t.pid).map(t=>[String(t.pid).slice(-6),t.best||0]));result.rows=result.rows.map(r=>({...r,towerBest:ranks.get(r.pid)||0}));return json_(result);};

// Shared by the browser and authoritative API; inventory IDs and saved stats stay intact.
const ARMOR_ELEMENTS_V4={armor_0:['normal'],armor_1:['ground'],armor_2:['water'],armor_3:['dragon'],armor_4:['steel'],armor_5:['dark'],crown_0:['normal'],crown_1:['rock'],crown_2:['ice'],crown_3:['dragon'],crown_4:['psychic'],crown_5:['fairy'],crown_eagle:['flying'],crown_sage:['psychic'],armor_berserk:['fighting'],armor_dragon:['dragon','fire'],crown_pierce:['ground'],armor_saint:['fairy'],lg1_armor:['grass'],lg1_crown:['electric'],lg2_armor:['flying'],lg2_crown:['electric','ghost'],lg3_armor:['ghost'],lg3_crown:['ground','fighting'],lg4_armor:['water','dragon'],lg4_crown:['dragon'],lg5_armor:['ground'],lg5_crown:['psychic','fairy'],lg6_armor:['dark','fighting'],lg6_crown:['dark','psychic'],wl_armor:['steel'],wl_crown:['fairy']};
for(const [id,it]of Object.entries(EQ))if(['armor','crown'].includes(it.slot)){const types=ARMOR_ELEMENTS_V4[id]||(it.craft&&SP[it.craft]?.t)||['normal'];it.defTypes=[...new Set(types.map(k=>k==='steel'&&it.lv<30?'rock':k))].filter(k=>EL[k]);if(!it.defTypes.length)it.defTypes=['normal'];}
function equipmentElements(eq){const types=[...new Set(['armor','crown'].flatMap(slot=>EQ[eq?.[slot]]?.defTypes||[]))];return types.length?types:['normal'];}
function areaTotalBudget(count){return Math.min(1.5,.5+.25*Math.max(1,count));}
function areaDamageScale(sk,count){return areaTotalBudget(count)/Math.max(1,count)*(sk.ct?2:1);}
for(const sk of Object.values(SK))if(sk.all&&['p','m','h','auto'].includes(sk.t)){sk.pw=sk.basePower||sk.pw;sk.areaScale=null;}
// Strong forms retain their role, with a cost for sustained burst and area pressure.
FORMS.moon.m.matk=1.45;FORMS.moon.m.mdef=1.3;SK.f_moonbeam.mp=24;SK.f_moonbeam.cd=2;
FORMS.saber.m.patk=1.65;FORMS.saber.m.crit=1.5;FORMS.gdragon.m.patk=1.45;FORMS.gdragon.m.matk=1.45;
SK.gs_infinite.pw=68;SK.ke_thousand.pw=80;SK.sbs_unite.bf={patk:.3,matk:.3,crit:.3};
PAS.arcaneMastery={n:'เชี่ยวชาญมหาเวท',d:'สกิลโจมตีเวทแรงขึ้น 15% แม้ธาตุไม่ตรงกับอาวุธ'};
CLS.archmage.pas=CLS.archmage.pas.filter(k=>k!=='adapt').concat('arcaneMastery');
if(!CLS.gladiator.pas.includes('counter'))CLS.gladiator.pas.push('counter');
if(!CLS.gladiator.pas.includes('thorns'))CLS.gladiator.pas.push('thorns');
SK.th_ambush.charge=1.65;SK.th_ambush.bf.eva=.35;
// Solo Demon Lord encounter: support underperforming final careers without changing PVP or other stages.
const SOLO_DEMON_CAREER_DAMAGE={"shogun":1.75,"dirge":1.3,"archmage":1.6,"elementalist":1.95};
function soloDemonCareerFactor(u){return B()?.kind==='boss'&&Number(B().meta)===6&&u.kind==='player'&&!u.temporary?(SOLO_DEMON_CAREER_DAMAGE[u.cls]||1):1;}
function gunnerBossBountyFactor(u,t){return u.kind==='player'&&!u.temporary&&u.cls&&baseOf(u.cls)==='gunner'&&u.lv>=55&&t?.boss?1.6:1;}
function classCombatFactor(u,t,sk){const type=sk.t==='auto'?u.atkType:sk.t;let f=t.boss&&['pet','npcpet'].includes(u.kind)?.7:1;if(isBalancedPvp()&&u.kind==='pet'){const n=Math.max(1,sideOf(u).filter(x=>x.kind==='pet'&&x.owner===u.owner&&x.hp>0).length);const hero=sideOf(u).find(x=>x.kind==='player'&&x.owner===u.owner),growth=hero?.cls&&baseOf(hero.cls)==='summoner'?.35:.15;f*=(1+growth*(n-1))/n;if(t.kind==='player')f*=.7;}if(u.cls&&baseOf(u.cls)==='thief'&&['p','h'].includes(type)){if(t.cls){const victim=baseOf(t.cls);if(['mage','gunner','archer'].includes(victim))f*=isBalancedPvp()?1.15:1.25;else if(['gladiator','druid'].includes(victim))f*=isBalancedPvp()?.7:.4;}}
if(u.cls&&t.cls&&baseOf(t.cls)==='gladiator'&&['mage','archer'].includes(baseOf(u.cls)))f*=isBalancedPvp()?1.2:1.35;
if(isBalancedPvp()){if(u.cls==='packlord')f*=.75;if(t.cls==='packlord')f*=1.25;}
if(isBalancedPvp()&&u.cls&&baseOf(u.cls)==='mage'&&type==='m')f*=1.15;
if(u.cls==='gunsaint'&&type==='p')f*=.95;if(hasPas(u,'arcaneMastery')&&type==='m')f*=1.15;return f*soloDemonCareerFactor(u)*gunnerBossBountyFactor(u,t);}
const elementsPlayerUnit=playerUnit;playerUnit=function(){const u=elementsPlayerUnit();u.defenseTypes=equipmentElements(S.P.eq);u.types=u.defenseTypes.slice();return u;};
const elementsHumanUnit=humanUnit;humanUnit=function(name,cls,lv,i){const u=elementsHumanUnit(name,cls,lv,i);u.defenseTypes=equipmentElements(npcEq(cls,lv));u.types=u.defenseTypes.slice();return u;};

function minimumHitChance(u,t){return u.cls&&t.cls&&['gladiator','druid'].includes(baseOf(u.cls))&&baseOf(t.cls)==='thief'?80:u.boss?40:25;}

if(!CLS.druid.pas.includes('thorns'))CLS.druid.pas.push('thorns');
function rogueCritBlocked(u,t){return !!(u.cls&&t.cls&&baseOf(u.cls)==='thief'&&baseOf(t.cls)==='druid');}

function frontlinePierce(u,t){return u.cls&&t.cls&&baseOf(u.cls)==='archer'&&baseOf(t.cls)==='gladiator'?.3:0;}

SK.sbw_doom.pw=460;SK.sbw_doom.basePower=460;SK.sbw_doom.pi=.3;SK.sbw_doom.mp=20;
// Deterministic pressure estimate: autoplay respects armor elements and the same area budget.
function combatSkillScore(u,id,target,targets=foesOf(u).filter(x=>x.hp>0)){
 const sk=pvpSkill(id);if(!sk||!['p','m','h','auto'].includes(sk.t)||!targets.length)return 0;
 const type=sk.t==='auto'?u.atkType:sk.t,atk=type==='h'?(eff(u,'patk')+eff(u,'matk'))/2:eff(u,type==='m'?'matk':'patk'),list=sk.all?targets:sk.rt?targets:[target||targets[0]];
 let score=0;for(const t of list){if(type===t.immune&&type!=='h')continue;const m=attackMultiplier(u,sk,t);if(!m)continue;let def=type==='h'?(eff(t,'pdef')+eff(t,'mdef'))/2:eff(t,type==='m'?'mdef':'pdef');if(sk.trueD)def=0;def*=1-Math.min(.8,(sk.pi||0)+(hasPas(u,'pierce')?.25:0)+frontlinePierce(u,t));const stab=sk.el&&(hasPas(u,'omni')||u.stab.includes(sk.el)||u.types.includes(sk.el)||u.form&&FORMS[u.form].t.includes(sk.el))?(hasPas(u,'adapt')?1.5:1.25):1,crit=classRefreshStealthCrit(u)?1:hasPas(t,'nocrit')||rogueCritBlocked(u,t)?0:Math.min(isBalancedPvp()?65:100,eff(u,'crit')+(sk.cb||0))/100;let d=1.4*atk*(sk.pw/100)*atk/(atk+def)*m*stab*(sk.all?areaDamageScale(sk,targets.length):1)*(sk.hits||1)*(u.charge||1)*(1+crit*((hasPas(u,'deadly')?(isBalancedPvp()?1.7:2):1.5)-1))*classCombatFactor(u,t,sk)*pvpDamageFactor(u,t);if(type==='h'&&t.immune)d*=.5;if(hasPas(t,'thick')&&(attackHasElement(u,sk,'fire')||attackHasElement(u,sk,'ice')))d*=.5;if(sideOf(t).some(x=>x.hp>0&&hasPas(x,'guardian')))d*=.9;d*=sk.acc>=100?1:hitChance(u,t,sk)/100;score+=d;}
 return score/(sk.ct?2:1)/(sk.rt?targets.length:1);
}

// Shared by local autoplay and the authoritative online battle engine.
function chooseAutoForm(u){
 if(u.form||u.hp<=0)return null;
 const foes=foesOf(u).filter(x=>x.hp>0);if(!foes.length)return null;
 if(u.hp/u.st.hp<.35&&u.skills.some(id=>SK[id]?.t==='heal'&&!cooldownOf(u,id)&&costOf(u,SK[id])<=u.mp))return null;
 const forms=u.skills.filter(id=>SK[id]?.t==='form'&&FORMS[SK[id].form]&&!cooldownOf(u,id)&&costOf(u,SK[id])<=u.mp);
 const score=id=>{const f=FORMS[SK[id].form],m=f.m;let best=0;for(const key of f.sk){const sk=SK[key];if(!sk||!['p','m','h','auto'].includes(sk.t))continue;const ty=sk.t==='auto'?u.atkType:sk.t,pa=u.st.patk*(m.patk||1),ma=u.st.matk*(m.matk||1),atk=ty==='m'?ma:ty==='h'?(pa+ma)/2:pa;best=Math.max(best,...foes.map(t=>atk*(sk.pw||100)/100*attackMultiplier(u,sk,t)*(sk.all?Math.min(1.5,foes.length):1)));}return best+(u.st.pdef*(m.pdef||1)+u.st.mdef*(m.mdef||1))*(u.hp/u.st.hp<.5?.6:.15);};
 return forms.sort((a,b)=>score(b)-score(a))[0]||null;
}

const autoFormPrevious=pvpAutoChoice_;pvpAutoChoice_=function(u){const id=chooseAutoForm(u);return id?{id,target:foesOf(u).find(x=>x.hp>0),friend:u}:autoFormPrevious(u);};

// Stat budget at equal level, before allocated points. Roles and accuracy/evasion stay distinct.
const BEAST_TIER_BUDGET=[.70,.82,.96,1.12,1.32,1.56,1.85];
function beastPowerTier(sp,form=0){if(sp.solar)return 7;if(sp.legendary)return 6;if(sp.rare)return 5;const stages=(sp.ev||[]).length+1;if(stages>=3)return form>=2?4:form===1?3:0;if(stages===2)return form>=1?4:1;return 2;}
function beastOriginZone(id){const sp=SP[id];if(sp.mistZone)return sp.mistZone;if(sp.legendary&&sp.rarePair)return beastOriginZone(sp.rarePair);const z=ZN.filter(z=>[...z.sp,...z.rare,...(z.bosses||[z.boss]).map(b=>b.sp)].includes(id));return z.length?Math.min(...z.map(z=>z.id)):1;}
function beastStatPower(s){return s.hp/10+Math.max(s.patk,s.matk)*2+(s.pdef+s.mdef)*.7+s.spd*.4+s.mp*.1;}
function beastBudget(lv,wild=1){const n=(lv-1)*wild;return 50*(1+.2*n)/10+14*(1+.17*n)*2+20*(1+.17*n)*.7+10*(1+.08*n)*.4+20*(1+.12*n)*.1;}
const beastBudgetPrevious=calcPet;
calcPet=function(p,wild=1){if(SP[p.sp].solar){const s=calcPet({...p,sp:SP[p.sp].solarPair,form:0},wild);for(const k of K)s[k]=Math.round(s[k]*1.3);return s;}const result=beastBudgetPrevious(p,wild);if(p.sp==='demonlord')return result;const base=beastBudgetPrevious({...p,pts:{}},wild),tier=beastPowerTier(SP[p.sp],p.form||0),zone=Math.max(1,Math.min(7,beastOriginZone(p.sp))),target=beastBudget(p.lv,wild)*BEAST_TIER_BUDGET[tier]*(1+.012*(zone-1)),scale=target/beastStatPower(base);for(const key of ['hp','mp','patk','matk','pdef','mdef','spd'])result[key]=Math.max(1,Math.round(base[key]*scale+(result[key]-base[key])));return result;};

// Pure decision helper: never spend money, create units or consume RNG while choosing.
function chooseAutoSummon(u){
 const b=B();if(!b||b.over||b.kind==='world'||b.kind==='pvp'&&b.turns>=26||!u||u.hp<=0||u.temporary||!['player','human'].includes(u.kind))return null;
 const mates=sideOf(u),alive=mates.filter(x=>x.hp>0),foes=foesOf(u).filter(x=>x.hp>0);
 if(!foes.length||!battleHasRoom(u))return null;
 // Let the existing healer policy handle emergencies before investing a turn.
 if(u.skills.some(id=>{const s=SK[id];return s?.t==='heal'&&!cooldownOf(u,id)&&costOf(u,s)<=u.mp&&(s.tg==='self'?[u]:alive).some(x=>x.hp/x.st.hp<.4);}))return null;
 const ids=['shadow_clone','summon_golem','hire_merc'].filter(id=>u.skills.includes(id)&&SK[id]&&!cooldownOf(u,id)&&costOf(u,SK[id])<=u.mp);
 if(!ids.length)return null;
 const bestHit=Math.max(0,...u.skills.filter(id=>SK[id]&&['p','m','h','auto'].includes(SK[id].t)&&!cooldownOf(u,id)&&costOf(u,SK[id])<=u.mp).map(id=>combatSkillScore(u,id,foes[0],foes)));
 const remaining=foes.reduce((n,x)=>n+x.hp,0),maximum=foes.reduce((n,x)=>n+x.st.hp,0);
 if(remaining<=bestHit*1.25||remaining/Math.max(1,maximum)<.3)return null;
 for(const id of ids){
  const prefix=u.id+'_summon_';if(alive.some(x=>x.temporary&&String(x.id).startsWith(prefix)))continue;
  if(id==='hire_merc'){
   const wallet=u.kind==='player'||u.owner!=null?S.P:u;
   if(!Number.isFinite(wallet?.gold)||Math.floor(wallet.gold*.1)<1||b.autoMercHires?.[u.id])continue;
  }
  return id;
 }
 return null;
}
// Record successful hires, including manual hires, so autoplay cannot repeatedly spend 10%.
const autoSummonActPrevious=act;
act=function(u,id,...args){const ok=autoSummonActPrevious(u,id,...args);if(ok&&id==='hire_merc'){const b=B();if(b)(b.autoMercHires??={})[u.id]=true;}return ok;};

const autoSummonOnlinePrevious=pvpAutoChoice_;
pvpAutoChoice_=function(u){const id=chooseAutoSummon(u);return id?{id,target:foesOf(u).find(x=>x.hp>0),friend:u}:autoSummonOnlinePrevious(u);};

// Lv10 class abilities. Transient battle state is serialized with units/buffs, never the save's base stats.
PAS.class10_barrier={n:'บาเรียเวทย์ · Lv10',d:'เริ่มการต่อสู้ ป้องกันท่าโจมตีกายภาพ เวท หรือผสมได้ 1 ท่า รวมทุกฮิต'};
PAS.class10_range={n:'ทิ้งระยะห่าง · Lv10',d:'ได้ลำดับแรกในรอบเปิดการต่อสู้ หากเจอสายมือปืนด้วยกันวัดความเร็ว'};
PAS.class10_parry={n:'ตั้งสมาธิปัดป้อง',d:'ป้องกันท่าโจมตี 1 ท่า รวมทุกฮิต แล้วสมาธิหาย ระยะเวลา 3 เทิร์น'};
PAS.class10_stealth={n:'ล่องหน',d:'ไม่เป็นเป้าท่าเดี่ยว 3 เทิร์น โดนท่าหมู่ได้ หายเมื่อเริ่มโจมตี ใช้บัฟและยาได้'};
SK.class10_parry={n:'ตั้งสมาธิปัดป้อง',t:'buff',tg:'self',pas:'class10_parry',tn:3,mp:8,cd:2};
SK.class10_stealth={n:'ล่องหน',t:'buff',tg:'self',pas:'class10_stealth',tn:3,mp:10,cd:5};
CLS.swordsman.sk.push([10,'class10_parry']);CLS.archer.sk.push([10,'class10_stealth']);
CLS.mage.pas.push('class10_barrier');CLS.gunner.pas.push('class10_range');
function class10Invisible(u){return !!u&&u.hp>0&&(u.buffs||[]).some(x=>x.pas==='class10_stealth'&&x.tn>0);}
function class10Offensive(sk){return !!sk&&['p','m','h','auto','status','debuff'].includes(sk.t);}
function class10Damaging(sk){return !!sk&&['p','m','h','auto'].includes(sk.t);}
function class10VisibleFoes(u){return foesOf(u).filter(x=>x.hp>0&&!class10Invisible(x));}
function class10OpeningOrder(a,b,battle=B()){
 if(battle?.round!==1||!a||!b)return 0;
 const first=u=>u.lv>=10&&!u.temporary&&hasPas(u,'class10_range');
 const aa=first(a),bb=first(b);if(aa!==bb)return aa?-1:1;
 return aa&&bb?eff(b,'spd')-eff(a,'spd'):0;
}
const class10UnitPrevious=unit;
unit=function(o){const u=class10UnitPrevious(o);if(u.lv<10)u.pas=u.pas.filter(k=>!['class10_barrier','class10_range'].includes(k));
 if(!u.class10Initialized){u.class10Initialized=true;if(u.lv>=10&&!u.temporary&&hasPas(u,'class10_barrier'))u.class10Barrier=1;}
 return u;
};
// One context per skill execution: blocking a multihit skill consumes one charge, not one per hit.
const class10AttackContexts=[];
function class10BlockedAlready(u,t){return !!class10AttackContexts.at(-1)?.blocked.has(t.id+'|'+u.id);}
function class10BlockHit(u,sk,t,damaging){
 if(class10BlockedAlready(u,t))return true;
 const parry=(t.buffs||[]).some(x=>x.pas==='class10_parry'&&x.tn>0),barrier=damaging&&t.class10Barrier>0;
 if(!parry&&!barrier)return false;
 if(parry)t.buffs=t.buffs.filter(x=>x.pas!=='class10_parry');else t.class10Barrier=0;
 class10AttackContexts.at(-1)?.blocked.add(t.id+'|'+u.id);
 blog(t.name+' ใช้ '+(parry?'ตั้งสมาธิปัดป้อง':'บาเรียเวทย์')+' ป้องกัน '+sk.n);vfx('buff',t.id);return true;
}
const class10HitPrevious=hitOne;
hitOne=function(u,sk,t,...args){
 if(!t||class10BlockedAlready(u,t)||class10Invisible(t)&&!sk.all)return;
 if(class10Damaging(sk))u.buffs=u.buffs.filter(x=>x.pas!=='class10_stealth');
 const own=!class10AttackContexts.length;if(own)class10AttackContexts.push({blocked:new Set()});
 try{return class10HitPrevious(u,sk,t,...args);}finally{if(own)class10AttackContexts.pop();}
};
const class10ActPrevious=act;
act=function(u,id,target,friend,free){
 const sk=SK[id];if(!sk)return false;
 if(class10Offensive(sk)&&!sk.all){const visible=class10VisibleFoes(u);if(!visible.length){blog('ไม่มีเป้าหมายเดี่ยวที่มองเห็นได้');return false;}if(class10Invisible(target)){if(!sk.rt){blog('เป้าหมายกำลังล่องหน');return false;}target=visible[0];}}
 const before=(u.buffs||[]).slice();if(class10Damaging(sk)&&!cooldownOf(u,id)&&costOf(u,sk)<=u.mp)u.buffs=u.buffs.filter(x=>x.pas!=='class10_stealth');
 class10AttackContexts.push({blocked:new Set()});
 try{const ok=class10ActPrevious(u,id,target,friend,free);if(!ok)u.buffs=before;return ok;}finally{class10AttackContexts.pop();}
};
// The chooser must never repeatedly select an untargetable single-target action.
function class10AutoMove(u,move){
 const sk=SK[move.id];if(!class10Offensive(sk)||sk.all)return move;
 const visible=class10VisibleFoes(u);if(visible.length){if(!move.target||class10Invisible(move.target))move.target=visible.find(x=>x.taunt>0)||visible[0];return move;}
 const area=u.skills.find(id=>SK[id]?.all&&class10Damaging(SK[id])&&!cooldownOf(u,id)&&costOf(u,SK[id])<=u.mp);
 return area?{id:area,target:foesOf(u).find(x=>x.hp>0),friend:u}:{id:'rest',target:null,friend:u};
}
function class10AutoDefense(u){
 if(u.hp<=0||u.temporary||u.hp/u.st.hp>.65||!foesOf(u).some(x=>x.hp>0))return null;
 if(u.skills.some(id=>SK[id]?.t==='heal'&&!cooldownOf(u,id)&&costOf(u,SK[id])<=u.mp&&u.hp/u.st.hp<.4))return null;
 const id=u.skills.includes('class10_parry')?'class10_parry':u.skills.includes('class10_stealth')?'class10_stealth':null;
 return id&&!hasPas(u,id)&&!cooldownOf(u,id)&&costOf(u,SK[id])<=u.mp?id:null;
}
function applyClass10Replay(b,f){
 for(const u of f.spawns||[])if(![...b.allies,...b.enemies].some(x=>x.id===u.id))(u.side==='ally'?b.allies:b.enemies).push(JSON.parse(JSON.stringify(u)));
 if(f.enemyIds)b.enemies=f.enemyIds.map(id=>b.enemies.find(u=>u.id===id)).filter(Boolean);
 if(f.allyIds)b.allies=f.allyIds.map(id=>b.allies.find(u=>u.id===id)).filter(Boolean);
 for(const [id,barrier,buffs] of f.class10Units||[]){const u=[...b.allies,...b.enemies].find(x=>x.id===id);if(u){u.class10Barrier=barrier;u.buffs=JSON.parse(JSON.stringify(buffs));}}
}

const class10OnlinePrevious=pvpAutoChoice_;pvpAutoChoice_=function(u){const id=class10AutoDefense(u);return class10AutoMove(u,id?{id,target:foesOf(u).find(x=>x.hp>0),friend:u}:class10OnlinePrevious(u));};
const class10WorldPrevious=wbAuto_;wbAuto_=function(u){const id=class10AutoDefense(u);return id?{id,friend:u.id}:class10WorldPrevious(u);};
const class10ReplayPrevious=replayFrame_;replayFrame_=function(r){class10ReplayPrevious(r);if(!r.replay?.frames?.length)return;const f=r.replay.frames.at(-1),memo=r._replayUnits||(r._replayUnits={});f.class10Units=[];for(const u of [...r.battle.allies,...r.battle.enemies]){const value=JSON.stringify([u.class10Barrier||0,u.buffs||[]]),key='c10:'+u.id;if(memo[key]!==value){f.class10Units.push([u.id,...JSON.parse(value)]);memo[key]=value;}}};

// Requested follow-up balance: free druid forms, desperation, stronger clones, stealth criticals.
// Summoner line: one companion in exchange for a second life, inherited by every promotion.
PAS.summoner_soul_exchange={n:'สัญญาแลกวิญญาณ',d:'เมื่อหมดสติ ฟื้น HP 30% ได้ 1 ครั้งต่อการต่อสู้ แลกกับคู่หูที่ยังมีชีวิต 1 ตัว (เลือก HP ปัจจุบันน้อยสุด) ไม่นับตัวอัญเชิญชั่วคราว; พาสซีฟฟื้นคืนชีพเดิมทำงานก่อน'};
CLS.summoner.pas.push('summoner_soul_exchange');




PAS.class10_desperation={n:'พลังฮึดสู้ · Lv10',d:'ดาเมจโจมตีเพิ่ม 1% ต่อ HP สูงสุดที่เสียไปทุก 1% สูงสุดเกือบ 100% เมื่อใกล้หมดสติ'};
CLS.gladiator.pas.push('class10_desperation');
const classRefreshUnit=unit;unit=function(o){const u=classRefreshUnit(o);if(u.lv<10)u.pas=u.pas.filter(k=>k!=='class10_desperation');return u;};
const classRefreshFactor=classCombatFactor;classCombatFactor=function(u,t,sk){const f=classRefreshFactor(u,t,sk);return class10Damaging(sk)&&hasPas(u,'class10_desperation')&&u.st?.hp>0&&Number.isFinite(u.hp)?f*(1+Math.max(0,Math.min(1,1-u.hp/u.st.hp))):f;};
// PVP Lv60 career balance: same coefficients for every gear set and opponent.
const PVP_CAREER_BALANCE={"templar":{"out":1.55,"incoming":0.9,"pet":1.55},"eternal":1.4,"warlord":{"out":1.5,"incoming":0.85,"pet":1.5},"bloodwar":{"out":1.75,"incoming":0.85,"pet":1.75},"sniper":{"out":1.08,"incoming":0.78,"pet":1.08},"maestro":{"out":1.22,"incoming":0.78,"pet":1.22},"bounty":1.15,"archdruid":0.78,"beastking":{"out":0.82,"incoming":0.9,"pet":0.82},"soulsage":{"out":0.93,"incoming":0.95,"pet":0.93},"sealmaster":{"out":1.05,"pet":0.83,"incoming":0.9},"wildgod":0.88,"ronin":1.15,"cannoneer":1.1,"demolisher":1.15,"spiritlord":{"out":0.97,"incoming":0.95,"pet":0.97},"dirge":1.17,"packlord":1.08,"masterthief":1.08,"ninja":1.05};
function pvpCareerOutgoing(u){if(!isBalancedPvp())return 1;const hero=u.kind==='pet'?sideOf(u).find(x=>x.kind==='player'&&x.owner===u.owner):u;const a=PVP_CAREER_BALANCE[hero?.cls];return typeof a==='number'?a:(u.kind==='pet'?a?.pet:a?.out)||1;}
function pvpCareerIncoming(t){return isBalancedPvp()&&t.kind==='player'?(PVP_CAREER_BALANCE[t.cls]?.incoming||1):1;}
const careerBalancedAttack=classCombatFactor;classCombatFactor=function(u,t,sk){return careerBalancedAttack(u,t,sk)*pvpCareerOutgoing(u);};
const careerBalancedDefense=pvpDamageFactor;pvpDamageFactor=function(u,t){return careerBalancedDefense(u,t)*pvpCareerIncoming(t);};

const classRefreshActions=[];
function classRefreshStealthCrit(u){const context=classRefreshActions.at(-1);return !!(context?.id===u.id&&context.crit)||!!(u.cls&&baseOf(u.cls)==='archer'&&class10Invisible(u));}
function takeFreeForm(u){if(!u?.freeFormPending)return false;u.freeFormPending=false;return true;}
const classRefreshAct=act;act=function(u,id,target,friend,free){
 const sk=SK[id],druid=!!(u.cls&&baseOf(u.cls)==='druid'),freeForm=(druid&&sk?.t==='form'&&!u.form&&!u.freeFormUsed&&!cooldownOf(u,id)&&costOf(u,sk)<=u.mp)||freeMerchantHire(u,id);
 const fromStealth=!!(class10Damaging(sk)&&u.cls&&baseOf(u.cls)==='archer'&&class10Invisible(u));
 const charged=!!(free&&u.pendingStealthChargeCrit);delete u.pendingStealthChargeCrit;
 u.freeFormPending=freeForm;classRefreshActions.push({id:u.id,crit:fromStealth||charged});
 try{const ok=classRefreshAct(u,id,target,friend,free);if(ok&&freeForm)u.freeFormUsed=true;else if(!ok)u.freeFormPending=false;
  if(ok&&fromStealth&&sk.ct&&!free&&u.charging)u.charging.stealthCrit=true;return ok;
 }finally{classRefreshActions.pop();}
};
const classRefreshHit=hitOne;hitOne=function(u,sk,t,...args){
 const direct=class10Damaging(sk)&&u.cls&&baseOf(u.cls)==='archer'&&class10Invisible(u);
 if(direct)classRefreshActions.push({id:u.id,crit:true});
 try{return classRefreshHit(u,sk,t,...args);}finally{if(direct)classRefreshActions.pop();}
};
PAS.class10_stealth.d='ไม่เป็นเป้าท่าเดี่ยว 3 เทิร์น โดนท่าหมู่ได้ โจมตีแรกจากล่องหนรับประกันคริติคอลทุกฮิตเมื่อโจมตีโดน แล้วล่องหนหาย ใช้บัฟและยาได้';

const classRefreshWorld=wbAuto_;wbAuto_=function(u){const id=chooseAutoForm(u);return id?{id,friend:u.id}:classRefreshWorld(u);};

// Follow-up balance: one-battle archer veil, healing parry, reflect AI, free hire.
SK.class10_parry.cd=2;
PAS.class10_parry.d='ป้องกันท่าโจมตี 1 ท่า รวมทุกฮิต และฟื้น HP เท่าดาเมจที่ป้องกันได้ ไม่เกิน HP สูงสุด อยู่ 3 เทิร์น คูลดาวน์ 3 เทิร์น';
PAS.class10_stealth.d='Lv10: ล่องหนแบบพาสซีฟ ลดดาเมจท่าโจมตีเดี่ยวแรก 50% รวมทุกฮิต 1 ครั้งต่อการต่อสู้ ไม่กันท่าหมู่ ไม่เพิ่มคริติคอล และยังรับสถานะตามปกติ';
CLS.archer.sk=CLS.archer.sk.filter(([,id])=>id!=='class10_stealth');
CLS.archer.pas.push('class10_stealth');
delete SK.class10_stealth;
class10Invisible=function(){return false;};
classRefreshStealthCrit=function(){return false;};
const defenseFollowupUnit=unit;unit=function(o){const u=defenseFollowupUnit(o);u.skills=(u.skills||[]).filter(id=>id!=='class10_stealth');u.buffs=u.buffs.filter(x=>x.pas!=='class10_stealth');
 if(u.lv<10)u.pas=u.pas.filter(id=>id!=='class10_stealth');
 if(!u.classDefenseInitialized){u.classDefenseInitialized=true;if(u.lv>=10&&!u.temporary&&hasPas(u,'class10_stealth'))u.archerVeil=1;}return u;};
function freeMerchantHire(u,id){return id==='hire_merc'&&u.cls&&baseOf(u.cls)==='merchant'&&!u.freeFormUsed&&u.skills.includes(id)&&!cooldownOf(u,id)&&costOf(u,SK[id])<=u.mp;}
function chooseAutoReflect(u){
 if(!u||u.hp<=0||u.temporary||!u.cls||baseOf(u.cls)!=='gladiator'||hasPas(u,'thorns2'))return null;
 if(!u.skills.includes('ms_gladiator10')||cooldownOf(u,'ms_gladiator10')||costOf(u,SK.ms_gladiator10)>u.mp)return null;
 if(u.hp/u.st.hp<.4&&u.skills.some(id=>SK[id]?.t==='heal'&&!cooldownOf(u,id)&&costOf(u,SK[id])<=u.mp))return null;
 const enemies=foesOf(u).filter(x=>x.hp>0);return enemies.some(x=>x.skills.some(id=>{const sk=SK[id];return sk&&(['p','h'].includes(sk.t)||sk.t==='auto'&&x.atkType!=='m');}))?'ms_gladiator10':null;
}
const defenseFollowupAuto=class10AutoDefense;class10AutoDefense=function(u){return chooseAutoReflect(u)||defenseFollowupAuto(u);};
// A consumed parry remains in this action's context so each blocked hit heals its actual rolled damage.
class10BlockHit=function(u,sk,t,damaging){
 const c=class10AttackContexts.at(-1),key=t.id+'|'+u.id;
 if(c?.blocked.has(key))return true;
 if(c?.absorbing?.has(key)||c?.archerHalfGuardTargets?.has(key))return false;
 const parry=t.buffs.some(x=>x.pas==='class10_parry'&&x.tn>0);
 if(parry&&damaging){t.buffs=t.buffs.filter(x=>x.pas!=='class10_parry');if(c)(c.absorbing??=new Set()).add(key);return false;}
 const veil=damaging&&!sk.all&&t.archerVeil>0,barrier=damaging&&t.class10Barrier>0;
 if(veil){t.archerVeil=0;if(c)(c.archerHalfGuardTargets??=new Set()).add(key);blog(t.name+' ใช้ล่องหน ลดดาเมจ '+sk.n+' 50%');vfx('buff',t.id);return false;}
 if(!parry&&!barrier)return false;
 if(parry)t.buffs=t.buffs.filter(x=>x.pas!=='class10_parry');else t.class10Barrier=0;
 c?.blocked.add(key);blog(t.name+' ใช้ '+(parry?'ตั้งสมาธิปัดป้อง':'บาเรียเวทย์')+' ป้องกัน '+sk.n);vfx('buff',t.id);return true;
};
function classDefenseDamageFactor(u,t){return class10AttackContexts.at(-1)?.archerHalfGuardTargets?.has(t.id+'|'+u.id)? .5:1;}
function classDefenseAbsorb(u,sk,t,d){if(!class10AttackContexts.at(-1)?.absorbing?.has(t.id+'|'+u.id))return false;const restored=heal(t,d);blog(t.name+' ปัดป้อง '+d+' ดาเมจ และฟื้น HP '+restored);vfx('heal',t.id);return true;}
const defenseFollowupAct=act;act=function(u,id,...args){if(id==='class10_stealth')return false;return defenseFollowupAct(u,id,...args);};
const defenseFollowupReplayApply=applyClass10Replay;applyClass10Replay=function(b,f){defenseFollowupReplayApply(b,f);for(const [id,count]of f.archerVeils||[]){const u=[...b.allies,...b.enemies].find(x=>x.id===id);if(u)u.archerVeil=count;}};

const defenseFollowupReplay=replayFrame_;replayFrame_=function(r){defenseFollowupReplay(r);if(r.replay?.frames?.length)r.replay.frames.at(-1).archerVeils=[...r.battle.allies,...r.battle.enemies].map(u=>[u.id,u.archerVeil||0]);};

// Requested revision: free parry, reflective shield without defense-stat buffs.
delete SK.ms_gladiator10.bf;
SK.ms_gladiator10.pas='reflect50';
PAS.reflect50={n:'โล่สะท้อน',d:'ลดความเสียหายจากท่าโจมตี 20% และสะท้อนความเสียหายที่ได้รับ 50% ทั้งกายภาพ เวท และผสม ไม่บวกซ้อนผิวหนาม'};
PAS.class10_parry.d+=' · ใช้แล้วสั่งการต่อได้ทันที ไม่เสียเทิร์น ยังใช้ MP';
const parryReflectFree=freeMerchantHire;freeMerchantHire=function(u,id){return id==='class10_parry'&&u.skills.includes(id)&&!u.freeFormUsed&&!cooldownOf(u,id)&&costOf(u,SK[id])<=u.mp||parryReflectFree(u,id);};
chooseAutoReflect=function(u){
 if(!u||u.hp<=0||u.temporary||!u.cls||baseOf(u.cls)!=='gladiator'||hasPas(u,'reflect50'))return null;
 if(!u.skills.includes('ms_gladiator10')||cooldownOf(u,'ms_gladiator10')||costOf(u,SK.ms_gladiator10)>u.mp)return null;
 if(u.hp/u.st.hp<.4&&u.skills.some(id=>SK[id]?.t==='heal'&&!cooldownOf(u,id)&&costOf(u,SK[id])<=u.mp))return null;
 return foesOf(u).some(x=>x.hp>0&&x.skills.some(id=>class10Damaging(SK[id])))?'ms_gladiator10':null;
};
function reflectShieldDamage(u,t,d){if(!hasPas(t,'reflect50')||u.hp<=0)return;const n=Math.max(1,Math.round(d*.5));blog(u.name+' โดนโล่สะท้อน '+n);if(isWorldBattle()&&u.immortalWorld)B().wbDamageOwner=t.owner;hurt(u,n);}

// Counter stance, shadow interception and mercenary level revision.
delete SK.gl_counter.bf;
SK.gl_counter.pas='counter50';SK.gl_counter.tn=3;
PAS.counter50={n:'ท่าสวนกลับ',d:'ลดดาเมจท่าโจมตี 50% และสะท้อนดาเมจที่ได้รับ 50% ทั้งกายภาพ เวท และผสม นาน 3 เทิร์น ใช้แทนโล่สะท้อน ไม่ซ้อนผิวหนาม'};
PAS.thorns.d='สะท้อนดาเมจกายภาพและผสม 25% ไม่บวกซ้อนท่าสวนกลับหรือโล่สะท้อน';
PAS.shadow_guard={n:'เงารับเคราะห์',d:'Lv10: เมื่อร่างจริงถูกใช้ท่าเดี่ยวใส่ มีโอกาส 50% ให้ร่างเงาของตัวเองที่ยังมีชีวิตรับท่านั้นแทน ไม่รับท่าหมู่'};
CLS.thief.pas.push('shadow_guard');
const counterShadowUnit=unit;unit=function(o){const u=counterShadowUnit(o);if(u.lv<10)u.pas=u.pas.filter(k=>k!=='shadow_guard');return u;};
const counterShadowAct=act;act=function(u,id,...args){const ok=counterShadowAct(u,id,...args);if(ok&&(id==='gl_counter'||id==='ms_gladiator10'))u.buffs=u.buffs.filter(x=>x.pas!==(id==='gl_counter'?'reflect50':'counter50'));return ok;};
reflectShieldDamage=function(u,t,d){if(!(hasPas(t,'counter50')||hasPas(t,'reflect50'))||u.hp<=0)return;const n=Math.max(1,Math.round(d*.5));blog(u.name+' โดนสะท้อน '+n);if(isWorldBattle()&&u.immortalWorld)B().wbDamageOwner=t.owner;hurt(u,n);};
chooseAutoReflect=function(u){
 if(!u||u.hp<=0||u.temporary||!u.cls||baseOf(u.cls)!=='gladiator'||hasPas(u,'counter50')||hasPas(u,'reflect50'))return null;
 if(u.hp/u.st.hp<.4&&u.skills.some(id=>SK[id]?.t==='heal'&&!cooldownOf(u,id)&&costOf(u,SK[id])<=u.mp))return null;
 if(!foesOf(u).some(x=>x.hp>0&&x.skills.some(id=>class10Damaging(SK[id]))))return null;
 return ['gl_counter','ms_gladiator10'].find(id=>u.skills.includes(id)&&!cooldownOf(u,id)&&costOf(u,SK[id])<=u.mp)||null;
};
const counterShadowHit=hitOne;hitOne=function(u,sk,t,...args){
 const own=!class10AttackContexts.length;if(own)class10AttackContexts.push({blocked:new Set()});
 try{if(t&&!t.temporary&&hasPas(t,'shadow_guard')&&!sk.all&&class10Offensive(sk)&&foesOf(u).includes(t)){
   const c=class10AttackContexts.at(-1),key=u.id+'|'+t.id;c.shadowTargets??=new Map();
   if(!c.shadowTargets.has(key)){const clones=sideOf(t).filter(x=>x.hp>0&&x.temporary&&x.shadowOwner===t.id);c.shadowTargets.set(key,clones.length&&Math.random()<.5?clones[0].id:null);}
   const clone=sideOf(t).find(x=>x.id===c.shadowTargets.get(key)&&x.hp>0);if(clone){blog(clone.name+' รับการโจมตีแทน '+t.name);t=clone;}
  }return counterShadowHit(u,sk,t,...args);
 }finally{if(own)class10AttackContexts.pop();}
};


// World participants retain their granted guard action after a druid transformation.
const worldFormGuardAct=act;act=function(u,id,...args){const ok=worldFormGuardAct(u,id,...args);if(ok&&SK[id]?.t==='form'&&isWorldBattle()&&!u.skills.includes('wb_guard'))u.skills.push('wb_guard');return ok;};

// Additive equipment catalog only: no combat-rule changes. Shared by client and authoritative online API.
function installForestRiddleCraft(){
 for(const [zone,tier,label,element]of [[7,0,'ตราช่างฝึก','grass'],[6,5,'ตราคลังรัตติกาล','dark']])for(const slot of ['weapon','armor','gloves','boots','belt','bracelet','ring','necklace','crown']){
  const types=slot==='weapon'?Object.keys(WT):[null];for(const wt of types){const base=EQ[wt?'wp_'+wt+tier:slot+'_'+tier];if(!base)throw Error('Missing riddle craft base');const id='cf_riddle'+zone+'_'+slot+(wt?'_'+wt:'');EQ[id]={...base,n:(wt?WT[wt].n:SLOTN[slot])+label,lv:zone===7?1:44,price:Math.round(base.price*1.5),st:Object.fromEntries(Object.entries(base.st).map(([k,v])=>[k,Math.max(1,Math.round(v*1.15))])),craft:'riddle'+zone,eventCraft:1,riddleZone:zone,special:1,...(wt?{el:element}:{})};if(['armor','crown'].includes(slot))EQ[id].defTypes=[element];}
 }
}
installForestRiddleCraft();
const forestRiddleGachaPools=gachaPools;gachaPools=function(){const p=forestRiddleGachaPools();for(const k of ['gear','craft','legendGear'])if(p[k])p[k]=p[k].filter(id=>!EQ[id]?.eventCraft);return p;};

// Solar rarity definitions are additive; existing species and skill records remain intact.
// @soulbeast-unit 1095-solarBeasts
const SolarBeasts={
 definitions:[{"id":"solar_pentadrake","names":["เพนทาไพโรส มังกรห้าเศียรสุริยัน","Pentapyros, Five-Headed Solar Dragon","彭塔皮洛斯·五首日耀龙"],"types":["fire","dragon"],"ref":"tempest_lynx","pas":"multihit","lore":["ห้าเศียรของเพนทาไพโรสเฝ้ามองคนละขอบฟ้า ก่อนเปล่งเพลิงรวมกันเป็นดวงอาทิตย์ดวงใหม่ ทุกลมหายใจของมันทำให้เกล็ดเก่าหลอมเป็นทองคำ และทุกคำรามทำให้ดวงดาวสะเทือน","Its five heads watch separate horizons before their flames converge into a newborn sun. Each breath melts old scales into gold, and each roar trembles among the stars.","五首各自凝视天际，吐息交汇时便诞生新的太阳。每次呼吸都将旧鳞熔为黄金，每声咆哮都令星辰震颤。"],"theme":["fivefold-sun","flame","fang"],"visual":"five-headed obsidian ruby fire dragon with golden solar horns","skills":[{"id":"solar_pentadrake_s1","names":["เขี้ยวเพลิงอรุณ","Dawnfire Fang","曙炎龙牙"],"definition":{"n":"เขี้ยวเพลิงอรุณ","t":"p","el":"fire","pw":115,"mp":10,"cd":1,"st":{"burn":0.2}},"visual":"one ruby dragon fang slashing in a crescent of sunrise fire"},{"id":"solar_pentadrake_s2","names":["ลมหายใจมังกรสุริยัน","Solar Dragon Breath","日耀龙息"],"definition":{"n":"ลมหายใจมังกรสุริยัน","t":"m","el":"dragon","pw":145,"mp":16,"cd":2},"visual":"a golden dragon maw projecting a focused white-gold beam through swirling orange embers"},{"id":"solar_pentadrake_s3","names":["ปีกกวาดเถ้าดารา","Starash Wing Sweep","星烬翼扫"],"definition":{"n":"ปีกกวาดเถ้าดารา","t":"p","el":"dragon","pw":105,"mp":18,"cd":2,"all":1},"visual":"one huge obsidian dragon wing sweeping a circular trail of red-hot stardust"},{"id":"solar_pentadrake_s4","names":["เกล็ดเพลิงอมตะ","Deathless Flame Scales","不灭炎鳞"],"definition":{"n":"เกล็ดเพลิงอมตะ","t":"buff","mp":16,"cd":3,"tg":"self","bf":{"pdef":0.3,"mdef":0.3},"tn":3},"visual":"overlapping ruby dragon scales rising into an impenetrable golden fire shield"},{"id":"solar_pentadrake_s5","names":["อัคคีห้าเศียร","Fivefold Inferno","五首炼狱"],"definition":{"n":"อัคคีห้าเศียร","t":"h","el":"fire","pw":46,"mp":24,"cd":3,"hits":5},"visual":"five distinct fire-dragon heads breathing five converging fiery bolts"},{"id":"solar_pentadrake_s6","names":["มหาสุริยันล้างพิภพ","Worldcleansing Sun","焚界大日"],"definition":{"n":"มหาสุริยันล้างพิภพ","t":"m","el":"fire","pw":280,"mp":34,"cd":5,"all":1,"st":{"burn":0.25}},"visual":"five magnificent dragon heads surrounding a newborn incandescent sun that erupts across a dark world"}]},{"id":"solar_mortivar","names":["มอร์ทิวาร์ จอมเวทอันเดดนิรันดร์","Mortivar, Eternal Undead Archwizard","莫提瓦尔·永恒亡灵巫王"],"types":["dark","poison"],"ref":"prism_owl","pas":"mpsave","lore":["มอร์ทิวาร์ซ่อนวิญญาณไว้ในผลึกพิษที่ลอยเหนือฝ่ามือ บทเวทของมันไม่ได้ดังออกมาจากปาก แต่กระซิบจากเงาของผู้ที่จ้องมอง มันยอมรับพันธสัญญาเพียงกับผู้ที่ไม่หวั่นไหวต่อความตาย","Mortivar keeps its soul in a venom crystal above its palm. Its spells whisper from the observer’s shadow rather than its mouth. It accepts a pact only with those who face death without flinching.","莫提瓦尔将灵魂藏在掌上的毒晶中。咒语并非从口中传出，而是从注视者的影子里低语。唯有直面死亡而不退缩者，才能缔结契约。"],"theme":["lich-phylactery","soul","web"],"visual":"regal skeletal undead archwizard with green poison phylactery","skills":[{"id":"solar_mortivar_s1","names":["ศรวิญญาณทมิฬ","Umbral Soulbolt","幽魂暗矢"],"definition":{"n":"ศรวิญญาณทมิฬ","t":"m","el":"dark","pw":120,"mp":10,"cd":1},"visual":"a skeletal wizard hand launching one black-violet soul arrow wrapped in emerald fire"},{"id":"solar_mortivar_s2","names":["ลำแสงพิษสุญญตา","Voidvenom Ray","虚毒射线"],"definition":{"n":"ลำแสงพิษสุญญตา","t":"m","el":"poison","pw":130,"mp":16,"cd":2,"st":{"poison":0.6}},"visual":"an ornate lich staff firing a narrow venom-green beam through violet fog"},{"id":"solar_mortivar_s3","names":["หมอกสุสานนิรันดร์","Eternal Crypt Miasma","永墓瘴气"],"definition":{"n":"หมอกสุสานนิรันดร์","t":"m","el":"poison","pw":95,"mp":20,"cd":3,"all":1,"st":{"poison":0.35}},"visual":"a crystal phylactery above an open ancient sarcophagus releasing a ring of green miasma"},{"id":"solar_mortivar_s4","names":["สัญญาวิญญาณดำ","Black Soul Covenant","黑魂契约"],"definition":{"n":"สัญญาวิญญาณดำ","t":"buff","mp":16,"cd":3,"tg":"self","bf":{"matk":0.35,"mdef":0.25},"tn":3},"visual":"an emerald phylactery binding a spectral soul into a black crystal crown"},{"id":"solar_mortivar_s5","names":["พิษกัดกินดวงดาว","Star-Eating Venom","蚀星剧毒"],"definition":{"n":"พิษกัดกินดวงดาว","t":"m","el":"poison","pw":185,"mp":23,"cd":3,"pi":0.2,"st":{"poison":0.4}},"visual":"one violet star pierced by emerald venom tendrils and crystalline poison needles"},{"id":"solar_mortivar_s6","names":["ราชโองการโลกไร้ชีพ","Edict of the Lifeless World","无生界敕令"],"definition":{"n":"ราชโองการโลกไร้ชีพ","t":"m","el":"dark","pw":270,"mp":34,"cd":5,"all":1,"pi":0.15},"visual":"a crowned undead archwizard opening a vast violet death eclipse above a spectral emerald crypt"}]},{"id":"solar_aureolith","names":["ออรีโอลิธ ปราการศักดิ์สิทธิ์","Aureolith, Sacred Bastion","奥瑞欧利斯·神圣磐垒"],"types":["electric","rock"],"ref":"obsidian_scarab","pas":"guardian","lore":["ออรีโอลิธถูกแกะสลักจากศิลาก้อนแรกของวิหารฟ้า ภายในอกคือสายฟ้าที่ไม่เคยดับ เมื่อสหายถูกคุกคาม มันจะก้าวไปข้างหน้าและเคาะกำปั้นกับเกราะ เสียงนั้นคือคำท้าที่ไม่มีศัตรูใดมองข้ามได้","Carved from the sky temple’s first stone, Aureolith carries an undying thunderbolt within its chest. When companions are threatened, it steps forward and strikes its armor: a challenge no enemy can ignore.","奥瑞欧利斯由天殿的第一块圣石雕成，胸中藏着永不熄灭的雷霆。伙伴遭受威胁时，它便迈步向前，以拳叩甲，发出敌人无法忽视的挑战。"],"theme":["sacred-bastion","shield","bolt"],"visual":"enormous white granite golem with golden armor and lightning heart","skills":[{"id":"solar_aureolith_s1","names":["หมัดศิลาศักดิ์สิทธิ์","Sacred Stone Fist","圣石重拳"],"definition":{"n":"หมัดศิลาศักดิ์สิทธิ์","t":"p","el":"rock","pw":115,"mp":10,"cd":1},"visual":"one gigantic white granite fist with gold inlay smashing a stone floor into radiant shards"},{"id":"solar_aureolith_s2","names":["คำท้าปราการฟ้า","Heavenly Bastion Challenge","天垒挑衅"],"definition":{"n":"คำท้าปราการฟ้า","t":"buff","mp":16,"cd":3,"tg":"self","bf":{"pdef":0.45,"mdef":0.45},"taunt":3,"tn":3},"visual":"a sacred granite golem striking its lightning chest while hostile red arrows curve toward its enormous shield arms"},{"id":"solar_aureolith_s3","names":["สายฟ้าผนึกศัตรู","Thunderbinding Bolt","缚敌雷霆"],"definition":{"n":"สายฟ้าผนึกศัตรู","t":"m","el":"electric","pw":135,"mp":16,"cd":2,"st":{"para":0.3}},"visual":"one blue-white lightning chain fired from a golden golem heart toward a dark target silhouette"},{"id":"solar_aureolith_s4","names":["กำแพงหินอวยพร","Blessed Rampart","祝福岩壁"],"definition":{"n":"กำแพงหินอวยพร","t":"buff","mp":22,"cd":4,"tg":"team","bf":{"pdef":0.3,"mdef":0.3},"tn":3},"visual":"three interlocking marble shields rising before a line of tiny allied silhouettes in golden light"},{"id":"solar_aureolith_s5","names":["หัวใจหินนิรันดร์","Everstone Heart","永石之心"],"definition":{"n":"หัวใจหินนิรันดร์","t":"heal","pw":38,"mp":20,"cd":3,"tg":"self","cure":1},"visual":"a cracked white stone heart mending itself around a brilliant amber lightning crystal"},{"id":"solar_aureolith_s6","names":["มหาวิหารสายฟ้า","Cathedral of Thunder","雷霆圣殿"],"definition":{"n":"มหาวิหารสายฟ้า","t":"buff","mp":32,"cd":5,"tg":"team","bf":{"pdef":0.45,"mdef":0.45},"tn":3},"visual":"a colossal sacred golem unfolding a golden lightning cathedral dome over protected allies"}]},{"id":"solar_heliotheon","names":["เฮลิโอธีออน เทพจักรพรรดิเหล็กกล้า","Heliotheon, God of Solar Steel","赫利欧西昂·日钢神皇"],"types":["fairy","steel"],"ref":"jade_moon_hare","pas":"pierce","lore":["เกราะของเฮลิโอธีออนหลอมจากโลหะที่อาบแสงอาทิตย์เป็นพันปี มันไม่เรียกร้องคำสรรเสริญ มีเพียงคำสาบานว่าจะยืนหยัดปกป้องผู้ที่อ่อนแอกว่า หอกของมันจึงส่องสว่างที่สุดเมื่อถูกยกขึ้นเพื่อสหาย","Its armor was forged from metal steeped in a thousand years of sunlight. Heliotheon asks for no worship, only a vow to protect the vulnerable. Its spear shines brightest when raised for a companion.","千年日光淬炼的金属铸成了它的神甲。赫利欧西昂不索求赞颂，只要求守护弱者的誓言。为同伴举起长枪时，枪锋才最为耀眼。"],"theme":["solar-deity","halo","wing"],"visual":"noble silver armored celestial god with metallic wings and golden spear","skills":[{"id":"solar_heliotheon_s1","names":["หอกเหล็กสุริยัน","Solarsteel Spear","日钢圣枪"],"definition":{"n":"หอกเหล็กสุริยัน","t":"p","el":"steel","pw":125,"mp":11,"cd":1,"pi":0.1},"visual":"an exquisitely forged silver and gold spear thrusting through a shattered black shield"},{"id":"solar_heliotheon_s2","names":["แสงพิพากษาเทพ","Divine Verdict","神裁之光"],"definition":{"n":"แสงพิพากษาเทพ","t":"m","el":"fairy","pw":145,"mp":16,"cd":2},"visual":"a majestic steel-winged deity releasing one precise golden judgment ray from its palm"},{"id":"solar_heliotheon_s3","names":["บัญชากองทัพฟ้า","Heavenhost Decree","天军号令"],"definition":{"n":"บัญชากองทัพฟ้า","t":"buff","mp":22,"cd":4,"tg":"team","bf":{"patk":0.25,"matk":0.25},"tn":3},"visual":"a raised golden spear with radiant metallic wings blessing a row of allied crests"},{"id":"solar_heliotheon_s4","names":["คมดาราพิพากษา","Starforged Judgment Edge","星铸裁锋"],"definition":{"n":"คมดาราพิพากษา","t":"p","el":"steel","pw":185,"mp":22,"cd":3,"pi":0.2},"visual":"a brilliant silver blade descending from a solar halo and cleaving dark steel armor"},{"id":"solar_heliotheon_s5","names":["พรจักรพรรดิอรุณ","Dawn Emperor Blessing","曙皇赐福"],"definition":{"n":"พรจักรพรรดิอรุณ","t":"heal","pw":32,"mp":24,"cd":3,"tg":"team","cure":1},"visual":"armored divine hands opening a warm golden healing sun above several white feathers"},{"id":"solar_heliotheon_s6","names":["บัลลังก์สุริยันนิรันดร์","Throne of the Eternal Sun","永日神座"],"definition":{"n":"บัลลังก์สุริยันนิรันดร์","t":"m","el":"fairy","pw":270,"mp":34,"cd":5,"all":1,"pi":0.15},"visual":"a radiant steel-winged god above an immense golden solar throne sending a glorious wave of judgment"}]},{"id":"solar_ferroth","names":["เฟอร์รอธ จักรพรรดิปีศาจเหล็กทมิฬ","Ferroth, Blacksteel Demon Emperor","费洛斯·黑钢魔皇"],"types":["dark","steel"],"ref":"ember_jackal","pas":"lifesteal","lore":["เฟอร์รอธครองบัลลังก์ที่ไม่มีวันเย็นลง โซ่เหล็กบนปีกแต่ละเส้นคือคำสาบานที่มันพิชิตมา พันธสัญญากับผู้ผนึกไม่ได้ทำให้มันเชื่องลง แต่ทำให้ดาบทมิฬของมันเลือกฟันเพื่อใครบางคนเป็นครั้งแรก","Ferroth rules a throne that never cools. Each chain upon its wings marks a conquered oath. A pact does not tame it; it gives its black blade someone to fight for, for the first time.","费洛斯的王座永不冷却，翼上的每条锁链都代表被征服的誓言。契约并未驯服它，却让那柄黑刃第一次有了为之而战的人。"],"theme":["blacksteel-emperor","chain","cut"],"visual":"obsidian steel armored demon emperor with crimson seams and bladed wings","skills":[{"id":"solar_ferroth_s1","names":["คมเหล็กอเวจี","Blacksteel Ruinblade","黑钢狱刃"],"definition":{"n":"คมเหล็กอเวจี","t":"p","el":"steel","pw":125,"mp":11,"cd":1,"pi":0.1},"visual":"a huge obsidian execution blade slashing diagonally through crimson sparks"},{"id":"solar_ferroth_s2","names":["กระสุนรัตติกาล","Nightfall Orb","夜陨魔弹"],"definition":{"n":"กระสุนรัตติกาล","t":"m","el":"dark","pw":145,"mp":16,"cd":2},"visual":"a black armored demonic gauntlet hurling one dense violet orb with a ruby corona"},{"id":"solar_ferroth_s3","names":["เกราะจักรพรรดิปีศาจ","Demon Emperor Armor","魔皇战甲"],"definition":{"n":"เกราะจักรพรรดิปีศาจ","t":"buff","mp":18,"cd":3,"tg":"self","bf":{"patk":0.3,"pdef":0.3},"tn":3},"visual":"black steel demonic armor locking into place around a pulsing crimson core"},{"id":"solar_ferroth_s4","names":["ปีกดาบตัดพันธสัญญา","Oathsevering Blade Wings","断誓刃翼"],"definition":{"n":"ปีกดาบตัดพันธสัญญา","t":"p","el":"steel","pw":115,"mp":22,"cd":3,"all":1},"visual":"two enormous bladed iron demon wings sweeping a shower of razor-edged crimson crescents"},{"id":"solar_ferroth_s5","names":["โซ่อเวจีผ่าดวงดาว","Starbreaking Abyss Chains","裂星狱链"],"definition":{"n":"โซ่อเวจีผ่าดวงดาว","t":"m","el":"dark","pw":190,"mp":23,"cd":3,"pi":0.2},"visual":"black chains with ruby barbs erupting around a brilliant star and crushing its shell"},{"id":"solar_ferroth_s6","names":["สิ้นแสงใต้บัลลังก์ดำ","Last Light Beneath the Black Throne","黑座终光"],"definition":{"n":"สิ้นแสงใต้บัลลังก์ดำ","t":"h","el":"dark","pw":280,"mp":34,"cd":5,"all":1},"visual":"a blacksteel demon emperor raising a huge blade before a crimson eclipse and a shattered infernal throne"}]},{"id":"solar_cryostag","names":["คริโอสเทล กวางมงกุฎเหมันต์","Cryostel, Wintercrown Stag","克里欧斯特·冬冠圣鹿"],"types":["grass","ice"],"ref":"bloom_jade_mare","pas":"healer","lore":["เมื่อคริโอสเทลก้มศีรษะ ดอกไม้บนเขาน้ำแข็งจะผลิบานแม้ในฤดูหนาวที่สุด รอยกีบของมันทำให้รากไม้จำเส้นทางกลับบ้านได้ และลมหายใจสีเงินปลุกชีวิตที่เกือบดับให้ลุกขึ้นอีกครั้ง","Flowers upon its ice antlers bloom in the deepest winter. Its hoofprints teach roots the way home, and its silver breath stirs lives on the brink of fading.","最深的寒冬里，它的冰晶鹿角上仍会绽放鲜花。蹄印让树根记起归途，银色吐息则唤醒即将熄灭的生命。"],"theme":["wintercrown","vine","halo"],"visual":"emerald sacred deer with vast crystalline flowering antlers","skills":[{"id":"solar_cryostag_s1","names":["หนามบุปผาหิมะ","Snowblossom Thorns","雪花荆棘"],"definition":{"n":"หนามบุปผาหิมะ","t":"m","el":"grass","pw":115,"mp":10,"cd":1},"visual":"a silver vine flowering with ice roses launching sharp emerald thorns"},{"id":"solar_cryostag_s2","names":["หอกเขาเหมันต์","Winterantler Lance","冬角冰枪"],"definition":{"n":"หอกเขาเหมันต์","t":"m","el":"ice","pw":140,"mp":16,"cd":2,"st":{"freeze":0.25}},"visual":"an exquisite branching crystalline deer antler shaping a single long sapphire ice lance"},{"id":"solar_cryostag_s3","names":["ลมหายใจสวนหิมะ","Snowgarden Breath","雪庭之息"],"definition":{"n":"ลมหายใจสวนหิมะ","t":"heal","pw":30,"mp":22,"cd":3,"tg":"team"},"visual":"a noble emerald stag breathing silver mist over blooming snow-covered healing flowers"},{"id":"solar_cryostag_s4","names":["ม่านรากไม้เยือกแข็ง","Frozen Root Veil","冻根帷幕"],"definition":{"n":"ม่านรากไม้เยือกแข็ง","t":"buff","mp":22,"cd":4,"tg":"team","bf":{"pdef":0.25,"mdef":0.25,"spd":0.15},"tn":3},"visual":"living silver tree roots weaving a protective frost canopy around luminous green orbs"},{"id":"solar_cryostag_s5","names":["รอยกีบผ่าธารน้ำแข็ง","Glaciercleaving Hoof","裂川冰蹄"],"definition":{"n":"รอยกีบผ่าธารน้ำแข็ง","t":"p","el":"ice","pw":185,"mp":22,"cd":3},"visual":"a luminous deer hoof striking blue ice and creating a great fan of crystalline shards"},{"id":"solar_cryostag_s6","names":["มงกุฎคืนชีพเหมันต์","Wintercrown Rebirth","冬冠复苏"],"definition":{"n":"มงกุฎคืนชีพเหมันต์","t":"heal","pw":45,"mp":36,"cd":5,"tg":"team","revAll":1,"cure":1},"visual":"vast flowering crystalline antlers lifting a silver-green dawn as three fallen soul lights rise into renewed life"}]},{"id":"solar_raijaku","names":["ไรจาคุ ราชันมยุราวายุ","Raijaku, Thunderwind Peacock","雷雀·风雷孔雀王"],"types":["electric","flying"],"ref":"prism_owl","pas":"swift","lore":["ไรจาคุรำแพนหางครั้งหนึ่ง เมฆทั้งฟ้าจะเรียงตัวตามลายขน ดวงตาอัญมณีบนแพนหางเก็บสายฟ้าไว้จนกว่าจะถึงจังหวะที่สมบูรณ์แบบ จากนั้นเสียงปีกเพียงครั้งเดียวจะเปลี่ยนความเงียบเป็นพายุ","When Raijaku spreads its tail, clouds align with the patterns of its feathers. Jeweled eyes hold lightning until the perfect moment, then a single wingbeat turns silence into a storm.","雷雀展开尾屏时，云层也随羽纹排列。宝石眼斑将雷霆封存到完美的一刻，再以一次振翼，让寂静化为风暴。"],"theme":["thunder-peacock","wing","bolt"],"visual":"cobalt peacock with magnificent spread lightning-jeweled tail fan","skills":[{"id":"solar_raijaku_s1","names":["ขนศรอสนี","Thunderfeather Dart","雷羽飞矢"],"definition":{"n":"ขนศรอสนี","t":"m","el":"electric","pw":120,"mp":10,"cd":1},"visual":"one jeweled cobalt peacock feather flying as a sharp blue-white lightning dart"},{"id":"solar_raijaku_s2","names":["ปีกพายุราชัน","Sovereign Gale Wings","王者风翼"],"definition":{"n":"ปีกพายุราชัน","t":"p","el":"flying","pw":105,"mp":18,"cd":2,"all":1},"visual":"two graceful peacock wings sweeping emerald and turquoise wind crescents across the scene"},{"id":"solar_raijaku_s3","names":["ระบำแพนหางฟ้า","Skyfan Dance","天屏之舞"],"definition":{"n":"ระบำแพนหางฟ้า","t":"buff","mp":16,"cd":3,"tg":"self","bf":{"spd":0.4,"eva":0.2},"tn":3},"visual":"a magnificent spread peacock tail surrounded by swift spiral wind rings and sparkling feather eyes"},{"id":"solar_raijaku_s4","names":["อัสนีตาคู่มยุรา","Twin-Eye Thunderstrike","孔雀双瞳雷"],"definition":{"n":"อัสนีตาคู่มยุรา","t":"m","el":"electric","pw":78,"mp":22,"cd":3,"hits":2,"st":{"para":0.2}},"visual":"two glowing peacock feather eyes releasing exactly two forked lightning strikes"},{"id":"solar_raijaku_s5","names":["วายุฉีกนภา","Sky-Rending Wind","裂穹神风"],"definition":{"n":"วายุฉีกนภา","t":"m","el":"flying","pw":190,"mp":22,"cd":3,"pi":0.2},"visual":"a long iridescent peacock feather cutting a sharp turquoise vortex through storm clouds"},{"id":"solar_raijaku_s6","names":["มหารำแพนอสนีสวรรค์","Heavenly Thunderfan","天雷万羽屏"],"definition":{"n":"มหารำแพนอสนีสวรรค์","t":"m","el":"electric","pw":265,"mp":34,"cd":5,"all":1,"st":{"para":0.2}},"visual":"a regal peacock spreading a vast electric sapphire tail fan as a spectacular crown of lightning arcs outward"}]},{"id":"solar_thalassyr","names":["ธาลัสซีร์ นาคราชมหาสมุทร","Thalassyr, Sovereign of the Endless Sea","塔拉希尔·无尽海龙王"],"types":["water","dragon"],"ref":"aurora_whale","pas":"thick","lore":["ลำตัวยาวของธาลัสซีร์ขดเป็นวงรอบกระแสน้ำลึก เกล็ดแต่ละแผ่นสะท้อนแสงจากท้องฟ้าที่ทะเลไม่เคยเห็น ตำนานกล่าวว่าคลื่นจะจำเสียงของผู้ที่ได้รับการยอมรับจากมัน และพากลับฝั่งเสมอ","Thalassyr coils its endless body around deep currents. Each scale reflects a sky the abyss has never seen. Waves remember the voices of those it accepts, and always guide them to shore.","塔拉希尔盘绕深海洋流，鳞片映出深渊从未见过的天空。传说海浪会记住得到它认可之人的声音，并始终将其引回岸边。"],"theme":["ocean-sovereign","wave","vine"],"visual":"long sapphire snake-bodied ocean dragon with pearl fins and whiskered antlered head","skills":[{"id":"solar_thalassyr_s1","names":["เขี้ยวคลื่นสมุทร","Oceanwave Fang","沧浪龙牙"],"definition":{"n":"เขี้ยวคลื่นสมุทร","t":"p","el":"water","pw":120,"mp":10,"cd":1},"visual":"one sapphire serpent dragon fang striking through a spiraling turquoise wave"},{"id":"solar_thalassyr_s2","names":["ลำแสงมังกรวารี","Aquadragon Beam","水龙光束"],"definition":{"n":"ลำแสงมังกรวารี","t":"m","el":"dragon","pw":145,"mp":16,"cd":2},"visual":"a whiskered ocean dragon head firing one straight pearl-blue beam beneath swirling water"},{"id":"solar_thalassyr_s3","names":["กระแสน้ำชำระวิญญาณ","Soulcleansing Current","净魂水流"],"definition":{"n":"กระแสน้ำชำระวิญญาณ","t":"heal","pw":28,"mp":22,"cd":3,"tg":"team","cure":1},"visual":"clear pearl water spiraling around several warm soul lights and washing away dark violet smoke"},{"id":"solar_thalassyr_s4","names":["วงคลื่นนาคราช","Serpent King Tidal Ring","龙王潮环"],"definition":{"n":"วงคลื่นนาคราช","t":"m","el":"water","pw":110,"mp":20,"cd":3,"all":1},"visual":"a long sapphire serpent dragon coiled inside a towering circular tidal wave"},{"id":"solar_thalassyr_s5","names":["เกล็ดมังกรแหวกบาดาล","Abysscleaving Dragonscale","破渊龙鳞"],"definition":{"n":"เกล็ดมังกรแหวกบาดาล","t":"m","el":"dragon","pw":190,"mp":23,"cd":3,"pi":0.2},"visual":"one gigantic iridescent dragon scale cutting the deep sea into two brilliant blue walls"},{"id":"solar_thalassyr_s6","names":["มหาสมุทรโอบดวงดาว","Star-Embracing Ocean","拥星之海"],"definition":{"n":"มหาสมุทรโอบดวงดาว","t":"m","el":"water","pw":275,"mp":34,"cd":5,"all":1},"visual":"an immense long ocean serpent dragon coiling around a luminous star above a spectacular rising spiral ocean"}]}],
 install(){for(const b of this.definitions){
  SP[b.id]={n:b.names[0],o:b.lore[0],t:b.types,em:'☀',r:99,rare:1,solar:1,gachaOnly:1,solarPair:b.ref,b:SP[b.ref].b.slice(),sk:b.skills.slice(0,5).map(s=>s.id),sig:b.skills[5].id,skillLevels:[1,5,11,18,25],signatureLevel:35,pas:b.pas,art:'assets/beasts/solar/'+b.id+'.webp',parts:[['แก่น'+b.names[0],0],['เศษผนึก'+b.names[0],0]]};
  for(const s of b.skills){SK[s.id]={...s.definition};if(typeof VSKID!=='undefined')VSKID.set(SK[s.id],s.id);}
  if(typeof BattleEffects!=='undefined')BattleEffects.legends[b.id]=b.theme;
 }
 if(typeof BEAST_RARITY_LABELS!=='undefined')BEAST_RARITY_LABELS.solar='อสูรตำนานสุริยคราส';
 if(typeof BEAST_FRAME_LABELS!=='undefined')BEAST_FRAME_LABELS.solar=['สุริยคราส · กรอบแดงสามมิติ','Eclipse · Sculpted red frame','日蚀 · 立体红框'];
 }
};
SolarBeasts.install();
// @soulbeast-end 1095-solarBeasts

// Boss defenses and small-group area specialization, shared by every battle mode.
PAS.archer_boss_evasion={n:'ล่องหนล่าบอส · Lv55',d:'โอกาสหลบเพิ่มอีก30%ต่อฮิตโจมตีจากบอส รวมท่าหมู่ ไม่ใช้จำนวนครั้งล่องหนเดิม'};
PAS.mage_elemental_barrier={n:'บาเรียธาตุ · Lv50',d:'ลดดาเมจโจมตีจากบอส50% สำหรับ3ฮิตแรกที่ผ่านการหลบและการป้องกันเดิม ต่อการต่อสู้ ไม่นับพิษหรือความเสียหายต่อเนื่อง'};
PAS.small_group_area={n:'ถล่มเป้าหมายจำกัด',d:'สกิลโจมตีหมู่แรงขึ้น50%เมื่อเริ่มใช้ท่าแล้วศัตรูมีชีวิตไม่เกิน2ตัว'};
function bossCareerPassives(cls,lv){const a=[];if(!cls)return a;const base=baseOf(cls);if(base==='archer'&&lv>=55)a.push('archer_boss_evasion');if(base==='mage'&&lv>=50)a.push('mage_elemental_barrier');if(['stormcaller','demolisher'].includes(cls))a.push('small_group_area');return a;}
const bossCareerHumanPas=humanPas;humanPas=function(cls,eq,lv=S?.P?.lv||0){return [...new Set([...bossCareerHumanPas(cls,eq,lv),...bossCareerPassives(cls,lv)])];};
const bossCareerUnit=unit;unit=function(o){const u=bossCareerUnit(o);if(['player','human'].includes(u.kind)&&!u.temporary){u.pas=[...new Set([...u.pas,...bossCareerPassives(u.cls,u.lv)])];if(u.elementalBarrierHits==null)u.elementalBarrierHits=u.cls&&baseOf(u.cls)==='mage'&&u.lv>=50?3:0;}return u;};
const bossCareerHits=[],bossCareerActions=[];
const bossCareerHit=hitOne;hitOne=function(u,sk,t,...args){bossCareerHits.push({u,t,barrier:false});try{return bossCareerHit(u,sk,t,...args);}finally{bossCareerHits.pop();}};
const bossCareerBlock=class10BlockHit;class10BlockHit=function(u,sk,t,damaging){
 const hero=['player','human'].includes(t.kind)&&!t.temporary;
 if(damaging&&u.boss&&hero&&t.cls&&baseOf(t.cls)==='archer'&&t.lv>=55&&Math.random()<.3){blog(t.name+' ล่องหนหลบการโจมตีบอส');vfx('miss',t.id);return true;}
 const blocked=bossCareerBlock(u,sk,t,damaging);if(blocked)return true;
 const c=bossCareerHits.at(-1);
 if(damaging&&u.boss&&hero&&t.cls&&baseOf(t.cls)==='mage'&&t.lv>=50&&t.elementalBarrierHits>0&&c?.u===u&&c?.t===t){c.barrier=true;t.elementalBarrierHits=Math.min(3,t.elementalBarrierHits)-1;blog(t.name+' บาเรียธาตุลดดาเมจ50% เหลือ '+t.elementalBarrierHits+' ฮิต');}
 return false;
};
const bossCareerDefense=classDefenseDamageFactor;classDefenseDamageFactor=function(u,t){const c=bossCareerHits.at(-1);return bossCareerDefense(u,t)*(c?.u===u&&c?.t===t&&c.barrier? .5:1);};
const bossCareerAct=act;act=function(u,id,...args){bossCareerActions.push({u,count:foesOf(u).filter(x=>x.hp>0).length});try{return bossCareerAct(u,id,...args);}finally{bossCareerActions.pop();}};
function smallGroupAreaFactor(u,sk){if(!['player','human'].includes(u.kind)||u.temporary||!['stormcaller','demolisher'].includes(u.cls)||!sk.all||!class10Damaging(sk))return 1;const c=bossCareerActions.at(-1),n=c?.u===u?c.count:foesOf(u).filter(x=>x.hp>0).length;return n>0&&n<=2?1.5:1;}
const bossCareerFactor=classCombatFactor;classCombatFactor=function(u,t,sk){return bossCareerFactor(u,t,sk)*smallGroupAreaFactor(u,sk);};
const bossCareerReplayApply=applyClass10Replay;applyClass10Replay=function(b,f){bossCareerReplayApply(b,f);for(const [id,hits]of f.elementalBarrierHits||[]){const u=[...b.allies,...b.enemies].find(x=>x.id===id);if(u)u.elementalBarrierHits=hits;}};

const bossCareerReplayFrame=replayFrame_;replayFrame_=function(r){bossCareerReplayFrame(r);if(r.replay?.frames?.length)r.replay.frames.at(-1).elementalBarrierHits=[...r.battle.allies,...r.battle.enemies].map(u=>[u.id,u.elementalBarrierHits||0]);};

// Opening gunner evasion: expires after two landed attack hits or first own action.
PAS.gunner_ambush55={n:'ซุ่มยิง · Lv55',d:'หลบฮิตโจมตีแน่นอน 2 ครั้งแรก หมดผลเมื่อจบการกระทำครั้งแรก ใช้ครั้งเดียวต่อการต่อสู้'};
const ambushHumanPas=humanPas;humanPas=function(cls,eq,lv=S?.P?.lv||0){const a=ambushHumanPas(cls,eq,lv);return cls&&baseOf(cls)==='gunner'&&lv>=55?[...new Set([...a,'gunner_ambush55'])]:a;};
const ambushUnit=unit;unit=function(o){const u=ambushUnit(o);if(u.ambushHits==null)u.ambushHits=['player','human'].includes(u.kind)&&!u.temporary&&u.cls&&baseOf(u.cls)==='gunner'&&u.lv>=55?2:0;return u;};
const ambushBlock=class10BlockHit;class10BlockHit=function(u,sk,t,damaging){if(damaging&&t.ambushHits>0){t.ambushHits--;blog(t.name+' ซุ่มยิงหลบการโจมตี เหลือ '+t.ambushHits+' ครั้ง');vfx('miss',t.id);return true;}return ambushBlock(u,sk,t,damaging);};
const ambushEnd=endUnitTurn;endUnitTurn=function(u){if(u)u.ambushHits=0;return ambushEnd(u);};

return {dispatch(packet){if(packet?.action==='account_retire_check'){try{const auth=pvpSaveAuth_(packet);if(pvpFindActive_(auth.code)||wbExisting_(auth.code))return {ok:false,error:'finish other battle'};return {ok:true};}catch(e){return {ok:false,error:e.message||String(e)};}}return JSON.parse((packet===null?doGet():doPost({postData:{contents:JSON.stringify(packet)}})).getContent());}};
}

const SB_TABLES=['Leaderboard','Saves','PVPRooms','PVPCommands','Camps','CampTransfers','WorldRooms','WorldEntries','WorldRewards','PvpWagers','Coupons','PlayerDirectory','CouponCredits','GachaTransactions','Friends','FriendChallenges','GuildState'];
const sbStable=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
const sbHex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
const sbHash=text=>sbHex(sha256(new TextEncoder().encode(text)));
function sbEqual(a,b){a=String(a);b=String(b);let diff=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)diff|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return diff===0;}

function createGameService({rpc,hash=sbHash,utilities=createUtilities(s=>sha256(new TextEncoder().encode(s)),()=>crypto.randomUUID()),engineFactory=createEngine}) {
 async function call(name,args){const response=await rpc(name,args);if(response.error)throw Error('database_unavailable');return response.data;}
 return async function execute(packet,env='test') {
  if(!['test','live'].includes(env))return {ok:false,error:'bad environment'};
  if(packet!==null&&(!packet||typeof packet!=='object'||Array.isArray(packet)))return {ok:false,error:'bad data'};
  const code=String(packet?.code||'').toUpperCase().replace(/[^A-Z0-9]/g,''),action=packet?.action||'leaderboard';
  const request=String(packet?._sbRequest||packet?.request||crypto.randomUUID());
  if(!/^[A-Za-z0-9_-]{12,96}$/.test(request))return {ok:false,error:'bad request'};
  const digest=hash(sbStable(packet));
  for(let attempt=0;attempt<5;attempt++){
   const snap=await call('sb_engine_snapshot',{p_env:env,p_request:request,p_code:code});
   if(!snap||!['test','live'].includes(snap.mode))return {ok:false,error:'migration_not_ready',liveGameSwitched:false};
   if(snap.receipt){if(!sbEqual(snap.receipt.digest,digest))return {ok:false,error:'request payload changed'};return snap.receipt.result;}
   if(snap.auth_locked)return {ok:false,error:'too many PIN attempts'};
   const tables=snap.tables||{},rows=tables.Saves||[],own=rows.slice(1).find(r=>String(r[0])===code);
   const tokenAuth=action.startsWith('pvp_')&&!['pvp_create','pvp_join','pvp_resume'].includes(action);
   if(packet!==null&&!tokenAuth){
    if(code.length<12||code.length>16)return {ok:false,error:'bad code'};
    const registersWithSave=typeof packet._preSave==='string'&&['wb_create','wb_join'].includes(action);
    if(!own&&action!=='save'&&!registersWithSave)return {ok:false,error:'notfound'};
    if(own&&own[1]&&!sbEqual(String(own[1]),hash(code+':'+String(packet.pin||'').slice(0,12)))){
     await call('sb_engine_auth_failure',{p_env:env,p_code:code});return {ok:false,error:'pin'};
    }
   }
   if(packet&&['leaderboard','delete'].includes(action)){
    const parts=own?.slice(6).map(x=>String(x||''));let P;
    try{const raw=parts[0]?.startsWith('SB64:')?utilities.newBlob(utilities.base64Decode(parts.map(x=>x.slice(5)).join(''))).getDataAsString():parts.join('');P=JSON.parse(raw).P;}catch{return {ok:false,error:'bad save'};}
    if(String(P.pid||'')!==String(packet.id||''))return {ok:false,error:'bad id'};
   }
   const workbook=createWorkbook(tables),engine=engineFactory(workbook,utilities);
   let preSaved=null;
   if(packet?._preSave){
    if(!['wb_create','wb_join'].includes(action))return {ok:false,error:'bad pre-save'};
    preSaved=engine.dispatch({action:'save',code,pin:packet.pin,data:packet._preSave});
    if(!preSaved.ok)return preSaved;
   }
   const result=engine.dispatch(packet);
   if(result.ok&&code.length>=12&&!tokenAuth){await call('sb_record_activity',{p_env:env,p_code:code});}
   const changes=workbook.changes();
   for(const name of Object.keys(changes))if(!SB_TABLES.includes(name))throw Error('unexpected_table');
   // Read-only calls avoid a second database round trip. Writes and reply receipts commit together.
   const publicResult={...result,...(preSaved?{account:preSaved.account,coupons:preSaved.coupons,savedAt:preSaved.at}:{}),backend:'supabase',environment:env,storageVersion:1};
   if(!Object.keys(changes).length)return publicResult;
   const committed=await call('sb_engine_commit',{p_env:env,p_expected:snap.revision,p_request:request,p_digest:digest,p_changes:changes,p_result:publicResult});
   if(committed.conflict)continue;
   if(committed.error)return {ok:false,error:committed.error};
   return committed.result;
  }
  return {ok:false,error:'busy'};
 };
}


