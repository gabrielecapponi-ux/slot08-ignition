"""Build a lightweight reflection and distant interior panorama from the club key art."""
from pathlib import Path
from PIL import Image, ImageOps, ImageFilter, ImageDraw
root=Path(__file__).resolve().parents[2]
image=Image.open(root/'assets/poster.png').convert('RGB')
w,h=image.size
# The distant benches, workshop lights and windows lie above the cars and the tabletop.
wall=image.crop((int(w*.24),0,w,int(h*.265))).resize((1024,164),Image.Resampling.LANCZOS)
strip=Image.new('RGB',(2048,164))
strip.paste(wall,(0,0));strip.paste(ImageOps.mirror(wall),(1024,0))
out=Image.new('RGB',(2048,1024),(25,26,29))
out.paste(strip,(0,370))
for a,b,start,end in [(0,370,[27,29,34],None),(534,1024,None,[56,51,45])]:
 line=strip.crop((0,0 if a==0 else 163,2048,1 if a==0 else 164)).filter(ImageFilter.GaussianBlur(12)).resize((2048,1))
 solid=Image.new('RGB',(2048,1),tuple(start or end))
 for y in range(a,b):
  t=(y-a)/(b-a-1);t=t*t*(3-2*t)
  out.paste(Image.blend(solid,line,t if a==0 else 1-t),(0,y))
out.save(root/'assets/club-light.webp',quality=85)
