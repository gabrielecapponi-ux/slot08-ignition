# Inspect the game's actual track mesh export in Blender. This is offline asset QA.
import bpy,json,sys,math
from pathlib import Path
from mathutils import Matrix,Vector
import numpy as np
args=sys.argv[sys.argv.index('--')+1:];data=json.load(open(args[0]));output=args[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
R=Matrix.Rotation(math.pi/2,4,'X')
materials=[]
for i,m in enumerate(data['materials']):
 mat=bpy.data.materials.new(m['name'] or 'surface');mat.use_nodes=True;p=mat.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*m['color'],1);p.inputs['Metallic'].default_value=m['metal'];p.inputs['Roughness'].default_value=m['rough'];p.inputs['Coat Weight'].default_value=m['clearcoat']
 if m['emission']:p.inputs['Emission Color'].default_value=(*m['emission'],1);p.inputs['Emission Strength'].default_value=m['energy']
 if m['map']:
  d=m['map'];im=bpy.data.images.new('texture_'+str(i),width=d['width'],height=d['height']);im.pixels.foreach_set(np.array(d['pixels'],dtype=np.float32)/255);im.pack();node=mat.node_tree.nodes.new('ShaderNodeTexImage');node.image=im;node.extension='REPEAT';mix=mat.node_tree.nodes.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY';mix.inputs[0].default_value=1;mix.inputs[1].default_value=(*m['color'],1);mat.node_tree.links.new(node.outputs['Color'],mix.inputs[2]);mat.node_tree.links.new(mix.outputs['Color'],p.inputs['Base Color'])
 materials.append(mat)
meshes=[]
for g in data['geometries']:
 v=np.array(g['position']).reshape((-1,3));ind=np.array(g['index'] if g['index'] else list(range(len(v)))).reshape((-1,3));mesh=bpy.data.meshes.new('runtime_mesh');mesh.from_pydata(v.tolist(),[],ind.tolist());mesh.update()
 if g['uv']:
  coords=np.array(g['uv']).reshape((-1,2));uv=mesh.uv_layers.new();uv.data.foreach_set('uv',coords[np.array([l.vertex_index for l in mesh.loops])].ravel())
 meshes.append(mesh)
for o in data['objects']:
 mesh=meshes[o['geo']];obj=bpy.data.objects.new(o['name'] or 'runtime',mesh);bpy.context.collection.objects.link(obj);obj.matrix_world=R@Matrix(np.array(o['matrix']).reshape((4,4)).T.tolist())
 if not mesh.materials:mesh.materials.append(materials[o['material']])
 # Material per geometry is stable in the runtime apart from curb phase.
 if mesh.materials[0]!=materials[o['material']]:obj.data=obj.data.copy();obj.data.materials[0]=materials[o['material']]
 for poly in obj.data.polygons:poly.use_smooth=True
p=data['track']['pose'];where=Vector((p['x'],-p['y'],p['z']+.077))
asset=Path(__file__).resolve().parents[2]/'assets/fleet-0.glb'
bpy.ops.import_scene.gltf(filepath=str(asset));car=bpy.data.objects.get('CAR_GT');car.location=where;car.rotation_euler.z=-math.atan2(p['ty'],p['tx'])
# Ground for contact and scale. Actual track mesh above is unchanged.
bpy.ops.mesh.primitive_plane_add(size=180,location=(0,0,-.025));floor=bpy.context.object
m=bpy.data.materials.new('studio_floor');m.diffuse_color=(.055,.068,.060,1);m.use_nodes=True;m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.055,.068,.06,1);m.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.85;floor.data.materials.append(m)
bpy.ops.object.camera_add();cam=bpy.context.object
forward=Vector((p['tx'],-p['ty'],0));side=Vector((p['nx'],-p['ny'],0))
target=where+Vector((0,0,.08));cam.location=where+forward*1.25+side*.80+Vector((0,0,.64));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=44
scene=bpy.context.scene;scene.camera=cam
for name,loc,energy,size in [('key',where+Vector((1.4,-.5,2.8)),160,3),('fill',where+Vector((-1,2,1.2)),65,2),('rim',where+Vector((-1.2,-1,1.5)),130,2)]:
 light=bpy.data.lights.new(name,'AREA');light.energy=energy;light.shape='DISK';light.size=size;obj=bpy.data.objects.new(name,light);bpy.context.collection.objects.link(obj);obj.location=loc;obj.rotation_euler=(where-loc).to_track_quat('-Z','Y').to_euler()
scene.world=bpy.data.worlds.new('world');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.17,.23,.3,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.4
scene.render.engine='CYCLES';scene.cycles.samples=40;scene.cycles.use_denoising=False;scene.render.resolution_x=1200;scene.render.resolution_y=800;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.filepath=output
bpy.ops.render.render(write_still=True)
