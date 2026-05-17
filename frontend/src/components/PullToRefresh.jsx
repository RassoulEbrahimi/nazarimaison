import { useCallback, useEffect, useRef, useState } from 'react';

const THRESHOLD = 80; // px needed to trigger refresh
const MAX_PULL = 120; // maximum visual pull distance

/**
 * PullToRefresh — native-feel pull-to-refresh for iOS PWA.
 *
 * Strategy:
 *  - Listens to touchstart / touchmove / touchend on the document.
 *  - Only activates when window.scrollY === 0 and no modal is open.
 *  - Tracks vertical delta and shows an indicator strip at the top.
 *  - On release past THRESHOLD: updates SW registration then reloads.
 *  - Never calls preventDefault on touchmove (keeps normal scroll alive).
 *    We only show the visual indicator; the page scroll itself is handled
 *    by the browser normally.
 *
 * Props:
 *  modalOpen {boolean} — pass true while any modal/sheet is open.
 */
function PullToRefresh({ modalOpen = false }) {
  const [pullY, setPullY] = useState(0);   // 0‒MAX_PULL visual distance
  const [phase, setPhase] = useState('idle'); // idle | pulling | ready | loading

  const touchStartY = useRef(0);
  const active = useRef(false);   // whether this touch sequence is ours

  const startRefresh = useCallback(async () => {
    setPhase('loading');
    setPullY(0);
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.update().catch(() => null);
        }
      }
    } catch (_) {
      // ignore
    }
    window.location.reload();
  }, []);

  useEffect(() => {
    const onTouchStart = (e) => {
      active.current = false;
      if (modalOpen) return;
      if (window.scrollY > 0) return;
      // Only single-finger touches
      if (e.touches.length !== 1) return;
      touchStartY.current = e.touches[0].clientY;
      active.current = true;
    };

    const onTouchMove = (e) => {
      if (!active.current) return;
      const dy = e.touches[0].clientY - touchStartY.current;
      if (dy <= 0) {
        // Scrolling up — deactivate so we don't interfere
        active.current = false;
        setPullY(0);
        setPhase('idle');
        return;
      }
      // Show indicator with rubber-band easing
      const clamped = Math.min(dy * 0.55, MAX_PULL);
      setPullY(clamped);
      setPhase(clamped >= THRESHOLD * 0.55 ? (dy >= THRESHOLD ? 'ready' : 'pulling') : 'idle');
    };

    const onTouchEnd = () => {
      if (!active.current) return;
      active.current = false;
      if (phase === 'ready') {
        startRefresh();
      } else {
        setPullY(0);
        setPhase('idle');
      }
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [modalOpen, phase, startRefresh]);

  // Nothing visible when idle and no pull
  if (phase === 'idle' && pullY === 0) return null;

  const label =
    phase === 'loading'
      ? 'در حال تازه‌سازی...'
      : phase === 'ready'
      ? 'برای تازه‌سازی رها کنید'
      : 'برای تازه‌سازی پایین بکشید';

  return (
    <div
      className="ptr-indicator"
      style={{ '--ptr-y': `${pullY}px` }}
      aria-live="polite"
      aria-atomic="true"
    >
      <span className={`ptr-spinner${phase === 'loading' ? ' ptr-spin' : ''}`} aria-hidden="true">
        {phase === 'loading' ? '⟳' : '↓'}
      </span>
      <span className="ptr-label">{label}</span>
    </div>
  );
}

export default PullToRefresh;
