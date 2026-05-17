import { useEffect, useState } from 'react';
import { saveProduct } from '../api.js';

const emptyProduct = {
  title: '',
  description: '',
  category: '',
  type: 'image',
  availability: 'available',
  status: 'active',
  pinned: false,
  featured: false,
};

function ProductForm({ csrfToken, editing, onCancel, onSaved }) {
  const [form, setForm] = useState(emptyProduct);
  const [image, setImage] = useState(null);
  const [video, setVideo] = useState(null);
  const [poster, setPoster] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(editing ? { ...emptyProduct, ...editing } : emptyProduct);
    setImage(null);
    setVideo(null);
    setPoster(null);
    setError('');
  }, [editing]);

  const isNewProduct = !editing || editing.id?.startsWith('sample-');

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
      data.append('type', form.type);
      data.append('availability', form.availability);
      data.append('status', form.status);
      data.append('pinned', form.pinned ? '1' : '0');
      data.append('featured', form.featured ? '1' : '0');
      if (image) data.append('image', image);
      if (video) data.append('video', video);
      if (poster) data.append('poster', poster);
      await saveProduct(data);
      setForm(emptyProduct);
      setImage(null);
      setVideo(null);
      setPoster(null);
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
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </label>
        <label>
          دسته‌بندی
          <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        </label>
      </div>

      <label>
        توضیحات
        <textarea rows="4" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </label>

      <div className="form-grid">
        <label>
          نوع
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="image">تصویر</option>
            <option value="video">ویدیو</option>
          </select>
        </label>
        <label>
          وضعیت نمایش
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="active">فعال</option>
            <option value="hidden">مخفی</option>
          </select>
        </label>
      </div>

      <div className="form-grid">
        <label>
          موجودی
          <select value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })}>
            <option value="available">موجود</option>
            <option value="sold_out">ناموجود</option>
          </select>
        </label>
        <div />
      </div>

      {form.type === 'image' && (
        <label>
          تصویر مدل
          <input
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            required={isNewProduct}
            type="file"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
          />
          {editing && !isNewProduct && (
            <span className="field-hint">بدون انتخاب فایل، تصویر فعلی حفظ می‌شود.</span>
          )}
        </label>
      )}

      {form.type === 'video' && (
        <>
          <label>
            ویدیو مدل
            <input
              accept=".mp4,.webm,.mov,video/mp4,video/webm,video/quicktime"
              required={isNewProduct}
              type="file"
              onChange={(e) => setVideo(e.target.files?.[0] || null)}
            />
            {editing && !isNewProduct && (
              <span className="field-hint">بدون انتخاب فایل، ویدیو فعلی حفظ می‌شود.</span>
            )}
            <span className="field-hint">حداکثر 100MB — mp4 / webm / mov</span>
          </label>
          <label>
            پوستر (اختیاری)
            <input
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              type="file"
              onChange={(e) => setPoster(e.target.files?.[0] || null)}
            />
            <span className="field-hint">تصویر ثابت که قبل از پخش ویدیو نمایش داده می‌شود.</span>
          </label>
        </>
      )}

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <label className="checkbox-label">
          <input
            checked={Boolean(form.pinned)}
            type="checkbox"
            onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
          />
          سنجاق‌شده
        </label>
        <label className="checkbox-label">
          <input
            checked={Boolean(form.featured)}
            type="checkbox"
            onChange={(e) => setForm({ ...form, featured: e.target.checked })}
          />
          ویژه
        </label>
      </div>

      <div className="form-actions">
        <button className="button primary" disabled={saving} type="submit">
          {saving ? 'در حال ذخیره...' : 'ذخیره مدل'}
        </button>
        {editing && (
          <button className="button ghost" onClick={onCancel} type="button">انصراف</button>
        )}
      </div>
    </form>
  );
}

export default ProductForm;
