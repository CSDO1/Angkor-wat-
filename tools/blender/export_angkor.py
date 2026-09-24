"""
ANGKOR: Legacy of the Khmer Empire -- Blender -> game asset pipeline.

Run from the project root:
    blender -b ../angkor_wat.blend -P tools/blender/export_angkor.py

(`angkor_wat.blend` is the Angkor Wat environment previously saved as `pet_model.blend`;
pass another file as the first argument to Blender to export a different copy.)

What it does, without modifying the source .blend on disk:
  1. Cuts walk-through passages into every gopura / gate (in the source model the doorways are
     dark panels on solid shells), and removes the dark doorway panels that covered them.
  2. Visual meshes: evaluates modifiers, merges geometry into 64 m spatial chunks (all stone materials share one chunk)
     (frustum-cullable, few draw calls), bakes per-vertex ambient occlusion with ray casts, and
     builds a decimated LOD1 for every heavy chunk.
  3. Collision: a separate low-poly mesh (planar-dissolved architecture, convex hulls for towers
     and naga heads, top faces only for paving, no vegetation or small ornaments).
  4. Stairs: exported as analytic ramp volumes so the character climbs the steep Khmer steps
     smoothly instead of colliding with each riser.
  5. Vegetation: Geometry Nodes scatter is exported as compact instance transforms plus one
     library GLB, so the game renders it with GPU instancing.
  6. level.json: water bodies, footprints for the map, landmark positions, bounds.

All coordinates are written in three.js space: (x, y, z)_three = (x, z, -y)_blender.
"""
import bpy, bmesh, json, math, os, struct, sys, time
import numpy as np
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree
from mathutils.kdtree import KDTree

T0 = time.time()
def log(*a):
    print("[EXPORT %6.1fs]" % (time.time() - T0), *a, flush=True)

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
OUT_ENV = os.path.join(ROOT, "public", "assets", "environment", "angkor_wat")
OUT_VEG = os.path.join(ROOT, "public", "assets", "environment", "vegetation")
os.makedirs(OUT_ENV, exist_ok=True)
os.makedirs(OUT_VEG, exist_ok=True)

CELL = 64.0                       # chunk size (m) for merged visual meshes
# Every stone-like material shares one in-game shader; the source material is kept per vertex
# (COLOR_0.b = index into STONE_MATS) so a whole chunk of architecture is a single draw call.
STONE_MATS = ['Sandstone_Aged', 'Sandstone_BasRelief', 'Sandstone_Carved_Rosette', 'Sandstone_Naga_Scales',
              'Sandstone_Paving_Weathered', 'Sandstone_Roof_Tiles', 'Laterite_Porous', 'Doorway_Shadow']
GROUND_CELL = 256.0
LOD1_MIN_TRIS = 1200              # chunks heavier than this get a decimated LOD1
LOD1_RATIO = 0.3
AO_RAYS, AO_DIST = 10, 4.5
PLAY_X, PLAY_Y0, PLAY_Y1 = 560.0, -660.0, 450.0   # blender xy bounds kept for collision

STAIR_DIMS = {  # data name -> (H, run, W), from build_angkor.py
    'Stair_Bakan_Mesh': (13.0, 7.5, 3.4), 'Stair_Level2_Mesh': (6.5, 7.0, 5.0),
    'Stair_Terrace_Mesh': (3.5, 5.0, 4.5), 'Stair_Honour_Mesh': (1.9, 3.2, 6.0),
    'Stair_Causeway_Mesh': (1.6, 2.5, 4.0), 'Stair_Library_Mesh': (2.0, 2.8, 3.0),
}
NO_AO_MATS = {'Ground_Grass_Soil', 'Foliage_Distant_Forest', 'Water_Moat', 'Water_Reflecting_Pond'}
SKIP_VISUAL_MATS = {'Water_Moat', 'Water_Reflecting_Pond'}

def t3(v):   # blender -> three
    return [float(v[0]), float(v[2]), float(-v[1])]

def conv(arr):  # (n,3) blender -> three
    out = np.empty_like(arr)
    out[:, 0] = arr[:, 0]; out[:, 1] = arr[:, 2]; out[:, 2] = -arr[:, 1]
    return out

scene = bpy.context.scene
for c in bpy.data.collections:          # make library collections evaluable
    c.hide_render = False
