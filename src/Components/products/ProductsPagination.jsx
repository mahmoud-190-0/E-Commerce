export default function ProductsPagination({
  pagination,
  currentPage,
  onPageChange,
}) {
  const total = pagination?.numberOfPages || 1;
  if (total <= 1) return null;

  const pages = [];
  const push = (n) => {
    if (!pages.includes(n) && n >= 1 && n <= total) pages.push(n);
  };
  push(1);
  for (let i = currentPage - 1; i <= currentPage + 1; i++) push(i);
  push(total);
  pages.sort((a, b) => a - b);

  const rendered = [];
  let prev = 0;
  for (const p of pages) {
    if (p - prev > 1) rendered.push("…");
    rendered.push(p);
    prev = p;
  }

  return (
    <nav className="pagination" aria-label="Product pagination">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Previous page">
        ‹ Prev
      </button>

      {rendered.map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="pagination__gap">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            className={p === currentPage ? "is-active" : ""}
            aria-current={p === currentPage ? "page" : undefined}
            onClick={() => onPageChange(p)}>
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= total}
        aria-label="Next page">
        Next ›
      </button>
    </nav>
  );
}
