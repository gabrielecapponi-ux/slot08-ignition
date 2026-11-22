"""blender -b -P build_trees.py -- /tmp/slot-botany.png assets/botanical.glb"""
import bpy,math,random,sys
from mathutils import Vector
from math import sin,cos,pi
from pathlib import Path
atlas_path,glb_path=sys.argv[sys.argv.index('--')+1:]
rng=random.Random(808)
bpy.ops.wm.read_factory_settings(use_empty=True)
img=bpy.data.images.load(str(Path(atlas_path).resolve()))
def material(name,masked):
    mat=bpy.data.materials.new(name);mat.use_nodes=True
    nodes=mat.node_tree.nodes;links=mat.node_tree.links
    tex=nodes.new('ShaderNodeTexImage');tex.image=img
    bsdf=nodes.get('Principled BSDF')
    links.new(tex.outputs['Color'],bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value=.88
    if masked:
        links.new(tex.outputs['Alpha'],bsdf.inputs['Alpha'])
        mat.blend_method='CLIP';mat.alpha_threshold=.34
    mat.use_backface_culling=not masked
    return mat
wood,leaf=material('Ridged bark',False),material('Botanical sprays',True)
def uv(tile,u,v):
    return ((tile%3+.005+.99*u)/3,1-(tile//3+1-.005-.99*v)/2)
class Plant:
    def __init__(self,name):
        self.name=name;self.vertices=[];self.faces=[];self.uvs=[];self.slots=[]
    def face(self,coords,texcoords,slot):
        start=len(self.vertices)
        self.vertices.extend(coords);self.faces.append(list(range(start,len(self.vertices))))
        self.uvs.extend(texcoords); self.slots.append(slot)
    def twig(self,a,b,r,tip,sides=6):
        delta=(b-a).normalized()
        u=delta.cross(Vector((.2,.91,0))).normalized();v=delta.cross(u)
        for i in range(sides):
            def ring(j):return u*cos(j*2*pi/sides)+v*sin(j*2*pi/sides)
            e,f=ring(i),ring(i+1)
            self.face([a+r*e,a+r*f,b+tip*f,b+tip*e],[uv(4,i/sides,0),uv(4,(i+1)/sides,0),uv(4,(i+1)/sides,1),uv(4,i/sides,1)],0)
    def frond(self,a,angle,length,width,rise,droop,tile,twist):
        # Bent, ridged sprays retain volume in low drone and overhead views.
        out=Vector((cos(angle),sin(angle),0))
        across=Vector((-sin(angle),cos(angle),0))*cos(twist)+Vector((0,0,sin(twist)))
        lift=Vector((0,0,1))
        def point(t,s):
            return a+out*(length*t)+lift*(rise*t-droop*t*t+(1-abs(s))*.065*width*sin(pi*t))+across*(width*s)
        for j in range(3):
            t,h=j/3,(j+1)/3
            for l,r in [(-1,0),(0,1)]:
                self.face([point(t,l),point(h,l),point(h,r),point(t,r)], [uv(tile,(l+1)/2,t),uv(tile,(l+1)/2,h),uv(tile,(r+1)/2,h),uv(tile,(r+1)/2,t)],1)
    def finish(self):
        m=bpy.data.meshes.new(self.name);m.from_pydata(self.vertices,[],self.faces);m.update()
        m.materials.append(wood);m.materials.append(leaf);layer=m.uv_layers.new()
        for index,tex in enumerate(self.uvs):layer.data[index].uv=tex
        for p,s in zip(m.polygons,self.slots):p.material_index=s
        obj=bpy.data.objects.new('PROP_'+self.name,m);bpy.context.collection.objects.link(obj)
def v(x=0,y=0,z=0):return Vector((x,y,z))
def polar(angle,r,z):return v(cos(angle)*r,sin(angle)*r,z)
def oak():
    t=Plant('oak');a=v();b=v(.026,-.035,.53);c=v(-.03,.025,1.04)
    t.twig(a,b,.088,.055,10);t.twig(b,c,.055,.035,8)
    for j in range(15):
        h=j/14;angle=2.4*j+.2
        start=b.lerp(c,h)
        mid=start+polar(angle,.14+.08*(1-h),.20)
        tip=mid+polar(angle+.17,.12+.09*(1-h),.22+h*.27)
        t.twig(start,mid,.035-.013*h,.021);t.twig(mid,tip,.022,.011)
        for k in range(5):
            aa=angle+(k-2)*.72+rng.uniform(-.14,.14)
            end=tip+polar(aa,rng.uniform(.15,.25),rng.uniform(.02,.18))
            t.twig(tip,end,.012,.004,4)
            t.frond(end,aa,.32,.18,.21+rng.uniform(-.12,.13),rng.uniform(.11,.24),0,rng.uniform(-.9,.9))
            t.frond(end,aa+.81,.25,.155,.23,.08,0,rng.uniform(-.9,.9))
            t.frond(end,aa-.73,.23,.145,.17,.18,0,rng.uniform(-.9,.9))
    t.finish()
def pine():
    t=Plant('pine');t.twig(v(),v(0,.028,1.98),.058,.004,9)
    for layer in range(10):
        h=layer/10;z=.26+layer*.165;n=9-int(h*5)
        for j in range(n):
            a=2*pi*j/n+layer*1.91+rng.uniform(-.17,.17);length=(.61-.45*h)*rng.uniform(.86,1.08)
            start=v(0,.028*h,z+rng.uniform(-.035,.035));end=start+polar(a,length*.68,-.04)
            t.twig(start,end,.015*(1-.5*h),.006,4)
            for side in [-1,0,1]:
                t.frond(start.lerp(end,.20 if side else .40),a+side*.43,length*.84,length*.33,.09,-.025 if h>.8 else .17,1,rng.uniform(-.52,.52))
    t.finish()
def palm():
    t=Plant('palm');p=v()
    for k in range(1,12):
        h=k/11;q=v(.19*h*h,.054*sin(h*pi),1.52*h);r=.068-.026*h
        t.twig(p,q,r,r*.90,8);p=q
    for j in range(18):
        a=j*2.4;young=j/17
        t.frond(p,a,.90-.48*young,.19-.07*young,.56+.18*young,.98-.80*young,2,rng.uniform(-.25,.25))
    t.finish()
def fern():
    t=Plant('fern')
    for j in range(14):
        h=j/14;t.frond(v(0,0,.012),j*2.4,.37-.17*h,.088,.44-.18*h,.40-.29*h,3,rng.uniform(-.45,.45))
    t.finish()
oak();pine();palm();fern()
bpy.ops.export_scene.gltf(filepath=str(Path(glb_path).resolve()),export_format='GLB',export_yup=True,export_extras=False,export_animations=False)
# Blender 4.3 exports hashed alpha as BLEND. In a racing renderer overlapping
# needles must write depth and cast perforated shadows through an alpha mask.
import struct,json
path=Path(glb_path);raw=path.read_bytes();old_size=struct.unpack_from('<I',raw,12)[0]
doc=json.loads(raw[20:20+old_size]);sprays=next(m for m in doc['materials'] if m['name']=='Botanical sprays')
sprays.update(alphaMode='MASK',alphaCutoff=.34)
meta=json.dumps(doc,separators=(',',':')).encode()
meta+=b' '*(-len(meta)%4);payload=raw[20+old_size:]
path.write_bytes(struct.pack('<4sIII4s',b'glTF',2,20+len(meta)+len(payload),len(meta),b'JSON')+meta+payload)