def unexclude(lc):
    lc.exclude = False
    for ch in lc.children:
        unexclude(ch)
unexclude(bpy.context.view_layer.layer_collection)
# libraries were excluded on purpose; hide them from the static pass explicitly instead
LIB_COLLS = {"Detail_Library", "Tree_Library", "Plant_Library", "Lib_Baluster", "Lib_Palms",
             "Lib_Broadleaf_LOD0", "Lib_Broadleaf_LOD1", "Lib_Bushes", "Lib_Ferns", "Lib_Grass", "Lib_Lotus"}
lib_objs = set()
for n in LIB_COLLS:
    if n in bpy.data.collections:
        lib_objs |= {o.name for o in bpy.data.collections[n].all_objects}

def top_collection(ob):
    return ob.users_collection[0].name if ob.users_collection else ""

# ----------------------------------------------------------------------------
# 1. Walk-through passages in gopuras
# ----------------------------------------------------------------------------
log("finding doorways")
door_mat = bpy.data.materials.get("Doorway_Shadow")
stone_mat = bpy.data.materials.get("Sandstone_Aged")
doors = []
for ob in [o for o in bpy.data.objects if o.type == 'MESH' and o.name.endswith(("_Doorways", "_Doorways_02"))
           or (o.type == 'MESH' and "_Doorways" in o.name)]:
    me = ob.data
    di = [i for i, m in enumerate(me.materials) if m == door_mat]
    if not di:
        continue
    bm = bmesh.new(); bm.from_mesh(me); bm.transform(ob.matrix_world)
    bm.faces.ensure_lookup_table()
    seen = set()
    for f in bm.faces:
        if f.material_index not in di or f.index in seen:
            continue
        stack, isl = [f], []
        while stack:
            g = stack.pop()
            if g.index in seen:
                continue
            seen.add(g.index); isl.append(g)
            for e in g.edges:
                for h in e.link_faces:
                    if h.material_index in di and h.index not in seen:
                        stack.append(h)
        vs = [v.co.copy() for g in isl for v in g.verts]
        mn = Vector((min(v.x for v in vs), min(v.y for v in vs), min(v.z for v in vs)))
        mx = Vector((max(v.x for v in vs), max(v.y for v in vs), max(v.z for v in vs)))
        d = mx - mn
        axis = 0 if d.x < d.y else 1          # thin axis = passage direction
        doors.append(dict(c=(mn + mx) / 2, mn=mn, mx=mx, axis=axis, src=ob.name))
    # drop the dark panels from the visual + collision geometry
    bm2 = bmesh.new(); bm2.from_mesh(me)
    bmesh.ops.delete(bm2, geom=[f for f in bm2.faces if f.material_index in di], context='FACES')
    bm2.to_mesh(me); bm2.free(); bm.free()
log("doorway panels:", len(doors))

used = set(); tunnels = []
for i, a in enumerate(doors):
    if i in used:
        continue
    lat = 1 - a['axis']
    best, bd = None, 1e9
    for j, b in enumerate(doors):
        if j == i or j in used or b['axis'] != a['axis']:
            continue
        if abs(a['c'][lat] - b['c'][lat]) > 0.3 or abs(a['mn'].z - b['mn'].z) > 0.3:
            continue
        dist = abs(a['c'][a['axis']] - b['c'][a['axis']])
        if dist < 40 and dist < bd:
            best, bd = j, dist
    ax = a['axis']
    mn, mx = a['mn'].copy(), a['mx'].copy()
    if best is not None:
        used.add(best); b = doors[best]
        mn[ax] = min(a['mn'][ax], b['mn'][ax]); mx[ax] = max(a['mx'][ax], b['mx'][ax])
    else:   # one-sided gate (upper-level side gates): cut inward toward the building centre
        hit_plus = scene.ray_cast(bpy.context.evaluated_depsgraph_get(), a['c'] + Vector((0, 0, 0)) + Vector([0.1 if k == ax else 0 for k in range(3)]),
                                  Vector([1 if k == ax else 0 for k in range(3)]), distance=1.5)[0]
        if hit_plus:
            mx[ax] = a['c'][ax] + 8.0
        else:
            mn[ax] = a['c'][ax] - 8.0
    used.add(i)
    mn[ax] -= 0.35; mx[ax] += 0.35
    mn.z -= 0.004
    tunnels.append((mn, mx))
