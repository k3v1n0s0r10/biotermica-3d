"""Render the native .blend scene. Pass -- --animation [--preview] for PNG frames."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from studio import OUTPUT, open_source
import bpy

scene = open_source()
if '--preview' in sys.argv:
    scene.render.resolution_x = 480
    scene.render.resolution_y = 480
    scene.cycles.samples = 8
scene.render.image_settings.media_type = 'IMAGE'
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGB'
if '--animation' in sys.argv:
    scene.render.filepath = str(OUTPUT / 'frames' / 'heat-pump-')
    bpy.ops.render.render(animation=True)
else:
    scene.render.filepath = str(OUTPUT / 'heat-pump.png')
    bpy.ops.render.render(write_still=True)
