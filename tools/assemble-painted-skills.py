"""Assemble measured new crops and exact crops of retained painted artwork."""
import pathlib,json,hashlib
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parents[1]
folder=ROOT/'content/skill-art-painted-v2'
baseline=folder/'retained.json'
if not baseline.exists():
    old=json.loads((ROOT/'content/individual-skill-art.json').read_text(encoding='utf-8'))
    baseline.write_text(json.dumps([a for a in old['skills'] if a['source']!='individual-svg'],ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
retained=json.loads(baseline.read_text(encoding='utf-8'))
crops=json.loads((folder/'crops.json').read_text(encoding='utf-8'))['skills']
records=[]
for a in crops:
    records.append({**a,'source':'image-generated-crop'})
for a in retained:
    if a['source']=='painted-signature':
        source=ROOT/f'assets/skills/signatures-{a["kind"]}.webp'
        image=Image.open(source).convert('RGB')
        assert image.width%8==0 and image.height%8==0
        w,h=image.width//8,image.height//8
        row,col=divmod(a['index'],8)
        box=(col*w,row*h,(col+1)*w,(row+1)*h)
        picture=image.crop(box)
    else:
        source=ROOT/a['path'];image=Image.open(source).convert('RGB');box=(0,0,image.width,image.height);picture=image.copy();picture.thumbnail((256,256),Image.Resampling.LANCZOS)
    target=ROOT/'assets/skills/painted-v2'/f'{a["id"]}.webp'
    picture.save(target,'WEBP',lossless=True,method=6)
    records.append({'id':a['id'],'name':a['name'],'source':'retained-painted-crop','originalPath':str(source.relative_to(ROOT)).replace('\\','/'),'cropBox':list(box),'sourceSize':list(image.size),'outputSize':list(picture.size),'path':str(target.relative_to(ROOT)).replace('\\','/'),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest()})
if len(crops)!=384:raise RuntimeError(f'All 384 replacement skill crops are required; only {len(crops)} are ready.')
assert len(records)==504 and len(set(a['id'] for a in records))==504
expansion=json.loads((ROOT/'content/individual-skill-art.json').read_text(encoding='utf-8'))
records += [a for a in expansion['skills'] if a.get('sourceGroup') in ['eclipse-expansion-v2','solar-legends-v1']]
for record in records:
    if record['id']=='enchant_flying':record['name']='ประทับดาบธาตุลม'
manifest={'version':2,'method':'Built-in image_gen painted artwork; each individual image cropped to measured source-cell bounds. All rendering uses contain, without CSS sprite offsets or cover cropping.','prompts':'content/skill-art-painted-v2/jobs.json','cropProof':'content/skill-art-painted-v2/crops.json','skills':records}
(ROOT/'content/individual-skill-art.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
cards=''.join(f'<article><img loading="lazy" decoding="async" src="{a["path"]}" alt="{a["name"]}"><b>{a["name"]}</b><small>{a["id"]}</small></article>' for a in records)
(ROOT/'skill-art-preview.html').write_text('<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Soulbeast · ภาพวาดสกิล</title><style>body{background:#091420;color:#e8e2ce;font-family:Tahoma,sans-serif;margin:20px}h1{font-size:24px}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px}article{background:#172637;border:1px solid #665b3b;border-radius:14px;padding:12px;text-align:center}img{display:block;width:112px;height:112px;object-fit:contain;margin:0 auto 8px;background:#09131e;border-radius:10px}b{font-size:14px;display:block}small{display:block;font-size:10px;opacity:.6;margin-top:6px;overflow-wrap:anywhere}</style><h1>ภาพวาดสกิล · 520 ภาพ</h1><p>ภาพสร้างใหม่ 384 ภาพ ภาพวาดเดิม 120 ภาพ และภาพสุริยคราสใหม่ 16 ภาพ · แยกไฟล์และครอปตามขอบภาพจริง</p><main>'+cards+'</main></html>',encoding='utf-8')
print('Assembled 504 painted individual skill files, with source hashes and exact crop coordinates.')