log("passages:", len(tunnels))

def box_bm(bm, mn, mx):
    vs = [bm.verts.new((x, y, z)) for z in (mn.z, mx.z) for y in (mn.y, mx.y) for x in (mn.x, mx.x)]
    for f in ((0, 2, 3, 1), (4, 5, 7, 6), (0, 1, 5, 4), (2, 6, 7, 3), (0, 4, 6, 2), (1, 3, 7, 5)):
        bm.faces.new([vs[k] for k in f])

cut_count = 0
for ob in [o for o in bpy.data.objects if o.type == 'MESH' and (o.name.startswith("Gopura_") or o.name.startswith("Gate_"))
           and "Doorways" not in o.name and "Stair" not in o.name and "Tower" not in o.name]:
    bb = [ob.matrix_world @ Vector(c) for c in ob.bound_box]
    omn = Vector((min(v.x for v in bb), min(v.y for v in bb), min(v.z for v in bb)))
    omx = Vector((max(v.x for v in bb), max(v.y for v in bb), max(v.z for v in bb)))
    mine = [(a, b) for a, b in tunnels if all(a[k] < omx[k] and b[k] > omn[k] for k in range(3))]
    if not mine:
        continue
    bm = bmesh.new()
    for a, b in mine:
        box_bm(bm, a, b)
    cme = bpy.data.meshes.new(ob.name + "_Cutter"); bm.to_mesh(cme); bm.free()
    cme.materials.append(stone_mat)
    cut = bpy.data.objects.new(ob.name + "_Cutter", cme)
    scene.collection.objects.link(cut); cut.hide_render = True; cut.hide_viewport = True
    if stone_mat.name not in [m.name for m in ob.data.materials]:
        ob.data.materials.append(stone_mat)
    md = ob.modifiers.new("Passage", 'BOOLEAN')
    md.operation = 'DIFFERENCE'; md.solver = 'EXACT'; md.object = cut
    md.use_self = True
    try:
        md.material_mode = 'TRANSFER'
    except Exception:
        pass
    cut_count += 1
log("gopura objects cut:", cut_count)

dg = bpy.context.evaluated_depsgraph_get()
dg.update()

# ----------------------------------------------------------------------------
# helpers: evaluated triangles
# ----------------------------------------------------------------------------
def eval_tris(ob, world=True):
    eo = ob.evaluated_get(dg)
    me = eo.to_mesh()
    me.calc_loop_triangles()
    nt = len(me.loop_triangles)
    if nt == 0:
        eo.to_mesh_clear(); return None
    co = np.empty(len(me.vertices) * 3, np.float32); me.vertices.foreach_get("co", co); co = co.reshape(-1, 3)
    tv = np.empty(nt * 3, np.int32); me.loop_triangles.foreach_get("vertices", tv); tv = tv.reshape(-1, 3)
    tl = np.empty(nt * 3, np.int32); me.loop_triangles.foreach_get("loops", tl); tl = tl.reshape(-1, 3)
    tm = np.empty(nt, np.int32); me.loop_triangles.foreach_get("material_index", tm)
    tp = np.empty(nt, np.int32); me.loop_triangles.foreach_get("polygon_index", tp)
    cn = np.empty(len(me.loops) * 3, np.float32)
    try:
        me.corner_normals.foreach_get("vector", cn)
    except Exception:
        me.loops.foreach_get("normal", cn)
    cn = cn.reshape(-1, 3)
    br = np.full(len(me.polygons), 0.5, np.float32)
    if "block_rand" in me.attributes and me.attributes["block_rand"].domain == 'FACE':
        me.attributes["block_rand"].data.foreach_get("value", br)
    mats = [(s.material.name if s.material else "Sandstone_Aged") for s in eo.material_slots] or ["Sandstone_Aged"]
    M = np.array(ob.matrix_world if world else Matrix.Identity(4), np.float32)
    N = np.array((ob.matrix_world.to_3x3().inverted().transposed()) if world else Matrix.Identity(3), np.float32)
    pos = co[tv.reshape(-1)] @ M[:3, :3].T + M[:3, 3]
    nrm = cn[tl.reshape(-1)] @ N.T
    ln = np.linalg.norm(nrm, axis=1, keepdims=True); ln[ln == 0] = 1; nrm /= ln
    res = dict(pos=pos.reshape(-1, 3, 3), nrm=nrm.reshape(-1, 3, 3),
               mat=np.array([mats[min(i, len(mats) - 1)] for i in tm]), br=br[tp])
    eo.to_mesh_clear()
    return res

