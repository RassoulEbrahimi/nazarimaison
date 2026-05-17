import { useState } from 'react';
import { deleteStory, hideStory } from '../api.js';

function StoryList({ csrfToken, stories, onEdit, onRefresh }) {
  const [busy, setBusy] = useState('');

  const toggle = async (story) => {
    setBusy(story.id);
    try {
      await hideStory(story.id, csrfToken);
      onRefresh();
    } catch (err) {
      window.alert(err.message);
    } finally {
      setBusy('');
    }
  };

  const remove = async (story) => {
    if (!window.confirm(`حذف استوری "${story.title}"؟`)) return;
    setBusy(story.id);
    try {
      await deleteStory(story.id, csrfToken);
      onRefresh();
    } catch (err) {
      window.alert(err.message);
    } finally {
      setBusy('');
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    try { return new Date(iso).toLocaleDateString('fa-IR'); } catch { return iso; }
  };

  return (
    <div className="admin-list">
      <h2>استوری‌ها ({stories.length})</h2>
      {stories.length === 0 && <p>استوری‌ای ثبت نشده است.</p>}
      {stories.map((story) => (
        <article className="admin-story" key={story.id}>
          <div className="admin-thumb">
            {story.media_url ? (
              story.type === 'video' ? (
                <video muted playsInline preload="metadata" src={story.media_url} />
              ) : (
                <img alt={story.title} loading="lazy" src={story.media_url} />
              )
            ) : (
              <span>{story.title.charAt(0)}</span>
            )}
          </div>

          <div>
            <h3>{story.title}</h3>
            <p>
              <span className={`badge ${story.status === 'hidden' ? 'badge-hidden' : 'badge-active'}`}>
                {story.status === 'hidden' ? 'مخفی' : 'فعال'}
              </span>
              {story.type === 'video' && <> <span className="badge badge-video">ویدیو</span></>}
            </p>
            {(story.starts_at || story.expires_at) && (
              <small>
                {story.starts_at ? formatDate(story.starts_at) : '—'}
                {' تا '}
                {story.expires_at ? formatDate(story.expires_at) : '—'}
              </small>
            )}
          </div>

          <div className="admin-actions">
            <button
              className="button secondary"
              disabled={busy === story.id}
              onClick={() => onEdit(story)}
              type="button"
            >
              ویرایش
            </button>
            <button
              className="button ghost"
              disabled={busy === story.id}
              onClick={() => toggle(story)}
              type="button"
            >
              {story.status === 'hidden' ? 'نمایش' : 'مخفی کردن'}
            </button>
            <button
              className="button danger"
              disabled={busy === story.id}
              onClick={() => remove(story)}
              type="button"
            >
              حذف
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

export default StoryList;
