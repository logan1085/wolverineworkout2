"""Blender 4.5: original stadium, Cycles baked atlas, GLB and editable source.
Run: blender -b --python scripts/blender/build_training_ground.py -- /absolute/repo
No external models, textures or network requests.
"""
import bpy, math, sys, json, hashlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(sys.argv[sys.argv.index('--')+1]).resolve()
OUT=ROOT/'public/models/training'; SOURCE=ROOT/'assets/blender/training'
OUT.mkdir(parents=True,exist_ok=True);SOURCE.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=True
scene.world.color=(.25,.25,.25)
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.67,.73,.64,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.65
scene.view_settings.view_transform='Standard'
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
scene.render.film_transparent=True
meshes=[]
def material(name,color):
 m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=(*color,1)
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Roughness'].default_value=.85
 return m
clay=material('Burnt clay track',(.39,.115,.065));lane=material('Warm lane paint',(.88,.75,.51))
forest=material('Club forest enamel',(.065,.15,.095));sage=material('Sage seats',(.22,.34,.22))
cream=material('Warm concrete',(.59,.55,.43));stone=material('Concourse limestone',(.74,.69,.56))
grass=material('Turf light',(.28,.40,.20));grassdark=material('Turf dark',(.23,.35,.17))
wood=material('Warm timber',(.28,.16,.075));leaf=material('Tree canopy',(.20,.34,.19));leaf2=material('Tree canopy sun',(.32,.43,.22))
white=material('Ivory details',(.93,.86,.68));black=material('Finish dark',(.055,.095,.062))
def finish(obj,name,mat):
 obj.name=name;obj.data.materials.append(mat);meshes.append(obj);return obj

def cube(name,loc,size,mat,bevel=.04):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.scale=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);finish(o,name,mat)
 if bevel:
  mod=o.modifiers.new('Crafted edge radius','BEVEL');mod.width=bevel;mod.segments=2
  bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
 return o

def cylinder(name,loc,r,depth,mat,vertices=16):
 bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=depth,location=loc);return finish(bpy.context.object,name,mat)

def outline(radius):
 # Clockwise capsule perimeter: two semicircles joined by real straights.
 points=[]
 for side,center in [(1,6),(-1,-6)]:
  for i in range(49):
   a=(-math.pi/2+i*math.pi/48) if side==1 else (math.pi/2+i*math.pi/48)
   points.append((center+radius*math.cos(a),radius*math.sin(a)))
 return points

def capsule(name,r,z,mat):
 pts=outline(r);verts=[(x,y,z) for x,y in pts];faces=[tuple(range(len(pts)))];data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update();o=bpy.data.objects.new(name,data);scene.collection.objects.link(o);return finish(o,name,mat)
def ring(name,r,width,z,mat):
 a,b=outline(r),outline(r-width);n=len(a);verts=[(x,y,z) for x,y in a+b];faces=[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
 data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update();o=bpy.data.objects.new(name,data);scene.collection.objects.link(o);return finish(o,name,mat)

cube('Sculpted forest foundation',(0,0,-.55),(39,31,1),forest,.45)
cube('Limestone promenade',(0,0,-.04),(38.6,30.6,.2),stone,.4)
capsule('Six-lane clay oval',10,.08,clay)
for i in range(7):ring('Lane marking %02d'%i,9.8-i*.63,.035,.095,lane)
capsule('Turf infield',5.9,.11,grass)
# Alternating broad stripes, clipped inside the central straight portion.
for i in range(6):cube('Mown turf stripe %02d'%i,(-5+i*2,0,.12),(1.96,10.9,.012),grassdark if i%2 else grass,0)
ring('Inner curb',6.05,.11,.14,white)
# Finish line across the south straight; 2-tone tiles are authored in Blender.
for row in range(6):
 for col in range(4):cube('Finish checker',(-4.8+col*.22,-6.4-row*.56,.115),(.22,.56,.018),white if (row+col)%2 else black,0)
# Starting gate uses the same position as live race countdown overlay (Three z=-7.8).
for x in [-3.2,3.2]:cube('Finish gate post',(x,7.8,1.85),(.19,.23,3.5),forest,.05)
cube('Finish gate header',(0,7.8,3.6),(6.8,.35,.5),forest,.07)
# Terrace seating, segmented by real aisles; rear canopy and columns.
for side in [-1,1]:
 for row in range(3):
  y=side*(11.35+row*.9);height=.4+row*.48
  cube('Concrete terrace',(0,y,height/2),(24,height,.88),cream,.05)
  for block in range(4):
   for seat in range(5):
    x=-11.4+block*6+seat*.95
    cube('Seat cushion',(x,y,height+.15),(.67,.53,.18),sage,.06)
    cube('Seat back',(x,y+side*.22,height+.43),(.67,.13,.52),forest,.07)
 for x in [-12.8,12.8]:
  for step in range(4):cube('Public stair',(x,side*(10.8+step*.68),.1+step*.19),(1.05,.7,.2+step*.38),stone,.04)
for x in [-11,-5.5,0,5.5,11]:cube('Canopy timber column',(x,14,2.45),(.19,.19,4.8),wood,.03)
roof=cube('Floating grandstand roof',(0,13.2,4.85),(25,3.2,.22),forest,.09);roof.rotation_euler.x=.065
for x in [-10,-5,0,5,10]:cube('Roof underside ribs',(x,13.2,4.64),(.12,3.05,.18),wood,.025)
# Four slim floodlight towers and bulbs; lighting itself is baked.
for x in [-16.8,16.8]:
 for y in [-10,10]:
  cylinder('Floodlight tower',(x,y,2.65),.095,5.3,forest)
  cube('Light housing',(x,y,5.3),(1.6,.35,.42),forest,.07)
  for lamp in [-.5,0,.5]:cube('Light diffuser',(x+lamp,y-.2,5.3),(.35,.025,.24),white,.02)
# Trees and rest benches outside the running surface.
for i,(x,y) in enumerate([(-17,-6),(-17,0),(-17,6),(17,-6),(17,0),(17,6)]):
 cylinder('Tree trunk',(x,y,1),.13,1.8,wood)
 for dx,dy,dz,scale in [(0,0,2,1.1),(.45,.1,2.45,.75),(-.4,-.15,2.5,.8)]:
  bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=scale,location=(x+dx,y+dy,dz));o=finish(bpy.context.object,'Sculpted tree crown',leaf if i%2 else leaf2)
  for face in o.data.polygons:face.use_smooth=True