def face_normals(pos):  # (n,3,3)
    n = np.cross(pos[:, 1] - pos[:, 0], pos[:, 2] - pos[:, 0])
    l = np.linalg.norm(n, axis=1, keepdims=True); l[l == 0] = 1
    return n / l

# ----------------------------------------------------------------------------
# 2. Visual chunks
# ----------------------------------------------------------------------------
log("collecting static geometry")
statics = []
for ob in bpy.data.objects:
    if ob.type != 'MESH' or ob.name in lib_objs or ob.name.endswith("_Cutter"):
        continue
    if any(m.type == 'NODES' for m in ob.modifiers):
        continue                                   # scatter point clouds -> instances
    if top_collection(ob) in ("Water",):
        continue
    statics.append(ob)

buckets = {}          # (mat, cx, cy) -> list of (pos, nrm, br)
temple_tris = []
all_tris = 0
for ob in statics:
    r = eval_tris(ob)
    if r is None:
        continue
    all_tris += len(r['pos'])
    cen = r['pos'].mean(axis=1)
    if ob.name in ("Ground_Outer_Land", "Background_Treeline"):
        cx = cy = np.full(len(cen), 999, np.int32)       # one far chunk per material, never LOD'd
    else:
        cx = np.floor(cen[:, 0] / CELL).astype(np.int32); cy = np.floor(cen[:, 1] / CELL).astype(np.int32)
    if top_collection(ob) not in ("Background",) and ob.name != "Ground_Outer_Land":
        temple_tris.append(r['pos'])
    grp = np.array(['Stone' if m in STONE_MATS else m for m in r['mat'].tolist()])
    if cx[0] != 999:   # cheap ground geometry gets much larger chunks (fewer draw calls)
        big = grp != 'Stone'
        cx = np.where(big, np.floor(cen[:, 0] / GROUND_CELL).astype(np.int32) + 5000, cx)
        cy = np.where(big, np.floor(cen[:, 1] / GROUND_CELL).astype(np.int32) + 5000, cy)
    mid = np.array([STONE_MATS.index(m) if m in STONE_MATS else 0 for m in r['mat'].tolist()], np.float32)
    for key in set(zip(grp.tolist(), cx.tolist(), cy.tolist())):
        if key[0] in SKIP_VISUAL_MATS:
            continue
        sel = (grp == key[0]) & (cx == key[1]) & (cy == key[2])
        buckets.setdefault(key, []).append((r['pos'][sel], r['nrm'][sel], r['br'][sel], mid[sel]))
log("static triangles:", all_tris, "buckets:", len(buckets))

