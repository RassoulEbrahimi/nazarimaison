const highlights = [
  { label: 'تازه‌ها', mark: 'N' },
  { label: 'پاییز', mark: 'A' },
  { label: 'مشتری‌ها', mark: 'M' },
  { label: 'سفارش', mark: 'O' },
  { label: 'پرداخت', mark: 'P' },
];

function Highlights({ products = [] }) {
  const media = products.filter((product) => product.thumbnail || product.image_url || product.video_url);

  return (
    <nav className="highlights" aria-label="هایلایت‌ها">
      {highlights.map((item, index) => {
        const product = media[index % Math.max(media.length, 1)];
        const thumb = product?.thumbnail || product?.image_url;

        return (
        <button className="highlight" key={item.label} type="button">
          <span className="highlight-ring">
            {thumb ? (
              product.type === 'video' ? (
                <video aria-hidden="true" muted playsInline preload="metadata" src={thumb} />
              ) : (
                <img alt="" loading="lazy" src={thumb} />
              )
            ) : (
              <span>{item.mark}</span>
            )}
          </span>
          <span>{item.label}</span>
        </button>
        );
      })}
    </nav>
  );
}

export default Highlights;
