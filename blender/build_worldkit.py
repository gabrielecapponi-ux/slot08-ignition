"""Original Worlds & Workshop miniature kit. Blender 5.x, no external assets.
Run in a new background process: Blender --background --python build_worldkit.py.
Saves editable catalogue, render contact sheet, and metre-scale named GLB parts.
"""
import bpy, math, random
from mathutils import Vector
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
bpy.ops.wm.read_factory_settings(use_empty=True)
random.seed(808)
def mat(name,hex,rough=.65,metal=0,emission=0):
    srgb=[int(hex[i:i+2],16)/255 for i in (0,2,4)];rgb=tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in srgb);m=bpy.data.materials.new(name);m.diffuse_color=(*rgb,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*rgb,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
    if emission:p.inputs['Emission Color'].default_value=(*rgb,1);p.inputs['Emission Strength'].default_value=emission
    return m
M={k:mat(k,h,r,m,e) for k,h,r,m,e in [ ('leaf','497C58',.8,0,0),('leaf_light','8CBF70',.8,0,0),('trunk','896044',.85,0,0),('stone','8E9CA5',.95,0,0),('sand','C97C52',.9,0,0),('cream','F4E5BF',.6,0,0),('snow','DFEDF2',.8,0,0),('roof','35586A',.5,.1,0),('orange','EB814F',.4,.1,0),('glass','85DEE4',.25,.4,.15),('rubber','121417',.95,0,0),('dark','18212E',.4,.2,0),('carbon','252D36',.3,.55,0),('steel','A9BFCA',.25,.85,0),('gold','DFB355',.25,.8,0),('red','ED5544',.4,.2,0),('neon','65E9D2',.3,.1,1.2),('fur','B98B61',.9,0,0)]}
assets=[];current=None
def group(name):
 global current
 current=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(current);assets.append(current);return current

def finish(o,material):
 o.data.materials.append(M[material]);o.parent=current;return o

def box(name,loc,scale,material,bevel=.02):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:
  mod=o.modifiers.new('Rounded manufactured edges','BEVEL');mod.width=bevel;mod.segments=2;bpy.ops.object.modifier_apply(modifier=mod.name)
 return finish(o,material)

def sphere(name,loc,scale,material):
 bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=1,location=loc);o=bpy.context.object;o.name=name;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return finish(o,material)

def cone(name,loc,r1,r2,depth,material,vertices=10):
 bpy.ops.mesh.primitive_cone_add(vertices=vertices,radius1=r1,radius2=r2,depth=depth,location=loc);o=bpy.context.object;o.name=name;return finish(o,material)

def rod(name,a,b,r,material,vertices=8):
 d=Vector(b)-Vector(a);o=cone(name,(Vector(a)+Vector(b))/2,r,r,d.length,material,vertices);o.rotation_euler=d.to_track_quat('Z','Y').to_euler();return o

def tree(kind):
 group('PROP_'+kind)
 if kind=='pine':
  cone('Trunk',(0,0,.35),.09,.055,.7,'trunk')
  for z,r in [(.7,.48),(1,.39),(1.27,.28)]:cone('Needles',(0,0,z),r,0,.75,'leaf' if z<1 else 'leaf_light')
 elif kind=='oak':
  cone('Trunk',(0,0,.55),.12,.06,1.1,'trunk');rod('Branch',(0,0,.7),(.35,0,1.1),.04,'trunk');sphere('Crown',(0,0,1.3),(.58,.5,.58),'leaf');sphere('Crown',(.4,.1,1.2),(.38,.4,.4),'leaf_light')
 elif kind=='palm':
  rod('Trunk',(0,0,0),(.16,0,1.35),.07,'trunk')
  for i in range(7):
   a=i*math.tau/7;o=sphere('Palm frond',(.16+math.cos(a)*.32,math.sin(a)*.32,1.40),(.5,.09,.07),'leaf');o.rotation_euler.z=a
 elif kind=='cactus':
  cone('Stem',(0,0,.55),.14,.1,1.1,'leaf');sphere('Tip',(0,0,1.1),(.1,.1,.12),'leaf')
  for side in [-1,1]:rod('Arm',(0,0,.45),(.28*side,0,.5),.07,'leaf_light');rod('Tip',(.28*side,0,.5),(.28*side,0,.85),.07,'leaf_light')
