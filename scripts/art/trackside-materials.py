"""Build original height-based terrain materials. Run python scripts/art/trackside-materials.py assets/trackside-pbr.webp"""
from pathlib import Path
import sys
import numpy as np
from scipy.ndimage import gaussian_filter
from scipy.spatial import cKDTree
from PIL import Image

N=384
rng=np.random.default_rng(821705)
y,x=np.mgrid[0:N,0:N]
def noise(radius):
    n=gaussian_filter(rng.normal(size=(N,N)),radius,mode='wrap')
    return n/max(n.std(),.00001)
def mix(a,b,t):
    t=np.clip(t,0,1)[...,None]
    return np.array(a)*(1-t)+np.array(b)*t
def stones(n):
    points=rng.uniform(0,N,(n,2))
    warp=.8 if n>1000 else 2.3
    sample=np.stack([(x+warp*noise(4))%N,(y+warp*noise(4))%N],axis=-1)
    distances,indices=cKDTree(points,boxsize=N).query(sample,k=2)
    gap=np.maximum(0,distances[:,:,1]-distances[:,:,0])
    core=1-np.exp(-gap*.43)
    return core,indices[:,:,0],rng.random(n)[indices[:,:,0]]
def pigment(name):
    broad,patch,fibre,grain=[noise(s) for s in (26,6,1.5,.34)]
    pat=.50+.19*broad+.12*patch
    if name=='moss':
        col=mix((76,59,40),(117,135,73),pat+.12*fibre)
        h=.30*patch+.32*fibre+.33*grain
        rough=.85+.045*fibre-.07*np.maximum(0,-broad)
        # Fallen leaves have tapered ends and a raised midrib; wrapped pixels tile exactly.
        for i in range(570):
            cx,cy=rng.integers(0,N,2);angle=rng.random()*np.pi
            length=rng.uniform(2.0,8.8);width=length*rng.uniform(.19,.40)
            yy,xx=np.mgrid[-11:12,-11:12];u=xx*np.cos(angle)+yy*np.sin(angle);v=-xx*np.sin(angle)+yy*np.cos(angle)
            leaf=np.maximum(0,1-(u/length)**2)*width-np.abs(v+.055*u)
            alpha=np.clip(leaf+.2,0,1)*rng.uniform(.5,.94)
            iy=(cy+yy)%N;ix=(cx+xx)%N
            palette=[(146,124,72),(107,93,50),(145,151,87),(87,104,53),(157,104,54)]
            tone=np.array(palette[i%len(palette)])*(1+.08*np.sign(v)[...,None])
            col[iy,ix]=col[iy,ix]*(1-alpha[...,None])+tone*alpha[...,None]
            h[iy,ix]+=alpha*(.84+np.exp(-v*v*2)*.7)
    elif name=='sand':
        ridges=np.cos(2*np.pi*(7*x+3*y)/N+.21*patch+.62*broad)
        col=mix((166,128,83),(218,194,146),pat+.10*ridges)
        shells=np.clip((grain-1.35)*.65,0,1)
        col+=shells[...,None]*40
        h=.52*ridges+.2*fibre+.29*grain+shells*.73
        rough=.90+.03*fibre-.04*ridges
    elif name=='quay':
        # Broom-finished concrete, expansion joints, pitting and damp patches.
        joint=np.minimum(np.minimum(x%192,192-x%192),np.minimum(y%128,128-y%128))
        channel=np.exp(-(joint/1.5)**2)
        pits=np.maximum(0,-grain-1.3)
        broom=gaussian_filter(rng.normal(size=(N,N)),(.35,4),mode='wrap')
        col=mix((105,102,89),(154,150,131),pat)+broom[...,None]*10
        col*=1-.38*channel[...,None];col-=pits[...,None]*7
        h=.16*patch+.20*fibre+.24*grain-1.6*channel-pits*.51+broom
        rough=.74+.06*patch-.09*np.clip(-broad,0,2)+channel*.08
    else:
        # Nearest/second-nearest distance separates clasts with recessed interstices.
        core,index,pick=stones(1400 if name=='ballast' else 330)
        if name=='ballast':
            col=mix((88,82,70),(186,177,153),pick*.78+.13+.08*patch)
            h=core*(.72+pick*1.5)+.23*fibre+.15*grain
            rough=.83-.16*pick+.05*fibre
        else:
            vein=np.cos(2*np.pi*(2*x+9*y)/N+.21*patch+.63*broad)
            col=mix((100,102,96),(180,174,147),.17+.50*pick+.16*vein+.1*patch)
            h=core*(1.1+pick*2.1)+.26*fibre+.16*grain+.47*vein
            rough=.82-.18*pick+.05*fibre
        # Patches of sediment cover some fracture lines and interrupt the rock bed.
        cover=np.clip(.47+.34*broad+.20*patch,0,1)
        soil=mix((110,102,82),(166,154,126),.47+.16*fibre)
        if name=='stone':
            col=col*(1-cover[...,None]*.74)+soil*(cover[...,None]*.74)
            h=h*(1-cover*.62)+fibre*cover*.47
        col*=.78+.22*core[...,None]
    # Independent pigment, normal and roughness; height is never inferred from RGB.
    col+=grain[...,None]*3.5
    dx=(np.roll(h,-1,1)-np.roll(h,1,1))*.54
    dy=(np.roll(h,-1,0)-np.roll(h,1,0))*.54
    norm=np.stack([-dx,dy,np.ones_like(h)],axis=-1);norm/=np.sqrt((norm*norm).sum(axis=-1))[...,None]
    normal=(norm*.5+.5)*255
    r=np.clip(rough,.44,.99)*255
    return [Image.fromarray(np.uint8(np.clip(a,0,255))) for a in (col,normal,np.repeat(r[:,:,None],3,axis=-1))]
atlas=Image.new('RGB',(5*N,3*N))
for i,name in enumerate(['moss','sand','stone','quay','ballast']):
    for j,img in enumerate(pigment(name)):atlas.paste(img,(i*N,j*N))
atlas.save(Path(sys.argv[1]),quality=82,method=6)
