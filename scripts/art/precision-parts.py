"""Rebuild the complete bolt-on parts catalogue. Run: blender -b -P scripts/art/precision-parts.py."""
import bpy, gzip, math, tempfile
from pathlib import Path
from math import cos, sin, pi
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
bpy.ops.wm.read_factory_settings(use_empty=True)
with tempfile.NamedTemporaryFile(suffix='.glb') as tmp:
    tmp.write(gzip.decompress((ROOT/'assets/worldkit.glb.gz').read_bytes()));tmp.flush()
    bpy.ops.import_scene.gltf(filepath=tmp.name)
parts={o.name:o for o in bpy.context.scene.objects if o.name.startswith('PART_') and o.type=='EMPTY'}

def material(name,rgb,metal,rough):
    m=bpy.data.materials.new(name);m.diffuse_color=(*rgb,1);m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF')
    for k,v in [('Base Color',(*rgb,1)),('Metallic',metal),('Roughness',rough)]:bs.inputs[k].default_value=v
    return m
rubber=material('Graphite tyre compound',(.025,.027,.030),.04,.67)
sidewall=material('Embossed rubber',(.054,.058,.059),.03,.53)
alloy=material('Diamond turned alloy',(.67,.72,.75),.96,.21)
gold=material('Satin forged bronze',(.52,.31,.115),.87,.29)
rotor=material('Brushed rotor steel',(.28,.30,.32),.87,.36)
smith=material('Graphite anodising',(.08,.10,.12),.86,.26)
centre=material('Blacked recess',(.018,.022,.025),.50,.34)
red=material('Vermilion caliper',(.64,.063,.026),.27,.27)
blue=material('Heat tempered titanium',(.14,.19,.43),.88,.24)

carbon=bpy.data.materials['carbon'];carbon.use_nodes=True
bs=carbon.node_tree.nodes.get('Principled BSDF')
bs.inputs['Roughness'].default_value=.30;bs.inputs['Metallic'].default_value=.13
bs.inputs['Coat Weight'].default_value=.42;bs.inputs['Coat Roughness'].default_value=.19
tex=carbon.node_tree.nodes.new('ShaderNodeTexImage')
tex.image=bpy.data.images.load(str(ROOT/'scripts/art/materials/carbon-twill.png'))
tex.image.pack();carbon.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
for name,metal,rough in [('steel',.90,.24),('gold',.88,.25),('glass',.22,.13),('rubber',0,.70)]:
    m=bpy.data.materials.get(name)
    if m and m.use_nodes:
        p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough

# Geometry is built in metres, with X pointing forward and Z upwards in Blender.
class Mesh:
    def __init__(self):self.v=[];self.f=[];self.mat=[];self.smooth=[]
    def face(self,ids,mat,smooth=False):self.f.append(ids);self.mat.append(mat);self.smooth.append(smooth)
    def lathe(self,origin,profile,mat,axis='Y',n=32,angle=0):
        ox,oy,oz=origin;base=len(self.v)
        for d,r in profile:
            for j in range(n):
                a=angle+2*pi*j/n;c=r*cos(a);s=r*sin(a)
                if axis=='Y':p=(ox+c,oy+d,oz-s)
                elif axis=='X':p=(ox+d,oy+c,oz+s)
                else:p=(ox+c,oy+s,oz+d)
                self.v.append(p)
        for k in range(len(profile)-1):
            for j in range(n):
                i=base+k*n+j;q=base+k*n+(j+1)%n
                self.face((i,q,q+n,i+n),mat,n>8)
    def solid(self,lo,hi,mat):
        start=len(self.v);self.v+=lo+hi;n=len(lo)
        self.face(tuple(start+k for k in reversed(range(n))),mat)
        self.face(tuple(start+n+k for k in range(n)),mat)
        for j in range(n):
            k=(j+1)%n;self.face((start+j,start+k,start+n+k,start+n+j),mat)
    def finish(self,name):
        mesh=bpy.data.meshes.new(name);mesh.from_pydata(self.v,[],self.f)
        materials=list(dict.fromkeys(self.mat))
        for m in materials:mesh.materials.append(m)
        for face,m,sm in zip(mesh.polygons,self.mat,self.smooth):face.material_index=materials.index(m);face.use_smooth=sm
        mesh.update();return mesh

