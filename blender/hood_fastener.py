"""Recessed quarter-turn bonnet fastener, dimensioned in model metres."""
import bpy,json,math
from pathlib import Path
from mathutils import Vector
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.mesh.primitive_cylinder_add(vertices=20,radius=.0033,depth=.00048)
base=bpy.context.object
bpy.ops.mesh.primitive_torus_add(major_segments=20,minor_segments=6,major_radius=.00243,minor_radius=.00023,location=(0,0,.00031))
bpy.ops.mesh.primitive_cube_add(size=1,location=(0,0,.00042))
bpy.context.object.scale=(.0031,.00047,.00034)
for sign in (-1,1):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=8,ring_count=4,radius=.00040,location=(0,sign*.0016,.00028))
bpy.ops.object.select_all(action='SELECT')
bpy.context.view_layer.objects.active=base
bpy.ops.object.join()
m=base.data;m.calc_loop_triangles()
v=[round(n,7) for p in m.vertices for n in (p.co.x,p.co.z,-p.co.y)]
i=[n for t in m.loop_triangles for n in t.vertices]
path=Path(__file__).resolve().parents[1]/'src/render/hood-fastener.js'
path.write_text('// Exported from Blender by blender/hood_fastener.py\nexport const pinVertices='+json.dumps(v,separators=(',',':'))+';\nexport const pinTriangles='+json.dumps(i,separators=(',',':'))+';\n')
