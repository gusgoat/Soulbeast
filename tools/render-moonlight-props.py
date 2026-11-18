"""Blender-authored woodland props, rendered to transparent PNGs on D:."""
import bpy, math, random
from mathutils import Vector
from pathlib import Path

OUT = Path('D:/GameDev/soulbeast/tmp/party-encounter-production/assets/forest-walk/generated/moonlight')
OUT.mkdir(parents=True, exist_ok=True)
random.seed(43191)

def material(name, color, roughness=.85):
    mat=bpy.data.materials.new(name); mat.diffuse_color=(*color,1); mat.use_nodes=True
    bsdf=mat.node_tree.nodes.get('Principled BSDF'); bsdf.inputs['Base Color'].default_value=(*color,1);bsdf.inputs['Roughness'].default_value=roughness
    noise=mat.node_tree.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=12;noise.inputs['Detail'].default_value=3
    bump=mat.node_tree.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.24;bump.inputs['Distance'].default_value=.09
    mat.node_tree.links.new(noise.outputs['Fac'],bump.inputs['Height']);mat.node_tree.links.new(bump.outputs['Normal'],bsdf.inputs['Normal'])
    return mat

def branch(points, radius, mat):
    curve=bpy.data.curves.new('branch','CURVE');curve.dimensions='3D';curve.bevel_depth=radius;curve.bevel_resolution=2
    spline=curve.splines.new('POLY');spline.points.add(len(points)-1)
    for i,p in enumerate(points):spline.points[i].co=(*p,1);spline.points[i].radius=1-i/(len(points)-.35)
    obj=bpy.data.objects.new('wood',curve);bpy.context.collection.objects.link(obj);obj.data.materials.append(mat)

def leaves(centres, mats, birch=False):
    verts=[];faces=[];indices=[]
    for centre,spread in centres:
        for _ in range(190 if birch else 260):
            a=random.uniform(0,math.tau);r=spread*math.sqrt(random.random());z=centre[2]+random.uniform(-.6,.7)
            pos=Vector((centre[0]+math.cos(a)*r,centre[1]+math.sin(a)*r,z))
            length=random.uniform(.12,.24) if birch else random.uniform(.16,.3)
            axis=Vector((random.uniform(-1,1),random.uniform(-1,1),random.uniform(-.2,.45))).normalized()*length
            side=axis.cross(Vector((0,0,1))).normalized()*length*.45
            n=len(verts);verts.extend([pos-axis,pos+side,pos+axis,pos-side,pos+Vector((0,0,length*.04))])
            faces.extend([(n,n+1,n+4),(n+1,n+2,n+4),(n+2,n+3,n+4),(n+3,n,n+4)]);indices.extend([random.randrange(len(mats))]*4)
    mesh=bpy.data.meshes.new('individual-leaves');mesh.from_pydata(verts,[],faces);mesh.update()
    obj=bpy.data.objects.new('silver-green-foliage',mesh);bpy.context.collection.objects.link(obj)
    for m in mats:obj.data.materials.append(m)
    for p,i in zip(mesh.polygons,indices):p.material_index=i;p.use_smooth=True

def scene():
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=20;s.cycles.use_denoising=True
    s.render.resolution_x=640;s.render.resolution_y=800;s.render.resolution_percentage=100;s.render.film_transparent=True
    s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.view_settings.view_transform='AgX';s.view_settings.exposure=.6
    s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs[0].default_value=(.32,.43,.57,1);s.world.node_tree.nodes['Background'].inputs[1].default_value=.3
    for loc,energy,color,size in [((-5,-8,13),1100,(.72,.84,1),7),((7,3,8),700,(.55,.7,.85),6)]:
        bpy.ops.object.light_add(type='AREA',location=loc);l=bpy.context.object;l.data.energy=energy;l.data.color=color;l.data.shape='DISK';l.data.size=size;l.rotation_euler=(Vector((0,0,4))-l.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.object.camera_add(location=(6,-16,18));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,4))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=11.2;s.camera=cam
    return s

for kind in ['oak','birch','rock','post']:
    s=scene();wood=material('weathered-bark',(.16,.135,.105) if kind!='birch' else (.55,.58,.54));green=[material('leaf-'+str(i),c) for i,c in enumerate([(.07,.22,.09),(.14,.3,.13),(.2,.36,.17),(.1,.26,.17)])]
    if kind in ['oak','birch']:
        birch=kind=='birch';height=8.4 if birch else 7.5
        branch([(0,0,0),(.15,-.1,2.6),(-.12,.1,5.1),(.28,.1,height)],.15 if birch else .36,wood)
        centres=[]
        for i in range(17 if birch else 23):
            a=i*2.3999;z=3+i/(17 if birch else 23)*(height-3);radius=(1-(z-3)/(height-2))*1.9+.45 if birch else 2*math.sin((z-2.3)/(height-1)*math.pi)+.7
            end=(math.cos(a)*radius,math.sin(a)*radius,z+.75)
            branch([(0,0,z-.5),(end[0]*.5,end[1]*.5,z+.1),end],.055 if birch else .11,wood);centres.append((end,.55 if birch else .85))
        for i in range(7):
            a=i*math.tau/7;branch([(0,0,.6),(math.cos(a)*.7,math.sin(a)*.7,.16),(math.cos(a)*1.1,math.sin(a)*1.1,.03)],.11,wood)
        leaves(centres,green,birch)
    elif kind=='rock':
        stone=material('rough-blue-grey-stone',(.28,.33,.35))
        for loc,scale in [((0,0,.7),(1.3,.9,.9)),((-1,.3,.4),(.8,.6,.55)),((1.2,-.3,.3),(.6,.7,.4))]:
            bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=1,location=loc);o=bpy.context.object;o.scale=scale;o.data.materials.append(stone)
        s.camera.location=(4,-9,8);s.camera.rotation_euler=(Vector((0,0,.6))-s.camera.location).to_track_quat('-Z','Y').to_euler();s.camera.data.ortho_scale=4.6
    else:
        branch([(0,0,0),(.02,0,2.8)],.16,wood)
        bpy.ops.mesh.primitive_cube_add(size=1,location=(.35,0,2.4));o=bpy.context.object;o.scale=(1.5,.15,.25);o.rotation_euler[1]=-.05;o.data.materials.append(wood)
        bevel=o.modifiers.new('worn corners','BEVEL');bevel.width=.06;bevel.segments=3
        s.camera.location=(4,-9,8);s.camera.rotation_euler=(Vector((0,0,1.4))-s.camera.location).to_track_quat('-Z','Y').to_euler();s.camera.data.ortho_scale=4.1
    s.render.filepath=str(OUT/('blender-'+kind+'.png'))
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/('blender-'+kind+'.blend')))
    bpy.ops.render.render(write_still=True)
    print('MOONLIGHT_RENDERED',kind,flush=True)
