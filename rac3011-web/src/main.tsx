import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './index.css';
import { App } from './App.tsx';
import { isPrerendered } from './app/prerender';

const rootEl = document.getElementById('root')!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

if (isPrerendered()) {
  hydrateRoot(rootEl, app);
} else {
  createRoot(rootEl).render(app);
}
