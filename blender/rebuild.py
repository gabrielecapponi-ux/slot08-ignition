"""Rebuild the owned SLOT08 scene from source; run with Blender --background --python.
This resets the CURRENT Blender scene. Save other work before running interactively.
"""
import bpy, json
from pathlib import Path
project_dir = Path(__file__).resolve().parent.parent
TRACK_DATA = json.loads((project_dir/'blender/track-data.json').read_text())
bpy.ops.wm.read_factory_settings(use_empty=True)
for script_name in ['build_scene.py','refine_scene.py','upgrade_ignition.py']:
    script_path = project_dir/'blender'/script_name
    exec(compile(script_path.read_text(),str(script_path),'exec'))
bpy.ops.wm.save_as_mainfile(filepath=str(project_dir/'blender/slot08.blend'))
bpy.ops.export_scene.gltf(filepath=str(project_dir/'assets/slot08.glb'),export_format='GLB',export_apply=True)
bpy.context.scene.render.filepath=str(project_dir/'assets/poster.png')
bpy.context.scene.render.image_settings.file_format='PNG'
bpy.ops.render.render(write_still=True)