tp = np.concatenate(temple_tris).reshape(-1, 3)
bvh = BVHTree.FromPolygons([tuple(v) for v in tp], [(i, i + 1, i + 2) for i in range(0, len(tp), 3)], all_triangles=True)
log("AO bvh ready,", len(tp) // 3, "tris")

# fixed cosine-weighted hemisphere directions (around +Z), rotated per vertex
_g = (1 + 5 ** 0.5) / 2
HEMI = []
for k in range(AO_RAYS):
    u = (k + 0.5) / AO_RAYS; phi = 2 * math.pi * k / _g
    r = math.sqrt(u); HEMI.append(Vector((r * math.cos(phi), r * math.sin(phi), math.sqrt(1 - u))))

def ao_for(verts, nrms):
    out = np.ones(len(verts), np.float32)
    for i in range(len(verts)):
        n = Vector(nrms[i]); p = Vector(verts[i]) + n * 0.03
        t = n.orthogonal().normalized(); b = n.cross(t)
        occ = 0.0
        for h in HEMI:
            d = t * h.x + b * h.y + n * h.z
            hit = bvh.ray_cast(p, d, AO_DIST)
            if hit[0] is not None:
                occ += 1.0 - (hit[3] / AO_DIST) ** 0.7
        out[i] = 1.0 - 0.85 * occ / AO_RAYS
    return out

def dedupe(pos, nrm, br, mi=None):
    mi = np.zeros(len(pos), np.float32) if mi is None else mi
    key = np.concatenate([np.round(pos, 3), np.round(nrm, 2), np.round(br[:, None], 2), mi[:, None]], axis=1)
    uniq, idx, inv = np.unique(key, axis=0, return_index=True, return_inverse=True)
    return pos[idx], nrm[idx], br[idx], inv.reshape(-1).astype(np.uint32), mi[idx]

def decimate(pos_tris, ratio):
    flat = pos_tris.reshape(-1, 3)
    key = np.round(flat, 3)
    uniq, inv = np.unique(key, axis=0, return_inverse=True)
    inv = inv.reshape(-1)
    me = bpy.data.meshes.new("lod_tmp")
    me.from_pydata(uniq.tolist(), [], inv.reshape(-1, 3).tolist())
    ob = bpy.data.objects.new("lod_tmp", me); scene.collection.objects.link(ob)
    md = ob.modifiers.new("dec", 'DECIMATE'); md.ratio = ratio; md.use_collapse_triangulate = True
    d2 = bpy.context.evaluated_depsgraph_get()
    eo = ob.evaluated_get(d2); m2 = eo.to_mesh(); m2.calc_loop_triangles()
    nt = len(m2.loop_triangles)
    co = np.empty(len(m2.vertices) * 3, np.float32); m2.vertices.foreach_get("co", co); co = co.reshape(-1, 3)
    tv = np.empty(nt * 3, np.int32); m2.loop_triangles.foreach_get("vertices", tv)
    res = co[tv].reshape(-1, 3, 3)
    eo.to_mesh_clear(); bpy.data.objects.remove(ob); bpy.data.meshes.remove(me)
    return res

chunks = []
total_v = 0
for (mat, cx, cy), parts in sorted(buckets.items()):
    pos = np.concatenate([p[0] for p in parts]); nrm = np.concatenate([p[1] for p in parts])
    br = np.concatenate([np.repeat(p[2], 3) for p in parts])
    mi = np.concatenate([np.repeat(p[3], 3) for p in parts])
    ntri = len(pos)
    P, Nn, B, I, MI = dedupe(pos.reshape(-1, 3), nrm.reshape(-1, 3), br, mi)
    A = np.ones(len(P), np.float32) if mat in NO_AO_MATS or cx == 999 else ao_for(P, Nn)
    total_v += len(P)
    lod1 = None
    if ntri > LOD1_MIN_TRIS and cx != 999:
        dt = decimate(pos, LOD1_RATIO)
        if len(dt):
            fn = np.repeat(face_normals(dt), 3, axis=0)
            P1, N1, B1, I1, _ = dedupe(dt.reshape(-1, 3), fn, np.full(len(dt) * 3, 0.5, np.float32))
            A1 = np.ones(len(P1), np.float32) if mat in NO_AO_MATS else ao_for(P1, N1)
            kd = KDTree(len(P)); [kd.insert(Vector(p), i) for i, p in enumerate(P)]; kd.balance()
            M1 = np.array([MI[kd.find(Vector(p))[1]] for p in P1], np.float32)
            lod1 = (P1, N1, B1, A1, I1, M1)
    chunks.append(dict(name=f"{mat}__{cx}_{cy}", mat=mat, lod0=(P, Nn, B, A, I, MI), lod1=lod1, tris=ntri))
    log(f"chunk {mat} {cx},{cy}: {ntri} tris, {len(P)} verts" + (f", LOD1 {len(lod1[4]) // 3} tris" if lod1 else ""))
log("visual verts:", total_v)

# ----------------------------------------------------------------------------
# GLB writer (positions/normals/colour/indices only; materials are assigned in-game by name)
# ----------------------------------------------------------------------------
class GLB:
    def __init__(s):
        s.bin = bytearray(); s.j = dict(asset=dict(version="2.0", generator="angkor export_angkor.py"),
                                         scene=0, scenes=[dict(nodes=[])], nodes=[], meshes=[], accessors=[],
                                         bufferViews=[], buffers=[], materials=[])
        s.mats = {}

    def _view(s, data, target=None):
        while len(s.bin) % 4:
            s.bin += b'\0'
        off = len(s.bin); s.bin += data
        v = dict(buffer=0, byteOffset=off, byteLength=len(data))
        if target:
            v['target'] = target
        s.j['bufferViews'].append(v)
        return len(s.j['bufferViews']) - 1

    def acc(s, arr, typ, ctype, normalized=False, minmax=False, target=34962):
        a = dict(bufferView=s._view(arr.tobytes(), target), componentType=ctype, count=int(arr.shape[0]), type=typ)
        if normalized:
            a['normalized'] = True
        if minmax:
            a['min'] = arr.min(axis=0).tolist(); a['max'] = arr.max(axis=0).tolist()
        s.j['accessors'].append(a)
        return len(s.j['accessors']) - 1

    def mat(s, name):
        if name not in s.mats:
            s.j['materials'].append(dict(name=name, pbrMetallicRoughness=dict(baseColorFactor=[0.6, 0.5, 0.4, 1], metallicFactor=0, roughnessFactor=0.9)))
            s.mats[name] = len(s.j['materials']) - 1
        return s.mats[name]

    def prim(s, mat, P, N=None, B=None, A=None, I=None, M=None):
        attrs = dict(POSITION=s.acc(conv(P).astype(np.float32), "VEC3", 5126, minmax=True))
        if N is not None:
            attrs['NORMAL'] = s.acc(conv(N).astype(np.float32), "VEC3", 5126)
        if A is not None:
            col = np.stack([A, B if B is not None else np.full(len(A), 0.5),
                            (M / 255.0) if M is not None else np.zeros(len(A)), np.ones(len(A))], 1)
            attrs['COLOR_0'] = s.acc(np.clip(col * 255 + 0.5, 0, 255).astype(np.uint8), "VEC4", 5121, normalized=True)
        p = dict(attributes=attrs, mode=4)
        if I is not None:
            big = len(P) > 65535
            p['indices'] = s.acc(I.astype(np.uint32 if big else np.uint16), "SCALAR", 5125 if big else 5123, target=34963)
        if mat is not None:
            p['material'] = s.mat(mat)
        return p

    def node(s, name, prims, extras=None, translation=None):
        s.j['meshes'].append(dict(name=name, primitives=prims))
        n = dict(name=name, mesh=len(s.j['meshes']) - 1)
        if extras:
            n['extras'] = extras
        if translation:
            n['translation'] = translation
        s.j['nodes'].append(n); s.j['scenes'][0]['nodes'].append(len(s.j['nodes']) - 1)

    def save(s, path):
        while len(s.bin) % 4:
            s.bin += b'\0'
        s.j['buffers'] = [dict(byteLength=len(s.bin))]
        if not s.j['materials']:
            del s.j['materials']
        js = json.dumps(s.j, separators=(',', ':')).encode()
        while len(js) % 4:
            js += b' '
        with open(path, 'wb') as f:
            f.write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(s.bin)))
            f.write(struct.pack('<II', len(js), 0x4E4F534A)); f.write(js)
            f.write(struct.pack('<II', len(s.bin), 0x004E4942)); f.write(bytes(s.bin))
        log("wrote", path, "%.1f MB" % (os.path.getsize(path) / 1e6))

