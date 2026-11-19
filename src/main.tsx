import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import { App } from './App';

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Elemen #root tidak ditemukan pada dokumen HTML.');
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
