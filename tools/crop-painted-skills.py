"""Crop explicitly requested image-generated sheets using measured cutting gutters.

No guessed 25% coordinates: each of the five vertical/horizontal guide bands
must be detected in the actual source. Preserve the entire art rectangle.
"""
import hashlib,json,pathlib
from PIL import Image,ImageDraw
import numpy as np

ROOT=pathlib.Path(__file__).resolve().parents[1]
SOURCE=ROOT.parent/'private/skill-art-painted-v2/originals'
DEST=ROOT/'assets/skills/painted-v2'
DEST.mkdir(parents=True,exist_ok=True)
jobs=json.loads((ROOT/'content/skill-art-painted-v2/jobs.json').read_text(encoding='utf-8'))['jobs']
records=[]

def bands(values):
    indexes=np.flatnonzero(values)
    groups=[]
    for n in indexes:
        if groups and n==groups[-1][-1]+1: groups[-1].append(int(n))
        else: groups.append([int(n)])
    return [(g[0],g[-1]+1) for g in groups if len(g)>=2]

for job in jobs:
    path=SOURCE/(job['key']+'.png')
    if not path.exists(): continue
    image=Image.open(path).convert('RGB')
    a=np.asarray(image).astype(np.int16)
    pink=(a[:,:,0]>200)&(a[:,:,1]<80)&(a[:,:,2]>190)
    xs=bands(pink.mean(axis=0)>.78)
    ys=bands(pink.mean(axis=1)>.78)
    if len(xs)!=5 or len(ys)!=5:
        raise RuntimeError(f'{job["key"]}: expected exactly 5 measured gutters per axis, got {xs}, {ys}')
    for axis,groups,size in [('x',xs,image.width),('y',ys,image.height)]:
        for k,(start,end) in enumerate(groups):
            if abs((start+end)/2-k*size/4)>size*.045:
                raise RuntimeError(f'{job["key"]}: misaligned {axis} gutter {k}')
    qa=image.copy();draw=ImageDraw.Draw(qa)
    for tile in job['tiles']:
        row,col=divmod(tile['slot'],4)
        # Two source pixels remove guide antialiasing; nothing is center-cropped.
        box=(xs[col][1]+2,ys[row][1]+2,xs[col+1][0]-2,ys[row+1][0]-2)
        crop=image.crop(box)
        ratio=crop.width/crop.height
        if not .83<ratio<1.20:raise RuntimeError(f'{tile["id"]}: unexpectedly non-square art region {box}')
        border=np.concatenate([np.asarray(crop)[0],np.asarray(crop)[-1],np.asarray(crop)[:,0],np.asarray(crop)[:,-1]]).astype(np.int16)
        guide=(border[:,0]>220)&(border[:,1]<60)&(border[:,2]>210)
        if guide.mean()>.005:raise RuntimeError(f'{tile["id"]}: cutting guide remains on border ({guide.mean():.4f})')
        # Preserve the source proportions and full art; UI will contain it, never zoom-crop.
        output=DEST/(tile['id']+'.webp')
        distributed=crop.copy();distributed.thumbnail((256,256),Image.Resampling.LANCZOS)
        distributed.save(output,'WEBP',quality=93,method=6)
        draw.rectangle(box,outline='#00ff66',width=2)
        records.append({'id':tile['id'],'name':tile['name'],'sheet':job['key'],'slot':tile['slot'],'sourceSize':list(image.size),'measuredXGutters':xs,'measuredYGutters':ys,'cropBox':list(box),'sourceArtSize':list(crop.size),'outputSize':list(distributed.size),'path':str(output.relative_to(ROOT)).replace('\\','/'),'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'sourceSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'remainingGuideEdgeRatio':float(guide.mean())})
    qa.resize((800,800),Image.Resampling.LANCZOS).save(SOURCE.parent/(job['key']+'-crop-proof.jpg'),quality=88)

(ROOT/'content/skill-art-painted-v2/crops.json').write_text(json.dumps({'version':2,'generator':'built-in image_gen.imagegen','cropMethod':'Detected continuous magenta gutter bands; full inner art rectangle preserved, no center crop','skills':records},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Precisely cropped {len(records)} skills from {len(set(r["sheet"] for r in records))} measured sheets.')
