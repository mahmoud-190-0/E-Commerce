import ProductCard from "./ProductCard";
import ProductsSkeleton from "./ProductsSkeleton";

export default function ProductsGrid({
  products,
  loading,
  hasKeyword,
  hasFilters,
  onClearFilters,
}) {
  if (loading) {
    return (
      <div className="products-grid" aria-busy="true">
        <ProductsSkeleton count={8} />
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="products-empty" role="status">
        <p>
          {hasKeyword || hasFilters
            ? "No products match your search or filters."
            : "No products available right now."}
        </p>
        {(hasKeyword || hasFilters) && (
          <button type="button" className="btn" onClick={onClearFilters}>
            Clear filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="products-grid">
      {products.map((p) => (
        <ProductCard key={p._id || p.id} product={p} />
      ))}
    </div>
  );
}
