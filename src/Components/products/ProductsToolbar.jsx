const SORT_OPTIONS = [
  { value: "-createdAt", label: "Newest" },
  { value: "price", label: "Price: Low to High" },
  { value: "-price", label: "Price: High to Low" },
  { value: "-sold", label: "Best Selling" },
  { value: "-ratingsAverage", label: "Highest Rated" },
];

export default function ProductsToolbar({
  keyword,
  onKeywordChange,
  sort,
  onSortChange,
  totalResults,
  loading,
}) {
  return (
    <div className="products-toolbar">
      <div className="products-toolbar__search">
        <input
          type="search"
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          placeholder="Search products..."
          aria-label="Search products"
        />
        {keyword && (
          <button
            type="button"
            className="products-toolbar__clear"
            onClick={() => onKeywordChange("")}
            aria-label="Clear search">
            ×
          </button>
        )}
      </div>

      <div className="products-toolbar__meta">
        <span className="products-toolbar__count" aria-live="polite">
          {loading
            ? "Searching…"
            : `${totalResults} result${totalResults === 1 ? "" : "s"}`}
        </span>
        <label className="products-toolbar__sort">
          <span className="sr-only">Sort by</span>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            aria-label="Sort products">
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
