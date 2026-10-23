import { Link } from "react-router-dom";

export default function ProductsHeader({ totalResults = 0 }) {
  return (
    <header className="products-header">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">Products</span>
      </nav>
      <h1 className="products-header__title">All Products</h1>
      <p className="products-header__subtitle">
        Browse our full collection of quality products.
      </p>
      {totalResults > 0 && (
        <p className="products-header__count">
          {totalResults} product{totalResults === 1 ? "" : "s"} available
        </p>
      )}
    </header>
  );
}
