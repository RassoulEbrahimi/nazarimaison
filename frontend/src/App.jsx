import { useEffect, useMemo, useState } from 'react';
import { fetchProducts } from './api.js';
import ProfileHeader from './components/ProfileHeader.jsx';
import Highlights from './components/Highlights.jsx';
import ProductGrid from './components/ProductGrid.jsx';
import ProductModal from './components/ProductModal.jsx';
import AdminLogin from './components/AdminLogin.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import PwaUpdatePrompt from './components/PwaUpdatePrompt.jsx';
import PullToRefresh from './components/PullToRefresh.jsx';
import { pathnameWithoutBase } from './basePath.js';

const defaultLinks = {
  bale: 'https://ble.ir/nazari_maison',
  eitaa: 'https://eitaa.com/nazari_maison',
  phone: 'tel:+989000000000',
};

const toPersianDigits = (value) => String(value).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[digit]);

function App() {
  const [products, setProducts] = useState([]);
  const [links, setLinks] = useState(defaultLinks);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('nazari-theme-mode') || 'system');
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => localStorage.getItem('nazari-new-product-notifications') === 'enabled',
  );
  const isAdmin = pathnameWithoutBase().replace(/\/+$/, '') === '/admin';

  const loadProducts = async () => {
    try {
      setError('');
      const data = await fetchProducts();
      setProducts(data.products || []);
      setLinks({ ...defaultLinks, ...(data.links || {}), bale: defaultLinks.bale });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const resolvedTheme = themeMode === 'system' ? (media.matches ? 'dark' : 'light') : themeMode;
      document.documentElement.dataset.theme = resolvedTheme;
      document.documentElement.dataset.themeMode = themeMode;
    };

    localStorage.setItem('nazari-theme-mode', themeMode);
    applyTheme();
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [themeMode]);

  const handleNotificationToggle = async () => {
    // Real push later also needs HTTPS, subscription storage, and a server that sends push messages.
    if (!notificationsEnabled && 'Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    const nextValue = !notificationsEnabled;
    setNotificationsEnabled(nextValue);
    localStorage.setItem('nazari-new-product-notifications', nextValue ? 'enabled' : 'disabled');
  };

  const stats = useMemo(() => {
    return {
      models: toPersianDigits(products.length),
      orders: '۳۸۴',
      contact: '۴۱/۵K',
    };
  }, [products.length]);

  const visibleProducts = useMemo(() => {
    if (activeTab === 'images') {
      return products.filter((product) => product.type !== 'video');
    }

    if (activeTab === 'videos') {
      return products.filter((product) => product.type === 'video');
    }

    if (activeTab === 'orders') {
      return [];
    }

    return products;
  }, [activeTab, products]);

  if (isAdmin) {
    return (
      <main className="app-shell admin-shell">
        <AdminLogin>
          {({ csrfToken, onLogout }) => (
            <AdminDashboard
              csrfToken={csrfToken}
              error={error}
              links={links}
              loading={loading}
              onDelete={loadProducts}
              onLogout={onLogout}
              onSaved={loadProducts}
              products={products}
            />
          )}
        </AdminLogin>
      </main>
    );
  }

  const isModalOpen = Boolean(selectedProduct) || settingsOpen;

  return (
    <main className="app-shell">
      <PullToRefresh modalOpen={isModalOpen} />
      <ProfileHeader stats={stats} />
      <button className="settings-fab" onClick={() => setSettingsOpen(true)} type="button" aria-label="تنظیمات">
        ⚙
      </button>
      <SettingsPanel
        notificationsEnabled={notificationsEnabled}
        onClose={() => setSettingsOpen(false)}
        onNotificationToggle={handleNotificationToggle}
        onThemeChange={setThemeMode}
        open={settingsOpen}
        themeMode={themeMode}
      />
      <Highlights products={products} />
      {error && <p className="notice">{error}</p>}
      <nav className="tabs" aria-label="دسته‌بندی مدل‌ها">
        <button className={activeTab === 'all' ? 'active' : ''} onClick={() => setActiveTab('all')} type="button">
          همه
        </button>
        <button className={activeTab === 'images' ? 'active' : ''} onClick={() => setActiveTab('images')} type="button">
          عکس‌ها
        </button>
        <button className={activeTab === 'videos' ? 'active' : ''} onClick={() => setActiveTab('videos')} type="button">
          ویدیوها
        </button>
        <button className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')} type="button">
          سفارش‌ها
        </button>
      </nav>
      {activeTab === 'orders' ? (
        <section className="orders-panel">
          <p className="eyebrow">ORDER NOTE</p>
          <h2>سفارش اختصاصی</h2>
          <p>برای هماهنگی سفارش اختصاصی، از کانال بله با مزون در ارتباط باشید.</p>
          <a className="button primary order-link" href={links.bale} rel="noreferrer" target="_blank">بله</a>
        </section>
      ) : (
        <ProductGrid loading={loading} onSelect={setSelectedProduct} products={visibleProducts} />
      )}
      {selectedProduct && (
        <ProductModal onClose={() => setSelectedProduct(null)} product={selectedProduct} />
      )}
      <PwaUpdatePrompt />
    </main>
  );
}

export default App;
