# Estudio de pintor para maxlangevin.com — Blender 4.2, sin interfaz.
# Uso: blender -b --python build_studio.py -- <carpeta_recursos> <salida.glb> [render.png] [pintura.jpg]
# Unidades en metros. El frente del caballete mira hacia -Y. El material "Painting" se reemplaza en la web.
import bpy, bmesh, math, random, sys, os
from mathutils import Vector, Matrix

args = sys.argv[sys.argv.index('--') + 1:]
RES, OUT = args[0], args[1]
RENDER = args[2] if len(args) > 2 else None
PAINT_IMG = args[3] if len(args) > 3 else None
rnd = random.Random(7)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
col = bpy.data.collections.new('Estudio'); scene.collection.children.link(col)

# ── materiales ──
def img(path):
    i = bpy.data.images.load(path); return i
def mat_pbr(name, color=(1, 1, 1, 1), rough=.5, metal=0., tex=None, nor=None, uvscale=1.):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = color; b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if tex:
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = img(tex); nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
    if nor:
        n = nt.nodes.new('ShaderNodeTexImage'); n.image = img(nor); n.image.colorspace_settings.name = 'Non-Color'
        nm = nt.nodes.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = .6
        nt.links.new(n.outputs['Color'], nm.inputs['Color']); nt.links.new(nm.outputs['Normal'], b.inputs['Normal'])
    return m

T = os.path.join(RES, 'tex')
WOOD = mat_pbr('Wood', rough=.55, tex=os.path.join(T, 'wood_beech.jpg'), nor=os.path.join(T, 'wood_nor.jpg'))
LINEN = mat_pbr('Linen', rough=.95, tex=os.path.join(T, 'linen.jpg'))
LINEN_RAW = mat_pbr('LinenRaw', color=(.78, .7, .55, 1), rough=1., tex=os.path.join(T, 'linen.jpg'))
LINEN_RAW.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (.78, .7, .55, 1)
# sin pintura, una imagen mínima de relleno: así el GLB conserva las coordenadas UV del frente y la web pone la obra
PAINT = mat_pbr('Painting', color=(.92, .9, .86, 1), rough=.42, tex=PAINT_IMG or os.path.join(RES, 'tex', 'gesso.jpg'))
METAL = mat_pbr('Metal', color=(.78, .78, .8, 1), rough=.28, metal=1.)
CERAMIC = mat_pbr('Ceramic', color=(.86, .83, .77, 1), rough=.3)
def lacquer(n, c): return mat_pbr(n, color=c, rough=.28)
HANDLES = [lacquer('HandleBlack', (.02, .02, .02, 1)), lacquer('HandleRed', (.42, .06, .04, 1)), lacquer('HandleNatural', (.62, .44, .24, 1)), lacquer('HandleGreen', (.05, .16, .1, 1))]
HOG = mat_pbr('Hog', color=(.78, .68, .5, 1), rough=.85)
SABLE = mat_pbr('Sable', color=(.18, .1, .05, 1), rough=.7)
# óleo fresco: brillante. Colores de la paleta habitual de un retratista (y de los cuadros de Max)
OILS = {'Blanco titanio': (.92, .9, .86), 'Rojo cadmio': (.62, .07, .03), 'Ocre amarillo': (.55, .32, .07), 'Azul ultramar': (.04, .06, .34),
        'Tierra sombra tostada': (.09, .045, .02), 'Tierra verde': (.13, .17, .11), 'Carmín': (.28, .02, .03), 'Siena tostada': (.36, .12, .04)}
OILM = {k: mat_pbr('Oil ' + k, color=(*v, 1), rough=.18) for k, v in OILS.items()}

def link(o): col.objects.link(o); return o

# Caja con UV a lo largo del eje largo (la veta sigue la pieza), bisel opcional
def box(name, size, loc, rot=(0, 0, 0), mat=WOOD, bevel=.003, uv_m=.5):
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.)
    for v in bm.verts: v.co = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2]))
    uv = bm.loops.layers.uv.new('UVMap')
    long_ax = max(range(3), key=lambda i: size[i])
    for f in bm.faces:
        n = max(range(3), key=lambda i: abs(f.normal[i]))
        axes = [i for i in range(3) if i != n]
        va = long_ax if long_ax in axes else axes[1]; ua = [a for a in axes if a != va][0]
        for l in f.loops: l[uv].uv = (l.vert.co[ua] / uv_m + .5, l.vert.co[va] / uv_m + .5)
    bm.to_mesh(me); bm.free()
    o = link(bpy.data.objects.new(name, me)); o.data.materials.append(mat)
    o.location = loc; o.rotation_euler = rot
    if bevel:
        m = o.modifiers.new('Bevel', 'BEVEL'); m.width = bevel; m.segments = 2; m.limit_method = 'ANGLE'
    return o

