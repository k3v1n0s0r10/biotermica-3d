"""Publish model-only GLBs and stills from the authoritative Blender scene."""
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from studio import CATALOG, OUTPUT, PUBLIC, SOURCE, hierarchy, open_source
import bpy
from mathutils import Vector

PUBLIC.mkdir(parents=True, exist_ok=True)
for entry in CATALOG:
    scene = open_source()
    root = bpy.data.objects[entry['root']]
    selected = hierarchy(root)
    bpy.ops.object.select_all(action='DESELECT')
    for obj in selected:
        obj.select_set(True)
    target = PUBLIC / entry['id']
    target.mkdir(parents=True, exist_ok=True)
    # Include the loop closing key in GLB animation, but not as an extra video frame.
    scene.frame_end = 361
    bpy.ops.export_scene.gltf(
        filepath=str(target / 'model.glb'), export_format='GLB',
        use_selection=True, export_cameras=False, export_lights=False,
        export_animations=entry['video'], export_animation_mode='SCENE',
        export_frame_range=True, export_force_sampling=True,
        export_extras=True, export_yup=True,
    )
    if entry['video']:
        # Rendered still/video must exist; never quietly publish missing placeholders.
        for origin, name in [('heat-pump.png', 'poster.png'), ('heat-pump-preview.mp4', 'orbit.mp4')]:
            shutil.copy2(OUTPUT / origin, target / name)
        continue
    scene.camera.animation_data_clear()
    meshes = [obj for obj in selected if obj.type == 'MESH']
    for obj in scene.objects:
        if obj.type == 'MESH':
            obj.hide_render = obj not in selected
    points = [obj.matrix_world @ Vector(corner) for obj in meshes for corner in obj.bound_box]
    minimum = Vector(tuple(min(point[axis] for point in points) for axis in range(3)))
    maximum = Vector(tuple(max(point[axis] for point in points) for axis in range(3)))
    center = (minimum + maximum) / 2
    extent = max(maximum - minimum)
    scene.camera.location = center + Vector((1.5, -2.2, 1.4)).normalized() * extent * 3.6
    scene.camera.rotation_euler = (center - scene.camera.location).to_track_quat('-Z', 'Y').to_euler()
    scene.render.resolution_x = 800
    scene.render.resolution_y = 800
    scene.render.filepath = str(target / 'poster.png')
    bpy.ops.render.render(write_still=True)
shutil.copy2(SOURCE, PUBLIC / 'studio.blend')
print('Published native Blender outputs to', PUBLIC)
