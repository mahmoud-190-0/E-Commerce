import { useState } from "react";
import useProducts from "../../context/useProducts";
import ProductsHeader from "../../components/products/ProductsHeader";
import ProductsToolbar from "../../components/products/ProductsToolbar";
import ProductsFilters from "../../components/products/ProductsFilters";
import ProductsGrid from "../../components/products/ProductsGrid";
import ProductsPagination from "../../components/products/ProductsPagination";
import "./ProductsPage.css";

export default function ProductsPage() {
  const {
    products,
    pagination,
    totalResults,
    loading,
    error,
    filters,
    page,
    activeFilterCount,
    setPage,
    updateFilter,
    updateFilters,
    clearFilters,
    refetch,
  } = useProducts();

  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="products-page">
      <ProductsHeader totalResults={totalResults} />

      <ProductsToolbar
        keyword={filters.keyword}
        onKeywordChange={(v) => updateFilter("keyword", v)}
        sort={filters.sort}
        onSortChange={(v) => updateFilter("sort", v)}
        totalResults={totalResults}
        loading={loading}
      />

      <div className="products-page__body">
        <ProductsFilters
          filters={filters}
          activeFilterCount={activeFilterCount}
          onFilterChange={updateFilter}
          onApplyFilters={updateFilters}
          onClear={clearFilters}
          open={drawerOpen}
          onOpen={() => setDrawerOpen(true)}
          onClose={() => setDrawerOpen(false)}
        />

        <main className="products-page__main">
          {error ? (
            <div className="products-error" role="alert">
              <p>{error}</p>
              <button
                type="button"
                onClick={refetch}
                className="btn btn--primary">
                Retry
              </button>
            </div>
          ) : (
            <>
              <ProductsGrid
                products={products}
                loading={loading}
                hasKeyword={!!filters.keyword.trim()}
                hasFilters={activeFilterCount > 0}
                onClearFilters={clearFilters}
              />
              {!loading && pagination && pagination.numberOfPages > 1 && (
                <ProductsPagination
                  pagination={pagination}
                  currentPage={page}
                  onPageChange={setPage}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