# Barra entre dos puntos
def bar(name, a, b, w=(.042, .042), mat=WOOD):
    a, b = Vector(a), Vector(b); d = b - a
    o = box(name, (w[0], w[1], d.length), (a + b) / 2, mat=mat)
    o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d.normalized())
    return o

# ── caballete de estudio en H ──
TRAY_Z = .78
for s in (-1, 1):
    box(f'Pie_{s}', (.05, .7, .06), (s * .26, .1, .03))                       # patines
    box(f'Montante_{s}', (.045, .045, 1.8), (s * .21, 0, .06 + .9))            # montantes
box('Travesaño_bajo', (.5, .034, .06), (0, .004, .14))
box('Travesaño_medio', (.5, .04, .05), (0, .0, .62))
box('Travesaño_alto', (.5, .034, .06), (0, .004, 1.86))
box('Mástil', (.055, .038, 2.0), (0, -.035, 1.12))
box('Bandeja', (.66, .13, .028), (0, -.09, TRAY_Z))
box('Bandeja_borde', (.66, .012, .034), (0, -.152, TRAY_Z + .025))
for s in (-1, 1): box(f'Ménsula_{s}', (.03, .1, .07), (s * .2, -.05, TRAY_Z - .045))
bar('Puntal', (0, .44, .07), (0, -.005, 1.45), w=(.04, .035))
box('Pie_trasero', (.5, .05, .05), (0, .44, .03))

# ── lienzo tensado (48 × 68 × 2,5 cm) apoyado en la bandeja ──
CW, CH, CD = .48, .68, .025
cz = TRAY_Z + .014 + CH / 2; cy = -.105
def canvas_front():
    me = bpy.data.meshes.new('Lienzo_frente'); bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.)
    for v in bm.verts: v.co = Vector((v.co.x * CW, v.co.y * .004, v.co.z * CH))
    uv = bm.loops.layers.uv.new('UVMap')
    for f in bm.faces:
        front = f.normal.y < -.9
        f.material_index = 0 if front else 1
        for l in f.loops:
            if front: l[uv].uv = (l.vert.co.x / CW + .5, l.vert.co.z / CH + .5)
            else: l[uv].uv = (l.vert.co.x * 4 + .5, (l.vert.co.z + l.vert.co.y) * 4 + .5)
    bm.to_mesh(me); bm.free()
    o = link(bpy.data.objects.new('Lienzo_frente', me)); o.data.materials.append(PAINT); o.data.materials.append(LINEN)
    o.location = (0, cy - CD / 2 + .002, cz)
    m = o.modifiers.new('Bevel', 'BEVEL'); m.width = .0025; m.segments = 3
    return o
canvas_front()
for s in (-1, 1):   # cantos de lino que envuelven el bastidor
    box(f'Canto_v_{s}', (.004, CD, CH), (s * (CW / 2 - .002), cy, cz), mat=LINEN, bevel=.0015, uv_m=.12)
    box(f'Canto_h_{s}', (CW, CD, .004), (0, cy, cz + s * (CH / 2 - .002)), mat=LINEN, bevel=.0015, uv_m=.12)
bw = .038   # bastidor visible por detrás
for s in (-1, 1):
    box(f'Bastidor_v_{s}', (bw, CD - .006, CH - .01), (s * (CW / 2 - bw / 2 - .004), cy + .002, cz), bevel=.002)
    box(f'Bastidor_h_{s}', (CW - .01, CD - .006, bw), (0, cy + .002, cz + s * (CH / 2 - bw / 2 - .004)), bevel=.002)
box('Bastidor_cruz', (CW - .02, CD - .01, .03), (0, cy + .004, cz), bevel=.002)
box('Lino_reverso', (CW - .012, .002, CH - .012), (0, cy - CD / 2 + .006, cz), mat=LINEN_RAW, bevel=0, uv_m=.12)
box('Prensa', (.13, .07, .06), (0, -.07, cz + CH / 2 + .03))

