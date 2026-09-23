"""Original stylized anime companion. Run with Blender --background --python this_file -- repo_root."""
from pathlib import Path
exec(Path('scripts/blender/build_catalog.py').read_text().split('items=[')[0])
OUT=ROOT/'public/models/characters';SOURCE=ROOT/'assets/blender/characters'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
skin=mat('Warm skin',(.72,.42,.30));hair=mat('Midnight indigo',(.035,.05,.12));hairlit=mat('Indigo hair accents',(.10,.15,.28));jacket=mat('Periwinkle technical jacket',(.28,.39,.72));trim=mat('Ivory piping',(.87,.87,.78));pants=mat('Ink trousers',(.035,.052,.085));white=mat('Eye whites',(.95,.95,.91));iris=mat('Amber iris',(.39,.17,.035));pupil=mat('Lash and pupil',(.012,.015,.026));blush=mat('Soft cheek',(.76,.30,.25));sole=mat('Shoe soles',(.69,.74,.78))
for m in [skin,hair,hairlit,jacket,pants,trim]:m.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.65
# Smooth custom tapered hair locks, with longitudinal curvature.
def lock(name,points,width,material):
    verts=[];faces=[];sides=8
    for i,p in enumerate(points):
        t=i/(len(points)-1);radius=width*(.35+.8*math.sin(math.pi*t))*(1-t*.95)
        for j in range(sides):
            a=j*2*math.pi/sides;verts.append((p[0]+math.cos(a)*radius,p[1]+math.sin(a)*radius*.48,p[2]))
    for i in range(len(points)-1):
        for j in range(sides):a=i*sides+j;b=i*sides+(j+1)%sides;faces.append((a,b,b+sides,a+sides))
    faces.extend([tuple(reversed(range(sides))),tuple((len(points)-1)*sides+j for j in range(sides))])
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);finish(o,name,material)
    sub=o.modifiers.new('Sculpted lock','SUBSURF');sub.levels=2
    return o
def stroke(name,points,r,material):
    curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.bevel_depth=r;curve.bevel_resolution=2
    spline=curve.splines.new('BEZIER');spline.bezier_points.add(len(points)-1)
    for b,p in zip(spline.bezier_points,points):b.co=p;b.handle_left_type='AUTO';b.handle_right_type='AUTO'
    o=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(o);o.data.materials.append(material)
    bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False)
# Three-and-a-half-head proportions, relaxed standing pose.
for x in [-.19,.19]:
    leg=box('Tapered jogger leg',(x,.015,.68),(.29,.30,.85),pants,.12)
    cyl('Ankle cuff',(x,.005,.29),.145,.13,pants)
    box('Sneaker sole',(x,-.09,.12),(.34,.56,.13),sole,.055)
    box('Ivory sneaker',(x,-.08,.21),(.32,.49,.20),trim,.09)
    for z in [.21,.26]:stroke('Shoe lacing',[(x-.08,-.27,z),(x,-.29,z+.015),(x+.08,-.27,z)],.013,white)
box('Jacket torso',(0,0,1.38),(.82,.44,.83),jacket,.20)
box('Jacket hem',(0,-.005,1.02),(.77,.44,.10),hairlit,.04)
cyl('Neck',(0,0,1.91),.13,.29,skin)
ring('Standing jacket collar',(0,0,1.81),.18,.055,hairlit,rot=(0,0,0))
# Arms at the side, one hand lifted slightly outward.
for sign in [-1,1]:
    upper=sphere('Jacket sleeve',(sign*.43,0,1.43),(.17,.20,.30),jacket);upper.rotation_euler[1]=sign*.23
    fore=sphere('Lower sleeve',(sign*.51,-.02,1.17),(.145,.17,.24),jacket);fore.rotation_euler[1]=-sign*.08
    cyl('Ribbed cuff',(sign*.53,-.02,.96),.145,.11,hairlit)
    sphere('Hand',(sign*.53,-.02,.81),(.12,.12,.16),skin)
    sphere('Thumb',(sign*.43,-.10,.83),(.052,.07,.09),skin)