def attach(parent,data,name):
    ob=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(ob);ob.parent=parent;return ob

def wheel(k):
    m=Mesh();origin=(0,0,0)
    width=.013 if k<10 else .015
    m.lathe(origin,[(-width,.021),(-width,.027),(-width+.001,.0305),(-width+.003,.0325),(-width+.005,.033),(width-.004,.033),(width-.001,.031),(width,.028),(width,.024),(width-.0006,.0215),(-width,.021)],rubber,n=48)
    lip=width+.0005
    def band(r,tube,depth,mat):
        profile=[(depth+cos(j*pi/4)*tube,r+sin(j*pi/4)*tube) for j in range(9)]
        m.lathe(origin,profile,mat,n=40)
    band(.029,.00032,width,sidewall);band(.0255,.0003,width,sidewall)
    m.lathe(origin,[(-width*.7,.020),(-width*.7,.022),(lip,.0231),(lip+.0006,.0218),(lip-.0001,.0208),(-width*.7,.020)],alloy,n=40)
    m.lathe(origin,[(.004,.005),(.004,.018),(.005,.0185),(.005,.005),(.004,.005)],rotor,n=32)
    for j in range(15):
        a=j*2*pi/15
        m.lathe((.015*cos(a),.0051,.015*sin(a)),[(0,.00077),(.0001,.00077),(.0001,.0001)],centre,n=6)
    m.solid([(-.019,.005,.002),(-.010,.005,.011),(-.010,.005,.016),(-.022,.005,.008)],
            [(-.019,.008,.002),(-.010,.008,.011),(-.010,.008,.016),(-.022,.008,.008)],red)
    finish=gold if k in (2,5,9) else smith if k in (4,7,10) else alloy
    count=[0,6,7,12,9,10,12,8,5,12,7][k]
    def spoke(a,b,w):
        # Forged spokes widen at the hub and sweep toward the rim shoulder.
        def profile(depth):
            pts=[(.005,a-w,depth-.001),(.010,a-w*.8,depth),(.0217,b-w*.4,depth+.001),(.0217,b+w*.4,depth+.001),(.009,a+w*.7,depth),(.005,a+w,depth-.001)]
            return [(r*cos(t),d,r*sin(t)) for r,t,d in pts]
        m.solid(profile(lip-.003),profile(lip-.001),finish)
    if k==7:m.lathe(origin,[(.007,.003),(.009,.0208),(.011,.0208),(.012,.003),(.007,.003)],smith,n=40)
    for j in range(count):
        a=2*pi*j/count
        spoke(a,a+(.29 if k==6 else .13 if k in (3,5,9) else .035),.25 if k in (6,8) else .15)
        if k in (3,5,9):spoke(a,a-.12,.078)
    m.lathe(origin,[(.007,.0001),(.007,.0063),(lip,.0061),(lip+.0006,.0055),(lip+.0006,.0001)],finish,n=24)
    for j in range(5):
        a=j*2*pi/5
        m.lathe((.0043*cos(a),lip,.0043*sin(a)),[(0,.0011),(.0012,.0011),(.00125,.0004)],alloy,n=6)
    band(.022,.00045,lip,blue if k==10 else alloy)
    # Rotation by pi about local Z mirrors outside faces on the car's right flank.
    return m.finish('Precision wheel %02d'%k)

