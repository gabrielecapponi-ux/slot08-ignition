"""Bake the terrain normal maps and package the four Blender renders for Canvas2D.

python scripts/art/pack-diorama.py /tmp/slot-canopies assets/trackside-pbr.webp assets/diorama-surface.webp
"""
from pathlib import Path
import sys
import numpy as np
from PIL import Image

canopies,materials,target=map(Path,sys.argv[1:])
pbr=Image.open(materials).convert('RGB');edge=pbr.width//5
atlas=Image.new('RGBA',(4*edge,2*edge))
for i in range(4):
    bounds=(i*edge,0,(i+1)*edge,edge)
    col=np.asarray(pbr.crop(bounds)).astype(float)
    shade=np.asarray(pbr.crop((bounds[0],edge,bounds[2],2*edge))).astype(float)/127.5-1
    # Same northwest light used by the baked tree renders.
    factor=.74+.28*np.clip(-.48*shade[:,:,0]+.38*shade[:,:,1]+.78*shade[:,:,2],-.55,1)
    atlas.paste(Image.fromarray(np.uint8(np.clip(col*factor[...,None],0,255))),(i*edge,0))
for i,name in enumerate(['oak','pine','palm','limestone']):
    image=Image.open(canopies/(name+'.png')).convert('RGBA');box=image.getchannel('A').getbbox()
    if not box:raise ValueError(name+' is empty')
    crop=image.crop(box);crop.thumbnail((edge-12,edge-12))
    atlas.paste(crop,(i*edge+(edge-crop.width)//2,edge+(edge-crop.height)//2))
atlas.save(target,quality=86,method=6)
