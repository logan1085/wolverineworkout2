"""Original NYC Marathon schematic diorama. Not geographic/elevation/navigation data.
Blender 4.5, no downloaded assets. Based on NYRR's 2026 borough/landmark sequence.
"""
import bpy, math, sys, json, random
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
root=Path(sys.argv[sys.argv.index('--')+1]);out=root/'public/models/nyc-course';out.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=32;s.cycles.use_denoising=True
s.render.resolution_x=1800;s.render.resolution_y=1400;s.render.resolution_percentage=100
s.render.image_settings.file_format='PNG';s.world.color=(.5,.5,.5);s.view_settings.view_transform='Standard'
def mat(n,c):
 m=bpy.data.materials.new(n);m.diffuse_color=(*c,1);m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*c,1);b.inputs['Roughness'].default_value=.8;return m
water=mat('Harbor blue',(.32,.48,.51));land=mat('Warm city limestone',(.73,.70,.59));road=mat('Course terracotta',(.60,.23,.10));park=mat('Central Park sage',(.32,.43,.27));building=mat('City ivory',(.84,.81,.70));bridge=mat('Bridge steel',(.28,.32,.29));white=mat('Warm white',(.98,.95,.85))
def box(n,p,scale,m,bevel=.08):
 bpy.ops.mesh.primitive_cube_add(size=1,location=p);o=bpy.context.object;o.name=n;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 if bevel:q=o.modifiers.new('Soft edges','BEVEL');q.width=bevel;q.segments=3;o.modifiers.new('Normals','WEIGHTED_NORMAL')
 return o
def polygon(n,pts,m):
 mesh=bpy.data.meshes.new(n);mesh.from_pydata([(x,y,.18) for x,y in pts],[],[tuple(range(len(pts)))]);mesh.update();o=bpy.data.objects.new(n,mesh);s.collection.objects.link(o);o.data.materials.append(m);q=o.modifiers.new('Raised borough','SOLIDIFY');q.thickness=.36;q=o.modifiers.new('Shoreline','BEVEL');q.width=.2;q.segments=3
box('Water plinth',(0,0,-.45),(19,26,.8),water,.5)
polygon('Staten Island',[(-8,-11),(-3,-11),(-2.7,-8),(-5,-6),(-8,-8)],land)
polygon('Brooklyn',[(-1.5,-8),(4,-7),(6,-3),(4,1),(2.5,2),(.2,0),(-2,-4)],land)
polygon('Queens',[(3,2),(5,0),(8,2),(8,8),(4,8),(2.8,5)],land)
polygon('Manhattan',[(-4,0),(-2,0),(.9,6),(.5,9),(-1,10),(-3,7),(-5,2)],land)
polygon('Bronx',[(-.6,10),(.5,8.6),(4,9),(7,12),(-1,12)],land)
box('Central Park',(-2,4.3,.25),(1.3,4.2,.12),park)
points=[(-4,-9,.5),(-1,-6.7,.8),(.3,-5,.48),(1,-2.7,.48),(1.3,-.4,.48),(2.6,1.2,.48),(3.6,2.9,.8),(4.1,3.7,.48),(.3,4.5,1.1),(.8,6,.48),(1.3,8.6,.9),(1.5,10,.48),(-.5,10,.85),(-1,8,.48),(-1.5,6,.48),(-1.6,4.7,.48),(-2.1,2,.48),(-3,1.6,.48),(-3,2.7,.48)]
def line(n,pts,r,m):
 c=bpy.data.curves.new(n,'CURVE');c.dimensions='3D';c.bevel_depth=r;c.bevel_resolution=4;sp=c.splines.new('POLY');sp.points.add(len(pts)-1)
 for p,co in zip(sp.points,pts):p.co=(*co,1)
 o=bpy.data.objects.new(n,c);s.collection.objects.link(o);o.data.materials.append(m)
line('26.2 mile schematic route',points,.14,road)
# Simple bridge decks and piers make crossings visible without pretending to model grades.
for a,b in [(0,1),(5,6),(7,8),(9,10),(11,12)]:
 p,q=Vector(points[a]),Vector(points[b]);mid=(p+q)/2;length=(q-p).length;o=box('Schematic bridge deck',tuple(mid-Vector((0,0,.15))),(length,.52,.18),bridge);o.rotation_euler.z=math.atan2(q.y-p.y,q.x-p.x)
 for t in [.25,.75]:
  v=p.lerp(q,t);box('Bridge tower',tuple(v+Vector((0,.27,.5))),(.12,.12,1.4),bridge,.02);box('Bridge tower',tuple(v+Vector((0,-.27,.5))),(.12,.12,1.4),bridge,.02)
random.seed(26)
for cx,cy in [(2,-5),(3,-3),(3,-1),(5,4),(6,6),(-3,6),(-2,8),(3,10)]:
 for k in range(7):
  x=cx+random.uniform(-.6,.6);y=cy+random.uniform(-.7,.7);h=random.uniform(.3,1.1);box('Abstract city block',(x,y,.25+h/2),(.25,.32,h),building,.03)
for x,y in [(-2.3,3),(-2.2,4),(-2.1,5),(-2,5.5)]:
 bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=.25,location=(x,y,.65));bpy.context.object.data.materials.append(park)
# Finish gantry.
for x in [-3.35,-2.65]:box('Finish post',(x,2.7,.8),(.1,.1,1),bridge,.02)
box('Finish arch',(-3,2.7,1.3),(.85,.12,.15),white,.02)
bpy.ops.object.light_add(type='AREA',location=(-5,-7,18));bpy.context.object.data.energy=2600;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=12
bpy.ops.object.camera_add(location=(17,-23,34));cam=bpy.context.object;cam.rotation_euler=(Vector((0,.4,0))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=31;s.camera=cam
s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs[0].default_value=(.82,.85,.82,1);s.world.node_tree.nodes['Background'].inputs[1].default_value=.7
markers=[('start',points[0]),('verrazzano',points[1]),('brooklyn',points[3]),('pulaski',points[6]),('queensboro',points[8]),('first-avenue',points[9]),('bronx',points[11]),('fifth-avenue',points[14]),('central-park',points[15]),('finish',points[18])]
bpy.context.view_layer.update();projected={}
for name,p in markers:
 v=world_to_camera_view(s,cam,Vector(p));projected[name]={'x':round(v.x*100,2),'y':round((1-v.y)*100,2)}
(out/'hotspots.json').write_text(json.dumps(projected,indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(root/'assets/blender/nyc-course/nyc-course-schematic.blend'))
s.render.filepath=str(out/'nyc-course-schematic.png');bpy.ops.render.render(write_still=True)
print('NYC_COURSE_RENDER_COMPLETE')
