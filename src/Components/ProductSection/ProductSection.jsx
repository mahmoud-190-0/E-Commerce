import { ArrowRight } from "lucide-react";

import ProductCard from "../products/ProductCard";
import ProductsSkeleton from "../products/ProductsSkeleton";
import useProducts from "../../context/useProducts"; // adjust path to your hook
import "./ProductSection.css";
import { useNavigate } from "react-router-dom";
export default function ProductSection() {
  // Home section: newest 8 products, no filters.
  const { products, loading, error, refetch } = useProducts({
    sort: "-createdAt",
    limit: 6,
  });
  const navigate = useNavigate();

  return (
    <section className="product-section" aria-labelledby="home-products-title">
      <div className="category-header1">
        <h2 id="home-products-title" className="category-title1">
          Featured Products
        </h2>
        <p className="category-subtitle1">
          Hand-picked favorites our customers love the most.
        </p>
      </div>

      {loading && (
        <div className="products-grid" aria-busy="true">
          <ProductsSkeleton count={8} />
        </div>
      )}

      {!loading && error && (
        <div className="product-section__error" role="alert">
          <p>{error}</p>
          <button type="button" className="btn" onClick={refetch}>
            Try again
          </button>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="products-empty" role="status">
          <p>No products available right now.</p>
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <>
          <div className="products-grid">
            {products.map((p) => (
              <ProductCard key={p._id || p.id} product={p} />
            ))}
          </div>

          <div className="product-section__footer">
            <button
              className="view-all-btn1"
              onClick={() => navigate("/products")}>
              View All Products
              <ArrowRight className="arrowRight" size={18} />
            </button>
          </div>
        </>
      )}
    </section>
  );
}
