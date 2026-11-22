"""Build the instanced trackside miniature scenery in Blender, in model metres.
Run blender -b -P scripts/art/diorama.py -- assets/diorama.glb.gz
"""
import bpy, math, random, sys, gzip, tempfile
from pathlib import Path
from mathutils import Vector
from math import sin, cos, pi
from collections import defaultdict
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()
rng=random.Random(1708)
materials={}
def material(name,metal,rough):
 m=bpy.data.materials.new(name);m.use_nodes=True
 t=m.node_tree;p=t.nodes.get('Principled BSDF')
 p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 node=t.nodes.new('ShaderNodeVertexColor');node.layer_name='tint';t.links.new(node.outputs['Color'],p.inputs['Base Color'])
 materials[name]=m
for k,m,r in [('earth',0,.92),('wood',0,.75),('paint',.18,.43),('steel',.68,.35),('glass',.56,.19)]:
 material(k,m,r)
def col(hexstr,variance=1):
 values=[int(hexstr[i:i+2],16)/255 for i in range(0,6,2)]
 return tuple(min(1,(v/12.92 if v<.04045 else ((v+.055)/1.055)**2.4)*variance) for v in values)+(1,)
class Prop:
 def __init__(self,name):
  self.name=name;self.meshes=defaultdict(lambda:[[],[],[]])
 def geom(self,verts,faces,c,mat='earth',jitter=0):
  v,f,colors=self.meshes[mat];start=len(v);v.extend(verts)
  for face in faces:
   f.append(tuple(start+i for i in face));colors.append(col(c,1+rng.uniform(-jitter,jitter)))
 def box(self,x,y,z,w,d,h,c,mat='paint',angle=0):
  verts=[]
  for a,b,zz in [(-1,-1,0),(1,-1,0),(1,1,0),(-1,1,0),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]:
   i,j=w*a*.5,d*b*.5;verts.append((x+i*cos(angle)-j*sin(angle),y+i*sin(angle)+j*cos(angle),z+zz*h))
  self.geom(verts,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],c,mat)
 def rod(self,a,b,r,c,mat='steel',n=8,r2=None):
  a=Vector(a);b=Vector(b);axis=(b-a).normalized()
  u=axis.cross(Vector((0,1,0)) if abs(axis.y)<.9 else Vector((1,0,0))).normalized();v=axis.cross(u)
  verts=[tuple(origin+(u*cos(i*2*pi/n)+v*sin(i*2*pi/n))*radius) for origin,radius in ((a,r),(b,r if r2 is None else r2)) for i in range(n)]
  self.geom(verts,[tuple(reversed(range(n))),tuple(range(n,n*2))]+[(i,(i+1)%n,n+(i+1)%n,n+i) for i in range(n)],c,mat,.05)
 def rock(self,x,y,z,w,d,h,colors,n=12):
  verts=[];faces=[];angles=[2*pi*i/n+rng.uniform(-.09,.09) for i in range(n)]
  shifts=[rng.uniform(.8,1.12) for _ in range(n)]
  layers=[(0,.84),(.2,1),(.44,.94),(.49,1),(.7,.88),(.77,.84),(1,.58)]
  for l,(height,rad) in enumerate(layers):
   for i,a in enumerate(angles):
    r=rad*shifts[i]*rng.uniform(.94,1.06)
    verts.append((x+r*cos(a)*w+.14*height*w,y+r*sin(a)*d,z+h*(height+rng.uniform(-.035,.035))))
  for l in range(len(layers)-1):
   for i in range(n):
    a=l*n+i;b=l*n+(i+1)%n;faces.append((a,b,b+n,a+n))
  faces.append(tuple(range(len(verts)-n,len(verts))))
  # Split colour between bedding planes to retain geological seams.
  for j,face in enumerate(faces):
   self.geom([verts[i] for i in face],[tuple(range(len(face)))],colors[min(len(colors)-1,j//n%len(colors))],jitter=.11)
 def export(self):
  parent=bpy.data.objects.new('PROP_'+self.name,None);bpy.context.collection.objects.link(parent)
  for mat,(verts,faces,colors) in self.meshes.items():
   m=bpy.data.meshes.new(self.name+'_'+mat);m.from_pydata(verts,[],faces);m.update()
   ca=m.color_attributes.new(name='tint',type='BYTE_COLOR',domain='CORNER')
   for p,color in zip(m.polygons,colors):
    for l in p.loop_indices:ca.data[l].color=color
   ob=bpy.data.objects.new(m.name,m);bpy.context.collection.objects.link(ob);ob.parent=parent;m.materials.append(materials[mat])

def rocks(name,colors):
 p=Prop(name)
 for i,(x,y,w,d,h) in enumerate([(0,0,.49,.29,.47),(.40,.06,.27,.22,.31),(-.32,-.14,.23,.15,.2)]):
  p.rock(x,y,0,w,d,h,colors)
 for i in range(14):
  a=rng.uniform(0,2*pi);r=rng.uniform(.48,.75);w=rng.uniform(.018,.074)
  p.rock(cos(a)*r,sin(a)*r*.65,-.004,w,w*.7,w*.56,colors,n=6)
 p.export()
rocks('limestone',['797a6f','a5a698','898d83','70746e','a6a79a','898e81','a4aa8c'])
rocks('red_bluff',['9f6752','c28d65','a57059','b2866b','835e55','b47d57','c89572'])
def grass(name,palette,height):
 p=Prop(name)
 for k in range(10):
  dx=rng.uniform(-.19,.19);dy=rng.uniform(-.13,.13)
  for i in range(10):
   a=rng.random()*2*pi;h=rng.uniform(.36,1)*height
   x=dx+rng.uniform(-.014,.014);y=dy+rng.uniform(-.014,.014);width=.007+rng.random()*.007
   vx=-sin(a)*width;vy=cos(a)*width;lean=h*rng.uniform(.3,.85)
   def blade(t,r):
    return [(x+cos(a)*lean*t*t+vx*r,y+sin(a)*lean*t*t+vy*r,h*t) for r in (-r,r)]
   vertices=blade(0,.78)+blade(.48,1)+blade(.8,.6)+[(x+cos(a)*lean,y+sin(a)*lean,h)]
   p.geom(vertices,[(0,1,3,2),(2,3,5,4),(4,5,6)],rng.choice(palette),'earth')
 p.export()
grass('meadow_tuft',['596142','879354','a1a264','7c8b52','c5b77d'],.20)
grass('dune_grass',['a99362','a89971','cab980','bca776','868651'],.27)
p=Prop('fallen_oak')
p.rod((-.44,0,.12),(.43,.09,.09),.105,'655041','wood',13,.079)
p.rod((-.444,0,.12),(-.45,0,.12),.088,'c9a376','wood',13)
for i in range(12):
 a=i*2*pi/12;p.rod((-.4,.086*cos(a),.118+.086*sin(a)),(.38,.084+.075*cos(a),.094+.075*sin(a)),.009,'51453a','wood',5)
for i in range(5):
 x=rng.uniform(-.34,.29);p.rod((x,.04,.15),(x+.10,rng.uniform(-.17,.16),rng.uniform(.19,.31)),.023,'5a5041','wood',7,.008)
p.export()
p=Prop('alpine_fence')
for x in [-.48,.48]:
 p.box(x,0,0,.055,.077,.29,'7d7055','wood')
for z in [.095,.20]:p.rod((-.53,0,z),(.53,0,z+.008),.025,'a69976','wood',7)
p.export()
def building():
 p=Prop('signal_lodge');w=.95;d=.68;h=.49
 p.box(0,0,0,w+.08,d+.08,.055,'a49a88','earth');p.box(0,0,.055,w,d,h,'a97d55','wood')
 for i in range(12):
  p.box(0,-d/2-.006,.065+i*.04,w,.015,.006,'775742','wood')
 for x in [-.29,.25]:
  p.box(x,-.355,.22,.23,.026,.19,'463d32','wood');p.box(x,-.371,.23,.20,.009,.16,'52717a','glass')
  p.box(x,-.38,.23,.009,.012,.16,'e4cca5','wood');p.box(x,-.38,.30,.21,.012,.009,'d0ba94','wood')
  p.box(x,-.377,.2,.26,.042,.018,'8e7959','wood')
 for side in [-1,1]:
  for i in range(16):
   x=(i-7.5)*.065
   p.geom([(x-.032,0,.72),(x+.032,0,.72),(x+.032,side*.425,.52),(x-.032,side*.425,.52)],[(0,1,2,3)],rng.choice(['404746','555453','515852']),'steel')
 p.box(.28,.11,.66,.1,.1,.22,'977766','earth');p.box(.28,.11,.87,.13,.13,.025,'555453','steel')
 p.export()
building()
def container(p,x,y,z,c):
 p.box(x,y,z,.77,.32,.29,c)
 for side in [-1,1]:
  for i in range(18):p.box(x-.34+i*.04,y+side*.164,z+.028,.009,.012,.23,c)
  for zz in [z+.016,z+.268]:p.box(x,y+side*.167,zz,.78,.02,.015,'586568','steel')
 for xx in [-.385,.385]:
  for yy in [-.07,.07]:
   p.box(x+xx,y+yy,z+.023,.014,.133,.243,c)
   p.rod((x+xx*1.03,y+yy,z+.034),(x+xx*1.03,y+yy,z+.26),.005,'bbbec0')
   p.box(x+xx*1.04,y+yy+.016,z+.115,.012,.046,.008,'b6baba','steel')
p=Prop('freight_stack');container(p,0,0,0,'974b3c');container(p,0,.34,0,'6d898a');container(p,-.015,.03,.295,'59818a');p.export()
p=Prop('dock_jib');p.box(0,0,0,.42,.34,.07,'84817a','earth');p.rod((0,0,.06),(0,0,.63),.088,'d6ac54','paint',12)
p.box(-.055,0,.53,.27,.26,.22,'d5ab58');p.box(-.12,-.135,.60,.115,.009,.099,'526d75','glass')
for side in [-1,1]:
 points=[(-.10,side*.1,.72),(.53,side*.045,1.04),(.53,side*.045,1.16),(-.10,side*.1,.90)]
 for j in range(4):p.rod(points[j],points[(j+1)%4],.013,'c69b50')
 for i in range(8):
  f=i/8;g=(i+1)/8
  p.rod((-.10+.63*f,side*(.1-.055*f),.72+.32*f+(.18-.06*f)*(i%2)),(-.10+.63*g,side*(.1-.055*g),.72+.32*g+(.18-.06*g)*((i+1)%2)),.009,'bc8846')
p.rod((.53,0,1.10),(.53,0,.56),.005,'565b58');p.box(.53,0,.51,.057,.045,.055,'c79248')
p.export()
p=Prop('pit_bench')
p.box(0,0,0,.61,.33,.035,'454b50');p.box(0,0,.035,.56,.28,.29,'395158')
for i in range(4):
 p.box(0,-.148,.05+i*.06,.51,.017,.052,'48616a');p.box(0,-.165,.08+i*.06,.28,.013,.007,'c4c6bf','steel')
p.box(0,0,.33,.65,.35,.026,'b5a483','wood')
for i in range(3):
 x=-.19+i*.10;p.rod((x,0,.36),(x,0,.45),.025,['975b4b','82909c','aea070'][i],'paint',12)
p.box(.18,0,.355,.18,.13,.10,'515a58','paint');p.export()
out=Path(sys.argv[sys.argv.index('--')+1])
with tempfile.TemporaryDirectory() as tmp:
 raw=Path(tmp)/'diorama.glb'
 bpy.ops.export_scene.gltf(filepath=str(raw),export_format='GLB',export_yup=True,export_animations=False,export_texcoords=False,export_normals=True)
 out.write_bytes(gzip.compress(raw.read_bytes(),compresslevel=9,mtime=0))
