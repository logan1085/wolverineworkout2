"""Build original selectable Wolverine companions using Blender."""
from pathlib import Path
exec(Path('scripts/blender/build_catalog.py').read_text().split('items=[')[0])
OUT=ROOT/'public/models/characters';SOURCE=ROOT/'assets/blender/characters'
OUT.mkdir(parents=True,exist_ok=True);SOURCE.mkdir(parents=True,exist_ok=True)
manifest=[]
for slug,title,description,color in [('moss','Moss','A little forest companion.',(.19,.32,.16)),('sunny','Sunny','A warm, round ray of sunshine.',(.72,.46,.13)),('pebble','Pebble','A quiet companion, one day at a time.',(.28,.34,.28))]:
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    body=mat(title,color);dark=mat('Eyes',(.018,.03,.025));cream=mat('Soft cream',(.82,.79,.62));pink=mat('Cheeks',(.64,.29,.22))
    body.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.48
    dark.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.16
    silhouette = (.51,.42,.69) if slug=='moss' else ((.63,.43,.57) if slug=='sunny' else (.62,.42,.56))
    bpy.ops.mesh.primitive_uv_sphere_add(segments=64,ring_count=40,location=(0,0,.82));o=bpy.context.object;o.scale=silhouette;finish(o,'Body',body)
    sphere('Belly',(0,-.405,.64),(.27,.055,.21),cream)
    for x in [-.23,.23]:
        sphere('Foot',(x,-.04,.17),(.23,.29,.15),cream)
        sphere('Eye',(x*.78,-.378,1),(.05,.035,.072),dark)
        sphere('Eye glint',(x*.78-.014,-.409,1.027),(.012,.009,.018),cream)
        sphere('Cheek',(x*1.45,-.34,.84),(.07,.025,.045),pink)
        sphere('Arm',(x*2.25,0,.72),(.14,.17,.23),body)
    sphere('Smile',(0,-.443,.9),(.045,.018,.018),dark)
    if slug=='moss':
        for x,tilt in [(-.16,-.55),(.16,.55)]:
            o=sphere('Leaf',(x,0,1.56),(.13,.07,.27),body);o.rotation_euler[1]=tilt
            vein=sphere('Leaf vein',(x,-.06,1.56),(.016,.014,.20),cream);vein.rotation_euler[1]=tilt
    elif slug=='sunny':
        for i in range(7):
            a=i*math.pi/6; o=sphere('Petal',(.55*math.cos(a),.04,.98+.5*math.sin(a)),(.12,.1,.22),body);o.rotation_euler[1]=math.pi/2-a
    else:
        sphere('Soft cap',(0,.02,1.4),(.46,.34,.10),cream)
        for x in [-.1,0,.1]: sphere('Cap detail',(x,-.19,1.45),(.025,.1,.013),body)
    bpy.ops.object.select_all(action='DESELECT')
    for o in bpy.context.scene.objects:
        if o.type=='MESH':o.select_set(True);o.asset_mark()
    bpy.ops.export_scene.gltf(filepath=str(OUT/(slug+'-green.glb')),export_format='GLB',use_selection=True,export_apply=True)
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=96;scene.view_settings.view_transform='AgX';scene.cycles.use_denoising=True;scene.render.resolution_x=640;scene.render.resolution_y=640;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.film_transparent=True;scene.world.color=(.12,.12,.12)
    bpy.ops.object.camera_add(location=(1.3,-5,2.1));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,.9))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=2.5;scene.camera=cam
    for loc,power in [((2,-3,5),320),((-3,-2,2),90),((1,3,4),380)]:
        bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.size=4;o.rotation_euler=(Vector((0,0,.8))-o.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/(slug+'.blend')),compress=True)
    scene.render.filepath=str(OUT/(slug+'-portrait-green.png'));bpy.ops.render.render(write_still=True)
    manifest.append(dict(id=slug,title=title,description=description,model='/models/characters/'+slug+'-green.glb',thumbnail='/models/characters/'+slug+'-portrait-green.png'))
(OUT/'catalog.json').write_text(json.dumps(manifest,indent=2)+'\n')
