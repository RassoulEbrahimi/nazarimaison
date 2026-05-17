async function handleManualRefresh() {
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) await reg.update().catch(() => null);
    }
  } catch (_) {
    // ignore
  }
  window.location.reload();
}

function SettingsPanel({ notificationsEnabled, onClose, onNotificationToggle, onThemeChange, open, themeMode }) {
  if (!open) {
    return null;
  }

  return (
    <div className="settings-backdrop" onClick={onClose} role="presentation">
      <section className="settings-panel" aria-label="تنظیمات" onClick={(event) => event.stopPropagation()}>
        <div className="settings-header">
          <div>
            <p className="eyebrow">SETTINGS</p>
            <h2>تنظیمات</h2>
          </div>
          <button className="icon-button sheet-close" onClick={onClose} type="button" aria-label="بستن">×</button>
        </div>

        <div className="theme-switcher" aria-label="انتخاب تم">
          <button className={themeMode === 'light' ? 'active' : ''} onClick={() => onThemeChange('light')} type="button">
            روشن
          </button>
          <button className={themeMode === 'dark' ? 'active' : ''} onClick={() => onThemeChange('dark')} type="button">
            تاریک
          </button>
          <button className={themeMode === 'system' ? 'active' : ''} onClick={() => onThemeChange('system')} type="button">
            سیستم
          </button>
        </div>

        <div className="notification-setting">
          <div>
            <strong>اعلان محصولات جدید</strong>
            <span>فعلا فقط ترجیح شما ذخیره می‌شود.</span>
          </div>
          <button className="button secondary" onClick={onNotificationToggle} type="button">
            {notificationsEnabled ? 'فعال' : 'فعال‌سازی'}
          </button>
        </div>

        <button className="button full" onClick={handleManualRefresh} type="button" id="settings-manual-refresh">
          ↺ تازه‌سازی
        </button>
      </section>
    </div>
  );
}

export default SettingsPanel;
