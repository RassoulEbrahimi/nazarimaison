const staticHighlights = [
  { label: 'تازه‌ها', mark: 'N' },
  { label: 'پاییز',   mark: 'A' },
  { label: 'مشتری‌ها', mark: 'M' },
  { label: 'سفارش',  mark: 'O' },
  { label: 'پرداخت', mark: 'P' },
];

function Highlights({ products = [], stories = [] }) {
  // If the backend has provided stories, render those instead of the static rings
  if (stories.length > 0) {
    return (
      <nav className="highlights" aria-label="هایلایت‌ها">
        {stories.slice(0, 8).map((story) => (
          <button className="highlight" key={story.id} type="button">
            <span className="highlight-ring">
              {story.media_url ? (
                story.type === 'video' ? (
                  <video aria-hidden="true" muted playsInline preload="metadata" src={story.media_url} />
                ) : (
                  <img alt="" loading="lazy" src={story.media_url} />
                )
              ) : (
                <span>{story.title.charAt(0)}</span>
              )}
            </span>
            <span>{story.title}</span>
          </button>
        ))}
      </nav>
    );
  }

  // Fallback: static rings filled with product thumbnails
  const media = products.filter((p) => p.thumbnail || p.image_url || p.video_url);
  return (
    <nav className="highlights" aria-label="هایلایت‌ها">
      {staticHighlights.map((item, index) => {
        const product = media[index % Math.max(media.length, 1)];
        const thumb   = product?.thumbnail || product?.image_url;
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
