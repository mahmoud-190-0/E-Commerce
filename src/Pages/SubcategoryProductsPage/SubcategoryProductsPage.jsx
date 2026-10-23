import { useEffect, useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";

import ProductsToolbar from "../../components/products/ProductsToolbar";
import ProductsGrid from "../../components/products/ProductsGrid";
import ProductsPagination from "../../components/products/ProductsPagination";
import ProductsFilters from "../../components/products/ProductsFilters";
import { getSubcategoryProducts } from "../../services/subcategoryService";
import "./SubcategoryProducts.css";

const EMPTY_FILTERS = {
  category: "",
  brand: "",
  minPrice: "",
  maxPrice: "",
  minRating: "",
  inStock: false,
};

export default function SubcategoryProducts() {
  const { subcategoryId } = useParams();

  // ---- data state ----
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ---- query state ----
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [page, setPage] = useState(1);

  // Editable draft vs. applied snapshot — only applied goes to the API.
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);

  // ---- mobile filter drawer ----
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (appliedFilters.category) n++;
    if (appliedFilters.brand) n++;
    if (appliedFilters.minPrice !== "" || appliedFilters.maxPrice !== "") n++;
    if (appliedFilters.minRating) n++;
    if (appliedFilters.inStock) n++;
    return n;
  }, [appliedFilters]);

  // ---- fetch ----
  useEffect(() => {
    if (!subcategoryId) {
      setLoading(false);
      setError("No subcategory specified.");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getSubcategoryProducts(subcategoryId, {
      keyword,
      sort,
      page,
      filters: appliedFilters,
    })
      .then((response) => {
        if (cancelled) return;

        // Backend getAll factory:
        //   { results, paginationResult, data: [...] }
        // Tolerate possible wrappers (e.g. axios .data already stripped).
        const body = response?.data ?? {};
        const list = Array.isArray(body.data) ? body.data : [];
        const pag = body.paginationResult ?? null;

        setProducts(list);
        setPagination(pag);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load products. Please try again.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [subcategoryId, keyword, sort, page, appliedFilters]);

  // ---- handlers ----
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    setPage(1);
    setFiltersOpen(false);
  };

  const handleClearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setKeyword("");
    setPage(1);
  };

  const handleKeywordChange = (value) => {
    setKeyword(value);
    setPage(1);
  };

  const handleSortChange = (value) => {
    setSort(value);
    setPage(1);
  };

  // ---- render ----
  return (
    <div className="subcategory-products">
      <header className="subcategory-products__header">
        <nav
          className="subcategory-products__breadcrumb"
          aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true"> / </span>
          <Link to="/products">Products</Link>
        </nav>
        <h1 className="subcategory-products__title">Subcategory Products</h1>
      </header>

      <main className="subcategory-products__main">
        {error && !loading && (
          <div className="products-error" role="alert">
            <p>{error}</p>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                // Force refetch by giving appliedFilters a new reference.
                setLoading(true);
                setError(null);
                setAppliedFilters({ ...appliedFilters });
              }}>
              Retry
            </button>
          </div>
        )}

        {!error && (
          <div className="products-layout">
            <ProductsFilters
              filters={filters}
              activeFilterCount={activeFilterCount}
              onFilterChange={handleFilterChange}
              onApplyFilters={handleApplyFilters}
              onClear={handleClearFilters}
              open={filtersOpen}
              onOpen={() => setFiltersOpen(true)}
              onClose={() => setFiltersOpen(false)}
            />

            <div className="products-content">
              <ProductsToolbar
                keyword={keyword}
                onKeywordChange={handleKeywordChange}
                sort={sort}
                onSortChange={handleSortChange}
                totalResults={pagination?.totalResults ?? products.length}
                loading={loading}
              />

              <ProductsGrid
                products={products}
                loading={loading}
                hasKeyword={!!keyword}
                hasFilters={activeFilterCount > 0}
                onClearFilters={handleClearFilters}
              />

              {!loading && !error && products.length > 0 && (
                <ProductsPagination
                  pagination={pagination}
                  currentPage={page}
                  onPageChange={setPage}
                />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
