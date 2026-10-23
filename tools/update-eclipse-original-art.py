from pathlib import Path
import json,hashlib
from PIL import Image,ImageDraw
root=Path.cwd()
folder=root/'content/eclipse-original-art'
jobs=json.loads((folder/'jobs.json').read_text(encoding='utf-8'))['jobs']
records=[]
canvas=Image.new('RGB',(1280,1280),'#08121e');draw=ImageDraw.Draw(canvas)
for i,j in enumerate(jobs):
 source=root.parent/'private/eclipse-original-art'/(j['id']+'.png')
 im=Image.open(source).convert('RGB');w,h=im.size
 im.thumbnail((384,384),Image.Resampling.LANCZOS)
 dest=root/j['path'];dest.parent.mkdir(parents=True,exist_ok=True);im.save(dest,'WEBP',quality=93,method=6)
 records.append({'id':j['id'],'path':j['path'],'sourceSize':[w,h],'cropBox':[0,0,w,h],'outputSize':list(im.size),'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest()})
 im.thumbnail((296,278),Image.Resampling.LANCZOS);x=i%4*320+(320-im.width)//2;y=i//4*320
 canvas.paste(im,(x,y));draw.text((i%4*320+12,y+285),j['id'],fill='#edcf91')
(folder/'art-manifest.json').write_text(json.dumps({'generator':'built-in image_gen.imagegen','assets':records},indent=2)+'\n',encoding='utf-8')
canvas.save(root.parent/'outputs/eclipse-original-contact.png')
print('Processed all 16 complete illustrations without cropping')