stroke('Front zipper',[(0,-.237,1.06),(0,-.241,1.40),(0,-.22,1.78)],.011,trim)
box('Zipper pull',(.02,-.26,1.71),(.045,.025,.08),trim,.01)
for sign in [-1,1]:stroke('Pocket seam',[(sign*.13,-.239,1.15),(sign*.28,-.225,1.30)],.008,hairlit)
box('Chest patch',(-.23,-.235,1.55),(.16,.022,.12),trim,.025)
stroke('Patch spark',[(-.23,-.256,1.59),(-.23,-.256,1.51)],.008,jacket)
stroke('Patch spark',[(-.27,-.256,1.55),(-.19,-.256,1.55)],.008,jacket)
# Face and hair shell: large expressive eyes with upper lash contours.
sphere('Head',(0,0,2.38),(.46,.355,.53),skin)
for sign in [-1,1]:
    sphere('Ear',(sign*.44,.015,2.36),(.09,.09,.14),skin)
    sphere('Inner ear',(sign*.465,-.065,2.36),(.035,.024,.065),blush)
    x=sign*.19
    sphere('Eye almond',(x,-.322,2.40),(.135,.047,.105),white)
    sphere('Amber iris',(x,-.365,2.40),(.062,.014,.088),iris)
    sphere('Pupil',(x,-.38,2.405),(.030,.009,.064),pupil)
    sphere('Catchlight',(x-.021,-.391,2.44),(.021,.008,.025),white)
    sphere('Small catchlight',(x+.021,-.389,2.366),(.009,.006,.011),white)
    stroke('Upper eyelid',[(x-.126,-.344,2.414),(x-.065,-.369,2.491),(x+.049,-.367,2.501),(x+.126,-.338,2.447)],.018,pupil)
    stroke('Eyebrow',[(x-.095,-.303,2.575),(x,-.324,2.59),(x+.10,-.296,2.57)],.019,hair)
    sphere('Cheek tint',(sign*.29,-.285,2.24),(.070,.014,.025),blush)
sphere('Nose',(0,-.36,2.29),(.034,.045,.046),skin)
stroke('Quiet smile',[(-.065,-.326,2.17),(0,-.35,2.156),(.065,-.326,2.18)],.009,blush)
# Back volume stays behind the forehead; separate locks define the silhouette.
sphere('Back hair',(0,.105,2.52),(.49,.31,.48),hair)
sphere('Crown hair',(0,.015,2.77),(.465,.34,.24),hair)
for i in range(7):
    x=-.38+i*.12
    lock('Swept fringe '+str(i),[(x+.05,-.16,2.93),(x+.05,-.30,2.83),(x-.01,-.37,2.70),(x-.09,-.366,2.56+(i%3)*.025)],.12,hair if i%3 else hairlit)
for sign in [-1,1]:
    lock('Temple lock',[(sign*.36,-.11,2.78),(sign*.46,-.19,2.62),(sign*.455,-.17,2.40),(sign*.42,-.18,2.28)],.13,hair)
    lock('Crown sweep',[(sign*.12,.08,2.88),(sign*.24,.06,2.99),(sign*.35,.05,2.95)],.09,hair)
# Selected geometry only; studio lights and camera stay in the editable source.
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.context.scene.objects:
    if o.type=='MESH':
        o.select_set(True);o.asset_mark()
        dec=o.modifiers.new('Web geometry budget','DECIMATE');dec.ratio=.60
bpy.ops.export_scene.gltf(filepath=str(OUT/'kai.glb'),export_format='GLB',use_selection=True,export_apply=True)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=True
scene.render.resolution_x=768;scene.render.resolution_y=768;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.film_transparent=True;scene.world.color=(.16,.16,.16)
bpy.ops.object.camera_add(location=(.65,-7,3.25));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,1.57))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=3.7;scene.camera=cam
for loc,power,size in [((2,-4,6),450,4),((-3,-2,3),220,4),((1,3,5),500,3)]:
    bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.size=size;o.rotation_euler=(Vector((0,0,1.7))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'kai.blend'),compress=True)
scene.render.filepath=str(OUT/'kai-portrait.png');bpy.ops.render.render(write_still=True)
manifest=json.loads((OUT/'catalog.json').read_text());manifest=[c for c in manifest if c['id']!='kai']
manifest.insert(0,dict(id='kai',title='Kai',description='An original anime-style companion. One step, together.',model='/models/characters/kai.glb',thumbnail='/models/characters/kai-portrait.png'))
(OUT/'catalog.json').write_text(json.dumps(manifest,indent=2)+'\n')