# ── tubos de óleo sobre la bandeja ──
def tube(name, oil, loc, rotz):
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=.011, depth=.1, location=(0, 0, 0))
    o = bpy.context.object; o.name = name
    me = o.data
    for v in me.vertices:   # extremo prensado y aplastado
        if v.co.z < -.03:
            t = (-.03 - v.co.z) / .02
            v.co.x *= 1 + .35 * t; v.co.y *= max(.08, 1 - .92 * t)
    o.data.materials.append(METAL)
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=.0113, depth=.045, location=(0, 0, .005)); band = bpy.context.object
    band.data.materials.append(OILM[oil]); band.parent = o
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=.008, depth=.016, location=(0, 0, .058)); cap = bpy.context.object
    cap.data.materials.append(HANDLES[0]); cap.parent = o
    for x in (o, band, cap):
        for c in x.users_collection: c.objects.unlink(x)
        col.objects.link(x)
    o.rotation_euler = (math.pi / 2, 0, rotz); o.location = loc
    return o
tube('Tubo_rojo', 'Rojo cadmio', (.27, -.08, TRAY_Z + .025), math.radians(88))
tube('Tubo_ocre', 'Ocre amarillo', (-.27, -.07, TRAY_Z + .025), math.radians(-80))
tube('Tubo_blanco', 'Blanco titanio', (.3, -.11, TRAY_Z + .025), math.radians(100))

# ── paleta de madera con manchas de óleo ──
def palette():
    me = bpy.data.meshes.new('Paleta'); bm = bmesh.new()
    pts = []
    for i in range(72):
        th = i / 72 * math.tau
        r = 1 - .16 * math.cos(2 * th) - .05 * math.cos(th)
        pts.append(bm.verts.new((math.cos(th) * .19 * r, math.sin(th) * .14 * r, 0)))
    f = bm.faces.new(pts)
    bmesh.ops.extrude_face_region(bm, geom=[f]);
    for v in bm.verts:
        if v.co.z == 0 and v not in pts: pass
    top = [v for v in bm.verts if v not in pts]
    for v in top: v.co.z = .006
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    uv = bm.loops.layers.uv.new('UVMap')
    for fa in bm.faces:
        for l in fa.loops: l[uv].uv = (l.vert.co.x * 3 + .5, l.vert.co.y * 3 + .5)
    bm.to_mesh(me); bm.free()
    o = link(bpy.data.objects.new('Paleta', me)); o.data.materials.append(WOOD)
    hole = bpy.data.objects.new('hole', bpy.data.meshes.new('h')); col.objects.link(hole)
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=32, radius1=.022, radius2=.022, depth=.05); bm.to_mesh(hole.data); bm.free()
    hole.location = (-.115, -.02, 0)
    b = o.modifiers.new('Agujero', 'BOOLEAN'); b.object = hole; b.operation = 'DIFFERENCE'
    bev = o.modifiers.new('Bevel', 'BEVEL'); bev.width = .002; bev.segments = 2
    bpy.context.view_layer.objects.active = o
    for m in list(o.modifiers): bpy.ops.object.modifier_apply(modifier=m.name)
    bpy.data.objects.remove(hole)
    # manchas de óleo alrededor del borde
    names = list(OILS)
    for i, k in enumerate(names):
        th = math.radians(40 + i * 33)
        x, y = math.cos(th) * .14, math.sin(th) * .095
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=.016, location=(x, y, .007))
        d = bpy.context.object; d.name = f'Oleo_{i}'
        d.scale = (rnd.uniform(.8, 1.3), rnd.uniform(.7, 1.1), rnd.uniform(.22, .38))
        for v in d.data.vertices:
            n = v.co.normalized(); v.co += n * rnd.uniform(-.002, .002)
        d.data.materials.append(OILM[k]); bpy.ops.object.shade_smooth()
        d.parent = o
        for c in d.users_collection: c.objects.unlink(d)
        col.objects.link(d)
    return o

# ── banqueta (Poly Haven, CC0) con la paleta encima ──
bpy.ops.import_scene.gltf(filepath=os.path.join(RES, 'folding_wooden_stool', 'folding_wooden_stool_1k.gltf'))
stool = [o for o in bpy.context.selected_objects if o.type == 'MESH'][0]
for c in stool.users_collection: c.objects.unlink(stool)
col.objects.link(stool); stool.name = 'Banqueta'
stool.location = (.72, -.18, 0); stool.rotation_euler = (0, 0, math.radians(-18))
pal = palette(); pal.location = (.8, -.27, .446); pal.rotation_euler = (0, 0, math.radians(24))

