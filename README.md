# Nazari Maison Web MVP

React/Vite public gallery for Nazari Maison with a PHP admin API for the later cPanel production host. The GitHub Pages version is static-only and uses `frontend/public/data/products.json` plus public product media.

## Local Dev

```bash
cd frontend
npm install
npm run dev
```

For local development with the PHP backend, run PHP from the project root in another terminal:

```bash
php -S localhost:8000
```

Then point Vite to the PHP API:

```powershell
cd frontend
$env:VITE_API_BASE="http://localhost:8000/backend/api"
npm run dev
```

Local dev defaults to `/`, so no base path is needed.

## GitHub Pages Staging

The workflow in `.github/workflows/deploy.yml` builds only `frontend/` and deploys only `frontend/dist` to GitHub Pages. The PHP backend is not deployed.

Default workflow base path:

```text
VITE_BASE_PATH=/nazari-maison-web/
```

If the GitHub Pages repo or project path is `/nazarimaison/`, change the workflow value to:

```text
VITE_BASE_PATH=/nazarimaison/
```

Manual staging build:

```bash
cd frontend
VITE_BASE_PATH=/nazari-maison-web/ npm run build
```

On PowerShell:

```powershell
cd frontend
$env:VITE_BASE_PATH="/nazari-maison-web/"
npm run build
```

The static fallback products remain in `frontend/public/data/products.json`. Product image and video paths under `/images/...` and `/videos/...` are adjusted to the Vite base path for GitHub Pages.

## PWA Install Testing On Android

1. Push to `main` and wait for the GitHub Pages deployment to finish.
2. Open the Pages URL in Chrome on Android.
3. Open the browser menu and choose install/add to home screen.
4. Launch Nazari from the home screen and confirm it opens standalone.

## PWA Install Testing On iPhone

1. Open the Pages URL in Safari on iPhone.
2. Tap Share.
3. Choose Add to Home Screen.
4. Launch Nazari from the home screen and confirm it opens standalone.

iOS requires Safari for Add to Home Screen behavior.

## Theme And Notifications

The app supports `روشن`, `تاریک`, and `سیستم` theme modes. The preference is stored in `localStorage`; `سیستم` follows `prefers-color-scheme`.

The setting `اعلان محصولات جدید` is a safe foundation only. Real push notifications later require:

- a service worker
- HTTPS
- user permission
- push subscription storage
- server-side push sending

The app does not request notification permission on page load. Permission is requested only after the user clicks the enable button.

## cPanel Production Deployment Later

1. Build the frontend:

```bash
cd frontend
npm run build
```

2. Upload the contents of `frontend/dist/` to the website public root, usually `public_html/`.
3. Upload the `backend/` folder into the same public root, so API paths look like `/backend/api/products.php`.
4. Make sure `backend/uploads/` and `backend/data/` are writable by PHP.
5. Visit the site root for the public gallery.
6. Visit `/admin` for product management. If the host does not route `/admin` to React, configure a rewrite to serve `index.html` for unknown routes.

Do not set `VITE_BASE_PATH` for the cPanel root deployment unless the frontend is hosted in a subdirectory.

## GitHub Pages Limitations

GitHub Pages is static hosting. It does not run PHP, sessions, SQLite, admin upload, or backend APIs. The GitHub Pages staging build is for public gallery/PWA/mobile testing only.

## Admin Login

Default MVP credentials are in:

```text
backend/api/config.php
```

Change these before publishing:

```php
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'change-this-password';
```

## Build Frontend

```bash
cd frontend
npm run build
```

The production files are created in `frontend/dist/`.

## Notes

- The public UI is RTL and Persian-first.
- No customer CSV/Excel files are used by this project.
- Do not commit `node_modules/` or `frontend/dist/`.
