"""Read generated RGBA atlases and record tight per-cell source rectangles.
No image pixels are modified; the browser selects the original cutouts at draw time.
"""
import json
from collections import deque
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1] / 'assets/forest-walk'
frames = {}
for path in sorted((root / 'generated/layers').glob('*.png')):
    image = Image.open(path)
    assert image.mode == 'RGBA', path
    width, height = image.size
    cells = []
    for i in range(6):
        x, y = (i % 3) * width // 3, (i // 3) * height // 2
        cell = image.crop((x, y, x + width // 3, y + height // 2))
        alpha = cell.getchannel('A')
        bbox = alpha.point(lambda a: 255 if a > 160 else 0).getbbox()
        assert bbox, (path, i)
        left, top, right, bottom = bbox
        if path.stem == 'training-bells' and i == 2:
            # The roof in the adjacent cell leaves a few stray pixels at the
            # boundary. Identify the post itself without changing the image.
            mask = bytearray(1 if a > 160 else 0 for a in alpha.tobytes())
            cw, ch = cell.size
            components = []
            for start in range(len(mask)):
                if not mask[start]:
                    continue
                mask[start] = 0
                queue = deque([start])
                count = 0
                l, t, r, b = cw, ch, 0, 0
                while queue:
                    pos = queue.popleft()
                    px, py = pos % cw, pos // cw
                    count += 1
                    l, t, r, b = min(l, px), min(t, py), max(r, px+1), max(b, py+1)
                    for nx, ny in ((px-1,py),(px+1,py),(px,py-1),(px,py+1)):
                        if 0 <= nx < cw and 0 <= ny < ch:
                            index = ny*cw+nx
                            if mask[index]:
                                mask[index] = 0
                                queue.append(index)
                components.append((count, (l,t,r,b)))
            left, top, right, bottom = max(components)[1]
        cells.append([x + left, y + top, right - left, bottom - top])
    frames[path.stem] = cells
    transparent = sum(n for value, n in enumerate(image.getchannel('A').histogram()) if value < 16)
    assert transparent / (width * height) > .3, (path, 'background is not transparent')
    print(path.stem, image.size, round(transparent / (width * height), 2))
(root / 'training-layer-frames.js').write_text('// Tight source rectangles in original generated RGBA atlases.\nexport const LAYER_FRAMES = ' + json.dumps(frames, indent=2) + ';\n', encoding='utf-8')
