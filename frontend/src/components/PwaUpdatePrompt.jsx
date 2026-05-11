import { useRegisterSW } from 'virtual:pwa-register/react';

function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) {
    return null;
  }

  return (
    <div className="update-banner" role="status">
      <span>نسخه جدید آماده است</span>
      <button className="button primary" onClick={() => updateServiceWorker(true)} type="button">
        به‌روزرسانی
      </button>
    </div>
  );
}

export default PwaUpdatePrompt;
