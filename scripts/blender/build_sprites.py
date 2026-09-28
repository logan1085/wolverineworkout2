"""Original soft sprout creatures. Iterative silhouette studies and production export.
Run in the repo: Blender --background --python scripts/blender/build_apples.py -- /absolute/repo
"""
from pathlib import Path
exec(Path('scripts/blender/build_catalog.py').read_text().split('items=[')[0])
OUT=ROOT/'public/models/characters'; SOURCE=ROOT/'assets/blender/characters'
VERSION='sprite-v4'
DRAFT="--draft" in sys.argv
if DRAFT:
    OUT=Path("/tmp/wolverine-sprite-study");SOURCE=OUT;OUT.mkdir(exist_ok=True)
def curve(name,points,radius,material):
    c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=12;c.bevel_depth=radius;c.bevel_resolution=3;c.use_fill_caps=True
    s=c.splines.new('BEZIER');s.bezier_points.add(len(points)-1)
    for p,co in zip(s.bezier_points,points):p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
    o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.data.materials.append(material)
    bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False)
    return o
manifest=[]
for slug,title,color,description in [('pip','Pip',(.48,.62,.29),'A small forest friend with a big heart.'),('sprout','Sprout',(.27,.49,.43),'Fresh green energy, at your own pace.'),('honey','Honey',(.82,.45,.08),'A little golden company for your day.')]:
    if DRAFT and slug!='pip':continue
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    skin=mat(title+' soft clay',color);bs=skin.node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.52;bs.inputs['Coat Weight'].default_value=.08;bs.inputs['Coat Roughness'].default_value=.3;bs.inputs['Subsurface Weight'].default_value=.045
    cream=mat('Vanilla mittens',(.89,.82,.65));cream.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.55
    brown=mat('Cocoa stem',(.12,.047,.021));brown.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.65
    dark=mat('Seed eyes',(.025,.014,.013));dark.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.25
    white=mat('Eye sparkle',(.98,.94,.80));pink=mat('Rosy cheeks',(.95,.35,.23));leaf=mat('Living leaf',(.10,.28,.045));vein=mat('Leaf veins',(.32,.46,.10))
    verts=[];faces=[];rings=48;segments=64
    for i in range(rings+1):
        t=math.pi*i/rings
        for j in range(segments):
            p=2*math.pi*j/segments
            r=.61*math.sin(t)*(1-.15*math.cos(t))
            z=.95+.70*math.cos(t)
            verts.append((r*math.cos(p),r*.81*math.sin(p),z))
    for i in range(rings):
        for j in range(segments):
            a=i*segments+j;b=i*segments+(j+1)%segments;faces.append((a,a+segments,b+segments,b))
    mesh=bpy.data.meshes.new('Soft pear sculpt');mesh.from_pydata(verts,[],faces);mesh.update();body=bpy.data.objects.new('Sprite body',mesh);bpy.context.collection.objects.link(body);finish(body,'Sprite body',skin)
    from mathutils.bvhtree import BVHTree
    tree=BVHTree.FromObject(body,bpy.context.evaluated_depsgraph_get())
    def front(x,z):
        hit,_,_,_=tree.ray_cast(Vector((x,-2,z)),Vector((0,1,0)));return hit.y if hit else -.50
    for sign in [-1,1]:
        x=sign*.19;z=1.11;y=front(x,z)
        sphere('Seed eye',(x,y-.015,z),(.058,.033,.088),dark)
        sphere('Eye glint',(x-.012,y-.039,z+.024),(.013,.007,.017),white)
        x=sign*.32;z=.96;sphere('Cheek',(x,front(x,z)-.007,z),(.072,.017,.030),pink)
        foot=sphere('Soft foot',(sign*.28,-.12,.27),(.22,.27,.15),skin);foot.rotation_euler[2]=sign*-.20
        if sign<0:
            arm=sphere('Relaxed flipper',(-.59,-.015,.79),(.14,.15,.25),skin);arm.rotation_euler[1]=-.40
        else:
            arm=sphere('Waving flipper',(.61,-.015,1.07),(.135,.15,.27),skin);arm.rotation_euler[1]=-.45
    # Fuse body and limbs into a continuous toy sculpt; retain separate face details.
    bpy.ops.object.select_all(action='DESELECT')
    for part in bpy.context.scene.objects:
        if part.name.startswith(('Sprite body','Soft foot','Relaxed flipper','Waving flipper')):part.select_set(True)
    bpy.context.view_layer.objects.active=body;bpy.ops.object.join()
    remesh=body.modifiers.new('Continuous silhouette','REMESH');remesh.mode='VOXEL';remesh.voxel_size=.025;remesh.use_smooth_shade=True
    bpy.ops.object.modifier_apply(modifier=remesh.name)
    smooth=body.modifiers.new('Soft limb transitions','SMOOTH');smooth.factor=1.1;smooth.iterations=4;bpy.ops.object.modifier_apply(modifier=smooth.name)
    dec=body.modifiers.new('Mobile sculpt budget','DECIMATE');dec.ratio=.18;bpy.ops.object.modifier_apply(modifier=dec.name)
    polish=body.modifiers.new('Silhouette polish','SUBSURF');polish.levels=1;bpy.ops.object.modifier_apply(modifier=polish.name)
    for polygon in body.data.polygons:polygon.use_smooth=True
    body.select_set(False)
    smile=[(x,front(x,z)-.02,z) for x,z in [(-.075,.965),(0,.92),(.075,.965)]];curve('Small smile',smile,.013,dark)
    for x,z in [(-.075,.965),(.075,.965)]:sphere('Smile tip',(x,front(x,z)-.02,z),(.013,.013,.013),dark)
    verts=[];faces=[]
    def center(t):return Vector((.0+.27*t,-.01-.035*math.sin(math.pi*t),1.59+.17*t+.06*math.sin(math.pi*t)))
    across=Vector((-.32,0,.947))
    for i in range(25):
        t=i/24
        for j in range(9):
            u=(j-4)/4;v=center(t)+across*(.085*math.sin(math.pi*t)**.8*u);v.y-=.025*(1-u*u)*math.sin(math.pi*t);verts.append(tuple(v))
    for i in range(24):
        for j in range(8):a=i*9+j;faces.append((a,a+9,a+10,a+1))
    mesh=bpy.data.meshes.new('Leaf blade');mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new('Sprout tuft',mesh);bpy.context.collection.objects.link(o);finish(o,'Sprout tuft',leaf);m=o.modifiers.new('Leaf edge','SOLIDIFY');m.thickness=.012;m=o.modifiers.new('Leaf softness','SUBSURF');m.levels=1
    mid=[]
    for t in [.03,.25,.5,.75,.97]:v=center(t);v.y-=.03*math.sin(math.pi*t)+.009;mid.append(tuple(v))
    curve('Leaf midrib',mid,.006,vein)
    bpy.ops.object.select_all(action='DESELECT')
    for o in bpy.context.scene.objects:
        if o.type=='MESH':o.select_set(True);o.asset_mark()
    filename=slug+'-'+VERSION
    bpy.ops.export_scene.gltf(filepath=str(OUT/(filename+'.glb')),export_format='GLB',use_selection=True,export_apply=True)
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=48 if DRAFT else 160;scene.cycles.use_denoising=True;scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
    scene.render.resolution_x=768 if DRAFT else 1024;scene.render.resolution_y=scene.render.resolution_x;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.film_transparent=True
    scene.world.use_nodes=True;scene.world.node_tree.nodes.get('Background').inputs[0].default_value=(.8,.85,.75,1);scene.world.node_tree.nodes.get('Background').inputs[1].default_value=.22
    bpy.ops.object.camera_add(location=(.6,-7,2.65));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,.92))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=2.25;scene.camera=cam
    for loc,power,size in [((-3,-4,5),280,4),((3,-3,2),65,3),((1,3,4),220,3)]:
        bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.size=size;o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(OUT/(filename+'.png'));bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/(slug+'.blend')),compress=True);bpy.ops.render.render(write_still=True)
    manifest.append(dict(id=slug,title=title,description=description,model='/models/characters/'+filename+'.glb',thumbnail='/models/characters/'+filename+'.png'))
(OUT/'catalog.json').write_text(json.dumps(manifest,indent=2)+'\n')
