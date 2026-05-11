function SettingsPanel({ notificationsEnabled, onNotificationToggle, onThemeChange, themeMode }) {
  return (
    <section className="settings-panel" aria-label="تنظیمات">
      <div>
        <p className="eyebrow">SETTINGS</p>
        <h2>تنظیمات نمایش</h2>
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
    </section>
  );
}

export default SettingsPanel;
