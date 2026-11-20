"""Original Worlds & Workshop miniature kit. Blender 5.x, no external assets.
Run in a new background process: Blender --background --python build_worldkit.py.
Saves editable catalogue, render contact sheet, and metre-scale named GLB parts.
"""
import bpy, math, random, gzip, lzma
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
# Expedition: purpose-built scenery and genuinely different GT silhouettes.
group('PROP_mushroom')
for x,y,z in [(-.1,0,.18),(.12,.05,.29),(0,-.12,.13)]:
 rod('Stem',(x,y,0),(x,y,z),.028,'cream');o=sphere('Cap',(x,y,z),(.13,.13,.065),'red')
 for j in range(4):
  a=j*math.tau/4;sphere('Cap spot',(x+.065*math.cos(a),y+.065*math.sin(a),z+.047),(.022,.022,.01),'cream')
group('PROP_fern')
for i in range(9):
 a=i*math.tau/9
 for j in range(1,5):
  d=j*.065;o=sphere('Frond',(math.cos(a)*d,math.sin(a)*d,.16+math.sin(j/5*math.pi)*.16),(.13,.035,.012),'leaf_light' if i%2 else 'leaf');o.rotation_euler.z=a
for species in ['rabbit','owl','ibex','tortoise']:
 group('PROP_'+species)
 if species=='rabbit':
  sphere('Body',(0,0,.17),(.2,.12,.16),'cream');sphere('Head',(.15,0,.29),(.1,.085,.1),'cream');sphere('Tail',(-.2,0,.2),(.055,.05,.055),'snow')
  for side in [-1,1]:
   sphere('Ear',(.12,side*.055,.44),(.035,.028,.14),'cream');sphere('Inner ear',(.145,side*.055,.44),(.013,.02,.09),'fur');sphere('Eye',(.22,side*.065,.32),(.012,.012,.012),'dark');sphere('Foot',(.06,side*.085,.025),(.11,.045,.025),'cream')
 elif species=='owl':
  sphere('Body',(0,0,.23),(.15,.13,.22),'fur');sphere('Head',(0,0,.43),(.16,.15,.15),'fur')
  for side in [-1,1]:
   sphere('Face',(.13,side*.075,.44),(.035,.08,.09),'cream');sphere('Eye',(.16,side*.075,.45),(.02,.027,.027),'gold');sphere('Pupil',(.178,side*.075,.45),(.01,.014,.018),'dark');sphere('Wing',(-.03,side*.125,.25),(.1,.04,.18),'trunk');rod('Claw',(.06,side*.07,.03),(.17,side*.07,.03),.014,'gold')
  sphere('Beak',(.19,0,.38),(.04,.024,.04),'orange')
 elif species=='ibex':
  sphere('Body',(0,0,.38),(.3,.14,.2),'fur');sphere('Neck',(.23,0,.55),(.1,.1,.23),'fur');sphere('Head',(.28,0,.72),(.14,.09,.12),'fur')
  for x in [-.19,.19]:
   for side in [-1,1]:rod('Leg',(x,side*.09,.37),(x+.025,side*.09,.06),.03,'fur');box('Hoof',(x+.025,side*.09,.035),(.07,.06,.06),'dark',.008)
  for side in [-1,1]:
   sphere('Eye',(.35,side*.085,.75),(.014,.012,.015),'dark')
   for j in range(6):
    a=j*.2;b=(j+1)*.2;rod('Curved horn',(.22-.27*(1-math.cos(a)),side*.075,.8+.27*math.sin(a)),(.22-.27*(1-math.cos(b)),side*.075,.8+.27*math.sin(b)),.022-j*.002,'trunk')
 else:
  sphere('Shell',(0,0,.17),(.23,.18,.14),'leaf');sphere('Head',(.24,0,.12),(.09,.06,.055),'fur')
  for x in [-.14,.14]:
   for side in [-1,1]:sphere('Foot',(x,side*.16,.045),(.085,.045,.04),'fur')
  for x in [-.1,0,.1]:sphere('Shell scale',(x,0,.29-abs(x)*.3),(.065,.1,.02),'leaf_light')
  for side in [-1,1]:sphere('Eye',(.285,side*.045,.15),(.012,.01,.012),'dark')
group('PROP_bench')
for y in [-.15,-.05,.05,.15]:box('Seat slat',(0,y,.25),(.8,.08,.045),'trunk',.008)
for x in [-.3,.3]:
 rod('Leg',(x,-.12,0),(x,-.12,.25),.025,'steel');rod('Leg',(x,.12,0),(x,.12,.62),.025,'steel')
