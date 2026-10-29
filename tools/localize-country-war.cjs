const fs=require('fs'),acorn=require('module').createRequire(require('path').resolve('tools/runtime-build/modules.cjs'))('acorn'),g=require('./game-context.cjs')('build/staging-index.html');
const file='content/localization.js',source=fs.readFileSync(file,'utf8'),marker='// Country war localization extension.',start=source.indexOf(marker),raw=source.slice(start),extra=JSON.parse(raw.slice(raw.indexOf('extra=')+6,raw.indexOf(';SoulbeastContent.GAME_TRANSLATIONS='))),terms=require('../content/country-war-translations.json');
Object.assign(terms,{
 'หิมะ':['Snow','雪地'],'ภูเขาไฟ':['Volcano','火山'],'ชายฝั่งและเกาะ':['Coast and islands','海岸与岛屿'],'ภูเขา':['Mountain','山地'],
 'สงครามอาณาจักร':['Kingdom War','王国战争'],'เลือกอาณาจักร':['Choose a kingdom','选择王国'],'รายได้ประเทศรายวัน':['Daily kingdom income','王国每日收入'],
 'หมู่บ้านละ 10 เหรียญ · เมืองละ 100 เหรียญ':['10 gold per village · 100 gold per city','每村庄10金币 · 每城市100金币'],
 'แจกทุกวัน 22:00 ไทย แบ่งเท่ากันทุกตัวละครในประเทศ และสะสมเศษเงิน':['Paid daily at 22:00 Bangkok, shared equally by every kingdom character; fractions carry over','每日泰国时间22:00发放，王国所有角色均分并累计零头'],
 'รางวัลรายวัน':['Daily reward','每日奖励'],'รางวัลรายสัปดาห์':['Weekly reward','每周奖励'],
 'สามอาณาจักร · ยึดครองและป้องกันฐาน':['Three kingdoms · Conquer and defend bases','三大王国 · 占领并守卫据点'],
 'อัตโนมัติพร้อมอสูรตาม PVP':['Automatic combat with your PVP beasts','携带PVP兽队自动战斗'],
 'บันทึกการต่อสู้':['Battle log','战斗记录'],
 'เลือกอาชีพที่เหมาะกับคุณ':['Choose a class that suits you','选择适合你的职业'],
 'อันดับอาณาจักรรายเดือน':['Monthly kingdom standings','王国月度排名'],
 'หมู่บ้าน 1 คะแนน · เมืองหลวง 4 คะแนน · คะแนนเท่ากันได้อันดับร่วม':['Village: 1 point · Capital: 4 points · Equal scores share a rank','村庄1分 · 首都4分 · 同分并列'],
 'อันดับ 1: คนละ 10 คูปอง':['Rank 1: 10 coupons each','第1名：每角色10张券'],
 'อันดับ 2: คนละ 5 คูปอง':['Rank 2: 5 coupons each','第2名：每角色5张券'],
 'อันดับ 3: คนละ 1,000 เหรียญ':['Rank 3: 1,000 gold each','第3名：每角色1000金币'],
 'แจกวันที่ 1 เวลา 00:00 ไทย แล้วคืนฐานเดิม ส่งทุกคนกลับเมืองหลวงและฟื้น HP/MP เต็ม เศษรางวัลสะสมยังคงอยู่':['Paid on the first at 00:00 Bangkok, then bases reset and everyone returns to their capital with full HP/MP. Reward fractions carry over','每月1日泰国时间00:00发奖，随后重置据点，全员满HP/MP返回首都。奖励零头保留'],
 'รางวัลรายเดือน · อันดับ':['Monthly reward · Rank','月度奖励 · 排名'],
 'คะแนน':['Points','积分'],
 'รีเซ็ตฐานแล้ว ทุกคนกลับเมืองหลวงพร้อม HP/MP เต็ม':['Bases reset; everyone returns to the capital with full HP/MP','据点已重置，全员满HP/MP返回首都']
});
fs.writeFileSync('content/country-war-translations.json',JSON.stringify(terms,null,2)+'\n');
const literals=new Set();const ast=acorn.parse(fs.readFileSync('runtime/countryWar.js','utf8'),{ecmaVersion:'latest'});
function visit(n,onlyCreation=false){if(!n||typeof n!=='object')return;const s=n.type==='Literal'?n.value:n.type==='TemplateElement'?n.value.cooked:null;if(typeof s==='string'&&/[ก-๙]/.test(s)&&(!onlyCreation||s.includes('เลือกอาชีพที่เหมาะกับคุณ')))literals.add(s);for(const v of Object.values(n))if(Array.isArray(v))v.forEach(x=>visit(x,onlyCreation));else if(v&&typeof v==='object')visit(v,onlyCreation);}visit(ast);visit(acorn.parse(fs.readFileSync('runtime/activityPets.js','utf8'),{ecmaVersion:'latest'}));visit(acorn.parse(fs.readFileSync('runtime/ui.js','utf8'),{ecmaVersion:'latest'}),true);
literals.add('เลือกอสูรที่พกติดตัวตามจำนวนที่อาชีพใช้ได้');literals.add('เลือกอสูรเข้าร่วมบอสโลก');
const missing=[];for(const s of literals)for(const [i,lang]of ['en','zh-CN'].entries()){
 let t=s;for(const [th,pair]of Object.entries(terms).sort((a,b)=>b[0].length-a[0].length))t=t.split(th).join(pair[i]);
 t=g.run('translateGameText('+JSON.stringify(t)+','+JSON.stringify(lang)+',false)');if(/[ก-๙]/.test(t))missing.push({s,lang,t});else extra[lang][s]=t;
}
if(missing.length){console.log(JSON.stringify(missing,null,2));process.exit(1);}
// Preserve complete existing phrases when a new short kingdom term also matches their prefix.
const vm=require('vm'),baseline=vm.createContext({SoulbeastContent:{}});vm.runInContext(require('child_process').execFileSync('git',['show','HEAD:content/localization.js'],{encoding:'utf8',maxBuffer:10000000}),baseline);
const dict=baseline.SoulbeastContent.GAME_TRANSLATIONS(),keys=Object.keys(dict.en).sort((a,b)=>b.length-a.length),pattern=new RegExp(keys.map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'g');
function preserve(n){if(!n||typeof n!=='object')return;const s=n.type==='Literal'?n.value:n.type==='TemplateElement'?n.value.cooked:null;if(typeof s==='string'&&/[ก-๙]/.test(s))for(const lang of ['en','zh-CN']){const t=s.replace(pattern,k=>dict[lang][k]||k);if(!/[ก-๙]/.test(t)&&/[ก-๙]/.test(g.run('translateGameText('+JSON.stringify(s)+','+JSON.stringify(lang)+',false)')))extra[lang][s]=t;}for(const v of Object.values(n))if(Array.isArray(v))v.forEach(preserve);else if(v&&typeof v==='object')preserve(v);}
for(const dir of ['runtime','client'])for(const f of fs.readdirSync(dir).filter(f=>/\.m?js$/.test(f)))preserve(acorn.parse(fs.readFileSync(dir+'/'+f,'utf8'),{ecmaVersion:'latest',sourceType:'module'}));
fs.writeFileSync(file,source.slice(0,start)+marker+'\n(()=>{const original=SoulbeastContent.GAME_TRANSLATIONS,extra='+JSON.stringify(extra)+';SoulbeastContent.GAME_TRANSLATIONS=()=>{const dict=original();for(const lang of Object.keys(extra))Object.assign(dict[lang],extra[lang]);return dict;};})();\n');
console.log('Updated kingdom-war EN/ZH coverage: '+literals.size+' literals');
