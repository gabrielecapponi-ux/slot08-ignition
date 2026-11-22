"""Render an original spring-loaded club hand controller to an alpha sprite atlas.
Usage: blender -b -t 4 -P scripts/art/controller.py -- /tmp/slot-frames
"""
import bpy,math,sys
from mathutils import Vector
from pathlib import Path
from math import pi,sin,cos
out=Path(sys.argv[sys.argv.index('--')+1]);out.mkdir(exist_ok=True,parents=True)
b=bpy; b.ops.object.select_all(action='SELECT');b.ops.object.delete(use_global=False)
def material(label,color,metal=0,rough=.35,coat=0):
 m=b.data.materials.new(label);m.use_nodes=True;p=m.node_tree.nodes['Principled BSDF']
 p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;p.inputs['Coat Weight'].default_value=coat;return m
shell=material('Graphite • moulded nylon',(.065,.09,.105),.18,.34)
grip=material('Textured elastomer',(.018,.026,.028),.04,.66)
metal=material('Satin nickel',(.70,.78,.80),.88,.19)
edge=material('Anodised alloy',(.30,.36,.36),.8,.24)
amber=material('Safety orange',(.98,.18,.025),.16,.28,.21)
buttonmat=material('Amber selector',(.99,.49,.028),.12,.21,.22)
ivory=material('Screen print',(.93,.92,.78),0,.55)
def add_mat(o,m):
 o.data.materials.append(m);return o
def finish(o,name,m,bevel=0):
 o.name=name;add_mat(o,m)
 if bevel:
  mod=o.modifiers.new('Mould radius','BEVEL');mod.width=bevel;mod.segments=3
  n=o.modifiers.new('Face normals','WEIGHTED_NORMAL');n.keep_sharp=True
 return o
def cyl(name,r,depth,loc,m,bevel=.015,axis=None):
 b.ops.mesh.primitive_cylinder_add(vertices=40,radius=r,depth=depth,location=loc);o=b.context.object
 if axis:o.rotation_euler=Vector(axis).to_track_quat('Z','Y').to_euler()
 for poly in o.data.polygons:poly.use_smooth=len(poly.vertices)==4
 return finish(o,name,m,bevel)
def cube(name,loc,scale,m,r):
 b.ops.mesh.primitive_cube_add(size=1,location=loc);o=b.context.object;o.dimensions=scale;b.ops.object.transform_apply(location=False,rotation=False,scale=True);return finish(o,name,m,r)
def tube(name,points,r,m):
 cu=b.data.curves.new(name,'CURVE');cu.dimensions='3D';cu.resolution_u=2;cu.bevel_depth=r;cu.bevel_resolution=3
 spl=cu.splines.new('POLY');spl.points.add(len(points)-1)
 for pt,coord in zip(spl.points,points):pt.co=(*coord,1)
 o=b.data.objects.new(name,cu);b.context.collection.objects.link(o);return add_mat(o,m)
# Side profile with a palm swell at the base and shoulder for the forefinger.
outline=[(-.52,2.30),(-.42,2.39),(.36,2.39),(.58,2.21),(.54,1.93),(.33,1.75),(.27,1.62),(.37,.72),(.30,.46),(.16,.35),(-.30,.38),(-.49,.57),(-.57,1.18),(-.62,1.91)]
def casing(name,outline,y1,y2,m,bevel):
 n=len(outline);v=[(x,y,z) for y in [y1,y2] for x,z in outline]
 faces=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
 # profile runs clockwise; front normals point -Y
 me=b.data.meshes.new(name);me.from_pydata(v,[],faces);me.update();o=b.data.objects.new(name,me);b.context.collection.objects.link(o);return finish(o,name,m,bevel)
casing('Controller case',outline,-.245,.245,shell,.082)
casing('Shell seam',outline,-.023,.014,grip,.013)
palm=[(-.42,1.79),(-.21,1.85),(.10,1.69),(.16,1.51),(.22,.69),(.16,.55),(-.23,.55),(-.37,.68),(-.45,1.22)]
casing('Overmould grip',palm,-.272,-.236,grip,.025)
for i in range(6):
 z=.67+i*.145;tube('Rib on palm',[(-.31,-.287,z),(-.17,-.299,z+.044),(.10,-.285,z+.065)],.019,shell)
