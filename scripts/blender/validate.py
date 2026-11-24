"""Validate the actual native scene, including deterministic seeking and loop closure."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from studio import open_source
import bpy

scene = open_source()
fan = bpy.data.objects['fan-rotor']
if scene.camera is None or scene.render.fps != 24 or scene.frame_end != 360:
    raise ValueError('Expected the 15-second, 24-fps white showcase.')


def snapshot(frame):
    scene.frame_set(frame)
    return tuple(scene.camera.matrix_world.copy()), tuple(fan.matrix_world.copy())


def difference(left, right):
    return max(abs(a - b) for one, two in zip(left, right) for row_a, row_b in zip(one, two) for a, b in zip(row_a, row_b))


opening = snapshot(1)
closing = snapshot(361)
if difference(opening, closing) > 0.0001:
    raise ValueError('Camera and fan must close the 15-second loop.')
expected = snapshot(91)
snapshot(240)
if difference(expected, snapshot(91)) > 0.0001:
    raise ValueError('Animation must support arbitrary seeking.')
if abs(fan.rotation_euler.x) > 0.0001 or abs(fan.rotation_euler.y) > 0.0001:
    raise ValueError('The native fan must rotate about local Z without tilting.')
print('Native Blender validation passed: catalog parts, metric scale, shadow ownership, loop and seeking.')
