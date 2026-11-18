"""Record two statue source rectangles; never modify generated PNG pixels."""
from pathlib import Path
from PIL import Image
import json
root=Path(__file__).resolve().parents[1]/'assets/forest-walk'
frames={}
for path in sorted((root/'generated/boss-statues').glob('*.png')):
    im=Image.open(path)
    assert im.mode=='RGBA',path
    alpha=im.getchannel('A')
    assert sum(alpha.histogram()[:16])/(im.width*im.height)>.3,path
    rects=[]
    for side in range(2):
        x=side*im.width//2
        box=alpha.crop((x,0,x+im.width//2,im.height)).point(lambda a:255 if a>160 else 0).getbbox()
        assert box,path
        l,t,r,b=box
        assert l>0 and r<im.width//2 and t>0 and b<im.height,(path,box)
        rects.append([x+l,t,r-l,b-t])
    frames[path.stem]=rects
assert len(frames)==8
(root/'boss-statue-frames.js').write_text('export const BOSS_STATUE_FRAMES = '+json.dumps(frames,indent=2)+';\n',encoding='utf8')
print('PASS eight RGBA statue pairs, transparent margins and complete source bounds')
