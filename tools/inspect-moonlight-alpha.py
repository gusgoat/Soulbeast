"""Record RGBA source rectangles; do not modify generated or Blender pixels."""
from pathlib import Path
import json
from collections import deque
from PIL import Image
root=Path(__file__).resolve().parents[1]/'assets/forest-walk'
frames={};bad=[]
for path in sorted((root/'generated/moonlight').glob('*.png')):
    image=Image.open(path); assert image.mode=='RGBA',path
    alpha=image.getchannel('A'); transparent=sum(alpha.histogram()[:16])/(image.width*image.height)
    if transparent<.3:bad.append(path.stem)
    cuts=[]
    for i in range(1 if path.stem.startswith('blender-') else 6):
        x,y=(0,0) if path.stem.startswith('blender-') else (i%3*image.width//3,i//3*image.height//2)
        w,h=image.size if path.stem.startswith('blender-') else (image.width//3,image.height//2)
        box=alpha.crop((x,y,x+w,y+h)).point(lambda a:255 if a>160 else 0).getbbox()
        assert box,(path,i)
        l,t,r,b=box;cuts.append([x+l,y+t,r-l,b-t])
    frames[path.stem]=cuts
im=Image.open(root/'generated/moonlight/scales.png');cw,ch=im.width//3,im.height//2
mask=bytearray(1 if a>160 else 0 for a in im.getchannel('A').crop((0,ch,cw,ch*2)).tobytes());components=[]
for start in range(len(mask)):
    if not mask[start]:continue
    mask[start]=0;q=deque([start]);count=0;l,t,r,b=cw,ch,0,0
    while q:
        pos=q.popleft();px,py=pos%cw,pos//cw;count+=1;l,t,r,b=min(l,px),min(t,py),max(r,px+1),max(b,py+1)
        for nx,ny in ((px-1,py),(px+1,py),(px,py-1),(px,py+1)):
            if 0<=nx<cw and 0<=ny<ch and mask[ny*cw+nx]:mask[ny*cw+nx]=0;q.append(ny*cw+nx)
    components.append((count,(l,t,r,b)))
l,t,r,b=max(components)[1];details={'scaleLeaf':[l,ch+t,r-l,b-t]}
(root/'moonlight-frames.js').write_text('export const MOON_FRAMES = '+json.dumps(frames,indent=2)+';\nexport const MOON_DETAILS = '+json.dumps(details)+';\n',encoding='utf8')
print('PNG files:',len(frames),'Nontransparent backgrounds:',bad)