for z in [.43,.55]:box('Back slat',(0,.15,z),(.8,.045,.09),'trunk',.008)
group('PROP_streetlamp');cone('Foot',(0,0,.04),.12,.08,.08,'dark');rod('Post',(0,0,0),(0,0,1.6),.025,'steel');rod('Arm',(0,0,1.6),(.3,0,1.6),.02,'steel');box('Lantern',(.3,0,1.56),(.18,.12,.08),'dark',.01);box('Lamp',(.3,0,1.51),(.14,.09,.015),'neon',.005)
group('PROP_rock_arch')
for side in [-1,1]:
 sphere('Rock pier',(0,side*1.1,.7),(.65,.45,.8),'sand');sphere('Rock cap',(0,side*.8,1.45),(.55,.6,.45),'sand')
sphere('Bridge rock',(0,0,1.7),(.55,.8,.3),'cream')
group('PROP_sailboat');sphere('Hull',(0,0,.14),(.55,.2,.16),'cream');box('Deck',(0,0,.24),(.8,.3,.04),'trunk');rod('Mast',(0,0,.2),(0,0,1.2),.017,'steel')
# Triangular sail is a real two-sided mesh.
mesh=bpy.data.meshes.new('Sail');mesh.from_pydata([(0,0,.4),(0,0,1.18),(.45,0,.4)],[],[(0,1,2)]);mesh.update();o=bpy.data.objects.new('Sail',mesh);bpy.context.collection.objects.link(o);finish(o,'cream')
for variant in range(6,11):
 v=variant-6
 group('PART_wing_'+str(variant))
 if variant==6:
  o=box('Ducktail',(-.139,0,.089),(.045,.17,.024),'carbon',.004);o.rotation_euler.y=-.3
 else:
  h=[0,.158,.146,.178,.153][v];span=[0,.2,.225,.235,.22][v]
  for side in [-1,1]:
   rod('Wing mount',(-.11,side*.055,.07),(-.135,side*.055,h+.012 if variant==7 else h),.004,'steel')
   if variant==7:rod('Swan neck',(-.135,side*.055,h+.012),(-.16,side*.055,h),.004,'steel')
  for tier in range(3 if variant==9 else 1):
   if variant==10:
    for side in [-1,1]:o=box('Delta panel',(-.14,side*.055,h),(.05,.12,.007),'carbon',.002);o.rotation_euler.z=side*.28
   else:box('Wing',(-.147,0,h+tier*.016),(.052,span,.007),'carbon',.002)
  for side in [-1,1]:box('Wing endplate',(-.147,side*span/2,h+.007),(.06,.004,.034),'gold' if variant==8 else 'red',.001)
  if variant==8:box('Shark fin',(-.08,0,.13),(.1,.004,.045),'carbon',.001)
 group('PART_wheels_'+str(variant))
 for x in [-.09,.09]:
  for side in [-1,1]:
   y=side*.084;r=.035;rod('Slick',(x,y-.017,.035),(x,y+.017,.035),r,'rubber',24);rod('Rim',(x,y-.018,.035),(x,y+.018,.035),r*.78,'gold' if variant==9 else 'steel',24)
   outer=y+side*.019
   if variant==7:
    rod('Aerodisc',(x,outer,.035),(x,outer+side*.002,.035),r*.74,'carbon',24)
    for i in range(6):
     a=i*math.tau/6;sphere('Rivet',(x+math.cos(a)*r*.55,outer+side*.003,.035+math.sin(a)*r*.55),(.002,.001,.002),'gold')
   else:
    rod('Hub dish',(x,outer,.035),(x,outer+side*.001,.035),r*.68,'dark',24)
    count=12 if variant in [6,9] else 5 if variant==8 else 7
    for i in range(count):
     a=i*math.tau/count;b=a+(.36 if variant==6 else -.25 if variant==9 else 0)
     rod('Spoke',(x+math.cos(a)*.007,outer+side*.002,.035+math.sin(a)*.007),(x+math.cos(b)*r*.72,outer+side*.002,.035+math.sin(b)*r*.72),.0035 if variant==8 else .002,'gold' if variant in [9,10] else 'steel',6)
 group('PART_hood_'+str(variant));box('Carbon bonnet',(.075,0,.071),(.1,.075,.008),'carbon',.002)
 if variant in [7,8]:
  box('Engine block',(.07,0,.083),(.065,.05,.018),'steel',.003)
  for i in range(4 if variant==8 else 3):
   for side in [-1,1]:
    x=.043+i*.017;rod('Intake stack',(x,side*.02,.09),(x,side*.022,.113),.006,'gold',12);cone('Intake lip',(x,side*.022,.114),.008,.009,.004,'steel',12);cone('Opening',(x,side*.022,.117),.006,.006,.001,'dark',12)
 else:
  for side in ([-1,1] if variant in [6,9] else [0]):
   y=side*.023;o=box('Air duct',(.072,y,.083),(.065,.026 if side else .055,.018 if variant==6 else .03),'carbon',.003);o.rotation_euler.y=-.12
   box('Duct opening',(.106,y,.087),(.004,.021 if side else .045,.012),'dark',.001)
 group('PART_aero_'+str(variant));box('Splitter',(.15,0,.025),(.06,.195,.006),'carbon',.002)
 for side in [-1,1]:
  box('Side skirt',(0,side*.09,.025),(.25,.012,.012),'carbon',.002)
  if variant in [6,9,10]:
   for j in range(2):o=box('Canard',(.11-j*.025,side*.098,.045+j*.012),(.035,.025,.004),'carbon',.001);o.rotation_euler.y=-.2
  if variant in [7,10]:
   for x in [-.09,.09]:sphere('Fender flare',(x,side*.078,.057),(.05,.023,.019),'carbon')
  if variant in [9,10]:rod('Splitter stay',(.14,side*.065,.055),(.175,side*.075,.028),.002,'steel',6)
 for j in range(7):box('Diffuser vane',(-.16-(.025 if variant==8 else 0),(j-3)*.023,.025),(.08 if variant==8 else .05,.004,.027),'carbon',.001)
 if variant==8:box('Longtail extension',(-.16,0,.065),(.075,.16,.018),'carbon',.003)
 group('PART_lights_'+str(variant))
 for side in [-1,1]:box('Underbody',(0,side*.077,.017),(.22,.005,.005),'gold' if variant==8 else 'neon',.001)
 if variant in [6,7,9]:
  count=2 if variant==6 else 4;z=.065 if variant==6 else .10
  for i in range(count):
   y=(i-(count-1)/2)*.027;x=.16 if variant==6 else .1;rod('Round housing',(x-.008,y,z),(x,y,z),.014,'carbon',16);rod('Lens',(x,y,z),(x+.002,y,z),.011,'glass',16)
 else:
  for i in range(6):box('LED module',(.154,(i-2.5)*.021,.054),(.012,.015,.009),'gold' if variant==8 else 'neon',.001)
 group('PART_exhaust_'+str(variant))
 if variant in [6,10]:
  for side in [-1,1]:
   rod('Side pipe',(.02,side*.09,.035),(-.12,side*.095,.035),.007,'steel',12);rod('Outlet',(-.12,side*.095,.035),(-.13,side*.115,.035),.008,'gold',12)
   if variant==10:
    for j in range(3):rod('Header',(.07-j*.025,side*.065,.06),(.02-j*.025,side*.09,.035),.004,'steel',8)
 else:
  count=1 if variant==7 else 3 if variant==8 else 2
  for i in range(count):
   y=(i-(count-1)/2)*.027;z=.07 if variant==9 else .035;radius=.012 if variant==7 else .008
   rod('Tailpipe',(-.13,y,z),(-.19,y,z),radius,'steel',14);rod('Pipe opening',(-.19,y,z),(-.191,y,z),radius*.7,'dark',14)

