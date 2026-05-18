import { withBasePath } from '../basePath.js';

function ProfileHeader({ settings, stats }) {
  const bioLine1    = settings?.bio           || '•سفارش فقط بصورت آنلاين';
  const bioLine2    = settings?.bio_line2     || '•سفارش از طريق دايركت و كانال تلگرام';
  const telegramUrl = settings?.telegram_url  || 'https://t.me/nazari_maison';
  const baleUrl     = settings?.bale_url      || 'https://ble.ir/nazari_maison';

  const telegramDisplay = telegramUrl.replace(/^https?:\/\//, '');
  const baleDisplay     = baleUrl.replace(/^https?:\/\//, '');

  return (
    <section className="profile" aria-label="Nazari Maison profile">
      <div className="avatar" aria-hidden="true">
        <img alt="" loading="lazy" src={withBasePath('/images/profile/Profile_Picture.jpg')} />
        <span>Nazari</span>
        <em>Maison</em>
      </div>
      <div className="profile-content">
        <div className="profile-topline">
          <div>
            <h1>Nazari Maison · نظری مزون</h1>
            <p className="meta-line">Made with love</p>
          </div>
        </div>
        <p className="bio">
          {bioLine1}
          <br />
          {bioLine2}
        </p>
        <p className="profile-links">
          <a href={telegramUrl} rel="noreferrer" target="_blank">{telegramDisplay}</a>
          <span>·</span>
          <a href={baleUrl} rel="noreferrer" target="_blank">{baleDisplay}</a>
        </p>
        <div className="stats" aria-label="آمار">
          <div>
            <strong>{stats.models}</strong>
            <span>{stats.modelsLabel || 'پست‌ها'}</span>
          </div>
          <div>
            <strong>{stats.orders}</strong>
            <span>{stats.ordersLabel || 'سفارش‌ها'}</span>
          </div>
          <div>
            <strong>{stats.contact}</strong>
            <span>{stats.contactLabel || 'ارتباط'}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProfileHeader;
