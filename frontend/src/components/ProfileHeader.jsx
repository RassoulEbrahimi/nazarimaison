import { withBasePath } from '../basePath.js';

function ProfileHeader({ stats }) {
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
          •سفارش فقط بصورت آنلاين
          <br />
          •سفارش از طريق دايركت و كانال تلگرام
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
      </div>
    </section>
  );
}

export default ProfileHeader;