# Merge each asset, retaining named material slots. GLB splits slots efficiently.
for root in assets:
 bpy.ops.object.select_all(action='DESELECT');children=[o for o in root.children if o.type=='MESH']
 for o in children:o.select_set(True)
 if children:
  bpy.context.view_layer.objects.active=children[0];bpy.ops.object.join();o=bpy.context.object;o.name=root.name+'_mesh';bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'assets/worldkit.glb'),export_format='GLB',export_apply=True)
(ROOT/'assets/worldkit.glb.gz').write_bytes(gzip.compress((ROOT/'assets/worldkit.glb').read_bytes(),mtime=0))
# Editable catalogue is laid out on a tray for easy inspection in Blender.
for i,root in enumerate(assets):
 root.location=((i%10)*2.7,(i//10)*2.7,0)
 if root.name.startswith('PART_'):root.scale=(6,6,6)
world=bpy.data.worlds.new('Studio');world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.13,.18,.23,1);world.node_tree.nodes['Background'].inputs[1].default_value=.5;bpy.context.scene.world=world
bpy.ops.object.light_add(type='AREA',location=(5,0,15));bpy.context.object.data.energy=2400;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=12
bpy.ops.object.light_add(type='SUN',rotation=(.4,-.4,.3));bpy.context.object.data.energy=2
bpy.ops.object.camera_add(location=(35,-25,38));cam=bpy.context.object;cam.rotation_euler=(Vector((12,11,0))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=39;bpy.context.scene.camera=cam
sc=bpy.context.scene;sc.render.engine='BLENDER_EEVEE';sc.render.resolution_x=1800;sc.render.resolution_y=1500;sc.render.resolution_percentage=100;sc.view_settings.view_transform='AgX';sc.render.image_settings.file_format='PNG';sc.render.filepath=str(ROOT/'assets/worldkit-preview.png')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/worldkit.blend'));(ROOT/'blender/worldkit.blend.xz').write_bytes(lzma.compress((ROOT/'blender/worldkit.blend').read_bytes(),preset=9));bpy.ops.render.render(write_still=True)
print('WORLDKIT',len(assets),'named assets',len(bpy.data.meshes),'meshes')
