import { useEffect, useState } from 'react';
import { saveStory } from '../api.js';

const emptyStory = {
  title: '',
  status: 'active',
  starts_at: '',
  expires_at: '',
};

function toLocalInput(iso) {
  if (!iso) return '';
  try { return new Date(iso).toISOString().slice(0, 16); } catch { return ''; }
}

function fromLocalInput(local) {
  if (!local) return '';
  try { return new Date(local).toISOString(); } catch { return ''; }
}

function StoryForm({ csrfToken, editing, onCancel, onSaved }) {
  const [form, setForm] = useState(emptyStory);
  const [media, setMedia] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title || '',
        status: editing.status || 'active',
        starts_at: toLocalInput(editing.starts_at),
        expires_at: toLocalInput(editing.expires_at),
      });
    } else {
      setForm(emptyStory);
    }
    setMedia(null);
    setError('');
  }, [editing]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const data = new FormData();
      data.append('action', editing ? 'update' : 'create');
      if (editing?.id) data.append('id', editing.id);
      data.append('csrf_token', csrfToken);
      data.append('title', form.title);
      data.append('status', form.status);
      data.append('starts_at', fromLocalInput(form.starts_at));
      data.append('expires_at', fromLocalInput(form.expires_at));
      if (media) data.append('media', media);
      await saveStory(data);
      setForm(emptyStory);
      setMedia(null);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="admin-card product-form" onSubmit={submit}>
      <h2>{editing ? 'ویرایش استوری' : 'افزودن استوری'}</h2>
      {error && <p className="form-error">{error}</p>}

      <label>
        عنوان
        <input
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </label>

      <label>
        فایل رسانه
        <input
          accept=".jpg,.jpeg,.png,.webp,.mp4,.webm,.mov,image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
          required={!editing}
          type="file"
          onChange={(e) => setMedia(e.target.files?.[0] || null)}
        />
        {editing?.media_url && !media && (
          <span className="field-hint">فایل فعلی حفظ می‌شود مگر فایل جدید انتخاب شود.</span>
        )}
        <span className="field-hint">تصویر: jpg/png/webp تا 5MB — ویدیو: mp4/webm/mov تا 100MB</span>
      </label>

      <div className="form-grid">
        <label>
          تاریخ شروع
          <input
            type="datetime-local"
            value={form.starts_at}
            onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
          />
        </label>
        <label>
          تاریخ پایان
          <input
            type="datetime-local"
            value={form.expires_at}
            onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
          />
        </label>
      </div>

      <label>
        وضعیت
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          <option value="active">فعال</option>
          <option value="hidden">مخفی</option>
        </select>
      </label>

      <div className="form-actions">
        <button className="button primary" disabled={saving} type="submit">
          {saving ? 'در حال ذخیره...' : 'ذخیره استوری'}
        </button>
        {editing && (
          <button className="button ghost" onClick={onCancel} type="button">انصراف</button>
        )}
      </div>
    </form>
  );
}

export default StoryForm;
