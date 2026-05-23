import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/vazirmatn/400.css';
import '@fontsource/vazirmatn/500.css';
import '@fontsource/vazirmatn/600.css';
import '@fontsource/vazirmatn/700.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import App from './App.jsx';
import './styles.css';

// Matches /admin, /admin/, /admin/..., or any base-prefixed path like /nazarimaison/admin
if (/\/admin(\/|$)/.test(window.location.pathname)) {
  // Swap manifest so browsers treat the admin panel as a distinct installable PWA
  const manifestLink = document.querySelector('link[rel="manifest"]');
  if (manifestLink) {
    manifestLink.href = '/admin-manifest.webmanifest';
  } else {
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = '/admin-manifest.webmanifest';
    document.head.appendChild(link);
  }

  // iOS Add-to-Home-Screen reads these meta tags at save time
  const appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (appleTitleMeta) appleTitleMeta.content = 'Admin';

  document.title = 'Nazari Admin | مدیریت';
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
