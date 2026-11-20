"""Render the existing bridge model at the regional river-crossing orientations.
Run Blender with the original soulbeast-country-bridges.blend, then this script.
The original .blend is read only; deck and near rail remain separate overlays.
"""
import bpy,json,math,sys
from pathlib import Path
from mathutils import Matrix
root=Path(__file__).resolve().parent.parent
layouts=json.loads((root/'content/country-region-bridge-layouts.json').read_text(encoding='utf-8'))
out=root/'assets/country-walk/region-bridges-v5'
out.mkdir(parents=True,exist_ok=True)
wanted=set(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else ['blue','green','red'])
templates={}
angles={'blue':-42.48807247032719,'green':-15.957760117285233,'red':-68.17601445606212}
for country in wanted:
 scene=bpy.data.scenes[country+'-bridge-0']
 bpy.context.window.scene=scene
 meshes=[o for o in scene.objects if o.type=='MESH']
 templates[country]=(scene,meshes,{o.name:o.matrix_world.copy() for o in meshes},next(c for c in scene.collection.children if 'deck and far rail' in c.name),next(c for c in scene.collection.children if 'near rail' in c.name))
 scene.render.resolution_x=520
 scene.render.resolution_y=460
 scene.render.resolution_percentage=100
 scene.render.film_transparent=True
 scene.render.image_settings.file_format='PNG'
 scene.render.image_settings.color_mode='RGBA'
 scene.cycles.samples=8
 scene.cycles.device='CPU'
for layout in layouts:
 if layout['country'] not in wanted:continue
 scene,meshes,original,deck,rail=templates[layout['country']]
 bpy.context.window.scene=scene
 old_angle=math.radians(angles[layout['country']])
 delta=layout['angle']-old_angle
 c,s=math.cos(delta),math.sin(delta)
 # Work in projected ground units and keep every vertical post upright.
 transform=Matrix(((c,s*.64,0,0),(-s/.64,c,0,0),(0,0,1,0),(0,0,0,1)))
 for o in meshes:o.matrix_world=transform@original[o.name]
 for part in ('deck','rail'):
  deck.hide_render=part!='deck'
  rail.hide_render=part!='rail'
  bpy.context.view_layer.update()
  scene.render.filepath=str(out/(layout['country']+'-'+layout['artId']+'-'+part+'.png'))
  bpy.ops.render.render(write_still=True,scene=scene.name)
  print('REGION_BRIDGE_RENDERED',layout['country'],layout['region'],part,round(math.degrees(layout['angle']),3),flush=True)
