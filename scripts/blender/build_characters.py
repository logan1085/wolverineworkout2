"""Build original selectable Wolverine companions using Blender."""
from pathlib import Path
exec(Path('scripts/blender/build_catalog.py').read_text().split('items=[')[0])
OUT=ROOT/'public/models/characters';SOURCE=ROOT/'assets/blender/characters'
OUT.mkdir(parents=True,exist_ok=True);SOURCE.mkdir(parents=True,exist_ok=True)
manifest=[]
for slug,title,description,color in [('moss','Moss','A little forest companion.',(.28,.52,.31)),('sunny','Sunny','A warm, round ray of sunshine.',(.92,.55,.12)),('pebble','Pebble','A quiet companion, one day at a time.',(.45,.55,.65))]:
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    body=mat(title,color);dark=mat('Eyes',(.018,.03,.025));cream=mat('Soft cream',(.9,.85,.7));pink=mat('Cheeks',(.8,.35,.28))
    sphere('Body',(0,0,.82),(.55,.4,.67),body)
    for x in [-.23,.23]:
        sphere('Foot',(x,-.04,.17),(.23,.29,.15),cream)
        sphere('Eye',(x*.78,-.378,1),(.05,.035,.072),dark)
        sphere('Eye glint',(x*.78-.014,-.409,1.027),(.012,.009,.018),cream)
        sphere('Cheek',(x*1.45,-.34,.84),(.07,.025,.045),pink)
        sphere('Arm',(x*2.25,0,.72),(.13,.16,.26),body)
    sphere('Smile',(0,-.414,.81),(.065,.018,.025),dark)
    if slug=='moss':
        for x,tilt in [(-.16,-.55),(.16,.55)]:
            o=sphere('Leaf',(x,0,1.56),(.13,.07,.27),body);o.rotation_euler[1]=tilt
    elif slug=='sunny':
        for i in range(7):
            a=i*math.pi/6; sphere('Ray',(.56*math.cos(a),.03,1.12+.52*math.sin(a)),(.115,.12,.115),cream)
    else:
        sphere('Soft cap',(0,.02,1.39),(.45,.35,.13),cream)
    bpy.ops.object.select_all(action='DESELECT')
    for o in bpy.context.scene.objects:
        if o.type=='MESH':o.select_set(True);o.asset_mark()
    bpy.ops.export_scene.gltf(filepath=str(OUT/(slug+'.glb')),export_format='GLB',use_selection=True,export_apply=True)
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.render.resolution_x=400;scene.render.resolution_y=400;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.film_transparent=True;scene.world.color=(.3,.3,.3)
    bpy.ops.object.camera_add(location=(2,-5,2.4));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,.9))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=2.5;scene.camera=cam
    for loc,power in [((2,-3,5),400),((-3,-2,2),200)]:
        bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.size=4;o.rotation_euler=(Vector((0,0,.8))-o.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/(slug+'.blend')),compress=True)
    scene.render.filepath=str(OUT/(slug+'.png'));bpy.ops.render.render(write_still=True)
    manifest.append(dict(id=slug,title=title,description=description,model='/models/characters/'+slug+'.glb',thumbnail='/models/characters/'+slug+'.png'))
(OUT/'catalog.json').write_text(json.dumps(manifest,indent=2)+'\n')
