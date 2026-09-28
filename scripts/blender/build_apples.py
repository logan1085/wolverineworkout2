"""Original apple companions: a lobed fruit mesh, tiny mittens, seed eyes and a leaf.
Run in the repo: Blender --background --python scripts/blender/build_apples.py -- /absolute/repo
"""
from pathlib import Path
exec(Path('scripts/blender/build_catalog.py').read_text().split('items=[')[0])
OUT=ROOT/'public/models/characters'; SOURCE=ROOT/'assets/blender/characters'
VERSION='apple-v2'
def curve(name,points,radius,material):
    c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=12;c.bevel_depth=radius;c.bevel_resolution=3;c.use_fill_caps=True
    s=c.splines.new('BEZIER');s.bezier_points.add(len(points)-1)
    for p,co in zip(s.bezier_points,points):p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
    o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.data.materials.append(material)
    bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False)
    return o
manifest=[]
for slug,title,color,description in [('pip','Pip',(.64,.105,.065),'A tiny apple with a big heart.'),('sprout','Sprout',(.36,.51,.105),'Fresh green energy, at your own pace.'),('honey','Honey',(.82,.45,.08),'A little golden company for your day.')]:
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    skin=mat(title+' apple skin',color);bs=skin.node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.36;bs.inputs['Coat Weight'].default_value=.18;bs.inputs['Coat Roughness'].default_value=.3;bs.inputs['Subsurface Weight'].default_value=.045
    cream=mat('Vanilla mittens',(.89,.82,.65));cream.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.55
    brown=mat('Cocoa stem',(.12,.047,.021));brown.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.65
    dark=mat('Seed eyes',(.025,.014,.013));dark.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.25
    white=mat('Eye sparkle',(.98,.94,.80));pink=mat('Rosy cheeks',(.95,.35,.23));leaf=mat('Living leaf',(.10,.28,.045));vein=mat('Leaf veins',(.32,.46,.10))
    verts=[];faces=[];rings=48;segments=64
    for i in range(rings+1):
        t=math.pi*i/rings
        for j in range(segments):
            p=2*math.pi*j/segments
            r=.68*math.sin(t)*(1+.16*math.cos(t))*(1+.025*math.cos(5*p)*math.sin(t))
            z=.95+.62*math.cos(t)-.15*math.exp(-(t/.35)**2)+.075*math.exp(-((math.pi-t)/.35)**2)
            z+=.018*math.cos(5*p)*math.sin(t)**2
            verts.append((r*math.cos(p),r*.81*math.sin(p),z))
    for i in range(rings):
        for j in range(segments):
            a=i*segments+j;b=i*segments+(j+1)%segments;faces.append((a,a+segments,b+segments,b))
    mesh=bpy.data.meshes.new('Lobed apple sculpt');mesh.from_pydata(verts,[],faces);mesh.update();body=bpy.data.objects.new('Apple body',mesh);bpy.context.collection.objects.link(body);finish(body,'Apple body',skin)
    from mathutils.bvhtree import BVHTree
    tree=BVHTree.FromObject(body,bpy.context.evaluated_depsgraph_get())
    def front(x,z):
        hit,_,_,_=tree.ray_cast(Vector((x,-2,z)),Vector((0,1,0)));return hit.y if hit else -.50
    for sign in [-1,1]:
        x=sign*.175;z=1.015;y=front(x,z)
        sphere('Seed eye',(x,y-.015,z),(.046,.027,.067),dark)
        sphere('Eye glint',(x-.012,y-.039,z+.024),(.013,.007,.017),white)
        x=sign*.31;z=.88;sphere('Cheek',(x,front(x,z)-.007,z),(.072,.017,.030),pink)
        curve('Little leg',[(sign*.245,0,.44),(sign*.25,-.015,.29)],.045,brown)
        foot=sphere('Soft shoe',(sign*.25,-.065,.20),(.22,.28,.145),cream);foot.rotation_euler[2]=sign*-.12
        if sign<0: points=[(-.61,0,.98),(-.75,-.03,.86),(-.80,-.08,.73)];hand=(-.80,-.08,.70)
        else: points=[(.61,0,.98),(.76,-.03,1.0),(.83,-.07,1.12)];hand=(.84,-.07,1.15)
        curve('Apple arm',points,.044,brown)
        glove=sphere('Little mitten',hand,(.115,.12,.15),cream);glove.rotation_euler[1]=sign*.25
        sphere('Mitten thumb',(hand[0]-sign*.09,hand[1]-.025,hand[2]-.025),(.066,.078,.075),cream)
    smile=[(x,front(x,z)-.02,z) for x,z in [(-.07,.87),(0,.835),(.07,.87)]];curve('Small smile',smile,.013,dark)
    for x,z in [(-.07,.87),(.07,.87)]:sphere('Smile tip',(x,front(x,z)-.02,z),(.013,.013,.013),dark)
    curve('Bent apple stem',[(0,0,1.415),(.015,.005,1.57),(.09,0,1.72)],.046,brown)
    sphere('Rounded stem tip',(.09,0,1.72),(.046,.046,.046),brown)
    verts=[];faces=[]
    def center(t):return Vector((.045+.46*t,-.01-.055*math.sin(math.pi*t),1.63+.16*t+.075*math.sin(math.pi*t)))
    across=Vector((-.32,0,.947))
    for i in range(25):
        t=i/24
        for j in range(9):
            u=(j-4)/4;v=center(t)+across*(.13*math.sin(math.pi*t)**.8*u);v.y-=.025*(1-u*u)*math.sin(math.pi*t);verts.append(tuple(v))
    for i in range(24):
        for j in range(8):a=i*9+j;faces.append((a,a+9,a+10,a+1))
    mesh=bpy.data.meshes.new('Leaf blade');mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new('Apple leaf',mesh);bpy.context.collection.objects.link(o);finish(o,'Apple leaf',leaf);m=o.modifiers.new('Leaf edge','SOLIDIFY');m.thickness=.012;m=o.modifiers.new('Leaf softness','SUBSURF');m.levels=1
    mid=[]
    for t in [.03,.25,.5,.75,.97]:v=center(t);v.y-=.03*math.sin(math.pi*t)+.009;mid.append(tuple(v))
    curve('Leaf midrib',mid,.006,vein)
    # A few deliberately placed freckles, kept subtle enough to read as fruit skin.
    for x,z in [(-.4,1.19),(-.34,1.25),(-.45,1.12),(.39,1.24),(.43,1.16)]:sphere('Apple freckle',(x,front(x,z)-.003,z),(.008,.004,.008),cream)
    bpy.ops.object.select_all(action='DESELECT')
    for o in bpy.context.scene.objects:
        if o.type=='MESH':o.select_set(True);o.asset_mark()
    filename=slug+'-'+VERSION
    bpy.ops.export_scene.gltf(filepath=str(OUT/(filename+'.glb')),export_format='GLB',use_selection=True,export_apply=True)
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=128;scene.cycles.use_denoising=True;scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
    scene.render.resolution_x=1024;scene.render.resolution_y=1024;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.film_transparent=True
    scene.world.use_nodes=True;scene.world.node_tree.nodes.get('Background').inputs[0].default_value=(.8,.85,.75,1);scene.world.node_tree.nodes.get('Background').inputs[1].default_value=.22
    bpy.ops.object.camera_add(location=(.6,-7,2.65));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,.92))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=2.25;scene.camera=cam
    for loc,power,size in [((-3,-4,5),280,4),((3,-3,2),65,3),((1,3,4),220,3)]:
        bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.size=size;o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(OUT/(filename+'.png'));bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/(slug+'.blend')),compress=True);bpy.ops.render.render(write_still=True)
    manifest.append(dict(id=slug,title=title,description=description,model='/models/characters/'+filename+'.glb',thumbnail='/models/characters/'+filename+'.png'))
(OUT/'catalog.json').write_text(json.dumps(manifest,indent=2)+'\n')
