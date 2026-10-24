import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// El núcleo compartido (visor, datos, textos base) arranca antes que React
window.ML.boot({});

// En GitHub Pages el modelo y la luz se sirven como .glb y .hdr. La vista previa de Claude no sirve esas
// extensiones, así que ahí se usa una copia con extensión aceptada (el contenido es el mismo).
async function pick(a, b) { try { const r = await fetch(a, { method: 'HEAD' }); if (r.ok) return a; } catch (e) {} return b; }
Promise.all([pick('./estudio.glb', './estudio-glb.json'), pick('./studio.hdr', './studio-hdr.json?type=.hdr')]).then(([model, hdr]) => {
  window.__ASSETS = { model, hdr };
  createRoot(document.getElementById('root')).render(<App />);
});
