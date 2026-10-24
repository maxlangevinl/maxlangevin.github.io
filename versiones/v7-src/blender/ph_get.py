# Descarga modelos (gltf 1k), texturas (jpg 1k) y HDRI (1k) de Poly Haven, cada uno en su carpeta.
import json, os, sys, urllib.request
UA = {'User-Agent': 'curl/8.5.0'}
open_ = lambda u: urllib.request.urlopen(urllib.request.Request(u, headers=UA))
OUT = sys.argv[1]
def get(url, dest):
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    if not os.path.exists(dest): open(dest, 'wb').write(open_(url).read())
def files(i): return json.load(open_(f'https://api.polyhaven.com/files/{i}'))
for m in ['folding_wooden_stool', 'fancy_picture_frame_01', 'ceramic_pot']:
    g = files(m)['gltf']['1k']['gltf']; d = os.path.join(OUT, m)
    get(g['url'], os.path.join(d, os.path.basename(g['url'])))
    for rel, f in g.get('include', {}).items(): get(f['url'], os.path.join(d, rel))
for t in ['stained_pine', 'fine_grained_wood']:
    f = files(t); d = os.path.join(OUT, t)
    for k in ['Diffuse', 'Rough', 'nor_gl']:
        if k in f and '1k' in f[k]: get(f[k]['1k']['jpg']['url'], os.path.join(d, f'{t}_{k}_1k.jpg'))
h = files('photo_studio_01')['hdri']['1k']['hdr']['url']; get(h, os.path.join(OUT, 'hdri', 'photo_studio_01_1k.hdr'))
print('ok')
