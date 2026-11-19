"""Author and render two mountain pines in Blender. All output stays on D:."""
import bpy, math, random, json
from pathlib import Path
from mathutils import Vector

OUT=Path('D:/GameDev/soulbeast/tmp/party-encounter-production/assets/forest-walk/generated/dragon-trees')
OUT.mkdir(parents=True,exist_ok=True)

def material(name,color):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    nodes=m.node_tree.nodes;bsdf=nodes.get('Principled BSDF');bsdf.inputs['Base Color'].default_value=(*color,1);bsdf.inputs['Roughness'].default_value=.86
    noise=nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=18;noise.inputs['Detail'].default_value=4
    bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.32;bump.inputs['Distance'].default_value=.06
    m.node_tree.links.new(noise.outputs['Fac'],bump.inputs['Height']);m.node_tree.links.new(bump.outputs['Normal'],bsdf.inputs['Normal'])
    return m

def branch(points,radius,mat,name):
    curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.bevel_depth=radius;curve.bevel_resolution=2
    poly=curve.splines.new('POLY');poly.points.add(len(points)-1)
    for i,p in enumerate(points):poly.points[i].co=(*p,1);poly.points[i].radius=max(.025,1-i/(len(points)-.15))
    o=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(o);o.data.materials.append(mat)

def pine(windy):
    random.seed(201911+int(windy));lean=1.65 if windy else .08;h=8.5
    bark=material('rough mountain pine bark',(.19,.145,.105))
    mats=[material('pine needles '+str(i),c)for i,c in enumerate([(.045,.12,.075),(.075,.19,.115),(.13,.25,.16),(.19,.31,.21)])]
    centre=lambda z:Vector((lean*(z/h)**1.6,.12*math.sin(z*.6),z))
    branch([centre(z)for z in [0,1,2.5,4,5.5,7,8.5]],.24,bark,'tapered weathered trunk')
    verts=[];faces=[];colors=[]
    def spray(c,axis,spread):
        axis=Vector(axis).normalized();side=axis.cross(Vector((0,0,1))).normalized()
        for _ in range(90):
            a=random.uniform(0,math.tau);r=spread*math.sqrt(random.random())
            p=c+side*(math.cos(a)*r)+axis*random.uniform(-spread,spread)+Vector((0,0,math.sin(a)*r*.55))
            direction=(axis*.4+side*random.uniform(-1,1)+Vector((0,0,random.uniform(-.25,.7)))).normalized()
            length=random.uniform(.15,.29);cross=direction.cross(Vector((0,0,1))).normalized()*random.uniform(.012,.022)
            n=len(verts);verts.extend([p,p+direction*length+cross,p+direction*(length*1.28),p+direction*length-cross])
            faces.extend([(n,n+1,n+2),(n,n+2,n+3)]);colors.extend([random.randrange(len(mats))]*2)
    for tier in range(10):
        z=2.3+tier*.6;radius=(1-(z-2.3)/6.6)**.9*1.8+.12
        count=5 if tier<7 else 4
        for j in range(count):
            a=j*math.tau/count+tier*1.37+random.uniform(-.16,.16)
            direction=Vector((math.cos(a),math.sin(a),0));reach=radius*random.uniform(.8,1.13)
            start=centre(z);end=start+direction*reach+Vector((.28 if windy else 0,0,-.12+random.uniform(-.12,.18)))
            mid=start.lerp(end,.55)+Vector((0,0,-.18))
            branch([start,mid,end],.068*(1-tier/18),bark,'pine bough')
            for t in [.35,.57,.78,1]:
                at=start.lerp(end,t)
                for sign in [-1,1]:
                    turn=a+sign*.7;twig=Vector((math.cos(turn),math.sin(turn),.18))
                    tip=at+twig*(.36+.22*(1-t))*random.uniform(.8,1.1)
                    branch([at,at.lerp(tip,.6),tip],.018,bark,'needle twig')
                    spray(tip,twig,.19 if tier<7 else .14)
    for z in [8.1,8.35,8.5]:spray(centre(z),(0,.3,1),.22)
    mesh=bpy.data.meshes.new('individual paired pine needles');mesh.from_pydata(verts,[],faces);mesh.update()
    o=bpy.data.objects.new('dense natural needle sprays',mesh);bpy.context.collection.objects.link(o)
    for m in mats:o.data.materials.append(m)
    for p,i in zip(mesh.polygons,colors):p.material_index=i;p.use_smooth=True
    for i in range(7):
        a=i*math.tau/7;branch([(0,0,.5),(.45*math.cos(a),.45*math.sin(a),.12),(.8*math.cos(a),.8*math.sin(a),.03)],.09,bark,'exposed root')

def scene(windy):
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=32;s.cycles.use_denoising=True
    s.render.resolution_x=640;s.render.resolution_y=800;s.render.resolution_percentage=100;s.render.film_transparent=True
    s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.view_settings.view_transform='AgX';s.view_settings.exposure=.65
    s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs[0].default_value=(.4,.46,.53,1);s.world.node_tree.nodes['Background'].inputs[1].default_value=.4
    for loc,power,color in [((-5,-8,13),1300,(.92,.95,1)),((7,3,9),850,(.68,.78,.88))]:
        bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.color=color;o.data.shape='DISK';o.data.size=7;o.rotation_euler=(Vector((0,0,4))-o.location).to_track_quat('-Z','Y').to_euler()
    target=Vector((.4 if windy else 0,0,4.2));bpy.ops.object.camera_add(location=(6,-16,18));c=bpy.context.object;c.rotation_euler=(target-c.location).to_track_quat('-Z','Y').to_euler();c.data.type='ORTHO';c.data.ortho_scale=10.7;s.camera=c
    return s

frames={}
for kind in ['pine-upright','pine-windswept']:
    windy=kind.endswith('windswept');s=scene(windy);pine(windy)
    s.render.filepath=str(OUT/(kind+'.png'));bpy.ops.wm.save_as_mainfile(filepath=str(OUT/(kind+'.blend')));bpy.ops.render.render(write_still=True)
    print('DRAGON_TREE_RENDERED',kind,flush=True)

    im=bpy.data.images.load(s.render.filepath,check_existing=False);w,h=im.size
    pixels=list(im.pixels);visible=[i for i in range(w*h) if pixels[i*4+3]>8/255]
    x=min(i%w for i in visible);r=max(i%w for i in visible)+1
    y=h-1-max(i//w for i in visible);b=h-min(i//w for i in visible)
    assert x>3 and y>3 and r<w-3 and b<h-3,'Tree clipped by render frame'
    frames[kind]=[[x-3,y-3,r-x+6,b-y+6]];bpy.data.images.remove(im)
(OUT.parent.parent/'dragon-tree-frames.js').write_text('export const DRAGON_TREE_FRAMES = '+json.dumps(frames,indent=2)+';\n',encoding='utf-8')
