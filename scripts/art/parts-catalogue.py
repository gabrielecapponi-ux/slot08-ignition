"""Render the actual game's workshop parts, plus matching procedural hardware.
blender -b -t 4 -P scripts/art/parts-catalogue.py -- /tmp/slot-parts-catalogue
python scripts/art/pack-parts-catalogue.py /tmp/slot-parts-catalogue
Row order: wing,wheels,hood,aero,lights,exhaust,mechanics. Eleven columns.
Column zero uses a stock GT-08 reference; Automatic in-game can follow upgrades.
"""
import bpy, gzip, math, sys, tempfile
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
OUT=Path(sys.argv[sys.argv.index('--')+1]);OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
with tempfile.NamedTemporaryFile(suffix='.glb') as fp:
    fp.write(gzip.decompress((ROOT/'assets/parts.glb.gz').read_bytes()));fp.flush()
    bpy.ops.import_scene.gltf(filepath=fp.name)
parts={o.name:o for o in bpy.context.scene.objects if o.name.startswith('PART_') and o.type=='EMPTY'}
bpy.ops.import_scene.gltf(filepath=str(ROOT/'assets/fleet-0.glb'))
stock=bpy.data.objects['CAR_GT']

def root(name):
    o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);return o

def stock_part(category,fragments):
    r=root('STOCK_'+category)
    for source in stock.children_recursive:
        if source.type!='MESH' or not any(source.name.startswith(p) for p in fragments):continue
        ob=source.copy();ob.data=source.data.copy();bpy.context.collection.objects.link(ob);ob.parent=r;ob.matrix_world=source.matrix_world.copy()
        if category=='wheels':
            # The stock vehicle batches all four wheels into each mesh. Crop the
            # rear left assembly without altering a single visible face.
            import bmesh
            bm=bmesh.new();bm.from_mesh(ob.data)
            remove=[v for v in bm.verts if v.co.x>-.04 or v.co.y<.035]
            bmesh.ops.delete(bm,geom=remove,context='VERTS');bm.to_mesh(ob.data);bm.free()
    return r
stockparts={
 'wing':stock_part('wing',['GT_rear_wing','GT_wing_stay']),
 'wheels':stock_part('wheels',['GT_alloy','GT_tyre','GT_wheel_spoke','GT_brake_caliper']),
 'hood':stock_part('hood',['GT_bonnet','GT_front_cowl']),
 'aero':stock_part('aero',['GT_splitter','GT_side_skirt']),
 'lights':stock_part('lights',['GT_headlight','GT_LED_signature']),
 'exhaust':stock_part('exhaust',['GT_tailpipe'])}
# One wheel at catalogue scale; the mounted kit remains four identical wheels.
for k in range(1,11):
    r=parts['PART_wheels_'+str(k)]
    wheels=[o for o in r.children if o.type=='MESH']
    visible=max(wheels,key=lambda ob:ob.location.y)
    for ob in wheels:
        if ob!=visible:bpy.data.objects.remove(ob,do_unlink=True)

def material(name,color,metal=.65,rough=.28):
    m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;return m
steel=material('Hardware steel',(.43,.51,.55));copper=material('Copper windings',(.64,.27,.08),.75,.24)
canmat=material('Motor can',(.47,.34,.20));pcb=material('Brake board',(.026,.23,.15),.25,.37)
contact=material('Brake contacts',(.78,.43,.085));magnet=material('Traction magnet',(.11,.14,.23),.8,.37)
def assign(o,r,m):o.parent=r;o.data.materials.append(m);return o
def block(r,loc,dim,m):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.dimensions=dim
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return assign(o,r,m)
def cylinder(r,loc,rad,depth,m):
    bpy.ops.mesh.primitive_cylinder_add(vertices=40,radius=rad,depth=depth,location=loc,rotation=(math.pi/2,0,0));o=bpy.context.object
    for p in o.data.polygons:p.use_smooth=len(p.vertices)==4
    return assign(o,r,m)
