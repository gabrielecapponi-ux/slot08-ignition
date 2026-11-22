"""Bake original botanical cutouts. Usage: python paint_sprays.py /tmp/foliage.png"""
from math import sin, cos, atan2, pi
from random import Random
import sys
from PIL import Image, ImageDraw
rng = Random(808)
size = 384
atlas = Image.new('RGBA',(size*3,size*2))
def rgb(base, light):
    return tuple(min(255,max(0,int(ch*light))) for ch in base)+(255,)
def leaf(p, angle, length, width, color, lobes):
    x,y=p; dx,dy=cos(angle),sin(angle); rim=[]
    for side in (-1,1):
        fractions=[j/22 for j in range(23)]
        if side==1: fractions.reverse()
        for f in fractions:
            lobe=(.75+.25*cos(f*pi*12)) if lobes else 1
            w=width*sin(pi*f)**.7*lobe*side
            rim.append((x+dx*length*f-dy*w,y+dy*length*f+dx*w))
    draw.polygon(rim,fill=color)
    draw.line((x,y,x+dx*length*.83,y+dy*length*.83),fill=rgb(color[:3],1.19),width=1)
def offset(p,a,l):return (p[0]+cos(a)*l,p[1]+sin(a)*l)
def stem(p,q,w,c):draw.line((p,q),fill=(*c,255),width=w)
for tile,kind in enumerate(['oak','pine','palm','fern','bark']):
    layer=Image.new('RGBA',(size,size),(42,72,31,0));draw=ImageDraw.Draw(layer)
    if kind=='oak':
        for side in (-1,1):
            p=(192,378);last=p
            for j in range(1,11):
                q=(192+side*j*1.6,378-j*32)
                stem(last,q,max(1,6-j//2),(91,77,44));last=q
                a=-pi/2+side*(1.04-.026*j);l=(49+80*sin(j*pi/12))*rng.uniform(.78,1.05)
                tip=offset(q,a,l);stem(q,tip,3,(104,93,51))
                for k in range(1,6):
                    base=offset(q,a,l*k/6)
                    for turn in (-1,1):
                        orange=rng.uniform(.80,1.24)
                        leaf(base,a+turn*rng.uniform(.65,1.22),rng.uniform(24,43),rng.uniform(7,13),rgb((85,125,47),orange),True)
                leaf(tip,a,30,9,rgb((109,149,57),1),True)
    elif kind in ('pine','palm','fern'):
        pine=kind=='pine';palm=kind=='palm'
        p=(192,378);count=18 if pine else 37
        for j in range(1,count+1):
            t=j/(count+1);q=(192+9*sin(t*3.8),377-357*t)
            stem(p,q,max(1,5-int(t*4)),(103,107,52));p=q
            for side in (-1,1):
                l=(20+126*sin(t*pi)**.66)*(1-.18*t)*rng.uniform(.88,1.07)
                a=-pi/2+side*(1.37-.47*t)
                tip=offset(q,a,l)
                shade=rng.uniform(.76,1.21)
                if palm:
                    leaf(q,a,l*1.12,3.8,rgb((75,118,52),shade),False)
                else:
                    stem(q,tip,2,(82,108,68))
                    n=15 if pine else 12
                    for k in range(n):
                        f=k/n;base=offset(q,a,l*f)
                        for turn in (-1,1):
                            ll=(15 if pine else 12)*(1-.55*f)*rng.uniform(.82,1.3)
                            leaf(base,a+turn*(.91 if pine else .72),ll,(1.8 if pine else 3.9)*(1-.45*f),rgb((66,101,67) if pine else (91,142,62),shade*rng.uniform(.85,1.24)),False)
    else:
        draw.rectangle((0,0,size,size),fill=(107,90,66,255))
        for j in range(1800):
            x=rng.randrange(-8,size+8);y=rng.randrange(-70,size);w=rng.uniform(.6,4);h=rng.uniform(3,60)
            col=rgb((108,90,66),rng.uniform(.53,1.5));draw.polygon([(x,y),(x+w,y+7),(x+w*.6,y+h),(x-1,y+h*.6)],fill=col)
    atlas.paste(layer,((tile%3)*size,(tile//3)*size))
atlas.save(sys.argv[1],optimize=True)
