import { useEffect } from 'react';
import { createPortal } from 'react-dom';

function MediaViewer({ onClose, product }) {
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  return createPortal(
    <div className="media-viewer-backdrop" onClick={onClose} role="presentation">
      <div
        aria-label={product.title}
        aria-modal="true"
        className="media-viewer-inner"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <button
          aria-label="بستن"
          autoFocus
          className="media-viewer-close"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
        {product.type === 'video' && product.video_url ? (
          <video autoPlay controls muted playsInline src={product.video_url} />
        ) : product.image_url ? (
          <img alt={product.title} src={product.image_url} />
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

export default MediaViewer;