motor=root('MECH_motor');level=8
cylinder(motor,(0,0,.019),.015,.051+level*.0008,canmat)
for i in range(4+level//3):
    bpy.ops.mesh.primitive_torus_add(major_radius=.0152,minor_radius=.0011,major_segments=32,minor_segments=8,location=(0,-.018+i*.004,.019),rotation=(math.pi/2,0,0));assign(bpy.context.object,motor,copper)
block(motor,(-.002,0,.035),(.043,.045,.005),steel)
for i in range(3+level//4):block(motor,(-.02+i*.005,0,.040),(.002,.043,.010+level*.0004),steel)
grip=root('MECH_grip');block(grip,(0,0,0),(.017+level*.001,.076,.009),magnet)
# A wheel alongside the magnet makes the traction assembly understandable.
wheel=parts['PART_wheels_10'].children[0].copy();wheel.data=wheel.data.copy();bpy.context.collection.objects.link(wheel);wheel.parent=grip;wheel.location=(.041,0,.027);wheel.rotation_euler=(0,0,0)
brake=root('MECH_brake');block(brake,(0,0,0),(.032,.036,.008),pcb)
for s in [-1,1]:block(brake,(0,s*.009,-.005),(.024,.006,.005),contact)
# The same dimensions and material palette as installHardware in atelier.js.
# Calipers are shown beside the dynamic-brake board, not as fictitious disc brakes.
red=material('Brake caliper',(.79,.19,.045),.25,.37)
for s in [-1,1]:block(brake,(s*.03,0,0),(.009+level*.00035,.004,.016),red)
allroots=list(parts.values())+list(stockparts.values())+[stock,motor,grip,brake]
for r in allroots:
    for ob in [r,*r.children_recursive]:ob.hide_render=True
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=64;scene.cycles.use_denoising=False
scene.cycles.max_bounces=4;scene.cycles.diffuse_bounces=2;scene.cycles.glossy_bounces=3
scene.render.resolution_x=256;scene.render.resolution_y=192;scene.render.resolution_percentage=100
scene.render.image_settings.color_mode='RGB';scene.render.film_transparent=False
scene.world=bpy.data.worlds.new('Softbox dome');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.72,.78,.84,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.65
scene.view_settings.view_transform='AgX'
back=material('Catalogue tabletop',(.54,.58,.58),0,.76)
bpy.ops.mesh.primitive_plane_add(size=200);floor=bpy.context.object;floor.data.materials.append(back)
def area(loc,power,size,color):
    bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.data.color=color;o.rotation_euler=(-o.location).to_track_quat('-Z','Y').to_euler()
area((1,-2,4),260,4,(1,.93,.82));area((-3,2,2),180,3,(.72,.85,1));area((2,3,2),240,2,(1,1,1))
bpy.ops.object.camera_add();cam=bpy.context.object;scene.camera=cam;cam.data.type='ORTHO';cam.data.lens=50
scene.render.image_settings.file_format='PNG'
for row,cat in enumerate(['wing','wheels','hood','aero','lights','exhaust','mechanics']):
    for col in range(3 if cat=='mechanics' else 11):
        if cat=='mechanics':r=[motor,grip,brake][col]
        elif col==0:r=stockparts[cat]
        else:r=parts['PART_'+cat+'_'+str(col)]
        meshes=[o for o in [r,*r.children_recursive] if o.type=='MESH' and len(o.data.vertices)]
        if not meshes:raise ValueError('Missing mesh '+r.name)
        bpy.context.view_layer.update()
        pts=[o.matrix_world@Vector(v) for o in meshes for v in o.bound_box]
        lo=Vector([min(p[i] for p in pts) for i in range(3)]);hi=Vector([max(p[i] for p in pts) for i in range(3)])
        middle=(lo+hi)*.5;scale=1/max(hi-lo)
        r.location-=middle;r.scale*=scale;r.location*=scale
        bpy.context.view_layer.update()
        for ob in [r,*r.children_recursive]:ob.hide_render=False
        floor.location.z=(lo.z-middle.z)*scale-.004
        # Wheel faces always face the viewer; other equipment keeps a shared 3/4 view.
        direction=Vector((.62,2.8,1.15)) if cat=='wheels' else Vector((1.65,2.15,1.75))
        if cat=='exhaust':direction=Vector((-2.1,1.8,1.5))
        cam.location=direction;cam.rotation_euler=(-direction).to_track_quat('-Z','Y').to_euler()
        pts=[o.matrix_world@Vector(v) for o in meshes for v in o.bound_box]
        frame=[cam.rotation_euler.to_matrix().transposed()@p for p in pts]
        spanx=max(p.x for p in frame)-min(p.x for p in frame);spany=max(p.y for p in frame)-min(p.y for p in frame)
        cam.data.ortho_scale=max(spanx,spany*256/192)*1.18
        scene.render.filepath=str(OUT/(str(row)+'-'+str(col)+'.png'));bpy.ops.render.render(write_still=True)
        for ob in [r,*r.children_recursive]:ob.hide_render=True
print('CATALOGUE_READY',OUT)
