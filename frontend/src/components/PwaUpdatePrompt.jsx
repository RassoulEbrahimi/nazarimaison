import { useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

function PwaUpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const updateServiceWorkerRef = useRef(null);

  useEffect(() => {
    updateServiceWorkerRef.current = registerSW({
      immediate: true,
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onRegisteredSW(_swUrl, registration) {
        registration?.update();
      },
    });
  }, []);

  if (!needRefresh) {
    return null;
  }

  return (
    <div className="update-banner" role="status">
      <span>نسخه جدید آماده است</span>
      <button className="button primary" onClick={() => updateServiceWorkerRef.current?.(true)} type="button">
        به‌روزرسانی
      </button>
    </div>
  );
}

export default PwaUpdatePrompt;
