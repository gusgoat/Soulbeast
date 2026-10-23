// Rebuild the skill gallery from verified painted assets. No procedural/vector art fallback.
const fs=require('fs');
const manifest=JSON.parse(fs.readFileSync('content/individual-skill-art.json','utf8'));
if(manifest.version!==2)throw Error('Assemble measured painted skill crops first.');
for(const a of manifest.skills)if(!a.path.endsWith('.webp')||!fs.existsSync(a.path))throw Error('Missing painted skill '+a.id);
const cards=manifest.skills.map(a=>`<article><img loading="lazy" decoding="async" src="${a.path}" alt="${a.name}"><b>${a.name}</b><small>${a.id}</small></article>`).join('');
fs.writeFileSync('skill-art-preview.html',`<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Soulbeast · ภาพวาดสกิล</title><style>body{background:#091420;color:#e8e2ce;font-family:Tahoma,sans-serif;margin:20px}h1{font-size:24px}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px}article{background:#172637;border:1px solid #665b3b;border-radius:14px;padding:12px;text-align:center}img{display:block;width:112px;height:112px;object-fit:contain;margin:0 auto 8px;background:#09131e;border-radius:10px}b{font-size:14px;display:block}small{display:block;font-size:10px;opacity:.6;margin-top:6px;overflow-wrap:anywhere}</style><h1>ภาพวาดสกิล · ${manifest.skills.length} ภาพ</h1><p>ภาพสร้างใหม่ 384 ภาพ และภาพวาดเดิม 120 ภาพ · แยกไฟล์และครอปตามขอบภาพจริง</p><main>${cards}</main></html>`);
console.log('Rebuilt painted skill gallery.');
