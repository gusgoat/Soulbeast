from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
import json,hashlib,shutil
root=Path.cwd(); design=json.loads((root/'content/eclipse-expansion.json').read_text(encoding='utf-8')); jobs=json.loads((root/'content/eclipse-art-v2/jobs.json').read_text(encoding='utf-8'))['jobs']; original=root.parent/'private/eclipse-expansion-v2';original.mkdir(parents=True,exist_ok=True); records=[]
for job in jobs:
 backup=original/(job['id']+'.png')
 if not backup.exists(): raise FileNotFoundError('Original generated image required: '+str(backup))
 im=Image.open(backup).convert('RGB'); w,h=im.size; size={'equipment':384,'beast':512,'skill':256}[job['kind']]; im.thumbnail((size,size),Image.Resampling.LANCZOS);dest=root/job['path'];dest.parent.mkdir(parents=True,exist_ok=True);im.save(dest,'WEBP',quality=93,method=6)
 records.append({'id':job['id'],'kind':job['kind'],'path':job['path'],'generator':'built-in image_gen.imagegen','source':'private/eclipse-expansion-v2/'+backup.name,'sourceSize':[w,h],'cropBox':[0,0,w,h],'outputSize':list(im.size),'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'sourceSha256':hashlib.sha256(backup.read_bytes()).hexdigest()})
folder=root/'content/eclipse-art-v2';folder.mkdir(parents=True,exist_ok=True);(folder/'jobs.json').write_text(json.dumps({'generator':'built-in image_gen.imagegen','jobs':jobs},ensure_ascii=False,indent=2)+'\n',encoding='utf-8');(folder/'art-manifest.json').write_text(json.dumps({'version':1,'assets':records},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
manifest=json.loads((root/'content/individual-skill-art.json').read_text(encoding='utf-8'));existing={r['id'] for r in manifest['skills']};names={s['id']:s['th'] for s in design['skills']}
for rec in records:
 if rec['kind']=='skill' and rec['id'] not in existing:manifest['skills'].append({**rec,'name':names[rec['id']],'sourceGroup':'eclipse-expansion-v2'})
(root/'content/individual-skill-art.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
# Only scaling and format conversion: each complete generated square is preserved; no tile cropping.
canvas=Image.new('RGB',(8*190,4*220),'#08121e');draw=ImageDraw.Draw(canvas)
for i,rec in enumerate(records):
 im=Image.open(root/rec['path']);im.thumbnail((180,180),Image.Resampling.LANCZOS);x=(i%8)*190+(190-im.width)//2;y=(i//8)*220;canvas.paste(im,(x,y));draw.text(((i%8)*190+5,y+184),rec['id'].replace('legend2_','').replace('mist_sig_','sig_')[:27],fill='#edcf91')
(root.parent/'outputs').mkdir(exist_ok=True);canvas.save(root.parent/'outputs/eclipse-expansion-contact.png');print('Saved 32 distinct complete generated illustrations and 16 skill bindings')
