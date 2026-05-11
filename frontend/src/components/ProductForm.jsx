import { useEffect, useState } from 'react';
import { saveProduct } from '../api.js';

const emptyProduct = {
  title: '',
  description: '',
  category: '',
  availability: 'available',
  pinned: false,
};

function ProductForm({ csrfToken, editing, onCancel, onSaved }) {
  const [form, setForm] = useState(emptyProduct);
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(editing || emptyProduct);
    setImage(null);
    setError('');
  }, [editing]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const data = new FormData();
      if (editing?.id && !editing.id.startsWith('sample-')) data.append('id', editing.id);
      data.append('csrf_token', csrfToken);
      data.append('title', form.title);
      data.append('description', form.description);
      data.append('category', form.category);
      data.append('availability', form.availability);
      data.append('pinned', form.pinned ? '1' : '0');
      if (image) data.append('image', image);
      await saveProduct(data);
      setForm(emptyProduct);
      setImage(null);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="admin-card product-form" onSubmit={submit}>
      <h2>{editing ? 'ویرایش مدل' : 'افزودن مدل جدید'}</h2>
      {error && <p className="form-error">{error}</p>}
      <div className="form-grid">
        <label>
          عنوان
          <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        </label>
        <label>
          دسته‌بندی
          <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
        </label>
      </div>
      <label>
        توضیحات
        <textarea rows="4" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
      </label>
      <div className="form-grid">
        <label>
          وضعیت
          <select value={form.availability} onChange={(event) => setForm({ ...form, availability: event.target.value })}>
            <option value="available">available</option>
            <option value="sold_out">sold_out</option>
          </select>
        </label>
        <label>
          تصویر مدل
          <input accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" required={!editing || editing?.id?.startsWith('sample-')} type="file" onChange={(event) => setImage(event.target.files?.[0] || null)} />
        </label>
      </div>
      <label className="checkbox-label">
        <input checked={Boolean(form.pinned)} type="checkbox" onChange={(event) => setForm({ ...form, pinned: event.target.checked })} />
        سنجاق‌شده
      </label>
      <div className="form-actions">
        <button className="button primary" disabled={saving} type="submit">{saving ? 'در حال ذخیره...' : 'ذخیره مدل'}</button>
        {editing && <button className="button ghost" onClick={onCancel} type="button">انصراف</button>}
      </div>
    </form>
  );
}

export default ProductForm;
