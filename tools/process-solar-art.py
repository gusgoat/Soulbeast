from pathlib import Path
from PIL import Image,ImageDraw
import json,hashlib,shutil
root=Path.cwd(); original=root.parent/'private/solar-generated'; original.mkdir(parents=True,exist_ok=True)
d=json.loads((root/'content/solar-beasts.json').read_text(encoding='utf8'));names={b['id']:b['names'][0] for b in d['beasts']}
for b in d['beasts']:
 for s in b['skills']:names[s['id']]=s['names'][0]
records=[]
for kind,filename in [('beast','portrait-jobs.json'),('skill','skill-jobs.json')]:
 jobs=json.loads((root/'content/solar-art'/filename).read_text(encoding='utf8'))['jobs']
 for job in jobs:
  source=Path(job['source']);source=root.parent/source if job['source'].startswith('private/') else source;backup=original/(job['id']+'.png')
  if not backup.exists():shutil.copyfile(source,backup)
  image=Image.open(backup).convert('RGB');w,h=image.size;size=512 if kind=='beast' else 256
  image.thumbnail((size,size),Image.Resampling.LANCZOS)
  rel=('assets/beasts/solar/' if kind=='beast' else 'assets/skills/painted-v2/')+job['id']+'.webp'
  target=root/rel;target.parent.mkdir(parents=True,exist_ok=True);image.save(target,'WEBP',quality=94,method=6)
  records.append({'id':job['id'],'kind':kind,'name':names[job['id']],'path':rel,'source':'private/solar-generated/'+backup.name,'sourceSize':[w,h],'cropBox':[0,0,w,h],'outputSize':list(image.size),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'sourceSha256':hashlib.sha256(backup.read_bytes()).hexdigest(),'sourceGroup':'solar-legends-v1'})
assert len(records)==56 and len(set(a['sha256'] for a in records))==56
(root/'content/solar-art/art-manifest.json').write_text(json.dumps({'version':1,'generator':'built-in image_gen.imagegen','assets':records},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
manifest=json.loads((root/'content/individual-skill-art.json').read_text(encoding='utf8'));manifest['skills']=[a for a in manifest['skills'] if a.get('sourceGroup')!='solar-legends-v1']+[a for a in records if a['kind']=='skill']
(root/'content/individual-skill-art.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
for kind,cols,cell in [('beast',4,320),('skill',8,160)]:
 assets=[a for a in records if a['kind']==kind];rows=(len(assets)+cols-1)//cols;sheet=Image.new('RGB',(cols*cell,rows*(cell+26)),'#08121e');draw=ImageDraw.Draw(sheet)
 for i,a in enumerate(assets):
  im=Image.open(root/a['path']);im.thumbnail((cell-12,cell-12));x=(i%cols)*cell+(cell-im.width)//2;y=(i//cols)*(cell+26);sheet.paste(im,(x,y));draw.text(((i%cols)*cell+4,y+cell),a['id'].removeprefix('solar_'),fill='#eaca9b')
 sheet.save(root.parent/'outputs'/('solar-'+kind+'-contact.jpg'),quality=94)
print('Saved eight complete portraits and 48 distinct full-composition skill paintings; no tile cropping')
