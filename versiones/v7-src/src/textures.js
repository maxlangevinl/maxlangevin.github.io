import * as THREE from 'three';

let seed = 11;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const cnv = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });

// Lino: hilos de trama y urdimbre irregulares
export function linenTexture(rep = [1, 1]) {
  const s = 256, c = cnv(s, s), g = c.getContext('2d');
  g.fillStyle = '#cfc2a2'; g.fillRect(0, 0, s, s);
  for (let pass = 0; pass < 2; pass++) for (let i = 0; i < s; i += 2) {
    g.globalAlpha = .1 + rnd() * .22; g.fillStyle = rnd() < .5 ? '#8f7f5f' : '#efe4c8';
    pass ? g.fillRect(i, 0, 1, s) : g.fillRect(0, i, s, 1);
  }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); return t;
}
// Madera de pino para el caballete
export function woodTexture() {
  const c = cnv(64, 512), g = c.getContext('2d');
  g.fillStyle = '#a07a52'; g.fillRect(0, 0, 64, 512);
  for (let x = 0; x < 64; x++) { g.globalAlpha = .06 + rnd() * .14; g.fillStyle = rnd() < .5 ? '#6a4a2d' : '#c49a6a'; g.fillRect(x, 0, 1 + rnd() * 2, 512); }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