g = GLB()
for c in chunks:
    P, N, B, A, I, M = c['lod0']
    g.node(c['name'] + "__LOD0", [g.prim(c['mat'], P, N, B, A, I, M)], extras=dict(material=c['mat'], lod=0, tris=c['tris']))
    if c['lod1']:
        P, N, B, A, I, M = c['lod1']
        g.node(c['name'] + "__LOD1", [g.prim(c['mat'], P, N, B, A, I, M)], extras=dict(material=c['mat'], lod=1))
g.save(os.path.join(OUT_ENV, "angkor_visual.glb"))

# ----------------------------------------------------------------------------
# 3. Collision mesh
# ----------------------------------------------------------------------------
log("collision")
col_tris = []
def add_col(pos):
    if pos is not None and len(pos):
        col_tris.append(pos.reshape(-1, 3, 3))

def dissolved(ob):
    eo = ob.evaluated_get(dg); me = eo.to_mesh()
    bm = bmesh.new(); bm.from_mesh(me); eo.to_mesh_clear()
    bm.transform(ob.matrix_world)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.002)
    bmesh.ops.dissolve_limit(bm, angle_limit=math.radians(1.0), verts=bm.verts, edges=bm.edges)
    bmesh.ops.triangulate(bm, faces=bm.faces)
    out = np.array([[v.co[:] for v in f.verts] for f in bm.faces], np.float32)
    bm.free()
    return out

