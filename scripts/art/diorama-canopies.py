"""Render the overhead foliage tiles for pack-diorama.py using Blender in background mode.
blender -b -P scripts/art/diorama-canopies.py -- assets/botanical.glb assets/diorama.glb.gz /tmp/slot-canopies
"""
import bpy, sys, gzip, tempfile
from pathlib import Path
from mathutils import Vector
source,rocks,dest=map(Path,sys.argv[sys.argv.index('--')+1:])
dest.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source))
with tempfile.TemporaryDirectory() as tmp:
    glb=Path(tmp)/'diorama.glb';glb.write_bytes(gzip.decompress(rocks.read_bytes()));bpy.ops.import_scene.gltf(filepath=str(glb))
props=[o for o in bpy.context.scene.objects if o.parent is None]
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=False
scene.render.film_transparent=True;scene.render.image_settings.color_mode='RGBA'
scene.render.resolution_x=384;scene.render.resolution_y=384;scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('Dome');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.61,.72,.9,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.65
bpy.ops.object.light_add(type='SUN',location=(-3,-4,5));light=bpy.context.object;light.rotation_euler=Vector((3,4,-5)).to_track_quat('-Z','Y').to_euler();light.data.energy=3.4;light.data.angle=.11;light.data.color=(1,.86,.67)
bpy.ops.object.camera_add();cam=bpy.context.object;scene.camera=cam;cam.data.type='ORTHO'
for name in ['oak','pine','palm','limestone']:
    for root in props:
        for ob in [root,*root.children_recursive]:ob.hide_render=root.name!='PROP_'+name
    root=bpy.data.objects['PROP_'+name]
    pts=[o.matrix_world@Vector(v) for o in [root,*root.children_recursive] if o.type=='MESH' for v in o.bound_box]
    lo=Vector([min(p[i] for p in pts) for i in range(3)]);hi=Vector([max(p[i] for p in pts) for i in range(3)])
    focus=(lo+hi)*.5;cam.location=focus+Vector((0,-1.9,5));cam.rotation_euler=(focus-cam.location).to_track_quat('-Z','Y').to_euler()
    frame=[cam.rotation_euler.to_matrix().transposed()@(p-focus) for p in pts]
    cam.data.ortho_scale=2.04*max(max(abs(p.x),abs(p.y)) for p in frame)
    scene.render.filepath=str(dest/(name+'.png'));bpy.ops.render.render(write_still=True)
