// Small, individually composed vector illustrations. Existing painted signature art is retained.
const fs=require('fs'),crypto=require('crypto');
const g=require('./game-context.cjs')('build/staging-index.html');
const data=JSON.parse(g.run('JSON.stringify({skills:SK,classes:CLS,elements:EL,signature:SIGNATURE_ART,abilities:CLASS_ABILITY_ART})'));
const folder='assets/skills/individual';fs.mkdirSync(folder,{recursive:true});
const symbols={
 sword:'<path d="M59 87 85 61M54 75l20 20M68 72 30 34 21 17 38 26 78 65Z"/><path d="m27 23 45 47" fill="none"/>',
 dagger:'<path d="m36 84 11-15-15-36 3-17 29 49-8 11 13 13-8 8Z"/><path d="m61 72 15-19 3-24 11-12-1 46-17 19"/>',
 axe:'<path d="m43 95 33-74 7 3-32 75Z"/><path d="M70 26Q47 13 36 32L53 59Q62 41 73 42L87 51 96 25Q81 32 70 26Z"/>',
 hammer:'<path d="m45 96 29-64 9 4-28 65Z"/><path d="m46 22 14-13 40 18-2 23-16 9-39-18Z"/><path d="m60 9 1 22 37 19M43 41l18-10" fill="none"/>',
 shield:'<path d="m61 13 33 13-3 37Q86 85 61 99 34 85 29 63l-2-37Z"/><path d="m61 27 19 8-2 27Q73 78 61 85 46 77 43 61l-2-26Z" fill="none"/>',
 arrow:'<path d="m27 92 62-70M70 28l22-14-9 26-2-12Z"/><path d="m28 79 9 7-1 12-17 6 3-17Z"/><path d="M43 17q51 32 54 65M43 17l54 65-54-11Z" fill="none"/>',
 gun:'<path d="m21 33 69 2 12 10-8 14-38-2-2 33-20-4 5-33-18-2Z"/><path d="M67 36v17M34 41h25M56 57q20 20 24 0" fill="none"/>',
 staff:'<path d="m37 99 34-64 6 4-32 65Z"/><path d="M68 38Q44 25 64 11q24-9 29 14-4 20-25 13Z"/><path d="m75 17 8 10-12 6-6-8Z"/>',
 leaf:'<path d="M26 88Q8 30 93 16 102 89 26 88Z"/><path d="m26 88 54-56M43 72l-7-26M57 57l24 3" fill="none"/>',
 vine:'<path d="M24 99C95 70 10 50 76 15M43 83Q16 68 14 52q29 0 29 31M52 49q39-1 44-25-31-1-44 25" fill="none"/>',
 fire:'<path d="M59 13Q80 37 72 49q21-8 18-24 34 55-5 74-37 15-52-12-14-26 11-53-1 24 12 28Q73 40 59 13Z"/><path d="M59 92Q41 79 60 57q22 23 10 36Z" fill="#fff2b6"/>',
 water:'<path d="M61 12Q49 39 34 58 13 91 53 100q42 5 41-29-2-17-33-59Z"/><path d="M42 72q-8 17 11 19M65 49q18 21 16 31" fill="none"/>',
 bolt:'<path d="m69 8-42 52 28-2-15 49 53-64-31 5Z"/>',
 rock:'<path d="m16 76 22-37 28-20 28 26 9 39-48 17Z"/><path d="m38 39 17 62 12-43 27-13M16 76l51-18-1-39" fill="none"/>',
 ice:'<path d="m60 9 21 26-7 53-17 18-24-39 7-34Z"/><path d="m60 9-3 97M40 33l17 22 24-20M33 67l24-12 17 33" fill="none"/>',
 wind:'<path d="M14 44q54-38 78-13 17 21-12 24-13-3-4-13M16 64q56-24 81-5M25 82q48-9 58 7 7 15-10 16" fill="none" stroke-width="7"/>',
 wing:'<path d="M30 92Q3 37 96 15 94 49 76 51l-16 1 19 5Q69 75 48 71l17 11q-14 13-35 10Z"/><path d="m30 92 49-57M30 92l18-21" fill="none"/>',
 skull:'<path d="M34 75Q10 28 51 17q49-10 48 33-1 16-18 28l-3 19H44l-3-22Z"/><path d="m39 46 15 9-3 15-17-8ZM70 53l16-10 3 19-17 9ZM59 64l-5 13h12Z" fill="#0b1625"/><path d="M54 86v12m12-12v12" fill="none"/>',
 eye:'<path d="M13 60Q58 10 106 60 60 111 13 60Z"/><circle cx="60" cy="60" r="22"/><circle cx="60" cy="60" r="8" fill="#07121f"/>',
 claw:'<path d="M24 102Q45 53 39 15q34 31-3 90M51 104Q71 54 63 9q36 41-1 98M77 99Q99 55 88 24q29 31 0 76"/>',
 fang:'<path d="M24 21q33-6 28 29L35 93 22 61Zm44-1q32 1 24 33L73 94 64 57Z"/>',
 fist:'<path d="M26 48V30q4-13 13-6 1-18 13-14 12-7 18 6 11-4 15 9v19q19-12 20 4L90 82 66 99 31 88 18 65q-6-14 8-17Z"/><path d="m39 24 2 27m11-41 4 36m14-30 3 30M26 48l25 18 25-4" fill="none"/>',
 kick:'<path d="m67 10 18 8-28 47 38 14 6 16-13 8-52-24-9-16Z"/>',
 cross:'<path d="M49 18h23v27h27v23H72v29H49V68H21V45h28Z"/>',
 heart:'<path d="M60 99Q3 66 19 35q16-26 41-4 25-23 41 5 16 30-41 63Z"/><path d="m32 61 18 0 8-17 10 32 10-15h17" fill="none"/>',
 potion:'<path d="M47 12h27v13l-5 6v16q36 17 27 40-7 20-36 16-34 0-36-22-3-22 27-35V31l-4-6Z"/><path d="M29 71q29-16 63 0M48 18h23" fill="none"/>',
 coin:'<circle cx="62" cy="58" r="37"/><circle cx="62" cy="58" r="27" fill="none"/><path d="m62 36 16 21-16 23-16-23Z"/>',
 cart:'<path d="m18 25 16 3 9 51h46l14-40H37M52 80l-4 10h42" fill="none" stroke-width="7"/><circle cx="53" cy="100" r="7"/><circle cx="84" cy="100" r="7"/><path d="m48 46 25-14 19 18-8 19H55Z"/>',
 music:'<path d="M43 77V24l49-12v57M43 35l49-12" fill="none" stroke-width="8"/><ellipse cx="30" cy="83" rx="16" ry="11" transform="rotate(-25 30 83)"/><ellipse cx="80" cy="77" rx="16" ry="11" transform="rotate(-25 80 77)"/>',
 moon:'<path d="M79 16Q21 7 18 57q1 53 59 47-38-17-35-49 3-26 37-39Z"/>',
 sun:'<circle cx="60" cy="60" r="25"/><path d="M60 6v16m0 76v16M6 60h16m76 0h16M21 21l12 12m54 54 12 12M21 99l12-12m54-54 12-12" fill="none" stroke-width="6"/>',
 portal:'<ellipse cx="61" cy="61" rx="34" ry="46"/><ellipse cx="61" cy="61" rx="23" ry="35" fill="#0b1625"/><path d="m61 24 8 32 19 5-19 6-8 30-8-30-19-6 19-5Z"/>',
 ghost:'<path d="M22 101V47Q22 12 60 13q38 0 38 34v54L79 89l-18 14-18-14Z"/><ellipse cx="46" cy="50" rx="7" ry="12" fill="#0b1625"/><ellipse cx="76" cy="50" rx="7" ry="12" fill="#0b1625"/>',
 dragon:'<path d="m17 82 21-20-4-23 16 7L69 12l8 21 23-2-12 22 16 13-29 9-13 27-15-12Z"/><path d="m50 46 24 5-11 19-25-8M69 12l-6 28" fill="none"/><circle cx="75" cy="48" r="4" fill="#091325"/>',
 wolf:'<path d="m25 19 23 17 24-2 22-19-1 43-12 28-21 18-23-19-15-26Z"/><path d="m35 53 17 9m16 0 17-11M49 82l11-7 13 6-13 12Z" fill="#091325"/>',
 bear:'<circle cx="30" cy="29" r="15"/><circle cx="90" cy="29" r="15"/><path d="M24 37q36-28 72 0l3 35q-9 32-39 32-35-2-40-33Z"/><ellipse cx="60" cy="78" rx="23" ry="17"/><path d="m51 70 18 0-9 12Z" fill="#091325"/><circle cx="42" cy="52" r="4" fill="#091325"/><circle cx="79" cy="52" r="4" fill="#091325"/>',
 shuriken:'<path d="m60 6 12 34 39 10-33 21-5 39-23-32-38-1 25-28Z"/><circle cx="60" cy="60" r="10" fill="#091325"/>',
 hourglass:'<path d="M33 12h55v10H33Zm0 86h55v10H33ZM39 24q0 22 21 36-21 14-21 36h43q0-22-22-36 22-14 22-36Z"/><path d="m46 37 28 0-14 17Zm-2 51 16-18 16 18Z" fill="#fff0a8"/>',
 crown:'<path d="M27 90 15 34l27 19 17-34 19 34 28-19-13 56Z"/><path d="M29 76h63M37 93h47" fill="none"/><circle cx="60" cy="64" r="8"/>',
 trap:'<path d="M22 79q38-35 77 0L85 50 73 67 59 43 45 68 33 50Zm-1 3q37 30 78 0L84 105H37Z"/><path d="M32 82h56" fill="none"/>',
 book:'<path d="M12 27q24-14 47 0 26-15 48 0v65q-25-14-48 0-23-14-47 0Z"/><path d="M59 27v65M25 43l21 1m-21 14h21m27-13h21m-21 13h21" fill="none"/>',
 chain:'<g fill="none" stroke-width="9"><ellipse cx="42" cy="77" rx="17" ry="25" transform="rotate(40 42 77)"/><ellipse cx="79" cy="36" rx="17" ry="25" transform="rotate(40 79 36)"/><path d="m46 73 31-35"/></g>',
 burst:'<path d="m60 6 10 31 30-17-16 30 30 10-30 10 16 30-30-16-10 30-10-30-30 16 16-30L6 60l30-10-16-30 30 17Z"/>',
 sleep:'<path d="M23 91q-8-41 39-53 35-9 38 27-12-13-28-4 6 28-49 30Z"/><path d="m37 22 19 0-15 17h20m10-32h24L77 28h25" fill="none"/>',
 smoke:'<path d="M22 85Q4 66 28 51 14 24 43 23q20-23 41 1 25-4 25 20 14 18-8 31-2 29-35 21-23 14-44-11Z"/><path d="M33 62q30-31 48 0M41 78q25-13 43-2" fill="none"/>',
 tower:'<path d="M30 101V40L18 28V12h18v13h16V12h17v13h17V12h18v16L92 40v61Z"/><path d="M50 101V75q10-19 22 0v26M42 45v14m37-14v14" fill="none"/>',
 whip:'<path d="M23 100 42 70l9 6-21 29ZM45 69Q11 32 56 14q40-10 41 20 0 25-35 16-13-4-7-16" fill="none" stroke-width="9"/>',
 hand:'<path d="m21 94 4-32-12-21q-3-12 9-9l17 19-2-32q0-12 10-5l6 29 3-34q4-12 11 0l2 32 9-26q9-9 13 3l-7 32 11-16q13-4 11 8L91 80l-18 21Z"/>',
 soul:'<path d="M59 8Q29 38 28 68q1 35 33 36 36-1 34-33-1-14-19-30 5 20-8 27-23-21-9-60Z"/><circle cx="59" cy="81" r="13" fill="#0b1625"/>',
 golem:'<path d="m44 10 32 0 8 20-21 12-25-12Zm-7 31 48 0 7 43-30 15-32-16ZM12 38l18 4-8 45-17-6Zm82 3 18-2 6 41-17 6ZM31 88l22 7-4 19H25Zm39 7 23-8 9 25-26 2Z"/>',
 target:'<circle cx="60" cy="60" r="37" fill="none"/><circle cx="60" cy="60" r="21" fill="none"/><path d="M60 5v28m0 54v28M5 60h28m54 0h28" fill="none" stroke-width="6"/>',
 armor:'<path d="m34 14 16 10h23l15-10 19 24-17 17-7 47H36l-7-47-17-17Z"/><path d="m50 24 10 21 13-21M36 78h47M45 48l-6 18m39-18 4 18" fill="none"/>'
};
Object.assign(symbols,{
 tail:'<path d="M16 93Q103 112 96 34q-2-23-21-24 12 29-9 42-19 10-29-2 5 35-21 43Z"/><path d="m61 74 17-12 7 12M73 52l18-7" fill="none"/>',
 hoof:'<path d="m39 9 42 0-6 43 21 32-6 21H23l-5-21 26-32Z"/><path d="M60 72v31M25 80l64-1M43 34h35" fill="none"/>',
 cannon:'<path d="m31 64 46-48 26 22-42 53Z"/><ellipse cx="89" cy="27" rx="17" ry="11" transform="rotate(42 89 27)" fill="#142537"/><circle cx="40" cy="91" r="18"/><circle cx="40" cy="91" r="7"/><path d="M48 67 16 103h72" fill="none" stroke-width="6"/>',
 breath:'<path d="m14 60 23-22 20 5 5 15-18 9-9 22-20-10Z"/><path d="m60 55 20-16 29 4-17 12 23 10-25 4 14 21-31-7-14-15Z"/>',
 beam:'<path d="m9 85 90-76 18 23-91 77Z"/><path d="m13 95 96-78M3 68l81-65M44 121l78-65" fill="none" stroke-width="4"/>',
 sound:'<path d="m15 52 21 0 22-20v61L36 74H15Z"/><path d="M72 41q26 20 0 42m14-57q45 35 0 73" fill="none" stroke-width="7"/>',
 spear:'<path d="m17 106 61-74 5 5-60 74Z"/><path d="m68 37 9-22 29-12-8 33-24 11Z"/><path d="m76 35 23-25M68 49l19 15" fill="none"/>',
 seed:'<path d="M61 105q-2-42 3-63M62 63Q25 67 17 34q36-4 45 29M64 43q0-32 33-34 9 31-33 34" fill="none" stroke-width="7"/><ellipse cx="61" cy="94" rx="24" ry="14"/>',
 meteor:'<path d="m37 85 46-73 26-9-4 34-45 64Z"/><circle cx="37" cy="85" r="25"/><path d="m72 31 26-18M68 61l30-32M21 58l25-36" fill="none"/>',
 slash:'<path d="M13 106Q20 42 111 10 49 57 36 100Z"/><path d="M32 112Q48 72 112 49 81 82 69 106Z"/><path d="M11 80Q35 34 71 21" fill="none"/>',
 mask:'<path d="M22 20q38 19 76 0l-5 49q-9 31-34 40-26-12-32-40Z"/><path d="m34 49 21 8-5 13-17-6Zm31 8 22-8 1 16-18 5Z" fill="#091625"/><path d="M45 87q15-13 30 0" fill="none"/>',
 person:'<circle cx="61" cy="24" r="13"/><path d="m44 45 33 0 17 24-16 8-6-19 5 52H62l-1-30-7 30H39l8-52-13 19-14-8Z"/>',
 rune:'<path d="m60 9 43 26v51l-43 25-43-25V35Z" fill="none"/><path d="m60 23 25 42-25 28-25-28Zm0 0v70M35 65h50M18 35l85 51m0-51L18 86" fill="none" stroke-width="3"/>',
 thorn:'<path d="M18 107q48-16 71-92M37 96 17 70l30 3M58 75 46 39l25 12M76 45l-3-30 22 9" fill="none" stroke-width="7"/>',
 horn:'<path d="M21 98Q7 35 99 9 55 49 69 96Z"/><path d="m25 72 34-10m-29-5 31-12M43 38l30-11" fill="none"/>'
});
function choose(id,s,owner){const n=s.n||id;
 const legendaryWeapon=id.match(/^lgs\d+_(sword|axe|bow|staff|mace|gun|dagger|whip)$/)?.[1];if(legendaryWeapon)return ({bow:'arrow',mace:'hammer'})[legendaryWeapon]||legendaryWeapon;
 const specific={attack:'slash',rest:'sleep',revert:'person',heal_self:'heart',teamheal:'music',sw_bash:'sword',sw_magnum:'fire',sw_quick:'wing',sw_endure:'armor',sw_twin:'dagger',sw_charge:'moon',sw_break:'shield',ms_swordsman10:'slash',ms_swordsman20:'heart',ms_swordsman30:'beam',ms_swordsman40:'sword',ms_swordsman50:'soul',ms_swordsman60:'crown',sa_zanshin:'eye',class10_parry:'shield'};
 if(specific[id])return specific[id];
 for(const [re,m]of [[/หาง/,'tail'],[/กีบ/,'hoof'],[/ปืนใหญ่/,'cannon'],[/ลมหายใจ|พ่น/,'breath'],[/ลำแสง/,'beam'],[/คลื่นเสียง|เสียงหึ่ง|คำราม|หอน|ตะโกน/,'sound'],[/หอก/,'spear'],[/เมล็ด/,'seed'],[/เมเทออร์|อุกกาบาต|ดาวตก/,'meteor'],[/ทลายเกราะ|ปลดอาวุธ/,'armor'],[/กากบาท|ฟันสอง|ดาบคู่|ร้อยดาบ|พันมีด/,'slash'],[/เถาวัลย์|หนาม|ราก/,'thorn'],[/เขา.*แทง/,'horn'],[/มนต์|ร่ายเวท|เวทยาว|รวมพลัง/,'rune']])if(re.test(n))return m;
 const rules=[[/แยกร่าง|เงียบ|ซ่อนตัว|ไร้เงา/,'ghost'],[/หมาป่า/,'wolf'],[/แปลงร่างหมี/,'bear'],[/เหยี่ยว|แปลงร่าง.*ปักษา/,'wing'],[/โกเลม/,'golem'],[/รถเข็น/,'cart'],[/ยา|ปรุง/,'potion'],[/เวล|ถ่วง/,'hourglass'],[/ฟื้น|รักษา|เยียวยา|คืนชีพ|ชุบ/,'cross'],[/เพลง|ร่ายรำ|บทเพลง/,'music'],[/เงิน|ทอง|สินบน|สมบัติ|ทุ่ม/,'coin'],[/ค้อน|ทุบ/,'hammer'],[/กับดัก/,'trap'],[/แส้/,'whip'],[/โซ่|พันธนาการ|เชื่อมใจ|สายใย/,'chain'],[/ควัน|หมอก/,'smoke'],[/นิทรา|หลับ|กล่อม/,'sleep'],[/เคลือบ|พิษ/,'fang'],[/ดาบ|ฟัน|ซันชิน|ไร้นาย|ลับคม/,'sword'],[/มีด|แทง|เฉือน/,'dagger'],[/กระสุน|ปืน|ระดมยิง|ยิงกวาด|ยิงรัว|ยิงขา|เล็งหัว|ยิงกระจาย|เล็งยิง/,'gun'],[/ศร|ธนู|ยิงสอง/,'arrow'],[/โล่|ปัดป้อง|ยั่วยุ/,'shield'],[/กำแพง|ปราการ|ป้อม/,'tower'],[/เกราะ|ตั้งท่า/,'armor'],[/ขวาน|คลั่ง/,'axe'],[/กรงเล็บ/,'claw'],[/เขี้ยว|กัด/,'fang'],[/หมัด|ฝ่ามือ|กระแทก/,'fist'],[/เตะ/,'kick'],[/ดวงตา|สายตา|ตาเทพ|สัญชาตญาณ|เล็ง/,'eye'],[/เมล็ด|ใบไม้|ใบมีด|พงไพร/,'leaf'],[/เถาวัลย์|กิ่ง|หนาม/,'vine'],[/หอก.*น้ำแข็ง|น้ำแข็ง|เหมันต์|หิมะ|เยือก/,'ice'],[/พายุ|ลม|พริบตา/,'wind'],[/อัสนี|สายฟ้า|อสนี|ช็อต|ไฟฟ้า/,'bolt'],[/เพลิง|ลูกไฟ|ไฟ|เมเทออร์/,'fire'],[/วารี|น้ำ|วังน้ำวน/,'water'],[/ภูผา|ศิลา|แผ่นดิน|ดิน|โคลน/,'rock'],[/มังกร/,'dragon'],[/ตะวัน|สุริยะ|ศักดิ์สิทธิ์|แสง/,'sun'],[/จันทรา|จันทร/,'moon'],[/มรณะ|โรค|สาป|ระบาด/,'skull'],[/จักรพรรดิ|อาณาจักร|เทพ/,'crown'],[/ผนึก|อัญเชิญ|มิติ/,'portal'],[/วิญญาณ|จิต|มานา/,'soul'],[/ปลุก|พลัง|ประจุ/,'burst']];
 if(s.enchant)return 'sword';if(s.steal)return 'hand';
 for(const [re,m]of rules)if(re.test(n))return m;
 const base=owner&&owner.replace(/^(ms_)/,'');
 return ({swordsman:'sword',samurai:'sword',gladiator:'shield',archer:'arrow',gunner:'gun',mage:'staff',druid:'leaf',thief:'dagger',summoner:'portal',merchant:'coin'})[base]||({fire:'fire',water:'water',grass:'leaf',electric:'bolt',ice:'ice',fighting:'fist',ground:'rock',rock:'rock',flying:'wing',bug:'claw',poison:'fang',psychic:'eye',ghost:'ghost',dark:'skull',dragon:'dragon',steel:'sword',fairy:'staff'})[s.el]||'burst';
}
const owners={};for(const[id,c]of Object.entries(data.classes))for(const[,skill]of c.sk)owners[skill]||=id;
const palette={normal:'#dfc993',fire:'#ff8750',water:'#4bd7ed',electric:'#ffe070',ground:'#dbac6a',flying:'#a9e7cf',grass:'#a9dc65',ice:'#96e9ff',dark:'#ac8ff0',ghost:'#bbaaef',psychic:'#f49fda',poison:'#c392ee',steel:'#bddae8',dragon:'#a88bff',fairy:'#ffc2e5',fighting:'#f5b584',rock:'#dcc18b',bug:'#cbdc79'};
const meta=[];const skills={...data.skills,defend:{n:'ตั้งรับ',t:'buff',immune:'p'}};
for(const[id,s]of Object.entries(skills)){
 if(data.signature[id]){meta.push({id,name:s.n,source:'painted-signature',...data.signature[id]});continue;}
 if(data.abilities[id]){const path='assets/skills/class-abilities-v1/'+data.abilities[id]+'.webp';meta.push({id,name:s.n,source:'painted-ability',path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')});continue;}
 const owner=owners[id],motif=choose(id,s,owner),h=crypto.createHash('sha256').update(id).digest();
 const c=palette[s.enchant||s.el]||({heal:'#a7efc5',buff:'#ead18f',form:'#c5a2f4',rest:'#a9cfe5'})[s.t]||'#d9c69c';
 const variant=h[0]%4,tilt=[-12,-5,6,13][variant],focus=!!(s.all||s.rt),hits=Math.min(5,s.hits||(/คู่|สอง/.test(s.n)?2:/สาม/.test(s.n)?3:1));
 const action=s.enchant?'infuse':s.t==='heal'||s.rev||s.revAll?'restore':s.summon||s.t==='form'?'summon':s.t==='buff'?'ward':s.t==='status'||s.t==='debuff'?'curse':focus?'area':s.t==='m'?'spell':'strike';
 let scene='';
 if(action==='ward')scene='<path d="M24 36 64 14l40 22v47L64 112 24 83Z" fill="none" stroke="'+c+'" opacity=".5" stroke-width="2"/><circle cx="64" cy="64" r="47" fill="none" stroke="'+c+'" stroke-dasharray="3 9"/>';
 if(action==='summon')scene='<ellipse cx="64" cy="100" rx="53" ry="16" fill="none" stroke="'+c+'" stroke-width="3"/><ellipse cx="64" cy="100" rx="38" ry="10" fill="none" stroke="'+c+'"/><path d="M20 83V34m88 49V34M32 66V20m64 46V20" stroke="'+c+'" opacity=".5"/>';
 if(action==='curse')scene='<path d="m17 17 94 94m0-94-94 94" stroke="'+c+'" stroke-width="3" opacity=".35"/><circle cx="64" cy="64" r="45" fill="none" stroke="'+c+'" stroke-dasharray="17 7 2 7"/>';
 if(action==='restore')scene='<path d="M17 114 35 12M58 126 64 4m47 110L92 12" stroke="'+c+'" stroke-width="9" opacity=".16"/><path d="M18 33v14m-7-7h14M105 76v18m-9-9h18" stroke="'+c+'" stroke-width="3"/>';
 if(action==='strike')scene=Array.from({length:hits},(_,i)=>'<path d="M'+(4+i*16)+' 115Q'+(38+i*10)+' 41 '+(112+i*4)+' 11" fill="none" stroke="'+c+'" opacity="'+(.23+i*.12)+'" stroke-width="'+(9-i)+'"/>').join('');
 if(action==='area')scene='<ellipse cx="64" cy="100" rx="57" ry="21" fill="none" stroke="'+c+'" stroke-width="3"/><path d="M6 108 32 69m90 39L96 69M64 120V88" stroke="'+c+'" stroke-width="4"/>';
 if(action==='spell'||action==='infuse')scene='<circle cx="64" cy="64" r="49" fill="none" stroke="'+c+'" opacity=".6" stroke-width="2"/><path d="m64 10 47 81H17Zm0 108L17 37h94Z" fill="none" stroke="'+c+'" opacity=".3"/>';
 let accent='';const legendMotif={lgs1:'moon',lgs2:'fire',lgs3:'skull',lgs4:'dragon',lgs5:'burst',lgs6:'soul'}[id.split('_')[0]];const em=legendMotif||{fire:'fire',water:'water',electric:'bolt',ground:'rock',flying:'wing',grass:'leaf',ice:'ice',poison:'fang',dragon:'dragon',ghost:'ghost',dark:'moon',psychic:'eye',steel:'sword',fairy:'sun'}[s.enchant||s.el];
 if(em&&em!==motif)accent='<g transform="translate('+(variant%2?75:3)+' 78) scale(.37)" opacity=".95" fill="url(#metal)" stroke="'+c+'" stroke-width="3">'+symbols[em]+'</g>';
 // Multi-hit and stronger skills have separate silhouettes/compositions, not recoloured atlas cells.
 let subject='<g transform="translate(4 4) rotate('+tilt+' 60 60)" fill="url(#metal)" stroke="#172436" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">'+symbols[motif]+'</g>';
 if(hits>1)subject='<g opacity=".3" transform="translate(-8 6) scale(.83)">'+subject+'</g>'+subject;
 if(/พัน|ร้อย|มหา|พิโรธ|สวรรค์|สิ้นโลก/.test(s.n))scene+='<path d="m64 1 6 16 15-7-7 16 16 6-16 6 7 15-15-7-6 16-6-16-15 7 7-15-16-6 16-6-7-16 15 7Z" fill="'+c+'" opacity=".36"/>';
 const orbit=Array.from({length:3+(h[1]%4)},(_,i)=>{const a=(i*2.4+h[2]/40),r=47+(i%2)*5;const x=64+Math.cos(a)*r,y=64+Math.sin(a)*r;return '<path d="m'+x.toFixed(1)+' '+(y-3).toFixed(1)+' 2 3-2 3-2-3Z" fill="'+c+'" opacity=".8"/>';}).join('');
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><radialGradient id="bg" cx="40%" cy="35%"><stop stop-color="'+c+'" stop-opacity=".3"/><stop offset="1" stop-color="#07101e"/></radialGradient><linearGradient id="metal" x2=".8" y2="1"><stop stop-color="#fff4c8"/><stop offset=".42" stop-color="'+c+'"/><stop offset="1" stop-color="#547082"/></linearGradient></defs><rect width="128" height="128" rx="16" fill="#0a1422"/><rect width="128" height="128" rx="16" fill="url(#bg)"/>'+scene+orbit+subject+accent+'</svg>';
 fs.writeFileSync(folder+'/'+id+'.svg',svg);meta.push({id,name:s.n,source:'individual-svg',path:folder+'/'+id+'.svg',owner:owner||null,motif,action,hits,composition:variant,sha256:crypto.createHash('sha256').update(svg).digest('hex')});
}
fs.writeFileSync('content/individual-skill-art.json',JSON.stringify({version:1,method:'Individually composed code-native SVG illustrations; existing unique painted signature cells retained.',skills:meta},null,2)+'\n');
const cards=meta.map(a=>'<article><div class="art">'+(a.path?'<img loading="lazy" decoding="async" src="'+a.path+'" alt="">':'<span style="display:block;width:92px;height:92px;background-image:url(assets/skills/signatures-'+a.kind+'.webp);background-size:800% 800%;background-position:'+(a.index%8*100/7)+'% '+(Math.floor(a.index/8)*100/7)+'%"></span>')+'</div><b>'+a.name+'</b><small>'+a.id+'</small></article>').join('');
fs.writeFileSync('skill-art-preview.html','<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Soulbeast · ภาพสกิล</title><style>body{background:#091420;color:#e8e2ce;font-family:Tahoma,sans-serif;margin:20px}h1{font-size:24px}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(135px,1fr));gap:12px}article{background:#172637;border:1px solid #665b3b;border-radius:14px;padding:14px;text-align:center}.art{display:flex;justify-content:center;margin-bottom:8px}.art img{width:92px;height:92px}b{font-size:14px;display:block}small{display:block;font-size:10px;opacity:.6;margin-top:6px;overflow-wrap:anywhere}</style><h1>ภาพสกิลเฉพาะแต่ละท่า · '+meta.length+' สกิล</h1><p>คงภาพวาดสกิลเอกลักษณ์ และเพิ่มภาพเฉพาะให้สกิลที่เคยใช้ภาพซ้ำ</p><main>'+cards+'</main></html>');
console.log('Skill art:',meta.length,'entries,',meta.filter(a=>a.source==='individual-svg').length,'individual vector illustrations; retained painted artwork for the remaining skills.');
