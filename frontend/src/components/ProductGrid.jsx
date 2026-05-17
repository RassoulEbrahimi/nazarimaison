import { useEffect, useMemo, useState } from 'react';

const PAGE_SIZE = 18;

function ProductGrid({ loading, onSelect, products }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleProducts = useMemo(() => products.slice(0, visibleCount), [products, visibleCount]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [products]);

  if (loading) {
    return <div className="grid-state">در حال بارگذاری مدل‌ها...</div>;
  }

  if (!products.length) {
    return <div className="grid-state">هنوز مدلی ثبت نشده است.</div>;
  }

  return (
    <>
      <section className="product-grid" aria-label="مدل‌های مزون">
        {visibleProducts.map((product) => (
          <button
            aria-label={product.title}
            className="product-card"
            key={product.id}
            onClick={() => onSelect(product)}
            type="button"
          >
            {product.type === 'video' && product.video_url ? (
              product.poster ? (
                // Use pre-generated JPG poster for reliable thumbnail on iOS/Safari
                <img alt={product.title} loading="lazy" src={product.poster} />
              ) : (
                // Fallback: browser video preview (may be blank on Safari)
                <video muted playsInline preload="metadata" src={product.video_url} />
              )
            ) : product.image_url ? (
              <img alt={product.title} loading="lazy" src={product.image_url} />
            ) : (
              <span className="placeholder-image" aria-hidden="true">{product.title}</span>
            )}
            {product.video_like && <span className="reel-mark" aria-hidden="true">▶</span>}
            {product.pinned && <span className="pin-label">ویژه</span>}
            {product.availability === 'sold_out' && <span className="sold-label">ناموجود</span>}
          </button>
        ))}
      </section>
      {visibleCount < products.length && (
        <button className="load-more" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)} type="button">
          نمایش بیشتر
        </button>
      )}
    </>
  );
}

export default ProductGrid;
