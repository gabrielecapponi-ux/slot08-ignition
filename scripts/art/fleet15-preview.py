import bpy, sys, math
from mathutils import Vector
from pathlib import Path
args=sys.argv[sys.argv.index('--')+1:]
model,out=args[:2]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=model)
s=bpy.context.scene
s.render.engine='CYCLES';s.cycles.samples=64
s.cycles.use_denoising=False
s.render.resolution_x=1100;s.render.resolution_y=760;s.render.resolution_percentage=100
s.world=bpy.data.worlds.new('Studio');s.world.color=(.055,.055,.055)
s.view_settings.view_transform='AgX'
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.0006));floor=bpy.context.object
m=bpy.data.materials.new('Studio ground');m.diffuse_color=(.042,.054,.061,1);m.use_nodes=True;m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(.042,.054,.061,1);m.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.34;floor.data.materials.append(m)
for name,loc,power,size,color in [('key',(.12,-.18,.55),7,.48,(1,.95,.84)),('rim',(-.2,.23,.35),7,.3,(.80,.89,1)),('front',(.45,.2,.15),3,.3,(1,1,1))]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.shape='RECTANGLE';o.data.size=size;o.data.size_y=size*.35;o.data.color=color;o.rotation_euler=(Vector((0,0,.05))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=((- .46,-.43,.24) if len(args)>2 and args[2]=='rear' else (.46,-.43,.24)));c=bpy.context.object;c.rotation_euler=(Vector((0,0,.055))-c.location).to_track_quat('-Z','Y').to_euler();c.data.type='ORTHO';c.data.ortho_scale=.44;s.camera=c
s.render.filepath=out;bpy.ops.render.render(write_still=True)
