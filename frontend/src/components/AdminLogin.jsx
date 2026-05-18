import { useEffect, useState } from 'react';
import { checkAuth, login, logout } from '../api.js';
import { withBasePath } from '../basePath.js';

function AdminLogin({ children }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [csrfToken, setCsrfToken] = useState('');
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAuth()
      .then((data) => {
        setLoggedIn(Boolean(data.logged_in));
        setCsrfToken(data.csrf_token || '');
      })
      .catch(() => setLoggedIn(false))
      .finally(() => setChecking(false));
  }, []);

  const onSubmit = async (event) => {
    event.preventDefault();
    try {
      setError('');
      const data = await login(form.username, form.password);
      setLoggedIn(true);
      setCsrfToken(data.csrf_token || '');
    } catch (err) {
      setError(err.message);
    }
  };

  const onLogout = async () => {
    await logout(csrfToken);
    setLoggedIn(false);
    setCsrfToken('');
  };

  if (checking) {
    return <div className="admin-card">در حال بررسی ورود...</div>;
  }

  if (loggedIn) {
    return children({ csrfToken, onLogout });
  }

  return (
    <section className="admin-card login-card">
      <a className="back-link" href={withBasePath('/')}>بازگشت به سایت</a>
      <h1>ورود مدیریت نظری مزون</h1>
      <p>برای بارگذاری پست‌های جدید وارد شوید.</p>
      {error && <p className="form-error">{error}</p>}
      <form onSubmit={onSubmit}>
        <label>
          نام کاربری
          <input autoComplete="username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
        </label>
        <label>
          رمز عبور
          <input autoComplete="current-password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        </label>
        <button className="button primary full" type="submit">ورود</button>
      </form>
    </section>
  );
}

export default AdminLogin;
