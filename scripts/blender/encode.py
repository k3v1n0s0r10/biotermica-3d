"""Encode native scene frames as H.264, preserving their actual dimensions and timing."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from studio import OUTPUT, open_source
import bpy

scene = open_source()
frames = [OUTPUT / 'frames' / f'heat-pump-{frame:04d}.png' for frame in range(scene.frame_start, scene.frame_end + 1)]
missing = [str(frame) for frame in frames if not frame.exists()]
if missing:
    raise FileNotFoundError(f'Missing {len(missing)} frames; first: {missing[0]}')
first = bpy.data.images.load(str(frames[0]))
scene.render.resolution_x, scene.render.resolution_y = first.size
bpy.data.images.remove(first)
scene.render.resolution_percentage = 100
editor = scene.sequence_editor_create()
strip = editor.strips.new_image('Heat pump orbit', str(frames[0]), channel=1, frame_start=scene.frame_start)
for frame in frames[1:]:
    strip.elements.append(frame.name)
scene.render.use_sequencer = True
scene.render.use_compositing = False
scene.view_settings.view_transform = 'Standard'
scene.render.image_settings.media_type = 'VIDEO'
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format = 'MPEG4'
scene.render.ffmpeg.codec = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'HIGH'
scene.render.filepath = str(OUTPUT / 'heat-pump-preview.mp4')
bpy.ops.render.render(animation=True)
