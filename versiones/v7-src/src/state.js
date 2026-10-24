// Estado mutable que GSAP escribe con el scroll y el 3D lee en cada cuadro (scroll → progreso → cámara).
export const RIG = { x: 0, y: 1.2, z: 34, lx: 0, ly: .4, lz: 0, ry: -.5, ex: 4.4 };
export const S = { scene: 'hero', pigment: 0 };
export const ML = window.ML;
export const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const TOUCH = window.matchMedia('(hover: none)').matches;
