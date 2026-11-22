"""Pack the transparent Blender renders: python3 scripts/art/pack-controller.py FRAMES OUT.webp."""
from pathlib import Path
import sys
from PIL import Image

folder = Path(sys.argv[1])
frames = [Image.open(folder / f'p-{gas}-{pressed}.png').convert('RGBA')
          for pressed in range(2) for gas in range(9)]
bounds = list(zip(*(im.getbbox() for im in frames)))
box = min(bounds[0]), min(bounds[1]), max(bounds[2]), max(bounds[3])
width, height = box[2] - box[0], box[3] - box[1]
atlas = Image.new('RGBA', (9 * width, 2 * height))
for index, frame in enumerate(frames):
    atlas.paste(frame.crop(box), (index % 9 * width, index // 9 * height))
atlas.save(sys.argv[2], quality=87, method=6)
print(f'{width} × {height} per position')
