"""Render the starting GT in a two-tone photographic pit bay."""
import bpy
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(root/'assets/fleet-0.glb'))
scene=bpy.context.scene
points=[o.matrix_world @ Vector(c) for o in scene.objects if o.type=='MESH' for c in o.bound_box]
lo=Vector([min(p[i] for p in points) for i in range(3)])
hi=Vector([max(p[i] for p in points) for i in range(3)])
center=(lo+hi)/2
span=max(hi-lo)
def place(offset):
    return center+Vector(offset)*span
def aim(obj,target):
    obj.rotation_euler=(target-obj.location).to_track_quat('-Z','Y').to_euler()
def softbox(label,offset,tint,energy,size):
    data=bpy.data.lights.new(label,'AREA')
    data.energy=energy*span**2
    data.color=tint
    data.shape='RECTANGLE'
    data.size=size*span
    data.size_y=.18*span
    obj=bpy.data.objects.new(label,data)
    scene.collection.objects.link(obj)
    obj.location=place(offset)
    aim(obj,center)
softbox('Softbox',(.3,-.8,1.25),(1,.95,.84),95,1.7)
softbox('Rim',(-.9,.6,.54),(.12,.75,1),125,1.5)
softbox('Tail strip',(-.7,-.55,.3),(1,.20,.055),30,.9)
bpy.ops.mesh.primitive_plane_add(size=160*span,location=(center.x,center.y,lo.z-.001*span))
floor=bpy.context.object
mat=bpy.data.materials.new('Polished basalt')
mat.use_nodes=True
bs=mat.node_tree.nodes.get('Principled BSDF')
bs.inputs['Base Color'].default_value=(.022,.034,.044,1)
bs.inputs['Roughness'].default_value=.23
floor.data.materials.append(mat)
bpy.ops.object.camera_add(location=place((.91,-1.08,.46)))
scene.camera=bpy.context.object
aim(scene.camera,center)
scene.camera.data.lens=36
scene.camera.data.clip_start=span*.005
scene.world=bpy.data.worlds.new('Studio')
scene.world.color=(.15,.18,.22)
scene.render.engine='CYCLES'
scene.cycles.samples=32
scene.cycles.use_denoising=False
scene.render.resolution_x=1152
scene.render.resolution_y=520
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='WEBP'
scene.render.image_settings.quality=88
scene.render.filepath=str(root/'assets/club-cover.webp')
bpy.ops.render.render(write_still=True)