# ── frasco de cerámica con pinceles ──
bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=.048, depth=.13, location=(.62, -.07, .442 + .065))
jar = bpy.context.object; jar.name = 'Frasco'
bm = bmesh.new(); bm.from_mesh(jar.data)
top = [f for f in bm.faces if f.normal.z > .9]; bmesh.ops.delete(bm, geom=top, context='FACES_ONLY'); bm.to_mesh(jar.data); bm.free()
so = jar.modifiers.new('Grosor', 'SOLIDIFY'); so.thickness = .004
jar.data.materials.append(CERAMIC)
bpy.context.view_layer.objects.active = jar; bpy.ops.object.shade_smooth()
for c in jar.users_collection: c.objects.unlink(jar)
col.objects.link(jar)
def brush(i, base, tilt, spin):
    L = rnd.uniform(.24, .32); hm = HANDLES[i % len(HANDLES)]
    parts = []
    bpy.ops.mesh.primitive_cone_add(vertices=16, radius1=.0045, radius2=.003, depth=L, location=(0, 0, L / 2)); h = bpy.context.object; h.data.materials.append(hm); parts.append(h)
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=.0042, depth=.028, location=(0, 0, L + .012)); f = bpy.context.object; f.data.materials.append(METAL); parts.append(f)
    flat = i % 2 == 0
    if flat: bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, L + .036)); b = bpy.context.object; b.scale = (.009, .0035, .026)
    else: bpy.ops.mesh.primitive_cone_add(vertices=12, radius1=.0045, radius2=.0002, depth=.03, location=(0, 0, L + .04)); b = bpy.context.object
    b.data.materials.append(HOG if flat else SABLE); parts.append(b)
    root = parts[0]
    for p in parts[1:]: p.parent = root; p.matrix_parent_inverse = root.matrix_world.inverted()
    for p in parts:
        for c in p.users_collection: c.objects.unlink(p)
        col.objects.link(p)
    root.name = f'Pincel_{i}'
    root.location = base; root.rotation_euler = (tilt, 0, spin)
for i in range(7):
    a = i / 7 * math.tau
    brush(i, (.62 + math.cos(a) * .02, -.07 + math.sin(a) * .02, .442 + .02), math.radians(rnd.uniform(6, 16)), a + math.pi / 2)

for o in col.all_objects:
    if o.type == 'MESH':
        for p in o.data.polygons: p.use_smooth = o.name.startswith(('Oleo', 'Frasco', 'Tubo', 'Pincel', 'Banqueta'))

# ── sombra horneada: Cycles renderiza el piso desde arriba como captador de sombras ──
def bake_shadow(path, center=(.25, -.05), size=2.8, px=768):
    hdr = os.path.join(RES, 'hdri', 'photo_studio_01_1k.hdr')
    w = bpy.data.worlds.new('Wsh'); scene.world = w; w.use_nodes = True
    env = w.node_tree.nodes.new('ShaderNodeTexEnvironment'); env.image = img(hdr)
    w.node_tree.links.new(env.outputs['Color'], w.node_tree.nodes['Background'].inputs['Color'])
    bpy.ops.mesh.primitive_plane_add(size=size * 1.2, location=(center[0], center[1], 0)); fl = bpy.context.object; fl.is_shadow_catcher = True
    bpy.ops.object.light_add(type='AREA', location=(center[0] - .4, center[1] - .6, 3.2)); L = bpy.context.object; L.data.energy = 900; L.data.size = 2.2
    bpy.ops.object.camera_add(location=(center[0], center[1], 4)); cam = bpy.context.object
    cam.data.type = 'ORTHO'; cam.data.ortho_scale = size; scene.camera = cam
    scene.render.engine = 'CYCLES'; scene.cycles.device = 'CPU'; scene.cycles.samples = 48; scene.cycles.use_denoising = True
    scene.render.film_transparent = True; scene.render.resolution_x = scene.render.resolution_y = px
    scene.render.image_settings.file_format = 'PNG'; scene.render.image_settings.color_mode = 'RGBA'
    hidden = [o for o in col.all_objects]
    for o in hidden: o.visible_camera = False      # proyectan sombra pero no salen en la imagen
    scene.render.filepath = path; bpy.ops.render.render(write_still=True)
    for o in hidden: o.visible_camera = True
    for o in (fl, L, cam): bpy.data.objects.remove(o)
    scene.world = None
    # quitar la neblina de fondo y desvanecer los bordes para que no se note el cuadrado
    import numpy as np
    im = img(path); W, H = im.size
    px = np.array(im.pixels[:], dtype=np.float32).reshape(H, W, 4)
    yy, xx = np.mgrid[0:H, 0:W]; r = np.hypot((xx - W / 2) / (W / 2), (yy - H / 2) / (H / 2))
    fall = np.clip((1 - r) / .45, 0, 1) ** 1.5
    px[..., 3] = np.clip((px[..., 3] - .14) / .86, 0, 1) * fall
    px[..., :3] = 0
    im.pixels = px.ravel().tolist(); im.filepath_raw = path; im.file_format = 'PNG'; im.save()
    # plano con la sombra (negro, transparencia desde el render)
    m = bpy.data.materials.new('Shadow'); m.use_nodes = True; nt = m.node_tree; bsdf = nt.nodes['Principled BSDF']
    t = nt.nodes.new('ShaderNodeTexImage'); t.image = im
    bsdf.inputs['Base Color'].default_value = (0, 0, 0, 1); bsdf.inputs['Roughness'].default_value = 1
    nt.links.new(t.outputs['Alpha'], bsdf.inputs['Alpha']); m.blend_method = 'BLEND'
    bpy.ops.mesh.primitive_plane_add(size=size, location=(center[0], center[1], .002)); p = bpy.context.object; p.name = 'Sombra'
    p.data.materials.append(m)
    for c in p.users_collection: c.objects.unlink(p)
    col.objects.link(p)