def hull(ob):
    eo = ob.evaluated_get(dg); me = eo.to_mesh()
    bm = bmesh.new(); bm.from_mesh(me); eo.to_mesh_clear()
    bm.transform(ob.matrix_world)
    res = bmesh.ops.convex_hull(bm, input=bm.verts)
    bmesh.ops.delete(bm, geom=list(set(res['geom_interior']) | set(res['geom_unused'])), context='VERTS')
    bmesh.ops.triangulate(bm, faces=bm.faces)
    out = np.array([[v.co[:] for v in f.verts] for f in bm.faces if len(f.verts) == 3], np.float32)
    bm.free()
    return out

before = 0
for ob in statics:
    tc = top_collection(ob)
    if tc == "Background":
        continue
    dn = ob.data.name
    if ob.name == "Ground_Outer_Land":
        r = eval_tris(ob)
        c = r['pos'].mean(axis=1)
        keep = (np.abs(c[:, 0]) < PLAY_X + 60) & (c[:, 1] > PLAY_Y0 - 60) & (c[:, 1] < PLAY_Y1 + 60)
        add_col(r['pos'][keep]); before += len(r['pos']); continue
    r = eval_tris(ob)
    if r is None:
        continue
    before += len(r['pos'])
    if "Paving" in ob.name:
        up = face_normals(r['pos'])[:, 2] > 0.8
        add_col(r['pos'][up]); continue
    if dn in ("Khmer_Tower_Mesh", "Naga_Head_Mesh"):
        add_col(hull(ob)); continue
    if ob.name == "Courtyard_L1_Lawn":
        add_col(r['pos']); continue
    add_col(dissolved(ob))
col = np.concatenate(col_tris)
log("collision tris:", len(col), "(visual source tris %d)" % before)
flat = col.reshape(-1, 3)
uniq, inv = np.unique(np.round(flat, 3), axis=0, return_inverse=True)
g = GLB()
g.node("Collision", [g.prim(None, uniq.astype(np.float32), I=inv.reshape(-1).astype(np.uint32))], extras=dict(collision=True))
g.save(os.path.join(OUT_ENV, "angkor_collision.glb"))

# ----------------------------------------------------------------------------
# 4. Stairs, water, map footprints, landmarks
# ----------------------------------------------------------------------------
stairs = []
for ob in bpy.data.objects:
    if ob.type == 'MESH' and ob.data.name in STAIR_DIMS:
        H, run, W = STAIR_DIMS[ob.data.name]
        mw = ob.matrix_world
        up = Vector((mw.col[1][0], mw.col[1][1], 0)).normalized()     # local +y: toward the top
        side = Vector((mw.col[0][0], mw.col[0][1], 0)).normalized()
        stairs.append(dict(name=ob.name, kind=ob.data.name.split('_')[1].lower(), o=t3(mw.translation),
                           up=t3(up), side=t3(side), H=H, run=run, W=W))
log("stairs:", len(stairs))

def bbox3(ob):
    bb = [ob.matrix_world @ Vector(c) for c in ob.bound_box]
    return [min(v.x for v in bb), min(v.y for v in bb), min(v.z for v in bb)], [max(v.x for v in bb), max(v.y for v in bb), max(v.z for v in bb)]

water = []
for n in ("Water_Moat", "Water_Pond_North", "Water_Pond_South"):
    ob = bpy.data.objects.get(n)
    if ob:
        mn, mx = bbox3(ob)
        water.append(dict(name=n, x0=mn[0], x1=mx[0], z0=-mx[1], z1=-mn[1], y=mx[2]))

