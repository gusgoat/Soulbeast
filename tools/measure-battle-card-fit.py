"""Measure existing pose transparency without changing any bitmap or emission anchor."""
import json,sys
from pathlib import Path
from PIL import Image
actors=json.loads(Path('build/battle-card-fit-input.json').read_text(encoding='utf-8'))
players=json.loads(Path('content/soulkeeper-battle-card-fit.json').read_text(encoding='utf-8'))
fits=json.loads(Path("content/battle-card-art-fit.json").read_text()) if "--actor" in sys.argv else {}
selected=sys.argv[sys.argv.index("--actor")+1] if "--actor" in sys.argv else None
for a in actors:
    if selected and a["id"]!=selected: continue
    bounds=[]
    for pose in ('idle','hit','windup','melee','threat'):
        src=a['assets'].get(pose)
        if not src: continue
        with Image.open(src) as im:
            box=im.convert('RGBA').getchannel('A').point(lambda x:255 if x>30 else 0).getbbox()
            if box: bounds.append([box[0]/im.width,box[1]/im.height,box[2]/im.width,box[3]/im.height])
    if not bounds: raise ValueError('Empty art '+a['id'])
    x0=min(b[0] for b in bounds);y0=min(b[1] for b in bounds);x1=max(b[2] for b in bounds);y1=max(b[3] for b in bounds)
    if a['id'] in players and 'summoner-fullbody-v2/' not in a['assets']['idle']:
        fit=players[a['id']]
    else:
        size=min(.62/(x1-x0),.50/(y1-y0),.82)
        left=max(.015-size*x0,.26-size*(x0+x1)/2)
        top=.30-size*(y0+y1)/2
        fit={'width':round(size*100,4),'left':round(left*100,4),'top':round(top*100,4),'halfBody':False}
    fits[a['id']]={**fit,'bounds':[round(x,6) for x in [x0,y0,x1,y1]]}
Path('content/battle-card-art-fit.json').write_text(json.dumps(fits,separators=(',',':')),encoding='utf-8')
p=Path('client/battle-card-layout.css');existing=p.read_text(encoding='utf-8-sig');suffix=existing.split('/* End measured original poses */',1)[1] if '/* End measured original poses */' in existing else '';css=existing.split('/* Measured original poses */')[0]
css+='/* Measured original poses */\n'
for actor,f in fits.items():
    css+='#app .battle-vital[data-battle-card=full][data-motion-actor="'+actor+'"]{--card-fit-width:'+str(f['width'])+'%;--card-fit-left:'+str(f['left'])+'%;--card-fit-top:'+str(round(f['top']/.6,4))+'%}\n'
css+='/* End measured original poses */'+suffix
p.write_bytes(css.encode('utf-8'))
print('Measured',len(fits),'original motion identities; no bitmap changed')
