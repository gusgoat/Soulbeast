"""Inspect original generated pixels; write source metadata without image edits."""
from pathlib import Path
from PIL import Image
import json
root=Path(__file__).resolve().parents[1]/'assets/forest-walk'
frames={};edges=[]
for path in sorted((root/'generated/heaven').glob('*.png')):
    im=Image.open(path)
    if path.stem=='ground-marble':
        frames[path.stem]=[[0,0,im.width,im.height]]
        continue
    assert im.mode=='RGBA',path
    alpha=im.getchannel('A')
    assert sum(alpha.histogram()[:16])/(im.width*im.height)>.15,path
    cuts=[]
    for i in range(6):
        x,y=i%3*im.width//3,i//3*im.height//2;w,h=im.width//3,im.height//2
        l,t,r,b=alpha.crop((x,y,x+w,y+h)).point(lambda a:255 if a>160 else 0).getbbox()
        if l==0 or t==0 or r==w or b==h:edges.append((path.stem,i,[l,t,r,b]))
        cuts.append([x+l,y+t,r-l,b-t])
    frames[path.stem]=cuts
assert len(frames)==20,len(frames)
(root/'heaven-frames.js').write_text('export const HEAVEN_FRAMES = '+json.dumps(frames,indent=2)+';\n',encoding='utf8')
print('PASS',len(frames),'heaven PNGs; transparent alpha and source bounds. Cell-edge inspections:',edges)
