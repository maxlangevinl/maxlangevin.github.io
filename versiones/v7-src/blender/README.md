# Estudio 3D (Blender)

Modelo del estudio que usa la versión 7: caballete de estudio en H, lienzo tensado de 48 × 68 cm con bastidor,
paleta con óleo, pinceles en frasco y tubos. Medidas reales en metros.

## Regenerar

```bash
python3 ph_get.py recursos/          # descarga de Poly Haven: banqueta, HDRI de estudio y maderas (CC0)
cp -r tex recursos/                  # texturas preparadas: haya, normales, lino y yeso
blender -b --python build_studio.py -- recursos/ estudio.glb                            # solo el modelo
blender -b --python build_studio.py -- recursos/ tmp.glb render.png pintura.webp        # además, render con Cycles
npx @gltf-transform/cli optimize estudio.glb ../public/estudio.glb \
  --texture-compress webp --texture-size 1024 --compress meshopt --simplify false --palette false
```

El material `Painting` del lienzo lleva una imagen de relleno para conservar sus UV; la web le pone la obra.
La sombra del piso se hornea con Cycles (plano `Sombra`), así la web no calcula sombras en cada cuadro.

## Créditos

Banqueta plegable (folding_wooden_stool), HDRI photo_studio_01 y textura fine_grained_wood: Poly Haven, CC0.
