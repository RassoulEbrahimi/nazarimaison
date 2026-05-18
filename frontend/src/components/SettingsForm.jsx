import { useEffect, useState } from 'react';
import { saveSettings } from '../api.js';

const defaults = {
  bio: '',
  bio_line2: '',
  stat_models_label: 'پست',
  stat_orders_value: '۳۸۴',
  stat_orders_label: 'سفارش',
  stat_contact_value: '۴۱/۵K',
  stat_contact_label: 'دنبال‌کننده',
  telegram_url: '',
  bale_url: '',
};

function SettingsForm({ csrfToken, settings, onSaved }) {
  const [form, setForm] = useState({ ...defaults, ...(settings || {}) });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) setForm({ ...defaults, ...settings });
  }, [settings]);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const data = new FormData();
      data.append('csrf_token', csrfToken);
      Object.entries(form).forEach(([k, v]) => {
        if (k !== 'updated_at') data.append(k, v);
      });
      await saveSettings(data);
      onSaved('تنظیمات ذخیره شد.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="admin-card product-form" onSubmit={submit}>
      <h2>تنظیمات پروفایل</h2>
      {error && <p className="form-error">{error}</p>}

      <div className="form-grid">
        <label>
          بیوگرافی (خط اول)
          <input value={form.bio} onChange={set('bio')} />
        </label>
        <label>
          بیوگرافی (خط دوم)
          <input value={form.bio_line2} onChange={set('bio_line2')} />
        </label>
      </div>

      <div className="form-grid">
        <label>
          لینک تلگرام
          <input dir="ltr" placeholder="https://t.me/..." type="url" value={form.telegram_url} onChange={set('telegram_url')} />
        </label>
        <label>
          لینک بله
          <input dir="ltr" placeholder="https://ble.ir/..." type="url" value={form.bale_url} onChange={set('bale_url')} />
        </label>
      </div>

      <fieldset style={{ border: '1px solid var(--line)', borderRadius: '8px', padding: '12px 16px', marginTop: '8px' }}>
        <legend style={{ padding: '0 6px', fontSize: '0.85rem', fontWeight: 600 }}>آمارها</legend>
        <div className="form-grid">
          <label>
            برچسب پست
            <input value={form.stat_models_label} onChange={set('stat_models_label')} />
          </label>
          <div />
        </div>
        <div className="form-grid">
          <label>
            تعداد سفارش
            <input value={form.stat_orders_value} onChange={set('stat_orders_value')} />
          </label>
          <label>
            برچسب سفارش
            <input value={form.stat_orders_label} onChange={set('stat_orders_label')} />
          </label>
        </div>
        <div className="form-grid">
          <label>
            تعداد دنبال‌کننده
            <input value={form.stat_contact_value} onChange={set('stat_contact_value')} />
          </label>
          <label>
            برچسب دنبال‌کننده
            <input value={form.stat_contact_label} onChange={set('stat_contact_label')} />
          </label>
        </div>
      </fieldset>

      <div className="form-actions">
        <button className="button primary" disabled={saving} type="submit">
          {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
        </button>
      </div>
    </form>
  );
}

export default SettingsForm;