for kind in ['pine','oak','palm','cactus']:tree(kind)
group('PROP_boulder');sphere('Rock',(0,0,.35),(.65,.45,.5),'stone');sphere('Lichen',(.23,-.2,.54),(.3,.18,.18),'leaf_light')
group('PROP_mesa');cone('Mesa base',(0,0,.55),1,.65,1.1,'sand',7);cone('Mesa cap',(0,0,1.2),.7,.62,.25,'cream',7)
group('PROP_cabin');box('Walls',(0,0,.36),(.95,.7,.72),'cream');roof=cone('Roof',(0,0,.85),.78,0,.6,'roof',4);roof.rotation_euler.z=math.pi/4;box('Door',(.49,0,.24),(.025,.18,.48),'trunk');box('Window',(0,-.358,.42),(.25,.02,.21),'glass');box('Chimney',(-.25,.16,1),(.13,.13,.5),'sand')
group('PROP_warehouse');box('Hangar',(0,0,.55),(1.4,1.1,1.1),'roof');box('Roof',(0,0,1.12),(1.5,1.2,.12),'dark');box('Roller door',(.71,0,.39),(.02,.65,.78),'steel');
for y in [-.35,0,.35]:box('Window',(.1,y-.22,.87),(.8,.035,.13),'glass')
group('PROP_lighthouse');cone('Tower',(0,0,.8),.25,.18,1.6,'cream',16)
for z in [.5,1.0]:cone('Stripe',(0,0,z),.24-z*.035,.24-z*.035,.16,'red',16)
cone('Lantern',(0,0,1.67),.24,.24,.22,'glass',12);cone('Cap',(0,0,1.87),.32,0,.2,'roof',12)
group('PROP_windmill');cone('Tower',(0,0,.8),.24,.15,1.6,'cream');cone('Cap',(0,0,1.66),.25,0,.3,'roof')
group('ANIM_rotor');sphere('Hub',(0,0,0),(.1,.1,.1),'gold')
for i in range(4):
 a=i*math.pi/2;o=box('Sail',(.32*math.cos(a),0,.32*math.sin(a)),(.62,.035,.12),'cream',.006);o.rotation_euler.y=-a
for species in ['deer','fox','penguin']:
 group('PROP_'+species)
 if species=='penguin':
  sphere('Body',(0,0,.25),(.13,.14,.26),'dark');sphere('Belly',(.09,0,.25),(.055,.11,.19),'snow');sphere('Head',(0,0,.48),(.12,.12,.12),'dark');sphere('Beak',(.13,0,.47),(.08,.035,.025),'orange')
  for side in [-1,1]:sphere('Flipper',(0,side*.14,.24),(.05,.035,.19),'dark');sphere('Foot',(.06,side*.08,.025),(.1,.06,.025),'orange');sphere('Eye',(.09,side*.07,.51),(.018,.018,.018),'snow')
 else:
  material='fur' if species=='deer' else 'orange';sphere('Body',(0,0,.32),(.26,.12,.16),material)
  for x in [-.17,.17]:
   for y in [-.07,.07]:rod('Leg',(x,y,.3),(x+.02,y,.04),.027,material)
  sphere('Neck',(.2,0,.46),(.10,.08,.19),material);sphere('Head',(.26,0,.61),(.12,.075,.095),material);sphere('Nose',(.37,0,.59),(.045,.04,.032),'dark')
  for side in [-1,1]:o=cone('Ear',(.23,side*.07,.73),.04,0,.14,material,6);o.rotation_euler.x=side*.3;sphere('Eye',(.29,side*.07,.65),(.014,.012,.015),'dark')
  if species=='deer':
   for side in [-1,1]:rod('Antler',(.19,side*.05,.7),(.13,side*.11,.92),.012,'trunk');rod('Antler branch',(.16,side*.09,.82),(.25,side*.16,.91),.009,'trunk')
  else:rod('Tail',(-.23,0,.35),(-.5,0,.45),.075,'orange');sphere('Tail tip',(-.5,0,.45),(.09,.07,.07),'cream')
group('ANIM_bird');sphere('Body',(0,0,0),(.12,.045,.055),'cream');sphere('Head',(.11,0,.035),(.045,.035,.04),'cream');
for side in [-1,1]:o=sphere('Wing',(0,side*.14,0),(.09,.19,.018),'roof');o.rotation_euler.x=side*.15

group('PROP_flower');cone('Pot',(0,0,.10),.14,.19,.2,'sand')
for i in range(5):
 a=i*math.tau/5;x=.12*math.cos(a);y=.12*math.sin(a);rod('Stem',(x,y,.15),(x,y,.36),.009,'leaf');sphere('Flower',(x,y,.37),(.055,.055,.035),'red' if i%2 else 'cream')
group('PROP_crate');box('Crate',(0,0,.18),(.36,.36,.36),'trunk');
for z in [.05,.3]:box('Band',(0,0,z),(.38,.38,.035),'steel',.003)
group('PROP_buoy');cone('Float',(0,0,.14),.25,.12,.28,'orange');rod('Pole',(0,0,.2),(0,0,.65),.018,'steel');sphere('Lamp',(0,0,.67),(.05,.05,.06),'neon')
group('PROP_tunnel_portal')
# Stone voussoirs around a clear 1.04 m wide, 1.1 m high opening.
for side in [-1,1]:box('Pier',(0,side*.65,.28),(.35,.22,.56),'stone')
for i in range(13):
 a=i*math.pi/12;o=box('Arch block',(0,math.cos(a)*.65,.52+math.sin(a)*.65),(.4,.17,.2),'stone');o.rotation_euler.x=a-math.pi/2
