"""Shared native Blender source, catalog, and output paths. Never creates model geometry."""
import json
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'blender' / 'models' / 'heat-pump.blend'
OUTPUT = ROOT / 'out' / 'blender'
PUBLIC = ROOT / 'public' / 'previews'
CATALOG = json.loads((ROOT / 'blender' / 'catalog.json').read_text())


def open_source():
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    scene = bpy.context.scene
    scene.frame_set(1)
    if scene.unit_settings.system != 'METRIC':
        raise ValueError('Native source must use metric units.')
    for entry in CATALOG:
        if bpy.data.objects.get(entry['root']) is None:
            raise ValueError(f"Missing named component: {entry['root']}")
    meshes = [obj for obj in scene.objects if obj.type == 'MESH']
    if not meshes or any(obj.visible_shadow for obj in meshes):
        raise ValueError('Models must contain geometry and remain shadow-free.')
    OUTPUT.mkdir(parents=True, exist_ok=True)
    return scene


def hierarchy(root):
    return {root, *root.children_recursive}