footprints = []
for ob in statics:
    tc = top_collection(ob)
    if tc in ("Background", "Ground") or ob.name.startswith(("Ground", "Courtyard")) or "Paving" in ob.name:
        continue
    mn, mx = bbox3(ob)
    if max(mx[0] - mn[0], mx[1] - mn[1]) > 600:
        continue
    kind = 'tower' if ob.data.name == "Khmer_Tower_Mesh" else 'naga' if tc == "Naga_Railings" else \
           'stair' if ob.data.name in STAIR_DIMS else 'platform' if ob.name.startswith(("Platform", "Terrace", "Causeway", "Moat_Causeway", "Library_Walkway")) else 'building'
    footprints.append([kind, round(mn[0], 1), round(-mx[1], 1), round(mx[0], 1), round(-mn[1], 1), round(mx[2], 1)])

landmarks = {}
for ob in statics:
    if ob.data.name in ("Khmer_Tower_Mesh", "Library_Mesh") or ob.name.startswith(("Gopura_", "Gate_", "Pavilion_", "Platform_", "Terrace_of_Honour")) and "Stair" not in ob.name and "Doorways" not in ob.name:
        mn, mx = bbox3(ob)
        landmarks[ob.name] = dict(c=t3(((mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, mn[2])), top=mx[2],
                                  min=t3((mn[0], mx[1], mn[2])), max=t3((mx[0], mn[1], mx[2])))

level = dict(
    source="angkor_wat.blend (Angkor Wat environment, originally saved as pet_model.blend)",
    axes="three.js: +Y up, -Z = east (toward the central sanctuary from the western entrance), +X = south",
    levels=dict(ground=0.0, causeway=1.6, L1=3.5, L2=10.0, L3=23.0, sanctuary=23.8),
    bounds=dict(x0=-PLAY_X, x1=PLAY_X, z0=-PLAY_Y1, z1=-PLAY_Y0),
    water=water, stairs=stairs, footprints=footprints, landmarks=landmarks,
    passages=[dict(min=t3((a.x, b.y, a.z)), max=t3((b.x, a.y, b.z))) for a, b in tunnels],
    stats=dict(source_tris=all_tris, collision_tris=int(len(col)), chunks=len(chunks)),
)
with open(os.path.join(OUT_ENV, "level.json"), "w") as f:
    json.dump(level, f, separators=(',', ':'))
log("level.json written")

# ----------------------------------------------------------------------------
# 5. Vegetation library + instances
# ----------------------------------------------------------------------------
log("vegetation")
inst = {}
for di in dg.object_instances:
    if not di.is_instance:
        continue
    name = di.object.original.name if hasattr(di.object, 'original') else di.object.name
    m = di.matrix_world
    loc = m.translation; sx = m.col[0].xyz.length
    yaw = math.atan2(m.col[0][1], m.col[0][0])
    inst.setdefault(name, []).extend(t3(loc) + [yaw, sx])

g = GLB(); meta = {}
blob = bytearray()
for name, arr in sorted(inst.items()):
    a = np.array(arr, np.float32)
    meta[name] = dict(offset=len(blob), count=len(a) // 5)
    blob += a.tobytes()
    ob = bpy.data.objects[name]
    r = eval_tris(ob, world=False)
    prims = []
    for mat in sorted(set(r['mat'].tolist())):
        sel = r['mat'] == mat
        P, N, B, I, _ = dedupe(r['pos'][sel].reshape(-1, 3), r['nrm'][sel].reshape(-1, 3), np.repeat(r['br'][sel], 3))
        # vertex colour R = height factor (for wind sway), G = block rand
        h = P[:, 2] / max(1e-3, float(r['pos'][:, :, 2].max()))
        prims.append(g.prim(mat, P, N, B, np.clip(h, 0, 1).astype(np.float32), I))
    mn = r['pos'].reshape(-1, 3).min(axis=0); mx = r['pos'].reshape(-1, 3).max(axis=0)
    meta[name]['height'] = float(mx[2]); meta[name]['radius'] = float(max(mx[0] - mn[0], mx[1] - mn[1]) / 2)
    g.node(name, prims)
    log(f"  {name}: {meta[name]['count']} instances, {len(r['pos'])} tris")
g.save(os.path.join(OUT_VEG, "vegetation.glb"))
with open(os.path.join(OUT_VEG, "instances.bin"), "wb") as f:
    f.write(bytes(blob))
with open(os.path.join(OUT_VEG, "instances.json"), "w") as f:
    json.dump(dict(stride=5, fields=["x", "y", "z", "yaw", "scale"], sets=meta), f, indent=1)
log("done")
