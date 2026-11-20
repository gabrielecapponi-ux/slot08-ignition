"""Optional: restore editable/uncompressed Blender outputs after cloning."""
from pathlib import Path
import gzip
import lzma
root = Path(__file__).resolve().parent.parent
for packed, target, decode in [
    ('assets/worldkit.glb.gz', 'assets/worldkit.glb', gzip.decompress),
    ('blender/worldkit.blend.xz', 'blender/worldkit.blend', lzma.decompress),
]:
    output = root / target
    output.write_bytes(decode((root / packed).read_bytes()))
    print(output)
