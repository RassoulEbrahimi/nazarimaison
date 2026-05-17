import { useEffect, useState } from 'react';
import { deleteProduct, fetchAllProducts, fetchAllStories, fetchSettings } from '../api.js';
import ProductForm from './ProductForm.jsx';
import StoryForm from './StoryForm.jsx';
import StoryList from './StoryList.jsx';
import SettingsForm from './SettingsForm.jsx';
import { withBasePath } from '../basePath.js';

function AdminDashboard({ csrfToken, onLogout }) {
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [stories, setStories] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingStory, setEditingStory] = useState(null);

  const reload = async () => {
    setError('');
    try {
      const [prodData, storiesData, settingsData] = await Promise.all([
        fetchAllProducts(),
        fetchAllStories(),
        fetchSettings(),
      ]);
      setProducts(Array.isArray(prodData.products) ? prodData.products : []);
      setStories(Array.isArray(storiesData) ? storiesData : []);
      setSettings(settingsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const removeProduct = async (product) => {
    if (!window.confirm(`حذف "${product.title}"؟`)) return;
    try {
      await deleteProduct(product.id, csrfToken);
      setMessage('محصول حذف شد.');
      reload();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-start">
          <div className="admin-avatar">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-3.9 3.6-7 8-7s8 3.1 8 7" />
            </svg>
          </div>
          <h1>پنل مدیریت مزون نظری</h1>
        </div>
        <div className="admin-header-end">
          <a className="back-link" href={withBasePath('/')}>مشاهده سایت</a>
          <button className="button ghost" onClick={onLogout} type="button">خروج</button>
        </div>
      </header>

      {error   && <p className="form-error">{error}</p>}
      {message && <p className="notice">{message}</p>}

      <nav className="tabs admin-tabs" aria-label="بخش‌های مدیریت">
        <button className={tab === 'products' ? 'active' : ''} onClick={() => { setTab('products'); setMessage(''); }} type="button">
          پست‌ها
        </button>
        <button className={tab === 'stories' ? 'active' : ''} onClick={() => { setTab('stories'); setMessage(''); }} type="button">
          استوری‌ها
        </button>
        <button className={tab === 'settings' ? 'active' : ''} onClick={() => { setTab('settings'); setMessage(''); }} type="button">
          تنظیمات پروفایل
        </button>
      </nav>

      {/* ── Products tab ─────────────────────────────────────────── */}
      {tab === 'products' && (
        <div className="admin-panel-body">
          <ProductForm
            csrfToken={csrfToken}
            editing={editingProduct}
            onCancel={() => setEditingProduct(null)}
            onSaved={() => {
              setEditingProduct(null);
              setMessage('مدل ذخیره شد.');
              reload();
            }}
          />
          <div className="admin-list">
            <h2>مدل‌های فعلی ({products.length})</h2>
            {loading && <p>در حال بارگذاری...</p>}
            {products.map((product) => (
              <article className="admin-product" key={product.id}>
                <div className="admin-thumb">
                  {product.image_url ? (
                    <img alt={product.title} loading="lazy" src={product.image_url} />
                  ) : product.poster ? (
                    <img alt={product.title} loading="lazy" src={product.poster} />
                  ) : product.video_url ? (
                    <video muted playsInline preload="metadata" src={product.video_url} />
                  ) : (
                    <span>{product.title.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <h3>{product.title}</h3>
                  <p>
                    {product.category || 'بدون دسته‌بندی'}
                    {' · '}
                    {product.availability === 'sold_out' ? 'ناموجود' : 'موجود'}
                  </p>
                  <p>
                    <span className={`badge ${product.status === 'hidden' ? 'badge-hidden' : 'badge-active'}`}>
                      {product.status === 'hidden' ? 'مخفی' : 'فعال'}
                    </span>
                    {product.type === 'video' && (
                      <> <span className="badge badge-video">ویدیو</span></>
                    )}
                  </p>
                  <small>{new Date(product.created_at).toLocaleDateString('fa-IR')}</small>
                </div>
                <div className="admin-actions">
                  <button
                    className="button secondary"
                    onClick={() => setEditingProduct(product)}
                    type="button"
                  >
                    ویرایش
                  </button>
                  {!product.id.startsWith('sample-') && (
                    <button
                      className="button danger"
                      onClick={() => removeProduct(product)}
                      type="button"
                    >
                      حذف
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* ── Stories tab ──────────────────────────────────────────── */}
      {tab === 'stories' && (
        <div className="admin-panel-body">
          <StoryForm
            csrfToken={csrfToken}
            editing={editingStory}
            onCancel={() => setEditingStory(null)}
            onSaved={() => {
              setEditingStory(null);
              setMessage('استوری ذخیره شد.');
              reload();
            }}
          />
          <StoryList
            csrfToken={csrfToken}
            stories={stories}
            onEdit={(story) => { setEditingStory(story); setMessage(''); }}
            onRefresh={() => { setMessage(''); reload(); }}
          />
        </div>
      )}

      {/* ── Settings tab ─────────────────────────────────────────── */}
      {tab === 'settings' && (
        <div className="admin-panel-body">
          <SettingsForm
            csrfToken={csrfToken}
            settings={settings}
            onSaved={(msg) => {
              setMessage(msg || 'تنظیمات ذخیره شد.');
              reload();
            }}
          />
        </div>
      )}
    </section>
  );
}

export default AdminDashboard;