for x in [-9,9]:
 cube('Recovery bench',(x,-14,.6),(2.3,.65,.18),wood,.07)
 for dx in [-.8,.8]:cube('Bench foot',(x+dx,-14,.3),(.13,.55,.6),forest,.02)
# Modelled club lettering, not an image overlay.
bpy.ops.object.text_add(location=(0,-14.3,.09));text=bpy.context.object;text.name='Club engraving';text.data.body='W O L V E R I N E   /   R U N N I N G   C L U B';text.data.align_x='CENTER';text.data.size=.38;text.data.extrude=.008;text.data.materials.append(forest);bpy.ops.object.convert(target='MESH');meshes.append(bpy.context.object)
# Broad sun + sky bake produces contact and canopy shadows without runtime shadow maps.
bpy.ops.object.light_add(type='AREA',location=(-12,-15,28));sun=bpy.context.object;sun.name='Soft afternoon key';sun.data.energy=9000;sun.data.shape='DISK';sun.data.size=9;sun.rotation_euler=(Vector((0,0,0))-sun.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(31,-39,34));camera=bpy.context.object;camera.name='Editorial overview';camera.data.type='ORTHO';camera.data.ortho_scale=49;camera.rotation_euler=(Vector((0,0,0))-camera.location).to_track_quat('-Z','Y').to_euler();scene.camera=camera
scene.render.resolution_x=1400;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'training-ground-v1.blend'),compress=True)
# Export copy: one static draw mesh with one packed lighting/material atlas.
bpy.ops.object.select_all(action='DESELECT')
for o in meshes:o.select_set(True)
bpy.context.view_layer.objects.active=meshes[0];bpy.ops.object.join();stadium=bpy.context.object;stadium.name='Blender_Baked_Training_Ground'
bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.004);bpy.ops.object.mode_set(mode='OBJECT')
reuse='--reuse-bake' in sys.argv
atlas=bpy.data.images.load(str(SOURCE/'training-ground-baked-v1.png')) if reuse else bpy.data.images.new('Stadium baked light and materials',width=2048,height=2048,alpha=False)
for m in stadium.data.materials:
 if m:
  node=m.node_tree.nodes.new('ShaderNodeTexImage');node.image=atlas;m.node_tree.nodes.active=node
scene.render.bake.use_clear=True;scene.render.bake.margin=8
scene.render.bake.use_pass_direct=True;scene.render.bake.use_pass_indirect=True
scene.render.bake.use_pass_diffuse=True;scene.render.bake.use_pass_glossy=False;scene.render.bake.use_pass_transmission=False
if not reuse:
 print('BAKING_ATLAS',flush=True);bpy.ops.object.bake(type='COMBINED')
atlas.filepath_raw=str(SOURCE/'training-ground-baked-v1.png');atlas.file_format='PNG';atlas.save();atlas.pack()
baked=bpy.data.materials.new('Baked stadium — unlit');baked.use_nodes=True;nodes=baked.node_tree.nodes;nodes.clear();out=nodes.new('ShaderNodeOutputMaterial');em=nodes.new('ShaderNodeEmission');tex=nodes.new('ShaderNodeTexImage');tex.image=atlas;baked.node_tree.links.new(tex.outputs['Color'],out.inputs['Surface'])
stadium.data.materials.clear();stadium.data.materials.append(baked)
for face in stadium.data.polygons:face.material_index=0
bpy.ops.object.select_all(action='DESELECT');stadium.select_set(True);bpy.context.view_layer.objects.active=stadium
bpy.ops.export_scene.gltf(filepath=str(OUT/'training-ground-v1.glb'),export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_extras=True,export_normals=False,export_image_format='JPEG',export_jpeg_quality=85)
scene.render.filepath=str(OUT/'training-ground-poster-v1.png');scene.render.engine='CYCLES';scene.cycles.samples=16;bpy.ops.render.render(write_still=True)
stadium.data.calc_loop_triangles();glb=OUT/'training-ground-v1.glb'
manifest={'authoring':'Blender','blenderVersion':bpy.app.version_string,'source':'assets/blender/training/training-ground-v1.blend','model':'/models/training/training-ground-v1.glb','poster':'/models/training/training-ground-poster-v1.png','lighting':'Cycles combined bake, 2048x2048 atlas, KHR_materials_unlit','triangles':len(stadium.data.loop_triangles),'bytes':glb.stat().st_size,'sha256':hashlib.sha256(glb.read_bytes()).hexdigest(),'runtimeDrawMeshes':1,'externalAssets':False}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps(manifest),flush=True)
