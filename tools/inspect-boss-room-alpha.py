"""Read six independent source cutouts without changing PNG pixels."""
from pathlib import Path
import json
from PIL import Image
root=Path(__file__).resolve().parents[1]/'assets/forest-walk'
frames={};bad=[]
for path in sorted((root/'generated/boss-rooms').glob('*.png')):
    im=Image.open(path);assert im.mode=='RGBA'
    alpha=im.getchannel('A');ratio=sum(alpha.histogram()[:16])/(im.width*im.height)
    if ratio<.3:bad.append(path.stem)
    rects=[]
    for i in range(6):
        x,y=i%3*im.width//3,i//3*im.height//2;cw,ch=im.width//3,im.height//2
        # Heaven's taller facade/crown extend into adjacent cells. Keep those
        # neighbours out of the floor and right-wall source windows.
        if path.stem=='heaven' and i==0:y,ch,cw=210,290,495
        if path.stem=='heaven' and i==3:cw=450
        if path.stem=='binding' and i==2:x,cw=1100,436
        if path.stem=='binding' and i==3:cw=450
        if path.stem=='binding' and i==5:x,cw=1070,466
        l,t,r,b=alpha.crop((x,y,x+cw,y+ch)).point(lambda a:255 if a>160 else 0).getbbox()
        rects.append([x+l,y+t,r-l,b-t])
    frames[path.stem]=rects
(root/'boss-room-frames.js').write_text('export const BOSS_ROOM_FRAMES = '+json.dumps(frames,indent=2)+';\n',encoding='utf8')
print('Boss-room frames:',len(frames),'Nontransparent backgrounds:',bad)
