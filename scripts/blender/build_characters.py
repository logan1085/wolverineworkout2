"""Original soft companions. Blender source, GLB and portraits share one model."""
from pathlib import Path
exec(Path('scripts/blender/build_catalog.py').read_text().split('items=[')[0])
OUT=ROOT/'public/models/characters'; SOURCE=ROOT/'assets/blender/characters'
OUT.mkdir(parents=True,exist_ok=True); SOURCE.mkdir(parents=True,exist_ok=True)
VERSION='soft-v2'

def plush(name, color):
    m=mat(name,color)
    bs=m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Roughness'].default_value=.72
    bs.inputs['Subsurface Weight'].default_value=.055
    bs.inputs['Sheen Weight'].default_value=.18
    noise=m.node_tree.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=180
    bump=m.node_tree.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.13;bump.inputs['Distance'].default_value=.012
    m.node_tree.links.new(noise.outputs['Fac'],bump.inputs['Height']);m.node_tree.links.new(bump.outputs['Normal'],bs.inputs['Normal'])
    return m

def stroke(name, points, radius, material):
    c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=10;c.bevel_depth=radius;c.bevel_resolution=3
    sp=c.splines.new('BEZIER');sp.bezier_points.add(len(points)-1)
    for p,co in zip(sp.bezier_points,points):p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
    o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.data.materials.append(material)
    bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False)
    return o

manifest=[]
for slug,title,description,color in [
    ('moss','Moss','A soft forest spirit with a little leaf of optimism.',(.25,.39,.19)),
    ('sunny','Sunny','A pocket of warmth, with a sunny little tuft.',(.74,.48,.17)),
    ('pebble','Pebble','A calm little presence with both feet on the ground.',(.34,.40,.35)),
]:
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    body=plush(title+' soft shell',color)
    face=plush('Warm linen face',(.88,.80,.62))
    dark=mat('Espresso eyes',(.025,.034,.022));dark.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.36
    glint=mat('Eye catchlight',(.92,.94,.83))
    blush=plush('Subtle peach',(.70,.39,.28))
    leaf=plush('Leaf accent',(.12,.25,.09))
    # Merge overlapping volumes into a single smooth silhouette, no toy-like seams.
    parts=[]
    wide=1.09 if slug=='pebble' else 1
    parts.append(sphere('Torso',(0,0,.91),(.52*wide,.37,.69),body))
    parts.append(sphere('Head',(0,-.015,1.35),(.435*wide,.345,.40),body))
    for sign in [-1,1]:
        arm=sphere('Relaxed arm',(sign*.50,0,.76),(.135,.16,.34),body)
        arm.rotation_euler[1]=sign*-.22;parts.append(arm)
        parts.append(sphere('Little foot',(sign*.235,-.025,.22),(.185,.245,.22),body))
    bpy.ops.object.select_all(action='DESELECT')
    for o in parts:o.select_set(True)
    bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();o=bpy.context.object
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    mod=o.modifiers.new('Continuous soft form','REMESH');mod.mode='VOXEL';mod.voxel_size=.035;mod.use_smooth_shade=True;bpy.ops.object.modifier_apply(modifier=mod.name)
    mod=o.modifiers.new('Relax surface','SMOOTH');mod.factor=1.25;mod.iterations=5;bpy.ops.object.modifier_apply(modifier=mod.name)
    mod=o.modifiers.new('Silky surface','SUBSURF');mod.levels=1;bpy.ops.object.modifier_apply(modifier=mod.name)
    mod=o.modifiers.new('Mobile geometry budget','DECIMATE');mod.ratio=.34;bpy.ops.object.modifier_apply(modifier=mod.name)
    o.name=title+' continuous body'
    # Small face high on the head; no separate belly or large animal features.
    bpy.ops.mesh.primitive_uv_sphere_add(segments=64,ring_count=40,location=(0,-.324,1.39))
    panel=bpy.context.object;panel.scale=(.30,.055,.245);finish(panel,'Linen face panel',face)
    for sign in [-1,1]:
        sphere('Eye',(sign*.125,-.371,1.43),(.025,.017,.037),dark)
        sphere('Eye catchlight',(sign*.125-.007,-.387,1.443),(.006,.004,.007),glint)
        sphere('Blush',(sign*.206,-.349,1.355),(.038,.009,.018),blush)
    stroke('Gentle smile',[(-.047,-.372,1.345),(0,-.378,1.323),(.047,-.372,1.345)],.009,dark)
    # Delicate stitched edge follows the face panel, with individually modeled stitches.
    thread=plush('Linen stitching',(.65,.58,.42))
    for i in range(28):
        a=2*math.pi*i/28
        x=.278*math.cos(a);z=1.39+.226*math.sin(a)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,location=(x,-.349,z))
        stitch=bpy.context.object;stitch.scale=(.006,.004,.012);finish(stitch,'Face stitch',thread)
        stitch.rotation_euler[1]=math.pi/2-a
    if slug=='moss':
        stem=stroke('Sprout stem',[(.04,0,1.68),(.06,0,1.80),(.13,0,1.87)],.018,leaf)
        sprout=sphere('Single leaf',(.17,0,1.84),(.17,.047,.080),leaf);sprout.rotation_euler[1]=-.4
        stroke('Leaf midrib',[(.055,-.043,1.80),(.16,-.050,1.84),(.29,-.037,1.89)],.008,body)
        for x,z in [(.12,1.824),(.20,1.854)]:
            stroke('Leaf vein',[(x,-.046,z),(x+.01,-.047,z+.032)],.005,body)
    elif slug=='sunny':
        for x,z,angle in [(-.13,1.71,-.5),(0,1.78,0),(.13,1.71,.5)]:
            tuft=sphere('Sun tuft',(x,.01,z),(.09,.085,.14),body);tuft.rotation_euler[1]=angle
    else:
        sphere('Little crown pebble',(.085,.025,1.735),(.145,.12,.070),body)
    bpy.ops.object.select_all(action='DESELECT')
    for o in bpy.context.scene.objects:
        if o.type=='MESH':o.select_set(True);o.asset_mark()
    filename=slug+'-'+VERSION
    bpy.ops.export_scene.gltf(filepath=str(OUT/(filename+'.glb')),export_format='GLB',use_selection=True,export_apply=True)
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=160;scene.cycles.use_denoising=True
    scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
    scene.render.resolution_x=1024;scene.render.resolution_y=1024;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG';scene.render.film_transparent=True
    scene.world.use_nodes=True;scene.world.node_tree.nodes.get('Background').inputs[0].default_value=(.68,.75,.65,1);scene.world.node_tree.nodes.get('Background').inputs[1].default_value=.25
    bpy.ops.object.camera_add(location=(1.0,-7,2.30));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,.97))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=2.32;scene.camera=cam
    for loc,power,size in [((-3,-4,5),240,4),((3,-2,2),65,3),((1,3,4),280,3)]:
        bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.size=size;o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(OUT/(filename+'.png'))
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/(slug+'.blend')),compress=True)
    bpy.ops.render.render(write_still=True)
    manifest.append(dict(id=slug,title=title,description=description,model='/models/characters/'+filename+'.glb',thumbnail='/models/characters/'+filename+'.png'))
(OUT/'catalog.json').write_text(json.dumps(manifest,indent=2)+'\n')