if not RENDER:
    bake_shadow(os.path.join(RES, 'tex', 'shadow.png'))

# ── exportar GLB (modificadores aplicados) ──
bpy.ops.object.select_all(action='DESELECT')
for o in col.all_objects: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_apply=True, export_yup=True,
                          export_image_format='JPEG', export_jpeg_quality=86, export_materials='EXPORT')
print('GLB', OUT, os.path.getsize(OUT))

# ── render de referencia con Cycles (CPU) ──
if RENDER:
    hdr = os.path.join(RES, 'hdri', 'photo_studio_01_1k.hdr')
    w = bpy.data.worlds.new('W'); scene.world = w; w.use_nodes = True; nt = w.node_tree
    env = nt.nodes.new('ShaderNodeTexEnvironment'); env.image = img(hdr)
    bg_light = nt.nodes['Background']; bg_light.inputs['Strength'].default_value = 1.1
    nt.links.new(env.outputs['Color'], bg_light.inputs['Color'])
    bg_cam = nt.nodes.new('ShaderNodeBackground'); bg_cam.inputs['Color'].default_value = (.83, .81, .76, 1)
    lp = nt.nodes.new('ShaderNodeLightPath'); mix = nt.nodes.new('ShaderNodeMixShader')
    nt.links.new(lp.outputs['Is Camera Ray'], mix.inputs['Fac']); nt.links.new(bg_light.outputs[0], mix.inputs[1]); nt.links.new(bg_cam.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], nt.nodes['World Output'].inputs['Surface'])
    # ciclorama de yeso
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, 0)); fl = bpy.context.object; fl.scale = (12, 12, 1)
    fl.is_shadow_catcher = True
    scene.render.film_transparent = True
    bpy.ops.object.light_add(type='AREA', location=(-1.6, -2.2, 2.6)); key = bpy.context.object; key.data.energy = 260; key.data.size = 1.6
    key.rotation_euler = (math.radians(50), 0, math.radians(-35))
    bpy.ops.object.camera_add(location=(1.15, -3.3, 1.3)); cam = bpy.context.object; scene.camera = cam; cam.data.lens = 50
    tgt = Vector((.12, -.1, .95)); cam.rotation_euler = (tgt - cam.location).to_track_quat('-Z', 'Y').to_euler()
    scene.render.engine = 'CYCLES'; scene.cycles.device = 'CPU'; scene.cycles.samples = 96; scene.cycles.use_denoising = True
    scene.render.resolution_x, scene.render.resolution_y = 1600, 1000
    scene.view_settings.view_transform = 'AgX'; scene.view_settings.look = 'AgX - Medium High Contrast'
    scene.render.filepath = RENDER; bpy.ops.render.render(write_still=True)
    print('RENDER', RENDER)
