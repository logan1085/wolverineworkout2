"""Render front, three-quarter and profile views from an existing Blender source.
Blender --background --python scripts/blender/review_character.py -- source.blend /tmp/review
"""
import bpy, sys
from pathlib import Path
from mathutils import Vector
args=sys.argv[sys.argv.index('--')+1:]
bpy.ops.wm.open_mainfile(filepath=str(Path(args[0]).resolve()))
out=Path(args[1]);out.mkdir(parents=True,exist_ok=True)
scene=bpy.context.scene;scene.cycles.samples=64
scene.render.resolution_x=640;scene.render.resolution_y=640
for name,position in [('front',(0,-7,1.6)),('three-quarter',(4,-6,2.1)),('profile',(7,-.6,1.8))]:
    cam=scene.camera;cam.location=position
    cam.rotation_euler=(Vector((0,0,.98))-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(out/(name+'.png'));bpy.ops.render.render(write_still=True)
