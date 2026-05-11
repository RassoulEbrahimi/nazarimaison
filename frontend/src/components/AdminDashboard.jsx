import { useState } from 'react';
import { deleteProduct } from '../api.js';
import ProductForm from './ProductForm.jsx';
import { withBasePath } from '../basePath.js';

function AdminDashboard({ csrfToken, error, loading, onDelete, onLogout, onSaved, products }) {
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');

  const remove = async (product) => {
    if (!window.confirm(`حذف ${product.title}؟`)) return;
    await deleteProduct(product.id, csrfToken);
    setMessage('محصول حذف شد.');
    onDelete();
  };

  return (
    <section className="admin-dashboard">
      <header className="admin-header">
        <div>
          <a className="back-link" href={withBasePath('/')}>مشاهده سایت</a>
          <h1>پنل مدیریت مدل‌ها</h1>
        </div>
        <button className="button ghost" onClick={onLogout} type="button">خروج</button>
      </header>
      {error && <p className="form-error">{error}</p>}
      {message && <p className="notice">{message}</p>}
      <ProductForm
        csrfToken={csrfToken}
        editing={editing}
        onCancel={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          setMessage('مدل ذخیره شد.');
          onSaved();
        }}
      />
      <div className="admin-list">
        <h2>مدل‌های فعلی</h2>
        {loading && <p>در حال بارگذاری...</p>}
        {products.map((product) => (
          <article className="admin-product" key={product.id}>
            <div className="admin-thumb">
              {product.image_url ? <img alt={product.title} loading="lazy" src={product.image_url} /> : <span>{product.title}</span>}
            </div>
            <div>
              <h3>{product.title}</h3>
              <p>{product.category || 'بدون دسته‌بندی'} · {product.availability === 'sold_out' ? 'ناموجود' : 'موجود'}</p>
              <small>{new Date(product.created_at).toLocaleDateString('fa-IR')}</small>
            </div>
            <div className="admin-actions">
              <button className="button secondary" onClick={() => setEditing(product)} type="button">ویرایش</button>
              {!product.id.startsWith('sample-') && (
                <button className="button danger" onClick={() => remove(product)} type="button">حذف</button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default AdminDashboard;
