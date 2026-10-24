import { Suspense, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, PresentationControls, useTexture } from '@react-three/drei';
import { RIG, S, ML, RM, TOUCH } from './state.js';
import { linenTexture, woodTexture } from './textures.js';

const BASE = window.ML_BASE || '../../images/';

// Barra de madera entre dos puntos (patas del caballete)
function Bar({ a, b, w = .34, mat }) {
  const [pos, quat, len] = useMemo(() => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const d = B.clone().sub(A);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
    return [A.clone().add(B).multiplyScalar(.5), q, d.length()];
  }, [a, b]);
  return <mesh position={pos} quaternion={quat} material={mat} castShadow><boxGeometry args={[w, len, w]} /></mesh>;
}

// El cuadro: frente pintado, cantos de lino
function Painting({ src, w, h, d = .25, ...props }) {
  const map = useTexture(src);
  const mats = useMemo(() => {
    map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
    const side = new THREE.MeshStandardMaterial({ map: linenTexture([2, 1]), roughness: .95 });
    const front = new THREE.MeshStandardMaterial({ map, roughness: .55 });
    const back = new THREE.MeshStandardMaterial({ map: linenTexture([3, 4]), color: '#c9b892', roughness: 1 });
    return [side, side, side, side, front, back];
  }, [map]);
  return <mesh {...props} material={mats} castShadow><boxGeometry args={[w, h, d]} /></mesh>;
}

function Easel() {
  const group = useRef();
  const wood = useMemo(() => new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: .7 }), []);
  const W = 4.8, H = 6.8, cy = 1.1;
  useFrame((state, dt) => {
    const visible = S.scene === 'hero';
    group.current.visible = visible;
    if (!visible) return;
    const cam = state.camera;
    cam.position.set(RIG.x, RIG.y, RIG.z); cam.lookAt(RIG.lx, RIG.ly, RIG.lz);
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, RIG.ry, 6, dt);
    group.current.position.x = THREE.MathUtils.damp(group.current.position.x, RIG.ex, 6, dt);
  });
  return (
    <group ref={group}>
      <PresentationControls enabled={!TOUCH && !RM} global={false} cursor snap speed={1.4} polar={[-.08, .18]} azimuth={[-.7, .7]}>
        <group rotation={[-.06, 0, 0]}>
          <Painting src={`${BASE}w/pinturas/karin_goldberg_1.webp`} w={W} h={H} position={[0, cy, .12]} />
          {/* bandeja y prensa superior */}
          <mesh position={[0, cy - H / 2 - .18, .2]} material={wood} castShadow><boxGeometry args={[6.4, .34, 1.2]} /></mesh>
          <mesh position={[0, cy + H / 2 + .22, .02]} material={wood} castShadow><boxGeometry args={[1.3, .42, .7]} /></mesh>
          {/* mástil, patas delanteras y pata trasera */}
          <Bar a={[0, -8, -.3]} b={[0, 9.4, -.3]} w={.42} mat={wood} />
          <Bar a={[-3.4, -8, .3]} b={[-.5, 8.4, -.22]} mat={wood} />
          <Bar a={[3.4, -8, .3]} b={[.5, 8.4, -.22]} mat={wood} />
          <Bar a={[0, -8, -5.4]} b={[0, 7.8, -.55]} mat={wood} />
          <Bar a={[-2.9, -5.2, .2]} b={[2.9, -5.2, .2]} w={.26} mat={wood} />
        </group>
      </PresentationControls>
      <ContactShadows position={[0, -8, 0]} opacity={.42} scale={34} blur={2.6} far={14} resolution={512} color="#3b2a1c" />
    </group>
  );
}

// Pigmento: cada partícula toma el color de un píxel de «Coti» y viaja desde una nube hasta su lugar en el cuadro
const vert = /* glsl */`
  uniform float uP; uniform float uT; uniform float uSize;
  attribute vec3 aStart; attribute vec3 aColor; attribute float aDelay;
  varying vec3 vColor; varying float vT;
  void main() {
    float t = clamp((uP * 1.35 - aDelay * .35), 0., 1.);
    t = t * t * (3. - 2. * t);
    vec3 swirl = vec3(sin(uT * .6 + aDelay * 20.), cos(uT * .5 + aDelay * 17.), sin(uT * .4 + aDelay * 9.)) * .45 * (1. - t);
    vec3 p = mix(aStart, position, t) + swirl;
    vec4 mv = modelViewMatrix * vec4(p, 1.);
    gl_PointSize = uSize * (1. + (1. - t) * 1.4) * (28. / -mv.z);
    gl_Position = projectionMatrix * mv;
    vColor = aColor; vT = t;
  }`;
const frag = /* glsl */`
  varying vec3 vColor; varying float vT;
  void main() {
    vec2 c = gl_PointCoord - .5; float d = length(c);
    if (d > .5) discard;
    gl_FragColor = vec4(vColor, mix(.55, 1., vT) * smoothstep(.5, .3, d));
    #include <colorspace_fragment>
  }`;

