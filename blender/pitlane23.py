"""Build the suspended five-pod starting light and render its transparent race HUD plate."""
import bpy, math, sys
from mathutils import Vector
from pathlib import Path
bpy.ops.wm.read_factory_settings(use_empty=True)
def mat(name,c,metal=0,rough=.34):
 m=bpy.data.materials.new(name);m.diffuse_color=(*c,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;return m
steel=mat('Brushed aluminium',(.29,.34,.37),.82);black=mat('Graphite powder coat',(.033,.047,.058),.52);rubber=mat('Rubber moulding',(.016,.019,.021),.1);lens=mat('Smoked red lens',(.12,.006,.004),.23)
def finish(name,m,bevel):
 obj=bpy.context.object;obj.name=name;obj.data.materials.append(m)
 if bevel:
  mod=obj.modifiers.new('Rolled edges','BEVEL');mod.width=bevel;mod.segments=3
  obj.modifiers.new('Face normals','WEIGHTED_NORMAL')
 return obj
def block(name,loc,size,m,bevel=.04):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return finish(name,m,bevel)
def tube(name,a,b,r,m):
 d=Vector(b)-Vector(a);bpy.ops.mesh.primitive_cylinder_add(vertices=40,radius=r,depth=d.length,location=(Vector(a)+Vector(b))/2);o=finish(name,m,.012);o.rotation_euler=d.to_track_quat('Z','Y').to_euler();return o
block('Carrier',(0,0,0),(6.5,.44,1.26),black,.09)
for z in [-.59,.59]:block('Folded lip',(0,-.25,z),(6.35,.11,.055),steel,.018)
for x in [-2.6,2.6]:
 tube('Hanger',(x,0,.47),(x,0,2.8),.049,steel)
 block('Clamped clevis',(x,-.14,.68),(.24,.27,.27),steel)
for i in range(5):
 x=(i-2)*1.16;tube('Lamp bezel',(x,-.23,0),(x,-.40,0),.47,rubber);tube('Lens',(x,-.405,0),(x,-.425,0),.365,lens)
 block('Rain visor',(x,-.44,.435),(.94,.39,.06),black)
for x in [-3.04,3.04]:
 for z in [-.39,.39]:tube('Fastener',(x,-.222,z),(x,-.27,z),.049,steel)
s=bpy.context.scene
def light(pos,power,size):
 l=bpy.data.lights.new('Softbox','AREA');l.energy=power;l.shape='DISK';l.size=size;o=bpy.data.objects.new('Softbox',l);s.collection.objects.link(o);o.location=pos;o.rotation_euler=(-Vector(pos)).to_track_quat('-Z','Y').to_euler()
light((-3,-4,4),700,5);light((4,-2,2),430,3)
cam=bpy.data.cameras.new('Front elevation');o=bpy.data.objects.new('Front elevation',cam);s.collection.objects.link(o);o.location=(0,-10,.25);o.rotation_euler=(math.pi/2,0,0);cam.type='ORTHO';cam.ortho_scale=6.8;s.camera=o
s.render.engine='CYCLES';s.cycles.samples=12;s.cycles.use_denoising=False;s.render.film_transparent=True;s.render.resolution_x=816;s.render.resolution_y=240;s.render.resolution_percentage=100
s.render.image_settings.file_format='WEBP';s.render.image_settings.color_mode='RGBA';s.render.filepath=str(Path(__file__).resolve().parents[1]/'assets'/'starter23.webp');bpy.ops.render.render(write_still=True)
