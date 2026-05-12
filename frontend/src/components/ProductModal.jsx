function ProductModal({ onClose, product }) {
  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <article className="product-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <button className="icon-button close" onClick={onClose} type="button" aria-label="بستن">×</button>
        <div className="modal-image">
          {product.type === 'video' && product.video_url ? (
            <video autoPlay controls muted playsInline src={product.video_url} />
          ) : product.image_url ? (
            <img alt={product.title} src={product.image_url} />
          ) : (
            <span className="placeholder-image large">{product.title}</span>
          )}
        </div>
        <div className="modal-copy">
          <p className="eyebrow">{product.category || 'Nazari Maison'}</p>
          <h2>{product.title}</h2>
          {product.description && <p>{product.description}</p>}
          <span className={`availability ${product.availability}`}>
            {product.availability === 'sold_out' ? 'ناموجود' : 'موجود'}
          </span>
        </div>
      </article>
    </div>
  );
}

export default ProductModal;