function Pigments() {
  const tex = useTexture(`${BASE}w/pinturas/coti_c.webp`);
  const ref = useRef(), mat = useRef();
  const geo = useMemo(() => {
    const img = tex.image, small = window.innerWidth < 700;
    const gw = small ? 130 : 190, gh = Math.round(gw * img.height / img.width);
    const c = Object.assign(document.createElement('canvas'), { width: gw, height: gh });
    const g = c.getContext('2d'); g.drawImage(img, 0, 0, gw, gh);
    const px = g.getImageData(0, 0, gw, gh).data;
    const n = gw * gh, H = 9, W = H * gw / gh;
    const pos = new Float32Array(n * 3), start = new Float32Array(n * 3), col = new Float32Array(n * 3), del = new Float32Array(n);
    const lin = v => { v /= 255; return v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
    let k = 0;
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++, k++) {
      pos[k * 3] = (x / (gw - 1) - .5) * W; pos[k * 3 + 1] = (.5 - y / (gh - 1)) * H; pos[k * 3 + 2] = 0;
      const r = 2 + Math.random() * 7, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      start[k * 3] = r * Math.sin(ph) * Math.cos(th) - 5; start[k * 3 + 1] = r * Math.cos(ph) * .6 + 1; start[k * 3 + 2] = r * Math.sin(ph) * Math.sin(th) - 6;
      const i = k * 4; col[k * 3] = lin(px[i]); col[k * 3 + 1] = lin(px[i + 1]); col[k * 3 + 2] = lin(px[i + 2]);
      del[k] = Math.random() * .6 + (y / gh) * .4;          // de arriba hacia abajo, con desorden
    }
    const b = new THREE.BufferGeometry();
    b.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    b.setAttribute('aStart', new THREE.BufferAttribute(start, 3));
    b.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    b.setAttribute('aDelay', new THREE.BufferAttribute(del, 1));
    return b;
  }, [tex]);
  const uniforms = useMemo(() => ({ uP: { value: 0 }, uT: { value: 0 }, uSize: { value: window.innerWidth < 700 ? 2.4 : 2.9 } }), []);
  useFrame((state, dt) => {
    const on = S.scene === 'pigment';
    ref.current.visible = on;
    if (!on) return;
    const target = RM ? 1 : S.pigment;
    uniforms.uP.value = THREE.MathUtils.damp(uniforms.uP.value, target, 5, dt);
    uniforms.uT.value = state.clock.elapsedTime;
    const p = uniforms.uP.value, cam = state.camera, wide = state.size.width > state.size.height;
    const dist = wide ? 15.5 : 24;
    // el cuadro termina a la izquierda en pantallas anchas (el texto queda a la derecha) y arriba en el teléfono
    cam.position.set(Math.sin((1 - p) * .9) * 7 + (wide ? 3.4 : 0) * p, 1.2 * (1 - p) + (wide ? 0 : -2.2 * p), dist + (1 - p) * 4);
    cam.lookAt(wide ? 3.4 * p : 0, wide ? 0 : -2.2 * p, 0);
  });
  return (
    <points ref={ref} geometry={geo} frustumCulled={false}>
      <shaderMaterial ref={mat} vertexShader={vert} fragmentShader={frag} uniforms={uniforms} transparent depthWrite={false} />
    </points>
  );
}

export default function Scene({ frameloop }) {
  return (
    <Canvas
      className="!fixed inset-0 !h-[100lvh] !w-full"
      frameloop={frameloop}
      dpr={[1, 1.75]}
      shadows={false}
      camera={{ fov: 35, near: .1, far: 200, position: [0, 1.2, 34] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      eventSource={document.getElementById('root')}
      eventPrefix="client"
      fallback={<img src={`${BASE}w/pinturas/karin_goldberg_1.webp`} alt="" className="fixed right-[8vw] top-[18vh] h-[64vh] w-auto" />}
    >
      <color attach="background" args={['#ebe8e1']} />
      <fog attach="fog" args={['#ebe8e1', 48, 120]} />
      <ambientLight intensity={.55} />
      <directionalLight position={[-6, 10, 12]} intensity={1.6} color="#fff3e2" />
      <Suspense fallback={null}>
        <Environment resolution={128}>
          <Lightformer form="rect" intensity={2.2} position={[-6, 6, 8]} scale={[8, 5, 1]} color="#fff6ea" />
          <Lightformer form="rect" intensity={1.2} position={[8, 2, 4]} rotation-y={-Math.PI / 3} scale={[5, 8, 1]} color="#e9eefc" />
          <Lightformer form="circle" intensity={.8} position={[0, 10, -6]} scale={4} color="#ffffff" />
        </Environment>
        <Easel />
        <Pigments />
      </Suspense>
    </Canvas>
  );
}