def detail(parent,k,kind):
    m=Mesh();child=next(ob for ob in parent.children_recursive if ob.type=='MESH')
    # Give carbon trim consistent real-world texel density irrespective of the source UV atlas.
    coords=child.data.uv_layers.active or child.data.uv_layers.new(name='Carbon projection')
    for poly in child.data.polygons:
        if child.data.materials[poly.material_index]!=carbon:continue
        axis=max(range(3),key=lambda i:abs(poly.normal[i]))
        plane=[a for a in range(3) if a!=axis]
        for loop in poly.loop_indices:
            p=child.data.vertices[child.data.loops[loop].vertex_index].co
            coords.data[loop].uv=(p[plane[0]]*29,p[plane[1]]*29)
    def bolt(x,y,z,size=.00155):
        m.lathe((x,y,z),[(0,size),(.0007,size),(.0009,size*.78),(.0009,.0002)],alloy,'Z',6)
    if kind=='hood':
        for x in (.043,.097):
            for s in (-1,1):bolt(x,s*.026,.0753)
    elif kind=='aero':
        for x in (-.065,0,.065):
            for s in (-1,1):bolt(x,s*.079,.032)
        for y in (-.055,0,.055):bolt(.157,y,.029)
    elif kind=='wing':
        # Brackets and cap screws on each mounting foot.
        for s in (-1,1):
            m.solid([(-.138,s*.040,.073),(-.112,s*.040,.073),(-.112,s*.055,.073),(-.138,s*.055,.073)],
                    [(-.138,s*.040,.0745),(-.112,s*.040,.0745),(-.112,s*.055,.0745),(-.138,s*.055,.0745)],smith)
            for x in (-.135,-.115):bolt(x,s*.047,.0745)
    elif kind=='lights':
        for s in (-1,1):
            for x in (-.08,-.01,.06):
                m.lathe((x,s*.077,.0155),[(-.001,.004),(.001,.004),(.001,.0025),(-.001,.0025)],smith,'X',8)
    elif kind=='exhaust':
        if k in (6,10):
            for s in (-1,1):
                for x in (-.085,-.045,.003):
                    m.lathe((x,s*.095,.035),[(-.001,.0066),(-.0007,.0076),(.0007,.0076),(.001,.0066)],alloy,'X',24)
        else:
            # Rolled outlet lips are located directly from the source's dark end-cap clusters.
            ys=sorted(set(round(child.data.vertices[i].co.y,6) for f in child.data.polygons if child.data.materials[f.material_index].name=='dark' for i in f.vertices))
            clusters=[]
            for y in ys:
                if not clusters or y-clusters[-1][-1]>.0025:clusters.append([])
                clusters[-1].append(y)
            darkverts=[child.data.vertices[i].co for f in child.data.polygons if child.data.materials[f.material_index].name=='dark' for i in f.vertices]
            for group in clusters:
                vs=[p for p in darkverts if group[0]-.00001<=p.y<=group[-1]+.00001]
                if not vs:continue
                x=min(p.x for p in vs);y=(group[0]+group[-1])/2;z=(min(p.z for p in vs)+max(p.z for p in vs))/2
                r=max(.0043,(group[-1]-group[0])*.53)
                m.lathe((x,y,z),[(-.001,r),(-.001,r*1.24),(0,r*1.35),(.005,r*1.24),(.005,r),(-.001,r)],blue if k==5 else alloy,'X',24)
    if m.f:attach(parent,m.finish(kind+' machining'),kind+' fasteners')

selected=[]
for name,root in parts.items():
    _,cat,num=name.split('_');k=int(num)
    root.location=(0,0,0);root.scale=(1,1,1)
    if cat=='wheels':
        for ob in list(root.children_recursive):bpy.data.objects.remove(ob,do_unlink=True)
        data=wheel(k)
        for x in (-.091,.096):
            for s in (-1,1):
                ob=attach(root,data,'Wheel assembly');ob.location=(x,.080*s,.033)
                if s<0:ob.rotation_euler.z=pi
    else:detail(root,k,cat)
    selected.extend([root,*root.children_recursive])
bpy.ops.object.select_all(action='DESELECT')
for ob in selected:ob.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'assets/parts.glb'),use_selection=True,export_format='GLB',export_extras=False,export_animations=False,export_yup=True)

output=ROOT/'assets/parts.glb'
output.with_suffix('.glb.gz').write_bytes(gzip.compress(output.read_bytes(),compresslevel=9,mtime=0))
output.unlink()
