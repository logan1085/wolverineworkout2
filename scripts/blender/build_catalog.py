"""Run: Blender --background --python scripts/blender/build_catalog.py -- /absolute/repo
Original Wolverine assets; centimeters are not implied. One Blender unit = one meter in GLB.
"""
import bpy, math, sys, json
from pathlib import Path
from mathutils import Vector
ROOT=Path(sys.argv[sys.argv.index('--')+1]); OUT=ROOT/'public/models/wolverine'; SOURCE=ROOT/'assets/blender'
OUT.mkdir(parents=True,exist_ok=True); SOURCE.mkdir(parents=True,exist_ok=True)
def mat(name,color,metal=0):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF'); bs.inputs['Base Color'].default_value=(*color,1); bs.inputs['Roughness'].default_value=.32; bs.inputs['Metallic'].default_value=metal; return m
def finish(o,name,material):
    o.name=name; o.data.materials.append(material)
    for p in o.data.polygons:p.use_smooth=True
    return o
def sphere(name,loc,scale,m):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=16,location=loc); o=bpy.context.object;o.scale=scale;return finish(o,name,m)
def cyl(name,loc,r,depth,m,rot=(0,0,0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=r,depth=depth,location=loc,rotation=rot);o=finish(bpy.context.object,name,m)
    b=o.modifiers.new('Soft manufactured edges','BEVEL');b.width=.04;b.segments=3;return o
def box(name,loc,scale,m,bevel=.1):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);finish(o,name,m)
    b=o.modifiers.new('Rounded edges','BEVEL');b.width=bevel;b.segments=5;return o
def ring(name,loc,major,minor,m,rot=(math.pi/2,0,0)):
    bpy.ops.mesh.primitive_torus_add(major_segments=48,minor_segments=12,major_radius=major,minor_radius=minor,location=loc,rotation=rot);return finish(bpy.context.object,name,m)
items=[('kettlebell','Lime kettlebell','Movement','A rounded cast-weight silhouette with a satin handle.'),('dumbbell','Everyday dumbbell','Movement','Soft-edged plates and a brushed metal grip.'),('bottle','Hydration bottle','Daily rituals','A warm coral bottle with a contrasting loop cap.'),('yoga-mat','Morning mat','Recovery','A forest-green mat with a rolled edge and carry strap.'),('balance-stones','Balance stones','Recovery','Three smooth river stones on a quiet plinth.'),('moon','Moonlight','Rest','A sculptural crescent on a small bedside pedestal.')]
manifest=[]
for slug,title,category,description in items:
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    lime=mat('Wolverine lime',(.63,.78,.31)); forest=mat('Forest',(.075,.20,.14)); coral=mat('Terracotta',(.72,.30,.19)); cream=mat('Warm porcelain',(.85,.80,.65)); metal=mat('Brushed steel',(.43,.5,.46),.7)
    if slug=='kettlebell':
        sphere('Cast body',(0,0,.65),(.67,.5,.65),lime);cyl('Flat foot',(0,0,.11),.4,.16,forest);ring('Grip',(0,0,1.36),.39,.105,forest)
    elif slug=='dumbbell':
        cyl('Grip',(0,0,.55),.13,1.65,metal,(0,math.pi/2,0))
        for x in [-.82,.82]:
            cyl('Weight plate',(x,0,.55),.51,.35,forest,(0,math.pi/2,0));cyl('Lime endcap',(x*1.22,0,.55),.3,.07,lime,(0,math.pi/2,0))
    elif slug=='bottle':
        cyl('Bottle',(0,0,.72),.34,1.35,coral);sphere('Shoulder',(0,0,1.32),(.34,.34,.23),coral);cyl('Cap',(0,0,1.58),.23,.25,forest);ring('Carry loop',(0,0,1.83),.18,.045,forest);cyl('Foot',(0,0,.09),.345,.13,cream)
    elif slug=='yoga-mat':
        box('Mat',(0,0,.07),(1.25,2.1,.1),forest,.05);cyl('Rolled edge',(0,.8,.29),.25,1.25,lime,(0,math.pi/2,0));ring('Roll detail',(.63,.8,.29),.17,.022,forest,(0,math.pi/2,0));box('Strap',(0,.8,.3),(.12,.52,.53),coral,.06)
    elif slug=='balance-stones':
        cyl('Plinth',(0,0,.08),.78,.16,forest);sphere('Foundation',(0,0,.32),(.64,.45,.24),cream);sphere('Middle',(.03,0,.68),(.48,.37,.21),coral);sphere('Top',(-.04,0,1),(.29,.26,.18),lime)
    else:
        cyl('Pedestal',(0,0,.1),.52,.2,forest);cyl('Stem',(0,0,.43),.045,.6,metal)
        # Closed crescent polygon extruded, rather than overlapping spheres.
        points=[]
        for i in range(49):
            a=math.radians(55+(250/48)*i);points.append((.64*math.cos(a),.64*math.sin(a)))
        for i in range(1,49):
            t=i/48;points.append((.64*math.cos(math.radians(305))-.43*math.sin(math.pi*t),-.64*math.sin(math.radians(55))+2*.64*math.sin(math.radians(55))*t))
        curve=bpy.data.curves.new('Crescent profile','CURVE');curve.dimensions='2D';curve.resolution_u=2;curve.extrude=.09;curve.bevel_depth=.035;curve.bevel_resolution=3
        spl=curve.splines.new('POLY');spl.points.add(len(points)-1)
        for p,(x,y) in zip(spl.points,points):p.co=(x,y,0,1)
        spl.use_cyclic_u=True;o=bpy.data.objects.new('Moon crescent',curve);bpy.context.collection.objects.link(o);o.rotation_euler=(math.pi/2,0,0);o.location=(0,0,1.1);o.data.materials.append(cream);bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH')
    # Export only asset geometry, with applied modifiers.
    bpy.ops.object.select_all(action='DESELECT')
    for o in bpy.context.scene.objects:
        if o.type=='MESH':o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(OUT/(slug+'.glb')),export_format='GLB',use_selection=True,export_apply=True)
    for o in bpy.context.selected_objects:o.asset_mark()
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24
    scene.render.resolution_x=400;scene.render.resolution_y=400;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG';scene.render.film_transparent=True
    scene.world.color=(.3,.3,.3)
    bpy.ops.object.camera_add(location=(3,-4,2.7));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,.8))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=3.1;scene.camera=cam
    for loc,power,size in [((2,-3,5),450,4),((-3,-1,2),280,3),((0,3,4),400,3)]:
        bpy.ops.object.light_add(type='AREA',location=loc);light=bpy.context.object;light.data.energy=power;light.data.shape='DISK';light.data.size=size;light.rotation_euler=(Vector((0,0,.8))-light.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/(slug+'.blend')),compress=True)
    scene.render.filepath=str(OUT/(slug+'.png'));bpy.ops.render.render(write_still=True)
    manifest.append(dict(id=slug,title=title,category=category,description=description,model='/models/wolverine/'+slug+'.glb',thumbnail='/models/wolverine/'+slug+'.png',bytes=(OUT/(slug+'.glb')).stat().st_size))
(OUT/'catalog.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('WOLVERINE_CATALOG_COMPLETE',len(manifest))
