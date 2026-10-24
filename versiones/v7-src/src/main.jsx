import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// El núcleo compartido (visor, datos, textos base) arranca antes que React
window.ML.boot({});
createRoot(document.getElementById('root')).render(<App />);
