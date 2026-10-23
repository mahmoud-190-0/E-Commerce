export default function ProductsSkeleton({ count = 8 }) {
  return Array.from({ length: count }).map((_, i) => (
    <div key={i} className="product-skeleton" aria-hidden="true">
      <div className="product-skeleton__media shimmer" />
      <div className="product-skeleton__line shimmer" />
      <div className="product-skeleton__line product-skeleton__line--short shimmer" />
      <div className="product-skeleton__line product-skeleton__line--price shimmer" />
    </div>
  ));
}
