"""SLOT08 freestanding illuminated apex blade. Blender Z up, local Y depth."""
import bpy
def shell(name, outline, y, thickness, color, metallic, glow=0):
    n=len(outline)
    vertices=[(x,d,z) for d in (y,y+thickness) for x,z in outline]
    faces=[tuple(reversed(range(n))),tuple(range(n,2*n))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    mesh=bpy.data.meshes.new('Apex20 '+name)
    mesh.from_pydata(vertices,[],faces)
    mesh.update()
    obj=bpy.data.objects.new(mesh.name,mesh)
    bpy.context.collection.objects.link(obj)
    mat=bpy.data.materials.new(mesh.name);mat.use_nodes=True
    shader=mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value=(*color,1)
    shader.inputs['Metallic'].default_value=metallic
    shader.inputs['Roughness'].default_value=.29
    shader.inputs['Emission Color'].default_value=(*color,1)
    shader.inputs['Emission Strength'].default_value=glow
    mesh.materials.append(mat)
    return obj
beacon=[
 shell('Foot',[(-.19,0),(.19,0),(.16,.06),(-.15,.06)],-.095,.19,(.08,.11,.14),.77),
 shell('Blade',[(-.09,.05),(.025,.05),(.07,.35),(.32,.45),(.32,.58),(-.13,.48)],-.04,.08,(.34,.45,.49),.88),
 shell('Inset',[(-.095,.365),(.292,.454),(.292,.548),(-.104,.454)],-.045,.006,(.016,.022,.027),.3)
]
for i in range(3):
 x=-.065+i*.112;z=.392+i*.026
 beacon.append(shell('Light'+str(i),[(x,z),(x+.045,z+.010),(x+.071,z+.041),(x+.047,z+.062),(x+.004,z+.052),(x+.029,z+.034)],-.050,.005,(.4,.96,.83),.12,3))
if __name__=='__main__' and '--export-game' in __import__('sys').argv:
    import json
    from pathlib import Path
    parts=[]
    for obj in beacon:
        m=obj.data;m.calc_loop_triangles()
        parts.append([[round(q,5) for v in m.vertices for q in (v.co.x,v.co.z,-v.co.y)],[q for tri in m.loop_triangles for q in tri.vertices]])
    path=Path(__file__).resolve().parents[1]/'src/render/apex-mesh.js'
    path.write_text('// Exported by blender/apex_beacon.py\nexport const bladeParts='+json.dumps(parts,separators=(',',':'))+';\n')
