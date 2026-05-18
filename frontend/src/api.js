import { withBasePath } from './basePath.js';

const API_BASE = import.meta.env.VITE_API_BASE || '/backend/api';
const STATIC_PRODUCTS_ONLY = !import.meta.env.VITE_API_BASE && import.meta.env.PROD && import.meta.env.BASE_URL !== '/';

const fallbackLinks = {
  bale: 'https://ble.ir/nazari_maison',
  eitaa: 'https://eitaa.com/nazari_maison',
  phone: 'tel:+989000000000',
};

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}/${path}`, {
    credentials: 'include',
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || 'درخواست با خطا روبه‌رو شد.');
  }
  return data;
}

function normalizeProduct(product) {
  const type = product.type || (product.video ? 'video' : 'image');
  const imageUrl = withBasePath(product.image_url || product.image || product.thumbnail || '');
  const videoUrl = withBasePath(product.video_url || product.video || '');
  const availability = product.availability || (product.available === false ? 'sold_out' : 'available');

  const posterUrl = product.poster ? withBasePath(product.poster) : undefined;

  return {
    ...product,
    id: String(product.id || crypto.randomUUID()),
    title: product.title || 'پست نظری مزون',
    description: product.description || 'طراحی و دوخت مزونی، مناسب سفارش اختصاصی',
    category: product.category || 'پست جدید',
    type,
    availability,
    available: availability !== 'sold_out',
    pinned: Boolean(product.pinned),
    image_url: imageUrl,
    video_url: videoUrl,
    poster: posterUrl,
    thumbnail: withBasePath(product.thumbnail || imageUrl || videoUrl),
    video_like: type === 'video' || Boolean(product.video_like),
  };
}

// Sort newest-first globally; numeric ID suffix as stable tiebreaker when created_at is equal.
function sortProducts(products) {
  return [...products].sort((a, b) => {
    const ta = new Date(a.created_at).getTime();
    const tb = new Date(b.created_at).getTime();
    if (tb !== ta) return tb - ta;
    const numA = parseInt(a.id.replace(/\D+/g, '').slice(-3), 10) || 0;
    const numB = parseInt(b.id.replace(/\D+/g, '').slice(-3), 10) || 0;
    return numB - numA;
  });
}

async function fetchStaticProducts() {
  const response = await fetch(withBasePath('/data/products.json'), { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('فهرست پست‌های محلی در دسترس نیست.');
  }

  const products = await response.json();
  return {
    ok: true,
    products: sortProducts(Array.isArray(products) ? products.map(normalizeProduct) : []),
    links: fallbackLinks,
    source: 'static',
  };
}

export async function fetchProducts() {
  if (STATIC_PRODUCTS_ONLY) {
    return fetchStaticProducts();
  }

  try {
    const data = await request('products.php');
    const products = sortProducts(Array.isArray(data.products) ? data.products.map(normalizeProduct) : []);
    if (products.length > 0) {
      return {
        ...data,
        products,
        links: data.links || fallbackLinks,
        source: 'backend',
      };
    }
  } catch (error) {
    // Local preview can run without PHP. In production the backend response still wins.
  }

  return fetchStaticProducts();
}

export function checkAuth() {
  return request('auth.php');
}

export function login(username, password) {
  const body = new FormData();
  body.append('username', username);
  body.append('password', password);
  return request('auth.php', { method: 'POST', body });
}

export function logout(csrfToken) {
  const body = new FormData();
  body.append('csrf_token', csrfToken);
  return request('logout.php', { method: 'POST', body });
}

export function saveProduct(formData) {
  return request('upload.php', { method: 'POST', body: formData });
}

export function deleteProduct(id, csrfToken) {
  const body = new FormData();
  body.append('action', 'delete');
  body.append('id', id);
  body.append('csrf_token', csrfToken);
  return request('products.php', { method: 'POST', body });
}

// Admin: all products including hidden ones — requires active session
export async function fetchAllProducts() {
  const data = await request('products.php?all=1');
  return { ...data, products: sortProducts(Array.isArray(data.products) ? data.products.map(normalizeProduct) : []) };
}

function normalizeStory(story) {
  return { ...story, media_url: withBasePath(story.media_url || '') };
}

// Public: already filtered by backend (active + within date window)
export async function fetchStories() {
  try {
    const data = await request('stories.php');
    return Array.isArray(data.stories) ? data.stories.map(normalizeStory) : [];
  } catch {
    return [];
  }
}

// Admin: all stories regardless of status or date — requires active session
export async function fetchAllStories() {
  const data = await request('stories.php?all=1');
  return Array.isArray(data.stories) ? data.stories.map(normalizeStory) : [];
}

export function saveStory(formData) {
  return request('stories.php', { method: 'POST', body: formData });
}

export function hideStory(id, csrfToken) {
  const body = new FormData();
  body.append('action', 'hide');
  body.append('id', id);
  body.append('csrf_token', csrfToken);
  return request('stories.php', { method: 'POST', body });
}

export function deleteStory(id, csrfToken) {
  const body = new FormData();
  body.append('action', 'delete');
  body.append('id', id);
  body.append('csrf_token', csrfToken);
  return request('stories.php', { method: 'POST', body });
}

// Returns null on failure — callers fall back to hardcoded defaults
export async function fetchSettings() {
  try {
    const data = await request('settings.php');
    return data.settings || null;
  } catch {
    return null;
  }
}

export function saveSettings(formData) {
  return request('settings.php', { method: 'POST', body: formData });
}

