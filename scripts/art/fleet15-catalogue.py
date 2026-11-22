"""Render the nine actual fleet GLBs into the existing 3×3 garage atlas.
blender -b -t 8 -P scripts/art/fleet15-catalogue.py -- /tmp/slot-fleet15-catalogue
python scripts/art/fleet15-catalogue.py --pack /tmp/slot-fleet15-catalogue
Tile order is chassis ID 0..8, 256×128 pixels. No concept art is used.
The colour samples are selectable game paints; individual saved paint is dynamic in the viewer.
"""
from pathlib import Path
import sys
ROOT=Path(__file__).resolve().parents[2]
if '--pack' in sys.argv:
 from PIL import Image
 folder=Path(sys.argv[sys.argv.index('--pack')+1]);atlas=Image.new('RGBA',(768,384),(0,0,0,0))
 for i in range(9):
  tile=Image.open(folder/f'{i}.png').convert('RGBA')
  assert tile.size==(256,128)
  atlas.paste(tile,((i%3)*256,(i//3)*128))
 atlas.putdata([(r,g,b,a) if a else (0,0,0,0) for r,g,b,a in atlas.getdata()])
 atlas.save(ROOT/'assets/fleet-catalog.webp',lossless=True,exact=True,method=6)
 print('Fleet atlas ready:',(ROOT/'assets/fleet-catalog.webp').stat().st_size,'bytes')
 raise SystemExit
import bpy
from mathutils import Vector
OUT=Path(sys.argv[sys.argv.index('--')+1]);OUT.mkdir(parents=True,exist_ok=True)
paints=['c6f568','8bbcff','f0eee2','ff854e','f1cf68','51b5a0','dd9b65','b7c3cd','d65eaa']
def linear(hex):
 def convert(c):
  c=int(c,16)/255
  return c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4
 return tuple(convert(hex[j:j+2]) for j in (0,2,4))+(1,)
for index,colour in enumerate(paints):
 bpy.ops.wm.read_factory_settings(use_empty=True)
 bpy.ops.import_scene.gltf(filepath=str(ROOT/f'assets/fleet-{index}.glb'))
 s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=48;s.cycles.use_denoising=False
 s.cycles.max_bounces=4;s.cycles.diffuse_bounces=2;s.cycles.glossy_bounces=3
 s.render.resolution_x=256;s.render.resolution_y=128;s.render.resolution_percentage=100
 s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.render.film_transparent=True
 s.world=bpy.data.worlds.new('Catalogue studio');s.world.use_nodes=True
 s.world.node_tree.nodes['Background'].inputs[0].default_value=(.28,.34,.42,1)
 s.world.node_tree.nodes['Background'].inputs[1].default_value=.35
 s.view_settings.view_transform='AgX'
 for mat in bpy.data.materials:
  if not mat.use_nodes:continue
  p=mat.node_tree.nodes.get('Principled BSDF')
  if mat.name.startswith('MAT_lime_enamel'):p.inputs['Base Color'].default_value=linear(colour)
  elif mat.name.startswith('MAT_smoked_glass'):p.inputs['Base Color'].default_value=linear('30404c')
  elif mat.name.startswith('MAT_seat'):p.inputs['Base Color'].default_value=linear('333e49')
 # The floor contributes a soft, transparent contact shadow; there is no rectangular background.
 bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.0006));floor=bpy.context.object;floor.is_shadow_catcher=True
 m=bpy.data.materials.new('Shadow receiver');m.use_nodes=True
 m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.12,.14,.16,1)
 m.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.8;floor.data.materials.append(m)
 for name,loc,power,size,col in [('key',(.12,-.18,.55),7,.48,(1,.95,.84)),('rim',(-.2,.23,.35),7,.3,(.8,.89,1)),('front',(.45,.2,.15),3,.3,(1,1,1))]:
  bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.shape='RECTANGLE';o.data.size=size;o.data.size_y=size*.35;o.data.color=col;o.rotation_euler=(Vector((0,0,.05))-o.location).to_track_quat('-Z','Y').to_euler()
 bpy.ops.object.camera_add(location=(.46,-.43,.23));cam=bpy.context.object;target=Vector((0,0,.052));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';s.camera=cam
 bpy.context.view_layer.update()
 car=bpy.data.objects['CAR_GT'];pts=[o.matrix_world@Vector(v) for o in car.children_recursive if o.type=='MESH' for v in o.bound_box]
 view=[cam.rotation_euler.to_matrix().transposed()@(p-target) for p in pts]
 spanx=max(p.x for p in view)-min(p.x for p in view);spany=max(p.y for p in view)-min(p.y for p in view)
 cam.data.ortho_scale=max(spanx,spany*2)*1.08
 center=Vector(((max(p.x for p in view)+min(p.x for p in view))/2,(max(p.y for p in view)+min(p.y for p in view))/2,0))
 cam.location+=cam.rotation_euler.to_matrix()@center
 s.render.filepath=str(OUT/f'{index}.png');bpy.ops.render.render(write_still=True)
print('FLEET_TILES_READY',OUT)
