const baseUrl = new URL(import.meta.env.BASE_URL || '/', window.location.origin);
const normalizedBasePath = baseUrl.pathname.endsWith('/') ? baseUrl.pathname : `${baseUrl.pathname}/`;

export const basePath = normalizedBasePath;

export function withBasePath(path) {
  if (!path || /^(https?:|mailto:|tel:|blob:|data:)/i.test(path)) {
    return path;
  }

  if (path.startsWith('/backend/')) {
    return path;
  }

  const cleanPath = path.replace(/^\/+/, '');
  return `${basePath}${cleanPath}`.replace(/\/{2,}/g, '/');
}

export function pathnameWithoutBase(pathname = window.location.pathname) {
  if (basePath !== '/' && pathname.startsWith(basePath)) {
    return `/${pathname.slice(basePath.length)}`.replace(/\/{2,}/g, '/');
  }

  return pathname;
}
