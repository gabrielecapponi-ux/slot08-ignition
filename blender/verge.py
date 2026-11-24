"""Build a folded meadow tuft and export its triangles in renderer coordinates."""
import bpy
import json
import math
import random
from pathlib import Path
rng = random.Random(8029)
vertices, triangles = [], []
for blade in range(28):
    angle = rng.uniform(0, math.tau)
    x, y = rng.uniform(-.12,.12), rng.uniform(-.12,.12)
    dx, dy = math.cos(angle), math.sin(angle)
    height, width = rng.uniform(.07,.21), rng.uniform(.006,.013)
    start = len(vertices)
    for t in (0,.55):
        for side in (-1,0,1):
            curl = height*t*t*.55 + (1-abs(side))*.003
            vertices.append((x+dx*curl-dy*width*side,y+dy*curl+dx*width*side,height*t))
    vertices.append((x+dx*height*.65,y+dy*height*.65,height))
    for face in [(0,1,3),(1,4,3),(1,2,4),(2,5,4),(3,4,6),(4,5,6)]:
        triangles.append(tuple(start+i for i in face))
mesh = bpy.data.meshes.new('Prato di bordo pista')
mesh.from_pydata(vertices, [], triangles)
mesh.update()
coords = [round(k,5) for vertex in mesh.vertices for k in (vertex.co.x,vertex.co.z,-vertex.co.y)]
indices = [i for p in mesh.polygons for i in p.vertices]
out = Path(__file__).resolve().parents[1]/'src/render/verge-mesh.js'
out.write_text('export const grassVertices='+json.dumps(coords)+';\nexport const grassIndices='+json.dumps(indices)+';\n')
