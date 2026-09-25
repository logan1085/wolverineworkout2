"""Original soft companions. Blender source, GLB and portraits share one model."""
from pathlib import Path
from mathutils.bvhtree import BVHTree
exec(Path('scripts/blender/build_catalog.py').read_text().split('items=[')[0])
OUT=ROOT/'public/models/characters'; SOURCE=ROOT/'assets/blender/characters'
OUT.mkdir(parents=True,exist_ok=True); SOURCE.mkdir(parents=True,exist_ok=True)
VERSION='atelier-v2'
ONLY=sys.argv[sys.argv.index('--only')+1] if '--only' in sys.argv else None

def plush(name, color):
    m=mat(name,color)
    bs=m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Roughness'].default_value=.72
    bs.inputs['Subsurface Weight'].default_value=.055
    bs.inputs['Sheen Weight'].default_value=.18
    noise=m.node_tree.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=65
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
    if ONLY and slug != ONLY: continue
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
        arm=sphere('Relaxed arm',(sign*(.53 if sign==1 else .50),0,.88 if sign==1 else .76),(.135,.16,.31 if sign==1 else .34),body)
        arm.rotation_euler[1]=-.58 if sign==1 else .22;parts.append(arm)
        parts.append(sphere('Little foot',(sign*.235,-.025,.22),(.185,.245,.22),body))
    bpy.ops.object.select_all(action='DESELECT')
    for o in parts:o.select_set(True)
    bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();o=bpy.context.object
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    mod=o.modifiers.new('Continuous soft form','REMESH');mod.mode='VOXEL';mod.voxel_size=.035;mod.use_smooth_shade=True;bpy.ops.object.modifier_apply(modifier=mod.name)
    mod=o.modifiers.new('Relax surface','SMOOTH');mod.factor=1.25;mod.iterations=5;bpy.ops.object.modifier_apply(modifier=mod.name)
    mod=o.modifiers.new('Silky surface','SUBSURF');mod.levels=1;bpy.ops.object.modifier_apply(modifier=mod.name)
    mod=o.modifiers.new('Mobile geometry budget','DECIMATE');mod.ratio=.22;bpy.ops.object.modifier_apply(modifier=mod.name)
    o.name=title+' continuous body'
    # Bake the authored fabric normal in Blender so the web model has the same surface.
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.025)
    bpy.ops.object.mode_set(mode='OBJECT')
    fabric=bpy.data.images.new(title+' woven surface',width=256,height=256,alpha=False)
    fabric.colorspace_settings.name='Non-Color'
    nodes=body.node_tree.nodes;target=nodes.new('ShaderNodeTexImage');target.image=fabric
    nodes.active=target
    bpy.context.scene.render.engine='CYCLES';bpy.context.scene.cycles.samples=24
    bpy.ops.object.bake(type='NORMAL',normal_space='TANGENT',margin=8,use_clear=True)
    normal=nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=1.0
    body.node_tree.links.new(target.outputs['Color'],normal.inputs['Color'])
    body.node_tree.links.new(normal.outputs['Normal'],nodes.get('Principled BSDF').inputs['Normal'])
    fabric.pack()

    # Project the linen panel onto the actual sculpt, avoiding a floating face disc.
    sculpt=o;tree=BVHTree.FromObject(sculpt,bpy.context.evaluated_depsgraph_get())
    inverse=sculpt.matrix_world.inverted()
    def front_y(x,z):
        origin=inverse @ Vector((x,-2,z));direction=inverse.to_3x3() @ Vector((0,1,0))
        hit,normal,index,distance=tree.ray_cast(origin,direction)
        return (sculpt.matrix_world @ hit).y if hit is not None else -.30
    verts=[(0,front_y(0,1.39)-.012,1.39)];faces=[]
    for ring_index in range(1,25):
        r=ring_index/24
        for i in range(64):
            a=2*math.pi*i/64;x=.30*r*math.cos(a);z=1.39+.245*r*math.sin(a)
            verts.append((x,front_y(x,z)-(.005+.007*(1-r*r)),z))
    for i in range(64): faces.append((0,1+i,1+(i+1)%64))
    for ring_index in range(23):
        for i in range(64):
            a=1+ring_index*64+i;b=1+ring_index*64+(i+1)%64
            faces.append((a,a+64,b+64,b))
    mesh=bpy.data.meshes.new('Conforming linen');mesh.from_pydata(verts,[],faces);mesh.update()
    panel=bpy.data.objects.new('Linen face panel',mesh);bpy.context.collection.objects.link(panel);finish(panel,'Linen face panel',face)
    solid=panel.modifiers.new('Fabric edge','SOLIDIFY');solid.thickness=.003
    for sign in [-1,1]:
        sphere('Eye',(sign*.125,front_y(sign*.125,1.43)-.016,1.43),(.025,.017,.037),dark)
        sphere('Eye catchlight',(sign*.125-.007,front_y(sign*.125,1.43)-.032,1.443),(.006,.004,.007),glint)
        sphere('Blush',(sign*.206,front_y(sign*.206,1.355)-.009,1.355),(.038,.009,.018),blush)
    stroke('Gentle smile',[(x,front_y(x,z)-.016,z) for x,z in [(-.047,1.345),(0,1.323),(.047,1.345)]],.009,dark)
    # Delicate stitched edge follows the face panel, with individually modeled stitches.
    thread=plush('Linen stitching',(.65,.58,.42))
    for i in range(24):
        a=2*math.pi*i/24
        x=.278*math.cos(a);z=1.39+.226*math.sin(a)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,location=(x,front_y(x,z)-.008,z))
        stitch=bpy.context.object;stitch.scale=(.0035,.003,.010);finish(stitch,'Face stitch',thread)
        stitch.rotation_euler[1]=math.pi/2-a
    if slug=='moss':
        stem=stroke('Sprout stem',[(.025,0,1.68),(.045,-.008,1.735),(.06,-.025,1.78)],.018,leaf)
        # A tapered, cupped leaf surface rather than a scaled oval primitive.
        verts=[];faces=[]
        def leaf_center(t): return Vector((.06+.31*t,-.025-.045*math.sin(math.pi*t),1.78+.16*t+.035*math.sin(math.pi*t)))
        across=Vector((-.46,0,.888))
        for i in range(25):
            t=i/24;center=leaf_center(t);width=.095*math.sin(math.pi*t)**.8
            for j in range(9):
                u=(j-4)/4;v=center+across*(width*u);v.y-=.018*(1-u*u)*math.sin(math.pi*t);verts.append(tuple(v))
        for i in range(24):
            for j in range(8):
                a=i*9+j;faces.append((a,a+1,a+10,a+9))
        mesh=bpy.data.meshes.new('Cupped leaf surface');mesh.from_pydata(verts,[],faces);mesh.update()
        sprout=bpy.data.objects.new('Sculpted leaf',mesh);bpy.context.collection.objects.link(sprout);finish(sprout,'Sculpted leaf',leaf)
        mod=sprout.modifiers.new('Leaf thickness','SOLIDIFY');mod.thickness=.012
        mod=sprout.modifiers.new('Leaf smoothing','SUBSURF');mod.levels=1
        midrib=[]
        for t in [.05,.28,.52,.76,.96]:
            v=leaf_center(t);v.y-=.022*math.sin(math.pi*t)+.006;midrib.append(tuple(v))
        stroke('Leaf midrib',midrib,.005,body)
        for t in [.32,.57]:
            for sign in [-1,1]:
                a=leaf_center(t);a.y-=.023
                b=leaf_center(t+.11)+across*(sign*.052);b.y-=.011
                stroke('Leaf vein',[tuple(a),tuple(b)],.003,body)
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
if ONLY:
    old=json.loads((OUT/'catalog.json').read_text())
    manifest=[next((n for n in manifest if n['id']==a['id']),a) for a in old]
(OUT/'catalog.json').write_text(json.dumps(manifest,indent=2)+'\n')