box('Keystone',(0,0,1.24),(.42,.23,.15),'cream')
# Car parts are authored in the same coordinate system as CAR_GT (front +X).
for variant in range(1,6):
 group('PART_wing_'+str(variant));h=.105+variant*.012;span=.17+variant*.009
 for y in [-.06,.06]:box('Stanchion',(-.12,y,(h+.06)/2),(.009,.009,h-.06),'carbon',.001)
 for tier in range(2 if variant>=4 else 1):box('Aerofoil',(-.12,0,h+tier*.017),(.035+variant*.004,span,.008),'carbon',.002)
 for side in [-1,1]:box('Endplate',(-.12,side*span/2,h),(.055,.005,.028),'orange',.001)
 group('PART_hood_'+str(variant));box('Engine cover',(.07,0,.069),(.07,.065,.008),'carbon',.002)
 if variant<=3:
  for i in range(variant+1):box('Cooling louvre',(.045+i*.015,0,.076),(.006,.055,.009),'steel',.001)
 else:box('Intake',(.065,0,.088),(.048,.04,.035),'carbon',.004);box('Intake mouth',(.09,0,.09),(.004,.03,.018),'dark',.001)
 group('PART_aero_'+str(variant));box('Splitter',(.14,0,.023),(.05+variant*.006,.17+variant*.005,.008),'carbon',.002)
 for side in [-1,1]:box('Side skirt',(-.005,side*(.081+variant*.002),.026),(.23,.011,.015+variant*.002),'carbon',.002)
 for i in range(variant+2):box('Diffuser fin',(-.15,(i-(variant+1)/2)*.018,.025),(.045,.004,.025),'carbon',.001)
 group('PART_wheels_'+str(variant))
 for x in [-.09,.09]:
  for side in [-1,1]:
   y=side*(.076+variant*.002);r=.032+variant*.001;rod('Tyre',(x,y-.015,.033),(x,y+.015,.033),r,'rubber',20);rod('Alloy',(x,y-.016,.033),(x,y+.016,.033),r*.66,'gold' if variant in [2,5] else 'steel',16)
   for i in range(5+variant):
    a=i*math.tau/(5+variant);rod('Spoke',(x,y+side*.017,.033),(x+math.cos(a)*r*.62,y+side*.017,.033+math.sin(a)*r*.62),.0025,'dark',5)
 group('PART_lights_'+str(variant))
 for side in [-1,1]:box('Underbody',(.005,side*.077,.017),(.22,.006,.006),'neon',.001)
 if variant>=2:
  for i in range(variant):box('Roof LED',(.01,(i-(variant-1)/2)*.016,.133),(.012,.011,.01),'neon',.001)
 group('PART_exhaust_'+str(variant))
 for i in range(2 if variant<3 else 4):
  y=(i-(1 if variant<3 else 3)/2)*.025;rod('Exhaust',(-.14,y,.034),(-.18-variant*.004,y,.034),.007,'steel',10);rod('Bore',(-.183-variant*.004,y,.034),(-.184-variant*.004,y,.034),.0045,'dark',10)
# Merge each asset, retaining named material slots. GLB splits slots efficiently.
for root in assets:
 bpy.ops.object.select_all(action='DESELECT');children=[o for o in root.children if o.type=='MESH']
 for o in children:o.select_set(True)
 if children:
  bpy.context.view_layer.objects.active=children[0];bpy.ops.object.join();o=bpy.context.object;o.name=root.name+'_mesh';bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'assets/worldkit.glb'),export_format='GLB',export_apply=True)
# Editable catalogue is laid out on a tray for easy inspection in Blender.
for i,root in enumerate(assets):
 root.location=((i%8)*2.7,(i//8)*2.7,0)
 if root.name.startswith('PART_'):root.scale=(6,6,6)
world=bpy.data.worlds.new('Studio');world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.13,.18,.23,1);world.node_tree.nodes['Background'].inputs[1].default_value=.5;bpy.context.scene.world=world
bpy.ops.object.light_add(type='AREA',location=(5,0,15));bpy.context.object.data.energy=2400;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=12
bpy.ops.object.light_add(type='SUN',rotation=(.4,-.4,.3));bpy.context.object.data.energy=2
bpy.ops.object.camera_add(location=(27,-19,27));cam=bpy.context.object;cam.rotation_euler=(Vector((9,7,0))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=30;bpy.context.scene.camera=cam
sc=bpy.context.scene;sc.render.engine='BLENDER_EEVEE';sc.render.resolution_x=1500;sc.render.resolution_y=1100;sc.render.resolution_percentage=100;sc.view_settings.view_transform='AgX';sc.render.image_settings.file_format='PNG';sc.render.filepath=str(ROOT/'assets/worldkit-preview.png')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/worldkit.blend'));bpy.ops.render.render(write_still=True)
print('WORLDKIT',len(assets),'named assets',len(bpy.data.meshes),'meshes')
