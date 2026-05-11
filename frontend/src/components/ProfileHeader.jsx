import { withBasePath } from '../basePath.js';

function ProfileHeader({ links, stats }) {
  return (
    <section className="profile" aria-label="Nazari Maison profile">
      <div className="avatar" aria-hidden="true">
        <img alt="" loading="lazy" src={withBasePath('/images/profile/Profile_Picture.png')} />
        <span>Nazari</span>
        <em>Maison</em>
      </div>
      <div className="profile-content">
        <div className="profile-topline">
          <div>
            <p className="username">nazari_maison</p>
            <h1>نظری مزون · Nazari Maison</h1>
            <p className="meta-line">ATELIER · TEHRAN · EST. ۱۳۹۸</p>
          </div>
          <a className="small-admin-link" href={withBasePath('/admin')}>مدیریت</a>
        </div>
        <p className="bio">
          طراحی و دوخت لباس زنانه، مزونی و سفارش اختصاصی.
          <br />
          به دلیل محدودیت دسترسی به اینستاگرام، مدل‌های جدید از اینجا و کانال بله قابل مشاهده است.
        </p>
        <p className="profile-links">
          <a href="https://t.me/nazari_maison" rel="noreferrer" target="_blank">t.me/nazari_maison</a>
          <span>·</span>
          <a href="https://ble.ir/nazari_maison" rel="noreferrer" target="_blank">ble.ir/nazari_maison</a>
        </p>
        <div className="stats" aria-label="آمار">
          <div>
            <strong>{stats.models}</strong>
            <span>مدل‌ها</span>
          </div>
          <div>
            <strong>{stats.orders}</strong>
            <span>سفارش‌ها</span>
          </div>
          <div>
            <strong>{stats.contact}</strong>
            <span>ارتباط</span>
          </div>
        </div>
        <div className="actions">
          <a className="button primary" href={links.bale} rel="noreferrer" target="_blank">ثبت سفارش در بله</a>
          <a className="button secondary" href={links.eitaa} rel="noreferrer" target="_blank">ایتا</a>
          <a className="button ghost" href={links.phone}>تماس</a>
        </div>
      </div>
    </section>
  );
}

export default ProfileHeader;