for x,z in [(-.41,2.13),(.29,2.12),(-.29,.55)]:
 cyl('Recessed steel screw',.047,.013,(x,-.259,z),edge,.005,(0,1,0))
 cube('Screw drive',(x,-.269,z),(.051,.012,.009),grip,.002)
def label(txt,loc,size,mat):
 cu=b.data.curves.new('Print','FONT');cu.body=txt;cu.align_x='CENTER';cu.align_y='CENTER';cu.size=size;cu.extrude=.0005
 o=b.data.objects.new(txt,cu);b.context.collection.objects.link(o);o.location=loc;o.rotation_euler[0]=pi/2;add_mat(o,mat)
label('08',(-.065,-.256,2.04),.26,ivory)
# Bearing and bump stop in the upper shell. Upper stack is animated in the render.
cyl('Bearing flange',.25,.08,(-.14,0,2.40),edge)
cyl('Compression stop',.18,.06,(-.14,0,2.47),grip)
cap=[];cap.append(cyl('Thumb pad',.31,.15,(-.14,0,3.15),amber,.046))
for i in range(3):cap.append(cyl('Thumb grip ribs',.305-i*.016,.014,(-.14,0,3.13+i*.035),amber,.005))
rod=cyl('Piston',.082,.69,(-.14,0,2.80),metal)
spring=tube('Return spring',[(-.14+.118*cos(t*2*pi/26),.118*sin(t*2*pi/26),t/(26*6)*.56) for t in range(26*6+1)],.019,metal);spring.location.z=2.48
# Lane-change switch is mounted to the front shoulder and can retract into it.
axis=Vector((.67,-.66,.35)).normalized();base=Vector((.47,-.105,2.20))
cyl('Switch socket',.177,.10,base,grip,.021,axis)
cyl('Socket bezel',.145,.038,base+axis*.066,edge,.009,axis)
switch=cyl('Change button',.115,.116,base+axis*.115,buttonmat,.038,axis)
for i in range(5):cyl('Cable relief',.082-i*.006,.052,(-.06,0,.36-i*.046),grip,.01)
tube('Controller cord',[(-.06+.22*t*t,-.01+.08*t,.18-.55*t+.09*t*t) for t in (i/32 for i in range(33))],.043,grip)
scene=b.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=100;scene.cycles.use_denoising=False
scene.world.color=(.34,.34,.34)
def area(loc,energy,size,color):
 b.ops.object.light_add(type='AREA',location=loc);o=b.context.object;o.data.energy=energy;o.data.shape='DISK';o.data.size=size;o.data.color=color;o.rotation_euler=(Vector((0,0,1.5))-o.location).to_track_quat('-Z','Y').to_euler()
area((-3,-4,6),440,4.0,(1,.90,.77));area((4,-2,4),560,2.5,(.75,.87,1));area((-.5,3.0,4.5),670,2,(1,.7,.39))
b.ops.object.camera_add(location=(3.7,-7.1,4.65));cam=b.context.object;cam.rotation_euler=(Vector((-.04,0,1.43))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=3.66;scene.camera=cam
scene.render.resolution_x=172;scene.render.resolution_y=280;scene.render.resolution_percentage=100;scene.render.film_transparent=True;scene.render.image_settings.color_mode='RGBA'
for pressed in [0,1]:
 for frame in range(9):
  t=frame/8;travel=.43*t
  if frame==0 and pressed==0: origins=[o.location.z for o in cap]
  for o,z in zip(cap,origins):o.location.z=z-travel
  spring.scale.z=(.56-travel)/.56;rod.location.z=2.80-travel;switch.location=base+axis*(.115-.083*pressed)
  scene.render.filepath=str(out/f'p-{frame}-{pressed}.png');b.ops.render.render(write_still=True)
