import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
window.ML.boot({});
// En GitHub Pages el modelo y la luz se sirven como .glb y .hdr. La vista previa de Claude no sirve esos
// archivos binarios, así que ahí se leen de una copia en base64 (.txt) y se convierten en un Blob local.
async function pick(url, txt, type) {
  try { const r = await fetch(url, { method: 'HEAD' }); if (r.ok) return url; } catch (e) {}
  try {
    const b64 = (await (await fetch(txt)).text()).trim();
    const bin = atob(b64), buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    return URL.createObjectURL(new Blob([buf], { type })) + '#.' + url.split('.').pop();   // la extensión va en el fragmento para que drei elija el lector
  } catch (e) { return url; }
}
Promise.all([pick('./estudio.glb', './estudio-glb.txt', 'model/gltf-binary'), pick('./studio.hdr', './studio-hdr.txt', 'image/vnd.radiance')]).then(([model, hdr]) => {
  window.__ASSETS = { model, hdr };
  createRoot(document.getElementById('root')).render(<App />);
});
