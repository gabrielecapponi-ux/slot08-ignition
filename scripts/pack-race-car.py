"""Extract the GT hierarchy and its exact binary geometry from the original diorama."""
import json
import struct
from pathlib import Path

root = Path(__file__).resolve().parents[1] / 'assets'
data = (root / 'slot08.glb').read_bytes()
size = struct.unpack_from('<I', data, 12)[0]
doc = json.loads(data[20:20 + size])
binary = data[28 + size:]
car = next(i for i, node in enumerate(doc['nodes']) if node.get('name') == 'CAR_GT')
def family(i):
    yield i
    for child in doc['nodes'][i].get('children', []):
        yield from family(child)
def select(key, ids):
    ids = sorted(set(ids))
    values = [doc[key][i] for i in ids]
    doc[key] = values
    return {old: new for new, old in enumerate(ids)}
nodes = select('nodes', family(car))
meshes = select('meshes', (n['mesh'] for n in doc['nodes'] if 'mesh' in n))
primitives = [p for m in doc['meshes'] for p in m['primitives']]
materials = select('materials', (p['material'] for p in primitives))
accessors = select('accessors', (i for p in primitives for i in [p['indices'], *p['attributes'].values()]))
views = select('bufferViews', (a['bufferView'] for a in doc['accessors']))
doc['scenes'] = [{'nodes': [nodes[car]]}]
for node in doc['nodes']:
    if 'mesh' in node: node['mesh'] = meshes[node['mesh']]
    if 'children' in node: node['children'] = [nodes[i] for i in node['children']]
for p in primitives:
    p['material'] = materials[p['material']]
    p['indices'] = accessors[p['indices']]
    p['attributes'] = {k: accessors[i] for k, i in p['attributes'].items()}
for a in doc['accessors']: a['bufferView'] = views[a['bufferView']]
packed = bytearray()
for v in doc['bufferViews']:
    start = v.get('byteOffset', 0)
    packed.extend(bytes(-len(packed) % 4))
    v['byteOffset'] = len(packed)
    packed.extend(binary[start:start + v['byteLength']])
doc['buffers'] = [{'byteLength': len(packed)}]
packed.extend(bytes(-len(packed) % 4))
header = json.dumps(doc, separators=(',', ':')).encode()
header += b' ' * (-len(header) % 4)
out = struct.pack('<4sII', b'glTF', 2, 28 + len(header) + len(packed))
out += struct.pack('<I4s', len(header), b'JSON') + header
out += struct.pack('<I4s', len(packed), b'BIN\0') + packed
(root / 'race-gt.glb').write_bytes(out)
print(len(data), len(out), len(doc['nodes']))
